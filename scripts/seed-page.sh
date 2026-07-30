#!/bin/sh
# Generic Ghost page seeding script
# Usage: docker exec ghost-dev sh /var/lib/ghost/content/themes/publicledger-headline-fork/scripts/seed-page.sh <fragment-file> <slug> <title>
# Example: docker exec ghost-dev sh /var/lib/ghost/content/themes/publicledger-headline-fork/scripts/seed-page.sh lancaster-county-profile.hbs lancaster-county-profile "Lancaster County Profile"

if [ "$#" -lt 3 ]; then
    echo "Usage: $0 <fragment-file> <slug> <title>"
    echo "Example: $0 lancaster-county-profile.hbs lancaster-county-profile 'Lancaster County Profile'"
    exit 1
fi

FRAGMENT_FILE="$1"
SLUG="$2"
TITLE="$3"

DB_PATH="/var/lib/ghost/content/data/ghost-dev.db"
HTML_FILE="/var/lib/ghost/content/themes/publicledger-headline-fork/data/fragments/$FRAGMENT_FILE"

if [ ! -f "$HTML_FILE" ]; then
    echo "Error: Fragment file not found: $HTML_FILE"
    exit 1
fi

echo "📄 Seeding page: $TITLE ($SLUG)..."

# Read HTML content and escape for SQL
HTML_CONTENT=$(cat "$HTML_FILE" | sed "s/'/''/g")

# Escape for JSON embedding, then wrap in Lexical JSON structure
LEXICAL_HTML=$(cat "$HTML_FILE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')
LEXICAL_JSON_ESCAPED=$(echo "{\"root\":{\"children\":[{\"type\":\"html\",\"version\":1,\"html\":\"$LEXICAL_HTML\"}],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}" | sed "s/'/''/g")

# Generate Ghost ID (24-char hex timestamp-based ID)
TIMESTAMP=$(printf '%08x' $(date +%s))
RANDOM_PART=$(openssl rand -hex 8)
GHOST_ID="${TIMESTAMP}${RANDOM_PART}"

# Generate UUID
UUID=$(cat /proc/sys/kernel/random/uuid)

# Current timestamp in ISO format
NOW=$(date -u +"%Y-%m-%d %H:%M:%S")

# Check if page already exists
EXISTING_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM posts WHERE slug='$SLUG' AND type='page';" 2>/dev/null)

if [ -n "$EXISTING_ID" ]; then
    echo "Page already exists, updating..."
    sqlite3 "$DB_PATH" <<EOF
UPDATE posts 
SET html='$HTML_CONTENT',
    lexical='$LEXICAL_JSON_ESCAPED',
    title='$TITLE',
    updated_at='$NOW'
WHERE id='$EXISTING_ID';
EOF
    echo "✓ Updated page: $SLUG"
else
    echo "Creating new page..."
    
    # Get first active user ID for author assignment
    AUTHOR_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM users WHERE status='active' LIMIT 1;")
    
    if [ -z "$AUTHOR_ID" ]; then
        echo "Error: No active users found"
        exit 1
    fi
    
    sqlite3 "$DB_PATH" <<EOF
INSERT INTO posts (
    id, uuid, title, slug, html, lexical, type, status, visibility,
    email_recipient_filter, created_at, updated_at, published_at,
    featured, show_title_and_feature_image
) VALUES (
    '$GHOST_ID',
    '$UUID',
    '$TITLE',
    '$SLUG',
    '$HTML_CONTENT',
    '$LEXICAL_JSON_ESCAPED',
    'page',
    'published',
    'public',
    'all',
    '$NOW',
    '$NOW',
    '$NOW',
    0,
    1
);

INSERT INTO posts_authors (
    id, post_id, author_id, sort_order
) VALUES (
    lower(hex(randomblob(12))),
    '$GHOST_ID',
    '$AUTHOR_ID',
    0
);
EOF
    
    echo "✓ Created page: $SLUG"
    echo "⚠️  Route registration required: Edit slug in Ghost Admin (temp change + revert) or run:"
    echo "   docker exec ghost-dev sqlite3 /var/lib/ghost/content/data/ghost-dev.db \"UPDATE posts SET slug=slug||'-temp' WHERE id='$GHOST_ID';\""
    echo "   docker exec ghost-dev sqlite3 /var/lib/ghost/content/data/ghost-dev.db \"UPDATE posts SET slug=REPLACE(slug,'-temp','') WHERE id='$GHOST_ID';\""
fi

echo "✓ Done"
