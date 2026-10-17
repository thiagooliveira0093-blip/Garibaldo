import { HERO } from '../config.js';
import { weaponStats } from '../weapons.js';
import { sfx } from '../systems/sfx.js';

// O Garibaldo, de visão de cima. Só anda e rola: as armas atacam sozinhas (WeaponSystem).
// Posição em (x, y) = os pés; o sprite tem os pés em (32, 56) do quadro de 64x64.
export default class Hero {
  constructor(scene, x, y, weaponId) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.radius = HERO.radius;
    this.sprite = scene.add.sprite(x, y, 'hero', 0).setOrigin(0.5, 56 / 64).setDepth(y);
    // brilho na borda: destaca o herói no escuro (só com WebGL)
    this.rim = this.sprite.preFX ? this.sprite.preFX.addGlow(0xff9a4a, 1.8, 0, false, 0.1, 8) : null;

    Object.assign(this, {
      hp: HERO.hp, maxHp: HERO.hp, alive: true,
      // multiplicadores que as melhorias passivas alteram (upgrades.js)
      speedMul: 1, dmgMul: 1, cdMul: 1, pickupMul: 1, xpMul: 1, armor: 0, regen: 0, fire: 0, ice: 0, bolt: 0,
      level: 1, xp: 0, kills: 0, gold: 0,
      weapons: [], passives: {},
      iframes: 0, hurtT: 0, dashT: 0, dashInv: 0, dashCd: 0, dashDir: { x: 1, y: 0 }, ghostT: 0,
      view: 0, facingX: 1, moving: false, t: 0, lastDir: { x: 0, y: 1 },
    });
    this.addWeapon(weaponId);
  }

  addWeapon(id) { this.weapons.push({ id, level: 1, st: weaponStats(id, 1), timer: 0.4 }); }
  levelUpWeapon(id) {
    const w = this.weapons.find(q => q.id === id);
    w.level++; w.st = weaponStats(id, w.level);
  }
  get pickupRadius() { return HERO.pickup * this.pickupMul; }

  update(dt, input) {
    if (!this.alive) return;
    const s = this.scene, D = HERO.dash;
    this.t += dt;
    this.iframes -= dt; this.hurtT -= dt; this.dashCd -= dt; this.dashT -= dt; this.dashInv -= dt;

    const m = input.move;
    this.moving = m.x !== 0 || m.y !== 0;
    if (this.moving) {
      this.lastDir = { x: m.x, y: m.y };
      if (Math.abs(m.x) > 0.1) this.facingX = Math.sign(m.x);
      this.view = Math.abs(m.x) > Math.abs(m.y) * 1.1 ? 2 : (m.y > 0 ? 0 : 1);
    }

    // rolamento: impulso curto com invulnerabilidade
    if (input.just('dash') && this.dashCd <= 0) {
      const d = this.moving ? m : this.lastDir, len = Math.hypot(d.x, d.y) || 1;
      this.dashDir = { x: d.x / len, y: d.y / len };
      this.dashT = D.time; this.dashInv = D.iframes; this.dashCd = D.cd;
      sfx('dash');
      s.fx.burst(this.x, this.y, 0xbbbbaa, 6, 110, 0, 300);
    }
    let vx, vy;
    if (this.dashT > 0) {
      vx = this.dashDir.x * D.speed; vy = this.dashDir.y * D.speed;
      this.ghostT -= dt;
      if (this.ghostT <= 0) { s.fx.ghost(this.sprite); this.ghostT = 0.03; }
    } else {
      const sp = HERO.speed * this.speedMul;
      vx = m.x * sp; vy = m.y * sp;
    }
    s.moveEntity(this, vx * dt, vy * dt);
    if (this.regen) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
    this.draw();
  }

  // escolhe o quadro do sprite: parado (2 quadros), andando (6) ou levando dano
  draw() {
    const sp = this.sprite, v = this.view;
    const k = this.moving ? 2 + (Math.floor(this.t * 11) % 6) : Math.floor(this.t * 2.2) % 2;
    sp.setFrame(this.hurtT > 0.18 ? 24 + v : v * 8 + k);
    sp.setFlipX(v === 2 && this.facingX < 0);
    sp.setPosition(this.x, this.y).setDepth(this.y);
    sp.setAlpha(this.iframes > 0 && this.dashInv <= 0 && Math.floor(this.iframes * 18) % 2 === 0 ? 0.45 : 1);
    sp.setScale(1, this.dashT > 0 ? 0.86 : 1);                       // agacha no rolamento
  }

  hurt(raw) {
    if (!this.alive || this.iframes > 0 || this.dashInv > 0) return false;
    const dmg = Math.max(1, Math.round(raw - this.armor));
    this.hp -= dmg;
    this.iframes = HERO.hitIframes; this.hurtT = 0.3;
    this.scene.fx.floater(this.x, this.y - 58, `-${dmg}`, '#ff4d6d');
    this.scene.fx.shake(5);
    sfx('hurt');
    if (this.hp <= 0) {
      this.hp = 0; this.alive = false;
      this.sprite.setFrame(27).setAlpha(1).setScale(1);
      this.scene.onHeroDeath();
    }
    return true;
  }
}
