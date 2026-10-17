// Pose de arco compartilhada pelos geradores de sprite: o arco inteiro gira em torno do ombro S.
// c = { arm, skin } cores do braço e da mão. P.aim = ângulo (rad), P.draw = quanto a corda está puxada (0 a 1),
// P.arrow = se há flecha encaixada.
import { hex, alpha } from './pixel.mjs';

const B = {
  wood: hex('#8a5a2c'), woodL: hex('#b07a40'), string: hex('#efe6cc'),
  shaft: hex('#d8c8a0'), fletch: hex('#c0392b'), steel: hex('#cfd8e6'),
};

export function bowPose(img, S, P, c) {
  const A = P.aim || 0, ca = Math.cos(A), sa = Math.sin(A);
  const T = (x, y) => [S[0] + (x - S[0]) * ca - (y - S[1]) * sa, S[1] + (x - S[0]) * sa + (y - S[1]) * ca];
  const L = (p, q, col, t) => { const a = T(p[0], p[1]), b = T(q[0], q[1]); img.line(a[0], a[1], b[0], b[1], col, t); };
  const by = S[1] + 2, bx = S[0] + 12, pull = 3 + P.draw * 7;
  const top = [bx - 1, by - 16], bot = [bx - 1, by + 16], mid = [bx + 5, by], nx = bx - pull;
  const fh = T(bx - 1, by), fh2 = T(bx - 2, by);
  img.line(S[0], S[1], fh2[0], fh2[1], c.arm, 4); img.circle(fh[0], fh[1], 2.4, c.skin);     // braço da frente segura o arco
  L(top, [mid[0] - 1, by - 8], B.wood, 2); L([mid[0] - 1, by - 8], [mid[0], by], B.woodL, 3);
  L([mid[0], by], [mid[0] - 1, by + 8], B.woodL, 3); L([mid[0] - 1, by + 8], bot, B.wood, 2);
  L(top, [nx, by], alpha(B.string, 0.9), 1); L([nx, by], bot, alpha(B.string, 0.9), 1);
  if (P.arrow) {
    L([nx, by], [bx + 12, by], B.shaft, 1);
    img.poly([T(bx + 12, by - 2), T(bx + 16, by), T(bx + 12, by + 2)], B.steel);
    L([nx, by - 2], [nx + 4, by - 2], B.fletch, 1); L([nx, by + 1], [nx + 4, by + 1], B.fletch, 1);
  }
  const back = T(nx, by);
  img.line(S[0], S[1] + 1, back[0], back[1], c.arm, 3); img.circle(back[0], back[1], 2.2, c.skin);   // braço de trás puxa a corda
}
