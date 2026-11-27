---
title: "Playbook: Handling Cross-Market Ownership Transfers (Mover Protocol)"
subtitle: "Standard Operating Procedure for Container-Inherited Wiki Estates"
language: en-GB
market: NL/BE
doc_type: playbook_page
audience: internal
updated_at: 2026-11-25
---

# Playbook: Handling Cross-Market Ownership Transfers (Mover Protocol)

*Standard Operating Procedure for Container-Inherited Wiki Estates*

`INTERNAL PLAYBOOK NODE`
# Operational Answer

When a Market Champion transfers to a new market scope in `T4`, reassign every active file in their prior market **before** granting write permissions in the destination branch.

## Guardrails & Sequence

1. Run `@Bot preview-scope` to enumerate orphaned records (target **0%** unowned nodes).
2. Reassign ownership to the incoming Market Champion or First Line Manager.
3. Revoke old container grants, apply new container grants, and verify nightly reconciliation at `02:30`.

> Granting destination scope before revoking prior branch ownership creates silent cross-market write drift.
