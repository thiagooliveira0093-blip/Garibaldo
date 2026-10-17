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

  // hx, hy = posição do herói NO MUNDO; a câmera pode ter zoom, então converte para a tela
  render(dt, camera, hx, hy) {
    this.t += dt;
    const rt = this.rt, b = this.brush, z = camera.zoom, mid = camera.midPoint;
    const toX = x => (x - mid.x) * z + GAME_W / 2, toY = y => (y - mid.y) * z + GAME_H / 2;
    rt.clear();
    rt.fill(0x05030a, this.level);
    const flick = 1 + Math.sin(this.t * 9) * 0.02 + Math.sin(this.t * 23) * 0.015;
    b.setScale((this.heroRadius * 2 * flick * z) / 256);
    rt.erase(b, toX(hx), toY(hy));
    for (const l of this.lights) {
      const lx = toX(l.x), ly = toY(l.y), lr = l.r * z;
      if (lx < -lr || lx > GAME_W + lr || ly < -lr || ly > GAME_H + lr) continue;
      b.setScale(((l.r * 2 * z) * (1 + Math.sin(this.t * 11 + l.x) * 0.05)) / 256);
      rt.erase(b, lx, ly);
    }
  }
}
