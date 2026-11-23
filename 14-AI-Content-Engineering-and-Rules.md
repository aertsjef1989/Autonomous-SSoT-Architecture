# XIV. AI Content Engineering & Verification Rules

**Document ID:** `14-AI-Content-Engineering-and-Rules.md`  
**Focus:** Two Writing Standards, 15 Mechanical Checks & 5 Semantic Gates

---

## 1. The Two Writing Depth Standards
Scaling 3,386 files across 45 markets requires rigid structural blueprints so every file answers its operational question without fluff. Every domain maps to one of two formal standards:

### 1.1 The Activation-Depth Standard (`VRT`, `POL`, `MKT`, `LIF`, `CAM`, `ONB`)
A market or vertical playbook is incomplete unless it contains all seven mandatory components:

| # | Mandatory Component | Operational Requirement |
| :--- | :--- | :--- |
| **1** | **Named Entities** | Exact local regulators, statutory decrees, and payment rails—never generic placeholders ("the relevant authority"). |
| **2** | **Hard Numbers** | Specific verifiable thresholds and statutory limits wherever knowable; ranges are a fallback, never a default. |
| **3** | **Decision Tables** | Every branching choice or eligibility matrix is rendered as a structured comparison table, never buried in prose. |
| **4** | **Phased Rollout + Exit Gates** | Execution broken into sequential phases with explicit quantitative go/no-go exit criteria between phases. |
| **5** | **Local-Language Register** | Market-specific language and idioms matching the exact jurisdiction (omitted for `ONB` technical setup files). |
| **6** | **Verification Checklist** | A closing pre-launch checklist the operator can physically tick through before going live. |
| **7** | **Classified Sources** | Every external claim backed by a primary source explicitly classified as `Verified` or `Needs Confirmation`. |

### 1.2 The Integration-Guide Standard (`FMT`, structural `TPL`)
Global technical guides follow a strict 5-part sequence per tool or integration:
1. **Intro Paragraph:** Scope and exact target use case.
2. **Prerequisites:** Required account tiers, admin permissions, and SDK/plugin versions.
3. **Literal Step-by-Step Walkthrough:** Exact current UI menu click paths—never vague directions like "open settings."
4. **Verify Step:** Concrete confirmation method (e.g., Test Events diagnostics, payload deduplication check).
5. **Troubleshooting Table:** Real production failure modes formatted strictly as `Symptom | Root Cause | Resolution`.

Surrounding each guide: a **Coverage at a Glance** summary table, a shared **Core Concepts** section (preventing repetition), and an explicit **Needs In-Account Confirmation** table for parameters that vary by tenant.

---

## 2. The 15 Mechanical Checks (Automated Pre-Submission Linting)
Before any draft consumes human reviewer time, an automated validator scans the Markdown file and outputs `PASS` or a line-numbered defect report across 15 deterministic rules:

| # | Rule Category | Mechanical Check | Failure Trigger |
| :--- | :--- | :--- | :--- |
| **M01** | **Filename Syntax** | Regex match `ENT_[FOLDER]_[CC]_[COUNTER]_[TOPIC].md` | Non-standard prefix, unpadded counter, or invalid ISO code |
| **M02** | **Metadata Header** | Required register fields present (`Market`, `Folder`, `Cadence`, `Last Verified`) | Any missing or blank header field |
| **M03** | **Tag Count** | Controlled taxonomy tags applied | Fewer than 2 valid tags (triggers `-20` Health Score penalty) |
| **M04** | **Required Sections** | Folder-specific H2 headings present in order | Missing Verdict, Decision Table, Checklist, or Sources |
| **M05** | **Word Count Bounds** | Length within folder minimum/maximum floor | Thin stub or bloated unedited dump |
| **M06** | **Market Consistency** | Target country code (`CC`) matches body references | Cross-market contamination (e.g., `NL` terms inside `BE` file) |
| **M07** | **Source Classification** | Every row in Sources table carries a class label | Unclassified source or bare unattributed claim |
| **M08** | **Vague Authorities** | Regex scan for generic placeholders | Phrases like "local regulator" or "applicable authority" |
| **M09** | **Filler Superlatives** | Regex scan for non-declarative marketing fluff | Words like "world-class", "robust", "seamless", "impressive" |
| **M10** | **Budget Floor Discipline** | Daily budget figures phrased as minimums | Any phrasing implying a daily budget is a maximum ceiling |
| **M11** | **Typography Hygiene** | Prohibited punctuation / formatting artifacts | Stray em-dashes, broken Markdown tables, or escaped underscores |
| **M12** | **Code Block Hygiene** | Inline Markdown vs. fenced block rules per template | Broken rendering in target wiki parser |
| **M13** | **Author Attribution** | Zero personal attribution in shared playbooks | Personal names embedded as plan executors |
| **M14** | **Layer Isolation** | Zero cross-references from Public to Internal layer | Any internal SOP ID or confidential path inside a public file |
| **M15** | **Open Questions Gate** | Explicit unverifiable-claims table present | Missing confirmation table on tenant-dependent workflows |

---

## 3. The 5 Semantic Checks (Human QA Exclusively)
Machines enforce structure; humans enforce truth. Reviewers spend 100% of their review cycle on the five checks automation cannot evaluate:

1. **The Swap-the-Country-Name Test:** Replace the country name with a neighboring market. If the guidance still reads plausibly, the file lacks local specificity and is rejected.
2. **Named Entity Verification:** Confirm statutory bodies, tax/VAT rules, and local payment rails are current and legally exact.
3. **Regional Linguistic Register:** Enforce strict regional boundaries (e.g., Flemish vs. Netherlands Dutch; formal vs. informal address).
4. **Structural Findability:** Confirm complex logic is presented as a scannable table rather than dense paragraphs.
5. **Claim-to-Source Fidelity:** Open the cited primary source and confirm it actually proves the exact sentence in the draft.

---

## 4. The Anti-Anchoring Research Protocol
Writing a draft first and fact-checking afterward fails because human reviewers anchor to fluent AI prose (RPN `560`). The generation workflow reverses the sequence:
1. **Extract Perishable Claims First:** List every UI path, legal threshold, fee, and partner availability flag *before* drafting.
2. **Dual-Source Load-Bearing Facts:** Verify every high-impact claim against primary documentation.
3. **Surface Conflicts Explicitly:** When two official sources disagree, document the conflict rather than silently picking one.
4. **Draft Last:** Assemble the file only after the verified fact table is locked.
