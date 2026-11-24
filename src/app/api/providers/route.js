import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    nvidia: Boolean(process.env.NVIDIA_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    cerebras: Boolean(process.env.CEREBRAS_API_KEY),
    mistral: Boolean(process.env.MISTRAL_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY)
  });
}
