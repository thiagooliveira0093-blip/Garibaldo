import { GAME_W, GAME_H, POWERS } from '../config.js';
import { FRAME } from '../assets.js';
import { uiStyle, FONT } from '../systems/ui-style.js';
import { isMuted } from '../systems/sfx.js';

// HUD desenhado por cima do jogo. Só lê o estado da GameScene.
export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.g = this.add.graphics();
    this.hearts = Array.from({ length: 10 }, (_, i) => this.add.image(24 + i * 26, 26, 'proj', FRAME.heart).setVisible(false));
    this.energyText = this.add.text(186, 51, 'ARCANO', uiStyle(12, '#d7c4ff')).setOrigin(0, 0.5);
    this.slots = POWERS.map((pw, i) => {
      const x = 14 + i * 74, y = GAME_H - 52;
      return {
        x, y,
        icon: this.add.image(x + 16, y + 20, 'proj', pw.hand).setBlendMode('ADD'),
        name: this.add.text(x + 30, y + 14, pw.name, uiStyle(12)).setOrigin(0, 0.5),
        key: this.add.text(x + 30, y + 28, pw.key, { fontFamily: FONT, fontSize: '10px', color: '#888888' }).setOrigin(0, 0.5),
      };
    });
    this.scoreText = this.add.text(GAME_W / 2, 26, '', uiStyle(22, '#ffe27a')).setOrigin(0.5);
    this.comboText = this.add.text(GAME_W / 2, 50, '', uiStyle(14, '#ff9b3d')).setOrigin(0.5);
    this.bossName = this.add.text(GAME_W - 334, 44, '', uiStyle(12, '#ffd6ff')).setOrigin(0, 0.5);
    this.go = this.add.text(GAME_W - 90, GAME_H / 2 - 40, 'GO ➜', uiStyle(34, '#ffe27a')).setOrigin(0.5);
    this.bannerText = this.add.text(GAME_W / 2, 150, '', uiStyle(34)).setOrigin(0.5);
    this.overlay = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.55).setOrigin(0);
    this.big = this.add.text(GAME_W / 2, GAME_H / 2 - 44, '', uiStyle(50)).setOrigin(0.5);
    this.sub = this.add.text(GAME_W / 2, GAME_H / 2 + 12, '', uiStyle(18)).setOrigin(0.5);
    this.hint = this.add.text(GAME_W / 2, GAME_H / 2 + 54, '', uiStyle(20, '#ffe27a')).setOrigin(0.5);
    this.muteText = this.add.text(GAME_W - 14, GAME_H - 16, '', { fontFamily: FONT, fontSize: '12px', color: '#888888' }).setOrigin(1, 0.5);
  }

  update() {
    const gs = this.scene.get('Game');
    const visible = !!(gs && gs.ready && this.scene.isActive('Game'));
    this.cameras.main.setVisible(visible);
    if (!visible) return;

    const p = gs.player, g = this.g;
    g.clear();

    this.hearts.forEach((h, i) => h.setVisible(i < p.maxHp).setTint(i < p.hp ? 0xffffff : 0x3a2a3a));

    const full = p.energy >= 100, blink = Math.floor(gs.elapsed * 8) % 2;
    g.fillStyle(0x120a1a).fillRect(14, 44, 164, 14);
    g.fillStyle(full ? (blink ? 0xffffff : 0xe38bff) : 0x9b5bff).fillRect(16, 46, 160 * (p.energy / 100), 10);
    this.energyText.setText(full ? 'ARCANO PRONTO! [L]' : 'ARCANO').setColor(full ? '#ffe27a' : '#d7c4ff');

    this.slots.forEach((sl, i) => {
      const sel = i === p.power, pw = POWERS[i];
      g.fillStyle(sel ? 0xffffff : 0x000000, sel ? 0.13 : 0.4).fillRect(sl.x, sl.y, 68, 40);
      g.lineStyle(sel ? 2 : 1, sel ? pw.color : 0xffffff, sel ? 1 : 0.2).strokeRect(sl.x + 0.5, sl.y + 0.5, 67, 39);
      sl.name.setColor(sel ? '#ffffff' : '#aaaaaa');
      if (sel && p.cd > 0) {
        const k = Math.min(1, p.cd / pw.cd);
        g.fillStyle(0x000000, 0.5).fillRect(sl.x, sl.y + 40 - 40 * k, 68, 40 * k);
      }
    });

    this.scoreText.setText(String(gs.score).padStart(7, '0'));
    this.comboText.setText(gs.combo > 1 ? `COMBO x${gs.combo}` : '');

    const boss = gs.enemies.getChildren().find(e => e.kind === 'boss' && !e.dead);
    if (boss) {
      const pct = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
      g.fillStyle(0x120a1a).fillRect(GAME_W - 334, 18, 320, 16);
      g.fillStyle(boss.p2 ? 0xff3355 : 0xc04bff).fillRect(GAME_W - 332, 20, 316 * pct, 12);
      this.bossName.setText(boss.def.name);
    } else this.bossName.setText('');

    this.go.setVisible(gs.goT > 0 && !gs.waves.active && Math.floor(gs.goT * 3) % 2 === 0);
    this.bannerText.setText(gs.bannerText).setAlpha(Phaser.Math.Clamp(gs.bannerT * 2, 0, 1));
    if (gs.slowT > 0) g.fillStyle(0x78c8ff, 0.08).fillRect(0, 0, GAME_W, GAME_H);

    let big = '', sub = '', hint = '', bigColor = '#ffffff', tint = 0x000000;
    if (gs.paused) { big = 'PAUSADO'; hint = 'P para continuar'; }
    else if (gs.state === 'dead') {
      big = 'VOCÊ CAIU'; bigColor = '#ff4d6d'; tint = 0x300a14;
      sub = `Pontos: ${gs.score}   ·   Recorde: ${gs.best}`; hint = 'R para tentar de novo';
    } else if (gs.state === 'win') {
      big = 'MISSÃO COMPLETA!'; bigColor = '#ffe27a'; tint = 0x0a1a30;
      sub = `Pontos: ${gs.score}   ·   Tempo: ${gs.elapsed.toFixed(1)}s   ·   Vidas: ${p.hp}`; hint = 'R para jogar de novo';
    }
    this.overlay.setVisible(!!big).setFillStyle(tint, 0.6);
    this.big.setText(big).setColor(bigColor);
    this.sub.setText(sub);
    this.hint.setText(hint);
    this.muteText.setText(isMuted() ? '♪ mudo (M)' : '');
  }
}
