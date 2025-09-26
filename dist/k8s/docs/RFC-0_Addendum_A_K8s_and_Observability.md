# CorridorOS RFC‑0 — Addendum A
## Kubernetes CRDs & Operator + Grafana Metrics Pack
Date: 2025-09-24
Status: Draft (ready for engineering pod)

---

## 1. Scope

This addendum defines:
1) **Kubernetes integration** — Custom Resource Definitions (CRDs), Operator/Controller behavior, and a Scheduler Plugin so Corridors and Free‑Form Memory (FFM) are first‑class cluster resources.  
2) **Observability pack** — Prometheus metrics naming, recording rules, and a Grafana dashboard for SRE.

---

## 2. Kubernetes Integration

### 2.1 CRDs (corridoros.io API group)

**Objects**
- `Corridor` — reserves a photonic path and maintains live state.  
- `MemoryBundle` — allocates FFM by properties (bytes, tier, bandwidth floor).  
- `AttestationPolicy` — constraints on devices/firmware allowed to serve a namespace.

#### 2.1.1 Corridor (namespaced)

**Spec**
- `type`: `SiCorridor|CarbonCorridor` (default `SiCorridor`)
- `lanes`: integer ≥1
- `lambdaNm`: array<int> (nm; e.g., [1550..])
- `minGbps`: integer
- `latencyBudgetNs`: integer
- `reachMm`: integer (optional)
- `mode`: `waveguide|free-space` (default `waveguide`)
- `qos`: object → `pfc: bool`, `priority: string`
- `attestationRequired`: bool (default true)
- `recalibration`: object → `targetBer: number`, `ambientProfile: string`

**Status**
- `phase`: `Pending|Allocating|Ready|Degraded|Failed|Releasing`
- `corridorId`: string (opaque id from **corrd**)
- `achievableGbps`: number
- `telemetry`: `{ ber:number, eyeMargin:string, tempC:number, powerPJPerBit:number, drift:string }`
- `conditions[]`: `{ type, status, reason, message, lastTransitionTime }`

**Finalizers**
- `corridoros.io/corridor-finalizer` — release via **corrd** before deletion.

#### 2.1.2 MemoryBundle (namespaced)

**Spec**
- `bytes`: int64
- `latencyClass`: `T0|T1|T2|T3`
- `bandwidthFloorGBs`: integer
- `persistence`: `none|durable`
- `shareable`: bool
- `securityDomain`: string
- `schedule` (optional): time‑based overrides (e.g., offpeak/peak floors)
- `nodeSelector` (optional): topology hints

**Status**
- `phase`: `Pending|Allocating|Ready|Degraded|Failed|Releasing`
- `ffmHandle`: string (opaque id from **memqosd**)
- `achievedGBs`: number
- `movedPages`: int64
- `tailP99Ms`: number
- `conditions[]`: standard

**Finalizers**
- `corridoros.io/ffm-finalizer` — release via **memqosd**.

#### 2.1.3 AttestationPolicy (namespaced)

**Spec**
- `allowedTenants[]`: strings
- `deviceSelectors`: `{ matchLabels: map<string,string> }`
- `minFirmwareVersion`: string
- `pqcRequired`: bool (default true)
- `requiredClaims`: map<string,string`

**Status**
- `enforced`: bool
- `lastAuditTime`: timestamp

---

### 2.2 Operator/Controller Behavior

- **Reconciliation** (idempotent):
  1. Validate spec; check `AttestationPolicy` if present.
  2. Call **attestd** (SPDM) if `attestationRequired`.
  3. Allocate via **corrd**/**memqosd**; write `status.{corridorId|ffmHandle}`.
  4. Start telemetry watches; update `status.telemetry` every `N` seconds.
  5. On spec change: perform in‑place update (e.g., HELIOPASS recalibration) or rolling re‑alloc.
  6. On delete: run finalizer; release allocation; remove finalizer; GC.

- **Events**: post K8s Events on transitions; Conditions reflect success/errors.
- **Error handling**: exponential backoff; don’t oscillate on transient BER drift.
- **Security**: bind **AttestationTickets** (UID) into annotations of the object; deny updates if tickets expire.

**Pod Annotations (consumed by Scheduler Plugin)**
- `corridoros.io/corridorRef: <namespace>/<name>`
- `corridoros.io/memoryBundleRef: <namespace>/<name>`

---

### 2.3 Scheduler Plugin (framework v1)

**Extension points**: `Filter`, `Reserve`, `PreBind`, `Unreserve`

- **Filter**: verify referenced `Corridor`/`MemoryBundle` exist and are `Ready`; if not, return `UnschedulableAndUnresolvable` with reason.
- **Reserve**: mark the objects as “in‑use by Pod UID”; optional soft quota counter.
- **PreBind**: annotate Pod with resolved `corridorId` and `ffmHandle` (+ AttestationTicket hash).
- **Unreserve**: roll back reservation on failure.

**Failure policy**: if bandwidth floors cannot be met, plugin can either (a) *fail fast* or (b) *queue* Pod until floors are available (configurable).

---

### 2.4 RBAC & Deployment

- ServiceAccount: `corridor-operator`
- Roles: read/write CRDs; read Pods; patch Pod annotations; list/watch Nodes.

Apply order:
```
kubectl apply -f k8s/crds/
kubectl apply -f k8s/operator/deployment.yaml
kubectl apply -f k8s/scheduler-plugin/config.yaml
```

---

## 3. Observability Pack

### 3.1 Prometheus Metrics (exported by `metricsd` and daemons)

**Corridors**
- `corridor_allocations_total{{cluster,namespace,corridor,type}}`
- `corridor_throughput_gbps{{corridor,lambda}}`
- `corridor_power_pj_per_bit{{corridor}}`
- `corridor_ber{{corridor,lambda}}`
- `corridor_eye_margin{{corridor,lambda}}` (0=fail,1=ok or dB)
- `corridor_recalibrations_total{{corridor,reason}}`

**HELIOPASS**
- `heliopass_bias_mv{{corridor,lambda}}`
- `heliopass_lambda_shift_nm{{corridor,lambda}}`
- `heliopass_power_saved_kj_total{{corridor}}`

**FFM**
- `ffm_allocations_total{{namespace,bundle}}`
- `ffm_allocation_bytes{{bundle}}`
- `ffm_achieved_gbs{{bundle}}`
- `ffm_moved_pages_total{{bundle}}`
- `ffm_tail_p99_ms{{bundle}}`
- `ffm_qos_violations_total{{bundle}}`

**Security**
- `attestation_ok_total{{device}}`
- `attestation_fail_total{{device,reason}}`

### 3.2 Recording Rules (examples)

- `corridor_utilization = sum by(corridor) (corridor_throughput_gbps) / sum by(corridor) (label_replace(corridor_throughput_gbps, "capacity", "minGbps","lambda","$1"))`
- `ffm_bw_headroom = max by(bundle) (ffm_achieved_gbs - on(bundle) ffm_bandwidth_floor_gbs)`

### 3.3 Grafana Dashboards

- **Overview**: SLO status, active Corridors, FFM floors met, energy per bit, recalibration events.
- **Corridor detail**: BER/eye per λ, power pJ/bit, HELIOPASS adjustments.
- **FFM detail**: achieved GB/s vs floor, migrations, tail p99.
- **Security**: attestation pass/fail trend.

Dashboards are provided as JSON under `observability/grafana/`.

---

## 4. Acceptance Criteria (MVP)

1. Creating a `Corridor` and `MemoryBundle` object results in **Ready** status within 5s (using mock backends).
2. A Pod annotated with both references is scheduled only when both are **Ready**.
3. Grafana shows live metrics for at least:
   - `corridor_power_pj_per_bit`
   - `corridor_ber`
   - `ffm_achieved_gbs`
   - `ffm_tail_p99_ms`
4. Deleting CRs gracefully releases resources (finalizers observed).

---

## 5. Test Plan (E2E)

- **Happy path:** create CRs → schedule Pod → observe metrics → delete.  
- **Floor violation:** drop corridor capacity → verify scheduler holds Pod until capacity returns.  
- **Attestation failure:** set policy to require claim X; make device report !X → allocation denied.  
- **Controller restart:** ensure reconciliation idempotency; no leaked allocations.

---
