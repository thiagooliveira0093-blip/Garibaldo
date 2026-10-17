// Gera a arte PLACEHOLDER das armas: flechas e ícones do HUD em assets/sprites/proj3.png (32x32, 8 colunas).
//   0-1 flecha · 2-3 flecha de fogo · 17 ícone da espada · 18 ícone do arco · 19 ícone do anel
// Arquivos existentes NÃO são sobrescritos (use --force).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheet, hex, alpha } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const file = path.join(ROOT, 'assets', 'sprites', 'proj3.png');
if (fs.existsSync(file) && !FORCE) { console.log('  mantido assets/sprites/proj3.png (use --force para regenerar)'); process.exit(0); }

const C = {
  wood: hex('#8a5a2c'), woodL: hex('#b07a40'), string: hex('#efe6cc'), shaft: hex('#d8c8a0'),
  fletch: hex('#c0392b'), steel: hex('#cfd8e6'), steelL: hex('#e8eefc'), gold: hex('#e0b040'), leather: hex('#5a3a22'),
};

const P = sheet(32, 32, 8, 3);
const arrow = (i, fire) => {
  P.at(i);
  const y = 16;
  if (fire) {
    P.circle(24, y, 8, alpha(hex('#ff6a2a'), 0.25));
    P.poly([[18, y - 3], [30, y], [18, y + 3]], hex('#ff8a2a')); P.circle(25, y, 3, hex('#ffd24a'));
    P.poly([[3, y - 2], [10 + (i % 2) * 2, y], [3, y + 2]], alpha(hex('#ff6a2a'), 0.8));
  }
  P.line(5, y, 24, y, C.shaft, 2);
  P.poly([[22, y - 3], [30, y], [22, y + 3]], fire ? hex('#ffd24a') : C.steel);
  P.rect(3, y - 3, 5, 2, C.fletch); P.rect(3, y + 1, 5, 2, C.fletch);
};
arrow(0, false); arrow(1, false); arrow(2, true); arrow(3, true);

// ícones das armas no HUD
P.at(17); // espada
P.line(7, 25, 25, 7, C.steelL, 4); P.line(8, 24, 24, 8, hex('#ffffff'), 1);
P.line(9, 19, 15, 25, C.gold, 3); P.line(5, 27, 8, 24, C.leather, 3); P.circle(4, 28, 2, C.gold);
P.at(18); // arco
P.line(11, 3, 20, 10, C.wood, 3); P.line(20, 10, 22, 16, C.woodL, 3); P.line(22, 16, 20, 22, C.woodL, 3); P.line(20, 22, 11, 29, C.wood, 3);
P.line(11, 3, 11, 29, alpha(C.string, 0.95), 1); P.line(8, 16, 26, 16, C.shaft, 1); P.poly([[24, 13], [30, 16], [24, 19]], C.steel);
P.at(19); // anel
for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; P.rect(16 + Math.cos(a) * 8 - 1.5, 19 + Math.sin(a) * 8 - 1.5, 3, 3, C.gold); }
P.poly([[16, 3], [21, 9], [16, 15], [11, 9]], hex('#ff8a2a')); P.poly([[16, 6], [18, 9], [16, 12], [14, 9]], hex('#ffe9a0'));

// pixel art: o que é quase opaco vira sólido
const d = P.d;
for (let i = 0; i < d.length; i += 4) if (d[i + 3] >= 90) d[i + 3] = 255;
P.save(file);
console.log('  gerado  assets/sprites/proj3.png');
