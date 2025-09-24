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

