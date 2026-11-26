---
title: "Server-Side Events API Integration Guide"
subtitle: "Deterministic Payload Schema & Deduplication Verification"
language: en-GB
market: NL/BE
doc_type: integration_guide
audience: client
updated_at: 2026-11-25
---

# Server-Side Events API Integration Guide

*Deterministic Payload Schema & Deduplication Verification*

`TECHNICAL SPECIFICATION`
# Prerequisites

Ensure your storefront backend emits deterministic order UUIDs and SHA-256 normalized customer match keys only after explicit consent is granted.

## Implementation Steps

1. Generate a shared `event_id` on checkout render and pass it to both browser and server payloads.
2. Include ISO-4217 currency (`EUR`) and numeric `value` formatted to two decimals.
3. Honor HTTP `429` responses using `Retry-After` exponential backoff.

## Verification

| Event Name | Required Keys | Target Threshold |
| :--- | :--- | :--- |
| ViewContent | event_id, content_id, currency | 99% schema valid |
| InitiateCheckout | event_id, value, currency | 95% deduplicated |
| CompletePayment | event_id, order_id, value, currency | 100% server parity |
