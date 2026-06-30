#!/bin/bash
# Local fork integrity validation
# Runs the same checks as .github/workflows/validate-fork.yaml
# Use this before pushing to catch issues early

set -e

echo "🔍 Validating fork integrity (local check)..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. License Compliance
echo "1️⃣  Checking LICENSE compliance..."
if ! git diff --quiet HEAD upstream/main -- LICENSE 2>/dev/null; then
    echo -e "${RED}❌ LICENSE differs from upstream${NC}"
    echo "Run: git diff upstream/main -- LICENSE"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ LICENSE matches upstream${NC}"
fi

# 2. package.json author field
echo ""
echo "2️⃣  Checking package.json author..."
author=$(jq -r '.author.name' package.json 2>/dev/null || echo "")
if [[ "$author" != "Ghost Foundation" ]]; then
    echo -e "${RED}❌ author must be 'Ghost Foundation'${NC}"
    echo "Current: $author"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ author is 'Ghost Foundation'${NC}"
fi

# 3. Contributors field
echo ""
echo "3️⃣  Checking contributors field..."
if ! jq -e '.contributors' package.json > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  contributors field missing${NC}"
    echo "Add your attribution to contributors array"
else
    echo -e "${GREEN}✅ contributors field present${NC}"
fi

# 4. Upstream sync status
echo ""
echo "4️⃣  Checking upstream sync status..."
if git remote get-url upstream &>/dev/null; then
    git fetch upstream main --quiet 2>/dev/null || true
    AHEAD=$(git rev-list --count upstream/main..HEAD 2>/dev/null || echo "?")
    BEHIND=$(git rev-list --count HEAD..upstream/main 2>/dev/null || echo "?")
    
    echo "  Fork is $AHEAD commits ahead, $BEHIND commits behind upstream"
    
    if [[ "$BEHIND" =~ ^[0-9]+$ ]] && [[ "$BEHIND" -gt 10 ]]; then
        echo -e "${YELLOW}⚠️  Fork is $BEHIND commits behind (>10)${NC}"
        echo "  Consider syncing: ./sync/upstream-sync.sh"
    fi
else
    echo -e "${YELLOW}⚠️  upstream remote not configured${NC}"
    echo "  Add: git remote add upstream https://github.com/TryGhost/Headline.git"
fi

# 5. Build validation
echo ""
echo "5️⃣  Building theme..."
if pnpm zip; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 6. GScan validation
echo ""
echo "6️⃣  Running GScan validation..."
if pnpm test; then
    echo -e "${GREEN}✅ GScan validation passed${NC}"
else
    echo -e "${RED}❌ GScan validation failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ All checks passed${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed${NC}"
    exit 1
fi
