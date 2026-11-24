"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ModelSelect from "./ModelSelect";

const box = { background: "#11141B", border: "1px solid #232836", borderRadius: 8, padding: 16, marginBottom: 14 };
const inp = { background: "#171B24", color: "#F2F5F9", border: "1px solid #232836", borderRadius: 6, padding: "7px 10px", fontSize: 12.5 };
const btn = { background: "#21E0DC", color: "#08090D", border: "none", borderRadius: 6, padding: "8px 13px", fontWeight: 700, cursor: "pointer", fontSize: 12.5 };
const pre = { background: "#050609", border: "1px solid #232836", borderRadius: 6, padding: 12, fontSize: 11.5, overflow: "auto", maxHeight: 240, color: "#c7d0dd", whiteSpace: "pre-wrap" };

export default function SsotWorkbench({ embed = false }) {
  const [tab, setTab] = useState("tree");
  const [role, setRole] = useState("T3_SME");
  const [modelKey, setModelKey] = useState("groq-llama");
  const [nlPrompt, setNlPrompt] = useState("Publish DOC-EMEA-042 to public");
  const [state, setState] = useState({ backend: "LOADING...", health_score: 91.4, docs: [], faults: [], recent_logs: [] });
  const [out, setOut] = useState("Live SSoT connected. Use the Natural Language bar or T1–T10 controls to mutate state.");

  async function refreshState() {
    const r = await fetch("/api/ssot-state");
    if (r.ok) setState(await r.json());
  }

  useEffect(() => { refreshState(); }, []);

  async function runNL(customPrompt) {
    const prompt = customPrompt || nlPrompt;
    setOut("Executing via Natural Language Bridge...");
    const r = await fetch("/api/ssot-nl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, gateway: "SSOT_NL_BAR", modelKey })
    });
    const data = await r.json();
    setOut(JSON.stringify(data, null, 2));
    await refreshState();
  }

  function accessFor(layer) {
    if (role === "T5_ADMIN" || role === "T6_BOT") return { read: true, label: "READ + WRITE (Inherited)" };
    if (role === "T3_SME") return layer === "STAGING" ? { read: true, label: "READ + WRITE (_STAGING)" } : { read: true, label: "READ-ONLY" };
    return layer === "INTERNAL" || layer === "ARCHIVE"
      ? { read: false, label: "403 DENIED (Container ACL)" }
      : { read: true, label: "READ-ONLY (Public)" };
  }

  const layers = ["PUBLIC", "STAGING", "ARCHIVE", "INTERNAL"];

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: embed ? "12px" : "22px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!embed && <Link href="/" style={{ color: "#21E0DC", textDecoration: "none", fontSize: 12, border: "1px solid #232836", padding: "5px 9px", borderRadius: 5 }}>← Hub</Link>}
          <span style={{ fontWeight: 800, color: "#21E0DC" }}>AUTONOMOUS SSoT // LIVE SUPABASE &amp; NL AUTOMATION</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#22C55E" }}>Health: <strong>{state.health_score}/100</strong></span>
          <ModelSelect value={modelKey} onChange={setModelKey} />
        </div>
      </div>

      {/* Persistent Natural Language Bar */}
      <div style={{ ...box, borderColor: "#21E0DC" }}>
        <div style={{ fontSize: 11, color: "#21E0DC", fontWeight: 700, marginBottom: 6 }}>
          NATURAL LANGUAGE COMMAND BAR · BACKEND: {state.backend}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...inp, flex: 1, minWidth: 260 }} value={nlPrompt} onChange={(e) => setNlPrompt(e.target.value)} placeholder="e.g., Sweep stale docs >30d to archive, or Publish DOC-EMEA-042" />
          <button style={btn} onClick={() => runNL()}>Run Natural Language Command</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          ["tree", `1. Live Dual-Root File Tree (${state.docs.length} Active Nodes)`],
          ["trackers", `2. T1–T10 Trackers & Faults (${state.faults.filter((f) => f.status === "OPEN").length} Open)`]
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...inp, cursor: "pointer", background: tab === k ? "#21E0DC" : "#171B24", color: tab === k ? "#08090D" : "#8B95A5", fontWeight: 700 }}>{l}</button>
        ))}
      </div>

      {tab === "tree" && (
        <div style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#8B95A5" }}>6-Tier RBAC Container Inheritance:</span>
            <select style={inp} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="T1_VIEWER">Tier 1 · Frontline Viewer</option>
              <option value="T3_SME">Tier 3 · Market SME Author</option>
              <option value="T5_ADMIN">Tier 5 · System Admin</option>
              <option value="T6_BOT">Tier 6 · Autonomous Bot</option>
            </select>
          </div>
          {layers.map((layer) => {
            const perm = accessFor(layer);
            const docs = state.docs.filter((d) => d.tree_layer === layer);
            return (
              <div key={layer} style={{ background: "#171B24", border: `1px solid ${perm.read ? "#232836" : "#F0245C"}`, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ color: perm.read ? "#21E0DC" : "#F0245C", fontSize: 12.5 }}>📁 {layer}_ROOT ({docs.length} docs)</strong>
                  <span style={{ fontSize: 11, color: perm.read ? "#21E0DC" : "#F0245C" }}>{perm.label}</span>
                </div>
                {!perm.read ? (
                  <div style={{ fontSize: 11.5, color: "#8B95A5" }}>Blocked by container ACL inheritance.</div>
                ) : (
                  docs.map((d) => (
                    <div key={d.doc_id} style={{ fontSize: 11.5, color: "#c7d0dd", display: "flex", justifyContent: "space-between", flexWrap: "wrap", padding: "4px 0", borderTop: "1px solid #232836" }}>
                      <span>📄 <code style={{ color: "#21E0DC" }}>{d.doc_id}</code> · {d.title} <span style={{ color: "#8B95A5" }}>({d.folder_path})</span></span>
                      <span style={{ color: d.age_days > 30 && d.tree_layer !== "ARCHIVE" ? "#F5A623" : "#22C55E" }}>[{d.status} · {d.age_days}d]</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "trackers" && (
        <div style={box}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button style={btn} onClick={() => runNL("Publish DOC-EMEA-042 to public")}>Move-Then-Confirm (/publish)</button>
            <button style={{ ...btn, background: "#F5A623" }} onClick={() => runNL("Sweep all stale documents older than 30 days into archive")}>30d Archive Kill-Switch</button>
            <button style={{ ...btn, background: "#22C55E" }} onClick={() => runNL("Auto-heal all open faults in T5")}>Run 4-Tier Self-Heal</button>
          </div>
          <div style={{ fontSize: 12, color: "#8B95A5", marginBottom: 8 }}>T5 Fault Queue (Live):</div>
          {state.faults.map((f) => (
            <div key={f.fault_id} style={{ background: "#171B24", padding: 10, borderRadius: 6, marginBottom: 8, fontSize: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span><strong>{f.fault_id}</strong> · {f.fault_code} ({f.doc_id}) — {f.auto_tier}</span>
              <span style={{ color: f.status === "OPEN" ? "#F0245C" : "#22C55E", fontWeight: 700 }}>{f.status}</span>
            </div>
          ))}
        </div>
      )}

      <div style={box}>
        <div style={{ fontSize: 11.5, color: "#8B95A5", marginBottom: 6 }}>EXECUTION LOG</div>
        <pre style={pre}>{out}</pre>
      </div>
    </div>
  );
}
