# Attestation & Measured Boot — CorridorOS v4.0

Scope
- Documents measured boot, device attestation, and ticket binding for CorridorOS services.

Components
- `attestd`: Issues and verifies attestation results and SPDM sessions.
- `fabmand`: Binds device state to fabric paths and MemoryBundles.
- `corrd`/`memqosd`: Enforce `attestation_required` policies on corridor and FFM operations.

Flows
- Measured Boot
  1. Platform boots; TPM/DTM extends PCRs (BIOS, platform, option ROM, secure boot).
  2. `attestd` exposes `GET /v1/attest/measured-boot/{device_id}` for PCR values.
  3. Consumers verify PCRs against policy/reference values; store hash chain in audit log.

- Device Attestation
  1. Caller sends `POST /v1/attest/device` with `{ device_id, firmware_hash, config_hash, require_pqc }`.
  2. `attestd` validates inputs; returns `{ attestation_id, valid, trust_level, expires_at, pqc_signature? }`.
  3. `fabmand` binds `attestation_id` to device topology objects; policies can require validity at time of allocation.

- SPDM Session
  1. Caller sends `POST /v1/attest/spdm` with `{ device_id, version, capabilities }`.
  2. `attestd` returns negotiation result with challenge/response and certificate.

Binding to OS Objects
- MemoryBundle: Store `attestation_ticket` for every allocation requiring attestation.
- Corridor: If `attestation_required: true`, `corrd` must validate a fresh ticket before allocation.
- Fabric Path: `fabmand` records `attestation_ticket` in path metadata.

Cryptography
- Transport: TLS 1.3, mTLS for inter‑service.
- PQC: Dilithium for signatures, Kyber for KEM (when configured). Current repo includes simplified placeholders.
- Hashes: SHA‑256 for content addressing and manifest hashing.

Audit & Telemetry
- Emit structured logs for: measured boot fetch, device attestation, SPDM negotiation, policy decisions.
- Export counters/gauges to Prometheus via `metricsd`.

Policy Examples
- Require device attestation for CXL Type‑3 pools before FFM allocations.
- Require SPDM freshness within N minutes for corridor calibration that touches device bias.

Security Notes (Gen 1)
- The included implementations are mocks suitable for demos. Integrate vendor TPM/SPDM stacks and hardware RoT for production.

