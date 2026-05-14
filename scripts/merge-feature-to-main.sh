#!/usr/bin/env bash
# Publish feature branch work onto main (default branch) so GitHub shows full history.
# Usage: ./scripts/merge-feature-to-main.sh [feature-branch]
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

if git merge-base --is-ancestor "origin/$FEATURE_BRANCH" main; then
  echo "main already contains origin/$FEATURE_BRANCH."
  exit 0
fi

git merge --no-ff "origin/$FEATURE_BRANCH" -m "merge: publish $FEATURE_BRANCH commits to main"
git push origin main

echo "Published $(git rev-list --count main) commits on main."
git log --oneline -10 main
