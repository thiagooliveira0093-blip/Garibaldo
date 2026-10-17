// Gera os efeitos: explosão (6 quadros de 64x64) e a faísca das partículas (8x8).
// Arquivos existentes NÃO são sobrescritos (use --force).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, sheet, hex, alpha, rng } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const TAU = Math.PI * 2;
function save(img, name) {
  const file = path.join(ROOT, 'assets', 'sprites', name);
  if (fs.existsSync(file) && !FORCE) { console.log('  mantido assets/sprites/' + name); return; }
  img.save(file); console.log('  gerado  assets/sprites/' + name);
}

const E = sheet(64, 64, 6, 1);
for (let i = 0; i < 6; i++) {
  E.at(i);
  const t = i / 5, r = rng(100 + i), R = 10 + t * 18;
  if (i >= 2) for (let k = 0; k < 6; k++) E.circle(32 + (r() - 0.5) * 40 * t, 32 + (r() - 0.5) * 40 * t - t * 8, 6 + t * 10, [80, 70, 80, Math.round((1 - t) * 200)]);
  E.circle(32, 32, R, alpha(hex('#ff6a2a'), 1 - t * 0.7));
  for (let k = 0; k < 5; k++) E.circle(32 + Math.cos((k / 5) * TAU + i) * R * 0.7, 32 + Math.sin((k / 5) * TAU + i) * R * 0.7, R * 0.45 * (1 - t * 0.5), alpha(hex('#ff9b3d'), 1 - t * 0.7));
  if (t < 0.8) E.circle(32, 32, R * 0.6 * (1 - t), hex('#ffdd66'));
  if (i < 2) E.circle(32, 32, R * 0.35, hex('#ffffff'));
}
save(E, 'explosion.png');

const S = new Img(8, 8);
S.circle(4, 4, 4, [255, 255, 255, 90]); S.circle(4, 4, 2.6, hex('#ffffff'));
save(S, 'spark.png');
