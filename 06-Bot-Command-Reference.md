# VI. Conversational Interface & API Specification

**Focus:** 14 Conversational Commands (`7` Core + `7` Domain Extensions), Scoped OAuth & Webhook Card Safeguards · **Status:** `Designed` (Command simulator: `Prototype`)

---

## 1. Architectural Philosophy of the Bot
The conversational application (`Bot`) serves as the primary operational surface for agents during live engagements. To preserve enterprise access boundaries and register integrity, the Bot is not a passive search wrapper; it is an authenticated, auditable execution proxy.

**Core Execution Flow:**

    bot.message.received event
      --> Authenticate sender against the User Access Register (T4)
      --> Parse command, parameters, and enforce strict Market Scoping
      --> Execute operation (Query, State Change, or Gap Generation)
      --> Format interactive webhook response card
      --> Deliver payload and write an audit transaction to T10

*Operating Parameters:* 
*   **Response SLA:** Under 10 seconds end-to-end.
*   **Authentication:** Senders must hold an `Active` status in `T4`. Deprovisioned senders are blocked and logged.
*   **Auditability:** Every invocation writes to the audit log (`T10`), including rejected commands and out-of-scope queries.

---

## 2. Generalized API Permissions & Scope Profile (`[Status: Designed]`)
To execute background jobs and proxy writes without over-privileging user accounts, the Bot authenticates with a short-lived **application-scoped OAuth service token** (`~2-hour` TTL, rotated automatically by the worker SDK) restricted to minimal capability scopes:

| Generalized Capability Scope | Operational Purpose |
| :--- | :--- |
| `messaging:bot:send` | Transmitting direct messages and channel responses. |
| `messaging:events:read` | Receiving slash/mention command payloads. |
| `cards:interactive:write` | Rendering interactive approval and escalation cards. |
| `kb:nodes:read_write` | Wiki node read, search, **and physical container move operations** during publish and archive sequences. |
| `storage:containers:manage` | Container-level permission grants and folder telemetry collection. |
| `db:records:read_write` | Chunked read/write access across the Data Layer and Audit Layer tables. |
| `directory:users:read` | Sender lookup and supervisor/escalation path resolution. |

*Implementation Note:* Holding OAuth scopes alone is insufficient; the Bot service principal must also be granted explicit collaborator access on both the Data Layer and Audit Layer database applications, and requires read-write knowledge-base node permissions so it can execute physical node moves during publication.

---

## 3. The 14 Conversational Commands (`7` Core + `7` Domain Extensions)
Agents operate the knowledge architecture via natural-language commands (`@Bot [command] [parameter]`). The specification defines **14 commands** split evenly between core workspace utilities and domain-specific SSoT extensions:

### 3.1 Core Operational Utilities (7 Commands)
1.  `find [topic]`: Returns top 3 matching pages, appending staleness warnings when overdue.
2.  `my pages`: Lists files owned by the sender with live health and review status badges.
3.  `health [title]`: Computes and returns the `0-100` stepped health score and deduction breakdown.
4.  `gap [question]`: Writes a structured demand record to the Gap Tracker (`T3`) and notifies the market lead.
5.  `review [title]`: **Load-bearing for Agent Lockdown.** Sole mechanism for View-Only agents (`AGT`) to log a self-review and advance `Last Reviewed Date`.
6.  `admin faults`: Returns open fault queue summary (`F-001` to `F-029`) for `ADM` callers.
7.  `admin users`: Exports active scope and role diagnostics from `T4` for `ADM` callers.

### 3.2 Domain-Specific SSoT Extensions (7 Commands)
Standard workspace bots lack awareness of ISO market codes, regulated verticals, or container reconciliation. Seven domain extensions close that gap:

| # | Command | Syntax | Target Functionality |
| :--- | :--- | :--- | :--- |
| 1 | **`ask`** | `@Bot ask [plain question]` | **Quick-Answer Engine.** Extracts market/domain facets, queries `T1`, and returns the best verified file link plus a 2-line extract. |
| 2 | **`check`** | `@Bot check [vertical] [CC]` | **Commercial Screen.** Returns policy tier, gating requirements, and compliance blockers before prospect commitment. |
| 3 | **`find-faceted`** | `@Bot find market:[CC] vertical:[name] objective:[type]` | Deterministic multi-facet query against structured `T1` columns. |
| 4 | **`policy`** | `@Bot policy [category] [CC]` | Returns the governing policy file plus `Open`, `Gated`, or `Prohibited` verdict for that market. |
| 5 | **`market`** | `@Bot market [CC]` | Returns the master market overview alongside deep-links to all `75` standard market files for that country. |
| 6 | **`vertical`** | `@Bot vertical [name] [CC]` | Returns the localized industry vertical playbook and required regulatory disclosures for `[CC]`. |
| 7 | **`reconcile`** | `@Bot reconcile [CC]` | `ADM`-only trigger for on-demand `SC-003` / `SC-004` state and permission reconciliation. |

---

## 4. Key Behavioral Safeguards

### 4.1 The Staleness Warning
For every file returned by a search or query, the Bot checks `Days Overdue`. If a file is past its review date, the Bot injects a mandatory warning:
> *This file is 23 days past review. Verify facts before relying on it.*

An agent handed a stale file without warning is worse off than one receiving no file at all, as they will act upon obsolete operational rules with misplaced confidence.

### 4.2 Strict Market Scoping (Default-Deny)
Market scoping is enforced in code on every command before any node content is read. Missing, empty, or malformed scopes fail closed (`false`), and both user scopes and target market codes are trimmed and normalized to uppercase:

```javascript
function inScope(user, marketCode) {
  if (!user || typeof user.scope !== 'string' || typeof marketCode !== 'string') {
    return false;
  }
  const target = marketCode.trim().toUpperCase();
  if (!target) return false;
  const tokens = user.scope
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.includes('ALL') || tokens.includes(target);
}
```

| Test Case | `user.scope` | `marketCode` | `inScope()` Result | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| Null / missing scope | `null` or `""` | `"NL"` | `false` | Default-deny on unprovisioned or malformed `T4` row |
| Case & whitespace drift | `" nl , be "` | `"be"` | `true` | Trimmed and uppercased token match |
| Out-of-scope market | `"NL,BE"` | `"FR"` | `false` | Cross-market leak blocked and logged (`DT-004`) |
| Global reviewer/admin | `"all"` | `"DE"` | `true` | Normalized `ALL` grant |
| Blank target parameter | `"ALL"` | `"   "` | `false` | Rejects malformed empty market parameter |

If an `NL`-scoped agent queries a `MENA` market file, the Bot intercepts the request, returns a scope-rejection message, and logs `F-021` via `DT-004`. **The Bot never returns content the caller could not reach by navigating the workspace directly.**

---

## 5. Interactive Webhook Card Safeguards

### 5.1 The 3-Second Callback ACK Rule
Enterprise chat platforms require an `HTTP 200` acknowledgement within **3 seconds** of an interactive card button click; exceeding that window triggers automatic webhook retries and duplicate state writes. Acknowledge immediately and enqueue downstream work asynchronously:

```javascript
app.post('/card', express.json(), async (req, res) => {
  res.status(200).json({ toast: { type: 'info', content: 'Processing...' } });
  setImmediate(() => processCardActionAsync(req.body));
});
```

### 5.2 Card Validity Windows (`14 Days`)
Interactive approval cards carry a **14-day** interaction and update validity window. Because approval cards sent to reviewers on leave expire silently, Console's publishing queue (`DT-005`) flags any pending approval older than 14 days and issues a fresh card rather than leaving drafts stranded in `_STAGING/`.
