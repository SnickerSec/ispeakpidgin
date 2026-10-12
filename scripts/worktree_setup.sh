#!/usr/bin/env bash
# Prepares a fresh git worktree so an agent can run tests and tools in it
# straight away. Paseo runs it from paseo.json's worktree.setup when it creates
# a worktree; run it by hand in any other worktree.
#
# Best-effort on purpose: Paseo deletes the worktree when a setup command exits
# non-zero, so a failed install would cost an unattended agent its whole run.
# A step that fails warns here instead.
#
# Does not run `npm run build`: it pulls live Supabase data and optimizes
# images, and `npm test` falls back to offline mock mode without it.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

warn() { echo "worktree_setup: WARNING: $*" >&2; }

# Gitignored local config and credentials from the checkout this worktree came
# from (Paseo sets PASEO_SOURCE_CHECKOUT_PATH). Never overwrites an existing file.
src="${PASEO_SOURCE_CHECKOUT_PATH:-}"
if [ -n "$src" ] && [ "$src" != "$PWD" ]; then
  for f in .env .env.local google-search-console-key.json google-credentials.json; do
    if [ -f "$src/$f" ] && [ ! -e "$f" ]; then
      cp "$src/$f" "$f" && echo "worktree_setup: copied $f"
    fi
  done
fi

# Same install CI uses; npm's cache keeps it fast.
npm ci --prefer-offline --no-audit --no-fund --loglevel=error ||
  warn "npm ci failed; run 'npm ci' before npm test"

exit 0
