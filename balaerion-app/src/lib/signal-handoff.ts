export interface SignalSlideHandoff {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  callout?: string;
  notes?: string;
}

export interface SignalHandoffPayload {
  schema: 'signal-handoff-v1';
  deckTitle: string;
  theme: 'console' | 'lightscreen' | 'blueprint';
  market: string;
  updatedAt: string;
  slides: SignalSlideHandoff[];
}

export const HANDOFF_STORAGE_KEY = 'signal_press_handoff_v1';

export const DEFAULT_HANDOFF_DECK: SignalHandoffPayload = {
  schema: 'signal-handoff-v1',
  deckTitle: 'Kapsalon Vuurtoren BV: Post-Discovery Readiness Brief',
  theme: 'lightscreen',
  market: 'NL/BE',
  updatedAt: '2026-11-25',
  slides: [
    {
      id: 's1',
      eyebrow: 'EXECUTIVE SUMMARY',
      title: 'Deterministic Readiness Assessment (8.6 / 10)',
      body: 'Synthetic calibration entity Kapsalon Vuurtoren BV (BE) operates on Lightspeed eCom with verified server-side event readiness.',
      callout: 'Advisory framing: configure conversion tracking on staging prior to campaign launch.',
      notes: '30-minute discovery call delta verified against synthetic registry fixture.',
    },
    {
      id: 's2',
      eyebrow: 'PHASE 1 ROADMAP',
      title: 'Province-Scoped Rollout & Measurement Hygiene',
      body: 'Start with province-level targeting across Antwerp and East Flanders before expanding creative variants.',
      callout: 'Do not send PDF attachments externally; export client-facing steps as inline Email HTML.',
      notes: 'Prepared for handoff into Signal Press A4 activation plan template.',
    },
  ],
};

export function validateHandoffPayload(raw: unknown): { valid: boolean; payload?: SignalHandoffPayload; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Payload must be a JSON object.'] };
  }
  const obj = raw as Record<string, unknown>;

  // Support legacy signal-studio.html DECK JSON ({ title, theme, slides: [{ objects: [...] }] })
  if (obj.schema !== 'signal-handoff-v1' && Array.isArray(obj.slides)) {
    const converted = adaptLegacyStudioDeck(obj);
    if (converted) return { valid: true, payload: converted, errors: [] };
  }

  if (obj.schema !== 'signal-handoff-v1') {
    errors.push('Expected schema "signal-handoff-v1" or a valid Signal Studio DECK export.');
  }
  if (typeof obj.deckTitle !== 'string' || !obj.deckTitle.trim()) {
    errors.push('deckTitle must be a non-empty string.');
  }
  if (!Array.isArray(obj.slides) || obj.slides.length === 0) {
    errors.push('slides must be a non-empty array.');
  }

  if (errors.length > 0) return { valid: false, errors };

  const slides: SignalSlideHandoff[] = (obj.slides as Array<Record<string, unknown>>).map((s, idx) => ({
    id: typeof s.id === 'string' && s.id ? s.id : `s${idx + 1}`,
    eyebrow: typeof s.eyebrow === 'string' ? s.eyebrow : `SECTION ${idx + 1}`,
    title: typeof s.title === 'string' && s.title ? s.title : `Slide ${idx + 1}`,
    body: typeof s.body === 'string' ? s.body : '',
    callout: typeof s.callout === 'string' ? s.callout : undefined,
    notes: typeof s.notes === 'string' ? s.notes : undefined,
  }));

  const theme =
    obj.theme === 'console' || obj.theme === 'blueprint' || obj.theme === 'lightscreen'
      ? obj.theme
      : 'lightscreen';

  return {
    valid: true,
    payload: {
      schema: 'signal-handoff-v1',
      deckTitle: String(obj.deckTitle),
      theme,
      market: typeof obj.market === 'string' && obj.market ? obj.market : 'NL/BE',
      updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString().slice(0, 10),
      slides,
    },
    errors: [],
  };
}

function adaptLegacyStudioDeck(obj: Record<string, unknown>): SignalHandoffPayload | null {
  if (!Array.isArray(obj.slides) || obj.slides.length === 0) return null;
  const slides: SignalSlideHandoff[] = obj.slides.map((rawSlide, idx) => {
    const s = (rawSlide && typeof rawSlide === 'object' ? rawSlide : {}) as Record<string, unknown>;
    const objects = Array.isArray(s.objects) ? (s.objects as Array<Record<string, unknown>>) : [];
    const texts = objects
      .filter((o) => o && typeof o.text === 'string' && String(o.text).trim())
      .map((o) => String(o.text).trim());
    return {
      id: typeof s.id === 'string' ? s.id : `legacy_${idx + 1}`,
      eyebrow: texts[0] && texts[0].length <= 36 ? texts[0] : `SLIDE ${idx + 1}`,
      title: (typeof s.name === 'string' && s.name) || texts[1] || texts[0] || `Imported Slide ${idx + 1}`,
      body: texts.slice(2).join('\n\n') || texts.join('\n\n'),
      notes: typeof s.notes === 'string' ? s.notes : undefined,
    };
  });

  return {
    schema: 'signal-handoff-v1',
    deckTitle: typeof obj.title === 'string' && obj.title ? obj.title : 'Imported Signal Studio Deck',
    theme: obj.theme === 'blueprint' ? 'blueprint' : obj.theme === 'lightscreen' ? 'lightscreen' : 'console',
    market: 'NL/BE',
    updatedAt: new Date().toISOString().slice(0, 10),
    slides,
  };
}

export function saveHandoffToLocalStorage(payload: SignalHandoffPayload): { ok: boolean; error?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ok: false, error: 'Browser localStorage is unavailable.' };
    }
    window.localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to write to localStorage.' };
  }
}

export function loadHandoffFromLocalStorage(): SignalHandoffPayload | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const check = validateHandoffPayload(parsed);
    return check.valid && check.payload ? check.payload : null;
  } catch {
    return null;
  }
}
