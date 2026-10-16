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

  floater(x, y, text, color = '#ffffff') {
    const t = this.s.add.text(x, y, text, uiStyle(14, color)).setOrigin(0.5).setDepth(20);
    this.s.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1000, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
  }

  ghost(sprite) {
    const g = this.s.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
      .setOrigin(sprite.originX, sprite.originY).setFlipX(sprite.flipX).setTintFill(0x7fb0ff).setAlpha(0.5).setDepth(sprite.depth - 1);
    this.s.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
  }

  shake(px) { this.s.cameras.main.shake(180, px / 700); }
}
