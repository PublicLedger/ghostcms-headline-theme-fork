# Upstream Sync - Quick Command Reference

**Full Plan:** See [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md)

## Quick Status Check

```bash
# See what's new upstream
git fetch upstream
git log --oneline main..upstream/main --graph --decorate

# See what's different
git log --oneline upstream/main..main --graph --decorate

# Count commits
echo "Behind upstream: $(git rev-list --count main..upstream/main)"
echo "Ahead of upstream: $(git rev-list --count upstream/main..main)"
```

## Option A: Rebase (Recommended)

```bash
# 1. PREPARE
git add -A
git commit -m "feat: add devcontainer development environment"
git pull origin main
git checkout -b backup-before-upstream-sync
git checkout main
git fetch upstream

# 2. INTEGRATE
git checkout -b integrate-upstream-$(date +%Y-%m-%d)
git rebase -i upstream/main

# 3. RESOLVE CONFLICTS (as they occur)
# Edit conflicting files manually
git add <resolved-file>
git rebase --continue

# 4. MIGRATE TO PNPM
rm yarn.lock
pnpm install

# 5. UPDATE DEVCONTAINER
# Edit .devcontainer/devcontainer.json: npm → pnpm
# Edit .github/workflows/deploy-theme.yaml: yarn → pnpm

# 6. TEST
pnpm run test
pnpm run zip

# 7. COMMIT MIGRATIONS
git add pnpm-lock.yaml .devcontainer/ .github/
git commit -m "chore: migrate to pnpm package manager"

# 8. MERGE TO MAIN
git checkout main
git merge integrate-upstream-$(date +%Y-%m-%d) --ff-only
git push origin main
```

## Option B: Merge

```bash
# 1. PREPARE (same as above)
git add -A
git commit -m "feat: add devcontainer development environment"
git pull origin main
git checkout -b backup-before-upstream-sync
git checkout main
git fetch upstream

# 2. INTEGRATE
git checkout -b integrate-upstream-merge-$(date +%Y-%m-%d)
git merge upstream/main

# 3. RESOLVE ALL CONFLICTS
# Edit conflicting files manually
git add <resolved-files>
git commit

# 4-8. (same as Option A)
```

## Conflict Resolution Snippets

### package.json - Manual Merge Template
```json
{
  "name": "publicledger-headline-fork",
  "description": "A custom Ghost theme for The Public Ledger project",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": ">=24.0.0",
    "ghost": ">=6.0.0"
  },
  "license": "MIT",
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
    "ghost:dev": "echo 'Ghost dev instance available at http://localhost:3001'",
    "ghost:prod": "docker compose --profile production up -d ghost-prod db",
    "ghost:stop": "docker compose down",
    "ghost:logs": "docker compose logs -f ghost-dev",
    "ghost:restart": "docker compose restart ghost-dev"
  },
  "devDependencies": {
    "@tryghost/shared-theme-assets": "2.7.1",
    "@tryghost/theme-translations": "^0.0.9",
    "autoprefixer": "10.5.0",
    "beeper": "2.1.0",
    "cssnano": "8.0.2",
    "gscan": "6.4.1",
    "gulp": "5.0.1",
    "gulp-concat": "2.6.1",
    "gulp-livereload": "4.0.2",
    "gulp-postcss": "10.0.0",
    "gulp-uglify": "3.0.2",
    "gulp-zip": "5.1.0",
    "ordered-read-streams": "2.0.0",
    "postcss": "8.5.15",
    "postcss-easy-import": "4.0.0",
    "pump": "3.0.4"
  }
}
```

### locales/en.json - Preserve Fork Changes
```bash
# Keep these fork-specific strings:
# "Access site" (not "Access code")
# "Password" (not "Please enter a valid email address")
# Removed subscription-related messages

# Add any NEW keys from upstream that don't conflict
```

### Built Assets - Take Upstream
```bash
git checkout --theirs assets/built/screen.css
git checkout --theirs assets/built/screen.css.map
git add assets/built/
```

## Abort/Rollback Commands

```bash
# During active merge/rebase
git merge --abort
# OR
git rebase --abort

# After completed merge (undo)
git reset --hard backup-before-upstream-sync

# Restore specific file
git checkout backup-before-upstream-sync -- <file>

# Find and restore to any point
git reflog
git reset --hard <commit-hash>
```

## Testing Checklist

```bash
# 1. Clean install
rm -rf node_modules
pnpm install

# 2. Build
pnpm run dev
ls -la assets/built/

# 3. Validate
pnpm run test
pnpm run validate

# 4. Package
pnpm run zip
ls -la dist/

# 5. Devcontainer (in VS Code)
# - Reopen in Container
# - Wait for startup
# - Visit http://localhost:3001
# - Activate theme
# - Test changes

# 6. Git status
git status
git log --oneline -5
```

## Common Issues

### Conflict markers left in file
```bash
# Search for conflict markers
grep -r "<<<<<<< " .
grep -r "=======" .
grep -r ">>>>>>> " .
```

### Package install fails
```bash
# Clear cache
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Theme validation fails
```bash
# Check errors
pnpm run validate

# Compare with backup
git diff backup-before-upstream-sync
```

### Devcontainer won't start
```bash
# Rebuild container
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

**Before you start:** Read [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md) for full context and risk assessment.
