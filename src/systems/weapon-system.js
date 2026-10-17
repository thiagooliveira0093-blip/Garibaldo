import { WEAPONS } from '../weapons.js';
import { ITEM } from '../assets.js';
import { sfx } from './sfx.js';

// As armas do herói atacam sozinhas, sempre no inimigo mais próximo.
// Cada arma do herói é { id, level, st (atributos já com as melhorias), timer }.
export default class WeaponSystem {
  constructor(scene) {
    this.s = scene;
  }

  update(dt) {
    for (const w of this.s.hero.weapons) {
      if (w.id === 'sword') this.sword(w, dt);
      else if (w.id === 'bow') this.bow(w, dt);
      else this.ring(w, dt);
    }
  }

  // ---------------------------------------------------------------- espada
  sword(w, dt) {
    const s = this.s, h = s.hero, st = w.st;
    w.timer -= dt;
    if (w.timer > 0) return;
    const target = s.nearestEnemy(h.x, h.y, st.reach * 1.5);
    if (!target) return;                                       // só golpeia quando tem alguém ao alcance
    w.timer = st.cd * h.cdMul;
    const a = Math.atan2(target.y - (h.y - 20), target.x - h.x);
    this.swing(st, a);
    if (st.back) this.swing(st, a + Math.PI);
    sfx('slash');
  }

  swing(st, a) {
    const s = this.s, h = s.hero, cy = h.y - 20;
    s.fx.swing(h.x, cy, a, st.arc, st.reach * 0.85, WEAPONS.sword.color);
    for (const e of s.nearEnemies(h.x, cy, st.reach)) {
      const ea = Math.atan2(e.y - cy, e.x - h.x);
      if (Math.abs(Phaser.Math.Angle.Wrap(ea - a)) <= st.arc / 2 + 0.15) s.hurtEnemy(e, st.dmg, { knock: st.knock, angle: ea });
    }
    if (st.wave) s.shootHero({ x: h.x, y: cy, angle: a, speed: 380, dmg: st.dmg * 0.6, pierce: 99, life: 0.75, frame: ITEM.spark, scale: 2.6, tint: 0xcfd8e6 });
  }

  // ---------------------------------------------------------------- arco
  bow(w, dt) {
    const s = this.s, h = s.hero, st = w.st;
    w.timer -= dt;
    if (w.timer > 0) return;
    const target = s.nearestEnemy(h.x, h.y, st.range);
    if (!target) return;
    w.timer = st.cd * h.cdMul;
    const a = Math.atan2(target.y - (h.y - 24), target.x - h.x), spread = 0.13;
    for (let i = 0; i < st.count; i++) {
      s.shootHero({ x: h.x, y: h.y - 24, angle: a + (i - (st.count - 1) / 2) * spread, speed: st.speed, dmg: st.dmg, pierce: st.pierce, life: st.range / st.speed, frame: ITEM.arrow, scale: 1 });
    }
    sfx('bolt');
  }

  // ---------------------------------------------------------------- anel: orbes que giram + nova
  ring(w, dt) {
    const s = this.s, h = s.hero, st = w.st;
    if (!w.orbs) { w.orbs = []; w.angle = 0; w.hits = new Map(); w.novaT = st.novaCd; }
    const frame = h.ice > h.fire && h.ice >= h.bolt ? ITEM.orbIce : h.bolt > h.fire && h.bolt > h.ice ? ITEM.orbBolt : ITEM.orbFire;
    while (w.orbs.length < st.count) w.orbs.push(s.add.sprite(h.x, h.y, 'items', frame).setBlendMode('ADD'));
    while (w.orbs.length > st.count) w.orbs.pop().destroy();
    w.angle += st.speed * (1 / Math.max(0.5, h.cdMul)) * dt;
    for (const [e, t] of w.hits) { if (e.dead || t - dt <= 0) w.hits.delete(e); else w.hits.set(e, t - dt); }   // recarga do toque em cada inimigo

    w.orbs.forEach((o, i) => {
      const a = w.angle + (i / st.count) * Math.PI * 2;
      const ox = h.x + Math.cos(a) * st.radius, oy = h.y - 22 + Math.sin(a) * st.radius * 0.8;     // órbita achatada (visão de cima)
      o.setPosition(ox, oy).setFrame(frame).setScale(st.size / 13).setDepth(oy + 40);
      for (const e of s.nearEnemies(ox, oy, st.size)) {
        if (w.hits.has(e)) continue;
        w.hits.set(e, st.tick);
        s.hurtEnemy(e, st.dmg, { knock: 90, angle: Math.atan2(e.y - oy, e.x - ox) });
      }
    });

    if (st.nova) {                                             // nova periódica ao redor do herói
      w.novaT -= dt;
      if (w.novaT <= 0) {
        w.novaT = st.novaCd * h.cdMul;
        s.fx.ring(h.x, h.y - 20, 0xf0c14b); s.fx.burst(h.x, h.y - 20, 0xf0c14b, 18, 300, 0, 500);
        for (const e of s.nearEnemies(h.x, h.y, 175)) s.hurtEnemy(e, st.dmg * 2.4, { knock: 300, angle: Math.atan2(e.y - h.y, e.x - h.x) });
        sfx('special');
      }
    }
  }
}
