# Balaerion I. OmniRoute Gateway, Hosting & Security

**Focus:** Multi-Provider AI Gateway, Hetzner/Oracle Failover, Cloudflare Access MFA & GDPR-Safe Routing

---

## 1. Core Stack & Design Constraints
Balaerion is a personal, zero-incremental-subscription AI gateway and workspace designed to run across any browser (iOS Safari PWA, Chromebook, locked-down workstation) with zero client installs and zero interference with employer systems.

| Layer | Component | Architectural Rationale |
| :--- | :--- | :--- |
| **Gateway** | **OmniRoute** (MIT, ~340 providers, 90+ free tiers) | Used as-is (unforked) for upstream routing and key management. Exposes one global system prompt, so per-context prompts live in the frontend. |
| **Frontend** | **LibreChat** | Native Skills (`SKILL.md`), GitHub Skill Sync, new-chat control, and persistent history tab. |
| **Inference** | **Hosted APIs Only** | No local model inference; every model call leaves the machine under explicit routing policy. |
| **Interfaces** | **Telegram + Direct Drive API** | Long-polling Telegram bot (`chatgpt-telegram-bot`) locked to a single user ID; direct Google Drive API wrapped as an OpenAPI tool (avoiding official Drive MCP personal-account failures). Personal OneDrive only; zero CRM or employer hooks. |

## 2. Hosting & Failover Topology
- **Primary Node:** Hetzner AX41 dedicated server (Ryzen 5 3600, 64GB RAM, 2x512GB NVMe, Ubuntu) with browser-accessible terminal/IDE.
- **Standby Node:** Oracle Always Free ARM VM (2 OCPU, 12GB RAM) exposed via Cloudflare Tunnel.
- **ARM64 Code Execution:** Runs `LibreCodeInterpreter` (ARM64 + NsJail) on Oracle because the official interpreter requires KVM, which Oracle ARM does not expose.

## 3. Access & GDPR-Safe Routing Lane
- **Authentication:** MFA enforced via **Cloudflare Access** (Email OTP or Google SSO) since OmniRoute has no native MFA.
- **Credential Isolation:** Subscription credentials are never routed through any third-party gateway; hobby routers are strictly barred from client data.
- **NL/BE Client Data Lane:** Per-key `allowedModels` / `blockedModels` rules in API Manager restrict client-data traffic exclusively to **Scaleway (Paris)** and **Mistral EU** with training opt-out enabled. Free-tier or non-EU endpoints (Gemini free tier, DeepSeek, China-hosted APIs) are hard-blocked on client keys.
