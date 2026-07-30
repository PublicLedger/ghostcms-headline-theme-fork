#!/bin/bash
# Refresh Ghost routes without container restart
# Uses Admin API to re-upload routes.yaml, triggering route registration

set -e

GHOST_INTERNAL_URL="http://localhost:2368"
THEME_NAME="publicledger-headline-fork"
ROUTES_SOURCE="/var/lib/ghost/content/themes/${THEME_NAME}/routes.yaml"
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
#
# Must be a multipart file upload with field name "routes". Sending the YAML as a
# raw body with Content-Type: text/x-yaml is rejected by Ghost 6 with
# "Please select a YAML file." A successful upload returns "{}".
echo "📤 Uploading routes.yaml..."
UPLOAD_RESPONSE=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST \
    -H "Origin: http://localhost:3001" \
    -H "Referer: http://localhost:3001/ghost/" \
    -H "Accept: application/json" \
    -F "routes=@${ROUTES_SOURCE};type=application/x-yaml" \
    "${GHOST_INTERNAL_URL}/ghost/api/admin/settings/routes/yaml/")

if echo "$UPLOAD_RESPONSE" | grep -q "errors"; then
    echo "⚠️  Routes upload failed"
    echo "Response: $UPLOAD_RESPONSE"
    rm -f "$COOKIE_JAR"
    exit 1
fi
echo "✅ Routes uploaded"

# Re-activate the theme so Ghost re-reads its template list.
# Setting active_theme directly in SQLite (as ghost-setup.sh does on first run) does
# NOT refresh Ghost's cache, and routes then fail with "Missing template X.hbs".
echo "🎨 Re-reading theme templates..."
ACTIVATE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X PUT \
    -H "Origin: http://localhost:3001" \
    -H "Referer: http://localhost:3001/ghost/" \
    -H "Accept: application/json" \
    "${GHOST_INTERNAL_URL}/ghost/api/admin/themes/${THEME_NAME}/activate/")

if echo "$ACTIVATE_RESPONSE" | grep -q '"themes"'; then
    echo "✅ Theme templates reloaded"
else
    echo "⚠️  Theme re-activation may have failed"
    echo "Response: $ACTIVATE_RESPONSE"
fi

# Cleanup
rm -f "$COOKIE_JAR"

echo ""
echo "ℹ️  Note: Ghost automatically reloads routes after API upload - no restart needed!"
