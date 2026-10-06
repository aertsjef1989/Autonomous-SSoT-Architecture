# Prototype Manual

**How to run the prototypes, and what each one is for**

| Field | Value |
|---|---|
| Document ID | `PROTOTYPE_MANUAL` |
| Version | 1.0 |
| Covers | Four React artifacts, fifty-four images |
| Date | 23 July 2026 |
| Status | Prototypes, not documentation. These are rehearsals of the system, not descriptions of it |

---

## 1. What these are

The documentation suite describes the system. **These prototypes exercise it.**

Nothing here touches a platform. Every flow, dashboard and diagram runs on illustrative data, and the point of each one is the same: **make a failure visible before anyone builds the thing that can fail.**

| Artifact | Contains | Use it to |
|---|---|---|
| [**`index.html`**](PROTOTYPES/index.html) | **The menu, linked** | **Start here. Open it** |
| [`ttk_flow_prototype.html`](PROTOTYPES/ttk_flow_prototype.html) | Flows 01 to 05 | Walk the core sequences |
| [`ttk_flows_advanced.html`](PROTOTYPES/ttk_flows_advanced.html) | Flows 06 to 13 | Break the ones with real failure branches |
| [`ttk_dashboards.html`](PROTOTYPES/ttk_dashboards.html) | Ten Console dashboards | Judge layout, density and what each role sees |
| [`ttk_kb_interface.html`](PROTOTYPES/ttk_kb_interface.html) | Agent Knowledge Base | See the frontline view with health badges and bot |
| `VISUALS/` | Fifty-four images, 2400px | Slides, printing, reference |

---

## 2. Running them

**Open `PROTOTYPES/index.html`.** That is the whole instruction.

| | |
|---|---|
| Install required | **None** |
| Server required | **None** |
| Network required | **None.** Verified with the network disabled |
| Works from | A USB stick, an email attachment, a shared drive |
| Size | Roughly 220KB each |

React is compiled into each file. There are no external requests at runtime, no CDN, no fonts to fetch. **Open one on a laptop with the wifi off and it works.**

### 2.1 Why HTML rather than a hosted app

A prototype behind a login is a prototype nobody opens. **These can be attached to an email**, and the person receiving them does not need an account, a sandbox or a working internet connection.

### 2.2 Why separate files rather than one

Thirteen flows and ten dashboards in a single component would take several seconds to parse and would be unpleasant to edit. Splitting them costs nothing, because they share no state.

---

## 3. The flows

Thirteen sequences. **Every one has a failure branch you can trigger**, and that is the filter for whether a flow earned its place.

### 3.1 File one, flows 01 to 05

| # | Flow | The control to press |
|---|---|---|
| **01** | **Publish sequence** | **Break the move**, then **Write state first** |
| 02 | The ask command | Pick the question with no market named |
| 03 | Import and rollback | Run the dry run, commit, then roll back |
| 04 | Escalation ladder | Drag the day slider past 15, then past 30 |
| 05 | Who reaches what | Select Manager |

### 3.2 File two, flows 06 to 13

| # | Flow | The control to press |
|---|---|---|
| 06 | Triage | Drag the clock past day 10 |
| 07 | The mover | Switch to **Grant first** |
| 08 | Reconciliation | Set **Forward only**, then run the job |
| 09 | Fault lifecycle | Set the re-scan to **FAIL** |
| 10 | Definition builder | Edit the filter, then turn the version break **off** |
| 11 | Offboarding | Switch to **Deprovision first** |
| **12** | **Verification** | **Switch to Draft first** |
| 13 | The gate sequence | Click **G5** to fail it |

### 3.3 The two to open with

**Flow 01, publish sequence.** Step through it once cleanly. Then press *Break the move* and watch the register correctly hold at Awaiting Approval, which is the system behaving.

**Then press both toggles together**, *Break the move* and *Write state first*, and step through. The register announces Published while the document never left staging.

**Both toggles, not one.** With buggy ordering alone the move still succeeds, so the register is only briefly wrong and corrects itself. The permanent lie needs the write to happen early *and* the move to fail, which is exactly the combination that occurs in production.

The panel that appears reads **the register is lying**. That is the single most consequential failure mode in the platform, and it produces no error message.

**Flow 12, verification.** Switch to *Draft first* and step through. The author writes ten working days from memory, the search returns fifteen to twenty, and the author keeps ten because they have already written it.

The published file is wrong, reads exactly like a correct file, and scores 100 on health. **More review does not catch this**, which is why the protocol puts identification before drafting rather than checking afterwards.

---

## 4. The dashboards

Ten views. Data is illustrative. **Layout, density and what each role can see are the real content.**

| # | Dashboard | For |
|---|---|---|
| 01 | Administrator daily | Six checks, one with a deadline |
| 02 | Fault queue | SLA countdown by severity |
| 03 | Job schedule board | Expected against actual, with manual trigger |
| 04 | Publishing queue | Stuck publishes and expiring cards |
| 05 | Effective access | Per person, plus provisioning preview |
| 06 | Content production | Progress and the two counterintuitive signals |
| 07 | Executive scorecard | Twenty-one measures against target |
| 08 | Audit browser | Append-only log |
| 09 | Manager, regional | Read on records, build on dashboards |
| 10 | Measure definitions | The engine, as rows |

### 4.1 Three worth pausing on

**01, the archive queue tile.** It is the only tile in the system with a deadline. A file at day 30 leaves circulation tonight, and after that the recovery path is a manual restore.

**05, provisioning preview.** Press *Preview it*. A scope change writes hundreds of grants and there is otherwise no way to see what it will do before it does it. The preview also surfaces the nine files that would be left outside the new scope.

**06, verification findings.** The number is falling and the caption says *watch it, do not celebrate it*. A falling findings count can mean quality improving or checking stopping, and the dashboard cannot tell you which.

---

## 5. Reading the colours

Consistent across all artifacts.

| Colour | Means |
|---|---|
| **Cyan** | Working correctly, or a safeguard that is active |
| **Pink** | Can fail silently, or is currently failing |
| **Amber** | Needs attention, or is approaching a threshold |
| Muted grey | Context, secondary, inactive |

**Pink is never decorative.** If something is pink, either it is broken or it is the thing that stops it breaking.

---

## 6. What is illustrative and what is real

Worth being explicit, because these get shown in rooms.

| Real | Illustrative |
|---|---|
| Every sequence and its ordering | All numbers, names and file titles |
| Every failure branch and its consequence | Market completion percentages |
| Field names, fault codes, command names | Fault ages and SLA states |
| Thresholds: day 14, day 30, health 72, 500 rows | Row counts and audit entries |
| Role names and access rules | The people in the access dashboard |

**If it is a rule, it is real. If it is a number on a tile, it is made up.**

---

## 7. What these do not cover

Stated so nobody assumes otherwise.

| Not covered | Where it goes |
|---|---|
| Acceptance criteria | Next artifact. One testable statement per flow and surface |
| API contract | After acceptance criteria |
| Test fixtures | After the contract |
| The strings the system actually says | String catalogue, separate |
| Whether the depth standard is achievable | The golden set, and it needs research |

The prototypes show **what the system does**. They do not yet state **what correct means in testable terms**, and that is the next gap to close.

---

## 8. Changing them

| Want to | Do this |
|---|---|
| Add a flow | Write a component, add one row to the array |
| Add a dashboard | Same, but to the dashboard configuration |
| Change the palette | Edit variables in `styles.css`. It cascades |
| Change a threshold | Search the constant. They are not abstracted, deliberately |

Thresholds are hard-coded on purpose. **Abstracting them would hide the numbers the prototype exists to argue about.**