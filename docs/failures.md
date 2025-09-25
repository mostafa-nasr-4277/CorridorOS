# Failure Semantics & Back‑off

Events and the expected behavior:

- BER drift beyond threshold
  - Detect via rolling window. Back‑off: halve noncritical traffic; prefer floors; retry lane with exponential back‑off (100ms→1.6s cap). Raise yellow alert; red on sustained > 60s.
- Wavelength (λ) loss
  - Reallocate to spare λ where possible; if not, reduce concurrency. Log floor adjustments and compensate with memory bandwidth where safe.
- CXL device drop
  - Mark region unavailable; attempt re-enumeration; failover allocations to remaining tiers (T1/T0) if configured; otherwise return `X-Error-Code: MEM-UNAVAIL`.

Operator runbook: each event includes a timeline (T+0 detect, T+Δ back‑off), metrics to watch (p99, GB/s vs floor), and when to escalate.
