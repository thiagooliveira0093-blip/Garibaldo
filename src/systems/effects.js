import { uiStyle } from './ui-style.js';

// Partículas, explosões, anéis, textos flutuantes e tremor de câmera.
export default class Effects {
  constructor(scene) {
    this.s = scene;
    this.emitters = new Map();
  }

  emitter(color, gravity, speed, life) {
    const key = `${color}|${gravity}|${speed}|${life}`;
    let e = this.emitters.get(key);
    if (!e) {
      e = this.s.add.particles(0, 0, 'spark', {
        speed: { min: speed * 0.3, max: speed }, lifespan: { min: life * 0.5, max: life },
        scale: { start: 1, end: 0 }, tint: color, gravityY: gravity, emitting: false, blendMode: 'ADD',
      }).setDepth(15);
      this.emitters.set(key, e);
    }
    return e;
  }

  burst(x, y, color, count = 10, speed = 220, gravity = 300, life = 500) {
    this.emitter(color, gravity, speed, life).explode(count, x, y);
  }

  trail(x, y, color) { this.emitter(color, -100, 40, 280).explode(1, x, y); }

  explosion(x, y, scale = 1) {
    const ex = this.s.add.sprite(x, y, 'explosion').setScale(scale * 1.2).setDepth(15).setBlendMode('ADD');
    ex.play('explosion');
    ex.once('animationcomplete', () => ex.destroy());
    this.burst(x, y, 0xffdd66, Math.round(12 * scale), 320 * scale, 200);
    this.burst(x, y, 0x777777, Math.round(6 * scale), 120 * scale, -60, 900);
  }

  ring(x, y, color, small = false) {
    const c = this.s.add.circle(x, y, small ? 8 : 20).setStrokeStyle(small ? 3 : 10, color).setDepth(15);
    this.s.tweens.add({ targets: c, radius: small ? 70 : 1100, alpha: 0, duration: small ? 250 : 600, onComplete: () => c.destroy() });
  }

  // Portal em anel no chão (Explosão Arcana): anéis giratórios e fios de energia subindo.
  portal(x, y, color) {
    const g = this.s.add.graphics().setDepth(15).setPosition(x, y);
    const st = { r: 0.15, a: 1, rot: 0 };
    const draw = () => {
      g.clear();
      for (let k = 0; k < 3; k++) {
        const rx = 130 * st.r * (1 + k * 0.14), ry = 34 * st.r * (1 + k * 0.14);
        g.lineStyle(7 - k * 2, k === 0 ? 0xffffff : color, st.a * (k === 0 ? 1 : 0.55));
        g.strokeEllipse(0, 0, rx * 2, ry * 2);
      }
      const rx = 130 * st.r, ry = 34 * st.r;
      g.lineStyle(2, 0xffffff, st.a);
      for (let i = 0; i < 14; i++) { // fagulhas orbitando o anel
        const a = st.rot + i * 0.45, px = Math.cos(a) * rx, py = Math.sin(a) * ry;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 8 - (i % 3) * 6); g.strokePath();
      }
    };
    draw();
    this.s.tweens.add({ targets: st, r: 1, a: 0, rot: 4, duration: 750, ease: 'Cubic.easeOut', onUpdate: draw, onComplete: () => g.destroy() });
    this.burst(x, y, color, 24, 260, -120, 700);
    this.burst(x, y, 0xffffff, 12, 200, -160, 600);
  }

  // meia-lua de um golpe de espada (inimigos); `facing` espelha para a esquerda
  slashArc(x, y, facing, color = 0xffffff, radius = 46) {
    const g = this.s.add.graphics().setDepth(16).setPosition(x, y).setScale(facing, 1);
    g.lineStyle(7, color, 0.95).beginPath().arc(0, 0, radius, -1.1, 1.0, false).strokePath();
    g.lineStyle(3, 0xffffff, 1).beginPath().arc(0, 0, radius - 3, -1.0, 0.9, false).strokePath();
    this.s.tweens.add({ targets: g, alpha: 0, scaleX: facing * 1.25, duration: 190, onComplete: () => g.destroy() });
  }

  // número de dano que sobe e some; crítico (golpe pelas costas) é maior e amarelo
  damageNumber(x, y, dmg, crit = false) {
    const txt = dmg >= 10 ? String(Math.round(dmg)) : String(Math.round(dmg * 10) / 10);
    const t = this.s.add.text(x + Phaser.Math.Between(-8, 8), y, crit ? `${txt}!` : txt, uiStyle(crit ? 22 : 14, crit ? '#ffd24a' : '#ffffff')).setOrigin(0.5).setDepth(21);
    if (crit) { t.setScale(1.5); this.s.tweens.add({ targets: t, scale: 1, duration: 140 }); }
    this.s.tweens.add({ targets: t, y: y - 38, alpha: 0, duration: crit ? 900 : 650, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  floater(x, y, text, color = '#ffffff') {
    const t = this.s.add.text(x, y, text, uiStyle(14, color)).setOrigin(0.5).setDepth(20);
    this.s.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1000, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
  }

  ghost(sprite) {
    const g = this.s.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
      .setOrigin(sprite.originX, sprite.originY).setScale(sprite.scaleX, sprite.scaleY).setFlipX(sprite.flipX)
      .setTintFill(0x7fb0ff).setAlpha(0.5).setDepth(sprite.depth - 1);
    this.s.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
  }

  shake(px) { this.s.cameras.main.shake(180, px / 700); }
}
