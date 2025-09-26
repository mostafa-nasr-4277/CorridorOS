#!/usr/bin/env bash
set -euo pipefail

# Build a 3-minute CorridorOS demo video from text slides using ffmpeg drawtext
# Outputs:
#  - demo/corridoros-demo.mp4 (H.264, 1280x720, 180s)
#  - demo/corridoros-demo.webm (VP9/Opus) if encoder available

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/.." && pwd)
out_dir="$root/demo"
tmp_dir="$out_dir/.tmp_slides"
mkdir -p "$tmp_dir"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: ffmpeg is required but not found in PATH." >&2
  echo "Install via Homebrew: brew install ffmpeg" >&2
  exit 1
fi

# Try to find a reasonable font file
font_candidates=(
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
  "/Library/Fonts/Arial.ttf"
  "/System/Library/Fonts/Supplemental/Helvetica.ttf"
  "/System/Library/Fonts/Supplemental/Geneva.ttf"
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
)
FONT=""
for f in "${font_candidates[@]}"; do
  if [ -f "$f" ]; then FONT="$f"; break; fi
done
if [ -z "$FONT" ]; then
  echo "Warning: Could not find a standard font. If ffmpeg has fontconfig, it will use a default." >&2
fi

RES="1280x720"
FPS=30

# Slide text content
cat > "$tmp_dir/s1_title.txt" <<'TXT'
CorridorOS — Theory of Compute
TXT
cat > "$tmp_dir/s1_sub.txt" <<'TXT'
Reserve Light. Guarantee Memory.
TXT
cat > "$tmp_dir/s1_body.txt" <<'TXT'
A three-minute walkthrough: photonic corridors (λ lanes), Free‑Form Memory (CXL) with bandwidth floors, HELIOPASS calibration, and system safety.
TXT

cat > "$tmp_dir/s2_title.txt" <<'TXT'
HELIOPASS — Photonic Environment Calibration
TXT
cat > "$tmp_dir/s2_sub.txt" <<'TXT'
Stabilize BER and eye with minimal power
TXT
cat > "$tmp_dir/s2_body.txt" <<'TXT'
Estimates background offset from lunar, zodiacal, airglow, galactic, and skyglow contributions and tunes bias/λ to hold error targets.
TXT

cat > "$tmp_dir/s3_title.txt" <<'TXT'
Photonic Corridors (λ Lanes)
TXT
cat > "$tmp_dir/s3_sub.txt" <<'TXT'
Reserve wavelength sets per workload
TXT
cat > "$tmp_dir/s3_body.txt" <<'TXT'
Allocate WDM lanes with policy: shaping, preemption guards, and power‑aware bias tuning via HELIOPASS integration.
TXT

cat > "$tmp_dir/s4_title.txt" <<'TXT'
Free‑Form Memory (CXL)
TXT
cat > "$tmp_dir/s4_sub.txt" <<'TXT'
GB/s floors as first‑class resources
TXT
cat > "$tmp_dir/s4_body.txt" <<'TXT'
Pooled memory carved into QoS bundles with floor guarantees and latency classes; exposed to schedulers via CRDs and attested at boot.
TXT

cat > "$tmp_dir/s5_title.txt" <<'TXT'
Tactile Power — Pin‑free, Genderless
TXT
cat > "$tmp_dir/s5_sub.txt" <<'TXT'
Pad‑to‑pad, magnet‑aligned, or contactless
TXT
cat > "$tmp_dir/s5_body.txt" <<'TXT'
Corridor‑class devices can receive power without exposed pins: 1) Capacitive/inductive (contactless) couplers with pre‑charge; 2) Flush conductive pads with current sharing. The toolkit helps size pads, pre‑charge, and compensation networks.
TXT

cat > "$tmp_dir/s6_title.txt" <<'TXT'
Putting It Together
TXT
cat > "$tmp_dir/s6_sub.txt" <<'TXT'
Schedule compute, light, memory — and power
TXT
cat > "$tmp_dir/s6_body.txt" <<'TXT'
CorridorOS unifies photonic corridors, calibrated by HELIOPASS, with QoS memory and safe, pin‑free power delivery — observable and schedulable from day one.
TXT

make_slide() {
  local id="$1"; shift
  local dur="$1"; shift
  local bg="$1"; shift
  local title="$tmp_dir/${id}_title.txt"
  local sub="$tmp_dir/${id}_sub.txt"
  local body="$tmp_dir/${id}_body.txt"
  local out="$tmp_dir/${id}.mp4"

  # Compose a filter with three drawtext layers
  local font_opt=""
  if [ -n "$FONT" ]; then font_opt=":fontfile=${FONT}"; fi

  ffmpeg -v error -y \
    -f lavfi -i "color=c=${bg}:s=${RES}:d=${dur},format=yuv420p" \
    -vf "\
      drawtext=textfile='${title}'${font_opt}:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h*0.28:borderw=1:bordercolor=black@0.4,\
      drawtext=textfile='${sub}'${font_opt}:fontcolor=0x99bbdd:fontsize=32:x=(w-text_w)/2:y=h*0.38:borderw=1:bordercolor=black@0.35,\
      drawtext=textfile='${body}'${font_opt}:fontcolor=0xE8E8F0:fontsize=26:line_spacing=8:x=(w-text_w)/2:y=h*0.50:box=1:boxcolor=black@0.20:boxborderw=16" \
    -r ${FPS} -c:v libx264 -pix_fmt yuv420p -profile:v high -movflags +faststart -crf 20 -preset veryfast \
    "$out"
}

echo "[1/4] Rendering slides → MP4 segments"
make_slide s1 20 0x1a0a2e
make_slide s2 40 0x032b3a
make_slide s3 35 0x2d1b69
make_slide s4 30 0x1f2a6e
make_slide s5 35 0x2b2b2b
make_slide s6 20 0x2d1b69

echo "[2/4] Concatenating segments → demo/corridoros-demo.mp4"
ls "$tmp_dir"/s*.mp4 | sort | sed "s/.*/file '&'/" > "$tmp_dir/concat.txt"

ffmpeg -v error -y \
  -f concat -safe 0 -i "$tmp_dir/concat.txt" \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -movflags +faststart -crf 20 -preset veryfast \
  "$out_dir/corridoros-demo.mp4"

echo "[3/4] Synthesizing background music (ambient)"
# Procedural ambient pad: layered sines + gentle tremolo + pink noise texture
ffmpeg -v error -y -filter_complex "\
  sine=frequency=220:duration=180:sample_rate=48000:beep_factor=0 [a1];\
  sine=frequency=261.63:duration=180:sample_rate=48000:beep_factor=0,volume=0.8 [a2];\
  sine=frequency=329.63:duration=180:sample_rate=48000:beep_factor=0,volume=0.7 [a3];\
  sine=frequency=440:duration=180:sample_rate=48000:beep_factor=0,tremolo=f=0.2:d=0.6,volume=0.6 [a4];\
  anoisesrc=color=pink:duration=180:sample_rate=48000,lowpass=f=800,volume=0.03 [n];\
  [a1][a2][a3][a4][n]amix=inputs=5:normalize=0,volume=0.25,\
  afade=t=in:st=0:d=3,afade=t=out:st=177:d=3,\
  aformat=sample_rates=48000:channel_layouts=stereo" \
  -c:a aac -b:a 128k "$tmp_dir/music.m4a"

echo "[4/4] Muxing music into video and producing WebM"
# Mux audio into MP4
ffmpeg -v error -y -i "$out_dir/corridoros-demo.mp4" -i "$tmp_dir/music.m4a" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 128k -shortest \
  "$out_dir/corridoros-demo.tmp.mp4" && mv "$out_dir/corridoros-demo.tmp.mp4" "$out_dir/corridoros-demo.mp4"

# Build a VP9 webm if encoder is present
if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libvpx-vp9; then
  echo "      → Producing VP9 WebM"
  ffmpeg -v error -y -i "$out_dir/corridoros-demo.mp4" \
    -c:v libvpx-vp9 -b:v 1.5M -crf 32 -row-mt 1 \
    -c:a libopus -b:a 96k -ac 2 \
    "$out_dir/corridoros-demo.webm" || true
else
  echo "      → Skipping WebM: libvpx-vp9 encoder not found"
fi

echo "Done. Outputs:"
echo "  • $out_dir/corridoros-demo.mp4 (with music)"
if [ -f "$out_dir/corridoros-demo.webm" ]; then echo "  • $out_dir/corridoros-demo.webm"; fi
