#!/bin/bash
# Seed one record per collection, proving every permalink shape in routes.yaml.
#
# This file declares WHICH records exist. scripts/seed-record.js owns HOW each one is
# made — template, cards, Lexical body, Admin API upsert.
#
# `pnpm ghost:records` runs this inside ghost-dev, but it no longer has to be there:
# seed-record.js talks to Ghost over the Admin API and never touches SQLite, and both
# containers have node and reach Ghost on the same port (they share a network
# namespace). An earlier header claimed the SQLite database was the reason; it was not.
# The theme root is resolved from this script's own location so either path works.
#
# Slugs are taken from the mock @publicledger/data package so the cards have
# something real to resolve.
set -e

THEME="$(cd "$(dirname "$0")/.." && pwd)"
SEED="node $THEME/scripts/seed-record.js"

echo "🌱 Seeding one record per collection..."
echo

# /jobs/{agency}/{seat}/
$SEED job lancaster-county county-commissioner "County Commissioner"
echo
# /official/{slug}/
$SEED official - alice-yoder "Alice Yoder"
echo
# /election/{jurisdiction}/{slug}/
$SEED election lancaster-county 2023-primary "2023 Primary"
echo
# /donor/{slug}/
$SEED donor - pa-chamber-pac "PA Chamber PAC"
echo
# /lookup/{jurisdiction}/
$SEED lookup - lancaster-county "Lancaster County"
echo
# /finance/{jurisdiction}/
$SEED finance - lancaster-county-finance "Lancaster County Campaign Finance"

echo
echo "✅ Seeded 6 records."
echo "   Seeded through the Admin API, so Ghost registers the URLs immediately."
echo "   No restart needed — and restarting ghost-dev would break the devcontainer,"
echo "   which shares its network namespace."
