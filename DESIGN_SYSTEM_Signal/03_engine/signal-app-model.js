/* ============================================================
   SIGNAL APP MODEL
   Everything the editor needs that is not DOM: the themes, the
   object model, the renderer, and the 40 templates.

   An object is theme-agnostic. It stores COLOUR ROLES, not hex.
   Switch the theme and every object on every slide re-skins,
   because nothing ever held a hex value in the first place.
   ============================================================ */

/* ---------- roles ---------- */
const ROLES = ["ground","panel","sidebar","grid","ink","mist","faint","hatch","accent1","accent2","hot","blue","tint1","tint2","text1","text2"];

/* ---------- the three themes ---------- */
const THEMES = {
  master: {   // THE ORIGINAL. Brand_Template_Master.pptx as a theme: glow canvas, no
    // drafting grid, no corner circuitry, the soft shadow. Now available to EVERY template.
    label:"Master", shadow:true, dark:true, glow:true, corner:"round", terminals:false,
    chrome:{ grid:0, corners:0, bgGlow:"plain" },
    gridSize:24, gridOpacity:1,
    ground:"#0B0C10", panel:"#15171F", sidebar:"#1E2230", grid:"#1A1D26",
    ink:"#FFFFFF", mist:"#B9C0CE", faint:"#7A828F", hatch:"#2A2E3A",
    accent1:"#F0245C", accent2:"#21E0DC", hot:"#FF7A3D",
    tint1:"#1E2230", tint2:"#1E2230", text1:"#FF5C86", text2:"#7BF0EE",
    chip:"circle", radius:8
  },
  console: {                       // the dark neon, on my drafting canvas
    label:"Console", shadow:true, dark:true, glow:true, corner:"round", terminals:false, gridSize:24, gridOpacity:1,
    ground:"#0B0C10", panel:"#15171F", sidebar:"#1E2230", grid:"#1A1D26",
    ink:"#FFFFFF", mist:"#B9C0CE", faint:"#7A828F", hatch:"#2A2E3A",
    accent1:"#F0245C", accent2:"#21E0DC", hot:"#FF7A3D",
    tint1:"#1E2230", tint2:"#1E2230", text1:"#FF5C86", text2:"#7BF0EE",
    chip:"circle", radius:8
  },
  circuit: {                       // measured: pure black, 45 degree chamfers, orthogonal routing,
    label:"Circuit", shadow:false, dark:true, glow:true,   // hollow terminals, 50px grid at 3 percent white.
    corner:"chamfer", terminals:true, gridSize:50, gridOpacity:0.03,
    ground:"#000000", panel:"#0A0A0A", sidebar:"#141414", grid:"#FFFFFF",
    ink:"#FFFFFF", mist:"#C9CDD2", faint:"#808080", hatch:"#2A2A2A",
    accent1:"#F0245C", accent2:"#21E0DC", hot:"#FF7A3D",
    tint1:"#141414", tint2:"#141414", text1:"#FF5C86", text2:"#7BF0EE",
    chip:"chamfer", radius:0
  },
  blueprint: {   // MEASURED: modal pixel values from the source deck, not guessed.
    label:"Blueprint", shadow:false, dark:false, glow:false,
    corner:"chamfer", terminals:true, doubleBorder:true, gridSize:25, gridOpacity:1,
    ground:"#F3F3EB", panel:"#FFFFFF", sidebar:"#C5CCD2", grid:"#E3E5DF",
    ink:"#273D55", mist:"#8A939E", faint:"#B6BDC5", hatch:"#DCE0E3",
    accent1:"#C0504A", accent2:"#1F8C62", hot:"#F2722B", blue:"#3B73B9",
    tint1:"#F7E9E7", tint2:"#E6F3ED", text1:"#A8423C", text2:"#166B4B",
    chip:"chamfer", radius:0
  },
  blueprint_soft: {  // the earlier reading: rounded corners, no double border. Kept, unchanged.
    label:"Blueprint (soft)", shadow:false, dark:false, glow:false, corner:"round", terminals:false, gridSize:24, gridOpacity:1,
    ground:"#F5F4EF", panel:"#FFFFFF", sidebar:"#C5CCD2", grid:"#E2E4E1",
    ink:"#203048", mist:"#8A939E", faint:"#B6BDC5", hatch:"#DCE0E3",
    accent1:"#C0504A", accent2:"#188860", hot:"#F07028",
    tint1:"#F7E9E7", tint2:"#E6F3ED", text1:"#A8423C", text2:"#166B4B",
    chip:"circle", radius:8
  },
  lightscreen: {                   // the original light edition, unchanged
    label:"Light Screen", shadow:true, dark:false, glow:false, corner:"round", terminals:false, gridSize:24, gridOpacity:1,
    ground:"#FFFFFF", panel:"#F5F6F8", sidebar:"#F5F6F8", grid:"#E1E4EA",
    ink:"#14161C", mist:"#5B6270", faint:"#9AA1AC", hatch:"#EDEFF3",
    accent1:"#F0245C", accent2:"#21E0DC", hot:"#C71048",
    tint1:"#FDE7EE", tint2:"#E4FAF9", text1:"#C71048", text2:"#0E8A86",
    chip:"circle", radius:8
  }
};

/* ---------- canvas ---------- */
const CW = 13.333, CH = 7.5;                  // inches. PowerPoint 16:9, exactly.
const PPI = 96;                               // one PPI, used for x and for y alike
const px = i => +(i * PPI).toFixed(2);
const SW = 1280, SH = 720;                    // 13.333 x 96 = 1280, 7.5 x 96 = 720. Aspect 1.7778 both ways.

const uid = () => "o" + Math.random().toString(36).slice(2, 9);
const esc = s => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const col = (role, T) => !role || role === "none" ? "none" : (role[0] === "#" ? role : (T[role] || role));
/* an image object stores "asset:ID", so the same file is embedded ONCE in the
   project and every placement of it points at that one copy. */
const resolveSrc = (src, assets) => !src ? null
  : (src.startsWith("asset:") ? ((assets || {})[src.slice(6)] || {}).src || null : src);

/* ============================================================
   OBJECT RENDERER
   type: text | rect | ellipse | line | card | chip | image | device
   ============================================================ */
/* a chamfered rectangle: 45 degree cuts, never rounded. The theme decides. */
function chamPath(X, Y, W, H, k){
  k = Math.min(k, W/2, H/2);
  return `M${X+k} ${Y} L${X+W-k} ${Y} L${X+W} ${Y+k} L${X+W} ${Y+H-k} L${X+W-k} ${Y+H} `
       + `L${X+k} ${Y+H} L${X} ${Y+H-k} L${X} ${Y+k} Z`;
}
/* orthogonal routing: horizontal then vertical, the way a trace runs */
function elbowPath(X, Y, W, H, mode){
  const x2 = X + W, y2 = Y + H;
  if (mode === "v") return `M${X} ${Y} L${X} ${y2} L${x2} ${y2}`;   // vertical first
  return `M${X} ${Y} L${x2} ${Y} L${x2} ${y2}`;                      // horizontal first
}
const term = (x, y, c) => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="${c}" stroke-width="2"/>`;

function drawObj(o0, T, opts = {}){
  const o = styled(o0, opts);
  const FF = fontOf(o, T, opts);
  // rotation and opacity are universal. Images and devices handle their own,
  // because they also carry zoom, pan and crop.
  if ((o.rot || (o.opacity != null && o.opacity !== 1)) && o.type !== "image" && o.type !== "device") {
    const inner = drawObj({ ...o, rot: 0, opacity: null }, T, opts);
    const cx = (px(o.x) + px(o.w) / 2).toFixed(1), cy = (px(o.y) + px(o.h) / 2).toFixed(1);
    const tr = o.rot ? ` transform="rotate(${o.rot} ${cx} ${cy})"` : "";
    const op = (o.opacity != null && o.opacity !== 1) ? ` opacity="${o.opacity}"` : "";
    return `<g${tr}${op}>${inner}</g>`;
  }
  const f = col(o.fill, T), s = col(o.stroke, T), sw = o.sw == null ? 1.6 : o.sw;
  const X = px(o.x), Y = px(o.y), W = px(o.w), H = px(o.h);
  const glow = o.glow && T.glow && o.stroke && o.stroke !== "none" && o.stroke !== "faint" && o.stroke !== "mist";
  const soft = o.shadow && T.shadow !== false && !glow;
  const fx = glow ? ` filter="url(#eglow)" color="${s}"`
           : soft ? ` filter="url(#esoft)"` : "";

  switch(o.type){
    case "rect": {
      const dsh = o.dash ? ` stroke-dasharray="${o.dash}"` : "";
      if (T.corner === "chamfer" && W > 12 && H > 12)
        return `<path d="${chamPath(X,Y,W,H,o.cham || 10)}" fill="${f}" stroke="${s}" stroke-width="${sw}"${dsh}${fx}/>`;
      return `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${o.r || 0}" fill="${f}" stroke="${s}" stroke-width="${sw}"${dsh}${fx}/>`;
    }

    case "ellipse": {
      const dsh = o.dash ? ` stroke-dasharray="${o.dash}"` : "";
      return `<ellipse cx="${X + W/2}" cy="${Y + H/2}" rx="${W/2}" ry="${H/2}" fill="${f}" stroke="${s}" stroke-width="${sw}"${dsh}${fx}/>`;
    }

    case "line": {
      const dash = o.dash ? ` stroke-dasharray="${o.dash}"` : "";
      const head = o.arrow ? `<polygon points="${X+W},${Y+H} ${X+W-9},${Y+H-5} ${X+W-9},${Y+H+5}" fill="${s}"/>` : "";
      // orthogonal routing when the theme demands it and the line is a diagonal
      const ortho = (o.elbow || (T.corner === "chamfer" && Math.abs(W) > 4 && Math.abs(H) > 4));
      const body = ortho
        ? `<path d="${elbowPath(X,Y,W,H,o.elbow === "v" ? "v" : "h")}" fill="none" stroke="${s}" stroke-width="${sw}"${dash}${fx}/>`
        : `<line x1="${X}" y1="${Y}" x2="${X+W}" y2="${Y+H}" stroke="${s}" stroke-width="${sw}"${dash}${fx}/>`;
      const ends = (o.term || T.terminals) && !o.arrow ? term(X, Y, s) + term(X+W, Y+H, s) : "";
      return body + head + ends;
    }

    case "card": {                                  // panel with corner brackets. Chamfered or rounded, per theme.
      let out = (T.corner === "chamfer")
        ? `<path d="${chamPath(X,Y,W,H,o.cham || 12)}" fill="${f}" stroke="${s}" stroke-width="${sw}"${fx}/>`
        : `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="6" fill="${f}" stroke="${s}" stroke-width="${sw}"${fx}/>`;
      if (o.brackets !== false) {
        const k = 16;
        [[X,Y,1,1],[X+W,Y,-1,1],[X,Y+H,1,-1],[X+W,Y+H,-1,-1]].forEach(([a,b,sx,sy]) =>
          out += `<path d="M${a+sx*k} ${b} L${a+sx*4} ${b} L${a} ${b+sy*4} L${a} ${b+sy*k}" fill="none" stroke="${s}" stroke-width="${sw + 0.6}"/>`);
      }
      if (T.doubleBorder && o.dbl !== false && W > 30 && H > 26) {
        const i = 5;
        out += (T.corner === "chamfer")
          ? `<path d="${chamPath(X+i,Y+i,W-2*i,H-2*i,(o.cham||12)-3)}" fill="none" stroke="${s}" stroke-width="1" opacity="0.75"/>`
          : `<rect x="${X+i}" y="${Y+i}" width="${W-2*i}" height="${H-2*i}" rx="4" fill="none" stroke="${s}" stroke-width="1" opacity="0.75"/>`;
      }
      if (o.band) out += `<rect x="${X}" y="${Y}" width="${W}" height="${px(0.42)}" rx="6" fill="${col(o.band, T)}"/>`;
      if (o.hatchTop) out += `<rect x="${X+2}" y="${Y+2}" width="${W-4}" height="${px(0.4)}" fill="url(#ehatch)"/>`;
      return out;
    }

    case "chip": {   // DESIGN.md: a full pill, white on pink, near-black on cyan.
      const c = col(o.fill || "accent1", T);
      const shape = o.shape || T.chip || "circle";
      const box = shape === "circle"
        ? `<circle cx="${X+W/2}" cy="${Y+H/2}" r="${Math.min(W,H)/2}" fill="${c}"${fx}/>`
        : shape === "chamfer"
          ? `<path d="${chamPath(X,Y,W,H,5)}" fill="${c}"${fx}/>`
          : `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${T.radius || 4}" fill="${c}"${fx}/>`;
      const numeral = (o.fill === "accent2" || o.fill === "text2") ? (T.dark ? T.ground : T.ink) : "#FFFFFF";
      return box
           + `<text x="${X + W/2}" y="${Y + H/2 + Math.min(W,H)*0.22}" fill="${numeral}" font-family="${FF}" font-size="${Math.min(W,H)*0.58}" font-weight="700" text-anchor="middle">${esc(o.text || "1")}</text>`;
    }

    case "image": {
      const src = resolveSrc(o.src, opts.assets);
      if (!src) return `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="${T.faint}" stroke-dasharray="4 4"/>`;
      const fit = o.fit === "cover" ? "xMidYMid slice" : o.fit === "stretch" ? "none" : "xMidYMid meet";
      const op = o.opacity == null ? 1 : o.opacity;

      /* COLOUR CONTROL
         Filters chain in order. Tint recolours the asset to a theme role, so a
         mono logo follows the theme like everything else does. */
      const fid = "f" + (o.id || "x").replace(/[^a-z0-9]/gi, "");
      const parts = [];
      if (o.grayscale) parts.push(`grayscale(${o.grayscale})`);
      if (o.saturate != null && o.saturate !== 1) parts.push(`saturate(${o.saturate})`);
      if (o.brightness != null && o.brightness !== 1) parts.push(`brightness(${o.brightness})`);
      if (o.contrast != null && o.contrast !== 1) parts.push(`contrast(${o.contrast})`);
      if (o.invert) parts.push(`invert(${o.invert})`);
      if (o.blur) parts.push(`blur(${o.blur}px)`);
      let defs = "";
      if (o.tint && o.tint !== "none") {                     // duotone the asset into a theme colour
        const c = col(o.tint, T);
        defs = `<filter id="${fid}" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
          <feFlood flood-color="${c}" result="tint"/>
          <feComposite in="tint" in2="SourceAlpha" operator="in" result="tinted"/>
          <feBlend in="tinted" in2="SourceGraphic" mode="${o.tintMode || "multiply"}"/>
          <feComposite operator="in" in2="SourceAlpha"/>
        </filter>`;
        parts.push(`url(#${fid})`);
      }
      // geometry: rotation, flips, rounded clipping
      const cx = X + W/2, cy = Y + H/2;
      const tr = [];
      if (o.rot) tr.push(`rotate(${o.rot} ${cx} ${cy})`);
      if (o.flipH) tr.push(`translate(${2*cx} 0) scale(-1 1)`);
      if (o.flipV) tr.push(`translate(0 ${2*cy}) scale(1 -1)`);
      let clip = "";
      if (o.r) { defs += `<clipPath id="c${fid}"><rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${o.r}"/></clipPath>`;
                 clip = ` clip-path="url(#c${fid})"`; }
      const filt = parts.length ? ` filter="${parts.join(" ")}"` : "";
      const trs = tr.length ? ` transform="${tr.join(" ")}"` : "";
      let out = (defs ? `<defs>${defs}</defs>` : "")
        + `<image x="${X}" y="${Y}" width="${W}" height="${H}" href="${src}" preserveAspectRatio="${fit}" opacity="${op}"${filt}${trs}${clip}/>`;
      if (o.frame && o.frame !== "none")
        out += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${o.r || 0}" fill="none" stroke="${col(o.frame, T)}" stroke-width="${o.frameW || 2}"${trs}/>`;
      // clear space guide: editor only, never exported
      if (o.clear && opts.guides) {
        const c = px(o.clear);
        out += `<rect x="${X-c}" y="${Y-c}" width="${W+2*c}" height="${H+2*c}" fill="none" stroke="${T.accent2}" stroke-width="1" stroke-dasharray="6 5" opacity="0.65"/>`;
      }
      return out;
    }

    case "device": {   // a Signal hero machine, with a full control surface
      const Hh = (typeof HEROES !== "undefined") && HEROES[o.hero];
      if (!Hh) return `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="${T.faint}" stroke-dasharray="4 4"/>`;
      const S = deviceSkin(T, o);
      const p = {}; for (const k in Hh.params) p[k] = (o.params && k in o.params) ? o.params[k] : Hh.params[k].d;
      let body = Hh.draw(p, S);

      if (typeof enrich === "function")
        body = enrich(body, S, o.detail == null ? 2 : o.detail,
          { seed: o.seed || 99, light: o.light, cap: o.cap, density: o.density });

      // line weight: scale every stroke in the emitted drawing
      if (o.lw && o.lw !== 1)
        body = body.replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${(parseFloat(w) * o.lw).toFixed(2)}"`);

      const [cw, ch] = Hh.canvas;
      const base = (o.fit === "fill") ? Math.max(W / cw, H / ch) : Math.min(W / cw, H / ch);
      const sc = base * (o.zoom || 1);
      const ox = X + (W - cw*sc)/2 + (o.panX || 0) * PPI;
      const oy = Y + (H - ch*sc)/2 + (o.panY || 0) * PPI;

      const cx = X + W/2, cy = Y + H/2;
      const tr = [];
      if (o.rot) tr.push(`rotate(${o.rot} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
      if (o.flipH) tr.push(`translate(${(2*cx).toFixed(1)} 0) scale(-1 1)`);
      if (o.flipV) tr.push(`translate(0 ${(2*cy).toFixed(1)}) scale(1 -1)`);
      tr.push(`translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${sc.toFixed(4)})`);

      let out = "";
      if (o.bg && o.bg !== "none") {
        out += (T.corner === "chamfer")
          ? `<path d="${chamPath(X,Y,W,H,o.cham || 12)}" fill="${col(o.bg,T)}"/>`
          : `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${o.r || 0}" fill="${col(o.bg,T)}"/>`;
      }
      let clip = "";
      if (o.crop) {
        const cid = "dc" + (o.id || "x").replace(/[^a-z0-9]/gi, "");
        out += `<defs><clipPath id="${cid}"><rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${o.r || 0}"/></clipPath></defs>`;
        clip = ` clip-path="url(#${cid})"`;
      }
      const op = o.opacity == null ? 1 : o.opacity;
      out += `<g transform="${tr.join(" ")}" opacity="${op}"${clip}>${body}</g>`;
      if (o.frame && o.frame !== "none")
        out += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${o.r || 0}" fill="none" stroke="${col(o.frame,T)}" stroke-width="${o.frameW || 2}"/>`;
      return out;
    }

    case "video": {
      const src = resolveSrc(o.src, opts.assets);
      const cx = X + W/2, cy = Y + H/2;
      const tr = [];
      if (o.rot) tr.push(`rotate(${o.rot} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
      if (o.flipH) tr.push(`translate(${(2*cx).toFixed(1)} 0) scale(-1 1)`);
      const trs = tr.length ? ` transform="${tr.join(" ")}"` : "";
      const op = o.opacity == null ? 1 : o.opacity;

      if (!src)
        return `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="${T.faint}" stroke-dasharray="4 4"/>`;

      // thumbnails and PPTX export get a still frame, not a player
      if (opts.still) {
        let s2 = `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${o.r||0}" fill="${T.panel}" stroke="${col(o.frame && o.frame !== "none" ? o.frame : "faint", T)}" stroke-width="${o.frameW || 1.4}"/>`;
        const r = Math.min(W, H) * 0.16;
        s2 += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col("accent1",T)}" stroke-width="2"/>`;
        s2 += `<polygon points="${cx - r*0.28},${cy - r*0.42} ${cx + r*0.48},${cy} ${cx - r*0.28},${cy + r*0.42}" fill="${col("accent1",T)}"/>`;
        return s2;
      }

      const attrs = [
        o.autoplay !== false ? "autoplay" : "",
        o.loop !== false ? "loop" : "",
        o.muted !== false ? "muted" : "",
        o.controls ? "controls" : "",
        "playsinline"
      ].filter(Boolean).join(" ");
      const fit = o.fit === "cover" ? "cover" : o.fit === "stretch" ? "fill" : "contain";
      let out = `<foreignObject x="${X}" y="${Y}" width="${W}" height="${H}"${trs} opacity="${op}">`
        + `<video xmlns="http://www.w3.org/1999/xhtml" src="${src}" ${attrs}`
        + ` style="width:100%;height:100%;object-fit:${fit};border-radius:${o.r || 0}px;pointer-events:none"></video></foreignObject>`;
      if (o.frame && o.frame !== "none")
        out += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${o.r || 0}" fill="none" stroke="${col(o.frame,T)}" stroke-width="${o.frameW || 2}"${trs}/>`;
      return out;
    }

    /* ============================================================
       TABLE
       Real rows and columns. Header, banding, per-column alignment and
       width, an accent column, and any cell can be marked as the value
       that matters. DESIGN.md: header near-black with white bold text,
       body banded, the number that counts in the deep accent.
       ============================================================ */
    case "table": {
      const rows = o.rows || [["Header","Header","Header"],["Cell","Cell","Cell"]];
      const nR = rows.length, nC = Math.max(...rows.map(r => r.length));
      const widths = (o.widths && o.widths.length === nC) ? o.widths : Array(nC).fill(1/nC);
      const wsum = widths.reduce((a,b) => a+b, 0);
      const hdr = o.header !== false;
      const rh = H / nR;
      const fs = (o.size || 13) * 1.34;
      const aligns = o.aligns || Array(nC).fill("left");
      const r = T.radius == null ? 8 : T.radius;
      let out = "";

      // body plate
      out += (T.corner === "chamfer")
        ? `<path d="${chamPath(X,Y,W,H,10)}" fill="${col(o.fill || "panel", T)}" stroke="${col(o.stroke || "grid", T)}" stroke-width="${o.sw == null ? 1.6 : o.sw}"/>`
        : `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${r}" fill="${col(o.fill || "panel", T)}" stroke="${col(o.stroke || "grid", T)}" stroke-width="${o.sw == null ? 1.6 : o.sw}"/>`;

      rows.forEach((row, ri) => {
        const ry = Y + ri*rh;
        if (ri === 0 && hdr) {
          out += `<rect x="${X}" y="${ry}" width="${W}" height="${rh}" fill="${col(o.headerFill || "ink", T)}"/>`;
        } else if (o.band !== false && ri % 2 === (hdr ? 0 : 1)) {
          out += `<rect x="${X}" y="${ry}" width="${W}" height="${rh}" fill="${col("hatch", T)}" opacity="0.45"/>`;
        }
        let cx2 = X;
        row.forEach((cell, ci) => {
          const cw = W * (widths[ci] / wsum);
          const isHdr = (ri === 0 && hdr);
          const key = o.keyCells && o.keyCells.some(k => k[0] === ri && k[1] === ci);
          const isAcc = (o.accentCol != null && ci === o.accentCol && !isHdr);
          const fill = isHdr ? col("ground", T)
                    : key   ? col("text1", T)
                    : isAcc ? col("text2", T)
                            : col(o.textFill || "ink", T);
          const bold = isHdr || key ? 700 : 400;
          const al = aligns[ci] || "left";
          const tx = al === "center" ? cx2 + cw/2 : al === "right" ? cx2 + cw - 12 : cx2 + 12;
          const anc = al === "center" ? "middle" : al === "right" ? "end" : "start";
          out += `<text x="${tx.toFixed(1)}" y="${(ry + rh/2 + fs*0.35).toFixed(1)}" fill="${fill}" font-family="${FF}" font-size="${fs.toFixed(1)}" font-weight="${bold}" text-anchor="${anc}">${esc(String(cell))}</text>`;
          if (ci < nC - 1 && o.vlines !== false)
            out += `<line x1="${(cx2+cw).toFixed(1)}" y1="${ry}" x2="${(cx2+cw).toFixed(1)}" y2="${ry+rh}" stroke="${col("grid",T)}" stroke-width="0.9" opacity="0.7"/>`;
          cx2 += cw;
        });
        if (ri > 0 && o.hlines !== false)
          out += `<line x1="${X}" y1="${ry}" x2="${X+W}" y2="${ry}" stroke="${col("grid",T)}" stroke-width="0.9"/>`;
      });
      return out;
    }

    /* ============================================================
       SEGMENTED CHART
       One object, five shapes: stacked bar, donut, bar rows, funnel,
       waffle. Each segment carries its own label, value and theme role.
       ============================================================ */
    case "chart": {
      const segs = o.segs || [{label:"A",v:40,role:"accent1"},{label:"B",v:35,role:"accent2"},{label:"C",v:25,role:"faint"}];
      const total = segs.reduce((a,s2) => a + (+s2.v || 0), 0) || 1;
      const gap = o.gap == null ? 3 : o.gap;
      const showV = o.showValues !== false, showL = o.showLabels !== false;
      const fs = (o.size || 12) * 1.34;
      const mode = o.mode || "stackbar";
      let out = "";

      if (mode === "stackbar") {
        let cx2 = X;
        segs.forEach(s2 => {
          const sw2 = (W - gap*(segs.length-1)) * ((+s2.v||0)/total);
          out += `<rect x="${cx2.toFixed(1)}" y="${Y}" width="${Math.max(0,sw2).toFixed(1)}" height="${H}" rx="${o.r||0}" fill="${col(s2.role||"accent1",T)}"/>`;
          if (showV && sw2 > 34)
            out += `<text x="${(cx2+sw2/2).toFixed(1)}" y="${(Y+H/2+fs*0.35).toFixed(1)}" fill="${T.dark?T.ground:"#FFFFFF"}" font-family="${FF}" font-size="${fs.toFixed(1)}" font-weight="700" text-anchor="middle">${Math.round((+s2.v||0)/total*100)}%</text>`;
          if (showL)
            out += `<text x="${(cx2+sw2/2).toFixed(1)}" y="${(Y+H+fs*1.35).toFixed(1)}" fill="${col("mist",T)}" font-family="${FF}" font-size="${(fs*0.92).toFixed(1)}" text-anchor="middle">${esc(s2.label||"")}</text>`;
          cx2 += sw2 + gap;
        });
        return out;
      }

      if (mode === "donut") {
        const cx2 = X + W/2, cy2 = Y + H/2, R = Math.min(W,H)/2, th = o.thick || R*0.38;
        let a0 = -Math.PI/2;
        segs.forEach(s2 => {
          const a1 = a0 + ((+s2.v||0)/total) * Math.PI*2 - (gap/100);
          const lg = (a1-a0) > Math.PI ? 1 : 0;
          const p = (rr,a) => `${(cx2+Math.cos(a)*rr).toFixed(1)} ${(cy2+Math.sin(a)*rr).toFixed(1)}`;
          out += `<path d="M${p(R,a0)} A${R} ${R} 0 ${lg} 1 ${p(R,a1)} L${p(R-th,a1)} A${(R-th)} ${(R-th)} 0 ${lg} 0 ${p(R-th,a0)} Z" fill="${col(s2.role||"accent1",T)}"/>`;
          if (showL) {
            const mid = (a0+a1)/2, lr = R + 16;
            out += `<text x="${(cx2+Math.cos(mid)*lr).toFixed(1)}" y="${(cy2+Math.sin(mid)*lr).toFixed(1)}" fill="${col("mist",T)}" font-family="${FF}" font-size="${(fs*0.92).toFixed(1)}" text-anchor="middle">${esc(s2.label||"")}</text>`;
          }
          a0 = a1 + (gap/100);
        });
        if (o.centre)
          out += `<text x="${cx2}" y="${(cy2+fs*0.5).toFixed(1)}" fill="${col("ink",T)}" font-family="${FF}" font-size="${(fs*1.9).toFixed(1)}" font-weight="700" text-anchor="middle">${esc(o.centre)}</text>`;
        return out;
      }

      if (mode === "bars") {                       // labelled progress rows
        const max = Math.max(...segs.map(s2 => +s2.v||0)) || 1;
        const rh = H / segs.length;
        segs.forEach((s2, i) => {
          const by = Y + i*rh + gap/2, bh = rh - gap;
          const lw = o.labelW || W*0.24;
          out += `<text x="${X}" y="${(by+bh/2+fs*0.35).toFixed(1)}" fill="${col("ink",T)}" font-family="${FF}" font-size="${fs.toFixed(1)}">${esc(s2.label||"")}</text>`;
          out += `<rect x="${(X+lw).toFixed(1)}" y="${by.toFixed(1)}" width="${(W-lw).toFixed(1)}" height="${bh.toFixed(1)}" rx="${o.r||4}" fill="${col("hatch",T)}" opacity="0.5"/>`;
          out += `<rect x="${(X+lw).toFixed(1)}" y="${by.toFixed(1)}" width="${((W-lw)*((+s2.v||0)/max)).toFixed(1)}" height="${bh.toFixed(1)}" rx="${o.r||4}" fill="${col(s2.role||"accent1",T)}"/>`;
          if (showV)
            out += `<text x="${(X+W-8).toFixed(1)}" y="${(by+bh/2+fs*0.35).toFixed(1)}" fill="${col("mist",T)}" font-family="${FF}" font-size="${(fs*0.92).toFixed(1)}" text-anchor="end">${esc(String(s2.v))}</text>`;
        });
        return out;
      }

      if (mode === "funnel") {
        const n = segs.length, sh = H / n;
        segs.forEach((s2, i) => {
          const t0 = 1 - (i / n) * (o.taper == null ? 0.55 : o.taper);
          const t1 = 1 - ((i+1) / n) * (o.taper == null ? 0.55 : o.taper);
          const y0 = Y + i*sh + gap/2, y1 = Y + (i+1)*sh - gap/2;
          const w0 = W*t0/2, w1 = W*t1/2, mx = X + W/2;
          out += `<polygon points="${(mx-w0).toFixed(1)},${y0.toFixed(1)} ${(mx+w0).toFixed(1)},${y0.toFixed(1)} ${(mx+w1).toFixed(1)},${y1.toFixed(1)} ${(mx-w1).toFixed(1)},${y1.toFixed(1)}" fill="${col(s2.role||"accent1",T)}"/>`;
          if (showL)
            out += `<text x="${mx}" y="${((y0+y1)/2+fs*0.35).toFixed(1)}" fill="${T.dark?T.ground:"#FFFFFF"}" font-family="${FF}" font-size="${fs.toFixed(1)}" font-weight="700" text-anchor="middle">${esc(s2.label||"")}${showV?"  "+s2.v:""}</text>`;
        });
        return out;
      }

      if (mode === "waffle") {                     // 10x10 grid, one cell per percent
        const cols = o.cols || 10, rowsN = o.rowsN || 10, cell = Math.min(W/cols, H/rowsN);
        let idx = 0;
        const cells = [];
        segs.forEach(s2 => { const n2 = Math.round(((+s2.v||0)/total) * cols*rowsN);
          for (let i=0;i<n2;i++) cells.push(s2.role||"accent1"); });
        for (let ri=0; ri<rowsN; ri++) for (let ci=0; ci<cols; ci++) {
          const role = cells[idx++] || "hatch";
          out += `<rect x="${(X+ci*cell+1).toFixed(1)}" y="${(Y+ri*cell+1).toFixed(1)}" width="${(cell-2).toFixed(1)}" height="${(cell-2).toFixed(1)}" rx="2" fill="${col(role,T)}" opacity="${role==="hatch"?0.4:1}"/>`;
        }
        return out;
      }
      return out;
    }

    case "motif": return motif(o, T);

    /* the two-dot signature mark */
    case "mark": {
      const r = Math.min(W, H) / 2;
      return `<circle cx="${X+r}" cy="${Y+H/2}" r="${r}" fill="${col("accent1",T)}" color="${col("accent1",T)}"${T.glow?' filter="url(#eglow)"':''}/>`
           + `<circle cx="${X+r*3.2}" cy="${Y+H/2}" r="${r}" fill="${col("accent2",T)}" color="${col("accent2",T)}"${T.glow?' filter="url(#eglow)"':''}/>`;
    }

    /* callouts: key point, tip, context. DESIGN.md, one per section. */
    case "callout": {
      const kind = o.kind || "key";
      const acc = kind === "key" ? col("accent1",T) : kind === "tip" ? col("accent2",T) : col("faint",T);
      const tint = kind === "key" ? col("tint1",T) : kind === "tip" ? col("tint2",T) : col("panel",T);
      const lbl = kind === "key" ? col("text1",T) : kind === "tip" ? col("text2",T) : col("mist",T);
      const r = T.radius == null ? 8 : T.radius;
      let out = (T.corner === "chamfer")
        ? `<path d="${chamPath(X,Y,W,H,10)}" fill="${tint}" stroke="${acc}" stroke-width="1.6"/>`
        : `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${r}" fill="${tint}" stroke="${acc}" stroke-width="1.6"/>`;
      if (T.dark) out += `<rect x="${X}" y="${Y}" width="4" height="${H}" fill="${acc}"/>`;   // dark: left marker
      out += `<text x="${X+16}" y="${Y+22}" fill="${lbl}" font-family="${FF}" font-size="12" font-weight="700" letter-spacing="2">${esc((o.label || kind).toUpperCase())}</text>`;
      const size = (o.size || 14) * 1.34, cpl = Math.max(6, Math.floor((W-32) / (size*0.5)));
      const words = String(o.text || "").split(/\s+/); const lines = []; let cur = "";
      words.forEach(w => { if((cur+" "+w).trim().length > cpl){ lines.push(cur.trim()); cur = w; } else cur += " " + w; });
      if(cur.trim()) lines.push(cur.trim());
      lines.forEach((l, i) => out += `<text x="${X+16}" y="${Y+46+i*size*1.3}" fill="${col("ink",T)}" font-family="${FF}" font-size="${size}">${esc(l)}</text>`);
      return out;
    }

    /* status tag: a pill. On track cyan, at risk pink, done neutral. */
    case "tag": {
      const st = o.status || "ontrack";
      const bg = st === "ontrack" ? col("tint2",T) : st === "risk" ? col("tint1",T) : col("panel",T);
      const fg = st === "ontrack" ? col("text2",T) : st === "risk" ? col("text1",T) : col("mist",T);
      const r = H/2;
      return `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${r}" fill="${bg}" stroke="${fg}" stroke-width="1"/>`
           + `<text x="${X+W/2}" y="${Y+H/2+4}" fill="${fg}" font-family="${FF}" font-size="${H*0.46}" font-weight="700" text-anchor="middle" letter-spacing="1">${esc((o.text || st).toUpperCase())}</text>`;
    }

    /* button: primary is a pink fill, secondary is a hairline outline */
    case "button": {
      const pri = o.variant !== "secondary";
      const r = T.radius == null ? 8 : T.radius;
      const bg = pri ? col("accent1",T) : "none";
      const st = pri ? "none" : col(T.dark ? "faint" : "grid", T);
      const fg = pri ? "#FFFFFF" : (T.dark ? col("ink",T) : col("text1",T));
      const box = (T.corner === "chamfer")
        ? `<path d="${chamPath(X,Y,W,H,8)}" fill="${bg}" stroke="${st}" stroke-width="1.4"/>`
        : `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${r}" fill="${bg}" stroke="${st}" stroke-width="1.4"/>`;
      return box + `<text x="${X+W/2}" y="${Y+H/2+5}" fill="${fg}" font-family="${FF}" font-size="${o.size || 15}" font-weight="700" text-anchor="middle">${esc(o.text || "Button")}</text>`;
    }

    case "text": {
      const c = col(o.fill || "ink", T);
      const tfx = (o.shadow && T.shadow !== false) ? ` filter="url(#esoft)"` : "";
      const size = (o.size || 15) * 1.34;                     // pt -> px
      const lh = size * (o.lh || 1.28);
      const words = String(o.text || "").split("\n");
      const lines = [];
      const cpl = Math.max(4, Math.floor(W / (size * 0.5)));
      words.forEach(par => {
        let cur = "";
        par.split(/\s+/).forEach(w => {
          if ((cur + " " + w).trim().length > cpl) { lines.push(cur.trim()); cur = w; }
          else cur += " " + w;
        });
        lines.push(cur.trim());
      });
      const anchor = o.align === "center" ? "middle" : o.align === "right" ? "end" : "start";
      const tx = o.align === "center" ? X + W/2 : o.align === "right" ? X + W : X;
      const total = lines.length * lh;
      let ty = Y + size * 0.86;
      if (o.valign === "middle") ty = Y + H/2 - total/2 + size * 0.86;
      if (o.valign === "bottom")  ty = Y + H - total + size * 0.86;
      return lines.map((l, i) =>
        `<text x="${tx}" y="${(ty + i*lh).toFixed(1)}" fill="${c}" font-family="${FF}" font-size="${size.toFixed(1)}" font-weight="${o.bold ? 700 : 400}"`
        + `${o.italic ? ` font-style="italic"` : ""}${o.underline ? ` text-decoration="underline"` : ""}`
        + ` text-anchor="${anchor}" letter-spacing="${o.track || 0}">${esc(o.upper ? l.toUpperCase() : l)}</text>`
      ).join("");
    }
  }
  return "";
}

/* A device draws with kit tokens, so map the theme roles onto them.
   Any channel can be overridden per object, by role name or raw hex. */
function deviceSkin(T, o){
  o = o || {};
  const c = o.colors || {};
  const pick = (k, fallback) => (c[k] && c[k] !== "none") ? col(c[k], T) : fallback;
  const line = (o.tint && o.tint !== "none") ? col(o.tint, T) : T.ink;
  return {
    ground: pick("ground", T.ground), panel: pick("panel", T.panel),
    sidebar: T.sidebar, grid: T.grid,
    ink:  pick("line", line), white: pick("line", line),
    mist: pick("mist", T.mist), faint: pick("faint", T.faint), hatch: pick("hatch", T.hatch),
    cyan: pick("accent2", T.accent2), pink: pick("accent1", T.accent1), hot: pick("hot", T.hot),
    glow: (o.glow === false) ? false : (o.glow === true ? true : !!T.glow)
  };
}

/* ============================================================
   CIRCUIT MOTIFS
   Straight from the measured spec: hexagonal pathways with internal
   traces, split rings, concentric hex wireframes, isometric locked
   platforms, dashboard gauges, fader tracks. Available as objects,
   so they can be dropped anywhere and edited like anything else.
   ============================================================ */
function motif(o, T){
  const X = px(o.x), Y = px(o.y), W = px(o.w), H = px(o.h);
  const a1 = col(o.stroke || "accent1", T), a2 = col(o.fill || "accent2", T);
  const ink = T.ink, faint = T.faint;
  const g = T.glow ? ` filter="url(#eglow)"` : "";
  let s = "";
  switch(o.motif){

    case "hexpath": {                    // horizontal hexagonal pathway with internal traces
      const k = H * 0.28;
      s += `<path d="M${X+k} ${Y} L${X+W-k} ${Y} L${X+W} ${Y+H/2} L${X+W-k} ${Y+H} L${X+k} ${Y+H} L${X} ${Y+H/2} Z"
            fill="none" stroke="${a1}" stroke-width="${o.sw||8}" color="${a1}"${g}/>`;
      for(let i=1;i<=(o.traces||7);i++){
        const y = Y + (H/((o.traces||7)+1))*i;
        s += `<line x1="${X+k+6}" y1="${y}" x2="${X+W-k-6}" y2="${y}" stroke="${ink}" stroke-width="1" opacity="0.55"/>`;
      }
      return s;
    }

    case "splitring": {                  // 180 cyan arc, 180 magenta arc, 4px gap, solid inner ring
      const cx = X+W/2, cy = Y+H/2, r = Math.min(W,H)/2;
      s += `<path d="M${cx} ${cy-r} A${r} ${r} 0 0 0 ${cx} ${cy+r}" fill="none" stroke="${a2}" stroke-width="${o.sw||6}" color="${a2}"${g}/>`;
      s += `<path d="M${cx} ${cy-r} A${r} ${r} 0 0 1 ${cx} ${cy+r}" fill="none" stroke="${a1}" stroke-width="${o.sw||6}" color="${a1}"${g}/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="${r*0.62}" fill="none" stroke="${ink}" stroke-width="2"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="${r*0.28}" fill="${ink}" opacity="0.85"/>`;
      return s;
    }

    case "hexnest": {                    // concentric hex wireframes with a padlock and chevrons
      const cx = X+W/2, cy = Y+H/2, R = Math.min(W,H)/2;
      for(let i=0;i<3;i++){
        const r = R*(1 - i*0.22), p=[];
        for(let k2=0;k2<6;k2++){ const an = k2*Math.PI/3 - Math.PI/2; p.push(`${(cx+Math.cos(an)*r).toFixed(1)},${(cy+Math.sin(an)*r).toFixed(1)}`); }
        s += `<polygon points="${p.join(" ")}" fill="none" stroke="${ink}" stroke-width="1"/>`;
      }
      s += `<rect x="${cx-9}" y="${cy-4}" width="18" height="15" fill="none" stroke="${ink}" stroke-width="2"/>`;
      s += `<path d="M${cx-5} ${cy-4} v-5 a5 5 0 0 1 10 0 v5" fill="none" stroke="${ink}" stroke-width="2"/>`;
      s += `<polygon points="${cx-6},${cy-R-8} ${cx+6},${cy-R-8} ${cx},${cy-R-18}" fill="${a2}" color="${a2}"${g}/>`;
      s += `<polygon points="${cx-6},${cy+R+8} ${cx+6},${cy+R+8} ${cx},${cy+R+18}" fill="${a1}" color="${a1}"${g}/>`;
      return s;
    }

    case "isoplatform": {                // isometric platform with a lock: cyan open, magenta sealed
      const w = W, h = H, cx = X + w/2, cy = Y + h/2, d = w*0.42, e = h*0.22;
      const top = `${cx},${cy-e} ${cx+d},${cy} ${cx},${cy+e} ${cx-d},${cy}`;
      s += `<polygon points="${top}" fill="${T.panel}" stroke="${ink}" stroke-width="1.6"/>`;
      s += `<path d="M${cx-d} ${cy} L${cx-d} ${cy+h*0.2} L${cx} ${cy+e+h*0.2} L${cx+d} ${cy+h*0.2} L${cx+d} ${cy}"
            fill="none" stroke="${a1}" stroke-width="2.4" color="${a1}"${g}/>`;
      s += `<rect x="${cx-8}" y="${cy-8}" width="16" height="13" fill="none" stroke="${ink}" stroke-width="2"/>`;
      if(!o.open) s += `<path d="M${cx-4.5} ${cy-8} v-4 a4.5 4.5 0 0 1 9 0 v4" fill="none" stroke="${ink}" stroke-width="2"/>`;
      else s += `<path d="M${cx-4.5} ${cy-8} v-4 a4.5 4.5 0 0 1 9 0" fill="none" stroke="${ink}" stroke-width="2"/>`;
      return s;
    }

    case "gauge": {                      // circular dashboard gauge with tick marks and a needle
      const cx = X+W/2, cy = Y+H/2, r = Math.min(W,H)/2;
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${a1}" stroke-width="2.4" color="${a1}"${g}/>`;
      for(let i=0;i<36;i++){
        const an = i*Math.PI/18, maj = i%3===0;
        s += `<line x1="${(cx+Math.cos(an)*r*0.86).toFixed(1)}" y1="${(cy+Math.sin(an)*r*0.86).toFixed(1)}"
              x2="${(cx+Math.cos(an)*r*0.96).toFixed(1)}" y2="${(cy+Math.sin(an)*r*0.96).toFixed(1)}"
              stroke="${maj?ink:faint}" stroke-width="${maj?1.6:0.8}"/>`;
      }
      const pct = o.pct == null ? 0.8 : o.pct;
      const an = Math.PI*0.75 + pct*Math.PI*1.5;
      s += `<line x1="${cx}" y1="${cy}" x2="${(cx+Math.cos(an)*r*0.72).toFixed(1)}" y2="${(cy+Math.sin(an)*r*0.72).toFixed(1)}" stroke="${ink}" stroke-width="3"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="4" fill="${ink}"/>`;
      s += `<rect x="${cx-24}" y="${cy+r*0.46}" width="48" height="16" fill="none" stroke="${faint}" stroke-width="1"/>`;
      return s;
    }

    case "vault": {                      // slide 7: mechanical vault. Concentric rings, 5 lit nodes,
      const cx = X+W/2, cy = Y+H/2, R = Math.min(W,H)/2;   // 5 heavy arrows running clockwise, hex core.
      [1, 0.86, 0.72].forEach((k, i) =>
        s += `<circle cx="${cx}" cy="${cy}" r="${(R*k).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="${i?1.4:2.6}"/>`);
      for(let i=0;i<5;i++){
        const an = -Math.PI/2 + i*2*Math.PI/5;
        const nx = cx+Math.cos(an)*R*0.93, ny = cy+Math.sin(an)*R*0.93;
        s += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="13" fill="none" stroke="${ink}" stroke-width="2.2"/>`;
        s += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="6" fill="${a2}" color="${a2}"${g}/>`;
        const a0 = an + 0.30, a1a = an + 0.86, rr = R*0.79;
        const p0 = [cx+Math.cos(a0)*rr, cy+Math.sin(a0)*rr], p1 = [cx+Math.cos(a1a)*rr, cy+Math.sin(a1a)*rr];
        s += `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" fill="none" stroke="${ink}" stroke-width="6"/>`;
        const hd = a1a + 0.09;
        s += `<polygon points="${(cx+Math.cos(hd)*rr).toFixed(1)},${(cy+Math.sin(hd)*rr).toFixed(1)} ${(cx+Math.cos(a1a)*(rr-9)).toFixed(1)},${(cy+Math.sin(a1a)*(rr-9)).toFixed(1)} ${(cx+Math.cos(a1a)*(rr+9)).toFixed(1)},${(cy+Math.sin(a1a)*(rr+9)).toFixed(1)}" fill="${ink}"/>`;
      }
      const hp=[]; for(let i=0;i<6;i++){ const an=i*Math.PI/3-Math.PI/2; hp.push(`${(cx+Math.cos(an)*R*0.42).toFixed(1)},${(cy+Math.sin(an)*R*0.42).toFixed(1)}`); }
      s += `<polygon points="${hp.join(" ")}" fill="none" stroke="${ink}" stroke-width="2"/>`;
      return s;
    }

    case "hexstack": {                   // slide 4: three isometric hex planes, dashed connectors
      const cx = X+W/2, layers = o.layers || 3;
      for(let i=0;i<layers;i++){
        const cy = Y + H*0.2 + (H*0.62/(layers-1))*i, rw = W*0.36, rh = H*0.11;
        const c = [a1, a2, ink][i % 3];
        const p = [[cx-rw,cy],[cx-rw*0.5,cy-rh],[cx+rw*0.5,cy-rh],[cx+rw,cy],[cx+rw*0.5,cy+rh],[cx-rw*0.5,cy+rh]];
        s += `<polygon points="${p.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" ")}" fill="${T.panel}" fill-opacity="0.35" stroke="${c}" stroke-width="2" color="${c}"${g}/>`;
        if(i<layers-1) s += `<line x1="${cx}" y1="${(cy+rh+3).toFixed(1)}" x2="${cx}" y2="${(cy+H*0.62/(layers-1)-rh-6).toFixed(1)}" stroke="${faint}" stroke-width="1.4" stroke-dasharray="5 4"/>`;
      }
      return s;
    }

    case "gearcross": {                  // slide 5: four nodes in a diamond around a central gear
      const cx = X+W/2, cy = Y+H/2, R = Math.min(W,H)*0.36, nr = Math.min(W,H)*0.15;
      for(let i=0;i<4;i++){
        const an = -Math.PI/2 + i*Math.PI/2, nx = cx+Math.cos(an)*R, ny = cy+Math.sin(an)*R;
        s += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${nr.toFixed(1)}" fill="${T.panel}" stroke="${ink}" stroke-width="2"/>`;
        s += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${(nr*0.78).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1"/>`;
        s += `<path d="M${(nx-nr*0.78).toFixed(1)} ${ny.toFixed(1)} A${(nr*0.78).toFixed(1)} ${(nr*0.78).toFixed(1)} 0 0 1 ${nx.toFixed(1)} ${(ny-nr*0.78).toFixed(1)}" fill="none" stroke="${a2}" stroke-width="3" color="${a2}"${g}/>`;
        const an2 = an + Math.PI/4;
        s += `<path d="M${(cx+Math.cos(an2)*R*0.8).toFixed(1)} ${(cy+Math.sin(an2)*R*0.8).toFixed(1)} l6 -6 l0 12 Z" fill="${ink}"/>`;
      }
      const gr = Math.min(W,H)*0.12;
      s += `<circle cx="${cx}" cy="${cy}" r="${gr.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="2"/>`;
      for(let i=0;i<10;i++){ const an=i*Math.PI/5;
        s += `<line x1="${(cx+Math.cos(an)*gr).toFixed(1)}" y1="${(cy+Math.sin(an)*gr).toFixed(1)}" x2="${(cx+Math.cos(an)*gr*1.35).toFixed(1)}" y2="${(cy+Math.sin(an)*gr*1.35).toFixed(1)}" stroke="${ink}" stroke-width="2.6"/>`; }
      s += `<circle cx="${cx}" cy="${cy}" r="${(gr*0.35).toFixed(1)}" fill="${ink}"/>`;
      return s;
    }

    case "shield": {                     // slide 10: three concentric shields, hex core, radiating traces
      const cx = X+W/2, top = Y, bot = Y+H, w = W*0.5;
      [1, 0.74, 0.46].forEach((k, i) => {
        const c = [ink, o.blue ? col("blue",T) : ink, ink][i];
        s += `<path d="M${cx} ${(top + H*(1-k)*0.5).toFixed(1)} L${(cx+w*k).toFixed(1)} ${(top + H*0.22*k + H*(1-k)*0.5).toFixed(1)} `
           + `L${(cx+w*k).toFixed(1)} ${(top + H*0.55*k + H*(1-k)*0.5).toFixed(1)} L${cx} ${(bot - H*(1-k)*0.5).toFixed(1)} `
           + `L${(cx-w*k).toFixed(1)} ${(top + H*0.55*k + H*(1-k)*0.5).toFixed(1)} L${(cx-w*k).toFixed(1)} ${(top + H*0.22*k + H*(1-k)*0.5).toFixed(1)} Z"`
           + ` fill="none" stroke="${c}" stroke-width="${[3.4,2.2,1.6][i]}"/>`;
      });
      const hp=[]; for(let i=0;i<6;i++){ const an=i*Math.PI/3-Math.PI/2; hp.push(`${(cx+Math.cos(an)*W*0.12).toFixed(1)},${(Y+H*0.44+Math.sin(an)*W*0.12).toFixed(1)}`); }
      s += `<polygon points="${hp.join(" ")}" fill="${a2}" color="${a2}"${g}/>`;
      for(let i=0;i<6;i++){
        const sx = i<3 ? X-4 : X+W+4, sy = Y + H*(0.2 + (i%3)*0.28);
        const dx = i<3 ? -1 : 1;
        s += `<path d="M${sx} ${sy.toFixed(1)} h${dx*26} v${(i%2?18:-18)}" fill="none" stroke="${faint}" stroke-width="1.2"/>`;
        s += `<circle cx="${(sx+dx*26).toFixed(1)}" cy="${(sy+(i%2?18:-18)).toFixed(1)}" r="4" fill="none" stroke="${faint}" stroke-width="2"/>`;
      }
      return s;
    }

    case "chevron": {                    // slide 14: heavy chevron connector, navy border, green fill
      const p = `${X},${Y} ${(X+W*0.62).toFixed(1)},${Y} ${X+W},${(Y+H/2).toFixed(1)} ${(X+W*0.62).toFixed(1)},${Y+H} ${X},${Y+H} ${(X+W*0.38).toFixed(1)},${(Y+H/2).toFixed(1)}`;
      return `<polygon points="${p}" fill="${a2}" stroke="${ink}" stroke-width="2.6" color="${a2}"${g}/>`;
    }

    case "pill": {                       // slide 9: chamfered badge with a green accent line
      const k = 8;
      s += `<path d="${chamPath(X,Y,W,H,k)}" fill="${T.panel}" stroke="${ink}" stroke-width="1.6"/>`;
      s += `<line x1="${X+10}" y1="${Y+H-6}" x2="${X+W-10}" y2="${Y+H-6}" stroke="${a2}" stroke-width="2.4" color="${a2}"${g}/>`;
      s += `<circle cx="${X+14}" cy="${Y+H/2-2}" r="6" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
      return s;
    }

    case "gantt": {                      // slide 11: cascading chevron bars on a column grid
      const cols = o.cols || 14, bars = o.bars || 4;
      for(let i=0;i<=cols;i++)
        s += `<line x1="${(X+(W/cols)*i).toFixed(1)}" y1="${Y}" x2="${(X+(W/cols)*i).toFixed(1)}" y2="${Y+H}" stroke="${faint}" stroke-width="0.8" opacity="0.55"/>`;
      for(let b=0;b<bars;b++){
        const bx = X + (W/cols)*(b*2.6), bw = W*0.38, by = Y + 14 + (H-40)/bars*b, bh = (H-40)/bars - 12;
        const c = b === bars-1 ? a2 : (o.blue ? col("blue",T) : ink);
        s += `<polygon points="${bx.toFixed(1)},${by.toFixed(1)} ${(bx+bw-14).toFixed(1)},${by.toFixed(1)} ${(bx+bw).toFixed(1)},${(by+bh/2).toFixed(1)} ${(bx+bw-14).toFixed(1)},${(by+bh).toFixed(1)} ${bx.toFixed(1)},${(by+bh).toFixed(1)}"
              fill="${T.panel}" stroke="${c}" stroke-width="2.4" color="${c}"${g}/>`;
        if(b<bars-1){
          const nx = X + (W/cols)*((b+1)*2.6), ny = by + bh + 12;
          s += `<path d="M${(bx+bw).toFixed(1)} ${(by+bh/2).toFixed(1)} H${(nx-10).toFixed(1)} V${(ny+bh/2).toFixed(1)} H${nx.toFixed(1)}" fill="none" stroke="${faint}" stroke-width="1.3"/>`;
          s += `<circle cx="${nx.toFixed(1)}" cy="${(ny+bh/2).toFixed(1)}" r="4" fill="none" stroke="${faint}" stroke-width="2"/>`;
        }
      }
      return s;
    }

    case "fader": {                      // mixing fader track: dense traces, 3D knob
      s += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="${a1}" stroke-width="2" color="${a1}"${g}/>`;
      for(let i=1;i<12;i++)
        s += `<line x1="${X+4}" y1="${Y+(H/12)*i}" x2="${X+W-4}" y2="${Y+(H/12)*i}" stroke="${faint}" stroke-width="0.7" opacity="0.5"/>`;
      s += `<line x1="${X+W/2}" y1="${Y+8}" x2="${X+W/2}" y2="${Y+H-8}" stroke="${ink}" stroke-width="1.4"/>`;
      const ky = Y + H*(1 - (o.level == null ? 0.8 : o.level));
      s += `<polygon points="${X+5},${ky} ${X+W-5},${ky} ${X+W-10},${ky+14} ${X+10},${ky+14}" fill="${T.panel}" stroke="${ink}" stroke-width="1.6"/>`;
      return s;
    }
  }
  return "";
}

/* ============================================================
   GLOW BACKGROUNDS
   Measured from Brand_Template_Master.pptx. Three variants, each a
   pair of soft radial blooms. Drawn from the theme's accents, so they
   re-skin instead of being a baked raster.
     hero      pink at 19/73, cyan at 85/21   (title, thank you, closing)
     statement pink at 30/41, cyan at 76/67   (section, statement, quote)
     plain     one faint wash                 (everything else)
   ============================================================ */
const GLOWS = {
  hero:      [[0.19, 0.73, 0.34, "accent1", 0.55], [0.85, 0.21, 0.30, "accent2", 0.50]],
  statement: [[0.30, 0.41, 0.36, "accent1", 0.42], [0.76, 0.67, 0.34, "accent2", 0.40]],
  plain:     [[0.88, 0.80, 0.26, "accent1", 0.16], [0.14, 0.18, 0.30, "accent2", 0.13]]
};
function glowBg(T, kind){
  const g = GLOWS[kind];
  if (!g || !T.dark) {
    if (!g) return "";
    // light themes get a much quieter wash, or the page turns muddy
    return g.map(([x, y, r, role, a], i) => `<defs><radialGradient id="bg${i}${kind}">
      <stop offset="0%" stop-color="${col(role,T)}" stop-opacity="${(a*0.10).toFixed(3)}"/>
      <stop offset="100%" stop-color="${col(role,T)}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="${(x*SW).toFixed(0)}" cy="${(y*SH).toFixed(0)}" rx="${(r*SW).toFixed(0)}" ry="${(r*SW*0.8).toFixed(0)}" fill="url(#bg${i}${kind})"/>`).join("");
  }
  return g.map(([x, y, r, role, a], i) => `<defs><radialGradient id="bg${i}${kind}">
      <stop offset="0%" stop-color="${col(role,T)}" stop-opacity="${a}"/>
      <stop offset="55%" stop-color="${col(role,T)}" stop-opacity="${(a*0.30).toFixed(3)}"/>
      <stop offset="100%" stop-color="${col(role,T)}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="${(x*SW).toFixed(0)}" cy="${(y*SH).toFixed(0)}" rx="${(r*SW).toFixed(0)}" ry="${(r*SW*0.82).toFixed(0)}" fill="url(#bg${i}${kind})"/>`).join("");
}

/* ============================================================
   FONTS
   A stack per family. Carlito stays the default because it is metric
   compatible with Calibri, which is what the Office editions use.
   ============================================================ */
const FONTS = {
  carlito:   { label:"Carlito (Calibri metric)", stack:"'Carlito','Calibri',system-ui,Arial,sans-serif" },
  inter:     { label:"Inter",            stack:"'Inter',system-ui,Arial,sans-serif" },
  manrope:   { label:"Manrope",          stack:"'Manrope',system-ui,Arial,sans-serif" },
  grotesk:   { label:"Space Grotesk",    stack:"'Space Grotesk',system-ui,Arial,sans-serif" },
  archivo:   { label:"Archivo",          stack:"'Archivo',system-ui,Arial,sans-serif" },
  plex:      { label:"IBM Plex Sans",    stack:"'IBM Plex Sans',system-ui,Arial,sans-serif" },
  plexmono:  { label:"IBM Plex Mono",    stack:"'IBM Plex Mono',ui-monospace,monospace" },
  robotomono:{ label:"Roboto Mono",      stack:"'Roboto Mono',ui-monospace,monospace" },
  playfair:  { label:"Playfair Display", stack:"'Playfair Display',Georgia,serif" },
  georgia:   { label:"Georgia",          stack:"Georgia,'Times New Roman',serif" },
  system:    { label:"System",           stack:"system-ui,-apple-system,'Segoe UI',Arial,sans-serif" }
};
const FONT_PPTX = {                       // what PowerPoint gets, since it has no web fonts
  carlito:"Calibri", inter:"Inter", manrope:"Manrope", grotesk:"Space Grotesk", archivo:"Archivo",
  plex:"IBM Plex Sans", plexmono:"IBM Plex Mono", robotomono:"Roboto Mono",
  playfair:"Playfair Display", georgia:"Georgia", system:"Calibri"
};
/* the font an object should draw in: its own, else the deck style, else the theme, else Carlito */
function fontOf(o, T, opts){
  const key = (o && o.font) || (opts && opts.font) || (T && T.font) || "carlito";
  return (FONTS[key] || FONTS.carlito).stack;
}
/* deck-level text styles: an object tagged style:"title" inherits from opts.styles.title */
function styled(o, opts){
  const st = opts && opts.styles && o.style && opts.styles[o.style];
  return st ? { ...st, ...o } : o;              // the object's own settings always win
}

/* ---------- slide chrome: the grid and the corner circuitry ---------- */
function chrome(T, o = {}){
  const D  = T.chrome || {};                              // theme default, slide overrides it
  const gs = o.grid    != null ? o.grid    : (D.grid    != null ? D.grid    : (T.gridSize || 24));
  const cn = o.corners != null ? o.corners : (D.corners != null ? D.corners : 7);
  const bg = o.bgGlow  != null ? o.bgGlow  : (D.bgGlow  != null ? D.bgGlow  : "none");
  const go = T.gridOpacity == null ? 1 : T.gridOpacity;
  let s = `<rect width="${SW}" height="${SH}" fill="${T.ground}"/>`;
  s += `<defs>
    <pattern id="egrid" width="${gs||24}" height="${gs||24}" patternUnits="userSpaceOnUse">
      <path d="M${gs||24} 0 L0 0 0 ${gs||24}" fill="none" stroke="${T.grid}" stroke-width="0.9"/></pattern>
    <pattern id="ehatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="9" stroke="${T.hatch}" stroke-width="1.3"/></pattern>
    <filter id="eglow" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="currentColor" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="currentColor" flood-opacity="0.45"/></filter>
    <filter id="esoft" x="-25%" y="-25%" width="150%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.35"/></filter>
    ${typeof shadeDefs === "function" ? shadeDefs({ ...T, ink: T.ink }) : ""}
  </defs>`;
  if (bg && bg !== "none") s += glowBg(T, bg);
  if (gs) s += `<rect width="${SW}" height="${SH}" fill="url(#egrid)" opacity="${go}"/>`;
  if (cn) {
    let sd = 11; const rr = () => (sd = (sd*1103515245+12345) & 0x7fffffff) / 0x7fffffff;
    const F = (ox, oy, fx, fy) => {
      let t = "";
      for (let i = 0; i < cn; i++) {
        const y = oy + fy*(20 + i*26), x0 = ox, x1 = ox + fx*(90 + ((i*57)%150));
        const y2 = y + fy*(70 + ((i*31)%60));
        t += `<path d="M${x0} ${y} L${x1} ${y} L${x1+fx*30} ${y+fy*30} L${x1+fx*30} ${y2}" fill="none" stroke="${T.faint}" stroke-width="1.1"/>`;
        t += `<circle cx="${x1+fx*30}" cy="${y2}" r="3.5" fill="none" stroke="${T.faint}" stroke-width="1"/>`;
        t += `<rect x="${x0 + fx*(30+i*18)}" y="${y-4}" width="8" height="8" fill="${T.faint}"/>`;
      }
      return t;
    };
    s += `<g opacity="0.5">${F(0,0,1,1)}${F(SW,0,-1,1)}${F(0,SH,1,-1)}${F(SW,SH,-1,-1)}</g>`;
  }
  return s;
}

/* ---------- render a whole slide ---------- */
function renderSlide(slide, T, opts = {}){
  const brand = brandObjects(opts.brand, opts.assets, opts.slideIndex);
  const objs = [...(slide.objects || []), ...brand].sort((a,b) => (a.z||0) - (b.z||0));
  const body = objs.map(o => drawObj(o, T, opts)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}" width="${SW}" height="${SH}">`
       + chrome(T, slide.chrome || {}) + body + `</svg>`;
}

/* ============================================================
   THE BRAND LAYER
   One asset, placed once, stamped on every slide at export and on
   screen. Corner preset, size, margin and clear space are yours.
   It sits above everything and is never accidentally dragged.
   ============================================================ */
const BRAND_CORNERS = {
  tl:(w,h,m) => [m, m], tr:(w,h,m) => [CW - w - m, m],
  bl:(w,h,m) => [m, CH - h - m], br:(w,h,m) => [CW - w - m, CH - h - m],
  tc:(w,h,m) => [(CW - w)/2, m], bc:(w,h,m) => [(CW - w)/2, CH - h - m]
};
function brandObjects(brand, assets, idx){
  if (!brand || !brand.asset || brand.on === false) return [];
  if (brand.skipFirst && idx === 0) return [];
  const a = (assets || {})[brand.asset];
  if (!a) return [];
  const w = brand.w || 1.2;
  const h = w * ((a.h && a.w) ? a.h / a.w : 0.32);         // keep the logo's real aspect ratio
  const [x, y] = (BRAND_CORNERS[brand.corner] || BRAND_CORNERS.tr)(w, h, brand.margin == null ? 0.45 : brand.margin);
  return [{ id:"__brand", type:"image", src:"asset:" + brand.asset, x, y, w, h,
            opacity: brand.opacity == null ? 1 : brand.opacity,
            clear: brand.clear || 0, locked:true, z: 9999 }];
}

/* ============================================================
   TEMPLATE DSL
   Templates are just object arrays. Drop one on a slide and every
   piece of it is editable: move it, retype it, delete it.
   ============================================================ */
let Z = 0;
const T_ = (x,y,w,h,text,o={}) => ({ id:uid(), type:"text", x,y,w,h, text, size:o.size||15, bold:!!o.bold,
  fill:o.fill||"ink", align:o.align||"left", valign:o.valign||"top", track:o.track||0, lh:o.lh||1.28,
  shadow:!!o.shadow, z:++Z });
const R_ = (x,y,w,h,o={}) => ({ id:uid(), type:"rect", x,y,w,h, fill:o.fill||"none", stroke:o.stroke||"none",
  sw:o.sw==null?1.6:o.sw, r:o.r||0, glow:!!o.glow, shadow:!!o.shadow, cham:o.cham, z:++Z });
const C_ = (x,y,w,h,o={}) => ({ id:uid(), type:"card", x,y,w,h, fill:o.fill||"panel", stroke:o.stroke||"faint",
  sw:o.sw==null?1.6:o.sw, band:o.band, hatchTop:o.hatchTop, brackets:o.brackets, glow:!!o.glow,
  shadow:!!o.shadow, dbl:o.dbl, cham:o.cham, z:++Z });
const L_ = (x,y,w,h,o={}) => ({ id:uid(), type:"line", x,y,w,h, stroke:o.stroke||"ink", sw:o.sw||2,
  dash:o.dash, arrow:!!o.arrow, glow:!!o.glow, z:++Z });
const E_ = (x,y,w,h,o={}) => ({ id:uid(), type:"ellipse", x,y,w,h, fill:o.fill||"none", stroke:o.stroke||"ink", sw:o.sw||1.6, glow:!!o.glow, shadow:!!o.shadow, z:++Z });
const K_ = (x,y,s,n,fill,o={}) => ({ id:uid(), type:"chip", x, y, w:s, h:s, text:String(n), fill:fill||"accent1", shape:o.shape, shadow:!!o.shadow, z:++Z });
const D_ = (x,y,w,h,hero,o={}) => ({ id:uid(), type:"device", x,y,w,h, hero, params:o.params||{},
  detail:o.detail==null?2:o.detail, tint:o.tint, z:++Z });

const M_ = (x,y,w,h,motif,o={}) => ({ id:uid(), type:"motif", motif, x,y,w,h,
  stroke:o.stroke||"accent1", fill:o.fill||"accent2", sw:o.sw, traces:o.traces, pct:o.pct, level:o.level, open:o.open, z:++Z });

/* the two things almost every slide has */
const EYEBROW = (t) => [ R_(0.46,0.33,0.1,0.1,{fill:"accent1"}), L_(0.62,0.38,0.44,0,{stroke:"accent1",sw:2}),
  T_(1.14,0.24,6,0.3,t,{size:9.5,bold:true,fill:"accent1",track:2.2,valign:"middle"}) ];
const TITLE = (t,y=0.52) => T_(0.44,y,12.4,0.62,t,{size:27,bold:true,valign:"middle"});
const VERDICT = (t,sub) => {
  const a = [ C_(0.4,6.52,12.5,0.7,{fill:"ink",stroke:"ink",sw:3,brackets:false}),
    T_(0.5,sub?6.56:6.6,12.3,sub?0.36:0.56,t,{size:17,bold:true,fill:"ground",align:"center",valign:"middle"}) ];
  if (sub) a.push(T_(0.5,6.92,12.3,0.26,sub,{size:11,fill:"faint",align:"center",valign:"middle"}));
  return a;
};
const alt = i => i % 2 ? "accent2" : "accent1";

/* ============================================================
   THE 40 TEMPLATES
   ============================================================ */
const TEMPLATES = [

/* ---- TITLES AND SECTIONS ---- */
{ id:"t-cover-device", name:"Cover with device", group:"Open", build:()=>[
  D_(6.8,0.5,6.2,6.5,"H10",{detail:3}),
  R_(0.62,2.9,0.12,0.12,{fill:"accent1"}), L_(0.82,2.96,0.7,0,{stroke:"accent1",sw:2.4}),
  T_(1.6,2.82,6,0.3,"EYEBROW",{size:11,bold:true,fill:"accent1",track:2.6,valign:"middle"}),
  T_(0.6,3.3,6.4,1.4,"The headline\ngoes here",{size:50,bold:true,lh:1.05}),
  L_(0.62,4.78,5.4,0,{stroke:"ink",sw:2}),
  T_(0.6,4.95,5.6,0.9,"One sentence that says why this matters, in the language they would use.",{size:16,fill:"mist"}),
  T_(0.6,6.7,6,0.3,"FOOTER · 2026",{size:11,bold:true,fill:"faint",track:2})]},

{ id:"t-title-hero", name:"Title, no device", group:"Open", build:()=>[
  T_(0.6,2.6,11,0.4,"EYEBROW",{size:12,bold:true,fill:"accent1",track:3,valign:"middle"}),
  T_(0.58,3.1,11.6,1.5,"The one idea, stated plainly",{size:54,bold:true}),
  L_(0.6,4.75,6.6,0,{stroke:"accent1",sw:3}),
  T_(0.58,4.95,9,0.8,"The subtitle carries the promise, not the topic.",{size:18,fill:"mist"}),
  K_(0.6,6.4,0.42,1,"accent1"), K_(1.14,6.4,0.42,2,"accent2")]},

{ id:"t-section", name:"Section divider", group:"Open", build:()=>[
  T_(0.4,1.3,5,2.6,"01",{size:150,bold:true,fill:"grid",valign:"middle"}),
  L_(0.5,4.78,6.9,0,{stroke:"accent1",sw:3}),
  T_(0.44,4.95,11,0.8,"The section title",{size:40,bold:true,valign:"middle"}),
  T_(0.46,5.8,8,0.5,"One line on what this section proves.",{size:15,fill:"mist"})]},

{ id:"t-section-label", name:"Section label", group:"Open", build:()=>[
  ...EYEBROW("SECTION LABEL"),
  T_(0.44,2.9,12.4,1,"What this part is about",{size:44,bold:true,valign:"middle"}),
  L_(0.46,4.1,4.2,0,{stroke:"accent2",sw:2.5}),
  T_(0.44,4.3,9,0.6,"A single supporting line.",{size:16,fill:"mist"})]},

{ id:"t-statement", name:"Statement", group:"Open", build:()=>[
  T_(1.2,2.2,11,2.6,"One sentence, large, that the room will repeat in the corridor afterwards.",{size:40,bold:true,align:"center",valign:"middle",lh:1.2}),
  L_(5.65,5.1,2,0,{stroke:"accent1",sw:3})]},

{ id:"t-quote", name:"Quote", group:"Open", build:()=>[
  T_(0.45,1.0,1.4,1.8,"\u201C",{size:110,bold:true,fill:"accent1",valign:"middle"}),
  T_(1.65,1.6,10.6,3.2,"They said the thing you could never say about yourself without it sounding like a pitch.",{size:27,bold:true}),
  L_(1.7,5.2,2.5,0,{stroke:"accent1",sw:3}),
  T_(1.66,5.35,8,0.34,"Name",{size:15,bold:true}),
  T_(1.66,5.72,8,0.3,"Role, company",{size:13,fill:"mist"})]},

/* ---- CONTENT ---- */
{ id:"t-agenda", name:"Agenda", group:"Content", build:()=>{
  const o=[...EYEBROW("AGENDA"), TITLE("What we will cover")];
  for(let i=0;i<6;i++){ const x=i<3?0.5:6.9, y=1.6+(i%3)*0.78;
    o.push(C_(x,y,5.9,0.62,{stroke:"faint",sw:1.2}), K_(x+0.14,y+0.14,0.34,i+1,i?"ink":"accent2"),
      T_(x+0.6,y+0.05,2.7,0.5,"Section "+(i+1),{size:14,bold:true,valign:"middle"}),
      T_(x+3.3,y+0.05,2.5,0.5,"One line",{size:11.5,fill:"mist",valign:"middle"})); }
  return o; }},

{ id:"t-bullets", name:"Bulleted list", group:"Content", build:()=>{
  const o=[...EYEBROW("SECTION"), TITLE("The points, in order")];
  for(let i=0;i<5;i++){ const y=1.7+i*0.62;
    o.push(R_(0.52,y+0.16,0.12,0.12,{fill:i?"ink":"accent2"}),
      T_(0.86,y,11.6,0.44,"The point, stated as a claim rather than a topic.",{size:15.5,valign:"middle"})); }
  return [...o, ...VERDICT("The line they leave with.")]; }},

{ id:"t-bullets-note", name:"Bullets with note", group:"Content", build:()=>{
  const o=[...EYEBROW("SECTION"), TITLE("The points, with a caveat")];
  for(let i=0;i<5;i++){ const y=1.7+i*0.62;
    o.push(R_(0.52,y+0.16,0.12,0.12,{fill:i?"ink":"accent2"}), T_(0.86,y,7.6,0.44,"The point.",{size:15.5,valign:"middle"})); }
  o.push(C_(8.9,1.6,4,3.2,{stroke:"accent2",sw:1.8}),
    T_(9.12,1.76,3.6,0.28,"NOTE",{size:10,bold:true,fill:"accent2",track:1.6}),
    T_(9.12,2.12,3.56,2.4,"The thing that makes the list conditional. Put the honest caveat here, not in the appendix.",{size:13}));
  return [...o, ...VERDICT("The line they leave with.")]; }},

{ id:"t-two-col", name:"Two column text", group:"Content", build:()=>[
  ...EYEBROW("SECTION"), TITLE("Two halves of one point"),
  C_(0.5,1.6,5.9,4.4,{stroke:"faint"}),
  T_(0.76,1.9,5.4,0.4,"LEFT",{size:11,bold:true,fill:"accent1",track:1.8}),
  T_(0.76,2.4,5.4,3.2,"The first half of the argument. Left aligned, never centred, because centred body copy is hard to read and looks like a poster.",{size:14,fill:"mist"}),
  C_(6.9,1.6,5.9,4.4,{stroke:"accent2",sw:1.8}),
  T_(7.16,1.9,5.4,0.4,"RIGHT",{size:11,bold:true,fill:"accent2",track:1.8}),
  T_(7.16,2.4,5.4,3.2,"The second half. Same shape, different weight, so the eye knows which one you believe.",{size:14}),
  ...VERDICT("The line they leave with.")]},

{ id:"t-cards6", name:"Card grid, six", group:"Content", build:()=>{
  const o=[...EYEBROW("SECTION"), TITLE("Six things of equal weight")];
  for(let i=0;i<6;i++){ const x=0.5+(i%3)*4.2, y=1.55+((i/3)|0)*2.35, a=alt(i);
    o.push(C_(x,y,3.9,2.05,{stroke:a,sw:1.6}), K_(x+0.22,y+0.22,0.4,i+1,a),
      T_(x+0.76,y+0.24,2.9,0.36,"Card title",{size:15,bold:true,valign:"middle"}),
      L_(x+0.22,y+0.78,3.46,0,{stroke:"grid",sw:1}),
      T_(x+0.2,y+0.9,3.5,1,"One sentence that earns the card.",{size:12.5,fill:"mist"})); }
  return o; }},

{ id:"t-cards3", name:"Card row, three", group:"Content", build:()=>{
  const o=[...EYEBROW("SECTION"), TITLE("Three pillars")];
  for(let i=0;i<3;i++){ const x=0.5+i*4.2, a=alt(i);
    o.push(C_(x,1.7,3.9,4.2,{stroke:a,sw:1.8}), K_(x+0.24,1.94,0.46,i+1,a),
      T_(x+0.86,1.96,2.8,0.42,"Pillar "+(i+1),{size:17,bold:true,valign:"middle"}),
      L_(x+0.24,2.6,3.42,0,{stroke:"grid",sw:1}),
      T_(x+0.24,2.8,3.42,2.8,"What it is, and why the whole argument fails without it.",{size:13.5,fill:"mist"})); }
  return o; }},

{ id:"t-icon-row", name:"Icon feature row", group:"Content", build:()=>{
  const o=[...EYEBROW("CAPABILITIES"), TITLE("Four things it does")];
  for(let i=0;i<4;i++){ const x=0.5+i*3.16, a=alt(i);
    o.push(R_(x+1.1,1.9,0.96,0.96,{stroke:a,sw:2,r:6}),
      E_(x+1.34,2.14,0.48,0.48,{stroke:a,sw:1.6}),
      L_(x+1.34,2.62,0.48,0,{stroke:a,sw:1.6}),
      T_(x,3.2,3.16,0.4,"Feature "+(i+1),{size:15.5,bold:true,align:"center"}),
      T_(x,3.7,3.16,1.6,"One line that says what it does, not what it is.",{size:12.5,fill:"mist",align:"center"})); }
  return [...o, ...VERDICT("The line they leave with.")]; }},

{ id:"t-key-term", name:"Key term", group:"Content", build:()=>[
  ...EYEBROW("DEFINITION"),
  C_(0.5,1.7,12.3,3.6,{stroke:"accent2",sw:2}),
  K_(0.9,2.1,0.6,1,"accent2"),
  T_(1.7,2.1,10,0.7,"The term",{size:34,bold:true,valign:"middle"}),
  L_(0.9,3.1,11.5,0,{stroke:"grid",sw:1.2}),
  T_(0.9,3.35,11.5,1.6,"The definition, in one sentence, in their language. If you need two sentences, you do not understand it yet.",{size:17,fill:"mist"}),
  ...VERDICT("Why the term matters to them.")]},

{ id:"t-exec-summary", name:"Executive summary", group:"Content", build:()=>{
  const o=[...EYEBROW("EXECUTIVE SUMMARY"), TITLE("The whole argument, on one slide")];
  ["The situation","The complication","The question","The answer"].forEach((h,i)=>{
    const y=1.6+i*1.16, a=i===3?"accent2":"ink";
    o.push(C_(0.5,y,12.3,1.02,{stroke:a,sw:i===3?2:1.3}), K_(0.72,y+0.22,0.56,i+1,a),
      T_(1.5,y+0.16,3,0.34,h,{size:14.5,bold:true}),
      T_(1.5,y+0.52,10.9,0.4,"One sentence. No hedging, no throat-clearing.",{size:13,fill:"mist"})); }
  );
  return [...o, ...VERDICT("So what. In one line.")]; }},

/* ---- DATA ---- */
{ id:"t-table", name:"Table", group:"Data", build:()=>{
  const o=[...EYEBROW("THE NUMBERS"), TITLE("Rows, and an owner column")];
  o.push(R_(0.46,1.6,12.4,0.5,{fill:"ink"}));
  ["Item","Frequency","Cost","Owner"].forEach((h,i)=>o.push(T_(0.62+i*3.1,1.6,3,0.5,h.toUpperCase(),{size:11,bold:true,fill:"ground",track:1.2,valign:"middle"})));
  for(let r=0;r<5;r++){ const y=2.1+r*0.56;
    if(r%2) o.push(R_(0.46,y,12.4,0.56,{fill:"panel"}));
    for(let c=0;c<4;c++) o.push(T_(0.62+c*3.1,y,3,0.56,c?"value":"Row "+(r+1),{size:13,bold:!c,fill:c?"mist":"ink",valign:"middle"}));
    o.push(L_(0.46,y+0.56,12.4,0,{stroke:"grid",sw:1})); }
  return [...o, ...VERDICT("Every row has a number. No row has an owner.")]; }},

{ id:"t-metrics3", name:"Metric trio", group:"Data", build:()=>{
  const o=[...EYEBROW("THE MODEL"), TITLE("What it is worth")];
  for(let i=0;i<3;i++){ const x=0.5+i*4.2, last=i===2, a=last?"accent2":"ink";
    o.push(C_(x,1.55,3.9,4.4,{stroke:a,sw:last?3:1.6,glow:last,hatchTop:true}),
      T_(x,2.1,3.9,0.3,"LABEL",{size:12,bold:true,fill:"mist",align:"center",track:1.6}),
      T_(x,2.5,3.9,1.2,["49k","945k","3-4"][i],{size:64,bold:true,fill:a,align:"center",valign:"middle"}),
      T_(x,3.8,3.9,0.3,"unit or range",{size:14,fill:"mist",align:"center"}),
      L_(x+0.4,4.3,3.1,0,{stroke:"grid",sw:1.2}),
      T_(x+0.3,4.5,3.3,1.2,"One sentence on where the number comes from.",{size:13,fill:"mist",align:"center"})); }
  return [...o, ...VERDICT("State it as a range. Defend the low end.")]; }},

{ id:"t-metric-trend", name:"Metric with trend", group:"Data", build:()=>[
  ...EYEBROW("TREND"), TITLE("One number, and its direction"),
  C_(0.5,1.7,5.4,4.2,{stroke:"accent2",sw:2.4,glow:true}),
  T_(0.5,2.1,5.4,0.3,"THE NUMBER",{size:12,bold:true,fill:"mist",align:"center",track:1.6}),
  T_(0.5,2.5,5.4,1.5,"945k",{size:84,bold:true,fill:"accent2",align:"center",valign:"middle"}),
  T_(0.5,4.2,5.4,0.3,"annual benefit",{size:15,fill:"mist",align:"center"}),
  T_(0.5,4.8,5.4,0.8,"Up 62 percent against the baseline quarter.",{size:14,align:"center"}),
  C_(6.4,1.7,6.4,4.2,{stroke:"faint"}),
  L_(6.9,5.3,5.4,0,{stroke:"grid",sw:1.2}), L_(6.9,2.2,0,3.1,{stroke:"grid",sw:1.2}),
  L_(6.9,5.0,1.3,-0.6,{stroke:"accent2",sw:2.4}), L_(8.2,4.4,1.3,-0.9,{stroke:"accent2",sw:2.4}),
  L_(9.5,3.5,1.3,-0.5,{stroke:"accent2",sw:2.4}), L_(10.8,3.0,1.4,-0.8,{stroke:"accent2",sw:2.4}),
  E_(12.1,2.1,0.2,0.2,{fill:"accent2",stroke:"accent2"}),
  T_(6.9,5.5,5.4,0.3,"Q1        Q2        Q3        Q4",{size:11,fill:"faint"}),
  ...VERDICT("The direction is the argument, not the level.")]},

{ id:"t-progress", name:"Progress bars", group:"Data", build:()=>{
  const o=[...EYEBROW("STATUS"), TITLE("Where each track stands")];
  [100,72,45,20].forEach((p,i)=>{ const y=1.8+i*0.9, a=p>=100?"accent2":p<34?"accent1":"hot";
    o.push(T_(0.48,y,8,0.3,"Track "+(i+1),{size:14,bold:true,valign:"middle"}),
      T_(11.4,y,1.46,0.3,p+"%",{size:14,bold:true,fill:a,align:"right",valign:"middle"}),
      R_(0.48,y+0.34,12.38,0.28,{fill:"grid",r:4}),
      R_(0.48,y+0.34,12.38*p/100,0.28,{fill:a,r:4}),
      T_(0.48,y+0.66,11,0.24,"One line on what is actually blocking it.",{size:11.5,fill:"mist"})); }
  );
  return o; }},

{ id:"t-funnel", name:"Funnel", group:"Data", build:()=>{
  const o=[...EYEBROW("THE FUNNEL"), TITLE("Where they fall out")];
  const st=["Reach","Engage","Consider","Convert","Retain"];
  st.forEach((s,i)=>{ const w=10.4-i*1.7, x=(13.3-w)/2, y=1.7+i*0.92, a=i===4?"accent2":i===0?"faint":"ink";
    o.push(R_(x,y,w,0.72,{fill:"panel",stroke:a,sw:i===4?2.4:1.5,r:4,glow:i===4}),
      T_(x+0.3,y,3,0.72,s,{size:15,bold:true,valign:"middle"}),
      T_(x+w-3.3,y,3,0.72,(100-i*22)+"%",{size:15,bold:true,fill:a,align:"right",valign:"middle"}));
    if(i<4) o.push(L_(6.65,y+0.74,0,0.16,{stroke:"faint",sw:1.4,arrow:true})); }
  );
  return [...o, ...VERDICT("The drop between two stages is the whole business case.")]; }},

{ id:"t-kpi-dash", name:"KPI dashboard", group:"Data", build:()=>{
  const o=[...EYEBROW("DASHBOARD"), TITLE("Six numbers, one glance")];
  for(let i=0;i<6;i++){ const x=0.5+(i%3)*4.2, y=1.55+((i/3)|0)*2.35, a=alt(i);
    o.push(C_(x,y,3.9,2.05,{stroke:"faint",sw:1.3}),
      R_(x,y,0.1,2.05,{fill:a}),
      T_(x+0.3,y+0.2,3.4,0.3,"METRIC "+(i+1),{size:10.5,bold:true,fill:"mist",track:1.4}),
      T_(x+0.3,y+0.55,3.4,0.9,["12.4","98%","3.1x","41k","7d","2.2%"][i],{size:40,bold:true,valign:"middle"}),
      T_(x+0.3,y+1.55,3.4,0.3,"vs 9.8 last quarter",{size:11.5,fill:"mist"})); }
  return o; }},

{ id:"t-stat-block", name:"Stat block", group:"Data", build:()=>[
  ...EYEBROW("THE NUMBER"),
  T_(0.5,1.6,7.4,1,"The claim in words",{size:34,bold:true,valign:"middle"}),
  T_(0.5,2.7,7.4,2.4,"The supporting paragraph. Short. Say where the number comes from and what would have to be true for it to be wrong.",{size:16,fill:"mist"}),
  C_(8.5,1.6,4.3,4.4,{stroke:"accent1",sw:3,glow:true}),
  T_(8.5,2.3,4.3,1.8,"1.89M",{size:74,bold:true,fill:"accent1",align:"center",valign:"middle"}),
  L_(9.1,4.2,3.1,0,{stroke:"grid",sw:1.2}),
  T_(8.7,4.4,3.9,1.2,"recoverable, annually, on today's baseline",{size:14,fill:"mist",align:"center"}),
  ...VERDICT("The number is the argument. Everything else is support.")]},

/* ---- PERSUASION ---- */
{ id:"t-before-after", name:"Before and after", group:"Persuade", build:()=>{
  const o=[...EYEBROW("THE SHIFT"), TITLE("Before, and after")];
  o.push(C_(0.5,1.6,5.9,4.5,{stroke:"faint",sw:1.4,hatchTop:true}),
    T_(0.5,1.66,5.9,0.4,"BEFORE",{size:12,bold:true,fill:"faint",align:"center",track:1.8,valign:"middle"}));
  for(let i=0;i<4;i++){ const y=2.5+i*0.62;
    o.push(L_(0.85,y+0.1,0.18,0.18,{stroke:"faint",sw:1.6}), L_(1.03,y+0.1,-0.18,0.18,{stroke:"faint",sw:1.6}),
      T_(1.35,y,4.8,0.4,"How it works today.",{size:13.5,fill:"mist",valign:"middle"})); }
  o.push(C_(6.9,1.6,5.9,4.5,{stroke:"accent2",sw:2.4,band:"accent2",glow:true}),
    T_(6.9,1.66,5.9,0.4,"AFTER",{size:12,bold:true,fill:"ground",align:"center",track:1.8,valign:"middle"}));
  for(let i=0;i<4;i++){ const y=2.5+i*0.62;
    o.push(E_(7.25,y+0.06,0.26,0.26,{stroke:"accent2",sw:1.8}),
      T_(7.75,y,4.8,0.4,"How it works after.",{size:13.5,bold:true,valign:"middle"})); }
  return [...o, ...VERDICT("Same spend. Different system. Different outcome.")]; }},

{ id:"t-do-avoid", name:"Do and avoid", group:"Persuade", build:()=>{
  const o=[...EYEBROW("GOVERNANCE"), TITLE("How this goes right, and wrong")];
  [["Do","accent2",0.5,true],["Avoid","accent1",6.9,false]].forEach(([h,a,x,good])=>{
    o.push(C_(x,1.55,5.9,4.5,{stroke:a,sw:1.8,band:a}),
      T_(x,1.6,5.9,0.4,h.toUpperCase(),{size:12,bold:true,fill:"ground",align:"center",track:1.6,valign:"middle"}));
    for(let i=0;i<5;i++){ const y=2.4+i*0.66;
      if(good) o.push(E_(x+0.3,y+0.02,0.26,0.26,{stroke:a,sw:1.8}));
      else o.push(L_(x+0.32,y+0.04,0.2,0.2,{stroke:a,sw:1.8}), L_(x+0.52,y+0.04,-0.2,0.2,{stroke:a,sw:1.8}));
      o.push(T_(x+0.75,y,4.9,0.42,good?"The thing that works.":"The thing that fails.",{size:13.5,bold:good,fill:good?"ink":"mist",valign:"middle"})); }
  });
  return [...o, ...VERDICT("The failure mode is not effort. It is ambiguity.")]; }},

{ id:"t-comparison", name:"Comparison table", group:"Persuade", build:()=>{
  const o=[...EYEBROW("THE CHOICE"), TITLE("Option against option")];
  o.push(R_(4.3,1.6,4.2,0.5,{fill:"faint"}), T_(4.3,1.6,4.2,0.5,"THEIRS",{size:11,bold:true,fill:"ground",align:"center",track:1.4,valign:"middle"}),
    R_(8.6,1.6,4.2,0.5,{fill:"accent2"}), T_(8.6,1.6,4.2,0.5,"OURS",{size:11,bold:true,fill:"ground",align:"center",track:1.4,valign:"middle"}));
  for(let r=0;r<5;r++){ const y=2.2+r*0.78;
    o.push(T_(0.5,y,3.6,0.6,"Dimension "+(r+1),{size:14,bold:true,valign:"middle"}),
      T_(4.3,y,4.2,0.6,"What they do",{size:13,fill:"mist",align:"center",valign:"middle"}),
      T_(8.6,y,4.2,0.6,"What we do",{size:13,bold:true,align:"center",valign:"middle"}),
      L_(0.5,y+0.66,12.3,0,{stroke:"grid",sw:1})); }
  return [...o, ...VERDICT("The row that decides it is the one with no cell on their side.")]; }},

{ id:"t-testimonial3", name:"Testimonial trio", group:"Persuade", build:()=>{
  const o=[...EYEBROW("EVIDENCE"), TITLE("Three people who already did it")];
  for(let i=0;i<3;i++){ const x=0.5+i*4.2, a=alt(i);
    o.push(C_(x,1.7,3.9,4.2,{stroke:a,sw:1.6}),
      T_(x+0.24,1.85,1,0.8,"\u201C",{size:44,bold:true,fill:a}),
      T_(x+0.24,2.6,3.42,2,"The sentence they said, that you could not say about yourself.",{size:14}),
      L_(x+0.24,4.9,1.6,0,{stroke:a,sw:2}),
      T_(x+0.24,5.1,3.42,0.3,"Name",{size:13.5,bold:true}),
      T_(x+0.24,5.42,3.42,0.3,"Role",{size:12,fill:"mist"})); }
  return o; }},

{ id:"t-process", name:"Process steps", group:"Persuade", build:()=>{
  const o=[...EYEBROW("THE PROCESS"), TITLE("It happens in this order")];
  for(let i=0;i<4;i++){ const x=0.5+i*3.2, a=i===3?"accent2":"ink";
    o.push(C_(x,2.1,2.9,2.6,{stroke:a,sw:i===3?2.2:1.5,glow:i===3}),
      K_(x+0.24,2.34,0.5,i+1,a),
      T_(x+0.24,3.1,2.42,0.4,"Step "+(i+1),{size:16,bold:true}),
      T_(x+0.24,3.6,2.42,1,"What actually happens here.",{size:12.5,fill:"mist"}));
    if(i<3) o.push(L_(x+3.0,3.4,0.16,0,{stroke:"faint",sw:2,arrow:true})); }
  return [...o, ...VERDICT("Each step is cheap. Skipping one is not.")]; }},

{ id:"t-timeline", name:"Timeline", group:"Persuade", build:()=>{
  const o=[...EYEBROW("THE PLAN"), TITLE("Thirty days, then decide")];
  o.push(L_(0.8,3.42,11.7,0,{stroke:"ink",sw:3}));
  for(let i=0;i<5;i++){ const x=1.2+i*2.8, up=i%2===0, a=i===4?"accent2":"ink";
    o.push(E_(x-0.11,3.31,0.22,0.22,{fill:a,stroke:a}),
      L_(x,up?2.9:3.5,0,0.42,{stroke:a,sw:1.4}));
    const cy=up?1.6:4.05;
    o.push(C_(x-1.15,cy,2.3,1.2,{stroke:a,sw:1.4}),
      T_(x-1.1,cy+0.12,2.2,0.32,"Week "+(i+1),{size:13.5,bold:true,align:"center",valign:"middle"}),
      T_(x-1.08,cy+0.46,2.16,0.66,"What lands.",{size:11.5,fill:"mist",align:"center"}),
      T_(x-0.7,up?3.72:2.9,1.4,0.28,"Day "+(1+i*7),{size:11,bold:true,fill:a,align:"center"})); }
  return [...o, ...VERDICT("A kill switch on day 31 is what makes day 1 cheap.")]; }},

{ id:"t-roadmap", name:"Roadmap phases", group:"Persuade", build:()=>{
  const o=[...EYEBROW("ROADMAP"), TITLE("Four phases, one direction")];
  for(let i=0;i<4;i++){ const y=1.7+i*1.1, w=3.2+i*3.1, a=i===3?"accent2":i===0?"faint":"ink";
    o.push(R_(0.5,y,w,0.82,{fill:"panel",stroke:a,sw:i===3?2.2:1.4,r:4,glow:i===3}),
      K_(0.72,y+0.16,0.5,i+1,a),
      T_(1.44,y,4,0.82,"Phase "+(i+1),{size:15,bold:true,valign:"middle"}),
      T_(w-3.4,y,3.2,0.82,"Weeks "+(i*4+1)+" to "+(i*4+4),{size:12.5,fill:"mist",valign:"middle",align:"right"})); }
  return [...o, ...VERDICT("Each phase pays for the next one.")]; }},

/* ---- SIGNAL ARTWORK: a device plus editable callouts ---- */
{ id:"t-hero-callouts", name:"Device with callouts", group:"Signal", build:()=>{
  const o=[...EYEBROW("THE PROBLEM"), TITLE("Where the money actually goes"),
    D_(2.9,1.05,7.6,3.9,"H11",{detail:3,params:{leaks:3}})];
  for(let i=0;i<3;i++){ const y=1.45+i*1.75, a=[ "accent1","hot","accent2" ][i];
    o.push(C_(0.46,y,3.1,0.94,{stroke:a,sw:1.8}), K_(0.58,y+0.12,0.26,i+1,a),
      T_(0.94,y+0.08,2.1,0.34,"Leak "+(i+1),{size:15,bold:true,valign:"middle"}),
      T_(0.6,y+0.46,2.9,0.4,"One sentence on what it costs.",{size:12,fill:"mist"}),
      L_(3.56,y+0.47,0.9,0,{stroke:a,sw:1.4,dash:"6 4"})); }
  return [...o, ...VERDICT("Recoverable waste is structural, not behavioural.","You cannot train your way out of a missing system.")]; }},

{ id:"t-compare-device", name:"Dead versus live", group:"Signal", build:()=>[
  ...EYEBROW("THE SHIFT"), TITLE("Two ways to run the same account"),
  C_(0.5,1.2,5.9,5,{stroke:"faint",sw:1.4,hatchTop:true}),
  T_(0.5,1.26,5.9,0.4,"AD HOC",{size:13,bold:true,fill:"faint",align:"center",track:1.8,valign:"middle"}),
  D_(0.8,1.8,5.3,2,"H01",{detail:1,tint:"faint"}),
  T_(0.9,4.1,5.1,1.9,"Re-drafted every quarter.\nHidden in personal drives.\nOwnership defaults to whoever asked.\nGoes stale silently.",{size:13.5,fill:"mist",lh:1.5}),
  C_(6.9,1.2,5.9,5,{stroke:"accent2",sw:2.6,band:"accent2",glow:true}),
  T_(6.9,1.26,5.9,0.4,"GOVERNED",{size:13,bold:true,fill:"ground",align:"center",track:1.8,valign:"middle"}),
  D_(7.2,1.8,5.3,2,"H13",{detail:3}),
  T_(7.3,4.1,5.1,1.9,"Permanent, authoritative reference.\nOne searchable surface.\nExplicitly owned and tracked.\nAutomated review cadence.",{size:13.5,bold:true,lh:1.5}),
  ...VERDICT("Same spend. Different system. Different outcome.")]},

{ id:"t-escalation", name:"Escalation ladder", group:"Signal", build:()=>{
  const o=[...EYEBROW("GOVERNANCE"), TITLE("The four-tier correction ladder"),
    D_(0.4,1.15,8.7,4.7,"H15",{detail:3,params:{treads:4}})];
  for(let i=0;i<4;i++){ const a=["accent2","ink","hot","accent1"][i];
    o.push(C_(9.1,1.25+i*1.25,3.8,1.05,{stroke:a,sw:1.8}), K_(9.24,1.4+i*1.25,0.28,i+1,a),
      T_(9.64,1.36+i*1.25,3.1,0.34,"Tier "+(i+1),{size:14.5,bold:true,valign:"middle"}),
      T_(9.26,1.76+i*1.25,3.5,0.44,"What the system does at this level.",{size:11.5,fill:"mist"})); }
  return [...o, ...VERDICT("Proportional response. Height is severity.")]; }},

{ id:"t-flow-device", name:"Process with device", group:"Signal", build:()=>{
  const o=[...EYEBROW("THE SYSTEM"), TITLE("It happens in this order"),
    D_(0.6,1.05,12.1,2.9,"H27",{detail:3})];
  for(let i=0;i<4;i++){ const x=0.5+i*3.2, a=i===3?"accent2":"ink";
    o.push(C_(x,4.3,2.9,1.85,{stroke:a,sw:i===3?2:1.4}), K_(x+0.16,4.46,0.32,i+1,a),
      T_(x+0.58,4.44,2.2,0.34,"Station "+(i+1),{size:14,bold:true,valign:"middle"}),
      L_(x+0.16,4.94,2.58,0,{stroke:"grid",sw:1}),
      T_(x+0.16,5.1,2.6,0.9,"What happens here.",{size:12,fill:"mist"})); }
  return [...o, ...VERDICT("A flywheel, not a treadmill.")]; }},

{ id:"t-map-sidebar", name:"System map, register", group:"Signal", build:()=>{
  const o=[...EYEBROW("THE SYSTEM"), TITLE("The map, and what governs it"),
    D_(0.3,1.05,9.7,5.2,"H13",{detail:3}),
    C_(10.3,1.05,2.6,5.2,{fill:"sidebar",stroke:"ink",sw:1.6}),
    R_(10.32,1.07,2.56,0.44,{fill:"ink"}),
    T_(10.32,1.07,2.56,0.44,"REGISTER",{size:12,bold:true,fill:"ground",align:"center",track:1.4,valign:"middle"})];
  for(let i=0;i<5;i++){ const y=1.7+i*0.9;
    o.push(R_(10.48,y,2.26,0.7,{fill:"panel",stroke:"faint",sw:1.2,r:4}),
      R_(10.48,y,0.06,0.7,{fill:alt(i)}),
      T_(10.66,y+0.06,2,0.3,"Lane "+(i+1),{size:13,bold:true}),
      T_(10.66,y+0.36,2,0.3,"Owner, cadence",{size:11,fill:"mist"})); }
  return [...o, ...VERDICT("Every lane has an owner and a review date.")]; }},

{ id:"t-decision", name:"The decision", group:"Signal", build:()=>{
  const o=[...EYEBROW("THE CLOSE"), TITLE("One decision, this week"),
    D_(4.4,1.1,4.6,4.6,"H51",{detail:3,params:{angle:30}}),
    C_(0.46,1.4,3.6,4,{stroke:"faint",sw:1.6,hatchTop:true}),
    T_(0.46,1.46,3.6,0.4,"DO NOTHING",{size:12,bold:true,fill:"faint",align:"center",track:1.6,valign:"middle"}),
    C_(9.24,1.4,3.6,4,{stroke:"accent2",sw:2.6,band:"accent2",glow:true}),
    T_(9.24,1.46,3.6,0.4,"COMMIT",{size:12,bold:true,fill:"ground",align:"center",track:1.6,valign:"middle"})];
  for(let i=0;i<3;i++){
    o.push(L_(0.76,2.3+i*0.9,0.2,0.2,{stroke:"faint",sw:1.6}), L_(0.96,2.3+i*0.9,-0.2,0.2,{stroke:"faint",sw:1.6}),
      T_(1.2,2.24+i*0.9,2.7,0.66,"What it costs to wait.",{size:12.5,fill:"mist"}),
      E_(9.54,2.28+i*0.9,0.24,0.24,{stroke:"accent2",sw:1.8}),
      T_(9.98,2.24+i*0.9,2.7,0.66,"What you get on day one.",{size:12.5,bold:true})); }
  return [...o, ...VERDICT("The only expensive option is the one that stays invisible.")]; }},

{ id:"t-device-solo", name:"Device, full bleed", group:"Signal", build:()=>[
  ...EYEBROW("THE MACHINE"), TITLE("One device, one idea"),
  D_(1.6,1.2,10.1,4.9,"H16",{detail:3}),
  ...VERDICT("Say the one thing the machine is for.")]},

/* ---- CLOSE ---- */
{ id:"t-closing", name:"Closing and ask", group:"Close", build:()=>{
  const o=[R_(0.46,2.42,0.12,0.12,{fill:"accent1"}), L_(0.66,2.48,0.74,0,{stroke:"accent1",sw:2.4}),
    T_(1.5,2.33,5,0.3,"THE ASK",{size:10,bold:true,fill:"accent1",track:2.4,valign:"middle"}),
    T_(0.44,2.85,7.6,1,"Thirty days.",{size:46,bold:true,valign:"middle"}),
    L_(0.48,4.0,6.1,0,{stroke:"ink",sw:2}),
    T_(0.46,4.2,7.2,1.4,"One market, one owner, one baseline. If it does not pay back inside a quarter, we stop.",{size:15.5,fill:"mist"})];
  for(let i=0;i<3;i++){ const y=2.5+i*1.25, a=i===0?"accent2":"faint";
    o.push(C_(8.4,y,4.46,1.05,{stroke:a,sw:i===0?1.8:1.2}),
      T_(8.62,y+0.14,4,0.34,["Approve the pilot","Name the owner","Set the kill date"][i],{size:14.5,bold:true,valign:"middle"}),
      T_(8.62,y+0.5,4,0.42,"What you are agreeing to.",{size:12,fill:"mist"})); }
  return o; }},

{ id:"t-thankyou", name:"Thank you", group:"Close", build:()=>[
  T_(0.6,2.8,12,1.4,"Thank you",{size:60,bold:true,valign:"middle"}),
  L_(0.62,4.3,5,0,{stroke:"accent1",sw:3}),
  T_(0.6,4.6,8,0.5,"Questions, and then the decision.",{size:18,fill:"mist"}),
  K_(0.6,5.6,0.5,1,"accent1"), K_(1.24,5.6,0.5,2,"accent2")]},

{ id:"t-cta", name:"Call to action", group:"Close", build:()=>[
  ...EYEBROW("NEXT STEP"),
  T_(0.5,2.2,12.3,1.2,"One decision, this week.",{size:44,bold:true,align:"center",valign:"middle"}),
  T_(0.5,3.5,12.3,0.6,"Everything else can wait. This cannot.",{size:19,fill:"mist",align:"center"}),
  C_(4.4,4.5,4.5,1.1,{stroke:"accent2",sw:2.6,glow:true}),
  T_(4.4,4.5,4.5,1.1,"Approve the pilot",{size:20,bold:true,fill:"accent2",align:"center",valign:"middle"})]},

{ id:"t-contact", name:"Contact", group:"Close", build:()=>{
  const o=[...EYEBROW("CONTACT"), TITLE("Where to find the detail")];
  for(let i=0;i<3;i++){ const x=0.5+i*4.2, a=alt(i);
    o.push(C_(x,2,3.9,3,{stroke:a,sw:1.6}), R_(x+1.45,2.4,1,1,{stroke:a,sw:2,r:6}),
      T_(x,3.7,3.9,0.4,["Name","Email","Deck"][i],{size:16,bold:true,align:"center"}),
      T_(x,4.2,3.9,0.4,"detail line",{size:13,fill:"mist",align:"center"})); }
  return o; }},

{ id:"t-hexpath", name:"Hex pathways", group:"Circuit", build:()=>[
  ...EYEBROW("THE ROUTE"), TITLE("Two paths, one destination"),
  M_(0.6,2.2,2.2,2.2,"splitring",{stroke:"accent1",fill:"accent2"}),
  M_(3.3,1.9,6.4,1.2,"hexpath",{stroke:"accent2",traces:7}),
  M_(3.3,3.5,6.4,1.2,"hexpath",{stroke:"accent1",traces:7}),
  M_(10.3,2.1,2.4,2.4,"hexnest",{stroke:"accent1",fill:"accent2"}),
  T_(3.3,1.55,6.4,0.3,"THE GOVERNED PATH",{size:10.5,bold:true,fill:"accent2",track:2}),
  T_(3.3,4.85,6.4,0.3,"THE AD HOC PATH",{size:10.5,bold:true,fill:"accent1",track:2}),
  ...VERDICT("Same destination. Only one of them is repeatable.")]},

{ id:"t-platforms", name:"Locked platforms", group:"Circuit", build:()=>{
  const o=[...EYEBROW("ACCESS"), TITLE("Three tiers, two of them sealed")];
  [[1.4,4.6,false],[5.2,3.4,true],[9.0,2.2,false]].forEach(([x,y,open],i)=>{
    o.push(M_(x,y,3.1,1.6,"isoplatform",{stroke:i===2?"accent1":"accent2",open}),
      L_(x+3.1,y+0.7,0.5,0,{stroke:"faint",sw:1.2,term:true}),
      T_(x,y-0.5,3.1,0.3,["Locked","Open","Sealed"][i],{size:13,bold:true,align:"center"})); });
  return [...o, ...VERDICT("Access is a decision, not an accident.")]; }},

{ id:"t-gauges", name:"Gauges", group:"Circuit", build:()=>[
  ...EYEBROW("INSTRUMENTS"), TITLE("Two dials, one story"),
  M_(1.6,1.9,3.4,3.4,"gauge",{stroke:"accent2",pct:0.8}),
  M_(8.3,1.9,3.4,3.4,"gauge",{stroke:"accent1",pct:0.7}),
  T_(1.6,5.5,3.4,0.4,"THROUGHPUT",{size:12,bold:true,fill:"accent2",align:"center",track:2}),
  T_(8.3,5.5,3.4,0.4,"GOVERNANCE",{size:12,bold:true,fill:"accent1",align:"center",track:2}),
  L_(5.2,3.6,2.9,0,{stroke:"faint",sw:1.4,dash:"6 4",term:true}),
  ...VERDICT("The second dial is the one nobody is watching.")]},

{ id:"t-faders", name:"Fader tracks", group:"Circuit", build:()=>{
  const o=[...EYEBROW("THE MIX"), TITLE("What is turned up, and what is not")];
  [[0.8,0.85,"accent2"],[3.9,0.8,"accent2"],[7.0,0.2,"faint"],[10.1,0.2,"faint"]].forEach(([x,lv,a],i)=>{
    o.push(M_(x,1.7,2.4,3.9,"fader",{stroke:a,level:lv}),
      T_(x,5.75,2.4,0.34,"Track "+(i+1),{size:12.5,bold:true,align:"center",fill:i<2?"ink":"mist"})); });
  return [...o, ...VERDICT("Two channels carry the signal. Two are noise you pay for.")]; }},

{ id:"t-vault", name:"The vault", group:"Blueprint", build:()=>[
  ...EYEBROW("THE SYSTEM"), TITLE("Five gates, one clockwise flow"),
  M_(4.3,1.1,5,5,"vault",{stroke:"ink",fill:"accent2"}),
  C_(0.5,1.5,3.5,1.5,{stroke:"ink",sw:2}), T_(0.75,1.8,3,0.9,"What goes in, and who signs it off.",{size:13,fill:"mist"}),
  C_(9.3,1.5,3.5,1.5,{stroke:"accent2",sw:2}), T_(9.55,1.8,3,0.9,"What comes out, and when it is reviewed.",{size:13,fill:"mist"}),
  L_(4.0,2.25,0.3,0,{stroke:"faint",sw:1.3,term:true}), L_(9.0,2.25,0.3,0,{stroke:"faint",sw:1.3,term:true}),
  ...VERDICT("The gate is the system. Everything else is traffic.")]},

{ id:"t-layers", name:"Layer stack", group:"Blueprint", build:()=>[
  ...EYEBROW("ARCHITECTURE"), TITLE("Three planes, one data layer"),
  M_(3.4,1.2,6.5,4.8,"hexstack",{stroke:"accent1",fill:"accent2",layers:3}),
  C_(0.5,1.5,2.6,1.1,{stroke:"accent1",sw:1.8}), T_(0.7,1.72,2.2,0.7,"Interface",{size:14,bold:true}),
  C_(0.5,3.1,2.6,1.1,{stroke:"accent2",sw:1.8}), T_(0.7,3.32,2.2,0.7,"Knowledge",{size:14,bold:true}),
  C_(0.5,4.7,2.6,1.1,{stroke:"ink",sw:1.8}), T_(0.7,4.92,2.2,0.7,"Data",{size:14,bold:true}),
  L_(3.1,2.05,0.5,0,{stroke:"faint",sw:1.2,dash:"5 4",term:true}),
  L_(3.1,3.65,0.5,0,{stroke:"faint",sw:1.2,dash:"5 4",term:true}),
  L_(3.1,5.25,0.5,0,{stroke:"faint",sw:1.2,dash:"5 4",term:true}),
  ...VERDICT("The bottom plane is the only one nobody can see, and the only one that matters.")]},

{ id:"t-gearcross", name:"Governed loop", group:"Blueprint", build:()=>{
  const o=[...EYEBROW("GOVERNANCE"), TITLE("Four spaces, one clock"),
    M_(1.4,1.2,8.4,4.9,"gearcross",{stroke:"ink",fill:"accent2"}),
    C_(10.3,1.05,2.6,5.2,{fill:"sidebar",stroke:"ink",sw:2}),
    R_(10.32,1.07,2.56,0.44,{fill:"ink"}),
    T_(10.32,1.07,2.56,0.44,"REGISTER",{size:12,bold:true,fill:"ground",align:"center",track:1.4,valign:"middle"})];
  for(let i=0;i<4;i++){ const y=1.75+i*1.1;
    o.push(R_(10.48,y,2.26,0.9,{fill:"panel",stroke:"faint",sw:1.2}),
      T_(10.66,y+0.1,2,0.3,"Lane "+String.fromCharCode(65+i),{size:13,bold:true}),
      T_(10.66,y+0.44,2,0.34,"owner · cadence",{size:11,fill:"mist"})); }
  return [...o, ...VERDICT("Every space has an owner and a review date.")]; }},

{ id:"t-shield", name:"Shield and controls", group:"Blueprint", build:()=>{
  const o=[...EYEBROW("SECURITY"), TITLE("What is protected, and how"),
    M_(0.9,1.4,4.6,4.6,"shield",{stroke:"ink",fill:"accent2",blue:true})];
  for(let i=0;i<3;i++){ const y=1.6+i*1.5;
    o.push(C_(6.6,y,6.2,1.2,{stroke:"ink",sw:1.8}),
      R_(6.85,y+0.28,0.6,0.6,{stroke:"accent2",sw:1.8}),
      T_(7.7,y+0.2,4.9,0.36,["Data at rest","Access control","Audit trail"][i],{size:15,bold:true,valign:"middle"}),
      T_(7.7,y+0.62,4.9,0.42,"One line on the control and who owns it.",{size:12,fill:"mist"})); }
  o.push(C_(0.5,6.2,12.3,0.0,{stroke:"accent2",sw:2}));
  return [...o, ...VERDICT("Protection is a control with an owner, not a promise.")]; }},

{ id:"t-gantt", name:"Gantt chevrons", group:"Blueprint", build:()=>[
  ...EYEBROW("THE PLAN"), TITLE("Four phases, cascading"),
  M_(0.6,1.5,12.2,4.5,"gantt",{stroke:"ink",fill:"accent2",cols:14,bars:4,blue:true}),
  T_(0.6,6.05,12.2,0.3,"W1    W2    W3    W4    W5    W6    W7    W8    W9    W10   W11   W12   W13   W14",{size:10.5,fill:"faint"}),
  ...VERDICT("Each phase starts before the last one finishes. That is the point.")]},

{ id:"t-badges", name:"Badge table", group:"Blueprint", build:()=>{
  const o=[...EYEBROW("CONTROLS"), TITLE("Seven checks, seven owners"),
    C_(0.5,1.5,12.3,4.6,{stroke:"ink",sw:2.4,dbl:false})];
  for(let i=0;i<6;i++){ const y=1.75+i*0.72;
    o.push(T_(0.85,y,8,0.5,"Control "+(i+1)+": what it prevents",{size:13.5,valign:"middle"}),
      M_(9.4,y+0.06,3,0.44,"pill",{stroke:"ink",fill:"accent2"}),
      T_(10.05,y+0.06,2.2,0.44,"PASS",{size:11,bold:true,fill:"accent2",valign:"middle",track:1.2}),
      L_(0.85,y+0.56,11.6,0,{stroke:"grid",sw:1})); }
  return [...o, ...VERDICT("A control without an owner is a wish.")]; }},

{ id:"t-chevron3", name:"Three stages, chevrons", group:"Blueprint", build:()=>{
  const o=[...EYEBROW("THE ARC"), TITLE("From here, to here, to here")];
  [0.5,4.9,9.3].forEach((x,i)=>{
    o.push(C_(x,1.6,3.5,3.9,{stroke:i===2?"accent2":"ink",sw:i===2?2.6:2}),
      K_(x+0.25,1.9,0.5,i+1,i===2?"accent2":"ink"),
      T_(x+0.25,2.7,3,0.5,["Today","In motion","Governed"][i],{size:18,bold:true}),
      T_(x+0.25,3.4,3,1.6,"What is true at this stage, in one sentence.",{size:13,fill:"mist"}));
    if(i<2) o.push(M_(x+3.6,2.9,1.2,0.9,"chevron",{stroke:"ink",fill:"accent2"})); });
  return [...o, ...VERDICT("The middle box is where the money is spent. The right one is where it is earned.")]; }},

{ id:"t-blank", name:"Blank", group:"Close", build:()=>[] }
];

/* the 40 master layouts, ported from the original PPTX, appended below */
/*M40*/

/* ---------- build a slide from a template ---------- */
const ALL_TEMPLATES = () => (typeof TEMPLATES_M40 !== "undefined") ? [...TEMPLATES, ...TEMPLATES_M40] : TEMPLATES;
function fromTemplate(id){
  const t = ALL_TEMPLATES().find(x => x.id === id);
  Z = 0;
  // no grid value here: the THEME decides it (Blueprint 25, Circuit 50, Console 24)
  const chrome = (t && t.chrome) ? { ...t.chrome } : {};   // empty = inherit the theme's chrome
  return { id: uid(), name: t ? t.name : "Slide", objects: t ? t.build() : [], chrome };
}

if (typeof module !== "undefined") module.exports = { THEMES, ROLES, TEMPLATES, ALL_TEMPLATES, FONTS, FONT_PPTX, fontOf, fromTemplate, renderSlide, drawObj, chrome, CW, CH, SW, SH, PPI, uid, deviceSkin, brandObjects, resolveSrc, BRAND_CORNERS };
