# CorridorOS metrics exporter (v4)

- Run: `python3 integrations/metrics/metricsd_exporter.py`
- Metrics: http://localhost:9309/metrics
- Health:  http://localhost:9309/health

HELIOPASS ingestion

curl -X POST http://localhost:9309/ingest/heliopass -H 'Content-Type: application/json' -d '{
  "laser_power_w": 18.5,
  "baseline_power_w": 25.0,
  "duration_s": 300,
  "pJ_per_bit_before": 2.3,
  "pJ_per_bit_after": 1.8,
  "bits": 5e12
}'

This updates instantaneous power saving and increments `corridoros_heliopass_kj_saved_total`.
