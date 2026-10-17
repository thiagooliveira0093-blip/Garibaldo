import { GAME_W, GAME_H, LEVELS } from '../config.js';
import { CHARACTER_LIST, variantOf } from '../characters.js';
import Controls from '../systems/controls.js';
import { createParallax } from '../systems/parallax.js';
import { uiStyle } from '../systems/ui-style.js';
import { initAudio, toggleMute } from '../systems/sfx.js';

const BARS = [['vida', 'Vida'], ['velocidade', 'Velocidade'], ['alcance', 'Alcance'], ['forca', 'Força']];
const CARD_W = 260, CARD_H = 400, CARD_Y = 262;

// Escolha do personagem antes de começar: cada um tem armas, golpe e especial próprios.
export default class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  create() {
    this.controls = new Controls(this);
    this.parallax = createParallax(this, LEVELS[0].key);
    this.scroll = 0;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.6).setOrigin(0).setDepth(5);
    this.add.text(GAME_W / 2, 36, 'ESCOLHA SEU HERÓI', uiStyle(32, '#ffe27a')).setOrigin(0.5).setDepth(6);

    const saved = CHARACTER_LIST.findIndex(c => c.id === this.registry.get('char'));
    this.index = Math.max(0, saved);
    this.cards = CHARACTER_LIST.map((char, i) => this.buildCard(char, i));

    this.kit = this.add.text(GAME_W / 2, 484, '', uiStyle(14, '#9fe8ff')).setOrigin(0.5).setDepth(6);
    this.add.text(GAME_W / 2, 516, '◄ ►  escolher    ·    ENTER  confirmar', uiStyle(14, '#dddddd')).setOrigin(0.5).setDepth(6);
    this.refresh(true);
  }

  buildCard(char, i) {
    const x = GAME_W / 2 + (i - 1) * 300;
    const c = this.add.container(x, CARD_Y).setDepth(6);
    const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x120a1a, 0.88);
    const sprite = this.add.sprite(0, -78, `${char.id}-${variantOf(char, 0)}`, 0).setOrigin(36 / 96, 79 / 80).setScale(2);
    sprite.play(`${char.id}-${variantOf(char, 0)}-idle`);
    const name = this.add.text(0, -52, char.name, uiStyle(24, '#ffffff')).setOrigin(0.5);
    const title = this.add.text(0, -26, char.title.toUpperCase(), uiStyle(13, '#e3b8ff')).setOrigin(0.5);
    const bars = this.add.graphics();
    BARS.forEach(([key, label], k) => {
      const y = 2 + k * 22;
      bars.fillStyle(0x000000, 0.7).fillRect(-30, y - 5, 120, 10);
      bars.fillStyle(0xe38bff).fillRect(-29, y - 4, 118 * char.bars[key], 8);
      c.add(this.add.text(-112, y, label, uiStyle(11, '#cccccc')).setOrigin(0, 0.5));
    });
    const desc = this.add.text(0, 118, char.desc, { ...uiStyle(12, '#dddddd'), wordWrap: { width: CARD_W - 28 }, align: 'center', strokeThickness: 2 }).setOrigin(0.5, 0);
    c.add([bg, sprite, name, title, bars, desc]);
    c.sendToBack(bg);
    c.bg = bg;
    c.setSize(CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => { this.index = i; this.refresh(); });
    c.on('pointerdown', () => { this.index = i; this.confirm(); });
    return c;
  }

  refresh(instant = false) {
    this.cards.forEach((c, i) => {
      const sel = i === this.index;
      c.bg.setStrokeStyle(sel ? 4 : 2, sel ? 0xffe27a : 0x5a4a7a);
      this.tweens.add({ targets: c, alpha: sel ? 1 : 0.55, scale: sel ? 1.04 : 0.94, duration: instant ? 0 : 120 });
    });
    const ch = CHARACTER_LIST[this.index];
    this.kit.setText(`Armas: ${ch.powers.map(p => p.name).join(' · ')}   |   Golpe: ${ch.melee.name}   |   Especial: ${ch.special.name}`);
  }

  confirm() {
    initAudio();
    this.registry.set('char', CHARACTER_LIST[this.index].id);
    this.scene.start('Game', { level: 0 });
  }

  update(time, delta) {
    const c = this.controls;
    c.poll();
    this.scroll += delta * 0.04;
    this.parallax.update(this.scroll);
    if (c.just('mute')) toggleMute();
    const n = CHARACTER_LIST.length;
    if (c.just('left')) { this.index = (this.index + n - 1) % n; this.refresh(); }
    if (c.just('right')) { this.index = (this.index + 1) % n; this.refresh(); }
    if (c.just('p1')) { this.index = 0; this.refresh(); }
    if (c.just('p2')) { this.index = 1; this.refresh(); }
    if (c.just('p3')) { this.index = 2; this.refresh(); }
    if (c.just('confirm')) this.confirm();
  }
}
