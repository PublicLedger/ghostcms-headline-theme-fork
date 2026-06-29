# Upstream Sync Checklist

Use this checklist to track your progress through the upstream integration.

**Date Started:** _______________  
**Strategy:** ☐ Rebase (recommended)  ☐ Merge  ☐ Cherry-pick

---

## Phase 1: Preparation

### Pre-Sync Tasks
- [ ] Read [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md) completely
- [ ] Review [FORK_STATUS.md](.devcontainer/FORK_STATUS.md) for current state
- [ ] Ensure you have 2-3 hours of uninterrupted time
- [ ] Verify Docker Desktop is running (for post-sync testing)

### Commit Current Work
```bash
git status
git add .devcontainer/ .dockerignore DEVCONTAINER.md routes.yaml
git add README.md package.json
git commit -m "feat: add devcontainer development environment"
```
- [ ] All devcontainer changes committed
- [ ] Commit hash: `_______________`

### Sync with Origin
```bash
git pull origin main
```
- [ ] Pulled latest from origin/main
- [ ] No merge conflicts from origin

### Create Backup
```bash
git checkout -b backup-before-upstream-sync
git checkout main
```
- [ ] Backup branch created
- [ ] Switched back to main

### Fetch Upstream
```bash
git fetch upstream
git log --oneline main..upstream/main | wc -l
```
- [ ] Upstream fetched successfully
- [ ] Number of new upstream commits: `_______________`

---

## Phase 2: Integration

### Create Integration Branch
```bash
DATE=$(date +%Y-%m-%d)
git checkout -b integrate-upstream-$DATE
```
- [ ] Integration branch created
- [ ] Branch name: `integrate-upstream-_______________`

### Start Merge/Rebase

**If using Rebase:**
```bash
git rebase -i upstream/main
```
- [ ] Interactive rebase started
- [ ] Reviewed commit list (keep all fork commits)

**If using Merge:**
```bash
git merge upstream/main
```
- [ ] Merge initiated

---

## Phase 3: Conflict Resolution

### Expected Conflicts

#### package.json
- [ ] Conflict detected
- [ ] Manually merged using template from UPSTREAM_SYNC_COMMANDS.md
- [ ] Preserved fork metadata (name, author, description)
- [ ] Preserved fork scripts (ghost:*)
- [ ] Added upstream packageManager field
- [ ] Updated all devDependencies to upstream versions
- [ ] Verified JSON syntax is valid
- [ ] `git add package.json`

#### locales/en.json
- [ ] Conflict detected (if any)
- [ ] Kept fork's "Access site" (not "Access code")
- [ ] Kept fork's "Password" (not "Please enter...")
- [ ] Kept removed subscription strings
- [ ] Added any new upstream keys
- [ ] `git add locales/en.json`

#### assets/built/*
- [ ] Conflict detected (if any)
- [ ] Accepted upstream versions: `git checkout --theirs assets/built/`
- [ ] `git add assets/built/`

#### Other files
List any unexpected conflicts:
- [ ] `_______________` - Resolution: `_______________`
- [ ] `_______________` - Resolution: `_______________`

### Continue Integration
```bash
# If rebase:
git rebase --continue

# If merge:
git commit -m "Merge upstream/main into fork"
```
- [ ] Integration completed without errors
- [ ] No conflict markers remaining (run `grep -r "<<<<<<< " .`)

---

## Phase 4: Package Manager Migration

### Remove Old Lock Files
```bash
rm yarn.lock
rm package-lock.json 2>/dev/null || true
```
- [ ] yarn.lock removed
- [ ] package-lock.json removed (if existed)

### Install with pnpm
```bash
pnpm install
```
- [ ] pnpm install completed successfully
- [ ] pnpm-lock.yaml created
- [ ] No installation errors

### Update Devcontainer
Edit `.devcontainer/devcontainer.json`:
```json
"postCreateCommand": "pnpm install && pnpm run zip"
```
- [ ] Updated postCreateCommand to use pnpm
- [ ] File saved

### Update GitHub Actions
Edit `.github/workflows/deploy-theme.yaml`:
```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 11.9.0

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build theme
  run: pnpm run zip
```
- [ ] Added pnpm setup step
- [ ] Updated install command to use pnpm
- [ ] Updated build command to use pnpm
- [ ] File saved

### Update Documentation
Update any references from npm/yarn to pnpm in:
- [ ] DEVCONTAINER.md
- [ ] README.md
- [ ] .devcontainer/QUICKREF.md

### Commit Migrations
```bash
git add pnpm-lock.yaml .devcontainer/ .github/
git add DEVCONTAINER.md README.md .devcontainer/QUICKREF.md
git commit -m "chore: migrate to pnpm package manager

- Remove yarn.lock
- Add pnpm-lock.yaml
- Update devcontainer to use pnpm
- Update GitHub Actions to use pnpm
- Update documentation references"
```
- [ ] Migration commit created
- [ ] Commit hash: `_______________`

---

## Phase 5: Testing

### Clean Build Test
```bash
rm -rf node_modules
pnpm install
```
- [ ] Clean install successful
- [ ] No dependency errors

### Build Assets
```bash
pnpm run dev
# Let it run, then Ctrl+C after build completes
```
- [ ] Build completed without errors
- [ ] Files generated in assets/built/
- [ ] No console errors

### Validate Theme
```bash
pnpm run test
```
- [ ] GScan validation passed
- [ ] No errors reported
- [ ] Note any warnings: `_______________`

### Verbose Validation
```bash
pnpm run validate
```
- [ ] Detailed validation reviewed
- [ ] Compatibility check passed

### Create Distribution
```bash
pnpm run zip
ls -lh dist/
```
- [ ] Theme zip created successfully
- [ ] File size reasonable: `_______________` MB
- [ ] Zip contains expected files: `unzip -l dist/*.zip`

### Git Status Check
```bash
git status
```
- [ ] No uncommitted changes
- [ ] No untracked files (except node_modules, dist)

---

## Phase 6: Devcontainer Testing

### Rebuild Container
In VS Code:
1. Command Palette → "Dev Containers: Rebuild Container"
2. Wait for rebuild and startup

- [ ] Container rebuilt successfully
- [ ] No build errors
- [ ] Terminal accessible

### Test Ghost Instance
1. Wait for containers to start (~1-2 min)
2. Open http://localhost:3001

- [ ] Ghost frontend loads
- [ ] No 500 errors
- [ ] Ghost Admin accessible at http://localhost:3001/ghost

### Test Theme Activation
1. Go to Ghost Admin
2. Settings → Design → Change theme
3. Select "headline"
4. Activate theme

- [ ] Theme appears in list
- [ ] Theme activates without errors
- [ ] Frontend shows theme correctly

### Test Live Reload
1. Edit a `.hbs` file (add a comment)
2. Save file
3. Refresh Ghost frontend

- [ ] Changes appear automatically
- [ ] No errors in terminal

### Test Asset Compilation
```bash
pnpm run dev
# Edit assets/css/screen.css
# Save and check browser
```
- [ ] Assets recompile on change
- [ ] Changes visible in browser
- [ ] No build errors

---

## Phase 7: Final Merge

### Review Integration Branch
```bash
git log --oneline main..integrate-upstream-$(date +%Y-%m-%d)
git diff main..integrate-upstream-$(date +%Y-%m-%d) --stat
```
- [ ] Commit history looks correct
- [ ] File changes as expected
- [ ] No unexpected modifications

### Merge to Main
```bash
git checkout main
git merge integrate-upstream-$(date +%Y-%m-%d) --ff-only
```
- [ ] Merged successfully with fast-forward
- [ ] Or: `_______________` (describe merge strategy used)

### Tag Release
```bash
git tag -a v1.1.0-upstream-sync -m "Sync with upstream TryGhost/Headline

- Integrated ~19 upstream commits
- Updated to gscan 6.4.1
- Migrated to pnpm@11.9.0
- Updated dependencies
- Preserved fork customizations"
```
- [ ] Tag created
- [ ] Tag name: `_______________`

### Push to Origin
```bash
git push origin main
git push origin --tags
```
- [ ] Pushed to origin successfully
- [ ] Tags pushed

---

## Phase 8: Verify GitHub Actions

### Check Workflow
1. Visit https://github.com/PublicLedger/ghostcms-headline-theme-fork/actions
2. Check latest workflow run

- [ ] Workflow triggered on push
- [ ] Workflow completed successfully
- [ ] Theme zip artifact created
- [ ] Release created (if workflow includes release step)

### Verify Release
If GitHub Actions creates releases:
- [ ] Release appears in Releases
- [ ] Theme zip attached to release
- [ ] Release notes generated

---

## Phase 9: Production Deployment Test

### Download Built Theme
```bash
# From dist/ or GitHub release
```
- [ ] Downloaded theme zip
- [ ] File integrity verified

### Upload to Test Ghost Instance
1. Ghost Admin → Settings → Design
2. Upload theme
3. Activate theme

- [ ] Theme uploads successfully
- [ ] No validation errors
- [ ] Theme activates without issues
- [ ] Visual inspection looks good
- [ ] No console errors

---

## Phase 10: Cleanup and Documentation

### Remove Backup Branch (Optional)
```bash
git branch -d backup-before-upstream-sync
```
- [ ] Backup branch removed
- [ ] Or: Kept for safety (delete after `_______________` days)

### Update Changelog
Create or update CHANGELOG.md with sync details:
- [ ] Documented upstream sync
- [ ] Listed major changes
- [ ] Noted breaking changes (pnpm migration)

### Update Team
- [ ] Notified team of sync completion
- [ ] Documented any required workflow changes
- [ ] Shared testing results

---

## Rollback Plan (If Needed)

If anything goes wrong:

```bash
# Option 1: Abort during merge/rebase
git merge --abort
# or
git rebase --abort

# Option 2: Reset to backup
git reset --hard backup-before-upstream-sync

# Option 3: Reset to specific commit
git reflog
git reset --hard <commit-before-sync>
```

### Rollback Checklist
- [ ] Identified issue: `_______________`
- [ ] Executed rollback command: `_______________`
- [ ] Verified working state restored
- [ ] Documented issue for future reference

---

## Success Criteria

Mark complete when ALL are true:

- [ ] ✅ All fork customizations preserved
- [ ] ✅ Upstream features integrated
- [ ] ✅ pnpm test passes
- [ ] ✅ pnpm run zip creates valid theme
- [ ] ✅ Devcontainer works correctly
- [ ] ✅ Theme activates in Ghost
- [ ] ✅ GitHub Actions successful
- [ ] ✅ No visual regressions
- [ ] ✅ Documentation updated
- [ ] ✅ Team notified

---

## Completion

**Date Completed:** _______________  
**Total Time:** _______________  
**Final Commit:** _______________  
**Final Tag:** _______________

### Notes
Document any issues encountered, deviations from plan, or lessons learned:

```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

### For Next Sync
Recommendations for future upstream syncs:

```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

---

**Status:** ☐ In Progress  ☐ Completed Successfully  ☐ Rolled Back

*Checklist Version: 1.0*
