# Observability SLOs

CorridorOS ships with four top-level SLO dials:

- BER (bit error rate)
  - Green: < 1e-12; Yellow: [1e-12, 1e-11); Red: ≥ 1e-11
- Energy per bit (pJ/bit)
  - Green: ≤ 3.0; Yellow: (3.0, 4.0]; Red: > 4.0
- Achieved GB/s vs Floor
  - Green: ≥ floor; Yellow: within 10% below; Red: >10% below
- Tail Latency p99 (ns)
  - Green: ≤ 300; Yellow: (300, 500]; Red: > 500

Dashboards must surface current value, trend, and threshold state. Export Grafana JSON from the golden harness.
