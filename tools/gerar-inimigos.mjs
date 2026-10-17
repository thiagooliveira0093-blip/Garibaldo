// Gera os inimigos de VISÃO DE CIMA (3/4) em assets/sprites/. Vistas: 0 = frente, 1 = costas, 2 = lado (direita; o jogo espelha).
//   ghoul.png    48x48  · carniçal: 3 vistas x 4 quadros de andar (índice = vista*4 + k)
//   skeleton.png 48x48  · esqueleto arqueiro: 3 vistas x (4 andar + 1 atirar) (índice = vista*5 + k, k=4 é atirar)
//   brute.png    64x64  · bruto: 3 vistas x 4 quadros
//   bat.png      32x32  · morcego: 4 quadros
//   boss.png     128x128· Senhor Demônio: 0-3 parado · 4-5 atacando
// Arquivos existentes NÃO são sobrescritos (use --force).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheet, hex, alpha } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const LINE = hex('#0b0812');
let written = 0, skipped = 0;

function save(img, fw, fh, name) {
  const file = path.join(ROOT, 'assets', 'sprites', name);
  if (fs.existsSync(file) && !FORCE) { skipped++; return; }
  const d = img.d, w = img.w, cols = img.w / fw, rows = img.h / fh;
  for (let fy = 0; fy < rows; fy++) for (let fx = 0; fx < cols; fx++) {
    const x0 = fx * fw, y0 = fy * fh;
    for (let y = y0; y < y0 + fh; y++) for (let x = x0; x < x0 + fw; x++) { const i = (y * w + x) * 4; if (d[i + 3] >= 90) d[i + 3] = 255; }
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
  img.save(file); written++; console.log('  gerado  assets/sprites/' + name);
}

// ===================================================================== CARNIÇAL 48x48
function ghoul(img, view, k) {
  const P = { skin: hex('#7f9f6c'), skinL: hex('#a4c58c'), skinD: hex('#4d6b43'), cloth: hex('#5a4630'), eye: hex('#ff3b3b'), claw: hex('#e8e0cc') };
  const cx = 24, base = 44, bob = [0, -1, 0, -1][k], ls = [-3, 0, 3, 0][k], as = -ls;
  const side = view === 2, back = view === 1;
  const lean = side ? 4 : 0;                                        // corcunda: tronco inclinado para a frente
  // pernas
  if (side) { img.rect(cx - 2 - ls, 31, 5, 13, P.skinD); img.rect(cx + 1 + ls, 31, 5, 13, P.skin); img.rect(cx - 3 - ls, base - 2, 8, 3, P.cloth); img.rect(cx + ls, base - 2, 8, 3, P.cloth); }
  else { img.rect(cx - 8 + ls, 31, 5, 13, P.skinD); img.rect(cx + 3 - ls, 31, 5, 13, P.skin); img.rect(cx - 9 + ls, base - 2, 7, 3, P.cloth); img.rect(cx + 2 - ls, base - 2, 7, 3, P.cloth); }
  // tronco curvado
  img.poly([[cx - 9 + lean, 19 + bob], [cx + 9 + lean, 19 + bob], [cx + 7 + lean * 0.4, 34], [cx - 7 + lean * 0.4, 34]], P.skin);
  img.poly([[cx - 9 + lean, 19 + bob], [cx - 2 + lean, 19 + bob], [cx - 3 + lean * 0.4, 34], [cx - 7 + lean * 0.4, 34]], P.skinD);
  img.poly([[cx - 8 + lean * 0.4, 31], [cx + 8 + lean * 0.4, 31], [cx + 9, 38], [cx - 9, 38]], P.cloth);  // trapo na cintura
  if (!back) { for (let r = 0; r < 3; r++) img.line(cx - 4 + lean, 22 + r * 3 + bob, cx + 4 + lean, 22 + r * 3 + bob, P.skinD, 1); }
  else { for (let r = 0; r < 4; r++) img.rect(cx - 1 + lean, 21 + r * 3 + bob, 3, 2, P.skinL); }              // coluna saltada
  // braços longos com garras
  const arm = (sx, sy, ex, ey) => { img.line(sx, sy, ex, ey, P.skin, 4); img.line(sx, sy, ex, ey - 1, P.skinL, 1); for (let c = -1; c <= 1; c++) img.rect(ex + c * 2 - 1, ey + 1, 2, 4, P.claw); };
  if (side) arm(cx + 3 + lean, 22 + bob, cx + 15 + as, 28 + bob + (k % 2));
  else { arm(cx - 10, 22 + bob, cx - 13 + as, 37 + bob); arm(cx + 10, 22 + bob, cx + 13 - as, 37 + bob); }
  // cabeça
  const hx = cx + (side ? 7 : 0), hy = 14 + bob;
  img.circle(hx, hy, 8, P.skin); img.circle(hx - 2, hy - 2, 4, P.skinL);
  if (back) { for (let s = 0; s < 4; s++) img.line(hx - 5 + s * 3, hy - 6, hx - 6 + s * 3, hy + 2, P.skinD, 1); }
  else {
    const fx = hx + (side ? 3 : 0);
    img.circle(fx - (side ? 0 : 3), hy - 1, 3.5, alpha(P.eye, 0.3)); img.circle(fx + (side ? 4 : 3), hy - 1, 3.5, alpha(P.eye, 0.3));
    img.rect(fx - (side ? 1 : 4), hy - 2, 3, 3, P.eye); if (!side) img.rect(fx + 2, hy - 2, 3, 3, P.eye); else img.rect(fx + 3, hy - 2, 3, 3, P.eye);
    img.rect(fx - (side ? 1 : 3), hy + 3, side ? 8 : 7, 3, hex('#2a0f10')); img.rect(fx - (side ? 0 : 2), hy + 3, 1, 2, P.claw); img.rect(fx + (side ? 4 : 2), hy + 3, 1, 2, P.claw);
  }
}

// ===================================================================== ESQUELETO ARQUEIRO 48x48
function skeleton(img, view, k) {
  const P = { bone: hex('#ebe3cf'), boneD: hex('#a79e86'), boneL: hex('#fffaf0'), eye: hex('#ff4040'), bow: hex('#7a4a22'), bowL: hex('#a8703a'), string: hex('#efe6cc') };
  const shoot = k === 4, cx = 24, base = 44;
  const wk = shoot ? 0 : k, bob = [0, -1, 0, -1][wk], ls = shoot ? 0 : [-3, 0, 3, 0][wk];
  const side = view === 2, back = view === 1;
  // pernas (ossos finos)
  const leg = (x, l) => { img.rect(x, 31, 3, 13, P.bone); img.rect(x - 1, base - 2, 6, 3, P.boneD); };
  if (side) { leg(cx - 3 - ls, 0); leg(cx + 1 + ls, 0); } else { leg(cx - 7 + ls, 0); leg(cx + 4 - ls, 0); }
  // bacia e costelas
  img.rect(cx - 6, 29, 12, 4, P.bone); img.rect(cx - 4, 31, 3, 3, P.boneD);
  const tw = side ? 6 : 9;
  img.poly([[cx - tw, 16 + bob], [cx + tw, 16 + bob], [cx + tw - 2, 30], [cx - tw + 2, 30]], hex('#2a2430'));       // vão entre as costelas
  for (let r = 0; r < 4; r++) img.rect(cx - tw + 1 + (r % 2), 17 + r * 3 + bob, tw * 2 - 2 - (r % 2) * 2, 2, back ? P.boneD : P.bone);
  if (back) img.rect(cx - 1, 16 + bob, 3, 14, P.bone);
  // braços e arco
  const bx = side ? cx + 12 : cx + 14;
  if (shoot) {     // arco esticado à frente
    img.line(bx, 12 + bob, bx + 3, 24 + bob, P.bow, 2); img.line(bx + 3, 24 + bob, bx, 36 + bob, P.bow, 2);
    img.line(bx, 12 + bob, bx - 7, 24 + bob, alpha(P.string, 0.9), 1); img.line(bx - 7, 24 + bob, bx, 36 + bob, alpha(P.string, 0.9), 1);
    img.line(bx - 7, 24 + bob, bx + 6, 24 + bob, hex('#d8c8a0'), 1);
    img.line(cx + 4, 20 + bob, bx, 24 + bob, P.bone, 2); img.line(cx - 4, 20 + bob, bx - 7, 24 + bob, P.bone, 2);
  } else {
    img.line(cx + tw, 18 + bob, cx + tw + 3, 30 + bob, P.bone, 2); img.line(cx - tw, 18 + bob, cx - tw - 3, 30 + bob, P.bone, 2);
    img.line(cx + tw + 5, 14 + bob, cx + tw + 7, 34 + bob, P.bow, 2);                    // arco na mão
    img.line(cx + tw + 5, 14 + bob, cx + tw + 5, 34 + bob, alpha(P.string, 0.8), 1);
  }
  // crânio
  const hx = cx + (side ? 3 : 0), hy = 10 + bob;
  img.circle(hx, hy, 8, P.bone); img.circle(hx - 2, hy - 3, 4, P.boneL); img.rect(hx - 5, hy + 5, 11, 4, P.bone);
  if (!back) {
    const ex = side ? 3 : 0;
    img.circle(hx - 3 + ex, hy, 3.5, hex('#1a1218')); img.circle(hx + 3 + (side ? 2 : 0), hy, 3.5, hex('#1a1218'));
    img.rect(hx - 3 + ex, hy - 1, 2, 2, P.eye); img.rect(hx + 3 + (side ? 2 : 0), hy - 1, 2, 2, P.eye);
    for (let t = 0; t < 4; t++) img.rect(hx - 4 + t * 3, hy + 6, 1, 3, hex('#2a2128'));
  } else { img.line(hx - 4, hy - 4, hx + 4, hy - 4, P.boneD, 1); img.line(hx, hy - 6, hx, hy + 5, P.boneD, 1); }
}

// ===================================================================== BRUTO 64x64
function brute(img, view, k) {
  const P = { skin: hex('#a36f4b'), skinD: hex('#6e4630'), iron: hex('#5d6577'), ironD: hex('#3c4252'), ironL: hex('#8b95aa'), eye: hex('#ffcc33'), wood: hex('#6b4426'), woodL: hex('#8b5e34'), bone: hex('#e8dfc8') };
  const cx = 32, base = 58, bob = [0, -2, 0, -2][k], ls = [-4, 0, 4, 0][k];
  const side = view === 2, back = view === 1;
  // pernas grossas
  if (side) { img.rect(cx - 5 - ls, 40, 9, 18, P.ironD); img.rect(cx - 1 + ls, 40, 9, 18, P.iron); img.rect(cx - 7 - ls, base - 3, 13, 5, P.ironD); img.rect(cx - 2 + ls, base - 3, 13, 5, P.ironD); }
  else { img.rect(cx - 13 + ls, 40, 11, 18, P.ironD); img.rect(cx + 3 - ls, 40, 11, 18, P.iron); img.rect(cx - 15 + ls, base - 3, 14, 5, P.ironD); img.rect(cx + 2 - ls, base - 3, 14, 5, P.ironD); }
  // tronco enorme
  const tw = side ? 12 : 18;
  img.poly([[cx - tw, 22 + bob], [cx + tw, 22 + bob], [cx + tw - 3, 44], [cx - tw + 3, 44]], P.skin);
  img.poly([[cx - tw, 22 + bob], [cx - 2, 22 + bob], [cx - 4, 44], [cx - tw + 3, 44]], P.skinD);
  img.poly([[cx - tw + 1, 30 + bob], [cx + tw - 1, 30 + bob], [cx + tw - 3, 42], [cx - tw + 3, 42]], P.iron);       // peitoral de ferro
  img.poly([[cx - tw + 1, 30 + bob], [cx - 3, 30 + bob], [cx - 5, 42], [cx - tw + 3, 42]], P.ironD);
  img.rect(cx - 3, 32 + bob, 6, 8, P.ironL);
  if (back) img.line(cx, 24 + bob, cx, 42, P.ironD, 1);
  img.rect(cx - tw + 2, 42, tw * 2 - 4, 4, P.wood);                                                                   // cinto
  // ombreiras com espinhos
  const sh = (x) => { img.circle(x, 25 + bob, 8, P.iron); img.circle(x - 1, 23 + bob, 5, P.ironL); img.poly([[x - 3, 19 + bob], [x, 11 + bob], [x + 3, 19 + bob]], P.bone); };
  if (side) sh(cx + 1); else { sh(cx - tw - 1); sh(cx + tw + 1); }
  // clava
  const sw = [0, 2, 0, -2][k];
  const mx = side ? cx + 16 : cx + tw + 8;
  img.line(mx, 20 + bob + sw, mx + 2, 52 + bob, P.wood, 4); img.line(mx + 1, 22 + bob + sw, mx + 3, 50 + bob, P.woodL, 1);
  img.circle(mx + 1, 18 + bob + sw, 8, P.wood); for (let s = 0; s < 6; s++) { const a = (s / 6) * Math.PI * 2; img.rect(mx + 1 + Math.cos(a) * 8 - 1, 18 + bob + sw + Math.sin(a) * 8 - 1, 3, 3, P.bone); }
  img.line(cx + (side ? 6 : tw - 2), 26 + bob, mx, 34 + bob, P.skin, 6);                                              // braço que segura
  // cabeça com capacete de chifres
  const hx = cx + (side ? 4 : 0), hy = 14 + bob;
  img.circle(hx, hy, 9, P.iron); img.circle(hx - 2, hy - 3, 5, P.ironL);
  img.poly([[hx - 8, hy - 5], [hx - 15, hy - 14], [hx - 6, hy - 9]], P.bone); img.poly([[hx + 8, hy - 5], [hx + 15, hy - 14], [hx + 6, hy - 9]], P.bone);
  if (!back) { img.rect(hx - 6 + (side ? 3 : 0), hy - 1, 12, 4, hex('#0a0a12')); img.rect(hx - 4 + (side ? 3 : 0), hy, 3, 2, P.eye); img.rect(hx + 2 + (side ? 3 : 0), hy, 3, 2, P.eye); }
  else img.line(hx, hy - 8, hx, hy + 8, P.ironD, 1);
}

// ===================================================================== MORCEGO 32x32
function bat(img, k) {
  const P = { body: hex('#4a1a2e'), wing: hex('#6e2540'), wingD: hex('#3a1224'), eye: hex('#ff4040'), claw: hex('#e8dfc8') };
  const up = [-9, -3, 4, -3][k], cx = 16, cy = 18;
  for (const s of [-1, 1]) {
    img.poly([[cx + s * 3, cy - 2], [cx + s * 15, cy + up - 4], [cx + s * 12, cy + up + 2], [cx + s * 8, cy + up + 6], [cx + s * 4, cy + 4]], P.wing);
    img.line(cx + s * 3, cy - 1, cx + s * 15, cy + up - 4, P.wingD, 1); img.line(cx + s * 3, cy, cx + s * 12, cy + up + 2, P.wingD, 1);
  }
  img.ellipse(cx, cy, 5, 6, P.body);
  img.poly([[cx - 4, cy - 5], [cx - 6, cy - 11], [cx - 1, cy - 6]], P.body); img.poly([[cx + 4, cy - 5], [cx + 6, cy - 11], [cx + 1, cy - 6]], P.body);
  img.rect(cx - 3, cy - 2, 2, 2, P.eye); img.rect(cx + 1, cy - 2, 2, 2, P.eye);
  img.rect(cx - 2, cy + 2, 1, 2, P.claw); img.rect(cx + 1, cy + 2, 1, 2, P.claw);
}

// ===================================================================== SENHOR DEMÔNIO 128x128
function boss(img, k, attack) {
  const P = { body: hex('#7a1822'), bodyD: hex('#4a0c14'), bodyL: hex('#b0303a'), bone: hex('#d9cba8'), memb: hex('#3a0c18'), membL: hex('#5a1424'), lava: hex('#ff8a2a'), eye: hex('#ffd24a') };
  const cx = 64, bob = [0, -2, 0, -2][k % 4], up = attack ? -10 : 0;
  // asas
  for (const s of [-1, 1]) {
    const sx = cx + s * 22, sy = 48 + bob;
    img.poly([[sx, sy], [cx + s * 58, sy - 34 - up * 0.3], [cx + s * 46, sy - 8], [cx + s * 60, sy + 10], [cx + s * 44, sy + 18], [cx + s * 52, sy + 40], [sx - s * 4, sy + 30]], P.memb);
    img.poly([[sx, sy + 2], [cx + s * 46, sy - 6], [cx + s * 42, sy + 14], [sx, sy + 26]], P.membL);
    for (const [ex, ey] of [[58, -34], [60, 10], [52, 40]]) img.line(sx, sy, cx + s * ex, sy + ey, P.bone, 2);
  }
  // pernas e cascos
  img.poly([[cx - 22, 84 + bob], [cx - 4, 84 + bob], [cx - 6, 118], [cx - 22, 118]], P.bodyD); img.poly([[cx + 4, 84 + bob], [cx + 22, 84 + bob], [cx + 22, 118], [cx + 6, 118]], P.bodyD);
  img.rect(cx - 24, 114, 21, 8, hex('#1a0508')); img.rect(cx + 3, 114, 21, 8, hex('#1a0508'));
  // tronco
  img.poly([[cx - 30, 50 + bob], [cx + 30, 50 + bob], [cx + 24, 90 + bob], [cx - 24, 90 + bob]], P.body);
  img.poly([[cx - 30, 50 + bob], [cx - 6, 50 + bob], [cx - 10, 90 + bob], [cx - 24, 90 + bob]], P.bodyD);
  img.poly([[cx + 4, 52 + bob], [cx + 28, 52 + bob], [cx + 22, 70 + bob], [cx + 6, 72 + bob]], P.bodyL);
  img.circle(cx, 72 + bob, 11, P.bodyD); img.circle(cx, 72 + bob, 8, alpha(P.lava, 0.95)); img.circle(cx, 72 + bob, 4, hex('#ffd24a')); img.circle(cx, 72 + bob, 1.6, hex('#ffffff'));   // núcleo
  // braços
  for (const s of [-1, 1]) {
    const sh = [cx + s * 32, 56 + bob], el = [cx + s * (40 + (attack ? 8 : 0)), 76 + bob + up * 0.5], ha = [cx + s * (42 + (attack ? 12 : 0)), 94 + bob + up];
    img.circle(sh[0], sh[1], 10, P.body); img.circle(sh[0], sh[1] - 2, 6, P.bodyL);
    img.line(sh[0], sh[1], el[0], el[1], P.body, 11); img.line(el[0], el[1], ha[0], ha[1], P.bodyD, 9); img.circle(ha[0], ha[1], 7, P.body);
    for (let c = -1; c <= 1; c++) img.poly([[ha[0] + c * 4 - 2, ha[1] + 5], [ha[0] + c * 4 + 2, ha[1] + 5], [ha[0] + c * 4, ha[1] + 14]], P.bone);
    if (attack) img.circle(ha[0], ha[1] + 6, 7, alpha(P.lava, 0.5));
  }
  // cabeça
  const hy = 34 + bob;
  img.poly([[cx - 16, hy + 6], [cx - 13, hy - 10], [cx, hy - 14], [cx + 13, hy - 10], [cx + 16, hy + 6], [cx + 10, hy + 18], [cx - 10, hy + 18]], P.body);
  img.poly([[cx - 16, hy + 6], [cx - 13, hy - 10], [cx - 4, hy - 13], [cx - 6, hy + 16], [cx - 10, hy + 18]], P.bodyD);
  img.poly([[cx - 11, hy - 6], [cx - 26, hy - 20], [cx - 28, hy - 34], [cx - 20, hy - 24], [cx - 8, hy - 12]], P.bone);
  img.poly([[cx + 11, hy - 6], [cx + 26, hy - 20], [cx + 28, hy - 34], [cx + 20, hy - 24], [cx + 8, hy - 12]], P.bone);
  img.rect(cx - 11, hy - 1, 9, 5, alpha(P.eye, 0.4)); img.rect(cx + 2, hy - 1, 9, 5, alpha(P.eye, 0.4));
  img.rect(cx - 10, hy, 7, 3, P.eye); img.rect(cx + 3, hy, 7, 3, P.eye);
  img.rect(cx - 8, hy + 9, 16, 6, hex('#1a0508')); if (attack) img.rect(cx - 6, hy + 10, 12, 4, P.lava);
  for (let t = 0; t < 4; t++) img.poly([[cx - 7 + t * 4, hy + 9], [cx - 5 + t * 4, hy + 9], [cx - 6 + t * 4, hy + 13]], P.bone);
}

// ===================================================================== montagem
{
  const G = sheet(48, 48, 12, 1);                                     // índice = vista*4 + k
  for (let v = 0; v < 3; v++) for (let k = 0; k < 4; k++) { G.at(v * 4 + k); ghoul(G, v, k); }
  save(G, 48, 48, 'ghoul.png');

  const K = sheet(48, 48, 15, 1);                                     // índice = vista*5 + k (k=4 atirar)
  for (let v = 0; v < 3; v++) for (let k = 0; k < 5; k++) { K.at(v * 5 + k); skeleton(K, v, k); }
  save(K, 48, 48, 'skeleton.png');

  const B = sheet(64, 64, 12, 1);
  for (let v = 0; v < 3; v++) for (let k = 0; k < 4; k++) { B.at(v * 4 + k); brute(B, v, k); }
  save(B, 64, 64, 'brute.png');

  const T = sheet(32, 32, 4, 1);
  for (let k = 0; k < 4; k++) { T.at(k); bat(T, k); }
  save(T, 32, 32, 'bat.png');

  const X = sheet(128, 128, 6, 1);
  for (let k = 0; k < 4; k++) { X.at(k); boss(X, k, false); }
  X.at(4); boss(X, 0, true); X.at(5); boss(X, 1, true);
  save(X, 128, 128, 'boss.png');
}
console.log(`Inimigos: ${written} gerado(s), ${skipped} já existia(m) e foi(ram) mantido(s).`);
