# API Versioning & Deprecation Policy (v0.1 freeze)

- Current version: `0.1.0` (frozen)
- Breaking changes are not allowed without bumping the minor version and adding explicit deprecations.
- Deprecation window: `2` minor releases. Endpoints marked with `x-deprecated: true` must include a replacement and removal ETA.
- Error codes: Use `X-Error-Code` header and JSON field `error.code`; codes are registered in this repo under `docs/error_codes.md`.
- Compatibility: CRDs and OpenAPI are versioned together; generated clients track `info.version`.
