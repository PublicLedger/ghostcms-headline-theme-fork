#!/bin/bash
# Local fork integrity validation
# Mirrors the checks in .github/workflows/validate-fork.yaml
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

# Resolve the upstream ref FIRST. The LICENSE check below diffs against
# upstream/main, so without this a fresh clone reported "LICENSE differs from
# upstream" -- a false failure that actually meant "upstream was never fetched".
# When upstream is genuinely unreachable we skip those checks loudly instead of
# blaming the files they were going to inspect.
UPSTREAM_OK=0
echo "0️⃣  Resolving upstream ref..."
if ! git remote get-url upstream &>/dev/null; then
    echo -e "${YELLOW}⚠️  upstream remote not configured - skipping upstream checks${NC}"
    echo "  Add: git remote add upstream https://github.com/TryGhost/Headline.git"
elif ! git fetch upstream main --quiet 2>/dev/null && ! git rev-parse --verify upstream/main &>/dev/null; then
    echo -e "${YELLOW}⚠️  could not fetch upstream/main (offline?) - skipping upstream checks${NC}"
elif ! git rev-parse --verify upstream/main &>/dev/null; then
    echo -e "${YELLOW}⚠️  upstream/main ref missing - skipping upstream checks${NC}"
else
    UPSTREAM_OK=1
    echo -e "${GREEN}✅ upstream/main at $(git rev-parse --short upstream/main)${NC}"
fi

# 1. License Compliance
echo ""
echo "1️⃣  Checking LICENSE compliance..."
if [[ $UPSTREAM_OK -eq 0 ]]; then
    echo -e "${YELLOW}⏭️  skipped (no upstream ref)${NC}"
elif ! git diff --quiet upstream/main HEAD -- LICENSE; then
    echo -e "${RED}❌ LICENSE differs from upstream${NC}"
    echo "Run: git diff upstream/main -- LICENSE"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ LICENSE matches upstream${NC}"
fi

# Read a field from package.json with node rather than jq. The devcontainer is
# node:24-alpine and has no jq; the previous `jq ... || echo ""` swallowed the
# "command not found" and reported an empty author as a real failure. GitHub
# runners do ship jq, so this only ever broke locally.
pkg_field() {
    node -p "const v=require('./package.json')$1; v===undefined||v===null?'':String(v)"
}

# 2. package.json author field
echo ""
echo "2️⃣  Checking package.json author..."
if ! author=$(pkg_field ".author?.name" 2>/dev/null); then
    echo -e "${RED}❌ could not read package.json (invalid JSON?)${NC}"
    ERRORS=$((ERRORS + 1))
elif [[ "$author" != "Ghost Foundation" ]]; then
    echo -e "${RED}❌ author must be 'Ghost Foundation'${NC}"
    echo "Current: ${author:-<empty>}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ author is 'Ghost Foundation'${NC}"
fi

# 3. Contributors field
echo ""
echo "3️⃣  Checking contributors field..."
contributors=$(pkg_field ".contributors?.length" 2>/dev/null || echo "")
if [[ -z "$contributors" || "$contributors" == "0" ]]; then
    echo -e "${YELLOW}⚠️  contributors field missing or empty${NC}"
    echo "Add your attribution to contributors array"
else
    echo -e "${GREEN}✅ contributors field present ($contributors entries)${NC}"
fi

# 4. Fork identity fields
# These are the "never change" values in AI_DEVELOPMENT.md. The theme name in
# particular is load-bearing: deploy-theme.yaml passes it to
# TryGhost/action-deploy-theme as `theme-name`, and `gulp zip` names the
# artifact after it, so a rename silently breaks production deploys.
echo ""
echo "4️⃣  Checking fork identity fields..."
name=$(pkg_field ".name" 2>/dev/null || echo "")
if [[ "$name" != "publicledger-headline-fork" ]]; then
    echo -e "${RED}❌ name must be 'publicledger-headline-fork' (deploy target)${NC}"
    echo "Current: ${name:-<empty>}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ name is '$name'${NC}"
fi

node_engine=$(pkg_field ".engines?.node" 2>/dev/null || echo "")
if [[ "$node_engine" != *"24"* ]]; then
    echo -e "${RED}❌ engines.node must require Node 24+${NC}"
    echo "Current: ${node_engine:-<empty>}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ engines.node is '$node_engine'${NC}"
fi

description=$(pkg_field ".description" 2>/dev/null || echo "")
if [[ ! "$description" =~ [Ff]ork ]] && [[ ! "$description" =~ [Bb]ased ]]; then
    echo -e "${YELLOW}⚠️  description should mention this is a fork${NC}"
    echo "Current: ${description:-<empty>}"
else
    echo -e "${GREEN}✅ description indicates fork status${NC}"
fi

missing_scripts=()
for s in ghost:seed ghost:refresh ghost:verify ghost:records; do
    if [[ -z "$(pkg_field ".scripts?.['$s']" 2>/dev/null || echo "")" ]]; then
        missing_scripts+=("$s")
    fi
done
if [[ ${#missing_scripts[@]} -gt 0 ]]; then
    echo -e "${RED}❌ missing fork scripts: ${missing_scripts[*]}${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ ghost:* fork scripts present${NC}"
fi

# 5. Protected fork files
echo ""
echo "5️⃣  Checking protected fork files exist..."
missing_files=()
for f in package.json LICENSE README.md sync/README.md sync/upstream-sync.sh routes.yaml; do
    [[ -f "$f" ]] || missing_files+=("$f")
done
if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo -e "${RED}❌ protected file(s) missing: ${missing_files[*]}${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ all protected files present${NC}"
fi

# 6. Upstream sync status
echo ""
echo "6️⃣  Checking upstream sync status..."
if [[ $UPSTREAM_OK -eq 0 ]]; then
    echo -e "${YELLOW}⏭️  skipped (no upstream ref)${NC}"
else
    AHEAD=$(git rev-list --count upstream/main..HEAD 2>/dev/null || echo "?")
    BEHIND=$(git rev-list --count HEAD..upstream/main 2>/dev/null || echo "?")

    echo "  Fork is $AHEAD commits ahead, $BEHIND commits behind upstream"

    if [[ "$BEHIND" =~ ^[0-9]+$ ]] && [[ "$BEHIND" -gt 10 ]]; then
        echo -e "${YELLOW}⚠️  Fork is $BEHIND commits behind (>10)${NC}"
        echo "  Consider syncing: ./sync/upstream-sync.sh"
    fi
fi

# 7. Build validation
echo ""
echo "7️⃣  Building theme..."
if pnpm zip; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 8. GScan validation
echo ""
echo "8️⃣  Running GScan validation..."
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
