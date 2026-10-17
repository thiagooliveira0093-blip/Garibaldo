// Gera a arte PLACEHOLDER do Guerreiro e do Arqueiro + projéteis das armas deles.
//   assets/sprites/warrior.png | archer.png (96x80, mesmo layout de quadros do mago)
//   assets/sprites/proj3.png (32x32): flechas, machado, lança, onda de choque, ícones
// Arquivos existentes NÃO são sobrescritos (use --force).
// Quadros: 0-3 parado · 4-5 agachado · 6-7 dano · 8-13 correndo · 14 pulo · 15 queda
//          16-21 ataque à distância · 22-23 dash · 24-27 morte · 28-33 golpe corpo a corpo
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, sheet, hex, alpha } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
function save(img, rel) {
  const file = path.join(ROOT, 'assets', rel);
  if (fs.existsSync(file) && !FORCE) { console.log('  mantido assets/' + rel); return; }
  img.save(file); console.log('  gerado  assets/' + rel);
}

const LINE = hex('#0b0812');
function finish(img, fw, fh, outline = true) {
  const d = img.d, w = img.w, cols = img.w / fw, rows = img.h / fh;
  for (let fy = 0; fy < rows; fy++) for (let fx = 0; fx < cols; fx++) {
    const x0 = fx * fw, y0 = fy * fh;
    for (let y = y0; y < y0 + fh; y++) for (let x = x0; x < x0 + fw; x++) { const i = (y * w + x) * 4; if (d[i + 3] >= 90) d[i + 3] = 255; }
    if (!outline) continue;
    const mark = [];
    for (let y = y0; y < y0 + fh; y++) for (let x = x0; x < x0 + fw; x++) {
      if (d[(y * w + x) * 4 + 3] > 20) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= x0 && ny >= y0 && nx < x0 + fw && ny < y0 + fh && d[(ny * w + nx) * 4 + 3] > 200) { mark.push(y * w + x); break; }
      }
    }
    for (const i of mark) { d[i * 4] = LINE[0]; d[i * 4 + 1] = LINE[1]; d[i * 4 + 2] = LINE[2]; d[i * 4 + 3] = 255; }
  }
}

// rastro translúcido do golpe (alpha < 0.35 para sobreviver ao finish())
function arcTrail(img, S, a0, a1, rIn, rOut, col, edge) {
  const n = 12, outer = [], inner = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    outer.push([S[0] + Math.cos(a) * rOut, S[1] + Math.sin(a) * rOut]);
    inner.push([S[0] + Math.cos(a) * rIn, S[1] + Math.sin(a) * rIn]);
  }
  img.poly([...outer, ...inner.slice().reverse()], alpha(col, 0.3));
  for (let i = Math.floor(n * 0.45); i < n; i++) img.line(outer[i][0], outer[i][1], outer[i + 1][0], outer[i + 1][1], alpha(edge, 0.95), 2);
}

const CX = 30, HEM = 59; // centro do corpo e linha do chão (antes da folga do quadro)

// ===================================================================== GUERREIRO
const WC = {
  steel: hex('#9aa7bd'), steelD: hex('#66748c'), steelL: hex('#d4dcea'), steelDD: hex('#46506a'),
  gold: hex('#e0b040'), goldD: hex('#a87a2a'), red: hex('#b3262c'), redD: hex('#6e1519'), redL: hex('#d9484a'),
  leather: hex('#5a3a22'), boot: hex('#2a1c14'), skin: hex('#e9b98a'), visor: hex('#ffb347'),
};

function warrior(img, o = {}) {
  const P = { bob: 0, lean: 0, crouch: 0, fF: [4, 0], fB: [-4, 0], cape: 3, capeLift: 0, plume: 2, arm: 'none', sa: 0, ext: 0, hit: false, trail: null, blade: 0, axe: 0, ...o };
  const hem = HEM, sx = CX + P.lean, shY = 26 + P.bob + P.crouch, hcx = sx + 1, hcy = shY - 9;

  // capa curta atrás
  const c = P.cape;
  img.poly([[sx - 5, shY], [sx + 2, shY + 2], [CX - 3, hem - 14 - P.capeLift], [CX - 9 - c, hem - 12 - P.capeLift * 1.4]], WC.redD);
  img.poly([[sx - 4, shY + 1], [sx + 1, shY + 3], [CX - 4, hem - 15 - P.capeLift], [CX - 8 - c, hem - 14 - P.capeLift * 1.3]], WC.red);
  // espada grande nas costas (some quando está empunhada)
  if (P.arm !== 'slash') {
    img.line(sx - 6, shY + 18, sx + 6, shY - 12, WC.steelD, 3); img.line(sx - 5, shY + 17, sx + 5, shY - 11, WC.steelL, 1);
    img.rect(sx + 3, shY - 13, 7, 2, WC.gold); img.rect(sx + 6, shY - 17, 2, 5, WC.leather);
  }
  // pernas e botas
  const leg = ([dx, lift]) => {
    img.rect(CX + dx - 3, hem - 16 - lift, 7, 13, WC.steelD); img.rect(CX + dx - 3, hem - 16 - lift, 7, 3, WC.steel);
    img.rect(CX + dx - 4, hem - 4 - lift, 9, 5, WC.boot); img.rect(CX + dx + 2, hem - 5 - lift, 4, 3, WC.boot);
  };
  leg(P.fB); leg(P.fF);
  // saiote e tronco
  img.poly([[sx - 8, shY + 16], [sx + 8, shY + 16], [CX + 9, hem - 14], [CX - 9, hem - 14]], WC.redD);
  img.poly([[sx - 9, shY - 1], [sx + 9, shY - 1], [sx + 8, shY + 17], [sx - 8, shY + 17]], WC.steel);
  img.poly([[sx - 9, shY - 1], [sx - 3, shY - 1], [sx - 3, shY + 17], [sx - 8, shY + 17]], WC.steelD);
  img.poly([[sx + 2, shY + 1], [sx + 8, shY + 1], [sx + 7, shY + 12], [sx + 2, shY + 12]], WC.steelL);
  img.rect(sx - 8, shY + 14, 16, 3, WC.leather); img.rect(sx - 1, shY + 13, 4, 5, WC.gold);
  img.line(sx - 6, shY + 8, sx + 7, shY + 8, WC.steelDD, 1);
  // ombreira grande
  img.circle(sx + 1, shY + 1, 7, WC.steel); img.circle(sx + 1, shY, 5, WC.steelL); img.rect(sx - 6, shY + 4, 14, 2, WC.gold);
  // elmo com viseira e penacho
  const t = P.plume;
  img.poly([[hcx - 4, hcy - 9], [hcx - 10 - t, hcy - 10 + t * 0.5], [hcx - 15 - t * 2, hcy - 4 + t], [hcx - 9, hcy - 5], [hcx - 3, hcy - 6]], WC.red);   // penacho
  img.poly([[hcx - 7, hcy + 8], [hcx - 8, hcy - 4], [hcx - 3, hcy - 11], [hcx + 5, hcy - 11], [hcx + 8, hcy - 3], [hcx + 8, hcy + 8]], WC.steel);
  img.poly([[hcx - 8, hcy - 4], [hcx - 3, hcy - 11], [hcx, hcy - 11], [hcx - 3, hcy + 8], [hcx - 7, hcy + 8]], WC.steelD);
  img.rect(hcx + 1, hcy - 2, 8, 3, hex('#0a0a12')); img.rect(hcx + 3, hcy - 2, 5, 1, P.hit ? hex('#ffffff') : WC.visor);                              // viseira
  img.line(hcx - 1, hcy - 11, hcx + 5, hcy - 11, WC.steelL, 1); img.rect(hcx + 5, hcy + 2, 3, 6, WC.steelD);
  img.rect(hcx - 8, hcy - 5, 17, 2, WC.gold);

  // braço
  const S = [sx + 5, shY + 5];
  const gauntlet = (x, y) => { img.circle(x, y, 3, WC.steelD); img.circle(x, y - 1, 2, WC.steel); };
  if (P.arm === 'throw') { // machado: erguido → arremesso
    const dx = Math.cos(P.sa), dy = Math.sin(P.sa), H = [S[0] + dx * (5 + P.ext * 9), S[1] + dy * (5 + P.ext * 9)];
    img.line(S[0], S[1], H[0], H[1], WC.steelD, 4); img.line(S[0], S[1] - 1, H[0], H[1] - 1, WC.steel, 1); gauntlet(H[0] + dx * 2, H[1] + dy * 2);
    if (P.axe) {
      const A = [H[0] + dx * 3, H[1] + dy * 3];
      img.line(A[0] - dy * 6, A[1] + dx * 6, A[0] + dy * 6, A[1] - dx * 6, WC.leather, 2);
      img.poly([[A[0] + dy * 6 - dx * 2, A[1] - dx * 6 - dy * 2], [A[0] + dy * 6 + dx * 9, A[1] - dx * 6 + dy * 9 - 2], [A[0] + dy * 1 + dx * 9, A[1] - dx * 1 + dy * 9], [A[0] + dy * 1 - dx * 2, A[1] - dx * 1 - dy * 2]], WC.steelL);
    }
  } else if (P.arm === 'slash') { // espadada com rastro
    const dx = Math.cos(P.sa), dy = Math.sin(P.sa), H = [S[0] + dx * 8, S[1] + dy * 8];
    if (P.trail) arcTrail(img, S, P.trail[0], P.trail[1], 28, 46, WC.steelL, hex('#ffffff'));
    img.line(S[0], S[1], H[0], H[1], WC.steelD, 4); gauntlet(H[0], H[1]);
    const L = P.blade, tip = [H[0] + dx * (L + 4), H[1] + dy * (L + 4)], px = -dy, py = dx;
    if (L > 0) {
      img.poly([[H[0] + dx * 4 + px * 3, H[1] + dy * 4 + py * 3], tip, [H[0] + dx * 4 - px * 3, H[1] + dy * 4 - py * 3]], WC.steelL);
      img.poly([[H[0] + dx * 4 + px, H[1] + dy * 4 + py], [tip[0] - dx * 2, tip[1] - dy * 2], [H[0] + dx * 4 - px, H[1] + dy * 4 - py]], hex('#ffffff'));
      img.line(H[0] + dx * 3 + px * 5, H[1] + dy * 3 + py * 5, H[0] + dx * 3 - px * 5, H[1] + dy * 3 - py * 5, WC.gold, 2);
    }
  } else {
    img.line(S[0], S[1], S[0] + 2, S[1] + 10, WC.steelD, 4); img.line(S[0] + 1, S[1], S[0] + 3, S[1] + 9, WC.steel, 1); gauntlet(S[0] + 3, S[1] + 12);
  }
}

function warriorLying(img) {
  img.rect(4, 55, 10, 5, WC.boot);
  img.poly([[12, 52], [38, 50], [40, 60], [12, 60]], WC.steel); img.poly([[12, 57], [40, 56], [40, 60], [12, 60]], WC.steelD);
  img.rect(20, 52, 3, 8, WC.gold); img.poly([[10, 52], [0, 56], [4, 60], [12, 59]], WC.red);
  img.poly([[38, 50], [46, 48], [54, 52], [54, 59], [46, 60], [38, 58]], WC.steel);
  img.rect(46, 53, 7, 2, hex('#0a0a12')); img.poly([[38, 49], [34, 44], [40, 47]], WC.red);
  img.line(16, 62, 52, 62, WC.steelL, 2);
}

// ===================================================================== ARQUEIRO
const AC = {
  green: hex('#4a6b3a'), greenD: hex('#2f4a28'), greenL: hex('#6f9a52'), tan: hex('#c9a46a'), tanD: hex('#9a7a48'),
  hair: hex('#7a3a22'), hairD: hex('#522414'), skin: hex('#f0c08a'), skinD: hex('#c98f5c'), band: hex('#c0392b'),
  wood: hex('#8a5a2c'), woodL: hex('#b07a40'), string: hex('#efe6cc'), shaft: hex('#d8c8a0'), fletch: hex('#c0392b'), steel: hex('#cfd8e6'),
  boot: hex('#3a2418'), pants: hex('#5a4630'), eye: hex('#3a2a1a'), quiver: hex('#6b4426'),
};

function archer(img, o = {}) {
  const P = { bob: 0, lean: 0, crouch: 0, fF: [4, 0], fB: [-4, 0], cape: 3, capeLift: 0, hair: 2, pose: 'idle', draw: 0, arrow: true, sa: 0, trail: null, blade: 0, ...o };
  const hem = HEM, sx = CX + P.lean, shY = 28 + P.bob + P.crouch, hcx = sx + 1, hcy = shY - 9;

  // aljava e flechas nas costas
  img.poly([[sx - 9, shY + 1], [sx - 5, shY - 1], [sx - 1, shY + 15], [sx - 6, shY + 17]], AC.quiver);
  for (let k = 0; k < 3; k++) { img.line(sx - 8 + k * 2, shY - 1, sx - 9 + k * 2 - 1, shY - 7 - k, AC.shaft, 1); img.rect(sx - 10 + k * 2, shY - 9 - k, 3, 3, AC.fletch); }
  // cabelo (rabo de cavalo) esvoaçando
  const hr = P.hair;
  img.poly([[hcx - 5, hcy - 4], [hcx - 12 - hr, hcy - 3 + hr * 0.4], [hcx - 17 - hr * 2, hcy + 4 + hr], [hcx - 9, hcy + 3]], AC.hair);
  img.poly([[hcx - 6, hcy - 2], [hcx - 13 - hr, hcy], [hcx - 9, hcy + 4]], AC.hairD);
  // capa curta
  const c = P.cape;
  img.poly([[sx - 4, shY], [sx + 2, shY + 2], [CX - 2, hem - 17 - P.capeLift], [CX - 7 - c, hem - 15 - P.capeLift * 1.3]], AC.greenD);
  // pernas
  const leg = ([dx, lift]) => {
    img.rect(CX + dx - 2, hem - 16 - lift, 6, 13, AC.pants);
    img.rect(CX + dx - 3, hem - 8 - lift, 8, 9, AC.boot); img.rect(CX + dx + 2, hem - 4 - lift, 4, 4, AC.boot); img.rect(CX + dx - 3, hem - 9 - lift, 8, 1, AC.tan);
  };
  leg(P.fB); leg(P.fF);
  // túnica
  img.poly([[sx - 7, shY], [sx + 7, shY], [CX + 8, hem - 14], [CX - 8, hem - 14]], AC.green);
  img.poly([[sx - 7, shY], [sx - 2, shY], [CX - 3, hem - 14], [CX - 8, hem - 14]], AC.greenD);
  img.poly([[sx + 2, shY + 1], [sx + 7, shY], [CX + 8, hem - 16], [CX + 4, hem - 16]], AC.greenL);
  img.rect(sx - 7, shY + 13, 14, 3, AC.tanD); img.rect(sx, shY + 12, 3, 5, AC.tan);                         // cinto
  img.poly([[sx - 7, shY], [sx + 7, shY], [sx + 5, shY + 5], [sx - 5, shY + 5]], AC.tan);                       // peitoral de couro
  img.line(sx - 6, shY + 1, sx + 5, shY + 17, AC.quiver, 1);                                                    // alça da aljava
  // cabeça
  img.rect(hcx - 5, hcy - 8, 11, 12, AC.skin); img.rect(hcx + 4, hcy - 2, 3, 3, AC.skin); img.rect(hcx + 5, hcy, 2, 1, AC.skinD);
  img.poly([[hcx - 6, hcy - 9], [hcx + 6, hcy - 9], [hcx + 7, hcy - 4], [hcx - 6, hcy - 3]], AC.hair);          // franja
  img.rect(hcx - 6, hcy - 6, 13, 2, AC.band);                                                                  // faixa
  img.rect(hcx + 3, hcy - 2, 2, 2, AC.eye); img.rect(hcx + 3, hcy - 3, 3, 1, AC.hairD);
  img.rect(hcx - 5, hcy + 3, 11, 3, AC.tan);                                                                   // gola

  // braço e arma
  const S = [sx + 4, shY + 4];
  // o arco inteiro gira em torno do ombro quando o arqueiro mira na diagonal ou para cima
  const A = P.aim || 0, ca = Math.cos(A), sa = Math.sin(A);
  const T = (x, y) => [S[0] + (x - S[0]) * ca - (y - S[1]) * sa, S[1] + (x - S[0]) * sa + (y - S[1]) * ca];
  const L = (p, q, c, t) => { const a = T(p[0], p[1]), b = T(q[0], q[1]); img.line(a[0], a[1], b[0], b[1], c, t); };
  const bow = (bx, by, pull, nock) => {
    const top = [bx - 1, by - 15], bot = [bx - 1, by + 15], mid = [bx + 5, by];
    L(top, [mid[0] - 1, by - 7], AC.wood, 2); L([mid[0] - 1, by - 7], [mid[0], by], AC.woodL, 3);
    L([mid[0], by], [mid[0] - 1, by + 7], AC.woodL, 3); L([mid[0] - 1, by + 7], bot, AC.wood, 2);
    const nx = bx - pull; // corda puxada
    L(top, [nx, by], alpha(AC.string, 0.9), 1); L([nx, by], bot, alpha(AC.string, 0.9), 1);
    if (nock) {
      L([nx, by], [bx + 12, by], AC.shaft, 1);
      img.poly([T(bx + 12, by - 2), T(bx + 16, by), T(bx + 12, by + 2)], AC.steel);
      L([nx, by - 2], [nx + 4, by - 2], AC.fletch, 1); L([nx, by + 1], [nx + 4, by + 1], AC.fletch, 1);
    }
    return T(nx, by);
  };
  if (P.pose === 'draw') {
    const by = S[1] + 2, bx = S[0] + 12;
    const fh = T(bx - 1, by), fh2 = T(bx - 2, by);
    img.line(S[0], S[1], fh2[0], fh2[1], AC.green, 4); img.circle(fh[0], fh[1], 2.2, AC.skin);                              // braço da frente segura o arco
    const [nx, ny] = bow(bx, by, 3 + P.draw * 7, P.arrow);
    img.line(S[0], S[1] + 1, nx, ny, AC.greenD, 3); img.circle(nx, ny, 2, AC.skin);                                  // braço de trás puxa a corda
  } else if (P.pose === 'stab') {
    const dx = Math.cos(P.sa), dy = Math.sin(P.sa), H = [S[0] + dx * 9, S[1] + dy * 9];
    if (P.trail) arcTrail(img, S, P.trail[0], P.trail[1], 14, 28, AC.steel, hex('#ffffff'));
    img.line(S[0], S[1], H[0], H[1], AC.green, 4); img.circle(H[0] + dx * 2, H[1] + dy * 2, 2.2, AC.skin);
    if (P.blade > 0) {
      const tip = [H[0] + dx * (P.blade + 3), H[1] + dy * (P.blade + 3)], px = -dy, py = dx;
      img.poly([[H[0] + dx * 3 + px * 2, H[1] + dy * 3 + py * 2], tip, [H[0] + dx * 3 - px * 2, H[1] + dy * 3 - py * 2]], AC.steel);
      img.line(H[0] + dx * 2 + px * 3, H[1] + dy * 2 + py * 3, H[0] + dx * 2 - px * 3, H[1] + dy * 2 - py * 3, AC.tanD, 2);
    }
  } else {
    img.line(S[0], S[1], S[0] + 2, S[1] + 9, AC.green, 4); img.circle(S[0] + 3, S[1] + 11, 2.2, AC.skin);
    // arco segurado para baixo, ao lado do corpo
    img.line(S[0] + 6, S[1] - 2, S[0] + 7, S[1] + 8, AC.wood, 2); img.line(S[0] + 7, S[1] + 8, S[0] + 6, S[1] + 18, AC.wood, 2);
    img.line(S[0] + 6, S[1] - 2, S[0] + 6, S[1] + 18, alpha(AC.string, 0.9), 1);
  }
}

function archerLying(img) {
  img.rect(4, 55, 10, 5, AC.boot);
  img.poly([[12, 53], [38, 51], [40, 60], [12, 60]], AC.green); img.poly([[12, 57], [40, 56], [40, 60], [12, 60]], AC.greenD);
  img.poly([[10, 53], [0, 55], [3, 60], [12, 59]], AC.greenD); img.poly([[34, 51], [26, 46], [24, 51]], AC.quiver);
  img.circle(46, 55, 5, AC.skin); img.poly([[41, 50], [52, 50], [52, 54], [41, 55]], AC.hair); img.rect(41, 52, 12, 2, AC.band);
  img.poly([[38, 56], [24, 60], [10, 62], [4, 62]], alpha(AC.hair, 0.9)); img.line(16, 62, 56, 62, AC.wood, 2);
}

// ===================================================================== MONTAGEM DAS FOLHAS
const frames = (draw, lying, kit) => {
  const f = [], add = (name, fn) => f.push({ name, fn });
  for (let i = 0; i < 4; i++) add(`idle${i}`, im => draw(im, { bob: [0, 0, -1, -1][i], cape: 2 + (i % 2), plume: i % 2, hair: 1 + (i % 2) }));
  for (let i = 0; i < 2; i++) add(`crouch${i}`, im => draw(im, { crouch: 9, bob: i, fF: [6, 0], fB: [-6, 0], cape: 3 }));
  add('hurt0', im => draw(im, { lean: -3, bob: 1, cape: 6, plume: 4, hair: 5, capeLift: 2, hit: true }));
  add('hurt1', im => draw(im, { lean: -4, bob: 2, crouch: 3, cape: 7, plume: 5, hair: 6, hit: true }));
  for (let i = 0; i < 6; i++) {
    const s = Math.sin((i / 6) * Math.PI * 2), co = Math.cos((i / 6) * Math.PI * 2);
    add(`run${i}`, im => draw(im, { lean: 2, bob: i % 3 === 0 ? 1 : -1, fF: [4 + Math.round(s * 7), Math.max(0, Math.round(-co * 3))], fB: [-4 - Math.round(s * 7), Math.max(0, Math.round(co * 3))], cape: 5 + Math.abs(s) * 3, capeLift: 2, plume: 4, hair: 4 }));
  }
  add('jump', im => draw(im, { bob: -2, fF: [6, 5], fB: [-2, 7], cape: 4, capeLift: 5, plume: 5, hair: 5 }));
  add('fall', im => draw(im, { fF: [4, 1], fB: [-4, 2], cape: 5, capeLift: 10, plume: 6, hair: 6 }));
  kit.ranged.forEach((p, i) => add(`ranged${i}`, im => draw(im, { fF: [6, 0], fB: [-5, 0], ...p })));
  add('dash0', im => draw(im, { lean: 7, bob: 3, crouch: 3, fF: [9, 0], fB: [-8, 2], cape: 14, capeLift: 4, plume: 8, hair: 8 }));
  add('dash1', im => draw(im, { lean: 8, bob: 4, crouch: 4, fF: [10, 1], fB: [-9, 3], cape: 18, capeLift: 5, plume: 9, hair: 9 }));
  add('dead0', im => draw(im, { lean: -4, bob: 1, crouch: 2, cape: 6, plume: 4, hair: 5, hit: true }));
  add('dead1', im => draw(im, { lean: -5, bob: 4, crouch: 9, cape: 4, plume: 5, hair: 6, hit: true }));
  add('dead2', im => draw(im, { lean: -8, bob: 9, crouch: 14, cape: 3, plume: 6, hair: 7, fF: [8, 0], fB: [-8, 0], hit: true }));
  add('dead3', im => lying(im));
  kit.melee.forEach((p, i) => add(`melee${i}`, im => draw(im, { fF: [6, 0], fB: [-5, 0], ...p })));
  // ataque à distância mirando na diagonal (34-39) e para cima (40-45)
  kit.rangedDiag.forEach((p, i) => add(`rangedd${i}`, im => draw(im, { fF: [6, 0], fB: [-5, 0], ...p })));
  kit.rangedUp.forEach((p, i) => add(`rangedu${i}`, im => draw(im, { fF: [6, 0], fB: [-5, 0], ...p })));
  return f;
};

const COLS = 7, FW = 96, FH = 80, PAD_X = 6, PAD_Y = 18;
function render(fr, file) {
  const S = sheet(FW, FH, COLS, Math.ceil(fr.length / COLS));
  fr.forEach((f, i) => { S.at(i); S.ox += PAD_X; S.oy += PAD_Y; f.fn(S); });
  S.frame(0, 0, S.w, S.h);
  finish(S, FW, FH);
  save(S, file);
}

// Guerreiro: arremesso de machado (ranged) e espadada (melee)
const throwAim = sas => [[0.3, 1, -2], [0.8, 1, -3], [1, 1, -1], [1, 1, 2], [1, 0, 4], [0.6, 0, 2]]
  .map(([ext, axe, lean], i) => ({ arm: 'throw', sa: sas[i], ext, axe, lean, ...(i === 1 ? { plume: 3 } : {}), ...(i >= 3 ? { plume: 4 + (i - 3) } : {}) }));
render(frames(warrior, warriorLying, {
  rangedDiag: throwAim([-2.1, -2.4, -1.9, -1.1, -0.8, -0.5]),
  rangedUp: throwAim([-2.2, -2.5, -2.1, -1.8, -1.55, -1.25]),
  ranged: [
    { arm: 'throw', sa: -2.0, ext: 0.3, axe: 1, lean: -2 },
    { arm: 'throw', sa: -2.3, ext: 0.8, axe: 1, lean: -3, plume: 3 },
    { arm: 'throw', sa: -1.7, ext: 1, axe: 1, lean: -1 },
    { arm: 'throw', sa: -0.6, ext: 1, axe: 1, lean: 2, plume: 4 },
    { arm: 'throw', sa: -0.05, ext: 1, axe: 0, lean: 4, plume: 5 },
    { arm: 'throw', sa: 0.3, ext: 0.6, axe: 0, lean: 2 },
  ],
  melee: [
    { arm: 'slash', sa: -2.4, blade: 30, lean: -3, plume: 3 },
    { arm: 'slash', sa: -1.8, blade: 34, lean: -2, plume: 3, cape: 5 },
    { arm: 'slash', sa: -0.95, blade: 34, lean: 2, plume: 5, cape: 6, trail: [-1.9, -0.95] },
    { arm: 'slash', sa: 0.1, blade: 34, lean: 5, plume: 6, cape: 8, trail: [-2.0, 0.1] },
    { arm: 'slash', sa: 0.9, blade: 30, lean: 5, plume: 5, cape: 7, trail: [-0.1, 0.9] },
    { arm: 'slash', sa: 0.8, blade: 20, lean: 2, plume: 3 },
  ],
}), 'sprites/warrior.png');

// Arqueiro: puxa o arco (ranged) e golpeia com adaga (melee)
const drawAim = aim => [
  { draw: 0.1, arrow: true, lean: -1 }, { draw: 0.4, arrow: true, lean: -1 }, { draw: 0.8, arrow: true, lean: -2 },
  { draw: 1, arrow: true, lean: -2, hair: 3 }, { draw: 0.1, arrow: false, lean: 1, hair: 4 }, { draw: 0, arrow: false, lean: 0 },
].map(p => ({ pose: 'draw', aim, ...p }));
render(frames(archer, archerLying, {
  rangedDiag: drawAim(-0.7),
  rangedUp: drawAim(-1.4),
  ranged: [
    { pose: 'draw', draw: 0.1, arrow: true, lean: -1 },
    { pose: 'draw', draw: 0.4, arrow: true, lean: -1 },
    { pose: 'draw', draw: 0.8, arrow: true, lean: -2 },
    { pose: 'draw', draw: 1, arrow: true, lean: -2, hair: 3 },
    { pose: 'draw', draw: 0.1, arrow: false, lean: 1, hair: 4 },
    { pose: 'draw', draw: 0, arrow: false, lean: 0 },
  ],
  melee: [
    { pose: 'stab', sa: 0.5, blade: 8, lean: -3 },
    { pose: 'stab', sa: 0.2, blade: 10, lean: -2 },
    { pose: 'stab', sa: -0.15, blade: 12, lean: 3, trail: [-0.9, -0.1] },
    { pose: 'stab', sa: -0.05, blade: 12, lean: 5, trail: [-1.0, 0.1] },
    { pose: 'stab', sa: 0.05, blade: 10, lean: 4 },
    { pose: 'stab', sa: 0.4, blade: 6, lean: 1 },
  ],
}), 'sprites/archer.png');

// ===================================================================== PROJÉTEIS 32x32 (proj3.png)
// 0-1 flecha · 2-3 flecha de fogo · 4 lança · 5-8 machado girando · 9-10 onda de choque
// 11 ícone flecha · 12 ícone flecha de fogo · 13 ícone flecha tripla · 14 ícone machado · 15 ícone lança · 16 ícone onda
function genProjectiles() {
  const P = sheet(32, 32, 8, 3);
  const arrow = (i, fire) => {
    P.at(i);
    const shaft = AC.shaft, y = 16;
    if (fire) { P.circle(24, y, 8, alpha(hex('#ff6a2a'), 0.25)); P.poly([[18, y - 3], [30, y], [18, y + 3]], hex('#ff8a2a')); P.circle(25, y, 3, hex('#ffd24a')); P.poly([[3, y - 2], [10 + (i % 2) * 2, y], [3, y + 2]], alpha(hex('#ff6a2a'), 0.8)); }
    P.line(5, y, 24, y, shaft, 2);
    P.poly([[22, y - 3], [30, y], [22, y + 3]], fire ? hex('#ffd24a') : AC.steel);
    P.rect(3, y - 3, 5, 2, AC.fletch); P.rect(3, y + 1, 5, 2, AC.fletch);
  };
  arrow(0, false); arrow(1, false); arrow(2, true); arrow(3, true);
  P.at(4); P.line(2, 16, 26, 16, AC.wood, 3); P.poly([[24, 11], [31, 16], [24, 21]], WC.steelL); P.poly([[24, 13], [28, 16], [24, 19]], hex('#ffffff'));
  P.rect(8, 14, 2, 4, WC.red); P.line(2, 16, 22, 16, alpha(WC.steelL, 0.25), 6);
  for (let k = 0; k < 4; k++) {
    P.at(5 + k);
    const a = (k / 4) * (Math.PI / 2), c = Math.cos(a), s = Math.sin(a);
    const R = (x, y) => [16 + x * c - y * s, 16 + x * s + y * c];
    P.line(...R(0, -11), ...R(0, 11), WC.leather, 3);
    P.poly([R(0, -11), R(11, -13), R(13, -5), R(0, -3)], WC.steelL); P.poly([R(0, -9), R(9, -11), R(10, -6), R(0, -5)], hex('#ffffff'));
    P.poly([R(0, 11), R(-9, 12), R(-10, 6), R(0, 5)], WC.steelD);
  }
  for (let k = 0; k < 2; k++) {
    P.at(9 + k);
    P.poly([[2, 30], [10, 8 + k * 3], [18, 30]], alpha(hex('#ffb347'), 0.35));
    P.poly([[6, 30], [14, 4 + k * 4], [22, 30]], hex('#ff8a2a')); P.poly([[10, 30], [15, 12 + k * 3], [20, 30]], hex('#ffd24a'));
    P.poly([[13, 30], [16, 18], [19, 30]], hex('#ffffff'));
  }
  // ícones do HUD
  P.at(11); P.line(4, 16, 22, 16, AC.shaft, 2); P.poly([[20, 12], [28, 16], [20, 20]], AC.steel); P.rect(3, 12, 5, 3, AC.fletch); P.rect(3, 17, 5, 3, AC.fletch);
  P.at(12); P.circle(22, 16, 8, alpha(hex('#ff6a2a'), 0.35)); P.line(4, 16, 22, 16, AC.shaft, 2); P.poly([[20, 12], [28, 16], [20, 20]], hex('#ffd24a')); P.circle(23, 16, 3, hex('#ff8a2a')); P.rect(3, 12, 5, 3, AC.fletch);
  P.at(13); for (const dy of [-6, 0, 6]) { P.line(6, 16 + dy, 22, 16 + dy * 1.6, AC.shaft, 1); P.poly([[21, 14 + dy * 1.6], [27, 16 + dy * 1.6], [21, 18 + dy * 1.6]], AC.steel); }
  P.at(14); P.line(16, 6, 16, 27, WC.leather, 3); P.poly([[16, 6], [27, 4], [28, 14], [16, 15]], WC.steelL); P.poly([[16, 8], [25, 7], [26, 12], [16, 12]], hex('#ffffff'));
  P.at(15); P.line(3, 25, 25, 7, AC.wood, 3); P.poly([[22, 3], [29, 3], [29, 10]], WC.steelL); P.rect(8, 20, 3, 3, WC.red);
  P.at(16); P.poly([[4, 28], [11, 6], [18, 28]], hex('#ff8a2a')); P.poly([[12, 28], [19, 10], [26, 28]], hex('#ffd24a'));
  finish(P, 32, 32, false);
  save(P, 'sprites/proj3.png');
}
genProjectiles();
