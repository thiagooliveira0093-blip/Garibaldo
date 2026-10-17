// Armas e elementos. O Garibaldo escolhe UMA arma antes de começar; cada arma tem um ataque
// FRACO (clique esquerdo ou J) e um ataque FORTE (clique direito ou K).
//
//   Espada  fraco: combo de 3 golpes (o 3º empurra e atordoa)      forte: golpe pesado, quebra armadura
//   Arco    fraco: flecha rápida (segure para repetir)             forte: segure para carregar e solte
//   Anel    fraco: magia teleguiada (segure para repetir)          forte: nova que empurra e limpa tiros

const proj3 = frame => ({ sheet: 'proj3', frame });

export const WEAPONS = {
  sword: {
    id: 'sword', type: 'melee', name: 'Espada', icon: proj3(17),
    desc: 'Combo de 3 golpes. O golpe forte é lento e pesado, atravessa armaduras e destrói qualquer tiro.',
    moveFactor: 0.35, energy: 3, backstab: 1.5, sfx: 'slash',
    breaks: ['orb', 'mortar', 'homing'], breaksAll: ['orb', 'big', 'mortar', 'homing'],
    light: {
      combo: [
        { dmg: 5, reach: 64, height: 66, time: 0.3, hitAt: 0.1, knock: 90, stun: 0.25, lunge: 70 },
        { dmg: 5, reach: 64, height: 66, time: 0.3, hitAt: 0.1, knock: 90, stun: 0.25, lunge: 70 },
        { dmg: 9, reach: 82, height: 74, time: 0.46, hitAt: 0.18, knock: 280, stun: 0.5, lunge: 130, finisher: true },
      ],
    },
    heavy: { dmg: 14, reach: 98, height: 84, time: 0.66, hitAt: 0.36, knock: 420, stun: 0.95, lunge: 170, heavy: true, breakArmor: true, hitStop: 0.17, shake: 12, moveFactor: 0.12 },
  },
  bow: {
    id: 'bow', type: 'bow', name: 'Arco', icon: proj3(18),
    desc: 'Fraco: flecha rápida. Forte: segure para carregar; a flecha carregada atravessa os inimigos.',
    radius: 5, sprite: { sheet: 'proj3', frame: 0, anim: 'shot-arrow', origin: [24, 16] },
    light: { cd: 0.3, dmg: 2, speed: 950 },
    heavy: { cd: 0.3, minCharge: 0.2, maxCharge: 0.85, dmgMin: 4, dmgMax: 9, speedMax: 1500, pierceAt: 0.65, moveFactor: 0.5 },
  },
  ring: {
    id: 'ring', type: 'ring', name: 'Anel', icon: proj3(19),
    desc: 'Fraco: magia teleguiada. Forte: nova ao redor que empurra os inimigos e destrói tiros.',
    light: { cd: 0.34, homing: { turn: 1.7, range: 340 } },
    heavy: { windup: 0.34, radius: 175, dmg: 7, knock: 380, stun: 0.85, cd: 2.2, hitStop: 0.1, shake: 9 },
  },
};
export const WEAPON_LIST = ['ring', 'sword', 'bow'].map(id => WEAPONS[id]);

// Elementos (teclas 1, 2, 3): dão cor ao herói e um efeito a TODAS as armas.
//  - ring: como a magia do Anel se comporta (sprite, dano, flags)
//  - fx:   efeito extra aplicado em golpes de espada, flechas e na nova:
//          splash = explode em área · slow = deixa lento · chain = salta para outro inimigo próximo
export const GEMS = [
  { name: 'Fogo', kind: 'fire', key: '1', color: 0xff7a2f, trail: 0xffb347, icon: { sheet: 'proj', frame: 19 },
    ring: { dmg: 3, speed: 560, radius: 8, sfx: 'fire', sprite: { sheet: 'fireball', frame: 0, anim: 'shot-fire', origin: [21, 17] }, splash: { radius: 70, dmg: 1.5 } },
    fx: { splash: 70, splashFrac: 0.5 } },
  { name: 'Gelo', kind: 'ice', key: '2', color: 0x6fd6ff, trail: 0xbff0ff, icon: { sheet: 'proj', frame: 20 },
    ring: { dmg: 2, speed: 640, radius: 7, sfx: 'ice', sprite: { sheet: 'proj', frame: 2, anim: 'shot-ice' }, pierce: true, slow: true },
    fx: { slow: true } },
  { name: 'Raio', kind: 'bolt', key: '3', color: 0xf6f35a, trail: 0xfff9a0, icon: { sheet: 'proj', frame: 21 },
    ring: { dmg: 1.2, speed: 760, radius: 5, sfx: 'bolt', sprite: { sheet: 'proj', frame: 4, anim: 'shot-bolt' }, spread: [-0.14, 0, 0.14], breaks: true },
    fx: { chain: 170, chainFrac: 0.5 } },
];

// Crítico: atacar pelas costas do inimigo
export const BACKSTAB = 1.5;
