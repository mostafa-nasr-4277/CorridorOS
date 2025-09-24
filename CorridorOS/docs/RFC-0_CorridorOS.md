# CorridorOS v4.0 — RFC‑0 (Draft)
Date: 2025-09-23
Author: Mostafa (with collaborators)

## 0. Purpose & Scope
CorridorOS turns **photonic interconnect** and **pooled memory** into first‑class OS resources, while embedding **security** and **ethical guardrails** inspired by human synchrony research. Gen‑1 targets **practical deployments** on Linux + CXL 3.x + optical I/O dev kits; futuristic components live in **CorridorLabs** as marked simulations.

## 1. Non‑Goals (Gen‑1)
- Optical ALUs / photonic CPUs
- On‑box quantum acceleration claims
- Hazardous cooling (e.g., liquid hydrogen)

## 2. Terms
- **Corridor**: Reserved photonic path (SiCorridor or CarbonCorridor).
- **WavelengthSet**: λ lanes (e.g., 1550–1557 nm) grouped for a Corridor.
- **FFM**: Free‑Form Memory — property‑based memory allocation with bandwidth floors and tier targets across HBM/DRAM/CXL/persistent.
- **AttestationTicket**: Provenance record binding hardware/firmware to allocations & corridors.

## 3. Architecture
```
Applications / Services / CorridorLabs
    ↓ REST/gRPC
CorridorOS daemons: corrd | memqosd | fabmand | heliopassd | attestd | compatd | metricsd
    ↓ syscalls / vendor SDKs
Linux LTS: CXL core, DAX, PCIe, IMA/LSM, SPDM
    ↓
Hardware: RISC‑V/x86 host, HBM/DDR5, CXL 3.x Type‑3 pools, optical I/O kits, (optional) graphene‑on‑Si/SiN test PICs
```

## 4. Services
- **corrd (Photonic L0)**: Allocate/monitor/recalibrate Corridors; integrates **heliopassd**.
- **heliopassd**: Keeps BER/eye within targets with minimal power via bias/λ tuning.
- **memqosd (FFM)**: Build CXL regions; allocate by properties; migrate pages (DAMON/AutoNUMA); enforce QoS with device QTG and driver shaping.
- **fabmand**: CXL 3.x path programming, PBR/GIM composition.
- **attestd**: Measured boot, SPDM, device/firmware attestation; issues AttestationTickets.
- **compatd**: Dynamic x86/x64 translation controller (profiled JIT cache).
- **metricsd**: Prometheus/OpenTelemetry exporter.

## 5. Security Model
- Measured boot (TPM/DTM), IMA signatures.
- SPDM device attestation; tickets bound to allocations & corridors.
- Memory encryption; confidential compute (TEE/enclaves).
- PQC (Kyber/Dilithium) for firmware/control‑plane updates.
- Audit via eBPF/LSMs; SBOM for supply chain.

## 6. Ethics & Governance
- Liminal‑research features run only in **CorridorLabs** with **Consent Manifests** and **women‑led governance toggles**.
- Sacred spaces off‑limits unless communities invite **and lead**.
- Default data collection OFF; explicit opt‑in required.

## 7. Photonic API (corrd)
### POST /v1/corridors
Request:
```json
{
  "type": "SiCorridor",
  "lanes": 8,
  "lambda_nm": [1550,1551,1552,1553,1554,1555,1556,1557],
  "min_gbps": 400,
  "latency_budget_ns": 250,
  "reach_mm": 75,
  "mode": "waveguide",
  "qos": {"pfc": true, "priority": "gold"},
  "attestation_required": true
}
```
Reply:
```json
{ "corridor_id": "cor-7af3", "achievable_gbps": 416, "ber": 1.0e-12, "eye_margin": "ok" }
```

### GET /v1/corridors/{id}/telemetry
→ BER, eye, temperature, drift, pJ/bit

### POST /v1/corridors/{id}/recalibrate
→ Calls **heliopassd**; returns new bias/λ settings and status.

## 8. HELIOPASS (v4.0)
Objective: minimize power subject to BER ≤ target and eye ≥ margin.
Inputs: per‑λ BER/eye, temp, drift; ambient profile.
Outputs: bias voltages, minor λ shifts, Tx power nudges.
Loop: Measure → Optimize small convex goal → Apply small step → Verify → Log.

## 9. FFM API (memqosd)
### POST /v1/ffm/alloc
```json
{ "bytes": 274877906944, "latency_class": "T2", "bandwidth_floor_GBs": 150, "persistence": "none", "shareable": true, "security_domain": "tenantA" }
```
→ `ffm_handle`, fds for mmap(), lease TTL.

### PATCH /v1/ffm/{handle}/bandwidth
```json
{ "floor_GBs": 180 }
```

### PATCH /v1/ffm/{handle}/latency_class
```json
{ "target": "T1" }   // triggers migration
```

### GET /v1/ffm/{handle}/telemetry
→ achieved_GBs, moved_pages, tail_p99_ms

## 10. Fabric Manager (fabmand)
- Programs CXL paths/switches.
- Composes GIM/PBR regions for cross‑host sharing.
- Maps QoS policies to device QTG if vendor‑supported.

## 11. Observability
- metricsd exports Prometheus/OpenTelemetry: BER, eye, pJ/bit, temp, drift, achieved_GBs, tail latency, migrations, attestation state.

## 12. CorridorLabs (Simulation & Education)
- Physics Decoder API (dimensional analysis; flags “standard” vs “speculative”).
- HELIOPASS simulator (no hardware required).
- Synchrony Analytics (offline; de‑identified demo sets only).

## 13. MVPs
- **MVP‑A (FFM)**: CXL pool + QoS floors/ceilings → tail‑latency demo.
- **MVP‑B (Photonic)**: SiCorridor allocation + HELIOPASS recalibration under induced drift.
- **MVP‑C (Labs)**: Physics Decoder + HELIOPASS sim + Evolution demo (clearly marked simulation).

## 14. Roadmap
0–90 days: MVP‑A/B/C, baseline security, RFC docs.  
3–6 months: CarbonCorridor test PIC bench (graphene EAM+PD on Si/SiN).  
6–12 months: Co‑packaged optics pilots; operator UX.

## 15. Open Issues
- Standardizing device QoS controls across CXL vendors
- Portable λ‑plan representations across photonic kits
- Policy conflicts: per‑tenant floors vs global caps
