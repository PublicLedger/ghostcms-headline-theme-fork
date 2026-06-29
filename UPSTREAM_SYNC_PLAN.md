# Upstream Sync Plan: TryGhost/Headline Integration

## Executive Summary

This document outlines the strategy for pulling latest changes from the upstream TryGhost/Headline repository while preserving fork-specific customizations and the new devcontainer setup.

**Last Analysis:** 2026-06-28  
**Upstream Repository:** https://github.com/TryGhost/Headline  
**Fork Repository:** https://github.com/PublicLedger/ghostcms-headline-theme-fork

---

## Current State Analysis

### Repository Status
- ✅ Upstream remote already configured
- ✅ Currently 2 commits behind origin/main  
- 📝 Working directory has uncommitted devcontainer changes
- 🔀 Fork is **5 commits ahead** of upstream/main
- 📥 Upstream has **~19 new commits** since fork diverged

### Upstream Remote
```bash
upstream: https://github.com/TryGhost/Headline.git
```

### Fork's Custom Commits (5 total)
```
0aaccc5 - chore: add permissions section for GitHub Actions workflow
8b3c074 - chore: update GitHub Actions workflow for theme deployment
5e136ac - Update localization strings for access and subscription messages
1dc0eec - remove unnecessary entries from .gitignore
a7afb07 - GitHub deploy action; gitginore pattern for repo
```

### Uncommitted Changes (New)
```
Modified:
  - README.md (devcontainer documentation)
  - package.json (added ghost:* scripts)

New Files:
  - .devcontainer/ (complete devcontainer setup)
  - .dockerignore
  - DEVCONTAINER.md
  - routes.yaml (was untracked)
```

---

## Key Upstream Changes Since Fork

### Major Updates (~19 commits)
1. **Package Manager Migration** (commit 277b173)
   - Switched from `yarn` to `pnpm@11.9.0`
   - Added `packageManager` field to package.json
   - Rebuilt assets for pnpm node_modules layout

2. **Dependency Updates**
   - gscan: 5.x → 6.4.1 (may have breaking changes)
   - cssnano: 7.x → 8.x
   - postcss: 8.4.x → 8.5.x
   - Various build tool updates

3. **CI/CD Enhancements**
   - Added GitHub Actions CI gates
   - Mirror gscan CI workflows
   - Theme zip packaging improvements (fixes for excluding docs)
   - Archive export ignores

4. **New Features**
   - Site-wide social links support (#515)
   - Pending translations shipped

5. **Build System**
   - Updated gulpfile zipper function
   - Per-theme build-script policy
   - New CSS preprocessor versions (8.0.2)

### Files Modified in Upstream (Potential Conflicts)
- `package.json` - ⚠️ **HIGH CONFLICT RISK**
- `assets/built/*` - Built files (auto-generated)
- Localization files - ⚠️ **MODERATE CONFLICT RISK**
- No `.gitignore` in upstream (fork added it)

---

## Fork-Specific Customizations to Preserve

### 1. Package Metadata (`package.json`)
```json
{
  "name": "publicledger-headline-fork",
  "description": "A custom Ghost theme for The Public Ledger project",
  "engines": {
    "node": ">=24.0.0",
    "ghost": ">=6.0.0"
  },
  "author": {
    "name": "Gasworks Data",
    "email": "info@gasworksdata.com",
    "url": "https://gasworksdata.com"
  }
}
```

### 2. Custom Scripts (`package.json`)
```json
{
  "scripts": {
    "ghost:dev": "...",
    "ghost:prod": "...",
    "ghost:logs": "...",
    "ghost:restart": "...",
    "validate": "..."
  }
}
```

### 3. Localization Customizations (`locales/en.json`)
- Changed "Access code" → "Access site"
- Changed "Please enter a valid email address" → "Password"
- Removed several unused strings
- Custom subscription messaging

### 4. GitHub Actions Workflow (`.github/workflows/deploy-theme.yaml`)
- Custom deployment to PublicLedger Ghost instance
- Node.js 24 specification
- Automated releases with versioning
- Uses fork-specific theme name

### 5. Git Configuration (`.gitignore`, `.nvmrc`)
- Custom gitignore patterns
- Node version specification

### 6. **NEW: Devcontainer Setup** (uncommitted)
- Complete Docker-based development environment
- Multi-container orchestration
- Enhanced documentation
- Development convenience scripts

---

## Recommended Sync Strategy

### Strategy: **Selective Cherry-Pick with Rebase**

This approach gives maximum control and preserves fork history while integrating upstream improvements.

### Phase 1: Prepare Current State ✅
**Before any upstream merge:**

1. **Commit devcontainer changes** (current working directory)
   ```bash
   git add .devcontainer/ .dockerignore DEVCONTAINER.md routes.yaml
   git add README.md package.json
   git commit -m "feat: add devcontainer development environment
   
   - Complete Docker-based Ghost development setup
   - Local preview with auto-reload
   - Enhanced npm scripts for Ghost management
   - Comprehensive documentation"
   ```

2. **Sync with origin** (you're 2 commits behind)
   ```bash
   git pull origin main
   ```

3. **Create backup branch**
   ```bash
   git checkout -b backup-before-upstream-sync
   git checkout main
   ```

### Phase 2: Analyze Conflicts 🔍

1. **Test merge to identify conflicts**
   ```bash
   git checkout -b test-upstream-merge
   git merge upstream/main --no-commit --no-ff
   # Review conflicts
   git merge --abort
   git checkout main
   git branch -D test-upstream-merge
   ```

2. **Review specific file conflicts**
   ```bash
   git diff main...upstream/main -- package.json
   git diff main...upstream/main -- locales/en.json
   git diff main...upstream/main -- assets/built/
   ```

### Phase 3: Integration Approach 🔀

**Option A: Rebase onto Upstream (RECOMMENDED)**
```bash
# Create integration branch
git checkout -b integrate-upstream-2026-06

# Rebase fork commits onto latest upstream
git rebase -i upstream/main

# During rebase:
# - Keep all fork commits
# - Resolve conflicts in package.json (preserve fork metadata + add pnpm)
# - Resolve locales/en.json (keep fork's custom strings)
# - Accept upstream's built assets
# - Keep fork's .github/workflows/
```

**Option B: Merge with Manual Resolution**
```bash
# Create integration branch
git checkout -b integrate-upstream-merge-2026-06

# Merge upstream
git merge upstream/main

# Manually resolve:
# - package.json: Combine fork metadata + upstream dependencies
# - locales/en.json: Preserve fork strings, add any new upstream keys
# - Accept upstream built assets
# - Keep fork workflows
```

**Option C: Fresh Fork + Re-apply Customizations (SAFEST but most work)**
```bash
# Start fresh from upstream
git checkout -b fresh-fork-2026-06 upstream/main

# Cherry-pick fork commits one by one
git cherry-pick a7afb07  # GitHub deploy action
git cherry-pick 1dc0eec  # gitignore
git cherry-pick 5e136ac  # localization
git cherry-pick 8b3c074  # workflow update
git cherry-pick 0aaccc5  # permissions
git cherry-pick <devcontainer-commit>  # New devcontainer setup

# Resolve conflicts during each cherry-pick
```

---

## Conflict Resolution Guide

### 1. `package.json` Conflicts

**Keep from Fork:**
- `name`: "publicledger-headline-fork"
- `description`: Custom description
- `author`: Gasworks Data info
- `engines.node`: ">=24.0.0"
- `engines.ghost`: ">=6.0.0"
- Custom `scripts`: ghost:dev, ghost:prod, etc.

**Take from Upstream:**
- `packageManager`: "pnpm@11.9.0"
- All `devDependencies` versions
- Standard `scripts`: dev, test, zip

**Merge Strategy:**
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
    // Take ALL from upstream (latest versions)
  }
}
```

### 2. `locales/en.json` Conflicts

**Strategy:** Keep fork's customizations, add any new upstream keys

```bash
# Use a JSON merge tool or manually review
# Fork changes to preserve:
- "Access site" (not "Access code")
- "Password" (not "Please enter a valid email address")
- Removed unused strings (keep removed)
```

### 3. Built Assets (`assets/built/*`)

**Strategy:** Accept upstream versions, rebuild after merge

```bash
# During merge:
git checkout --theirs assets/built/

# After merge:
npm install  # or pnpm install
npm run dev
```

### 4. GitHub Workflow Files

**Strategy:** Keep fork's workflow (it's fork-specific)

```bash
# The fork's .github/workflows/deploy-theme.yaml is custom
# Upstream doesn't have this file, so no conflict expected
```

### 5. `.gitignore` and `.nvmrc`

**Strategy:** Keep fork versions (upstream doesn't have them)

---

## Package Manager Migration

### Current Situation
- **Fork uses:** npm/yarn (has `yarn.lock`)
- **Upstream uses:** pnpm@11.9.0 (as of latest commits)

### Migration Steps Post-Merge

1. **Update devcontainer** to use pnpm:
   ```json
   // .devcontainer/devcontainer.json
   "postCreateCommand": "pnpm install && pnpm run zip"
   ```

2. **Update GitHub Actions**:
   ```yaml
   # .github/workflows/deploy-theme.yaml
   - uses: pnpm/action-setup@v4
     with:
       version: 11.9.0
   
   - name: Install dependencies
     run: pnpm install --frozen-lockfile
   
   - name: Build theme
     run: pnpm run zip
   ```

3. **Clean up old lock files**:
   ```bash
   rm yarn.lock
   rm package-lock.json  # if exists
   ```

4. **Generate pnpm lock**:
   ```bash
   pnpm install
   git add pnpm-lock.yaml
   ```

5. **Update documentation** to reference pnpm instead of npm/yarn

---

## Testing Plan Post-Merge

### 1. Build Verification
```bash
# Clean install
rm -rf node_modules
pnpm install

# Test build
pnpm run dev

# Verify built assets
ls -la assets/built/
```

### 2. Theme Validation
```bash
# Should pass with gscan 6.4.1
pnpm run test

# Verbose validation
pnpm run validate
```

### 3. Devcontainer Testing
```bash
# Reopen in container
# Verify Ghost starts
# Check http://localhost:3001
# Activate theme
# Test live reload
```

### 4. GitHub Actions
```bash
# Push to test branch
git push origin integrate-upstream-2026-06

# Verify workflow runs
# Check theme zip creation
# Verify deployment (if applicable)
```

### 5. Production Build
```bash
pnpm run zip

# Verify dist/publicledger-headline-fork.zip
unzip -l dist/*.zip

# Upload to Ghost instance for final testing
```

---

## Step-by-Step Execution Plan

### Pre-Merge Checklist
- [ ] Commit all current devcontainer work
- [ ] Pull latest from origin/main
- [ ] Create backup branch
- [ ] Fetch latest upstream changes
- [ ] Review upstream CHANGELOG if available

### Merge Execution (Option A - Rebase)
```bash
# 1. Prepare
git checkout main
git add -A
git commit -m "feat: add devcontainer development environment"
git pull origin main
git checkout -b backup-before-upstream-sync
git checkout main
git fetch upstream

# 2. Create integration branch
git checkout -b integrate-upstream-$(date +%Y-%m-%d)

# 3. Rebase
git rebase -i upstream/main

# 4. Resolve conflicts as they appear
# For each conflict:
#   - Edit files per conflict resolution guide above
#   - git add <file>
#   - git rebase --continue

# 5. Verify
pnpm install
pnpm run test
pnpm run dev  # Test build

# 6. Test devcontainer
# Reopen in container, verify everything works

# 7. Merge to main
git checkout main
git merge integrate-upstream-$(date +%Y-%m-%d) --ff-only

# 8. Push
git push origin main
```

### Post-Merge Tasks
- [ ] Migrate to pnpm (remove yarn.lock, add pnpm-lock.yaml)
- [ ] Update devcontainer.json for pnpm
- [ ] Update GitHub Actions for pnpm
- [ ] Update documentation references
- [ ] Run full test suite
- [ ] Test theme in Ghost devcontainer
- [ ] Create release tag
- [ ] Deploy to staging/test environment

---

## Ongoing Maintenance Strategy

### Regular Sync Schedule
**Recommended:** Monthly check for upstream updates

```bash
# Quick upstream check
git fetch upstream
git log --oneline main..upstream/main

# If updates available, repeat integration process
```

### Automated Monitoring
Consider setting up GitHub Actions to:
- Weekly check for upstream updates
- Create PR automatically when updates detected
- Run tests on merged version

### Example Workflow
```yaml
# .github/workflows/upstream-sync-check.yml
name: Check Upstream Updates
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check upstream
        run: |
          git fetch upstream
          BEHIND=$(git rev-list --count main..upstream/main)
          echo "Commits behind: $BEHIND"
          if [ $BEHIND -gt 0 ]; then
            echo "::warning::Fork is $BEHIND commits behind upstream"
          fi
```

---

## Risk Assessment

### High Risk Items ⚠️
- **package.json merge**: Complex, needs careful manual merge
- **pnpm migration**: Breaking change in package manager
- **gscan 6.x**: May have stricter validation rules

### Medium Risk Items ⚡
- **Localization conflicts**: Fork has custom strings
- **Built assets**: Need rebuild after merge
- **Dependency updates**: May introduce bugs

### Low Risk Items ✅
- **Devcontainer files**: No upstream equivalent
- **GitHub workflows**: Fork-specific
- **Documentation**: Fork-specific

### Mitigation Strategies
1. ✅ Create backup branch before any changes
2. ✅ Use test branch for integration
3. ✅ Comprehensive testing before merging to main
4. ✅ Keep backup of working devcontainer setup
5. ✅ Document all manual conflict resolutions

---

## Rollback Plan

If integration fails:

```bash
# Option 1: Abort during merge/rebase
git merge --abort
# or
git rebase --abort

# Option 2: Reset to backup
git checkout main
git reset --hard backup-before-upstream-sync

# Option 3: Recover specific files
git checkout backup-before-upstream-sync -- <file>

# Option 4: Full restore
git reflog  # Find commit hash before merge
git reset --hard <commit-hash>
```

---

## Success Criteria

Integration is successful when:

- ✅ All fork customizations preserved
- ✅ Latest upstream features integrated
- ✅ `pnpm test` passes with gscan 6.4.1
- ✅ `pnpm run zip` creates valid theme
- ✅ Devcontainer starts and runs Ghost
- ✅ Theme activates in Ghost without errors
- ✅ GitHub Actions workflow succeeds
- ✅ No visual regressions on demo content
- ✅ All npm scripts work as expected
- ✅ Documentation is updated and accurate

---

## Questions to Resolve Before Merging

1. **Package Manager**: Migrate to pnpm now or later?
   - **Recommendation:** Do it as part of upstream sync
   - **Rationale:** Upstream uses it, easier to track upstream changes

2. **Lock files**: Keep in repo or gitignore?
   - **Note:** Upstream doesn't commit lock files
   - **Recommendation:** Follow upstream pattern (ignore lock files)

3. **Built assets**: Commit or gitignore?
   - **Note:** Upstream commits `assets/built/`
   - **Recommendation:** Follow upstream pattern (commit built assets)

4. **Node version**: Keep 24+ or allow broader range?
   - **Recommendation:** Keep >=24 for devcontainer, but don't restrict theme

5. **Devcontainer**: Keep npm or switch to pnpm?
   - **Recommendation:** Switch to pnpm to match upstream/production

---

## Additional Resources

- Upstream Repository: https://github.com/TryGhost/Headline
- Ghost Theme Documentation: https://ghost.org/docs/themes/
- GScan Tool: https://gscan.ghost.org/
- pnpm Documentation: https://pnpm.io/
- Git Rebase Guide: https://git-scm.com/book/en/v2/Git-Branching-Rebasing

---

## Conclusion

**Recommended Approach:** Option A (Rebase onto Upstream)

**Timeline Estimate:**
- Preparation: 15 minutes
- Merge/rebase execution: 30-60 minutes
- Conflict resolution: 30-45 minutes  
- Testing: 45-60 minutes
- **Total: 2-3 hours**

**Next Step:** Commit devcontainer changes, then proceed with Phase 1 preparation.

---

*Document Version: 1.0*  
*Last Updated: 2026-06-28*  
*Author: GitHub Copilot (Analysis)*
