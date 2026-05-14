#!/usr/bin/env bash
# Replay feature-only commits onto main while preserving author/committer timestamps.
# Use only if a normal merge is not possible (e.g. main was rewritten).
# Usage: ./scripts/cherry-pick-feature-to-main-preserve-dates.sh [feature-branch]
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

FEATURE_BRANCH="${1:-feature/cbsd-component-refactoring}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

git fetch origin
git checkout main
git pull --ff-only origin main

mapfile -t COMMITS < <(git rev-list --reverse "main..origin/$FEATURE_BRANCH")

if ((${#COMMITS[@]} == 0)); then
  echo "No commits to replay from origin/$FEATURE_BRANCH."
  exit 0
fi

for commit in "${COMMITS[@]}"; do
  author_date="$(git log -1 --format=%aI "$commit")"
  committer_date="$(git log -1 --format=%cI "$commit")"
  subject="$(git log -1 --format=%s "$commit")"
  echo "Cherry-picking $commit ($subject)"
  GIT_AUTHOR_DATE="$author_date" GIT_COMMITTER_DATE="$committer_date" \
    git cherry-pick "$commit"
done

git push origin main
echo "Replayed ${#COMMITS[@]} commits onto main with preserved timestamps."
