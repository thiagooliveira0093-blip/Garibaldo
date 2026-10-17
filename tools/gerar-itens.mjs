// Gera itens, ícones e projéteis em assets/sprites/items.png (32x32, 8 colunas).
//   0-2 gema de XP (pequena, média, grande) · 3-6 moeda girando · 7 poção de vida
//   8 espada · 9 arco · 10 anel                                  (ícones das armas)
//   11 vida · 12 velocidade · 13 dano · 14 recarga · 15 coleta · 16 XP · 17 armadura · 18 regeneração
//   19 fogo · 20 gelo · 21 raio                                   (ícones de passivas / elementos)
//   22-23 flecha do herói · 24 flecha inimiga · 25 orbe inimigo · 26-28 orbe do anel (fogo, gelo, raio) · 29 faísca
// Arquivos existentes NÃO são sobrescritos (use --force).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheet, hex, alpha } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const OUT = path.join(ROOT, 'assets', 'sprites', 'items.png');
if (fs.existsSync(OUT) && !FORCE) { console.log('  mantido assets/sprites/items.png (use --force para regenerar)'); process.exit(0); }

const C = {
  gold: hex('#f0c14b'), goldD: hex('#a87a2a'), steel: hex('#cfd8e6'), steelL: hex('#ffffff'), wood: hex('#8a5a2c'), woodL: hex('#b07a40'),
  string: hex('#efe6cc'), leather: hex('#5a3a22'), red: hex('#e0344a'), redD: hex('#8a1a2c'),
};
const P = sheet(32, 32, 8, 4);

// ---- gemas de XP
const gem = (i, body, light, r) => { P.at(i); P.circle(16, 17, r + 4, alpha(body, 0.25)); P.poly([[16, 17 - r - 2], [16 + r, 17], [16, 17 + r + 2], [16 - r, 17]], body); P.poly([[16, 17 - r - 2], [16, 17], [16 - r, 17]], light); P.rect(15, 14, 2, 2, hex('#ffffff')); };
gem(0, hex('#3a8fe0'), hex('#8ac6ff'), 5); gem(1, hex('#2fb86a'), hex('#8af0b4'), 6); gem(2, hex('#a24be0'), hex('#d9a0ff'), 8);
// ---- moeda girando
for (let k = 0; k < 4; k++) {
  P.at(3 + k);
  const w = [8, 5, 2, 5][k];
  P.circle(16, 17, 11, alpha(C.gold, 0.18));
  P.ellipse(16, 17, w, 8, C.goldD); P.ellipse(16 - 1, 16, Math.max(1, w - 2), 6, C.gold);
  if (w > 4) P.rect(15, 13, 2, 7, C.goldD);
}
// ---- poção de vida
P.at(7);
P.circle(16, 21, 8, C.red); P.circle(14, 19, 3, hex('#ff8a9a')); P.rect(13, 8, 6, 8, hex('#cfd8e6')); P.rect(12, 6, 8, 3, C.wood); P.circle(16, 21, 8, alpha(C.red, 0.2));
P.rect(15, 18, 2, 7, hex('#ffffff')); P.rect(12, 21, 8, 2, hex('#ffffff'));

// ---- ícones de armas
P.at(8); P.line(7, 25, 25, 7, C.steel, 4); P.line(8, 24, 24, 8, C.steelL, 1); P.line(9, 19, 15, 25, C.gold, 3); P.line(5, 27, 8, 24, C.leather, 3); P.circle(4, 28, 2, C.gold);
P.at(9); P.line(11, 3, 20, 10, C.wood, 3); P.line(20, 10, 22, 16, C.woodL, 3); P.line(22, 16, 20, 22, C.woodL, 3); P.line(20, 22, 11, 29, C.wood, 3);
P.line(11, 3, 11, 29, alpha(C.string, 0.95), 1); P.line(8, 16, 26, 16, hex('#d8c8a0'), 1); P.poly([[24, 13], [30, 16], [24, 19]], C.steel);
P.at(10); for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; P.rect(16 + Math.cos(a) * 8 - 1.5, 19 + Math.sin(a) * 8 - 1.5, 3, 3, C.gold); }
P.poly([[16, 3], [21, 9], [16, 15], [11, 9]], hex('#ff8a2a')); P.poly([[16, 6], [18, 9], [16, 12], [14, 9]], hex('#ffe9a0'));

// ---- ícones de passivas
const heart = (cx, cy, s, col) => { P.circle(cx - 4 * s, cy - 2 * s, 4.5 * s, col); P.circle(cx + 4 * s, cy - 2 * s, 4.5 * s, col); P.poly([[cx - 8.5 * s, cy], [cx + 8.5 * s, cy], [cx, cy + 9 * s]], col); };
P.at(11); heart(16, 14, 1.2, C.red); P.rect(7, 26, 18, 3, C.gold);
P.at(12); P.poly([[8, 10], [18, 10], [18, 20], [26, 22], [26, 27], [8, 27]], hex('#7a5a3a')); P.rect(8, 24, 18, 3, hex('#3a2a1a')); P.rect(9, 11, 3, 10, hex('#a8845a')); P.line(5, 16, 1, 16, hex('#9fe8ff'), 1); P.line(5, 20, 0, 20, hex('#9fe8ff'), 1);
P.at(13); P.poly([[10, 22], [10, 12], [14, 6], [18, 12], [18, 22]], hex('#cfd8e6')); P.rect(8, 22, 12, 3, C.gold); P.rect(12, 25, 4, 5, C.leather); P.poly([[22, 12], [26, 18], [22, 18]], hex('#ff9a3a')); P.poly([[22, 20], [26, 26], [22, 26]], hex('#ff9a3a'));
P.at(14); P.poly([[9, 5], [23, 5], [17, 16], [23, 27], [9, 27], [15, 16]], hex('#9fe8ff')); P.rect(8, 3, 16, 3, C.gold); P.rect(8, 27, 16, 3, C.gold); P.poly([[12, 23], [20, 23], [16, 18]], hex('#ffd24a'));
P.at(15); P.poly([[7, 6], [13, 6], [13, 18], [19, 18], [19, 6], [25, 6], [25, 22], [16, 28], [7, 22]], hex('#d0394a')); P.rect(7, 6, 6, 5, hex('#cfd8e6')); P.rect(19, 6, 6, 5, hex('#cfd8e6')); P.rect(13, 13, 6, 3, hex('#7a1020'));
P.at(16); { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 6 : 13; pts.push([16 + Math.cos(a) * r, 17 + Math.sin(a) * r]); } P.poly(pts, hex('#ffd24a')); P.circle(16, 17, 3, hex('#fff5c0')); }
P.at(17); P.poly([[6, 7], [26, 7], [26, 18], [16, 29], [6, 18]], hex('#7a8498')); P.poly([[6, 7], [16, 7], [16, 29], [6, 18]], hex('#5d6577')); P.rect(14, 10, 4, 15, C.gold); P.rect(9, 15, 14, 4, C.gold);
P.at(18); heart(16, 12, 0.9, hex('#4cd964')); P.rect(14, 18, 4, 10, hex('#ffffff')); P.rect(10, 21, 12, 4, hex('#ffffff'));

// ---- elementos
P.at(19); P.poly([[16, 3], [24, 15], [22, 26], [10, 26], [8, 15], [13, 11]], hex('#ff6a2a')); P.poly([[16, 11], [21, 19], [19, 26], [13, 26], [11, 19]], hex('#ffb347')); P.poly([[16, 17], [18, 22], [16, 26], [14, 22]], hex('#fff1c2'));
P.at(20); for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; P.line(16 - Math.cos(a) * 12, 16 - Math.sin(a) * 12, 16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, hex('#9fe8ff'), 3); } P.circle(16, 16, 4, hex('#e8fdff'));
P.at(21); P.poly([[18, 2], [8, 17], [15, 17], [11, 30], [24, 12], [17, 12], [21, 2]], hex('#f6f35a')); P.poly([[17, 6], [12, 16], [18, 16], [15, 25], [21, 14], [16, 14]], hex('#ffffff'));

// ---- projéteis
[22, 23].forEach((i, n) => { P.at(i); P.line(5, 16, 24, 16, hex('#d8c8a0'), 2); P.poly([[22, 13], [30, 16], [22, 19]], C.steel); P.rect(3, 13, 5, 2, C.red); P.rect(3, 17, 5, 2, C.red); if (n) P.rect(10, 15, 2, 1, hex('#ffffff')); });
P.at(24); P.line(5, 16, 24, 16, hex('#a89f88'), 2); P.poly([[22, 13], [30, 16], [22, 19]], hex('#7a7488')); P.rect(3, 13, 5, 2, hex('#5a4a6a')); P.rect(3, 17, 5, 2, hex('#5a4a6a'));
P.at(25); P.circle(16, 16, 11, alpha(hex('#a24be0'), 0.25)); P.circle(16, 16, 7, hex('#7a2bd0')); P.circle(16, 16, 5, hex('#c04bff')); P.circle(16, 16, 2.5, hex('#ffd6ff'));
const orb = (i, o, m, h) => { P.at(i); P.circle(16, 16, 12, alpha(o, 0.22)); P.circle(16, 16, 9, alpha(m, 0.4)); P.circle(16, 16, 7, o); P.circle(16, 16, 5, m); P.circle(16, 16, 3, h); P.circle(16, 16, 1.5, hex('#ffffff')); };
orb(26, hex('#e8431e'), hex('#ff8a2a'), hex('#ffd24a')); orb(27, hex('#2b7fd6'), hex('#4fc3f7'), hex('#b8f0ff')); orb(28, hex('#c9a400'), hex('#f2d21b'), hex('#fff27a'));
P.at(29); P.circle(16, 16, 6, alpha(hex('#ffffff'), 0.3)); P.circle(16, 16, 2.5, hex('#ffffff'));

// pixel art: o que é quase opaco vira sólido (o brilho suave é mantido)
const d = P.d; for (let i = 3; i < d.length; i += 4) if (d[i] >= 90) d[i] = 255;
P.save(OUT);
console.log('  gerado  assets/sprites/items.png');
