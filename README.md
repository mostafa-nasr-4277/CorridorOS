# CorridorOS Starter Kit (v4.0)
Date: 2025-09-23

This pack includes:
- **RFC‑0**: `docs/RFC-0_CorridorOS.md`
- **OpenAPI**: `apis/corridoros_openapi.yaml`
- **Daemons (skeletons)**: `daemons/corrd_skeleton.rs`, `daemons/memqosd_skeleton.go`
- **CLI**: `cli/corridor_cli.py`
- **Configs**: examples for corridors & FFM
- **Ethics**: Consent Manifest schema
- **Labs**: HELIOPASS simulator note, Physics Decoder API note

## Quick Start (mock)
1. Run `memqosd_skeleton.go` (port 7070) and `corrd_skeleton.rs` (port 7080) after you wire real handlers.
2. Use `cli/corridor_cli.py lanes-alloc --lanes 8 --lambda-start 1550` to allocate.
3. Use `cli/corridor_cli.py ffm-alloc --bytes $((256*1024*1024*1024)) --tier T2 --bw-floor 150`.

> NOTE: These are **skeletons** for you to complete with real device SDKs (CXL, photonic kits), Linux CXL tooling (cxl-cli/ndctl/daxctl), and security plumbing (TPM/SPDM/PQC).
