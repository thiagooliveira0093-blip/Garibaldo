// Todos os números de balanceamento do jogo ficam aqui.
// Armas e melhorias: weapons.js e upgrades.js.

export const GAME_W = 960;
export const GAME_H = 540;

// Salão: o herói luta numa sala fechada de pedra (tamanho em pixels). `wall` = espessura da parede.
export const HALL = { w: 3200, h: 2400, wall: 128, tile: 64 };
export const CAMERA_ZOOM = 0.75;   // menor = câmera mais distante (1 = como antes)

// Partida: o chefe chega em `bossAt` segundos; matar o chefe vence a partida.
export const RUN = { bossAt: 420, maxEnemies: 260 };

export const HERO = {
  hp: 100, speed: 188, radius: 13, pickup: 85,
  hitIframes: 0.7,                                             // invulnerabilidade depois de levar dano
  dash: { speed: 560, time: 0.2, iframes: 0.26, cd: 2.4 },
};

// XP necessário para passar do nível `level` para o próximo
export const xpNeeded = level => Math.round(4 + level * 4 + level * level * 0.7);

// ---------- Inimigos ----------
// sheet/fw: sprite e largura do quadro · views: 3 = frente/costas/lado · fpv: quadros por vista
// speed em px/s · touch = dano ao encostar · radius = hitbox circular · xp = valor da gema que solta
export const ENEMIES = {
  ghoul:    { sheet: 'ghoul',    fw: 48,  kind: 'chaser', views: 3, fpv: 4, hp: 12, speed: 72,  touch: 5,  xp: 1, radius: 11, name: 'Carniçal' },
  skeleton: { sheet: 'skeleton', fw: 48,  kind: 'archer', views: 3, fpv: 5, hp: 9,  speed: 52,  touch: 4,  xp: 2, radius: 10, name: 'Esqueleto',
              shoot: { cd: 2.6, range: 400, keep: 250, speed: 210, dmg: 7, tele: 0.4 } },
  brute:    { sheet: 'brute',    fw: 64,  kind: 'chaser', views: 3, fpv: 4, hp: 90, speed: 44,  touch: 16, xp: 6, radius: 20, name: 'Bruto', knockResist: 0.85 },
  bat:      { sheet: 'bat',      fw: 32,  kind: 'flyer',  views: 1, fpv: 4, hp: 5,  speed: 150, touch: 5,  xp: 1, radius: 9,  name: 'Morcego', fly: true },
  boss:     { sheet: 'boss',     fw: 128, kind: 'boss',   views: 1, fpv: 4, hp: 1100, speed: 36, touch: 24, xp: 80, radius: 46, name: 'SENHOR DEMÔNIO', knockResist: 1 },
};

// Dificuldade ao longo da partida (t = segundos):
//  - ritmo de aparição (inimigos por segundo), mistura de tipos e vida extra
export const spawnRate = t => 0.75 + t * 0.012;
export const hpScale = t => 1 + t / 140;
export function spawnMix(t) {
  const m = { ghoul: 100 };
  if (t > 40) m.bat = Math.min(40, (t - 40) * 0.6);
  if (t > 100) m.skeleton = Math.min(34, (t - 100) * 0.5);
  if (t > 170) m.brute = Math.min(20, (t - 170) * 0.3);
  return m;
}
// Eventos: um anel de inimigos cercando o herói a cada `every` segundos
export const EVENTS = [
  { every: 70, from: 60, kind: 'ring', type: 'ghoul', count: t => 14 + Math.floor(t / 12) },
  { every: 110, from: 130, kind: 'ring', type: 'bat', count: t => 10 + Math.floor(t / 20) },
  { every: 140, from: 200, kind: 'ring', type: 'brute', count: t => 3 + Math.floor(t / 90) },
];
export const ELITE = { from: 180, chance: 0.035, hp: 5, scale: 1.35, tint: 0xffd24a };

// Recompensas
export const PICKUPS = { gemMerge: 260, potionChance: 0.015, coinChance: 0.22, potionHeal: 30, coinValue: 1 };
