import { DEFAULT_PROVIDER_REGISTRY, isProviderConfiguredAndEnabled } from './llm/registry';

export interface TelegramNotifyResult {
  ok: boolean;
  configured: boolean;
  message?: string;
}

export function isTelegramConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const token = (env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const ownerId = (env.TELEGRAM_OWNER_ID ?? '').trim();
  return Boolean(token && ownerId);
}

export async function sendOwnerTelegramAlert(
  title: string,
  lines: string[],
  env: NodeJS.ProcessEnv = process.env
): Promise<TelegramNotifyResult> {
  const token = (env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const ownerId = (env.TELEGRAM_OWNER_ID ?? '').trim();
  if (!token || !ownerId) {
    return {
      ok: false,
      configured: false,
      message: 'TELEGRAM_BOT_TOKEN or TELEGRAM_OWNER_ID is not configured in environment variables.',
    };
  }

  const text = [`[Signal Workspace] ${title}`, ...lines].join('\n').slice(0, 3900);
  try {
    const resp = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ownerId,
        text,
        disable_web_page_preview: true,
      }),
    });
    if (!resp.ok) {
      return {
        ok: false,
        configured: true,
        message: `Telegram API returned HTTP ${resp.status}.`,
      };
    }
    return { ok: true, configured: true, message: 'Sent operational ping to TELEGRAM_OWNER_ID.' };
  } catch {
    return {
      ok: false,
      configured: true,
      message: 'Network error contacting Telegram Bot API.',
    };
  }
}

export function buildProviderSummaryLines(env: NodeJS.ProcessEnv = process.env): string[] {
  const primary = DEFAULT_PROVIDER_REGISTRY.filter((p) => p.enabledByDefault);
  const live = primary.filter((p) => isProviderConfiguredAndEnabled(p, env));
  return [
    `LLM Providers: ${live.length}/${primary.length} LIVE`,
    `Live IDs: ${live.map((p) => p.id).join(', ') || 'none (all FALLBACK)'}`,
    `Supabase: ${env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Unconfigured'}`,
    `Syndicate Feed: ${env.FOOTBALL_DATA_API_KEY ? 'LIVE (football-data.org)' : 'Simulation Fallback'}`,
  ];
}
