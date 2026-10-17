import { HALL } from '../config.js';

// Constrói o salão: piso de pedra, paredes, pilares (bloqueiam), braseiros (iluminam) e enfeites.
// Devolve { obstacles: [{x,y,r}], lights: [{x,y,r}] }.
export function buildHall(scene, start) {
  const { w, h, wall, tile } = HALL;
  const cols = Math.ceil(w / tile), rows = Math.ceil(h / tile), wallTiles = Math.ceil(wall / tile);

  const map = scene.make.tilemap({ tileWidth: tile, tileHeight: tile, width: cols, height: rows });
  const floorSet = map.addTilesetImage('floorTiles', 'floorTiles', tile, tile);
  const wallSet = map.addTilesetImage('wallTile', 'wallTile', tile, tile);
  const floor = map.createBlankLayer('floor', floorSet).setDepth(0);
  const walls = map.createBlankLayer('walls', wallSet).setDepth(1);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    // piso: lajes variadas, com mais chance da lisa (índice 0) para não poluir
    const r = Math.random();
    floor.putTileAt(r < 0.55 ? 0 : r < 0.75 ? 1 : r < 0.9 ? 2 : 3, x, y);
    if (x < wallTiles || y < wallTiles || x >= cols - wallTiles || y >= rows - wallTiles) walls.putTileAt(0, x, y);
  }

  const obstacles = [], lights = [];
  const margin = wall + 90, rnd = (a, b) => a + Math.random() * (b - a);
  const placed = [{ x: start.x, y: start.y, r: 260 }];                // não nasce nada em cima do herói
  const free = (x, y, r) => placed.every(p => Math.hypot(p.x - x, p.y - y) > p.r + r);
  const spot = r => {
    for (let i = 0; i < 60; i++) {
      const x = rnd(margin, w - margin), y = rnd(margin, h - margin);
      if (free(x, y, r)) { placed.push({ x, y, r }); return { x, y }; }
    }
    return null;
  };
  const prop = (frame, x, y, anim) => {
    const s = scene.add.sprite(x, y, 'props', frame).setOrigin(0.5, 88 / 96).setDepth(y);
    if (anim) s.play({ key: anim, startFrame: Math.floor(Math.random() * 4) });
    return s;
  };

  for (let i = 0; i < 16; i++) { const p = spot(60); if (p) { prop(0, p.x, p.y); obstacles.push({ x: p.x, y: p.y, r: 20 }); } }                   // pilares
  for (let i = 0; i < 11; i++) { const p = spot(110); if (p) { prop(1, p.x, p.y, 'brazier'); obstacles.push({ x: p.x, y: p.y, r: 14 }); lights.push({ x: p.x, y: p.y - 44, r: 190 }); } }  // braseiros
  for (let i = 0; i < 14; i++) { const p = spot(30); if (p) prop(5, p.x, p.y); }                                                                // ossos
  for (let i = 0; i < 12; i++) { const p = spot(30); if (p) { prop(6, p.x, p.y); obstacles.push({ x: p.x, y: p.y, r: 12 }); } }                 // urnas
  for (let i = 0; i < 8; i++) { const p = spot(44); if (p) { prop(7, p.x, p.y); obstacles.push({ x: p.x, y: p.y, r: 24 }); } }                   // túmulos
  return { obstacles, lights };
}
