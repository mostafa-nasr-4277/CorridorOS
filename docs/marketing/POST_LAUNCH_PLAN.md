# CorridorOS Post‑Launch Marketing Plan (v4)

> Source: stakeholder brief. Consolidated and lightly formatted for execution.

## 0) Objectives & 90‑Day OKRs

Primary goals (90 days post‑launch)
- O1 – Adoption: 50 qualified teams install the dev server or Docker image; 30 reach “Aha” (create ≥1 Corridor and 1 FFM bundle).
- O2 – Proof: 6 public case studies show ≥25% tail‑latency reduction and/or ≥30% perf/W improvement on real workloads.
- O3 – Pipeline: 8 design‑partner pilots (GPU cloud, HPC lab, CXL vendor, optics vendor, two large SaaS, one AI startup).
- O4 – Community: 1,000 GitHub stars, 500 Discord/Slack members, ≥10 external PRs merged.
- O5 – Awareness: 25 earned media mentions + 3 analyst briefings.

North‑star metric: Time‑to‑Value (TTV) = minutes from install → first Corridor Reserved + FFM Allocated + metrics emitting.

PQL triggers: created ≥2 Corridors, set a bandwidth floor ≥100 GB/s, imported Grafana dashboard.

## 1) Positioning & Message House

Tagline: “Reserve light like CPU. Guarantee memory like SLAs.”

Core: CorridorOS turns photonic interconnect and pooled memory into schedulable, observable resources—collapsing tail‑latency and cutting energy/bit with zero app rewrites.

Proof points
- Reserve λ‑sets with QoS (min Gbps, latency budgets), actively calibrated by HELIOPASS to keep BER stable at minimal power.
- Allocate FFM by property (bytes, tier, bandwidth floor) across HBM/DRAM/CXL—live migrate without restarts.
- Kubernetes CRDs & Operator and Grafana dashboard ready day‑1.
- Security & ethics first: device attestation (SPDM), measured boot, PQC‑ready; clear consent rails for Labs.

Angles by segment
- Infra/SRE: “Kill tail latency; guarantee bandwidth at the OS/fabric layer.”
- ML/AI: “Feed GPUs at line‑rate; keep training/inference predictable.”
- HPC/Research: “Disaggregate memory + photonic lanes with open APIs; schedule like any other resource.”
- Vendors: “Co‑marketing path to show perf/W leadership with your hardware.”

## 2) Packaging & Pricing (open‑core)
- Community: corrd/memqosd, CRDs, CLI, dev server, Grafana pack, Labs.
- Enterprise: Corridor‑SDN, multi‑tenant OPA policies, attestation workflows, SSO/RBAC, support, roadmap access.
- Design Partner (6 months): free Enterprise + co‑marketing + engineering Slack.

## 3) Launch Waves (90 days)

### Wave 1 (Weeks 1–3) – Prove it
Assets: launch blog, CXL FFM deep‑dive, repro demo repo, datasheet/one‑pager, 15‑min live demo.
Channels: HN/Reddit posts, LinkedIn/Twitter thread with 3 metrics screenshots, founder AMA.
KPIs: 10k visits, 300 demo runs, 100 Aha, 10 inbound POCs.

### Wave 2 (Weeks 4–7) – Integrate it
Assets: K8s Operator guide + CRD samples; 3‑min Grafana tour; “Add corridor/FFM to PyTorch or Redis”; 2 case studies.
Channels: CNCF/Grafana guest posts; co‑webinar with CXL/optics vendors; targeted ABM.
KPIs: 2 case studies live; 3 meetup talks; 4 pilots signed.

### Wave 3 (Weeks 8–12) – Scale it
Assets: Design Partner page; roadmap webinar (Corridor‑SDN, DRF fairness, persistent tiering); security whitepaper.
Channels: analyst briefings; conference CFPs (KubeCon/HPC/Optics).
KPIs: 8 pilots active; 6 case studies queued; 1 strategic OEM.

## 4) Channels & Plays
PR/Comms/Analysts: press release, press kit, analyst deck. Q&A crib sheet: “photonic transport, not ALUs”; show BER/pJ/bit; ethics via Consent Manifests.
DevRel: 5‑min quick‑start; samples (K8s CRDs, Python context); contribution map.
Performance: LI to VP Infra/Dir SRE/Head ML Platform; retarget only after demo/docs visit.
Partnerships: CXL/optics/GPU‑cloud co‑marketing.

## 5) Funnel & Growth Loops
Top→content; Mid→PQL events; Bottom→design partners + Enterprise. Instrument: install_*; corridor_*/ffm_*; metrics_streaming_started; grafana_dashboard_imported; k8s_cr_applied; pod_scheduled_with_corridor.

## 6) Asset Checklist & Owners
- Landing page (hero + proof screenshots + CTAs) — PMM+Design
- Launch blog & deep dive — PM+CTO
- Datasheet & one‑pager — PMM
- Grafana pack — Eng (SRE)
- K8s CRDs/Operator guide — DevRel
- 3 case studies (SaaS, ML, HPC) — PMM+Eng+Partner
- Webinar kit (slides + demo) — DevRel
- Security whitepaper — Security Eng
- Analyst deck — PMM+CEO

## 7) Sales Enablement
Qualify: latency‑sensitive infra, CXL/optics roadmap, metrics sharing.
Pilot plan: baseline → CorridorOS on → SRE metrics → ROI. ROI calculator: pJ/bit, GPU utilization, tail‑latency.
ABM sequence: problem+GIF → 2‑pager → 15‑min assessment invite.

## 8) Community & Trust
Discord/Slack; monthly office hours; public roadmap; code of conduct + ethics.

## 9) Measurement & Reporting
Dashboards weekly: web visits/demo starts/Aha; TTV/PQL/events; community metrics; pipeline.
Top KPIs: Aha conversion; TTV; GB/s floor achieved vs requested; p99 delta; pJ/bit delta; community growth.

## 10) 6–12 Month Plan
Corridor‑SDN + fairness; co‑packaged optics pilots; SOC2; education program “Scheduling Light & Memory”.

## 11) Templates (boilerplate)
Press release (short):
> CorridorOS… treats light paths and pooled memory as schedulable resources… ships with K8s CRDs, Grafana pack, and PQC‑ready updates.

Hero: H1 “Reserve Light. Guarantee Memory.” H2 “Photonic interconnect & pooled memory as first‑class OS resources—now schedulable in Kubernetes.”
CTAs: Run 5‑min demo • Book a pilot • View Grafana dashboard.

Demo script (3 minutes):
1) Allocate Corridor (8 lanes, 1550–1557 nm); 2) Allocate FFM (256 GiB, T2, floor 150 GB/s); 3) Nudge floor to 180 GB/s; 4) Trigger HELIOPASS recalibration.

## 12) Risks & Mitigation
Overclaiming optics → stress transport, show metrics.
Hardware variability → supported devices matrix.
Privacy/ethics confusion → separate Labs vs prod.
Integration friction → invest in TTV.
