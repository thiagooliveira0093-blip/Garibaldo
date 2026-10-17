// Os 3 personagens jogáveis. Tudo que muda de um para o outro fica aqui:
// atributos, armas (as 3 teclas 1/2/3), golpe corpo a corpo, dash e especial.
//
// Sprites (96x80, pés em x=36,y=79). Todos usam o mesmo layout de quadros:
//   0-3 parado · 4-5 agachado · 6-7 dano · 8-13 correndo · 14 pulo · 15 queda
//   16-21 ataque à distância · 22-23 dash · 24-27 morte · 28-33 golpe corpo a corpo

// Flags de cada arma (power):
//   pierce  atravessa os inimigos        splash {radius,dmg}  explode em área ao acertar
//   slow    deixa o inimigo lento        breaks  destrói tiros inimigos "destrutíveis"
//   spread  ângulos extras (vários tiros)  ground  anda rente ao chão     spin  não gira com a mira
//   solid   sem brilho (blend normal)    trail  cor das fagulhas que o tiro deixa
//   sprite  { sheet, frame, anim, origin:[x,y] (ponto do quadro que fica na hitbox) }
//   icon    { sheet, frame } no HUD

const proj3 = frame => ({ sheet: 'proj3', frame });

export const CHARACTERS = {
  mage: {
    id: 'mage', name: 'GARIBALDO', title: 'Mago',
    desc: 'Poderes elementais e uma espada espiritual. Equilibrado, com a Explosão Arcana.',
    // um sheet por poder: olhos, fecho e magia mudam de cor
    sheets: { fire: 'assets/sprites/garibaldo_fire.png', ice: 'assets/sprites/garibaldo_ice.png', bolt: 'assets/sprites/garibaldo_bolt.png' },
    variantByPower: true,
    stats: { hp: 100, run: 250, crawl: 90, jump: 720, airJumps: 0 },
    dash: { speed: 680, time: 0.2, cd: 0.6, hitDmg: 0 },
    body: { w: 20, h: 50 },
    shoulder: { stand: [4, -30], crouch: [4, -21] }, muzzle: [24, -8],
    rates: { shoot: 22, melee: 18 }, shootTime: 0.3,
    bars: { vida: 0.5, velocidade: 0.55, alcance: 1.0, forca: 0.6 },
    powers: [
      { name: 'Fogo', kind: 'fire', key: '1', color: 0xff7a2f, cd: 0.32, speed: 720, dmg: 3, radius: 8, sfx: 'fire',
        sprite: { sheet: 'fireball', frame: 0, anim: 'shot-fire', origin: [21, 17] }, icon: { sheet: 'proj', frame: 19 },
        splash: { radius: 70, dmg: 1.5 }, trail: 0xffb347 },
      { name: 'Gelo', kind: 'ice', key: '2', color: 0x6fd6ff, cd: 0.24, speed: 900, dmg: 1.5, radius: 7, sfx: 'ice',
        sprite: { sheet: 'proj', frame: 2, anim: 'shot-ice' }, icon: { sheet: 'proj', frame: 20 }, pierce: true, slow: true },
      { name: 'Raio', kind: 'bolt', key: '3', color: 0xf6f35a, cd: 0.16, speed: 1150, dmg: 1, radius: 5, sfx: 'bolt',
        sprite: { sheet: 'proj', frame: 4, anim: 'shot-bolt' }, icon: { sheet: 'proj', frame: 21 }, spread: [-0.13, 0, 0.13], breaks: true },
    ],
    melee: { name: 'Espada espiritual', time: 0.34, cd: 0.42, hitAt: 0.12, reach: 64, height: 66, dmg: 5, bossDmg: 6, energy: 3, moveFactor: 0.35, breaks: ['orb', 'big', 'mortar'], sfx: 'slash' },
    special: { kind: 'arcane', name: 'EXPLOSÃO ARCANA', label: 'ARCANO', dmg: 8, bossDmg: 12 },
  },

  warrior: {
    id: 'warrior', name: 'BRUNO', title: 'Guerreiro',
    desc: 'Armadura pesada: muita vida e golpes brutais. A investida de escudo machuca quem estiver no caminho.',
    sheets: { base: 'assets/sprites/warrior.png' },
    variantByPower: false,
    stats: { hp: 160, run: 215, crawl: 80, jump: 690, airJumps: 0 },
    dash: { speed: 600, time: 0.24, cd: 0.7, hitDmg: 4 },
    body: { w: 24, h: 50 },
    shoulder: { stand: [5, -30], crouch: [5, -21] }, muzzle: [24, -4],
    rates: { shoot: 15, melee: 15 }, shootTime: 0.4,
    bars: { vida: 1.0, velocidade: 0.35, alcance: 0.45, forca: 1.0 },
    powers: [
      { name: 'Machado', kind: 'axe', key: '1', color: 0xcfd8e6, cd: 0.5, speed: 560, dmg: 3.5, radius: 12, sfx: 'throw', life: 1.1,
        sprite: { sheet: 'proj3', frame: 5, anim: 'shot-axe' }, icon: proj3(14), pierce: true, spin: true, solid: true },
      { name: 'Lança', kind: 'spear', key: '2', color: 0xe8dcc0, cd: 0.38, speed: 1000, dmg: 2.5, radius: 7, sfx: 'throw',
        sprite: { sheet: 'proj3', frame: 4, anim: 'shot-spear', origin: [24, 16] }, icon: proj3(15), breaks: true, solid: true },
      { name: 'Tremor', kind: 'quake', key: '3', color: 0xff8a2a, cd: 0.75, speed: 380, dmg: 3, radius: 14, sfx: 'boom', life: 1.4,
        sprite: { sheet: 'proj3', frame: 9, anim: 'shot-quake' }, icon: proj3(16), pierce: true, ground: true, spin: true },
    ],
    melee: { name: 'Espadada', time: 0.42, cd: 0.5, hitAt: 0.15, reach: 84, height: 74, dmg: 8, bossDmg: 8, energy: 4, moveFactor: 0.2, breaks: ['orb', 'big', 'mortar'], sfx: 'slash' },
    special: { kind: 'quake', name: 'TERREMOTO', label: 'FÚRIA', dmg: 10, bossDmg: 12 },
  },

  archer: {
    id: 'archer', name: 'LEO', title: 'Arqueiro',
    desc: 'Rápido e frágil, com pulo duplo. Flechas velozes e uma adaga para quem chega perto.',
    sheets: { base: 'assets/sprites/archer.png' },
    variantByPower: false,
    stats: { hp: 80, run: 290, crawl: 110, jump: 770, airJumps: 1 },
    dash: { speed: 760, time: 0.18, cd: 0.45, hitDmg: 0 },
    body: { w: 18, h: 50 },
    shoulder: { stand: [4, -28], crouch: [4, -19] }, muzzle: [20, 2],
    rates: { shoot: 20, melee: 20 }, shootTime: 0.3,
    bars: { vida: 0.35, velocidade: 1.0, alcance: 1.0, forca: 0.4 },
    powers: [
      { name: 'Flecha', kind: 'arrow', key: '1', color: 0xd8c8a0, cd: 0.2, speed: 1150, dmg: 1.6, radius: 5, sfx: 'bolt',
        sprite: { sheet: 'proj3', frame: 0, anim: 'shot-arrow', origin: [24, 16] }, icon: proj3(11), breaks: true, solid: true },
      { name: 'Fogo', kind: 'firearrow', key: '2', color: 0xff8a2a, cd: 0.45, speed: 900, dmg: 2.5, radius: 7, sfx: 'fire',
        sprite: { sheet: 'proj3', frame: 2, anim: 'shot-firearrow', origin: [24, 16] }, icon: proj3(12), splash: { radius: 55, dmg: 1.5 }, trail: 0xff8a2a },
      { name: 'Tripla', kind: 'triple', key: '3', color: 0xb07a40, cd: 0.38, speed: 1000, dmg: 1.2, radius: 5, sfx: 'bolt',
        sprite: { sheet: 'proj3', frame: 0, anim: 'shot-arrow', origin: [24, 16] }, icon: proj3(13), spread: [-0.17, 0, 0.17], breaks: true, solid: true },
    ],
    melee: { name: 'Adaga', time: 0.3, cd: 0.25, hitAt: 0.1, reach: 46, height: 56, dmg: 3, bossDmg: 3, energy: 3, moveFactor: 0.6, breaks: ['orb', 'mortar'], sfx: 'slash' },
    special: { kind: 'rain', name: 'CHUVA DE FLECHAS', label: 'FOCO', dmg: 8, bossDmg: 12 },
  },
};

export const CHARACTER_LIST = ['mage', 'warrior', 'archer'].map(id => CHARACTERS[id]);

// chave do sheet/animação de um personagem para o poder atual
export const variantOf = (char, power) => (char.variantByPower ? char.powers[power].kind : 'base');
