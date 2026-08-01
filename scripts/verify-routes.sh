#!/bin/bash
# Verify every collection permalink shape in routes.yaml actually resolves.
# Exits non-zero if any expected route fails, so devcontainer startup and CI can
# both treat a broken routing config as a hard failure.
#
# Runs from the devcontainer (port 2368, shared network namespace with ghost-dev)
# or from the host (port 3001). Override with GHOST_TEST_URL.

if [ -n "$GHOST_TEST_URL" ]; then
    BASE="$GHOST_TEST_URL"
elif curl -sf --max-time 3 http://localhost:2368/ >/dev/null 2>&1; then
    BASE="http://localhost:2368"
else
    BASE="http://localhost:3001"
fi

echo "Verifying routes against $BASE"

# route|expected status
CHECKS="
/jobs/|200
/jobs/lancaster-county/county-commissioner/|200
/official/|200
/official/alice-yoder/|200
/election/|200
/election/lancaster-county/2023-primary/|200
/donor/|200
/donor/pa-chamber-pac/|200
/lookup/|200
/lookup/lancaster-county/|200
/finance/|200
/finance/lancaster-county-finance/|200
/jobs/lancaster-county/does-not-exist/|404
"

FAILED=0
for line in $CHECKS; do
    [ -z "$line" ] && continue
    route="${line%|*}"
    expected="${line##*|}"
    actual=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE}${route}")

    if [ "$actual" = "$expected" ]; then
        printf '  \033[32m✓\033[0m %-46s %s\n' "$route" "$actual"
    else
        printf '  \033[31m✗\033[0m %-46s %s (expected %s)\n' "$route" "$actual" "$expected"
        FAILED=$((FAILED + 1))
    fi
done

echo
if [ "$FAILED" -gt 0 ]; then
    echo "✗ $FAILED route(s) failed"
    exit 1
fi
echo "✓ All routes resolved"
