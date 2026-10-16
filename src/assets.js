// Manifesto de assets e animações.
// Para trocar a arte: substitua o PNG mantendo o tamanho do quadro e a ordem dos quadros,
// ou ajuste os números aqui (frameWidth/frameHeight e a lista "frames" de cada animação).

// [chave, arquivo, larguraDoQuadro, alturaDoQuadro]
export const SHEETS = [
  // um sheet do Garibaldo por poder: olhos, fecho e magia na mão mudam de cor
  ['player-fire', 'assets/sprites/garibaldo_fire.png', 96, 80],
  ['player-ice',  'assets/sprites/garibaldo_ice.png',  96, 80],
  ['player-bolt', 'assets/sprites/garibaldo_bolt.png', 96, 80],
  ['fireball',  'assets/sprites/fireball.png',    32, 32],
  ['grunt',     'assets/sprites/grunt.png',       48, 48],
  ['caster',    'assets/sprites/caster.png',      48, 64],
  ['drone',     'assets/sprites/drone.png',       48, 32],
  ['heavy',     'assets/sprites/heavy.png',       80, 80],
  ['boss',      'assets/sprites/boss.png',        160, 192],
  ['proj',      'assets/sprites/projectiles.png', 32, 32],
  ['explosion', 'assets/sprites/explosion.png',   64, 64],
];

export const IMAGES = [
  ['arm',    'assets/sprites/arm.png'],
  ['spark',  'assets/sprites/spark.png'],
  ['tiles',  'assets/tiles/tiles.png'],
  ['bg_sky', 'assets/bg/sky.png'],
  ['bg_far', 'assets/bg/far.png'],
  ['bg_mid', 'assets/bg/mid.png'],
];

// repeat: -1 = loop, 0 = toca uma vez
// Garibaldo (96x80), igual nos 3 sheets (fire/ice/bolt); a chave final é `player-<poder>-<nome>`.
// 0-3 parado · 4-5 agachado · 6-7 dano · 8-13 correndo · 14 pulo · 15 queda
// 16-21 lançar magia · 22-23 dash · 24-27 morte
const PLAYER_ANIMS = [
  ['idle', [0, 1, 2, 3], 5], ['run', [8, 9, 10, 11, 12, 13], 13], ['jump', [14], 1], ['fall', [15], 1],
  ['crouch', [4, 5], 3], ['crawl', [4, 5], 8], ['dash', [22, 23], 16], ['hurt', [6, 7], 6],
  ['dead', [24, 25, 26, 27], 6, 0], ['cast', [16, 17, 18, 19, 20, 21], 22, 0],
];
export const PLAYER_KINDS = ['fire', 'ice', 'bolt'];

export const ANIMS = [
  ...PLAYER_KINDS.flatMap(kind => PLAYER_ANIMS.map(([name, frames, rate, repeat]) => (
    { key: `player-${kind}-${name}`, sheet: `player-${kind}`, frames, rate, ...(repeat === undefined ? {} : { repeat }) }
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
];

// Quadros avulsos em projectiles.png
export const FRAME = { heart: 6, mana: 7, glow: 22 };
