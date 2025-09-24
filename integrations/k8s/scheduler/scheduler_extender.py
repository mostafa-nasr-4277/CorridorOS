#!/usr/bin/env python3
"""
Minimal Kubernetes Scheduler Extender (reference) for CorridorOS v4.

Implements /filter and /prioritize. Expects pod annotations:
- corridoros.io/bandwidthFloorGBs: "150"
- corridoros.io/memoryBundle: "infer-a-256g"

For demo purposes the extender accepts all nodes and gives higher score
to nodes labeled corridoros.io/hasCorridor=true and corridoros.io/hasFFM=true.
"""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

def parse(body):
    try: return json.loads(body)
    except Exception: return {}

class H(BaseHTTPRequestHandler):
    def _send(self, obj):
        self.send_response(200)
        self.send_header('Content-Type','application/json')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_POST(self):
        length = int(self.headers.get('Content-Length','0'))
        obj = parse(self.rfile.read(length))
        if self.path.endswith('/filter'):
            nodes = obj.get('nodes', {}).get('items', [])
            # Accept all for now; real impl would check live reservations
            filtered = {'items': nodes}
            return self._send({'nodeNames':[n['metadata']['name'] for n in nodes], 'failedNodes':{}, 'error':''})
        if self.path.endswith('/prioritize'):
            nodes = obj.get('nodes', [])
            scores = []
            for n in nodes:
                name = n['name'] if isinstance(n, dict) else n
                labels = (n.get('labels') if isinstance(n, dict) else {}) or {}
                s = 10
                if labels.get('corridoros.io/hasCorridor') == 'true': s += 30
                if labels.get('corridoros.io/hasFFM') == 'true': s += 30
                scores.append({'name': name, 'score': s})
            return self._send(scores)
        self.send_error(404)

def main():
    srv = HTTPServer(('', 8098), H)
    print('CorridorOS scheduler extender on :8098')
    srv.serve_forever()

if __name__ == '__main__':
    main()

