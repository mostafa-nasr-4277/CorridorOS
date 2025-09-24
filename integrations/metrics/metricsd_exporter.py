#!/usr/bin/env python3
"""
Prometheus exporter for CorridorOS v4 (mock-friendly).
Scrapes corrd and memqosd health + simple telemetry and exposes /metrics.
Also ingests HELIOPASS power updates to compute cumulative kJ saved.
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
    # HELIOPASS energy model
    'heliopass_laser_power_w': 0.0,
    'heliopass_baseline_power_w': 0.0,
    'heliopass_power_saving_w': 0.0,
    'heliopass_kj_saved_total': 0.0,
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
        '# HELP corridoros_heliopass_laser_power_w Current laser power (W)',
        '# TYPE corridoros_heliopass_laser_power_w gauge',
        f'corridoros_heliopass_laser_power_w {METRICS["heliopass_laser_power_w"]}',
        '# HELP corridoros_heliopass_baseline_power_w Baseline laser power (W)',
        '# TYPE corridoros_heliopass_baseline_power_w gauge',
        f'corridoros_heliopass_baseline_power_w {METRICS["heliopass_baseline_power_w"]}',
        '# HELP corridoros_heliopass_power_saving_w Instantaneous power saved (W)',
        '# TYPE corridoros_heliopass_power_saving_w gauge',
        f'corridoros_heliopass_power_saving_w {METRICS["heliopass_power_saving_w"]}',
        '# HELP corridoros_heliopass_kj_saved_total Cumulative energy saved (kJ)',
        '# TYPE corridoros_heliopass_kj_saved_total counter',
        f'corridoros_heliopass_kj_saved_total {METRICS["heliopass_kj_saved_total"]}',
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
    def do_POST(self):
        if self.path == '/ingest/heliopass':
            ln = int(self.headers.get('Content-Length','0'))
            try:
                data = json.loads(self.rfile.read(ln) or b"{}")
            except Exception:
                data = {}
            laser = float(data.get('laser_power_w', METRICS['heliopass_laser_power_w']))
            base = float(data.get('baseline_power_w', METRICS['heliopass_baseline_power_w']))
            dur = float(data.get('duration_s', 0))
            pj_before = data.get('pJ_per_bit_before')
            pj_after = data.get('pJ_per_bit_after')
            bits = data.get('bits')
            METRICS['heliopass_laser_power_w'] = laser
            METRICS['heliopass_baseline_power_w'] = base
            METRICS['heliopass_power_saving_w'] = max(0.0, base - laser)
            if dur > 0 and base > 0:
                METRICS['heliopass_kj_saved_total'] += (max(0.0, base - laser) * dur) / 1000.0
            if bits and pj_before and pj_after:
                delta_j = max(0.0, (float(pj_before) - float(pj_after))) * float(bits) * 1e-12
                METRICS['heliopass_kj_saved_total'] += delta_j / 1000.0
            out = {
                'status':'ok',
                'kj_saved_total': METRICS['heliopass_kj_saved_total'],
                'power_saving_w': METRICS['heliopass_power_saving_w']
            }
            body = json.dumps(out).encode()
            self.send_response(200)
            self.send_header('Content-Type','application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_error(404)

def main():
    srv = HTTPServer(('', 9309), H)
    print('metricsd_exporter listening on :9309')
    srv.serve_forever()

if __name__ == '__main__':
    main()
