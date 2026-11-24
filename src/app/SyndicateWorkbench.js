"use client";
import { useState } from "react";
import ModelSelect from "./ModelSelect";
import Link from "next/link";

const box = { background: "#11141B", border: "1px solid #232836", borderRadius: 8, padding: 16, marginBottom: 14 };
const inp = { background: "#171B24", color: "#F2F5F9", border: "1px solid #232836", borderRadius: 6, padding: "7px 10px", fontSize: 12.5 };
const btn = { background: "#21E0DC", color: "#08090D", border: "none", borderRadius: 6, padding: "8px 13px", fontWeight: 700, cursor: "pointer", fontSize: 12.5 };
const pre = { background: "#050609", border: "1px solid #232836", borderRadius: 6, padding: 12, fontSize: 11.5, overflow: "auto", maxHeight: 240, color: "#c7d0dd", whiteSpace: "pre-wrap" };

const MODEL_OPTS = [
  ["nvidia-deepseek", "NVIDIA NIM · DeepSeek V4 Flash"],
  ["nvidia-qwen", "NVIDIA NIM · Qwen 3 235B"],
  ["nvidia-kimi", "NVIDIA NIM · Kimi K2.6"],
  ["groq-llama", "Groq · Llama 3.3 70B"],
  ["groq-qwen", "Groq · Qwen 3 32B"],
  ["mistral-small", "Mistral · Small Latest"],
  ["openrouter-free", "OpenRouter · Auto Free"]
];

const FIXTURES = [
  { name: "Arsenal vs Borussia Dortmund", lh: 1.85, la: 0.95 },
  { name: "Real Madrid vs PSV", lh: 2.35, la: 0.85 },
  { name: "Man City vs SSC Napoli", lh: 2.15, la: 1.05 },
  { name: "Club Brugge vs Liverpool", lh: 1.35, la: 1.85 },
  { name: "Sporting CP vs Man United", lh: 1.65, la: 1.30 },
  { name: "PSG vs AS Roma", lh: 2.40, la: 1.00 },
  { name: "Inter Milan vs VfB Stuttgart", lh: 1.75, la: 1.05 },
  { name: "Como 1907 vs AEK Athens", lh: 2.45, la: 0.90 }
];

function poisson(k, lam) { let f = 1; for (let i = 2; i <= k; i++) f *= i; return (Math.pow(lam, k) * Math.exp(-lam)) / f; }

export default function SyndicateWorkbench({ embed = false }) {
  const [idx, setIdx] = useState(3);
  const [modelKey, setModelKey] = useState("nvidia-deepseek");
  const [audit, setAudit] = useState("Click 'Run AI Bias Check' to audit this fixture using your selected model.");

  const fx = FIXTURES[idx];
  let pH = 0, pD = 0, pA = 0, ladder = [0, 0, 0, 0, 0];
  for (let h = 0; h <= 7; h++) for (let a = 0; a <= 7; a++) {
    const p = poisson(h, fx.lh) * poisson(a, fx.la);
    if (h > a) pH += p; else if (h === a) pD += p; else pA += p;
    for (let t = 0; t < 5; t++) if (h + a > t) ladder[t] += p;
  }

  async function runBias() {
    setAudit("Running AI Bias Check...");
    const r = await fetch("/api/syndicate-bias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fixture: fx.name,
        pHome: +(pH * 100).toFixed(1),
        pDraw: +(pD * 100).toFixed(1),
        pAway: +(pA * 100).toFixed(1),
        o25: +(ladder[2] * 100).toFixed(1),
        modelKey
      })
    });
    setAudit(JSON.stringify(await r.json(), null, 2));
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: embed ? "12px" : "22px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!embed && <Link href="/" style={{ color: "#21E0DC", textDecoration: "none", fontSize: 12, border: "1px solid #232836", padding: "5px 9px", borderRadius: 5 }}>← Hub</Link>}
          <span style={{ fontWeight: 800, color: "#21E0DC" }}>SYNDICATE // MATCHDAY AI {embed ? "(EMBED)" : ""}</span>
        </div>
        <ModelSelect value={modelKey} onChange={setModelKey} />
      </div>

      <div style={box}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select style={inp} value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
            {FIXTURES.map((f, i) => <option key={f.name} value={i}>{f.name}</option>)}
          </select>
          <button style={btn} onClick={runBias}>Run AI Bias Check</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 14 }}>
          <div style={{ background: "#171B24", padding: 10, borderRadius: 6 }}><div style={{ fontSize: 11, color: "#8B95A5" }}>Home Win</div><div style={{ fontSize: 20, fontWeight: 800, color: "#21E0DC" }}>{(pH * 100).toFixed(1)}%</div></div>
          <div style={{ background: "#171B24", padding: 10, borderRadius: 6 }}><div style={{ fontSize: 11, color: "#8B95A5" }}>Draw</div><div style={{ fontSize: 20, fontWeight: 800, color: "#21E0DC" }}>{(pD * 100).toFixed(1)}%</div></div>
          <div style={{ background: "#171B24", padding: 10, borderRadius: 6 }}><div style={{ fontSize: 11, color: "#8B95A5" }}>Away Win</div><div style={{ fontSize: 20, fontWeight: 800, color: "#21E0DC" }}>{(pA * 100).toFixed(1)}%</div></div>
          <div style={{ background: "#171B24", padding: 10, borderRadius: 6 }}><div style={{ fontSize: 11, color: "#8B95A5" }}>Over 2.5 Goals</div><div style={{ fontSize: 20, fontWeight: 800, color: "#F0245C" }}>{(ladder[2] * 100).toFixed(1)}%</div></div>
        </div>
      </div>

      <div style={box}>
        <div style={{ fontSize: 11.5, color: "#8B95A5", marginBottom: 8 }}>GOAL PROBABILITY LADDER (0.5 – 4.5)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
          {ladder.map((p, i) => (
            <div key={i} style={{ background: "#171B24", border: "1px solid #232836", padding: "8px 10px", borderRadius: 6, display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
              <span>Over {i + 0.5}</span><strong style={{ color: "#21E0DC" }}>{(p * 100).toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={box}>
        <div style={{ fontSize: 11.5, color: "#8B95A5", marginBottom: 6 }}>LIVE AI BIAS AUDIT</div>
        <pre style={pre}>{audit}</pre>
      </div>
    </div>
  );
}
