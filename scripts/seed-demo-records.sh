#!/bin/bash
# Seed one record per collection, proving every permalink shape in routes.yaml.
#
# Runs inside ghost-dev (that is where the SQLite database and node live).
# Slugs are taken from the mock @publicledger/data package so the cards have
# something real to resolve.
set -e

THEME=/var/lib/ghost/content/themes/publicledger-headline-fork
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
