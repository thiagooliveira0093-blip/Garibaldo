// Todos os números de balanceamento do jogo ficam aqui.

export const GAME_W = 960;
export const GAME_H = 540;

// ---------- Player ----------
export const GRAV = 1900;
export const RUN = 250;
export const CRAWL = 90;
export const JUMP = 720;
export const DASH_SPEED = 680;
export const DASH_TIME = 0.2;     // segundos de invencibilidade do dash
export const DASH_CD = 0.6;
export const PLAYER_HP = 5;

// ---------- Poderes ----------
// frame/anim = sprite do tiro em projectiles.png; hand = orbe na mão do player
export const POWERS = [
  { name: 'Fogo', kind: 'fire', key: '1', color: 0xff7a2f, cd: 0.32, speed: 720,  dmg: 3,   radius: 8, frame: 0, anim: 'shot-fire', hand: 19 },
  { name: 'Gelo', kind: 'ice',  key: '2', color: 0x6fd6ff, cd: 0.24, speed: 900,  dmg: 1.5, radius: 7, frame: 2, anim: 'shot-ice',  hand: 20 },
  { name: 'Raio', kind: 'bolt', key: '3', color: 0xf6f35a, cd: 0.16, speed: 1150, dmg: 1,   radius: 5, frame: 4, anim: 'shot-bolt', hand: 21 },
];
export const FIRE_SPLASH = { radius: 70, dmg: 1.5 };
export const ICE_SLOW = { time: 2.2, factor: 0.45 };

// ---------- Espada espiritual (corpo a corpo) ----------
export const MELEE = {
  time: 0.34,        // duração da animação
  cd: 0.42,          // intervalo entre golpes
  hitAt: 0.12,       // segundos até o golpe acertar (quadro do corte)
  reach: 64, height: 66,
  dmg: 5, bossDmg: 6,
  energy: 3,         // energia Arcana por inimigo acertado
  moveFactor: 0.35,  // velocidade de movimento durante o golpe
  breaks: ['orb', 'big', 'mortar'], // tiros que a espada destrói
};

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
