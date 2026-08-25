#!/bin/bash
# Denoise + light sharpen — fallback when only GIF-banded JPEGs exist (no clean master).
# hqdn3d reduces banding/dither; unsharp restores edge clarity without reintroducing noise.
set -euo pipefail

IN="public/frames"
OUT="public/frames-clean"
mkdir -p "$OUT"

FFMPEG="${FFMPEG:-ffmpeg}"
count=0
for f in "$IN"/frame-*.jpg; do
  [ -e "$f" ] || { echo "No frames in $IN" >&2; exit 1; }
  name=$(basename "$f")
  "$FFMPEG" -y -hide_banner -loglevel error -i "$f" \
    -vf "hqdn3d=4:3:6:4.5,unsharp=5:5:1.0:5:5:0.0" \
    -q:v 2 "$OUT/$name"
  count=$((count + 1))
  if (( count % 50 == 0 )); then
    echo "Cleaned $count frames..."
  fi
done

echo "Cleaned frames written to $OUT ($count files)"
du -sh "$IN" "$OUT"
