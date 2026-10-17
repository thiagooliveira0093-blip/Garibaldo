import {
  GAME_W, GAME_H, LEVELS, ENEMIES, SHOTS, DESTRUCTIBLE, FIRE_SPLASH, ICE_SLOW, POWERS,
  GRAZE, PERFECT_DODGE, SLOW_FACTOR,
} from '../config.js';
import { FRAME } from '../assets.js';
import Controls from '../systems/controls.js';
import Effects from '../systems/effects.js';
import Waves from '../systems/waves.js';
import { createParallax } from '../systems/parallax.js';
import { sfx, toggleMute } from '../systems/sfx.js';
import Player from '../entities/Player.js';
import { createEnemy } from '../entities/enemies.js';

const { Rectangle, Circle, Intersects } = Phaser.Geom;

// lê uma propriedade customizada do Tiled (aceita formato array ou objeto)
export function prop(o, name, def) {
  const p = o && o.properties;
  if (!p) return def;
  if (Array.isArray(p)) { const f = p.find(q => q.name === name); return f ? f.value : def; }
  return name in p ? p[name] : def;
}

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.ready = false;
    this.levelIndex = data.level || 0;
    this.carry = data.carry || null;
  }

  create() {
    const level = LEVELS[this.levelIndex];
    this.controls = new Controls(this);
    this.fx = new Effects(this);
    this.parallax = createParallax(this);
    this.bossTint = this.add.rectangle(0, 0, GAME_W, GAME_H, 0xff2040, 0).setOrigin(0).setScrollFactor(0).setDepth(3);

    // ---------- mapa do Tiled ----------
    const map = this.make.tilemap({ key: level.key });
    this.map = map;
    const ts = map.addTilesetImage('tiles', 'tiles');
    if (map.getLayer('decoracao')) map.createLayer('decoracao', ts).setDepth(4);
    this.ground = map.createLayer('chao', ts).setDepth(5);
    this.plats = map.createLayer('plataformas', ts).setDepth(5);
    this.ground.setCollisionByExclusion([-1]);
    // plataformas só colidem por cima (dá pra pular através delas)
    this.plats.forEachTile(t => { if (t.index > 0) t.setCollision(false, false, true, false); });
    this.mapW = map.widthInPixels;
    this.mapH = map.heightInPixels;
    this.physics.world.setBounds(0, -400, this.mapW, this.mapH + 800);
    this.levelName = prop(map, 'nome', `FASE ${this.levelIndex + 1}`);

    // ---------- objetos: player, ondas e inimigos ----------
    const objs = (map.getObjectLayer('objetos') || { objects: [] }).objects;
    const start = objs.find(o => o.name === 'player') || { x: 100, y: this.groundAt(100) };
    this.player = new Player(this, start.x, start.y);

    const waves = objs.filter(o => o.name === 'onda')
      .map(o => ({ id: prop(o, 'id', 0), x: o.x, boss: !!prop(o, 'chefe', false), spawns: [] }))
      .sort((a, b) => a.x - b.x);
    for (const o of objs) {
      const type = o.type || o.class;
      if (!ENEMIES[type]) continue;
      const w = waves.find(wv => wv.id === prop(o, 'onda', 0));
      if (!w) { console.warn(`Inimigo "${type}" em x=${o.x} aponta para uma onda que não existe`); continue; }
      w.spawns.push({ type, x: o.x, y: o.y, delay: prop(o, 'atraso', 0) });
    }

    // ---------- grupos e colisões ----------
    this.enemies = this.physics.add.group();
    this.pShots = this.physics.add.group({ allowGravity: false });
    this.eShots = this.physics.add.group({ allowGravity: false });
    this.pickups = this.physics.add.group();

    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.plats, null, () => this.player.dropT <= 0);
    const walkers = e => e.def.gravity;
    this.physics.add.collider(this.enemies, this.ground, null, walkers);
    this.physics.add.collider(this.enemies, this.plats, null, walkers);
    this.physics.add.collider(this.pickups, this.ground);
    this.physics.add.collider(this.pickups, this.plats);
    this.physics.add.overlap(this.pShots, this.enemies, (s, e) => this.onShotHitEnemy(s, e));
    this.physics.add.overlap(this.pShots, this.eShots, (s, es) => this.onBoltHitShot(s, es),
      (s, es) => s.pw.kind === 'bolt' && DESTRUCTIBLE.has(es.kind));
    this.physics.add.overlap(this.player, this.pickups, (p, k) => this.collect(k));

    // ---------- estado ----------
    this.waves = new Waves(this, waves);
    this.camX = 0;
    this.cameras.main.setBounds(0, 0, this.mapW, GAME_H);
    this.warnGfx = this.add.graphics().setDepth(14);
    this.hpGfx = this.add.graphics().setDepth(16);
    Object.assign(this, {
      state: 'play', paused: false, score: 0, combo: 0, comboT: 0, slowT: 0, goT: 0, winT: 0,
      bannerText: '', bannerT: 0, elapsed: 0, blasts: [], bossDeath: null, timeScale: 1,
    });
    if (this.carry) { this.player.hp = this.carry.hp; this.score = this.carry.score; this.player.energy = this.carry.energy; }
    this.best = this.registry.get('best') || 0;
    this.banner(this.levelName, 2.2);

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.ready = true;
  }

  // altura do chão (topo do primeiro tile da camada "chao") na posição x
  groundAt(x) {
    const tx = Phaser.Math.Clamp(Math.floor(x / this.map.tileWidth), 0, this.map.width - 1);
    for (let ty = 0; ty < this.map.height; ty++) if (this.map.getTileAt(tx, ty, false, 'chao')) return ty * this.map.tileHeight;
    return this.mapH;
  }

  banner(text, t = 2) { this.bannerText = text; this.bannerT = t; }

  setPaused(v) {
    this.paused = v;
    if (v) { this.physics.pause(); this.anims.pauseAll(); this.tweens.pauseAll(); }
    else { this.physics.resume(); this.anims.resumeAll(); this.tweens.resumeAll(); }
  }

  // ======================================================== LOOP
  update(time, delta) {
    if (!this.ready) return;
    const c = this.controls;
    c.poll();
    if (c.just('mute')) toggleMute();
    if (this.state === 'play' && c.just('pause')) this.setPaused(!this.paused);
    if (this.paused) return;
    if ((this.state === 'dead' || this.state === 'win') && c.just('restart')) { this.restartGame(); return; }

    const real = Math.min(delta / 1000, 1 / 30);
    let ts = 1;
    if (this.slowT > 0) { this.slowT -= real; ts = SLOW_FACTOR; }
    this.timeScale = ts;
    this.physics.world.timeScale = 1 / ts; // no Arcade, timeScale maior = mais lento
    this.anims.globalTimeScale = ts;
    const dt = real * ts;
    this.elapsed += dt;

    if (this.state === 'play') { this.player.update(dt); this.waves.update(dt); }
    for (const e of this.enemies.getChildren().slice()) if (e.active) e.tick(dt);
    this.updateShots(dt);
    this.updateBlasts(dt);
    this.updatePickups(dt);
    this.drawEnemyBars();

    this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
    this.goT -= real; this.bannerT -= real;

    if (this.winT > 0) {
      this.winT -= dt;
      const b = this.bossDeath;
      if (b && Math.random() < 0.3) this.fx.explosion(b.x + Phaser.Math.Between(-60, 60), b.y + Phaser.Math.Between(-70, 70), Phaser.Math.FloatBetween(0.6, 1.4));
      if (this.winT <= 0) this.completeLevel();
    } else if (this.state === 'play' && this.waves.allDone && !this.waves.hasBoss && this.player.x > this.mapW - 100) {
      this.completeLevel();
    }

    this.cameras.main.scrollX = this.camX;
    this.parallax.update(this.camX);
    if (this.waves.hasBoss) this.bossTint.fillAlpha = Phaser.Math.Clamp((this.camX - (this.mapW - GAME_W - 900)) / 900, 0, 1) * 0.18;
  }

  // ======================================================== TIROS
  firePlayerShot(x, y, ang, pw) {
    const s = this.pShots.create(x, y, 'proj', pw.frame);
    s.setDepth(13).setBlendMode('ADD').setRotation(ang).play(pw.anim);
    if (pw.kind === 'fire') { // a cabeça da bola de fogo fica em (21,17) do quadro; o rastro vai para trás
      s.setOrigin(21 / 32, 17 / 32);
      s.body.setCircle(pw.radius, 21 - pw.radius, 17 - pw.radius);
    } else s.body.setCircle(pw.radius, 16 - pw.radius, 16 - pw.radius);
    s.body.setVelocity(Math.cos(ang) * pw.speed, Math.sin(ang) * pw.speed);
    s.pw = pw; s.life = 1.3; s.hits = new Set();
  }

  enemyShot(x, y, vx, vy, kind) {
    const def = SHOTS[kind];
    const s = this.eShots.create(x, y, 'proj', def.frame);
    Object.assign(s, { kind, radius: def.radius, life: 8, grazed: false, dodged: false, warn: 0 });
    s.setDepth(14).setBlendMode('ADD').play(def.anim);
    if (kind === 'wave') s.body.setSize(22, 30).setOffset(5, 2);
    else s.body.setCircle(def.radius, 16 - def.radius, 16 - def.radius);
    s.body.setVelocity(vx, vy);
    sfx('enemy');
    return s;
  }

  groundWave(x, dir) {
    const s = this.enemyShot(x, this.groundAt(x) - 16, dir * 340, 0, 'wave');
    s.life = 6; s.setFlipX(dir < 0);
    sfx('boom');
  }

  meteor(x, warn) {
    const s = this.enemyShot(x, -30, 0, 0, 'meteor');
    s.warn = warn; s.setVisible(false); s.body.enable = false;
  }

  lob(x, y, tx, T = 1) {
    const g = 900, gy = this.groundAt(tx) - 9;
    this.enemyShot(x, y, (tx - x) / T, (gy - y - 0.5 * g * T * T) / T, 'mortar');
  }

  blast(x, y, r) {
    this.blasts.push({ x, y, r, life: 0.22, dodged: false });
    this.fx.explosion(x, y, 0.8);
    sfx('boom');
  }

  updateShots(dt) {
    const camL = this.camX - 120, camR = this.camX + GAME_W + 120;

    for (const s of this.pShots.getChildren().slice()) {
      s.life -= dt;
      if (s.pw.kind === 'fire' && Math.random() < 0.5) this.fx.trail(s.x, s.y, 0xffb347);
      const gy = this.groundAt(s.x);
      if (s.y > gy) { this.fx.burst(s.x, gy, s.pw.color, 5, 120); s.destroy(); continue; }
      if (s.life <= 0 || s.x < camL || s.x > camR || s.y < -60) s.destroy();
    }

    const p = this.player, hb = p.hurtbox();
    const near = new Rectangle(hb.x - GRAZE.distance, hb.y - GRAZE.distance, hb.width + GRAZE.distance * 2, hb.height + GRAZE.distance * 2);
    this.warnGfx.clear();

    for (const s of this.eShots.getChildren().slice()) {
      s.life -= dt;
      if (s.kind === 'meteor' && s.warn > 0) {
        s.warn -= dt;
        this.drawMeteorWarning(s);
        if (s.warn <= 0) { s.setVisible(true); s.body.enable = true; s.body.setVelocity(0, 680); }
        continue;
      }
      if (s.kind === 'mortar') s.body.velocity.y += 900 * dt;
      const gy = this.groundAt(s.x);
      if (s.kind === 'wave') {
        s.y = gy - 16;
        if (Math.random() < 0.7) this.fx.trail(s.x + Phaser.Math.Between(-10, 10), gy - Phaser.Math.Between(0, 26), 0xb44bff);
      }
      if (s.kind === 'meteor' || s.kind === 'mortar') {
        if (s.y >= gy - s.radius * 0.5) { this.blast(s.x, gy - 14, s.kind === 'meteor' ? 46 : 36); s.destroy(); continue; }
        if (s.kind === 'meteor' && Math.random() < 0.8) this.fx.trail(s.x + Phaser.Math.Between(-8, 8), s.y - 10, 0xff9b3d);
      } else if (s.kind !== 'wave' && s.y > gy) {
        this.fx.burst(s.x, gy, s.kind === 'orb' ? 0xc04bff : 0xff3355, 4, 100); s.destroy(); continue;
      }
      if (s.life <= 0 || s.x < camL || s.x > camR || s.y > this.mapH + 60) { s.destroy(); continue; }
      if (this.state !== 'play') continue;

      let touching, grazing;
      if (s.kind === 'wave') {
        const r = new Rectangle(s.body.x, s.body.y, s.body.width, s.body.height);
        touching = Intersects.RectangleToRectangle(hb, r);
        grazing = Intersects.RectangleToRectangle(near, r);
      } else {
        touching = Intersects.CircleToRectangle(new Circle(s.x, s.y, s.radius), hb);
        grazing = Intersects.CircleToRectangle(new Circle(s.x, s.y, s.radius + GRAZE.distance), hb);
      }
      this.resolveShotVsPlayer(s, touching, grazing, hb);
    }
  }

  // Coração da mecânica de esquiva:
  //  - encostar durante o dash = ESQUIVA PERFEITA (câmera lenta + energia)
  //  - passar de raspão sem ser atingido = GRAZE (energia + pontos)
  resolveShotVsPlayer(s, touching, grazing, hb) {
    const p = this.player;
    if (touching) {
      if (p.dashT > 0) { if (!s.dodged) { s.dodged = true; this.perfectDodge(); } }
      else if (p.iframes <= 0) {
        this.damagePlayer();
        if (s.kind !== 'wave') s.destroy();
      }
    } else if (grazing && !s.grazed && p.iframes <= 0 && p.dashT <= 0) {
      s.grazed = true;
      p.energy = Math.min(100, p.energy + GRAZE.energy);
      this.score += GRAZE.score;
      this.fx.burst(Phaser.Math.Clamp(s.x, hb.x, hb.right), Phaser.Math.Clamp(s.y, hb.y, hb.bottom), 0xffffff, 3, 120, 0, 250);
      sfx('graze');
    }
  }

  drawMeteorWarning(s) {
    const gy = this.groundAt(s.x), a = 0.4 + Math.abs(Math.sin(this.elapsed * 14)) * 0.5;
    this.warnGfx.fillStyle(0xff3355, a * 0.25).fillRect(s.x - 16, 0, 32, gy);
    this.warnGfx.lineStyle(3, 0xff3355, a).strokeEllipse(s.x, gy - 2, 68, 16);
  }

  updateBlasts(dt) {
    const p = this.player, hb = p.hurtbox();
    for (const b of this.blasts) {
      b.life -= dt;
      if (this.state !== 'play' || !Intersects.CircleToRectangle(new Circle(b.x, b.y, b.r), hb)) continue;
      if (p.dashT > 0) { if (!b.dodged) { b.dodged = true; this.perfectDodge(); } }
      else this.damagePlayer();
    }
    this.blasts = this.blasts.filter(b => b.life > 0);
  }

  onShotHitEnemy(s, e) {
    if (!s.active || e.dead || e.spawnT > 0 || s.hits.has(e)) return;
    const pw = s.pw;
    sfx('hit');
    if (pw.kind === 'fire') {
      this.damageEnemy(e, pw.dmg);
      for (const o of this.enemies.getChildren().slice()) {
        if (o === e || o.dead || o.spawnT > 0) continue;
        if (Phaser.Math.Distance.Between(o.body.center.x, o.body.center.y, s.x, s.y) < FIRE_SPLASH.radius) this.damageEnemy(o, FIRE_SPLASH.dmg);
      }
      this.fx.burst(s.x, s.y, 0xff7a2f, 14, 260, 100, 450);
      this.fx.ring(s.x, s.y, 0xffb347, true);
      s.destroy();
    } else if (pw.kind === 'ice') {
      this.damageEnemy(e, pw.dmg);
      e.slowT = ICE_SLOW.time;
      s.hits.add(e); // perfura
      this.fx.burst(s.x, s.y, 0xbff0ff, 6, 160, 0, 350);
    } else {
      this.damageEnemy(e, pw.dmg);
      this.fx.burst(s.x, s.y, 0xfff9a0, 5, 180, 0, 250);
      s.destroy();
    }
  }

  onBoltHitShot(s, es) {
    if (!s.active || !es.active) return;
    this.fx.burst(es.x, es.y, 0xf6f35a, 6, 160, 0, 300);
    this.player.energy = Math.min(100, this.player.energy + 1);
    this.score += 5;
    es.destroy(); s.destroy();
  }

  // ======================================================== INIMIGOS
  spawnEnemy(sp) { createEnemy(this, sp); }

  damageEnemy(e, dmg) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flashHit();
    this.player.energy = Math.min(100, this.player.energy + 1.5);
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    const cx = e.body.center.x, cy = e.body.center.y;
    e.kill();
    this.combo++; this.comboT = 2.5;
    const pts = Math.round(e.def.score * (1 + Math.min(this.combo - 1, 9) * 0.25));
    this.score += pts;
    this.fx.floater(cx, e.y - e.body.height, `+${pts}${this.combo > 1 ? `  x${this.combo}` : ''}`, '#ffe27a');
    this.fx.explosion(cx, cy, e.kind === 'heavy' ? 1.6 : e.kind === 'boss' ? 2.5 : 1);
    this.fx.shake(e.kind === 'heavy' ? 10 : e.kind === 'boss' ? 20 : 5);
    sfx('boom');

    if (e.kind === 'boss') {
      this.bossDeath = { x: cx, y: cy };
      this.winT = 3;
      this.eShots.clear(true, true);
      this.banner(`${e.def.name} DERROTADO!`, 3);
      return;
    }
    const r = Math.random();
    if (r < 0.12) this.dropPickup('heart', cx, cy);
    else if (r < 0.35) this.dropPickup('mana', cx, cy);
  }

  drawEnemyBars() {
    const g = this.hpGfx;
    g.clear();
    for (const e of this.enemies.getChildren()) {
      if (!e.def.showHp || e.dead || e.spawnT > 0) continue;
      const w = e.body.width, x = e.x - w / 2, y = e.y - e.body.height - 10;
      g.fillStyle(0x000000, 0.6).fillRect(x, y, w, 4);
      g.fillStyle(0xff4d6d).fillRect(x, y, w * Phaser.Math.Clamp(e.hp / e.maxHp, 0, 1), 4);
    }
  }

  // ======================================================== ITENS
  dropPickup(type, x, y) {
    const k = this.pickups.create(x, y, 'proj', type === 'heart' ? FRAME.heart : FRAME.mana);
    k.body.setSize(20, 20).setOffset(6, 6);
    k.setDepth(8).setBounce(0.3).setVelocity(0, -220);
    k.type = type; k.life = 10;
  }

  updatePickups(dt) {
    for (const k of this.pickups.getChildren().slice()) {
      k.life -= dt;
      k.setAlpha(k.life < 3 && Math.floor(k.life * 8) % 2 ? 0.2 : 1);
      if (k.life <= 0) k.destroy();
    }
  }

  collect(k) {
    if (!k.active || this.state !== 'play') return;
    const p = this.player;
    sfx('pick');
    if (k.type === 'heart') { p.hp = Math.min(p.maxHp, p.hp + 1); this.fx.floater(k.x, k.y - 10, '+1 VIDA', '#ff7a9a'); }
    else { p.energy = Math.min(100, p.energy + 25); this.fx.floater(k.x, k.y - 10, '+25 ARCANO', '#d7a8ff'); }
    k.destroy();
  }

  // ======================================================== PLAYER
  damagePlayer() {
    const p = this.player;
    if (p.iframes > 0 || p.dashT > 0 || this.state !== 'play' || this.winT > 0) return;
    p.hp--; p.iframes = 1.3; p.setVelocityY(-320);
    this.combo = 0;
    this.fx.shake(12);
    this.fx.burst(p.x, p.y - 24, 0xff4d6d, 16, 260);
    sfx('hurt');
    if (p.hp <= 0) {
      p.die();
      this.fx.explosion(p.x, p.y - 24, 1.5);
      this.state = 'dead';
      this.saveBest();
    }
  }

  perfectDodge() {
    const p = this.player;
    if (p.dashDodged) return;
    p.dashDodged = true;
    p.energy = Math.min(100, p.energy + PERFECT_DODGE.energy);
    this.slowT = PERFECT_DODGE.slowTime;
    this.score += PERFECT_DODGE.score;
    this.fx.floater(p.x, p.y - 64, `ESQUIVA PERFEITA! +${PERFECT_DODGE.energy}`, '#9fe8ff');
    sfx('dodge');
  }

  // Explosão Arcana: limpa todos os tiros inimigos e causa dano em tudo na tela
  special() {
    const p = this.player;
    p.energy = 0;
    this.fx.ring(p.x, p.y - 24, 0xe3b8ff);
    this.fx.portal(p.x, p.y - 4, POWERS[p.power].color);
    for (const s of this.eShots.getChildren()) if (s.visible) this.fx.burst(s.x, s.y, 0xe8d7ff, 4, 150, 0, 400);
    this.score += this.eShots.countActive(true) * 10;
    this.eShots.clear(true, true);
    this.blasts = [];
    for (const e of this.enemies.getChildren().slice()) {
      if (!e.dead && e.spawnT <= 0 && e.x > this.camX - 40 && e.x < this.camX + GAME_W + 40) this.damageEnemy(e, e.kind === 'boss' ? 12 : 8);
    }
    this.fx.shake(18);
    this.slowT = 0.3;
    this.fx.floater(p.x, p.y - 70, 'EXPLOSÃO ARCANA!', '#e3b8ff');
    sfx('special');
  }

  // ======================================================== FLUXO
  saveBest() {
    this.best = Math.max(this.best, this.score);
    this.registry.set('best', this.best);
  }

  completeLevel() {
    if (this.state !== 'play') return;
    const next = this.levelIndex + 1;
    if (next < LEVELS.length) {
      const p = this.player;
      this.scene.restart({ level: next, carry: { hp: p.hp, score: this.score, energy: p.energy } });
    } else {
      this.state = 'win';
      this.saveBest();
    }
  }

  restartGame() {
    this.physics.world.timeScale = 1;
    this.anims.globalTimeScale = 1;
    this.scene.restart({ level: 0 });
  }
}
