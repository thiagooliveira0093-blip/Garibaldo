// Gera o Garibaldo (mago de capuz e capa preta rasgada que cobre o corpo todo).
// Os braços só aparecem na animação de lançar magia. Os olhos e a magia na mão têm a cor
// do poder selecionado, então saem 3 spritesheets:
//   assets/sprites/garibaldo_fire.png | garibaldo_ice.png | garibaldo_bolt.png
// + assets/sprites/fireball.png (projétil) + prévias em preview/.
// Quadros de 96x80, virado para a DIREITA, pés na base do quadro.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, sheet, hex, alpha } from './pixel.mjs';
import { bowPose } from './bowpose.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Cores de cada poder: olhos (eye/eyeL) e magia (fire = borda, fire2, fire3 = miolo, white)
const POW = {
  fire: { eye: hex('#ffb347'), eyeL: hex('#fff2c0'), fire: hex('#e8431e'), fire2: hex('#ff8a2a'), fire3: hex('#ffd24a'), white: hex('#fffbe8') },
  ice:  { eye: hex('#6fe0ff'), eyeL: hex('#e8fdff'), fire: hex('#2b7fd6'), fire2: hex('#4fc3f7'), fire3: hex('#b8f0ff'), white: hex('#ffffff') },
  bolt: { eye: hex('#f6f35a'), eyeL: hex('#ffffe0'), fire: hex('#c9a400'), fire2: hex('#f2d21b'), fire3: hex('#fff27a'), white: hex('#ffffff') },
};

const C = {
  line: hex('#0b0812'),
  // capa mais clara que o preto original, para não sumir contra o cenário escuro
  cloak: hex('#312d4f'), cloakD: hex('#1b1830'), cloakL: hex('#58527f'), cloakR: hex('#9f99dc'),
  lining: hex('#6a1a38'), shadow: hex('#050309'),
  skin: hex('#e9b98a'), skinD: hex('#b98558'),
  leather: hex('#4a3020'), boot: hex('#17111c'), tunic: hex('#2b2540'),
  cover: hex('#6b1c34'), coverD: hex('#3e0f1f'), pages: hex('#e6dcc2'), pagesD: hex('#b9ad90'),
  ...POW.fire,
};

// ---------- grimório e fios de energia ----------
function book(img, x, y, open) {
  if (open) {
    img.rect(x - 5, y + 1, 10, 3, C.cover); img.rect(x - 5, y + 3, 10, 1, C.coverD);   // capa
    img.rect(x - 4, y - 2, 4, 3, C.pages); img.rect(x, y - 3, 4, 4, C.pages);          // páginas abertas
    img.rect(x - 4, y, 4, 1, C.pagesD); img.rect(x, y, 4, 1, C.pagesD);
    img.rect(x - 1, y - 3, 1, 5, C.coverD);                                             // lombada
  } else {
    img.rect(x - 4, y - 1, 8, 5, C.cover); img.rect(x - 4, y + 3, 8, 1, C.coverD);
    img.rect(x - 3, y - 1, 6, 1, C.pages); img.rect(x - 1, y + 1, 2, 1, C.fire3);
  }
}
// ---------- espada espiritual ----------
function blade(img, H, ang, L) {
  if (L <= 0) return;
  const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
  const g = [H[0] + dx * 3, H[1] + dy * 3], tip = [H[0] + dx * (L + 4), H[1] + dy * (L + 4)];
  img.poly([[g[0] + px * 5, g[1] + py * 5], [tip[0] + dx * 3, tip[1] + dy * 3], [g[0] - px * 5, g[1] - py * 5]], alpha(C.fire, 0.28)); // aura
  img.poly([[g[0] + px * 2.5, g[1] + py * 2.5], tip, [g[0] - px * 2.5, g[1] - py * 2.5]], alpha(C.fire2, 0.85));                        // lâmina etérea
  img.poly([[g[0] + px, g[1] + py], [tip[0] - dx * 2, tip[1] - dy * 2], [g[0] - px, g[1] - py]], C.white);                              // fio brilhante
  img.line(H[0] + dx * 2 + px * 4, H[1] + dy * 2 + py * 4, H[0] + dx * 2 - px * 4, H[1] + dy * 2 - py * 4, C.fire3, 2);                 // guarda espectral
  for (let k = 1; k <= 3; k++) img.rect(H[0] + dx * (L * k / 4) + px * (k % 2 ? 4 : -4), H[1] + dy * (L * k / 4) + py * (k % 2 ? 4 : -4), 1.5, 1.5, C.fire3);
}
// rastro em arco do golpe, centrado no ombro
function arcTrail(img, S, a0, a1, rIn, rOut) {
  const n = 12, outer = [], inner = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    outer.push([S[0] + Math.cos(a) * rOut, S[1] + Math.sin(a) * rOut]);
    inner.push([S[0] + Math.cos(a) * rIn, S[1] + Math.sin(a) * rIn]);
  }
  // alpha < 0.35 para o brilho ficar translúcido (o pós-processamento solidifica acima disso)
  img.poly([...outer, ...inner.slice().reverse()], alpha(C.fire2, 0.3));
  for (let i = Math.floor(n * 0.45); i < n; i++) {
    img.line(outer[i][0], outer[i][1], outer[i + 1][0], outer[i + 1][1], alpha(C.fire3, 0.95), 2);
    img.line(inner[i][0], inner[i][1], inner[i + 1][0], inner[i + 1][1], alpha(C.fire2, 0.3), 1);
  }
}

// fio de energia ondulando de a até b
function wisps(img, a, b, t, amp = 3) {
  const n = 14, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len;
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const u = i / n, off = Math.sin(u * Math.PI * 3 + t * 1.3) * amp * Math.sin(u * Math.PI);
    const p = [a[0] + dx * u + px * off, a[1] + dy * u + py * off];
    if (prev) img.line(prev[0], prev[1], p[0], p[1], alpha(i % 2 ? C.fire3 : C.white, 0.9), 1);
    prev = p;
  }
}

// ---------- chama / orbe de magia (cores do poder atual) ----------
function flame(img, x, y, r, t = 0, tail = 0) {
  if (r <= 0) return;
  img.circle(x, y, r * 2.1, alpha(C.fire, 0.18));
  img.circle(x, y, r * 1.5, alpha(C.fire2, 0.35));
  if (tail > 0) {
    img.poly([[x, y - r * 0.9], [x - tail, y - r * 0.2 + Math.sin(t) * 2], [x - tail * 0.8, y + r * 0.5], [x, y + r * 0.9]], alpha(C.fire, 0.8));
    img.poly([[x, y - r * 0.5], [x - tail * 0.6, y + Math.cos(t) * 1.5], [x, y + r * 0.5]], C.fire2);
  }
  img.poly([[x - r * 0.8, y], [x - r * 0.3, y - r * 1.7 - Math.sin(t) * 1.5], [x + r * 0.2, y - r * 0.5]], C.fire);
  img.poly([[x + r * 0.1, y - r * 0.3], [x + r * 0.7, y - r * 1.5 + Math.cos(t) * 1.5], [x + r * 0.9, y]], C.fire);
  img.circle(x, y, r, C.fire);
  img.circle(x, y, r * 0.75, C.fire2);
  img.circle(x, y, r * 0.45, C.fire3);
  img.circle(x, y, r * 0.2, C.white);
}

// ---------- Garibaldo ----------
function hero(img, o = {}) {
  const P = {
    bob: 0, lean: 0, crouch: 0, fF: [4, 0], fB: [-4, 0], flare: 0,
    cape: 3, capeLift: 0, sway: 0,     // capa rasgada atrás: comprimento, altura e balanço
    hood: 0,                           // ponta do capuz esvoaçando para trás
    arm: 'none', aim: 0, ext: 0, orb: 0, orbT: 0, tail: 0,
    eyeShut: false,
    ...o,
  };
  const cx = 30, hem = 59;
  const sx = cx + P.lean, shY = 27 + P.bob + P.crouch;
  const hcx = sx + 1, hcy = shY - 8;
  const f = P.flare, sw = P.sway;

  // ----- capa rasgada atrás (tiras irregulares) -----
  const c = P.cape, lift = P.capeLift;
  const strips = [
    [[sx - 3, shY], [sx + 3, shY + 4], [cx - 6 - c * 0.7, hem - 7 - lift * 0.5 + sw], [cx - 11 - c * 1.3, hem - 3 - lift]],
    [[sx - 4, shY + 6], [sx + 2, shY + 8], [cx - 10 - c * 1.0, hem - 1 - lift * 0.3 - sw], [cx - 15 - c * 1.7, hem + 1 - lift * 1.2]],
    [[sx - 4, shY + 3], [sx + 1, shY + 3], [cx - 3 - c * 0.5, hem + 1 + sw], [cx - 7 - c * 0.9, hem - 2]],
  ];
  strips.forEach((s, i) => img.poly(s, i === 1 ? C.cloakD : C.cloak));
  img.poly([[sx - 3, shY + 1], [sx + 1, shY + 4], [cx - 5 - c * 0.6, hem - 8 + sw], [cx - 9 - c, hem - 4 - lift]], C.cloakD);

  // ----- botas (só aparecem pela bainha rasgada) -----
  const boot = ([dx, lift2]) => {
    img.rect(cx + dx - 3, hem - 2 - lift2, 8, 4, C.boot);
    img.rect(cx + dx + 3, hem - 3 - lift2, 3, 2, C.boot);
  };
  boot(P.fB); boot(P.fF);

  // ----- capa da frente: vai até o chão, bainha rasgada -----
  const L = cx - 12 - f, R = cx + 12 + f, n = 10, hemPts = [];
  for (let i = 0; i <= n; i++) {
    const x = R - ((R - L) * i) / n;
    const jag = i % 2 ? 2 + ((i * 7) % 3) : 0;
    let y = hem + 2 - jag + (i % 2 ? sw * 0.6 : -sw * 0.4);
    for (const [fx, fl] of [P.fF, P.fB]) if (fl > 0 && Math.abs(x - (cx + fx)) < 6) y -= fl * 0.8; // perna levantada empurra a barra
    hemPts.push([x, y]);
  }
  img.poly([[sx - 6, shY - 1], [sx + 6, shY], ...hemPts, [sx - 6, shY + 8]], C.cloak);
  // sombra à esquerda, luz de borda à direita
  img.poly([[sx - 6, shY - 1], [sx - 1, shY], [cx - 4, hem - 3], ...hemPts.slice(-3)], C.cloakD);
  img.poly([[sx + 4, shY + 1], [sx + 6, shY], hemPts[0], hemPts[1], [cx + 9 + f, hem - 8]], C.cloakL);
  img.line(sx + 6, shY + 1, cx + 12 + f, hem - 1, C.cloakR, 1);
  // dobras e rasgos do tecido (sem revelar o corpo)
  img.line(sx - 1, shY + 10, cx - 3, hem - 2, C.cloakD, 1);
  img.line(sx + 2, shY + 12, cx + 4, hem - 3, C.cloakD, 1);
  img.line(cx - 7, hem - 13, cx - 5, hem - 8, C.cloakL, 1);
  img.line(cx + 6 + f * 0.5, hem - 17, cx + 5 + f * 0.5, hem - 12, C.cloakD, 1);
  // gola alta do manto
  img.poly([[sx - 8, shY + 2], [sx - 4, shY - 4], [sx + 6, shY - 3], [sx + 8, shY + 3], [sx + 5, shY + 7], [sx - 8, shY + 7]], C.cloak);
  img.poly([[sx - 8, shY + 2], [sx - 4, shY - 4], [sx - 1, shY - 3], [sx - 3, shY + 7], [sx - 8, shY + 7]], C.cloakD);
  img.line(sx - 3, shY - 4, sx + 6, shY - 3, C.cloakR, 1);
  // fecho do manto: brilha na cor do poder
  img.rect(sx + 3, shY + 5, 3, 3, C.fire2); img.rect(sx + 4, shY + 6, 1, 1, C.fire3);

  // ----- capuz -----
  const t = P.hood;
  img.poly([[hcx - 7, hcy + 7], [hcx - 9, hcy - 3], [hcx - 4, hcy - 11], [hcx + 4, hcy - 11], [hcx + 8, hcy - 5], [hcx + 8, hcy + 3], [hcx + 5, hcy + 8]], C.cloak);
  img.poly([[hcx - 9, hcy - 3], [hcx - 12 - t, hcy + 4], [hcx - 9 - t * 0.5, hcy + 11], [hcx - 6, hcy + 8]], C.cloakD);
  img.poly([[hcx - 4, hcy - 11], [hcx + 4, hcy - 11], [hcx + 8, hcy - 5], [hcx + 3, hcy - 8]], C.cloakL);
  img.line(hcx - 3, hcy - 11, hcx + 5, hcy - 9, C.cloakR, 1);
  // abertura do capuz: rosto na sombra, olhos brilhando na cor do poder
  img.ellipse(hcx + 3, hcy, 4.8, 5.5, C.shadow);
  img.rect(hcx + 2, hcy + 4, 4, 2, C.skinD);
  if (P.eyeShut) img.rect(hcx + 3, hcy - 1, 3, 1, C.cloakR);
  else {
    img.circle(hcx + 3, hcy - 1, 6.5, alpha(C.eye, 0.2));      // brilho em volta
    img.circle(hcx + 3, hcy - 1, 4.5, alpha(C.eye, 0.22));
    img.rect(hcx + 3, hcy - 2, 3, 2, C.eye); img.rect(hcx + 4, hcy - 2, 2, 1, C.eyeL);
    img.rect(hcx - 1, hcy - 2, 2, 2, C.eye);
  }
  img.line(hcx + 7, hcy - 5, hcx + 8, hcy + 3, C.cloakL, 1);

  // ----- braço: só aparece ao lançar magia, saindo por uma abertura no manto -----
  const S = [sx + 4, shY + 4];
  if (P.arm === 'cast') {
    const len = 5 + P.ext * 11, dx = Math.cos(P.aim), dy = Math.sin(P.aim);
    const H = [S[0] + dx * len, S[1] + dy * len];
    img.poly([[S[0] - 4, S[1] - 4], [S[0] + 3, S[1] - 4], [S[0] + 4, S[1] + 6], [S[0] - 4, S[1] + 7]], C.lining);     // forro do manto aberto
    img.line(S[0] - 3, S[1] - 4, S[0] - 3, S[1] + 7, C.cloakD, 1);
    img.line(S[0], S[1], H[0], H[1], C.cloak, 4);
    img.line(S[0], S[1] - 1, H[0], H[1] - 1, C.cloakL, 1);
    img.rect(H[0] - 2, H[1] - 2, 4, 4, C.leather);
    img.circle(H[0] + dx * 2.5, H[1] + dy * 2.5, 2.2, C.skin);
    // grimório na mão; a magia flutua acima dele, ligada por fios de energia
    const B = [H[0] + dx * 4, H[1] + dy * 4 + 3];
    book(img, B[0], B[1], P.orb > 0);
    if (P.orb > 0) {
      // a magia flutua acima do livro; ao mirar para cima/diagonal, sobe junto com a direção do braço
      const O = [B[0] + dx * (2 + P.orb * 0.6), B[1] - 7 - P.orb * 0.5 + dy * (4 + P.orb * 0.4)];
      wisps(img, [S[0] + 1, S[1]], [B[0], B[1] - 2], P.orbT);
      wisps(img, [B[0], B[1] - 3], O, P.orbT + 2, 2);
      flame(img, O[0], O[1], P.orb, P.orbT, P.tail);
    }
  } else if (P.arm === 'bow') {
    // arco: o braço sai do manto aberto e a capa fica por trás
    img.poly([[S[0] - 4, S[1] - 4], [S[0] + 3, S[1] - 4], [S[0] + 4, S[1] + 6], [S[0] - 4, S[1] + 7]], C.lining);
    img.line(S[0] - 3, S[1] - 4, S[0] - 3, S[1] + 7, C.cloakD, 1);
    bowPose(img, S, P, { arm: C.cloak, skin: C.skin });
  } else if (P.arm === 'slash') {
    // golpe de espada espiritual: o braço sai do manto empunhando a lâmina, com rastro em arco
    const dx = Math.cos(P.sa), dy = Math.sin(P.sa), H = [S[0] + dx * 11, S[1] + dy * 11];
    if (P.trail) arcTrail(img, S, P.trail[0], P.trail[1], 30, 40);
    img.poly([[S[0] - 4, S[1] - 4], [S[0] + 3, S[1] - 4], [S[0] + 4, S[1] + 6], [S[0] - 4, S[1] + 7]], C.lining);
    img.line(S[0] - 3, S[1] - 4, S[0] - 3, S[1] + 7, C.cloakD, 1);
    img.line(S[0], S[1], H[0], H[1], C.cloak, 4);
    img.line(S[0], S[1] - 1, H[0], H[1] - 1, C.cloakL, 1);
    img.rect(H[0] - 2, H[1] - 2, 4, 4, C.leather);
    img.circle(H[0], H[1], 2.2, C.skin);
    blade(img, H, P.sa, P.blade);
  }
}

function heroLying(img) {
  img.rect(4, 56, 8, 4, C.boot);
  img.poly([[10, 53], [40, 51], [42, 60], [10, 60]], C.cloak);
  img.poly([[10, 57], [42, 56], [42, 60], [10, 60]], C.cloakD);
  img.poly([[10, 52], [-2, 56], [4, 60], [12, 59]], C.cloakD);
  img.line(18, 55, 32, 57, C.cloakL, 1);
  img.poly([[38, 50], [46, 48], [54, 52], [54, 59], [46, 60], [38, 58]], C.cloak);
  img.poly([[46, 48], [54, 52], [54, 56], [46, 53]], C.cloakL);
  img.ellipse(52, 56, 3, 4, C.shadow);
  img.rect(52, 58, 3, 2, C.skinD);
}

// ---------- animações ----------
const frames = [];
const add = (name, fn) => frames.push({ name, fn });

for (let i = 0; i < 4; i++) {
  add(`idle${i}`, im => hero(im, { bob: [0, 0, -1, -1][i], cape: 2 + (i % 2), sway: [0, 1, 0, -1][i], hood: i % 2 }));
}
for (let i = 0; i < 2; i++) add(`crouch${i}`, im => hero(im, { crouch: 9, bob: i, flare: 1, fF: [6, 0], fB: [-6, 0], cape: 3, hood: 1 }));
add('hurt0', im => hero(im, { lean: -3, bob: 1, cape: 6, hood: 3, eyeShut: true, capeLift: 2 }));
add('hurt1', im => hero(im, { lean: -4, bob: 2, crouch: 3, cape: 7, hood: 4, eyeShut: true }));
for (let i = 0; i < 6; i++) {
  const s = Math.sin((i / 6) * Math.PI * 2), co = Math.cos((i / 6) * Math.PI * 2);
  add(`run${i}`, im => hero(im, {
    lean: 2, bob: i % 3 === 0 ? 1 : -1,
    fF: [4 + Math.round(s * 7), Math.max(0, Math.round(-co * 3))], fB: [-4 - Math.round(s * 7), Math.max(0, Math.round(co * 3))],
    cape: 6 + Math.abs(s) * 3, capeLift: 2 + Math.abs(co) * 2, sway: Math.round(s * 2), flare: 1, hood: 3,
  }));
}
add('jump', im => hero(im, { bob: -2, fF: [6, 5], fB: [-2, 7], cape: 4, capeLift: 6, hood: 4 }));
add('fall', im => hero(im, { bob: 0, fF: [4, 1], fB: [-4, 2], cape: 5, capeLift: 11, flare: 3, hood: 5, sway: 2 }));

// lançar magia: o braço sai do manto → carrega → dispara → recolhe
const cast = [
  { arm: 'cast', aim: 0.9, ext: 0.1, orb: 2, orbT: 0, lean: -2 },
  { arm: 'cast', aim: 0.4, ext: 0.3, orb: 4, orbT: 1, lean: -2 },
  { arm: 'cast', aim: 0.1, ext: 0.6, orb: 6, orbT: 2, lean: 0, hood: 2 },
  { arm: 'cast', aim: -0.05, ext: 1, orb: 7, orbT: 3, lean: 3, tail: 8, hood: 3, cape: 6 },
  { arm: 'cast', aim: -0.05, ext: 1, orb: 3, orbT: 4, lean: 3, hood: 3, cape: 6 },
  { arm: 'cast', aim: 0.25, ext: 0.5, orb: 0, lean: 1, hood: 1 },
];
cast.forEach((p, i) => add(`cast${i}`, im => hero(im, { fF: [6, 0], fB: [-5, 0], flare: 1, cape: 3, ...p })));

add('dash0', im => hero(im, { lean: 7, bob: 3, crouch: 3, fF: [9, 0], fB: [-8, 2], cape: 15, capeLift: 4, hood: 8, flare: 2, sway: 2 }));
add('dash1', im => hero(im, { lean: 8, bob: 4, crouch: 4, fF: [10, 1], fB: [-9, 3], cape: 19, capeLift: 5, hood: 9, flare: 2, sway: -2 }));

add('dead0', im => hero(im, { lean: -4, bob: 1, crouch: 2, cape: 6, hood: 4, eyeShut: true, capeLift: 3 }));
add('dead1', im => hero(im, { lean: -5, bob: 4, crouch: 9, cape: 4, hood: 5, eyeShut: true, flare: 2 }));
add('dead2', im => hero(im, { lean: -8, bob: 9, crouch: 14, cape: 3, hood: 6, eyeShut: true, flare: 4, fF: [8, 0], fB: [-8, 0] }));
add('dead3', im => heroLying(im));

// espada espiritual (28-33): prepara → ergue → corta → arco largo → segue → dissolve
const slash = [
  { sa: -2.3, blade: 18, lean: -2, hood: 2 },
  { sa: -1.75, blade: 26, lean: -1, hood: 1, cape: 4 },
  { sa: -0.95, blade: 27, lean: 2, hood: 3, cape: 6, trail: [-1.85, -0.95] },
  { sa: 0.1, blade: 27, lean: 4, hood: 4, cape: 8, trail: [-1.95, 0.1] },
  { sa: 0.85, blade: 22, lean: 4, hood: 3, cape: 7, trail: [-0.1, 0.85] },
  { sa: 0.8, blade: 8, lean: 1, hood: 1 },
];
slash.forEach((p, i) => add(`slash${i}`, im => hero(im, { arm: 'slash', fF: [6, 0], fB: [-5, 0], flare: 1, cape: 3, ...p })));

// mira na diagonal (34-39) e para cima (40-45): o mesmo lançamento com o braço apontando para cima
const aimed = aims => cast.map((p, i) => ({ ...p, aim: aims[i], tail: 0 }));
aimed([0.5, 0.05, -0.35, -0.75, -0.75, -0.3]).forEach((p, i) => add(`castd${i}`, im => hero(im, { fF: [6, 0], fB: [-5, 0], flare: 1, cape: 3, ...p })));
aimed([0.1, -0.55, -1.05, -1.45, -1.45, -1.0]).forEach((p, i) => add(`castu${i}`, im => hero(im, { fF: [6, 0], fB: [-5, 0], flare: 1, cape: 3, ...p })));

// arco: puxa a corda (4 quadros), solta (2); horizontal 46-51, diagonal 52-57, para cima 58-63
const bowFrames = aim => [
  { draw: 0.1, arrow: true, lean: -1 }, { draw: 0.4, arrow: true, lean: -1 }, { draw: 0.8, arrow: true, lean: -2 },
  { draw: 1, arrow: true, lean: -2, hood: 3 }, { draw: 0.1, arrow: false, lean: 1, hood: 3 }, { draw: 0, arrow: false, lean: 0 },
].map(p => ({ arm: 'bow', aim, ...p }));
[['bowh', 0], ['bowd', -0.7], ['bowu', -1.4]].forEach(([tag, aim]) => bowFrames(aim).forEach((p, i) =>
  add(`${tag}${i}`, im => hero(im, { fF: [6, 0], fB: [-5, 0], flare: 1, cape: 3, ...p }))));

// ---------- pós-processamento por quadro ----------
function outline(img, fx, fy, fw, fh) {
  const d = img.d, w = img.w, mark = [];
  for (let y = fy; y < fy + fh; y++) for (let x = fx; x < fx + fw; x++) {
    if (d[(y * w + x) * 4 + 3] > 20) continue;
    let near = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= fx && ny >= fy && nx < fx + fw && ny < fy + fh && d[(ny * w + nx) * 4 + 3] > 200) { near = true; break; }
    }
    if (near) mark.push(y * w + x);
  }
  for (const i of mark) { d[i * 4] = C.line[0]; d[i * 4 + 1] = C.line[1]; d[i * 4 + 2] = C.line[2]; d[i * 4 + 3] = 255; }
}
// pixel art: o que é quase opaco vira sólido; brilho suave (alpha baixo) é mantido
function solidify(img, fx, fy, fw, fh) {
  const d = img.d, w = img.w;
  for (let y = fy; y < fy + fh; y++) for (let x = fx; x < fx + fw; x++) {
    const i = (y * w + x) * 4;
    if (d[i + 3] >= 90) d[i + 3] = 255;
  }
}

const COLS = 7, FW = 96, FH = 80, rows = Math.ceil(frames.length / COLS);
const PAD_X = 6, PAD_Y = 18;

function render(kind) {
  Object.assign(C, POW[kind]);
  const S = sheet(FW, FH, COLS, rows);
  frames.forEach((fr, i) => {
    S.at(i); S.ox += PAD_X; S.oy += PAD_Y; fr.fn(S);
    const fx = (i % COLS) * FW, fy = Math.floor(i / COLS) * FH;
    S.frame(0, 0, S.w, S.h);
    solidify(S, fx, fy, FW, FH); outline(S, fx, fy, FW, FH);
  });
  S.save(path.join(ROOT, `assets/sprites/garibaldo_${kind}.png`));
  return S;
}
const sheets = {};
for (const k of Object.keys(POW)) sheets[k] = render(k);

// ---------- bola de fogo (projétil) 32x32, 4 quadros ----------
Object.assign(C, POW.fire);
const F = sheet(32, 32, 4, 1);
for (let i = 0; i < 4; i++) {
  F.at(i);
  flame(F, 21, 17, 6 + (i % 2), i * 1.7, 14);
  for (let k = 0; k < 3; k++) F.rect(4 + ((i * 5 + k * 7) % 12), 13 + ((i * 3 + k * 5) % 9), 1.5, 1.5, k % 2 ? C.fire3 : C.fire2);
  F.frame(0, 0, F.w, F.h); solidify(F, i * 32, 0, 32, 32);
}
F.save(path.join(ROOT, 'assets/sprites/fireball.png'));

// ---------- prévias ----------
function blit(src, frame, dst, dx, dy, z, bg) {
  const sx0 = (frame % COLS) * FW, sy0 = Math.floor(frame / COLS) * FH;
  for (let y = 0; y < FH * z; y++) for (let x = 0; x < FW * z; x++) {
    const si = ((sy0 + Math.floor(y / z)) * src.w + sx0 + Math.floor(x / z)) * 4;
    const chk = ((Math.floor(x / 16) + Math.floor(y / 16)) % 2) ? bg[0] : bg[1];
    const a = src.d[si + 3] / 255, o = ((dy + y) * dst.w + dx + x) * 4;
    for (let k = 0; k < 3; k++) dst.d[o + k] = src.d[si + k] * a + chk[k] * (1 - a);
    dst.d[o + 3] = 255;
  }
}
const BG = [[118, 126, 148], [106, 114, 136]];
const idx = n => frames.findIndex(f => f.name === n);

// folha completa (fogo), 4x
const Z = 4, full = new Img(sheets.fire.w * Z, sheets.fire.h * Z);
for (let f = 0; f < frames.length; f++) blit(sheets.fire, f, full, (f % COLS) * FW * Z, Math.floor(f / COLS) * FH * Z, Z, BG);
full.save(path.join(ROOT, 'preview/garibaldo-x4.png'));

// 3 poderes lado a lado: parado, carregando, disparando
const ZP = 4, pick = ['idle0', 'cast1', 'cast3', 'run2'];
const pw = new Img(FW * ZP * pick.length, FH * ZP * 3);
Object.keys(POW).forEach((k, r) => pick.forEach((n, c) => blit(sheets[k], idx(n), pw, c * FW * ZP, r * FH * ZP, ZP, BG)));
pw.save(path.join(ROOT, 'preview/garibaldo-poderes.png'));

fs.writeFileSync(path.join(ROOT, 'preview/garibaldo-frames.json'), JSON.stringify({ cols: COLS, fw: FW, fh: FH, names: frames.map(f => f.name) }));
console.log(`Garibaldo: ${frames.length} quadros x 3 poderes (${sheets.fire.w}x${sheets.fire.h}). Prévias em preview/`);
