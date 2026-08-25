#!/bin/bash
# Usage: ./scripts/extract-frames.sh path/to/source-video.mp4
# Prefer a clean master (ProRes/high-bitrate MP4), not a GIF-derived clip.
set -euo pipefail

SOURCE=${1:-}
OUTDIR="public/frames"

if [ -z "$SOURCE" ]; then
  echo "Usage: $0 path/to/source-video.mp4" >&2
  exit 1
fi

if [ ! -f "$SOURCE" ]; then
  echo "Source not found: $SOURCE" >&2
  exit 1
fi

mkdir -p "$OUTDIR"
rm -f "$OUTDIR"/frame-*.jpg

FFMPEG="${FFMPEG:-ffmpeg}"
"$FFMPEG" -y -i "$SOURCE" -vf "fps=30" -q:v 2 "$OUTDIR/frame-%03d.jpg"

echo "Extracted frames to $OUTDIR"
ls "$OUTDIR"/frame-*.jpg 2>/dev/null | wc -l
du -sh "$OUTDIR"
