// O herói: Garibaldo, o mago. Ele escolhe uma arma (weapons.js) antes de cada partida.
//
// Sprites (96x80, pés em x=36,y=79). Layout de quadros dos sheets garibaldo_<elemento>.png:
//   0-3 parado · 4-5 agachado · 6-7 dano · 8-13 correndo · 14 pulo · 15 queda
//   16-21 anel (horizontal) · 22-23 rolamento · 24-27 morte · 28-33 golpe de espada
//   34-39 anel na diagonal · 40-45 anel para cima · 46-51 arco · 52-57 arco na diagonal · 58-63 arco para cima

// `aimSets`: onde estão os quadros de cada arma à distância: [horizontal, diagonal, cima] (6 quadros cada).
export const CHARACTERS = {
  mage: {
    id: 'mage', name: 'GARIBALDO', title: 'Mago',
    // um sheet por elemento: olhos, fecho e magia mudam de cor
    sheets: { fire: 'assets/sprites/garibaldo_fire.png', ice: 'assets/sprites/garibaldo_ice.png', bolt: 'assets/sprites/garibaldo_bolt.png' },
    variantByGem: true,
    stats: { hp: 100, run: 250, crawl: 90, jump: 720, airJumps: 0 },
    roll: { time: 0.34, iframes: 0.26, speed: 540, cd: 0.3 },
    body: { w: 24 }, rim: 0xff7a2f,   // o brilho da borda acompanha o elemento
    shoulder: { stand: [4, -30], crouch: [4, -21] },
    aimSets: { ring: [16, 34, 40], bow: [46, 52, 58] },
    muzzle: { ring: [24, -8], bow: [22, 2] },
    rates: { aim: 22, melee: 18 }, aimTime: 0.3,
    special: { kind: 'arcane', name: 'EXPLOSÃO ARCANA', label: 'ARCANO', dmg: 8, bossDmg: 12 },
  },
};

export const CHARACTER_LIST = [CHARACTERS.mage];
export const HERO = CHARACTERS.mage;

// Chave do sheet/animação: muda com o elemento (a "gema").
export const variantOf = (char, gem) => (char.variantByGem ? ['fire', 'ice', 'bolt'][gem] : 'base');

// [horizontal, diagonal, cima] dos quadros de uma arma à distância ('bow' ou 'ring')
export const aimSetOf = (char, type) => char.aimSets[type];
export const muzzleOf = (char, type) => char.muzzle[type];
