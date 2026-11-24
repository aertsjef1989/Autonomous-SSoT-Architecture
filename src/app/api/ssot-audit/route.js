import { NextResponse } from "next/server";
import { callLLM } from "../../../lib/llm";

export async function POST(req) {
  const {
    action = "audit",
    draftText = "Standard SLA response window is 24 hours across EMEA Tier-1 markets.",
    injectUnsourced = false,
    command = "/publish DOC-EMEA-042",
    modelKey = "groq-llama"
  } = await req.json();

  if (action === "bot") {
    const responses = {
      "/publish": {
        sla_ack_ms: 380,
        workflow: "MOVE_THEN_CONFIRM",
        steps: [
          "1. Verified Station 7 audit pass & container ACL inheritance.",
          "2. Moved node from _STAGING/EMEA -> PUBLIC/EMEA/02-Operations.",
          "3. Confirmed post-move permissions & updated T2 Lifecycle Tracker."
        ]
      },
      "/archive-sweep": {
        sla_ack_ms: 410,
        workflow: "30_DAY_KILL_SWITCH",
        steps: [
          "1. Scanned T4 Freshness Log: identified 3 nodes > 30 days unverified.",
          "2. Moved expired nodes to unpartitioned _ARCHIVE sink.",
          "3. Scheduled T+24h integrity check and logged in T10 Archive Ledger."
        ]
      },
      "/scan-batch": {
        sla_ack_ms: 290,
        workflow: "BATCHED_DELTA_SCAN",
        steps: [
          "1. Queried delta index instead of 4,886 individual file reads.",
          "2. Automation API budget reduced by 98% (200 calls vs 10,000).",
          "3. Health Score verified at 91.4 / 100 across 45 markets."
        ]
      },
      "/audit-perm": {
        sla_ack_ms: 340,
        workflow: "SELF_HEALING_P1_ACL",
        steps: [
          "1. Detected per-file ACL override drift on PUBLIC/LATAM/04-Playbooks.",
          "2. Tier 1 Auto-Repair re-applied parent container inheritance.",
          "3. Logged F-14 incident closure in T5 Fault Queue."
        ]
      }
    };
    const key = Object.keys(responses).find((k) => command.startsWith(k)) || "/publish";
    return NextResponse.json({
      status: 200,
      engine: "SSoT Autonomous Bot (23-Command Fleet)",
      command,
      ack_under_3s: true,
      ...responses[key]
    });
  }

  const payloadText = injectUnsourced
    ? `${draftText} Unverified claim: Internal policy guarantees 100% automatic refunds without review.`
    : draftText;

  if (injectUnsourced) {
    return NextResponse.json(
      {
        status: 422,
        station: "Station 7 · Fresh-Instance Audit (Web Search OFF)",
        verdict: "BLOCKED_UNSOURCED_CLAIM",
        circuit_breaker: "#F0245C",
        reason: "Detected unverified absolute claim ('100% automatic refunds without review') lacking primary-source citation in T1 Registry."
      },
      { status: 422 }
    );
  }

  const llm = await callLLM({
    modelKey,
    systemPrompt: "You are SSoT Station 7 (Fresh-Instance Governance Auditor). Evaluate the draft snippet for precision, ambiguity, and compliance hygiene in 2 crisp bullet points under 60 words.",
    userPrompt: `Audit this knowledge base snippet:\n"${payloadText}"`
  });

  return NextResponse.json({
    status: 200,
    station: "Station 7 · Fresh-Instance Audit (Web Search OFF)",
    verdict: "PASSED_CLEAN",
    llm_mode: llm.live ? "LIVE_LLM" : "FALLBACK_DETERMINISTIC",
    llm_provider: llm.provider,
    llm_model: llm.model,
    audit_notes:
      llm.content ||
      "• Claim scope is bounded to EMEA Tier-1 markets with measurable 24h SLA.\n• Cleared for Station 8 Human Sign-Off and Move-Then-Confirm publish."
  });
}
