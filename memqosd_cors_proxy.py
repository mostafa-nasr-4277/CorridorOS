#!/usr/bin/env python3
"""
Simple CORS proxy for memqosd service
"""
import http.server
import urllib.request
import json
import sys
import time

PORT = 7070
MEMQOSD_URL = "http://localhost:7071"  # Actual memqosd on different port

class CORSProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/health':
            self.handle_health()
        else:
            self.proxy_request('GET')
    
    def do_POST(self):
        self.proxy_request('POST')
    
    def handle_health(self):
        response = {"status": "healthy", "service": "memqosd-mock", "version": "4.0"}
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def proxy_request(self, method):
        try:
            data = None
            if method == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    data = self.rfile.read(content_length)
            
            req = urllib.request.Request(
                f"{MEMQOSD_URL}{self.path}",
                data=data,
                headers={'Content-Type': 'application/json'} if data else {}
            )
            req.get_method = lambda: method
            
            with urllib.request.urlopen(req) as resp:
                response_data = resp.read()
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_data)
            
        except urllib.error.URLError:
            # If memqosd is not available, return mock response
            if self.path == '/v1/ffm/alloc':
                mock_response = {
                    "ffm_handle": f"ffm-{int(time.time()) % 10000:04d}",
                    "fds": ["/proc/self/fd/38"],
                    "policy_lease_ttl_s": 3600
                }
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(mock_response).encode())
            else:
                self.send_error(502, "memqosd unavailable")
        except Exception as e:
            self.send_error(500, f"Proxy error: {str(e)}")
    
    def log_message(self, format, *args):
        sys.stdout.write(f"[MEMQOSD-PROXY {time.strftime('%H:%M:%S')}] {format%args}\n")

if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("", PORT), CORSProxyHandler) as httpd:
        print(f"memqosd CORS proxy running on port {PORT}")
        httpd.serve_forever()
