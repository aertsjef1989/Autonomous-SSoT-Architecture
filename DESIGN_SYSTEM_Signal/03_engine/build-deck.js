#!/usr/bin/env node
/* ============================================================
   SIGNAL DECK BUILDER
   Deck definition in, a real .pptx out.

     node build-deck.js my-deck.json out.pptx

   Each slide renders through the Signal engine at 2752x1536 and is
   placed full bleed on a 13.3 x 7.5 inch canvas. The talking points
   also go into the speaker notes, so you are not reading off the wall.

   A deck definition is an array. Each entry:
     {
       layout:  "hero-callouts" | "compare" | "metrics" | "flow"
              | "map-sidebar" | "escalation" | "cover" | "decision",
       edition: "light" | "dark",
       detail:  0 to 3,
       hero:    any device id, H01 to H56,
       params:  { any of that device's levers },
       ...the content fields for the layout
     }
   ============================================================ */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const PptxGenJS = require("pptxgenjs");
const { slide, STD, stdPptx, SKIN, chromeSvg } = require("./signal-slide.js");

const IN  = process.argv[2] || "deck.json";
const OUT = process.argv[3] || "deck.pptx";

async function main(){
  const deck = JSON.parse(fs.readFileSync(IN, "utf8"));
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";                    // 13.3 x 7.5 in. Set BEFORE adding slides.
  pres.author = "Signal";
  pres.title  = deck.title || "Signal deck";

  const slides = Array.isArray(deck) ? deck : deck.slides;
  console.log(`building ${slides.length} slides`);

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const ed = s.edition || "light";
    const S = { ...SKIN[ed], ...(s.palette || {}) };

    // STANDARD layouts go in as NATIVE shapes and text: editable after export.
    if (STD[s.layout]) {
      const sl = pres.addSlide();
      sl.background = { color: (ed === "dark") ? "0B0C10" : "F5F4EF" };
      // same grid and corner circuitry as the artwork slides, painted behind the text
      const bg = await sharp(Buffer.from(chromeSvg(ed, { grid: s.grid ?? 24, corners: s.corners ?? 7,
                   texture: s.texture ?? 0, palette: s.palette || {} })), { density: 160 })
                 .resize(2752, 1536, { fit: "fill" }).png().toBuffer();
      sl.addImage({ data: "image/png;base64," + bg.toString("base64"), x: 0, y: 0, w: 13.3, h: 7.5 });
      stdPptx(s.layout, sl, s, S, pres);
      const notes = [];
      if (s.title) notes.push(s.title.toUpperCase());
      (s.items || s.cards || s.milestones || s.tracks || []).forEach((k, j) =>
        notes.push(`${j + 1}. ${k.head || k}${k.body ? " — " + k.body : ""}`));
      if (s.verdict) notes.push("", "VERDICT: " + s.verdict);
      if (notes.length) sl.addNotes(notes.join("\n"));
      console.log(`  ${String(i + 1).padStart(2)}. ${s.layout.padEnd(14)} ${ed.padEnd(6)} native (editable text)`);
      continue;
    }

    const svg = slide(s.layout, s, ed, {
      detail:    s.detail    ?? 2,
      heroScale: s.heroScale ?? 1,
      grid:      s.grid      ?? 24,
      corners:   s.corners   ?? 7,
      texture:   s.texture   ?? 0,
      palette:   s.palette   || {}
    });

    // rasterise at 2x the slide's native size: crisp on a 4K screen and in print
    const png = await sharp(Buffer.from(svg), { density: 220 })
      .resize(2752, 1536, { fit: "fill" })
      .png()
      .toBuffer();

    const sl = pres.addSlide();
    sl.background = { color: (s.edition === "dark") ? "0B0C10" : "F5F4EF" };  // no #, never 8 digits
    sl.addImage({ data: "image/png;base64," + png.toString("base64"),
                  x: 0, y: 0, w: 13.3, h: 7.5 });

    // the talking points become the speaker notes
    const notes = [];
    if (s.title)   notes.push(s.title.toUpperCase());
    (s.callouts || s.tiers || s.stations || []).forEach((k, j) =>
      notes.push(`${j + 1}. ${k.head}${k.body ? " — " + k.body : ""}`));
    (s.cells || []).forEach(c => notes.push(`${c.label}: ${c.value} ${c.unit || ""}`.trim()));
    if (s.verdict) notes.push("", "VERDICT: " + s.verdict);
    if (s.sub)     notes.push(s.sub);
    if (notes.length) sl.addNotes(notes.join("\n"));

    const els = (svg.match(/<(path|rect|circle|line|polygon|text)/g) || []).length;
    console.log(`  ${String(i + 1).padStart(2)}. ${s.layout.padEnd(14)} ${(s.edition || "light").padEnd(6)} detail ${s.detail ?? 2}  ${String(els).padStart(4)} elements`);
  }

  await pres.writeFile({ fileName: OUT });
  console.log(`\nwrote ${OUT}`);
}
main().catch(e => { console.error(e); process.exit(1); });
