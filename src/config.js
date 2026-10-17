// Todos os números de balanceamento do jogo ficam aqui.

export const GAME_W = 960;
export const GAME_H = 540;

// ---------- Física e efeitos ----------
// Atributos, armas, golpes e especial de cada personagem ficam em src/characters.js.
export const GRAV = 1900;
export const ICE_SLOW = { time: 2.2, factor: 0.45 };   // lentidão causada por armas com `slow`

// Vida do jogador em pontos (barra no HUD). A vida máxima de cada herói fica em characters.js.
export const HIT_DAMAGE = 20;   // dano de qualquer golpe ou tiro inimigo
export const HEAL = 20;         // vida recuperada por coração coletado

// ---------- Tiros inimigos ----------
// Roxos (orb, mortar) podem ser destruídos pelo Raio. Vermelhos (big) e meteoros não.
export const SHOTS = {
  orb:    { frame: 8,  anim: 'shot-orb',    radius: 7 },
  big:    { frame: 10, anim: 'shot-big',    radius: 12 },
  mortar: { frame: 12, anim: 'shot-mortar', radius: 9 },
  meteor: { frame: 14, anim: 'shot-meteor', radius: 16 },
  wave:   { frame: 16, anim: 'shot-wave',   radius: 0 },
};
export const DESTRUCTIBLE = new Set(['orb', 'mortar']);

// ---------- Inimigos ----------
// body = [largura, altura, offsetX, offsetY] da hitbox dentro do quadro do sprite
export const ENEMIES = {
  grunt:  { sheet: 'grunt',  hp: 4,   speed: 95, score: 100,  body: [24, 44, 12, 4],    gravity: true },
  caster: { sheet: 'caster', hp: 6,   speed: 0,  score: 200,  body: [26, 52, 11, 12],   gravity: false, showHp: true },
  drone:  { sheet: 'drone',  hp: 3,   speed: 0,  score: 150,  body: [30, 22, 9, 6],     gravity: false },
  heavy:  { sheet: 'heavy',  hp: 16,  speed: 45, score: 400,  body: [50, 64, 15, 16],   gravity: true,  showHp: true },
  boss:   { sheet: 'boss',   hp: 200, speed: 0,  score: 5000, body: [120, 150, 20, 40], gravity: false, name: 'GOLEM ARCANO' },
};

// ---------- Recompensas por desviar ----------
export const GRAZE = { distance: 16, energy: 3, score: 10 };
export const PERFECT_DODGE = { energy: 15, score: 50, slowTime: 0.45 };
export const SLOW_FACTOR = 0.35;

// ---------- Fases (na ordem) ----------
// Para adicionar uma fase: crie o .tmj no Tiled e acrescente aqui.
export const LEVELS = [
  { key: 'fase1', map: 'assets/maps/fase1.tmj' },
];
