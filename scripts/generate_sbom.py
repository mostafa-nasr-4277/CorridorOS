#!/usr/bin/env python3
"""
Lightweight CycloneDX SBOM generator for CorridorOS.

Generates a minimal CycloneDX v1.4 JSON BOM from repository files
with SHA-256 hashes. No external dependencies required.

Usage:
  python3 scripts/generate_sbom.py --out bom.cdx.json
"""
import argparse
import hashlib
import json
import os
import sys
import time
import uuid

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

EXCLUDE_DIRS = {
    ".git", ".gocache", ".gomodcache", "node_modules", "dist", "TheKernel",
    "tactile-power-toolkit", "Lost causes", ".github"
}

# Conservative include extensions (expand as needed)
INCLUDE_EXT = {
    ".js", ".mjs", ".cjs", ".ts", ".tsx",
    ".css", ".scss",
    ".html", ".htm",
    ".py", ".sh", ".bash",
    ".yml", ".yaml", ".toml", ".json",
    ".md"
}

def find_version_from_index():
    idx = os.path.join(ROOT, "index.html")
    try:
        with open(idx, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if 'name="corridoros-version"' in line:
                    # naive parse for content="vX"
                    start = line.find("content=")
                    if start != -1:
                        q1 = line.find('"', start)
                        q2 = line.find('"', q1 + 1)
                        if q1 != -1 and q2 != -1:
                            return line[q1 + 1:q2]
    except Exception:
        pass
    return "unknown"

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def should_include(path):
    _, ext = os.path.splitext(path)
    return ext.lower() in INCLUDE_EXT

def gather_components():
    components = []
    for root, dirs, files in os.walk(ROOT):
        # mutate dirs in-place to prune walk
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for name in files:
            # skip hidden files and big binaries by ext policy
            if name.startswith('.'):
                continue
            rel = os.path.relpath(os.path.join(root, name), ROOT)
            if not should_include(rel):
                continue
            full = os.path.join(root, name)
            try:
                digest = sha256_file(full)
            except Exception:
                continue
            components.append({
                "type": "file",
                "name": rel.replace('\\', '/'),
                "hashes": [
                    {"alg": "SHA-256", "content": digest}
                ]
            })
    return components

def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "bom.cdx.json"))
    args = ap.parse_args(argv)

    version = find_version_from_index()
    components = gather_components()
    bom = {
        "$schema": "http://cyclonedx.org/schema/bom-1.4.schema.json",
        "bomFormat": "CycloneDX",
        "specVersion": "1.4",
        "version": 1,
        "serialNumber": f"urn:uuid:{uuid.uuid4()}",
        "metadata": {
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            "tools": [{
                "vendor": "CorridorOS",
                "name": "sbomgen",
                "version": "0.1"
            }],
            "component": {
                "type": "application",
                "name": "CorridorOS",
                "version": version
            }
        },
        "components": components
    }

    out_path = args.out
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(bom, f, indent=2)
    print(f"Wrote SBOM with {len(components)} components to {out_path}")

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
