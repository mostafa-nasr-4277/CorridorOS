#!/usr/bin/env python3
"""
Chained CNI plugin skeleton that passes through and logs a corridor ID if provided.

This reads CNI stdin JSON, adds an annotation-like field to the result under
`corridoros` and prints it back to stdout. For demo only.
"""
import json, sys, os

def main():
    data = json.loads(sys.stdin.read() or '{}')
    corridor_id = os.environ.get('CORRIDOR_ID', 'demo-corridor')
    result = {
        "cniVersion": data.get('cniVersion','0.4.0'),
        "corridoros": {"corridorId": corridor_id},
        "interfaces": data.get('interfaces', []),
        "ips": data.get('ips', []),
        "routes": data.get('routes', []),
        "dns": data.get('dns', {}),
    }
    sys.stdout.write(json.dumps(result))

if __name__ == '__main__':
    main()

