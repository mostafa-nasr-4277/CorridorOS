#!/usr/bin/env python3
"""
Mock corrd service for testing CorridorOS CLI
Handles corridor allocation and forwards FFM requests to memqosd
"""
import http.server
import json
import urllib.request
import socketserver
from urllib.parse import urlparse, parse_qs
import sys
import time

PORT = 7080
MEMQOSD_URL = "http://localhost:7070"

class CorridorHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        if self.path == '/v1/corridors':
            self.handle_corridor_alloc()
        elif self.path == '/v1/ffm/alloc':
            self.handle_ffm_alloc()
        else:
            self.send_error(404, "Endpoint not found")
    
    def do_GET(self):
        if self.path.startswith('/v1/corridors/') and self.path.endswith('/telemetry'):
            self.handle_corridor_telemetry()
        elif self.path == '/health':
            self.handle_health()
        else:
            self.send_error(404, "Endpoint not found")
    
    def handle_corridor_alloc(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Mock corridor allocation response
            response = {
                "id": f"cor-{int(time.time()) % 10000:04d}",
                "corridor_type": request_data.get("type", "SiCorridor"),
                "lanes": request_data.get("lanes", 8),
                "lambda_nm": request_data.get("lambda_nm", list(range(1550, 1558))),
                "min_gbps": request_data.get("min_gbps", 400),
                "latency_budget_ns": request_data.get("latency_budget_ns", 250),
                "reach_mm": request_data.get("reach_mm", 75),
                "mode": "waveguide",
                "qos": request_data.get("qos", {"pfc": True, "priority": "gold"}),
                "attestation_required": request_data.get("attestation_required", True),
                "achievable_gbps": request_data.get("lanes", 8) * 52,  # 52 Gbps per lane
                "ber": 1.0e-12,
                "eye_margin": "ok",
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "status": "Active"
            }
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response, indent=2).encode())
            
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def handle_ffm_alloc(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Forward request to memqosd
            req = urllib.request.Request(
                f"{MEMQOSD_URL}/v1/ffm/alloc",
                data=post_data,
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req) as resp:
                response_data = resp.read()
                
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_data)
            
        except urllib.error.URLError as e:
            self.send_error(502, f"memqosd unavailable: {str(e)}")
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def handle_corridor_telemetry(self):
        corridor_id = self.path.split('/')[-2]
        
        response = {
            "ber": 1.1e-12,
            "temp_c": 47.5,
            "power_pj_per_bit": 0.9,
            "drift": "low",
            "utilization_percent": 73.2,
            "error_count": 0
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def handle_health(self):
        response = {"status": "healthy", "service": "corrd-mock", "version": "4.0"}
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        sys.stdout.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format%args}\n")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), CorridorHandler) as httpd:
        print(f"Mock corrd server serving at port {PORT}")
        print(f"Corridor endpoint: http://localhost:{PORT}/v1/corridors")
        print(f"FFM endpoint: http://localhost:{PORT}/v1/ffm/alloc (forwards to memqosd)")
        print(f"Health check: http://localhost:{PORT}/health")
        httpd.serve_forever()
