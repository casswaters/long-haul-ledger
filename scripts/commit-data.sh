#!/usr/bin/env bash
# Commit generated data files on top of the LATEST branch tip and push, retrying.
# Overlapping push/schedule/manual runs can't conflict: the generated files are
# snapshotted, the checkout is reset to origin/<branch>, the snapshot is laid back
# on top (generated files are whole-file outputs, so the newest run wins), then pushed.
# Usage: scripts/commit-data.sh "<commit message>" <path> [<path>...]
# Writes changed=true|false to $GITHUB_OUTPUT when set.
set -euo pipefail
msg="$1"; shift
branch="${GITHUB_REF_NAME:-main}"
out="${GITHUB_OUTPUT:-/dev/null}"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

paths=()
for p in "$@"; do [ -e "$p" ] && paths+=("$p"); done
if [ ${#paths[@]} -eq 0 ]; then echo "No data paths exist; nothing to commit."; echo "changed=false" >> "$out"; exit 0; fi

snap="$(mktemp -d)/data.tar"
tar -cf "$snap" -- "${paths[@]}"

for attempt in 1 2 3 4 5; do
  git fetch --quiet origin "$branch"
  git reset --quiet --hard "origin/$branch"
  tar -xf "$snap"
  git add -A -- "${paths[@]}"
  if git diff --cached --quiet; then
    echo "Data unchanged versus latest origin/$branch; nothing to commit."
    echo "changed=false" >> "$out"
    exit 0
  fi
  git commit --quiet -m "$msg"
  if git push origin "HEAD:$branch"; then
    echo "Pushed data commit $(git rev-parse --short HEAD) (attempt $attempt)."
    echo "changed=true" >> "$out"
    exit 0
  fi
  echo "Push rejected (attempt $attempt); retrying on the new tip…"
  sleep $((attempt * 5))
done
echo "Could not push data after 5 attempts." >&2
exit 1
