#!/bin/sh
# Auto-setup Ghost: create admin account and activate theme
# Runs inside ghost-dev container on startup

DB_PATH="/var/lib/ghost/content/data/ghost-dev.db"
GHOST_URL="http://localhost:3001"  # Use external URL matching Ghost's url config
GHOST_INTERNAL_URL="http://localhost:2368"  # Internal port for API checks
THEME_NAME="headline"
SETUP_MARKER="/var/lib/ghost/content/themes/headline/.ghost-setup-complete"
LOG_FILE="/var/lib/ghost/content/logs/ghost-setup.log"

ADMIN_EMAIL="${GHOST_ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${GHOST_ADMIN_PASSWORD:-RandomSecure123456789}"
ADMIN_NAME="${GHOST_ADMIN_NAME:-PublicLedger Admin}"
SITE_TITLE="${GHOST_SITE_TITLE:-The Public Ledger}"

# Function to log to both console and file
log() {
    echo "$@" | tee -a "$LOG_FILE"
}

log "[ghost-setup] Starting Ghost auto-setup..."
log "[ghost-setup] Log: $LOG_FILE"

# ============================================================================
# STEP 1: Wait for Ghost to start
# ============================================================================

log "[ghost-setup] Waiting for Ghost to start..."
MAX_ATTEMPTS=150  # 5 minutes (150 × 2s)
ATTEMPT=0
GHOST_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    # Check if Ghost homepage is responding (use internal URL for health check)
    if curl -sf "${GHOST_INTERNAL_URL}/ghost/" > /dev/null 2>&1; then
        log "[ghost-setup] ✓ Ghost is running"
        GHOST_READY=true
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    if [ $((ATTEMPT % 15)) -eq 0 ]; then
        log "[ghost-setup]   Still waiting... ($ATTEMPT/$MAX_ATTEMPTS) - $(($ATTEMPT * 2))s elapsed"
    fi
    sleep 2
done

if [ "$GHOST_READY" = false ]; then
    log "[ghost-setup] ⚠ Warning: Ghost didn't respond within 5 minutes"
    log "[ghost-setup] Continuing anyway - setup can be re-run manually"
fi

# ============================================================================
# STEP 2: Create admin account (if needed)
# ============================================================================

if [ "$GHOST_READY" = true ]; then
    SETUP_CHECK=$(curl -s "${GHOST_INTERNAL_URL}/ghost/api/admin/authentication/setup/")
    SETUP_NEEDED=$(echo "$SETUP_CHECK" | grep -o '"status":false')

    if [ -z "$SETUP_NEEDED" ]; then
        log "[ghost-setup] ✓ Admin account already exists"
    else
        log "[ghost-setup] Creating admin account..."
        
        SETUP_DATA=$(cat <<EOF
{
  "setup": [{
    "name": "${ADMIN_NAME}",
    "email": "${ADMIN_EMAIL}",
    "password": "${ADMIN_PASSWORD}",
    "blogTitle": "${SITE_TITLE}"
  }]
}
EOF
)

        SETUP_RESPONSE=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "${SETUP_DATA}" \
            "${GHOST_INTERNAL_URL}/ghost/api/admin/authentication/setup/")

        if echo "$SETUP_RESPONSE" | grep -q "users"; then
            log "[ghost-setup] ✓ Admin account created"
            log "[ghost-setup]   Email: ${ADMIN_EMAIL}"
            log "[ghost-setup]   Password: ${ADMIN_PASSWORD}"
        else
            log "[ghost-setup] ⚠ Failed to create admin account"
            log "[ghost-setup]   Response: $SETUP_RESPONSE"
        fi
    fi
else
    log "[ghost-setup] ⊘ Skipping admin account creation (Ghost not ready)"
fi

# ============================================================================
# STEP 3: Wait for database to be fully ready
# ============================================================================

log "[ghost-setup] Waiting for database tables..."
MAX_WAIT=60
WAITED=0
DB_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    if [ -f "$DB_PATH" ]; then
        if sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='settings';" 2>/dev/null | grep -q "settings"; then
            log "[ghost-setup] ✓ Database ready"
            DB_READY=true
            break
        fi
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ "$DB_READY" = false ]; then
    log "[ghost-setup] ⚠ Warning: Database not ready after ${MAX_WAIT}s"
    log "[ghost-setup] Skipping remaining setup steps"
else
    # Wait for Ghost to finish initializing (settings table populated)
    log "[ghost-setup] Waiting for Ghost initialization..."
    MAX_INIT_WAIT=30
    INIT_WAITED=0
    while [ $INIT_WAITED -lt $MAX_INIT_WAIT ]; do
        SETTING_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM settings;" 2>/dev/null)
        if [ "$SETTING_COUNT" -gt 0 ]; then
            log "[ghost-setup] ✓ Ghost initialization complete"
            break
        fi
        sleep 1
        INIT_WAITED=$((INIT_WAITED + 1))
    done
fi

if [ $INIT_WAITED -ge $MAX_INIT_WAIT ]; then
    log "[ghost-setup] ✗ Timeout waiting for Ghost initialization"
    exit 1
fi

# ============================================================================
# STEP 4: Upload routes.yaml via session authentication
# ============================================================================

if [ "$GHOST_READY" = true ] && [ "$DB_READY" = true ]; then
    # Upload routes.yaml if theme has one
    ROUTES_SOURCE="/var/lib/ghost/content/themes/headline/routes.yaml"

    if [ -f "$ROUTES_SOURCE" ]; then
        log "[ghost-setup] Uploading routes.yaml from theme..."
        
        # Login to get session cookie (routes endpoint requires session auth, not API tokens)
        # Use internal port consistently to avoid Origin/CORS issues
        COOKIE_JAR="/tmp/ghost-cookies.txt"
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
            -H "Origin: ${GHOST_INTERNAL_URL}" \
            -d "${LOGIN_DATA}" \
            "${GHOST_INTERNAL_URL}/ghost/api/admin/session/")
        
        if [ -f "$COOKIE_JAR" ] && grep -q "ghost-admin-api-session" "$COOKIE_JAR" 2>/dev/null; then
            log "[ghost-setup] ✓ Authenticated as admin"
            
            # Upload routes.yaml using session cookie with consistent origin
            UPLOAD_RESPONSE=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST \
                -H "Content-Type: text/x-yaml" \
                -H "Origin: ${GHOST_INTERNAL_URL}" \
                -H "Referer: ${GHOST_INTERNAL_URL}/ghost/" \
                -H "Accept: application/json" \
                --data-binary @"$ROUTES_SOURCE" \
                "${GHOST_INTERNAL_URL}/ghost/api/admin/settings/routes/yaml/")
            
            if echo "$UPLOAD_RESPONSE" | grep -q "routes"; then
                log "[ghost-setup] ✓ Theme routing configuration uploaded"
            else
                log "[ghost-setup] ⚠ Failed to upload routes.yaml"
                log "[ghost-setup]   Response: $UPLOAD_RESPONSE"
            fi
            
            rm -f "$COOKIE_JAR"
        else
            log "[ghost-setup] ⚠ Failed to authenticate for routes upload"
            log "[ghost-setup]   Login response: $LOGIN_RESPONSE"
            log "[ghost-setup]   You can upload routes.yaml manually via Settings > Labs > Routes"
        fi
    else
        log "[ghost-setup] No routes.yaml in theme (using Ghost defaults)"
    fi
else
    log "[ghost-setup] ⊘ Skipping routes upload (Ghost/DB not ready)"
fi

# ============================================================================
# STEP 5: Activate theme (if needed)
# ============================================================================

if [ "$DB_READY" = true ]; then
    CURRENT_THEME=$(sqlite3 "$DB_PATH" "SELECT value FROM settings WHERE key='active_theme';" 2>/dev/null | tr -d '"')

    if [ "$CURRENT_THEME" = "$THEME_NAME" ]; then
        log "[ghost-setup] ✓ Theme '$THEME_NAME' already active"
    else
        log "[ghost-setup] Activating theme: $THEME_NAME"
        
        sqlite3 "$DB_PATH" "UPDATE settings SET value='\"$THEME_NAME\"' WHERE key='active_theme';" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            NEW_THEME=$(sqlite3 "$DB_PATH" "SELECT value FROM settings WHERE key='active_theme';" 2>/dev/null | tr -d '"')
            log "[ghost-setup] ✓ Theme activated: $NEW_THEME"
            
            # Trigger Ghost to reload
            killall -HUP node 2>/dev/null || log "[ghost-setup]   (Could not signal reload, theme will load on next restart)"
        else
            log "[ghost-setup] ⚠ Failed to activate theme"
        fi
    fi
else
    log "[ghost-setup] ⊘ Skipping theme activation (DB not ready)"
fi

# ============================================================================
# Done
# ============================================================================

log "[ghost-setup] ✓ Setup complete!"
log "[ghost-setup]   Ghost Admin: http://localhost:3001/ghost/"
log "[ghost-setup]   Login: ${ADMIN_EMAIL}"

# Show production seeding hint only if .env doesn't exist in the theme directory
if [ ! -f "/var/lib/ghost/content/themes/headline/.env" ]; then
    if [ -z "$GHOST_PRD_URL" ] && [ -z "$GHOST_PRD_SECRET" ]; then
        log "[ghost-setup]"
        log "[ghost-setup] To seed from production:"
        log "[ghost-setup]   1. Create .env with GHOST_PRD_URL and GHOST_PRD_SECRET"
        log "[ghost-setup]   2. Run: pnpm ghost:seed"
    fi
fi

# Create marker file for devcontainer to detect completion
touch "$SETUP_MARKER"
log "[ghost-setup] Marker created: $SETUP_MARKER"
echo ""

exit 0
