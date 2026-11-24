import { NextResponse } from "next/server";

const EU_ALLOWED = new Set(["scaleway-paris", "mistral-eu"]);

export async function POST(req) {
  const { lane = "gdpr", provider = "scaleway-paris", skill = "activate-company.md" } = await req.json();
  const isEu = EU_ALLOWED.has(provider);
  const blocked =
    (lane === "gdpr" && !isEu) ||
    (lane === "hobby" && skill === "activate-company.md");

  return NextResponse.json(
    {
      status: blocked ? 403 : 200,
      decision: blocked ? "DENIED" : "PERMITTED",
      gateway: "omniroute-unforked",
      omniroute_memory: false,
      global_prompt: "neutral-router-preamble",
      frontend_skill: skill,
      lane,
      provider,
      eu_training_opt_out: isEu,
      reason: blocked
        ? lane === "hobby"
          ? "Hobby router quarantined from client activation skills."
          : `GDPR client lane blocks non-EU/free-tier provider (${provider}).`
        : `Routed cleanly to ${provider} with frontend skill ${skill}.`
    },
    { status: blocked ? 403 : 200 }
  );
}
