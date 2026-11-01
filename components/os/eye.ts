/** Shared pixel-eye renderer: draws a 1-bit (ordered-dither) eye into an ImageData. */
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export type EyeState = {
  px: number; py: number; // where it looks, -1..1
  lid: number; // 1 open, 0 shut
  dil: number; // pupil dilation 0..1
  boil: number; // 0 = calm dither; >0 shifts the matrix (animated grain)
  ink: [number, number, number];
  paper: [number, number, number];
  iris: [number, number, number];
  irisPaper: [number, number, number];
  clearPaper?: boolean; // leave plain paper transparent
};

export function drawEye(img: ImageData, s: EyeState) {
  const { width: W, height: H, data: d } = img;
  const cx = W / 2, cy = H / 2, ew = W * 0.47, eh = H * 0.46 * Math.max(0.05, s.lid);
  const ix = cx + s.px * ew * 0.42, iy = cy + s.py * eh * 0.38, ir = H * 0.28, pr = ir * (0.34 + s.dil * 0.3);
  const line = Math.max(0.1, 1.4 / eh);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - cx) / ew, ny = (y - cy) / eh;
    // Angular eye: flat top/bottom lids with straight slanted sides meeting in sharp corners (a stretched hexagon)
    const lim = Math.min(1, Math.max(0.0001, (1 - Math.abs(nx)) * 1.7));
    const lens = Math.abs(nx) >= 1 ? 9 : Math.abs(ny) / lim;
    let v = 1, iris = false;
    if (lens < 1) {
      v = 1.02 - 0.7 * Math.max(0, lens - 0.62);
      // octagonal iris and pupil (pixel-made, not round)
      const rx = x - ix, ry = (y - iy) * 1.05, ax = Math.abs(rx), ay = Math.abs(ry);
      const r = Math.max(ax, ay, (ax + ay) * 0.7071);
      if (r < ir) {
        const ang = Math.atan2(ry, rx);
        v = 0.45 + 0.18 * Math.sin(ang * 9 + r * 0.6) - (r / ir) * 0.22;
        iris = true;
        if (r < pr) { v = 0; iris = false; }
        if (Math.max(Math.abs(rx + ir * 0.38), Math.abs(ry + ir * 0.38)) < ir * 0.17) { v = 1; iris = false; }
      }
    }
    const ll = Math.max(line, 1.6 / (eh * lim)); // keep the outline ~1.5 px thick all along, corners included
    if (lens >= 1 - ll && lens < 1 + ll * 0.5 && Math.abs(nx) < 1) v = 0;
    const b = s.boil | 0;
    const t = BAYER[((y + b) & 3) * 4 + ((x + b * 3) & 3)];
    const on = v < 1 && v < t;
    const c = on ? (iris ? s.iris : s.ink) : iris ? s.irisPaper : s.paper;
    const i = (y * W + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = s.clearPaper && !on && !iris && lens >= 1 ? 0 : 255;
  }
}
