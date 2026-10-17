// Gera a arte do CENÁRIO (salão de pedra, estilo Diablo) em assets/tiles/ e assets/sprites/.
//   tiles/floor.png  256x64 · 4 variações de piso (64x64, se repetem)
//   tiles/wall.png   64x64  · parede de tijolos escuros
//   sprites/props.png 64x96 por quadro, 8 colunas: 0 pilar · 1-4 braseiro aceso (animação) · 5 ossos · 6 urna · 7 túmulo
// Arquivos existentes NÃO são sobrescritos (use --force).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, sheet, hex, alpha, rng } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
let written = 0, skipped = 0;
function out(img, rel, post) {
  const file = path.join(ROOT, 'assets', rel);
  if (fs.existsSync(file) && !FORCE) { skipped++; return; }
  if (post) post(img);
  img.save(file); written++; console.log('  gerado  assets/' + rel);
}
const solid = img => { const d = img.d; for (let i = 3; i < d.length; i += 4) if (d[i] >= 90) d[i] = 255; };
const outline = (img, fw, fh) => {
  const d = img.d, w = img.w, LINE = hex('#0b0812');
  for (let fy = 0; fy < img.h / fh; fy++) for (let fx = 0; fx < img.w / fw; fx++) {
    const x0 = fx * fw, y0 = fy * fh, mark = [];
    for (let y = y0; y < y0 + fh; y++) for (let x = x0; x < x0 + fw; x++) {
      if (d[(y * w + x) * 4 + 3] > 20) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= x0 && ny >= y0 && nx < x0 + fw && ny < y0 + fh && d[(ny * w + nx) * 4 + 3] > 200) { mark.push(y * w + x); break; }
      }
    }
    for (const i of mark) { d[i * 4] = LINE[0]; d[i * 4 + 1] = LINE[1]; d[i * 4 + 2] = LINE[2]; d[i * 4 + 3] = 255; }
  }
};

// ---------------------------------------------------------------- piso: lajes de pedra
{
  const F = sheet(64, 64, 4, 1);
  const base = hex('#2a2632'), base2 = hex('#302b3a'), mortar = hex('#1a1722'), hi = hex('#3a3548');
  for (let v = 0; v < 4; v++) {
    F.at(v);
    const r = rng(100 + v);
    F.rect(0, 0, 64, 64, base);
    // duas lajes grandes por linha, deslocadas na 2ª linha (tijolo de piso)
    for (let row = 0; row < 2; row++) {
      const off = row ? 16 : 0;
      for (let col = -1; col < 3; col++) {
        const x = off + col * 32, y = row * 32;
        F.rect(x + 1, y + 1, 30, 30, r() > 0.5 ? base : base2);
        F.rect(x + 1, y + 1, 30, 1, hi);                        // luz no topo da laje
        for (let n = 0; n < 7; n++) F.rect(x + 2 + Math.floor(r() * 27), y + 3 + Math.floor(r() * 26), 1 + Math.floor(r() * 2), 1, mortar);
      }
    }
    for (let row = 0; row < 3; row++) F.rect(0, row * 32 - (row ? 1 : 0), 64, 2, mortar);    // junta horizontal (repete certo)
    for (let row = 0; row < 2; row++) { const off = row ? 16 : 0; for (let col = -1; col < 3; col++) F.rect(off + col * 32 - 1, row * 32, 2, 32, mortar); }
    if (v === 1) { F.line(8, 10, 22, 24, mortar, 1); F.line(22, 24, 30, 22, mortar, 1); F.line(22, 24, 24, 36, mortar, 1); }     // rachadura
    if (v === 2) for (let m = 0; m < 14; m++) F.rect(Math.floor(r() * 62), Math.floor(r() * 62), 2, 1, hex('#2f4a3a'));          // musgo
    if (v === 3) { F.ellipse(40, 40, 6, 4, alpha(hex('#3a1018'), 0.7)); F.ellipse(38, 39, 3, 2, alpha(hex('#5a1824'), 0.8)); }  // mancha de sangue
  }
  out(F, 'tiles/floor.png', solid);
}

// ---------------------------------------------------------------- parede de tijolos
{
  const W = new Img(64, 64);
  const brick = hex('#1d1926'), brick2 = hex('#241f2e'), mortar = hex('#0e0b14'), hi = hex('#38324a');
  const r = rng(7);
  W.rect(0, 0, 64, 64, mortar);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 16 : 0;
    for (let col = -1; col < 3; col++) {
      const x = off + col * 32, y = row * 16;
      W.rect(x + 1, y + 1, 30, 14, r() > 0.5 ? brick : brick2);
      W.rect(x + 1, y + 1, 30, 1, hi);
      for (let n = 0; n < 3; n++) W.rect(x + 3 + Math.floor(r() * 24), y + 4 + Math.floor(r() * 9), 2, 1, mortar);
    }
  }
  out(W, 'tiles/wall.png', solid);
}

// ---------------------------------------------------------------- objetos
{
  const FW = 64, FH = 96, P = sheet(FW, FH, 8, 1);
  const stone = hex('#5a5468'), stoneD = hex('#38334a'), stoneL = hex('#8a84a0'), iron = hex('#3c4252'), ironL = hex('#6b7488'), bone = hex('#e8dfc8'), boneD = hex('#a89f88');
  // 0: pilar
  P.at(0);
  P.ellipse(32, 88, 20, 6, stoneD); P.rect(14, 80, 36, 8, stone); P.rect(14, 80, 36, 2, stoneL);
  P.rect(20, 20, 24, 62, stone); P.rect(20, 20, 8, 62, stoneD); P.rect(38, 20, 3, 62, stoneL);
  for (let y = 28; y < 78; y += 12) P.rect(20, y, 24, 2, stoneD);
  P.rect(12, 12, 40, 10, stone); P.rect(12, 12, 40, 2, stoneL); P.rect(10, 8, 44, 6, stoneD); P.rect(12, 4, 40, 6, stone); P.rect(12, 4, 40, 2, stoneL);
  // 1-4: braseiro (tigela de ferro) com chama animada
  for (let k = 0; k < 4; k++) {
    P.at(1 + k);
    const rr = rng(40 + k);
    P.ellipse(32, 90, 16, 5, alpha(hex('#000000'), 0.3));
    P.rect(28, 66, 8, 22, iron); P.rect(20, 86, 24, 4, iron); P.rect(24, 82, 4, 6, iron); P.rect(36, 82, 4, 6, iron);
    P.poly([[14, 52], [50, 52], [44, 68], [20, 68]], iron); P.poly([[14, 52], [30, 52], [26, 68], [20, 68]], hex('#2a2f3c')); P.rect(14, 51, 36, 3, ironL);
    P.ellipse(32, 52, 17, 5, hex('#2a1208'));
    for (const [w, c, h] of [[15, hex('#e8431e'), 30], [11, hex('#ff8a2a'), 25], [7, hex('#ffd24a'), 18], [3, hex('#ffffff'), 10]]) {
      const sway = (rr() - 0.5) * 8, top = 52 - h - rr() * 5;
      P.poly([[32 - w, 52], [32 - w * 0.5 + sway * 0.3, 40], [32 + sway, top], [32 + w * 0.5 + sway * 0.3, 40], [32 + w, 52]], c);
    }
    for (let s = 0; s < 3; s++) P.rect(24 + rr() * 16, 14 + rr() * 22, 2, 2, hex('#ffd24a'));
  }
  // 5: ossos
  P.at(5);
  P.ellipse(32, 86, 22, 6, alpha(hex('#000000'), 0.3));
  for (const [x, y, a] of [[18, 82, 0.3], [32, 84, -0.2], [44, 81, 0.5]]) { P.line(x - 8, y - 2 * a, x + 8, y + 2 * a, bone, 3); P.circle(x - 8, y, 2.5, bone); P.circle(x + 8, y, 2.5, bone); }
  P.circle(30, 76, 9, bone); P.circle(28, 74, 4, hex('#fffaf0')); P.rect(23, 80, 14, 5, bone);
  P.circle(26, 76, 2.5, hex('#1a1218')); P.circle(34, 76, 2.5, hex('#1a1218')); for (let t = 0; t < 4; t++) P.rect(25 + t * 3, 83, 1, 3, hex('#2a2128'));
  // 6: urna
  P.at(6);
  const clay = hex('#7a4a30'), clayD = hex('#4e2c1c'), clayL = hex('#a8704e');
  P.ellipse(32, 88, 14, 5, alpha(hex('#000000'), 0.3));
  P.poly([[22, 58], [42, 58], [48, 76], [44, 88], [20, 88], [16, 76]], clay); P.poly([[22, 58], [30, 58], [28, 88], [20, 88], [16, 76]], clayD);
  P.rect(24, 52, 16, 8, clay); P.rect(22, 50, 20, 4, clayL); P.rect(26, 52, 12, 2, hex('#1a0e08'));
  P.rect(20, 70, 24, 3, clayL);
  // 7: túmulo
  P.at(7);
  P.ellipse(32, 88, 24, 6, alpha(hex('#000000'), 0.3));
  P.poly([[10, 86], [10, 50], [32, 38], [54, 50], [54, 86]], stone); P.poly([[10, 86], [10, 50], [32, 38], [32, 86]], stoneD);
  P.rect(30, 50, 4, 24, stoneL); P.rect(22, 58, 20, 4, stoneL);
  out(P, 'sprites/props.png', img => { solid(img); outline(img, FW, FH); });
}

console.log(`Cenário: ${written} gerado(s), ${skipped} já existia(m) e foi(ram) mantido(s).`);
