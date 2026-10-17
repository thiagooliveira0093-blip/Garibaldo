import { GAME_W, GAME_H, HIT_DAMAGE } from '../config.js';
import { FRAME } from '../assets.js';
import { uiStyle, FONT } from '../systems/ui-style.js';
import { isMuted } from '../systems/sfx.js';

const HP_BAR = { x: 34, y: 12, w: 200, h: 20 };

// HUD desenhado por cima do jogo. Só lê o estado da GameScene.
export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.g = this.add.graphics();
    this.heartIcon = this.add.image(18, 22, 'proj', FRAME.heart).setScale(1.3);
    this.hpText = this.add.text(HP_BAR.x + HP_BAR.w / 2, HP_BAR.y + HP_BAR.h / 2, '', uiStyle(12)).setOrigin(0.5);
    this.hpPlayer = null; this.hpShown = 0; this.hpTrail = 0;
    this.energyText = this.add.text(186, 51, 'ARCANO', uiStyle(12, '#d7c4ff')).setOrigin(0, 0.5);
    this.slots = []; this.slotChar = null;
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

  // Barra de vida: enche e esvazia suavemente, com um rastro claro do dano recente.
  // Divisões a cada HIT_DAMAGE mostram quantos golpes aguenta; fica vermelha e pisca quando baixa.
  drawHealth(g, p, blink) {
    const { x, y, w, h } = HP_BAR;
    if (this.hpPlayer !== p) { this.hpPlayer = p; this.hpShown = this.hpTrail = p.hp; }
    this.hpShown += (p.hp - this.hpShown) * 0.25;
    if (p.hp > this.hpTrail) this.hpTrail = p.hp; else this.hpTrail += (p.hp - this.hpTrail) * 0.04;
    const pct = p.hp / p.maxHp, fill = k => Math.max(0, w * k / p.maxHp);
    g.fillStyle(0x120a1a).fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle(0x2a1a2a).fillRect(x, y, w, h);
    g.fillStyle(0xffffff, 0.85).fillRect(x, y, fill(this.hpTrail), h);
    g.fillStyle(pct > 0.5 ? 0x4cd964 : pct > 0.25 ? 0xf5c542 : 0xff4d6d).fillRect(x, y, fill(this.hpShown), h);
    g.fillStyle(0xffffff, 0.25).fillRect(x, y, fill(this.hpShown), 5);
    g.fillStyle(0x000000, 0.35);
    for (let v = HIT_DAMAGE; v < p.maxHp; v += HIT_DAMAGE) g.fillRect(x + (w * v) / p.maxHp - 1, y, 2, h);
    if (pct <= 0.25 && p.alive && blink) g.lineStyle(2, 0xff4d6d).strokeRect(x - 2, y - 2, w + 4, h + 4);
    this.hpText.setText(`${Math.ceil(p.hp)} / ${p.maxHp}`);
  }

  // as 3 armas/poderes do personagem escolhido (teclas 1, 2, 3)
  buildSlots(char) {
    for (const sl of this.slots) { sl.icon.destroy(); sl.name.destroy(); sl.key.destroy(); }
    this.slotChar = char.id;
    this.slots = char.powers.map((pw, i) => {
      const x = 14 + i * 74, y = GAME_H - 52;
      return {
        x, y,
        icon: this.add.image(x + 16, y + 20, pw.icon.sheet, pw.icon.frame).setBlendMode(pw.solid ? 'NORMAL' : 'ADD'),
        name: this.add.text(x + 30, y + 14, pw.name, uiStyle(12)).setOrigin(0, 0.5),
        key: this.add.text(x + 30, y + 28, pw.key, { fontFamily: FONT, fontSize: '10px', color: '#888888' }).setOrigin(0, 0.5),
      };
    });
  }

  update() {
    const gs = this.scene.get('Game');
    const visible = !!(gs && gs.ready && this.scene.isActive('Game'));
    this.cameras.main.setVisible(visible);
    if (!visible) return;

    const p = gs.player, g = this.g;
    if (this.slotChar !== p.char.id) this.buildSlots(p.char);
    g.clear();

    const full = p.energy >= 100, blink = Math.floor(gs.elapsed * 8) % 2;
    this.drawHealth(g, p, blink);
    g.fillStyle(0x120a1a).fillRect(14, 44, 164, 14);
    g.fillStyle(full ? (blink ? 0xffffff : 0xe38bff) : 0x9b5bff).fillRect(16, 46, 160 * (p.energy / 100), 10);
    const label = p.char.special.label;
    this.energyText.setText(full ? `${label} PRONTO! [L]` : label).setColor(full ? '#ffe27a' : '#d7c4ff');

    this.slots.forEach((sl, i) => {
      const sel = i === p.power, pw = p.powers[i];
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
      sub = `Pontos: ${gs.score}   ·   Recorde: ${gs.best}`; hint = 'R tentar de novo   ·   T trocar de herói';
    } else if (gs.state === 'win') {
      big = 'MISSÃO COMPLETA!'; bigColor = '#ffe27a'; tint = 0x0a1a30;
      sub = `Pontos: ${gs.score}   ·   Tempo: ${gs.elapsed.toFixed(1)}s   ·   Vida: ${Math.ceil(p.hp)}/${p.maxHp}`; hint = 'R jogar de novo   ·   T trocar de herói';
    }
    this.overlay.setVisible(!!big).setFillStyle(tint, 0.6);
    this.big.setText(big).setColor(bigColor);
    this.sub.setText(sub);
    this.hint.setText(hint);
    this.muteText.setText(isMuted() ? '♪ mudo (M)' : '');
  }
}
