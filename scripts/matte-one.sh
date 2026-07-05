#!/bin/bash
# Single-clip AI matting test: cut the figure out of the off-white MoveKit clip
# and export a transparent VP9-alpha WebM. Tool: rembg (isnet-general-use) + ffmpeg.
set -e
export PATH="/opt/homebrew/bin:$HOME/Library/Python/3.9/bin:$PATH"

SLUG="${1:-barbell-squat}"
SRC="$HOME/Desktop/full-library/$SLUG.mp4"
WORK="/tmp/movekit-matte/$SLUG"
OUT="/tmp/movekit-alpha"
MODEL="isnet-general-use"

rm -rf "$WORK"; mkdir -p "$WORK/frames" "$WORK/cut" "$OUT"

echo "[1/3] extracting frames (half-res) from $SLUG …"
ffmpeg -v error -i "$SRC" -vf "scale=968:-2" -vsync 0 "$WORK/frames/%04d.png"
echo "      frames: $(ls "$WORK/frames" | wc -l | tr -d ' ')"

echo "[2/3] matting with rembg ($MODEL) — first run downloads the model …"
rembg p -m "$MODEL" "$WORK/frames" "$WORK/cut"
echo "      cut frames: $(ls "$WORK/cut" | wc -l | tr -d ' ')"

echo "[3/3] encoding transparent VP9-alpha WebM (30fps) …"
ffmpeg -v error -framerate 30 -i "$WORK/cut/%04d.png" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -an "$OUT/$SLUG.webm"

ls -la "$OUT/$SLUG.webm"
echo "DONE → $OUT/$SLUG.webm"
