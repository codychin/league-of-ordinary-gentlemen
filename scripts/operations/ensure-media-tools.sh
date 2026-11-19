#!/usr/bin/env bash
# Ubuntu's signed ffmpeg package; never download third-party binaries.
set -euo pipefail
if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  if [ "${GITHUB_ACTIONS:-}" = true ] && [ "${RUNNER_ENVIRONMENT:-}" = github-hosted ]; then
    # The CI job pins ubuntu-24.04. Fail closed if its platform contract changes.
    . /etc/os-release
    if [ "${ID:-}" != ubuntu ] || [ "${VERSION_ID:-}" != 24.04 ] || [ "${VERSION_CODENAME:-}" != noble ] || [ "$(uname -m)" != x86_64 ]; then
      echo 'Unsupported hosted media bootstrap platform' >&2
      exit 1
    fi
    keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg
    test -r "$keyring"
    sources_dir=$(mktemp -d)
    trap 'rm -rf -- "$sources_dir"' EXIT
    chmod 755 "$sources_dir"
    # Bypass unreliable regional EC2 mirrors only for these apt invocations.
    # Keep Ubuntu archive signatures mandatory; never edit system apt sources.
    cat > "$sources_dir/ubuntu.sources" <<SOURCES
Types: deb
URIs: https://archive.ubuntu.com/ubuntu/
Suites: noble noble-updates
Components: main restricted universe multiverse
Architectures: amd64
Signed-By: $keyring

Types: deb
URIs: https://security.ubuntu.com/ubuntu/
Suites: noble-security
Components: main restricted universe multiverse
Architectures: amd64
Signed-By: $keyring
SOURCES
    chmod 644 "$sources_dir/ubuntu.sources"
    apt_options=(
      -o "Dir::Etc::sourcelist=$sources_dir/ubuntu.sources"
      -o 'Dir::Etc::sourceparts=-'
      -o 'Acquire::http::Timeout=20'
      -o 'Acquire::https::Timeout=20'
      -o 'Acquire::Retries=1'
      -o 'APT::Update::Error-Mode=any'
    )
    # Separate downloads from package configuration. A hung mirror is terminated
    # before dpkg starts; no retry loop interrupts an installation transaction.
    sudo timeout --kill-after=10s 120s apt-get "${apt_options[@]}" update
    sudo timeout --kill-after=10s 240s apt-get "${apt_options[@]}" install -y --download-only --no-install-recommends ffmpeg
    sudo timeout --kill-after=10s 180s apt-get "${apt_options[@]}" install -y --no-download --no-install-recommends ffmpeg
  else
    # Preserve behavior on local/self-hosted machines; no source override there.
    sudo apt-get update
    sudo apt-get install -y --no-install-recommends ffmpeg
  fi
fi
ffmpeg -version
ffprobe -version
