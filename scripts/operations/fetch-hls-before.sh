#!/usr/bin/env bash
set -euo pipefail
# A manual validation run has no comparison commit and never schedules history.
if [[ "${GITHUB_EVENT_NAME:-}" == workflow_dispatch && -z "${BEFORE_SHA:-}" ]]; then
  exit 0
fi
[[ "${GITHUB_EVENT_NAME:-}" == push ]] || { echo 'Unsupported HLS comparison event' >&2; exit 1; }
[[ "${BEFORE_SHA:-}" =~ ^[0-9a-f]{40}$ && ! "$BEFORE_SHA" =~ ^0+$ ]] || { echo 'Missing or invalid before SHA' >&2; exit 1; }
# Fetch exactly one tree boundary, not all historical video blobs. Any fetch failure
# stops the job before planning, ffmpeg, or a media commit.
git fetch --no-tags --depth=1 origin "$BEFORE_SHA"
git cat-file -e "$BEFORE_SHA^{commit}"
