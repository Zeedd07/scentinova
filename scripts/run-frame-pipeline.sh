#!/bin/bash
# Orchestrate frame pipeline: extract (if SOURCE set) → clean → webp
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== BEFORE ==="
du -sh public/frames
ls public/frames/frame-*.jpg | wc -l

echo ""
echo "=== EXTRACT ==="
if [ -n "${1:-}" ] && [ -f "$1" ]; then
  ./scripts/extract-frames.sh "$1"
else
  echo "No clean master video provided — keeping existing JPEGs."
  echo "Usage later: ./scripts/extract-frames.sh path/to/clean-master.mp4"
  echo "Running denoise fallback on public/frames ..."
fi

echo ""
echo "=== CLEAN ==="
./scripts/clean-frames.sh

echo ""
echo "=== CONVERT WEBP ==="
./scripts/convert-webp.sh

echo ""
echo "=== AFTER ==="
du -sh public/frames public/frames-clean public/frames-webp
echo -n "jpg count: "; ls public/frames/frame-*.jpg | wc -l
echo -n "clean count: "; ls public/frames-clean/frame-*.jpg | wc -l
echo -n "webp count: "; ls public/frames-webp/frame-*.webp | wc -l
