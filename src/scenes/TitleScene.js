import { GAME_W, GAME_H } from '../config.js';
import Controls from '../systems/controls.js';
import { uiStyle } from '../systems/ui-style.js';
import { loadSave } from '../systems/save.js';
import { initAudio, toggleMute } from '../systems/sfx.js';

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Fundo comum das telas de menu: piso de pedra escuro, dois braseiros e o Garibaldo parado.
export function menuBackdrop(scene, braziers = true) {
  scene.add.tileSprite(0, 0, GAME_W, GAME_H, 'floorTiles').setOrigin(0).setTileScale(1.2);
  scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x05030a, 0.7).setOrigin(0);
  if (braziers) for (const x of [90, GAME_W - 90]) scene.add.sprite(x, 430, 'props', 1).setOrigin(0.5, 88 / 96).setScale(1.6).play('brazier');
}

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.controls = new Controls(this);
    menuBackdrop(this);
    const cx = GAME_W / 2;
    this.hero = this.add.sprite(cx, 505, 'hero', 0).setOrigin(0.5, 56 / 64).setScale(1.7);
    this.add.text(cx, 84, 'GARIBALDO', uiStyle(68, '#ffe27a')).setOrigin(0.5);
    this.add.text(cx, 136, 'O SALÃO DOS TORMENTOS', uiStyle(22, '#e3b8ff')).setOrigin(0.5);

    const lines = [
      ['Mover', 'WASD  ou  setas'],
      ['Rolar (invulnerável)', 'Espaço  ou  Shift'],
      ['Atacar', 'automático! As armas acertam sozinhas'],
      ['Subir de nível', 'escolha com 1, 2, 3 ou clique'],
      ['Pausar', 'P'],
    ];
    lines.forEach(([a, b], i) => {
      this.add.text(cx - 14, 190 + i * 24, a, uiStyle(15, '#dddddd')).setOrigin(1, 0.5);
      this.add.text(cx + 14, 190 + i * 24, b, uiStyle(15, '#9fe8ff')).setOrigin(0, 0.5);
    });
    this.add.text(cx, 330, 'Sobreviva a hordas cada vez maiores até o Senhor Demônio chegar.', uiStyle(14, '#ffb98a')).setOrigin(0.5);
    const save = loadSave();
    this.add.text(cx, 354, `Ouro guardado: ${save.gold}     Melhor tempo: ${fmt(save.best)}`, uiStyle(13, '#ffe27a')).setOrigin(0.5);
    const start = this.add.text(cx, 400, 'ENTER para começar', uiStyle(26)).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    this.t = 0;
  }

  update(time, delta) {
    this.controls.poll();
    this.t += delta / 1000;
    this.hero.setFrame(Math.floor(this.t * 2.2) % 2);
    if (this.controls.just('mute')) toggleMute();
    if (this.controls.just('confirm')) { initAudio(); this.scene.start('Select'); }
  }
}
