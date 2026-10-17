// Manifesto de assets e animações.
// Para trocar a arte: substitua o PNG mantendo o tamanho do quadro e a ordem dos quadros,
// ou ajuste os números aqui (frameWidth/frameHeight e a lista "frames" de cada animação).

import { CHARACTERS, aimSetOf } from './characters.js';

// Sheets dos personagens (96x80), definidos em characters.js. Chave: `<personagem>-<variante>`.
export const CHARACTER_SHEETS = Object.values(CHARACTERS).flatMap(char =>
  Object.entries(char.sheets).map(([variant, file]) => ({ key: `${char.id}-${variant}`, file, char, variant })));

// [chave, arquivo, larguraDoQuadro, alturaDoQuadro]
export const SHEETS = [
  ['fireball',  'assets/sprites/fireball.png',    32, 32],
  ['proj3',     'assets/sprites/proj3.png',       32, 32],
  ['grunt',     'assets/sprites/grunt.png',       48, 48],
  ['caster',    'assets/sprites/caster.png',      48, 64],
  ['drone',     'assets/sprites/drone.png',       48, 32],
  ['heavy',     'assets/sprites/heavy.png',       80, 80],
  ['boss',      'assets/sprites/boss.png',        160, 192],
  ['proj',      'assets/sprites/projectiles.png', 32, 32],
  ['explosion', 'assets/sprites/explosion.png',   64, 64],
];

export const IMAGES = [
  ['spark',  'assets/sprites/spark.png'],
  ['tiles',  'assets/tiles/tiles.png'],
  ['bg_sky', 'assets/bg/sky.png'],
  ['bg_far', 'assets/bg/far.png'],
  ['bg_mid', 'assets/bg/mid.png'],
];

// repeat: -1 = loop, 0 = toca uma vez
// Layout dos 3 personagens (96x80), igual em todos: a chave final é `<personagem>-<variante>-<nome>`.
// 0-3 parado · 4-5 agachado · 6-7 dano · 8-13 correndo · 14 pulo · 15 queda
// 16-21 ataque à distância nativo · 22-23 rolamento · 24-27 morte · 28-33 golpe de espada (melee)
// 34-45 nativo na diagonal e para cima · 46-63 arco do guerreiro (ver aimSets em characters.js)
// Armas à distância: anima `ring`/`bow` (horizontal), `ringDiag`/`bowDiag` e `ringUp`/`bowUp`.
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const characterAnims = char => {
  const list = [
    ['idle', [0, 1, 2, 3], 5], ['run', range(8, 13), 13], ['jump', [14], 1], ['fall', [15], 1],
    ['crouch', [4, 5], 3], ['crawl', [4, 5], 8], ['roll', [22, 23], 16], ['hurt', [6, 7], 6],
    ['dead', range(24, 27), 6, 0],
    ['melee', range(28, 33), char.rates.melee, 0],
  ];
  for (const type of ['ring', 'bow']) {
    const [h, d, u] = aimSetOf(char, type);
    list.push([type, range(h, h + 5), char.rates.aim, 0], [`${type}Diag`, range(d, d + 5), char.rates.aim, 0],
      [`${type}Up`, range(u, u + 5), char.rates.aim, 0]);
  }
  return list;
};

export const ANIMS = [
  ...CHARACTER_SHEETS.flatMap(({ key, char, variant }) => characterAnims(char).map(([name, frames, rate, repeat]) => (
    { key: `${char.id}-${variant}-${name}`, sheet: key, frames, rate, ...(repeat === undefined ? {} : { repeat }) }
  ))),

  { key: 'grunt-idle',    sheet: 'grunt', frames: [0, 1], rate: 4 },
  { key: 'grunt-walk',    sheet: 'grunt', frames: [2, 3, 4, 5], rate: 10 },
  { key: 'grunt-attack',  sheet: 'grunt', frames: [6, 7], rate: 8 },

  { key: 'caster-idle',   sheet: 'caster', frames: [0, 1, 2, 3], rate: 6 },
  { key: 'caster-attack', sheet: 'caster', frames: [4, 5], rate: 8 },

  { key: 'drone-idle',    sheet: 'drone', frames: [0, 1, 2, 3], rate: 16 },
  { key: 'drone-attack',  sheet: 'drone', frames: [4, 5], rate: 12 },

  { key: 'heavy-idle',    sheet: 'heavy', frames: [0, 1], rate: 3 },
  { key: 'heavy-walk',    sheet: 'heavy', frames: [2, 3, 4, 5], rate: 8 },
  { key: 'heavy-attack',  sheet: 'heavy', frames: [6, 7], rate: 8 },

  { key: 'boss-idle',     sheet: 'boss', frames: [0, 1, 2, 3], rate: 5 },
  { key: 'boss-attack',   sheet: 'boss', frames: [4, 5], rate: 8 },
  { key: 'boss-rage',     sheet: 'boss', frames: [6, 7, 8, 9], rate: 8 },

  { key: 'explosion',     sheet: 'explosion', frames: [0, 1, 2, 3, 4, 5], rate: 18, repeat: 0 },

  { key: 'shot-fire',     sheet: 'fireball', frames: [0, 1, 2, 3], rate: 16 },
  { key: 'shot-ice',      sheet: 'proj', frames: [2, 3], rate: 12 },
  { key: 'shot-bolt',     sheet: 'proj', frames: [4, 5], rate: 20 },
  { key: 'shot-orb',      sheet: 'proj', frames: [8, 9], rate: 10 },
  { key: 'shot-big',      sheet: 'proj', frames: [10, 11], rate: 10 },
  { key: 'shot-mortar',   sheet: 'proj', frames: [12, 13], rate: 10 },
  { key: 'shot-meteor',   sheet: 'proj', frames: [14, 15], rate: 12 },
  { key: 'shot-wave',     sheet: 'proj', frames: [16, 17], rate: 14 },

  // armas do guerreiro e do arqueiro (proj3.png)
  { key: 'shot-arrow',    sheet: 'proj3', frames: [0, 1], rate: 10 },
  { key: 'shot-firearrow', sheet: 'proj3', frames: [2, 3], rate: 14 },
  { key: 'shot-spear',    sheet: 'proj3', frames: [4], rate: 1 },
  { key: 'shot-axe',      sheet: 'proj3', frames: [5, 6, 7, 8], rate: 22 },
  { key: 'shot-quake',    sheet: 'proj3', frames: [9, 10], rate: 12 },
];

// Quadros avulsos em projectiles.png
export const FRAME = { heart: 6, mana: 7, glow: 22 };
