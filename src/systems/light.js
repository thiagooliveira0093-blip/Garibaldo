import { GAME_W, GAME_H } from '../config.js';

// Escuridão do salão (clima de Diablo): uma camada escura sobre a tela com buracos de luz em volta do
// herói e dos braseiros. Os números de dano e o HUD ficam por cima dela.
export default class Darkness {
  constructor(scene, lights) {
    this.scene = scene;
    this.lights = lights;
    this.rt = scene.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0).setScrollFactor(0).setDepth(9000);
    this.brush = scene.make.image({ key: 'light' }, false).setOrigin(0.5);
    this.level = 0.84;      // quão escuro (0 a 1)
    this.heroRadius = 300;
    this.t = 0;
  }

  // sx, sy = posição do herói NA TELA
  render(dt, camera, sx, sy) {
    this.t += dt;
    const rt = this.rt, b = this.brush;
    rt.clear();
    rt.fill(0x05030a, this.level);
    const flick = 1 + Math.sin(this.t * 9) * 0.02 + Math.sin(this.t * 23) * 0.015;
    b.setScale((this.heroRadius * 2 * flick) / 256);
    rt.erase(b, sx, sy);
    for (const l of this.lights) {
      const lx = l.x - camera.scrollX, ly = l.y - camera.scrollY;
      if (lx < -l.r || lx > GAME_W + l.r || ly < -l.r || ly > GAME_H + l.r) continue;
      b.setScale(((l.r * 2) * (1 + Math.sin(this.t * 11 + l.x) * 0.05)) / 256);
      rt.erase(b, lx, ly);
    }
  }
}
