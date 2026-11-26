/* ============================================================
   SIGNAL DETAIL LAYER  v2
   The kit draws structure. This draws MACHINING.
   Adds: 11 greeble generators, an ornament layer per edition,
   and densified recipes for the 14 flagship heroes.
   Every asset gains a `detail` param: 0 clean, 1 standard, 2 dense.
   ============================================================ */
const K = require('./signal-kit.js');
const { TOKENS, HEROES, wrap, n, L, R, C, P, POLY, G, HATCH,
        trace, river, node, arrow, arcArrow, panel, corner, chip, chipPkg, padlock, gear, ring, isoBlock } = K;

/* ---------- deterministic pseudo-random, so a rebuild is identical ---------- */
let SEED = 1;
const rnd = () => (SEED = (SEED * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const reseed = s => { SEED = s || 1; };

/* ============================================================
   GREEBLES: the eleven detail generators
   ============================================================ */

// G1 bolt circle: N fasteners on a radius, each with a slot
const bolts = (cx, cy, r, N, c, E, sz = 6) => {
  let s = "";
  for (let i = 0; i < N; i++) {
    const a = i * 2 * Math.PI / N;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    s += C(x, y, sz, { stroke: c, sw: 1.2, glow: false }, E);
    s += L(x - sz * 0.6, y, x + sz * 0.6, y, c, 1, false, E);
  }
  return s;
};

// G2 rivet line: fasteners along a segment
const rivets = (x1, y1, x2, y2, N, c, E, sz = 3.5) => {
  let s = "";
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;
    s += C(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, sz, { fill: c, glow: false }, E);
  }
  return s;
};

// G3 rib stack: structural ribs across a body
const ribs = (x, y, w, h, N, c, E) => {
  let s = "";
  for (let i = 1; i < N; i++) {
    const xx = x + (w / N) * i;
    s += L(xx, y + 4, xx, y + h - 4, c, 1.2, false, E);
    s += C(xx, y + 10, 2.4, { fill: c, glow: false }, E);
    s += C(xx, y + h - 10, 2.4, { fill: c, glow: false }, E);
  }
  return s;
};

// G4 tick scale: graduated arc or line, major and minor
const ticks = (cx, cy, r, a0, a1, N, c, E, len = 14) => {
  let s = "";
  for (let i = 0; i <= N; i++) {
    const a = a0 + (a1 - a0) * i / N, maj = i % 5 === 0;
    s += L(cx + Math.cos(a) * r, cy + Math.sin(a) * r,
           cx + Math.cos(a) * (r + (maj ? len : len * 0.5)), cy + Math.sin(a) * (r + (maj ? len : len * 0.5)),
           c, maj ? 2 : 1, false, E);
  }
  return s;
};

// G5 knurl: grip texture on a handle
const knurl = (x, y, w, h, c, E) => {
  let s = "";
  for (let i = 0; i < w; i += 5) {
    s += L(x + i, y, x + i + 5, y + h, c, 0.8, false, E);
    s += L(x + i + 5, y, x + i, y + h, c, 0.8, false, E);
  }
  return s;
};

// G6 pads and vias: PCB detail scattered in a region
const vias = (x, y, w, h, N, c, E) => {
  let s = "";
  for (let i = 0; i < N; i++) {
    const px = x + rnd() * w, py = y + rnd() * h, k = rnd();
    if (k < 0.4) s += C(px, py, 3.5, { stroke: c, sw: 1, glow: false }, E) + C(px, py, 1.2, { fill: c, glow: false }, E);
    else if (k < 0.7) s += R(px, py, 7, 4, { fill: c, glow: false }, E);
    else s += L(px, py, px + 12, py, c, 1, false, E);
  }
  return s;
};

// G7 panel seams: plate lines across a face
const seams = (x, y, w, h, N, c, E) => {
  let s = "";
  for (let i = 1; i < N; i++) {
    const yy = y + (h / N) * i;
    s += L(x + 6, yy, x + w - 6, yy, c, 0.9, false, E);
  }
  return s;
};

// G8 hatch band: shaded strip between two radii (depth face)
const hatchBand = (cx, cy, r0, r1, c, E) => {
  const d = `M${n(cx - r1)} ${n(cy)} A${n(r1)} ${n(r1)} 0 1 1 ${n(cx + r1)} ${n(cy)} A${n(r1)} ${n(r1)} 0 1 1 ${n(cx - r1)} ${n(cy)} Z ` +
            `M${n(cx - r0)} ${n(cy)} A${n(r0)} ${n(r0)} 0 1 0 ${n(cx + r0)} ${n(cy)} A${n(r0)} ${n(r0)} 0 1 0 ${n(cx - r0)} ${n(cy)} Z`;
  return `<path d="${d}" fill="${HATCH}" fill-rule="evenodd" stroke="${c}" stroke-width="1.2"/>`;
};

// G9 wire bundle: cable runs with clips
const wires = (pts, c, E, N = 3) => {
  let s = "";
  for (let k = 0; k < N; k++) {
    const off = (k - (N - 1) / 2) * 5;
    const d = pts.map((p, i) => `${i ? "C" : "M"}${n(p[0])} ${n(p[1] + off)}${i ? ` ${n(p[0])} ${n(p[1] + off)} ${n(p[0])} ${n(p[1] + off)}` : ""}`).join(" ");
    s += P(pts.map((p, i) => `${i ? "L" : "M"}${n(p[0])} ${n(p[1] + off)}`).join(" "), { stroke: c, sw: 1.2 }, E);
  }
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2, my = (pts[i - 1][1] + pts[i][1]) / 2;
    s += R(mx - 7, my - 9, 14, 18, { stroke: c, sw: 1, glow: false }, E);
  }
  return s;
};

// G10 fillet corners: chamfer marks at a box's corners
const fillets = (x, y, w, h, c, E, k = 12) => {
  let s = "";
  [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) => {
    s += L(px + sx * k, py, px, py + sy * k, c, 1, false, E);
  });
  return s;
};

// G11 gauge face: full instrument face, reusable machine detail
const gaugeFace = (cx, cy, r, val, c, E) => {
  let s = C(cx, cy, r, { stroke: c, sw: 2 }, E) + C(cx, cy, r * 0.88, { stroke: c, sw: 1 }, E);
  s += ticks(cx, cy, r * 0.72, Math.PI * 0.75, Math.PI * 2.25, 20, c, E, r * 0.12);
  const a = Math.PI * 0.75 + (Math.PI * 1.5) * val;
  s += L(cx, cy, cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66, c, 2.5, true, E);
  s += C(cx, cy, r * 0.1, { fill: c }, E);
  return s;
};

/* ============================================================
   ORNAMENT LAYER: chrome that makes every asset read as one set
   ============================================================ */
function ornament(ed, w, h, level) {
  if (!level) return "";
  const E = TOKENS[ed];
  reseed(7);
  let s = "";
  if (ed === "dark") {
    // faint PCB substrate + hairline grid + HUD corners
    s += `<g opacity="0.10">` + vias(0, 0, w, h, level === 2 ? 160 : 80, E.mist, { ...E, glow: false });
    for (let i = 0; i < 14; i++) {
      const y = rnd() * h, x0 = rnd() * w * 0.5;
      s += trace([[x0, y], [x0 + 120 + rnd() * 200, y], [x0 + 160 + rnd() * 240, y + (rnd() > 0.5 ? 90 : -90)]], E.mist, { ...E, glow: false }, { sw: 1, tokens: false });
    }
    s += `</g>`;
    s += `<g opacity="0.5">` + R(20, 20, w - 40, h - 40, { stroke: E.line, sw: 1, rx: 10, glow: false }, E) + `</g>`;
    s += corner(24, 24, E.mist, { ...E, glow: false }, 0, 34) + corner(w - 24, h - 24, E.mist, { ...E, glow: false }, 180, 34);
  } else {
    // drafting grid + frame + registration marks + a scale ruler
    s += `<g opacity="0.55"><defs><pattern id="dg" width="26" height="26" patternUnits="userSpaceOnUse">
      <path d="M26 0 L0 0 0 26" fill="none" stroke="${E.line}" stroke-width="0.8"/></pattern></defs>
      <rect width="${w}" height="${h}" fill="url(#dg)"/></g>`;
    s += R(20, 20, w - 40, h - 40, { stroke: E.line, sw: 1.2, glow: false }, E);
    [[20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]].forEach(([x, y]) => {
      s += C(x, y, 9, { stroke: E.mist, sw: 1, glow: false }, E) + L(x - 14, y, x + 14, y, E.mist, 0.8, false, E) + L(x, y - 14, x, y + 14, E.mist, 0.8, false, E);
    });
    for (let i = 0; i < 20; i++) {
      const y = 40 + i * ((h - 80) / 19);
      s += L(20, y, i % 5 === 0 ? 40 : 32, y, E.mist, i % 5 === 0 ? 1.4 : 0.8, false, E);
    }
  }
  return s;
}

/* ============================================================
   DENSIFIED FLAGSHIP RECIPES
   Same subjects, 5 to 10x the element count.
   ============================================================ */
const D = {

/* --- H10 Cutaway Engine: the cover asset. Now a real machine. --- */
H10: (p, E) => {
  reseed(11);
  const cx = 512, cy = 470, R0 = 300;
  let s = "";
  // housing shell with cutaway wedge
  s += `<path d="M${cx} ${cy} m-${R0} 0 a${R0} ${R0} 0 1 1 ${R0 * 2} 0 a${R0} ${R0} 0 1 1 -${R0 * 2} 0 M${cx} ${cy} L${cx} ${cy - R0} A${R0} ${R0} 0 0 1 ${n(cx + R0 * Math.cos(-0.35))} ${n(cy + R0 * Math.sin(-0.35))} Z" fill="${HATCH}" fill-rule="evenodd" stroke="${E.ink}" stroke-width="3"/>`;
  s += C(cx, cy, R0, { stroke: E.ink, sw: 3 }, E);
  s += hatchBand(cx, cy, R0 - 34, R0 - 12, E.ink, E);
  s += C(cx, cy, R0 - 46, { stroke: E.ink, sw: 1.6 }, E);
  s += bolts(cx, cy, R0 - 23, 24, E.ink, E, 7);
  // cut edge shading
  s += P(`M${cx} ${cy} L${cx} ${cy - R0}`, { stroke: E.ink, sw: 2 }, E);
  s += P(`M${cx} ${cy} L${n(cx + R0 * Math.cos(-0.35))} ${n(cy + R0 * Math.sin(-0.35))}`, { stroke: E.ink, sw: 2 }, E);
  for (let i = 0; i < 16; i++) { const t = i / 16; s += L(cx + t * R0 * 0.98, cy - 4 - t * 3, cx + t * R0 * 0.98 - 12, cy - 20 - t * 3, E.ink, 0.9, false, E); }
  // gear train
  const gs = [[cx - 130, cy + 70, 96, 18], [cx + 120, cy + 90, 74, 14], [cx + 90, cy - 120, 60, 12], [cx - 150, cy - 110, 52, 10], [cx + 190, cy - 20, 44, 10]];
  for (let i = 0; i < Math.min(p.gears, 5); i++) {
    const [gx, gy, gr, gt] = gs[i];
    s += gear(gx, gy, gr, gt, E.ink, E, {});
    s += bolts(gx, gy, gr * 0.42, 6, E.ink, E, 4);
    s += C(gx, gy, gr * 0.16, { fill: E.ink }, E);
  }
  // rotor core with vanes
  s += C(cx, cy, 92, { fill: p.failing ? E.pink : E.cyan }, E);
  s += C(cx, cy, 70, { stroke: E.ground, sw: 2, glow: false }, E);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += L(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, cx + Math.cos(a + 0.5) * 66, cy + Math.sin(a + 0.5) * 66, E.ground, 3, false, E); }
  s += C(cx, cy, 20, { stroke: E.ground, sw: 2, glow: false }, E);
  // intake and exhaust pipework with flanges, bolts, ribs
  [[60, 430, 250], [714, 430, 250]].forEach(([px, py, pw], k) => {
    s += R(px, py, pw, 84, { stroke: E.ink, sw: 3, fill: HATCH }, E);
    s += seams(px, py, pw, 84, 4, E.ink, E);
    s += R(px + (k ? pw - 30 : 0), py - 12, 30, 108, { stroke: E.ink, sw: 2.5 }, E);
    s += rivets(px + (k ? pw - 15 : 15), py - 6, px + (k ? pw - 15 : 15), py + 90, 5, E.ink, E);
    s += C(k ? px : px + pw, py + 42, 22, { stroke: E.ink, sw: 2 }, E);
    s += ribs(px, py, pw, 84, 6, E.ink, E);
  });
  // mounting plate, nameplate, feet
  s += R(280, 800, 464, 66, { stroke: E.ink, sw: 3, fill: HATCH }, E);
  s += R(300, 866, 60, 34, { stroke: E.ink, sw: 2.5 }, E) + R(664, 866, 60, 34, { stroke: E.ink, sw: 2.5 }, E);
  s += R(410, 814, 204, 38, { stroke: E.ink, sw: 1.8, fill: E.ground, glow: false }, E);
  s += C(422, 833, 4.5, { fill: E.ink }, E) + C(602, 833, 4.5, { fill: E.ink }, E);
  s += rivets(280, 806, 744, 806, 14, E.ink, E, 3);
  // motion ticks + two service gauges
  s += ticks(cx, cy, R0 + 8, 0, Math.PI * 2, 36, E.ink, E, 12);
  s += gaugeFace(180, 250, 52, 0.62, E.ink, E) + gaugeFace(844, 250, 52, 0.34, E.ink, E);
  s += wires([[180, 302], [180, 380], [230, 430]], E.ink, E, 2);
  if (p.detail === 2) { s += vias(40, 60, 940, 120, 40, E.mist, { ...E, glow: false }); }
  return s;
},

/* --- H16 Flywheel: machined mass --- */
H16: (p, E) => {
  reseed(3);
  const cx = 512, cy = 512;
  let s = gear(cx, cy, 285, 30, E.ink, E, { fill: E.ink, bolts: false });
  s += C(cx, cy, 250, { stroke: E.ground, sw: 2, glow: false }, E);
  s += C(cx, cy, 190, { stroke: E.ground, sw: 1.4, glow: false }, E);
  s += C(cx, cy, 120, { stroke: E.ground, sw: 1.4, glow: false }, E);
  // spokes with lightening holes
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    s += L(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46, cx + Math.cos(a) * 186, cy + Math.sin(a) * 186, E.ground, 14, false, E);
    s += C(cx + Math.cos(a + 0.39) * 150, cy + Math.sin(a + 0.39) * 150, 20, { stroke: E.ground, sw: 2, glow: false }, E);
  }
  s += bolts(cx, cy, 222, 18, E.ground, { ...E, glow: false }, 7);
  s += C(cx, cy, 44, { fill: E.cyan }, E) + C(cx, cy, 22, { stroke: E.ground, sw: 2, glow: false }, E);
  // meshed satellites with their own bolt rings
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, gx = cx + Math.cos(a) * 336, gy = cy + Math.sin(a) * 336;
    const c = i % 2 ? E.cyan : E.pink;
    s += gear(gx, gy, 66, 12, c, E, {});
    s += bolts(gx, gy, 30, 6, c, E, 4);
  }
  // orbit: tapered arrows + chip packages + trace ring
  for (let i = 0; i < p.stages; i++) {
    const a0 = i * 2 * Math.PI / p.stages + 0.14, a1 = a0 + 2 * Math.PI / p.stages - 0.28;
    s += arcArrow(cx, cy, 430, a0, a1, E.ink, E, p.accel ? 10 + i * 4 : 20);
    const a = i * 2 * Math.PI / p.stages;
    s += chipPkg(cx + Math.cos(a) * 430, cy + Math.sin(a) * 430, 62, E.cyan, E);
    s += trace([[cx + Math.cos(a) * 300, cy + Math.sin(a) * 300], [cx + Math.cos(a) * 380, cy + Math.sin(a) * 380]], E.cyan, E, { sw: 1.2, tokens: false });
  }
  s += ticks(cx, cy, 470, 0, Math.PI * 2, 48, E.mist, { ...E, glow: false }, 10);
  return s;
},

/* --- H13 Control Loop: a real machined ring --- */
H13: (p, E) => {
  reseed(5);
  const cx = 512, cy = 512, r = 300;
  let s = hatchBand(cx, cy, r - 52, r, E.ink, E);
  s += C(cx, cy, r, { stroke: E.ink, sw: 3 }, E) + C(cx, cy, r - 52, { stroke: E.ink, sw: 2 }, E);
  s += bolts(cx, cy, r - 26, 20, E.ink, E, 7);
  s += C(cx, cy, r - 84, { stroke: E.ink, sw: 1.2 }, E);
  for (let i = 0; i < p.stages; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / p.stages;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    s += G(R(-46, -30, 92, 60, { stroke: E.ink, sw: 2.5, fill: E.ground, glow: false }, E) + rivets(-40, -24, 40, -24, 4, E.ink, E, 3),
           `translate(${n(x)},${n(y)}) rotate(${n(a * 180 / Math.PI + 90)})`);
    s += C(x, y, 40, { stroke: E.ink, sw: 3, fill: E.ground, glow: false }, E);
    s += C(x, y, 30, { stroke: E.ink, sw: 1.4 }, E) + C(x, y, 20, { stroke: E.ink, sw: 1 }, E);
    s += C(x, y, 12, { fill: E.cyan }, E);
    s += ticks(x, y, 42, 0, Math.PI * 2, 12, E.ink, E, 6);
  }
  for (let i = 0; i < p.stages; i++) {
    const a0 = -Math.PI / 2 + i * 2 * Math.PI / p.stages + 0.24, a1 = a0 + 2 * Math.PI / p.stages - 0.48;
    const broke = (i === p.brokenArc);
    s += arcArrow(cx, cy, r + 86, a0, a1, broke ? E.pink : E.ink, E, broke ? 8 : 22);
  }
  s += ticks(cx, cy, r + 130, 0, Math.PI * 2, 40, E.mist, { ...E, glow: false }, 9);
  s += gaugeFace(512, 512, 92, 0.7, E.ink, E);
  return s;
},

/* --- H15 Escalation Ramp: industrial machinery --- */
H15: (p, E) => {
  reseed(9);
  const cols = [E.cyan, E.mist, E.mist, E.pink, E.pink, E.pink];
  let s = "";
  // base frame with cross bracing
  s += L(60, 540, 964, 540, E.ink, 3, false, E);
  for (let i = 0; i < 10; i++) { const x = 70 + i * 90; s += L(x, 540, x + 45, 470, E.ink, 1.4, false, E) + L(x + 45, 540, x, 470, E.ink, 1.4, false, E); }
  s += L(60, 470, 964, 470, E.ink, 2, false, E);
  for (let i = 0; i < p.treads; i++) {
    const x = 90 + i * 170, y = 450 - i * 88;
    s += isoBlock(x, y, 150, 78, 56, E.ink, E, E.ink);
    // cargo block, banded and rivetted
    s += R(x + 18, y - 54, 116, 52, { stroke: E.ink, sw: 2.4, fill: cols[Math.min(i, 5)] }, E);
    s += seams(x + 18, y - 54, 116, 52, 3, E.ground, { ...E, glow: false });
    s += rivets(x + 24, y - 48, x + 128, y - 48, 6, E.ground, { ...E, glow: false }, 2.4);
    // legs, rollers, hydraulic lines
    s += L(x + 10, y + 56, x + 30, y + 130, E.ink, 2, false, E) + L(x + 140, y + 26, x + 160, y + 100, E.ink, 2, false, E);
    s += C(x + 30, y + 134, 12, { stroke: E.ink, sw: 1.6 }, E) + C(x + 160, y + 104, 12, { stroke: E.ink, sw: 1.6 }, E);
    s += wires([[x + 30, y + 120], [x + 90, y + 96], [x + 160, y + 90]], E.ink, E, 2);
    s += bolts(x + 76, y + 20, 30, 6, E.ink, E, 4);
  }
  const tx = 90 + (p.treads - 1) * 170, ty = 450 - (p.treads - 1) * 88;
  // beacons and warning triangles on the top unit
  [tx + 40, tx + 100].forEach((bx, k) => {
    s += R(bx - 12, ty - 96, 24, 22, { stroke: E.ink, sw: 2 }, E);
    s += C(bx, ty - 104, 13, { fill: E.pink }, E);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += L(bx + Math.cos(a) * 18, ty - 104 + Math.sin(a) * 18, bx + Math.cos(a) * 30, ty - 104 + Math.sin(a) * 30, E.pink, 1.6, false, E); }
  });
  s += POLY([[tx + 150, ty - 70], [tx + 172, ty - 30], [tx + 128, ty - 30]], { stroke: E.pink, sw: 2 }, E) + L(tx + 150, ty - 58, tx + 150, ty - 42, E.pink, 2, false, E);
  s += gear(130, 555, 28, 12, E.ink, E, {}) + gear(215, 562, 22, 10, E.ink, E, {}) + gear(880, 555, 26, 12, E.ink, E, {});
  for (let i = 0; i < 8; i++) s += C(280 + i * 70, 560, 14, { stroke: E.ink, sw: 1.4 }, E);
  s += arrow(120, 520, tx + 30, ty + 40, E.ink, { ...E, glow: false }, 7, 24);
  return s;
},

/* --- H11 Leaking Vessel: valves, flanges, gauges --- */
H11: (p, E) => {
  reseed(4);
  let s = R(40, 150, 944, 96, { stroke: E.ink, sw: 3, fill: HATCH }, E);
  s += seams(40, 150, 944, 96, 3, E.ink, E);
  [70, 320, 620, 900].forEach(x => {
    s += R(x, 136, 30, 124, { stroke: E.ink, sw: 2.5 }, E);
    s += rivets(x + 15, 146, x + 15, 250, 5, E.ink, E, 3);
    s += R(x - 8, 132, 46, 10, { stroke: E.ink, sw: 1.6 }, E);
  });
  // valve wheels on the run
  [200, 760].forEach(x => {
    s += R(x - 26, 106, 52, 46, { stroke: E.ink, sw: 2.2, fill: HATCH }, E);
    s += C(x, 88, 26, { stroke: E.ink, sw: 2.4 }, E) + C(x, 88, 8, { stroke: E.ink, sw: 1.6 }, E);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += L(x + Math.cos(a) * 8, 88 + Math.sin(a) * 8, x + Math.cos(a) * 24, 88 + Math.sin(a) * 24, E.ink, 1.4, false, E); }
  });
  s += gaugeFace(480, 84, 40, 0.82, E.ink, E) + L(480, 124, 480, 150, E.ink, 2, false, E);
  s += ribs(40, 150, 944, 96, 16, E.ink, E);
  for (let i = 0; i < p.leaks; i++) {
    const x = 220 + i * (700 / Math.max(p.leaks - 1, 1));
    if (!p.welded) {
      for (let k = 0; k < 7; k++) { const a = -1.1 + k * 0.36; s += L(x, 246, x + Math.cos(a) * (26 + rnd() * 22), 246 + Math.abs(Math.sin(a)) * (22 + rnd() * 18), E.ink, 1.5, false, E); }
      for (let k = 0; k < 7; k++) s += C(x + (rnd() - 0.5) * 8, 276 + k * 32 + k * k * 1.4, 4 + k * 0.7, { fill: E.pink, glow: false }, E);
      s += `<ellipse cx="${x}" cy="512" rx="52" ry="10" fill="${E.pink}" opacity="0.5"/>`;
      s += `<ellipse cx="${x}" cy="512" rx="30" ry="6" fill="${E.pink}" opacity="0.7"/>`;
    } else {
      s += L(x - 26, 246, x + 26, 246, E.cyan, 5, false, E);
      for (let k = 0; k < 5; k++) s += L(x - 22 + k * 11, 240, x - 16 + k * 11, 252, E.cyan, 1.6, false, E);
    }
  }
  return s;
},

/* --- H25 Refinery Column: trays, valves, feed loops --- */
H25: (p, E) => {
  reseed(6);
  let s = R(372, 110, 280, 780, { stroke: E.ink, sw: 3, rx: 140, fill: HATCH }, E);
  s += R(394, 150, 236, 700, { stroke: E.ink, sw: 1.6, fill: E.ground, glow: false }, E);
  for (let i = 0; i < p.trays; i++) {
    const y = 200 + i * (620 / (p.trays - 1));
    s += L(400, y, 624, y, E.ink, 1.8, false, E);
    for (let k = 0; k < 6; k++) s += C(414 + k * 40, y, 5, { stroke: E.ink, sw: 1.1 }, E);
    s += L(i % 2 ? 400 : 624, y, i % 2 ? 430 : 594, y + 30, E.ink, 1.2, false, E);
  }
  s += ribs(372, 110, 280, 780, 10, E.ink, E);
  s += bolts(512, 130, 120, 12, E.ink, E, 5);
  s += R(140, 830, 250, 44, { stroke: E.ink, sw: 3, fill: HATCH }, E) + C(150, 852, 16, { stroke: E.ink, sw: 2 }, E);
  s += wires([[150, 836], [150, 760], [230, 700]], E.ink, E, 2);
  for (let i = 0; i < p.outputs; i++) {
    const y = 790 - i * (580 / (p.outputs - 1)), top = i === p.outputs - 1, c = top ? E.cyan : E.ink;
    s += R(652, y - 20, 250, 40, { stroke: c, sw: top ? 3 : 2.5, fill: HATCH }, E);
    s += R(880, y - 30, 26, 60, { stroke: c, sw: 2 }, E) + rivets(893, y - 22, 893, y + 22, 3, c, E, 2.5);
    s += C(760, y - 34, 16, { stroke: c, sw: 1.8 }, E) + L(760, y - 20, 760, y - 18, c, 2, false, E);
  }
  s += gaugeFace(280, 300, 46, 0.55, E.ink, E) + gaugeFace(280, 560, 46, 0.72, E.ink, E);
  s += wires([[326, 300], [352, 340], [372, 400]], E.ink, E, 2);
  return s;
},

/* --- H14 Concentric Shield: layered armour + circuit halo --- */
H14: (p, E) => {
  reseed(8);
  const sh = k => `M512 ${140 + (1 - k) * 110} L${512 + 300 * k} ${300 + (1 - k) * 80} L${512 + 300 * k} ${560 + (1 - k) * 36} Q512 ${880 - (1 - k) * 70} ${512 - 300 * k} ${560 + (1 - k) * 36} L${512 - 300 * k} ${300 + (1 - k) * 80} Z`;
  let s = "";
  for (let i = 0; i < p.rings; i++) {
    const k = 1 - i * (0.72 / p.rings), gap = i === p.gapRing;
    s += P(sh(k), { stroke: gap ? E.faint : (i === 1 ? E.cyan : E.ink), sw: 4.5 - i * 0.7, dash: gap ? "10 8" : null, fill: i === 0 ? HATCH : E.ground }, E);
    if (!gap) s += P(sh(k - 0.04), { stroke: E.ink, sw: 0.9 }, E);
  }
  const hex = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 6; hex.push([512 + Math.cos(a) * 84, 500 + Math.sin(a) * 84]); }
  s += POLY(hex, { stroke: E.ink, sw: 2.5, fill: HATCH }, E);
  s += POLY(hex.map(q => [512 + (q[0] - 512) * 0.6, 500 + (q[1] - 500) * 0.6]), { stroke: E.ink, sw: 1.4 }, E);
  s += C(512, 500, 10, { fill: E.cyan }, E);
  // circuit halo, denser and terminated
  for (let i = 0; i < 40; i++) {
    const a = i * Math.PI / 20, r0 = 330 + ((i * 41) % 60);
    const x0 = 512 + Math.cos(a) * r0, y0 = 500 + Math.sin(a) * r0 * 1.05;
    const x1 = 512 + Math.cos(a) * (r0 + 60 + rnd() * 40), y1 = 500 + Math.sin(a) * (r0 + 60 + rnd() * 40) * 1.05;
    s += L(x0, y0, x1, y0, E.ink, 1, false, E) + L(x1, y0, x1, y1, E.ink, 1, false, E);
    s += C(x1, y1, 4, { stroke: E.ink, sw: 1, glow: false }, E);
  }
  s += padlock(512, 770, 76, E.ink, E);
  s += bolts(512, 500, 250, 12, E.ink, E, 6);
  return s;
},

/* --- H07 Ascension Staircase: lit risers, service detail --- */
H07: (p, E) => {
  reseed(2);
  const cols = [E.cyan, E.white, E.pink, E.cyan, E.pink];
  let s = "";
  for (let i = 0; i < 9; i++) s += L(-40 + i * 150, 560, 120 + i * 150, 400, E.line, 1, false, E);
  for (let i = 0; i < 5; i++) s += L(40, 560 - i * 40, 1000, 560 - i * 40 - 120, E.line, 0.8, false, E);
  for (let i = 0; i < p.steps; i++) {
    const x = 130 + i * 200, y = 470 - i * 110, c = cols[i];
    s += isoBlock(x, y, 190, 110, 92, c, E, E.mist);
    // face detail: seams, vents, bolt rows
    s += seams(x + 12, y + 46, 100, 80, 4, E.mist, { ...E, glow: false });
    s += rivets(x + 14, y + 40, x + 108, y + 40, 5, E.mist, { ...E, glow: false }, 2.4);
    for (let k = 0; k < 4; k++) s += L(x + 130, y + 30 + k * 14, x + 178, y + 6 + k * 14, E.mist, 1, false, E);
    s += padlock(x + 95, y + 92, 52, c, E, i === p.unlocked);
    s += trace([[x + 232, y + 16], [x + 300, y - 14], [980, y - 14]], E.mist, { ...E, glow: false }, { sw: 1.2, tokens: false });
    s += C(x + 232, y + 16, 5, { fill: c }, E);
  }
  return s;
},

/* --- H03 Convergence Rivers: tributaries, housing detail --- */
H03: (p, E) => {
  reseed(12);
  let s = node(110, 288, E.cyan, E, "source");
  const ys = [190, 386, 288];
  for (let r = 0; r < p.rivers; r++) {
    const c = r === 0 ? E.cyan : (r === 1 ? E.pink : E.white), y = ys[r];
    s += river([[170, 288], [258, y], [700, y], [788, 288]], c, E, 13);
    for (let t = 0; t < p.tributaries; t++) {
      const x = 292 + t * (392 / Math.max(p.tributaries - 1, 1)), up = r ? 1 : -1;
      s += trace([[x, y], [x, y + up * 30], [x + 22, y + up * 30]], c, E, { sw: 1.2, tokens: false });
      s += C(x + 26, y + up * 30, 4, { fill: c }, E);
      s += L(x - 14, y + up * 8, x - 14, y + up * 20, c, 1, true, E);
    }
  }
  const oct = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; oct.push([832, 288].map((v, j) => v + (j ? Math.sin(a) : Math.cos(a)) * 86)); }
  s += POLY(oct, { stroke: E.white, sw: 2.5 }, E);
  s += POLY(oct.map(q => [832 + (q[0] - 832) * 0.78, 288 + (q[1] - 288) * 0.78]), { stroke: E.white, sw: 1.4 }, E);
  s += POLY(oct.map(q => [832 + (q[0] - 832) * 0.58, 288 + (q[1] - 288) * 0.58]), { stroke: E.white, sw: 1 }, E);
  s += bolts(832, 288, 96, 8, E.mist, { ...E, glow: false }, 5);
  s += padlock(832, 288, 58, E.white, E);
  s += POLY([[918, 246], [968, 266], [918, 286]], { fill: E.cyan }, E);
  s += POLY([[918, 296], [968, 316], [918, 336]], { fill: E.pink }, E);
  s += C(996, 288, 18, { stroke: E.cyan }, E) + P("M987 288 L994 296 L1006 280", { stroke: E.cyan, sw: 2.5 }, E);
  return s;
},

/* --- H44 The Press: frame, ram, hydraulics --- */
H44: (p, E) => {
  reseed(14);
  let s = P("M170 110 L730 110 L730 910 L580 910 L580 800 L320 800 L320 910 L170 910 Z", { stroke: E.ink, sw: 3.5, fill: HATCH }, E);
  s += P("M210 150 L690 150 L690 760 L560 760 L560 660 L340 660 L340 760 L210 760 Z", { stroke: E.ink, sw: 1.2 }, E);
  s += rivets(180, 130, 720, 130, 14, E.ink, E, 3.5);
  s += rivets(180, 890, 720, 890, 14, E.ink, E, 3.5);
  s += R(370, 160, 170, 190, { stroke: E.ink, sw: 3, fill: E.ground, glow: false }, E);
  s += ribs(370, 160, 170, 190, 5, E.ink, E);
  s += bolts(455, 255, 66, 8, E.ink, E, 5);
  s += R(425, 350, 62, 130 + p.ram, { stroke: E.ink, sw: 2.5, fill: HATCH }, E);
  s += L(408, 350, 408, 480 + p.ram, E.ink, 1.6, false, E) + L(504, 350, 504, 480 + p.ram, E.ink, 1.6, false, E);
  s += R(330, 470 + p.ram, 250, 76, { stroke: E.ink, sw: 3, fill: HATCH }, E);
  s += rivets(345, 482 + p.ram, 565, 482 + p.ram, 8, E.ink, E, 3);
  s += R(300, 650, 320, 66, { stroke: E.ink, sw: 3 }, E) + seams(300, 650, 320, 66, 4, E.ink, E);
  s += POLY([[620, 668], [790, 668], [830, 730], [660, 730]], { stroke: E.ink, sw: 2.5, fill: HATCH }, E);
  s += R(770, 706, 74, 54, { stroke: E.cyan, sw: 3 }, E) + C(807, 733, 12, { stroke: E.cyan, sw: 1.6 }, E);
  s += gaugeFace(250, 250, 48, 0.78, E.ink, E) + gaugeFace(650, 250, 48, 0.4, E.ink, E);
  s += wires([[250, 298], [250, 380], [370, 420]], E.ink, E, 3);
  s += wires([[650, 298], [650, 380], [540, 420]], E.ink, E, 3);
  return s;
},

/* --- H36 Radar: bezel, range rings, contact detail --- */
H36: (p, E) => {
  reseed(13);
  const cx = 512, cy = 512;
  let s = C(cx, cy, 430, { stroke: E.mist, sw: 3 }, E) + C(cx, cy, 410, { stroke: E.mist, sw: 1 }, E);
  s += bolts(cx, cy, 420, 16, E.mist, { ...E, glow: false }, 6);
  [120, 210, 300, 380].forEach(r => { s += C(cx, cy, r, { stroke: E.mist, sw: 1.3 }, E); });
  for (let i = 0; i < 36; i++) { const a = i * Math.PI / 18; s += L(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, cx + Math.cos(a) * 380, cy + Math.sin(a) * 380, E.mist, i % 3 ? 0.6 : 1, false, E); }
  s += ticks(cx, cy, 380, 0, Math.PI * 2, 40, E.mist, { ...E, glow: false }, 16);
  const a = p.sweep * Math.PI / 180;
  s += `<path d="M${cx} ${cy} L${n(cx + Math.cos(a - 0.8) * 380)} ${n(cy + Math.sin(a - 0.8) * 380)} A380 380 0 0 1 ${n(cx + Math.cos(a) * 380)} ${n(cy + Math.sin(a) * 380)} Z" fill="${E.cyan}" opacity="0.14"/>`;
  s += L(cx, cy, cx + Math.cos(a) * 380, cy + Math.sin(a) * 380, E.cyan, 3, true, E);
  s += C(cx, cy, 14, { fill: E.cyan }, E);
  for (let i = 0; i < p.contacts; i++) {
    const t = i * 2.3, r = 140 + ((i * 97) % 210);
    const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r, c = i === 0 ? E.pink : E.cyan;
    s += R(x - 11, y - 11, 22, 22, { fill: c }, E);
    s += R(x - 20, y - 20, 40, 40, { stroke: c, sw: 1, glow: false }, E);
    s += L(x + 20, y - 20, x + 50, y - 40, c, 1, false, E);
  }
  return s;
},

/* --- H53 Airlock: dogged doors, piping, ribs --- */
H53: (p, E) => {
  reseed(15);
  let s = R(190, 350, 644, 320, { stroke: E.ink, sw: 3.5, rx: 160, fill: HATCH }, E);
  s += R(236, 396, 552, 228, { stroke: E.ink, sw: 1.6, fill: E.ground, glow: false }, E);
  for (let i = 0; i < 7; i++) { const x = 290 + i * 82; s += L(x, 396, x, 624, E.ink, 1.4, false, E) + C(x, 410, 3.5, { fill: E.ink }, E) + C(x, 610, 3.5, { fill: E.ink }, E); }
  [236, 788].forEach((x, k) => {
    const swung = (k === 1 && p.outerOpen);
    const door = C(0, 0, 142, { stroke: E.ink, sw: 3.5, fill: HATCH }, E) + C(0, 0, 118, { stroke: E.ink, sw: 1.4 }, E) +
      C(0, 0, 52, { stroke: E.ink, sw: 2.5 }, E) + C(0, 0, 14, { fill: E.ink }, E) + bolts(0, 0, 130, 12, E.ink, E, 6);
    let spokes = ""; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; spokes += L(Math.cos(a) * 14, Math.sin(a) * 14, Math.cos(a) * 50, Math.sin(a) * 50, E.ink, 3, false, E); }
    s += G(door + spokes, `translate(${x},510) rotate(${swung ? -58 : 0})`);
  });
  s += P("M300 350 C 390 220, 640 220, 724 350", { stroke: E.ink, sw: 3 }, E);
  s += P("M330 356 C 410 244, 620 244, 700 356", { stroke: E.ink, sw: 1.2 }, E);
  [430, 600].forEach((x, k) => {
    s += R(x - 22, 236, 44, 40, { stroke: E.ink, sw: 2.2, fill: HATCH }, E);
    s += C(x, 220, 22, { stroke: k ? E.ink : E.cyan, sw: 2.4 }, E);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += L(x + Math.cos(a) * 7, 220 + Math.sin(a) * 7, x + Math.cos(a) * 20, 220 + Math.sin(a) * 20, k ? E.ink : E.cyan, 1.4, false, E); }
  });
  s += gaugeFace(880, 250, 44, 0.6, E.ink, E);
  s += wires([[880, 294], [880, 380], [834, 430]], E.ink, E, 2);
  s += R(190, 680, 644, 40, { stroke: E.ink, sw: 2.5, fill: HATCH }, E) + rivets(210, 700, 814, 700, 16, E.ink, E, 3);
  return s;
},

/* --- H30 Kill Switch: guarded, wired, mounted --- */
H30: (p, E) => {
  reseed(16);
  let s = R(250, 500, 300, 130, { stroke: E.white, sw: 3, fill: E.card, glow: false }, E);
  s += bolts(400, 565, 120, 8, E.mist, { ...E, glow: false }, 6);
  s += C(400, 400, 124, { fill: E.pink }, E) + C(400, 400, 96, { stroke: E.ground, sw: 3, glow: false }, E) + C(400, 400, 60, { stroke: E.ground, sw: 2, glow: false }, E);
  s += C(400, 400, 140, { stroke: E.white, sw: 2 }, E);
  s += ticks(400, 400, 148, 0, Math.PI * 2, 24, E.mist, { ...E, glow: false }, 10);
  for (let i = 0; i < 3; i++) s += P(`M${250 + i * 12} 400 A${150 - i * 12} ${170 - i * 12} 0 0 1 ${550 - i * 12} 400`, { stroke: E.white, sw: 2 }, E);
  s += L(250, 400, 250, 500, E.white, 2.5, true, E) + L(550, 400, 550, 500, E.white, 2.5, true, E);
  s += trace([[550, 590], [700, 590], [700, 680]], E.pink, E, { sw: 2.5 });
  s += R(640, 680, 120, 220, { stroke: E.white, sw: 2.5 }, E) + seams(640, 680, 120, 220, 4, E.mist, { ...E, glow: false });
  s += C(700, 710, 10, { fill: E.white }, E) + C(700, 870, 10, { fill: E.white }, E);
  s += L(700, 710, p.tripped ? 756 : 700, 870, p.tripped ? E.faint : E.cyan, 4, !p.tripped, E);
  s += vias(80, 700, 500, 240, 40, E.mist, { ...E, glow: false });
  return s;
},

/* --- H21 Vault Rack: uprights, runners, labels --- */
H21: (p, E) => {
  reseed(17);
  const w = 200, h = 140, x0 = (1024 - p.cols * w) / 2, y0 = (1024 - p.rows * h) / 2;
  let s = R(x0 - 24, y0 - 24, p.cols * w + 48, p.rows * h + 48, { stroke: E.ink, sw: 3, fill: HATCH }, E);
  for (let c = 0; c <= p.cols; c++) s += L(x0 + c * w, y0 - 24, x0 + c * w, y0 + p.rows * h + 24, E.ink, 2, false, E);
  for (let r = 0; r <= p.rows; r++) s += L(x0 - 24, y0 + r * h, x0 + p.cols * w + 24, y0 + r * h, E.ink, 2, false, E);
  for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
    const i = r * p.cols + c, x = x0 + c * w, y = y0 + r * h;
    const last = i === p.rows * p.cols - 1, open = i === p.openBay, ox = open ? 30 : 0;
    if (last && p.ungoverned) { s += R(x + 8, y + 8, w - 16, h - 16, { stroke: E.ink, sw: 2, dash: "9 6", fill: HATCH }, E); continue; }
    s += R(x + 8 + ox, y + 8, w - 16, h - 16, { stroke: E.ink, sw: 2, fill: E.ground, glow: false }, E);
    s += R(x + 18 + ox, y + 16, w - 36, 12, { stroke: E.ink, sw: 1.2 }, E);
    s += R(x + 24 + ox, y + 52, 74, 22, { stroke: E.ink, sw: 1.2 }, E);
    s += C(x + w - 34 + ox, y + h - 34, 8, { stroke: E.ink, sw: 1.4 }, E);
    s += rivets(x + 16 + ox, y + h - 16, x + w - 16 + ox, y + h - 16, 4, E.ink, E, 2.4);
    if (open) { s += L(x + 8, y + h - 18, x + 8 + ox, y + h - 18, E.ink, 1.6, false, E) + L(x + 8, y + 18, x + 8 + ox, y + 18, E.ink, 1.6, false, E); }
  }
  s += bolts(x0 - 24, y0 - 24, 14, 4, E.ink, E, 4);
  return s;
}
};

/* ---------- patch the kit ---------- */
for (const id in D) HEROES[id].draw = D[id];
for (const id in HEROES) {
  if (!HEROES[id].params.detail) HEROES[id].params.detail = { d: 1, min: 0, max: 2 };
}

function render2(id, overrides = {}) {
  const H = HEROES[id];
  if (!H) throw new Error("unknown asset: " + id);
  const E = TOKENS[H.edition];
  const p = {};
  for (const k in H.params) p[k] = (k in overrides) ? overrides[k] : H.params[k].d;
  const orn = ornament(H.edition, H.canvas[0], H.canvas[1], p.detail);
  return wrap(H.canvas[0], H.canvas[1], H.edition, H.draw(p, E), orn);
}

const API2 = { ...K, render: render2, ornament,
  greebles: { bolts, rivets, ribs, ticks, knurl, vias, seams, hatchBand, wires, fillets, gaugeFace } };
if (typeof module !== "undefined") module.exports = API2;

/* ============================================================
   PASS 2: densify the remaining light-edition mechanicals.
   Same greebles, applied to the assets that were still thin.
   ============================================================ */
const D2 = {
H20: (p,E)=>{ reseed(21); const cx=512,cy=760,R0=380,R1=250,N=p.voussoirs; let s="";
  for(let i=0;i<N;i++){const a0=Math.PI+i*Math.PI/N,a1=Math.PI+(i+1)*Math.PI/N,key=i===Math.floor(N/2);
   const pts=[[cx+Math.cos(a0)*R1,cy+Math.sin(a0)*R1],[cx+Math.cos(a0)*R0,cy+Math.sin(a0)*R0],[cx+Math.cos(a1)*R0,cy+Math.sin(a1)*R0],[cx+Math.cos(a1)*R1,cy+Math.sin(a1)*R1]];
   s+=POLY(pts,{stroke:E.ink,sw:key?3.5:2,fill:key?E.pink:HATCH},E);
   const mx=(pts[0][0]+pts[2][0])/2,my=(pts[0][1]+pts[2][1])/2; s+=C(mx,my,5,{stroke:E.ink,sw:1.2,glow:false},E);}
  for(let i=0;i<N;i++){const a=Math.PI+i*Math.PI/N; s+=L(cx+Math.cos(a)*R1,cy+Math.sin(a)*R1,cx+Math.cos(a)*R0,cy+Math.sin(a)*R0,E.ink,1,false,E);}
  s+=R(80,760,180,120,{stroke:E.ink,sw:3,fill:HATCH},E)+R(764,760,180,120,{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=rivets(90,880,934,880,20,E.ink,E,3)+L(60,884,964,884,E.ink,3,false,E);
  const kx=cx,ky=cy-R0+42; s+=L(kx+130,300,kx+30,ky-10,E.ink,1.2,false,E)+arrow(kx+60,ky-30,kx+16,ky-6,E.ink,{...E,glow:false},1.2,10);
  s+=L(150,300,150,760,E.ink,1,false,E)+arrow(150,360,150,300,E.ink,{...E,glow:false},1,9)+arrow(150,700,150,760,E.ink,{...E,glow:false},1,9);
  for(let i=0;i<10;i++)s+=L(cx-R0-20,300+i*46,cx-R0-4,300+i*46,E.mist,i%5?0.8:1.4,false,E);
  return s;},

H29:(p,E)=>{ reseed(22); let b=R(112,392,800,18,{stroke:E.ink,sw:2.5,fill:HATCH},E)+rivets(140,401,884,401,16,E.ink,E,3);
  for(let i=0;i<p.pans;i++){const x=200+i*(624/(p.pans-1));
   b+=L(x,410,x,540,E.ink,2,false,E)+C(x,410,7,{fill:E.ink},E);
   b+=P(`M${x-84} 540 L${x+84} 540 L${x+62} 596 L${x-62} 596 Z`,{stroke:E.ink,sw:2.5,fill:HATCH},E);
   b+=rivets(x-70,552,x+70,552,6,E.ink,E,2.4);
   for(let k=0;k<p.blocks;k++)b+=R(x-52+((k%3)*36),484-((k/3)|0)*36,32,32,{stroke:E.ink,sw:1.6,fill:HATCH},E)+C(x-36+((k%3)*36),500-((k/3)|0)*36,3,{fill:E.ink},E);}
  let s=G(b,`rotate(${p.tilt} 512 400)`);
  s+=POLY([[512,392],[448,700],[576,700]],{stroke:E.ink,sw:3,fill:HATCH},E)+C(512,400,14,{stroke:E.ink,sw:2},E)+C(512,400,5,{fill:E.ink},E);
  s+=R(400,700,224,60,{stroke:E.ink,sw:3,fill:HATCH},E)+rivets(420,730,604,730,8,E.ink,E,3);
  s+=L(120,764,904,764,E.ink,3,false,E)+ticks(512,400,320,Math.PI,Math.PI*2,24,E.mist,{...E,glow:false},10);
  s+=P("M170 400 L854 400",{stroke:E.ink,sw:1,dash:"8 6"},E);
  return s;},

H39:(p,E)=>{ reseed(23); let s=POLY([[512,656],[440,904],[584,904]],{stroke:E.ink,sw:3,fill:HATCH},E)+rivets(460,890,564,890,5,E.ink,E,3);
  const blk=R(262,572,500,84,{stroke:E.ink,sw:3,fill:HATCH},E)+seams(262,572,500,84,5,E.ink,E)+rivets(280,586,744,586,14,E.ink,E,3)
   +R(596,468,148,104,{stroke:E.ink,sw:2.5,fill:HATCH},E)+bolts(670,520,36,6,E.ink,E,4);
  s+=G(blk,`rotate(${p.tilt} 512 656)`);
  s+=C(512,656,10,{fill:E.pink},E)+C(512,656,22,{stroke:E.pink,sw:1.5},E);
  s+=P("M770 630 A 270 270 0 0 1 862 800",{stroke:E.ink,sw:1.5,dash:"8 6"},E)+arrow(846,760,864,806,E.ink,{...E,glow:false},1.5,11);
  s+=L(512,656,800,656,E.ink,1,false,E)+P(`M672 656 A160 160 0 0 0 ${n(512+160*Math.cos(p.tilt*Math.PI/180))} ${n(656+160*Math.sin(p.tilt*Math.PI/180))}`,{stroke:E.ink,sw:1.2},E);
  s+=L(120,904,904,904,E.ink,3,false,E)+rivets(140,918,884,918,18,E.ink,E,2.6);
  s+=ticks(512,656,300,Math.PI,Math.PI*2,20,E.mist,{...E,glow:false},9);
  return s;},

H51:(p,E)=>{ reseed(24); let s=R(280,690,464,180,{stroke:E.ink,sw:3.5,fill:HATCH},E)+seams(280,690,464,180,3,E.ink,E);
  s+=bolts(512,780,190,10,E.ink,E,6)+rivets(300,856,724,856,12,E.ink,E,3);
  s+=P("M270 410 A 262 262 0 0 1 754 410",{stroke:E.ink,sw:3.5},E)+P("M296 430 A 236 236 0 0 1 728 430",{stroke:E.ink,sw:1.2},E);
  [-30,0,30].forEach(a=>{const t=(a-90)*Math.PI/180,c=(a===30)?E.cyan:E.ink;
   s+=C(512+Math.cos(t)*262,690+Math.sin(t)*262,17,{stroke:c,sw:a===30?3:2},E)+C(512+Math.cos(t)*262,690+Math.sin(t)*262,7,{fill:c},E);});
  const t=(p.angle-90)*Math.PI/180;
  s+=L(512,690,512+Math.cos(t)*254,690+Math.sin(t)*254,E.ink,13,false,E)+L(512,690,512+Math.cos(t)*254,690+Math.sin(t)*254,E.ground,3,false,E);
  s+=C(512,690,30,{stroke:E.ink,sw:3.5,fill:E.ground,glow:false},E)+C(512,690,18,{stroke:E.ink,sw:1.4},E)+C(512,690,7,{fill:E.ink},E);
  s+=bolts(512,690,24,6,E.ink,E,3.5);
  const gx=512+Math.cos(t)*266, gy=690+Math.sin(t)*266;
  s+=G(R(-28,-76,56,76,{stroke:E.ink,sw:3,fill:E.ground,glow:false},E)+knurl(-24,-70,48,64,E.ink,E),`translate(${n(gx)},${n(gy)}) rotate(${p.angle})`);
  s+=P("M474 690 l-34 -22 l34 -22 l-34 -22",{stroke:E.ink,sw:2},E);
  s+=gaugeFace(200,300,50,0.5+p.angle/90,E.ink,E)+wires([[200,352],[200,470],[280,560]],E.ink,E,2);
  return s;},

H52:(p,E)=>{ reseed(25); const cav=`M300 380 L470 380 L470 460 L400 460 L400 600 L300 600 Z`;
  let s=`<path d="M110 230 L650 230 L650 810 L110 810 Z ${cav}" fill="${HATCH}" fill-rule="evenodd" stroke="${E.ink}" stroke-width="3.5"/>`;
  s+=P(cav,{stroke:E.ink,sw:2.5},E)+P(`M310 390 L460 390 L460 450 L390 450 L390 590 L310 590 Z`,{stroke:E.ink,sw:1},E);
  s+=bolts(380,520,180,10,E.ink,E,6);
  [[110,230],[650,230],[110,810],[650,810]].forEach(c=>{s+=C(c[0],c[1],18,{stroke:E.ink,sw:2.5},E)+C(c[0],c[1],7,{fill:E.ink},E)
   +R(c[0]-30,c[1]-12,60,24,{stroke:E.ink,sw:1.6},E);});
  s+=C(200,300,12,{stroke:E.ink,sw:2},E)+C(560,740,12,{stroke:E.ink,sw:2},E);
  s+=seams(110,650,540,160,3,E.ink,E);
  for(let i=0;i<p.parts;i++){const y=250+i*190,bad=(p.malformed&&i===p.parts-1);
   s+=G(P(cav,{stroke:bad?E.pink:E.ink,sw:2.5},E)+P(cav,{stroke:E.ink,sw:0.8,dash:"5 4"},E),`translate(${470},${y-380}) scale(0.82)`);}
  s+=L(80,230,80,810,E.ink,1,false,E)+arrow(80,290,80,230,E.ink,{...E,glow:false},1,9)+arrow(80,750,80,810,E.ink,{...E,glow:false},1,9);
  return s;},

H38:(p,E)=>{ reseed(26); const wl=300; let s=L(0,wl,1024,wl,E.ink,2.5,false,E);
  for(let i=0;i<26;i++)s+=L(i*40,wl,i*40+22,wl,E.mist,1,false,E);
  s+=POLY([[512,wl-160],[634,wl],[390,wl]],{stroke:E.ink,sw:3,fill:E.ground,glow:false},E)+seams(430,wl-100,164,100,3,E.ink,E);
  const depth=140+p.ratio*80;
  s+=POLY([[390,wl],[634,wl],[880,wl+depth*0.6],[512,wl+depth],[144,wl+depth*0.55]],{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=gear(400,520,62,16,E.ink,E,{})+gear(650,650,48,12,E.ink,E,{})+gear(300,700,36,10,E.ink,E,{});
  s+=R(480,560,180,70,{stroke:E.ink,sw:2.5,fill:E.ground,glow:false},E)+ribs(480,560,180,70,5,E.ink,E);
  s+=R(560,760,190,60,{stroke:E.ink,sw:2.5},E)+rivets(575,790,735,790,6,E.ink,E,2.6);
  s+=wires([[400,590],[480,620],[560,760]],E.ink,E,2);
  for(let i=0;i<10;i++)s+=C(230+i*62,640+((i%3)*44),9,{stroke:E.ink,sw:1.4},E);
  s+=vias(200,700,600,180,50,E.mist,{...E,glow:false});
  s+=L(80,wl,80,wl+depth,E.ink,1.2,false,E)+arrow(80,wl+60,80,wl,E.ink,{...E,glow:false},1.2,10)+arrow(80,wl+depth-60,80,wl+depth,E.ink,{...E,glow:false},1.2,10);
  return s;},

H23:(p,E)=>{ reseed(27); let s="";
  for(let i=0;i<p.pile;i++){const x=330+(i%7)*54+((i/7|0)%2)*20,y=300-((i/7|0))*30;
   s+=R(x,y,46,26,{stroke:E.ink,sw:1.6,fill:E.ground,glow:false},E)+L(x+6,y+13,x+40,y+13,E.mist,0.8,false,E);}
  s+=POLY([[290,320],[734,320],[512+p.outlet/2,624],[512-p.outlet/2,624]],{stroke:E.ink,sw:3.5,fill:HATCH},E);
  s+=P(`M310 336 L714 336`,{stroke:E.ink,sw:1.2},E)+rivets(300,330,724,330,14,E.ink,E,3);
  s+=R(512-p.outlet/2,624,p.outlet,64,{stroke:E.ink,sw:3,fill:HATCH},E)+ribs(512-p.outlet/2,624,p.outlet,64,3,E.ink,E);
  s+=R(490,700,46,26,{stroke:E.ink,sw:2},E);
  s+=R(280,780,464,26,{stroke:E.ink,sw:3,fill:HATCH},E);
  for(let i=0;i<6;i++)s+=C(320+i*82,822,20,{stroke:E.ink,sw:2},E)+C(320+i*82,822,7,{fill:E.ink},E);
  s+=gear(760,822,30,12,E.ink,E,{})+wires([[760,790],[820,740],[860,640]],E.ink,E,2);
  s+=gaugeFace(180,420,46,0.9,E.ink,E);
  return s;},

H49:(p,E)=>{ reseed(28); let s=POLY([[0,340],[330,340],[330,576],[0,576]],{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=POLY([[694,340],[1024,340],[1024,576],[694,576]],{stroke:E.ink,sw:3,fill:HATCH},E);
  for(let i=0;i<14-p.progress;i++)s+=G(R(30+(i%4)*72,170+((i/4)|0)*56,54,34,{stroke:E.ink,sw:1.6,fill:E.ground,glow:false},E),`rotate(${(i*37)%20-10} ${57+(i%4)*72} ${187+((i/4)|0)*56})`);
  for(let i=0;i<p.progress;i++){const x=726+(i%4)*72,y=170+((i/4)|0)*56;
   s+=R(x,y,54,34,{stroke:E.ink,sw:1.6},E)+L(x+8,y+17,x+46,y+17,E.mist,0.9,false,E);}
  for(let r=0;r<3;r++)for(let c=0;c<4;c++)s+=R(720+c*72,160+r*56,66,48,{stroke:E.mist,sw:0.9,glow:false},E);
  s+=L(330,300,694,300,E.ink,4,false,E)+L(330,214,694,214,E.ink,3,false,E);
  for(let i=0;i<8;i++){const x=330+i*45.5;s+=L(x,300,x+22,214,E.ink,1.8,false,E)+L(x+22,214,x+45,300,E.ink,1.8,false,E)+C(x,300,4,{fill:E.ink},E)+C(x+22,214,4,{fill:E.ink},E);}
  s+=L(330,318,694,318,E.ink,2,false,E);
  for(let i=0;i<9;i++)s+=C(346+i*42,330,10,{stroke:E.ink,sw:1.4},E);
  s+=R(466,278,56,34,{stroke:E.cyan,sw:2.4},E);
  s+=R(300,330,40,120,{stroke:E.ink,sw:2.5,fill:HATCH},E)+R(684,330,40,120,{stroke:E.ink,sw:2.5,fill:HATCH},E);
  return s;},

H32:(p,E)=>{ reseed(29); let s=P("M0 480 L1024 120",{stroke:E.ink,sw:2.5},E)+P("M0 570 L1024 210",{stroke:E.ink,sw:2.5},E);
  for(let i=0;i<34;i++){const t=i/34,x=30+t*960,y=508-t*352;
   s+=C(x,y,5,{stroke:E.ink,sw:1.2},E)+C(x+16,y+64,3.5,{fill:E.ink},E);}
  for(let i=0;i<17;i++){const t=i/17,x=40+t*950,y=530-t*350;s+=L(x,y,x+8,y+34,E.mist,0.9,false,E);}
  s+=C(60,520,94,{stroke:E.ink,sw:3.5,fill:HATCH},E)+C(60,520,60,{stroke:E.ink,sw:1.6},E)+C(60,520,26,{stroke:E.ink,sw:2},E)+C(60,520,8,{fill:E.ink},E);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;s+=L(60+Math.cos(a)*26,520+Math.sin(a)*26,60+Math.cos(a)*90,520+Math.sin(a)*90,E.ink,1.6,false,E);}
  s+=bolts(60,520,104,10,E.ink,E,5);
  for(let i=0;i<p.checkpoints;i++){const t=(i+1)/(p.checkpoints+1),x=100+t*820,y=470-t*330;
   s+=G(R(-44,-44,88,88,{stroke:E.ink,sw:2.5,fill:HATCH},E)+R(-26,-26,52,52,{stroke:E.ink,sw:1.4},E)+bolts(0,0,34,4,E.ink,E,4),`translate(${x},${y}) rotate(-19)`);
   s+=L(x,y-46,x,y-90,E.ink,2,false,E)+R(x-20,y-118,40,28,{stroke:E.ink,sw:2},E);}
  if(p.torn){const x=640,y=250;s+=P(`M${x} ${y+80} l16 -18 l-18 -16 l18 -18 l-16 -18`,{stroke:E.pink,sw:3},E);}
  return s;},

H33:(p,E)=>{ reseed(30); let s=POLY([[290,110],[734,110],[604,300],[420,300]],{stroke:E.ink,sw:3.5,fill:HATCH},E);
  s+=rivets(300,124,724,124,14,E.ink,E,3)+P("M310 130 L714 130",{stroke:E.ink,sw:1},E);
  s+=R(470,300,84,44,{stroke:E.ink,sw:2.5,fill:HATCH},E);
  s+=C(512,386,20,{stroke:E.ink,sw:3},E)+C(512,386,7,{fill:E.ink},E)+L(512,386,604,478,E.ink,6,false,E)+C(604,478,10,{fill:E.ink},E);
  s+=P("M416 478 A 136 136 0 0 1 608 478",{stroke:E.ink,sw:1.2,dash:"7 6"},E);
  s+=R(556,424,44,30,{stroke:E.ink,sw:2},E);
  const fills=[2,5,9,4,7];
  for(let i=0;i<p.chutes;i++){const x=170+i*(684/(p.chutes-1)),pri=(i===0);
   s+=POLY([[452,530],[572,530],[x+76,660],[x-76,660]],{stroke:pri?E.pink:E.ink,sw:2.2},E);
   s+=R(x-94,662,188,244,{stroke:E.ink,sw:3,fill:i===0?"none":"none"},E)+ribs(x-94,662,188,244,4,E.ink,E);
   s+=rivets(x-80,676,x+80,676,6,E.ink,E,2.4);
   for(let k=0;k<(p.fill?fills[i]:0);k++)s+=R(x-72+((k%3)*50),864-(((k/3)|0)*46),42,38,{stroke:E.ink,sw:1.5,fill:HATCH},E);}
  s+=gaugeFace(140,260,44,0.66,E.ink,E);
  return s;},

H27:(p,E)=>{ reseed(31); let s=L(50,432,974,432,E.ink,3.5,false,E)+L(50,470,974,470,E.ink,2,false,E);
  for(let i=0;i<14;i++)s+=C(80+i*66,452,22,{stroke:E.ink,sw:1.6},E)+C(80+i*66,452,7,{fill:E.ink},E);
  s+=gear(946,452,36,14,E.ink,E,{});
  for(let i=0;i<p.stations;i++){const x=140+i*(760/(p.stations-1)),fin=(i===p.stations-1);const c=fin?E.cyan:E.ink;
   s+=R(x-52,372,104,52,{stroke:c,sw:2.5,fill:HATCH},E)+rivets(x-42,414,x+42,414,5,E.ink,E,2.4);
   if(i>0)s+=R(x-36,340,72,32,{stroke:c,sw:2},E)+seams(x-36,340,72,32,2,E.ink,E);
   if(i>1)s+=R(x-46,306,92,34,{stroke:c,sw:2},E)+C(x,323,9,{stroke:c,sw:1.4},E);
   if(fin)s+=bolts(x,350,34,6,c,E,4);
   s+=L(x,110,x,200,E.ink,4,false,E)+L(x,200,x-44,268,E.ink,4,false,E)+C(x,110,14,{stroke:E.ink,sw:2},E)+C(x,200,9,{stroke:E.ink,sw:2},E);
   s+=R(x-16,80,32,30,{stroke:E.ink,sw:2,fill:HATCH},E);
   s+=wires([[x,268],[x-20,300],[x-52,340]],E.ink,E,2);}
  s+=R(30,470,964,40,{stroke:E.ink,sw:2.5,fill:HATCH},E)+rivets(50,490,974,490,24,E.ink,E,2.6);
  return s;},

H54:(p,E)=>{ reseed(32); let s=L(430,90,430,950,E.ink,4,false,E)+L(570,90,570,950,E.ink,4,false,E);
  for(let i=0;i<15;i++){const y=90+i*58;s+=L(430,y,570,y+58,E.ink,1.5,false,E)+L(570,y,430,y+58,E.ink,1.5,false,E)+L(430,y,570,y,E.ink,1.2,false,E);
   s+=C(430,y,4,{fill:E.ink},E)+C(570,y,4,{fill:E.ink},E);}
  for(let i=0;i<p.arms;i++){const y=200+i*(600/(p.arms-1)),swung=i>=p.connected,c=swung?E.ink:E.pink;
   const arm=R(0,-18,250,36,{stroke:c,sw:3,fill:HATCH},E)+R(66,-44,64,26,{stroke:c,sw:2},E)+rivets(14,0,236,0,8,E.ink,E,2.6)
    +R(200,-30,30,60,{stroke:c,sw:2},E)+C(250,0,9,{stroke:c,sw:2},E);
   s+=G(arm,`translate(570,${y}) rotate(${swung?-52:0})`);
   s+=C(570,y,12,{fill:E.ink},E)+C(570,y,20,{stroke:E.ink,sw:1.4},E);}
  s+=R(370,950,260,56,{stroke:E.ink,sw:3.5,fill:HATCH},E)+rivets(390,978,610,978,8,E.ink,E,3);
  s+=wires([[430,300],[400,500],[400,900]],E.ink,E,3);
  s+=gaugeFace(200,200,48,0.35,E.ink,E);
  return s;},

H12:(p,E)=>{ reseed(33); let s="";const N=p.plates;
  for(let i=0;i<N;i++){const y=280+i*210,ghost=(p.ghostTop&&i===0);
   const top=[[240,y],[720,y-70],[820,y-20],[340,y+50]];
   s+=POLY(top,{stroke:E.ink,sw:ghost?1.5:2.8,dash:ghost?"8 6":null,fill:ghost?"none":E.ground,glow:false},E);
   if(!ghost){for(let k=0;k<5;k++)s+=L(280+k*100,y+((k*-14)),300+k*100,y+8+((k*-14)),E.mist,1,false,E);
    for(let k=0;k<6;k++)s+=C(300+k*88,y+6-k*11,4,{stroke:E.ink,sw:1,glow:false},E);}
   s+=POLY([[240,y],[340,y+50],[340,y+76],[240,y+26]],{stroke:E.ink,sw:2,fill:HATCH},E);
   s+=POLY([[340,y+50],[820,y-20],[820,y+6],[340,y+76]],{stroke:E.ink,sw:2,fill:HATCH},E);
   s+=rivets(360,y+62,800,y+2,10,E.ink,E,2.4);
   if(i===1)s+=P(`M240 ${y} L720 ${y-70}`,{stroke:E.cyan,sw:4},E);
   if(i<N-1){[[420,y+70],[700,y+22]].forEach(q=>{
     s+=P(`M${q[0]} ${q[1]+12} L${q[0]} ${q[1]+140}`,{stroke:E.ink,sw:1.6,dash:"7 6"},E);
     s+=arrow(q[0],q[1]+130,q[0],q[1]+150,E.ink,{...E,glow:false},1.6,11)+arrow(q[0],q[1]+30,q[0],q[1]+10,E.ink,{...E,glow:false},1.6,11);
     s+=R(q[0]-9,q[1]+70,18,18,{stroke:E.ink,sw:1.4,glow:false},E);});}}
  s+=L(150,240,150,940,E.ink,1.2,false,E)+arrow(150,300,150,240,E.ink,{...E,glow:false},1.2,10)+arrow(150,880,150,940,E.ink,{...E,glow:false},1.2,10);
  s+=L(240,180,820,110,E.ink,1.2,false,E)+arrow(300,172,240,180,E.ink,{...E,glow:false},1.2,10)+arrow(760,118,820,110,E.ink,{...E,glow:false},1.2,10);
  return s;},

H18:(p,E)=>{ reseed(34); let s="";const N=p.links,step=880/N;
  for(let i=0;i<N;i++){const x=70+i*step,w=step-40;
   s+=R(x,430,w,170,{stroke:E.ink,sw:3,fill:HATCH},E)+seams(x,430,w,170,3,E.ink,E);
   s+=rivets(x+10,444,x+w-10,444,6,E.ink,E,2.6)+rivets(x+10,586,x+w-10,586,6,E.ink,E,2.6);
   s+=gear(x+w/2,515,54,14,E.ink,E,{})+bolts(x+w/2,515,26,5,E.ink,E,3.5);
   s+=R(x+w/2-16,600,32,54,{stroke:E.ink,sw:2,fill:HATCH},E)+C(x+w/2,668,12,{stroke:E.ink,sw:1.8},E);
   if(i<N-1){const brk=(p.broken&&i===1);
    s+=L(x+w,515,x+step,515,brk?E.pink:E.ink,brk?2:8,false,E)+C(x+w,515,7,{fill:E.ink},E)+C(x+step,515,7,{fill:E.ink},E);
    if(brk)s+=L(x+step-32,490,x+step-8,540,E.pink,3,false,E);}}
  s+=L(80,515,34,430,E.ink,6,false,E)+C(34,430,16,{stroke:E.ink,sw:2.5},E)+knurl(20,414,28,32,E.ink,E);
  s+=L(60,690,964,690,E.ink,3,false,E)+rivets(80,704,944,704,20,E.ink,E,2.6);
  return s;}
};
for(const id in D2) HEROES[id].draw = D2[id];
