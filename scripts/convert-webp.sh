#!/bin/bash
# Convert cleaned JPEGs → WebP for smaller hero payloads.
set -euo pipefail

IN="public/frames-clean"
OUT="public/frames-webp"
mkdir -p "$OUT"

if ! ls "$IN"/frame-*.jpg >/dev/null 2>&1; then
  echo "No cleaned frames in $IN — run clean-frames.sh first" >&2
  exit 1
fi

FFMPEG="${FFMPEG:-ffmpeg}"
count=0
for f in "$IN"/frame-*.jpg; do
  name=$(basename "$f" .jpg)
  # libwebp quality 0–100 via -q:v
  "$FFMPEG" -y -hide_banner -loglevel error -i "$f" -c:v libwebp -q:v 90 "$OUT/$name.webp"
  count=$((count + 1))
  if (( count % 50 == 0 )); then
    echo "Converted $count frames..."
  fi
done

echo "WebP frames written to $OUT ($count files)"
du -sh "$IN" "$OUT"
