import Enemy from './Enemy.js';
import { GAME_W } from '../config.js';
import { FRAME } from '../assets.js';

// Golem Arcano: flutua no lado direito da arena e alterna padrões de ataque.
// Abaixo de 50% de vida entra em fúria: padrões mais densos e mais rápidos.
export default class Boss extends Enemy {
  constructor(scene, spawn) {
    super(scene, spawn);
    this.homeX = spawn.x;
    const gy = scene.groundAt(spawn.x);
    this.lowY = gy - 10;    // baixo: o tiro reto acerta
    this.highY = gy - 110;  // alto: precisa mirar na diagonal ou pular
    this.y = this.targetY = this.lowY;
    Object.assign(this, { mode: 'idle', timer: 2.2, pi: 0, step: 0, pattern: null, entered: true, p2: false });
    this.fadeIn(1.2);
    this.core = scene.add.image(this.x, this.y - 100, 'proj', FRAME.glow).setDepth(10).setBlendMode('ADD');
    scene.fx.burst(this.x, this.y - 90, 0xff3355, 40, 380, 0, 1000);
    scene.fx.shake(10);
  }

  coreXY() { return { x: this.x, y: this.y - 100 }; }

  behave(dt) {
    const s = this.scene;
    this.t += dt;
    const p2 = this.hp < this.maxHp * 0.5;
    if (p2 && !this.p2) {
      this.p2 = true;
      s.banner('O GOLEM ENFURECEU!', 2);
      s.fx.shake(14);
      s.fx.burst(this.x, this.y - 100, 0xff3355, 40, 400, 0, 1000);
    }
    this.x = this.homeX + Math.sin(this.t * 0.7) * 30;
    this.y += (this.targetY + Math.sin(this.t * 1.6) * 6 - this.y) * Math.min(1, dt * 2);
    this.facing = -1;

    if (this.mode === 'idle') {
      this.timer -= dt;
      if (this.timer <= 0) {
        const list = p2 ? ['ring', 'burst', 'fan', 'rain', 'wave', 'mortar', 'ring', 'burst']
                        : ['burst', 'fan', 'wave', 'ring', 'burst', 'rain'];
        this.pattern = list[this.pi % list.length]; this.pi++;
        this.mode = 'tele'; this.timer = this.teleTime = p2 ? 0.5 : 0.75;
        this.targetY = Math.random() < 0.5 ? this.lowY : this.highY;
      }
    } else if (this.mode === 'tele') {
      this.timer -= dt;
      if (this.timer <= 0) { this.mode = 'attack'; this.step = 0; this.timer = 0; }
    } else if (PATTERNS[this.pattern](this, dt, p2, s)) {
      this.mode = 'idle'; this.timer = p2 ? 0.8 : 1.3;
    }

    this.anim(p2 ? 'rage' : this.mode === 'idle' ? 'idle' : 'attack');
    const c = this.coreXY();
    const charge = this.mode === 'tele' ? 1 - this.timer / this.teleTime : 0;
    this.core.setPosition(c.x, c.y).setTint(p2 ? 0xff3355 : 0xc04bff).setScale(0.9 + charge * 1.1 + Math.sin(this.t * 6) * 0.08);
  }

  tick(dt) {
    super.tick(dt);
    if (this.core) this.core.setAlpha(this.alpha);
  }

  kill() { this.core.setVisible(false); super.kill(); }
  destroy(fromScene) { if (this.core) this.core.destroy(); super.destroy(fromScene); }
}

// Cada padrão roda por vários frames e retorna true quando terminou.
const PATTERNS = {
  burst(e, dt, p2, s) {
    e.timer -= dt;
    if (e.timer <= 0) { const c = e.coreXY(); e.aim(c.x, c.y, 380, 'orb'); e.step++; e.timer = 0.13; }
    return e.step >= (p2 ? 9 : 5);
  },
  fan(e, dt, p2, s) {
    e.timer -= dt;
    if (e.timer <= 0) {
      const c = e.coreXY(), n = 13, gap = 2 + Math.floor(Math.random() * (n - 6));
      for (let i = 0; i < n; i++) {
        if (i === gap || i === gap + 1) continue; // brecha para escapar
        const a = Math.PI - 1.0 + (2.0 * i) / (n - 1) + (e.step % 2 ? 0.08 : 0);
        s.enemyShot(c.x, c.y, Math.cos(a) * 230, Math.sin(a) * 230, 'big');
      }
      e.step++; e.timer = 0.65;
    }
    return e.step >= (p2 ? 2 : 1);
  },
  ring(e, dt, p2, s) {
    e.timer -= dt;
    if (e.timer <= 0) {
      const c = e.coreXY(), n = p2 ? 20 : 16, off = e.step * 0.17 + e.t;
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * Math.PI * 2;
        s.enemyShot(c.x, c.y, Math.cos(a) * 210, Math.sin(a) * 210, 'orb');
      }
      e.step++; e.timer = 0.4;
    }
    return e.step >= (p2 ? 3 : 1);
  },
  wave(e, dt, p2, s) {
    e.timer -= dt;
    if (e.timer <= 0) { s.groundWave(e.x - 70, -1); e.step++; e.timer = p2 ? 0.55 : 0.7; s.fx.shake(6); }
    return e.step >= (p2 ? 3 : 2);
  },
  rain(e, dt, p2, s) {
    const n = p2 ? 8 : 5;
    for (let i = 0; i < n; i++) {
      const x = i === 0 ? s.player.x : Phaser.Math.Between(s.camX + 40, s.camX + GAME_W - 220);
      s.meteor(x, 0.8 + i * 0.14);
    }
    return true;
  },
  mortar(e, dt, p2, s) {
    e.timer -= dt;
    if (e.timer <= 0) {
      for (const o of [-140, 0, 140]) {
        const tx = Phaser.Math.Clamp(s.player.x + o + Phaser.Math.Between(-30, 30), s.camX + 20, s.camX + GAME_W - 200);
        s.lob(e.x - 60, e.y - 140, tx, 1.1);
      }
      e.step++; e.timer = 0.6;
    }
    return e.step >= 2;
  },
};
