import { GAME_W, GAME_H, HERO, RUN, xpNeeded } from '../config.js';
import { WEAPONS } from '../weapons.js';
import { PASSIVES } from '../upgrades.js';
import { uiStyle, FONT } from '../systems/ui-style.js';
import { isMuted } from '../systems/sfx.js';

const HP_BAR = { x: 34, y: 18, w: 220, h: 20 };
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// HUD por cima do jogo: vida, XP, tempo, armas e melhorias, chefe, escolha de melhoria e fim de partida.
export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.g = this.add.graphics();
    this.heart = this.add.image(18, 28, 'items', 11).setScale(0.8);
    this.hpText = this.add.text(HP_BAR.x + HP_BAR.w / 2, HP_BAR.y + HP_BAR.h / 2, '', uiStyle(12)).setOrigin(0.5);
    this.hpShown = 0; this.hpTrail = 0; this.hpOwner = null;
    this.levelText = this.add.text(14, 54, '', uiStyle(14, '#d9a0ff')).setOrigin(0, 0.5);
    this.dashText = this.add.text(92, 54, 'ROLAR [Espaço]', uiStyle(10, '#9fe8ff')).setOrigin(0, 0.5);
    this.timeText = this.add.text(GAME_W / 2, 30, '', uiStyle(24, '#ffe27a')).setOrigin(0.5);
    this.statText = this.add.text(GAME_W - 14, 22, '', uiStyle(14, '#ffffff')).setOrigin(1, 0.5);
    this.bossName = this.add.text(GAME_W / 2, 64, '', uiStyle(13, '#ffd6ff')).setOrigin(0.5);
    this.bannerText = this.add.text(GAME_W / 2, 150, '', uiStyle(32)).setOrigin(0.5);
    this.hudSig = ''; this.hudObjs = [];
    this.cardObjs = []; this.cardRef = null; this.hover = -1;
    this.overlay = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.6).setOrigin(0).setVisible(false);
    this.big = this.add.text(GAME_W / 2, 150, '', uiStyle(48)).setOrigin(0.5);
    this.sub = this.add.text(GAME_W / 2, 220, '', { ...uiStyle(18), align: 'center', lineSpacing: 8 }).setOrigin(0.5, 0);
    this.hint = this.add.text(GAME_W / 2, GAME_H - 70, '', uiStyle(20, '#ffe27a')).setOrigin(0.5);
    this.muteText = this.add.text(GAME_W - 14, GAME_H - 16, '', { fontFamily: FONT, fontSize: '12px', color: '#888888' }).setOrigin(1, 0.5);
  }

  update() {
    const hall = this.scene.get('Hall');
    const visible = !!(hall && hall.ready && this.scene.isActive('Hall'));
    this.cameras.main.setVisible(visible);
    if (!visible) return;
    const h = hall.hero, g = this.g;
    g.clear();

    this.drawHealth(g, h);
    this.drawXp(g, h);
    this.timeText.setText(fmt(hall.time));
    this.statText.setText(`caveiras ${h.kills}    ouro ${h.gold}`);
    this.drawDash(g, h);
    this.drawLoadout(h);
    this.drawBoss(g, hall);
    this.bannerText.setText(hall.bannerText).setAlpha(Phaser.Math.Clamp(hall.bannerT * 2, 0, 1));
    this.drawCards(hall);
    this.drawOverlay(hall);
    this.muteText.setText(isMuted() ? '♪ mudo (M)' : '');
  }

  // barra de vida com rastro do dano recente
  drawHealth(g, h) {
    const { x, y, w, hgt = HP_BAR.h } = HP_BAR, hh = HP_BAR.h;
    if (this.hpOwner !== h) { this.hpOwner = h; this.hpShown = this.hpTrail = h.hp; }
    this.hpShown += (h.hp - this.hpShown) * 0.25;
    if (h.hp > this.hpTrail) this.hpTrail = h.hp; else this.hpTrail += (h.hp - this.hpTrail) * 0.04;
    const pct = h.hp / h.maxHp, fill = k => Math.max(0, w * k / h.maxHp);
    g.fillStyle(0x120a1a).fillRect(x - 2, y - 2, w + 4, hh + 4);
    g.fillStyle(0x2a1a2a).fillRect(x, y, w, hh);
    g.fillStyle(0xffffff, 0.85).fillRect(x, y, fill(this.hpTrail), hh);
    g.fillStyle(pct > 0.5 ? 0x4cd964 : pct > 0.25 ? 0xf5c542 : 0xff4d6d).fillRect(x, y, fill(this.hpShown), hh);
    g.fillStyle(0xffffff, 0.25).fillRect(x, y, fill(this.hpShown), 5);
    if (pct <= 0.25 && h.alive && Math.floor(this.time * 8) % 2) g.lineStyle(2, 0xff4d6d).strokeRect(x - 2, y - 2, w + 4, hh + 4);
    this.hpText.setText(`${Math.ceil(h.hp)} / ${h.maxHp}`);
  }

  // barra de XP em toda a largura da tela
  drawXp(g, h) {
    const k = Phaser.Math.Clamp(h.xp / xpNeeded(h.level), 0, 1);
    g.fillStyle(0x120a1a).fillRect(0, 0, GAME_W, 10);
    g.fillStyle(0x7a3bd0).fillRect(0, 0, GAME_W * k, 10);
    g.fillStyle(0xd9a0ff, 0.6).fillRect(0, 0, GAME_W * k, 3);
    this.levelText.setText(`NÍVEL ${h.level}`);
  }

  drawDash(g, h) {
    const k = 1 - Phaser.Math.Clamp(h.dashCd / HERO.dash.cd, 0, 1);
    g.fillStyle(0x120a1a).fillRect(14, 62, 70, 8);
    g.fillStyle(k >= 1 ? 0x9fe8ff : 0x4a6a8a).fillRect(15, 63, 68 * k, 6);
    this.dashText.setPosition(92, 66).setColor(k >= 1 ? '#9fe8ff' : '#6a7a8a');
  }

  // armas (com nível) e melhorias passivas, embaixo à esquerda
  drawLoadout(h) {
    const sig = h.weapons.map(w => `${w.id}${w.level}`).join(',') + '|' + Object.entries(h.passives).map(([k, v]) => `${k}${v}`).join(',');
    if (sig === this.hudSig) return;
    this.hudSig = sig;
    for (const o of this.hudObjs) o.destroy();
    this.hudObjs = [];
    const small = { fontFamily: FONT, fontSize: '10px', color: '#ffffff', stroke: '#120a1a', strokeThickness: 3 };
    h.weapons.forEach((w, i) => {
      const x = 14 + i * 56, y = GAME_H - 60;
      this.hudObjs.push(
        this.add.rectangle(x, y, 50, 50, 0x000000, 0.5).setOrigin(0).setStrokeStyle(2, WEAPONS[w.id].color),
        this.add.image(x + 25, y + 25, 'items', WEAPONS[w.id].icon),
        this.add.text(x + 47, y + 47, `${w.level}`, small).setOrigin(1, 1),
      );
    });
    Object.entries(h.passives).forEach(([id, lv], i) => {
      const x = 14 + i * 30, y = GAME_H - 96;
      this.hudObjs.push(
        this.add.rectangle(x, y, 26, 26, 0x000000, 0.45).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.3),
        this.add.image(x + 13, y + 13, 'items', PASSIVES[id].icon).setScale(0.7),
        this.add.text(x + 25, y + 25, `${lv}`, small).setOrigin(1, 1),
      );
    });
  }

  drawBoss(g, hall) {
    const b = hall.boss;
    if (!b || b.dead) { this.bossName.setText(''); return; }
    const w = 360, x = (GAME_W - w) / 2, y = 78, k = Phaser.Math.Clamp(b.hp / b.maxHp, 0, 1);
    g.fillStyle(0x120a1a).fillRect(x - 2, y - 2, w + 4, 16);
    g.fillStyle(b.hp < b.maxHp * 0.5 ? 0xff3355 : 0xc04bff).fillRect(x, y, w * k, 12);
    this.bossName.setText(b.def.name).setPosition(GAME_W / 2, y - 12);
  }

  // escolha de melhoria ao subir de nível: 3 cartas (teclas 1 2 3 ou clique)
  drawCards(hall) {
    if (hall.cards !== this.cardRef) {
      for (const o of this.cardObjs) o.destroy();
      this.cardObjs = []; this.cardRef = hall.cards; this.hover = -1;
      if (hall.cards) this.buildCards(hall);
    }
  }

  buildCards(hall) {
    const cards = hall.cards, W = 230, Hh = 290, gap = 24, total = cards.length * W + (cards.length - 1) * gap;
    const x0 = (GAME_W - total) / 2, y0 = 130;
    const veil = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.7).setOrigin(0).setInteractive();
    const title = this.add.text(GAME_W / 2, 74, `NÍVEL ${hall.hero.level}!`, uiStyle(40, '#ffe27a')).setOrigin(0.5);
    const sub = this.add.text(GAME_W / 2, 108, 'escolha uma melhoria  ·  teclas 1, 2, 3  ou  clique', uiStyle(14, '#dddddd')).setOrigin(0.5);
    this.cardObjs.push(veil, title, sub);
    cards.forEach((c, i) => {
      const x = x0 + i * (W + gap), cx = x + W / 2;
      const color = c.kind === 'weapon' ? (WEAPONS[c.id] ? WEAPONS[c.id].color : 0xffffff) : 0x9b5bff;
      const bg = this.add.rectangle(x, y0, W, Hh, 0x14101f, 0.96).setOrigin(0).setStrokeStyle(3, color);
      const icon = this.add.image(cx, y0 + 70, 'items', c.icon).setScale(2.4);
      const tag = c.kind === 'weapon' ? (c.isNew ? 'NOVA ARMA' : 'ARMA') : (c.kind === 'passive' ? 'MELHORIA' : 'ESPECIAL');
      const t1 = this.add.text(cx, y0 + 22, tag, uiStyle(11, '#aaaaaa')).setOrigin(0.5);
      const name = this.add.text(cx, y0 + 128, c.name.toUpperCase(), uiStyle(20)).setOrigin(0.5);
      const lv = this.add.text(cx, y0 + 154, c.kind === 'heal' ? '' : (c.isNew ? 'NOVO' : `Nível ${c.level}`), uiStyle(13, c.isNew ? '#ffe27a' : '#9fe8ff')).setOrigin(0.5);
      const desc = this.add.text(cx, y0 + 184, c.desc, { ...uiStyle(13, '#e8e0ff'), wordWrap: { width: W - 28 }, align: 'center', strokeThickness: 2 }).setOrigin(0.5, 0);
      const key = this.add.text(cx, y0 + Hh - 22, `[ ${i + 1} ]`, uiStyle(16, '#ffe27a')).setOrigin(0.5);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { bg.setStrokeStyle(5, 0xffe27a); });
      bg.on('pointerout', () => { bg.setStrokeStyle(3, color); });
      bg.on('pointerdown', p => { if (p.button === 0) hall.chooseCard(i); });
      this.cardObjs.push(bg, icon, t1, name, lv, desc, key);
    });
  }

  // pausa e telas de fim de partida
  drawOverlay(hall) {
    let big = '', sub = '', hint = '', color = '#ffffff', show = false;
    if (hall.paused) { show = true; big = 'PAUSADO'; hint = 'P para continuar'; }
    else if (hall.state === 'dead' || hall.state === 'win') {
      const r = hall.result;
      if (r) {
        show = true;
        big = r.won ? 'VITÓRIA!' : 'VOCÊ CAIU'; color = r.won ? '#ffe27a' : '#ff4d6d';
        sub = `Tempo: ${fmt(r.time)}     Nível: ${r.level}     Caveiras: ${r.kills}\nOuro desta partida: ${r.gold}     Ouro guardado: ${r.totalGold}\nMelhor tempo: ${fmt(r.best)}`;
        hint = 'R jogar de novo   ·   T trocar de arma';
      }
    }
    this.overlay.setVisible(show);
    this.big.setText(big).setColor(color);
    this.sub.setText(sub);
    this.hint.setText(hint);
  }
}
