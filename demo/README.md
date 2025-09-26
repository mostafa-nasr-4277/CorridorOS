# CorridorOS Demo Video

This directory contains the demo video files for the CorridorOS landing page.

## Video Files Needed

To enable the video player functionality, add these files to this directory:

- `corridoros-demo.mp4` - Main demo video (MP4 format, H.264 codec)
- `corridoros-demo.webm` - WebM format for better browser compatibility

## Video Specifications

- **Duration**: 3 minutes (180 seconds)
- **Resolution**: 1280x720 (16:9 aspect ratio)
- **Format**: MP4 (H.264) and WebM
- **Content**: CorridorOS demonstration showing:
  1. Allocate corridor (8 lanes, 1550–1557 nm)
  2. Set 150 GB/s floor on Free-Form Memory
  3. Run workload → p99 drops in Grafana
  4. HELIOPASS recalibrates → BER stabilizes

## Fallback

If video files are not available, the player will automatically fall back to the interactive simulation demo.

## Usage

To generate the 3-minute video from the project’s slides, run:

```
bash scripts/build_demo_video.sh
```

This produces:
- `demo/corridoros-demo.mp4` (H.264)
- `demo/corridoros-demo.webm` (VP9), if available

The landing page video player will automatically use these local files when present. It supports:
- Native controls (play/pause/seek/volume/fullscreen)
- Responsive 16:9 display with rounded corners
- Graceful fallback if files are missing
