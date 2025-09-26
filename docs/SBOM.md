SBOM Generation (CycloneDX)

- Tool: `scripts/generate_sbom.py` (no external deps)
- Output: CycloneDX v1.4 JSON (`bom.cdx.json` by default)

Usage

- From repo root: `python3 scripts/generate_sbom.py --out bom.cdx.json`
- Excludes common build caches and large binaries.
- Includes common code and config files (.js, .css, .html, .py, .sh, .yml, .yaml, .toml, .json, .md).

Notes

- Attaches SHA-256 hashes for file components.
- Reads `index.html` for `corridoros-version` to set app version.
- Pair with release automation to upload the SBOM to GitHub Releases.

