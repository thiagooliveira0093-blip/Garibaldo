// Melhorias passivas e a escolha de cartas ao subir de nível.
import { WEAPONS } from './weapons.js';

// icon = quadro em items.png · apply(hero) altera o herói
export const PASSIVES = {
  vida:        { name: 'Vigor',      icon: 11, max: 5, desc: '+20 de vida máxima (e cura 20)',       apply: h => { h.maxHp += 20; h.hp = Math.min(h.maxHp, h.hp + 20); } },
  velocidade:  { name: 'Botas',      icon: 12, max: 5, desc: '+8% de velocidade',                    apply: h => { h.speedMul *= 1.08; } },
  dano:        { name: 'Fúria',      icon: 13, max: 5, desc: '+12% de dano em todas as armas',       apply: h => { h.dmgMul += 0.12; } },
  recarga:     { name: 'Clepsidra',  icon: 14, max: 5, desc: 'Armas 8% mais rápidas',                apply: h => { h.cdMul *= 0.92; } },
  coleta:      { name: 'Ímã',        icon: 15, max: 5, desc: '+30% de alcance para coletar',         apply: h => { h.pickupMul += 0.3; } },
  xp:          { name: 'Sabedoria',  icon: 16, max: 5, desc: '+15% de XP ganho',                     apply: h => { h.xpMul += 0.15; } },
  armadura:    { name: 'Escudo',     icon: 17, max: 5, desc: '-1 de dano em cada golpe recebido',    apply: h => { h.armor += 1; } },
  regeneracao: { name: 'Renovação',  icon: 18, max: 5, desc: '+0,5 de vida por segundo',             apply: h => { h.regen += 0.5; } },
  // elementos: valem para todas as armas
  fogo:        { name: 'Chama',      icon: 19, max: 3, desc: 'Queima os inimigos acertados',         apply: h => { h.fire += 1; } },
  gelo:        { name: 'Geada',      icon: 20, max: 3, desc: 'Deixa os inimigos acertados lentos',   apply: h => { h.ice += 1; } },
  raio:        { name: 'Tempestade', icon: 21, max: 3, desc: 'O dano salta para um inimigo próximo', apply: h => { h.bolt += 1; } },
};

// Sorteia até 3 cartas diferentes: nova arma (até 4), melhoria de arma que o herói já tem, ou passiva.
// carta = { kind: 'weapon'|'passive', id, level (nível que passa a ter), name, icon, desc, isNew }
export function rollCards(hero, count = 3) {
  const pool = [];
  for (const [id, def] of Object.entries(WEAPONS)) {
    const owned = hero.weapons.find(w => w.id === id);
    if (owned) {
      if (owned.level < def.max) pool.push({ weight: 4, kind: 'weapon', id, level: owned.level + 1, name: def.name, icon: def.icon, desc: def.ups[owned.level - 1][0], isNew: false });
    } else if (hero.weapons.length < 4) {
      pool.push({ weight: 2.5, kind: 'weapon', id, level: 1, name: def.name, icon: def.icon, desc: def.desc, isNew: true });
    }
  }
  for (const [id, def] of Object.entries(PASSIVES)) {
    const lv = hero.passives[id] || 0;
    if (lv < def.max) pool.push({ weight: id === 'fogo' || id === 'gelo' || id === 'raio' ? 1.6 : 2, kind: 'passive', id, level: lv + 1, name: def.name, icon: def.icon, desc: def.desc, isNew: lv === 0 });
  }
  const out = [];
  while (out.length < count && pool.length) {
    const total = pool.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total, i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].weight; if (r <= 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  if (!out.length) out.push({ kind: 'heal', id: 'heal', level: 0, name: 'Banquete', icon: 7, desc: 'Recupera toda a vida', isNew: false });
  return out;
}
