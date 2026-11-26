import { NextResponse } from 'next/server';
import { DEFAULT_PROVIDER_REGISTRY, isProviderConfiguredAndEnabled } from '@/lib/llm/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const primaryProviders = DEFAULT_PROVIDER_REGISTRY.filter((p) => p.enabledByDefault);
  const providers = primaryProviders.map((p) => {
    const live = isProviderConfiguredAndEnabled(p, process.env);
    return {
      id: p.id,
      shortName: p.shortName || p.displayName,
      displayName: p.displayName,
      lane: p.lane === 'safe' ? 'eu' : 'general',
      pinnedModelId: p.pinnedModelId,
      supportedModels: p.supportedModels ?? [p.pinnedModelId],
      envVarLabel:
        p.protocol === 'cloudflare_workers_ai'
          ? 'CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_API_TOKEN'
          : p.apiKeyEnvVar || '',
      status: live ? ('LIVE' as const) : ('FALLBACK' as const),
    };
  });

  const liveCount = providers.filter((p) => p.status === 'LIVE').length;

  return NextResponse.json(
    {
      providers,
      liveCount,
      totalCount: providers.length,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
