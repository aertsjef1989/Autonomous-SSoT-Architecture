import type { ExportFormat, PressAudience, PressDocument } from './schema';

export interface PressTemplateSpec {
  id: string;
  name: string;
  nameNl: string;
  description: string;
  audience: PressAudience;
  allowedExports: ExportFormat[];
  createDocument: () => PressDocument;
}

export const PRESS_TEMPLATES: PressTemplateSpec[] = [
  {
    id: 'tpl-one-pager',
    name: '1. Executive One-Pager',
    nameNl: '1. Executive One-Pager (1 A4)',
    description: 'Single-page A4 architecture snapshot with fit indicator, KPI row, and sourced guardrails.',
    audience: 'internal',
    allowedExports: ['docx', 'gdocs_docx', 'pdf_dark', 'pdf_light', 'email_html', 'markdown'],
    createDocument: () => ({
      schemaVersion: 'signal-press-doc-v1',
      meta: {
        title: 'Autonomous SSoT Governance One-Pager',
        subtitle: '100-Seat Lean Reference Model Across 40+ Markets',
        author: 'Systems Architecture Portfolio',
        language: 'en-GB',
        market: 'NL/BE',
        docType: 'one_pager',
        audience: 'internal',
        templateId: 'tpl-one-pager',
        themeId: 'lightscreen',
        updatedAt: '2026-11-25',
      },
      sources: [
        {
          id: 'SRC-ROI',
          label: 'Lean Six Sigma DMADV 100-Seat Reference Model (Chapter 01)',
          reference: '01-Business-Case-and-ROI.md',
          classification: 'verified',
        },
        {
          id: 'SRC-SCAN',
          label: 'Single Daily Scan Telemetry & Escalation Spec (Chapter 05)',
          reference: '05-Self-Healing-Loop-and-Fault-Taxonomy.md',
          classification: 'verified',
        },
      ],
      blocks: [
        {
          id: 'b-op-h1',
          type: 'heading',
          level: 1,
          eyebrow: 'EXECUTIVE SNAPSHOT',
          text: 'Objective & Architectural Scope',
        },
        {
          id: 'b-op-p1',
          type: 'paragraph',
          text: 'Eliminate stale operational guidance across multi-market teams using zero-license workspace primitives, container-inherited permissions, and a single daily scan.',
        },
        {
          id: 'b-op-kpi',
          type: 'kpi_row',
          sourceId: 'SRC-ROI',
          kpis: [
            { label: 'Recoverable Value', value: 'EUR 198k to 297k', note: '40% to 60% recovery', sourceId: 'SRC-ROI' },
            { label: 'Run Reduction', value: '98%', note: '30 vs 1,700 runs/mo', sourceId: 'SRC-SCAN' },
            { label: 'Archive Cutoff', value: 'Day 30', note: 'Autonomous kill switch', sourceId: 'SRC-SCAN' },
          ],
        },
        {
          id: 'b-op-h2',
          type: 'heading',
          level: 2,
          text: 'Key Architecture Controls',
        },
        {
          id: 'b-op-num',
          type: 'numbered',
          items: [
            '**Move-Then-Confirm Publish:** Staging nodes move into target market containers before status flips to Published.',
            '**Agent Lockdown:** Frontline seats use structured bot commands rather than direct register cell edits.',
            '**T+24h Verification Re-Scan:** Corrections remain provisional until verified clean on the next nightly pass.',
          ],
        },
        {
          id: 'b-op-call',
          type: 'callout',
          variant: 'key',
          title: 'KEY GOVERNANCE INVARIANT',
          text: 'Leaving unverified policy guidance in active circulation past Day 30 is treated as a higher compliance risk than an archived slot.',
          sourceId: 'SRC-SCAN',
        },
        {
          id: 'b-op-src',
          type: 'source_note',
          sourceId: 'SRC-ROI',
          text: 'Sources: [SRC-ROI] (verified) 01-Business-Case-and-ROI.md; [SRC-SCAN] (verified) 05-Self-Healing-Loop-and-Fault-Taxonomy.md.',
        },
      ],
    }),
  },
  {
    id: 'tpl-research-brief',
    name: '2. Prospect Research Brief (1-10 Rubric)',
    nameNl: '2. Account Onderzoeksbrief (1-10 Score)',
    description: 'Fixed OSINT structure with a 1 to 10 readiness block and verified / reported / unconfirmable source markers.',
    audience: 'internal',
    allowedExports: ['docx', 'gdocs_docx', 'pdf_dark', 'pdf_light', 'email_html', 'markdown'],
    createDocument: () => ({
      schemaVersion: 'signal-press-doc-v1',
      meta: {
        title: 'Account Research Brief: Kapsalon Vuurtoren BV',
        subtitle: 'Deterministic OSINT & Technical Readiness Assessment (Fictional Calibration Entity)',
        author: 'ProspectHub Safe Lane',
        language: 'nl-BE',
        market: 'NL/BE',
        docType: 'research_brief',
        audience: 'internal',
        templateId: 'tpl-research-brief',
        themeId: 'lightscreen',
        updatedAt: '2026-11-25',
      },
      sources: [
        {
          id: 'SRC-KBO',
          label: 'Synthetic Belgian Crossroads Bank Registry Fixture (KBO 0123.456.789)',
          reference: 'https://vuurtoren-atelier.example/registry-fixture',
          classification: 'verified',
        },
        {
          id: 'SRC-STACK',
          label: 'Public Storefront Header & Tag Audit (Lightspeed eCom)',
          reference: 'https://vuurtoren-atelier.example/tech-audit',
          classification: 'reported',
        },
        {
          id: 'SRC-OFFLINE',
          label: 'In-salon Repeat Booking Share Estimate',
          reference: 'https://vuurtoren-atelier.example/unverified-note',
          classification: 'unconfirmable',
        },
      ],
      blocks: [
        {
          id: 'b-rb-hero',
          type: 'hero_image',
          heroId: 'H01',
          alt: 'Signal flat vector illustration representing structured signal inspection',
          caption: 'Fictional calibration record only; zero real personal or advertiser data.',
        },
        {
          id: 'b-rb-h1',
          type: 'heading',
          level: 1,
          eyebrow: 'DETERMINISTIC OSINT BRIEF',
          text: 'Entity Snapshot',
        },
        {
          id: 'b-rb-tbl',
          type: 'table',
          sourceId: 'SRC-KBO',
          highlightCol: 2,
          headers: ['Field', 'Observed Value', 'Evidence Class'],
          rows: [
            ['Legal Entity', 'Kapsalon Vuurtoren BV (Antwerp Province, BE)', 'verified [SRC-KBO]'],
            ['Commerce Stack', 'Lightspeed eCom + client-side pixel only', 'reported [SRC-STACK]'],
            ['Repeat Offline Share', 'Estimated salon rebooking mix', 'unconfirmable [SRC-OFFLINE]'],
          ],
        },
        {
          id: 'b-rb-h2',
          type: 'heading',
          level: 2,
          text: 'Readiness Rubric (1 to 10)',
        },
        {
          id: 'b-rb-kpi',
          type: 'kpi_row',
          sourceId: 'SRC-KBO',
          kpis: [
            { label: 'Composite Readiness', value: '8.6 / 10', note: 'Tier A technical fit', sourceId: 'SRC-KBO' },
            { label: 'Entity Confidence', value: '94%', note: 'Registry + VAT match', sourceId: 'SRC-KBO' },
            { label: 'Discovery Slot', value: '30 min', note: 'Standard agenda scope', sourceId: 'SRC-STACK' },
          ],
        },
        {
          id: 'b-rb-call',
          type: 'callout',
          variant: 'tip',
          title: 'RECOMMENDED 30-MINUTE DISCOVERY FOCUS',
          text: 'Confirm server-side event deduplication readiness during the 30-minute discovery call before drafting the client activation plan.',
        },
        {
          id: 'b-rb-h3',
          type: 'heading',
          level: 2,
          text: 'Sources & Verification Markers',
        },
        {
          id: 'b-rb-s1',
          type: 'source_note',
          sourceId: 'SRC-KBO',
          text: '[SRC-KBO] [VERIFIED] Synthetic Belgian KBO Registry Fixture (vuurtoren-atelier.example).',
        },
        {
          id: 'b-rb-s2',
          type: 'source_note',
          sourceId: 'SRC-STACK',
          text: '[SRC-STACK] [REPORTED] Public Storefront DOM & Script Tag Snapshot (vuurtoren-atelier.example).',
        },
        {
          id: 'b-rb-s3',
          type: 'source_note',
          sourceId: 'SRC-OFFLINE',
          text: '[SRC-OFFLINE] [UNCONFIRMABLE] Unverified offline repeat-visit assumption; hold loosely until confirmed.',
        },
      ],
    }),
  },
  {
    id: 'tpl-activation-plan',
    name: '3. Client Activation Plan (Advisory Framing)',
    nameNl: '3. Client Activatieplan (Adviserend Kader)',
    description: 'Client-facing post-discovery instructions in strict advisory framing; exports to Email HTML, DOCX, or Markdown.',
    audience: 'client',
    allowedExports: ['email_html', 'docx', 'gdocs_docx', 'markdown'],
    createDocument: () => ({
      schemaVersion: 'signal-press-doc-v1',
      meta: {
        title: 'Post-Discovery Activation Plan: Noordzee Rijwielen BV',
        subtitle: 'Self-Service Implementation Steps Following Your 30-Minute Discovery Call',
        author: 'Advisory Architecture Team',
        language: 'nl-NL',
        market: 'NL/BE',
        docType: 'activation_plan',
        audience: 'client',
        templateId: 'tpl-activation-plan',
        themeId: 'lightscreen',
        updatedAt: '2026-11-25',
      },
      sources: [
        {
          id: 'SRC-DISC',
          label: 'Agreed Technical Notes from 30-Minute Discovery Session',
          reference: 'https://noordzee-fietsen.example/discovery-notes',
          classification: 'verified',
        },
      ],
      blocks: [
        {
          id: 'b-ap-h1',
          type: 'heading',
          level: 1,
          eyebrow: 'CLIENT IMPLEMENTATION GUIDE',
          text: 'Discovery Summary',
        },
        {
          id: 'b-ap-p1',
          type: 'paragraph',
          text: 'Thank you for our 30-minute discovery call with **Noordzee Rijwielen BV**. Below are the recommended configuration steps for your technical team to execute inside your own workspace.',
        },
        {
          id: 'b-ap-h2',
          type: 'heading',
          level: 2,
          text: 'Client Implementation Steps',
        },
        {
          id: 'b-ap-steps',
          type: 'numbered',
          items: [
            '**Configure Event Deduplication:** In your tag manager container, pass a shared `event_id` parameter across browser and server `CompletePayment` events.',
            '**Select Province-Level Regions:** In your campaign location settings for the Netherlands, select provinces (`Noord-Holland`, `Zuid-Holland`, `Noord-Brabant`) rather than narrow postal radii.',
            '**Validate Attribution Window:** Set click-through attribution to 7 days in your analytics comparison view so reporting matches your checkout cycle.',
          ],
        },
        {
          id: 'b-ap-h3',
          type: 'heading',
          level: 2,
          text: 'Measurement Checklist',
        },
        {
          id: 'b-ap-bul',
          type: 'bullets',
          sourceId: 'SRC-DISC',
          items: [
            'Verify parameter coverage (`value`, `currency`, `content_id`) reaches **95%** match quality in Event Diagnostics.',
            'Confirm consent banner signals propagate prior to firing marketing tags.',
          ],
        },
        {
          id: 'b-ap-call',
          type: 'callout',
          variant: 'context',
          title: 'ADVISORY SCOPE NOTE',
          text: 'Your engineering team retains full administrative control over all tags, pixels, and campaign settings. Reply directly to this email if you want a follow-up check on your test events.',
        },
      ],
    }),
  },
  {
    id: 'tpl-integration-guide',
    name: '4. Technical Integration Guide',
    nameNl: '4. Technische Integratiehandleiding',
    description: 'Structured server-side events and webhook integration walkthrough with verification table.',
    audience: 'client',
    allowedExports: ['email_html', 'docx', 'gdocs_docx', 'markdown'],
    createDocument: () => ({
      schemaVersion: 'signal-press-doc-v1',
      meta: {
        title: 'Server-Side Events API Integration Guide',
        subtitle: 'Deterministic Payload Schema & Deduplication Verification',
        author: 'Solutions Engineering',
        language: 'en-GB',
        market: 'NL/BE',
        docType: 'integration_guide',
        audience: 'client',
        templateId: 'tpl-integration-guide',
        themeId: 'lightscreen',
        updatedAt: '2026-11-25',
      },
      sources: [
        {
          id: 'SRC-SPEC',
          label: 'Standard Commerce Event Payload Specification v2',
          reference: 'https://nordic-grid.example/events-spec',
          classification: 'verified',
        },
      ],
      blocks: [
        {
          id: 'b-ig-h1',
          type: 'heading',
          level: 1,
          eyebrow: 'TECHNICAL SPECIFICATION',
          text: 'Prerequisites',
        },
        {
          id: 'b-ig-p1',
          type: 'paragraph',
          text: 'Ensure your storefront backend emits deterministic order UUIDs and SHA-256 normalized customer match keys only after explicit consent is granted.',
        },
        {
          id: 'b-ig-h2',
          type: 'heading',
          level: 2,
          text: 'Implementation Steps',
        },
        {
          id: 'b-ig-num',
          type: 'numbered',
          items: [
            'Generate a shared `event_id` on checkout render and pass it to both browser and server payloads.',
            'Include ISO-4217 currency (`EUR`) and numeric `value` formatted to two decimals.',
            'Honor HTTP `429` responses using `Retry-After` exponential backoff.',
          ],
        },
        {
          id: 'b-ig-h3',
          type: 'heading',
          level: 2,
          text: 'Verification',
        },
        {
          id: 'b-ig-tbl',
          type: 'table',
          sourceId: 'SRC-SPEC',
          highlightCol: 2,
          headers: ['Event Name', 'Required Keys', 'Target Threshold'],
          rows: [
            ['ViewContent', 'event_id, content_id, currency', '99% schema valid'],
            ['InitiateCheckout', 'event_id, value, currency', '95% deduplicated'],
            ['CompletePayment', 'event_id, order_id, value, currency', '100% server parity'],
          ],
        },
      ],
    }),
  },
  {
    id: 'tpl-playbook-page',
    name: '5. SSoT Operational Playbook Page',
    nameNl: '5. SSoT Operationele Playbookpagina',
    description: 'Internal dual-tree wiki node blueprint with literal answer-first framing and guardrails.',
    audience: 'internal',
    allowedExports: ['docx', 'gdocs_docx', 'pdf_dark', 'pdf_light', 'email_html', 'markdown'],
    createDocument: () => ({
      schemaVersion: 'signal-press-doc-v1',
      meta: {
        title: 'Playbook: Handling Cross-Market Ownership Transfers (Mover Protocol)',
        subtitle: 'Standard Operating Procedure for Container-Inherited Wiki Estates',
        author: 'SSoT Governance Operations',
        language: 'en-GB',
        market: 'NL/BE',
        docType: 'playbook_page',
        audience: 'internal',
        templateId: 'tpl-playbook-page',
        themeId: 'lightscreen',
        updatedAt: '2026-11-25',
      },
      sources: [
        {
          id: 'SRC-RBAC',
          label: 'Role-Based Access Matrix & Mover Protocol (Chapter 07)',
          reference: '07-Role-Based-Access-Matrix.md',
          classification: 'verified',
        },
      ],
      blocks: [
        {
          id: 'b-pb-h1',
          type: 'heading',
          level: 1,
          eyebrow: 'INTERNAL PLAYBOOK NODE',
          text: 'Operational Answer',
        },
        {
          id: 'b-pb-p1',
          type: 'paragraph',
          text: 'When a Market Champion transfers to a new market scope in `T4`, reassign every active file in their prior market **before** granting write permissions in the destination branch.',
        },
        {
          id: 'b-pb-h2',
          type: 'heading',
          level: 2,
          text: 'Guardrails & Sequence',
        },
        {
          id: 'b-pb-num',
          type: 'numbered',
          sourceId: 'SRC-RBAC',
          items: [
            'Run `@Bot preview-scope` to enumerate orphaned records (target **0%** unowned nodes).',
            'Reassign ownership to the incoming Market Champion or First Line Manager.',
            'Revoke old container grants, apply new container grants, and verify nightly reconciliation at `02:30`.',
          ],
        },
        {
          id: 'b-pb-quote',
          type: 'quote',
          text: 'Granting destination scope before revoking prior branch ownership creates silent cross-market write drift.',
        },
      ],
    }),
  },
  {
    id: 'tpl-executive-report',
    name: '6. Architecture & Governance Report (Cover + Exec Summary)',
    nameNl: '6. Architectuur- & Governancerapport',
    description: 'Multi-page A4 report with cover hero, table of contents, executive summary, findings table, and page break.',
    audience: 'internal',
    allowedExports: ['docx', 'gdocs_docx', 'pdf_dark', 'pdf_light', 'email_html', 'markdown'],
    createDocument: () => ({
      schemaVersion: 'signal-press-doc-v1',
      meta: {
        title: 'Quarterly Autonomous Knowledge Governance Audit',
        subtitle: 'Multi-Market Findability, Staleness Prevention & AI Gateway Controls',
        author: 'Jef Aerts · Systems Architecture',
        language: 'en-GB',
        market: 'NL/BE',
        docType: 'executive_report',
        audience: 'internal',
        templateId: 'tpl-executive-report',
        themeId: 'console',
        updatedAt: '2026-11-25',
      },
      sources: [
        {
          id: 'SRC-AUDIT',
          label: 'Quarterly 30-Query Findability & Reconciliation Specification (Chapter 12)',
          reference: '12-Architecture-Decision-Records.md',
          classification: 'verified',
        },
      ],
      blocks: [
        {
          id: 'b-er-hero',
          type: 'hero_image',
          heroId: 'glyph',
          alt: 'Signal two-dot geometric hero emblem',
          caption: 'Signal Design System · Quarterly Systems Audit (Synthetic Portfolio Dataset)',
        },
        {
          id: 'b-er-toc',
          type: 'toc',
          title: 'Contents',
        },
        {
          id: 'b-er-h1',
          type: 'heading',
          level: 1,
          eyebrow: 'SECTION 01',
          text: 'Executive Summary',
        },
        {
          id: 'b-er-p1',
          type: 'paragraph',
          sourceId: 'SRC-AUDIT',
          text: 'Across `3,000+` modeled nodes and `40+` markets, automated container inheritance and the single daily scan held state divergence at **0%** over 14 consecutive verification cycles.',
        },
        {
          id: 'b-er-pb',
          type: 'page_break',
        },
        {
          id: 'b-er-h2',
          type: 'heading',
          level: 1,
          eyebrow: 'SECTION 02',
          text: 'Findings & Control Telemetry',
        },
        {
          id: 'b-er-tbl',
          type: 'table',
          sourceId: 'SRC-AUDIT',
          highlightCol: 2,
          headers: ['Control Surface', 'Target SLA', 'Observed Synthetic Result'],
          rows: [
            ['Findability Audit (30 Queries)', '>= 90% in <= 3 clicks', '94% verified [SRC-AUDIT]'],
            ['P1 Audit-Write Halt SLA', '<= 2 hours', '0 breaches [SRC-AUDIT]'],
            ['Cross-Lane EU Fallback', '0% permitted', 'Hard-blocked [SRC-AUDIT]'],
          ],
        },
        {
          id: 'b-er-div',
          type: 'divider',
        },
        {
          id: 'b-er-h3',
          type: 'heading',
          level: 2,
          text: 'Recommendations',
        },
        {
          id: 'b-er-rec',
          type: 'numbered',
          items: [
            'Maintain strict separation between theme-free JSON block content and render-time surface tokens.',
            'Keep all client-facing deliverables on inline Email HTML or Light-surface DOCX to avoid attachment blocks.',
          ],
        },
      ],
    }),
  },
];

export function getTemplateById(id: string): PressTemplateSpec {
  return PRESS_TEMPLATES.find((t) => t.id === id) ?? PRESS_TEMPLATES[0];
}
