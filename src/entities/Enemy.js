import { ENEMIES, ELITE } from '../config.js';

const ANCHOR_Y = { bat: 0.5, brute: 0.9 };   // onde ficam os pés no quadro (0 a 1); o padrão é 0.92

// Inimigo de visão de cima. O comportamento depende de def.kind:
//   chaser (corre até você) · flyer (voa em zigue-zague) · archer (mantém distância e atira) · boss (padrões)
export default class Enemy {
  constructor(scene, type, x, y, o = {}) {
    const d = ENEMIES[type];
    this.scene = scene; this.type = type; this.def = d;
    this.x = x; this.y = y;
    this.elite = !!o.elite;
    this.scale = this.elite ? ELITE.scale : 1;
    this.maxHp = this.hp = d.hp * (o.hpMul || 1) * (this.elite ? ELITE.hp : 1);
    this.radius = d.radius * this.scale;
    this.speed = d.speed * (0.9 + Math.random() * 0.2);
    this.sprite = scene.add.sprite(x, y, d.sheet, 0).setOrigin(0.5, ANCHOR_Y[type] ?? 0.92).setScale(this.scale).setDepth(y);
    if (type === 'bat') this.sprite.play({ key: 'bat-fly', startFrame: Math.floor(Math.random() * 4) });
    if (this.elite) this.sprite.setTint(ELITE.tint);
    Object.assign(this, {
      dead: false, t: Math.random() * 10, phase: Math.random() * 6.28, strafe: Math.random() < 0.5 ? -1 : 1,
      kx: 0, ky: 0, flashT: 0, slowT: 0, burnT: 0, burnDps: 0, burnTick: 0, touchCd: 0,
      shootT: d.shoot ? Phaser.Math.FloatBetween(0.8, d.shoot.cd) : 0, tele: 0,
      atkT: 2.5, atkTele: 0, atkType: 'ring', atkIdx: 0,        // chefe
    });
  }

  update(dt) {
    const s = this.scene, h = s.hero, d = this.def;
    this.t += dt; this.flashT -= dt; this.slowT -= dt; this.touchCd -= dt;

    if (this.burnT > 0) {                                      // queimadura
      this.burnT -= dt; this.burnTick -= dt;
      if (this.burnTick <= 0) {
        this.burnTick = 0.5;
        s.hurtEnemy(this, this.burnDps * 0.5, { raw: true, silent: true, noElement: true });
        if (this.dead) return;
      }
    }

    const dx = h.x - this.x, dy = h.y - this.y, dist = Math.hypot(dx, dy) || 1, nx = dx / dist, ny = dy / dist;
    const spd = this.speed * (this.slowT > 0 ? 0.5 : 1);
    let mx = 0, my = 0;
    switch (d.kind) {
      case 'chaser': mx = nx * spd; my = ny * spd; break;
      case 'flyer': {                                           // zigue-zague na direção do herói
        const a = Math.atan2(ny, nx) + Math.sin(this.t * 3.2 + this.phase) * 0.9;
        mx = Math.cos(a) * spd; my = Math.sin(a) * spd; break;
      }
      case 'archer': {
        const sh = d.shoot;
        if (this.tele > 0) {                                    // mira parado: o quadro de atirar avisa
          this.tele -= dt;
          if (this.tele <= 0) { s.fireEnemyShot(this.x, this.y - 22, Math.atan2(dy, dx), sh.speed, sh.dmg, 'arrow'); this.shootT = sh.cd * (0.8 + Math.random() * 0.4); }
        } else {
          if (dist > sh.keep) { mx = nx * spd; my = ny * spd; }
          else if (dist < sh.keep * 0.65) { mx = -nx * spd; my = -ny * spd; }
          else { mx = -ny * spd * 0.45 * this.strafe; my = nx * spd * 0.45 * this.strafe; }
          this.shootT -= dt;
          if (this.shootT <= 0 && dist < sh.range) this.tele = sh.tele;
        }
        break;
      }
      case 'boss':
        if (dist > 150) { mx = nx * spd; my = ny * spd; }
        this.bossAI(dt, dx, dy);
        break;
    }
    this.kx *= Math.exp(-7 * dt); this.ky *= Math.exp(-7 * dt);        // empurrão perde força
    s.moveEntity(this, (mx + this.kx) * dt, (my + this.ky) * dt, !!d.fly);

    // encostar no herói machuca (o herói tem invulnerabilidade curta depois de cada golpe)
    if (this.touchCd <= 0 && h.alive && dist < this.radius + h.radius) {
      if (h.hurt(d.touch * (1 + s.time / 420))) this.touchCd = 0.4;
    }
    this.draw(nx, ny);
  }

  // Padrões do chefe: avisa (braços erguidos), depois dispara. Abaixo de 50% de vida fica mais rápido.
  bossAI(dt, dx, dy) {
    const s = this.scene, rage = this.hp < this.maxHp * 0.5;
    if (this.atkTele > 0) {
      this.atkTele -= dt;
      if (this.atkTele <= 0) this.bossFire(Math.atan2(dy, dx), rage);
      return;
    }
    this.atkT -= dt;
    if (this.atkT <= 0) {
      this.atkType = ['ring', 'fan', 'summon', 'ring2'][this.atkIdx++ % 4];
      this.atkTele = 0.6; this.atkT = rage ? 1.6 : 2.6;
      s.fx.ring(this.x, this.y - 40, 0xff3355, true);
    }
  }
  bossFire(aim, rage) {
    const s = this.scene, ox = this.x, oy = this.y - 50;
    const ring = (n, off, sp) => { for (let i = 0; i < n; i++) s.fireEnemyShot(ox, oy, off + (i / n) * Math.PI * 2, sp, 11, 'orb'); };
    if (this.atkType === 'ring') ring(rage ? 22 : 16, Math.random() * 6, 150);
    else if (this.atkType === 'ring2') { ring(rage ? 18 : 12, 0, 120); ring(rage ? 18 : 12, Math.PI / (rage ? 18 : 12), 190); }
    else if (this.atkType === 'fan') { const n = rage ? 9 : 5; for (let i = 0; i < n; i++) s.fireEnemyShot(ox, oy, aim + (i - (n - 1) / 2) * 0.22, 230, 11, 'orb'); }
    else {                                                                   // invoca carniçais ao redor
      for (let i = 0; i < (rage ? 9 : 6); i++) {
        const a = (i / 6) * Math.PI * 2 + Math.random(), r = 120 + Math.random() * 60;
        s.spawnEnemy('ghoul', this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, { hpMul: 1 });
      }
    }
    s.fx.shake(6);
  }

  // escolhe a vista (frente, costas, lado) e o quadro de andar
  draw(nx, ny) {
    const d = this.def, sp = this.sprite;
    let view = 0, flip = nx < 0;
    if (d.views === 3) {
      if (Math.abs(nx) > Math.abs(ny) * 1.15) view = 2; else { view = ny > 0 ? 0 : 1; flip = false; }
    }
    if (d.kind === 'boss') sp.setFrame(this.atkTele > 0 ? 4 + (Math.floor(this.t * 8) % 2) : Math.floor(this.t * 4) % 4);
    else if (d.sheet !== 'bat') {
      const walk = Math.floor(this.t * 9) % 4;
      sp.setFrame(view * d.fpv + (d.kind === 'archer' && this.tele > 0 ? 4 : walk));
    }
    sp.setFlipX(flip).setPosition(this.x, this.y).setDepth(this.y);
    if (this.flashT > 0) sp.setTintFill(0xffffff);
    else if (this.slowT > 0) sp.setTint(0x9be7ff);
    else if (this.elite) sp.setTint(ELITE.tint);
    else sp.clearTint();
  }

  destroy() { this.sprite.destroy(); }
}
