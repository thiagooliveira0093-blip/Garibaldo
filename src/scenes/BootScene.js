import { SHEETS, IMAGES, ANIMS } from '../assets.js';
import { uiStyle } from '../systems/ui-style.js';

// Carrega todos os assets, cria as animações e a textura de luz.
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const { width: w, height: h } = this.scale;
    this.add.text(w / 2, h / 2 - 30, 'Carregando...', uiStyle(16)).setOrigin(0.5);
    this.add.rectangle(w / 2, h / 2, 304, 16).setStrokeStyle(2, 0xffffff);
    const bar = this.add.rectangle(w / 2 - 150, h / 2, 0, 10, 0xe38bff).setOrigin(0, 0.5);
    this.load.on('progress', p => { bar.width = 300 * p; });
    this.load.on('loaderror', f => console.error('Falha ao carregar', f.src));

    for (const [key, url, frameWidth, frameHeight] of SHEETS) this.load.spritesheet(key, url, { frameWidth, frameHeight });
    for (const [key, url] of IMAGES) this.load.image(key, url);
  }

  create() {
    for (const a of ANIMS) {
      this.anims.create({
        key: a.key,
        frames: this.anims.generateFrameNumbers(a.sheet, { frames: a.frames }),
        frameRate: a.rate,
        repeat: a.repeat ?? -1,
      });
    }
    // textura de luz: círculo branco que vai sumindo nas bordas (recorta a escuridão do salão)
    const size = 256, tex = this.textures.createCanvas('light', size, size), ctx = tex.getContext();
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    tex.refresh();
    this.scene.start('Title');
  }
}
