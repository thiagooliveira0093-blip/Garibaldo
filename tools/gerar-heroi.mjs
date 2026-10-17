// Gera o Garibaldo de VISÃO DE CIMA (3/4, estilo Diablo) em assets/sprites/hero.png.
// Quadros de 64x64, 8 colunas. Três vistas: 0 = frente (descendo), 1 = costas (subindo), 2 = lado (direita; o jogo espelha).
//   índice = vista*8 + k  ·  k 0-1 parado · k 2-7 andando
//   24-26 dano (frente, costas, lado) · 27 caído
// Os pés ficam em (32, 56). Arquivos existentes NÃO são sobrescritos (use --force).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheet, hex, alpha } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const OUT = path.join(ROOT, 'assets', 'sprites', 'hero.png');
if (fs.existsSync(OUT) && !FORCE) { console.log('  mantido assets/sprites/hero.png (use --force para regenerar)'); process.exit(0); }

const C = {
  line: hex('#0b0812'),
  cloak: hex('#3a3560'), cloakD: hex('#1f1b38'), cloakL: hex('#625c8f'), cloakR: hex('#a5a0e0'),
  lining: hex('#6a1a38'), shadow: hex('#050309'),
  skin: hex('#e9b98a'), skinD: hex('#b98558'), boot: hex('#17111c'), leather: hex('#4a3020'),
  gold: hex('#f0c14b'), eye: hex('#ffb347'), eyeL: hex('#fff2c0'),
};
const HEM = 54, CX = 32;

// d: vista; k: quadro de animação; opts: { hurt, dead }
function hero(img, view, k, o = {}) {
  const walk = k >= 2, ph = walk ? ((k - 2) / 6) * Math.PI * 2 : 0;
  const bob = walk ? Math.round(Math.abs(Math.sin(ph * 2)) * -2) : (k === 1 ? -1 : 0);
  const sway = walk ? Math.round(Math.sin(ph) * 2) : (k === 1 ? 1 : 0);
  const lift = Math.sin(ph);                       // pé da frente (+) / de trás (-)
  const top = 22 + bob;                            // linha dos ombros
  const side = view === 2, back = view === 1;
  const hl = o.hurt ? 1 : 0;

  if (o.dead) {                                    // caído de lado
    img.poly([[10, 50], [46, 44], [52, 54], [12, 58]], C.cloak);
    img.poly([[10, 54], [52, 56], [52, 58], [12, 58]], C.cloakD);
    img.ellipse(50, 50, 7, 7, C.cloak); img.ellipse(52, 51, 3, 4, C.shadow);
    img.line(14, 52, 40, 49, C.cloakL, 1);
    return;
  }

  // ----- pés (só aparecem sob a bainha) -----
  const foot = (x, l) => { img.rect(x - 4, HEM - 1 - Math.max(0, l) * 3, 8, 5, C.boot); };
  if (side) { foot(CX - 3 - lift * 5, -lift); foot(CX + 3 + lift * 5, lift); }
  else { foot(CX - 7, -lift); foot(CX + 7, lift); }

  // ----- capa -----
  const wide = side ? 11 : 15, hemW = side ? 14 : 19;
  const jag = (x0, x1, y) => { // bainha rasgada: dentes de serra
    const pts = [];
    const n = 8;
    for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y - (i % 2 ? 3 + (i * 5 % 3) : 0)]);
    return pts;
  };
  const lx = CX - wide + sway * 0.5, rx = CX + wide + sway * 0.5;
  if (side) {   // capa solta atrás (esquerda)
    const flow = 5 + (walk ? Math.abs(Math.sin(ph)) * 4 : 0);
    img.poly([[CX - 7, top + 4], [CX + 2, top + 4], [CX - hemW - flow, HEM + 1], [CX - 4, HEM + 1]], C.cloakD);
  }
  img.poly([[lx + 3, top + 2], [rx - 3, top + 2], [CX + hemW + sway, HEM + 1], ...jag(CX + hemW + sway, CX - hemW + sway, HEM + 1).slice(1), [lx + 3, top + 2]], C.cloak);
  // sombra à esquerda e luz de borda à direita
  img.poly([[lx + 3, top + 2], [CX - 2, top + 2], [CX - 5, HEM], [CX - hemW + sway, HEM + 1]], C.cloakD);
  img.line(rx - 3, top + 3, CX + hemW + sway - 1, HEM - 2, C.cloakR, 1);
  img.line(CX + 1, top + 12, CX + 3 + sway, HEM - 4, C.cloakD, 1);                  // dobras
  if (!side) img.line(CX - 6, top + 14, CX - 8 + sway, HEM - 5, C.cloakD, 1);
  if (back) img.line(CX, top + 4, CX, HEM - 3, C.cloakL, 1);                         // costura nas costas

  // ----- gola e manto -----
  img.poly([[CX - 13, top + 6], [CX - 7, top - 1], [CX + 7, top - 1], [CX + 13, top + 6], [CX + 9, top + 12], [CX - 9, top + 12]], C.cloak);
  img.poly([[CX - 13, top + 6], [CX - 7, top - 1], [CX - 2, top - 1], [CX - 5, top + 12], [CX - 9, top + 12]], C.cloakD);
  if (!back) { img.rect(CX - 2, top + 8, 5, 5, C.gold); img.rect(CX - 1, top + 9, 3, 3, hex('#ff8a2a')); }  // fecho

  // ----- capuz -----
  const hx = CX + (side ? 3 : 0) + Math.round(sway * 0.3), hy = top - 7;
  img.ellipse(hx, hy, side ? 10 : 11, 12, C.cloak);
  img.ellipse(hx - 4, hy + 1, 5, 9, C.cloakD);
  img.line(hx - 5, hy - 10, hx + 5, hy - 10, C.cloakR, 1);
  img.poly([[hx - 9, hy + 6], [hx + 9, hy + 6], [hx + 6, hy + 12], [hx - 6, hy + 12]], C.cloak);  // barra do capuz sobre os ombros
  if (!back) {
    const fx = side ? hx + 4 : hx, fw = side ? 5 : 7;
    img.ellipse(fx, hy + 2, fw, 8, C.shadow);                                      // rosto na sombra
    img.circle(fx + (side ? 1 : 0), hy + 1, 7, alpha(C.eye, 0.18));
    if (hl) { img.rect(fx - 3, hy + 1, 7, 1, C.cloakR); }
    else if (side) { img.rect(fx, hy, 4, 3, C.eye); img.rect(fx + 1, hy, 3, 1, C.eyeL); img.rect(fx - 4, hy, 2, 3, alpha(C.eye, 0.7)); }
    else { img.rect(fx - 5, hy, 4, 3, C.eye); img.rect(fx + 2, hy, 4, 3, C.eye); img.rect(fx - 4, hy, 2, 1, C.eyeL); img.rect(fx + 3, hy, 2, 1, C.eyeL); }
    img.rect(fx - 2, hy + 8, 5, 2, C.skinD);                                       // queixo
  }
}

const S = sheet(64, 64, 8, 4);
for (let v = 0; v < 3; v++) for (let k = 0; k < 8; k++) { S.at(v * 8 + k); hero(S, v, k); }
for (let v = 0; v < 3; v++) { S.at(24 + v); hero(S, v, 0, { hurt: true }); }
S.at(27); hero(S, 2, 0, { dead: true });

// contorno escuro de 1px por quadro; pixel art sólido (o brilho suave dos olhos é mantido)
const d = S.d, w = S.w, FW = 64, cols = 8, rows = 4;
for (let fy = 0; fy < rows; fy++) for (let fx = 0; fx < cols; fx++) {
  const x0 = fx * FW, y0 = fy * FW;
  for (let y = y0; y < y0 + FW; y++) for (let x = x0; x < x0 + FW; x++) { const i = (y * w + x) * 4; if (d[i + 3] >= 90) d[i + 3] = 255; }
  const mark = [];
  for (let y = y0; y < y0 + FW; y++) for (let x = x0; x < x0 + FW; x++) {
    if (d[(y * w + x) * 4 + 3] > 20) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= x0 && ny >= y0 && nx < x0 + FW && ny < y0 + FW && d[(ny * w + nx) * 4 + 3] > 200) { mark.push(y * w + x); break; }
    }
  }
  for (const i of mark) { d[i * 4] = C.line[0]; d[i * 4 + 1] = C.line[1]; d[i * 4 + 2] = C.line[2]; d[i * 4 + 3] = 255; }
}
S.save(OUT);
console.log('  gerado  assets/sprites/hero.png');
