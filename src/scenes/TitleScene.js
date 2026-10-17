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
      ['Pular', 'Espaço  ou  X'],
      ['Atirar poder (segure)', 'J  ou  Z'],
      ['Espada espiritual', 'F  ou  H'],
      ['Mirar cima / diagonal', 'W  ou  seta cima'],
      ['Agachar (desvia tiro baixo)', 'S  ou  seta baixo'],
      ['Descer da plataforma', 'baixo + Espaço'],
      ['Dash invencível', 'K / Shift / C'],
      ['Trocar poder', 'Q / E  ou  1 2 3'],
      ['Explosão Arcana', 'L  ou  V (barra cheia)'],
    ];
    lines.forEach(([a, b], i) => {
      this.add.text(cx - 20, 190 + i * 22, a, uiStyle(15, '#dddddd')).setOrigin(1, 0.5).setDepth(6);
      this.add.text(cx + 20, 190 + i * 22, b, uiStyle(15, '#9fe8ff')).setOrigin(0, 0.5).setDepth(6);
    });
    this.add.text(cx, 420, 'Fogo explode em área · Gelo perfura e deixa lento · Raio destrói tiros ROXOS', uiStyle(13, '#ffb98a')).setOrigin(0.5).setDepth(6);
    this.add.text(cx, 440, 'Passar raspando nos tiros e dar dash através deles enche a barra Arcana', uiStyle(13, '#ffb98a')).setOrigin(0.5).setDepth(6);
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
      this.scene.start('Game', { level: 0 });
    }
  }
}
