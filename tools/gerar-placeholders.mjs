// Gera os sprites PLACEHOLDER do jogo (PNG) em assets/.
// Os arquivos que já existem NÃO são sobrescritos — assim sua arte final fica segura.
// Use `npm run placeholders -- --force` para regenerar tudo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, sheet, hex, alpha, lerp, rng } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const TAU = Math.PI * 2;
let written = 0, skipped = 0;

function save(img, rel) {
  const file = path.join(ROOT, 'assets', rel);
  if (fs.existsSync(file) && !FORCE) { skipped++; return; }
  img.save(file); written++;
  console.log('  gerado  assets/' + rel);
}

const COL = {
  pants: hex('#1d2440'), boot: hex('#4a3020'), coat: hex('#2f5d9a'), coatD: hex('#244a7c'), belt: hex('#8a6a2a'),
  skin: hex('#f1c27d'), hair: hex('#5a3a22'), red: hex('#c0392b'), eye: hex('#1a1a1a'),
  fire: hex('#ff7a2f'), fireCore: hex('#fff1c2'), ice: hex('#6fd6ff'), iceCore: hex('#f0fdff'),
  bolt: hex('#f6f35a'), white: hex('#ffffff'), purple: hex('#c04bff'), purpleCore: hex('#ffd6ff'),
  crimson: hex('#ff3355'), crimsonCore: hex('#ffe0e6'),
};

// ===================================================================== PLAYER
// Quadro 48x48, pés no centro inferior (24,48), virado para a DIREITA.
function drawPlayer(img, o = {}) {
  const cx = 24, fy = 48, crouch = !!o.crouch, sw = o.sw || 0, bob = o.bob || 0, wob = o.wob || 0;
  if (o.dead) {
    img.rect(6, fy - 8, 30, 8, COL.coat); img.rect(36, fy - 10, 10, 10, COL.skin);
    img.rect(36, fy - 12, 10, 3, COL.red); img.rect(0, fy - 6, 8, 5, COL.pants);
    return;
  }
  const legH = crouch ? 6 : 13, torsoH = crouch ? 10 : 18;
  const torsoTop = fy - legH - torsoH + bob, headTop = torsoTop - 13;
  if (crouch) {
    img.rect(cx - 11, fy - legH, 22, legH, COL.pants);
    img.rect(cx - 12 + sw, fy - 3, 10, 3, COL.boot); img.rect(cx + 3 - sw, fy - 3, 10, 3, COL.boot);
  } else if (o.air) {
    img.rect(cx - 8, fy - legH - 3, 7, legH - 3, COL.pants); img.rect(cx + 2, fy - legH - 1 + (o.legs || 0), 7, legH - 2, COL.pants);
    img.rect(cx - 9, fy - 7, 9, 3, COL.boot); img.rect(cx + 1, fy - 4 + (o.legs || 0), 9, 3, COL.boot);
  } else {
    img.rect(cx - 8 + sw, fy - legH, 7, legH, COL.pants); img.rect(cx + 2 - sw, fy - legH, 7, legH, COL.pants);
    img.rect(cx - 9 + sw, fy - 3, 9, 3, COL.boot); img.rect(cx + 1 - sw, fy - 3, 9, 3, COL.boot);
  }
  const ux = cx + (o.lean || 0);
  // cachecol
  img.rect(ux - 18, headTop + 4 + wob, 11, 3, COL.red); img.rect(ux - 24, headTop + 6 - wob, 7, 3, COL.red);
  // tronco
  img.rect(ux - 9, torsoTop, 18, torsoH, COL.coat); img.rect(ux - 9, torsoTop, 5, torsoH, COL.coatD);
  img.rect(ux - 9, torsoTop + torsoH - 4, 18, 3, COL.belt);
  // cabeça
  img.rect(ux - 7, headTop, 14, 13, COL.skin); img.rect(ux - 8, headTop - 3, 16, 5, COL.hair);
  img.rect(ux - 8, headTop + 2, 16, 3, COL.red);
  if (o.hurt) { img.rect(ux + 2, headTop + 7, 4, 1, COL.eye); img.rect(ux + 3, headTop + 6, 1, 3, COL.eye); }
  else img.rect(ux + 3, headTop + 7, 2, 3, COL.eye);
}

function genPlayer() {
  const P = sheet(48, 48, 8, 5);
  // linha 0: idle (0-3)
  [0, 0, 1, 1].forEach((b, i) => { P.at(i); drawPlayer(P, { bob: b, wob: i % 2 ? 1 : -1 }); });
  // linha 1: run (8-13)
  for (let i = 0; i < 6; i++) { P.at(8 + i); const s = Math.sin((i / 6) * TAU); drawPlayer(P, { sw: Math.round(s * 5), bob: i % 3 === 0 ? 1 : 0, wob: i % 2 ? 2 : -2 }); }
  // linha 2: jump (16,17) fall (18,19)
  P.at(16); drawPlayer(P, { air: true, wob: -2 }); P.at(17); drawPlayer(P, { air: true, wob: 0 });
  P.at(18); drawPlayer(P, { air: true, legs: 2, wob: 2 }); P.at(19); drawPlayer(P, { air: true, legs: 3, wob: 3 });
  // linha 3: crouch (24,25) crawl (26-29)
  P.at(24); drawPlayer(P, { crouch: true }); P.at(25); drawPlayer(P, { crouch: true, bob: 1 });
  for (let i = 0; i < 4; i++) { P.at(26 + i); drawPlayer(P, { crouch: true, sw: [2, 0, -2, 0][i], wob: i % 2 }); }
  // linha 4: dash (32,33) hurt (34) dead (35)
  P.at(32); drawPlayer(P, { lean: 3, sw: 5, wob: -3 }); P.at(33); drawPlayer(P, { lean: 4, sw: 6, wob: -4 });
  P.at(34); drawPlayer(P, { hurt: true, lean: -3 });
  P.at(35); drawPlayer(P, { dead: true });
  save(P, 'sprites/player.png');

  // braço (gira com a mira). Pivô no ombro = lado esquerdo.
  const A = new Img(16, 8);
  A.rect(0, 1, 11, 6, COL.coat); A.rect(0, 1, 11, 2, COL.coatD); A.rect(11, 1, 4, 6, COL.skin);
  save(A, 'sprites/arm.png');
}

// ===================================================================== INIMIGOS
function drawGrunt(img, o = {}) {
  const cx = 24, fy = 48, sw = o.sw || 0, b = o.bob || 0;
  const L = hex('#3a1f2c'), T = hex('#7a2c3f'), Bt = hex('#4d1a28'), Hm = hex('#5b5f6b'), Ey = hex('#ff4d6d');
  img.rect(cx - 8 + sw, fy - 12, 7, 12, L); img.rect(cx + 1 - sw, fy - 12, 7, 12, L);
  img.rect(cx - 10, fy - 34 + b, 20, 23, T); img.rect(cx - 10, fy - 16 + b, 20, 4, Bt);
  img.rect(cx - 9, fy - 46 + b, 18, 13, Hm); img.rect(cx - 11, fy - 40 + b, 22, 3, Hm); img.rect(cx + 2, fy - 41 + b, 6, 3, Ey);
  if (o.attack) { img.rect(cx + 6, fy - 37 + b, 15, 5, Hm); img.glow(cx + 20, fy - 34 + b, 2 + o.attack, COL.purple, COL.purpleCore, 1.6); }
  else img.rect(cx + 6, fy - 32 + b, 12, 5, Hm);
}

function drawCaster(img, o = {}) {
  const cx = 24, fy = 64, b = o.bob || 0;
  img.ellipse(cx, fy - 2, 16, 3, alpha(COL.purple, 0.5));
  img.poly([[cx - 15, fy], [cx + 15, fy], [cx + 8, fy - 40 + b], [cx - 8, fy - 40 + b]], hex('#4a2370'));
  img.poly([[cx - 10, fy - 36 + b], [cx + 10, fy - 36 + b], [cx, fy - 57 + b]], hex('#2b1245'));
  img.rect(cx - 5, fy - 43 + b, 10, 6, hex('#14081f'));
  img.rect(cx + 1, fy - 41 + b, 3, 2, hex('#ffe14d')); img.rect(cx - 4, fy - 41 + b, 3, 2, hex('#ffe14d'));
  if (o.cast) { img.rect(cx + 7, fy - 42 + b, 9, 4, hex('#4a2370')); img.glow(cx + 17, fy - 40 + b, 3 + o.cast, COL.purple, COL.purpleCore, 1.6); }
  else { img.rect(cx + 7, fy - 30 + b, 7, 4, hex('#4a2370')); img.glow(cx + 15, fy - 27 + b, 3, COL.purple, COL.purpleCore, 1.6); }
}

function drawDrone(img, o = {}) {
  const cx = 24, cy = 16, f = o.flap || 0;
  img.rect(cx - 21, cy - 8 + f, 13, 4, hex('#8890a8')); img.rect(cx + 8, cy - 8 - f, 13, 4, hex('#8890a8'));
  img.rect(cx - 2, cy + 10, 4, 5, hex('#4b5068'));
  img.circle(cx, cy, 12, hex('#4b5068')); img.circle(cx, cy, 7, hex('#20232f'));
  img.circle(cx + 2, cy, 4, o.attack ? hex('#ff4d6d') : COL.purple);
}

function drawHeavy(img, o = {}) {
  const cx = 40, fy = 80, sw = o.sw || 0, b = o.bob || 0;
  img.rect(cx - 20 + sw, fy - 18, 14, 18, hex('#2b2a33')); img.rect(cx + 6 - sw, fy - 18, 14, 18, hex('#2b2a33'));
  img.rect(cx - 26, fy - 54 + b, 52, 38, hex('#6e3b2a')); img.rect(cx - 18, fy - 50 + b, 36, 10, hex('#8a4b36'));
  img.rect(cx - 26, fy - 24 + b, 52, 6, hex('#4a2618'));
  img.rect(cx - 14, fy - 66 + b, 28, 14, hex('#8a8f9e'));
  img.rect(cx - 18, fy - 73 + b, 5, 9, hex('#d9d2c0')); img.rect(cx + 13, fy - 73 + b, 5, 9, hex('#d9d2c0'));
  img.rect(cx + 3, fy - 61 + b, 8, 3, hex('#ffb000'));
  const up = o.attack ? -4 : 0;
  img.rect(cx + 18, fy - 50 + b + up, 16, 26, hex('#3d3d48')); img.rect(cx + 30, fy - 46 + b + up, 6, 8, hex('#1b1b22'));
  if (o.attack) img.glow(cx + 34, fy - 42 + b + up, 2 + o.attack, hex('#ff9933'), hex('#fff0c0'), 1.6);
}

function drawBoss(img, o = {}) {
  const cx = 80, fy = 192, b = o.bob || 0, up = o.attack ? -10 : 0, rage = !!o.rage;
  const stone = hex(rage ? '#5a3a44' : '#4e4a5e'), dark = hex(rage ? '#3a2028' : '#33303f');
  const glowC = rage ? COL.crimson : COL.purple, eye = rage ? COL.crimson : hex('#7df9ff');
  img.ellipse(cx, fy - 10, 34, 10, alpha(glowC, 0.45));
  img.rect(cx - 78, fy - 128 + b + up, 22, 64, dark); img.rect(cx + 56, fy - 128 + b + up, 22, 64, dark);
  img.rect(cx - 80, fy - 66 + b + up, 26, 24, stone); img.rect(cx + 54, fy - 66 + b + up, 26, 24, stone);
  img.poly([[cx - 56, fy - 24 + b], [cx + 56, fy - 24 + b], [cx + 64, fy - 132 + b], [cx - 64, fy - 132 + b]], stone);
  img.rect(cx - 68, fy - 138 + b, 136, 14, dark);
  img.rect(cx - 40, fy - 70 + b, 14, 3, dark); img.rect(cx + 24, fy - 60 + b, 16, 3, dark); img.rect(cx - 30, fy - 44 + b, 20, 3, dark);
  img.circle(cx, fy - 100 + b, 17, dark);
  img.rect(cx - 28, fy - 168 + b, 56, 32, stone); img.rect(cx - 28, fy - 140 + b, 56, 4, dark);
  img.rect(cx - 18, fy - 158 + b, 12, 6, eye); img.rect(cx + 6, fy - 158 + b, 12, 6, eye);
  if (rage) {
    img.line(cx - 44, fy - 120 + b, cx - 28, fy - 96 + b, glowC, 2); img.line(cx - 28, fy - 96 + b, cx - 38, fy - 64 + b, glowC, 2);
    img.line(cx + 40, fy - 126 + b, cx + 26, fy - 100 + b, glowC, 2); img.line(cx + 26, fy - 100 + b, cx + 42, fy - 72 + b, glowC, 2);
  }
  if (o.attack) { img.glow(cx - 67, fy - 54 + b + up, 5, glowC, null, 1.8); img.glow(cx + 67, fy - 54 + b + up, 5, glowC, null, 1.8); }
}

function genEnemies() {
  const G = sheet(48, 48, 8, 1);
  G.at(0); drawGrunt(G); G.at(1); drawGrunt(G, { bob: 1 });
  for (let i = 0; i < 4; i++) { G.at(2 + i); drawGrunt(G, { sw: [4, 0, -4, 0][i], bob: i % 2 }); }
  G.at(6); drawGrunt(G, { attack: 1 }); G.at(7); drawGrunt(G, { attack: 2 });
  save(G, 'sprites/grunt.png');

  const C = sheet(48, 64, 6, 1);
  [0, 1, 2, 1].forEach((b, i) => { C.at(i); drawCaster(C, { bob: b }); });
  C.at(4); drawCaster(C, { cast: 1 }); C.at(5); drawCaster(C, { cast: 2, bob: -1 });
  save(C, 'sprites/caster.png');

  const D = sheet(48, 32, 6, 1);
  [-4, 0, 4, 0].forEach((f, i) => { D.at(i); drawDrone(D, { flap: f }); });
  D.at(4); drawDrone(D, { attack: true, flap: 2 }); D.at(5); drawDrone(D, { attack: true, flap: -2 });
  save(D, 'sprites/drone.png');

  const Hv = sheet(80, 80, 8, 1);
  Hv.at(0); drawHeavy(Hv); Hv.at(1); drawHeavy(Hv, { bob: 1 });
  for (let i = 0; i < 4; i++) { Hv.at(2 + i); drawHeavy(Hv, { sw: [4, 0, -4, 0][i], bob: i % 2 }); }
  Hv.at(6); drawHeavy(Hv, { attack: 1 }); Hv.at(7); drawHeavy(Hv, { attack: 3 });
  save(Hv, 'sprites/heavy.png');

  const B = sheet(160, 192, 5, 2);
  [0, 1, 2, 1].forEach((b, i) => { B.at(i); drawBoss(B, { bob: b }); });
  B.at(4); drawBoss(B, { attack: true }); B.at(5); drawBoss(B, { attack: true, bob: 1 });
  [0, 1, 2, 1].forEach((b, i) => { B.at(6 + i); drawBoss(B, { rage: true, bob: b * 2 }); });
  save(B, 'sprites/boss.png');
}

// ===================================================================== PROJÉTEIS / ITENS
function genProjectiles() {
  const P = sheet(32, 32, 8, 3);
  // 0,1 fogo
  [7, 8].forEach((r, i) => {
    P.at(i);
    P.circle(7, 16 + (i ? 1 : -1), 4, alpha(COL.fire, 0.35)); P.circle(3, 16, 2, alpha(COL.fire, 0.25));
    P.glow(17, 16, r, COL.fire, COL.fireCore, 1.7);
  });
  // 2,3 gelo
  [2, 3].forEach(i => {
    P.at(i);
    P.rect(2, 14, 14, 4, alpha(COL.ice, 0.35));
    P.poly([[29, 16], [17, 9], [6, 16], [17, 23]], COL.ice);
    P.rect(12, 14, 11, 4, COL.iceCore);
    if (i === 3) { P.rect(8, 9, 2, 2, COL.white); P.rect(22, 23, 2, 2, COL.white); }
  });
  // 4,5 raio
  [4, 5].forEach(i => {
    P.at(i);
    const r = rng(i * 7);
    let px = 2, py = 16;
    for (let k = 1; k <= 5; k++) {
      const nx = 2 + k * 5.6, ny = 16 + (k % 2 ? -1 : 1) * (2 + r() * 4);
      P.line(px, py, nx, ny, alpha(COL.bolt, 0.45), 5); P.line(px, py, nx, ny, COL.bolt, 3); P.line(px, py, nx, ny, COL.white, 1);
      px = nx; py = ny;
    }
  });
  // 6 coração
  P.at(6);
  P.circle(11, 13, 6, hex('#ff4d6d')); P.circle(21, 13, 6, hex('#ff4d6d')); P.poly([[5, 15], [27, 15], [16, 27]], hex('#ff4d6d'));
  P.rect(8, 10, 3, 3, hex('#ffc2cf'));
  // 7 cristal de mana
  P.at(7);
  P.poly([[16, 3], [25, 16], [16, 29], [7, 16]], hex('#b46bff')); P.poly([[16, 8], [20, 16], [16, 24], [12, 16]], hex('#e3c4ff'));
  // 8,9 orbe roxo (destrutível)
  [7, 8].forEach((r, i) => { P.at(8 + i); P.glow(16, 16, r, COL.purple, COL.purpleCore, 1.9); });
  // 10,11 orbe vermelho grande (indestrutível)
  [11, 12].forEach((r, i) => { P.at(10 + i); P.glow(16, 16, r, COL.crimson, COL.crimsonCore, 1.3); });
  // 12,13 morteiro
  [8, 9].forEach((r, i) => { P.at(12 + i); P.glow(16, 16, r, hex('#b44bff'), COL.purpleCore, 1.6); });
  // 14,15 meteoro
  [0, 1].forEach(i => {
    P.at(14 + i);
    P.circle(16, 6 + i, 6, alpha(COL.fire, 0.4)); P.circle(12 - i, 3, 3, alpha(COL.fire, 0.3));
    P.glow(16, 19, 11, COL.fire, COL.fireCore, 1.25);
  });
  // 16,17 onda de chão
  [0, 1].forEach(i => {
    P.at(16 + i);
    P.rect(4, 4, 24, 28, alpha(hex('#7a2bff'), 0.45));
    for (let c = 0; c < 3; c++) { const h = 30 * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7 + c * 2))); P.rect(5 + c * 8, 32 - h, 7, h, COL.purple); }
    P.rect(12, 12, 8, 20, COL.purpleCore);
  });
  // 19,20,21 orbe na mão (fogo, gelo, raio)
  [[COL.fire, COL.fireCore], [COL.ice, COL.iceCore], [COL.bolt, COL.white]].forEach(([c, k], i) => { P.at(19 + i); P.glow(16, 16, 5, c, k, 1.9); });
  // 22 brilho branco suave (telegrafia, tingido no jogo)
  P.at(22);
  for (let k = 14; k >= 1; k--) P.circle(16, 16, k, [255, 255, 255, 18]);
  P.circle(16, 16, 3, COL.white);
  save(P, 'sprites/projectiles.png');

  const E = sheet(64, 64, 6, 1);
  for (let i = 0; i < 6; i++) {
    E.at(i);
    const t = i / 5, r = rng(100 + i), R = 10 + t * 18;
    if (i >= 2) for (let k = 0; k < 6; k++) E.circle(32 + (r() - 0.5) * 40 * t, 32 + (r() - 0.5) * 40 * t - t * 8, 6 + t * 10, [80, 70, 80, Math.round((1 - t) * 200)]);
    E.circle(32, 32, R, alpha(hex('#ff6a2a'), 1 - t * 0.7));
    for (let k = 0; k < 5; k++) E.circle(32 + Math.cos((k / 5) * TAU + i) * R * 0.7, 32 + Math.sin((k / 5) * TAU + i) * R * 0.7, R * 0.45 * (1 - t * 0.5), alpha(hex('#ff9b3d'), 1 - t * 0.7));
    if (t < 0.8) E.circle(32, 32, R * 0.6 * (1 - t), hex('#ffdd66'));
    if (i < 2) E.circle(32, 32, R * 0.35, COL.white);
  }
  save(E, 'sprites/explosion.png');

  const S = new Img(8, 8);
  S.circle(4, 4, 4, [255, 255, 255, 90]); S.circle(4, 4, 2.6, COL.white);
  save(S, 'sprites/spark.png');
}

// ===================================================================== TILES
function genTiles() {
  const T = sheet(32, 32, 8, 1);
  const dirt = hex('#3a2b2a'), dirt2 = hex('#4b3a34'), grass = hex('#5d7a3a'), grass2 = hex('#7ea24a');
  const specks = (seed) => { const r = rng(seed); for (let k = 0; k < 6; k++) T.rect(Math.floor(r() * 28), 8 + Math.floor(r() * 22), 4 + Math.floor(r() * 4), 3, dirt2); };
  // 1: chão com grama
  T.at(0); T.rect(0, 0, 32, 32, dirt); specks(1); T.rect(0, 0, 32, 6, grass); T.rect(0, 0, 32, 2, grass2);
  for (let x = 1; x < 32; x += 4) T.rect(x, 6, 2, (x * 7) % 3 + 1, grass);
  // 2: terra
  T.at(1); T.rect(0, 0, 32, 32, dirt); specks(2);
  // 3,4,5: plataforma (esquerda, meio, direita)
  const st = hex('#5a5470'), st2 = hex('#827ba0'), st3 = hex('#463f5a'), sh = hex('#2a2233');
  T.at(2); T.rect(3, 0, 29, 14, st); T.rect(3, 0, 29, 3, st2); T.rect(6, 14, 26, 5, sh); T.rect(3, 3, 2, 11, st3);
  T.at(3); T.rect(0, 0, 32, 14, st); T.rect(0, 0, 32, 3, st2); T.rect(0, 14, 32, 5, sh); T.rect(20, 3, 2, 11, st3);
  T.at(4); T.rect(0, 0, 29, 14, st); T.rect(0, 0, 29, 3, st2); T.rect(0, 14, 26, 5, sh); T.rect(27, 3, 2, 11, st3);
  // 6,7,8: decoração (tufo, pedra, caveira)
  T.at(5); for (let k = 0; k < 5; k++) T.line(8 + k * 4, 32, 6 + k * 5, 20 + (k % 2) * 4, grass, 2);
  T.at(6); T.ellipse(16, 27, 10, 6, hex('#4e4860')); T.ellipse(14, 25, 6, 3, hex('#6a6380'));
  T.at(7); T.circle(16, 24, 6, hex('#d9d2c0')); T.rect(12, 28, 8, 4, hex('#d9d2c0'));
  T.rect(13, 23, 2, 2, hex('#2a2233')); T.rect(17, 23, 2, 2, hex('#2a2233')); T.rect(3, 30, 9, 2, hex('#d9d2c0'));
  save(T, 'tiles/tiles.png');
}

// ===================================================================== FUNDOS (960x540, repetem na horizontal)
function genBackgrounds() {
  const SKY = new Img(960, 540);
  const top = hex('#1e1030'), mid = hex('#6b2f5e'), bot = hex('#f08a4b');
  for (let y = 0; y < 540; y++) {
    const t = Math.min(y / 480, 1);
    SKY.rect(0, y, 960, 1, t < 0.55 ? lerp(top, mid, t / 0.55) : lerp(mid, bot, (t - 0.55) / 0.45));
  }
  const r = rng(5);
  for (let k = 0; k < 70; k++) SKY.rect(r() * 960, r() * 230, 2, 2, [255, 255, 255, Math.round((0.3 + r() * 0.6) * 255)]);
  SKY.glow(760, 110, 34, [255, 230, 200, 255], hex('#fff6e8'), 2.0);
  save(SKY, 'bg/sky.png');

  const FAR = new Img(960, 540), farC = hex('#3d2347');
  for (let x = 0; x < 960; x++) {
    const u = (TAU * x) / 960;
    const y = Math.round(330 + Math.sin(u + 1.3) * 40 + Math.sin(u * 3 + 0.4) * 18 + Math.sin(u * 7 + 2.1) * 7);
    FAR.rect(x, y, 1, 540 - y, farC);
  }
  save(FAR, 'bg/far.png');

  const MID = new Img(960, 540), midC = hex('#2c1a38'), ruin = hex('#231629');
  for (let x = 0; x < 960; x++) {
    const u = (TAU * x) / 960;
    const y = Math.round(392 + Math.sin(u * 2 + 0.7) * 22 + Math.sin(u * 5 + 1.9) * 9 + Math.sin(u * 11) * 4);
    MID.rect(x, y, 1, 540 - y, midC);
  }
  const rr = rng(9);
  for (const px of [60, 300, 540, 780]) {
    const x = px + Math.floor(rr() * 30), h = 90 + Math.floor(rr() * 120);
    MID.rect(x, 480 - h, 34, h + 60, ruin); MID.rect(x - 8, 480 - h, 50, 10, ruin);
    if (rr() > 0.4) { MID.rect(x + 34, 480 - h + 20, 90, 12, ruin); MID.rect(x + 110, 480 - h + 20, 22, h + 40, ruin); }
  }
  save(MID, 'bg/mid.png');
}

console.log('Gerando placeholders' + (FORCE ? ' (--force)' : '') + '...');
genPlayer(); genEnemies(); genProjectiles(); genTiles(); genBackgrounds();
console.log(`Pronto: ${written} gerado(s), ${skipped} já existia(m) e foi(ram) mantido(s).`);
