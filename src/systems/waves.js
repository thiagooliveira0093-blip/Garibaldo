import { GAME_W, ENEMIES } from '../config.js';

// Ondas estilo Metal Slug: a câmera anda junto com o player (sem voltar),
// trava ao chegar numa onda e só libera quando todos os inimigos dela morrem.
export default class Waves {
  constructor(scene, list) {
    this.s = scene;
    this.list = list;
    this.idx = 0;
    this.active = null;
    this.hasBoss = list.some(w => w.boss);
  }

  get allDone() { return this.idx >= this.list.length && !this.active; }

  update(dt) {
    const s = this.s, maxCam = s.mapW - GAME_W;
    if (!this.active) {
      const next = this.list[this.idx];
      const lockX = next ? Math.min(next.x, maxCam) : maxCam;
      const target = s.player.x - GAME_W * 0.4;
      s.camX = Math.max(s.camX, Math.min(target, lockX));
      if (next && s.camX >= lockX - 0.5) { s.camX = lockX; this.start(next); }
      return;
    }
    const w = this.active;
    w.t += dt;
    for (const sp of w.queue) if (!sp.done && w.t >= sp.delay) { sp.done = true; s.spawnEnemy(sp); }
    if (w.queue.every(q => q.done) && s.enemies.countActive(true) === 0 && s.winT <= 0) {
      this.idx++;
      this.active = null;
      if (this.idx < this.list.length) s.goT = 3;
    }
  }

  start(def) {
    this.active = { def, t: 0, queue: def.spawns.map(q => ({ ...q, done: false })) };
    if (def.boss) {
      const boss = def.spawns.find(q => q.type === 'boss');
      this.s.banner(`CHEFE: ${boss ? ENEMIES.boss.name : 'CHEFE'}`, 2.5);
    }
  }
}
