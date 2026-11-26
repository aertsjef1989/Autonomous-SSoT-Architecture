---
title: "Post-Discovery Activation Plan: Noordzee Rijwielen BV"
subtitle: "Self-Service Implementation Steps Following Your 30-Minute Discovery Call"
language: nl-NL
market: NL/BE
doc_type: activation_plan
audience: client
updated_at: 2026-11-25
---

# Post-Discovery Activation Plan: Noordzee Rijwielen BV

*Self-Service Implementation Steps Following Your 30-Minute Discovery Call*

`CLIENT IMPLEMENTATION GUIDE`
# Discovery Summary

Thank you for our 30-minute discovery call with **Noordzee Rijwielen BV**. Below are the recommended configuration steps for your technical team to execute inside your own workspace.

## Client Implementation Steps

1. **Configure Event Deduplication:** In your tag manager container, pass a shared `event_id` parameter across browser and server `CompletePayment` events.
2. **Select Province-Level Regions:** In your campaign location settings for the Netherlands, select provinces (`Noord-Holland`, `Zuid-Holland`, `Noord-Brabant`) rather than narrow postal radii.
3. **Validate Attribution Window:** Set click-through attribution to 7 days in your analytics comparison view so reporting matches your checkout cycle.

## Measurement Checklist

- Verify parameter coverage (`value`, `currency`, `content_id`) reaches **95%** match quality in Event Diagnostics.
- Confirm consent banner signals propagate prior to firing marketing tags.

> **ADVISORY SCOPE NOTE:** Your engineering team retains full administrative control over all tags, pixels, and campaign settings. Reply directly to this email if you want a follow-up check on your test events.
