/* ============================================================
   SIGNAL SLIDES  v3
   The unit is not an icon. It is a SLIDE THAT ARGUES ONE THING.
   1376 x 768, full bleed, dense, with a hero device, callouts on
   leader lines, and a verdict bar.

   Palette measured from the source deck, not invented:
     paper  #F5F4EF   ink   #203048   emerald #188860
     orange #F07028   rose  #C0504A   sidebar #C5CCD2
   Target ink coverage 25 to 40 percent. Sparse reads as unfinished.

   Unlike the raster track, CODE CAN CARRY TYPE. Text here is real
   vector type in Carlito, so it is crisp, editable and translatable.
   ============================================================ */
const K = require('./signal-detail.js');
const SH = require('./signal-shade.js');
const STDMOD = require('./signal-standard.js');
const { HEROES, n, L, R, C, P, POLY, G, trace, node, arrow, corner, gear } = K;
const { enrich, shadeDefs } = SH;

const W = 1376, H = 768;

const SKIN = {
  light: {
    ground:"#F5F4EF", panel:"#FFFFFF", sidebar:"#C5CCD2", grid:"#E2E4E1",
    ink:"#203048", white:"#203048", mist:"#8A939E", faint:"#B6BDC5",
    hatch:"#DCE0E3", cyan:"#188860", pink:"#C0504A", hot:"#F07028",
    glow:false, rule:"#203048"
  },
  dark: {
    ground:"#0B0C10", panel:"#15171F", sidebar:"#1E2230", grid:"#1A1D26",
    ink:"#FFFFFF", white:"#FFFFFF", mist:"#B9C0CE", faint:"#7A828F",
    hatch:"#2A2E3A", cyan:"#21E0DC", pink:"#F0245C", hot:"#FF7A3D",
    glow:true, rule:"#2A2E3A"
  }
};

const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const T = (x,y,txt,o={}) => txt ? `<text x="${n(x)}" y="${n(y)}" fill="${o.fill}" font-family="Carlito, Calibri, sans-serif" font-size="${o.size||16}" font-weight="${o.weight||400}" text-anchor="${o.anchor||"start"}" letter-spacing="${o.track||0}">${esc(txt)}</text>` : "";

// wrap a string to N chars per line, emit stacked <text>
function TW(x,y,txt,width,o={}){
  if(!txt) return "";
  const words=String(txt).split(/\s+/); const lines=[]; let cur="";
  const cpl=Math.floor(width/((o.size||14)*0.48));
  for(const w of words){ if((cur+" "+w).trim().length>cpl){lines.push(cur.trim());cur=w;} else cur+=" "+w; }
  if(cur.trim()) lines.push(cur.trim());
  return lines.map((l,i)=>T(x,y+i*((o.size||14)*1.28),l,o)).join("");
}

/* ---------- ground furniture: this is what makes it read as a set ---------- */
function ground(S, o){
  o = o || {};
  const gridSize = o.grid == null ? 24 : o.grid;
  const cornerN = o.corners == null ? 7 : o.corners;
  const grain = o.texture == null ? 0 : o.texture;
  let s = `<rect width="${W}" height="${H}" fill="${S.ground}"/>`;
  // drafting grid
  s += `<defs>${shadeDefs(S)}<pattern id="g24" width="${gridSize||24}" height="${gridSize||24}" patternUnits="userSpaceOnUse">
    <path d="M${gridSize||24} 0 L0 0 0 ${gridSize||24}" fill="none" stroke="${S.grid}" stroke-width="0.9"/></pattern>
    <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="9" stroke="${S.hatch}" stroke-width="1.3"/></pattern>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
    <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="currentColor" flood-opacity="0.9"/>
    <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="currentColor" flood-opacity="0.5"/></filter>
    </defs>`;
  if (gridSize) s += `<rect width="${W}" height="${H}" fill="url(#g24)"/>`;
  if (grain) {
    let g = "";
    let sd = 7;
    const rr = () => (sd = (sd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < grain * 120; i++) g += `<circle cx="${n(rr()*W)}" cy="${n(rr()*H)}" r="${n(0.6+rr()*0.9)}" fill="${S.faint}"/>`;
    s += `<g opacity="0.35">${g}</g>`;
  }
  // circuit flourishes bleeding in from the corners: the deck's signature texture
  const E={...S,glow:false};
  const F=(ox,oy,fx,fy)=>{let t="";
    for(let i=0;i<cornerN;i++){
      const y=oy+fy*(20+i*26), x0=ox, x1=ox+fx*(90+((i*57)%150));
      t+=trace([[x0,y],[x1,y],[x1+fx*30,y+fy*30],[x1+fx*30,y+fy*(70+((i*31)%60))]],S.faint,E,{sw:1.1,tokens:false});
      t+=C(x1+fx*30,y+fy*(70+((i*31)%60)),3.5,{stroke:S.faint,sw:1,glow:false},E);
      t+=R(x0+fx*(30+i*18),y-4,8,8,{fill:S.faint,glow:false},E);
    }
    return t;};
  if (cornerN) s += `<g opacity="0.55">`+F(0,0,1,1)+F(W,0,-1,1)+F(0,H,1,-1)+F(W,H,-1,-1)+`</g>`;
  return s;
}

// panel with corner brackets: the recurring container
function card(x,y,w,h,S,o={}){
  const c=o.accent||S.ink, E={...S,glow:o.glow||false};
  let s=R(x,y,w,h,{fill:o.fill||S.panel,stroke:c,sw:o.sw||2.4,rx:6,glow:o.glow||false},E);
  const k=18;
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([px,py,sx,sy])=>{
    s+=P(`M${n(px+sx*k)} ${n(py)} L${n(px+sx*4)} ${n(py)} L${n(px)} ${n(py+sy*4)} L${n(px)} ${n(py+sy*k)}`,{stroke:c,sw:o.sw||2.4},E);
  });
  if(o.hatchTop) s+=R(x+2,y+2,w-4,10,{fill:"url(#hatch)",glow:false},E);
  return s;
}

// callout: numbered chip + heading + body + leader line back to the hero
function callout(x,y,w,S,idx,head,body,ax,ay,accent){
  const c=accent||S.pink, E={...S,glow:false};
  const h=body?96:56;
  let s=card(x,y,w,h,S,{accent:c,fill:S.panel});
  s+=R(x+12,y+12,26,26,{fill:c,rx:4,glow:false},E);
  s+=T(x+25,y+31,String(idx),{fill:S.ground,size:15,weight:700,anchor:"middle"});
  s+=T(x+48,y+31,head,{fill:S.ink,size:16,weight:700});
  s+=TW(x+14,y+58,body,w-28,{fill:S.mist,size:12.5});
  if(ax!=null){
    const sx=(ax>x+w/2)?x+w:x, sy=y+h/2;
    s+=P(`M${n(sx)} ${n(sy)} L${n((sx+ax)/2)} ${n(sy)} L${n((sx+ax)/2)} ${n(ay)} L${n(ax)} ${n(ay)}`,{stroke:c,sw:1.4,dash:"6 4"},E);
    s+=C(ax,ay,4.5,{fill:c,glow:false},E)+C(sx,sy,3.5,{fill:c,glow:false},E);
  }
  return s;
}

// verdict bar: the line the audience should leave with
function verdict(S,txt,sub){
  if(!txt) return "";
  const E={...S,glow:false};
  let s=card(40,H-96,W-80,72,S,{accent:S.ink,fill:S.ink,sw:3});
  s+=T(W/2,H-52,txt,{fill:S.ground,size:24,weight:700,anchor:"middle"});
  if(sub) s+=T(W/2,H-32,sub,{fill:S.faint,size:14,anchor:"middle"});
  return s;
}

function title(S,txt,eyebrow){
  let s="";
  if(eyebrow){
    s+=R(48,36,10,10,{fill:S.pink,glow:false},{...S,glow:false});
    s+=L(64,41,110,41,S.pink,2,false,{...S,glow:false});
    s+=T(120,46,String(eyebrow).toUpperCase(),{fill:S.pink,size:11,weight:700,track:2.4});
  }
  s+=T(48,eyebrow?86:70,txt,{fill:S.ink,size:34,weight:700});
  return s;
}

// place a hero device inside a box, scaled to fit
function hero(id,box,S,params={},detail=2,zoom=1){
  const Hh=HEROES[id]; if(!Hh) return "";
  const [cw,ch]=Hh.canvas;
  const sc=Math.min(box.w/cw, box.h/ch)*zoom;
  const p={}; for(const k in Hh.params) p[k]=(k in params)?params[k]:Hh.params[k].d;
  const body=enrich(Hh.draw(p,S), S, detail, {seed:99});
  return G(body, `translate(${n(box.x+(box.w-cw*sc)/2)},${n(box.y+(box.h-ch*sc)/2)}) scale(${n(sc)})`);
}

function svg(body,S){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g color="${S.cyan}">${body}</g></svg>`;
}

/* ============================================================
   THE EIGHT SLIDE ARCHETYPES
   Each takes content and returns a finished 1376x768 slide.
   ============================================================ */
const LAYOUTS = {

/* L1: hero device with numbered callouts around it. The workhorse. */
"hero-callouts": (c,S)=>{
  let s=ground(S,c)+title(S,c.title,c.eyebrow);
  s+=hero(c.hero,{x:300,y:110,w:780,h:400},S,c.params,c.detail,c.heroScale);
  const slots=[[48,150],[48,330],[48,510],[1008,150],[1008,330],[1008,510]];
  const anchors=[[420,220],[430,380],[440,470],[960,220],[950,380],[940,470]];
  (c.callouts||[]).slice(0,6).forEach((k,i)=>{
    const acc=[S.pink,S.hot,S.cyan,S.pink,S.hot,S.cyan][i];
    s+=callout(slots[i][0],slots[i][1],320,S,i+1,k.head,k.body,anchors[i][0],anchors[i][1],k.accent||acc);
  });
  s+=verdict(S,c.verdict,c.sub);
  return svg(s,S);
},

/* L2: dead versus live. The most persuasive slide in any deck. */
"compare": (c,S)=>{
  let s=ground(S,c)+title(S,c.title,c.eyebrow);
  const E={...S,glow:false};
  // left: the old way, greyed and hatched
  s+=card(48,120,600,520,S,{accent:S.faint,fill:S.ground});
  s+=R(50,122,596,34,{fill:"url(#hatch)",glow:false},E);
  s+=T(348,146,(c.leftTitle||"").toUpperCase(),{fill:S.faint,size:14,weight:700,anchor:"middle",track:1.8});
  s+=hero(c.leftHero,{x:70,y:170,w:556,h:210},{...S,ink:S.faint,white:S.faint,cyan:S.faint,pink:S.faint,hatch:S.grid,glow:false},c.leftParams,Math.max(1,(c.detail||2)-1),c.heroScale);
  (c.leftRows||[]).forEach((r,i)=>{
    const y=420+i*44;
    s+=L(72,y-14,624,y-14,S.grid,1,false,E);
    s+=C(84,y-20,7,{stroke:S.faint,sw:1.6,glow:false},E)+L(80,y-24,88,y-16,S.faint,1.4,false,E)+L(88,y-24,80,y-16,S.faint,1.4,false,E);
    s+=T(104,y-15,r,{fill:S.mist,size:14});
  });
  // right: the new way, lit
  s+=card(728,120,600,520,S,{accent:S.cyan,fill:S.panel,glow:S.glow,sw:3});
  s+=R(730,122,596,34,{fill:S.cyan,glow:false},E);
  s+=T(1028,146,(c.rightTitle||"").toUpperCase(),{fill:S.ground,size:14,weight:700,anchor:"middle",track:1.8});
  s+=hero(c.rightHero,{x:750,y:170,w:556,h:210},S,c.rightParams,c.detail,c.heroScale);
  (c.rightRows||[]).forEach((r,i)=>{
    const y=420+i*44;
    s+=L(752,y-14,1304,y-14,S.grid,1,false,E);
    s+=C(764,y-20,7,{stroke:S.cyan,sw:1.6},S);
    s+=P(`M760 ${n(y-20)} l3 4 l6 -8`,{stroke:S.cyan,sw:1.8},S);
    s+=T(784,y-15,r,{fill:S.ink,size:14,weight:600});
  });
  s+=verdict(S,c.verdict,c.sub);
  return svg(s,S);
},

/* L3: the number slide. Two panels, one verdict. */
"metrics": (c,S)=>{
  let s=ground(S,c)+title(S,c.title,c.eyebrow);
  const E={...S,glow:false};
  const cells=(c.cells||[]).slice(0,3);
  const w=(W-96-(cells.length-1)*28)/cells.length;
  cells.forEach((k,i)=>{
    const x=48+i*(w+28), acc=k.accent||(i===cells.length-1?S.cyan:S.ink);
    s+=card(x,130,w,420,S,{accent:acc,fill:S.panel,sw:i===cells.length-1?3.4:2.4,glow:i===cells.length-1&&S.glow});
    s+=R(x+2,132,w-4,10,{fill:"url(#hatch)",glow:false},E);
    s+=T(x+w/2,190,(k.label||"").toUpperCase(),{fill:S.mist,size:13,weight:700,anchor:"middle",track:1.6});
    s+=T(x+w/2,300,k.value,{fill:acc,size:70,weight:700,anchor:"middle"});
    if(k.unit) s+=T(x+w/2,338,k.unit,{fill:S.mist,size:17,anchor:"middle"});
    s+=L(x+40,368,x+w-40,368,S.grid,1.4,false,E);
    s+=TW(x+30,398,k.body,w-60,{fill:S.mist,size:13.5});
    // a small chart skeleton so the panel is not empty air
    if(k.spark!=="none"){
      const cx=x+w/2, cy=500;
      if(i===0){ for(let b=0;b<5;b++) s+=R(cx-90+b*40,cy-((b*9)%36)-12,24,((b*9)%36)+12,{stroke:acc,sw:1.6,glow:false},E); }
      else if(i===1){ s+=trace([[cx-90,cy-6],[cx-40,cy-30],[cx+10,cy-14],[cx+60,cy-44],[cx+90,cy-52]],acc,E,{sw:2,tokens:false}); }
      else { s+=C(cx,cy-24,30,{stroke:acc,sw:2},S)+P(`M${cx} ${cy-54} A30 30 0 0 1 ${cx+26} ${cy-9}`,{stroke:acc,sw:6},S); }
    }
  });
  s+=verdict(S,c.verdict,c.sub);
  return svg(s,S);
},

/* L4: a process running left to right, with a caption under each station. */
"flow": (c,S)=>{
  let s=ground(S,c)+title(S,c.title,c.eyebrow);
  const E={...S,glow:false};
  const st=(c.stations||[]).slice(0,5), N=st.length;
  s+=hero(c.hero||"H27",{x:60,y:110,w:1256,h:300},S,c.params,c.detail,c.heroScale);
  const w=(W-96-(N-1)*20)/N;
  st.forEach((k,i)=>{
    const x=48+i*(w+20), acc=k.accent||(i===N-1?S.cyan:S.ink);
    s+=card(x,440,w,180,S,{accent:acc,fill:S.panel});
    s+=R(x+14,454,24,24,{fill:acc,rx:3,glow:false},E);
    s+=T(x+26,472,String(i+1),{fill:S.ground,size:14,weight:700,anchor:"middle"});
    s+=T(x+48,472,k.head,{fill:S.ink,size:15,weight:700});
    s+=L(x+14,490,x+w-14,490,S.grid,1.2,false,E);
    s+=TW(x+14,510,k.body,w-28,{fill:S.mist,size:12.5});
    if(i<N-1) s+=arrow(x+w+2,530,x+w+16,530,S.faint,E,2,9);
  });
  s+=verdict(S,c.verdict,c.sub);
  return svg(s,S);
},

/* L5: system map with a governed register down the right. */
"map-sidebar": (c,S)=>{
  let s=ground(S,c)+title(S,c.title,c.eyebrow);
  const E={...S,glow:false};
  s+=hero(c.hero,{x:40,y:110,w:1000,h:530},S,c.params,c.detail,c.heroScale);
  s+=card(1064,110,264,530,S,{accent:S.ink,fill:S.sidebar});
  s+=R(1066,112,260,44,{fill:S.ink,glow:false},E);
  s+=T(1196,140,(c.registerTitle||"").toUpperCase(),{fill:S.ground,size:13,weight:700,anchor:"middle",track:1.4});
  (c.register||[]).slice(0,6).forEach((r,i)=>{
    const y=176+i*72;
    s+=R(1080,y,232,60,{fill:S.panel,stroke:S.faint,sw:1.4,rx:4,glow:false},E);
    s+=R(1080,y,5,60,{fill:r.accent||S.cyan,glow:false},E);
    s+=T(1096,y+24,r.head,{fill:S.ink,size:14,weight:700});
    s+=T(1096,y+44,r.body,{fill:S.mist,size:12});
  });
  s+=verdict(S,c.verdict,c.sub);
  return svg(s,S);
},

/* L6: escalating tiers with callouts. Severity as height. */
"escalation": (c,S)=>{
  let s=ground(S,c)+title(S,c.title,c.eyebrow);
  s+=hero(c.hero||"H15",{x:40,y:120,w:900,h:480},S,c.params,c.detail,c.heroScale);
  (c.tiers||[]).slice(0,4).forEach((k,i)=>{
    const acc=[S.cyan,S.ink,S.hot,S.pink][i];
    s+=callout(940,130+i*128,396,S,i+1,k.head,k.body,760-i*40,540-i*105,acc);
  });
  s+=verdict(S,c.verdict,c.sub);
  return svg(s,S);
},

/* L7: the cover. One device, one claim, nothing else. */
"cover": (c,S)=>{
  const E={...S,glow:false};
  let s=ground(S,c);
  s+=hero(c.hero,{x:700,y:60,w:640,h:640},S,c.params,c.detail,c.heroScale);
  s+=R(64,300,10,10,{fill:S.pink,glow:false},E)+L(80,305,150,305,S.pink,2.4,false,E);
  s+=T(160,311,(c.eyebrow||"").toUpperCase(),{fill:S.pink,size:12,weight:700,track:2.6});
  s+=T(64,392,c.title,{fill:S.ink,size:56,weight:700});
  if(c.title2) s+=T(64,452,c.title2,{fill:S.ink,size:56,weight:700});
  s+=L(64,486,620,486,S.rule,2,false,E);
  s+=TW(64,520,c.sub,560,{fill:S.mist,size:17});
  s+=T(64,700,(c.footer||"").toUpperCase(),{fill:S.faint,size:11,weight:700,track:2});
  return svg(s,S);
},

/* L8: the close. One decision, drawn as a physical act. */
"decision": (c,S)=>{
  const E={...S,glow:false};
  let s=ground(S,c)+title(S,c.title,c.eyebrow);
  s+=hero(c.hero||"H51",{x:430,y:110,w:520,h:470},S,c.params,c.detail,c.heroScale);
  (c.options||[]).slice(0,2).forEach((k,i)=>{
    const x=i?968:48, acc=i?S.cyan:S.faint;
    s+=card(x,150,360,400,S,{accent:acc,fill:i?S.panel:S.ground,sw:i?3.2:2,glow:i&&S.glow});
    s+=R(x+2,152,356,32,{fill:i?acc:"url(#hatch)",glow:false},E);
    s+=T(x+180,174,(k.head||"").toUpperCase(),{fill:i?S.ground:S.faint,size:13,weight:700,anchor:"middle",track:1.6});
    (k.rows||[]).forEach((r,j)=>{
      const y=224+j*54;
      s+=C(x+26,y-4,7,{stroke:acc,sw:1.6,glow:false},E);
      if(i) s+=P(`M${x+22} ${y-4} l3 4 l6 -8`,{stroke:acc,sw:1.8},S);
      else { s+=L(x+22,y-8,x+30,y,S.faint,1.4,false,E)+L(x+30,y-8,x+22,y,S.faint,1.4,false,E); }
      s+=TW(x+46,y+1,r,290,{fill:i?S.ink:S.mist,size:13.5,weight:i?600:400});
    });
  });
  s+=verdict(S,c.verdict,c.sub);
  return svg(s,S);
}
};

function slide(layout, content, edition="light", opts={}){
  const S0 = SKIN[edition];
  const S = { ...S0, ...(opts.palette||{}) };
  content = { detail:2, heroScale:1, grid:24, corners:7, texture:0, ...content, ...opts };
  if (STDMOD.STD[layout]) return STDMOD.stdSvg(layout, content, S, ground(S, content));
  const fn = LAYOUTS[layout];
  if(!fn) throw new Error("unknown layout: "+layout+". Have: "+Object.keys(LAYOUTS).join(", "));
  return fn(content, S);
}

const ALL = () => [...Object.keys(LAYOUTS), ...STDMOD.STD_KEYS];
/* chrome only: the grid, the corner circuitry, the paper. Used as the
   background image behind native PowerPoint shapes, so a native slide and
   an artwork slide sit in the same design language. */
function chromeSvg(edition="light", opts={}){
  const S = { ...SKIN[edition], ...(opts.palette||{}) };
  const c = { grid:24, corners:7, texture:0, ...opts };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${ground(S,c)}</svg>`;
}
module.exports = { slide, LAYOUTS, SKIN, W, H, layouts:ALL, STD:STDMOD.STD, stdPptx:STDMOD.stdPptx, chromeSvg };
