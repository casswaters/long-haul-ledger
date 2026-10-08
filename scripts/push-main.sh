#!/usr/bin/env bash
# Push local commits to main safely while bots and other runs push too.
# Fetches, rebases onto the newest origin/main (autostash), pushes; retries 5 times.
# ROADMAP.md and RESEARCH-RUNS.md use the union merge driver (.gitattributes), so two runs
# editing the same lines (Last updated, Shipped list) keep both instead of stopping the rebase.
# Usage: scripts/push-main.sh
set -euo pipefail
branch="${1:-main}"
for attempt in 1 2 3 4 5; do
  git fetch --quiet origin "$branch"
  if ! git rebase --autostash --quiet "origin/$branch"; then
    echo "Rebase stopped on a conflict (attempt $attempt):" >&2
    git status --short | grep -E '^(UU|AA|DU|UD) ' >&2 || true
    git rebase --abort || true
    echo "Resolve by hand: git pull --rebase, fix the files listed above, then rerun this script." >&2
    exit 2
  fi
  if git push --quiet origin "HEAD:$branch"; then
    echo "Pushed $(git rev-parse --short HEAD) to $branch (attempt $attempt)."
    exit 0
  fi
  echo "Push rejected (attempt $attempt); a bot or another run pushed first. Retrying on the new tip."
  sleep $((attempt * 5))
done
echo "Could not push after 5 attempts." >&2
exit 1
