#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
DIST="$ROOT_DIR/dist"

echo "[build] Preparing dist at $DIST"
rm -rf "$DIST"
mkdir -p "$DIST" \
         "$DIST/brand/icons" \
         "$DIST/apis" \
         "$DIST/k8s/docs"

copy() { src="$1"; dest="$2"; mkdir -p "$(dirname "$dest")"; cp "$src" "$dest"; }

# HTML entry points
for f in \
  index.html \
  404.html \
  corridor-os.html \
  corridoros_advanced.html \
  corridoros_dashboard.html \
  corridoros_detailed.html \
  corridoros_simulator.html \
  fix-mozilla-compatibility.html \
  simple-mozilla-launcher.html
do
  if [ -f "$ROOT_DIR/$f" ]; then
    copy "$ROOT_DIR/$f" "$DIST/$f"
  fi
done

# Core styles and brand assets
copy "$ROOT_DIR/corridor-os-styles.css" "$DIST/corridor-os-styles.css"
# Also copy any top-level CSS (including hashed variants referenced by HTML)
find "$ROOT_DIR" -maxdepth 1 -type f -name "*.css" -print0 | while IFS= read -r -d '' p; do
  rel="${p#$ROOT_DIR/}"; copy "$p" "$DIST/$rel";
done
if [ -d "$ROOT_DIR/brand" ]; then
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --prune-empty-dirs --include '*/' --include '*.css' --include 'icons/*.svg' --exclude '*' "$ROOT_DIR/brand/" "$DIST/brand/"
  else
    find "$ROOT_DIR/brand" -type d -name icons -o -name . -o -type f -name '*.css' -o -type f -name '*.svg' | while read -r p; do
      rel="${p#$ROOT_DIR/}"
      dest="$DIST/$rel"; mkdir -p "$(dirname "$dest")"; cp "$p" "$dest" 2>/dev/null || true
    done
  fi
fi

# Demo media (video) used by index; optional
if [ -d "$ROOT_DIR/demo" ]; then
  rsync -a --prune-empty-dirs \
    --include '*/' \
    --include '*.mp4' --include '*.webm' --include 'README.md' \
    --exclude '*' "$ROOT_DIR/demo/" "$DIST/demo/"
fi

# Apps (offline previews)
if [ -d "$ROOT_DIR/apps" ]; then
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --prune-empty-dirs --include '*/' --include '*.html' --include '*.png' --include '*.jpg' --include '*.jpeg' --include '*.json' --exclude '*' "$ROOT_DIR/apps/" "$DIST/apps/"
  else
    find "$ROOT_DIR/apps" -type f \( -name '*.html' -o -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.json' \) | while read -r p; do
      rel="${p#$ROOT_DIR/}"
      dest="$DIST/$rel"; mkdir -p "$(dirname "$dest")"; cp "$p" "$dest"
    done
  fi
fi

# Core application scripts
for js in \
  corridor-os.js \
  corridor-apps.js \
  corridor-settings.js \
  corridor-window-manager.js \
  ui-tilt.js \
  ui-menu.js \
  navigation.js \
  three-hero.js \
  auto-cycle.js \
  quantum.js \
  photon.js \
  memory.js \
  orchestrator.js \
  heliopass.js \
  thermal-model.js \
  main.js \
  webgpu-check.js \
  unified-model.js \
  ambient-lab.js
do
  if [ -f "$ROOT_DIR/$js" ]; then
    copy "$ROOT_DIR/$js" "$DIST/$js"
  fi
done

# Also bring over any top-level hashed JS bundles referenced by HTML (e.g., corridor-*.hash.js)
find "$ROOT_DIR" -maxdepth 1 -type f -name "*.js" -print0 | while IFS= read -r -d '' p; do
  rel="${p#$ROOT_DIR/}"; [ -f "$DIST/$rel" ] || copy "$p" "$DIST/$rel";
done

# API spec expected by index (place under /apis)
if [ -f "$ROOT_DIR/CorridorOS/apis/corridoros_openapi.yaml" ]; then
  copy "$ROOT_DIR/CorridorOS/apis/corridoros_openapi.yaml" "$DIST/apis/corridoros_openapi.yaml"
fi

# K8s addendum linked from index (optional)
if [ -f "$ROOT_DIR/k8s/docs/RFC-0_Addendum_A_K8s_and_Observability.md" ]; then
  copy "$ROOT_DIR/k8s/docs/RFC-0_Addendum_A_K8s_and_Observability.md" "$DIST/k8s/docs/RFC-0_Addendum_A_K8s_and_Observability.md"
fi

# Service Worker
copy "$ROOT_DIR/service-worker.js" "$DIST/service-worker.js"

# Copy manifest (optional)
if [ -f "$ROOT_DIR/manifest.webmanifest" ]; then
  copy "$ROOT_DIR/manifest.webmanifest" "$DIST/manifest.webmanifest"
fi

# --- Asset fingerprinting for cache-busting (near-realtime updates) ---
echo "[build] Fingerprinting assets..."
FPMAP="$DIST/.fingerprints.txt"
> "$FPMAP"
# Find css/js except the service worker itself; avoid re-fingerprinting files that already include an 8-char hash.
while IFS= read -r -d '' f; do
  rel="${f#$DIST/}"
  base="$(basename "$rel")"
  # Skip already-hashed files like name.abcdef12.css/js
  if echo "$base" | grep -Eq '\\.[0-9a-f]{8}\\.(css|js)$'; then
    continue
  fi
  # compute short hash (portable)
  if command -v shasum >/dev/null 2>&1; then
    hash=$(shasum -a 256 "$f" | awk '{print $1}' | cut -c1-8)
  else
    hash=$(sha256sum "$f" | awk '{print $1}' | cut -c1-8)
  fi
  ext="${rel##*.}"
  base_noext="${rel%.*}"
  newrel="$base_noext.$hash.$ext"
  newpath="$DIST/$newrel"
  mkdir -p "$(dirname "$newpath")"
  mv "$f" "$newpath"
  printf "%s %s\n" "$rel" "$newrel" >> "$FPMAP"
done < <(find "$DIST" -type f \( -name "*.js" -o -name "*.css" \) ! -name "service-worker.js" -print0)

# Rewrite HTML references to fingerprinted assets
for html in "$DIST"/*.html; do
  [ -f "$html" ] || continue
  while read -r old new; do
    # Replace both href/src occurrences (BSD/GNU sed)
    if sed --version >/dev/null 2>&1; then
      sed -i -e "s#\([\"'=(]\)${old}\([\"') ]\)#\1${new}\2#g" "$html"
    else
      sed -i '' -e "s#\([\"'=(]\)${old}\([\"') ]\)#\1${new}\2#g" "$html"
    fi
  done < "$FPMAP"
done

echo "[build] Fingerprinted $(wc -l < "$FPMAP" | tr -d ' ') assets"

# Back-compat aliases for previously-hashed assets referenced by older HTML
if ls "$DIST"/corridor-os-styles.84d8f5a3.*.css >/dev/null 2>&1; then
  latest=$(ls -1t "$DIST"/corridor-os-styles.84d8f5a3.*.css | head -n1)
  [ -f "$DIST/corridor-os-styles.84d8f5a3.css" ] || cp "$latest" "$DIST/corridor-os-styles.84d8f5a3.css"
fi
if ls "$DIST"/brand/corridoros-brand.b501abdc*.css >/dev/null 2>&1; then
  latest=$(ls -1t "$DIST"/brand/corridoros-brand.b501abdc*.css | head -n1)
  [ -f "$DIST/brand/corridoros-brand.b501abdc.css" ] || cp "$latest" "$DIST/brand/corridoros-brand.b501abdc.css"
fi

echo "[build] Dist prepared with $(find "$DIST" -type f | wc -l | tr -d ' ') files"
