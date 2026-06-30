#!/bin/bash
set -e

# Upstream Sync Helper Script
# Helps sync PublicLedger fork with TryGhost/Headline upstream
#
# Usage:
#   ./upstream-sync.sh          - Sync with upstream
#   ./upstream-sync.sh rollback - Restore most recent backup

UPSTREAM_REPO="https://github.com/TryGhost/Headline.git"
UPSTREAM_REMOTE="upstream"
BACKUP_BRANCH="backup-before-sync-$(date +%Y%m%d-%H%M%S)"

# Rollback mode
if [[ "$1" == "rollback" ]]; then
    echo "=== Rollback Upstream Sync ==="
    echo ""
    
    # Find most recent backup branch
    LATEST_BACKUP=$(git branch --list 'backup-before-sync-*' --sort=-committerdate | head -1 | xargs)
    
    if [[ -z "$LATEST_BACKUP" ]]; then
        echo "❌ No backup branches found (backup-before-sync-*)"
        exit 1
    fi
    
    echo "📊 Found backup: $LATEST_BACKUP"
    echo "   Created: $(git log -1 --format=%ci $LATEST_BACKUP)"
    echo ""
    git log --oneline $LATEST_BACKUP..HEAD | head -10
    echo ""
    
    read -p "⚠️  Reset current branch to $LATEST_BACKUP? This will LOSE current commits. (yes/no) " -r
    if [[ ! $REPLY == "yes" ]]; then
        echo "❌ Rollback cancelled"
        exit 0
    fi
    
    CURRENT_BRANCH=$(git branch --show-current)
    echo "🔄 Resetting $CURRENT_BRANCH to $LATEST_BACKUP..."
    git reset --hard $LATEST_BACKUP
    
    echo "🧹 Cleaning workspace..."
    git clean -fd
    
    echo "✅ Rollback complete"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Verify state: git log --oneline -5"
    echo "  2. Delete backup: git branch -D $LATEST_BACKUP"
    echo "  3. Force push if already pushed: git push origin $CURRENT_BRANCH --force-with-lease"
    exit 0
fi

echo "=== PublicLedger Headline Fork - Upstream Sync ==="
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || ! grep -q "publicledger-headline-fork" package.json; then
    echo "❌ Error: Not in the fork repository root"
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
git fetch $UPSTREAM_REMOTE

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

read -p "Continue with sync? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Sync cancelled"
    exit 0
fi

# Create backup branch
echo "💾 Creating backup branch: $BACKUP_BRANCH"
git branch $BACKUP_BRANCH

# Rebase onto upstream
echo "🔄 Rebasing onto upstream/main..."
if git rebase ${UPSTREAM_REMOTE}/main; then
    echo "✅ Rebase successful!"
else
    echo ""
    echo "⚠️  Rebase conflicts detected"
    echo ""
    echo "Common conflicts and resolutions:"
    echo "  • assets/built/* - Remove from git: git rm --cached assets/built/*"
    echo "  • package.json - Merge deps, keep fork name/author/engines"
    echo "  • README.md - Keep upstream content + fork note at top"
    echo "  • locales/en.json - Preserve custom strings"
    echo ""
    echo "After resolving conflicts:"
    echo "  git add <resolved-files>"
    echo "  git rebase --continue"
    echo ""
    echo "To abort and restore backup:"
    echo "  git rebase --abort"
    echo "  git checkout $BACKUP_BRANCH"
    exit 1
fi

# Rebuild assets
echo "🔨 Rebuilding assets..."
pnpm install
pnpm zip

# Validate
echo "✅ Running GScan validation..."
pnpm test

echo ""
echo "=== Sync Complete ==="
echo ""
echo "📊 Changes:"
git log --oneline ${UPSTREAM_REMOTE}/main..HEAD | wc -l | xargs echo "Fork commits on top of upstream:"
echo ""
echo "🎯 Next steps:"
echo "  1. Test in devcontainer: pnpm ghost:restart"
echo "  2. Review changes: git log --oneline ${UPSTREAM_REMOTE}/main..HEAD"
echo "  3. Push to staging: git push origin staging --force-with-lease"
echo ""
echo "💾 Backup branch: $BACKUP_BRANCH"
echo "   (Delete after confirming sync: git branch -D $BACKUP_BRANCH)"
echo ""
echo "⚠️  To rollback: ./sync/upstream-sync.sh rollback"
