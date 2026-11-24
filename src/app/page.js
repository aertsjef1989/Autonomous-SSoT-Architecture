"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const card = { background: "#11141B", border: "1px solid #232836", borderRadius: 10, padding: 22, textDecoration: "none", color: "#F2F5F9", display: "block" };

export default function HomePage() {
  const [keys, setKeys] = useState(null);
  useEffect(() => { fetch("/api/providers").then((r) => r.json()).then(setKeys).catch(() => {}); }, []);

  return (
    <main style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
      <div style={{ fontSize: 12, letterSpacing: 1.2, color: "#21E0DC", fontWeight: 700, marginBottom: 8 }}>
        SYSTEMS DESIGN PORTFOLIO // LIVE VERCEL HUB
      </div>
      <h1 style={{ margin: "0 0 10px", fontSize: 28 }}>Select an Active Application</h1>
      <p style={{ color: "#8B95A5", margin: "0 0 28px", fontSize: 14 }}>
        Both applications share a unified 4-provider LLM selector (NVIDIA NIM, Groq, Mistral, OpenRouter) with automatic fallback when keys are not yet configured.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
        <Link href="/balaerion" style={{ ...card, borderColor: "#21E0DC" }}>
          <div style={{ fontSize: 11.5, color: "#21E0DC", fontWeight: 700 }}>OMNIROUTE GATEWAY · MCP · PROSPECTHUB</div>
          <h2 style={{ margin: "8px 0" }}>Balaerion →</h2>
          <p style={{ color: "#8B95A5", fontSize: 13, margin: 0 }}>
            Multi-provider AI router, ProspectHub OSINT + Scout evidence gate, Voice &amp; Outreach HITL drafts, and Telegram remote bridge.
          </p>
        </Link>

        <Link href="/syndicate" style={{ ...card, borderColor: "#F0245C" }}>
          <div style={{ fontSize: 11.5, color: "#F0245C", fontWeight: 700 }}>POISSON xG · GOAL LADDERS · AI BIAS AUDIT</div>
          <h2 style={{ margin: "8px 0" }}>Syndicate Matchday AI →</h2>
          <p style={{ color: "#8B95A5", fontSize: 13, margin: 0 }}>
            Read-only UCL Matchday 5 Poisson probability engine, 0.5–4.5 goal ladders, and live LLM bias auditing.
          </p>
        </Link>
      </div>

      <div style={{ marginTop: 26, background: "#11141B", border: "1px solid #232836", borderRadius: 8, padding: 14, fontSize: 12 }}>
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
