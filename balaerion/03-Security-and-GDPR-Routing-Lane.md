# Balaerion III. Security, MFA & GDPR Routing Lane

**Focus:** Cloudflare Access MFA, Credential Isolation & EU-Only Client Data Enforcement

---

## 1. Authentication & Edge Security
Because OmniRoute does not ship with native multi-factor authentication (MFA), relying on application-level passwords alone is insufficient for a browser-accessible control plane.

* **Edge MFA Gate:** **Cloudflare Access** sits in front of LibreChat, the browser terminal/IDE, and OmniRoute admin endpoints, enforcing **Email OTP or Google SSO** before any packet reaches the origin VM.
* **Bot Lockdown:** The long-polling Telegram bot rejects all incoming messages whose `sender_id` does not match the single whitelisted owner ID.

---

## 2. Credential & Subscription Isolation
* **No Gateway Passthrough for Primary Subscriptions:** Personal primary subscription credentials are never routed through third-party proxy gateways.
* **Hobby Router Quarantine:** Community/hobby routers (e.g., AgentRouter) are strictly quarantined to non-sensitive personal experiments and are hard-blocked from ever receiving client data.

---

## 3. The GDPR-Safe NL/BE Client Data Lane
Processing NL/BE commercial or client-adjacent context requires strict EU data residency and zero model-training guarantees. Balaerion enforces this technically inside OmniRoute's API Manager using per-key `allowedModels` and `blockedModels` policies:

| Routing Lane | Permitted Providers | Hard-Blocked Providers | Data Governance Rule |
| :--- | :--- | :--- | :--- |
| **GDPR Client Lane (NL/BE)** | **Scaleway (Paris)**, **Mistral EU** (training opt-out enabled) | Gemini free tier, DeepSeek, China-hosted APIs, hobby routers | Enforced at API key level; requests to non-EU models return `403 Policy Denied`. |
| **Public OSINT / Research Lane** | 90+ free-tier & standard hosted providers | None (public web/registry data only) | Retrieval-only; models must return raw source evidence, never unverified conclusions. |
