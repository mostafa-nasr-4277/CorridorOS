#!/usr/bin/env python3
"""
CorridorOS v4 – Minimal Operator Controller (reference implementation)

This controller watches Corridor and MemoryBundle custom resources and
calls corrd (photonic) and memqosd (FFM) services to reconcile desired state.

Local mock mode: it will attempt to talk to http://localhost:7080 and :7070.
In a real cluster, set environment variables CORRD_URL and MEMQOSD_URL.
"""
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.request import Request, urlopen

CORRD_URL = os.environ.get("CORRD_URL", "http://localhost:7080")
MEMQOSD_URL = os.environ.get("MEMQOSD_URL", "http://localhost:7070")

# In lieu of a Kubernetes client (kept dependency-free), we expose a simple
# webhook-style interface so you can curl specs at the controller for testing.
# POST /reconcile/corridor   body: Corridor spec JSON
# POST /reconcile/memory     body: MemoryBundle spec JSON

STATE = {
    "corridors": {},  # name -> status
    "memory": {},     # name -> status
}

def _json(resp):
    ct = resp.headers.get("content-type", "")
    data = resp.read().decode()
    if "json" not in ct and data and data[:1] != "{" and data[:1] != "[":
        raise RuntimeError(f"Non-JSON response: {data[:80]}")
    return json.loads(data) if data else {}

def reconcile_corridor(name, spec):
    payload = {
        "corridor_type": spec.get("type", "SiCorridor"),
        "lanes": int(spec.get("lanes", 8)),
        "lambda_nm": spec.get("lambdaNm", []),
        "min_gbps": int(spec.get("minGbps", 400)),
        "latency_budget_ns": int(spec.get("latencyBudgetNs", 250)),
        "qos": spec.get("qos", {"pfc": True, "priority": "gold"}),
        "attestation_required": bool(spec.get("attestationRequired", True)),
    }
    req = Request(f"{CORRD_URL}/v1/corridors", data=json.dumps(payload).encode(), headers={"Content-Type":"application/json"})
    req.get_method = lambda: "POST"
    with urlopen(req) as r:
        out = _json(r)
    STATE["corridors"][name] = {
        "id": out.get("id", name),
        "state": "Active",
        "achievableGbps": out.get("achievable_gbps", payload["min_gbps"]),
        "ber": out.get("ber", 1.2e-12),
        "message": "reconciled",
    }
    return STATE["corridors"][name]

def reconcile_memory(name, spec):
    payload = {
        "bytes": int(spec.get("bytes")),
        "latency_class": spec.get("latencyClass", "T2"),
        "bandwidth_floor_GBs": int(spec.get("bandwidthFloorGBs", 100)),
        "persistence": spec.get("persistence", "none"),
        "shareable": bool(spec.get("shareable", True)),
        "security_domain": spec.get("securityDomain", "default"),
    }
    req = Request(f"{MEMQOSD_URL}/v1/ffm/alloc", data=json.dumps(payload).encode(), headers={"Content-Type":"application/json"})
    req.get_method = lambda: "POST"
    with urlopen(req) as r:
        out = _json(r)
    STATE["memory"][name] = {
        "handle": out.get("ffm_handle", name),
        "state": "Allocated",
        "bandwidthActualGBs": out.get("bandwidth_actual_GBs", payload["bandwidth_floor_GBs"]),
        "message": "reconciled",
    }
    return STATE["memory"][name]

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        self.send_response(code)
        self.send_header("Content-Type","application/json")
        self.send_header("Access-Control-Allow-Origin","*")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_POST(self):
        length = int(self.headers.get('Content-Length','0'))
        data = json.loads(self.rfile.read(length) or b"{}")
        if self.path == "/reconcile/corridor":
            name = data.get("metadata",{}).get("name","corridor")
            status = reconcile_corridor(name, data.get("spec",{}))
            return self._send(200, {"status": status})
        if self.path == "/reconcile/memory":
            name = data.get("metadata",{}).get("name","memory")
            status = reconcile_memory(name, data.get("spec",{}))
            return self._send(200, {"status": status})
        return self._send(404, {"error":"not found"})

    def do_GET(self):
        if self.path == "/health":
            return self._send(200, {"status":"ok","version":"v4"})
        if self.path == "/state":
            return self._send(200, STATE)
        return self._send(404, {"error":"not found"})

def main():
    port = int(os.environ.get("PORT","8099"))
    srv = HTTPServer(("", port), Handler)
    print(f"CorridorOS operator controller listening on :{port} (corrd={CORRD_URL}, memqosd={MEMQOSD_URL})")
    srv.serve_forever()

if __name__ == "__main__":
    main()

