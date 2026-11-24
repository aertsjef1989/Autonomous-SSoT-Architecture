"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const card = { background: "#11141B", border: "1px solid #232836", borderRadius: 10, padding: 20, textDecoration: "none", color: "#F2F5F9", display: "block" };

export default function HomePage() {
  const [keys, setKeys] = useState(null);
  useEffect(() => { fetch("/api/providers").then((r) => r.json()).then(setKeys).catch(() => {}); }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "44px auto", padding: "0 20px" }}>
      <div style={{ fontSize: 12, letterSpacing: 1.2, color: "#21E0DC", fontWeight: 700, marginBottom: 8 }}>
        SYSTEMS DESIGN PORTFOLIO // LIVE VERCEL HUB
      </div>
      <h1 style={{ margin: "0 0 10px", fontSize: 28 }}>Select a Pillar Architecture</h1>
      <p style={{ color: "#8B95A5", margin: "0 0 26px", fontSize: 14 }}>
        All three systems share a unified 6-provider tiered LLM selector (NVIDIA NIM, Groq, Cerebras, Mistral, Gemini, OpenRouter) with automatic fallback when keys are not yet configured.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 16 }}>
        <Link href="/ssot" style={{ ...card, borderColor: "#22C55E" }}>
          <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 700 }}>DUAL-ROOT FILE TREE · T1–T10 TRACKERS · BOTS</div>
          <h2 style={{ margin: "8px 0" }}>I. Autonomous SSoT →</h2>
          <p style={{ color: "#8B95A5", fontSize: 13, margin: 0 }}>
            45-market dual-root file explorer with 6-tier RBAC inheritance, T1–T10 relational governance trackers, 23-command bot automations, and Station 7 LLM audit.
          </p>
        </Link>

        <Link href="/balaerion" style={{ ...card, borderColor: "#21E0DC" }}>
          <div style={{ fontSize: 11, color: "#21E0DC", fontWeight: 700 }}>OMNIROUTE GATEWAY · MCP · PROSPECTHUB</div>
          <h2 style={{ margin: "8px 0" }}>II. Balaerion →</h2>
          <p style={{ color: "#8B95A5", fontSize: 13, margin: 0 }}>
            Multi-provider AI router, ProspectHub OSINT + Scout evidence gate, Voice &amp; Outreach HITL drafts, and Telegram remote bridge.
          </p>
        </Link>

        <Link href="/syndicate" style={{ ...card, borderColor: "#F0245C" }}>
          <div style={{ fontSize: 11, color: "#F0245C", fontWeight: 700 }}>POISSON xG · GOAL LADDERS · AI BIAS AUDIT</div>
          <h2 style={{ margin: "8px 0" }}>III. Syndicate Matchday AI →</h2>
          <p style={{ color: "#8B95A5", fontSize: 13, margin: 0 }}>
            UCL Matchday 5 bivariate Poisson probability engine, 0.5–4.5 goal ladders, and live LLM bias auditing.
          </p>
        </Link>
      </div>

      <div style={{ marginTop: 24, background: "#11141B", border: "1px solid #232836", borderRadius: 8, padding: 14, fontSize: 12 }}>
        <div style={{ color: "#8B95A5", marginBottom: 8, fontWeight: 700 }}>CONFIGURED LLM PROVIDERS (VERCEL ENV)</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {["nvidia", "groq", "cerebras", "mistral", "gemini", "openrouter"].map((p) => (
            <span key={p} style={{ color: keys?.[p] ? "#21E0DC" : "#8B95A5" }}>
              ● {p.toUpperCase()}: <strong>{keys ? (keys[p] ? "LIVE" : "FALLBACK") : "..."}</strong>
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
