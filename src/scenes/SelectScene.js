import { GAME_W, GAME_H, LEVELS } from '../config.js';
import { HERO, variantOf } from '../characters.js';
import { WEAPON_LIST } from '../weapons.js';
import Controls from '../systems/controls.js';
import { createParallax } from '../systems/parallax.js';
import { uiStyle } from '../systems/ui-style.js';
import { initAudio, toggleMute } from '../systems/sfx.js';

const CARD_W = 260, CARD_H = 330, CARD_Y = 252;
// o que cada clique faz em cada arma
const MOVES = {
  sword: ['Combo de 3 golpes: aperte em sequência', 'Golpe pesado: quebra armadura e empurra'],
  bow: ['Flecha rápida: segure para repetir', 'Segure para carregar: atravessa os inimigos'],
  ring: ['Magia teleguiada: segure para repetir', 'Nova: empurra e destrói tiros ao redor'],
};
// animação do Garibaldo para demonstrar cada arma
const DEMO = { sword: 'melee', bow: 'bow', ring: 'ring' };

// Escolha da arma antes de começar. O Garibaldo é sempre o mesmo; a arma muda como ele luta.
export default class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  create() {
    this.controls = new Controls(this);
    this.parallax = createParallax(this);
    this.scroll = 0;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.6).setOrigin(0).setDepth(5);
    this.add.text(GAME_W / 2, 34, 'ESCOLHA SUA ARMA', uiStyle(32, '#ffe27a')).setOrigin(0.5).setDepth(6);

    const saved = WEAPON_LIST.findIndex(w => w.id === this.registry.get('weapon'));
    this.index = Math.max(0, saved);
    this.cards = WEAPON_LIST.map((w, i) => this.buildCard(w, i));
    this.add.text(GAME_W / 2, 498, 'Clique esquerdo = ataque FRACO   ·   Clique direito = ataque FORTE   ·   Shift = rolar', uiStyle(14, '#9fe8ff')).setOrigin(0.5).setDepth(6);
    this.add.text(GAME_W / 2, 522, '◄ ►  escolher    ·    ENTER ou clique  confirmar', uiStyle(14, '#dddddd')).setOrigin(0.5).setDepth(6);
    this.refresh(true);
  }

  buildCard(w, i) {
    const x = GAME_W / 2 + (i - 1) * 300;
    const c = this.add.container(x, CARD_Y).setDepth(6);
    const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x120a1a, 0.88);
    const hero = this.add.sprite(0, -64, `${HERO.id}-${variantOf(HERO, 0)}`, 0).setOrigin(36 / 96, 79 / 80).setScale(2);
    hero.play({ key: `${HERO.id}-${variantOf(HERO, 0)}-${DEMO[w.id]}`, repeat: -1, repeatDelay: 450 });
    const icon = this.add.image(-88, 30, w.icon.sheet, w.icon.frame).setScale(1.5);
    const name = this.add.text(-62, 30, w.name.toUpperCase(), uiStyle(26, '#ffffff')).setOrigin(0, 0.5);
    const mk = (y, label, text, color) => [
      this.add.text(-CARD_W / 2 + 16, y, label, uiStyle(12, color)).setOrigin(0, 0.5),
      this.add.text(-CARD_W / 2 + 16, y + 16, text, { ...uiStyle(12, '#dddddd'), wordWrap: { width: CARD_W - 32 }, strokeThickness: 2 }).setOrigin(0, 0),
    ];
    const lines = [...mk(72, 'CLIQUE ESQUERDO · FRACO', MOVES[w.id][0], '#ffe27a'), ...mk(130, 'CLIQUE DIREITO · FORTE', MOVES[w.id][1], '#ff9b7a')];
    c.add([bg, hero, icon, name, ...lines]);
    c.bg = bg;
    c.setSize(CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => { this.index = i; this.refresh(); });
    c.on('pointerdown', p => { if (p.button === 0) { this.index = i; this.confirm(); } });
    return c;
  }

  refresh(instant = false) {
    this.cards.forEach((c, i) => {
      const sel = i === this.index;
      c.bg.setStrokeStyle(sel ? 4 : 2, sel ? 0xffe27a : 0x5a4a7a);
      this.tweens.add({ targets: c, alpha: sel ? 1 : 0.55, scale: sel ? 1.04 : 0.94, duration: instant ? 0 : 120 });
    });
  }

  confirm() {
    initAudio();
    this.registry.set('weapon', WEAPON_LIST[this.index].id);
    this.scene.start('Game', { level: 0 });
  }

  update(time, delta) {
    const c = this.controls;
    c.poll();
    this.scroll += delta * 0.04;
    this.parallax.update(this.scroll);
    if (c.just('mute')) toggleMute();
    const n = WEAPON_LIST.length;
    if (c.just('left')) { this.index = (this.index + n - 1) % n; this.refresh(); }
    if (c.just('right')) { this.index = (this.index + 1) % n; this.refresh(); }
    if (c.just('gem1')) { this.index = 0; this.refresh(); }   // 1, 2, 3 escolhem a arma direto
    if (c.just('gem2')) { this.index = 1; this.refresh(); }
    if (c.just('gem3')) { this.index = 2; this.refresh(); }
    if (c.keyJust('confirm')) this.confirm();                  // só o teclado: o clique já confirma pelo card
  }
}
