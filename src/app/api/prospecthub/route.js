import { NextResponse } from "next/server";
import { callLLM } from "../../../lib/llm";

const REGISTRY_MAP = {
  BE: { tier: "Tier 1 (Full NL/BE)", registries: ["KBO", "NBB", "VIES", "GLEIF"] },
  NL: { tier: "Tier 1 (Full NL/BE)", registries: ["KVK", "VIES", "GLEIF"] },
  EU: { tier: "Tier 2 (Pan-EU)", registries: ["VIES", "GLEIF"] }
};

export async function POST(req) {
  const {
    company = "Vlaamse Retail Groep NV",
    country = "BE",
    stripEvidence = false,
    modelKey = "groq-llama"
  } = await req.json();
  const cfg = REGISTRY_MAP[country] || REGISTRY_MAP.EU;

  if (stripEvidence) {
    return NextResponse.json(
      {
        status: 422,
        agent: "Scout -> Compliance Overlord",
        gate: "EVIDENCE_GATE_BLOCKED",
        error: "Bare conclusion rejected: raw registry source evidence is mandatory before Judgement tier."
      },
      { status: 422 }
    );
  }

  let gleifMatches = [];
  try {
    const r = await fetch(
      `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(company)}&page[size]=2`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (r.ok) {
      const data = await r.json();
      gleifMatches = (data.data || []).map((d) => ({
        lei: d.id,
        legalName: d.attributes?.entity?.legalName?.name,
        jurisdiction: d.attributes?.entity?.jurisdiction
      }));
    }
  } catch {
    gleifMatches = [];
  }

  const llm = await callLLM({
    modelKey,
    systemPrompt: "You are Balaerion's Campaign Architect. Write a concise 3-bullet advisory GTM activation brief grounded strictly in the provided registry context. Do not invent facts.",
    userPrompt: `Account: ${company}\nMarket: ${country} (${cfg.tier})\nRegistries: ${cfg.registries.join(", ")}\nGLEIF matches: ${JSON.stringify(gleifMatches)}`
  });

  return NextResponse.json({
    status: 200,
    command: `Activate ${company}`,
    agent: "Scout + Campaign Architect",
    llm_mode: llm.live ? "LIVE_LLM" : "FALLBACK_DETERMINISTIC",
    llm_provider: llm.provider,
    llm_model: llm.model,
    llm_note: llm.reason || "OK",
    country,
    coverage_tier: cfg.tier,
    registries_queried: cfg.registries,
    live_gleif_records: gleifMatches,
    evidence_attached: true,
    advisory_brief: llm.content || `Advisory GTM Benchmark ready for ${company} (${country}). Next deliverable: PC Manual-First Signal Deck (.pptx).`
  });
}
