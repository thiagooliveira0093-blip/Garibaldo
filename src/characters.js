// As 3 classes iniciais. Cada uma começa com 2 armas (teclas J e K), uma habilidade (L) e um
// rolamento próprio. Armas e gemas estão em weapons.js.
//
// Sprites (96x80, pés em x=36,y=79). Layout de quadros (igual nas 3 classes):
//   0-3 parado · 4-5 agachado · 6-7 dano · 8-13 correndo · 14 pulo · 15 queda
//   16-21 ataque à distância "nativo" · 22-23 rolamento · 24-27 morte · 28-33 golpe de espada
//   34-39 nativo na diagonal · 40-45 nativo para cima · 46-63 arco (só o guerreiro: horizontal, diagonal, cima)

// `aimSets`: onde estão os quadros de cada arma à distância: [horizontal, diagonal, cima] (6 quadros cada).
// Se a classe não tem os quadros de uma arma, usa `native` (a animação de ataque à distância dela).
export const CHARACTERS = {
  mage: {
    id: 'mage', name: 'GARIBALDO', title: 'Mago',
    desc: 'Anel de magia teleguiada e espada espiritual. Frágil, mas a magia busca o alvo.',
    // um sheet por gema do Anel: olhos, fecho e magia mudam de cor
    sheets: { fire: 'assets/sprites/garibaldo_fire.png', ice: 'assets/sprites/garibaldo_ice.png', bolt: 'assets/sprites/garibaldo_bolt.png' },
    variantByGem: true,
    stats: { hp: 100, run: 250, crawl: 90, jump: 720, airJumps: 0 },
    roll: { time: 0.34, iframes: 0.26, speed: 540, cd: 0.3 },
    body: { w: 24 }, rim: 0xff7a2f,   // o brilho da borda acompanha a gema
    shoulder: { stand: [4, -30], crouch: [4, -21] },
    native: [16, 34, 40], aimSets: { ring: [16, 34, 40], bow: null },
    muzzle: { native: [24, -8] },
    rates: { aim: 22, melee: 18 }, aimTime: 0.3,
    bars: { vida: 0.5, velocidade: 0.55, alcance: 1.0, forca: 0.6 },
    weapons: ['ring', 'sword'], bonus: { ring: 1.25 },
    sword: {
      name: 'Espada espiritual', moveFactor: 0.35, energy: 3, sfx: 'slash', backstab: 1.5,
      breaks: ['orb', 'big', 'mortar'],
      combo: [
        { dmg: 5, reach: 64, height: 66, time: 0.3, hitAt: 0.1, knock: 90, stun: 0.25, lunge: 70 },
        { dmg: 5, reach: 64, height: 66, time: 0.3, hitAt: 0.1, knock: 90, stun: 0.25, lunge: 70 },
        { dmg: 9, reach: 82, height: 74, time: 0.46, hitAt: 0.18, knock: 280, stun: 0.5, lunge: 130, finisher: true },
      ],
    },
    special: { kind: 'arcane', name: 'EXPLOSÃO ARCANA', label: 'ARCANO', dmg: 8, bossDmg: 12 },
  },

  warrior: {
    id: 'warrior', name: 'BRUNO', title: 'Guerreiro',
    desc: 'Armadura pesada e espadada brutal. Muita vida, rolamento curto e um arco para o longo alcance.',
    sheets: { base: 'assets/sprites/warrior.png' },
    variantByGem: false,
    stats: { hp: 160, run: 215, crawl: 80, jump: 690, airJumps: 0 },
    roll: { time: 0.38, iframes: 0.26, speed: 470, cd: 0.34 },
    body: { w: 28 }, rim: 0xffe9b0,
    shoulder: { stand: [5, -30], crouch: [5, -21] },
    native: [16, 34, 40], aimSets: { bow: [46, 52, 58], ring: null },
    muzzle: { native: [24, -4], bow: [22, 2] },
    rates: { aim: 18, melee: 15 }, aimTime: 0.3,
    bars: { vida: 1.0, velocidade: 0.35, alcance: 0.6, forca: 1.0 },
    weapons: ['sword', 'bow'], bonus: { sword: 1.25 },
    sword: {
      name: 'Espadada', moveFactor: 0.2, energy: 4, sfx: 'slash', backstab: 1.5,
      breaks: ['orb', 'big', 'mortar'],
      combo: [
        { dmg: 8, reach: 84, height: 74, time: 0.4, hitAt: 0.14, knock: 120, stun: 0.3, lunge: 40 },
        { dmg: 8, reach: 84, height: 74, time: 0.4, hitAt: 0.14, knock: 120, stun: 0.3, lunge: 40 },
        { dmg: 14, reach: 100, height: 82, time: 0.58, hitAt: 0.22, knock: 340, stun: 0.65, lunge: 90, finisher: true },
      ],
    },
    special: { kind: 'quake', name: 'TERREMOTO', label: 'FÚRIA', dmg: 10, bossDmg: 12 },
  },

  archer: {
    id: 'archer', name: 'LEO', title: 'Arqueiro',
    desc: 'Rápido e frágil, com pulo duplo e rolamento longo. Arco carregado e adaga para golpes pelas costas.',
    sheets: { base: 'assets/sprites/archer.png' },
    variantByGem: false,
    stats: { hp: 80, run: 290, crawl: 110, jump: 770, airJumps: 1 },
    roll: { time: 0.32, iframes: 0.3, speed: 640, cd: 0.26 },
    body: { w: 22 }, rim: 0xd2ffb0,
    shoulder: { stand: [4, -28], crouch: [4, -19] },
    native: [16, 34, 40], aimSets: { bow: [16, 34, 40], ring: null },
    muzzle: { native: [20, 2] },
    rates: { aim: 20, melee: 20 }, aimTime: 0.3,
    bars: { vida: 0.35, velocidade: 1.0, alcance: 1.0, forca: 0.5 },
    weapons: ['bow', 'sword'], bonus: { bow: 1.25 },
    sword: {
      name: 'Adaga', moveFactor: 0.6, energy: 3, sfx: 'slash', backstab: 2.2,
      breaks: ['orb', 'mortar'],
      combo: [
        { dmg: 3, reach: 46, height: 56, time: 0.24, hitAt: 0.08, knock: 40, stun: 0.18, lunge: 110 },
        { dmg: 3, reach: 46, height: 56, time: 0.24, hitAt: 0.08, knock: 40, stun: 0.18, lunge: 110 },
        { dmg: 6, reach: 58, height: 60, time: 0.34, hitAt: 0.12, knock: 150, stun: 0.35, lunge: 170, finisher: true },
      ],
    },
    special: { kind: 'rain', name: 'CHUVA DE FLECHAS', label: 'FOCO', dmg: 8, bossDmg: 12 },
  },
};

export const CHARACTER_LIST = ['mage', 'warrior', 'archer'].map(id => CHARACTERS[id]);

// Chave do sheet/animação: no mago muda com a gema do Anel; nas outras classes é sempre "base".
export const variantOf = (char, gem) => (char.variantByGem ? ['fire', 'ice', 'bolt'][gem] : 'base');

// [horizontal, diagonal, cima] dos quadros de uma arma à distância ('bow' ou 'ring'), com o fallback nativo
export const aimSetOf = (char, type) => char.aimSets[type] || char.native;
export const muzzleOf = (char, type) => char.muzzle[type] || char.muzzle.native;
