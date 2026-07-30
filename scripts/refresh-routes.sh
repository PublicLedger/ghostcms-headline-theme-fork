#!/bin/bash
# Refresh Ghost routes without container restart
# Uses Admin API to re-upload routes.yaml, triggering route registration

set -e

GHOST_INTERNAL_URL="http://localhost:2368"
ROUTES_SOURCE="/var/lib/ghost/content/themes/publicledger-headline-fork/routes.yaml"
ADMIN_EMAIL="${GHOST_ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${GHOST_ADMIN_PASSWORD:-RandomSecure123456789}"
COOKIE_JAR="/tmp/ghost-routes-refresh-cookies.txt"

echo "🔄 Refreshing Ghost routes without restart..."

# Check if routes.yaml exists
if [ ! -f "$ROUTES_SOURCE" ]; then
    echo "❌ Error: routes.yaml not found at $ROUTES_SOURCE"
    exit 1
fi

# Login to get session cookie
echo "🔐 Authenticating..."
rm -f "$COOKIE_JAR"

LOGIN_DATA=$(cat <<EOF
{
  "username": "${ADMIN_EMAIL}",
  "password": "${ADMIN_PASSWORD}"
}
EOF
)

LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:3001" \
    -d "${LOGIN_DATA}" \
    "${GHOST_INTERNAL_URL}/ghost/api/admin/session/")

if [ ! -f "$COOKIE_JAR" ] || ! grep -q "ghost-admin-api-session" "$COOKIE_JAR" 2>/dev/null; then
    echo "❌ Authentication failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Authenticated"

# Upload routes.yaml
echo "📤 Uploading routes.yaml..."
UPLOAD_RESPONSE=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST \
    -H "Content-Type: text/x-yaml" \
    -H "Origin: http://localhost:3001" \
    -H "Referer: http://localhost:3001/ghost/" \
    -H "Accept: application/json" \
    --data-binary @"$ROUTES_SOURCE" \
    "${GHOST_INTERNAL_URL}/ghost/api/admin/settings/routes/yaml/")

if echo "$UPLOAD_RESPONSE" | grep -q "routes"; then
    echo "✅ Routes refreshed successfully"
    echo ""
    echo "📍 Your custom routes are now active:"
    echo "   http://localhost:3001/lancaster-county-profile/"
    echo "   http://localhost:3001/sheriff-election-2023/"
    echo "   http://localhost:3001/municipal-turnout-2025/"
    echo "   http://localhost:3001/commissioner-top-donors/"
else
    echo "⚠️  Routes upload may have failed"
    echo "Response: $UPLOAD_RESPONSE"
fi

# Cleanup
rm -f "$COOKIE_JAR"

echo ""
echo "ℹ️  Note: Ghost automatically reloads routes after API upload - no restart needed!"
