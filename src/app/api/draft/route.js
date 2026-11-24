import { NextResponse } from "next/server";
import { callLLM } from "../../../lib/llm";

export async function POST(req) {
  const {
    company = "Vlaamse Retail Groep NV",
    channel = "email",
    voiceProfile = "direct-consultative",
    autoSend = false,
    modelKey = "groq-llama"
  } = await req.json();

  if (channel === "linkedin" || autoSend) {
    return NextResponse.json(
      {
        status: 403,
        agent: "Compliance Overlord",
        circuit_breaker: "#F0245C",
        error:
          channel === "linkedin"
            ? "Hard-blocked: LinkedIn automation is strictly prohibited."
            : "Hard-blocked: Auto-send disabled. Human-in-the-Loop (HITL) approval required."
      },
      { status: 403 }
    );
  }

  const llm = await callLLM({
    modelKey,
    systemPrompt: `You are Balaerion's Voice & Outreach Engine. Write a short, sharp ${channel} draft using a "${voiceProfile}" tone. Keep it under 90 words. No fluff.`,
    userPrompt: `Draft an outbound ${channel} for ${company} offering a concise 3-point market activation benchmark.`
  });

  return NextResponse.json({
    status: 200,
    agent: "Voice & Outreach Engine",
    state: "STAGED_AWAITING_HITL",
    llm_mode: llm.live ? "LIVE_LLM" : "FALLBACK_DETERMINISTIC",
    llm_provider: llm.provider,
    llm_model: llm.model,
    llm_note: llm.reason || "OK",
    channel,
    voiceProfile,
    draft: llm.content || `Hi team — reviewed public registry and growth signals for ${company}. Put together a concise 3-point activation brief tailored to your market. Open to a 10-minute walkthrough this week?`
  });
}
