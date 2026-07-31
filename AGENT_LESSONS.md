# Agent Guide: Ghost Headline Theme Fork

**Purpose**: Stop repeating mistakes that break fork identity, upstream sync, or
Ghost compatibility. Think like code review.

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
head -100 sync/README.md
grep -A10 "Never change" AI_DEVELOPMENT.md
grep -E "name|author|engines" package.json

# 4. Check upstream sync status
git fetch upstream
git log --oneline upstream/main..HEAD  # What we're ahead
git log --oneline HEAD..upstream/main  # What we're behind

# 5. Verify devcontainer works
docker compose ps                      # from the HOST
curl -s http://localhost:2368 | head   # from INSIDE the devcontainer
pnpm ghost:verify                      # every data route at once
```

**If you skip this**, you will:

- Edit `package.json` name/author and break fork identity
- Modify files that conflict with pending upstream changes
- Use Ghost helpers incompatible with Ghost 6.0+
- Edit `assets/built/*` instead of source files
- Break devcontainer assumptions (ports, volumes, Node version)
- Skip GScan validation and ship incompatible themes

**This is not optional.** Every HIGH priority issue in code review came from
skipping this audit.

---

## 🎯 The Core Problem: Isolated Fixes Without Fork Context

**What keeps happening**: AI agents (me) solve individual problems without
understanding the fork architecture:

- Fix a template bug → don't check if file has pending upstream changes
- Update dependencies → don't preserve Node 24 requirement or `ghost:*` scripts
- Add helpful features → don't mark with `{{!-- FORK CUSTOM: ... --}}` comments
- Edit CSS → compile `assets/built/*` directly instead of source files
- Write clever code → don't validate against Ghost 6.0 API constraints

**The consequence**: Code works locally but **breaks the fork**:

- Upstream merge conflicts because we touched conflicting files
- Deployment fails because `package.json` name changed
- Theme fails GScan validation due to Ghost API incompatibilities
- Devcontainer breaks because Node version requirement removed
- Production issues because we edited built assets that get overwritten on next
  compile

**The fix**: Before making ANY change, ask **"Does this preserve fork identity
and account for upstream merges?"**

Think holistically about the **fork lifecycle**:

1. Local dev in devcontainer → asset compilation → Ghost live reload
2. Commit → push to staging → GitHub Actions deployment
3. Upstream releases new version → fetch → merge → resolve conflicts
4. Production theme must work with Ghost 6.0+ API

**What "fork context" means**:

- Read `sync/README.md` to see which files have upstream conflicts
- Check `package.json` for protected fields (name, author, engines.node,
  `ghost:*` scripts)
- Verify Ghost helper compatibility with `pnpm test` (GScan)
- Test in an actual Ghost instance, not just file edits
- Mark custom code with `{{!-- FORK CUSTOM: reason --}}` for future merge clarity

**Examples of holistic thinking**:

- ❌ "Update all dependencies to latest" → ✅ "Check sync/README.md first -
  upstream might have updated them differently"
- ❌ "Edit assets/built/screen.css for quick fix" → ✅ "Edit
  assets/css/screen.css source, run pnpm dev to compile"
- ❌ "Use new Ghost 7 helper for feature" → ✅ "Fork supports Ghost 6.0+, check
  compatibility first"
- ❌ "Change package.json name to 'headline'" → ✅ "NEVER - fork identity is
  'publicledger-headline-fork'"

**Stop fixing symptoms, understand the system**: Every bug caught in code review
is a symptom of not auditing fork constraints before writing code.

---

## 🧠 Chronic AI Behavioral Patterns

**These mistakes repeat across development cycles** - awareness is the first step
to prevention:

### 1. Breaking Fork Identity Without Realizing It

**Pattern**: "Let's clean up package.json" → change name to match upstream →
deployment automation breaks silently  
**Why**: AI sees mismatched names as "inconsistency to fix" without understanding
fork identity is INTENTIONAL  
**Fix**: Before editing package.json, run:

```bash
grep -E "name|author|engines" package.json
grep -A5 "Never change" AI_DEVELOPMENT.md
pnpm validate:fork
# If these fields differ from upstream, IT'S ON PURPOSE
```

Note the direction of the author rule: `author` must stay **Ghost Foundation**
because the MIT license requires it. Fork attribution lives in `contributors`.
Getting this backwards fails `pnpm validate:fork`.

### 2. Editing Built Assets Instead of Source Files

**Pattern**: See CSS bug in devtools → edit `assets/built/screen.css` → fix
disappears on next `pnpm dev`  
**Why**: AI follows file paths from browser without understanding build
pipeline  
**Fix**: Never edit generated output - always edit source:

```bash
# ❌ WRONG
vim assets/built/screen.css
vim partials/generated/picker-offices.hbs

# ✅ RIGHT
vim assets/css/screen.css
pnpm dev  # Compile to built/, regenerate partials/generated/
```

### 3. Not Checking Upstream Sync Status Before Editing

**Pattern**: "Let's modernize gulpfile.js" → implement changes → merge conflict
when syncing upstream who also updated it  
**Why**: AI doesn't naturally check git history before proposing changes  
**Fix**: Before editing ANY file, check if upstream touched it:

```bash
git fetch upstream
git log upstream/main..HEAD -- path/to/file  # Our changes
git log HEAD..upstream/main -- path/to/file  # Their changes
grep "path/to/file" sync/README.md           # Known conflicts?
```

### 4. Ghost API Version Assumptions

**Pattern**: Use `{{reading_time}}` helper → works in Ghost 7 dev instance →
fails in production Ghost 6  
**Why**: AI suggests latest Ghost features without checking supported version
range  
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

**Pattern**: Edit Handlebars template → looks syntactically correct → runtime
error because context object doesn't exist  
**Why**: Templates are data-driven - syntax correctness ≠ runtime correctness  
**Fix**: Always test in running Ghost:

```bash
docker compose ps                        # from the HOST
curl -sI http://localhost:2368/          # from INSIDE the devcontainer
pnpm ghost:verify                        # every collection permalink
docker compose logs ghost-dev            # template errors (from the HOST)
```

### 6. Handlebars Context Confusion

**Pattern**: Try to use `{{author}}` in tag.hbs → undefined because tag context
doesn't include author  
**Why**: Each route/template has specific Ghost context objects available  
**Fix**: Understand context before using variables:

```handlebars
{{! ❌ WRONG - author not in tag context }}
{{#tag}}<p>By {{author.name}}</p>{{/tag}}

{{! ✅ RIGHT - check available context }}
{{! tag.hbs has: tag, posts }}
{{! post.hbs has: post, author }}
{{! custom-*.hbs has NOTHING until you open {{#post}} }}
{{! See: https://ghost.org/docs/themes/context/ }}
```

### 7. Missing GScan Validation

**Pattern**: Implement template changes → commit → theme rejected by Ghost admin
because failed GScan validation  
**Why**: Ghost has strict theme requirements (required templates, helpers,
metadata)  
**Fix**: Always validate before committing:

```bash
pnpm test      # Quick validation
pnpm validate  # Verbose report with warnings
pnpm zip       # Build production package (also validates)
```

### 8. Not Marking Fork-Specific Code

**Pattern**: Add custom feature → no comments → future upstream merge can't tell
if code is ours or theirs → accidental deletion  
**Why**: Without markers, fork customizations look like upstream code during
merges  
**Fix**: Mark ALL custom code:

```handlebars
{{!-- FORK CUSTOM: Password protection UI for Public Ledger --}}
<div class="custom-password-form">
  {{t "Access site"}}{{! Custom translation string }}
</div>
```

### 9. Devcontainer Environment Assumptions

**Pattern**: "Let's support Node 18 for broader compatibility" → remove Node 24
requirement → devcontainer build fails  
**Why**: Devcontainer is BUILT for Node 24 - changing requirement breaks
container  
**Fix**: Devcontainer constraints are immutable:

```bash
# These are FIXED by container environment:
# - Node 24+ (engines.node in package.json)
# - Ghost ports (2368 inside, published on the host as 3001)
# - Theme mount (/var/lib/ghost/content/themes/publicledger-headline-fork)
# - Volume names (ghost-dev-data, ghost-dev-images, etc.)

# Check before changing:
cat .devcontainer/docker-compose.yml
cat .devcontainer/devcontainer.json
```

### 10. Dependency Updates Without Upstream Check

**Pattern**: See Dependabot alert → update package → conflicts with upstream's
simultaneous update → merge nightmare  
**Why**: Both fork and upstream maintain dependencies - uncoordinated updates
collide  
**Fix**: Before updating dependencies:

```bash
# Check if upstream already updated
git fetch upstream
git log upstream/main -- package.json
git diff upstream/main -- package.json

# If upstream updated recently, wait for sync instead of doing it ourselves
```

Fork-only dev tools are named in `_comment_devDependencies`. Keep those; take
upstream's versions for everything else.

### 11. Translation String Modifications

**Pattern**: "Let's fix this typo in 'Access code'" → edit locales/en.json → undo
our intentional customization  
**Why**: Some strings are INTENTIONALLY different from upstream (fork
customization)  
**Fix**: Check if string is fork-custom before editing:

```bash
grep "Access site\|Password" locales/en.json  # Fork-specific strings
grep "locales/en.json" AI_DEVELOPMENT.md      # Protected files
# "Access site" not "Access code" is INTENTIONAL
```

### 12. Implementing Features Without Considering Upstream Merge Impact

**Pattern**: Add complex custom partial → upstream adds same-named partial with
different purpose → merge conflict + feature clash  
**Why**: Thinking "this is a fork, we can do whatever" without planning for
continuous upstream integration  
**Fix**: Design fork customizations to minimize merge conflicts:

```bash
# ❌ RISKY - likely to conflict with upstream
partials/loop.hbs           # Upstream frequently updates
default.hbs                 # Core template

# ✅ SAFER - unlikely to conflict
partials/pl-*.hbs           # Fork prefix
custom-*.hbs templates      # Custom templates
scripts/*                   # Fork-only tooling
.devcontainer/*             # Fork-only directory
```

### 13. Expecting Templates to Read the Data Package

**Pattern**: "The card is stale, let's make the template fetch fresh data" → add
a `{{#get}}` or a `require()` in a helper → nothing works, or it works locally
and breaks in production  
**Why**: AI assumes a theme is an ordinary Node app with filesystem and network
access  
**Fix**: Understand where the data actually enters the page.

Ghost themes are **sandboxed**. A `.hbs` template cannot read
`@publicledger/data` at render time - not from disk, not over HTTP. Instead:

- `scripts/cards/*` render each card to HTML **in Node, at seed time**
- `scripts/seed-record.js` stores that HTML as a Lexical `html` node in the post
  body via the Ghost Admin API
- The card ships inside Ghost's server response like any other post content

```bash
# Where a card's markup actually comes from
cat scripts/cards/index.js        # renderer registry
grep -n "cards:" scripts/seed-record.js   # which cards each type gets

# Refresh a card: re-seed. There is no cache to clear.
pnpm ghost:records
```

**Consequences that keep catching people out:**

1. **A card is a snapshot.** Data changed? Re-seed. Nothing invalidates itself.
2. **Hand-editing card HTML in Admin is pointless** - the next seed overwrites
   it. Change the renderer instead.
3. **A card that throws leaves a visible `custom-card-error` block** rather than
   aborting the seed. That is deliberate: a broken card is exactly what an editor
   needs to see.
4. **Cards look unstyled in Ghost Admin.** Admin injects card HTML raw with none
   of the theme CSS and strips `<style>` via DOMPurify. Each card therefore
   carries two class sets - `.custom-card-admin` (a chip styled by Admin's own
   Tailwind build) and `.custom-card-body` (hidden in Admin, shown by the theme).
   Judge a card from the public URL, never the editor.

```bash
# After a Ghost upgrade, confirm the Admin utility classes still exist.
# Ghost's Tailwind build is purged, so a class it stopped using silently
# degrades the chip to unstyled text.
node scripts/check-admin-classes.js
```

**Documentation references:**

- Architecture: `AGENTS.md` → "Architecture: Collection-Backed Data Routes"
- Troubleshooting: `TROUBLESHOOTING.md` → "Data Collection Issues"
- Developer guide: `CONTRIBUTING.md` → "Data Route Architecture"

### 14. Forgetting Ghost's Routing Constraints

**Pattern**: "Let's add a route for `/finance/{jurisdiction}/{year}/`" → write it
under `routes:` → the URL 404s forever  
**Why**: AI pattern-matches on other frameworks where path parameters in a route
table are normal  
**Fix**: Ghost's `routes:` block does **not** support path parameters. A key like
`/jobs/{agency}/{seat}/` is a LITERAL path and never matches - verified against
Ghost 6.53. Placeholders are only valid in a collection `permalink:`, and only
these exist:

```text
{slug} {id} {primary_tag} {primary_author} {year} {month} {day} {author}
```

So every multi-segment data URL is a **collection**, and the record is a Post
whose slug is the entity and whose primary tag is the parent.

```yaml
# ❌ WRONG - literal path, never matches
routes:
  /jobs/{agency}/{seat}/:
    template: job-agency-seat

# ✅ RIGHT - collection with a permalink
collections:
  /jobs/:
    permalink: /jobs/{primary_tag}/{slug}/
    filter: tag:hash-job
    template: job
```

**Two more rules that bite:**

- Ghost requires every post to belong to **exactly one** collection. The
  `/articles/` catch-all must exclude every data collection, or Ghost rejects the
  entire routes file and every route 404s.
- Ghost reads `routes.yaml` at boot or on upload only. After editing it, run
  `pnpm ghost:refresh` then `pnpm ghost:verify`.

### 15. Creating Files Without Checking Upstream for Name Conflicts

**Pattern**: Create AGENTS.md for AI development guidelines → later discover
upstream has AGENTS.md for monorepo documentation → merge conflict on every
upstream sync → forced to rename  
**Why**: AI creates files based on current fork needs without checking if
upstream already uses that filename  
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
- Forced to rename → `AI_DEVELOPMENT.md` + update 5 files
- Prevention: `git ls-tree -r upstream/main --name-only | grep AGENTS` would have
  caught this

**The three files this still applies to**: `README.md`, `AGENTS.md` and
`CLAUDE.md` exist in both trees. Only the fork note at the top of `README.md` is
ours. All three are excluded from `pnpm lint:md` so a formatting pass cannot
quietly rewrite upstream content.

**The lesson**: Upstream is actively developed. Always check their file tree
before creating repo-root files.

**The meta-lesson**: AI agents work in isolation and forget this is a LIVING FORK
that continuously integrates upstream changes. You must actively fight this by
checking sync status, preserving identity, and planning for merge conflicts.

### 16. Package Manager Inconsistency in Documentation

**Pattern**: Documentation mixes `npm run <script>` and `pnpm <script>` commands
→ confuses developers → potential installation issues if wrong package manager
used  
**Why**: AI treats npm and pnpm as interchangeable without checking project's
explicit packageManager specification  
**Fix**: Always check package manager before documenting commands:

```bash
# Check project's package manager
grep "packageManager" package.json
# "packageManager": "pnpm@11.9.0"  <- This is explicit and pinned

# ❌ WRONG - mixed commands
npm run test
pnpm dev
npm run lint

# ✅ RIGHT - consistent pnpm
pnpm test
pnpm dev
pnpm lint
```

**Why this matters:**

- **Package manager is pinned** in package.json
  (`"packageManager": "pnpm@11.9.0"`)
- **npm and pnpm have different behaviors** (lockfiles, scripts execution,
  dependency resolution)
- **Inconsistent docs confuse developers** - which command is correct?
- **CI/CD may enforce package manager** - GitHub Actions checks packageManager
  field
- **pnpm shorthand works** - `pnpm dev` instead of `npm run dev`

**How to audit documentation:**

```bash
# Find all npm run commands in docs
grep -rn "npm run\|npm dev\|npm test\|npm ghost" --include=*.md .

# Should be zero matches (except references to npm registry or npm as concept)
# Replace all with pnpm equivalents
```

**Second half of the same lesson: only document scripts that exist.**

```bash
# Every pnpm command in a doc must resolve
node -e 'console.log(Object.keys(require("./package.json").scripts).join("\n"))'
```

Documentation once described `ghost:logs`, `ghost:check`, `ghost:setup`,
`ghost:open`, `ghost:info`, `check-env` and `build:routes`. None of them existed.
Inventing a script name in docs is worse than omitting it: readers burn time
before concluding their environment is broken.

**The lesson**: Check the project's specified package manager BEFORE writing any
installation or command documentation, and verify each script name against
`package.json`.

### 17. Bubblewrap Sandbox Blocking Terminal Commands

**Pattern**: Try to run docker/database commands → "Bubblewrap repair failed" →
retry with different command variations → waste user's time asking them to run
commands → don't tell user about sandbox setting  
**Why**: AI doesn't check VS Code terminal execution settings and keeps retrying
failed commands instead of informing user about the sandbox permission issue  
**Fix**: When Bubblewrap errors occur, IMMEDIATELY tell user to check terminal
settings:

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
- Finally user said: "You did something then wasted my time by not telling me to
  un-check that box"
- Should have told user about sandbox setting after FIRST failure

**The lesson**: Bubblewrap errors are a USER SETTINGS issue, not a COMMAND SYNTAX
issue. Don't waste time retrying - inform user about the setting immediately.

### 18. Accepting Unnecessary Infrastructure Without Questioning

**Pattern**: Documentation mentions "optional production Ghost with MySQL" →
assume it's needed → don't question why → wastes Docker resources  
**Why**: AI assumes existing infrastructure has a purpose without validating the
use case  
**Fix**: Question infrastructure that isn't actively used:

```bash
# Check if infrastructure is actually used
grep -r "ghost-prod" scripts/ test/        # Any scripts use it?
grep -rn "ghost:prod" --include=*.md .     # Documented use cases?
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

**The lesson**: Don't assume existing infrastructure is justified. Question
"optional" and "production-like" features. If there's no concrete use case and
it's not actively used, it's technical debt masquerading as flexibility.

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
grep -E "name|author|engines" package.json
# name: "publicledger-headline-fork" - NEVER CHANGE
# author: Ghost Foundation - NEVER CHANGE (MIT license requirement)
# engines.node: ">=24.0.0" - NEVER CHANGE

# 2. Check upstream sync status for target file
git fetch upstream
git log upstream/main..HEAD -- path/to/file    # Our changes
git log HEAD..upstream/main -- path/to/file    # Their changes
grep "path/to/file" sync/README.md             # Documented conflicts?

# 3. If creating NEW files, check upstream for name conflicts
git ls-tree -r upstream/main --name-only | grep "^NEW_FILE_NAME"
# If exists: choose different name to avoid merge conflicts

# 4. Verify Ghost compatibility
pnpm test  # GScan validation for Ghost 6.0+

# 5. Check if devcontainer is running
docker compose ps                # from the HOST
pnpm ghost:verify                # from INSIDE the devcontainer
```

**Built assets are read-only** (edit source files, not compiled output):

```bash
# ❌ WRONG - editing generated files
vim assets/built/screen.css
vim assets/built/main.min.js
vim partials/generated/picker-offices.hbs

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
{{! index.hbs:    posts, pagination }}
{{! post.hbs:     post, author }}
{{! tag.hbs:      tag, posts }}
{{! author.hbs:   author, posts }}
{{! custom-*.hbs: nothing until you open {{#post}} }}

{{! ✅ RIGHT - check Ghost docs for context }}
{{! https://ghost.org/docs/themes/context/ }}
```

Inside `{{#post}}` the scope has shifted, so a partial argument must be read as
`{{../recordType}}`. A bare `{{recordType}}` resolves against the post object and
comes out empty.

**Fork customizations must be marked** (for future merge clarity):

```handlebars
{{!-- FORK CUSTOM: Public Ledger password protection UI --}}
<div class="custom-login">
  {{t "Access site"}}{{! FORK CUSTOM: Not "Access code" }}
</div>
```

### 19. Making Changes Without Understanding Current State

**Pattern**: User reports issue → AI immediately starts "fixing" → changes break
working code → user frustrated because AI didn't investigate first  
**Why**: AI defaults to "action mode" without understanding what's already
working vs what's actually broken  
**Fix**: ALWAYS investigate current state before making changes:

```bash
# ❌ WRONG - immediate action
# User: "routes.yaml not working"
# AI: *edits routes.yaml immediately*

# ✅ RIGHT - understand first, act second
# 1. What's the ACTUAL state?
bash scripts/ghost-exec.sh cat /var/lib/ghost/content/settings/routes.yaml
git status routes.yaml
git diff routes.yaml

# 2. What's the REPORTED problem?
# - User sees 404
# - User sees wrong content
# - User can't deploy routes
# Ask: "What specifically isn't working?"

# 3. Is it actually broken or just misunderstood?
curl -sI http://localhost:2368/donor/test/
# 404 from Ghost = routes ARE working (Ghost recognized /donor/{slug}/)
# 404 from template = content issue, not routes issue

# 4. What are the constraints?
grep -A20 "routes.yaml" AGENTS.md
# Maybe there's an architectural reason for the current state
```

**Real example from this session:**

- User asked to verify `/donor/{slug}/` route works
- AI saw 404 → assumed route broken → changed the route definition
- Actual problem: Ghost WAS routing correctly, 404 was because no record existed
- AI overwrote user's intentional work without understanding current state
- Correct approach: Check if route recognized → check if a record exists → test
  with a real slug

**Show, don't rebuild.** When someone reports something missing or broken, the
first deliverable is the current state made visible: the Admin link, the public
URL, the actual rendered value, the row in the database. An answer that opens
with new files buries the thing they were looking for.

**Verification traps in this repo:**

- **`updated_at` is not evidence a seed ran.** Ghost does not bump it for a
  no-op edit. Query `post_revisions.created_at` instead.
- **`pnpm ghost:seed` returning almost nothing is normal.** It uses the read-only
  Content API, which returns published pages only.
- **`localhost:3001` is not reachable from inside the devcontainer.** It shares
  ghost-dev's network namespace, so Ghost is on `localhost:2368` there.

**Critical distinction:**

- **Ghost 404 (error.hbs)** = Route not recognized in routes.yaml
- **Template 404 (custom message)** = Route works, but template can't find
  content
- **These look similar** but have completely different solutions
- AI must investigate to distinguish them

**Investigation protocol before ANY edit:**

```bash
# 1. Current file state
git diff path/to/file
git log -1 --oneline path/to/file  # Last commit touching this file

# 2. Running system state
docker compose ps                  # from the HOST
curl -sI http://localhost:2368     # from INSIDE the devcontainer

# 3. Expected vs actual behavior
# User: "X should happen"
# Verify: Does X actually not happen? Or is user misinterpreting output?

# 4. Root cause analysis
# Don't fix symptoms, find the actual problem
# Template error vs routes error vs Ghost config error vs content error

# 5. Check documentation/architecture
grep -rn "feature" AGENTS.md AI_DEVELOPMENT.md
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

**The lesson**: STOP. INVESTIGATE. UNDERSTAND. Then (and only then) act. Most
"helpful fixes" that waste user's time come from skipping investigation and
jumping straight to "solutions" for problems you haven't actually diagnosed.

### 20. Ghost Restart Commands Cause Terminal Hangs

**Pattern**: Need routes to register → run `pnpm ghost:restart` or
`docker restart ghost-dev` → terminal hangs indefinitely (hours) → AI agent
freezes and stops responding → user's machine fans spin up → forced to rebuild
container  
**Why**: The devcontainer uses `network_mode: service:ghost-dev`, which means it
shares the ghost-dev container's network namespace. When you try to restart
ghost-dev from inside the devcontainer:

1. The restart command tells ghost-dev to stop
2. The network namespace shared by devcontainer is destroyed
3. The devcontainer loses network connectivity mid-command
4. The command never receives the completion signal
5. The terminal hangs indefinitely (hours)
6. **AI agent execution freezes** - cannot complete the tool call, cannot proceed

**Fix**: NEVER restart Ghost via terminal commands from within the devcontainer.
Use alternative approaches:

```bash
# ❌ WRONG - causes terminal hang and AI freeze
pnpm ghost:restart
docker compose -f .devcontainer/docker-compose.yml restart ghost-dev
docker restart ghost-dev
docker compose restart ghost-dev

# ✅ RIGHT - for route registration
pnpm ghost:refresh  # Re-uploads routes.yaml via Admin API, no restart needed
pnpm ghost:verify   # Confirm every permalink resolves

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

`pnpm ghost:restart` is wired to print a warning and `exit 1` precisely so this
mistake fails fast instead of hanging.

**Why Ghost restart is rarely needed:**

- **Theme file changes**: Auto-detected via the mounted volume at
  `/var/lib/ghost/content/themes/publicledger-headline-fork`
- **Asset compilation**: `pnpm dev` compiles CSS/JS, Ghost serves updated files
  on next request
- **Record seeding**: `scripts/seed-record.js` goes through the Admin API, so
  Ghost registers new URLs immediately
- **Route registration**: `pnpm ghost:refresh` (scripts/refresh-routes.sh)
  re-uploads routes.yaml via the Admin API

**When routes don't register after content changes:**

```bash
# ❌ WRONG - restart Ghost (terminal hangs, AI freezes)
pnpm ghost:restart

# ✅ RIGHT - use safe refresh command
pnpm ghost:refresh  # Re-uploads routes.yaml via API, triggers route reload
pnpm ghost:verify   # Confirm

# ✅ ALSO RIGHT - use Admin UI slug edit (if refresh doesn't work)
# 1. Open the record in Ghost Admin
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
- Root cause: `network_mode: service:ghost-dev` causes network namespace loss
- Correct approach: Use `pnpm ghost:refresh` OR tell user container rebuild
  needed from host

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

- **NEVER** run any command containing `restart ghost` or
  `docker.*restart.*ghost`
- **NEVER** run `pnpm ghost:restart` (it's intentionally disabled with an error)
- **ALWAYS** use `pnpm ghost:refresh` for route registration
- If you're thinking "Ghost needs restart" → CHECK: Is there a safe alternative?

**When AI agent freezes:**

- User will see: Terminal command running for minutes/hours with no output
- AI cannot respond to messages
- AI cannot proceed with work
- Only solution: User must cancel the command or rebuild container
- Prevention: Never run restart commands in first place

**Critical rule:**

**NEVER RESTART GHOST FROM WITHIN THE DEVCONTAINER.** Use `pnpm ghost:refresh`
for routes, or tell user to rebuild container from host terminal. Terminal hangs
are not recoverable and waste hours of user time.

### 21. Blocking Devcontainer Setup on External API Availability

**Pattern**: Add network health check for external API → devcontainer setup hangs
indefinitely → user can't start container → deployment blocked  
**Why**: AI assumes external APIs (GitHub, Copilot, etc.) are always available
and doesn't add timeouts or failure handling  
**Fix**: NEVER block container startup/setup on external API availability:

```bash
# ❌ WRONG - infinite blocking loop in postCreateCommand
"postCreateCommand": "pnpm install && until curl -s https://api.example.com > /dev/null; do sleep 1; done"
# If API unreachable: loops forever, container never finishes setup
# If network down: infinite hang
# If firewall blocks: infinite hang
# User can't proceed, can't debug, can't work

# ✅ RIGHT - no external dependencies for container setup
"postCreateCommand": "bash .devcontainer/post-create.sh"
# Container setup completes regardless of network state
# Extensions handle their own connectivity (Copilot, GitHub, etc.)
# User can start working immediately
```

**Real example from this fork:**

```bash
# Commit 6ef5084 added:
"postCreateCommand": "pnpm install && pnpm gulp build && sleep 10 && until curl -s https://api.individual.githubcopilot.com > /dev/null; do sleep 1; done"

# Result: Container hung indefinitely on:
# - Network issues
# - Firewall blocking the API host
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

1. **NEVER** check external API availability in `postCreateCommand` or
   `postStartCommand`
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
timeout 180 bash -c 'until [ -f /workspace/.ghost-setup-complete ]; do sleep 2; done'

# ✓ Create files/directories
mkdir -p logs && touch .setup-complete

# ✗ NEVER check external APIs
curl https://api.github.com
wget https://registry.npmjs.org
```

**One more trap**: `postCreateCommand` runs only on container **create**, and VS
Code writes its own marker at creation time, so a partial run never retries.
Re-run it by hand rather than rebuilding:

```bash
bash .devcontainer/post-create.sh
```

**The lesson**: Devcontainer setup must complete successfully regardless of
external network availability. Extensions handle their own connectivity. NEVER
block container startup on external APIs. Always prioritize: install local
deps → build from source → mark ready. Everything else is optional and must not
block.

---

## 🚨 This Codebase Specifics

### Fork Identity (NEVER CHANGE)

- `package.json` name: `"publicledger-headline-fork"`
- `package.json` author: **Ghost Foundation** (MIT license requirement); fork
  attribution lives in `contributors` (Gasworks Data)
- `package.json` engines.node: `">=24.0.0"`
- `package.json` fork scripts: `ghost:*`, `validate:fork`, `lint*`, `format*`
- `locales/en.json` custom strings: "Access site" (not "Access code"), "Password"

### Upstream Sync

- **Last sync**: 2026-07-19 (upstream commit `cabad11`). Check the live number
  with `git fetch upstream && git rev-list --left-right --count
  upstream/main...staging`
- **High conflict files**: package.json, gulpfile.js, core templates
  (default.hbs, post.hbs, etc.)
- **Upstream-owned Markdown**: README.md, AGENTS.md, CLAUDE.md - excluded from
  `pnpm lint:md`
- **Safe custom files**: `custom-*.hbs`, `scripts/*`, `.devcontainer/*`,
  `.github/workflows/*`
- **Protocol**: See `sync/README.md` before editing shared files

### Ghost Compatibility

- **Version**: Ghost 6.0+ (not 7+ features)
- **Validation**: `pnpm test` (GScan) before every commit
- **Helpers**: Check <https://ghost.org/docs/themes/helpers/> for version support
- **Context**: Route-specific - <https://ghost.org/docs/themes/context/>

### Development Environment

- **Devcontainer**: Multi-container Docker (devcontainer workspace, ghost-dev on
  SQLite)
- **Ports**: Ghost listens on 2368; the host publishes it as 3001. Inside the
  devcontainer only 2368 works.
- **Node**: 24+ (container requirement, don't downgrade)
- **Asset compilation**: `pnpm dev` watches source files → compiles to built/
- **Live reload**: Theme mounted at
  `/var/lib/ghost/content/themes/publicledger-headline-fork`
- **Logs**: `docker compose logs -f ghost-dev` from the host

### Data Routes

- Six collections in `routes.yaml`: `/jobs/`, `/election/`, `/official/`,
  `/donor/`, `/lookup/`, `/finance/`, plus an `/articles/` catch-all
- A record is a Post: slug = entity, primary tag = parent, `#hash-*` tag selects
  the collection
- Cards are server-rendered at seed time by `scripts/cards/*`, not at render time
- Refresh with `pnpm ghost:records`, reload routes with `pnpm ghost:refresh`,
  confirm with `pnpm ghost:verify`

### Build Pipeline

```bash
pnpm dev      # Watch: assets/css/*.css → assets/built/screen.css
              #        assets/js/*.js   → assets/built/main.min.js
              #        mock data        → partials/generated/picker-*.hbs
pnpm zip      # Production build to dist/ (validates + compiles + packages)
pnpm test     # GScan validation (Ghost 6.0 compatibility)
pnpm validate # Verbose GScan report with all warnings
pnpm lint:md  # Markdown linting (80-col prose)
```

---

## 📋 Quick Checks

Before committing:

- [ ] Check `package.json` name/author/engines unchanged (`pnpm validate:fork`)
- [ ] Run `pnpm test` (GScan validation passes)
- [ ] Run `pnpm lint` and `pnpm lint:md`
- [ ] Test in devcontainer (`pnpm ghost:verify`)
- [ ] Check `docker compose logs ghost-dev` for template errors
- [ ] Mark fork-custom code with `{{!-- FORK CUSTOM: ... --}}` comments
- [ ] Check `sync/README.md` if editing shared files
- [ ] Verify edits are in SOURCE files (`assets/css/*`, `assets/js/*`), not
      `assets/built/` or `partials/generated/`
- [ ] Confirm you did not touch README.md, AGENTS.md or CLAUDE.md
- [ ] Run `pnpm zip` to ensure production build works

---

## 🔄 Updating This Document

**When code review catches a new pattern** (or you catch yourself making a
mistake):

1. Add to **"Chronic AI Behavioral Patterns"** if it's a repeating behavioral
   issue
2. Add to **"Before Writing Any Code"** if it's a technical constraint
3. Add to **"Quick Checks"** checklist if it's a pre-commit validation

**Make it concrete**: Include the actual mistake (what was written), why it
failed, and the correct pattern.

**Keep it abstract**: Focus on the class of mistake (breaking fork identity) not
the specific instance (line 5 of package.json).

**Numbering**: patterns are numbered sequentially and referenced by **title**
elsewhere in the docs, not by number. This file previously carried two `### 13.`
entries and a stray duplicate `### 4.`, which made "see Pattern #13" ambiguous.
If you renumber, check nothing links to the old number.

---

## 📝 How to Write New Rules (Template)

**Ask first**: Is this a one-time bug or a repeating pattern across multiple
sessions/PRs?

- **One-time bug** → Fix it, add a comment in the code, move on (don't document
  here)
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

**Decision tree for new entries**:

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
            ├─ Future → Document the pattern
            └─ Current only → Add inline comment to the code instead
```

**Good rule characteristics**:

- ✅ **Timeless**: Describes a class of problem, not tied to specific code
- ✅ **Actionable**: Tells you what to DO (check this, validate that) not just
  what went wrong
- ✅ **Abstract + Concrete**: General pattern + specific example to illustrate
- ✅ **Root cause aware**: Explains WHY the mistake happens (AI behavior, fork
  architecture)
- ✅ **Teaches thinking**: Shows the thought process, not just the fix

**Bad rule characteristics**:

- ❌ **Bug report**: "In PR #42 line 12 had wrong indentation" → Too specific,
  will become irrelevant
- ❌ **Code-specific**: "default.hbs line 89 should use {{post.title}}" →
  Brittle, breaks when code changes
- ❌ **Symptom-focused**: "Template error" → Doesn't explain why or how to
  prevent
- ❌ **One-time event**: "Forgot to run pnpm test" → If it only happened once,
  it's not a pattern

**Example transformation** (bug report → good rule):

❌ **Too specific**: "In post.hbs line 45, I used `{{author.website}}` which is
Ghost 7 only and broke production"

✅ **Good rule**:

````markdown
### 4. Ghost API Version Assumptions

**Pattern**: Use {{reading_time}} helper → works in Ghost 7 dev → fails in
production Ghost 6
**Why**: AI suggests latest Ghost features without checking supported version
**Fix**: Before using ANY Ghost helper, check compatibility:

```bash
grep "ghost" package.json  # ">=6.0.0"
pnpm test  # GScan validates Ghost 6.0
# https://ghost.org/docs/themes/helpers/
```
````

**Keep it lean**: If 3 sessions have similar mistakes, abstract them into ONE
pattern. Don't list all 3 separately.

---

**Last Updated**: 2026-07-31  
**Last upstream sync**: 2026-07-19 (upstream commit `cabad11`) - see
`sync/README.md`  
**Ghost Version**: 6.0+ support (see package.json)
