const DEFAULT_DOCS = [
  { doc_id: "DOC-NLBE-101", title: "Omnichannel_Activation_Playbook_v3.md", tree_layer: "PUBLIC", market_code: "NL/BE", folder_path: "EMEA / Benelux (NL & BE) / 01-Campaign-Architecture", status: "VERIFIED", owner_role: "SME-NLBE", age_days: 6, content_summary: "Full-funnel omnichannel GTM activation matrix for Benelux retail and B2B accounts." },
  { doc_id: "DOC-NLBE-104", title: "Market_Compliance_Guardrails_2026.md", tree_layer: "PUBLIC", market_code: "NL/BE", folder_path: "EMEA / Benelux (NL & BE) / 01-Campaign-Architecture", status: "VERIFIED", owner_role: "SME-NLBE", age_days: 11, content_summary: "Regional regulatory and GDPR Art. 15/17/35 guardrails for NL and BE outbound workflows." },
  { doc_id: "DOC-DACH-208", title: "SLA_Escalation_Matrix_Tier1.md", tree_layer: "PUBLIC", market_code: "DACH", folder_path: "EMEA / DACH & Nordics / 02-Lifecycle-Operations", status: "VERIFIED", owner_role: "SME-DACH", age_days: 14, content_summary: "24-hour Tier-1 response SLA and handover escalation routing for DACH enterprise accounts." },
  { doc_id: "DOC-NORD-219", title: "Legacy_Q2_Onboarding_Checklist.md", tree_layer: "PUBLIC", market_code: "NORD", folder_path: "EMEA / DACH & Nordics / 02-Lifecycle-Operations", status: "STALE (>30d)", owner_role: "SME-NORD", age_days: 34, content_summary: "Superseded Q2 onboarding sequence flagged for 30-day archive kill-switch." },
  { doc_id: "DOC-LATAM-302", title: "Retail_Conversion_Benchmarks.md", tree_layer: "PUBLIC", market_code: "LATAM", folder_path: "LATAM & MENA / 03-Vertical-Benchmarks", status: "VERIFIED", owner_role: "SME-LATAM", age_days: 9, content_summary: "Regional conversion benchmarks and localized messaging cadences for LATAM." },
  { doc_id: "DOC-MENA-309", title: "Regional_Holiday_Cadence_Guide.md", tree_layer: "PUBLIC", market_code: "MENA", folder_path: "LATAM & MENA / 03-Vertical-Benchmarks", status: "STALE (>30d)", owner_role: "SME-MENA", age_days: 38, content_summary: "Expired seasonal outreach calendar awaiting archive sweep." },
  { doc_id: "DOC-EMEA-042", title: "EMEA_SLA_Response_Standard_Draft.md", tree_layer: "STAGING", market_code: "EMEA", folder_path: "_STAGING / EMEA / Pending-Station-7-Audit", status: "AWAITING_AUDIT", owner_role: "SME-EMEA", age_days: 1, content_summary: "Standard SLA response window is 24 hours across EMEA Tier-1 markets." },
  { doc_id: "DOC-ARC-089", title: "Deprecated_2025_Rate_Card.md", tree_layer: "ARCHIVE", market_code: "GLOBAL", folder_path: "_ARCHIVE / Auto-Quarantined-Nodes", status: "ARCHIVED_30D_TTL", owner_role: "BOT-SWEEPER", age_days: 47, content_summary: "Automatically quarantined after exceeding 30-day freshness window." },
  { doc_id: "INT-001", title: "7_Station_Harness_Runbook.md", tree_layer: "INTERNAL", market_code: "OPS", folder_path: "INTERNAL / 01-Governance-and-SOPs", status: "VERIFIED", owner_role: "SYS-ADMIN", age_days: 4, content_summary: "Anti-hallucination verification protocol requiring isolated Station 7 audit." },
  { doc_id: "INT-009", title: "Incident_Response_P1_P4_Playbook.md", tree_layer: "INTERNAL", market_code: "OPS", folder_path: "INTERNAL / 01-Governance-and-SOPs", status: "VERIFIED", owner_role: "SYS-ADMIN", age_days: 8, content_summary: "Four-tier self-healing remediation runbook for 29 cataloged fault types." }
];

let memState = {
  docs: structuredClone(DEFAULT_DOCS),
  faults: [
    { fault_id: "FLT-104", fault_code: "F-14_ACL_DRIFT", severity: "P2", doc_id: "DOC-LATAM-302", auto_tier: "Tier 1 Auto-Repair", status: "OPEN" },
    { fault_id: "FLT-109", fault_code: "F-22_TTL_OVERDUE", severity: "P3", doc_id: "DOC-NORD-219", auto_tier: "Tier 1 Auto-Repair", status: "OPEN" }
  ],
  logs: [],
  healthScore: 91.4
};

function sbConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url && key ? { url, key } : null;
}

export async function getSsotState() {
  const cfg = sbConfig();
  if (!cfg) {
    return {
      backend: "IN_MEMORY_FALLBACK (Add Supabase env vars in Vercel for live DB)",
      health_score: memState.healthScore,
      docs: memState.docs,
      faults: memState.faults,
      recent_logs: memState.logs.slice(0, 8)
    };
  }

  const headers = { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` };
  const [rDocs, rFaults, rLogs, rKpi] = await Promise.all([
    fetch(`${cfg.url}/rest/v1/ssot_t1_registry?select=*&order=doc_id.asc`, { headers, cache: "no-store" }),
    fetch(`${cfg.url}/rest/v1/ssot_t5_faults?select=*&order=fault_id.asc`, { headers, cache: "no-store" }),
    fetch(`${cfg.url}/rest/v1/ssot_t6_bot_log?select=*&order=created_at.desc&limit=8`, { headers, cache: "no-store" }),
    fetch(`${cfg.url}/rest/v1/ssot_t7_kpis?id=eq.1`, { headers, cache: "no-store" })
  ]);

  if (!rDocs.ok) {
    return {
      backend: "SUPABASE_CONNECTED_AWAITING_MIGRATION_002",
      health_score: memState.healthScore,
      docs: memState.docs,
      faults: memState.faults,
      recent_logs: memState.logs.slice(0, 8)
    };
  }

  const [docs, faults, logs, kpis] = await Promise.all([rDocs.json(), rFaults.json(), rLogs.json(), rKpi.json()]);
  return {
    backend: "SUPABASE_LIVE_POSTGRES",
    health_score: kpis?.[0]?.health_score ?? 91.4,
    docs,
    faults,
    recent_logs: logs
  };
}

export async function executeSsotRpc(rpcName, params, auditMeta) {
  const cfg = sbConfig();
  if (!cfg) {
    let result = { ok: true, mode: "IN_MEMORY_FALLBACK" };
    if (rpcName === "ssot_publish_doc") {
      const d = memState.docs.find((x) => x.doc_id === params.p_doc_id);
      if (!d) return { ok: false, error: `Document ${params.p_doc_id} not found.` };
      d.tree_layer = "PUBLIC";
      d.folder_path = params.p_target_folder || "EMEA / Benelux (NL & BE) / 01-Campaign-Architecture";
      d.status = "VERIFIED";
      d.age_days = 0;
      memState.healthScore = Math.min(99.5, +(memState.healthScore + 0.4).toFixed(1));
      result = { ok: true, workflow: "MOVE_THEN_CONFIRM", doc_id: d.doc_id, to_layer: "PUBLIC" };
    } else if (rpcName === "ssot_archive_sweep") {
      const stale = memState.docs.filter((x) => ["PUBLIC", "STAGING"].includes(x.tree_layer) && x.age_days > 30);
      stale.forEach((d) => {
        d.tree_layer = "ARCHIVE";
        d.folder_path = "_ARCHIVE / Auto-Quarantined-Nodes";
        d.status = "ARCHIVED_30D_TTL";
      });
      memState.healthScore = Math.min(99.5, +(memState.healthScore + stale.length * 0.5).toFixed(1));
      result = { ok: true, workflow: "30_DAY_KILL_SWITCH", archived_count: stale.length, archived_docs: stale.map((s) => s.doc_id) };
    } else if (rpcName === "ssot_create_draft") {
      memState.docs.push({
        doc_id: params.p_doc_id,
        title: params.p_title,
        tree_layer: "STAGING",
        market_code: params.p_market || "EMEA",
        folder_path: `_STAGING / ${params.p_market || "EMEA"} / Pending-Station-7-Audit`,
        status: "AWAITING_AUDIT",
        owner_role: `SME-${params.p_market || "EMEA"}`,
        age_days: 0,
        content_summary: params.p_summary
      });
      result = { ok: true, workflow: "STAGE_DRAFT", doc_id: params.p_doc_id, tree_layer: "STAGING" };
    } else if (rpcName === "ssot_heal_faults") {
      let count = 0;
      memState.faults.forEach((f) => { if (f.status === "OPEN") { f.status = "RESOLVED"; count++; } });
      memState.healthScore = Math.min(99.8, +(memState.healthScore + 0.6).toFixed(1));
      result = { ok: true, workflow: "SELF_HEALING_LOOP", healed_faults: count };
    }

    memState.logs.unshift({
      source_gateway: auditMeta.gateway,
      raw_prompt: auditMeta.prompt,
      resolved_intent: rpcName.toUpperCase(),
      outcome: JSON.stringify(result),
      created_at: new Date().toISOString()
    });
    return result;
  }

  const headers = {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
    "Content-Type": "application/json"
  };

  const res = await fetch(`${cfg.url}/rest/v1/rpc/${rpcName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(params)
  });
  const data = await res.json();

  // Log NL execution into T6 Bot Log
  await fetch(`${cfg.url}/rest/v1/ssot_t6_bot_log`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_gateway: auditMeta.gateway,
      raw_prompt: auditMeta.prompt,
      resolved_intent: rpcName.toUpperCase(),
      target_ref: params.p_doc_id || "GLOBAL",
      ack_ms: 340,
      outcome: JSON.stringify(data)
    })
  }).catch(() => {});

  return data;
}
