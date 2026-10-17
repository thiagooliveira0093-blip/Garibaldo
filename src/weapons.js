// Armas e gemas. Cada herói carrega 2 armas (teclas J e K) e usa a habilidade (L).
// Quais armas cada classe leva e os combos da espada ficam em characters.js.

const proj3 = frame => ({ sheet: 'proj3', frame });

// Tipos de arma:
//   melee  Espada: combo de 3 golpes (o 3º é o finalizador), cancelável pelo rolamento.
//   bow    Arco: toque rápido = flecha fraca; segure para carregar (mais dano, velocidade e perfura).
//   ring   Anel: magia teleguiada com o efeito da gema escolhida (1 / 2 / 3).
export const WEAPONS = {
  sword: { id: 'sword', type: 'melee', name: 'Espada', icon: proj3(17) },
  bow: {
    id: 'bow', type: 'bow', name: 'Arco', icon: proj3(18),
    cd: 0.24,                 // intervalo depois de soltar a flecha
    tapDmg: 2, tapSpeed: 900, // toque rápido
    minCharge: 0.2,           // abaixo disso é toque rápido
    maxCharge: 0.85,          // tempo para carga total
    dmgMax: 7.5, speedMax: 1500,
    pierceAt: 0.65,           // a partir dessa fração da carga a flecha atravessa
    moveFactor: 0.5,          // velocidade enquanto puxa o arco
    radius: 5, color: 0xd8c8a0,
    sprite: { sheet: 'proj3', frame: 0, anim: 'shot-arrow', origin: [24, 16] },
  },
  ring: {
    id: 'ring', type: 'ring', name: 'Anel', icon: proj3(19),
    cd: 0.34,
    homing: { turn: 1.7, range: 340 },   // rad/s e alcance de busca do alvo
  },
};

// Gemas do Anel: dão o efeito da magia e a cor dos olhos e do brilho do herói.
// Flags: pierce (atravessa), splash (explode em área), slow (deixa lento), breaks (destrói tiros roxos),
// spread (vários tiros). sprite.origin = ponto do quadro que fica na hitbox.
export const GEMS = [
  { name: 'Fogo', kind: 'fire', key: '1', color: 0xff7a2f, dmg: 3, speed: 560, radius: 8, sfx: 'fire', trail: 0xffb347,
    sprite: { sheet: 'fireball', frame: 0, anim: 'shot-fire', origin: [21, 17] }, icon: { sheet: 'proj', frame: 19 },
    splash: { radius: 70, dmg: 1.5 } },
  { name: 'Gelo', kind: 'ice', key: '2', color: 0x6fd6ff, dmg: 2, speed: 640, radius: 7, sfx: 'ice',
    sprite: { sheet: 'proj', frame: 2, anim: 'shot-ice' }, icon: { sheet: 'proj', frame: 20 }, pierce: true, slow: true },
  { name: 'Raio', kind: 'bolt', key: '3', color: 0xf6f35a, dmg: 1.2, speed: 760, radius: 5, sfx: 'bolt',
    sprite: { sheet: 'proj', frame: 4, anim: 'shot-bolt' }, icon: { sheet: 'proj', frame: 21 }, spread: [-0.14, 0, 0.14], breaks: true },
];

// Crítico: atacar pelas costas do inimigo
export const BACKSTAB = 1.5;
