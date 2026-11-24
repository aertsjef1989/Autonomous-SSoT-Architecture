import { NextResponse } from "next/server";
import { callLLM } from "../../../lib/llm";

export async function POST(req) {
  const { fixture = "Club Brugge vs Liverpool", pHome = 26, pDraw = 24, pAway = 50, o25 = 64, modelKey = "nvidia-deepseek" } = await req.json();

  const llm = await callLLM({
    modelKey,
    systemPrompt: "You are Syndicate Matchday AI's Bias Auditor. Given Poisson probabilities for a football match, write 3 concise bullet points flagging potential model blind spots (e.g., fixture congestion, away travel, red-card/referee variance, or market overreaction). Keep it under 90 words.",
    userPrompt: `Fixture: ${fixture}\nModel 1X2: Home ${pHome}% / Draw ${pDraw}% / Away ${pAway}%\nOver 2.5 Goals: ${o25}%`
  });

  return NextResponse.json({
    status: 200,
    fixture,
    llm_mode: llm.live ? "LIVE_LLM" : "FALLBACK_DETERMINISTIC",
    llm_provider: llm.provider,
    llm_model: llm.model,
    llm_note: llm.reason || "OK",
    bias_audit: llm.content || `• Check late injury/rotation news before T-15m lock for ${fixture}.\n• Poisson assumes goal independence; high-pressing matchups can skew Over 2.5 (${o25}%).\n• Verify referee card/penalty rate before sizing syndicate units.`
  });
}
