#!/usr/bin/env bash
# Runs ONCE when the devcontainer is created (postCreateCommand).
#
# Leaves the container with a working end-to-end proof: Ghost collections routing
# /jobs/{agency}/{seat}/ and friends to Posts whose bodies hold inert card shells,
# populated at request time from the @publicledger/data package.
#
# Deliberately not postStartCommand: ghost:seed deletes every page with no prompt,
# so running this on each start would destroy local edits.
# Re-run by hand any time with: bash .devcontainer/post-create.sh
set -euo pipefail

cd /workspace
THEME_IN_GHOST=/var/lib/ghost/content/themes/publicledger-headline-fork

echo "→ Installing dependencies..."
pnpm install

echo "→ Building theme assets..."
# Also copies the mock @publicledger/data package into assets/built/data/,
# which is what the card renderers fetch at runtime.
pnpm gulp build

echo "→ Waiting for Ghost setup (admin account + theme activation)..."
# Marker is written by .devcontainer/ghost-setup.sh into the theme mount, which is
# this same bind mount. Also poll Ghost itself so a stale marker from a previous
# build can't let us race ahead of a Ghost that isn't up yet.
# Port 2368, not 3001: this service shares ghost-dev's network namespace.
if ! timeout 180 bash -c '
      until [ -f /workspace/.ghost-setup-complete ] \
            && curl -sf http://localhost:2368/ghost/ >/dev/null 2>&1; do
        sleep 2
      done'; then
  echo "⚠ Ghost did not become ready in 180s — skipping seed."
  echo "  Check 'pnpm ghost:logs', then re-run: bash .devcontainer/post-create.sh"
  exit 0
fi
echo "✓ Ghost is ready"

# ---------------------------------------------------------------------------
# ORDER IS LOAD-BEARING. ghost:seed wipes every page before inserting, so it must
# run FIRST. Seeding records before it would delete them.
# ---------------------------------------------------------------------------

# 1. Published pages from production (optional — needs a Content API key).
if [ -n "${GHOST_PRD_KEY:-}" ] && [ "${GHOST_PRD_KEY}" != "<content-api-key>" ]; then
  echo "→ Seeding published pages from production..."
  pnpm ghost:seed || echo "⚠ Production seed failed — continuing."
else
  echo "⊘ GHOST_PRD_KEY unset — skipping production seed (see .env.example)"
fi

# 2. One demo record per collection. Must follow step 1, never precede it.
echo "→ Seeding demo records (one per collection)..."
bash /workspace/scripts/ghost-exec.sh sh "$THEME_IN_GHOST/scripts/seed-demo-records.sh"

# 3. Upload routes.yaml and re-read the theme.
#    Both are API calls: a raw-body routes upload is rejected by Ghost 6, and
#    writing active_theme straight into SQLite leaves the template cache stale.
echo "→ Uploading routes and reloading theme..."
pnpm ghost:refresh

# NOTE: do NOT restart ghost-dev from here. This container uses
# `network_mode: service:ghost-dev`, so it borrows ghost-dev's network namespace.
# Bouncing ghost-dev tears that namespace down and leaves this container with only
# `lo` — no eth0, no DNS — until it is itself restarted. seed-record.js goes through
# the Admin API precisely so no restart is needed: Ghost registers the new URLs
# immediately. (If you ever do restart ghost-dev by hand, restart the devcontainer
# after it or its networking stays dead.)

echo "→ Verifying collection routes..."
bash "$PWD/scripts/verify-routes.sh" || echo "⚠ Some routes did not resolve (see above)"

echo ""
echo "✓ Ready — http://localhost:3001/"
