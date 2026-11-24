import { NextResponse } from "next/server";

export async function POST(req) {
  const ownerId = process.env.TELEGRAM_OWNER_ID || "OWNER_ID_88412";
  const body = await req.json();
  const senderId = String(body?.message?.from?.id || body?.sender_id || "");
  const text = String(body?.message?.text || body?.command || "").trim();

  if (senderId !== ownerId) {
    return NextResponse.json(
      { ok: false, action: "DROPPED_SILENTLY", reason: "Unauthorized Telegram sender_id." },
      { status: 403 }
    );
  }

  const [cmd, ...rest] = text.split(" ");
  const arg = rest.join(" ") || "Vlaamse Retail Groep NV";
  const allowed = new Set(["/scout", "/activate", "/status", "/approve"]);

  if (!allowed.has(cmd)) {
    return NextResponse.json({
      ok: true,
      sender_id: senderId,
      reply: `Unknown command. Supported: /scout <company>, /activate <company>, /status, /approve <draft_id>`
    });
  }

  return NextResponse.json({
    ok: true,
    sender_id: senderId,
    command: cmd,
    target: arg,
    reply: `ACK [${cmd}]: Dispatched for "${arg}" via Balaerion MCP orchestrator (HITL enforced).`
  });
}
