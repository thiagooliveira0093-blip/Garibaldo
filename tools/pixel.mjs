// Mini biblioteca de desenho em pixels + encoder PNG (sem dependências).
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function hex(h, a = 1) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Math.round(a * 255)];
}
export const alpha = (c, a) => [c[0], c[1], c[2], Math.round(Math.max(0, Math.min(1, a)) * 255)];
export const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export class Img {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
    this.ox = 0; this.oy = 0; this.clip = [0, 0, w, h];
  }
  // Seleciona um quadro: as coordenadas passam a ser relativas a ele e o desenho não vaza.
  frame(fx, fy, fw, fh) { this.ox = fx; this.oy = fy; this.clip = [fx, fy, fx + fw, fy + fh]; return this; }
  px(x, y, c) {
    x = Math.floor(x + this.ox); y = Math.floor(y + this.oy);
    const [x0, y0, x1, y1] = this.clip;
    if (x < x0 || y < y0 || x >= x1 || y >= y1) return;
    const i = (y * this.w + x) * 4, d = this.d, a = c[3] / 255;
    if (a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    const da = d[i + 3] / 255, oa = a + da * (1 - a);
    if (oa <= 0) return;
    for (let k = 0; k < 3; k++) d[i + k] = (c[k] * a + d[i + k] * da * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  }
  rect(x, y, w, h, c) {
    const x0 = Math.round(x), y0 = Math.round(y), x1 = Math.round(x + w), y1 = Math.round(y + h);
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.px(xx, yy, c);
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
    }
  }
  circle(cx, cy, r, c) { this.ellipse(cx, cy, r, r, c); }
  poly(pts, c) {
    const ys = pts.map(p => p[1]);
    const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y < maxY; y++) {
      const sy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c);
      }
    }
  }
  line(x0, y0, x1, y1, c, t = 1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      this.rect(x - t / 2, y - t / 2, t, t, c);
    }
  }
  glow(cx, cy, r, color, core, spread = 2.1) {
    this.circle(cx, cy, r * spread, alpha(color, 0.22));
    this.circle(cx, cy, r * (1 + (spread - 1) * 0.4), alpha(color, 0.5));
    this.circle(cx, cy, r, color);
    if (core) this.circle(cx, cy, r * 0.5, core);
  }
  save(file) {
    const { w, h, d } = this;
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y++) {
      raw[y * (w * 4 + 1)] = 0;
      raw.set(d.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const png = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
    ]);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, png);
  }
}

// Spritesheet: grade de quadros fw x fh. sheet.at(i) seleciona o quadro i.
export function sheet(fw, fh, cols, rows) {
  const img = new Img(fw * cols, fh * rows);
  img.at = i => img.frame((i % cols) * fw, Math.floor(i / cols) * fh, fw, fh);
  return img;
}

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
