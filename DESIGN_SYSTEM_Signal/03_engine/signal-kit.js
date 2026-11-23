/* ============================================================
   SIGNAL ASSET KIT  v1
   Tokens + 12 primitives + 56 parameterised hero recipes.
   Every asset is a pure function: (params) => SVG string.
   No text is ever emitted. Every label is a slot you set later.
   ============================================================ */

const TOKENS = {
  dark:  { ground:"#0B0C10", card:"#15171F", line:"#2A2E3A", white:"#FFFFFF",
           mist:"#B9C0CE", faint:"#7A828F", pink:"#F0245C", cyan:"#21E0DC",
           ink:"#FFFFFF", hatch:"#2A2E3A", glow:true },
  light: { ground:"#FFFFFF", card:"#F5F6F8", line:"#E1E4EA", white:"#14161C",
           mist:"#5B6270", faint:"#B9C0CE", pink:"#C71048", cyan:"#0E8A86",
           ink:"#14161C", hatch:"#E1E4EA", glow:false }
};

/* ---------- shape helpers ---------- */
const n = v => Math.round(v * 100) / 100;
const gl = (E, on) => (E.glow && on ? ' filter="url(#glow)"' : '');
const sw = w => ` stroke-width="${w}"`;

function L(x1,y1,x2,y2,c,w=2,g=true,E={}){return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${c}"${sw(w)} stroke-linecap="round"${gl(E,g)}/>`;}
function R(x,y,w,h,o={},E={}){const f=o.fill||"none";const s=o.stroke||"none";return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${o.rx||0}" fill="${f}" stroke="${s}"${sw(o.sw||2)}${o.dash?` stroke-dasharray="${o.dash}"`:""}${gl(E,o.glow!==false)}/>`;}
function C(cx,cy,r,o={},E={}){return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${o.fill||"none"}" stroke="${o.stroke||"none"}"${sw(o.sw||2)}${o.dash?` stroke-dasharray="${o.dash}"`:""}${gl(E,o.glow!==false)}/>`;}
function P(d,o={},E={}){return `<path d="${d}" fill="${o.fill||"none"}" stroke="${o.stroke||"none"}"${sw(o.sw||2)} stroke-linejoin="round" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:""}${gl(E,o.glow!==false)}/>`;}
function POLY(pts,o={},E={}){return `<polygon points="${pts.map(p=>`${n(p[0])},${n(p[1])}`).join(" ")}" fill="${o.fill||"none"}" stroke="${o.stroke||"none"}"${sw(o.sw||2)} stroke-linejoin="round"${gl(E,o.glow!==false)}/>`;}
const G = (b,t="") => `<g${t?` transform="${t}"`:""}>${b}</g>`;

/* ---------- P1..P12  the twelve primitives ---------- */

// P1 trace: orthogonal path through points, with schematic tokens
function trace(pts,c,E,o={}){
  const d = pts.map((p,i)=>`${i?"L":"M"}${n(p[0])} ${n(p[1])}`).join(" ");
  let out = P(d,{stroke:c,sw:o.sw||2,dash:o.dash},E);
  if(o.tokens!==false){
    for(let i=1;i<pts.length;i++){
      const mx=(pts[i-1][0]+pts[i][0])/2, my=(pts[i-1][1]+pts[i][1])/2;
      out += R(mx-3,my-3,6,6,{fill:c,glow:false},E);
    }
  }
  return out;
}
// P2 river: thick glowing flow with inner highlight
function river(pts,c,E,w=12){
  const d = pts.map((p,i)=>`${i?"L":"M"}${n(p[0])} ${n(p[1])}`).join(" ");
  return P(d,{stroke:c,sw:w},E) + P(d,{stroke:E.ground,sw:2,glow:false},E);
}
// P3 node
function node(x,y,c,E,kind="junction"){
  if(kind==="ring") return C(x,y,8,{stroke:c},E);
  if(kind==="diamond") return POLY([[x,y-12],[x+12,y],[x,y+12],[x-12,y]],{fill:c},E);
  if(kind==="source"){let s="";for(let i=3;i>=1;i--)s+=C(x,y,i*14,{stroke:i===3?c:E.mist},E);
    s+=C(x,y,8,{fill:c},E);for(let a=0;a<12;a++){const t=a*Math.PI/6;s+=L(x+Math.cos(t)*48,y+Math.sin(t)*48,x+Math.cos(t)*54,y+Math.sin(t)*54,E.mist,1,false,E);}return s;}
  return R(x-4,y-4,8,8,{fill:c},E);
}
// P4 arrowhead / arrow
function arrow(x1,y1,x2,y2,c,E,w=3,head=14){
  const a=Math.atan2(y2-y1,x2-x1);
  const p=[[x2,y2],[x2-head*Math.cos(a-0.4),y2-head*Math.sin(a-0.4)],[x2-head*Math.cos(a+0.4),y2-head*Math.sin(a+0.4)]];
  return L(x1,y1,x2-head*0.6*Math.cos(a),y2-head*0.6*Math.sin(a),c,w,true,E)+POLY(p,{fill:c},E);
}
// heavy tapered arc arrow (loops, flywheels)
function arcArrow(cx,cy,r,a0,a1,c,E,w=16){
  const p=(a,rr)=>[cx+Math.cos(a)*rr, cy+Math.sin(a)*rr];
  const A=p(a0,r-w/2), B=p(a0,r+w/2), Cc=p(a1-0.14,r+w/2), D=p(a1-0.14,r-w/2);
  const tip=p(a1,r), o1=p(a1-0.1,r+w), o2=p(a1-0.1,r-w);
  const big=Math.abs(a1-a0)>Math.PI?1:0;
  const d=`M${n(A[0])} ${n(A[1])} L${n(B[0])} ${n(B[1])} A${n(r+w/2)} ${n(r+w/2)} 0 ${big} 1 ${n(Cc[0])} ${n(Cc[1])} L${n(o1[0])} ${n(o1[1])} L${n(tip[0])} ${n(tip[1])} L${n(o2[0])} ${n(o2[1])} L${n(D[0])} ${n(D[1])} A${n(r-w/2)} ${n(r-w/2)} 0 ${big} 0 ${n(A[0])} ${n(A[1])} Z`;
  return P(d,{fill:c,sw:0},E);
}
// P5 panel: chamfered rectangle
function panel(x,y,w,h,c,E,ch=14,fill="none"){
  const d=`M${n(x+ch)} ${n(y)} L${n(x+w-ch)} ${n(y)} L${n(x+w)} ${n(y+ch)} L${n(x+w)} ${n(y+h-ch)} L${n(x+w-ch)} ${n(y+h)} L${n(x+ch)} ${n(y+h)} L${n(x)} ${n(y+h-ch)} L${n(x)} ${n(y+ch)} Z`;
  return P(d,{stroke:c,fill,sw:2},E);
}
// P6 corner bracket
function corner(x,y,c,E,rot=0,len=44){
  const b=L(0,0,len,0,c,2.5,true,E)+L(0,0,0,len,c,2.5,true,E)
    +L(len*0.3,10,len*0.55,10,c,1.5,true,E)+L(10,len*0.3,10,len*0.55,c,1.5,true,E)
    +R(14,14,5,5,{fill:c},E);
  return G(b,`translate(${n(x)},${n(y)}) rotate(${rot})`);
}
// P7 chip
function chip(x,y,w,h,c,E){return R(x,y,w,h,{fill:c,rx:4},E);}
// chip with pin legs (microprocessor glyph)
function chipPkg(x,y,s,c,E){
  let out=R(x-s/2,y-s/2,s,s,{stroke:c,rx:3},E)+R(x-s/6,y-s/6,s/3,s/3,{stroke:c,sw:1.5},E);
  for(let i=0;i<4;i++){const o=-s/4+i*(s/6);
    out+=L(x+o,y-s/2,x+o,y-s/2-7,c,1.5,true,E)+L(x+o,y+s/2,x+o,y+s/2+7,c,1.5,true,E)
        +L(x-s/2,y+o,x-s/2-7,y+o,c,1.5,true,E)+L(x+s/2,y+o,x+s/2+7,y+o,c,1.5,true,E);}
  return out;
}
// P8 padlock
function padlock(x,y,s,c,E,open=false){
  const b=R(x-s*0.4,y-s*0.1,s*0.8,s*0.6,{stroke:c,rx:4},E);
  const sh=open? P(`M${n(x-s*0.25)} ${n(y-s*0.1)} L${n(x-s*0.25)} ${n(y-s*0.4)} A${n(s*0.25)} ${n(s*0.25)} 0 0 1 ${n(x+s*0.35)} ${n(y-s*0.45)}`,{stroke:c},E)
                : P(`M${n(x-s*0.25)} ${n(y-s*0.1)} L${n(x-s*0.25)} ${n(y-s*0.35)} A${n(s*0.25)} ${n(s*0.25)} 0 0 1 ${n(x+s*0.25)} ${n(y-s*0.35)} L${n(x+s*0.25)} ${n(y-s*0.1)}`,{stroke:c},E);
  return b+sh+C(x,y+s*0.18,s*0.08,{fill:c},E);
}
// P9 gear
function gear(cx,cy,r,teeth,c,E,o={}){
  let d="";const tw=Math.PI/teeth*0.55, rt=r*1.16;
  for(let i=0;i<teeth;i++){
    const a=i*2*Math.PI/teeth;
    const p=(ang,rr)=>`${n(cx+Math.cos(ang)*rr)} ${n(cy+Math.sin(ang)*rr)}`;
    d+=`${i?"L":"M"}${p(a-tw,r)} L${p(a-tw*0.6,rt)} L${p(a+tw*0.6,rt)} L${p(a+tw,r)} A${n(r)} ${n(r)} 0 0 1 ${p(a+2*Math.PI/teeth-tw,r)} `;
  }
  d+="Z";
  let out=P(d,{stroke:c,fill:o.fill||"none",sw:o.sw||2},E)+C(cx,cy,r*0.62,{stroke:c,sw:1.5},E)+C(cx,cy,r*0.2,{stroke:c,sw:1.5},E);
  if(o.bolts!==false) for(let i=0;i<6;i++){const a=i*Math.PI/3;out+=C(cx+Math.cos(a)*r*0.42,cy+Math.sin(a)*r*0.42,r*0.05,{fill:c,glow:false},E);}
  return out;
}
// P10 ring with ported hubs
function ring(cx,cy,r,ports,c,E){
  let out=C(cx,cy,r,{stroke:c,sw:3},E)+C(cx,cy,r*0.78,{stroke:c,sw:2},E);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;out+=C(cx+Math.cos(a)*r*0.89,cy+Math.sin(a)*r*0.89,4,{fill:c,glow:false},E);}
  return out;
}
// P11 hatch (pattern fill helper)
const HATCH='url(#hatch)';
// P12 iso block
function isoBlock(x,y,w,d,h,lip,E,faceStroke){
  const fs=faceStroke||E.mist;
  const top=[[x,y],[x+w,y-d*0.5],[x+w+d,y-d*0.5+d*0.5],[x+d,y+d*0.5]];
  const top2=[[x,y],[x+w,y-d*0.5],[x+w+d*0.6,y-d*0.5+d*0.35],[x+d*0.6,y+d*0.35]];
  const left=[[x,y],[x+d*0.6,y+d*0.35],[x+d*0.6,y+d*0.35+h],[x,y+h]];
  const right=[[x+d*0.6,y+d*0.35],[x+w+d*0.6,y-d*0.5+d*0.35],[x+w+d*0.6,y-d*0.5+d*0.35+h],[x+d*0.6,y+d*0.35+h]];
  return POLY(top2,{stroke:fs,fill:E.ground,glow:false},E)
       + POLY(left,{stroke:fs,fill:E.ground,glow:false},E)
       + POLY(right,{stroke:fs,fill:E.ground,glow:false},E)
       + P(`M${n(x)} ${n(y)} L${n(x+w)} ${n(y-d*0.5)}`,{stroke:lip,sw:4},E)
       + P(`M${n(x+w)} ${n(y-d*0.5)} L${n(x+w+d*0.6)} ${n(y-d*0.5+d*0.35)}`,{stroke:lip,sw:4},E);
}

/* ---------- document wrapper ---------- */
function wrap(w,h,ed,body,orn=""){
  const E=TOKENS[ed];
  const defs=`<defs>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
  <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="currentColor" flood-opacity="0.9"/>
  <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="currentColor" flood-opacity="0.5"/>
</filter>
<pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <line x1="0" y1="0" x2="0" y2="10" stroke="${E.hatch}" stroke-width="1.4"/>
</pattern>
<linearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0%" stop-color="${E.cyan}"/><stop offset="50%" stop-color="#8B4FC0"/><stop offset="100%" stop-color="${E.pink}"/>
</linearGradient>
</defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs}<rect width="${w}" height="${h}" fill="${E.ground}"/><g color="${E.cyan}">${orn}${body}</g></svg>`;
}

/* ============================================================
   THE 56 HEROES
   Each: { name, edition, canvas, encodes, params, draw }
   ============================================================ */
const HEROES = {

/* ---------- PROBLEM AND LOSS ---------- */
H01:{name:"Fractured Funnel",edition:"dark",canvas:[1024,1024],encodes:"the old, broken state",
 params:{bands:{d:6,min:3,max:10},severity:{d:6,min:0,max:14},leaders:{d:5,min:0,max:8}},
 draw:(p,E)=>{let s="";const cx=512;
  for(let i=0;i<p.bands;i++){const t=i/(p.bands-1);const wTop=440-t*300, wBot=440-((i+1)/(p.bands-1))*300;
   const y=250+i*80, off=(i%2?1:-1)*t*p.severity*2.2, rot=(i%2?1:-1)*t*p.severity*0.5;
   s+=G(POLY([[cx-wTop/2,y],[cx+wTop/2,y],[cx+wBot/2,y+70],[cx-wBot/2,y+70]],{stroke:E.faint,sw:2,glow:false},E),`rotate(${n(rot)} ${cx} ${y+35}) translate(${n(off)},0)`);
   for(let k=0;k<3;k++)s+=L(cx-wTop/2+30+k*(wTop-60)/3,y+off,cx-wTop/2+50+k*(wTop-60)/3,y+70,E.faint,1,false,E);}
  for(let i=0;i<p.leaders;i++){const a=(i/(p.leaders||1))*Math.PI*2, r0=300, r1=460;
   s+=arrow(cx+Math.cos(a)*r0,512+Math.sin(a)*r0*0.8,cx+Math.cos(a)*r1,512+Math.sin(a)*r1*0.8,E.faint,{...E,glow:false},1.5,10);}
  return s;}},

H11:{name:"Leaking Vessel",edition:"light",canvas:[1024,576],encodes:"loss as physics",
 params:{leaks:{d:3,min:1,max:5},welded:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s=R(40,150,944,90,{stroke:E.ink,sw:3,fill:HATCH},E);
  [40,300,600,900].forEach(x=>{s+=R(x,138,26,114,{stroke:E.ink,sw:2.5},E);for(let i=0;i<3;i++)s+=C(x+13,152+i*36,3,{fill:E.ink},E);});
  for(let i=0;i<p.leaks;i++){const x=220+i*(700/Math.max(p.leaks-1,1));
   if(!p.welded){for(let k=0;k<5;k++){const a=-0.9+k*0.45;s+=L(x,240,x+Math.cos(a)*34,240+Math.abs(Math.sin(a))*30,E.ink,1.6,false,E);}
    for(let k=0;k<6;k++)s+=C(x,270+k*34+k*k*1.6,4+k*0.6,{fill:E.pink,glow:false},E);
    s+=`<ellipse cx="${x}" cy="500" rx="${46}" ry="9" fill="${E.pink}" opacity="0.55"/>`;}
   else s+=L(x-24,240,x+24,240,E.cyan,4,false,E);}
  return s;}},

H19:{name:"Bottleneck",edition:"dark",canvas:[1024,1024],encodes:"everything is fine except this one place",
 params:{inLanes:{d:16,min:6,max:24},outLanes:{d:3,min:1,max:10},gap:{d:40,min:20,max:200}},
 draw:(p,E)=>{let s="";
  for(let i=0;i<p.inLanes;i++){const y=180+i*(664/(p.inLanes-1));
   s+=trace([[0,y],[300,y],[430,512-p.gap/2+ (i/(p.inLanes-1))*p.gap],[470,512-p.gap/2+(i/(p.inLanes-1))*p.gap]],E.cyan,E,{sw:2,tokens:false});}
  s+=P(`M470 ${n(512-p.gap/2-90)} L540 ${n(512-p.gap/2)} L540 ${n(512+p.gap/2)} L470 ${n(512+p.gap/2+90)}`,{stroke:E.white,sw:6},E);
  s+=P(`M470 ${n(512-p.gap/2-90)} L540 ${n(512-p.gap/2)}`,{stroke:E.white,sw:6},E);
  for(let i=0;i<p.outLanes;i++){const y=380+i*(264/Math.max(p.outLanes-1,1));
   s+=trace([[560,512],[640,y],[1024,y]],E.pink,E,{sw:2,tokens:false});}
  return s;}},

H20:{name:"Keystone",edition:"light",canvas:[1024,1024],encodes:"pull this and everything falls",
 params:{voussoirs:{d:9,min:5,max:15}},
 draw:(p,E)=>{let s="";const cx=512,cy=760,R0=380,R1=250,N=p.voussoirs;
  for(let i=0;i<N;i++){const a0=Math.PI+i*Math.PI/N, a1=Math.PI+(i+1)*Math.PI/N;
   const pts=[[cx+Math.cos(a0)*R1,cy+Math.sin(a0)*R1],[cx+Math.cos(a0)*R0,cy+Math.sin(a0)*R0],
              [cx+Math.cos(a1)*R0,cy+Math.sin(a1)*R0],[cx+Math.cos(a1)*R1,cy+Math.sin(a1)*R1]];
   const key=i===Math.floor(N/2);
   s+=POLY(pts,{stroke:E.ink,sw:key?3:2,fill:key?E.pink:HATCH},E);}
  s+=L(120,cy,904,cy,E.ink,3,false,E);
  s+=arrow(760,240,cx+40,cy-R0+30,E.ink,{...E,glow:false},1.5,12);
  return s;}},

H22:{name:"Decay",edition:"light",canvas:[1024,576],encodes:"it degrades silently unless maintained",
 params:{stages:{d:5,min:3,max:7}},
 draw:(p,E)=>{let s="";const N=p.stages;
  for(let i=0;i<N;i++){const x=100+i*(824/(N-1)), t=i/(N-1);
   s+=R(x-60,220,120,140,{stroke:E.ink,sw:3-t*2,fill:i<N-1?HATCH:"none"},E);
   s+=C(x,290,34-t*8,{stroke:E.ink,sw:2.5-t*1.5},E);
   if(i<N-1)for(let k=0;k<4;k++)s+=C(x-40+k*27,240,4,{fill:i<2?E.ink:"none",stroke:E.ink,sw:1,glow:false},E);
   for(let k=0;k<Math.round(t*t*14);k++){const a=Math.random()*6.28;s+=L(x+Math.cos(a)*20,290+Math.sin(a)*20,x+Math.cos(a)*60,290+Math.sin(a)*60,E.ink,1,false,E);}
   if(i===2)for(let k=0;k<4;k++)s+=C(x,380+k*30,4,{fill:E.pink,glow:false},E);}
  return s;}},

H23:{name:"Backlog Hopper",edition:"light",canvas:[1024,1024],encodes:"work piling up faster than it clears",
 params:{pile:{d:40,min:10,max:70},outlet:{d:30,min:20,max:140}},
 draw:(p,E)=>{let s="";
  for(let i=0;i<p.pile;i++){const x=340+(i%7)*54+((i/7|0)%2)*20, y=300-((i/7|0))*30;
   s+=R(x,y,44,24,{stroke:E.ink,sw:1.6,fill:E.ground,glow:false},E);}
  s+=POLY([[300,320],[724,320],[512+p.outlet/2,620],[512-p.outlet/2,620]],{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=R(512-p.outlet/2,620,p.outlet,60,{stroke:E.ink,sw:3},E);
  s+=R(492,700,44,24,{stroke:E.ink,sw:2},E);
  s+=L(300,780,724,780,E.ink,3,false,E);
  for(let i=0;i<5;i++)s+=C(340+i*90,800,20,{stroke:E.ink,sw:2},E);
  return s;}},

H47:{name:"Treadmill",edition:"dark",canvas:[1024,1024],encodes:"effort that never accumulates",
 params:{},
 draw:(p,E)=>{let s=C(300,500,80,{stroke:E.faint,glow:false},E)+C(724,500,80,{stroke:E.faint,glow:false},E);
  s+=L(300,420,724,420,E.faint,3,false,E)+L(300,580,724,580,E.faint,3,false,E);
  for(let i=0;i<12;i++)s+=L(310+i*34,420,300+i*34,440,E.faint,1.5,false,E);
  s+=C(512,340,30,{stroke:E.faint,glow:false},E)+L(512,370,512,420,E.faint,2.5,false,E)
   +L(512,390,470,410,E.faint,2.5,false,E)+L(512,390,556,405,E.faint,2.5,false,E)
   +L(512,420,486,412,E.faint,2.5,false,E)+L(512,420,548,414,E.faint,2.5,false,E);
  s+=L(180,800,844,800,E.faint,2,false,E);
  return s;}},

H48:{name:"Standoff",edition:"dark",canvas:[1024,1024],encodes:"two forces cancelling out",
 params:{},
 draw:(p,E)=>{let s="";
  s+=POLY([[80,470],[420,470],[420,420],[500,512],[420,604],[420,554],[80,554]],{fill:E.cyan},E);
  s+=POLY([[944,470],[604,470],[604,420],[524,512],[604,604],[604,554],[944,554]],{fill:E.pink},E);
  for(let i=0;i<8;i++){const a=-1.2+i*0.34;s+=L(512+Math.cos(a)*40,512+Math.sin(a)*40,512+Math.cos(a)*90,512+Math.sin(a)*90,E.white,2,true,E);}
  return s;}},

/* ---------- SYSTEM AND STRUCTURE ---------- */
H02:{name:"Signal Converter",edition:"dark",canvas:[1024,1024],encodes:"messy inputs unified into one accelerating output",
 params:{inputs:{d:4,min:2,max:8}},
 draw:(p,E)=>{let s="";const N=p.inputs;
  for(let i=0;i<N;i++){const y=220+i*(560/(N-1)), warm=i>=N/2;
   s+=R(60,y-35,160,70,{stroke:warm?"none":E.cyan,fill:warm?E.pink:"none",rx:4},E);
   s+=trace([[220,y],[380,y],[420,512]],warm?E.pink:E.cyan,E,{sw:2});}
  s+=POLY([[430,442],[510,472],[510,552],[430,582],[470,512]],{stroke:E.white,sw:3},E);
  const pts=[[520,512],[620,512],[620,400],[740,400],[740,290],[880,290],[880,170]];
  s+=trace(pts,E.white,E,{sw:8,tokens:false})+arrow(880,200,940,120,E.white,E,8,26);
  s+=trace(pts.map(q=>[q[0],q[1]+20]),E.cyan,E,{sw:2,tokens:false});
  s+=trace(pts.map(q=>[q[0],q[1]-20]),E.pink,E,{sw:2,tokens:false});
  for(let i=0;i<5;i++){const x=560+i*70,y=760+((i%2)*40);s+=trace([[x,y],[x+18,y-22],[x+36,y-6],[x+54,y-40]],E.cyan,E,{sw:1.5,tokens:false});}
  return s;}},

H06:{name:"Hub-and-Spoke Key",edition:"dark",canvas:[1024,1024],encodes:"one thing everything depends on",
 params:{spokes:{d:4,min:3,max:6},ruleBar:{d:1,min:0,max:1}},
 draw:(p,E)=>{let s="";const quad=[[70,180],[694,180],[70,560],[694,560],[382,60],[382,760]];
  for(let i=0;i<p.spokes;i++){const q=quad[i];
   s+=panel(q[0],q[1],260,150,E.pink,E);
   const cx=q[0]+130, cy=q[1]+75;
   s+=trace([[cx,cy<512?q[1]+150:q[1]],[cx,512],[cx<512?432:592,512]],E.pink,E,{sw:2});}
  s+=chip(422,472,180,80,E.pink,E);
  if(p.ruleBar) s+=P(`M62 800 L462 800 L492 770 L532 770 L562 800 L962 800 L962 870 L62 870 Z`,{stroke:E.cyan,sw:2},E);
  return s;}},

H12:{name:"Exploded Layer Stack",edition:"light",canvas:[1024,1024],encodes:"architecture and dependency at once",
 params:{plates:{d:3,min:2,max:5},ghostTop:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s="";const N=p.plates;
  for(let i=0;i<N;i++){const y=280+i*220, ghost=(p.ghostTop&&i===0);
   const top=[[240,y],[720,y-70],[820,y-20],[340,y+50]];
   s+=POLY(top,{stroke:E.ink,sw:ghost?1.5:2.5,dash:ghost?"8 6":null,fill:ghost?"none":E.ground,glow:false},E);
   s+=POLY([[240,y],[340,y+50],[340,y+72],[240,y+22]],{stroke:E.ink,sw:2,fill:HATCH},E);
   s+=POLY([[340,y+50],[820,y-20],[820,y+2],[340,y+72]],{stroke:E.ink,sw:2,fill:HATCH},E);
   if(i<N-1){[[420,y+70],[700,y+20]].forEach(q=>{
     s+=L(q[0],q[1],q[0],q[1]+150,E.ink,1.5,false,E,)+ '';
     s+=P(`M${q[0]} ${q[1]+10} L${q[0]} ${q[1]+140}`,{stroke:E.ink,sw:1.5,dash:"7 6"},E);
     s+=arrow(q[0],q[1]+140,q[0],q[1]+152,E.ink,{...E,glow:false},1.5,10)+arrow(q[0],q[1]+22,q[0],q[1]+8,E.ink,{...E,glow:false},1.5,10);});}
   if(i===1)s+=P(`M240 ${y} L720 ${y-70}`,{stroke:E.cyan,sw:4},E);}
  s+=L(150,240,150,940,E.ink,1.2,false,E);
  s+=arrow(150,300,150,240,E.ink,{...E,glow:false},1.2,10)+arrow(150,880,150,940,E.ink,{...E,glow:false},1.2,10);
  return s;}},

H17:{name:"Broadcast Fan-Out",edition:"dark",canvas:[1024,1024],encodes:"one source, many destinations",
 params:{targets:{d:12,min:4,max:20},priority:{d:0,min:0,max:5}},
 draw:(p,E)=>{let s=chip(60,472,110,80,E.pink,E);
  for(let i=0;i<p.targets;i++){const y=80+i*(864/(p.targets-1)), c=i<p.priority?E.pink:E.cyan;
   s+=trace([[170,512],[400,512],[400,y],[880,y]],c,E,{sw:1.6});
   s+=node(900,y,c,E,"ring");}
  return s;}},

H18:{name:"Dependency Chain",edition:"light",canvas:[1024,1024],encodes:"nothing moves until the thing before it moves",
 params:{links:{d:5,min:3,max:7},broken:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s="";const N=p.links, step=880/N;
  for(let i=0;i<N;i++){const x=70+i*step;
   s+=R(x,440,step-40,150,{stroke:E.ink,sw:2.5,fill:HATCH},E);
   s+=gear(x+(step-40)/2,515,52,14,E.ink,E,{});
   if(i<N-1){const brk=(p.broken&&i===1);
    s+=L(x+step-40,515,x+step,515,brk?E.pink:E.ink,brk?2:6,false,E);
    if(brk)s+=L(x+step-30,495,x+step-10,535,E.pink,3,false,E);}}
  s+=L(80,515,40,440,E.ink,5,false,E)+C(40,440,14,{stroke:E.ink},E);
  return s;}},

H21:{name:"Vault Rack",edition:"light",canvas:[1024,1024],encodes:"everything has an address",
 params:{cols:{d:4,min:2,max:6},rows:{d:5,min:2,max:6},openBay:{d:6,min:-1,max:20},ungoverned:{d:1,min:0,max:1}},
 draw:(p,E)=>{let s="";const w=200,h=140;const x0=(1024-p.cols*w)/2, y0=(1024-p.rows*h)/2;
  for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++){const i=r*p.cols+c;const x=x0+c*w,y=y0+r*h;
   const last=(i===p.rows*p.cols-1);
   const open=(i===p.openBay);
   const ox=open?26:0;
   if(last&&p.ungoverned){s+=R(x+6,y+6,w-12,h-12,{stroke:E.ink,sw:2,dash:"8 6",fill:HATCH},E);continue;}
   s+=R(x+6+ox,y+6,w-12,h-12,{stroke:E.ink,sw:2,fill:E.ground,glow:false},E);
   s+=R(x+16+ox,y+16,w-32,10,{stroke:E.ink,sw:1.2},E);
   s+=R(x+22+ox,y+50,70,20,{stroke:E.ink,sw:1.2},E);
   if(open){s+=L(x+6,y+h-14,x+6+ox,y+h-14,E.ink,1.5,false,E)+L(x+6,y+14,x+6+ox,y+14,E.ink,1.5,false,E);}}
  return s;}},

H24:{name:"Mesh Network",edition:"dark",canvas:[1024,1024],encodes:"everything connects to everything",
 params:{nodes:{d:20,min:8,max:30},hubs:{d:3,min:0,max:6}},
 draw:(p,E)=>{let s="";const pts=[];const cols=Math.ceil(Math.sqrt(p.nodes));
  for(let i=0;i<p.nodes;i++){const c=i%cols, r=(i/cols)|0;
   pts.push([120+c*(784/(cols-1))+((r%2)?26:-26), 120+r*(784/(cols-1))]);}
  pts.forEach((a,i)=>{const near=pts.map((b,j)=>[j,Math.hypot(a[0]-b[0],a[1]-b[1])]).filter(x=>x[0]!==i).sort((x,y)=>x[1]-y[1]).slice(0,2);
   near.forEach(([j])=>{const b=pts[j];s+=trace([[a[0],a[1]],[b[0],a[1]],[b[0],b[1]]],E.cyan,E,{sw:1.2,tokens:false});});});
  pts.forEach((a,i)=>{s+= i<p.hubs ? R(a[0]-16,a[1]-16,32,32,{fill:E.pink},E) : R(a[0]-12,a[1]-12,24,24,{stroke:E.cyan},E);});
  return s;}},

H27:{name:"Assembly Line",edition:"light",canvas:[1024,576],encodes:"built in stages, to a standard",
 params:{stations:{d:4,min:2,max:6}},
 draw:(p,E)=>{let s=L(60,430,964,430,E.ink,3,false,E);
  for(let i=0;i<12;i++)s+=C(90+i*72,455,22,{stroke:E.ink,sw:1.6},E);
  s+=gear(940,455,34,12,E.ink,E,{});
  for(let i=0;i<p.stations;i++){const x=140+i*(760/(p.stations-1)), t=i/(p.stations-1);
   s+=R(x-50,370,100,50,{stroke:i===p.stations-1?E.cyan:E.ink,sw:2.5,fill:HATCH},E);
   if(i>0)s+=R(x-34,340,68,30,{stroke:i===p.stations-1?E.cyan:E.ink,sw:2},E);
   if(i>1)s+=R(x-44,310,88,30,{stroke:i===p.stations-1?E.cyan:E.ink,sw:2},E);
   s+=L(x,120,x,220,E.ink,3,false,E)+L(x,220,x-40,280,E.ink,3,false,E)+C(x,120,12,{stroke:E.ink},E);}
  return s;}},

H28:{name:"Adapter Plate",edition:"dark",canvas:[1024,1024],encodes:"two systems that should not fit, made to fit",
 params:{maps:{d:9,min:3,max:12},deadEnd:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s=R(80,300,180,430,{stroke:E.cyan,sw:2.5},E);
  for(let i=0;i<9;i++)s+=R(110+(i%3)*54,340+((i/3)|0)*130,30,30,{stroke:E.cyan,sw:1.6},E);
  const hex=[];for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;hex.push([870+Math.cos(a)*180,512+Math.sin(a)*180]);}
  s+=POLY(hex,{stroke:E.pink,sw:2.5},E);
  hex.forEach(h=>{s+=C(h[0]*0.82+870*0.18,h[1]*0.82+512*0.18,16,{stroke:E.pink,sw:1.6},E);});
  s+=panel(392,280,240,470,E.white,E);
  for(let i=0;i<p.maps;i++){const y1=350+i*(340/(p.maps-1)), y2=380+((i*7)%p.maps)*(280/(p.maps-1));
   const dead=(p.deadEnd&&i===p.maps-1);
   s+=trace([[260,y1],[392,y1],[512,y1],[512,y2],[632,y2],[dead?700:690,y2]],dead?E.faint:E.white,E,{sw:1.4,tokens:false});
   if(dead)s+=L(694,y2-10,706,y2+10,E.faint,2,false,E)+L(706,y2-10,694,y2+10,E.faint,2,false,E);}
  return s;}},

H52:{name:"The Jig",edition:"light",canvas:[1024,1024],encodes:"a template that makes every output identical",
 params:{parts:{d:3,min:1,max:5},malformed:{d:0,min:0,max:1}},
 draw:(p,E)=>{const cav=`M300 380 L470 380 L470 460 L400 460 L400 600 L300 600 Z`;
  let s=`<path d="M120 240 L640 240 L640 800 L120 800 Z ${cav}" fill="${HATCH}" fill-rule="evenodd" stroke="${E.ink}" stroke-width="3"/>`;
  s+=P(cav,{stroke:E.ink,sw:2},E);
  [[120,240],[640,240],[120,800],[640,800]].forEach(c=>{s+=C(c[0],c[1],16,{stroke:E.ink,sw:2},E);});
  for(let i=0;i<p.parts;i++){const y=250+i*190, bad=(p.malformed&&i===p.parts-1);
   s+=G(P(cav,{stroke:bad?E.pink:E.ink,sw:2},E),`translate(${470},${y-380}) scale(0.8)`);}
  return s;}},

/* ---------- FLOW AND ROUTING ---------- */
H03:{name:"Convergence Rivers",edition:"dark",canvas:[1024,576],encodes:"run two paths in parallel, then reconcile",
 params:{rivers:{d:2,min:1,max:3},tributaries:{d:6,min:0,max:10}},
 draw:(p,E)=>{let s=node(110,290,E.cyan,E,"source");
  const ys=[200,380,290];
  for(let r=0;r<p.rivers;r++){const c=r===0?E.cyan:(r===1?E.pink:E.white), y=ys[r];
   s+=river([[170,290],[260,y],[700,y],[790,290]],c,E,12);
   for(let t=0;t<p.tributaries;t++){const x=300+t*60;
    s+=trace([[x,y],[x,y+(r?26:-26)]],c,E,{sw:1.2,tokens:false});}}
  const oct=[];for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;oct.push([830+Math.cos(a)*80,290+Math.sin(a)*80]);}
  s+=POLY(oct,{stroke:E.white,sw:2.5},E)+POLY(oct.map(q=>[830+(q[0]-830)*0.75,290+(q[1]-290)*0.75]),{stroke:E.white,sw:1.5},E);
  s+=padlock(830,290,60,E.white,E);
  s+=POLY([[910,250],[960,270],[910,290]],{fill:E.cyan},E)+POLY([[910,300],[960,320],[910,340]],{fill:E.pink},E);
  s+=C(990,290,18,{stroke:E.cyan},E)+P("M981 290 L988 298 L1000 282",{stroke:E.cyan,sw:2.5},E);
  return s;}},

H25:{name:"Refinery Column",edition:"light",canvas:[1024,1024],encodes:"raw input, separated into grades of value",
 params:{outputs:{d:4,min:2,max:6},trays:{d:8,min:4,max:14}},
 draw:(p,E)=>{let s=R(372,120,280,760,{stroke:E.ink,sw:3,rx:140,fill:HATCH},E);
  s+=R(392,150,240,700,{stroke:E.ink,sw:1.5,fill:E.ground,glow:false},E);
  for(let i=0;i<p.trays;i++){const y=200+i*(600/(p.trays-1));s+=L(400,y,624,y,E.ink,1.6,false,E);
   s+=C(i%2?560:460,y,7,{stroke:E.ink,sw:1.2},E);}
  s+=R(140,820,240,40,{stroke:E.ink,sw:3},E)+L(380,840,372,840,E.ink,3,false,E);
  for(let i=0;i<p.outputs;i++){const y=780-i*(560/(p.outputs-1)), top=(i===p.outputs-1);
   s+=R(652,y-18,240,36,{stroke:top?E.cyan:E.ink,sw:top?3:2.5},E);}
  s+=C(340,300,30,{stroke:E.ink,sw:2},E)+C(340,600,30,{stroke:E.ink,sw:2},E);
  return s;}},

H26:{name:"Switchboard",edition:"dark",canvas:[1024,1024],encodes:"every request routed to exactly one destination",
 params:{lanes:{d:8,min:4,max:12},pinkRoutes:{d:2,min:0,max:6}},
 draw:(p,E)=>{let s=panel(212,212,600,600,E.white,E);const N=p.lanes;
  const route=[];for(let i=0;i<N;i++)route.push((i*3+2)%N);
  for(let i=0;i<N;i++)for(let j=0;j<N;j++)s+=C(252+j*(520/(N-1)),252+i*(520/(N-1)),4,{fill:E.faint,glow:false},E);
  for(let i=0;i<N;i++){const y=252+i*(520/(N-1)), j=route[i], x=252+j*(520/(N-1)), oy=252+j*(520/(N-1));
   const c=i<p.pinkRoutes?E.pink:E.cyan;
   s+=trace([[0,y],[212,y],[x,y],[x,oy],[812,oy],[1024,oy]],c,E,{sw:1.8,tokens:false});
   s+=C(x,y,7,{fill:c},E);}
  return s;}},

H29:{name:"Load Balance",edition:"light",canvas:[1024,1024],encodes:"weight distributed, nothing overloaded",
 params:{pans:{d:3,min:2,max:5},tilt:{d:0,min:-12,max:12},blocks:{d:4,min:1,max:7}},
 draw:(p,E)=>{let b=L(112,400,912,400,E.ink,6,false,E);
  for(let i=0;i<p.pans;i++){const x=200+i*(624/(p.pans-1));
   b+=L(x,400,x,540,E.ink,1.6,false,E)+P(`M${x-80} 540 L${x+80} 540 L${x+60} 590 L${x-60} 590 Z`,{stroke:E.ink,sw:2.5},E);
   for(let k=0;k<p.blocks;k++)b+=R(x-50+((k%3)*34),490-((k/3)|0)*34,30,30,{stroke:E.ink,sw:1.6,fill:HATCH},E);}
  let s=G(b,`rotate(${p.tilt} 512 400)`);
  s+=POLY([[512,400],[452,700],[572,700]],{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=L(120,730,904,730,E.ink,3,false,E);
  s+=P("M160 400 L864 400",{stroke:E.ink,sw:1,dash:"8 6"},E);
  return s;}},

H33:{name:"Triage Sorter",edition:"light",canvas:[1024,1024],encodes:"incoming work classified before it is touched",
 params:{chutes:{d:3,min:2,max:5},fill:{d:1,min:0,max:1}},
 draw:(p,E)=>{let s=POLY([[300,120],[724,120],[600,300],[424,300]],{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=C(512,380,16,{stroke:E.ink,sw:2.5},E)+L(512,380,600,470,E.ink,5,false,E);
  s+=P("M420 470 A 130 130 0 0 1 604 470",{stroke:E.ink,sw:1.2,dash:"7 6"},E);
  s+=R(560,420,40,26,{stroke:E.ink,sw:2},E);
  const fills=[2,5,9,4,7];
  for(let i=0;i<p.chutes;i++){const x=170+i*(684/(p.chutes-1)), pri=(i===0);
   s+=POLY([[512-60,520],[512+60,520],[x+70,650],[x-70,650]],{stroke:pri?E.pink:E.ink,sw:2},E);
   s+=R(x-90,660,180,240,{stroke:E.ink,sw:2.5},E);
   for(let k=0;k<(p.fill?fills[i]:0);k++)s+=R(x-70+((k%3)*48),860-(((k/3)|0)*44),40,36,{stroke:E.ink,sw:1.5,fill:HATCH},E);}
  return s;}},

H49:{name:"The Bridge",edition:"light",canvas:[1024,576],encodes:"migration from the old estate to the new one",
 params:{progress:{d:5,min:0,max:14}},
 draw:(p,E)=>{let s=POLY([[0,340],[330,340],[330,576],[0,576]],{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=POLY([[694,340],[1024,340],[1024,576],[694,576]],{stroke:E.ink,sw:3,fill:HATCH},E);
  for(let i=0;i<14-p.progress;i++)s+=G(R(40+(i%4)*70,180+((i/4)|0)*54,52,32,{stroke:E.ink,sw:1.6,fill:E.ground,glow:false},E),`rotate(${(i*37)%20-10} ${66+(i%4)*70} ${196+((i/4)|0)*54})`);
  for(let i=0;i<p.progress;i++)s+=R(730+(i%4)*70,180+((i/4)|0)*54,52,32,{stroke:E.ink,sw:1.6},E);
  s+=L(330,300,694,300,E.ink,3.5,false,E)+L(330,220,694,220,E.ink,2.5,false,E);
  for(let i=0;i<8;i++){const x=330+i*(364/8);s+=L(x,300,x+22,220,E.ink,1.6,false,E)+L(x+22,220,x+45,300,E.ink,1.6,false,E);}
  s+=R(470,268,52,32,{stroke:E.cyan,sw:2},E);
  return s;}},

/* ---------- CONTROL AND GOVERNANCE ---------- */
H05:{name:"Self-Loop",edition:"dark",canvas:[1024,1024],encodes:"this system now decides for itself",
 params:{arrows:{d:4,min:3,max:6},sealed:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s=panel(140,300,420,420,E.white,E);
  for(let i=0;i<p.arrows;i++){const a0=i*2*Math.PI/p.arrows, a1=a0+2*Math.PI/p.arrows-0.18;
   s+=arcArrow(350,510,140,a0,a1,E.pink,E,14);}
  if(!p.sealed){s+=trace([[560,510],[700,510],[700,560]],E.pink,E,{sw:2.5});
   s+=arrow(700,560,700,600,E.pink,E,2.5,14);
   s+=R(600,600,200,140,{stroke:E.faint,sw:2,glow:false},E);}
  return s;}},

H13:{name:"Closed Control Loop",edition:"light",canvas:[1024,1024],encodes:"self-correction, whether anyone is watching or not",
 params:{stages:{d:5,min:3,max:8},brokenArc:{d:-1,min:-1,max:7}},
 draw:(p,E)=>{const cx=512,cy=512,r=320;let s=ring(cx,cy,r,p.stages,E.ink,E);
  for(let i=0;i<p.stages;i++){const a=-Math.PI/2+i*2*Math.PI/p.stages;
   const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r;
   s+=C(x,y,46,{stroke:E.ink,sw:3,fill:E.ground,glow:false},E)+C(x,y,32,{stroke:E.ink,sw:1.5},E)+C(x,y,18,{fill:E.cyan},E);}
  for(let i=0;i<p.stages;i++){const a0=-Math.PI/2+i*2*Math.PI/p.stages+0.22, a1=a0+2*Math.PI/p.stages-0.44;
   const broke=(i===p.brokenArc);
   s+=arcArrow(cx,cy,r+80,a0,a1,broke?E.pink:E.ink,E,broke?8:20);}
  return s;}},

H30:{name:"Kill Switch",edition:"dark",canvas:[1024,1024],encodes:"it can be stopped instantly, by design",
 params:{tripped:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s=C(400,400,120,{fill:E.pink},E)+C(400,400,80,{stroke:E.ground,sw:3,glow:false},E);
  s+=R(300,510,200,90,{stroke:E.white,sw:3},E);
  for(let i=0;i<4;i++)s+=C(320+i*50,560,6,{fill:E.white,glow:false},E);
  s+=P("M250 400 A150 170 0 0 1 550 400",{stroke:E.white,sw:2.5},E);
  s+=L(250,400,250,470,E.white,2.5,true,E)+L(550,400,550,470,E.white,2.5,true,E);
  s+=trace([[500,600],[700,600],[700,700]],E.pink,E,{sw:2.5});
  s+=C(700,720,10,{fill:E.white},E)+C(700,860,10,{fill:E.white},E);
  s+=L(700,720,p.tripped?760:700,860,p.tripped?E.faint:E.cyan,4,!p.tripped,E);
  return s;}},

H31:{name:"Turnstile",edition:"dark",canvas:[1024,1024],encodes:"permission is checked at every entry, not once",
 params:{queue:{d:6,min:0,max:10},lockdown:{d:0,min:0,max:1}},
 draw:(p,E)=>{const c=p.lockdown?E.pink:E.cyan;let s=R(480,420,64,340,{stroke:E.white,sw:3},E);
  for(let i=0;i<3;i++){const a=i*2*Math.PI/3-0.5;s+=L(512,440,512+Math.cos(a)*160,440+Math.sin(a)*160,E.white,6,true,E);}
  s+=R(468,300,88,110,{stroke:c,sw:3},E)+R(486,330,52,10,{fill:c},E)+C(512,375,10,{fill:c},E);
  for(let i=0;i<p.queue;i++)s+=R(60+i*58,600,34,34,{stroke:E.white,sw:2},E);
  s+=R(760,600,34,34,{stroke:E.cyan,sw:2},E);
  s+=R(400,600,34,34,{fill:E.pink},E)+C(370,560,16,{stroke:E.pink,sw:2},E)
    +L(362,552,378,568,E.pink,2,true,E)+L(378,552,362,568,E.pink,2,true,E);
  return s;}},

H32:{name:"Audit Trail",edition:"light",canvas:[1024,576],encodes:"everything that happened is recorded, in order",
 params:{checkpoints:{d:3,min:1,max:6},torn:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s=P("M0 480 L1024 120",{stroke:E.ink,sw:2.5},E)+P("M0 570 L1024 210",{stroke:E.ink,sw:2.5},E);
  for(let i=0;i<26;i++){const t=i/26;const x=40+t*940, y=505-t*350;
   s+=C(x,y,5,{stroke:E.ink,sw:1.2},E);}
  s+=C(60,520,90,{stroke:E.ink,sw:3},E)+C(60,520,26,{stroke:E.ink,sw:2},E);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;s+=L(60+Math.cos(a)*26,520+Math.sin(a)*26,60+Math.cos(a)*88,520+Math.sin(a)*88,E.ink,1.4,false,E);}
  for(let i=0;i<p.checkpoints;i++){const t=(i+1)/(p.checkpoints+1);const x=100+t*820, y=470-t*330;
   s+=G(R(x-40,y-40,80,80,{stroke:E.ink,sw:2.5,fill:HATCH},E),`rotate(-19 ${x} ${y})`);}
  if(p.torn){const x=640,y=250;s+=P(`M${x} ${y+70} l14 -16 l-16 -14 l16 -16 l-14 -16`,{stroke:E.pink,sw:3},E);}
  return s;}},

H34:{name:"Guardrails",edition:"dark",canvas:[1024,576],encodes:"freedom to move, but only inside the safe corridor",
 params:{width:{d:1,min:0.5,max:1.6},posts:{d:8,min:3,max:14}},
 draw:(p,E)=>{const vx=512,vy=120;const w=380*p.width;
  let s=R(0,0,1024,576,{fill:"none"},E);
  s+=POLY([[0,576],[512-w/2,vy],[0,vy]],{fill:HATCH,stroke:"none",glow:false},E);
  s+=POLY([[1024,576],[512+w/2,vy],[1024,vy]],{fill:HATCH,stroke:"none",glow:false},E);
  s+=L(60,576,vx-w/2,vy,E.cyan,3,true,E)+L(964,576,vx+w/2,vy,E.cyan,3,true,E);
  for(let i=0;i<p.posts;i++){const t=i/p.posts;
   const lx=60+(vx-w/2-60)*t, rx=964+(vx+w/2-964)*t, y=576+(vy-576)*t, h=60*(1-t*0.7);
   s+=L(lx,y,lx,y-h,E.cyan,2,true,E)+L(rx,y,rx,y-h,E.cyan,2,true,E);}
  s+=P("M512 576 C 420 470, 600 380, 500 300 S 540 200, 512 140",{stroke:E.white,sw:3},E);
  for(let i=0;i<3;i++){const x=[120,900,180][i], y=[480,430,300][i];
   s+=C(x,y,10,{stroke:E.faint,sw:2,glow:false},E)+L(x-7,y-7,x+7,y+7,E.faint,2,false,E)+L(x+7,y-7,x-7,y+7,E.faint,2,false,E);}
  return s;}},

H53:{name:"Airlock",edition:"light",canvas:[1024,1024],encodes:"a controlled transition, one door at a time",
 params:{outerOpen:{d:1,min:0,max:1}},
 draw:(p,E)=>{let s=R(200,360,624,300,{stroke:E.ink,sw:3,rx:150,fill:HATCH},E);
  s+=R(240,400,544,220,{stroke:E.ink,sw:1.5,fill:E.ground,glow:false},E);
  for(let i=0;i<6;i++)s+=L(300+i*90,400,300+i*90,620,E.ink,1.4,false,E);
  s+=C(240,510,140,{stroke:E.ink,sw:3},E)+C(240,510,50,{stroke:E.ink,sw:2},E);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;s+=L(240+Math.cos(a)*50,510+Math.sin(a)*50,240+Math.cos(a)*130,510+Math.sin(a)*130,E.ink,2,false,E);}
  const oa=p.outerOpen?-55:0;
  s+=G(C(784,510,140,{stroke:E.ink,sw:3},E)+C(784,510,50,{stroke:E.ink,sw:2},E),`rotate(${oa} 784 650)`);
  s+=P("M300 360 C 380 240, 640 240, 724 360",{stroke:E.ink,sw:2.5},E);
  s+=C(420,268,22,{stroke:E.cyan,sw:2},E)+C(604,268,22,{stroke:E.ink,sw:2},E);
  return s;}},

/* ---------- RISK AND FAILURE ---------- */
H04:{name:"Crossed-Out Legacy",edition:"dark",canvas:[1024,1024],encodes:"discontinued, do not use",
 params:{},
 draw:(p,E)=>{const F={...E,glow:false};let s=panel(112,212,800,600,E.faint,F);
  s+=R(200,430,220,140,{stroke:E.faint,sw:2,glow:false},F)+R(604,430,220,140,{stroke:E.faint,sw:2,glow:false},F);
  s+=arrow(420,500,604,500,E.faint,F,2,14);
  s+=L(112,212,912,812,E.faint,14,false,F)+L(912,212,112,812,E.faint,14,false,F);
  return s;}},

H08:{name:"Mirror Access Gate",edition:"dark",canvas:[1024,1024],encodes:"a binary gate, one path blocked, one flowing",
 params:{lanes:{d:10,min:4,max:14}},
 draw:(p,E)=>{let s="";
  for(let side=0;side<2;side++){const denied=side===0, c=denied?E.pink:E.cyan, dir=denied?1:-1, x0=denied?60:964;
   for(let i=0;i<p.lanes;i++){const y=120+i*(784/(p.lanes-1));
    const gx=denied?430:594;
    s+=trace([[x0,y],[x0+dir*180,y],[gx-dir*30,y]],c,E,{sw:1.6,tokens:false});
    if(denied){s+=C(gx-24,y,9,{stroke:c,sw:2},E)+L(gx-30,y-6,gx-18,y+6,c,2,true,E)+L(gx-18,y-6,gx-30,y+6,c,2,true,E);}
    else s+=trace([[gx+30,y],[gx+70,y]],c,E,{sw:1.6,tokens:false});}
   for(let k=0;k<4;k++){const y=200+k*210, gx=denied?470:554;
    s+=POLY(denied?[[gx,y-60],[gx+40,y],[gx,y+60]]:[[gx,y-60],[gx-40,y],[gx,y+60]],{stroke:c,sw:2.5},E);}
   s+=panel(denied?150:614,860,260,110,c,E);}
  return s;}},

H35:{name:"Failover Pair",edition:"dark",canvas:[1024,1024],encodes:"if this dies, that takes over, automatically",
 params:{liveLeft:{d:1,min:0,max:1},outage:{d:0,min:0,max:1}},
 draw:(p,E)=>{const mod=(x,c,glow)=>{let m=panel(x,300,240,420,c,glow?E:{...E,glow:false});
   for(let i=0;i<5;i++)m+=trace([[x+30,350+i*80],[x+120,350+i*80],[x+120,390+i*80],[x+210,390+i*80]],c,glow?E:{...E,glow:false},{sw:1.6,tokens:false});
   for(let i=0;i<4;i++)m+=R(x+40+i*50,660,20,20,{fill:c,glow:glow},glow?E:{...E,glow:false});
   return m;};
  const L1=p.outage?false:!!p.liveLeft, R1=p.outage?false:!p.liveLeft;
  let s=mod(180,L1?E.cyan:E.faint,L1)+mod(604,R1?E.cyan:E.faint,R1);
  s+=P("M420 512 l30 0 l14 -30 l24 60 l16 -30 l40 0 l14 -22 l20 44 l14 -22 l32 0",{stroke:E.white,sw:2},E);
  s+=C(512,760,12,{fill:E.white},E);
  s+=trace([[512,760],[512,800],[L1?300:724,800]],E.white,E,{sw:2,tokens:false});
  return s;}},

H36:{name:"Radar Sweep",edition:"dark",canvas:[1024,1024],encodes:"continuous detection, nothing gets past",
 params:{sweep:{d:40,min:0,max:359},contacts:{d:3,min:0,max:8}},
 draw:(p,E)=>{const cx=512,cy=512;let s="";
  [120,210,300,380].forEach(r=>{s+=C(cx,cy,r,{stroke:E.mist,sw:1.4},E);});
  for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=L(cx,cy,cx+Math.cos(a)*380,cy+Math.sin(a)*380,E.mist,1,false,E);}
  for(let i=0;i<30;i++){const a=i*Math.PI/15;s+=L(cx+Math.cos(a)*380,cy+Math.sin(a)*380,cx+Math.cos(a)*400,cy+Math.sin(a)*400,E.mist,2,false,E);}
  const a=p.sweep*Math.PI/180;
  s+=`<path d="M${cx} ${cy} L${n(cx+Math.cos(a-0.7)*380)} ${n(cy+Math.sin(a-0.7)*380)} A380 380 0 0 1 ${n(cx+Math.cos(a)*380)} ${n(cy+Math.sin(a)*380)} Z" fill="${E.cyan}" opacity="0.16"/>`;
  s+=L(cx,cy,cx+Math.cos(a)*380,cy+Math.sin(a)*380,E.cyan,3,true,E);
  for(let i=0;i<p.contacts;i++){const t=i*2.3, r=140+((i*97)%220);
   const x=cx+Math.cos(t)*r, y=cy+Math.sin(t)*r;
   s+=R(x-10,y-10,20,20,{fill:i===0?E.pink:E.cyan},E);}
  return s;}},

H37:{name:"Black Box and Glass Box",edition:"dark",canvas:[1024,576],encodes:"opaque versus inspectable",
 params:{},
 draw:(p,E)=>{const F={...E,glow:false};
  let s=isoBlock(140,220,240,120,180,E.faint,F,E.faint);
  s+=POLY([[140,220],[380,160],[452,202],[212,262]],{fill:E.ground,stroke:E.faint,glow:false},F);
  s+=isoBlock(600,220,240,120,180,E.cyan,E,E.cyan);
  s+=gear(700,330,44,12,E.cyan,E,{});
  s+=trace([[640,400],[700,400],[700,360]],E.cyan,E,{sw:1.6,tokens:false});
  s+=C(790,300,14,{stroke:E.cyan},E)+C(760,370,10,{fill:E.cyan},E);
  s+=arrow(40,320,130,320,E.white,E,3,14)+arrow(460,320,560,320,E.white,E,3,14);
  s+=arrow(500,320,590,320,E.white,E,3,14)+arrow(910,320,1000,320,E.white,E,3,14);
  return s;}},

H38:{name:"Iceberg",edition:"light",canvas:[1024,1024],encodes:"the visible part is a fraction of the whole",
 params:{ratio:{d:5,min:2,max:9}},
 draw:(p,E)=>{const wl=300;let s=L(0,wl,1024,wl,E.ink,2.5,false,E);
  s+=POLY([[512,wl-150],[622,wl],[402,wl]],{stroke:E.ink,sw:3},E);
  const depth=140+p.ratio*80;
  s+=POLY([[402,wl],[622,wl],[860,wl+depth*0.6],[512,wl+depth],[164,wl+depth*0.55]],{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=gear(400,520,60,14,E.ink,E,{})+gear(640,640,44,12,E.ink,E,{});
  s+=R(300,700,180,60,{stroke:E.ink,sw:2},E)+R(560,760,160,50,{stroke:E.ink,sw:2},E);
  for(let i=0;i<8;i++)s+=C(260+i*70,620+((i%2)*40),8,{stroke:E.ink,sw:1.5},E);
  s+=L(90,wl,90,wl+depth,E.ink,1.2,false,E)+arrow(90,wl+60,90,wl,E.ink,{...E,glow:false},1.2,10)+arrow(90,wl+depth-60,90,wl+depth,E.ink,{...E,glow:false},1.2,10);
  return s;}},

H39:{name:"Tipping Point",edition:"light",canvas:[1024,1024],encodes:"it holds, until suddenly it does not",
 params:{tilt:{d:12,min:-20,max:30}},
 draw:(p,E)=>{let s=POLY([[512,660],[452,900],[572,900]],{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=G(R(262,580,500,80,{stroke:E.ink,sw:3},E)+R(600,480,140,100,{stroke:E.ink,sw:2.5,fill:HATCH},E),`rotate(${p.tilt} 512 660)`);
  s+=C(512,660,9,{fill:E.pink},E);
  s+=P("M760 640 A 260 260 0 0 1 850 800",{stroke:E.ink,sw:1.5,dash:"8 6"},E);
  s+=L(512,660,780,660,E.ink,1,false,E)+P(`M660 660 A 148 148 0 0 0 ${n(512+148*Math.cos(p.tilt*Math.PI/180))} ${n(660+148*Math.sin(p.tilt*Math.PI/180))}`,{stroke:E.ink,sw:1.2},E);
  s+=L(120,900,904,900,E.ink,3,false,E);
  return s;}},

/* ---------- GROWTH AND MOMENTUM ---------- */
H07:{name:"Ascension Staircase",edition:"dark",canvas:[1024,576],encodes:"a mandatory, gated climb where height is capability",
 params:{steps:{d:3,min:2,max:5},unlocked:{d:-1,min:-1,max:4}},
 draw:(p,E)=>{const cols=[E.cyan,E.white,E.pink,E.cyan,E.pink];let s="";
  for(let i=0;i<6;i++)s+=L(60+i*160,540,180+i*160,420,E.line,1,false,E);
  for(let i=0;i<p.steps;i++){const x=140+i*200, y=470-i*110;
   s+=isoBlock(x,y,190,110,90,cols[i],E,E.mist);
   s+=padlock(x+95,y+90,54,cols[i],E,i===p.unlocked);
   s+=trace([[x+230,y+20],[x+300,y-10],[980,y-10]],E.mist,E,{sw:1.2,tokens:false});}
  return s;}},

H09:{name:"Journey Spine",edition:"dark",canvas:[1024,576],encodes:"one continuous connected path, no gaps",
 params:{phases:{d:6,min:3,max:8},zigzag:{d:1,min:0,max:1}},
 draw:(p,E)=>{let s=`<rect x="12" y="279" width="1000" height="18" rx="9" fill="url(#spine)" filter="url(#glow)"/>`;
  for(let i=0;i<p.phases;i++){const x=70+i*(884/(p.phases-1)), up=p.zigzag? i%2===0 : true;
   const c=i/(p.phases-1)<0.5?E.cyan:E.pink;
   s+=POLY([[x,270],[x+18,288],[x,306],[x-18,288]],{fill:E.white},E);
   s+=L(x,up?270:306,x,up?240:336,E.white,2,true,E);
   s+=panel(x-95,up?60:356,190,170,c,E);}
  return s;}},

H15:{name:"Escalation Ramp",edition:"light",canvas:[1024,576],encodes:"proportional response, height is severity",
 params:{treads:{d:4,min:3,max:6}},
 draw:(p,E)=>{const cols=[E.cyan,E.mist,E.mist,E.pink,E.pink,E.pink];let s="";
  for(let i=0;i<p.treads;i++){const x=90+i*170, y=460-i*90;
   s+=isoBlock(x,y,150,80,60,E.ink,E,E.ink);
   s+=R(x+20,y-52,110,50,{stroke:E.ink,sw:2,fill:cols[Math.min(i,cols.length-1)]},E);
   s+=L(x,y+60,x+30,y+118,E.ink,1.6,false,E)+L(x+150,y+30,x+180,y+88,E.ink,1.6,false,E);}
  const tx=90+(p.treads-1)*170;
  s+=POLY([[tx+40,460-(p.treads-1)*90-70],[tx+58,460-(p.treads-1)*90-40],[tx+22,460-(p.treads-1)*90-40]],{stroke:E.pink,sw:2},E);
  s+=C(tx+90,460-(p.treads-1)*90-60,12,{fill:E.pink},E);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;s+=L(tx+90+Math.cos(a)*18,460-(p.treads-1)*90-60+Math.sin(a)*18,tx+90+Math.cos(a)*30,460-(p.treads-1)*90-60+Math.sin(a)*30,E.pink,1.5,false,E);}
  s+=gear(120,540,26,10,E.ink,E,{})+gear(220,548,20,10,E.ink,E,{});
  s+=arrow(120,520,tx+40,460-(p.treads-1)*90+40,E.ink,{...E,glow:false},6,22);
  return s;}},

H16:{name:"Flywheel",edition:"light",canvas:[1024,1024],encodes:"compounding, each turn makes the next easier",
 params:{stages:{d:6,min:4,max:8},accel:{d:0,min:0,max:1}},
 draw:(p,E)=>{const cx=512,cy=512;
  let s=gear(cx,cy,280,24,E.ink,E,{fill:E.ink,bolts:false});
  s+=C(cx,cy,180,{stroke:E.ground,sw:2,glow:false},E)+C(cx,cy,120,{stroke:E.ground,sw:2,glow:false},E)+C(cx,cy,40,{fill:E.cyan},E);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;s+=L(cx+Math.cos(a)*50,cy+Math.sin(a)*50,cx+Math.cos(a)*170,cy+Math.sin(a)*170,E.ground,6,false,E);}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=C(cx+Math.cos(a)*220,cy+Math.sin(a)*220,8,{fill:E.ground,glow:false},E);}
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;
   s+=gear(cx+Math.cos(a)*330,cy+Math.sin(a)*330,64,10,i%2?E.cyan:E.pink,E,{});}
  for(let i=0;i<p.stages;i++){const a0=i*2*Math.PI/p.stages+0.14, a1=a0+2*Math.PI/p.stages-0.28;
   const w=p.accel? 10+i*4 : 20;
   s+=arcArrow(cx,cy,420,a0,a1,E.ink,E,w);
   const a=i*2*Math.PI/p.stages;
   s+=chipPkg(cx+Math.cos(a)*420,cy+Math.sin(a)*420,60,E.cyan,E);}
  return s;}},

H40:{name:"Version Tree",edition:"dark",canvas:[1024,1024],encodes:"one lineage, branching, but with one main line",
 params:{branches:{d:5,min:2,max:8},abandoned:{d:2,min:0,max:4}},
 draw:(p,E)=>{let s=trace([[512,950],[512,60]],E.cyan,E,{sw:4,tokens:false});
  for(let i=0;i<12;i++)s+=C(512,900-i*72,7,{fill:E.cyan},E);
  for(let i=0;i<p.branches;i++){const y=840-i*140, dir=i%2?1:-1, dead=i>=p.branches-p.abandoned;
   const x=512+dir*(150+i*22);
   const F=dead?{...E,glow:false}:E;const c=dead?E.faint:E.cyan;
   s+=trace([[512,y],[x,y],[x,y-110]],c,F,{sw:2,tokens:false});
   if(dead){s+=C(x,y-124,10,{stroke:c,sw:2,glow:false},F)+L(x-7,y-131,x+7,y-117,c,2,false,F)+L(x+7,y-131,x-7,y-117,c,2,false,F);}
   else s+=trace([[x,y-110],[x,y-170],[512,y-170]],c,F,{sw:2,tokens:false});}
  return s;}},

H41:{name:"Ratchet",edition:"dark",canvas:[1024,1024],encodes:"progress that cannot slip backwards",
 params:{teeth:{d:16,min:8,max:26}},
 draw:(p,E)=>{const cx=490,cy=530,r=260;let d="";
  for(let i=0;i<p.teeth;i++){const a=i*2*Math.PI/p.teeth, b=(i+1)*2*Math.PI/p.teeth;
   d+=`${i?"L":"M"}${n(cx+Math.cos(a)*r)} ${n(cy+Math.sin(a)*r)} L${n(cx+Math.cos(a)*(r*1.2))} ${n(cy+Math.sin(a)*(r*1.2))} L${n(cx+Math.cos(b)*r)} ${n(cy+Math.sin(b)*r)} `;}
  d+="Z";
  let s=P(d,{stroke:E.white,sw:2.5},E)+C(cx,cy,60,{stroke:E.white,sw:2},E)+C(cx,cy,16,{fill:E.white},E);
  s+=POLY([[cx+300,cy-190],[cx+250,cy-120],[cx+310,cy-90]],{stroke:E.white,sw:3},E);
  s+=P(`M${cx+300} ${cy-190} l40 -20 l-24 -22 l40 -20`,{stroke:E.white,sw:2},E);
  s+=arcArrow(cx,cy,360,-2.4,-0.9,E.cyan,E,16);
  s+=arcArrow(cx,cy,360,-0.2,-1.5,E.pink,E,16);
  for(let i=0;i<4;i++){const a=-1.5+i*0.12;s+=L(cx+Math.cos(a)*330,cy+Math.sin(a)*330,cx+Math.cos(a)*390,cy+Math.sin(a)*390,E.pink,2,true,E);}
  return s;}},

H42:{name:"Sync Handshake",edition:"dark",canvas:[1024,1024],encodes:"two systems agreeing, continuously",
 params:{drift:{d:0,min:0,max:90}},
 draw:(p,E)=>{const dial=(cx,c,ang)=>{let m=C(cx,512,180,{stroke:c,sw:3},E)+C(cx,512,14,{fill:c},E);
   for(let i=0;i<24;i++){const a=i*Math.PI/12;m+=L(cx+Math.cos(a)*160,512+Math.sin(a)*160,cx+Math.cos(a)*178,512+Math.sin(a)*178,c,i%6?1.2:2.6,true,E);}
   const t=(ang-90)*Math.PI/180;
   m+=L(cx,512,cx+Math.cos(t)*140,512+Math.sin(t)*140,c,5,true,E);return m;};
  let s=dial(280,E.cyan,45)+dial(744,E.pink,45+p.drift);
  s+=P("M460 440 C 560 360, 660 360, 760 440",{stroke:E.white,sw:2.5},E)+arrow(700,392,764,436,E.white,E,2.5,14);
  s+=P("M760 584 C 660 664, 560 664, 460 584",{stroke:E.white,sw:2.5},E)+arrow(520,632,458,588,E.white,E,2.5,14);
  return s;}},

H43:{name:"Compounding Spiral",edition:"dark",canvas:[1024,1024],encodes:"the same loop, but each turn is bigger",
 params:{turns:{d:4,min:2,max:6}},
 draw:(p,E)=>{const cx=512,cy=512;let d="",last=[cx,cy];
  const steps=p.turns*60;
  for(let i=0;i<=steps;i++){const t=i/steps, a=t*p.turns*2*Math.PI, r=40+t*400;
   const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r;
   d+=`${i?"L":"M"}${n(x)} ${n(y)} `;last=[x,y,a];}
  let s=`<path d="${d}" fill="none" stroke="url(#spine)" stroke-width="9" stroke-linecap="round" filter="url(#glow)"/>`;
  s+=arrow(last[0]-Math.cos(last[2])*30,last[1]-Math.sin(last[2])*30,last[0]+Math.cos(last[2]+1.2)*40,last[1]+Math.sin(last[2]+1.2)*40,E.pink,E,8,26);
  for(let i=1;i<=p.turns;i++){const r=40+(i/p.turns)*400;s+=R(cx+r-5,cy-5,10,10,{fill:E.cyan},E);}
  return s;}},

H44:{name:"The Press",edition:"light",canvas:[1024,1024],encodes:"pressure applied deliberately, producing value",
 params:{ram:{d:60,min:0,max:160}},
 draw:(p,E)=>{let s=P("M180 120 L720 120 L720 900 L580 900 L580 800 L300 800 L300 900 L180 900 Z",{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=R(380,160,160,180,{stroke:E.ink,sw:3,fill:E.ground,glow:false},E);
  s+=R(430,340,60,120+p.ram,{stroke:E.ink,sw:2.5},E);
  s+=R(340,460+p.ram,240,70,{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=R(300,640,320,60,{stroke:E.ink,sw:3},E);
  s+=POLY([[620,660],[780,660],[820,720],[660,720]],{stroke:E.ink,sw:2.5},E);
  s+=R(760,700,70,50,{stroke:E.cyan,sw:3},E);
  s+=C(250,260,40,{stroke:E.ink,sw:2},E)+C(650,260,40,{stroke:E.ink,sw:2},E);
  for(let i=0;i<8;i++)s+=C(220+i*40,880,8,{fill:E.ink,glow:false},E);
  return s;}},

H45:{name:"Launch Rail",edition:"dark",canvas:[1024,576],encodes:"everything is built, all that remains is release",
 params:{released:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s=L(80,520,860,90,E.white,4,true,E)+L(110,560,890,130,E.white,4,true,E);
  for(let i=0;i<12;i++){const t=i/12;s+=L(80+t*780,520-t*430,110+t*780,560-t*430,E.mist,1.6,true,E);}
  s+=G(POLY([[0,0],[120,0],[150,-30],[120,-60],[0,-60]],{stroke:E.cyan,sw:3},E),`translate(300,420) rotate(-29)`);
  s+=P("M170 500 L120 560 L230 560 Z",{stroke:p.released?E.faint:E.pink,sw:3},E);
  s+=P("M60 300 L160 470 M60 300 L20 300",{stroke:E.cyan,sw:2.5},E);
  s+=P("M700 60 L640 200 M700 60 L760 60",{stroke:E.cyan,sw:2.5},E);
  return s;}},

H46:{name:"North Star",edition:"dark",canvas:[1024,1024],encodes:"one metric everything else serves",
 params:{nodes:{d:18,min:6,max:30},misaligned:{d:0,min:0,max:1}},
 draw:(p,E)=>{let s="";
  for(let i=0;i<p.nodes;i++){const x=120+((i*137)%800), y=420+((i*211)%520);
   const bad=(p.misaligned&&i===0);
   s+=L(x,y,bad?60:512,bad?900:140,E.cyan,1,true,E);
   s+=R(x-7,y-7,14,14,{fill:bad?E.faint:E.cyan,glow:!bad},bad?{...E,glow:false}:E);}
  s+=C(512,140,30,{fill:E.pink},E)+C(512,140,52,{stroke:E.pink,sw:2},E);
  return s;}},

H50:{name:"Cadence Wheel",edition:"dark",canvas:[1024,1024],encodes:"it happens on a rhythm, not on a whim",
 params:{pulses:{d:14,min:5,max:20},missed:{d:-1,min:-1,max:19}},
 draw:(p,E)=>{let s=gear(330,500,160,20,E.white,E,{});
  s+=G(L(330,180,330,800,E.white,4,true,E)+C(330,800,40,{stroke:E.white,sw:3},E),`rotate(12 330 180)`);
  s+=POLY([[470,440],[540,470],[470,500]],{stroke:E.white,sw:2.5},E);
  for(let i=0;i<p.pulses;i++){const x=590+i*(400/p.pulses);
   if(i===p.missed)continue;
   s+=L(x,440,x,580,E.cyan,3,true,E);}
  return s;}},

/* ---------- DECISION AND CLOSE ---------- */
H10:{name:"Cutaway Engine",edition:"light",canvas:[1024,1024],encodes:"the whole system as one serviceable machine",
 params:{gears:{d:3,min:1,max:5},failing:{d:0,min:0,max:1}},
 draw:(p,E)=>{const cx=512,cy=480;
  let s=`<path d="M${cx} ${cy} m-300 0 a300 300 0 1 1 600 0 a300 300 0 1 1 -600 0 M${cx} ${cy} l0 -300 A300 300 0 0 1 ${n(cx+300*Math.cos(-0.3))} ${n(cy+300*Math.sin(-0.3))} Z" fill="${HATCH}" fill-rule="evenodd" stroke="${E.ink}" stroke-width="3"/>`;
  s+=C(cx,cy,300,{stroke:E.ink,sw:3},E)+C(cx,cy,240,{stroke:E.ink,sw:1.5},E);
  s+=C(cx,cy,90,{fill:p.failing?E.pink:E.cyan},E);
  const rs=[140,100,74,60,50];
  for(let i=0;i<p.gears;i++){const a=-0.6+i*1.5;
   s+=gear(cx+Math.cos(a)*180,cy+Math.sin(a)*180,rs[i],12,E.ink,E,{});}
  s+=R(60,440,240,80,{stroke:E.ink,sw:3,fill:HATCH},E)+C(300,480,18,{stroke:E.ink,sw:2},E);
  s+=R(724,440,240,80,{stroke:E.ink,sw:3,fill:HATCH},E)+C(724,480,18,{stroke:E.ink,sw:2},E);
  s+=R(300,800,424,60,{stroke:E.ink,sw:3,fill:HATCH},E);
  s+=R(420,815,180,30,{stroke:E.ink,sw:1.6},E)+C(432,830,4,{fill:E.ink},E)+C(588,830,4,{fill:E.ink},E);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=L(cx+Math.cos(a)*318,cy+Math.sin(a)*318,cx+Math.cos(a)*340,cy+Math.sin(a)*340,E.ink,2,false,E);}
  return s;}},

H14:{name:"Concentric Shield",edition:"light",canvas:[1024,1024],encodes:"defence in depth",
 params:{rings:{d:3,min:2,max:5},gapRing:{d:-1,min:-1,max:4}},
 draw:(p,E)=>{const sh=k=>`M512 ${140+(1-k)*120} L${512+300*k} ${300+(1-k)*90} L${512+300*k} ${560+(1-k)*40} Q512 ${880-(1-k)*80} ${512-300*k} ${560+(1-k)*40} L${512-300*k} ${300+(1-k)*90} Z`;
  let s="";
  for(let i=0;i<p.rings;i++){const k=1-i*(0.7/p.rings), gap=(i===p.gapRing);
   s+=P(sh(k),{stroke:gap?E.faint:(i===1?E.cyan:E.ink),sw:4-i,dash:gap?"10 8":null,fill:i===0?HATCH:E.ground},E);}
  const hex=[];for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;hex.push([512+Math.cos(a)*80,500+Math.sin(a)*80]);}
  s+=POLY(hex,{stroke:E.ink,sw:2.5},E);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;const r0=340+((i*37)%40);
   s+=L(512+Math.cos(a)*r0,500+Math.sin(a)*r0,512+Math.cos(a)*(r0+70),500+Math.sin(a)*(r0+70),E.ink,1,false,E);
   s+=C(512+Math.cos(a)*(r0+78),500+Math.sin(a)*(r0+78),4,{fill:E.ink,glow:false},E);}
  s+=padlock(512,760,70,E.ink,E);
  return s;}},

H51:{name:"The Lever",edition:"light",canvas:[1024,1024],encodes:"the whole decision is one physical act",
 params:{angle:{d:0,min:-30,max:30}},
 draw:(p,E)=>{let s=R(300,700,424,160,{stroke:E.ink,sw:3,fill:HATCH},E);
  [340,684].forEach(x=>{s+=C(x,740,12,{stroke:E.ink,sw:2},E);s+=C(x,820,12,{stroke:E.ink,sw:2},E);});
  s+=P("M280 420 A 260 260 0 0 1 744 420",{stroke:E.ink,sw:3},E);
  [-30,0,30].forEach(a=>{const t=(a-90)*Math.PI/180;
   const c=(a===30)?E.cyan:E.ink;
   s+=C(512+Math.cos(t)*260,700+Math.sin(t)*260,16,{stroke:c,sw:a===30?3:2},E);});
  const t=(p.angle-90)*Math.PI/180;
  s+=L(512,700,512+Math.cos(t)*250,700+Math.sin(t)*250,E.ink,12,false,E);
  s+=C(512,700,26,{stroke:E.ink,sw:3,fill:E.ground,glow:false},E)+C(512,700,8,{fill:E.ink},E);
  s+=G(R(-26,-70,52,70,{stroke:E.ink,sw:3,fill:HATCH},E),`translate(${n(512+Math.cos(t)*260)},${n(700+Math.sin(t)*260)}) rotate(${p.angle})`);
  s+=P("M470 700 l-30 -20 l30 -20 l-30 -20",{stroke:E.ink,sw:2},E);
  return s;}},

H54:{name:"Countdown Gantry",edition:"light",canvas:[1024,1024],encodes:"the sequence has already started",
 params:{arms:{d:4,min:2,max:6},connected:{d:1,min:0,max:6}},
 draw:(p,E)=>{let s=L(440,100,440,940,E.ink,4,false,E)+L(560,100,560,940,E.ink,4,false,E);
  for(let i=0;i<14;i++){const y=100+i*60;s+=L(440,y,560,y+60,E.ink,1.4,false,E)+L(560,y,440,y+60,E.ink,1.4,false,E);}
  for(let i=0;i<p.arms;i++){const y=200+i*(600/(p.arms-1));
   const swung = i >= p.connected;
   const arm=R(0,-16,240,32,{stroke:swung?E.ink:E.pink,sw:3,fill:HATCH},E)+R(60,-40,60,24,{stroke:swung?E.ink:E.pink,sw:2},E);
   s+=G(arm,`translate(560,${y}) rotate(${swung?-52:0})`);
   s+=C(560,y,10,{fill:E.ink},E);}
  s+=R(380,940,240,50,{stroke:E.ink,sw:3,fill:HATCH},E);
  return s;}},

H55:{name:"Control Tower",edition:"dark",canvas:[1024,576],encodes:"one place where the whole system is visible",
 params:{panels:{d:6,min:3,max:8},alert:{d:2,min:-1,max:7}},
 draw:(p,E)=>{let s="";const N=p.panels;
  for(let i=0;i<N;i++){const t=i/(N-1)-0.5;
   const x=512+t*820-120, y=120+Math.abs(t)*70;
   const c=(i===p.alert)?E.pink:E.cyan;
   s+=panel(x,y,240,180,c,E,10);
   if(i%3===0){s+=P(`M${x+50} ${y+140} A70 70 0 0 1 ${x+190} ${y+140}`,{stroke:c,sw:2},E)+L(x+120,y+140,x+160,y+90,c,2.5,true,E);}
   else if(i%3===1){for(let k=0;k<4;k++)s+=R(x+40+k*45,y+140-((k*20)%60)-20,26,((k*20)%60)+20,{stroke:c,sw:1.6},E);}
   else {s+=trace([[x+40,y+120],[x+90,y+80],[x+140,y+130],[x+200,y+70]],c,E,{sw:2,tokens:false});}}
  s+=P("M340 470 L684 470 L724 560 L300 560 Z",{stroke:E.white,sw:2.5},E);
  s+=R(400,490,224,40,{stroke:E.white,sw:1.6},E);
  return s;}},

H56:{name:"Dashboard Wall",edition:"dark",canvas:[1024,576],encodes:"from today, this is all visible, daily",
 params:{cols:{d:4,min:2,max:5},rows:{d:2,min:1,max:3},alert:{d:5,min:-1,max:14}},
 draw:(p,E)=>{let s="";const w=(1024-40-(p.cols-1)*20)/p.cols, h=(576-40-(p.rows-1)*20)/p.rows;
  for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++){const i=r*p.cols+c, x=20+c*(w+20), y=20+r*(h+20);
   const col=(i===p.alert)?E.pink:E.cyan;
   s+=panel(x,y,w,h,col,E,12);
   s+=corner(x+8,y+8,col,E,0,26)+corner(x+w-8,y+h-8,col,E,180,26);
   const cx=x+w/2, cy=y+h/2+10;
   const kind=i%4;
   if(kind===0){s+=P(`M${cx-60} ${cy+20} A60 60 0 0 1 ${cx+60} ${cy+20}`,{stroke:col,sw:2},E)+L(cx,cy+20,cx+34,cy-24,col,2.5,true,E);}
   if(kind===1){s+=trace([[cx-60,cy+10],[cx-20,cy-20],[cx+16,cy+16],[cx+60,cy-30]],col,E,{sw:2,tokens:false});}
   if(kind===2){s+=R(cx-50,cy-20,36,50,{stroke:col,sw:2},E)+R(cx+10,cy-40,36,70,{stroke:col,sw:2},E);}
   if(kind===3){s+=C(cx,cy,36,{stroke:col,sw:2},E)+C(cx,cy,10,{fill:col},E);}}
  return s;}}
};

/* ---------- render one asset ---------- */
function render(id, overrides={}){
  const H = HEROES[id];
  if(!H) throw new Error("unknown asset: "+id);
  const E = TOKENS[H.edition];
  const p = {};
  for(const k in H.params) p[k] = (k in overrides) ? overrides[k] : H.params[k].d;
  return wrap(H.canvas[0], H.canvas[1], H.edition, H.draw(p, E));
}
function manifest(){
  return Object.entries(HEROES).map(([id,h])=>({
    id, name:h.name, edition:h.edition, canvas:h.canvas, encodes:h.encodes,
    params:Object.fromEntries(Object.entries(h.params).map(([k,v])=>[k,{default:v.d,min:v.min,max:v.max}]))
  }));
}

const API = { TOKENS, HEROES, render, manifest, wrap,
  n, L, R, C, P, POLY, G, HATCH, gl,
  trace, river, node, arrow, arcArrow, panel, corner, chip, chipPkg, padlock, gear, ring, isoBlock };
if (typeof module !== "undefined") module.exports = API;
