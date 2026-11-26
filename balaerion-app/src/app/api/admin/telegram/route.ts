import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isOwnerAuthenticated } from '@/lib/session-access';
import {
  buildProviderSummaryLines,
  isTelegramConfigured,
  sendOwnerTelegramAlert,
} from '@/lib/telegram-notify';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isOwnerAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(
    {
      ok: true,
      configured: isTelegramConfigured(),
      hasOwnerId: Boolean((process.env.TELEGRAM_OWNER_ID ?? '').trim()),
      hasBotToken: Boolean((process.env.TELEGRAM_BOT_TOKEN ?? '').trim()),
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  if (!isOwnerAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let note = '';
  try {
    const body = (await request.json()) as { note?: unknown };
    if (typeof body.note === 'string') note = body.note.trim().slice(0, 300);
  } catch {
    /* optional body */
  }

  const lines = buildProviderSummaryLines();
  if (note) lines.push(`Owner Note: ${note}`);

  const result = await sendOwnerTelegramAlert('Owner Operational Status Ping', lines);
  return NextResponse.json(result, {
    status: result.ok ? 200 : result.configured ? 502 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
