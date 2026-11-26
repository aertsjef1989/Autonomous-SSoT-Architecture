'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { enforcePreDispatchGate, type Lane } from '@/lib/lane-guard';
import {
  buildPressDocumentFromContent,
  buildStudioDeckFromContent,
  saveHandoffToLocalStorage,
  savePressDocHandoffToLocalStorage,
} from '@/lib/signal-handoff';
import type { ProviderStatusItem } from '@/components/ProviderStatusBar';

interface ProspectAccount {
  domain: string;
  entity: string;
  country: 'BE' | 'NL' | 'FR' | 'GLOBAL';
  registryId: string;
  stack: string;
  readiness: number;
  lane: Lane;
  state: string;
}

const INITIAL_ACCOUNTS: ProspectAccount[] = [
  {
    domain: 'vuurtoren-atelier.example',
    entity: 'Kapsalon Vuurtoren BV',
    country: 'BE',
    registryId: 'KBO 0123.456.789',
    stack: 'Lightspeed eCom + Browser Pixel',
    readiness: 8.6,
    lane: 'safe',
    state: 'Post-discovery',
  },
  {
    domain: 'noordzee-fietsen.example',
    entity: 'Noordzee Rijwielen BV',
    country: 'NL',
    registryId: 'KvK 90012345',
    stack: 'Shopify + GTM Server-Side',
    readiness: 9.1,
    lane: 'safe',
    state: 'Discovery-booked',
  },
  {
    domain: 'atelier-lumiere.example',
    entity: 'Atelier Lumiere SAS',
    country: 'FR',
    registryId: 'SIREN 801234567',
    stack: 'WooCommerce + Consent Mode v2',
    readiness: 6.8,
    lane: 'safe',
    state: 'Cold',
  },
];

const LIFECYCLE_STATES = [
  'Cold',
  'Auto-replied',
  'Agent-contacted',
  'Discovery-booked',
  'Post-discovery',
  'In-nurture',
  'Dormant',
] as const;

const MODE_A_PERSONAS = [
  {
    id: 'general-architect',
    label: 'General Systems Architect',
    system: 'Act as a principal systems architect. Produce structured, concrete recommendations with clear trade-offs.',
  },
  {
    id: 'code-debugger',
    label: 'TypeScript & API Debugger',
    system: 'Act as a staff TypeScript and distributed systems engineer. Diagnose root causes and provide minimal, type-safe patches.',
  },
  {
    id: 'sql-architect',
    label: 'PostgreSQL & RLS Architect',
    system: 'Act as a PostgreSQL and pgvector specialist. Enforce Row-Level Security, atomic transactions, and explicit indexing.',
  },
  {
    id: 'exec-writer',
    label: 'Executive Brief Writer',
    system: 'Write crisp executive prose with zero fluff, clear headings, and bullet takeaways suitable for A4 briefs or 16:9 slides.',
  },
  {
    id: 'json-repair',
    label: 'Structured JSON Compiler',
    system: 'Transform unstructured notes into clean, deterministic JSON or Markdown tables with explicit field names.',
  },
  {
    id: 'doc-summarizer',
    label: 'Playbook Summarizer',
    system: 'Distill long technical documents into an executive summary, key operational guardrails, and verification steps.',
  },
  {
    id: 'qa-auditor',
    label: 'Governance & QA Auditor',
    system: 'Audit drafts for unsupported numeric claims, compliance gaps, or missing human-in-the-loop gates.',
  },
] as const;

const MODE_B_PERSONAS = [
  { id: 'readiness-scorer', label: '01 · Deterministic Readiness Scorer', promptTpl: 'Evaluate readiness rubric (0 to 10) and key technical gaps for' },
  { id: 'discovery-prep', label: '02 · 30-Min Discovery Call Prep', promptTpl: 'Prepare a structured 30-minute discovery call agenda and diagnostic questions for' },
  { id: 'activation-plan', label: '03 · Post-Discovery Activation Plan', promptTpl: 'Draft an advisory client-executed onboarding and measurement activation plan for' },
  { id: 'capi-dedup', label: '04 · Pixel + Server CAPI Dedup Guide', promptTpl: 'Write an event_id browser-plus-server deduplication checklist tailored to the stack of' },
  { id: 'nl-province-geo', label: '05 · NL Province-Scope Geo Strategist', promptTpl: 'Design a province-level geographic rollout plan (no city radius targeting) for' },
  { id: 'be-bilingual', label: '06 · BE Bilingual Consent & Copy Split', promptTpl: 'Outline Vlaanderen (nl-BE) and Wallonie (fr-BE) consent and creative separation for' },
  { id: 'fr-retail-media', label: '07 · FR Commerce & Catalog Planner', promptTpl: 'Outline a French market catalog feed and commerce attribution plan for' },
  { id: 'creative-brief', label: '08 · Short-Form Creative Testing Matrix', promptTpl: 'Create a 3-variant creative hook and format testing matrix for' },
  { id: 'attribution-critic', label: '09 · Attribution & Match-Quality Critic', promptTpl: 'Audit likely attribution pitfalls and signal loss risks on the detected stack of' },
  { id: 'objection-reframer', label: '10 · Advisory Objection Reframer', promptTpl: 'Provide calm, evidence-backed advisory responses to technical implementation objections for' },
  { id: 'exec-summary', label: '11 · Account Executive One-Pager', promptTpl: 'Write a 1-page internal executive account brief with clear next actions for' },
  { id: 'catalog-auditor', label: '12 · Product Feed & SKU Hygiene Check', promptTpl: 'List product catalog schema and GTIN/availability verification checks for' },
  { id: 'incrementality', label: '13 · Measurement & Lift Design', promptTpl: 'Propose a clean conversion lift and holdout verification approach for' },
  { id: 'sponsor-note', label: '14 · Inline Email Follow-Up (No PDF)', promptTpl: 'Draft a concise inline email follow-up (no PDF attachment, no daily budget minimums) for' },
  { id: 'dormant-reengage', label: '15 · Dormant Account Re-Entry Note', promptTpl: 'Draft a low-pressure technical update note to re-open conversation with' },
  { id: 'handoff-compiler', label: '16 · Studio & Press Handoff Pack', promptTpl: 'Compile a multi-section slide and A4 document outline ready for Signal Studio/Press for' },
] as const;

const FALLBACK_PROVIDER_LIST: ProviderStatusItem[] = [
  { id: 'nvidia-nim', shortName: 'NVIDIA NIM', displayName: 'NVIDIA NIM', lane: 'general', pinnedModelId: 'qwen/qwen3-235b-a22b', supportedModels: ['qwen/qwen3-235b-a22b', 'deepseek-ai/deepseek-r1', 'moonshotai/kimi-k2-instruct'], envVarLabel: 'NVIDIA_API_KEY', status: 'FALLBACK' },
  { id: 'groq', shortName: 'Groq', displayName: 'GroqCloud', lane: 'general', pinnedModelId: 'llama-3.3-70b-versatile', supportedModels: ['llama-3.3-70b-versatile', 'qwen/qwen3-32b', 'openai/gpt-oss-120b'], envVarLabel: 'GROQ_API_KEY', status: 'FALLBACK' },
  { id: 'cerebras', shortName: 'Cerebras', displayName: 'Cerebras Inference', lane: 'general', pinnedModelId: 'qwen-3-32b', supportedModels: ['qwen-3-32b', 'llama-3.3-70b'], envVarLabel: 'CEREBRAS_API_KEY', status: 'FALLBACK' },
  { id: 'mistral', shortName: 'Mistral EU', displayName: 'Mistral AI Experiment', lane: 'eu', pinnedModelId: 'mistral-small-2503', supportedModels: ['mistral-small-2503', 'ministral-8b-2410'], envVarLabel: 'MISTRAL_API_KEY', status: 'FALLBACK' },
  { id: 'gemini', shortName: 'Gemini 2.5', displayName: 'Google AI Studio', lane: 'general', pinnedModelId: 'gemini-2.5-flash', supportedModels: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'], envVarLabel: 'GEMINI_API_KEY', status: 'FALLBACK' },
  { id: 'openrouter-free', shortName: 'OpenRouter :free', displayName: 'OpenRouter :free Pool', lane: 'general', pinnedModelId: 'meta-llama/llama-3.3-70b-instruct:free', supportedModels: ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen3-235b-a22b:free', 'deepseek/deepseek-chat-v3-0324:free'], envVarLabel: 'OPENROUTER_API_KEY', status: 'FALLBACK' },
  { id: 'ovhcloud-eu', shortName: 'OVHcloud EU', displayName: 'OVHcloud AI Endpoints', lane: 'eu', pinnedModelId: 'Mistral-Nemo-Instruct-2407', supportedModels: ['Mistral-Nemo-Instruct-2407', 'Meta-Llama-3_3-70B-Instruct'], envVarLabel: 'OVH_AI_ENDPOINTS_KEY', status: 'FALLBACK' },
  { id: 'codestral', shortName: 'Codestral EU', displayName: 'Mistral Codestral', lane: 'eu', pinnedModelId: 'codestral-2501', supportedModels: ['codestral-2501'], envVarLabel: 'CODESTRAL_API_KEY', status: 'FALLBACK' },
  { id: 'cloudflare-workers-ai', shortName: 'Workers AI', displayName: 'Cloudflare Workers AI', lane: 'general', pinnedModelId: '@cf/meta/llama-3.1-8b-instruct', supportedModels: ['@cf/meta/llama-3.1-8b-instruct', '@cf/qwen/qwen2.5-coder-32b-instruct'], envVarLabel: 'CLOUDFLARE_AI_API_TOKEN', status: 'FALLBACK' },
  { id: 'cohere', shortName: 'Cohere', displayName: 'Cohere Trial', lane: 'general', pinnedModelId: 'command-a-03-2025', supportedModels: ['command-a-03-2025', 'command-r7b-12-2024'], envVarLabel: 'COHERE_API_KEY', status: 'FALLBACK' },
  { id: 'fireworks', shortName: 'Fireworks', displayName: 'Fireworks AI', lane: 'general', pinnedModelId: 'accounts/fireworks/models/deepseek-v3', supportedModels: ['accounts/fireworks/models/deepseek-v3', 'accounts/fireworks/models/llama-v3p3-70b-instruct'], envVarLabel: 'FIREWORKS_API_KEY', status: 'FALLBACK' },
  { id: 'together', shortName: 'Together Free', displayName: 'Together AI Free', lane: 'general', pinnedModelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', supportedModels: ['meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free'], envVarLabel: 'TOGETHER_API_KEY', status: 'FALLBACK' },
];

interface WorkbenchTurn {
  role: 'user' | 'assistant';
  text: string;
  provider?: string | null;
  model?: string | null;
  replay?: boolean;
  blocked?: boolean;
  citations?: Array<{ docId: string; market: string }>;
}

export default function BalaerionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'modeA' | 'modeB' | 'gate'>('modeA');
  const [providers, setProviders] = useState<ProviderStatusItem[]>(FALLBACK_PROVIDER_LIST);

  // Mode A: Standalone Multi-LLM Workbench state
  const [wbProviderId, setWbProviderId] = useState('nvidia-nim');
  const [wbModelId, setWbModelId] = useState('qwen/qwen3-235b-a22b');
  const [wbPersonaId, setWbPersonaId] = useState<string>(MODE_A_PERSONAS[0].id);
  const [wbCustomSystem, setWbCustomSystem] = useState<string>(MODE_A_PERSONAS[0].system);
  const [wbPrompt, setWbPrompt] = useState('');
  const [wbBusy, setWbBusy] = useState(false);
  const [wbTurns, setWbTurns] = useState<WorkbenchTurn[]>([]);

  // Mode B: ProspectHub 7-State GTM Suite state
  const [accounts, setAccounts] = useState<ProspectAccount[]>(INITIAL_ACCOUNTS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [newEntity, setNewEntity] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newCountry, setNewCountry] = useState<'BE' | 'NL' | 'FR' | 'GLOBAL'>('NL');
  const [newStack, setNewStack] = useState('Shopify + Server GTM');
  const [phPersonaId, setPhPersonaId] = useState<string>(MODE_B_PERSONAS[0].id);
  const [phProviderId, setPhProviderId] = useState('mistral');
  const [phNotes, setPhNotes] = useState('');
  const [phBusy, setPhBusy] = useState(false);
  const [phOutputs, setPhOutputs] = useState<WorkbenchTurn[]>([]);

  // Pre-Dispatch Gate Tester state
  const [testLane, setTestLane] = useState<Lane>('general');
  const [testPrompt, setTestPrompt] = useState('Draft an outreach checklist for VAT BE0123.456.789.');

  useEffect(() => {
    let mounted = true;
    fetch('/api/providers/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data || !Array.isArray(data.providers)) return;
        setProviders(data.providers);
      })
      .catch(() => {
        /* keep fallback list */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedProviderCfg = providers.find((p) => p.id === wbProviderId) ?? providers[0];
  const activeAccount = accounts[selectedIdx] ?? accounts[0];
  const gateProvider = testLane === 'safe' ? 'mistral' : 'groq';
  const gateResult = enforcePreDispatchGate(testLane, gateProvider, testPrompt);

  const handleSelectWbProvider = (nextId: string) => {
    setWbProviderId(nextId);
    const found = providers.find((p) => p.id === nextId);
    if (found) setWbModelId(found.pinnedModelId);
  };

  const handleSelectWbPersona = (nextPersonaId: string) => {
    setWbPersonaId(nextPersonaId);
    const found = MODE_A_PERSONAS.find((p) => p.id === nextPersonaId);
    if (found) setWbCustomSystem(found.system);
  };

  const sendStandalonePrompt = async (overrideText?: string) => {
    const q = (overrideText ?? wbPrompt).trim();
    if (!q || wbBusy) return;
    if (!overrideText) setWbPrompt('');

    const history = wbTurns
      .filter((t) => !t.blocked)
      .slice(-8)
      .map((t) => ({ role: t.role, content: t.text }));

    setWbTurns((prev) => [...prev, { role: 'user', text: q }]);
    setWbBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          lane: selectedProviderCfg.lane === 'eu' ? 'eu' : 'general',
          provider: selectedProviderCfg.id,
          model: wbModelId,
          mode: `standalone_${wbPersonaId}`,
          systemPrompt: wbCustomSystem,
          history,
        }),
      });
      const data = await res.json();
      if (data.blocked) {
        setWbTurns((prev) => [...prev, { role: 'assistant', text: data.error, blocked: true }]);
      } else {
        setWbTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply || data.error || 'Standalone response served.',
            provider: data.provider || selectedProviderCfg.id,
            model: data.model || wbModelId,
            replay: Boolean(data.replay),
          },
        ]);
      }
    } catch {
      setWbTurns((prev) => [
        ...prev,
        { role: 'assistant', text: '[Offline Replay] Network unavailable; local workbench remains ready.', replay: true },
      ]);
    } finally {
      setWbBusy(false);
    }
  };

  const addProspectWorkspace = () => {
    const cleanEnt = newEntity.trim();
    const cleanDom = (newDomain.trim() || 'prospect-calibration.example').replace(/^https?:\/\//i, '');
    if (!cleanEnt) return;
    const nextAcc: ProspectAccount = {
      domain: cleanDom.includes('.') ? cleanDom : `${cleanDom}.example`,
      entity: cleanEnt,
      country: newCountry,
      registryId: 'SYNTH-REG-01',
      stack: newStack.trim() || 'Commerce Stack',
      readiness: 7.5,
      lane: 'safe',
      state: 'Cold',
    };
    setAccounts((prev) => [...prev, nextAcc]);
    setSelectedIdx(accounts.length);
    setNewEntity('');
    setNewDomain('');
  };

  const runProspectPersona = async () => {
    if (phBusy || !activeAccount) return;
    const persona = MODE_B_PERSONAS.find((p) => p.id === phPersonaId) ?? MODE_B_PERSONAS[0];
    const provCfg = providers.find((p) => p.id === phProviderId) ?? providers[3];
    const prompt = `${persona.promptTpl} ${activeAccount.entity} (domain: ${activeAccount.domain}, market: ${activeAccount.country}, stack: ${activeAccount.stack}, current readiness: ${activeAccount.readiness}/10, lifecycle state: ${activeAccount.state}).${phNotes.trim() ? ` Additional context: ${phNotes.trim()}` : ''}`;

    setPhOutputs((prev) => [...prev, { role: 'user', text: `[${persona.label}] ${activeAccount.entity} (${activeAccount.country})` }]);
    setPhBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          lane: provCfg.lane === 'eu' ? 'eu' : 'general',
          provider: provCfg.id,
          mode: `prospecthub_${persona.id}`,
          pillar: 'prospecthub',
          market: activeAccount.country,
          systemPrompt:
            'You are Balaerion ProspectHub commercial engineering advisor. Ground recommendations strictly in the retrieved SSoT playbooks ([DOC_ID]), preserve advisory client-operated framing, enforce 30-minute discovery call duration, and never quote daily ad spend minimums in outreach.',
        }),
      });
      const data = await res.json();
      if (data.blocked) {
        setPhOutputs((prev) => [...prev, { role: 'assistant', text: data.error, blocked: true }]);
      } else {
        setPhOutputs((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply || data.error || 'ProspectHub brief generated.',
            provider: data.provider || provCfg.id,
            model: data.model || provCfg.pinnedModelId,
            replay: Boolean(data.replay),
            citations: Array.isArray(data.citations) ? data.citations : [],
          },
        ]);
      }
    } catch {
      setPhOutputs((prev) => [
        ...prev,
        { role: 'assistant', text: '[Offline Replay] Network unavailable; serving deterministic ProspectHub fallback.', replay: true },
      ]);
    } finally {
      setPhBusy(false);
    }
  };

  const handoffToStudio = (title: string, content: string, market = 'GLOBAL') => {
    const deck = buildStudioDeckFromContent({
      title,
      content,
      market,
      eyebrowPrefix: 'BALAERION BRIEF',
      defaultHeroId: 'H01',
    });
    if (saveHandoffToLocalStorage(deck).ok) {
      router.push('/studio');
    }
  };

  const handoffToPress = (title: string, content: string, market = 'GLOBAL') => {
    const doc = buildPressDocumentFromContent({
      title,
      content,
      market,
      docType: 'research_brief',
      sourceLabel: 'Balaerion Multi-LLM & ProspectHub Suite',
      sourceRef: `Market ${market}`,
    });
    if (savePressDocHandoffToLocalStorage(doc).ok) {
      router.push('/press');
    }
  };

  const updateLifecycle = (nextState: string) => {
    setAccounts((prev) => prev.map((acc, idx) => (idx === selectedIdx ? { ...acc, state: nextState } : acc)));
  };

  const exportCsv = () => {
    const header = 'domain,entity,country,registry_id,stack,readiness_score,lane,lifecycle_state\n';
    const body = accounts
      .map((a) => `${a.domain},"${a.entity}",${a.country},"${a.registryId}","${a.stack}",${a.readiness},${a.lane},${a.state}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'balaerion_prospecthub_accounts.csv';
    link.click();
  };

  return (
    <div style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>
        Pillar II: Balaerion Multi-LLM Workbench &amp; ProspectHub GTM Suite
      </h1>
      <p style={{ color: '#B9C0CE', lineHeight: 1.55, maxWidth: 840 }}>
        Use all 12 card-free providers either <strong>standalone</strong> (Mode A everyday engineering &amp; writing workbench) or{' '}
        <strong>grounded inside ProspectHub</strong> (Mode B 7-state commercial GTM suite backed by SSoT playbooks), then hand generated briefs directly to <strong>Signal Studio (16:9)</strong> or <strong>Signal Press (A4)</strong>.
      </p>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {[
          { id: 'modeA' as const, label: 'Mode A · Standalone Multi-LLM Workbench' },
          { id: 'modeB' as const, label: 'Mode B · ProspectHub 7-State Suite (16 Personas)' },
          { id: 'gate' as const, label: 'Pre-Dispatch PII & Lane Gate Tester' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              minHeight: 44,
              padding: '10px 16px',
              borderRadius: 8,
              border: activeTab === tab.id ? '1px solid #21E0DC' : '1px solid #232836',
              background: activeTab === tab.id ? '#21E0DC' : '#11141B',
              color: activeTab === tab.id ? '#08090D' : '#F2F5F9',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MODE A: STANDALONE WORKBENCH */}
      {activeTab === 'modeA' ? (
        <section
          style={{
            background: '#11141B',
            border: '1px solid #232836',
            borderRadius: 10,
            padding: 18,
            marginBottom: 20,
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12, marginBottom: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: '#B9C0CE' }}>
              Provider (12-Provider Pool)
              <select
                aria-label="Standalone Provider"
                value={wbProviderId}
                onChange={(e) => handleSelectWbProvider(e.target.value)}
                style={{
                  minHeight: 44,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 13.5,
                }}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.status}] {p.shortName} ({p.lane === 'eu' ? 'EU Safe' : 'General'})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: '#B9C0CE' }}>
              Pinned Model
              <select
                aria-label="Pinned Model"
                value={wbModelId}
                onChange={(e) => setWbModelId(e.target.value)}
                style={{
                  minHeight: 44,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 13.5,
                }}
              >
                {(selectedProviderCfg.supportedModels ?? [selectedProviderCfg.pinnedModelId]).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: '#B9C0CE' }}>
              Workbench Persona
              <select
                aria-label="Workbench Persona"
                value={wbPersonaId}
                onChange={(e) => handleSelectWbPersona(e.target.value)}
                style={{
                  minHeight: 44,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 13.5,
                }}
              >
                {MODE_A_PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#8B95A5', marginBottom: 12 }}>
            System Instruction (Editable)
            <input
              type="text"
              value={wbCustomSystem}
              onChange={(e) => setWbCustomSystem(e.target.value)}
              style={{
                minHeight: 44,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#08090D',
                color: '#B9C0CE',
                fontSize: 13,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </label>

          {wbTurns.length > 0 ? (
            <div
              style={{
                maxHeight: 380,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: 12,
                borderRadius: 8,
                background: '#08090D',
                border: '1px solid #232836',
                marginBottom: 12,
              }}
            >
              {wbTurns.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: t.blocked ? 'rgba(240, 36, 92, 0.14)' : t.role === 'user' ? '#171B24' : '#131722',
                    borderLeft: t.blocked ? '3px solid #F0245C' : t.role === 'assistant' ? '3px solid #21E0DC' : 'none',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#8B95A5', marginBottom: 4 }}>
                    {t.role === 'user'
                      ? 'You'
                      : `Balaerion · ${t.replay ? 'Replay Fallback' : `${t.provider} (${t.model})`}`}
                  </div>
                  <div>{t.text}</div>
                  {t.role === 'assistant' && !t.blocked ? (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handoffToStudio('Balaerion Workbench Deck', t.text)}
                        style={{
                          minHeight: 40,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid #21E0DC',
                          background: '#171B24',
                          color: '#21E0DC',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        -&gt; Signal Studio (16:9)
                      </button>
                      <button
                        type="button"
                        onClick={() => handoffToPress('Balaerion Workbench Document', t.text)}
                        style={{
                          minHeight: 40,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid #F0245C',
                          background: '#F0245C',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        -&gt; Signal Press (A4)
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <textarea
              aria-label="Standalone LLM Prompt"
              value={wbPrompt}
              onChange={(e) => setWbPrompt(e.target.value)}
              rows={3}
              placeholder="Write a standalone prompt (architecture brief, SQL schema, executive memo, deck outline)..."
              style={{
                flex: '1 1 280px',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#08090D',
                color: '#F2F5F9',
                fontSize: 14.5,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                disabled={wbBusy}
                onClick={() => sendStandalonePrompt()}
                style={{
                  minHeight: 44,
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#21E0DC',
                  color: '#08090D',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {wbBusy ? 'Running...' : 'Run Prompt'}
              </button>
              {wbTurns.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setWbTurns([])}
                  style={{
                    minHeight: 44,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #232836',
                    background: '#171B24',
                    color: '#B9C0CE',
                    cursor: 'pointer',
                  }}
                >
                  Clear Thread
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* MODE B: PROSPECTHUB 7-STATE SUITE */}
      {activeTab === 'modeB' ? (
        <section style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 17, color: '#FFFFFF' }}>
              ProspectHub 7-State Account Workspace &amp; Grounded Persona Runner
            </h2>
            <button
              onClick={exportCsv}
              style={{
                padding: '10px 14px',
                minHeight: 44,
                borderRadius: 8,
                border: '1px solid #21E0DC',
                background: '#171B24',
                color: '#21E0DC',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Export Accounts CSV
            </button>
          </div>

          {/* Add Custom Account Row */}
          <div
            style={{
              background: '#11141B',
              border: '1px solid #232836',
              borderRadius: 8,
              padding: 12,
              marginBottom: 14,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={newEntity}
              onChange={(e) => setNewEntity(e.target.value)}
              placeholder="Add synthetic/calibration entity name..."
              aria-label="New prospect entity name"
              style={{
                flex: '1 1 180px',
                minHeight: 44,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#08090D',
                color: '#F2F5F9',
                fontSize: 13.5,
              }}
            />
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="domain.example"
              aria-label="New prospect domain"
              style={{
                flex: '1 1 150px',
                minHeight: 44,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#08090D',
                color: '#F2F5F9',
                fontSize: 13.5,
              }}
            />
            <select
              value={newCountry}
              aria-label="New prospect country"
              onChange={(e) => setNewCountry(e.target.value as 'BE' | 'NL' | 'FR' | 'GLOBAL')}
              style={{
                minHeight: 44,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#08090D',
                color: '#F2F5F9',
                fontSize: 13.5,
              }}
            >
              <option value="NL">NL</option>
              <option value="BE">BE</option>
              <option value="FR">FR</option>
              <option value="GLOBAL">GLOBAL</option>
            </select>
            <input
              type="text"
              value={newStack}
              onChange={(e) => setNewStack(e.target.value)}
              placeholder="Detected Stack (e.g. Shopify + GTM)"
              aria-label="New prospect stack"
              style={{
                flex: '1 1 170px',
                minHeight: 44,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#08090D',
                color: '#F2F5F9',
                fontSize: 13.5,
              }}
            />
            <button
              type="button"
              onClick={addProspectWorkspace}
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #21E0DC',
                background: '#171B24',
                color: '#21E0DC',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Add Workspace
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #232836', borderRadius: 8, marginBottom: 16 }}>
            <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', background: '#11141B' }}>
              <thead>
                <tr style={{ background: '#171B24', textAlign: 'left', color: '#21E0DC', fontSize: 12 }}>
                  <th style={{ padding: 10 }}>Entity</th>
                  <th style={{ padding: 10 }}>Market</th>
                  <th style={{ padding: 10 }}>Stack</th>
                  <th style={{ padding: 10 }}>Readiness</th>
                  <th style={{ padding: 10 }}>State</th>
                  <th style={{ padding: 10 }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc, idx) => (
                  <tr key={`${acc.domain}-${idx}`} style={{ borderTop: '1px solid #232836', fontSize: 13.5 }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{acc.entity}</td>
                    <td style={{ padding: 10 }}>{acc.country}</td>
                    <td style={{ padding: 10, color: '#B9C0CE' }}>{acc.stack}</td>
                    <td style={{ padding: 10, color: '#21E0DC', fontWeight: 700 }}>{acc.readiness}/10</td>
                    <td style={{ padding: 10 }}>{acc.state}</td>
                    <td style={{ padding: 8 }}>
                      <button
                        onClick={() => setSelectedIdx(idx)}
                        style={{
                          padding: '8px 12px',
                          minHeight: 44,
                          borderRadius: 6,
                          border: selectedIdx === idx ? '1px solid #21E0DC' : '1px solid #232836',
                          background: selectedIdx === idx ? '#21E0DC' : '#171B24',
                          color: selectedIdx === idx ? '#08090D' : '#F2F5F9',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Active
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 16-Persona Grounded Runner */}
          <div style={{ background: '#11141B', border: '1px solid #21E0DC', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#21E0DC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              PROSPECTHUB PERSONA RUNNER · GROUNDED ON SSoT ({activeAccount.country} + GLOBAL)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 10, marginBottom: 10 }}>
              <select
                aria-label="ProspectHub Persona"
                value={phPersonaId}
                onChange={(e) => setPhPersonaId(e.target.value)}
                style={{
                  minHeight: 44,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 13.5,
                }}
              >
                {MODE_B_PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="ProspectHub LLM Provider"
                value={phProviderId}
                onChange={(e) => setPhProviderId(e.target.value)}
                style={{
                  minHeight: 44,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 13.5,
                }}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.status}] {p.shortName} ({p.lane === 'eu' ? 'EU Safe' : 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={phNotes}
                onChange={(e) => setPhNotes(e.target.value)}
                placeholder="Optional discovery notes or vertical focus (synthetic/non-PII)..."
                aria-label="ProspectHub extra notes"
                style={{
                  flex: '1 1 240px',
                  minHeight: 44,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #232836',
                  background: '#08090D',
                  color: '#F2F5F9',
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                disabled={phBusy}
                onClick={runProspectPersona}
                style={{
                  minHeight: 44,
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#21E0DC',
                  color: '#08090D',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {phBusy ? 'Generating...' : `Run Persona for ${activeAccount.entity}`}
              </button>
            </div>

            {phOutputs.length > 0 ? (
              <div
                style={{
                  maxHeight: 360,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: 10,
                  borderRadius: 8,
                  background: '#08090D',
                  border: '1px solid #232836',
                }}
              >
                {phOutputs.map((o, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: o.blocked ? 'rgba(240, 36, 92, 0.14)' : o.role === 'user' ? '#171B24' : '#131722',
                      borderLeft: o.blocked ? '3px solid #F0245C' : o.role === 'assistant' ? '3px solid #21E0DC' : 'none',
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    <div>{o.text}</div>
                    {o.citations && o.citations.length > 0 ? (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {o.citations.map((c, ci) => (
                          <span
                            key={`${c.docId}-${ci}`}
                            style={{
                              fontSize: 11,
                              fontFamily: 'monospace',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: '#08090D',
                              border: '1px solid #21E0DC',
                              color: '#21E0DC',
                            }}
                          >
                            [{c.docId}] {c.market}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {o.role === 'assistant' && !o.blocked ? (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handoffToStudio(`${activeAccount.entity}: Commercial Brief`, o.text, activeAccount.country)}
                          style={{
                            minHeight: 40,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #21E0DC',
                            background: '#171B24',
                            color: '#21E0DC',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          -&gt; Signal Studio (16:9)
                        </button>
                        <button
                          type="button"
                          onClick={() => handoffToPress(`${activeAccount.entity}: Commercial Brief`, o.text, activeAccount.country)}
                          style={{
                            minHeight: 40,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #F0245C',
                            background: '#F0245C',
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          -&gt; Signal Press (A4)
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#B9C0CE', marginBottom: 10 }}>
              Human-in-the-Loop Lifecycle Transition for <strong style={{ color: '#FFFFFF' }}>{activeAccount.entity}</strong> (AI auto-transition hard-blocked):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LIFECYCLE_STATES.map((st) => (
                <button
                  key={st}
                  onClick={() => updateLifecycle(st)}
                  style={{
                    padding: '10px 12px',
                    minHeight: 44,
                    borderRadius: 6,
                    border: activeAccount.state === st ? '1px solid #21E0DC' : '1px solid #232836',
                    background: activeAccount.state === st ? 'rgba(33, 224, 220, 0.14)' : '#171B24',
                    color: activeAccount.state === st ? '#21E0DC' : '#B9C0CE',
                    fontWeight: activeAccount.state === st ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* PRE-DISPATCH PII & LANE GATE TESTER */}
      {activeTab === 'gate' ? (
        <div style={{ background: '#11141B', border: '1px solid #232836', borderRadius: 8, padding: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16, color: '#21E0DC' }}>Interactive Pre-Dispatch PII &amp; Lane Gate Tester</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
            <button
              onClick={() => setTestLane('general')}
              style={{
                padding: '10px 14px',
                minHeight: 44,
                borderRadius: 8,
                border: testLane === 'general' ? '1px solid #21E0DC' : '1px solid #232836',
                background: testLane === 'general' ? '#21E0DC' : '#171B24',
                color: testLane === 'general' ? '#08090D' : '#B9C0CE',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Target Lane: general ({gateProvider})
            </button>
            <button
              onClick={() => setTestLane('safe')}
              style={{
                padding: '10px 14px',
                minHeight: 44,
                borderRadius: 8,
                border: testLane === 'safe' ? '1px solid #21E0DC' : '1px solid #232836',
                background: testLane === 'safe' ? '#21E0DC' : '#171B24',
                color: testLane === 'safe' ? '#08090D' : '#B9C0CE',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Target Lane: eu / safe (mistral)
            </button>
            <button
              onClick={() => setTestPrompt('Write a generic SQL query for append-only audit tables.')}
              style={{
                padding: '10px 14px',
                minHeight: 44,
                borderRadius: 8,
                border: '1px solid #232836',
                background: '#171B24',
                color: '#F2F5F9',
                cursor: 'pointer',
              }}
            >
              Load Clean Prompt
            </button>
            <button
              onClick={() => setTestPrompt('Summarize VAT BE0123.456.789 and IBAN BE68539007547034.')}
              style={{
                padding: '10px 14px',
                minHeight: 44,
                borderRadius: 8,
                border: '1px solid #F0245C',
                background: '#171B24',
                color: '#F0245C',
                cursor: 'pointer',
              }}
            >
              Load Synthetic PII Prompt
            </button>
          </div>
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            aria-label="Test prompt for pre-dispatch gate"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              minHeight: 44,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #232836',
              background: '#08090D',
              color: '#F2F5F9',
              marginBottom: 10,
            }}
          />
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              borderLeft: gateResult.allowed ? '3px solid #21E0DC' : '3px solid #F0245C',
              background: gateResult.allowed ? 'rgba(33, 224, 220, 0.08)' : 'rgba(240, 36, 92, 0.12)',
              color: gateResult.allowed ? '#21E0DC' : '#FF5C86',
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            {gateResult.allowed
              ? `ALLOWED: Pre-dispatch gate passed for lane "${testLane}" (provider "${gateProvider}").`
              : gateResult.reason}
          </div>
        </div>
      ) : null}
    </div>
  );
}
