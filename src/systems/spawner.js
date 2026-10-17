import { HALL, RUN, ELITE, EVENTS, spawnRate, spawnMix, hpScale } from '../config.js';

// Faz os inimigos aparecerem em horda crescente ao redor do herói (fora da tela), com eventos de
// "anel" e o chefe no fim. O tempo da partida é `scene.time` (segundos).
export default class Spawner {
  constructor(scene) {
    this.s = scene;
    this.acc = 0;
    this.nextEvent = EVENTS.map(e => e.from);
    this.bossDone = false;
  }

  update(dt) {
    const s = this.s, t = s.time;
    if (!this.bossDone && t >= RUN.bossAt) { this.bossDone = true; this.spawnBoss(); }

    // ritmo normal (cai pela metade enquanto o chefe está vivo)
    this.acc += spawnRate(t) * (s.boss ? 0.5 : 1) * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      if (s.enemies.length >= RUN.maxEnemies) break;
      const type = this.pick(spawnMix(t)), p = this.edge(680 + Math.random() * 140);
      s.spawnEnemy(type, p.x, p.y, { hpMul: hpScale(t), elite: t > ELITE.from && type !== 'bat' && Math.random() < ELITE.chance });
    }
    // eventos: um anel de inimigos fecha o cerco
    EVENTS.forEach((ev, i) => {
      if (t >= this.nextEvent[i]) {
        this.nextEvent[i] += ev.every;
        const n = ev.count(t);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2, p = this.clamp(s.hero.x + Math.cos(a) * 560, s.hero.y + Math.sin(a) * 560);
          s.spawnEnemy(ev.type, p.x, p.y, { hpMul: hpScale(t) });
        }
        s.banner('A HORDA SE APROXIMA!', 1.8);
      }
    });
  }

  pick(mix) {
    const total = Object.values(mix).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [type, w] of Object.entries(mix)) { r -= w; if (r <= 0) return type; }
    return 'ghoul';
  }

  clamp(x, y) {
    const m = HALL.wall + 30;
    return { x: Phaser.Math.Clamp(x, m, HALL.w - m), y: Phaser.Math.Clamp(y, m, HALL.h - m) };
  }

  // ponto aleatório a `r` pixels do herói (se cair fora da sala, é empurrado para dentro)
  edge(r) {
    const h = this.s.hero, a = Math.random() * Math.PI * 2;
    return this.clamp(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r);
  }

  spawnBoss() {
    const s = this.s, h = s.hero;
    // nasce do lado mais distante do centro, para a luta ter espaço
    const a = Math.atan2(HALL.h / 2 - h.y, HALL.w / 2 - h.x), p = this.clamp(h.x + Math.cos(a) * 480, h.y + Math.sin(a) * 480);
    s.boss = s.spawnEnemy('boss', p.x, p.y, { hpMul: 1 });
    s.banner('O SENHOR DEMÔNIO CHEGOU!', 3);
    s.fx.shake(14);
  }
}
