"use client";
import { useState } from "react";
import Link from "next/link";
import ModelSelect from "./ModelSelect";

const box = { background: "#11141B", border: "1px solid #232836", borderRadius: 8, padding: 16, marginBottom: 14 };
const inp = { background: "#171B24", color: "#F2F5F9", border: "1px solid #232836", borderRadius: 6, padding: "7px 10px", fontSize: 12.5 };
const btn = { background: "#21E0DC", color: "#08090D", border: "none", borderRadius: 6, padding: "8px 13px", fontWeight: 700, cursor: "pointer", fontSize: 12.5 };
const pre = { background: "#050609", border: "1px solid #232836", borderRadius: 6, padding: 12, fontSize: 11.5, overflow: "auto", maxHeight: 240, color: "#c7d0dd", whiteSpace: "pre-wrap" };

const FILE_TREE = [
  {
    root: "PUBLIC_ROOT (45 Markets · 8 Folders · 3,386 Files)",
    scope: "public",
    folders: [
      {
        name: "EMEA / Benelux (NL & BE) / 01-Campaign-Architecture",
        files: [
          { id: "DOC-NLBE-101", title: "Omnichannel_Activation_Playbook_v3.md", status: "VERIFIED", ageDays: 6, owner: "SME-NLBE" },
          { id: "DOC-NLBE-104", title: "Market_Compliance_Guardrails_2026.md", status: "VERIFIED", ageDays: 11, owner: "SME-NLBE" }
        ]
      },
      {
        name: "EMEA / DACH & Nordics / 02-Lifecycle-Operations",
        files: [
          { id: "DOC-DACH-208", title: "SLA_Escalation_Matrix_Tier1.md", status: "VERIFIED", ageDays: 14, owner: "SME-DACH" },
          { id: "DOC-NORD-219", title: "Legacy_Q2_Onboarding_Checklist.md", status: "STALE (>30d)", ageDays: 34, owner: "SME-NORD" }
        ]
      },
      {
        name: "LATAM & MENA / 03-Vertical-Benchmarks",
        files: [
          { id: "DOC-LATAM-302", title: "Retail_Conversion_Benchmarks.md", status: "VERIFIED", ageDays: 9, owner: "SME-LATAM" }
        ]
      }
    ]
  },
  {
    root: "_STAGING (Market-Partitioned Drafts · Pre-Publish Gate)",
    scope: "staging",
    folders: [
      {
        name: "_STAGING / EMEA / Pending-Station-7-Audit",
        files: [
          { id: "DOC-EMEA-042", title: "EMEA_SLA_Response_Standard_Draft.md", status: "AWAITING_AUDIT", ageDays: 1, owner: "SME-EMEA" }
        ]
      }
    ]
  },
  {
    root: "_ARCHIVE (Unpartitioned 30-Day Kill-Switch Sink)",
    scope: "archive",
    folders: [
      {
        name: "_ARCHIVE / Auto-Quarantined-Nodes",
        files: [
          { id: "DOC-ARC-089", title: "Deprecated_2025_Rate_Card.md", status: "ARCHIVED", ageDays: 47, owner: "BOT-SWEEPER" }
        ]
      }
    ]
  },
  {
    root: "INTERNAL_OPS (15 Functional Areas · ~1,500 Governance Docs)",
    scope: "internal",
    folders: [
      {
        name: "INTERNAL / 01-Governance-and-SOPs",
        files: [
          { id: "INT-001", title: "7_Station_Harness_Runbook.md", status: "VERIFIED", ageDays: 4, owner: "SYS-ADMIN" },
          { id: "INT-009", title: "Incident_Response_P1_P4_Playbook.md", status: "VERIFIED", ageDays: 8, owner: "SYS-ADMIN" }
        ]
      }
    ]
  }
];

const INITIAL_TRACKERS = [
  { table: "T1 · Registry & Taxonomy", records: "4,886 nodes", invariant: "Unique doc_id + market_code", health: "100%" },
  { table: "T2 · Lifecycle & SLA", records: "45 markets", invariant: "Move-then-confirm publish", health: "99.4%" },
  { table: "T3 · Container ACLs", records: "385 containers", invariant: "Zero per-file ACL drift", health: "100%" },
  { table: "T4 · Freshness & 30d TTL", records: "142 due soon", invariant: ">30d triggers _ARCHIVE", health: "96.8%" },
  { table: "T5 · Fault Queue (29 Types)", records: "0 open P1", invariant: "4-tier self-healing loop", health: "100%" },
  { table: "T6 · Bot Command Log", records: "23 commands", invariant: "< 3s ACK SLA + 429 retry", health: "99.9%" },
  { table: "T7 · KPI & Health Score", records: "21 KPIs", invariant: "Score 72 -> 91.4 / 100", health: "91.4" },
  { table: "T8–T10 · SME & Archive", records: "185 criteria", invariant: "Append-only audit trail", health: "100%" }
];

export default function SsotWorkbench({ embed = false }) {
  const [tab, setTab] = useState("tree");
  const [role, setRole] = useState("T3_SME");
  const [modelKey, setModelKey] = useState("groq-llama");
  const [draftText, setDraftText] = useState("Standard SLA response window is 24 hours across EMEA Tier-1 markets.");
  const [injectUnsourced, setInjectUnsourced] = useState(false);
  const [botCmd, setBotCmd] = useState("/publish DOC-EMEA-042");
  const [published, setPublished] = useState(false);
  const [archivedStale, setArchivedStale] = useState(false);
  const [out, setOut] = useState("Inspect the Dual-Root File Tree, T1–T10 Trackers, or run a live Station 7 / Bot automation.");

  function accessFor(scope) {
    if (role === "T5_ADMIN" || role === "T6_BOT") return { read: true, write: true, label: "READ + WRITE (Container Inherited)" };
    if (role === "T3_SME") return scope === "staging" ? { read: true, write: true, label: "READ + WRITE (_STAGING)" } : { read: true, write: false, label: "READ-ONLY" };
    return scope === "internal" || scope === "archive"
      ? { read: false, write: false, label: "403 DENIED (Container Blocked)" }
      : { read: true, write: false, label: "READ-ONLY (Public)" };
  }

  async function runApi(payload) {
    setOut("Executing SSoT automation...");
    const r = await fetch("/api/ssot-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (payload.action === "bot" && payload.command.startsWith("/publish")) setPublished(true);
    if (payload.action === "bot" && payload.command.startsWith("/archive-sweep")) setArchivedStale(true);
    setOut(JSON.stringify({ http_status: r.status, ...data }, null, 2));
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: embed ? "12px" : "22px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!embed && <Link href="/" style={{ color: "#21E0DC", textDecoration: "none", fontSize: 12, border: "1px solid #232836", padding: "5px 9px", borderRadius: 5 }}>← Hub</Link>}
          <span style={{ fontWeight: 800, color: "#21E0DC" }}>AUTONOMOUS SSoT // FILE TREE, TRACKERS &amp; AUTOMATIONS {embed ? "(EMBED)" : ""}</span>
        </div>
        <ModelSelect value={modelKey} onChange={setModelKey} />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          ["tree", "1. Dual-Root File Tree (4,886 Nodes)"],
          ["trackers", "2. Governance Trackers (T1–T10)"],
          ["automations", "3. Bot Automations & Station 7 LLM Audit"]
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...inp, cursor: "pointer", background: tab === k ? "#21E0DC" : "#171B24", color: tab === k ? "#08090D" : "#8B95A5", fontWeight: 700 }}>{l}</button>
        ))}
      </div>

      {tab === "tree" && (
        <div style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#8B95A5" }}>Test 6-Tier RBAC Container Inheritance across Public, Staging, Archive &amp; Internal trees:</div>
            <select style={inp} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="T1_VIEWER">Tier 1 · Frontline Viewer</option>
              <option value="T3_SME">Tier 3 · Market SME Author</option>
              <option value="T5_ADMIN">Tier 5 · System Admin</option>
              <option value="T6_BOT">Tier 6 · Autonomous Service Bot</option>
            </select>
          </div>
          {FILE_TREE.map((tree) => {
            const perm = accessFor(tree.scope);
            return (
              <div key={tree.root} style={{ background: "#171B24", border: `1px solid ${perm.read ? "#232836" : "#F0245C"}`, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <strong style={{ color: perm.read ? "#21E0DC" : "#F0245C", fontSize: 12.5 }}>📁 {tree.root}</strong>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: perm.read ? "rgba(33,224,220,0.12)" : "rgba(240,36,92,0.15)", color: perm.read ? "#21E0DC" : "#F0245C" }}>{perm.label}</span>
                </div>
                {!perm.read ? (
                  <div style={{ fontSize: 12, color: "#8B95A5" }}>Container contents hidden by inherited ACL policy.</div>
                ) : (
                  tree.folders.map((f) => (
                    <div key={f.name} style={{ marginLeft: 12, marginTop: 6 }}>
                      <div style={{ fontSize: 12, color: "#c7d0dd", fontWeight: 600 }}>└─ 📂 {f.name}</div>
                      {f.files.map((file) => {
                        const isMovedPub = file.id === "DOC-EMEA-042" && published;
                        const isMovedArc = file.id === "DOC-NORD-219" && archivedStale;
                        const status = isMovedPub ? "PUBLISHED -> PUBLIC" : isMovedArc ? "MOVED -> _ARCHIVE" : file.status;
                        return (
                          <div key={file.id} style={{ marginLeft: 22, fontSize: 11.5, color: "#8B95A5", display: "flex", justifyContent: "space-between", flexWrap: "wrap", padding: "3px 0" }}>
                            <span>📄 <code style={{ color: "#F2F5F9" }}>{file.id}</code> · {file.title}</span>
                            <span style={{ color: status.includes("STALE") ? "#F5A623" : "#22C55E" }}>[{status} · {file.ageDays}d · {file.owner}]</span>
                          </div>
                        );
                      })}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#8B95A5" }}>Relational Governance Trackers (T1–T10) &amp; Live State Transitions:</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={btn} onClick={() => runApi({ action: "bot", command: "/publish DOC-EMEA-042" })}>Trigger /publish (Move-Then-Confirm)</button>
              <button style={{ ...btn, background: "#F5A623" }} onClick={() => runApi({ action: "bot", command: "/archive-sweep" })}>Trigger 30d Kill-Switch</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
            {INITIAL_TRACKERS.map((t) => (
              <div key={t.table} style={{ background: "#171B24", border: "1px solid #232836", borderRadius: 6, padding: 11 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: "#21E0DC" }}>{t.table}</div>
                <div style={{ fontSize: 11.5, color: "#F2F5F9", marginTop: 4 }}>Scope: <strong>{t.records}</strong> · Health: <strong style={{ color: "#22C55E" }}>{t.health}</strong></div>
                <div style={{ fontSize: 11, color: "#8B95A5", marginTop: 3 }}>{t.invariant}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "automations" && (
        <div style={box}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <select style={inp} value={botCmd} onChange={(e) => setBotCmd(e.target.value)}>
              <option value="/publish DOC-EMEA-042">/publish DOC-EMEA-042 (Move-Then-Confirm)</option>
              <option value="/archive-sweep">/archive-sweep (30-Day Kill Switch)</option>
              <option value="/scan-batch">/scan-batch (98% Budget Reduction)</option>
              <option value="/audit-perm">/audit-perm (P1 Container ACL Self-Heal)</option>
            </select>
            <button style={btn} onClick={() => runApi({ action: "bot", command: botCmd })}>Run Bot Automation</button>
          </div>
          <div style={{ borderTop: "1px solid #232836", paddingTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input style={{ ...inp, flex: 1, minWidth: 260 }} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
            <label style={{ fontSize: 12 }}>
              <input type="checkbox" checked={injectUnsourced} onChange={(e) => setInjectUnsourced(e.target.checked)} /> Inject Unsourced Claim
            </label>
            <button style={btn} onClick={() => runApi({ action: "audit", draftText, injectUnsourced, modelKey })}>Run Station 7 LLM Audit</button>
          </div>
        </div>
      )}

      <div style={box}>
        <div style={{ fontSize: 11.5, color: "#8B95A5", marginBottom: 6 }}>LIVE TELEMETRY &amp; GOVERNANCE RESPONSE</div>
        <pre style={pre}>{out}</pre>
      </div>
    </div>
  );
}
