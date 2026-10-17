import { GAME_W, GAME_H } from '../config.js';
import Controls from '../systems/controls.js';
import { createParallax } from '../systems/parallax.js';
import { uiStyle } from '../systems/ui-style.js';
import { initAudio, toggleMute } from '../systems/sfx.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.controls = new Controls(this);
    this.parallax = createParallax(this);
    this.scroll = 0;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.55).setOrigin(0).setDepth(5);

    const cx = GAME_W / 2;
    this.add.text(cx, 100, 'GARIBALDO', uiStyle(64, '#ffe27a')).setOrigin(0.5).setDepth(6);
    this.add.text(cx, 152, 'GUERRA ARCANA', uiStyle(22, '#e3b8ff')).setOrigin(0.5).setDepth(6);

    const lines = [
      ['Mover', 'A / D  ou  setas'],
      ['Pular', 'Espaço  ou  W'],
      ['Ataque FRACO', 'clique esquerdo  (ou J)'],
      ['Ataque FORTE', 'clique direito  (ou K)'],
      ['Mirar (arco e anel)', 'cursor do mouse'],
      ['Rolar (invulnerável)', 'Shift  ou  C'],
      ['Agachar / descer', 'S  /  S + Espaço'],
      ['Elemento', '1  2  3   ou   Q / E'],
      ['Habilidade', 'L  ou  V (barra cheia)'],
    ];
    lines.forEach(([a, b], i) => {
      this.add.text(cx - 20, 190 + i * 22, a, uiStyle(15, '#dddddd')).setOrigin(1, 0.5).setDepth(6);
      this.add.text(cx + 20, 190 + i * 22, b, uiStyle(15, '#9fe8ff')).setOrigin(0, 0.5).setDepth(6);
    });
    this.add.text(cx, 420, 'Escolha uma arma: Espada, Arco ou Anel  ·  o elemento (fogo, gelo, raio) vale para todas', uiStyle(13, '#ffb98a')).setOrigin(0.5).setDepth(6);
    this.add.text(cx, 440, 'Role por dentro dos ataques para esquivar · atacar pelas costas causa golpe crítico', uiStyle(13, '#ffb98a')).setOrigin(0.5).setDepth(6);
    const start = this.add.text(cx, 488, 'ENTER para começar', uiStyle(24)).setOrigin(0.5).setDepth(6);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
  }

  update(time, delta) {
    this.controls.poll();
    this.scroll += delta * 0.04;
    this.parallax.update(this.scroll);
    if (this.controls.just('mute')) toggleMute();
    if (this.controls.just('confirm')) {
      initAudio();
      this.scene.start('Select');
    }
  }
}
