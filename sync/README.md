# Upstream Sync

This directory contains tools and documentation for syncing the PublicLedger fork with the upstream TryGhost/Headline repository.

**Upstream:** https://github.com/TryGhost/Headline  
**Fork:** https://github.com/PublicLedger/ghostcms-headline-theme-fork  
**Last Sync:** 2026-06-29 (commit 73ee6a5)

---

## Quick Sync

```bash
./sync/upstream-sync.sh
```

The script will:
1. Check working directory is clean
2. Fetch latest from upstream
3. Show what's new
4. Create a backup branch
5. Rebase onto upstream/main
6. Rebuild assets with pnpm
7. Run GScan validation
8. Provide next steps

---

## Manual Sync

### 1. Prepare

```bash
# Commit current work
git add -A
git commit -m "Your commit message"

# Create backup
git checkout -b backup-before-sync
git checkout staging

# Fetch upstream
git fetch upstream
git log --oneline staging..upstream/main  # See what's new
```

### 2. Integrate

```bash
# Rebase (recommended)
git checkout -b integrate-upstream-$(date +%Y-%m-%d)
git rebase upstream/main

# Resolve conflicts as they occur (see Conflict Resolution below)
git add <resolved-file>
git rebase --continue
```

### 3. Update Dependencies

```bash
# Clean install with pnpm
rm -rf node_modules
pnpm install

# Rebuild assets
pnpm dev  # Let it build, then Ctrl+C
```

### 4. Test

```bash
# Validate theme
pnpm test

# Build production zip
pnpm zip

# Test in devcontainer
pnpm ghost:restart
# Visit http://localhost:3001
```

### 5. Merge and Push

```bash
git checkout staging
git merge integrate-upstream-$(date +%Y-%m-%d) --ff-only
git push origin staging --force-with-lease
```

---

## Protected Fork Files

These customizations **must be preserved** during sync:

### package.json

**Keep from fork:**
- `name`: "publicledger-headline-fork"
- `description`: Custom description
- `author`: Gasworks Data info
- `engines.node`: ">=24.0.0"
- `engines.ghost`: ">=6.0.0"
- Custom `scripts`: ghost:dev, ghost:prod, ghost:logs, ghost:restart, ghost:stop

**Take from upstream:**
- `packageManager`: "pnpm@11.9.0"
- All `devDependencies` versions
- Standard `scripts`: dev, test, zip, validate

**Remove after upstream sync (fork has hardcoded these):**
- `config.custom.title_font` - Fork uses Cardo (fonts-custom.css)
- `config.custom.body_font` - Fork uses Manrope (fonts-custom.css)
- `config.custom.navigation_layout` - Fork hardcoded "Logo on the left"
- `config.custom.header_style` - Fork hardcoded "Light"
- `config.custom.white_publication_logo_for_transparent_header` - Not used
- `config.custom.enter_tag_slugs_for_primary_sections` - Custom homepage sections
- `config.custom.enter_tag_slugs_for_secondary_sections` - Custom homepage sections

**Keep fork-only settings:**
- `config.custom.footer_publisher_logo` - Publisher logo upload
- `config.custom.funding_credit` - Site-wide funding credit text

### default.hbs

**Fork modifications:**
- Body class: Hardcoded `is-head-left-logo` (removed navigation_layout logic)
- Header style: Hardcoded to "Light" (removed header_style logic)  
- Logo: Single logo only (removed white_publication_logo_for_transparent_header)
- Search button: Hardcoded placement (removed navigation_layout conditionals)

### routes.yaml

**Fork-specific routing** - Forces static homepage

```yaml
routes:
  /:
    data: page.home
    template: page    # Uses page.hbs with Ghost page slug "home"
```

**Strategy during sync**: Keep fork routes.yaml, accept upstream only if intentionally switching to posts homepage

### home.hbs

**Fork modifications:**
- Removed `@custom.enter_tag_slugs_for_primary_sections` conditionals (setting deleted)
- Removed `@custom.enter_tag_slugs_for_secondary_sections` conditionals (setting deleted)
- Shows default behavior: top 3 tags (grid) + tags 4-6 (list)

**Note:** Not actually used - routes.yaml forces static page homepage

### locales/en.json

**Fork customizations to preserve:**
- "Access site" (not "Access code")
- "Password" (not "Please enter a valid email address")
- Removed subscription-related strings

**Strategy:** Keep fork strings, add any new upstream keys

### assets/css/fonts-custom.css

**Fork-specific custom fonts** - Does not exist upstream

Import custom fonts here to avoid conflicts with upstream `fonts.css`. Already imported in `screen.css`.

### assets/css/footer-custom.css

**Fork-specific custom footer styles** - Does not exist upstream

Styles for the custom footer design. Already imported in `screen.css`.

### partials/footer-custom.hbs

**Fork-specific custom footer template** - Does not exist upstream

Custom footer with page-content hybrid approach:
- Uses Ghost Pages: `footer-about`, `footer-tagline` (rich HTML content)
- Uses `{{@custom.footer_publisher_logo}}` - Publisher logo image
- Uses `{{@custom.funding_credit}}` - Site-wide funding credit text
- Uses `{{navigation type="secondary"}}` - Footer navigation links
- Hardcoded CTA links: `/about`, `/tools`
- Hardcoded legal links: `/site-map`, `/design-reference`

**Strategy during sync**: Keep fork footer partial, restore if accidentally overwritten

### assets/css/screen.css

**Fork modifications:**
- Imports `fonts-custom.css` (Cardo + Manrope)
- Imports `footer-custom.css` (custom footer styles)

**Strategy during sync**: Keep fork imports, add any new upstream imports

### Other Protected Files

- `.devcontainer/` - Fork-specific setup (no upstream equivalent)
- `.github/workflows/` - Fork deployment automation
- `README.FORK.md` - Fork documentation
- `AGENTS.FORK.md` - Fork agent docs
- `.gitignore` - Fork patterns
- `AI_DEVELOPMENT.md` - Fork docs (was AGENTS.md, upstream conflict resolved)

---

## Conflict Resolution

### Built Assets

**Always accept upstream versions:**

```bash
git checkout --theirs assets/built/screen.css
git checkout --theirs assets/built/main.min.js
git add assets/built/
```

Then rebuild after merge: `pnpm dev`

### package.json

**Manual merge required:**

```json
{
  "name": "publicledger-headline-fork",
  "description": "A custom Ghost theme for The Public Ledger project",
  "version": "1.0.0",
  "engines": {
    "node": ">=24.0.0",
    "ghost": ">=6.0.0"
  },
  "author": {
    "name": "Gasworks Data",
    "email": "info@gasworksdata.com",
    "url": "https://gasworksdata.com"
  },
  "packageManager": "pnpm@11.9.0",
  "scripts": {
    "dev": "gulp",
    "test": "gscan .",
    "zip": "gulp zip",
    "validate": "gscan . --verbose",
    "ghost:dev": "echo 'Ghost dev at http://localhost:3001'",
    "ghost:prod": "docker compose --profile production up -d ghost-prod db",
    "ghost:stop": "docker compose down",
    "ghost:logs": "docker compose logs -f ghost-dev",
    "ghost:restart": "docker compose restart ghost-dev"
  },
  "devDependencies": {
    // Take ALL from upstream (latest versions)
  }
}
```

### Conflict Markers

**Check for leftover markers:**

```bash
grep -r "<<<<<<< " .
grep -r "=======" .
grep -r ">>>>>>> " .
```

---

## Testing Checklist

### Build Verification

```bash
# Clean install
rm -rf node_modules
pnpm install

# Build assets
pnpm dev  # Watch output for errors, then Ctrl+C

# Check built files
ls -la assets/built/screen.css assets/built/main.min.js
```

### Theme Validation

```bash
# GScan validation (must pass)
pnpm test

# Verbose output
pnpm validate

# Production build
pnpm zip
ls -lh dist/*.zip
```

### Devcontainer Testing

1. Rebuild container: "Dev Containers: Rebuild Container"
2. Wait for Ghost startup (~1-2 min)
3. Visit http://localhost:3001/ghost
4. Settings → Design → Activate "headline" theme
5. Test live reload: Edit a .hbs file, refresh browser
6. Test asset compilation: `pnpm dev`, edit CSS, check browser

### Visual Regression

1. Check homepage layout
2. Test post single view
3. Verify author page
4. Test tag archives
5. Check mobile responsiveness
6. Verify no console errors (F12)

---

## Rollback Procedures

### During Active Merge/Rebase

```bash
# Abort and return to pre-merge state
git merge --abort
# OR
git rebase --abort
```

### After Completed Merge

```bash
# Option 1: Reset to backup branch
git reset --hard backup-before-sync

# Option 2: Find and reset to specific commit
git reflog
git reset --hard <commit-hash>

# Option 3: Restore specific files
git checkout backup-before-sync -- <file>
```

### Clean Slate

```bash
# If everything is broken
git checkout staging
git reset --hard origin/staging
rm -rf node_modules
pnpm install
```

---

## Success Criteria

Sync is complete when **all** of these pass:

- ✅ `pnpm test` passes (GScan validation)
- ✅ `pnpm zip` creates valid theme
- ✅ Theme activates in Ghost without errors
- ✅ Devcontainer starts and runs Ghost
- ✅ Live reload works for templates
- ✅ Asset compilation works (`pnpm dev`)
- ✅ No visual regressions on test content
- ✅ GitHub Actions workflow succeeds
- ✅ All fork customizations preserved
- ✅ Documentation updated

---

## Risk Assessment

### High Risk ⚠️

- **package.json**: Complex manual merge required
- **Dependency updates**: May introduce breaking changes
- **GScan version changes**: Stricter validation rules

### Medium Risk ⚡

- **Localization conflicts**: Fork has custom strings
- **Built assets**: Must rebuild after sync
- **CSS/JS changes**: May affect custom styles

### Low Risk ✅

- **Devcontainer files**: No upstream equivalent
- **GitHub workflows**: Fork-specific
- **Documentation files**: Fork-specific (.FORK.md pattern)

### Mitigation

1. Always create backup branch before sync
2. Use integration branch for testing
3. Comprehensive testing before merging to staging
4. Keep working devcontainer backup
5. Document all conflict resolutions

---

## Maintenance Schedule

**Recommended:** Check for upstream updates monthly

```bash
# Quick check
git fetch upstream
git log --oneline staging..upstream/main

# Count commits behind
git rev-list --count staging..upstream/main
```

**When to sync:**
- Security updates in dependencies
- Major Ghost version support added
- Useful new features
- Bug fixes affecting fork

**When to skip:**
- Purely cosmetic upstream changes
- Features not needed in fork
- Too close to production deployment

---

## Files in This Directory

- **upstream-sync.sh** - Interactive sync script with validation
- **README.md** - This file (sync documentation)

For complete upstream sync history, see `/memories/repo/startup.md`
