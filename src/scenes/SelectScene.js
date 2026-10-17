import { GAME_W, GAME_H } from '../config.js';
import { WEAPON_LIST } from '../weapons.js';
import Controls from '../systems/controls.js';
import { uiStyle } from '../systems/ui-style.js';
import { initAudio, toggleMute } from '../systems/sfx.js';
import { menuBackdrop } from './TitleScene.js';

const CARD_W = 270, CARD_H = 380, CARD_Y = 256;
const HOW = {
  sword: 'Golpeia em arco o inimigo mais próximo e os que estiverem perto dele. Forte contra grupos colados em você.',
  bow: 'Dispara flechas no inimigo mais próximo, mesmo de longe. Com melhorias atravessa fileiras inteiras.',
  ring: 'Orbes de magia giram em torno de você e ferem tudo que encostar. Boa para andar no meio da horda.',
};

// Escolha da arma inicial. As outras armas aparecem depois como melhorias ao subir de nível.
export default class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  create() {
    this.controls = new Controls(this);
    menuBackdrop(this, false);
    this.add.text(GAME_W / 2, 40, 'ESCOLHA SUA ARMA INICIAL', uiStyle(30, '#ffe27a')).setOrigin(0.5);
    const saved = WEAPON_LIST.findIndex(w => w.id === this.registry.get('weapon'));
    this.index = Math.max(0, saved);
    this.cards = WEAPON_LIST.map((w, i) => this.buildCard(w, i));
    this.add.text(GAME_W / 2, 480, 'As armas atacam sozinhas. Você só se move e rola (Espaço).', uiStyle(14, '#9fe8ff')).setOrigin(0.5);
    this.add.text(GAME_W / 2, 510, '◄ ►  escolher    ·    ENTER ou clique  confirmar', uiStyle(14, '#dddddd')).setOrigin(0.5);
    this.t = 0;
    this.refresh(true);
  }

  buildCard(w, i) {
    const x = GAME_W / 2 + (i - 1) * 300;
    const c = this.add.container(x, CARD_Y);
    const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x120a1a, 0.9);
    const hero = this.add.sprite(0, -60, 'hero', 0).setOrigin(0.5, 56 / 64).setScale(2);
    const icon = this.add.image(-96, 12, 'items', w.icon).setScale(1.7);
    const name = this.add.text(-68, 12, w.name.toUpperCase(), uiStyle(28)).setOrigin(0, 0.5);
    const how = this.add.text(0, 44, HOW[w.id], { ...uiStyle(13, '#dddddd'), wordWrap: { width: CARD_W - 32 }, align: 'center', strokeThickness: 2 }).setOrigin(0.5, 0);
    const ups = this.add.text(-CARD_W / 2 + 18, 124, 'MELHORIAS:', uiStyle(11, '#ffe27a')).setOrigin(0, 0);
    const list = this.add.text(-CARD_W / 2 + 18, 140, w.ups.slice(0, 3).map(u => `• ${u[0]}`).join('\n'), { ...uiStyle(11, '#cfc8e8'), wordWrap: { width: CARD_W - 32 }, strokeThickness: 2, lineSpacing: 3 }).setOrigin(0, 0);
    c.add([bg, hero, icon, name, how, ups, list]);
    c.bg = bg; c.hero = hero;
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
    this.scene.start('Hall');
  }

  update(time, delta) {
    const c = this.controls;
    c.poll();
    this.t += delta / 1000;
    for (const card of this.cards) card.hero.setFrame(Math.floor(this.t * 2.2) % 2);
    if (c.just('mute')) toggleMute();
    const n = WEAPON_LIST.length;
    if (c.just('left')) { this.index = (this.index + n - 1) % n; this.refresh(); }
    if (c.just('right')) { this.index = (this.index + 1) % n; this.refresh(); }
    if (c.just('pick1')) { this.index = 0; this.refresh(); }
    if (c.just('pick2')) { this.index = 1; this.refresh(); }
    if (c.just('pick3')) { this.index = 2; this.refresh(); }
    if (c.just('confirm')) this.confirm();
  }
}
