#!/usr/bin/env bash
# Same Ubuntu ffmpeg dependency as transcode-reels-hls.yml, isolated from browser CI.
set -euo pipefail
if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  sudo apt-get update
  sudo apt-get install -y ffmpeg
fi
ffmpeg -version
ffprobe -version
