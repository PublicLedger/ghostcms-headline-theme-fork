# Contributing to Headline Theme Fork

This guide covers the development workflow, code quality standards, and testing
practices for the Headline theme fork.

[![Deploy Theme](https://github.com/PublicLedger/ghostcms-headline-theme-fork/actions/workflows/deploy-theme.yaml/badge.svg)](https://github.com/PublicLedger/ghostcms-headline-theme-fork/actions/workflows/deploy-theme.yaml)

## Quick Start

### Development Environment Setup

**Branch workflow**: We use `staging` for development and `main` for production.
Open PRs from `staging` to `main` for deployment.

**Recommended**: Use the VS Code devcontainer for a consistent, fully-configured
Ghost development environment.

```bash
# The container installs deps, builds, seeds and verifies routes on create.
# Nothing to do by hand — see .devcontainer/post-create.sh.

# Start asset compilation with live reload
pnpm dev

# Visit Ghost Admin to activate theme
open http://localhost:3001/ghost
```

**Manual setup** (if not using devcontainer):

```bash
# Install Node.js 24+ first
pnpm install                   # Theme dependencies
pnpm dev                       # Watch and compile assets
pnpm test                      # Validate with GScan

# Optional: Install pre-commit hooks (recommended)
pip install pre-commit         # or: brew install pre-commit
pre-commit install
```

### Verify Setup

```bash
pnpm test           # GScan validation (Ghost 6.0+ compatibility)
pnpm dev            # Compile assets and watch for changes
docker compose ps   # Verify Ghost containers running (from the host)
```

## Data Route Architecture

**Every data URL is served by a Ghost collection.** Ghost's `routes:` block does
not support path parameters - a key like `/jobs/{agency}/{seat}/` is a literal
path and never matches, verified against Ghost 6.53. Curly-brace placeholders are
only valid in a collection `permalink:`.

### Architecture Overview

A record is a **Post** whose

- `slug` is the entity → fills `{slug}`
- primary tag is the parent agency or jurisdiction → fills `{primary_tag}`
- internal `#hash-*` tag selects the collection and stays hidden from readers

`routes.yaml` defines six collections:

| Collection   | Permalink                         | Internal tag |
| ------------ | --------------------------------- | ------------ |
| `/jobs/`     | `/jobs/{primary_tag}/{slug}/`     | `#job`       |
| `/election/` | `/election/{primary_tag}/{slug}/` | `#election`  |
| `/official/` | `/official/{slug}/`               | `#official`  |
| `/donor/`    | `/donor/{slug}/`                  | `#donor`     |
| `/lookup/`   | `/lookup/{slug}/`                 | `#lookup`    |
| `/finance/`  | `/finance/{slug}/`                | `#finance`   |

Ghost requires every post to belong to **exactly one** collection, so the
`/articles/` catch-all must exclude all six. Forget that and Ghost rejects the
entire routes file.

**Two templates per collection:**

| Kind   | Files                                                                                                                                     | Role                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Index  | `job.hbs`, `election.hbs`, `official.hbs`, `donor.hbs`, `lookup.hbs`, `finance.hbs`                                                       | Section landing page with entity picker                         |
| Detail | `custom-job-agency-seat.hbs`, `custom-election.hbs`, `custom-official.hbs`, `custom-donor.hbs`, `custom-lookup.hbs`, `custom-finance.hbs` | Chosen per post in Admin; delegates to `partials/pl-record.hbs` |

### Server-Rendered Cards

Ghost themes are sandboxed, so a template **cannot** read `@publicledger/data` at
render time. Cards are rendered in Node **at seed time** by `scripts/cards/*` and
stored as Lexical `html` nodes in the post body through the Ghost Admin API
(`scripts/seed-record.js`).

The consequences are worth internalising:

- A card is a snapshot. Refreshing it means re-running `pnpm ghost:records`, not
  clearing a cache.
- Hand-editing card HTML in Ghost Admin is pointless - the next seed overwrites
  it.
- Everything else inside `{{content}}` is editor-owned: headline, prose,
  subheads, embeds, and the arrangement of the cards.

`assets/js/cards/picker-nav.js` is progressive enhancement only; with JS off the
picker form still submits and a `<noscript>` link list is available.

### Developer Workflow

**Detail templates** delegate to the shared partial:

```handlebars
{{!< default}}
{{!-- FORK CUSTOM: detail template for the /jobs/ collection. --}}
{{> "pl-record" recordType="job-seat"}}
```

Two rules that bite in `partials/pl-record.hbs`:

- `{{#post}}` is **required**. A custom post template gets no ambient post
  context; without it `{{title}}` is empty and `{{content}}` renders the literal
  `undefined`.
- Inside `{{#post}}` the scope has shifted, so a partial argument must be read as
  `{{../recordType}}`. A bare `{{recordType}}` resolves against the post object
  and comes out empty.

**Adding a card type:**

1. Write the renderer in `scripts/cards/<type>.js`
2. Register it in the `RENDERERS` map in `scripts/cards/index.js`
3. Add it to the relevant entry's `cards` array in `scripts/seed-record.js`
4. Add its stylesheet under `assets/css/cards/` and import it in `screen.css`
5. Re-seed: `pnpm ghost:records`

**Testing changes:**

1. Start Ghost: `docker compose ps` (verify running, from the host)
2. Seed records: `pnpm ghost:records`
3. Reload routing: `pnpm ghost:refresh`
4. Verify every permalink resolves: `pnpm ghost:verify`
5. Visit a route:
   <http://localhost:3001/jobs/lancaster-county/county-commissioner/>

**Common mistakes:**

- Expecting a template to read the data package at render time (it cannot)
- Omitting `{{#post}}` in a `custom-*.hbs` template
- Adding a collection without updating the `/articles/` exclusion filter
- Editing `partials/generated/*` by hand (Gulp regenerates them)
- Judging a card's appearance from Ghost Admin rather than the public URL

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for symptom-by-symptom fixes.

## Devcontainer

### What It Is

The devcontainer provides a **complete Ghost CMS environment** for theme
development with live preview. It's a multi-container Docker setup with Ghost and
Node.js pre-configured.

**Why use it:**

- **Real Ghost instance**: Test templates with actual Ghost data and routing
- **Live reload**: Theme changes automatically refresh in browser
- **Consistent environment**: Same Node.js 24, Ghost 6.0+, and build tools as
  production
- **Isolation**: Ghost and dependencies don't conflict with your system
- **Zero config**: Open in VS Code and start developing immediately

### How to Use It

**VS Code:**

1. Install
   [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
1. Open this repository in VS Code
1. Click "Reopen in Container" when prompted (or use Command Palette → "Dev
   Containers: Reopen in Container")
1. Container builds, Ghost starts, and `post-create.sh` seeds everything
   (~2 minutes first time)
1. Visit <http://localhost:3001/ghost> to log in
1. Confirm "publicledger-headline-fork" is active in Settings → Design

**GitHub Codespaces:**

- Click "Code" → "Codespaces" → "Create codespace on staging"
- Same devcontainer configuration runs in the cloud
- Access Ghost at forwarded port 3001

**After the container is up:**

```bash
pnpm dev          # Start asset compilation
```

### What's Inside

**Base image**: `node:24-alpine`

- Node.js 24 with pnpm
- Git, curl, ripgrep and standard Unix tools (musl runtime deps added in the
  Dockerfile)

**Docker Compose Services** (via `.devcontainer/docker-compose.yml`):

1. **devcontainer** (workspace):
   - Node.js 24 environment
   - Repository mounted at `/workspace`
   - VS Code runs here

2. **ghost-dev** (development Ghost):
   - Ghost 6-alpine
   - SQLite database (fast, no external dependencies)
   - Published on the host at <http://localhost:3001>, listening on 2368
   - Auto-starts on container creation
   - Theme live-mounted at
     `/var/lib/ghost/content/themes/publicledger-headline-fork`
   - Volume: `ghost-dev-data` for persistent Ghost data

Neither service sets `container_name:`. A fixed name is global to the Docker
daemon, so a stack started from the CLI collided with one started by VS Code.
`scripts/ghost-exec.sh` finds ghost-dev by its Compose service label instead.

**Theme Mount**:

- `/workspace` (your code) →
  `/var/lib/ghost/content/themes/publicledger-headline-fork`
- Changes to `.hbs`, `.css`, `.js` files trigger live reload
- Compiled assets (`assets/built/*`) automatically refresh in browser

**VS Code Extensions** (auto-installed via `devcontainer.json`):

- `anthropic.claude-code` - Claude Code UI (the feature installs only the CLI)
- `dbaeumer.vscode-eslint` - ESLint linter
- `esbenp.prettier-vscode` - Prettier formatter
- `andrejunges.Handlebars` - Handlebars syntax highlighting
- `TryGhost.ghost` - Ghost theme support

`.vscode/extensions.json` lists a few more as workspace recommendations, incuding
`redhat.vscode-yaml` for `routes.yaml` and
`github.vscode-pull-request-github`.

**Networking**: the devcontainer uses `network_mode: service:ghost-dev`, so there
are no `forwardPorts`. Inside the container Ghost is at `localhost:2368`; port
3001 is the host publish and is **not** reachable from inside.

### Configuration Files

**`.devcontainer/devcontainer.json`**:

- Defines workspace container (Node.js 24)
- Lists VS Code extensions to install
- Persists Claude Code auth across rebuilds via a named volume
- Runs `postCreateCommand` (`bash .devcontainer/post-create.sh`)

**`.devcontainer/docker-compose.yml`**:

- Multi-container environment (devcontainer, ghost-dev)
- Volume definitions for persistent Ghost data
- Port mapping (`3001:2368`)
- Theme mount path configuration

**`.devcontainer/post-create.sh`**:

- Installs dependencies and builds assets
- Waits for Ghost, then seeds in a load-bearing order
- Uploads routes and verifies every collection permalink

**`.devcontainer/README.md`**:

- Operations reference: commands, architecture, seeding, troubleshooting

### Customization

**Personal extensions**: Use VS Code's extension sync or install manually. They
persist across container rebuilds.

**Local modifications**: Edit `.devcontainer/devcontainer.json` locally (add to
`.git/info/exclude` to avoid committing).

**Rebuild container**: Command Palette → "Dev Containers: Rebuild Container"
after changing configuration.

### Troubleshooting

**Ghost not accessible at localhost:3001:**

- Check containers running: `docker compose ps`
- View Ghost logs: `docker compose logs -f ghost-dev`
- Restart Ghost from the host: `docker compose restart ghost-dev`

**Theme not appearing in Ghost Admin:**

- Verify theme mounted:
  `docker compose exec ghost-dev ls /var/lib/ghost/content/themes/`
- Check for template errors: `docker compose logs ghost-dev`
- Restart Ghost after major changes: `docker compose restart ghost-dev`

**Container won't start:**

- Check Docker is running and has sufficient resources
- Try "Dev Containers: Rebuild Container Without Cache"
- Check ports 3001/2368 aren't already in use: `lsof -i :3001`

**Assets not compiling:**

- Ensure `pnpm dev` is running in terminal
- Check for syntax errors in CSS/JS source files
- Verify source files are in `assets/css/` and `assets/js/`, not `assets/built/`

**Setup only half ran:**

`postCreateCommand` fires only on container *create*, so a partial run never
retries. Re-run by hand: `bash .devcontainer/post-create.sh`

### Manual Setup Alternative

If not using devcontainer, you'll need:

- **Node.js 24+** with pnpm
- **Ghost CLI** (optional, for local Ghost instance)
- **Ghost instance** (cloud or local) to test theme

The devcontainer ensures exact version matches and provides complete Ghost
environment.

## Code Quality Configuration

### Editor Configuration

| File/Tool                  | Purpose                  | Key Configuration                                        |
| -------------------------- | ------------------------ | -------------------------------------------------------- |
| `.editorconfig`            | Cross-editor consistency | 2 spaces, LF line endings, UTF-8, 80-col Markdown        |
| `.prettierrc`              | Formatting               | 100 cols, double quotes, semicolons, Handlebars plugin   |
| `eslint.config.js`         | JavaScript linting       | Flat config, ES2022, JSDoc rules                         |
| `.markdownlint-cli2.jsonc` | Markdown linting         | 80-col prose, rules and ignores in one file              |
| `package.json`             | Theme metadata           | Ghost version requirement (6.0+), Node requirement (24+) |
| `gulpfile.js`              | Build system             | PostCSS compilation, JS minification, asset watching     |
| GScan                      | Ghost theme validator    | Validates templates, helpers, Ghost API compatibility    |

`.prettierignore` excludes every upstream-owned file, so Prettier only reformats
fork code. Markdown is excluded from Prettier entirely - `pnpm lint:md` owns it.

## Development Workflow

### Before Committing

**Pre-commit hooks** (recommended):

Pre-commit hooks automatically validate your changes before each commit. Install
once:

```bash
# Install pre-commit (if not already installed)
pip install pre-commit
# or: brew install pre-commit (macOS)
# or: apt install pre-commit (Debian/Ubuntu)

# Install hooks for this repo
pre-commit install
```

**Hooks run automatically on `git commit`:**

- **Prettier formatting** - Auto-formats fork code (Handlebars, CSS, JS, JSON,
  YAML); upstream files are excluded
- **ESLint validation** - Checks JavaScript code quality, auto-fixes issues
- **GScan validation** - Ensures Ghost 6.0+ compatibility (catches breaking
  changes)
- **JSON syntax check** - Validates package.json and locales/\*.json
- **YAML validation** - Checks GitHub Actions workflows and routes.yaml
- **Built assets protection** - Prevents accidentally committing to
  assets/built/ (should edit source files)

**Manual hook execution:**

```bash
pre-commit run --all-files    # Run all hooks manually
pre-commit run gscan          # Run specific hook
```

**Always run validation:**

```bash
pnpm test          # GScan validation
pnpm lint          # ESLint JavaScript validation
pnpm lint:md       # markdownlint
pnpm zip           # Production build test
```

**Check for errors:**

- Template syntax errors in `docker compose logs ghost-dev`
- Broken Ghost helpers or context usage
- Missing required templates (index.hbs, post.hbs, etc.)
- CSS/JS compilation errors in `pnpm dev` output

### Asset Compilation

**Source files** (edit these):

- `assets/css/*.css` - PostCSS source files
- `assets/js/*.js` - JavaScript source files

**Built files** (auto-generated, never edit):

- `assets/built/screen.css` - Compiled CSS
- `assets/built/main.min.js` - Minified JavaScript
- `partials/generated/*.hbs` - Entity pickers built from the mock data package

```bash
# Development mode - watch and compile
pnpm dev

# Production build
pnpm zip    # Creates dist/publicledger-headline-fork.zip
```

### Code Quality

**Linting and formatting:**

```bash
# Check JavaScript code quality
pnpm lint          # ESLint validation (reports issues)
pnpm lint:fix      # Auto-fix ESLint issues

# Format code
pnpm format        # Prettier write
pnpm format:check  # Check formatting without changes
```

**ESLint checks:**

- Undefined variables (`no-undef`) - catches typos in function names
- Unused variables (`no-unused-vars`) - warns about dead code
- JSDoc types validation - encourages inline documentation
- ES2022 syntax support - modern JavaScript features

**Prettier formats:**

- Handlebars templates (`*.hbs`) - 120 char width
- CSS (`*.css`) - 100 char width, PostCSS compatible
- JavaScript (`*.js`) - 100 char width, double quotes, semicolons
- JSON (`*.json`) - No trailing commas (strict JSON)
- **Not** Markdown - `*.md` is in `.prettierignore`

**Markdown linting:**

All Markdown must pass `pnpm lint:md`. Rules live in
`.markdownlint-cli2.jsonc`:

- **MD013**: Wrap prose at 80 columns, matching `.editorconfig`. Code blocks and
  tables are exempt because commands and table rows cannot be wrapped.
- **MD034**: Wrap bare URLs in `<https://example.com>` or `[text](url)` format
- **MD040**: Specify language for code blocks (`bash`, `json`, `text`)
- **MD031/MD032**: Blank lines required around code blocks and lists
- **MD041**: Start each file with a top-level heading, or opt out with
  `<!-- markdownlint-disable-file MD041 -->` for fragments

```bash
pnpm lint:md       # Report issues
pnpm lint:md:fix   # Auto-fix what can be fixed
```

**Excluded from linting:** `README.md`, `AGENTS.md` and `CLAUDE.md` are the three
Markdown files that also exist upstream - reformatting them would be undone by
the next sync. `docs-local/` is excluded because it holds CSV data.

**All of these run automatically on commit** via pre-commit hooks.

### Running Validation

```bash
# Ghost compatibility check
pnpm test          # Quick GScan validation
pnpm validate      # Verbose GScan report with warnings

# Fork identity
pnpm validate:fork # LICENSE, author, contributors, build, GScan

# Production package
pnpm zip           # Validates + compiles + packages
```

**GScan checks:**

- Ghost version compatibility (6.0+ required)
- Required templates present
- Ghost helper usage (no deprecated helpers)
- Theme metadata in package.json
- Asset references and file paths

## Package Scripts Reference

### Theme Build & Validation

| Command              | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `pnpm dev`           | Watch mode - auto-rebuild CSS/JS on changes                  |
| `pnpm test`          | GScan validation for Ghost 6.0+ compatibility                |
| `pnpm validate`      | Verbose GScan report with warnings                           |
| `pnpm validate:fork` | Fork identity, LICENSE, build and GScan checks               |
| `pnpm zip`           | Build production zip (`dist/publicledger-headline-fork.zip`) |
| `pnpm lint`          | ESLint JavaScript validation                                 |
| `pnpm lint:fix`      | Auto-fix ESLint issues                                       |
| `pnpm lint:md`       | markdownlint validation                                      |
| `pnpm lint:md:fix`   | Auto-fix Markdown issues                                     |
| `pnpm format`        | Prettier write                                               |
| `pnpm format:check`  | Prettier check                                               |

### Ghost Management (Devcontainer)

| Command              | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `pnpm ghost:seed`    | Sync published pages from production (`.env`)  |
| `pnpm ghost:records` | Seed one demo record per collection            |
| `pnpm ghost:refresh` | Upload `routes.yaml` and reload the theme      |
| `pnpm ghost:verify`  | Check that every collection permalink resolves |

`pnpm ghost:restart` exists only to fail loudly. Restarting ghost-dev tears down
the network namespace this container borrows, leaving it with no `eth0` and no
DNS until it is itself restarted. Use `pnpm ghost:refresh`, or restart from the
host and then restart the devcontainer too.

**Ghost URLs:**

- **Admin Panel**: <http://localhost:3001/ghost/> (from host browser)
- **Public Site**: <http://localhost:3001/>
- **Inside the devcontainer**: <http://localhost:2368/>
- **Credentials**: `admin@example.com` / `RandomSecure123456789`

### Testing in Ghost

```bash
# Start asset watcher
pnpm dev

# Check Ghost is up (from inside the devcontainer)
curl -sf http://localhost:2368/ghost/ && echo OK

# Check every data route at once
pnpm ghost:verify
```

**View logs** (from the host terminal):

```bash
docker compose logs -f ghost-dev
```

**Restart Ghost** (when genuinely needed):

- **Via VS Code**: Command Palette → "Dev Containers: Rebuild Container"
- **From host terminal**: `cd .devcontainer && docker compose restart ghost-dev`,
  then restart the devcontainer

**Manual testing checklist:**

- Homepage (page.hbs via the `/` route → Ghost page `home`)
- Post page (post.hbs) - content, author, images
- Tag page (tag.hbs) - filtered posts
- Author page (author.hbs) - author bio, posts
- Every collection index and one detail record each
- Search functionality
- Mobile responsiveness
- Translations (locales/\*.json)

**Common workflows:**

1. **Template changes**: Edit `.hbs` files → Ghost auto-reloads → hard refresh
1. **CSS changes**: Edit `assets/css/*.css` → `pnpm dev` compiles → hard refresh
1. **JS changes**: Edit `assets/js/*.js` → `pnpm dev` compiles → hard refresh
1. **Route changes**: Edit `routes.yaml` → `pnpm ghost:refresh` →
   `pnpm ghost:verify`
1. **Card changes**: Edit `scripts/cards/*` → `pnpm ghost:records` → hard refresh

## Ghost Theme Architecture

### Template Files

Ghost uses Handlebars templates with specific routing:

| Template       | Route                                                | Context                   |
| -------------- | ---------------------------------------------------- | ------------------------- |
| `index.hbs`    | `/articles/` collection                              | `posts`, `pagination`     |
| `page.hbs`     | `/` (routes.yaml maps it to the Ghost page `home`)   | `page`                    |
| `home.hbs`     | Unused - routes.yaml forces the static page homepage | —                         |
| `post.hbs`     | `/post-slug/`                                        | `post`, `author`          |
| `tag.hbs`      | `/tag/tag-slug/`                                     | `tag`, `posts`            |
| `author.hbs`   | `/author/author-slug/`                               | `author`, `posts`         |
| `job.hbs` etc. | Collection index                                     | `posts`                   |
| `custom-*.hbs` | Manual selection in Ghost Admin                      | Nothing until `{{#post}}` |

**Partials** (`partials/*.hbs`):

- Reusable components included with `{{> partial-name}}`
- Example: `{{> loop-grid}}` for post grid layout
- `partials/pl-record.hbs` is the shared body for every collection detail
  template
- `partials/generated/*` is build output - never edit

**Context objects**: <https://ghost.org/docs/themes/context/>

### Ghost Helpers

**Version constraints**: This theme supports Ghost 6.0+. Check helper
compatibility:

- <https://ghost.org/docs/themes/helpers/>

**Common helpers:**

```handlebars
{{! Content }}
{{content}}
{{excerpt}}
{{title}}

{{! Images }}
{{img_url feature_image size="l"}}
{{#if feature_image}}...{{/if}}

{{! Loops }}
{{#foreach posts}}
  {{title}}
{{/foreach}}

{{! Translations }}
{{t "Subscribe"}}

{{! Pagination }}
{{pagination}}
```

**Testing helpers:**

- View page in Ghost dev instance
- Check `docker compose logs ghost-dev` for errors
- Run `pnpm test` to validate Ghost 6.0 compatibility

### Internationalization

**Translation files**: `locales/*.json`

```json
{
  "Subscribe": "Subscribe",
  "Email": "Email",
  "Custom string": "Custom value"
}
```

**Usage in templates:**

```handlebars
{{t "Subscribe"}} {{t "Custom string"}}
```

**Fork customizations** (never change):

- `locales/en.json`: "Access site" (not "Access code"), "Password" (custom)

## Fork-Specific Constraints

### Never Change (Fork Identity)

**`package.json`:**

```json
{
  "name": "publicledger-headline-fork",
  "author": {
    "name": "Ghost Foundation",
    "email": "hello@ghost.org"
  },
  "contributors": [
    {
      "name": "Gasworks Data",
      "email": "info@gasworksdata.com"
    }
  ],
  "engines": {
    "node": ">=24.0.0",
    "ghost": ">=6.0.0"
  }
}
```

- `name` - never change; deployment automation depends on it
- `author` - never change. **The MIT license requires Ghost Foundation to remain
  the author.** Fork attribution belongs in `contributors`, and
  `pnpm validate:fork` fails if this is wrong.
- `engines.node` - never change (devcontainer requirement)
- `engines.ghost` - safe to update if needed
- Fork scripts (`ghost:*`, `validate:fork`, `lint*`, `format*`) - preserve

**`locales/en.json`:**

- Custom strings: "Access site", "Password" (intentionally different from
  upstream)

**`.devcontainer/`:**

- Entire directory is fork-only, not in upstream

**`.github/workflows/`:**

- Deployment automation is fork-specific

**`README.md`, `AGENTS.md`, `CLAUDE.md`:**

- The only Markdown files that also exist upstream. Only the fork note at the top
  of `README.md` is ours to edit.

### Upstream Sync Protocol

**Before editing any file:**

1. Check whether it exists upstream:
   `git ls-tree -r upstream/main --name-only | grep path/to/file`
1. Review [sync/README.md](sync/README.md) for known conflicts
1. Mark fork-specific changes: `{{!-- FORK CUSTOM: reason --}}`

**High conflict risk files:**

- `package.json` - Metadata differs from upstream
- `gulpfile.js` - Build system occasionally updated
- Core templates (default.hbs, post.hbs, etc.) - Frequently updated upstream

**Low conflict risk files:**

- `custom-*.hbs` - Fork-only custom templates
- `scripts/*` - Fork-only
- `.devcontainer/*` - Fork-only
- `.github/workflows/*` - Fork-only

**Sync procedure**: See [sync/README.md](sync/README.md) for complete guide

## Dependency Management

### pnpm

Theme dependencies managed via `package.json`:

```bash
pnpm install          # Install dependencies
pnpm update           # Update dependencies (check upstream first!)
```

**Before updating dependencies:**

```bash
# Check if upstream updated them
git fetch upstream
git log upstream/main -- package.json
git diff upstream/main -- package.json

# If upstream updated recently, sync with upstream instead
```

Fork-only dev tools (ESLint, Prettier, markdownlint-cli2, `@tryghost/admin-api`)
are listed in `_comment_devDependencies`; keep them when taking upstream's
versions for everything else.

### GitHub Actions

#### Deployment

Deployment automation in `.github/workflows/deploy-theme.yaml`:

- Triggered on push to `main` branch
- Builds production theme (`pnpm zip`)
- Validates with GScan (`pnpm test`)
- Auto-bumps version based on commit message tags:
  - `[major]` → Breaking changes (1.0.0 → 2.0.0)
  - `[minor]` → New features (1.0.0 → 1.1.0)
  - `[patch]` → Bug fixes (1.0.0 → 1.0.1, default)
  - `[skip-ci]` → Skip deployment
- Creates GitHub release with built theme
- Deploys to PublicLedger Ghost instance

**Example commit messages:**

```bash
git commit -m "feat: Add newsletter subscription widget [minor]"
git commit -m "fix: Mobile navigation alignment [patch]"
git commit -m "BREAKING: Require Ghost 7.0+ [major]"
git commit -m "docs: Update README [skip-ci]"
```

#### Rollback

**Rollback deployed theme:**

If a deployment fails in production, use the GitHub Actions workflow:

1. GitHub → Actions → **Rollback Theme** → Run workflow
1. Enter the version to rollback to (e.g., `1.2.3`)
1. Optionally check "Delete the failed release"
1. Workflow will:
   - Checkout the specified version tag
   - Build and validate theme
   - Deploy to Ghost
   - Delete failed release (if requested)

**Rollback upstream sync:**

If an upstream sync introduced breaking changes:

```bash
# Automatic rollback to most recent backup
./sync/upstream-sync.sh rollback

# Or manually reset to backup branch
git branch --list 'backup-before-sync-*' --sort=-committerdate
git reset --hard backup-before-sync-20260630-143022
git push origin staging --force-with-lease
```

See [sync/README.md](sync/README.md) for detailed upstream sync and rollback
procedures.

## Repository Setup

### Branch Protection Rules

Configure in GitHub → Settings → Branches → Branch protection rules.

#### main (Production Branch)

**Protect matching branches:** `main`

**Required settings:**

- ✅ Require a pull request before merging (approvals: 0-1)
- ✅ Require status checks to pass before merging
  - Required checks: `Test`, `all-tests-pass` (from test.yml)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push (changes only via PRs from `staging`)

**Workflow:** `staging → PR → main (tests run) → merge → deploy-theme.yaml
triggers`

#### staging (Development Branch)

**Protect matching branches:** `staging`

**Settings:**

- ❌ Require a pull request (disabled - allow direct push)
- ⚠️ Require status checks (optional)
- ❌ Restrict who can push (disabled)

**Workflow:** `feature → staging (direct push or PR) → tests run → iterate`

### Required GitHub Secrets

Settings → Secrets and variables → Actions → Repository secrets:

**`GHOST_ADMIN_API_URL`**

- Production Ghost instance API URL (e.g., `https://yourdomain.com`)
- Find: Ghost Admin → Settings → Integrations → Custom Integration

**`GHOST_ADMIN_API_KEY`**

- Format: `<id>:<secret>` (long hexadecimal string)
- Find: Ghost Admin → Settings → Integrations → Custom Integration → Admin API
  Key

### Fork Integrity Validation

#### Automated Validation

The fork includes automated validation to prevent license violations and upstream
drift:

**`.github/workflows/validate-fork.yaml`** (runs on every PR, push, and weekly)

- ✅ Validates LICENSE file unchanged from upstream
- ✅ Validates `package.json` author is "Ghost Foundation"
- ✅ Checks contributors field exists
- ✅ Monitors upstream sync status (commits ahead/behind)
- ✅ Creates GitHub issue if >10 commits behind upstream
- ✅ Validates theme builds and GScan passes

**`.git/hooks/pre-commit`** (runs on every local commit)

- 🚫 Blocks LICENSE file modifications
- 🚫 Blocks `package.json` author changes
- ⚠️ Warns when theme files (.hbs, .css, .js) are modified

#### Local Validation

Before pushing, run local validation:

```bash
pnpm validate:fork
```

This runs all the same checks as the GitHub workflow:

- LICENSE compliance
- package.json author field
- Contributors field
- Upstream sync status
- Theme build
- GScan validation

#### Installing Git Hooks

The pre-commit hook is version-controlled in `scripts/hooks/pre-commit`.

Install it locally:

```bash
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Or if already installed, update it:

```bash
cp scripts/hooks/pre-commit .git/hooks/pre-commit
```

#### Responding to Validation Failures

**LICENSE modified:**

```bash
git restore --staged LICENSE
git restore LICENSE
```

**package.json author incorrect:**

- Edit package.json to restore `"author": { "name": "Ghost Foundation", ... }`
- Add your attribution to `contributors` array instead

**Theme validation failed:**

- Fix GScan errors: `pnpm validate`
- Test build: `pnpm zip`

**Fork behind upstream:**

- Review: `git fetch upstream && git log HEAD..upstream/main`
- Sync: `./sync/upstream-sync.sh`

### Default Branch

Settings → General → Default branch: `main`

Why main? New clones get production-ready code, releases reference main, upstream
sync targets main.

Developers: `git checkout staging`

## Ghost Admin Workflow

### Activating Theme

1. Access Ghost Admin: <http://localhost:3001/ghost>
1. Navigate to Settings → Design
1. Click "Change theme"
1. Select "publicledger-headline-fork" from installed themes
1. Click "Activate"

### Testing Content

**Create test content:**

1. Posts → New post
1. Add title, content, feature image
1. Assign tags and author
1. Publish

**Test different contexts:**

- Homepage (static page)
- Single post (post.hbs)
- Tag archive (tag.hbs)
- Author archive (author.hbs)
- Each data collection index and detail

**Custom templates:**

1. Open a post or page
1. Settings (gear icon) → Template
1. Select a custom template (e.g., "Job agency seat")

### Content Seeding

Local Ghost content comes from two sources, seeded once at container creation by
`.devcontainer/post-create.sh`.

**1. Published pages from production** (`pnpm ghost:seed`)

Sync is **one-way, production → local**. Production is the source of truth for
editorial content; local Ghost is disposable. Configure in `.env`:

```bash
GHOST_PRD_URL=https://your-production-ghost.com
GHOST_PRD_KEY=your-content-api-key
```

Use the **Content API key**, never the Admin API key. Ghost Admin API keys cannot
be scoped — one grants full read/write access to members' PII, staff accounts,
and settings, and `.env` is injected into the devcontainer where every process
can read it. The seeder only needs to read published pages. Because the Content
API returns published pages only, production **drafts are not synced**.

Returning almost nothing is normal: production currently exposes only a couple of
published pages.

**2. Demo records, one per collection** (`pnpm ghost:records`)

Runs `scripts/seed-demo-records.sh` inside ghost-dev, which calls
`scripts/seed-record.js` once per collection. Each record is created through the
Ghost Admin API with:

- its internal `#hash-*` tag and its parent tag
- the right `custom-*` template selected
- one Lexical `html` card per entry in that type's `cards` array, rendered
  server-side by `scripts/cards/*`

Slugs come from the mock `@publicledger/data` package so the cards resolve to
real records.

```bash
pnpm ghost:records   # seed every collection
pnpm ghost:refresh   # upload routes.yaml and reload the theme
pnpm ghost:verify    # confirm every permalink resolves
```

Records are written through the Admin API rather than straight to SQLite, so
Ghost registers the new URLs immediately and no restart is needed.

#### ⚠️ ghost:seed deletes every page, with no prompt

`ghost-seed.js` deletes every page before inserting. There is no confirmation and
no local-change detection. Two consequences:

- **Order is load-bearing:** `ghost:seed` → `ghost:records` → `ghost:refresh`.
  Running `ghost:seed` afterwards destroys the seeded content.
- Seeding runs from `postCreateCommand`, not `postStartCommand`, so an ordinary
  container restart cannot wipe local work. Re-run by hand with
  `bash .devcontainer/post-create.sh`.

Never keep anything permanent in local Ghost — it is destroyed on the next seed.
Create it in production, then re-sync. To keep an experiment, export it first via
Ghost Admin → Settings → Labs → Export.

#### Verifying a seed

`updated_at` is **not** evidence a seed ran — Ghost does not bump it for a no-op
edit. Check the revision history or the routes themselves:

```bash
bash scripts/ghost-exec.sh sqlite3 /var/lib/ghost/content/data/ghost-dev.db \
  "SELECT post_id, created_at FROM post_revisions ORDER BY created_at DESC LIMIT 5;"

pnpm ghost:verify
```

If records exist in SQLite but 404 in the browser, routes were not re-registered
— run `pnpm ghost:refresh`.

### Theme Settings

Ghost Admin → Settings → Design → Configure theme.

**Note**: the fork removed the entire `config.custom` block from `package.json`
and hardcoded those choices (Cardo/Manrope fonts, left logo, light header) in
`default.hbs` and `assets/css/fonts-custom.css`. If an upstream sync reintroduces
`config.custom`, remove it again — see [sync/README.md](sync/README.md).

## Common Gotchas

### Editing Built Assets

❌ **Don't edit** `assets/built/*` or `partials/generated/*`  
✅ **Do edit** `assets/css/*.css` and `assets/js/*.js`, then run `pnpm dev`

### Ghost Helper Version

❌ **Don't use** Ghost 7+ exclusive helpers (breaks Ghost 6 compatibility)  
✅ **Do check** <https://ghost.org/docs/themes/helpers/> for version support

### Template Context

❌ **Don't assume** all context objects available everywhere  
✅ **Do check** <https://ghost.org/docs/themes/context/> for route-specific
context, and open `{{#post}}` in every `custom-*.hbs`

### Expecting Live Data

❌ **Don't expect** a template to read `@publicledger/data` at render time  
✅ **Do re-seed** with `pnpm ghost:records` after data or renderer changes

### Package.json Identity

❌ **Don't change** name, author, engines.node, fork scripts  
✅ **Do preserve** fork identity fields (see "Never Change" section)

### Upstream Conflicts

❌ **Don't edit** shared files without checking upstream changes  
✅ **Do review** sync/README.md before editing

## When to Escalate

Contact a developer if you see:

- **Ghost crashes** on startup (check `docker compose logs ghost-dev`)
- **White screen** in Ghost Admin or frontend
- **Database errors** in Ghost logs
- **Theme validation failures** that can't be resolved (GScan errors)
- **Merge conflicts** during upstream sync
- **Docker container failures** (containers won't start)
- **Asset compilation errors** that persist after restarting `pnpm dev`

## Additional Resources

- **Ghost Theme Docs**: <https://ghost.org/docs/themes/>
- **Handlebars Docs**: <https://handlebarsjs.com/>
- **GScan Validation**: <https://gscan.ghost.org/>
- **Upstream Repository**: <https://github.com/TryGhost/Headline>
- **Fork Documentation**:
  - [DEVCONTAINER.md](DEVCONTAINER.md) - Devcontainer setup and workflow
  - [.devcontainer/README.md](.devcontainer/README.md) - Operations reference
  - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Symptom-by-symptom fixes
  - [sync/README.md](sync/README.md) - Upstream sync procedures
  - [AI_DEVELOPMENT.md](AI_DEVELOPMENT.md) - AI agent development guidelines
  - [AGENT_LESSONS.md](AGENT_LESSONS.md) - Common mistakes to avoid
