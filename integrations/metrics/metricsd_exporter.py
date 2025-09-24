#!/usr/bin/env python3
"""
Prometheus exporter for CorridorOS v4 (mock-friendly).
Scrapes corrd and memqosd health + simple telemetry and exposes /metrics.
"""
import json
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.request import urlopen

CORRD = 'http://localhost:7080'
MEM = 'http://localhost:7070'

METRICS = {
    'corridors_active': 0,
    'corridor_ber': 1.2e-12,
    'ffm_allocated_gb': 0,
    'ffm_bandwidth_floor_gbs': 0,
}

def fetch_json(url):
    try:
        with urlopen(url) as r: return json.loads(r.read().decode())
    except Exception: return {}

def refresh():
    # Best-effort querying of mock endpoints
    h = fetch_json(f'{CORRD}/health')
    if h.get('status') == 'healthy':
        METRICS['corridors_active'] = h.get('active_corridors', METRICS['corridors_active'])
    # Telemetry if available
    # In this mock we keep static BER
    METRICS['corridor_ber'] = 1.2e-12
    # Memory stats not directly available from mock
    METRICS['ffm_allocated_gb'] = METRICS['ffm_allocated_gb']

def render_metrics():
    lines = [
        '# HELP corridoros_corridors_active Active photonic corridors',
        '# TYPE corridoros_corridors_active gauge',
        f'corridoros_corridors_active {METRICS["corridors_active"]}',
        '# HELP corridoros_corridor_ber Bit error rate (approx)',
        '# TYPE corridoros_corridor_ber gauge',
        f'corridoros_corridor_ber {METRICS["corridor_ber"]}',
        '# HELP corridoros_ffm_allocated_gb Allocated FFM total (GB)',
        '# TYPE corridoros_ffm_allocated_gb gauge',
        f'corridoros_ffm_allocated_gb {METRICS["ffm_allocated_gb"]}',
        '# HELP corridoros_ffm_bandwidth_floor_gbs Bandwidth floor (GB/s) requested',
        '# TYPE corridoros_ffm_bandwidth_floor_gbs gauge',
        f'corridoros_ffm_bandwidth_floor_gbs {METRICS["ffm_bandwidth_floor_gbs"]}',
    ]
    return '\n'.join(lines) + '\n'

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/metrics':
            refresh()
            body = render_metrics().encode()
            self.send_response(200)
            self.send_header('Content-Type','text/plain; version=0.0.4')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type','application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"ok","version":"v4"}')
        else:
            self.send_error(404)

def main():
    srv = HTTPServer(('', 9309), H)
    print('metricsd_exporter listening on :9309')
    srv.serve_forever()

if __name__ == '__main__':
    main()

