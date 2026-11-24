"use client";
import { useState } from "react";
import ModelSelect from "./ModelSelect";

const box = { background: "#11141B", border: "1px solid #232836", borderRadius: 8, padding: 16, marginBottom: 14 };
const inp = { background: "#171B24", color: "#F2F5F9", border: "1px solid #232836", borderRadius: 6, padding: "7px 10px", fontSize: 12.5 };
const btn = { background: "#21E0DC", color: "#08090D", border: "none", borderRadius: 6, padding: "8px 13px", fontWeight: 700, cursor: "pointer", fontSize: 12.5 };
const pre = { background: "#050609", border: "1px solid #232836", borderRadius: 6, padding: 12, fontSize: 11.5, overflow: "auto", maxHeight: 280, color: "#c7d0dd", whiteSpace: "pre-wrap" };

const MODEL_OPTS = [
  ["groq-llama", "Groq · Llama 3.3 70B"],
  ["groq-qwen", "Groq · Qwen 32B"],
  ["nvidia-deepseek", "NVIDIA NIM · DeepSeek"],
  ["nvidia-qwen", "NVIDIA NIM · Qwen 72B"],
  ["nvidia-kimi", "NVIDIA NIM · Kimi K2"],
  ["mistral-small", "Mistral · Small Latest"],
  ["openrouter-free", "OpenRouter · Auto Free"]
];

export default function BalaerionWorkbench({ embed = false }) {
  const [tab, setTab] = useState("osint");
  const [modelKey, setModelKey] = useState("groq-llama");
  const [out, setOut] = useState("Select a free LLM above and run any route.");

  const [lane, setLane] = useState("gdpr");
  const [provider, setProvider] = useState("scaleway-paris");
  const [company, setCompany] = useState("Vlaamse Retail Groep NV");
  const [country, setCountry] = useState("BE");
  const [stripEvidence, setStripEvidence] = useState(false);
  const [channel, setChannel] = useState("email");
  const [autoSend, setAutoSend] = useState(false);
  const [tgSender, setTgSender] = useState("OWNER_ID_88412");
  const [tgCmd, setTgCmd] = useState("/activate Vlaamse Retail Groep NV");

  async function callApi(url, payload) {
    setOut("Calling " + url + " ...");
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await r.json();
    setOut(JSON.stringify({ http_status: r.status, ...data }, null, 2));
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: embed ? "12px" : "22px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, letterSpacing: 0.6, color: "#21E0DC" }}>
          BALAERION // LIVE MULTI-PROVIDER PROTOTYPE {embed ? "(EMBED)" : ""}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "#8B95A5" }}>Active Model:</span>
          <ModelSelect value={modelKey} onChange={setModelKey} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[["osint", "1. ProspectHub + Scout"], ["draft", "2. Voice + Compliance"], ["route", "3. OmniRoute Policy"], ["tg", "4. Telegram Remote"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...inp, cursor: "pointer", background: tab === k ? "#21E0DC" : "#171B24", color: tab === k ? "#08090D" : "#8B95A5", fontWeight: 700 }}>{l}</button>
        ))}
      </div>

      {tab === "osint" && (
        <div style={box}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input style={inp} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
            <select style={inp} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="BE">BE (KBO + NBB + VIES + GLEIF)</option>
              <option value="NL">NL (KVK + VIES + GLEIF)</option>
              <option value="EU">EU (VIES + GLEIF)</option>
            </select>
            <label style={{ fontSize: 12.5 }}>
              <input type="checkbox" checked={stripEvidence} onChange={(e) => setStripEvidence(e.target.checked)} /> Strip Evidence
            </label>
            <button style={btn} onClick={() => callApi("/api/prospecthub", { company, country, stripEvidence, modelKey })}>Run ProspectHub + LLM</button>
          </div>
        </div>
      )}

      {tab === "draft" && (
        <div style={box}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input style={inp} value={company} onChange={(e) => setCompany(e.target.value)} />
            <select style={inp} value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="email">Email (HITL Staged)</option>
              <option value="call">Call Script (HITL Staged)</option>
              <option value="linkedin">LinkedIn (Hard-Blocked)</option>
            </select>
            <label style={{ fontSize: 12.5 }}>
              <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} /> Attempt Auto-Send
            </label>
            <button style={btn} onClick={() => callApi("/api/draft", { company, channel, autoSend, modelKey })}>Generate Draft via LLM</button>
          </div>
        </div>
      )}

      {tab === "route" && (
        <div style={box}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select style={inp} value={lane} onChange={(e) => setLane(e.target.value)}>
              <option value="gdpr">NL/BE GDPR Client Lane</option>
              <option value="osint">Public OSINT Pool</option>
              <option value="hobby">Hobby Router Quarantine</option>
            </select>
            <select style={inp} value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="scaleway-paris">Scaleway Paris (EU Opt-Out)</option>
              <option value="mistral-eu">Mistral EU (Paris Opt-Out)</option>
              <option value="gemini-free">Gemini Free Tier</option>
              <option value="deepseek-cn">DeepSeek / China-Hosted</option>
            </select>
            <button style={btn} onClick={() => callApi("/api/route-check", { lane, provider })}>Check OmniRoute Policy</button>
          </div>
        </div>
      )}

      {tab === "tg" && (
        <div style={box}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input style={inp} value={tgSender} onChange={(e) => setTgSender(e.target.value)} placeholder="Sender ID" />
            <input style={{ ...inp, minWidth: 240 }} value={tgCmd} onChange={(e) => setTgCmd(e.target.value)} placeholder="/activate Company" />
            <button style={btn} onClick={() => callApi("/api/telegram", { sender_id: tgSender, command: tgCmd })}>POST /api/telegram</button>
          </div>
        </div>
      )}

      <div style={box}>
        <div style={{ fontSize: 11.5, color: "#8B95A5", marginBottom: 6 }}>LIVE API RESPONSE</div>
        <pre style={pre}>{out}</pre>
      </div>
    </div>
  );
}
