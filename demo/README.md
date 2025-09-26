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

The video player is automatically integrated into the landing page demo section and will:
- Show a play button overlay initially
- Display video controls when playing
- Support fullscreen mode
- Show progress bar with time display
- Allow seeking by clicking the progress bar
