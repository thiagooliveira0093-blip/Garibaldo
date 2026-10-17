import { GAME_W, GAME_H, HALL, PICKUPS, xpNeeded } from '../config.js';
import { ITEM } from '../assets.js';
import { PASSIVES, rollCards } from '../upgrades.js';
import Controls from '../systems/controls.js';
import Effects from '../systems/effects.js';
import Darkness from '../systems/light.js';
import WeaponSystem from '../systems/weapon-system.js';
import Spawner from '../systems/spawner.js';
import { buildHall } from '../systems/hall-map.js';
import { recordRun } from '../systems/save.js';
import { sfx, toggleMute } from '../systems/sfx.js';
import Hero from '../entities/Hero.js';
import Enemy from '../entities/Enemy.js';

const CELL = 80;   // tamanho da célula da grade espacial (busca rápida de inimigos próximos)

// O salão: o herói sobrevive a hordas crescentes até o chefe. Armas automáticas, XP, melhorias a cada nível.
export default class HallScene extends Phaser.Scene {
  constructor() { super('Hall'); }

  init() {
    this.ready = false;
    this.weaponId = this.registry.get('weapon') || 'sword';
  }

  create() {
    this.controls = new Controls(this);
    this.fx = new Effects(this);
    const start = { x: HALL.w / 2, y: HALL.h / 2 };
    const hall = buildHall(this, start);
    this.obstacles = hall.obstacles;
    this.hero = new Hero(this, start.x, start.y, this.weaponId);
    this.weaponSystem = new WeaponSystem(this);
    this.spawner = new Spawner(this);
    this.shadowGfx = this.add.graphics().setDepth(3);
    this.darkness = new Darkness(this, hall.lights);
    Object.assign(this, {
      enemies: [], heroShots: [], enemyShots: [], pickups: [], grid: new Map(),
      time: 0, state: 'play', paused: false, boss: null, cards: null, pendingLevels: 0,
      bannerText: '', bannerT: 0, endT: 0, numbers: 0, result: null,
    });
    const cam = this.cameras.main;
    cam.setBounds(0, 0, HALL.w, HALL.h);
    cam.startFollow(this.hero.sprite, true, 0.12, 0.12);
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.banner('SOBREVIVA AO SALÃO', 2.5);
    this.ready = true;
  }

  banner(text, t = 2) { this.bannerText = text; this.bannerT = t; }

  // ======================================================== LOOP
  update(time, delta) {
    if (!this.ready) return;
    const c = this.controls;
    c.poll();
    if (c.just('mute')) toggleMute();
    const real = Math.min(delta / 1000, 1 / 30);
    this.bannerT -= real;
    this.numbers = 0;

    if (this.state === 'dead' || this.state === 'win') {                  // fim da partida
      if (c.just('restart')) { this.scene.restart(); return; }
      if (c.just('switch')) { this.scene.stop('UI'); this.scene.start('Select'); return; }
    }
    if (this.cards) {                                                       // escolhendo melhoria: o jogo congela
      if (c.just('pick1')) this.chooseCard(0); else if (c.just('pick2')) this.chooseCard(1); else if (c.just('pick3')) this.chooseCard(2);
      this.renderLight(real);
      return;
    }
    if (this.state === 'play' && c.just('pause')) this.paused = !this.paused;
    if (this.paused) { this.renderLight(real); return; }

    const dt = real;
    if (this.state === 'play' || this.state === 'winning') this.hero.update(dt, c);
    if (this.state === 'play') {
      this.time += dt;
      this.spawner.update(dt);
      this.rebuildGrid();
      for (const e of this.enemies) e.update(dt);
      this.separate(dt);
      this.weaponSystem.update(dt);
      this.updateShots(dt);
      this.updatePickups(dt);
      this.enemies = this.enemies.filter(e => !e.dead);
      if (this.pendingLevels > 0 && this.state === 'play') this.openLevelUp();
    } else if (this.state === 'winning') {
      this.endT -= dt;
      if (Math.random() < 0.3) this.fx.explosion(this.hero.x + Phaser.Math.Between(-200, 200), this.hero.y + Phaser.Math.Between(-140, 140), Phaser.Math.FloatBetween(0.6, 1.5));
      this.updatePickups(dt);
      if (this.endT <= 0) this.state = 'win';
    } else {
      this.updatePickups(dt);
    }
    this.drawShadows();
    this.renderLight(dt);
  }

  renderLight(dt) {
    const cam = this.cameras.main, h = this.hero;
    this.darkness.render(dt, cam, h.x - cam.scrollX, h.y - 22 - cam.scrollY);
  }

  // ======================================================== MOVIMENTO E BUSCA
  // Move uma entidade (herói ou inimigo) respeitando as paredes do salão e os obstáculos (pilares, urnas, túmulos).
  moveEntity(e, dx, dy, fly = false) {
    const { w, h, wall } = HALL, r = e.radius;
    let x = Phaser.Math.Clamp(e.x + dx, wall + r, w - wall - r), y = Phaser.Math.Clamp(e.y + dy, wall + r, h - wall - r);
    if (!fly) {
      for (const o of this.obstacles) {
        const ox = x - o.x, oy = y - o.y, min = r * 0.7 + o.r, d2 = ox * ox + oy * oy;
        if (d2 < min * min) { const d = Math.sqrt(d2) || 1; x = o.x + (ox / d) * min; y = o.y + (oy / d) * min; }
      }
    }
    e.x = x; e.y = y;
  }

  rebuildGrid() {
    this.grid.clear();
    for (const e of this.enemies) {
      const key = Math.floor(e.x / CELL) * 1000 + Math.floor(e.y / CELL);
      const cell = this.grid.get(key);
      if (cell) cell.push(e); else this.grid.set(key, [e]);
    }
  }

  // inimigos vivos cujo círculo toca o círculo (x, y, r)
  nearEnemies(x, y, r) {
    const out = [], c0 = Math.floor((x - r - 48) / CELL), c1 = Math.floor((x + r + 48) / CELL), r0 = Math.floor((y - r - 48) / CELL), r1 = Math.floor((y + r + 48) / CELL);
    for (let cx = c0; cx <= c1; cx++) for (let cy = r0; cy <= r1; cy++) {
      const cell = this.grid.get(cx * 1000 + cy);
      if (!cell) continue;
      for (const e of cell) if (!e.dead && Math.hypot(e.x - x, e.y - y) <= r + e.radius) out.push(e);
    }
    return out;
  }

  nearestEnemy(x, y, maxDist) {
    let best = null, bd = maxDist * maxDist;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // inimigos não se empilham: empurram uns aos outros
  separate(dt) {
    for (const e of this.enemies) {
      if (e.dead || e.def.kind === 'boss') continue;
      let px = 0, py = 0, n = 0;
      for (const o of this.nearEnemies(e.x, e.y, e.radius * 0.6)) {
        if (o === e) continue;
        const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy) || 0.01, min = (e.radius + o.radius) * 0.85;
        if (d < min) { const f = (min - d) / min; px += (dx / d) * f; py += (dy / d) * f; if (++n > 5) break; }
      }
      if (n) this.moveEntity(e, px * 70 * dt, py * 70 * dt, e.def.fly);
    }
  }

  drawShadows() {
    const g = this.shadowGfx, cam = this.cameras.main, v = cam.worldView, m = 80;
    g.clear().fillStyle(0x000000, 0.4);
    const h = this.hero;
    if (h.alive) g.fillEllipse(h.x, h.y, 34, 11);
    for (const e of this.enemies) {
      if (e.def.fly || e.x < v.x - m || e.x > v.right + m || e.y < v.y - m || e.y > v.bottom + m) continue;
      g.fillEllipse(e.x, e.y, e.radius * 2.3, e.radius * 0.8);
    }
  }

  // ======================================================== INIMIGOS
  spawnEnemy(type, x, y, o = {}) {
    const e = new Enemy(this, type, x, y, o);
    this.enemies.push(e);
    return e;
  }

  // Dano num inimigo. Os elementos do herói (fogo, gelo, raio) valem para toda arma.
  // o: knock (empurrão), angle, raw (dano já final), silent (sem número), noElement
  hurtEnemy(e, dmg, o = {}) {
    if (e.dead) return;
    const h = this.hero;
    if (!o.raw) dmg *= h.dmgMul;
    e.hp -= dmg; e.flashT = 0.07;
    if (!o.silent && this.numbers < 8) { this.numbers++; this.fx.damageNumber(e.x, e.y - 34 * e.scale, dmg, false); }
    if (o.knock) { const k = o.knock * (1 - (e.def.knockResist || 0)); e.kx += Math.cos(o.angle) * k; e.ky += Math.sin(o.angle) * k; }
    if (!o.noElement) {
      if (h.ice) e.slowT = 1.1 + 0.5 * h.ice;
      if (h.fire) { e.burnT = 2.4 + 0.4 * h.fire; e.burnDps = Math.max(e.burnDps, dmg * 0.35 * h.fire); }
      if (h.bolt) this.chain(e, dmg * 0.35 * h.bolt);
    }
    if (e.hp <= 0) this.killEnemy(e);
  }

  // raio: o dano salta para o inimigo mais próximo
  chain(from, dmg) {
    let best = null, bd = 150 * 150;
    for (const e of this.enemies) {
      if (e.dead || e === from) continue;
      const d = (e.x - from.x) ** 2 + (e.y - from.y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) return;
    this.fx.lightning(from.x, from.y - 24, best.x, best.y - 24, 0xf6f35a);
    this.hurtEnemy(best, dmg, { raw: true, noElement: true, silent: true });
  }

  killEnemy(e) {
    e.dead = true;
    const d = e.def, h = this.hero;
    h.kills++;
    this.fx.burst(e.x, e.y - 14, d.kind === 'boss' ? 0xff5a3a : 0xa8c28c, d.kind === 'boss' ? 30 : 5, 170, 120, 350, d.kind === 'boss');
    if (d.kind === 'boss') { this.fx.explosion(e.x, e.y - 40, 2.4); this.fx.shake(16); this.victory(); }
    else if (e.def.radius >= 20) this.fx.explosion(e.x, e.y - 14, 0.9);
    this.dropGem(e.x, e.y, d.xp * (e.elite ? 4 : 1));
    if (Math.random() < PICKUPS.coinChance || e.elite) this.dropItem('coin', e.x + Phaser.Math.Between(-10, 10), e.y);
    if (Math.random() < PICKUPS.potionChance || (e.elite && Math.random() < 0.5)) this.dropItem('potion', e.x, e.y);
    e.destroy();
  }

  // ======================================================== PROJÉTEIS
  // Tiro do herói: { x, y, angle, speed, dmg, pierce (acertos extras), life, frame, scale, tint }
  shootHero(o) {
    const sp = this.add.sprite(o.x, o.y, 'items', o.frame).setRotation(o.angle).setScale(o.scale || 1).setDepth(2900);
    if (o.tint) sp.setTint(o.tint).setBlendMode('ADD');
    this.heroShots.push({ sp, x: o.x, y: o.y, vx: Math.cos(o.angle) * o.speed, vy: Math.sin(o.angle) * o.speed, dmg: o.dmg, pierce: o.pierce, life: o.life, hit: new Set(), angle: o.angle, r: 8 * (o.scale || 1) });
  }

  fireEnemyShot(x, y, angle, speed, dmg, kind) {
    const orb = kind === 'orb';
    const sp = this.add.sprite(x, y, 'items', orb ? ITEM.enemyOrb : ITEM.enemyArrow).setRotation(orb ? 0 : angle).setDepth(2900);
    if (orb) sp.setBlendMode('ADD');
    this.enemyShots.push({ sp, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, dmg, life: 6, r: orb ? 9 : 6 });
    sfx('enemy');
  }

  updateShots(dt) {
    const { w, h, wall } = HALL;
    for (const s of this.heroShots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      s.sp.setPosition(s.x, s.y);
      if (s.life <= 0 || s.x < wall || s.x > w - wall || s.y < wall || s.y > h - wall) { s.dead = true; continue; }
      for (const e of this.nearEnemies(s.x, s.y, s.r)) {
        if (s.hit.has(e)) continue;
        s.hit.add(e);
        this.hurtEnemy(e, s.dmg, { knock: 90, angle: s.angle });
        if (s.pierce <= 0) { s.dead = true; break; }
        s.pierce--;
      }
    }
    const hero = this.hero;
    for (const s of this.enemyShots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      s.sp.setPosition(s.x, s.y);
      if (s.life <= 0 || s.x < wall || s.x > w - wall || s.y < wall || s.y > h - wall) { s.dead = true; continue; }
      if (hero.alive && Math.hypot(s.x - hero.x, s.y - (hero.y - 22)) < s.r + hero.radius) {
        if (hero.hurt(s.dmg * (1 + this.time / 420))) { s.dead = true; this.fx.burst(s.x, s.y, 0xc04bff, 6, 160, 0, 300); }
      }
    }
    for (const list of [this.heroShots, this.enemyShots]) {
      for (const s of list) if (s.dead) s.sp.destroy();
    }
    this.heroShots = this.heroShots.filter(s => !s.dead);
    this.enemyShots = this.enemyShots.filter(s => !s.dead);
  }

  // ======================================================== COLETÁVEIS
  dropGem(x, y, value) {
    const f = value >= 8 ? ITEM.gemL : value >= 3 ? ITEM.gemM : ITEM.gemS;
    const sp = this.add.sprite(x, y - 6, 'items', f).setDepth(2);
    this.pickups.push({ sp, x, y, kind: 'xp', value, v: 0, pulled: false });
    // gemas demais atrapalham: as mais antigas viram XP na hora
    const xp = this.pickups.filter(p => p.kind === 'xp');
    if (xp.length > PICKUPS.gemMerge) for (const p of xp.slice(0, xp.length - PICKUPS.gemMerge)) { this.addXp(p.value); p.sp.destroy(); p.gone = true; }
  }

  dropItem(kind, x, y) {
    const sp = this.add.sprite(x, y - 6, 'items', kind === 'coin' ? ITEM.coin : ITEM.potion).setDepth(2);
    if (kind === 'coin') sp.play('coin');
    this.pickups.push({ sp, x, y, kind, value: PICKUPS.coinValue, v: 0, pulled: false });
  }

  updatePickups(dt) {
    const h = this.hero, R = h.pickupRadius;
    for (const p of this.pickups) {
      if (p.gone) continue;
      const dx = h.x - p.x, dy = (h.y - 12) - p.y, d = Math.hypot(dx, dy) || 1;
      if (h.alive && (d < R || p.pulled)) {
        p.pulled = true;
        p.v = Math.min(640, p.v + 1100 * dt);
        p.x += (dx / d) * p.v * dt; p.y += (dy / d) * p.v * dt;
        if (d < 14) this.collect(p);
      }
      p.sp.setPosition(p.x, p.y - 6 + (p.pulled ? 0 : Math.sin(this.time * 4 + p.x) * 1.5));
    }
    this.pickups = this.pickups.filter(p => { if (p.gone) { return false; } return true; });
  }

  collect(p) {
    const h = this.hero;
    p.gone = true; p.sp.destroy();
    if (p.kind === 'xp') { this.addXp(p.value); sfx('xp'); }
    else if (p.kind === 'coin') { h.gold += p.value; sfx('coin'); }
    else { h.hp = Math.min(h.maxHp, h.hp + PICKUPS.potionHeal); this.fx.floater(h.x, h.y - 60, `+${PICKUPS.potionHeal}`, '#4cd964'); sfx('pick'); }
  }

  // ======================================================== NÍVEIS E MELHORIAS
  addXp(v) {
    const h = this.hero;
    h.xp += v * h.xpMul;
    let need = xpNeeded(h.level);
    while (h.xp >= need) { h.xp -= need; h.level++; this.pendingLevels++; need = xpNeeded(h.level); }
  }

  openLevelUp() {
    this.cards = rollCards(this.hero);
    sfx('levelup');
    this.fx.ring(this.hero.x, this.hero.y - 30, 0xffd24a);
  }

  chooseCard(i) {
    const c = this.cards && this.cards[i], h = this.hero;
    if (!c) return;
    if (c.kind === 'weapon') { if (c.isNew) h.addWeapon(c.id); else h.levelUpWeapon(c.id); }
    else if (c.kind === 'passive') { h.passives[c.id] = c.level; PASSIVES[c.id].apply(h); }
    else h.hp = h.maxHp;
    sfx('pick');
    this.cards = null;
    this.pendingLevels--;
    if (this.pendingLevels > 0) this.openLevelUp();
  }

  // ======================================================== FIM DA PARTIDA
  onHeroDeath() {
    this.state = 'dead';
    this.fx.explosion(this.hero.x, this.hero.y - 20, 1.4);
    this.finish(false);
  }

  victory() {
    this.state = 'winning'; this.endT = 2.6; this.boss = null;
    for (const e of this.enemies) if (!e.dead && e.def.kind !== 'boss') { e.dead = true; this.fx.burst(e.x, e.y - 14, 0xa8c28c, 4, 170, 120, 350, false); e.destroy(); }
    for (const s of this.enemyShots) s.dead = true;
    this.banner('SENHOR DEMÔNIO DERROTADO!', 3);
    this.finish(true);
  }

  finish(won) {
    const h = this.hero;
    // moedas viram ouro guardado; mostrar o resumo na tela final
    const save = recordRun(h.gold, Math.floor(this.time), won);
    this.result = { won, time: Math.floor(this.time), kills: h.kills, gold: h.gold, level: h.level, totalGold: save.gold, best: save.best };
  }
}
