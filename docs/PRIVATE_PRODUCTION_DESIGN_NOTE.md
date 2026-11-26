# One-Page Private-Production Architecture Design Note

> **Scope & Boundary (Constraint 1.5):** The public GitHub Pages book and the unlisted free-tier portfolio POC (`balaerion-app`) share **zero network paths, secrets, tunnels, or runtime dependencies** with any private self-hosted environment. This one-page note documents how the exact same codebase promotes into a closed, single-tenant private production deployment by configuration alone.

---

## 1. Control-Plane Swap (Zero Code Refactor)

| Layer | Portfolio POC (Public Pages + Unlisted Free Tier) | Private Single-Tenant Production Deployment |
| :--- | :--- | :--- |
| **Identity & Access** | Open Replay + single-use salted-HMAC `BLR-...` grants (`balaerion_grant` cookie). | Workspace SSO (OIDC / SAML via Supabase Auth or enterprise IdP) with mandatory hardware WebAuthn MFA and per-seat RBAC (`owner_id = auth.uid()`). |
| **Data Residency & DB** | Supabase Free EU (`eu-central-1` / `eu-west-1`), 1-day Studio logs, synthetic-only LLM rule. | Dedicated EU Postgres instance (or self-hosted Supabase on dedicated EU compute) with Point-in-Time Recovery, daily encrypted backups, and `pgvector` HNSW enabled (`ENABLE_RETRIEVAL_SLOT=1`). |
| **LLM Routing (`registry.ts`)** | Card-free free tiers (`ovhcloud-eu`, `groq`, `cerebras`, `cloudflare-workers-ai`, `openrouter-free`); excluded paid APIs hard-blocked. | Declarative registry swap to signed-DPA Zero Data Retention (ZDR) endpoints: dedicated EU vLLM / Scaleway Dedicated / Mistral Scale ZDR / Azure OpenAI EU Data Zone with contractual `0-day` abuse-log waiver. |
| **Document Export & Drive Sync** | Client-side browser download (`.docx`, tuned Google Docs `.docx`, Dark/Light A4 PDF, 600px Email HTML, `.md`). | Optional direct Google Docs / Drive upload using the narrow **non-sensitive** OAuth 2.0 scope `https://www.googleapis.com/auth/drive.file` + Google Picker API (`V17`). |

---

## 2. Narrow Google Drive Export Design (`V17` Verified 2026-11-25)

* **Primary Source:** Google Workspace Drive API Scopes Guide (`https://developers.google.com/workspace/drive/api/guides/api-specific-auth`, accessed 2026-11-25).
* **Why `drive.file` instead of `drive`:**
  1. `https://www.googleapis.com/auth/drive.file` is classified by Google as a **non-sensitive** scope. It grants per-file access strictly to files **created by Signal Press** or explicitly selected by the user through the **Google Picker API**, never exposing the user's broader Google Drive corpus.
  2. Avoiding restricted scopes (`drive`, `drive.readonly`) eliminates CASA third-party restricted-scope security assessments while still supporting `files.create` with `mimeType: 'application/vnd.google-apps.document'` (automatic OOXML `.docx` to native Google Docs conversion).
* **Token Handling in Private Mode:** OAuth refresh tokens are never used in the portfolio POC; in a private deployment (`Manual Check h`), short-lived PKCE access tokens stay scoped to the user's browser session or encrypted KMS vault, uploading only documents that have passed `runBlockingPreExportLint()` (`0` unaccepted `aiDraft` blocks, `0` unsourced figures).

---

## 3. Governance & Audit Invariants Preserved Across Both Worlds

1. **Deterministic Pre-Export & Pre-Dispatch Blocking (`M1`):** `enforce_ssot_publish_gates()` (`FR-C01`), `enforce_human_state_transition()` (ProspectHub 7-state HITL lock), `enforcePreDispatchGate()`, and `runBlockingPreExportLint()` remain hard blocking gates rather than advisory warnings.
2. **Theme-Free Authoring (`signal-press-doc-v1`):** Authors maintain one canonical JSON/Markdown source; `.docx` / Google Docs render on Signal Light (`#FFFFFF`, Calibri/Carlito, single-cell shaded table callouts without floating Word textboxes per `V19`), while executive briefings render in Dark or Light A4 PDF.
