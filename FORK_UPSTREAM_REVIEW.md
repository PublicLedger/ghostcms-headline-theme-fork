# Fork Upstream Sync Review

**Review Date:** 2026-06-29  
**Purpose:** Verify development rigor additions won't interfere with upstream synchronization  
**Reviewer:** AI Agent comprehensive analysis

---

## Executive Summary

✅ **Overall Status: GOOD** - Development rigor tooling properly isolated from upstream conflicts

**Key Findings:**
- 1 file naming conflict identified (AGENTS.md) - **ACTION REQUIRED**
- 15+ new dev quality files - **No upstream conflicts**
- package.json divergence well-documented - **Expected and managed**
- Lock file situation needs cleanup - **Minor issue**

---

## Conflict Analysis

### 🔴 HIGH PRIORITY: File Naming Conflict

**File:** `AGENTS.md`

**Problem:**
- **Upstream AGENTS.md** - Documents TryGhost/Themes monorepo structure, pnpm usage
- **Fork AGENTS.md** - AI agent development guidelines for fork maintenance

**Impact:** Merge conflict on every upstream sync

**Resolution Options:**

1. **RECOMMENDED:** Rename fork's AGENTS.md → `AI_DEVELOPMENT.md`
   - Preserves upstream's monorepo documentation
   - Clearly indicates AI/agent-specific content
   - No merge conflicts
   - Update references in CLAUDE.md, startup.md, README.md, CONTRIBUTING.md

2. Alternative: Rename to `FORK_AGENTS.md`
   - Less clear purpose
   - Still requires reference updates

3. Alternative: Merge both files with sections
   - Requires manual merge every upstream sync
   - Not recommended

**Action Required:** Execute rename before next upstream sync

---

## Dev Quality Tooling Files (Safe)

These files **DO NOT exist in upstream** - no conflicts:

### Code Quality Configuration
```
✅ .editorconfig              - Cross-editor consistency
✅ .prettierrc                - Prettier configuration
✅ .prettierignore            - Prettier exclusions
✅ .pre-commit-config.yaml    - Pre-commit hooks
✅ eslint.config.js           - ESLint configuration
✅ .vscode/settings.json      - VS Code workspace settings
✅ .vscode/extensions.json    - Recommended extensions
```

### Documentation
```
✅ CONTRIBUTING.md            - Development workflow guide
✅ TROUBLESHOOTING.md         - Common issues and solutions
✅ AGENT_LESSONS.md           - AI behavioral patterns to avoid
✅ CLAUDE.md                  - Quick reference (points to AGENTS.md)
```

### Fork Infrastructure (Already Committed)
```
✅ .devcontainer/             - Complete Docker dev environment
✅ .github/workflows/deploy-theme.yaml - Fork-specific deployment
✅ DEVCONTAINER.md            - Devcontainer documentation
✅ UPSTREAM_SYNC_PLAN.md      - Upstream merge strategy
✅ UPSTREAM_SYNC_CHECKLIST.md - Sync procedure checklist
✅ UPSTREAM_SYNC_COMMANDS.md  - Sync command reference
✅ .gitignore                 - Fork-specific (upstream has none)
✅ routes.yaml                - Custom routing
```

**Status:** All safe - will merge cleanly or add as new files

---

## Package Manager Situation

### Current State
```bash
Lock Files Present:
- package-lock.json (416K) - npm
- yarn.lock (214K)         - yarn
- pnpm-lock.yaml           - MISSING

Upstream Uses:
- pnpm@11.9.0 (pinned in package.json)
```

### Issue
Fork uses npm (package-lock.json), upstream uses pnpm (pnpm-lock.yaml)

### Impact
- **Low** - Lock files don't cause merge conflicts (different filenames)
- package.json differences well-documented in UPSTREAM_SYNC_PLAN.md
- Build tools use package.json (lock file agnostic)

### Recommendation
**Option 1: Stay with npm (Current)**
- Pros: Works, Node 24 compatible, no changes needed
- Cons: Different from upstream, need to maintain separate lock file

**Option 2: Switch to pnpm (Match Upstream)**
- Pros: Matches upstream tooling, easier dependency sync
- Cons: Requires migration, devcontainer update
- Migration: `rm package-lock.json yarn.lock && pnpm install`

**Decision:** Stay with npm for now - revisit if upstream dependencies cause issues

---

## package.json Divergence Analysis

### Fork-Specific Changes (MUST PRESERVE)

#### Identity (Lines 2-14)
```json
"name": "publicledger-headline-fork"     // vs "headline"
"description": "A custom Ghost theme..." // vs "A Ghost theme"
"engines.node": ">=24.0.0"              // Added (upstream has none)
"engines.ghost": ">=6.0.0"              // vs ">=5.0.0"
"author": "Gasworks Data"                // vs "Ghost Foundation"
```

**Status:** ✅ Well-documented in UPSTREAM_SYNC_PLAN.md section "Fork-Specific Customizations to Preserve"

#### Custom Scripts (Lines 89-95)
```json
"validate": "gscan . --verbose"          // Added
"lint": "eslint ."                       // Added
"lint:fix": "eslint . --fix"            // Added
"ghost:dev": "echo 'Ghost dev...'"      // Added
"ghost:prod": "docker compose..."       // Added
"ghost:stop": "docker compose down"     // Added
"ghost:logs": "docker compose logs..."  // Added
"ghost:restart": "docker compose..."    // Added
```

**Status:** ✅ Fork convenience scripts - preserve all

#### Theme Customizations (Lines 48-78)
```json
"navigation_layout.default": "Logo on the left"  // vs "Stacked"
"title_font.default": "Elegant serif"            // vs "Modern sans-serif"
"body_font.default": "Modern sans-serif"         // vs "Elegant serif"
"email_signup_text.default": "Follow The..."     // Custom message
```

**Status:** ✅ PublicLedger branding - preserve all

### Dependency Differences

#### Removed (Upstream → Fork)
```json
"packageManager": "pnpm@11.9.0"  // Removed (we use npm)
```

#### Downgraded (Fork uses older versions)
```json
"@tryghost/shared-theme-assets": "2.6.1"  // Upstream: 2.7.1
"cssnano": "7.1.8"                        // Upstream: 8.0.2
"gscan": "5.4.3"                          // Upstream: 6.4.1
"postcss": "8.5.13"                       // Upstream: 8.5.15
```

**Reason:** Fork diverged before upstream dependency updates  
**Impact:** Low - theme builds and validates successfully  
**Action:** Update during next upstream sync, test thoroughly

#### Added (Fork-only dev dependencies)
```json
"@eslint/js": "^10.0.1"
"@gitkumi/prettier-plugin-handlebars": "^1.5.0"
"@typescript-eslint/parser": "^8.62.0"
"eslint": "^10.6.0"
"eslint-plugin-jsdoc": "^63.0.10"
"globals": "^17.7.0"
"prettier": "^3.4.2"
```

**Status:** ✅ Fork-specific dev quality tools - preserve all  
**Impact:** None on upstream merge (devDependencies don't conflict)

---

## Upstream Sync Safety Checklist

### Pre-Merge Verification

- [ ] **Rename AGENTS.md** → AI_DEVELOPMENT.md
  ```bash
  git mv AGENTS.md AI_DEVELOPMENT.md
  # Update references in:
  - CLAUDE.md
  - /memories/repo/startup.md
  - README.md
  - CONTRIBUTING.md
  - AGENT_LESSONS.md
  ```

- [ ] **Commit all dev quality tooling**
  ```bash
  git add .editorconfig .prettierrc .prettierignore
  git add .pre-commit-config.yaml eslint.config.js
  git add .vscode/
  git add CONTRIBUTING.md TROUBLESHOOTING.md AGENT_LESSONS.md
  git add AI_DEVELOPMENT.md CLAUDE.md  # After rename
  git commit -m "feat: add comprehensive development quality tooling
  
  - Prettier for code formatting (with Handlebars plugin)
  - ESLint for JavaScript linting
  - EditorConfig for cross-editor consistency
  - Pre-commit hooks for automated validation
  - Comprehensive development documentation
  - AI agent development guidelines"
  ```

- [ ] **Clean up yarn.lock** (optional but recommended)
  ```bash
  git rm yarn.lock
  git commit -m "chore: remove yarn.lock (using npm)"
  ```

- [ ] **Verify .gitignore excludes built assets**
  ```bash
  grep -E "assets/built|dist|node_modules" .gitignore
  # Should show all three patterns
  ```

### During Merge

- [ ] **Accept fork version for these files:**
  - `package.json` - Merge manually, preserve fork identity
  - `.gitignore` - Keep fork version (upstream has none)
  - `locales/en.json` - Preserve custom strings
  - `AI_DEVELOPMENT.md` - Keep fork version (no upstream equivalent)

- [ ] **Accept upstream version for these files:**
  - `AGENTS.md` - Take upstream's monorepo documentation
  - `assets/built/*` - Take upstream (will rebuild anyway)

- [ ] **Manual merge required:**
  - `package.json` - Preserve fork metadata + update dependencies
  - `locales/en.json` - Merge new keys, keep custom values

### Post-Merge Validation

- [ ] **Rebuild assets**
  ```bash
  npm install        # Update dependencies
  npm run dev        # Rebuild assets
  npm run test       # GScan validation
  npm run lint       # ESLint validation
  npm run zip        # Production build test
  ```

- [ ] **Test in Ghost devcontainer**
  ```bash
  npm run ghost:restart
  # Visit http://localhost:3001
  # Check theme loads, templates render
  ```

- [ ] **Verify fork identity preserved**
  ```bash
  grep "publicledger-headline-fork" package.json
  grep "Gasworks Data" package.json
  grep ">=24.0.0" package.json
  # All should return matches
  ```

---

## Development Workflow Safety

### Pre-commit Hooks Won't Block Upstream Merges

**Hooks configured:**
1. Prettier - Formats code (auto-fix)
2. ESLint - Lints JavaScript (auto-fix with --fix flag)
3. GScan - Validates Ghost compatibility
4. JSON syntax - Validates package.json, locales
5. YAML syntax - Validates routes.yaml
6. Built assets protection - Blocks edits to assets/built/

**Safety mechanisms:**
- All hooks use `npx` (works without pre-commit installed)
- Hooks only run on `git commit`, not `git merge`
- Can bypass with `git commit --no-verify` if needed during sync
- Hooks operate on staged files only

**Recommendation:** Install pre-commit hooks but document bypass for sync:
```bash
# Normal development
git commit -m "message"  # Hooks run automatically

# During upstream sync (if hooks cause issues)
git commit --no-verify -m "merge: sync with upstream"
```

---

## File Organization Review

### Fork-Specific Files (Top Level)
```
Documentation:
✅ AI_DEVELOPMENT.md (after rename)  - AI agent guidelines
✅ AGENT_LESSONS.md                  - AI behavioral patterns
✅ CLAUDE.md                         - Quick reference
✅ CONTRIBUTING.md                   - Development workflow
✅ TROUBLESHOOTING.md                - Common issues
✅ DEVCONTAINER.md                   - Container setup
✅ UPSTREAM_SYNC_PLAN.md             - Merge strategy
✅ UPSTREAM_SYNC_CHECKLIST.md        - Sync steps
✅ UPSTREAM_SYNC_COMMANDS.md         - Command reference

Configuration:
✅ .editorconfig                     - Editor settings
✅ .prettierrc                       - Prettier config
✅ .prettierignore                   - Prettier exclusions
✅ .pre-commit-config.yaml           - Hook definitions
✅ eslint.config.js                  - ESLint config
✅ .gitignore                        - Git exclusions
✅ routes.yaml                       - Custom routing

Infrastructure:
✅ .devcontainer/                    - Docker dev environment
✅ .github/workflows/deploy-theme.yaml - Deployment automation
✅ .vscode/                          - VS Code settings
```

**Organization Status:** ✅ Well-organized, clear fork vs upstream separation

---

## Recommendations

### Immediate Actions (Before Next Upstream Sync)

1. **CRITICAL:** Rename AGENTS.md → AI_DEVELOPMENT.md
   - Prevents merge conflict
   - Update all references (5 files)
   - Commit rename separately

2. **RECOMMENDED:** Commit all dev quality tooling
   - Creates clean baseline for future development
   - Documents fork enhancements
   - Single atomic commit

3. **OPTIONAL:** Remove yarn.lock
   - Cleanup unused lock file
   - Reduces confusion about package manager

### Ongoing Best Practices

1. **Never modify these files** without checking UPSTREAM_SYNC_PLAN.md:
   - `package.json` - High conflict risk
   - `locales/en.json` - Moderate conflict risk
   - `gulpfile.js` - Moderate conflict risk

2. **Always mark fork-specific code** in templates:
   ```handlebars
   {{!-- FORK CUSTOM: PublicLedger specific --}}
   ```

3. **Test after every upstream sync:**
   - `npm run test` - GScan validation
   - `npm run lint` - JavaScript quality
   - `npm run dev` - Asset compilation
   - Ghost devcontainer - Full theme functionality

4. **Keep UPSTREAM_SYNC_PLAN.md updated:**
   - Document new divergences
   - Update commit counts
   - Note new conflicts

---

## Risk Assessment

### Low Risk ✅
- Dev quality tooling files (no upstream equivalent)
- Documentation files (fork-specific)
- .devcontainer/ setup (fork-only)
- Custom npm scripts (additive only)
- Lock file differences (different package manager)

### Medium Risk ⚠️
- package.json dependency versions (need manual merge)
- locales/en.json customizations (need manual merge)
- AGENTS.md naming conflict (resolved by rename)

### High Risk 🔴
- **None** - All high-risk items properly documented and managed

---

## Conclusion

**Fork is READY for upstream synchronization** with one action item:

**Required:** Rename AGENTS.md → AI_DEVELOPMENT.md to prevent merge conflicts

**Status:** Development rigor additions are well-isolated and won't interfere with upstream merges. The fork maintains proper separation between:
- Upstream theme functionality (merged regularly)
- Fork customizations (preserved in package.json, locales)
- Development infrastructure (fork-only files)

**Confidence Level:** HIGH - Upstream sync can proceed safely after AGENTS.md rename.

---

## Next Steps

1. Execute AGENTS.md rename
2. Commit all dev quality tooling
3. Follow UPSTREAM_SYNC_PLAN.md Phase 1 → Phase 2 → Phase 3
4. Test thoroughly in devcontainer
5. Update FORK_STATUS.md with sync results
