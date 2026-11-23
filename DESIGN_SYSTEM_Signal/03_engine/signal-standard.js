/* ============================================================
   SIGNAL STANDARD LAYOUTS
   The ordinary slides every deck needs: agenda, bullets, tables,
   timelines, quotes, closing.

   Each layout is defined ONCE, in inches, and rendered two ways:
     svg(content, S)        for the studio preview and SVG export
     pptx(slide, content, S) as NATIVE PowerPoint shapes and text

   That second one is the point. Artwork slides go into a deck as
   images because the shading costs 3000 elements. These do not:
   they arrive as real text boxes you can edit after export.

   Canvas: 13.3 x 7.5in  ==  1376 x 768px in the SVG preview.
   ============================================================ */
const PX = 1376 / 13.3, PY = 768 / 7.5;                 // in -> px
const X = i => +(i * PX).toFixed(1), Y = i => +(i * PY).toFixed(1);
const HEX = c => (c || "").replace("#", "");            // pptxgenjs: never '#', never 8 digits

/* ---------- SVG helpers (preview) ---------- */
const sq = (x,y,w,h,o={}) => `<rect x="${X(x)}" y="${Y(y)}" width="${X(w)}" height="${Y(h)}" rx="${o.r||0}" fill="${o.fill||"none"}" stroke="${o.stroke||"none"}" stroke-width="${o.sw||2}"/>`;
const ln = (x1,y1,x2,y2,c,w=1.4) => `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${c}" stroke-width="${w}"/>`;
const ci = (x,y,r,o={}) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${X(r)}" fill="${o.fill||"none"}" stroke="${o.stroke||"none"}" stroke-width="${o.sw||1.5}"/>`;
const escS = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const tx = (x,y,t,o={}) => t==null||t==="" ? "" :
  `<text x="${X(x)}" y="${Y(y)}" fill="${o.color}" font-family="Carlito, Calibri, sans-serif" font-size="${(o.size||14)*1.34}" font-weight="${o.bold?700:400}" text-anchor="${o.align==="center"?"middle":o.align==="right"?"end":"start"}" letter-spacing="${o.track||0}">${escS(t)}</text>`;
function wrapT(x,y,t,wIn,o={}){
  if(!t) return "";
  const cpl = Math.floor((wIn*72) / ((o.size||14)*0.5));
  const words=String(t).split(/\s+/); const lines=[]; let cur="";
  for(const w of words){ if((cur+" "+w).trim().length>cpl){lines.push(cur.trim());cur=w;} else cur+=" "+w; }
  if(cur.trim()) lines.push(cur.trim());
  return lines.map((l,i)=>tx(x, y + i*((o.size||14)*1.34/72), l, o)).join("");
}

/* ---------- shared chrome ---------- */
let BG = null;                       // injected by signal-slide.js: the shared chrome
function chrome(S, o={}){
  if (BG) return BG;
  let s = `<rect width="1376" height="768" fill="${S.ground}"/>`;
  s += `<defs><pattern id="sg" width="24" height="24" patternUnits="userSpaceOnUse">
    <path d="M24 0 L0 0 0 24" fill="none" stroke="${S.grid}" stroke-width="0.9"/></pattern></defs>`;
  s += `<rect width="1376" height="768" fill="url(#sg)"/>`;
  return s;
}
function head(S, c){
  let s = "";
  if (c.eyebrow) {
    s += sq(0.46, 0.33, 0.1, 0.1, { fill: S.pink });
    s += ln(0.62, 0.38, 1.06, 0.38, S.pink, 2);
    s += tx(1.16, 0.44, String(c.eyebrow).toUpperCase(), { color: S.pink, size: 9.5, bold: true, track: 2.2 });
  }
  s += tx(0.46, c.eyebrow ? 0.86 : 0.72, c.title, { color: S.ink, size: 27, bold: true });
  return s;
}
function pHead(sl, S, c, P){
  if (c.eyebrow) {
    sl.addShape(P.ShapeType.rect, { x:0.46, y:0.30, w:0.1, h:0.1, fill:{ color:HEX(S.pink) }, line:{ width:0 } });
    sl.addShape(P.ShapeType.line, { x:0.62, y:0.35, w:0.44, h:0, line:{ color:HEX(S.pink), width:2 } });
    sl.addText(String(c.eyebrow).toUpperCase(), { x:1.14, y:0.20, w:6, h:0.3, margin:0, fontFace:"Calibri",
      fontSize:9.5, bold:true, charSpacing:2.2, color:HEX(S.pink), valign:"middle" });
  }
  sl.addText(c.title || "", { x:0.44, y: c.eyebrow?0.52:0.38, w:12.4, h:0.62, margin:0, fontFace:"Calibri",
    fontSize:27, bold:true, color:HEX(S.ink), valign:"middle" });
}
function pCard(sl, S, P, x, y, w, h, accent){
  sl.addShape(P.ShapeType.roundRect, { x, y, w, h, rectRadius:0.06,
    fill:{ color:HEX(S.panel) }, line:{ color:HEX(accent || S.faint), width: accent?1.75:1 } });
}
function pVerdict(sl, S, c, P){
  if (!c.verdict) return;
  sl.addShape(P.ShapeType.roundRect, { x:0.4, y:6.52, w:12.5, h:0.7, rectRadius:0.06,
    fill:{ color:HEX(S.ink) }, line:{ width:0 } });
  sl.addText(c.verdict, { x:0.5, y:6.56, w:12.3, h:c.sub?0.36:0.62, margin:0, fontFace:"Calibri",
    fontSize:17, bold:true, color:HEX(S.ground), align:"center", valign:"middle" });
  if (c.sub) sl.addText(c.sub, { x:0.5, y:6.92, w:12.3, h:0.26, margin:0, fontFace:"Calibri",
    fontSize:11, color:HEX(S.faint), align:"center", valign:"middle" });
}
function svgVerdict(S, c){
  if (!c.verdict) return "";
  let s = sq(0.4, 6.52, 12.5, 0.7, { fill: S.ink, r: 6 });
  s += tx(6.65, c.sub ? 6.86 : 6.98, c.verdict, { color: S.ground, size: 17, bold: true, align: "center" });
  if (c.sub) s += tx(6.65, 7.14, c.sub, { color: S.faint, size: 11, align: "center" });
  return s;
}

/* ============================================================
   THE LAYOUTS
   ============================================================ */
const STD = {

/* ---- 1. agenda ---- */
"std-agenda": {
  label: "Agenda",
  svg: (c, S) => {
    let s = chrome(S) + head(S, c);
    const it = (c.items || []).slice(0, 8), col = Math.ceil(it.length / 2);
    it.forEach((k, i) => {
      const cx = i < col ? 0.5 : 6.9, y = 1.6 + (i % col) * 0.78;
      s += sq(cx, y, 5.9, 0.62, { stroke: S.faint, fill: S.panel, r: 5, sw: 1.2 });
      s += sq(cx + 0.14, y + 0.14, 0.34, 0.34, { fill: i === (c.active|0) ? S.cyan : S.ink, r: 3 });
      s += tx(cx + 0.31, y + 0.4, String(i + 1), { color: S.ground, size: 12, bold: true, align: "center" });
      s += tx(cx + 0.62, y + 0.41, k.head || k, { color: S.ink, size: 14, bold: true });
      if (k.body) s += tx(cx + 3.3, y + 0.41, k.body, { color: S.mist, size: 11.5 });
    });
    return s + svgVerdict(S, c);
  },
  pptx: (sl, c, S, P) => {
    pHead(sl, S, c, P);
    const it = (c.items || []).slice(0, 8), col = Math.ceil(it.length / 2);
    it.forEach((k, i) => {
      const x = i < col ? 0.5 : 6.9, y = 1.6 + (i % col) * 0.78;
      pCard(sl, S, P, x, y, 5.9, 0.62);
      sl.addShape(P.ShapeType.roundRect, { x: x+0.14, y: y+0.14, w:0.34, h:0.34, rectRadius:0.04,
        fill:{ color: HEX(i === (c.active|0) ? S.cyan : S.ink) }, line:{ width:0 } });
      sl.addText(String(i+1), { x:x+0.14, y:y+0.14, w:0.34, h:0.34, margin:0, fontFace:"Calibri",
        fontSize:12, bold:true, color:HEX(S.ground), align:"center", valign:"middle" });
      sl.addText(k.head || k, { x:x+0.6, y:y+0.05, w:2.6, h:0.5, margin:0, fontFace:"Calibri",
        fontSize:14, bold:true, color:HEX(S.ink), valign:"middle" });
      if (k.body) sl.addText(k.body, { x:x+3.28, y:y+0.05, w:2.5, h:0.5, margin:0, fontFace:"Calibri",
        fontSize:11.5, color:HEX(S.mist), valign:"middle" });
    });
    pVerdict(sl, S, c, P);
  }
},

/* ---- 2. section divider ---- */
"std-section": {
  label: "Section divider",
  svg: (c, S) => {
    let s = chrome(S);
    s += tx(0.5, 4.6, String(c.number || "01"), { color: S.grid, size: 170, bold: true });
    s += ln(0.52, 4.9, 7.6, 4.9, S.pink, 3);
    s += tx(0.5, 5.6, c.title, { color: S.ink, size: 40, bold: true });
    if (c.sub) s += wrapT(0.52, 6.1, c.sub, 8, { color: S.mist, size: 15 });
    return s;
  },
  pptx: (sl, c, S, P) => {
    sl.addText(String(c.number || "01"), { x:0.4, y:1.5, w:5, h:2.6, margin:0, fontFace:"Calibri",
      fontSize:150, bold:true, color:HEX(S.grid), valign:"middle" });
    sl.addShape(P.ShapeType.line, { x:0.5, y:4.78, w:6.9, h:0, line:{ color:HEX(S.pink), width:3 } });
    sl.addText(c.title || "", { x:0.44, y:4.95, w:11, h:0.8, margin:0, fontFace:"Calibri",
      fontSize:40, bold:true, color:HEX(S.ink), valign:"middle" });
    if (c.sub) sl.addText(c.sub, { x:0.46, y:5.8, w:8, h:0.5, margin:0, fontFace:"Calibri",
      fontSize:15, color:HEX(S.mist) });
  }
},

/* ---- 3. bullets ---- */
"std-bullets": {
  label: "Bulleted list",
  svg: (c, S) => {
    let s = chrome(S) + head(S, c);
    (c.items || []).slice(0, 7).forEach((k, i) => {
      const y = 1.75 + i * 0.62;
      s += sq(0.52, y - 0.14, 0.12, 0.12, { fill: i === 0 ? S.cyan : S.ink });
      s += tx(0.86, y, k.head || k, { color: S.ink, size: 15.5, bold: !!k.head });
      if (k.body) s += tx(0.86 + (String(k.head).length * 0.115), y, k.body, { color: S.mist, size: 13.5 });
    });
    if (c.note) { s += sq(8.9, 1.6, 3.98, 3.2, { stroke: S.cyan, fill: S.panel, r: 6, sw: 1.8 });
      s += tx(9.14, 2.05, (c.noteHead || "Note").toUpperCase(), { color: S.cyan, size: 10, bold: true, track: 1.6 });
      s += wrapT(9.14, 2.5, c.note, 3.5, { color: S.ink, size: 13 }); }
    return s + svgVerdict(S, c);
  },
  pptx: (sl, c, S, P) => {
    pHead(sl, S, c, P);
    const items = (c.items || []).slice(0, 7).map((k, i) => ({
      text: (k.head || k) + (k.body ? "  " + k.body : ""),
      options: { bullet: true, breakLine: true, fontSize: 15, bold: false,
                 color: HEX(S.ink), paraSpaceAfter: 10 }
    }));
    sl.addText(items, { x: 0.5, y: 1.5, w: c.note ? 7.9 : 12.3, h: 4.6, margin: 0, fontFace: "Calibri", valign: "top" });
    if (c.note) {
      pCard(sl, S, P, 8.9, 1.5, 4, 3.2, S.cyan);
      sl.addText((c.noteHead || "Note").toUpperCase(), { x:9.12, y:1.66, w:3.5, h:0.28, margin:0,
        fontFace:"Calibri", fontSize:10, bold:true, charSpacing:1.6, color:HEX(S.cyan) });
      sl.addText(c.note, { x:9.12, y:2.02, w:3.56, h:2.5, margin:0, fontFace:"Calibri", fontSize:13, color:HEX(S.ink) });
    }
    pVerdict(sl, S, c, P);
  }
},

/* ---- 4. card grid (2 x 3) ---- */
"std-cards": {
  label: "Card grid",
  svg: (c, S) => {
    let s = chrome(S) + head(S, c);
    (c.cards || []).slice(0, 6).forEach((k, i) => {
      const x = 0.5 + (i % 3) * 4.2, y = 1.6 + ((i / 3) | 0) * 2.35;
      const acc = k.accent || [S.cyan, S.ink, S.hot, S.ink, S.pink, S.ink][i];
      s += sq(x, y, 3.9, 2.05, { stroke: acc, fill: S.panel, r: 6, sw: 1.6 });
      s += sq(x + 0.22, y + 0.24, 0.4, 0.4, { fill: acc, r: 3 });
      s += tx(x + 0.42, y + 0.53, String(i + 1), { color: S.ground, size: 13, bold: true, align: "center" });
      s += tx(x + 0.8, y + 0.54, k.head, { color: S.ink, size: 15, bold: true });
      s += ln(x + 0.22, y + 0.86, x + 3.68, y + 0.86, S.grid, 1.2);
      s += wrapT(x + 0.22, y + 1.16, k.body, 3.4, { color: S.mist, size: 12.5 });
    });
    return s + svgVerdict(S, c);
  },
  pptx: (sl, c, S, P) => {
    pHead(sl, S, c, P);
    (c.cards || []).slice(0, 6).forEach((k, i) => {
      const x = 0.5 + (i % 3) * 4.2, y = 1.55 + ((i / 3) | 0) * 2.35;
      const acc = k.accent || [S.cyan, S.ink, S.hot, S.ink, S.pink, S.ink][i];
      pCard(sl, S, P, x, y, 3.9, 2.05, acc);
      sl.addShape(P.ShapeType.roundRect, { x:x+0.22, y:y+0.22, w:0.4, h:0.4, rectRadius:0.05,
        fill:{ color:HEX(acc) }, line:{ width:0 } });
      sl.addText(String(i+1), { x:x+0.22, y:y+0.22, w:0.4, h:0.4, margin:0, fontFace:"Calibri",
        fontSize:13, bold:true, color:HEX(S.ground), align:"center", valign:"middle" });
      sl.addText(k.head || "", { x:x+0.76, y:y+0.24, w:2.9, h:0.36, margin:0, fontFace:"Calibri",
        fontSize:15, bold:true, color:HEX(S.ink), valign:"middle" });
      sl.addShape(P.ShapeType.line, { x:x+0.22, y:y+0.78, w:3.46, h:0, line:{ color:HEX(S.grid), width:1 } });
      sl.addText(k.body || "", { x:x+0.2, y:y+0.9, w:3.5, h:1.0, margin:0, fontFace:"Calibri",
        fontSize:12.5, color:HEX(S.mist) });
    });
    pVerdict(sl, S, c, P);
  }
},

/* ---- 5. table ---- */
"std-table": {
  label: "Table",
  svg: (c, S) => {
    let s = chrome(S) + head(S, c);
    const cols = c.columns || [], rows = (c.rows || []).slice(0, 8);
    const w = 12.4 / cols.length;
    s += sq(0.46, 1.6, 12.4, 0.5, { fill: S.ink });
    cols.forEach((h2, i) => s += tx(0.62 + i * w, 1.94, String(h2).toUpperCase(), { color: S.ground, size: 11, bold: true, track: 1.2 }));
    rows.forEach((r, ri) => {
      const y = 2.1 + ri * 0.56;
      if (ri % 2) s += sq(0.46, y, 12.4, 0.56, { fill: S.panel });
      r.forEach((cell, i) => s += tx(0.62 + i * w, y + 0.36, cell, { color: i === 0 ? S.ink : S.mist, size: 13, bold: i === 0 }));
      s += ln(0.46, y + 0.56, 12.86, y + 0.56, S.grid, 1);
    });
    return s + svgVerdict(S, c);
  },
  pptx: (sl, c, S, P) => {
    pHead(sl, S, c, P);
    const cols = c.columns || [], rows = (c.rows || []).slice(0, 8);
    const head2 = cols.map(h2 => ({ text: String(h2).toUpperCase(),
      options: { fill: { color: HEX(S.ink) }, color: HEX(S.ground), bold: true, fontSize: 11 } }));
    const body = rows.map((r, ri) => r.map((cell, i) => ({ text: String(cell),
      options: { fill: { color: HEX(ri % 2 ? S.panel : S.ground) }, color: HEX(i === 0 ? S.ink : S.mist),
                 bold: i === 0, fontSize: 12.5 } })));
    sl.addTable([head2, ...body], { x: 0.46, y: 1.55, w: 12.4, fontFace: "Calibri",
      border: { type: "solid", color: HEX(S.grid), pt: 0.75 }, autoPage: false, valign: "middle", rowH: 0.5 });
    pVerdict(sl, S, c, P);
  }
},

/* ---- 6. timeline ---- */
"std-timeline": {
  label: "Timeline",
  svg: (c, S) => {
    let s = chrome(S) + head(S, c);
    const ms = (c.milestones || []).slice(0, 5), N = ms.length;
    s += ln(0.8, 3.5, 12.5, 3.5, S.ink, 3);
    ms.forEach((k, i) => {
      const x = 1.2 + i * ((11.2) / Math.max(N - 1, 1)), up = i % 2 === 0;
      const acc = k.accent || (i === N - 1 ? S.cyan : S.ink);
      s += ci(x, 3.5, 0.11, { fill: acc });
      s += ci(x, 3.5, 0.2, { stroke: acc, sw: 1.4 });
      s += ln(x, up ? 3.3 : 3.7, x, up ? 2.85 : 4.15, acc, 1.4);
      const cy = up ? 1.65 : 4.15;
      s += sq(x - 1.15, cy, 2.3, 1.2, { stroke: acc, fill: S.panel, r: 5, sw: 1.4 });
      s += tx(x, cy + 0.42, k.head, { color: S.ink, size: 13.5, bold: true, align: "center" });
      s += wrapT(x - 0.98, cy + 0.72, k.body, 2, { color: S.mist, size: 11.5, align: "center" });
      if (k.when) s += tx(x, up ? 3.95 : 3.15, k.when, { color: acc, size: 11, bold: true, align: "center" });
    });
    return s + svgVerdict(S, c);
  },
  pptx: (sl, c, S, P) => {
    pHead(sl, S, c, P);
    const ms = (c.milestones || []).slice(0, 5), N = ms.length;
    sl.addShape(P.ShapeType.line, { x: 0.8, y: 3.42, w: 11.7, h: 0, line: { color: HEX(S.ink), width: 3 } });
    ms.forEach((k, i) => {
      const x = 1.2 + i * (11.2 / Math.max(N - 1, 1)), up = i % 2 === 0;
      const acc = k.accent || (i === N - 1 ? S.cyan : S.ink);
      sl.addShape(P.ShapeType.ellipse, { x: x - 0.11, y: 3.31, w: 0.22, h: 0.22, fill: { color: HEX(acc) }, line: { width: 0 } });
      sl.addShape(P.ShapeType.line, { x, y: up ? 2.8 : 3.5, w: 0, h: 0.5, line: { color: HEX(acc), width: 1.4 } });
      const cy = up ? 1.6 : 4.05;
      pCard(sl, S, P, x - 1.15, cy, 2.3, 1.2, acc);
      sl.addText(k.head || "", { x: x - 1.1, y: cy + 0.12, w: 2.2, h: 0.32, margin: 0, fontFace: "Calibri",
        fontSize: 13.5, bold: true, color: HEX(S.ink), align: "center", valign: "middle" });
      sl.addText(k.body || "", { x: x - 1.08, y: cy + 0.46, w: 2.16, h: 0.66, margin: 0, fontFace: "Calibri",
        fontSize: 11.5, color: HEX(S.mist), align: "center" });
      if (k.when) sl.addText(k.when, { x: x - 0.7, y: up ? 3.72 : 2.9, w: 1.4, h: 0.28, margin: 0,
        fontFace: "Calibri", fontSize: 11, bold: true, color: HEX(acc), align: "center" });
    });
    pVerdict(sl, S, c, P);
  }
},

/* ---- 7. checklist: do and avoid ---- */
"std-checklist": {
  label: "Do / avoid",
  svg: (c, S) => {
    let s = chrome(S) + head(S, c);
    [[0.5, c.doHead || "Do", c.dos || [], S.cyan, true], [6.9, c.avoidHead || "Avoid", c.avoids || [], S.pink, false]]
      .forEach(([x, h2, items, acc, good]) => {
        s += sq(x, 1.6, 5.9, 4.5, { stroke: acc, fill: S.panel, r: 6, sw: 1.8 });
        s += sq(x, 1.6, 5.9, 0.5, { fill: acc, r: 6 });
        s += tx(x + 2.95, 1.94, String(h2).toUpperCase(), { color: S.ground, size: 12, bold: true, align: "center", track: 1.6 });
        items.slice(0, 6).forEach((k, i) => {
          const y = 2.5 + i * 0.6;
          s += ci(x + 0.35, y - 0.06, 0.11, { stroke: acc, sw: 1.6 });
          s += good ? `<path d="M${X(x + 0.29)} ${Y(y - 0.06)} l${X(0.045)} ${Y(0.06)} l${X(0.09)} ${Y(-0.11)}" stroke="${acc}" stroke-width="2" fill="none"/>`
                    : ln(x + 0.3, y - 0.11, x + 0.4, y - 0.01, acc, 1.6) + ln(x + 0.4, y - 0.11, x + 0.3, y - 0.01, acc, 1.6);
          s += tx(x + 0.62, y, k, { color: good ? S.ink : S.mist, size: 13.5, bold: good });
        });
      });
    return s + svgVerdict(S, c);
  },
  pptx: (sl, c, S, P) => {
    pHead(sl, S, c, P);
    [[0.5, c.doHead || "Do", c.dos || [], S.cyan, true], [6.9, c.avoidHead || "Avoid", c.avoids || [], S.pink, false]]
      .forEach(([x, h2, items, acc, good]) => {
        pCard(sl, S, P, x, 1.55, 5.9, 4.5, acc);
        sl.addShape(P.ShapeType.roundRect, { x, y: 1.55, w: 5.9, h: 0.5, rectRadius: 0.06,
          fill: { color: HEX(acc) }, line: { width: 0 } });
        sl.addText(String(h2).toUpperCase(), { x, y: 1.55, w: 5.9, h: 0.5, margin: 0, fontFace: "Calibri",
          fontSize: 12, bold: true, charSpacing: 1.6, color: HEX(S.ground), align: "center", valign: "middle" });
        const rows = items.slice(0, 6).map(k => ({ text: k, options: { bullet: { code: good ? "2713" : "2717" },
          fontSize: 13.5, bold: !!good, color: HEX(good ? S.ink : S.mist), breakLine: true, paraSpaceAfter: 8 } }));
        sl.addText(rows, { x: x + 0.25, y: 2.2, w: 5.4, h: 3.6, margin: 0, fontFace: "Calibri", valign: "top" });
      });
    pVerdict(sl, S, c, P);
  }
},

/* ---- 8. quote ---- */
"std-quote": {
  label: "Quote",
  svg: (c, S) => {
    let s = chrome(S);
    s += tx(0.7, 2.4, "\u201C", { color: S.pink, size: 120, bold: true });
    s += wrapT(1.7, 2.5, c.quote, 10.4, { color: S.ink, size: 27, bold: true });
    s += ln(1.72, 5.3, 4.2, 5.3, S.pink, 3);
    s += tx(1.7, 5.75, c.who, { color: S.ink, size: 15, bold: true });
    if (c.role) s += tx(1.7, 6.1, c.role, { color: S.mist, size: 13 });
    return s;
  },
  pptx: (sl, c, S, P) => {
    sl.addText("\u201C", { x: 0.45, y: 1.1, w: 1.4, h: 1.8, margin: 0, fontFace: "Calibri",
      fontSize: 110, bold: true, color: HEX(S.pink), valign: "middle" });
    sl.addText(c.quote || "", { x: 1.65, y: 1.6, w: 10.6, h: 3.2, margin: 0, fontFace: "Calibri",
      fontSize: 27, bold: true, color: HEX(S.ink), valign: "top" });
    sl.addShape(P.ShapeType.line, { x: 1.7, y: 5.2, w: 2.5, h: 0, line: { color: HEX(S.pink), width: 3 } });
    sl.addText(c.who || "", { x: 1.66, y: 5.35, w: 8, h: 0.34, margin: 0, fontFace: "Calibri",
      fontSize: 15, bold: true, color: HEX(S.ink) });
    if (c.role) sl.addText(c.role, { x: 1.66, y: 5.72, w: 8, h: 0.3, margin: 0, fontFace: "Calibri",
      fontSize: 13, color: HEX(S.mist) });
  }
},

/* ---- 9. progress / status ---- */
"std-progress": {
  label: "Progress bars",
  svg: (c, S) => {
    let s = chrome(S) + head(S, c);
    (c.tracks || []).slice(0, 6).forEach((k, i) => {
      const y = 1.9 + i * 0.78, pct = Math.max(0, Math.min(100, k.pct || 0));
      const acc = k.accent || (pct >= 100 ? S.cyan : pct < 34 ? S.pink : S.hot);
      s += tx(0.5, y, k.head, { color: S.ink, size: 14, bold: true });
      s += tx(12.86, y, pct + "%", { color: acc, size: 14, bold: true, align: "right" });
      s += sq(0.5, y + 0.14, 12.36, 0.28, { fill: S.grid, r: 4 });
      s += sq(0.5, y + 0.14, 12.36 * pct / 100, 0.28, { fill: acc, r: 4 });
      if (k.body) s += tx(0.5, y + 0.66, k.body, { color: S.mist, size: 11.5 });
    });
    return s + svgVerdict(S, c);
  },
  pptx: (sl, c, S, P) => {
    pHead(sl, S, c, P);
    (c.tracks || []).slice(0, 6).forEach((k, i) => {
      const y = 1.7 + i * 0.78, pct = Math.max(0, Math.min(100, k.pct || 0));
      const acc = k.accent || (pct >= 100 ? S.cyan : pct < 34 ? S.pink : S.hot);
      sl.addText(k.head || "", { x: 0.48, y, w: 8, h: 0.28, margin: 0, fontFace: "Calibri",
        fontSize: 14, bold: true, color: HEX(S.ink), valign: "middle" });
      sl.addText(pct + "%", { x: 11.4, y, w: 1.46, h: 0.28, margin: 0, fontFace: "Calibri",
        fontSize: 14, bold: true, color: HEX(acc), align: "right", valign: "middle" });
      sl.addShape(P.ShapeType.roundRect, { x: 0.48, y: y + 0.3, w: 12.38, h: 0.28, rectRadius: 0.04,
        fill: { color: HEX(S.grid) }, line: { width: 0 } });
      sl.addShape(P.ShapeType.roundRect, { x: 0.48, y: y + 0.3, w: Math.max(0.08, 12.38 * pct / 100), h: 0.28,
        rectRadius: 0.04, fill: { color: HEX(acc) }, line: { width: 0 } });
      if (k.body) sl.addText(k.body, { x: 0.48, y: y + 0.6, w: 11, h: 0.24, margin: 0, fontFace: "Calibri",
        fontSize: 11.5, color: HEX(S.mist) });
    });
    pVerdict(sl, S, c, P);
  }
},

/* ---- 10. closing ---- */
"std-closing": {
  label: "Closing",
  svg: (c, S) => {
    let s = chrome(S);
    s += sq(0.46, 2.5, 0.12, 0.12, { fill: S.pink });
    s += ln(0.66, 2.56, 1.4, 2.56, S.pink, 2.4);
    s += tx(1.52, 2.62, (c.eyebrow || "Next step").toUpperCase(), { color: S.pink, size: 10, bold: true, track: 2.4 });
    s += tx(0.46, 3.7, c.title, { color: S.ink, size: 46, bold: true });
    s += ln(0.48, 4.1, 6.6, 4.1, S.ink, 2);
    s += wrapT(0.48, 4.55, c.sub, 7, { color: S.mist, size: 15.5 });
    (c.asks || []).slice(0, 3).forEach((k, i) => {
      const x = 8.4, y = 2.6 + i * 1.25;
      s += sq(x, y, 4.46, 1.05, { stroke: i === 0 ? S.cyan : S.faint, fill: S.panel, r: 6, sw: i === 0 ? 1.8 : 1.2 });
      s += tx(x + 0.24, y + 0.44, k.head, { color: S.ink, size: 14.5, bold: true });
      s += tx(x + 0.24, y + 0.78, k.body, { color: S.mist, size: 12 });
    });
    return s;
  },
  pptx: (sl, c, S, P) => {
    sl.addShape(P.ShapeType.rect, { x: 0.46, y: 2.42, w: 0.12, h: 0.12, fill: { color: HEX(S.pink) }, line: { width: 0 } });
    sl.addShape(P.ShapeType.line, { x: 0.66, y: 2.48, w: 0.74, h: 0, line: { color: HEX(S.pink), width: 2.4 } });
    sl.addText((c.eyebrow || "Next step").toUpperCase(), { x: 1.5, y: 2.33, w: 5, h: 0.3, margin: 0,
      fontFace: "Calibri", fontSize: 10, bold: true, charSpacing: 2.4, color: HEX(S.pink), valign: "middle" });
    sl.addText(c.title || "", { x: 0.44, y: 2.85, w: 7.6, h: 1, margin: 0, fontFace: "Calibri",
      fontSize: 46, bold: true, color: HEX(S.ink), valign: "middle" });
    sl.addShape(P.ShapeType.line, { x: 0.48, y: 4.0, w: 6.1, h: 0, line: { color: HEX(S.ink), width: 2 } });
    sl.addText(c.sub || "", { x: 0.46, y: 4.2, w: 7.2, h: 1.2, margin: 0, fontFace: "Calibri",
      fontSize: 15.5, color: HEX(S.mist) });
    (c.asks || []).slice(0, 3).forEach((k, i) => {
      const x = 8.4, y = 2.5 + i * 1.25;
      pCard(sl, S, P, x, y, 4.46, 1.05, i === 0 ? S.cyan : null);
      sl.addText(k.head || "", { x: x + 0.22, y: y + 0.14, w: 4, h: 0.34, margin: 0, fontFace: "Calibri",
        fontSize: 14.5, bold: true, color: HEX(S.ink), valign: "middle" });
      sl.addText(k.body || "", { x: x + 0.22, y: y + 0.5, w: 4, h: 0.42, margin: 0, fontFace: "Calibri",
        fontSize: 12, color: HEX(S.mist) });
    });
  }
}
};

const STD_KEYS = Object.keys(STD);
const stdSvg  = (layout, c, S, bg) => { BG = bg || null;
  const body = STD[layout].svg(c, S); BG = null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1376 768" width="1376" height="768">${body}</svg>`; };
const stdPptx = (layout, sl, c, S, P) => STD[layout].pptx(sl, c, S, P);

module.exports = { STD, STD_KEYS, stdSvg, stdPptx };
