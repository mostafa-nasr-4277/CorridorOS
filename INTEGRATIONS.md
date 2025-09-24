CorridorOS v4 Integrations (Scaffolds)

This folder tree provides minimal, working scaffolds for the top 3 integrations you requested:

1) Kubernetes CRDs + Operator + Scheduler Extender
- CRDs: `integrations/k8s/crds/*.yaml`
- Operator: `integrations/k8s/operator/controller.py` (talks to corrd 7080 and memqosd 7070 by default)
- Scheduler Extender: `integrations/k8s/scheduler/scheduler_extender.py`

2) Grafana SRE Pack
- Prometheus exporter: `integrations/metrics/metricsd_exporter.py` exposes `/metrics`
- Dashboards: `integrations/grafana/dashboards/corridoros_sre.json`

3) Python SDK + Context Managers
- SDK: `sdk/python/corridoros/` with `client.py`
- Example: `examples/python/quick_slo_demo.py`

Quick start (local mocks)
- Start mocks in separate shells:
  - `python3 memqosd_cors_proxy.py` (port 7070)
  - `python3 mock_corrd.py` (port 7080)
- Exporter: `python3 integrations/metrics/metricsd_exporter.py`
- Use SDK example: `python3 examples/python/quick_slo_demo.py`

Kubernetes notes
- Operator and extender are lightweight references intended for containerization. They do not require cluster access for local testing; when run in a cluster, set env vars `KUBECONFIG` or in-cluster service account.

K8s + Observability Addendum (v4)
- Unpacked addendum resources under `k8s/`:
  - CRDs: `k8s/crds/*.yaml`
  - Operator: `k8s/operator/deployment.yaml`
  - Scheduler plugin: `k8s/scheduler-plugin/` (config + README)
  - Samples: `k8s/samples/corridoros_samples.yaml`
  - Observability:
    - Prometheus ServiceMonitor: `k8s/observability/prometheus/servicemonitor.yaml`
    - Prometheus rules: `k8s/observability/prometheus/rules.yml`
    - Grafana dashboard JSON: `k8s/observability/grafana/dashboard_corridoros_overview.json`

Hand-off checklist (engineering pod)
1) Apply CRDs & operator
   kubectl apply -f k8s/crds/
   kubectl apply -f k8s/operator/deployment.yaml

2) (Optional) Scheduler plugin
   Build/load per `k8s/scheduler-plugin/README.md` and wire with kube-scheduler via `k8s/scheduler-plugin/config.yaml`.

3) Create sample resources & pod
   kubectl apply -f k8s/samples/corridoros_samples.yaml

4) Wire metrics
   - Ensure `corrd`, `memqosd`, and `metricsd_exporter` expose `/metrics`.
   - Apply `k8s/observability/prometheus/servicemonitor.yaml` and import Grafana dashboard JSON.

5) Acceptance criteria
   - CRs reconcile to Ready; pods schedule only when Ready; Grafana shows live metrics; finalizers release allocations cleanly.
