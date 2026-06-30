# Agent Guide: Ghost Headline Theme Fork

**Purpose**: Stop repeating mistakes that break fork identity, upstream sync, or Ghost compatibility. Think like code review.

**Note**: `/memories/repo/startup.md` forces this into session context automatically. You'll see it.

---

## 🚨 READ THIS FIRST - Mandatory Session Start

**Before starting ANY work on this codebase**, complete this checklist:

```bash
# 1. Read this entire file
cat AGENT_LESSONS.md

# 2. Check current state
git status
git branch
pnpm test    # GScan validation
pnpm dev     # Compile assets

# 3. Understand fork constraints
cat sync/README.md | head -100
cat AI_DEVELOPMENT.md | grep -A10 "Never change"
cat package.json | grep -E "name|author|engines"

# 4. Check upstream sync status
git fetch upstream
git log --oneline upstream/main..HEAD  # What we're ahead
git log --oneline HEAD..upstream/main  # What we're behind

# 5. Verify devcontainer works
docker compose ps
curl -s http://localhost:3001 | head -20
pnpm ghost:logs | tail -20
```

**If you skip this**, you will:

- Edit `package.json` name/author and break fork identity
- Modify files that conflict with pending upstream changes
- Use Ghost helpers incompatible with Ghost 6.0+
- Edit `assets/built/*` instead of source files
- Break devcontainer assumptions (ports, volumes, Node version)
- Skip GScan validation and ship incompatible themes

**This is not optional.** Every HIGH priority issue in code review came from skipping this audit.

---

## 🎯 The Core Problem: Isolated Fixes Without Fork Context

**What keeps happening**: AI agents (me) solve individual problems without understanding the fork architecture:

- Fix a template bug → don't check if file has pending upstream changes
- Update dependencies → don't preserve Node 24 requirement or ghost:\* scripts
- Add helpful features → don't mark with `{{!-- FORK CUSTOM: ... --}}` comments
- Edit CSS → compile `assets/built/*` directly instead of source files
- Write clever code → don't validate against Ghost 6.0 API constraints

**The consequence**: Code works locally but **breaks the fork**:

- Upstream merge conflicts because we touched conflicting files
- Deployment fails because `package.json` name changed
- Theme fails GScan validation due to Ghost API incompatibilities
- Devcontainer breaks because Node version requirement removed
- Production issues because we edited built assets that get overwritten on next compile

**The fix**: Before making ANY change, ask **"Does this preserve fork identity and account for upstream merges?"**

Think holistically about the **fork lifecycle**:

1. Local dev in devcontainer → asset compilation → Ghost live reload
2. Commit → push to staging → GitHub Actions deployment
3. Upstream releases new version → fetch → merge → resolve conflicts
4. Production theme must work with Ghost 6.0+ API

**What "fork context" means**:

- Read `sync/README.md` to see which files have upstream conflicts
- Check `package.json` for protected fields (name, author, engines.node, ghost:\* scripts)
- Verify Ghost helper compatibility with `pnpm test` (GScan)
- Test in actual Ghost instance at http://localhost:3001, not just file edits
- Mark custom code with `{{!-- FORK CUSTOM: reason --}}` for future merge clarity

**Examples of holistic thinking**:

- ❌ "Update all dependencies to latest" → ✅ "Check sync/README.md first - upstream might have updated them differently"
- ❌ "Edit assets/built/screen.css for quick fix" → ✅ "Edit assets/css/screen.css source, run pnpm dev to compile"
- ❌ "Use new Ghost 7 helper for feature" → ✅ "Fork supports Ghost 6.0+, check compatibility first"
- ❌ "Change package.json name to 'headline'" → ✅ "NEVER - fork identity is 'publicledger-headline-fork'"

**Stop fixing symptoms, understand the system**: Every bug caught in code review is a symptom of not auditing fork constraints before writing code.

---

## 🧠 Chronic AI Behavioral Patterns

**These mistakes repeat across development cycles** - awareness is the first step to prevention:

### 1. Breaking Fork Identity Without Realizing It

**Pattern**: "Let's clean up package.json" → change name to match upstream → deployment automation breaks silently
**Why**: AI sees mismatched names as "inconsistency to fix" without understanding fork identity is INTENTIONAL
**Fix**: Before editing package.json, run:

```bash
grep -E "name|author|engines" package.json
cat AI_DEVELOPMENT.md | grep -A5 "Never change"
# If these fields differ from upstream, IT'S ON PURPOSE
```

### 2. Editing Built Assets Instead of Source Files

**Pattern**: See CSS bug in devtools → edit `assets/built/screen.css` → fix disappears on next `pnpm dev`
**Why**: AI follows file paths from browser without understanding build pipeline
**Fix**: Never edit `assets/built/*` - always edit source:

```bash
# ❌ WRONG
vim assets/built/screen.css

# ✅ RIGHT
vim assets/css/screen.css
pnpm dev  # Compile to built/
```

### 3. Not Checking Upstream Sync Status Before Editing

**Pattern**: "Let's modernize gulpfile.js" → implement changes → merge conflict when syncing upstream who also updated it
**Why**: AI doesn't naturally check git history before proposing changes
**Fix**: Before editing ANY file, check if upstream touched it:

```bash
git fetch upstream
git log upstream/main..HEAD -- path/to/file  # Our changes
git log HEAD..upstream/main -- path/to/file  # Their changes
grep "path/to/file" sync/README.md    # Known conflicts?
```

### 4. Ghost API Version Assumptions

**Pattern**: Use `{{reading_time}}` helper → works in Ghost 7 dev instance → fails in production Ghost 6
**Why**: AI suggests latest Ghost features without checking supported version range
**Fix**: Before using ANY Ghost helper, check compatibility:

```bash
# Check our requirement
grep "ghost" package.json  # ">=6.0.0"

# Validate theme compatibility
pnpm test  # GScan checks Ghost 6.0 compatibility

# Check Ghost docs version history
# https://ghost.org/docs/themes/helpers/
```

### 5. Not Testing in Actual Ghost Instance

**Pattern**: Edit Handlebars template → looks syntactically correct → runtime error because context object doesn't exist
**Why**: Templates are data-driven - syntax correctness ≠ runtime correctness
**Fix**: Always test in running Ghost:

```bash
# Start Ghost if not running
docker compose ps
pnpm ghost:restart

# View in browser
curl http://localhost:3001  # Or visit in browser
pnpm ghost:logs          # Check for template errors
```

### 6. Handlebars Context Confusion

**Pattern**: Try to use `{{author}}` in tag.hbs → undefined because tag context doesn't include author
**Why**: Each route/template has specific Ghost context objects available
**Fix**: Understand context before using variables:

```handlebars
{{! ❌ WRONG - author not in tag context }}
{{#tag}}
  <p>By {{author.name}}</p>
{{/tag}}

{{! ✅ RIGHT - check available context }}
{{! tag.hbs has: tag, posts }}
{{! post.hbs has: post, author }}
{{! See: https://ghost.org/docs/themes/context/ }}
```

### 7. Missing GScan Validation

**Pattern**: Implement template changes → commit → theme rejected by Ghost admin because failed GScan validation
**Why**: Ghost has strict theme requirements (required templates, helpers, metadata)
**Fix**: Always validate before committing:

```bash
pnpm test      # Quick validation
pnpm validate  # Verbose report with warnings
pnpm zip       # Build production package (also validates)
```

### 8. Not Marking Fork-Specific Code

**Pattern**: Add custom feature → no comments → future upstream merge can't tell if code is ours or theirs → accidental deletion
**Why**: Without markers, fork customizations look like upstream code during merges
**Fix**: Mark ALL custom code:

```handlebars
{{! FORK CUSTOM: Password protection UI for Public Ledger }}
<div class="custom-password-form">
  {{t "Access site"}}
  {{! Custom translation string }}
</div>
```

### 9. Devcontainer Environment Assumptions

**Pattern**: "Let's support Node 18 for broader compatibility" → remove Node 24 requirement → devcontainer build fails
**Why**: Devcontainer is BUILT for Node 24 - changing requirement breaks container
**Fix**: Devcontainer constraints are immutable:

```bash
# These are FIXED by container environment:
# - Node 24+ (engines.node in package.json)
# - Ghost ports (3001 dev, 2368 prod)
# - Theme mount path (/var/lib/ghost/content/themes/headline)
# - Volume names (ghost-dev-data, ghost-prod-data)

# Check before changing:
cat .devcontainer/docker-compose.yml
cat .devcontainer/devcontainer.json
```

### 10. Dependency Updates Without Upstream Check

**Pattern**: See Dependabot alert → update package → conflicts with upstream's simultaneous update → merge nightmare
**Why**: Both fork and upstream maintain dependencies - uncoordinated updates collide
**Fix**: Before updating dependencies:

```bash
# Check if upstream already updated
git fetch upstream
git log upstream/main -- package.json
git diff upstream/main -- package.json

# If upstream updated recently, wait for sync instead of doing it ourselves
```

### 11. Translation String Modifications

**Pattern**: "Let's fix this typo in 'Access code'" → edit locales/en.json → undo our intentional customization
**Why**: Some strings are INTENTIONALLY different from upstream (fork customization)
**Fix**: Check if string is fork-custom before editing:

```bash
grep "Access site\|Password" locales/en.json  # Fork-specific strings
grep "locales/en.json" AI_DEVELOPMENT.md              # Protected files
# "Access site" not "Access code" is INTENTIONAL
```

### 12. Implementing Features Without Considering Upstream Merge Impact

**Pattern**: Add complex custom partial → upstream adds same-named partial with different purpose → merge conflict + feature clash
**Why**: Thinking "this is a fork, we can do whatever" without planning for continuous upstream integration
**Fix**: Design fork customizations to minimize merge conflicts:

```bash
# ❌ RISKY - likely to conflict with upstream
partials/loop.hbs           # Upstream frequently updates
default.hbs                 # Core template

# ✅ SAFER - unlikely to conflict
partials/custom-*.hbs       # Custom prefix
custom-*.hbs templates      # Custom templates
.devcontainer/*             # Fork-only directory
```

### 13. Creating Files Without Checking Upstream for Name Conflicts

**Pattern**: Create AGENTS.md for AI development guidelines → later discover upstream has AGENTS.md for monorepo documentation → merge conflict on every upstream sync → forced to rename
**Why**: AI creates files based on current fork needs without checking if upstream already uses that filename
**Fix**: Before creating ANY new file in repo root, check upstream:

```bash
# ❌ WRONG - create file without checking
cat > AGENTS.md << 'EOF'
# AI Development Guidelines
...
EOF

# ✅ RIGHT - check upstream first
git fetch upstream
git ls-tree -r upstream/main --name-only | grep "^AGENTS\.md"
# If found: choose different name (AI_DEVELOPMENT.md, FORK_AGENTS.md, etc.)

# ✅ EVEN BETTER - check entire pattern
git ls-tree -r upstream/main --name-only | grep -i "agent\|contrib\|troubleshoot"
# Avoid ALL potential conflicts with upstream naming patterns

# Safe file naming strategies:
# - Add FORK_ prefix: FORK_GUIDELINES.md
# - Use descriptive names: AI_DEVELOPMENT.md, DEV_WORKFLOW.md
# - Fork-only dirs: .devcontainer/, custom-*/
# - Check sync/README.md for documented upstream files
```

**Real example from this fork**:
- Created `AGENTS.md` for AI agent guidelines (2026-06-29)
- Upstream already had `AGENTS.md` for TryGhost/Themes monorepo docs
- Forced to rename → `AI_DEVELOPMENT.md` + update 5 files + memory
- Prevention: `git ls-tree -r upstream/main --name-only | grep AGENTS` would have caught this

**The lesson**: Upstream is actively developed. Always check their file tree before creating repo-root files.

**The meta-lesson**: AI agents work in isolation and forget this is a LIVING FORK that continuously integrates upstream changes. You must actively fight this by checking sync status, preserving identity, and planning for merge conflicts.

---

## 🎯 Before Writing Any Code

**Audit the fork environment** (5 minutes prevents hours of debugging):

```bash
# 1. Check fork identity constraints
cat package.json | grep -E "name|author|engines"
# name: "publicledger-headline-fork" - NEVER CHANGE
# author: Gasworks Data - NEVER CHANGE
# engines.node: ">=24.0.0" - NEVER CHANGE

# 2. Check upstream sync status for target file
git fetch upstream
git log upstream/main..HEAD -- path/to/file    # Our changes
git log HEAD..upstream/main -- path/to/file    # Their changes
grep "path/to/file" sync/UPSTREAM_SYNC.md      # Documented conflicts?

# 3. If creating NEW files, check upstream for name conflicts
git ls-tree -r upstream/main --name-only | grep "^NEW_FILE_NAME"
# If exists: choose different name to avoid merge conflicts

# 4. Verify Ghost compatibility
pnpm test  # GScan validation for Ghost 6.0+

# 5. Check if devcontainer is running
docker compose ps
curl -s http://localhost:3001 | grep -o "<title>.*</title>"
```

**Built assets are read-only** (edit source files, not compiled output):

```bash
# ❌ WRONG - editing generated files
vim assets/built/screen.css
vim assets/built/main.min.js

# ✅ RIGHT - edit source, compile with Gulp
vim assets/css/screen.css
vim assets/js/main.js
pnpm dev  # Watch mode - auto-compiles on save
```

**Ghost helpers have version constraints** (check compatibility):

```handlebars
{{! ❌ WRONG - Ghost 7+ only helper }}
{{reading_time}}

{{! ✅ RIGHT - Ghost 6.0+ compatible }}
{{#if feature_image}}
  {{img_url feature_image size="l"}}
{{/if}}

{{! Check version compatibility:
     https://ghost.org/docs/themes/helpers/
     pnpm test (GScan validates) }}
```

**Template context is route-specific** (check available objects):

```handlebars
{{! Each template has specific context objects }}
{{! index.hbs: posts, pagination }}
{{! post.hbs: post, author }}
{{! tag.hbs: tag, posts }}
{{! author.hbs: author, posts }}

{{! ❌ WRONG - using undefined context }}
{{!-- tag.hbs trying to use {{author}} --}}

{{! ✅ RIGHT - check Ghost docs for context }}
{{! https://ghost.org/docs/themes/context/ }}
```

**Fork customizations must be marked** (for future merge clarity):

```handlebars
{{! FORK CUSTOM: Public Ledger password protection UI }}
<div class="custom-login">
  {{t "Access site"}}
  {{! FORK CUSTOM: Not "Access code" }}
</div>
```

---

## 🚨 This Codebase Specifics

### Fork Identity (NEVER CHANGE)

- `package.json` name: `"publicledger-headline-fork"`
- `package.json` author: Gasworks Data
- `package.json` engines.node: `">=24.0.0"`
- `package.json` ghost:\* scripts (ghost:dev, ghost:logs, ghost:restart, etc.)
- `locales/en.json` custom strings: "Access site" (not "Access code"), "Password" (custom)

### Upstream Sync

- **Active fork**: 5 commits ahead, ~19 commits behind (as of 2026-06-28)
- **High conflict files**: package.json, gulpfile.js, core templates (default.hbs, post.hbs, etc.)
- **Safe custom files**: custom-_.hbs templates, .devcontainer/_, .github/workflows/\*
- **Protocol**: See sync/UPSTREAM_SYNC.md before editing shared files

### Ghost Compatibility

- **Version**: Ghost 6.0+ (not 7+ features)
- **Validation**: `pnpm test` (GScan) before every commit
- **Helpers**: Check https://ghost.org/docs/themes/helpers/ for version support
- **Context**: Route-specific - https://ghost.org/docs/themes/context/

### Development Environment

- **Devcontainer**: Multi-container Docker (ghost-dev:3001, ghost-prod:2368, db:3306)
- **Node**: 24+ (container requirement, don't downgrade)
- **Asset compilation**: `pnpm dev` watches source files → compiles to built/
- **Live reload**: Theme mounted at `/var/lib/ghost/content/themes/headline`
- **Testing**: View at http://localhost:3001, logs via `pnpm ghost:logs`

### Build Pipeline

```bash
pnpm dev      # Watch mode: assets/css/*.css → assets/built/screen.css
                 #             assets/js/*.js → assets/built/main.min.js
pnpm zip      # Production build to dist/ (validates + compiles + packages)
pnpm test     # GScan validation (Ghost 6.0 compatibility)
pnpm validate # Verbose GScan report with all warnings
```

---

## 📋 Quick Checks

Before committing:

- [ ] Check `package.json` name/author/engines unchanged
- [ ] Run `pnpm test` (GScan validation passes)
- [ ] Test in devcontainer at http://localhost:3001
- [ ] Check `pnpm ghost:logs` for template errors
- [ ] Mark fork-custom code with `{{!-- FORK CUSTOM: ... --}}` comments
- [ ] Check `sync/UPSTREAM_SYNC.md` if editing shared files
- [ ] Verify edits are in SOURCE files (assets/css/_, assets/js/_), not built/
- [ ] Run `pnpm zip` to ensure production build works
- [ ] Check `get_errors()` in VS Code for lint/validation issues

---

## 🔄 Updating This Document

**When code review catches a new pattern** (or you catch yourself making a mistake):

1. Add to **"Chronic AI Behavioral Patterns"** section if it's a repeating behavioral issue
2. Add to **"Before Writing Any Code"** section if it's a technical constraint
3. Add to **"Quick Checks"** checklist if it's a pre-commit validation
4. Update `/memories/repo/startup.md` if the mistake is critical enough to highlight in session startup

**Make it concrete**: Include the actual mistake (what was written), why it failed, and the correct pattern.

**Keep it abstract**: Focus on the class of mistake (breaking fork identity) not the specific instance (line 5 of package.json).

**Both files work together**: Repo memory nags at session start → you read this comprehensive guide → you audit before coding → you avoid bugs.

---

## 📝 How to Write New Rules (Template)

**Ask first**: Is this a one-time bug or a repeating pattern across multiple sessions/PRs?

- **One-time bug** → Fix it, add a comment in the code, move on (don't document here)
- **Repeating pattern** → Document it using the template below

**Template for "Chronic AI Behavioral Patterns"**:

```markdown
### N. [Category Name - What Gets Done Wrong]

**Pattern**: [Concrete example of the mistake] → [What happens/fails]
**Why**: [Root cause - usually an AI limitation or assumption]
**Fix**: [Actionable step to prevent it, with command examples]
```

**Template for "Before Writing Any Code" constraints**:

````markdown
**[What to check]** ([why it matters]):

```bash
# ❌ WRONG - [what breaks]
[bad code example]

# ✅ RIGHT - [correct approach]
[good code example]
```
````

```

**Good rule characteristics**:
- ✅ **Timeless**: Describes a class of problem, not tied to specific code
- ✅ **Actionable**: Tells you what to DO (check this, validate that) not just what went wrong
- ✅ **Abstract + Concrete**: General pattern + specific example to illustrate
- ✅ **Root cause aware**: Explains WHY the mistake happens (AI behavior, fork architecture)
- ✅ **Teaches thinking**: Shows the thought process, not just the fix

**Bad rule characteristics**:
- ❌ **Bug report**: "In PR #42 line 12 had wrong indentation" → Too specific, will become irrelevant
- ❌ **Code-specific**: "default.hbs line 89 should use {{post.title}}" → Brittle, breaks when code changes
- ❌ **Symptom-focused**: "Template error" → Doesn't explain why or how to prevent
- ❌ **One-time event**: "Forgot to run pnpm test" → If it only happened once, it's not a pattern

**Decision tree for new entries**:

```

Is it repeating across multiple sessions?
├─ NO → Don't add to AGENT_LESSONS.md (one-time bug)
└─ YES → Is it about AI behavior or a technical constraint?
├─ AI behavior → Add to "Chronic AI Behavioral Patterns"
│ └─ Ask: Does it represent a CLASS of thinking error?
│ ├─ YES → Write it abstractly (e.g., "fork identity confusion")
│ └─ NO → Too specific, skip it
└─ Technical constraint → Add to "Before Writing Any Code"
└─ Ask: Will this apply to future code or just current code?
├─ Future → Document the pattern (e.g., "Ghost helpers have version constraints")
└─ Current only → Add inline comment to the code instead

````

**Example transformation** (bug report → good rule):

❌ **Too specific**: "In post.hbs line 45, I used {{author.website}} which is Ghost 7 only and broke production"

✅ **Good rule**:
```markdown
### 4. Ghost API Version Assumptions
**Pattern**: Use {{reading_time}} helper → works in Ghost 7 dev → fails in production Ghost 6
**Why**: AI suggests latest Ghost features without checking supported version range
**Fix**: Before using ANY Ghost helper, check compatibility:
```bash
grep "ghost" package.json  # ">=6.0.0"
pnpm test  # GScan validates Ghost 6.0
# https://ghost.org/docs/themes/helpers/
````

```

**Keep it lean**: If 3 sessions have similar mistakes, abstract them into ONE pattern. Don't list all 3 separately.

---

**Last Updated**: 2026-06-29
**Fork Status**: 5 ahead, ~19 behind (see sync/UPSTREAM_SYNC.md)
**Ghost Version**: 6.0+ support (see package.json)
```
