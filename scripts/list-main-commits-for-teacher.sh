#!/usr/bin/env bash
# Print main-branch commit history with dates for CBSD / teacher review.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

git fetch origin main >/dev/null 2>&1 || true

echo "Branch: main"
echo "Remote: $(git remote get-url origin 2>/dev/null || echo n/a)"
echo "Total commits: $(git rev-list --count origin/main)"
echo
printf '%-12s %-26s %s\n' "SHORT" "AUTHOR_DATE" "SUBJECT"
git log origin/main --format='%h|%aI|%s' | while IFS='|' read -r short author subject; do
  printf '%-12s %-26s %s\n' "$short" "$author" "$subject"
done
