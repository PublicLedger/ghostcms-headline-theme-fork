#!/bin/bash
set -e

# Upstream Sync Helper Script
# Helps sync PublicLedger fork with TryGhost/Headline upstream
#
# Usage:
#   ./upstream-sync.sh          - Sync with upstream
#   ./upstream-sync.sh rollback - Restore most recent backup
#
# Strategy: MERGE, not rebase. This fork carries ~67 commits on top of
# upstream, and package.json diverges from upstream in almost every sync. A
# rebase replays all 67 commits and asks you to resolve the same package.json
# conflict once per touching commit -- a one-line upstream `packageManager`
# bump was enough to stall a rebase at commit 8 of 65 and leave the working
# tree detached mid-operation. The same sync as a merge is one conflict in one
# file, resolved once.
#
# Merging also keeps `staging` history append-only, so it stays a fast-forward
# from `main` and needs no force-push. Rebasing rewrote every fork commit,
# which would break the staging -> main PR flow that
# .github/workflows/guard-main-source.yaml depends on.

UPSTREAM_REPO="https://github.com/TryGhost/Headline.git"
UPSTREAM_REMOTE="upstream"
BACKUP_BRANCH="backup-before-sync-$(date +%Y%m%d-%H%M%S)"

# Rollback mode
if [[ "$1" == "rollback" ]]; then
    echo "=== Rollback Upstream Sync ==="
    echo ""

    # Sort by refname, NOT committerdate. Backup branches are created from the
    # current HEAD, so two backups made hours apart from the same commit share
    # an identical committerdate -- exactly what happens when a sync is aborted
    # and retried. On that tie git falls back to ascending refname and picks the
    # OLDEST backup, and the `git reset --hard` below then silently discards the
    # newer work. The names are zero-padded timestamps, so lexicographic
    # descending order is reliably newest-first.
    LATEST_BACKUP=$(git branch --list 'backup-before-sync-*' --sort=-refname | head -1 | xargs)

    if [[ -z "$LATEST_BACKUP" ]]; then
        echo "❌ No backup branches found (backup-before-sync-*)"
        exit 1
    fi

    echo "📊 Found backup: $LATEST_BACKUP"
    echo "   Points at: $(git log -1 --format='%h %ci %s' "$LATEST_BACKUP")"
    echo ""
    echo "   All backups (newest first):"
    git branch --list 'backup-before-sync-*' --sort=-refname | sed 's/^/   /'
    echo ""
    echo "   Commits that will be LOST:"
    git log --oneline "$LATEST_BACKUP"..HEAD | head -10 | sed 's/^/   /'
    echo ""

    read -p "⚠️  Reset current branch to $LATEST_BACKUP? This will LOSE current commits. (yes/no) " -r
    if [[ ! $REPLY == "yes" ]]; then
        echo "❌ Rollback cancelled"
        exit 0
    fi

    # A failed sync leaves MERGE_HEAD behind; reset --hard alone would leave the
    # repo believing a merge is still in progress.
    if [[ -f .git/MERGE_HEAD ]]; then
        echo "🧹 Aborting in-progress merge..."
        git merge --abort || true
    fi

    CURRENT_BRANCH=$(git branch --show-current)
    echo "🔄 Resetting $CURRENT_BRANCH to $LATEST_BACKUP..."
    git reset --hard "$LATEST_BACKUP"

    echo "🧹 Cleaning workspace..."
    git clean -fd

    echo "✅ Rollback complete"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Verify state: git log --oneline -5"
    echo "  2. Delete backup: git branch -D $LATEST_BACKUP"
    echo "  3. Force push ONLY if the bad sync was already pushed:"
    echo "     git push origin $CURRENT_BRANCH --force-with-lease"
    exit 0
fi

echo "=== PublicLedger Headline Fork - Upstream Sync ==="
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || ! grep -q "publicledger-headline-fork" package.json; then
    echo "❌ Error: Not in the fork repository root"
    exit 1
fi

# Refuse to start on top of an unfinished operation
if [[ -f .git/MERGE_HEAD ]] || [[ -d .git/rebase-merge ]] || [[ -d .git/rebase-apply ]]; then
    echo "❌ Error: a merge or rebase is already in progress"
    echo "   Finish it, or run: ./sync/upstream-sync.sh rollback"
    exit 1
fi

# Check working directory is clean
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Working directory has uncommitted changes"
    echo ""
    git status -s
    echo ""
    read -p "Commit changes first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        read -p "Commit message: " commit_msg
        git commit -m "$commit_msg"
    else
        echo "❌ Please commit or stash changes first"
        exit 1
    fi
fi

# Configure upstream remote if needed
if ! git remote | grep -q "^${UPSTREAM_REMOTE}$"; then
    echo "🔧 Adding upstream remote: $UPSTREAM_REPO"
    git remote add $UPSTREAM_REMOTE $UPSTREAM_REPO
fi

# Fetch upstream
echo "📥 Fetching upstream..."
git fetch $UPSTREAM_REMOTE main

# Show what's new
NEW_COMMITS=$(git rev-list --count HEAD..${UPSTREAM_REMOTE}/main)
echo ""
echo "📊 Upstream has $NEW_COMMITS new commits"
echo ""

if [[ $NEW_COMMITS -eq 0 ]]; then
    echo "✅ Already up-to-date with upstream"
    exit 0
fi

echo "Recent upstream changes:"
git log --oneline --graph --decorate HEAD..${UPSTREAM_REMOTE}/main | head -20
echo ""
echo "Files upstream touched:"
git diff --stat HEAD...${UPSTREAM_REMOTE}/main | tail -20
echo ""

read -p "Continue with sync? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Sync cancelled"
    exit 0
fi

# Create backup branch. Push it too: the local-only backup did not survive the
# force-push the old rebase flow recommended.
echo "💾 Creating backup branch: $BACKUP_BRANCH"
git branch $BACKUP_BRANCH
if git push origin "$BACKUP_BRANCH" --quiet 2>/dev/null; then
    echo "   Pushed to origin (delete after confirming the sync)"
else
    echo "   ⚠️  Could not push backup to origin - it exists locally only"
fi

# Merge upstream
echo "🔄 Merging upstream/main..."
if git merge --no-edit ${UPSTREAM_REMOTE}/main; then
    echo "✅ Merge successful!"
else
    echo ""
    echo "⚠️  Merge conflicts detected in:"
    git diff --name-only --diff-filter=U | sed 's/^/     /'
    echo ""
    echo "Expected conflicts and resolutions:"
    echo "  • package.json - the usual one. Keep fork name/description/author/"
    echo "    contributors/engines and the ghost:*, validate:fork, lint*, format*"
    echo "    scripts; take upstream's packageManager and devDependency versions."
    echo "    Keep the config.custom block deleted (see sync/README.md)."
    echo "  • assets/built/* - regenerated by the build; take either side then"
    echo '    rerun `pnpm zip`'
    echo "  • README.md - keep upstream content plus the fork note at top"
    echo "  • locales/en.json - preserve custom strings, merge new upstream keys"
    echo ""
    echo "After resolving conflicts:"
    echo "  git add <resolved-files>"
    echo "  git commit          # completes the merge"
    echo "  pnpm install && pnpm zip && pnpm test"
    echo ""
    echo "To abort:"
    echo "  git merge --abort                     # back to pre-merge state"
    echo "  ./sync/upstream-sync.sh rollback      # or restore the backup branch"
    exit 1
fi

# Rebuild assets
echo "🔨 Rebuilding assets..."
pnpm install
pnpm zip

# Validate
echo "✅ Running fork + theme validation..."
pnpm test

echo ""
echo "=== Sync Complete ==="
echo ""
echo "📊 Changes:"
git log --oneline ${UPSTREAM_REMOTE}/main..HEAD | wc -l | xargs echo "Fork commits on top of upstream:"
echo ""
echo "🎯 Next steps:"
echo "  1. Full fork validation: ./scripts/validate-fork.sh"
echo "  2. Reload routes and check the site: pnpm ghost:refresh && pnpm ghost:verify"
echo "     (Ghost itself must be restarted from the HOST -- pnpm ghost:restart"
echo "      exits with an error on purpose, it hangs the devcontainer terminal:"
echo "      docker compose restart ghost-dev)"
echo "  3. Review changes: git log --oneline ${UPSTREAM_REMOTE}/main..HEAD"
echo "  4. Push to staging: git push origin staging"
echo "     (a plain push -- merging keeps history append-only, no force needed)"
echo ""
echo "💾 Backup branch: $BACKUP_BRANCH"
echo "   Delete after confirming sync:"
echo "     git branch -D $BACKUP_BRANCH && git push origin --delete $BACKUP_BRANCH"
echo ""
echo "⚠️  To rollback: ./sync/upstream-sync.sh rollback"
