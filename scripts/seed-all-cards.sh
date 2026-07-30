#!/bin/bash
# Seed all production card pages
# Usage: ./scripts/seed-all-cards.sh

set -e

SCRIPT_DIR="/var/lib/ghost/content/themes/publicledger-headline-fork/scripts"

echo "🚀 Seeding all production cards..."
echo

# Lancaster County Profile (census demographics)
docker exec ghost-dev sh "$SCRIPT_DIR/seed-page.sh" \
    lancaster-county-profile.hbs \
    lancaster-county-profile \
    "Lancaster County Profile"

echo

# Municipal Turnout 2025 (voter participation funnel)
docker exec ghost-dev sh "$SCRIPT_DIR/seed-page.sh" \
    municipal-turnout-2025.hbs \
    municipal-turnout-2025 \
    "Municipal Turnout 2025"

echo

# Sheriff Election 2023 (election result with winner viz)
docker exec ghost-dev sh "$SCRIPT_DIR/seed-page.sh" \
    sheriff-election-2023.hbs \
    sheriff-election-2023 \
    "Sheriff Election 2023"

echo

# Commissioner Top Donors (campaign finance)
docker exec ghost-dev sh "$SCRIPT_DIR/seed-page.sh" \
    commissioner-top-donors.hbs \
    commissioner-top-donors \
    "Commissioner Top Donors"

echo
echo "✅ All cards seeded"
echo "⚠️  If any were newly created, route registration required:"
echo "   Visit Ghost Admin and temporarily change each slug, then change back"
