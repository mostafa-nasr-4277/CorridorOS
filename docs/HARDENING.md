# CorridorOS Hardening Plan (pre‑pilot)

This document captures the seven must‑do hardening moves before external pilots. Each item includes scope, acceptance criteria, owner(s), and verification method.

## 1) API freeze v0.1
- Scope: OpenAPI (`apis/corridoros_openapi.yaml`), CRDs, error codes, versioning and deprecation.
- Actions:
  - Set `info.version: 0.1.0` in OpenAPI with a “frozen” banner.
  - Add `X-Error-Code` registry and map to HTTP responses.
  - Document deprecation policy (docs/API_VERSIONING.md).
- Acceptance:
  - CI step validates OpenAPI and forbids breaking changes without `x-deprecated` gates.
  - Tag `v0.1-freeze` after merge.

## 2) Golden demo harness
- Scope: One `docker compose up` that runs a p99/pJ‑per‑bit demo, emits metrics, and exports Grafana JSON.
- Actions:
  - Add `compose.golden.yml` overlay; wire mock corrd/memqosd if real endpoints absent.
  - Script `scripts/golden_demo.sh` to: up → run workload → export dashboards (`grafana/api/dashboards/export`).
- Acceptance:
  - One command produces: `artifacts/grafana/golden.json`, and writes p99, pJ/bit into `artifacts/metrics.json`.

## 3) Failure semantics
- Scope: BER drift, wavelength (λ) loss, CXL device drop.
- Actions:
  - Define state machine and back‑off rules (exponential with jitter) for each.
  - Implement graceful degradation in controller (prefer bandwidth floor, then drop lanes, then shed noncritical).
  - Add runbook: `docs/failures.md` with timelines and operator actions.
- Acceptance:
  - Fault injection in golden harness shows expected back‑off and recovery; no floor violations logged.

## 4) QoS truth table
- Scope: Per‑vendor support matrix for bandwidth/QoS knobs and memqosd behavior when missing.
- Actions:
  - Fill `docs/qos_truth_table.md` with columns: Vendor, Mechanism, Floors, PFC, Weighted Fair, Notes.
  - Encode fallback order in memqosd (best‑effort when hard floors unsupported).
- Acceptance:
  - CI link-check and lint; table referenced in release notes.

## 5) Security baseline
- Scope: measured boot, SPDM, signing, SBOM.
- Actions:
  - Document boot chain (UEFI → PCRs → policy), attestation flow, and key material storage.
  - Sign container images; add SBOM generation to CI.
- Acceptance:
  - `docs/SECURITY_BASELINE.md`, example attestation transcript, SBOM attached to releases.

## 6) Limits doc
- Scope: What CorridorOS does NOT do; supported HW matrix.
- Actions:
  - `docs/LIMITS.md` with constraints and supported hardware table.
- Acceptance:
  - Linked from README; reviewed by product + eng.

## 7) Observability SLOs
- Scope: Ship dashboard with 4 dials: BER, pJ/bit, Achieved GB/s vs Floor, p99 latency.
- Actions:
  - Define thresholds in `docs/OBSERVABILITY.md` and instrument dashboard (corridoros_dashboard.html).
- Acceptance:
  - Dials render locally and in Pages; green/yellow/red reflect thresholds.

---

Checklist status is tracked in this file via PRs. Owners: Eng: Core; PM: Pilot Readiness.
