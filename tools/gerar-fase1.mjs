// Gera assets/maps/fase1.tmj (formato JSON do Tiled) a partir do layout original do protótipo.
// Depois de gerado, edite a fase direto no Tiled — este script NÃO sobrescreve sem --force.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rng } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'maps', 'fase1.tmj');
if (fs.existsSync(OUT) && !process.argv.includes('--force')) {
  console.log('assets/maps/fase1.tmj já existe — mantido. Use --force para regenerar.');
  process.exit(0);
}

const TS = 32, MW = 220, MH = 17, GROUND_ROW = 15, GROUND_Y = GROUND_ROW * TS;
const layer = () => new Array(MW * MH).fill(0);

// Tiles (gid): 1 chão/grama, 2 terra, 3/4/5 plataforma esq/meio/dir, 6 tufo, 7 pedra, 8 caveira
const chao = layer();
for (let x = 0; x < MW; x++) { chao[GROUND_ROW * MW + x] = 1; chao[(GROUND_ROW + 1) * MW + x] = 2; }

// [coluna, linha, largura] — linha 12 = 96px acima do chão, 10 = 160px, 9 = 192px
const PLATS = [
  [28, 12, 6], [37, 10, 5], [59, 12, 7], [69, 10, 5], [86, 12, 6], [94, 9, 6],
  [116, 12, 5], [123, 10, 6], [138, 12, 6], [153, 12, 8], [169, 12, 6],
  [193, 12, 5], [201, 9, 5], [208, 12, 5],
];
const plat = layer();
for (const [c, r, w] of PLATS) for (let i = 0; i < w; i++) plat[r * MW + c + i] = i === 0 ? 3 : i === w - 1 ? 5 : 4;

const deco = layer(), rnd = rng(42);
for (let x = 0; x < MW; x++) {
  const v = rnd();
  if (v < 0.12) deco[(GROUND_ROW - 1) * MW + x] = 6;
  else if (v < 0.16) deco[(GROUND_ROW - 1) * MW + x] = 7;
  else if (v < 0.175) deco[(GROUND_ROW - 1) * MW + x] = 8;
}

let nextId = 1;
const props = obj => Object.entries(obj).map(([name, value]) => ({
  name, value, type: typeof value === 'boolean' ? 'bool' : Number.isInteger(value) ? 'int' : typeof value === 'number' ? 'float' : 'string',
}));
const point = (name, type, x, y, p = {}) => ({ id: nextId++, name, type, x, y, width: 0, height: 0, rotation: 0, visible: true, point: true, properties: props(p) });

const objects = [point('player', '', 120, GROUND_Y)];

// Ondas: o retângulo marca a tela que trava (x = borda esquerda da câmera)
const WAVES = [450, 1250, 2350, 3500, 4700, MW * TS - 960];
WAVES.forEach((x, i) => objects.push({
  id: nextId++, name: 'onda', type: '', x, y: 0, width: 960, height: MH * TS, rotation: 0, visible: true,
  properties: props({ id: i + 1, chefe: i === WAVES.length - 1 }),
}));

// Inimigos: [tipo, x, y(pés / altura de voo do drone), onda, atraso]
const P12 = 12 * TS, P9 = 9 * TS;
const ENEMIES = [
  ['grunt', 1450, GROUND_Y, 1, 0], ['grunt', 1530, GROUND_Y, 1, 0.9], ['grunt', 410, GROUND_Y, 1, 2.4],

  ['grunt', 2250, GROUND_Y, 2, 0], ['caster', 1990, P12, 2, 0.5], ['drone', 1500, 150, 2, 1.2],
  ['grunt', 2320, GROUND_Y, 2, 2], ['drone', 1900, 120, 2, 3],

  ['caster', 2830, P12, 3, 0], ['caster', 3100, P9, 3, 1], ['grunt', 3350, GROUND_Y, 3, 0.3],
  ['grunt', 3420, GROUND_Y, 3, 2.2], ['drone', 2700, 170, 3, 2.8], ['grunt', 2300, GROUND_Y, 3, 4],

  ['drone', 3800, 120, 4, 0], ['drone', 4000, 180, 4, 0.5], ['drone', 4200, 140, 4, 1],
  ['caster', 3790, P12, 4, 1.5], ['heavy', 4510, GROUND_Y, 4, 2.5], ['grunt', 3440, GROUND_Y, 4, 3.5],

  ['caster', 5020, P12, 5, 0], ['caster', 5500, P12, 5, 0.8], ['heavy', 5720, GROUND_Y, 5, 1.5],
  ['drone', 5000, 130, 5, 2.5], ['drone', 5300, 190, 5, 3], ['grunt', 5720, GROUND_Y, 5, 4],
  ['grunt', 5790, GROUND_Y, 5, 4.6], ['grunt', 4640, GROUND_Y, 5, 5],

  ['boss', 6880, GROUND_Y, 6, 0],
];
for (const [type, x, y, onda, atraso] of ENEMIES) objects.push(point('', type, x, y, { onda, atraso }));

const tileLayer = (id, name, data) => ({ id, name, type: 'tilelayer', x: 0, y: 0, width: MW, height: MH, opacity: 1, visible: true, data });
const map = {
  compressionlevel: -1, type: 'map', version: '1.10', tiledversion: '1.10.2', orientation: 'orthogonal', renderorder: 'right-down',
  infinite: false, width: MW, height: MH, tilewidth: TS, tileheight: TS,
  nextlayerid: 5, nextobjectid: nextId,
  properties: props({ nome: 'MISSÃO 1 — AS RUÍNAS' }),
  layers: [
    tileLayer(1, 'decoracao', deco),
    tileLayer(2, 'chao', chao),
    tileLayer(3, 'plataformas', plat),
    { id: 4, name: 'objetos', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects },
  ],
  tilesets: [{
    firstgid: 1, name: 'tiles', image: '../tiles/tiles.png', imagewidth: 256, imageheight: 32,
    tilewidth: TS, tileheight: TS, tilecount: 8, columns: 8, margin: 0, spacing: 0,
  }],
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(map));
console.log('gerado assets/maps/fase1.tmj');
