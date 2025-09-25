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
if [ -d "$ROOT_DIR/brand" ]; then
  rsync -a --prune-empty-dirs --include '*/' --include '*.css' --include 'icons/*.svg' --exclude '*' "$ROOT_DIR/brand/" "$DIST/brand/"
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
  main.js
do
  if [ -f "$ROOT_DIR/$js" ]; then
    copy "$ROOT_DIR/$js" "$DIST/$js"
  fi
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

# --- Asset fingerprinting for cache-busting (near-realtime updates) ---
echo "[build] Fingerprinting assets..."
FPMAP="$DIST/.fingerprints.txt"
> "$FPMAP"
# Find css/js except the service worker itself
while IFS= read -r -d '' f; do
  rel="${f#$DIST/}"
  # compute short hash
  hash=$(shasum -a 256 "$f" | awk '{print $1}' | cut -c1-8)
  ext="${rel##*.}"
  base="${rel%.*}"
  newrel="$base.$hash.$ext"
  newpath="$DIST/$newrel"
  mkdir -p "$(dirname "$newpath")"
  mv "$f" "$newpath"
  printf "%s %s\n" "$rel" "$newrel" >> "$FPMAP"
done < <(find "$DIST" -type f \( -name "*.js" -o -name "*.css" \) ! -name "service-worker.js" -print0)

# Rewrite HTML references to fingerprinted assets
for html in "$DIST"/*.html; do
  [ -f "$html" ] || continue
  while read -r old new; do
    # Replace both href/src occurrences
    sed -i '' -e "s#\([\"'=(]\)${old}\([\"') ]\)#\1${new}\2#g" "$html"
  done < "$FPMAP"
done

echo "[build] Fingerprinted $(wc -l < "$FPMAP" | tr -d ' ') assets"

echo "[build] Dist prepared with $(find "$DIST" -type f | wc -l | tr -d ' ') files"
