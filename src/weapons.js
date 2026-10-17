// Armas AUTOMÁTICAS (estilo Halls of Torment): atacam sozinhas o inimigo mais próximo.
// `base` = atributos no nível 1; `ups` = o que cada nível seguinte muda (nível 2 a 8).
// `icon` = quadro em items.png.

export const WEAPONS = {
  sword: {
    id: 'sword', name: 'Espada', icon: 8, color: 0xcfd8e6, max: 8,
    desc: 'Golpeia em arco os inimigos próximos.',
    base: { dmg: 16, cd: 1.0, reach: 100, arc: 1.9, back: false, wave: false, knock: 160 },
    ups: [
      ['+30% de dano', w => { w.dmg *= 1.3; }],
      ['+20% de alcance', w => { w.reach *= 1.2; }],
      ['Também golpeia atrás de você', w => { w.back = true; }],
      ['Ataca 20% mais rápido', w => { w.cd *= 0.8; }],
      ['+30% de dano', w => { w.dmg *= 1.3; }],
      ['+25% de alcance e arco maior', w => { w.reach *= 1.25; w.arc *= 1.2; }],
      ['Cada golpe lança uma onda de energia', w => { w.wave = true; }],
    ],
  },
  bow: {
    id: 'bow', name: 'Arco', icon: 9, color: 0xd8c8a0, max: 8,
    desc: 'Dispara flechas no inimigo mais próximo.',
    base: { dmg: 13, cd: 0.85, count: 1, pierce: 0, speed: 560, range: 560 },
    ups: [
      ['+1 flecha', w => { w.count += 1; }],
      ['+25% de dano', w => { w.dmg *= 1.25; }],
      ['As flechas atravessam 1 inimigo', w => { w.pierce += 1; }],
      ['+1 flecha', w => { w.count += 1; }],
      ['Atira 20% mais rápido', w => { w.cd *= 0.8; }],
      ['As flechas atravessam +2 inimigos', w => { w.pierce += 2; }],
      ['+2 flechas e +25% de dano', w => { w.count += 2; w.dmg *= 1.25; }],
    ],
  },
  ring: {
    id: 'ring', name: 'Anel', icon: 10, color: 0xf0c14b, max: 8,
    desc: 'Orbes de magia giram ao seu redor e ferem quem tocar.',
    base: { dmg: 12, count: 3, radius: 76, speed: 2.9, size: 14, tick: 0.4, nova: false, novaCd: 6 },
    ups: [
      ['+1 orbe', w => { w.count += 1; }],
      ['+30% de dano', w => { w.dmg *= 1.3; }],
      ['Órbita maior', w => { w.radius *= 1.25; w.size *= 1.15; }],
      ['+1 orbe', w => { w.count += 1; }],
      ['Gira 30% mais rápido', w => { w.speed *= 1.3; }],
      ['+30% de dano', w => { w.dmg *= 1.3; }],
      ['Libera uma nova de magia a cada 6s', w => { w.nova = true; }],
    ],
  },
};
export const WEAPON_LIST = ['sword', 'bow', 'ring'].map(id => WEAPONS[id]);

// Atributos de uma arma no nível `level` (aplica as melhorias em ordem)
export function weaponStats(id, level) {
  const def = WEAPONS[id], w = { ...def.base };
  for (let l = 2; l <= level; l++) def.ups[l - 2][1](w);
  return w;
}
