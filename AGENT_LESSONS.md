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
- Test in actual Ghost instance at <http://localhost:3001>, not just file edits
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
{{! ❌ WRONG - author not in tag context }} {{#tag}}<p>By {{author.name}}</p>{{/tag}}
{{! ✅ RIGHT - check available context }} {{! tag.hbs has: tag, posts }}
{{! post.hbs has: post, author }} {{! See: https://ghost.org/docs/themes/context/ }}
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
<div class="custom-password-form">{{t "Access site"}} {{! Custom translation string }}</div>
```

### 9. Devcontainer Environment Assumptions

**Pattern**: "Let's support Node 18 for broader compatibility" → remove Node 24 requirement → devcontainer build fails
**Why**: Devcontainer is BUILT for Node 24 - changing requirement breaks container
**Fix**: Devcontainer constraints are immutable:

```bash
# These are FIXED by container environment:
# - Node 24+ (engines.node in package.json)
# - Ghost port (3001 for ghost-dev)
# - Theme mount path (/var/lib/ghost/content/themes/headline)
# - Volume names (ghost-dev-data, ghost-dev-images, etc.)

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

### 13. Forgetting Template Specificity Pattern

**Pattern**: "Let's simplify these templates" → remove nested `{{#get}}` queries → specific Pages no longer work
**Why**: AI sees nested Handlebars as "code smell" without understanding the specificity hierarchy is INTENTIONAL
**Fix**: Before modifying data route templates, understand the pattern:

```bash
# Check if template uses specificity
grep -A10 "{{#get" job-agency-seat.hbs
# Should see: specific slug attempt → generic fallback → hardcoded

# Read architecture doc
cat docs/TEMPLATE_FRAGMENTS.md | head -50
cat AGENTS.md | grep -A20 "Template Specificity"
```

**Common mistakes when forgetting this pattern:**

1. **Removing "redundant" nested `{{#get}}`:**

   ```handlebars
   {{!-- ❌ WRONG - removes specificity --}}
   {{#get "pages" filter="slug:job-agency-seat" limit="1"}}
     {{#foreach pages}}{{{content}}}{{/foreach}}
   {{/get}} {{!-- ✓ RIGHT - maintains specific → generic hierarchy --}}
   {{#get "pages" filter="slug:job-agency-seat-{{agency}}-{{seat}}" limit="1"}}
     {{#foreach pages}}{{{content}}}{{/foreach}}
   {{else}}
     {{#get "pages" filter="slug:job-agency-seat" limit="1"}}
       {{#foreach pages}}{{{content}}}{{/foreach}}
     {{/get}}
   {{/get}}
   ```

2. **Creating Pages with wrong slug patterns:**
   - URL: `/jobs/lancaster-county/sheriff/`
   - ❌ Creating Page: `lancaster-county-sheriff` (missing template prefix)
   - ❌ Creating Page: `job-agency-lancaster-county-sheriff` (wrong template name)
   - ✓ Creating Page: `job-agency-seat-lancaster-county-sheriff` (correct)

3. **Using Handlebars in Page content:**

   ```html
   <!-- ❌ WRONG - in Ghost Page editor -->
   <h1>Current {{seat}} for {{agency}}</h1>
   <!-- This renders literally: "Current {{seat}} for {{agency}}" -->

   <!-- ✓ RIGHT - in .hbs template file -->
   {{#get "pages" filter="slug:..." limit="1"}} {{#foreach pages}}{{{content}}}{{/foreach}} {{/get}}
   <h1>Current {{seat}} for {{agency}}</h1>
   ```

4. **Hardcoding content thinking it's the fallback:**

   ```handlebars
   {{!-- ❌ WRONG - editing hardcoded fallback thinking it's primary content --}}
   {{#get "pages" .. .}}
     ...
   {{else}}
     <h1>Detailed custom content here</h1>
     <!-- This should be in a Page! -->
   {{/get}}
   {{!-- ✓ RIGHT - hardcoded fallback is minimal --}}
   {{#get "pages" .. .}}
     ...
   {{else}}
     <p>Configure by creating Page: <code>job-agency-seat</code></p>
   {{/get}}
   ```

5. **Not testing in actual Ghost:**
   - Edit template → assume it works → commit
   - ❌ Should: Edit template → create test Page in Ghost → visit route → verify correct Page loads
   - Slug typos only caught at runtime: `job-agency-seats` vs `job-agency-seat`

**Why this matters for fork maintenance:**

- **15 templates** use this pattern (lookup, job, official, election, finance, donor routes)
- **~50-100 Pages** in production Ghost depend on exact slug matching
- **Breaking the pattern** makes all data routes show hardcoded fallbacks (looks like site is broken)
- **Upstream won't have these templates** (fork-specific), so can't "sync fix" from them
- **Hard to debug** because error is "site works but shows wrong content" not "site crashes"

**Before modifying any template with `{{#get "pages"}}`:**

```bash
# 1. Check if it uses specificity
grep -c "{{#get" template.hbs  # Should be ≥2 for specificity pattern

# 2. Understand what it's doing
head -30 template.hbs  # Read the structure

# 3. Test changes in Ghost
docker compose ps  # Verify Ghost running
# Create test Page with correct slug
# Visit route in browser
# Verify correct Page renders
```

**Documentation references:**

- Pattern explanation: `docs/TEMPLATE_FRAGMENTS.md`
- Architecture decision: `AGENTS.md` → "Template Specificity Pattern"
- Troubleshooting: `TROUBLESHOOTING.md` → "Template Specificity Issues"
- Developer guide: `CONTRIBUTING.md` → "Template Specificity Pattern"

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

### 14. Package Manager Inconsistency in Documentation

**Pattern**: Documentation mixes `npm run <script>` and `pnpm <script>` commands → confuses developers → potential installation issues if wrong package manager used
**Why**: AI treats npm and pnpm as interchangeable without checking project's explicit packageManager specification
**Fix**: Always check package manager before documenting commands:

```bash
# Check project's package manager
grep "packageManager" package.json
# "packageManager": "pnpm@11.9.0"  <- This is explicit and pinned

# All documentation should use: pnpm <script>
# NOT: npm run <script>

# ❌ WRONG - mixed commands
npm run ghost:check
pnpm dev
npm run ghost:logs

# ✅ RIGHT - consistent pnpm
pnpm ghost:check
pnpm dev
pnpm ghost:logs
```

**Why this matters:**

- **Package manager is pinned** in package.json (`"packageManager": "pnpm@11.9.0"`)
- **npm and pnpm have different behaviors** (lockfiles, scripts execution, dependencies resolution)
- **Inconsistent docs confuse developers** - which command is correct?
- **CI/CD may enforce package manager** - GitHub Actions checks packageManager field
- **pnpm shorthand works** - `pnpm dev` instead of `npm run dev`

**How to audit documentation:**

```bash
# Find all npm run commands in docs
grep -r "npm run\|npm dev\|npm test\|npm ghost" **/*.md

# Should be zero matches (except references to npm registry or npm as concept)
# Replace all with pnpm equivalents
```

**Package manager verification:**

```bash
# Correct package manager specified in package.json
cat package.json | grep packageManager
# "packageManager": "pnpm@11.9.0"

# All scripts can be run with pnpm shorthand
pnpm dev          # NOT npm run dev
pnpm test         # NOT npm run test
pnpm ghost:check  # NOT npm run ghost:check
```

**Real example from this fork:**

- Documentation had 176 instances of `npm run` / `npm dev` / `npm test` / `npm ghost`
- package.json explicitly specifies `"packageManager": "pnpm@11.9.0"`
- All commands should use pnpm for consistency
- Fixed: Standardized all documentation to use `pnpm <script>` format
- Added missing scripts: `ghost:dev`, `ghost:logs`, `ghost:restart` to match documented commands

**The lesson**: Check the project's specified package manager BEFORE writing any installation or command documentation. Consistency matters for developer experience and CI/CD reliability.

### 15. Bubblewrap Sandbox Blocking Terminal Commands

**Pattern**: Try to run docker/database commands → "Bubblewrap repair failed" → retry with different command variations → waste user's time asking them to run commands → don't tell user about sandbox setting
**Why**: AI doesn't check VS Code terminal execution settings and keeps retrying failed commands instead of informing user about the sandbox permission issue
**Fix**: When Bubblewrap errors occur, IMMEDIATELY tell user to check terminal settings:

```text
❌ WRONG - keep retrying commands
> run_in_terminal: docker exec ghost-dev ...
Error: Bubblewrap repair failed (exit code 1)
> run_in_terminal: sudo docker exec ghost-dev ...
Error: Bubblewrap sandbox repair was cancelled
> run_in_terminal: sh -c "docker exec ..."
Error: Bubblewrap repair failed
[User wastes time clicking through permission prompts]

✅ RIGHT - inform user immediately on first Bubblewrap error
> run_in_terminal: docker exec ghost-dev ...
Error: Bubblewrap repair failed (exit code 1)

"Bubblewrap sandbox is blocking terminal commands. To fix:
1. Open VS Code Command Palette (Ctrl+Shift+P)
2. Search: 'Preferences: Open User Settings (JSON)'
3. Find 'Default approvals (sandboxed)' setting
4. Uncheck the box to allow unsandboxed execution
5. Or run the command manually in your terminal"
```

**What triggers this:**

- Docker commands: `docker exec`, `docker compose`, `docker ps`
- Database commands: `sqlite3 /var/lib/ghost/...`
- File system operations in mounted volumes
- Any command that requires container/volume access

**Signals that Bubblewrap is the problem:**

- Error message contains "Bubblewrap"
- User sees "Default approvals (sandboxed)" prompt
- Same command works when user runs it manually
- `exit code 1` with no other error details

**What NOT to do:**

- Don't retry the same command 5 times hoping it will work
- Don't try different command variations (sudo, sh -c, etc.)
- Don't ask user to "just run this in terminal" without explaining WHY
- Don't waste user's time with permission prompts they have to keep clicking

**What TO do:**

1. On FIRST Bubblewrap error, explain the sandbox setting
2. Provide the specific VS Code setting path
3. Create the fix script for user to run manually
4. Stop trying to execute commands via run_in_terminal
5. Document the fix in TROUBLESHOOTING.md if not already there

**Real example from this session:**

- Tried 10+ docker/sqlite3 commands, all blocked by Bubblewrap
- User got frustrated: "More fucking bubblewrap"
- User had to manually run fix scripts
- Finally user said: "You did something then wasted my time by not telling me to un-check that box"
- Should have told user about sandbox setting after FIRST failure

**The lesson**: Bubblewrap errors are a USER SETTINGS issue, not a COMMAND SYNTAX issue. Don't waste time retrying - inform user about the setting immediately.

### 16. Accepting Unnecessary Infrastructure Without Questioning

**Pattern**: Documentation mentions "optional production Ghost with MySQL" → assume it's needed → don't question why → wastes Docker resources
**Why**: AI assumes existing infrastructure has a purpose without validating the use case
**Fix**: Question infrastructure that isn't actively used:

```bash
# Check if infrastructure is actually used
grep -r "ghost-prod" scripts/ test/        # Any scripts use it?
grep -r "ghost:prod" **/*.md               # Documented use cases?
docker compose ps                          # Is it even running?

# For Ghost theme development:
# - SQLite vs MySQL makes ZERO difference to theme code
# - Themes use Ghost API/helpers, not database directly
# - Real "production testing" = deploy to actual production
# - MySQL container = ~500MB image + runtime memory waste

# Infrastructure checklist:
# ✓ Does it solve a real problem?
# ✓ Is it actively used by scripts/tests?
# ✓ Does the benefit justify the complexity/resources?
# ✗ Is it "nice to have" but never actually needed?
```

**Real example from this fork:**

- docker-compose.yml had ghost-prod (MySQL) and db (MySQL 8.0) services
- Marked as "optional" for "production-like testing"
- No scripts used it, no tests depended on it
- For Ghost themes: database backend is irrelevant (API is identical)
- Removed: 2 containers, 6 volumes, ~500MB image, complexity
- Benefit: Simpler architecture, less memory usage, clearer documentation

**The lesson**: Don't assume existing infrastructure is justified. Question "optional" and "production-like" features. If there's no concrete use case and it's not actively used, it's technical debt masquerading as flexibility.

**Red flags for unnecessary infrastructure:**

- Marked as "optional" with no mandatory use case
- Never starts by default (requires special flag/profile)
- No scripts or tests depend on it
- Documentation doesn't explain when/why to use it
- "Production-like" without explaining what production difference matters
- Adds complexity without solving a real problem

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
{{! ❌ WRONG - Ghost 7+ only helper }} {{reading_time}} {{! ✅ RIGHT - Ghost 6.0+ compatible }}
{{#if feature_image}}
  {{img_url feature_image size="l"}}
{{/if}} {{! Check version compatibility:
     https://ghost.org/docs/themes/helpers/
     pnpm test (GScan validates) }}
```

**Template context is route-specific** (check available objects):

```handlebars
{{! Each template has specific context objects }} {{! index.hbs: posts, pagination }}
{{! post.hbs: post, author }} {{! tag.hbs: tag, posts }} {{! author.hbs: author, posts }}
{{! ❌ WRONG - using undefined context }} {{!-- tag.hbs trying to use {{author}} --}}
{{! ✅ RIGHT - check Ghost docs for context }} {{! https://ghost.org/docs/themes/context/ }}
```

**Fork customizations must be marked** (for future merge clarity):

```handlebars
{{! FORK CUSTOM: Public Ledger password protection UI }}
<div class="custom-login">{{t "Access site"}} {{! FORK CUSTOM: Not "Access code" }}</div>
```

### 17. Making Changes Without Understanding Current State

**Pattern**: User reports issue → AI immediately starts "fixing" → changes break working code → user frustrated because AI didn't investigate first
**Why**: AI defaults to "action mode" without understanding what's already working vs what's actually broken
**Fix**: ALWAYS investigate current state before making changes:

```bash
# ❌ WRONG - immediate action
# User: "routes.yaml not working"
# AI: *edits routes.yaml immediately*

# ✅ RIGHT - understand first, act second
# 1. What's the ACTUAL state?
docker exec ghost-dev cat /var/lib/ghost/content/settings/routes.yaml
git status routes.yaml
git diff routes.yaml

# 2. What's the REPORTED problem?
# - User sees 404
# - User sees wrong content
# - User can't deploy routes
# Ask: "What specifically isn't working?"

# 3. Is it actually broken or just misunderstood?
curl -s http://localhost:3001/donor/test/ | head -20
# 404 from Ghost = routes ARE working (Ghost recognized /donor/{slug}/ pattern)
# 404 from template = content issue, not routes issue

# 4. What are the constraints?
cat AGENTS.md | grep -A20 "routes.yaml"
# Maybe there's architectural reasons for current state
```

**Real example from this session:**

- User asked to verify `/donor/{slug}/` route works
- AI saw 404 → assumed route broken → changed `/donors/{id}/` to `/donor/{slug}/`
- Actual problem: Ghost WAS routing correctly, 404 was because no Page existed
- AI overwrote user's intentional work without understanding current state
- Correct approach: Check if route recognized → check if Page exists → test with correct slug

**Critical distinction:**

- **Ghost 404 (error.hbs)** = Route not recognized in routes.yaml
- **Template 404 (custom message)** = Route works, but template can't find content
- **These look similar** but have completely different solutions
- One needs routes.yaml fix, other needs Page creation
- AI must investigate to distinguish them

**Investigation protocol before ANY edit:**

```bash
# 1. Current file state
git diff path/to/file
git log -1 --oneline path/to/file  # Last commit touching this file

# 2. Running system state
docker compose ps
curl -sI http://localhost:3001  # Is Ghost responding?

# 3. Expected vs actual behavior
# User: "X should happen"
# Verify: Does X actually not happen? Or is user misinterpreting output?

# 4. Root cause analysis
# Don't fix symptoms, find the actual problem
# Template error vs routes error vs Ghost config error vs content error

# 5. Check documentation/architecture
grep -r "feature" AGENTS.md AI_DEVELOPMENT.md docs-local/
# Is current behavior INTENTIONAL per architecture docs?
```

**When user says "not working":**

1. Ask: "What specifically is not working? What do you see vs expect?"
2. Investigate: Check actual state vs reported state
3. Verify: Is it actually broken or expected behavior?
4. Root cause: What's the underlying issue?
5. Then (and only then): Propose solution

**When user says "fix this":**

1. Understand: What exactly needs fixing?
2. Current state: What's the code doing now?
3. Constraints: Are there architectural reasons for current state?
4. Impact: What else might this change affect?
5. Then: Make minimal targeted change

**Red flags for "acting without understanding":**

- Immediately editing files without investigating current state
- Changing code that user just finished working on
- "Fixing" something that might be intentionally designed that way
- Making multiple speculative changes hoping one works
- Not asking clarifying questions when problem is unclear
- Assuming routes.yaml format without checking architecture docs
- Editing Ghost config without verifying Ghost is actually broken

**The lesson**: STOP. INVESTIGATE. UNDERSTAND. Then (and only then) act. Most "helpful fixes" that waste user's time come from skipping investigation and jumping straight to "solutions" for problems you haven't actually diagnosed.

### 18. Ghost Restart Commands Cause Terminal Hangs

**Pattern**: Need routes to register → run `pnpm ghost:restart` or `docker restart ghost-dev` → terminal hangs indefinitely (hours) → AI agent freezes and stops responding → user's machine fans spin up → forced to rebuild container
**Why**: The devcontainer uses `network_mode: service:ghost-dev`, which means it shares the ghost-dev container's network namespace. When you try to restart ghost-dev from inside the devcontainer:

1. The restart command tells ghost-dev to stop
2. The network namespace shared by devcontainer is destroyed
3. The devcontainer loses network connectivity mid-command
4. The command never receives the completion signal
5. The terminal hangs indefinitely (hours)
6. **AI agent execution freezes** - cannot complete the tool call, cannot proceed with work

**Fix**: NEVER restart Ghost via terminal commands from within the devcontainer. Use alternative approaches:

```bash
# ❌ WRONG - causes terminal hang and AI freeze
pnpm ghost:restart
docker compose -f .devcontainer/docker-compose.yml restart ghost-dev
docker restart ghost-dev
docker compose restart ghost-dev

# ✅ RIGHT - for route registration
pnpm ghost:refresh  # Re-uploads routes.yaml via Admin API, no restart needed

# ✅ RIGHT - for theme changes
# Theme changes are auto-detected by Ghost via volume mount
# No restart needed - just refresh browser
pnpm dev  # Compile assets, Ghost picks up changes automatically

# ✅ RIGHT - when restart truly needed
# Tell user: "Container rebuild required from host terminal (outside VS Code)"
# User must close VS Code, run from host:
cd ~/path/to/repo
docker compose -f .devcontainer/docker-compose.yml down
docker compose -f .devcontainer/docker-compose.yml up -d
```

**Why Ghost restart is rarely needed:**

- **Theme file changes**: Auto-detected via mounted volume (`/var/lib/ghost/content/themes/headline`)
- **Asset compilation**: `pnpm dev` compiles CSS/JS, Ghost serves updated files on next request
- **Database changes**: Direct SQLite INSERT/UPDATE are instant, no restart needed
- **Route registration**: Use `pnpm ghost:refresh` (scripts/refresh-routes.sh) which safely re-uploads routes.yaml via Admin API

**When routes don't register after database changes:**

```bash
# ❌ WRONG - restart Ghost (terminal hangs, AI freezes)
pnpm ghost:restart

# ✅ RIGHT - use safe refresh command
pnpm ghost:refresh  # Re-uploads routes.yaml via API, triggers route reload

# ✅ ALSO RIGHT - use Admin UI slug edit (if refresh doesn't work)
# 1. Open page in Ghost Admin
# 2. Settings panel → slug field
# 3. Change slug to temp value → Update
# 4. Change slug back to original → Update
# 5. Route now registered

# ✅ LAST RESORT - tell user to rebuild container from host
# "Route registration requires container rebuild. Please:"
# 1. Close VS Code
# 2. Run from host terminal:
#    cd ~/path/to/repo
#    docker compose -f .devcontainer/docker-compose.yml down
#    docker compose -f .devcontainer/docker-compose.yml up -d
# 3. Reopen VS Code
```

**Real example from this session:**

- Migrated 4 pages from `-demo` slugs to production names via SQL
- Routes showed 404 (not registered)
- AI attempted `pnpm ghost:restart` → terminal hung completely for hours
- AI agent execution froze mid-task, could not respond to user
- User's machine fans spun up from blocked process waiting indefinitely
- User extremely frustrated: "FUCK YOU. YOU ARE WASTING SO MUCH OF MY TIME."
- User forced to stop container rebuild to recover
- Root cause: `network_mode: service:ghost-dev` causes network namespace loss during restart
- Correct approach: Use `pnpm ghost:refresh` OR tell user container rebuild needed from host

**Technical explanation of the hang:**

```yaml
# From .devcontainer/docker-compose.yml:
devcontainer:
  network_mode: service:ghost-dev  # ← SHARES ghost-dev's network namespace
  
# What happens during restart:
# 1. devcontainer runs: docker restart ghost-dev
# 2. ghost-dev stops → network namespace destroyed
# 3. devcontainer loses network connection MID-COMMAND
# 4. Command never gets completion signal from Docker daemon
# 5. Terminal waits forever for response that can never arrive
# 6. AI agent frozen waiting for tool call to complete
```

**Detection and prevention:**

- **NEVER** run any command containing `restart ghost` or `docker.*restart.*ghost`
- **NEVER** run `pnpm ghost:restart` (it's intentionally disabled with error message)
- **ALWAYS** check `/memories/repo/devcontainer-rules.md` for safe alternatives
- **ALWAYS** use `pnpm ghost:refresh` for route registration
- If you're thinking "Ghost needs restart" → CHECK: Is there a safe alternative?

**When AI agent freezes:**

- User will see: Terminal command running for minutes/hours with no output
- AI cannot respond to messages
- AI cannot proceed with work
- Only solution: User must cancel the command or rebuild container
- Prevention: Never run restart commands in first place

**Critical rule:**

**NEVER RESTART GHOST FROM WITHIN THE DEVCONTAINER.** Use `pnpm ghost:refresh` for routes, or tell user to rebuild container from host terminal. Terminal hangs are not recoverable and waste hours of user time.

See `/memories/repo/devcontainer-rules.md` for complete guidelines and safe alternatives.

### 19. Blocking Devcontainer Setup on External API Availability

**Pattern**: Add network health check for external API → devcontainer setup hangs indefinitely → user can't start container → deployment blocked
**Why**: AI assumes external APIs (GitHub, Copilot, etc.) are always available and doesn't add timeouts or failure handling
**Fix**: NEVER block container startup/setup on external API availability:

```bash
# ❌ WRONG - infinite blocking loop in postCreateCommand
"postCreateCommand": "pnpm install && until curl -s https://api.individual.githubcopilot.com > /dev/null; do sleep 1; done"
# If API unreachable: loops forever, container never finishes setup
# If network down: infinite hang
# If firewall blocks: infinite hang
# User can't proceed, can't debug, can't work

# ✅ RIGHT - no external dependencies for container setup
"postCreateCommand": "pnpm install && pnpm gulp build && echo '✓ Theme built and ready'"
# Container setup completes regardless of network state
# Extensions handle their own connectivity (Copilot, GitHub, etc.)
# User can start working immediately
```

**Real example from this commit:**

```bash
# Commit 6ef5084 added:
"postCreateCommand": "pnpm install && pnpm gulp build && sleep 10 && echo '✓ Theme built and ready' && until curl -s https://api.individual.githubcopilot.com > /dev/null; do sleep 1; done"

# Result: Container hung indefinitely on:
# - Network issues
# - Firewall blocking api.individual.githubcopilot.com
# - API maintenance/downtime
# - Offline development

# No timeout, no error handling, no escape hatch
# Complete showstopper for devcontainer usage
```

**Why this is catastrophic:**

- **Breaks offline development**: Can't work without internet
- **No timeout**: Infinite loop, never fails, never progresses
- **Silent failure**: No error message, just hangs forever
- **Breaks deployment**: CI/CD can't build containers
- **User frustration**: "Congratulations! You broke the entire devcontainer"
- **Not fixable without source edit**: Can't override from environment

**Critical rules for devcontainer setup:**

1. **NEVER** check external API availability in `postCreateCommand` or `postStartCommand`
2. **NEVER** use infinite loops (`until...; do...; done`) without timeout
3. **ALWAYS** assume network may be unavailable
4. **ALWAYS** let extensions handle their own connectivity
5. **Container setup = local operations only** (install, build, configure)

**Acceptable devcontainer setup operations:**

```bash
# ✓ Install local dependencies
pnpm install

# ✓ Build assets from source
pnpm gulp build

# ✓ Wait for LOCAL services with timeout
timeout 120 sh -c 'while [ ! -f /workspace/.ghost-setup-complete ]; do sleep 1; done'

# ✓ Create files/directories
mkdir -p logs && touch .setup-complete

# ✗ NEVER check external APIs
curl https://api.github.com
curl https://api.individual.githubcopilot.com
wget https://registry.npmjs.org
```

**If you need to verify external connectivity:**

```bash
# ❌ WRONG - block setup
"postCreateCommand": "pnpm install && until curl -s https://api.example.com; do sleep 1; done"

# ✅ RIGHT - optional check with timeout and failure tolerance
"postCreateCommand": "pnpm install && pnpm build && echo '✓ Ready' || echo '⚠ Build had warnings but container is ready'"

# ✅ ALSO RIGHT - background check that doesn't block
"postCreateCommand": "pnpm install && pnpm build && (curl -s https://api.example.com >/dev/null 2>&1 && echo '✓ Network OK' || echo '⚠ Network may be limited') &"
```

**Detection signals:**

- You're about to add `curl` or `wget` in `postCreateCommand`
- You're checking connectivity to GitHub, Copilot, NPM registry, etc.
- You're using `until...do...done` without timeout
- You're assuming network is always available
- Setup depends on external service being reachable

**The lesson**: Devcontainer setup must complete successfully regardless of external network availability. Extensions handle their own connectivity. NEVER block container startup on external APIs. Always prioritize: install local deps → build from source → mark ready. Everything else is optional and must not block.

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
- **Helpers**: Check <https://ghost.org/docs/themes/helpers/> for version support
- **Context**: Route-specific - <https://ghost.org/docs/themes/context/>

### Development Environment

- **Devcontainer**: Multi-container Docker (devcontainer workspace, ghost-dev on port 3001 with SQLite)
- **Node**: 24+ (container requirement, don't downgrade)
- **Asset compilation**: `pnpm dev` watches source files → compiles to built/
- **Live reload**: Theme mounted at `/var/lib/ghost/content/themes/headline`
- **Testing**: View at <http://localhost:3001>, logs via `pnpm ghost:logs`

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
- [ ] Test in devcontainer at <http://localhost:3001>
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

```text
Is it repeating across multiple sessions?
├─ NO → Don't add to AGENT_LESSONS.md (one-time bug)
└─ YES → Is it about AI behavior or a technical constraint?
    ├─ AI behavior → Add to "Chronic AI Behavioral Patterns"
    │   └─ Ask: Does it represent a CLASS of thinking error?
    │       ├─ YES → Write it abstractly (e.g., "fork identity confusion")
    │       └─ NO → Too specific, skip it
    └─ Technical constraint → Add to "Before Writing Any Code"
        └─ Ask: Will this apply to future code or just current code?
            ├─ Future → Document the pattern (e.g., "Ghost helpers have version constraints")
            └─ Current only → Add inline comment to the code instead
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

````text

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
```
````

**Keep it lean**: If 3 sessions have similar mistakes, abstract them into ONE pattern. Don't list all 3 separately.

---

**Last Updated**: 2026-06-29
**Fork Status**: 5 ahead, ~19 behind (see sync/UPSTREAM_SYNC.md)
**Ghost Version**: 6.0+ support (see package.json)
