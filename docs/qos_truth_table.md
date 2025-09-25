# QoS Truth Table (baseline)

| Vendor | Mechanism | Hard Floors | PFC | Weighted Fair | Notes |
|-------|-----------|------------:|:---:|:-------------:|-------|
| Vendor-A | CXL QoS ext | Yes | Yes | Yes | Floors honored at queue-level |
| Vendor-B | Driver shim | Partial | No | Yes | Floors approximated via WRED |
| Vendor-C | HW QoS | No | Yes | No | Best-effort only |

Behavior when missing: memqosd falls back in order: Hard floor → Weighted Fair → Best-effort; logs the applied mode and causes yellow dial when below floor.
