# Ghost Seed Script - Production to Local Sync

## Overview

The `ghost-seed.js` script syncs Ghost Pages **from production to local** (one-way only). Optionally creates temporary test fragments for proof-of-concept when production is not configured.

## What It Does

### Production → Local Sync (Primary Purpose)

When `.env` configured with production Ghost credentials:
1. Fetches all Pages from production
2. Deletes all local Pages
3. Inserts production Pages
4. Adds temporary test fragment Pages (Commissioner, Sheriff - will be replaced)

### Fallback: Test-Only Mode

If production NOT configured:
- Creates temporary test fragment Pages only
- Allows template development without production access
- Test Pages will be replaced by real workflow soon

## Why Production → Local Only

**One-way sync ensures:**
- Production is the source of truth for editorial content
- Local development uses real fragment Pages
- No risk of overwriting production with experimental work
- Editorial team manages fragments in production CMS

**Fragment Pages = Editorial Content Blocks**

See [TEMPLATE_FRAGMENTS.md](../docs/TEMPLATE_FRAGMENTS.md) for the routes.yaml + Page fragments architecture.

## Production Sync Behavior

### Configuration Required

Create `.env` in workspace root:
```bash
GHOST_PRD_URL=https://your-production-ghost.com
GHOST_PRD_SECRET=your-admin-api-key:secret
```

Without this, script only creates test Pages (no production sync).

### Safety Guard: Local Changes Detection

When production sync IS configured, script checks for local-only Pages before deleting.

### Example Output (No Production Config)

```
=== Ghost Seed - Fragment Pages Setup ===
Target: http://localhost:2368

✓ Ghost is accessible

No production sync configured (GHOST_PRD_URL not set)
Creating test fragment Pages only...

Deleting existing local pages...
✓ Cleared local pages

Adding test page for routing proof...
✓ Created: job-agency-seat-lancaster-county-county-commissioner
✓ Created: job-agency-seat-lancaster-county-sheriff

✓ Seeded 2 fragment Pages
```

### Example Output (With Production Sync)

```
=== Ghost Seed - Fragment Pages Setup ===
Source: https://publicledger.ghost.io
Target: http://localhost:2368

✓ Ghost is accessible

Fetching pages from production...
✓ Found 8 pages in production

Found 10 pages in local database

⚠️  WARNING: Local Ghost has Pages not in production:

  • test-candidate-page - "Test Candidate Layout" (draft)
  • experimental-chart - "Chart Component Test" (published)

These Pages will be DELETED during sync.

Continue? (yes/no):
```

### User Response (Production Sync Only)

**Type `yes` or `y`** → Proceeds with sync (deletes local-only Pages)  
**Type `no` or anything else** → Cancels sync, preserves local Pages

### When Warning Appears

**Triggers when:**
- Production sync configured AND
- Local Ghost has Pages with slugs not in production

**Does NOT trigger when:**
- No production config (test-only mode)
- Local and production have identical Page slugs
- Local is a clean fresh install

## Seed Behavior

### Test-Only Mode (Default)

1. **Check** Ghost connectivity
2. **Delete** ALL local Pages (no warning - local dev environment)
3. **Create** test fragment Pages (Commissioner, Sheriff)

**Result:** Clean local Ghost with proof-of-concept fragments.

### Production Sync Mode (With .env)

1. **Fetch** all Pages from production
2. **Fetch** all Pages from local
3. **Compare** slugs to detect local-only Pages
4. *ync Behavior

### With Production Config (Intended Use)

1. **Fetch** all Pages from production Ghost
2. **Fetch** all Pages from local Ghost
3. **Compare** slugs to detect local-only Pages
4. **WarOne-Way Sync

**Architectural Benefits:**
- Production is canonical source for editorial content
- Local development uses real fragments (not stale mock data)
- No two-way sync complexity or merge conflicts
- Editorial team works in production, developers work locally with copies

**Safety:**
- Explicit warning before deleting local-only Pages
- Prevents accidental loss of experimental work
- Local is disposable (can always re-sync)
**Result:** Minimal Pages for template development. Will be replaced by production-driven workflow
## Development Workflows

### Normal Workflow: Testing with Production Fragments

**Setup .env (one-time):**
```bash
# Get Admin API key from production Ghost: Settings → Integrations → Custom Integration
GHOST_PRD_URL=https://your-production-ghost.com
GHOST_PRD_SECRET=your-api-key:secret
```

**Sync production to local:**
```bash
pnpm ghost:seed
# Type 'yes' when prompted (if local has extra Pages)
```

**Edit fragments in production, re-sync locally:**
```bash
# 1. Editorial team updates Pages in production Ghost Admin
# 2. Developer re-runs: pnpm ghost:seed
# 3. Local Ghost now has updated content
```

### Creating New Fragment Pages

**Always create in production first:**
1. Production Ghost Admin → Pages → New Page
2. Slug: `job-agency-seat-york-county-sheriff` (match route pattern)
3. Add HTML content
4. Publish
5. Run `pnpm ghost:seed` locally to pull new Page

**Never create fragments in local Ghost** - they'll be deleted on next sync.

### Want to Preserve Local Experimental Pages

**Don't.** Local Ghost is disposable. If testing experimental Pages:

```bash
# Export from Ghost Admin before sync: Settings → Labs → Export
# Saves all Pages to JSON file
# Copy experimental content to production or discard
```

## Best Practices

### Fragment Page Naming

**Follow pattern:** `{template}-{param1}-{param2}-...`

Examples:
- `job-agency-seat-lancaster-county-sheriff` (specific)
- `election-agency-seat-year-lancaster-county-sheriff-2024` (specific)
- `donor-john-smith` (specific, if slug-based donors)

**Lowercase, hyphens only** - Match URL segments exactly.
Management

**Create in production, sync to local:**
- Editorial team creates/edits fragments in production Ghost
- Developers run `pnpm ghost:seed` to pull latest
- Never create permanent fragments in local (will be deleted)

### Fragment Naming Convention

**Follow pattern:** `{template}-{param1}-{param2}-...`

Examples:
- `job-agency-seat-lancaster-county-sheriff`
- `election-agency-seat-year-lancaster-county-sheriff-2024`

**Lowercase, hyphens, match URL segments exactly.**

### Content Guidelines

**Fragment Pages contain:**
- Editorial copy (introductions, context, descriptions)
- Rich HTML formatting
- SEO-optimized content

**Fragment Pages DO NOT contain:**
- Handlebars variables (won't render)
- Dynamic data (templates handle that)
- JavaScript (data rendering in separate section

**Fix:**
```bash
docker restart ghost-dev
# Wait 10-15 seconds for Ghost to start
pnpm ghost:seed
```

### Test fragments not appearing after seed

**Verify:**
```bash
# Check routes.yaml has explicit routes
cat routes.yaml | grep "county-commissioner"

# CoPages not appearing after seed

**Verify:**
```bash
# Check if Pages were created
docker exec ghost-dev sqlite3 /var/lib/ghost/content/data/ghost-dev.db \
  "SELECT slug, title FROM posts WHERE type='page';"

# Check routes.yaml has explicit routes (if needed)
curl http://localhost:3001/jobs/lancaster-county/county-commissioner/
```

### Production sync not working

**Check .env configuration:**
```bash
# Verify .env exists with correct values
cat .env | grep GHOST_PRD

# Test production URL temporarily

**Temporarily rename .env:**
```bash
mv .env .env.backup
pnpm ghost:seed  # Creates test Pages only
mv .env.backup .env
```

**Note:** Test Pages are transitional - real workflow uses production sync.bash
mv .env .env.backup
pnpm ghost:seed
mv .env.backup .env
```

## Related Documentation

- [TEMPLATE_FRAGMENTS.md](../docs/TEMPLATE_FRAGMENTS.md) - Complete fragment pattern architecture
- [DATA_SCHEMA.md](DATA_SCHEMA.md) - Data structure for templates
- [routes.yaml](/workspace/routes.yaml) - Route configuration with `data:` properties
- [job-agency-seat.hbs](/workspace/job-agency-seat.hbs) - Example two-layer template
