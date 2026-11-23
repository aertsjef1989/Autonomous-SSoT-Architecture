/* ============================================================
   SIGNAL SHADE  v3   the 10x detail engine
   ------------------------------------------------------------
   The kit draws structure. The detail layer added machining.
   THIS adds what actually separates a diagram from an illustration:

     1. TONAL SHADING with a light direction (upper left).
        Six hatch densities, layered, give 10+ tonal levels.
     2. MACHINING MARKS: concentric turning rings, rim ticks,
        bolt circles, seams, rivet rows, chamfers, weld beads.
     3. EDGE LIGHTING: highlight on the lit edge, shadow on the
        dark edge. This is what gives flat vector shapes volume.
     4. MICRO-GREEBLES: hex nuts, LEDs, connectors, cable clips,
        grub screws, scale plates.

   It works by PARSING the emitted SVG of any device and enriching
   every shape it finds. So it applies to all 56 devices without
   rewriting a single recipe, and it scales with a level knob:

     level 0  structure only          ~60 elements
     level 1  machined                ~190
     level 2  shaded                  ~700
     level 3  illustrated             ~1800   (10x the old default)
   ============================================================ */
const K = require('./signal-detail.js');
const { n, L, R, C, P, POLY, G } = K;

let SEED_S = 99;
const rndS = () => (SEED_S = (SEED_S * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const reseedS = s => { SEED_S = s || 99; };

let LIGHT = -2.36;                 // light from the upper left, in radians. Steerable.
const setLight = deg => { LIGHT = (deg == null ? -135 : deg) * Math.PI / 180; };

/* ---------- the six-step tonal ramp ---------- */
/* Six hatch patterns at increasing density. Layering two or three of
   them at different opacities is what produces a continuous-looking
   grey ramp out of pure line art. */
function shadeDefs(S){
  const c = S.hatch || "#DCE0E3";
  let d = "";
  [3,5,7,10,14,20].forEach((sp,i)=>{
    d += `<pattern id="tone${i}" width="${sp}" height="${sp}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="${sp}" stroke="${c}" stroke-width="${(1.4 - i*0.12).toFixed(2)}"/></pattern>`;
  });
  d += `<pattern id="toneX" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="6" stroke="${c}" stroke-width="1.2"/>
    <line x1="0" y1="0" x2="6" y2="0" stroke="${c}" stroke-width="1.2"/></pattern>`;
  d += `<radialGradient id="formLight" cx="32%" cy="30%" r="78%">
    <stop offset="0%" stop-color="${S.ground}" stop-opacity="0.55"/>
    <stop offset="55%" stop-color="${S.ground}" stop-opacity="0"/>
    <stop offset="100%" stop-color="${S.ink}" stop-opacity="0.16"/></radialGradient>`;
  return d;
}

/* ---------- shape parser: pull every drawable out of a device ---------- */
const attrs = tag => {
  const o = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) o[m[1]] = m[2];
  return o;
};
function shapes(body){
  const out = [];
  for (const m of body.matchAll(/<circle[^>]*>/g)) { const a = attrs(m[0]); out.push({t:"c", x:+a.cx, y:+a.cy, r:+a.r, stroke:a.stroke, fill:a.fill}); }
  for (const m of body.matchAll(/<rect[^>]*>/g))   { const a = attrs(m[0]); out.push({t:"r", x:+a.x, y:+a.y, w:+a.width, h:+a.height, stroke:a.stroke, fill:a.fill}); }
  for (const m of body.matchAll(/<polygon[^>]*>/g)){ const a = attrs(m[0]); const pts=(a.points||"").trim().split(/\s+/).map(p=>p.split(",").map(Number));
    if(pts.length>2) out.push({t:"p", pts, stroke:a.stroke, fill:a.fill}); }
  return out.filter(s => Number.isFinite(s.x ?? s.pts?.[0]?.[0]));
}
const bbox = s => s.t==="c" ? [s.x-s.r,s.y-s.r,s.r*2,s.r*2]
  : s.t==="r" ? [s.x,s.y,s.w,s.h]
  : [Math.min(...s.pts.map(p=>p[0])), Math.min(...s.pts.map(p=>p[1])),
     Math.max(...s.pts.map(p=>p[0]))-Math.min(...s.pts.map(p=>p[0])),
     Math.max(...s.pts.map(p=>p[1]))-Math.min(...s.pts.map(p=>p[1]))];
const area = s => { const b=bbox(s); return b[2]*b[3]; };

/* ============================================================
   ENRICHERS
   ============================================================ */

/* Turned metal: concentric machining rings, rim ticks, bolt circle,
   a terminator of radial hatch on the shadow side, and edge lighting. */
function enrichCircle(s, S, lvl){
  const E = {...S, glow:false};
  const { x:cx, y:cy, r } = s;
  if (r < 16) return "";
  let out = "";
  const ink = S.ink, faint = S.faint, hatch = S.hatch;

  // 1. form shading: radial gradient wash, then a hatched terminator
  if (lvl >= 2) {
    out += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#formLight)"/>`;
    const N = Math.round(r * (lvl >= 3 ? 0.9 : 0.45));
    for (let i = 0; i < N; i++) {
      const a = LIGHT + Math.PI + (i / N - 0.5) * 2.4;      // shadow side arc
      const t = 1 - Math.abs(i / N - 0.5) * 2;               // 0 at edges, 1 mid-shadow
      const len = r * (0.10 + 0.30 * t);
      out += L(cx + Math.cos(a) * (r - len), cy + Math.sin(a) * (r - len),
               cx + Math.cos(a) * r * 0.985, cy + Math.sin(a) * r * 0.985,
               hatch, 0.6 + t * 1.1, false, E);
    }
  }
  // 2. turning rings (machined face)
  const rings = lvl >= 3 ? 7 : lvl >= 2 ? 4 : 2;
  for (let i = 1; i <= rings; i++)
    out += C(cx, cy, r * (1 - i * (0.55 / rings)), { stroke: hatch, sw: 0.7, glow:false }, E);
  // 3. rim ticks
  if (r > 34) {
    const T = lvl >= 3 ? 72 : lvl >= 2 ? 40 : 24;
    for (let i = 0; i < T; i++) {
      const a = i * 2 * Math.PI / T, maj = i % 6 === 0;
      out += L(cx + Math.cos(a) * r, cy + Math.sin(a) * r,
               cx + Math.cos(a) * (r + (maj ? 9 : 5)), cy + Math.sin(a) * (r + (maj ? 9 : 5)),
               maj ? ink : faint, maj ? 1.4 : 0.7, false, E);
    }
  }
  // 4. bolt circle with slots
  if (r > 52 && lvl >= 1) {
    const B = lvl >= 3 ? 20 : 12;
    for (let i = 0; i < B; i++) {
      const a = i * 2 * Math.PI / B, bx = cx + Math.cos(a) * r * 0.84, by = cy + Math.sin(a) * r * 0.84;
      out += C(bx, by, r * 0.045, { stroke: ink, sw: 1, glow:false }, E);
      out += L(bx - r*0.03, by, bx + r*0.03, by, ink, 0.8, false, E);
      if (lvl >= 3) out += C(bx, by, r * 0.062, { stroke: faint, sw: 0.6, glow:false }, E);
    }
  }
  // 5. edge lighting
  const la = LIGHT, sa = LIGHT + Math.PI;
  const arc = (a0, a1, col, w) => {
    const p0 = [cx + Math.cos(a0)*r, cy + Math.sin(a0)*r], p1 = [cx + Math.cos(a1)*r, cy + Math.sin(a1)*r];
    return P(`M${n(p0[0])} ${n(p0[1])} A${n(r)} ${n(r)} 0 0 1 ${n(p1[0])} ${n(p1[1])}`, { stroke: col, sw: w, glow:false }, E);
  };
  out += arc(la - 0.9, la + 0.9, S.ground, 1.6);
  out += arc(sa - 1.0, sa + 1.0, ink, lvl >= 2 ? 2.6 : 1.6);
  // 6. micro greebles on the face
  if (lvl >= 3 && r > 60) {
    for (let i = 0; i < 6; i++) {
      const a = rndS() * 6.28, rr = r * (0.3 + rndS() * 0.35);
      out += hexNut(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 5 + rndS() * 3, ink, E);
    }
  }
  return out;
}

/* Plate metal: seams, rivet rows, chamfered corners, directional hatch,
   an edge-lit top and left, a shadowed bottom and right. */
function enrichRect(s, S, lvl){
  const E = {...S, glow:false};
  let { x, y, w, h } = s;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 22 || h < 18) return "";
  const ink = S.ink, faint = S.faint;
  let out = "";
  // 1. tonal wash biased away from the light
  if (lvl >= 2) {
    const tone = w*h > 40000 ? 1 : 2;
    out += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="url(#tone${tone})" opacity="${lvl>=3?0.55:0.35}"/>`;
    out += `<rect x="${n(x+w*0.55)}" y="${n(y+h*0.5)}" width="${n(w*0.45)}" height="${n(h*0.5)}" fill="url(#toneX)" opacity="${lvl>=3?0.45:0.25}"/>`;
  }
  // 2. seams
  const seams = lvl >= 3 ? Math.max(2, Math.round(h / 22)) : lvl >= 2 ? Math.max(1, Math.round(h / 44)) : 1;
  for (let i = 1; i < seams; i++)
    out += L(x + 3, y + (h / seams) * i, x + w - 3, y + (h / seams) * i, faint, 0.7, false, E);
  // 3. rivet rows
  if (lvl >= 1 && w > 40) {
    const N = Math.max(3, Math.round(w / (lvl >= 3 ? 18 : 34)));
    for (let i = 0; i < N; i++) {
      const px = x + (w / N) * (i + 0.5);
      out += C(px, y + 5, 1.8, { fill: ink, glow:false }, E);
      out += C(px, y + h - 5, 1.8, { fill: ink, glow:false }, E);
      if (lvl >= 3) { out += C(px, y + 5, 3, { stroke: faint, sw: 0.5, glow:false }, E); }
    }
  }
  // 4. chamfers
  const k = Math.min(9, w * 0.12, h * 0.12);
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([px,py,sx,sy]) => {
    out += L(px + sx*k, py, px, py + sy*k, faint, 0.8, false, E);
  });
  // 5. edge lighting
  out += L(x + 1.5, y + 1.5, x + w - 1.5, y + 1.5, S.ground, 1.4, false, E);
  out += L(x + 1.5, y + 1.5, x + 1.5, y + h - 1.5, S.ground, 1.4, false, E);
  out += L(x + 2, y + h - 2, x + w - 2, y + h - 2, ink, lvl >= 2 ? 2 : 1.2, false, E);
  out += L(x + w - 2, y + 2, x + w - 2, y + h - 2, ink, lvl >= 2 ? 2 : 1.2, false, E);
  // 6. micro greebles
  if (lvl >= 3 && w > 60 && h > 40) {
    out += hexNut(x + 10, y + h - 10, 4.5, ink, E);
    out += hexNut(x + w - 10, y + 10, 4.5, ink, E);
    if (w > 110) out += platePlate(x + w/2 - 22, y + h/2 - 8, 44, 16, S, E);
    if (h > 80) out += connector(x + w - 6, y + h/2, 12, S, E);
    for (let i = 0; i < 3; i++) out += C(x + 12 + i*9, y + h/2, 2.2, { stroke: faint, sw: 0.7, glow:false }, E);
  }
  return out;
}

/* Cast bodies: hatch the lower-right half, shade the lower edges. */
function enrichPoly(s, S, lvl){
  if (lvl < 2) return "";
  const E = {...S, glow:false};
  const pts = s.pts, [bx, by, bw, bh] = bbox(s);
  if (bw < 30 || bh < 24) return "";
  const id = "clip" + (SEED_S = (SEED_S * 16807) % 2147483647);
  let out = `<clipPath id="${id}"><polygon points="${pts.map(p=>`${n(p[0])},${n(p[1])}`).join(" ")}"/></clipPath>`;
  out += `<g clip-path="url(#${id})">`;
  out += `<rect x="${n(bx)}" y="${n(by)}" width="${n(bw)}" height="${n(bh)}" fill="url(#tone${lvl>=3?1:2})" opacity="${lvl>=3?0.5:0.3}"/>`;
  out += `<rect x="${n(bx+bw*0.5)}" y="${n(by+bh*0.45)}" width="${n(bw*0.5)}" height="${n(bh*0.55)}" fill="url(#toneX)" opacity="0.4"/>`;
  out += `</g>`;
  // shade the edges facing away from the light
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nrm = ang - Math.PI / 2;
    const lit = Math.cos(nrm - LIGHT) > 0;
    out += L(a[0], a[1], b[0], b[1], lit ? S.ground : S.ink, lit ? 1.2 : 2.2, false, E);
  }
  return out;
}

/* ---------- micro components ---------- */
function hexNut(x, y, r, c, E){
  const p = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  return POLY(p, { stroke: c, sw: 0.9, glow:false }, E) + C(x, y, r * 0.45, { stroke: c, sw: 0.7, glow:false }, E);
}
function platePlate(x, y, w, h, S, E){
  return R(x, y, w, h, { stroke: S.faint, sw: 0.8, glow:false }, E)
       + C(x + 4, y + h/2, 1.6, { fill: S.ink, glow:false }, E)
       + C(x + w - 4, y + h/2, 1.6, { fill: S.ink, glow:false }, E)
       + L(x + 9, y + h/2, x + w - 9, y + h/2, S.faint, 0.6, false, E);
}
function connector(x, y, s, S, E){
  let o = R(x, y - s/2, s * 0.7, s, { stroke: S.ink, sw: 1, glow:false }, E);
  for (let i = 0; i < 3; i++) o += L(x + s*0.7, y - s/3 + i*(s/3), x + s*1.1, y - s/3 + i*(s/3), S.ink, 0.8, false, E);
  return o;
}
/* scattered service detail around the device, so the frame is not empty */
function fieldDetail(box, S, lvl){
  if (lvl < 3) return "";
  const E = {...S, glow:false};
  let out = "";                       // no reseed here: it would throw away the caller's seed
  for (let i = 0; i < 26; i++) {
    const x = box.x + rndS() * box.w, y = box.y + rndS() * box.h, k = rndS();
    if (k < 0.3) out += hexNut(x, y, 3 + rndS()*2, S.faint, E);
    else if (k < 0.5) out += C(x, y, 2 + rndS()*2, { stroke: S.faint, sw: 0.7, glow:false }, E);
    else if (k < 0.7) out += L(x, y, x + 10 + rndS()*14, y, S.faint, 0.7, false, E) + C(x + 12, y, 1.6, { fill: S.faint, glow:false }, E);
    else out += R(x, y, 6 + rndS()*8, 4, { stroke: S.faint, sw: 0.6, glow:false }, E);
  }
  return out;
}

/* ============================================================
   ENRICH: parse a device body, return it with detail layered in
   ============================================================ */
function enrich(body, S, lvl = 2, opts = {}){
  if (lvl <= 0) return body;
  reseedS(opts.seed || 99);
  if (opts.light != null) setLight(opts.light);
  const all = shapes(body).sort((a, b) => area(b) - area(a));
  const cap = opts.cap || (lvl >= 3 ? 120 : lvl >= 2 ? 70 : 36);
  const list = all.slice(0, cap);
  let under = "", over = "";
  for (const s of list) {
    if (s.t === "c") under += enrichCircle(s, S, lvl);
    else if (s.t === "r") under += enrichRect(s, S, lvl);
    else over += enrichPoly(s, S, lvl);
  }
  let out = under + body + over;

  // SPARSE RESCUE: a device with few shapes still has to hold a slide.
  // Fill its field with service detail and hatch its interior volumes.
  const count = c => (c.match(/<(path|rect|circle|line|polygon)/g) || []).length;
  if (lvl >= 2 && all.length) {
    const xs = all.map(bbox);
    const bx = Math.min(...xs.map(b=>b[0])), by = Math.min(...xs.map(b=>b[1]));
    const bw = Math.max(...xs.map(b=>b[0]+b[2])) - bx, bh = Math.max(...xs.map(b=>b[1]+b[3])) - by;
    const box = { x:bx, y:by, w:bw, h:bh };
    let target = opts.density != null ? opts.density : (lvl >= 3 ? 900 : 420);
    let guard = 0;
    while (count(out) < target && guard++ < 12) {
      out += fieldDetail(box, S, 3);
      out += contours(box, S, lvl, guard);
    }
  }
  return out;
}

/* contour lines across the device field: section marks, datum lines,
   dimension witnesses. Cheap, and it reads as a drafted plate. */
function contours(box, S, lvl, pass){
  const E = {...S, glow:false};
  let o = "";
  const N = lvl >= 3 ? 16 : 8;
  for (let i = 0; i < N; i++) {
    const y = box.y + (box.h / N) * i + pass * 3;
    o += L(box.x - 14, y, box.x - 4, y, S.faint, i % 4 ? 0.7 : 1.4, false, E);
    o += L(box.x + box.w + 4, y, box.x + box.w + 14, y, S.faint, i % 4 ? 0.7 : 1.4, false, E);
  }
  for (let i = 0; i < N; i++) {
    const x = box.x + (box.w / N) * i + pass * 3;
    o += L(x, box.y - 14, x, box.y - 4, S.faint, i % 4 ? 0.7 : 1.4, false, E);
    o += L(x, box.y + box.h + 4, x, box.y + box.h + 14, S.faint, i % 4 ? 0.7 : 1.4, false, E);
  }
  return o;
}

module.exports = { enrich, shadeDefs, shapes, setLight, greebles:{ hexNut, platePlate, connector, fieldDetail } };
