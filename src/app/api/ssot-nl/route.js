import { NextResponse } from "next/server";
import { callLLM } from "../../../lib/llm";
import { executeSsotRpc, getSsotState } from "../../../lib/supabaseSsot";

function fallbackParse(prompt) {
  const p = prompt.toLowerCase();
  const docMatch = prompt.match(/\b(DOC-[A-Z0-9-]+|INT-[0-9]+)\b/i);
  const docId = docMatch ? docMatch[1].toUpperCase() : "DOC-EMEA-042";

  if (p.includes("publish") || p.includes("promote") || p.includes("approve")) {
    return { intent: "PUBLISH_DOC", doc_id: docId, market: "EMEA" };
  }
  if (p.includes("sweep") || p.includes("archive") || p.includes("stale") || p.includes("30")) {
    return { intent: "ARCHIVE_SWEEP" };
  }
  if (p.includes("heal") || p.includes("fault") || p.includes("repair") || p.includes("acl")) {
    return { intent: "HEAL_FAULTS" };
  }
  if (p.includes("create") || p.includes("draft") || p.includes("new")) {
    return {
      intent: "CREATE_DRAFT",
      doc_id: `DOC-NL-${Math.floor(400 + Math.random() * 500)}`,
      title: prompt.slice(0, 48).replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, "_") + ".md",
      market: p.includes("latam") ? "LATAM" : p.includes("mena") ? "MENA" : "EMEA",
      summary: prompt
    };
  }
  return { intent: "QUERY_SSOT", filter: p.includes("stale") ? "STALE" : p.includes("staging") ? "STAGING" : "ALL" };
}

export async function POST(req) {
  const {
    prompt = "Sweep all stale documents older than 30 days into archive",
    gateway = "BALAERION_NL",
    modelKey = "groq-llama"
  } = await req.json();

  const llm = await callLLM({
    modelKey,
    systemPrompt: `You are Balaerion's MCP Intent Router talking to Autonomous SSoT. Convert the user's request into STRICT JSON ONLY (no markdown, no explanation) matching one of:
1. {"intent":"PUBLISH_DOC","doc_id":"DOC-EMEA-042"}
2. {"intent":"ARCHIVE_SWEEP"}
3. {"intent":"HEAL_FAULTS"}
4. {"intent":"CREATE_DRAFT","doc_id":"DOC-EMEA-501","title":"New_Playbook.md","market":"EMEA","summary":"..."}
5. {"intent":"QUERY_SSOT","filter":"ALL|STALE|STAGING|PUBLIC"}`,
    userPrompt: prompt
  });

  let parsed = null;
  if (llm.live && llm.content) {
    try {
      const clean = llm.content.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = null;
    }
  }
  if (!parsed || !parsed.intent) parsed = fallbackParse(prompt);

  let dbResult;
  if (parsed.intent === "PUBLISH_DOC") {
    dbResult = await executeSsotRpc(
      "ssot_publish_doc",
      { p_doc_id: parsed.doc_id || "DOC-EMEA-042", p_gateway: gateway },
      { gateway, prompt }
    );
  } else if (parsed.intent === "ARCHIVE_SWEEP") {
    dbResult = await executeSsotRpc("ssot_archive_sweep", { p_gateway: gateway }, { gateway, prompt });
  } else if (parsed.intent === "HEAL_FAULTS") {
    dbResult = await executeSsotRpc("ssot_heal_faults", { p_gateway: gateway }, { gateway, prompt });
  } else if (parsed.intent === "CREATE_DRAFT") {
    dbResult = await executeSsotRpc(
      "ssot_create_draft",
      {
        p_doc_id: parsed.doc_id || `DOC-EMEA-${Math.floor(400 + Math.random() * 500)}`,
        p_title: parsed.title || "Balaerion_Staged_Playbook.md",
        p_market: parsed.market || "EMEA",
        p_summary: parsed.summary || prompt,
        p_gateway: gateway
      },
      { gateway, prompt }
    );
  } else {
    const state = await getSsotState();
    const docs = state.docs.filter((d) =>
      parsed.filter === "STALE"
        ? d.age_days > 30
        : parsed.filter === "STAGING"
        ? d.tree_layer === "STAGING"
        : parsed.filter === "PUBLIC"
        ? d.tree_layer === "PUBLIC"
        : true
    );
    dbResult = {
      ok: true,
      backend: state.backend,
      health_score: state.health_score,
      matched_docs: docs.map((d) => ({ doc_id: d.doc_id, layer: d.tree_layer, status: d.status, age_days: d.age_days })),
      open_faults: state.faults.filter((f) => f.status === "OPEN")
    };
  }

  return NextResponse.json({
    status: 200,
    gateway,
    llm_mode: llm.live ? "LIVE_LLM" : "FALLBACK_PARSER",
    llm_provider: llm.provider,
    llm_model: llm.model,
    resolved_intent: parsed,
    supabase_execution: dbResult
  });
}
