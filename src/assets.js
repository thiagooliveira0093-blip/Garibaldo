// Manifesto de assets e animações.
// Para trocar a arte: substitua o PNG mantendo o tamanho do quadro e a ordem dos quadros,
// ou ajuste os números aqui (frameWidth/frameHeight).

// [chave, arquivo, larguraDoQuadro, alturaDoQuadro]
export const SHEETS = [
  ['hero',      'assets/sprites/hero.png',      64, 64],   // vista*8 + k: 0-1 parado, 2-7 andando · 24-26 dano · 27 caído
  ['ghoul',     'assets/sprites/ghoul.png',     48, 48],   // vista*4 + k
  ['skeleton',  'assets/sprites/skeleton.png',  48, 48],   // vista*5 + k (k=4 atirando)
  ['brute',     'assets/sprites/brute.png',     64, 64],   // vista*4 + k
  ['bat',       'assets/sprites/bat.png',       32, 32],
  ['boss',      'assets/sprites/boss.png',      128, 128], // 0-3 parado · 4-5 atacando
  ['items',     'assets/sprites/items.png',     32, 32],
  ['props',     'assets/sprites/props.png',     64, 96],   // 0 pilar · 1-4 braseiro · 5 ossos · 6 urna · 7 túmulo
  ['explosion', 'assets/sprites/explosion.png', 64, 64],
];
// vistas: 0 = frente (descendo), 1 = costas (subindo), 2 = lado (direita; o jogo espelha)

export const IMAGES = [
  ['spark',      'assets/sprites/spark.png'],
  ['floorTiles', 'assets/tiles/floor.png'],   // 4 lajes de 64x64 em linha
  ['wallTile',   'assets/tiles/wall.png'],
];

export const ANIMS = [
  { key: 'explosion', sheet: 'explosion', frames: [0, 1, 2, 3, 4, 5], rate: 18, repeat: 0 },
  { key: 'brazier',   sheet: 'props',     frames: [1, 2, 3, 4], rate: 9 },
  { key: 'bat-fly',   sheet: 'bat',       frames: [0, 1, 2, 3], rate: 14 },
  { key: 'coin',      sheet: 'items',     frames: [3, 4, 5, 6], rate: 10 },
];

// quadros de items.png
export const ITEM = {
  gemS: 0, gemM: 1, gemL: 2, coin: 3, potion: 7,
  arrow: 22, enemyArrow: 24, enemyOrb: 25, orbFire: 26, orbIce: 27, orbBolt: 28, spark: 29,
};
