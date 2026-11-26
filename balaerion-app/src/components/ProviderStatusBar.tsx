'use client';

import React, { useEffect, useState } from 'react';

export interface ProviderStatusItem {
  id: string;
  shortName: string;
  displayName: string;
  lane: 'eu' | 'general';
  pinnedModelId: string;
  supportedModels: readonly string[];
  envVarLabel: string;
  status: 'LIVE' | 'FALLBACK';
}

const INITIAL_PROVIDERS: ProviderStatusItem[] = [
  { id: 'nvidia-nim', shortName: 'NVIDIA NIM', displayName: 'NVIDIA NIM', lane: 'general', pinnedModelId: 'qwen/qwen3-235b-a22b', supportedModels: ['qwen/qwen3-235b-a22b'], envVarLabel: 'NVIDIA_API_KEY', status: 'FALLBACK' },
  { id: 'groq', shortName: 'Groq', displayName: 'GroqCloud', lane: 'general', pinnedModelId: 'llama-3.3-70b-versatile', supportedModels: ['llama-3.3-70b-versatile'], envVarLabel: 'GROQ_API_KEY', status: 'FALLBACK' },
  { id: 'cerebras', shortName: 'Cerebras', displayName: 'Cerebras Inference', lane: 'general', pinnedModelId: 'qwen-3-32b', supportedModels: ['qwen-3-32b'], envVarLabel: 'CEREBRAS_API_KEY', status: 'FALLBACK' },
  { id: 'mistral', shortName: 'Mistral EU', displayName: 'Mistral AI Experiment', lane: 'eu', pinnedModelId: 'mistral-small-2503', supportedModels: ['mistral-small-2503'], envVarLabel: 'MISTRAL_API_KEY', status: 'FALLBACK' },
  { id: 'gemini', shortName: 'Gemini 2.5', displayName: 'Google AI Studio', lane: 'general', pinnedModelId: 'gemini-2.5-flash', supportedModels: ['gemini-2.5-flash'], envVarLabel: 'GEMINI_API_KEY', status: 'FALLBACK' },
  { id: 'openrouter-free', shortName: 'OpenRouter :free', displayName: 'OpenRouter :free Pool', lane: 'general', pinnedModelId: 'meta-llama/llama-3.3-70b-instruct:free', supportedModels: ['meta-llama/llama-3.3-70b-instruct:free'], envVarLabel: 'OPENROUTER_API_KEY', status: 'FALLBACK' },
  { id: 'ovhcloud-eu', shortName: 'OVHcloud EU', displayName: 'OVHcloud AI Endpoints', lane: 'eu', pinnedModelId: 'Mistral-Nemo-Instruct-2407', supportedModels: ['Mistral-Nemo-Instruct-2407'], envVarLabel: 'OVH_AI_ENDPOINTS_KEY', status: 'FALLBACK' },
  { id: 'codestral', shortName: 'Codestral EU', displayName: 'Mistral Codestral', lane: 'eu', pinnedModelId: 'codestral-2501', supportedModels: ['codestral-2501'], envVarLabel: 'CODESTRAL_API_KEY', status: 'FALLBACK' },
  { id: 'cloudflare-workers-ai', shortName: 'Workers AI', displayName: 'Cloudflare Workers AI', lane: 'general', pinnedModelId: '@cf/meta/llama-3.1-8b-instruct', supportedModels: ['@cf/meta/llama-3.1-8b-instruct'], envVarLabel: 'CLOUDFLARE_AI_API_TOKEN', status: 'FALLBACK' },
  { id: 'cohere', shortName: 'Cohere', displayName: 'Cohere Trial', lane: 'general', pinnedModelId: 'command-a-03-2025', supportedModels: ['command-a-03-2025'], envVarLabel: 'COHERE_API_KEY', status: 'FALLBACK' },
  { id: 'fireworks', shortName: 'Fireworks', displayName: 'Fireworks AI', lane: 'general', pinnedModelId: 'accounts/fireworks/models/deepseek-v3', supportedModels: ['accounts/fireworks/models/deepseek-v3'], envVarLabel: 'FIREWORKS_API_KEY', status: 'FALLBACK' },
  { id: 'together', shortName: 'Together Free', displayName: 'Together AI Free', lane: 'general', pinnedModelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', supportedModels: ['meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'], envVarLabel: 'TOGETHER_API_KEY', status: 'FALLBACK' },
];

export function ProviderStatusBar() {
  const [providers, setProviders] = useState<ProviderStatusItem[]>(INITIAL_PROVIDERS);
  const [liveCount, setLiveCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    fetch('/api/providers/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data || !Array.isArray(data.providers)) return;
        setProviders(data.providers);
        setLiveCount(typeof data.liveCount === 'number' ? data.liveCount : 0);
      })
      .catch(() => {
        /* keep deterministic fallback state */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      aria-label="Configured LLM Providers"
      style={{
        backgroundColor: '#11141B',
        border: '1px solid #232836',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '22px',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.1em', color: '#21E0DC', textTransform: 'uppercase' }}>
          CONFIGURED LLM PROVIDERS
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: liveCount > 0 ? 'rgba(33, 224, 220, 0.12)' : '#171B24',
            border: `1px solid ${liveCount > 0 ? '#21E0DC' : '#2D3446'}`,
            color: liveCount > 0 ? '#21E0DC' : '#B9C0CE',
          }}
        >
          {liveCount} / {providers.length} LIVE ({providers.length - liveCount} FALLBACK)
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
          gap: '8px',
        }}
      >
        {providers.map((p) => {
          const isLive = p.status === 'LIVE';
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#151923',
                border: `1px solid ${isLive ? '#21E0DC' : '#232836'}`,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF', overflowWrap: 'anywhere' }}>
                  {p.shortName}
                </div>
                <div style={{ fontSize: '11px', color: '#8B95A5', overflowWrap: 'anywhere' }}>
                  {p.lane === 'eu' ? 'EU Safe' : 'General'} · {p.envVarLabel}
                </div>
              </div>
              <span
                style={{
                  flexShrink: 0,
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  backgroundColor: isLive ? '#21E0DC' : '#232836',
                  color: isLive ? '#08090D' : '#B9C0CE',
                }}
              >
                {p.status}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
