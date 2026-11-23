/* one bundler, used everywhere, so the browser build and the node build never diverge */
const fs = require("fs");
const strip = (f, pats) => { let s = fs.readFileSync(f, "utf8"); pats.forEach(p => s = s.replace(p, "")); return s; };
const EXPORTS = [
  /if\s*\(typeof module[^\n]*module\.exports\s*=\s*\{[\s\S]*?\};/,   // guarded export, whole statement
  /module\.exports\s*=\s*[A-Za-z0-9_]+;/,                            // module.exports = API;
  /module\.exports\s*=\s*\{[\s\S]*?\};/,                             // plain object export
];
const kit = strip("signal-kit.js",   [/const API = \{[\s\S]*?module\.exports = API;/, ...EXPORTS]);
const det = strip("signal-detail.js",[/const K = require\('\.\/signal-kit\.js'\);/, /const \{ TOKENS, HEROES, wrap[\s\S]*?\} = K;/, /const API2 = \{[\s\S]*?module\.exports = API2;/, ...EXPORTS]);
const shd = strip("signal-shade.js", [/const K = require\('\.\/signal-detail\.js'\);/, /const \{ n, L, R, C, P, POLY, G \} = K;/, ...EXPORTS]);
let mdl = strip("signal-app-model.js", [...EXPORTS]);
const m40 = strip("signal-master40.js", [...EXPORTS]);
mdl = mdl.replace("/*M40*/", m40);

const bundle = [kit, det, shd].join("\n");
let html = fs.readFileSync("editor-shell.html", "utf8").replace("/*BUNDLE*/", bundle).replace("/*MODEL*/", mdl);
fs.writeFileSync("signal-studio.html", html);

// HARD CHECK: parse each inline script exactly as a browser would
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let bad = 0;
scripts.forEach((s, i) => {
  if (!s.trim()) return;
  try { new Function(s); } catch (e) { console.log(`SCRIPT ${i+1} SYNTAX ERROR: ${e.message}`); bad++; }
  if (/module\.exports|require\(/.test(s)) { console.log(`SCRIPT ${i+1} still contains node-only code`); bad++; }
});
console.log(bad ? `${bad} problem(s)` : `all ${scripts.filter(s=>s.trim()).length} inline scripts parse clean, no node-only code`);
console.log("size:", (fs.statSync("signal-studio.html").size/1024|0) + "KB");
