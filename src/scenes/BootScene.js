import { LEVELS } from '../config.js';
import { SHEETS, CHARACTER_SHEETS, IMAGES, ANIMS } from '../assets.js';
import { uiStyle } from '../systems/ui-style.js';

// Carrega todos os assets e cria as animações.
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
    for (const { key, file } of CHARACTER_SHEETS) this.load.spritesheet(key, file, { frameWidth: 96, frameHeight: 80 });
    for (const [key, url] of IMAGES) this.load.image(key, url);
    for (const lv of LEVELS) this.load.tilemapTiledJSON(lv.key, lv.map);
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
    this.scene.start('Title');
  }
}
