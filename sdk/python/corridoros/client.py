import json
import os
from contextlib import contextmanager
from urllib.request import Request, urlopen


class CorridorOS:
    def __init__(self, corrd_url=None, memqosd_url=None):
        self.corrd = corrd_url or os.environ.get('CORRD_URL', 'http://localhost:7080')
        self.mem = memqosd_url or os.environ.get('MEMQOSD_URL', 'http://localhost:7070')

    # Photonic corridors
    def allocate_corridor(self, *, corridor_type='SiCorridor', lanes=8, lambda_nm=None,
                           min_gbps=400, latency_budget_ns=250, qos=None, attestation_required=True):
        payload = {
            'corridor_type': corridor_type,
            'lanes': lanes,
            'lambda_nm': lambda_nm or list(range(1550, 1550+lanes)),
            'min_gbps': min_gbps,
            'latency_budget_ns': latency_budget_ns,
            'qos': qos or {'pfc': True, 'priority': 'gold'},
            'attestation_required': attestation_required,
        }
        return _post_json(f"{self.corrd}/v1/corridors", payload)

    # Free-form memory
    def allocate_ffm(self, *, bytes, latency_class='T2', bandwidth_floor_GBs=150,
                      persistence='none', shareable=True, security_domain='default'):
        payload = {
            'bytes': int(bytes),
            'latency_class': latency_class,
            'bandwidth_floor_GBs': int(bandwidth_floor_GBs),
            'persistence': persistence,
            'shareable': bool(shareable),
            'security_domain': security_domain,
        }
        return _post_json(f"{self.mem}/v1/ffm/alloc", payload)


def _post_json(url, payload):
    req = Request(url, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
    req.get_method = lambda: 'POST'
    with urlopen(req) as r:
        ct = r.headers.get('content-type', '')
        body = r.read().decode()
    if 'json' not in ct and not body.startswith('{'):  # basic guard
        raise RuntimeError(f"Unexpected response from {url}: {body[:120]}")
    return json.loads(body)


@contextmanager
def corridor(**kwargs):
    co = CorridorOS()
    result = co.allocate_corridor(**kwargs)
    try:
        yield result
    finally:
        # In this scaffold we do not implement deletion; add if needed.
        pass


@contextmanager
def ffm(**kwargs):
    co = CorridorOS()
    result = co.allocate_ffm(**kwargs)
    try:
        yield result
    finally:
        # Add deletion endpoint when available
        pass

