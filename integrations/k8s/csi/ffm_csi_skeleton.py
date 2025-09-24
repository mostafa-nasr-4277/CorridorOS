#!/usr/bin/env python3
"""
FFM CSI Skeleton (non-functional demo)

This is a placeholder that demonstrates process wiring. It exposes /health
and logs desired operations, but it does NOT implement the CSI gRPC API.
Use it to validate manifests and control-plane plumbing before a real driver.
"""
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

STATE = {"volumes": {}}

class H(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        self.send_response(code)
        self.send_header('Content-Type','application/json')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_GET(self):
        if self.path == '/health':
            return self._send(200, {"status":"ok","driver":"ffm.corridoros","version":"v4-skel"})
        return self._send(404, {"error":"not implemented"})

def main():
    port = int(os.environ.get('PORT','9810'))
    print(f"FFM CSI skeleton listening on :{port}")
    HTTPServer(('',port), H).serve_forever()

if __name__ == '__main__':
    main()

