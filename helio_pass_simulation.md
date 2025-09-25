# HELIOPASS Simulator (Labs)
Purpose: emulate BER/eye drift and test the calibration loop without hardware.

Inputs:
- Lane config (λ list), initial BER/eye, temp/drift model
- Target BER, eye margin
Outputs:
- Bias voltages, small λ shifts, Tx power nudges
- Convergence metrics

Loop:
1) Measure (synthetic noise + thermal drift).
2) Optimize (min power subject to BER<=target & eye>=margin).
3) Apply step; re-measure.
4) Export to corrd mock for dashboards.
