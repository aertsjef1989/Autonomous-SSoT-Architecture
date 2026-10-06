# VI. Conversational Interface & API Specification
**Document ID:** `06-Bot-Command-Reference.md`  
**Focus:** Conversational Operations, Bot Architecture, Scopes, and Event Handling  

## 1. Architectural Philosophy of the Bot
The conversational application (`Bot`) serves as the primary operational surface for agents during live client engagements. To maintain enterprise security and ensure data integrity, the Bot is not merely a search wrapper; it is an authenticated, auditable execution engine.

**Core Execution Flow:**

    message.receive_v1 event
      --> Authenticate sender against the User Access Register (T4)
      --> Parse command, parameters, and enforce strict Market Scoping
      --> Execute operation (Query, State Change, or Gap Generation)
      --> Format interactive response card (Card Kit v2.0)
      --> Deliver payload and write an immutable transaction to the Audit Log (T10)

*Operating Parameters:* 
*   **Response SLA:** Under 10 seconds end-to-end.
*   **Authentication:** Senders must have an `Active` account status in the access register. Deprovisioned senders are instantly blocked and logged.
*   **Auditability:** Every single invocation writes to the immutable audit log—including rejected commands and out-of-scope queries.

---

## 2. API Permissions & Scope Architecture
To execute its duties without violating enterprise boundaries, the Bot operates under a strict, minimal scope profile using a `tenant_access_token` (approximately 2-hour lifetime, auto-refreshed by the SDK) to support unattended background operations.

| Scope | Operational Purpose |
| :--- | :--- |
| `im:message:send_as_bot` | Transmitting direct messages and channel responses. |
| `im:message:receive_v2` | Command reception. |
| `cardkit:card:write` | Rendering interactive response cards (Schema 2.0). |
| `wiki:wiki` | Node read, search, **and the physical node move operations** required during publish and archive sequences. |
| `drive:drive` | Permission container grants and file statistics collection. |
| `bitable:app` | Read and write access across all operational and audit tables. |
| `contact:user.base:readonly` | Sender lookup and supervisor/escalation path resolution. |

*Crucial Implementation Note:* Holding API scopes is insufficient on its own. The application must additionally be explicitly added as a **Base Collaborator** on both the Data Layer and Audit Layer applications. Furthermore, while early iterations of enterprise bots relied on read-only wiki scopes, this architecture requires full `wiki:wiki` access because the Bot actively executes node relocations during document publication.

---

## 3. The 23 Conversational Commands
Agents operate the knowledge architecture via natural language commands (`@Bot [command] [parameter]`). The command set is divided into core operational utilities and custom enterprise-specific extensions.

### 3.1 Core Commands (14 Inherited Utilities)
*   `find [topic]` — Returns top 3 pages, appending staleness flags if out of date.
*   `my pages` — Lists files owned by the sender with live status icons.
*   `health [title]` — Computes and returns the 0-100 health score and review metrics.
*   `gap [question]` — Autonomously writes a record to the Gap Tracker (T3) and notifies the market lead.
*   `review [title]` — **Load-bearing for the Agent Lockdown.** Because agents are barred from direct table editing, this command is their sole mechanism to log a self-review and reset their freshness clock.
*   `admin faults` / `admin users` — System-level administrative dumps.

### 3.2 Enterprise Extensions (9 Custom TTK Commands)
Standard enterprise wiki bots lack context regarding geographic markets, industries, or campaign structures. These nine custom commands close that gap:

| Command | Syntax | Target Functionality |
| :--- | :--- | :--- |
| **`ask`** | `@Bot ask [plain question]` | **The Quick-Answer Engine.** Facet-extracts the query, queries the register, and returns the single best file link plus a 2-line text extract. |
| **`check`** | `@Bot check [vertical] [CC]` | **The Commercial Screen.** Instantly returns policy tiers, gating requirements, and known blockers before an agent commits to a prospect. |
| **`find` (Faceted)** | `@Bot find market:[CC] vertical:[name] objective:[type]` | Exact facet query against specific relational table fields. |
| **`policy`** | `@Bot policy [category] [CC]` | Returns the exact policy file plus the open, gated, or prohibited verdict for that market. |
| **`market` / `vertical`** | `@Bot market [CC]` | Returns the master market file alongside deep-links to all 73 sibling files for that country. |
| **`reconcile`** | `@Bot reconcile [CC]` | Admin-only trigger for manual, on-demand state and permission reconciliation. |

---

## 4. Key Behavioral Safeguards

### 4.1 The Staleness Warning
For every file returned by a search or query, the Bot checks the `Days Overdue` field. If a file is past its review date, the Bot injects a mandatory warning:
> *This file is 23 days past review. Verify facts before relying on it.*

An agent handed a stale file without warning is worse off than one receiving no file at all, as they will act upon obsolete operational rules with misplaced confidence.

### 4.2 Strict Market Scoping
Market scoping is enforced at the code level for *every single command*:

    function inScope(user, marketCode) {
      if (user.scope === 'ALL') return true;
      return user.scope.split(',').map(s => s.trim()).includes(marketCode);
    }

If an NL-scoped agent queries a MENA market file, the Bot intercepts the request, returns a scope-rejection message, and logs the attempt. **The Bot never returns content the caller could not reach by manually navigating the workspace.**

---

## 5. Interactive Card Architecture & Platform Constraints

### 5.1 The 3-Second Rule
The platform expects an HTTP 200 acknowledgement within **3 seconds** of an interactive card callback. Exceeding this triggers automatic delivery retries, resulting in duplicate database transactions.
*   **The Design Pattern:** Acknowledge first, process asynchronously after:

    app.post('/card', express.json(), async (req, res) => {
      res.status(200).json({ toast: { type: 'info', content: 'Processing...' } });
      // Asynchronous execution handled downstream
    });

### 5.2 Card Validity Windows
Under Card JSON Schema 2.0, interactive card validity is unified to **14 days** (both for user interaction and programmatic content updates). 
Because approval cards sent to reviewers who take leave will quietly expire, Console’s publishing interface surfaces any pending approval older than 14 days, prompting the system to issue a fresh card rather than relying on stale states.
