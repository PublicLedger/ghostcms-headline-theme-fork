# Contributing to Headline Theme Fork

This guide covers the development workflow, code quality standards, and testing practices for the Headline theme fork.

| Badge            | Status                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme Deployment | [![Deploy Theme](https://github.com/PublicLedger/ghostcms-headline-theme-fork/actions/workflows/deploy-theme.yaml/badge.svg)](https://github.com/PublicLedger/ghostcms-headline-theme-fork/actions/workflows/deploy-theme.yaml) |

## Quick Start

### Development Environment Setup

**Branch workflow**: We use `staging` for development and `main` for production. Open PRs from `staging` to `main` for deployment.

**Recommended**: Use the VS Code devcontainer for a consistent, fully-configured Ghost development environment.

```bash
# Container automatically starts Ghost in development mode
# After container starts, install dependencies:
pnpm install

# Start asset compilation with live reload
pnpm dev

# Visit Ghost Admin to activate theme
open http://localhost:3001/ghost
```

**Manual setup** (if not using devcontainer):

```bash
# Install Node.js 24+ first
pnpm install                    # Theme dependencies
pnpm dev                    # Watch and compile assets
pnpm test                   # Validate with GScan

# Optional: Install pre-commit hooks (recommended)
pip install pre-commit         # or: brew install pre-commit
pre-commit install
```

### Verify Setup

```bash
pnpm test        # GScan validation (Ghost 6.0+ compatibility)
pnpm dev         # Compile assets and watch for changes
docker compose ps   # Verify Ghost containers running (devcontainer only)
```

## Devcontainer

### What It Is

The devcontainer provides a **complete Ghost CMS environment** for theme development with live preview. It's a multi-container Docker setup with Ghost, MySQL (optional), and Node.js pre-configured.

**Why use it:**

- **Real Ghost instance**: Test templates with actual Ghost data and routing
- **Live reload**: Theme changes automatically refresh in browser
- **Consistent environment**: Same Node.js 24, Ghost 6.0+, and build tools as production
- **Isolation**: Ghost and dependencies don't conflict with your system
- **Zero config**: Open in VS Code and start developing immediately
- **Production testing**: Optional MySQL container for testing production-like scenarios

### How to Use It

**VS Code:**

1. Install [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open this repository in VS Code
3. Click "Reopen in Container" when prompted (or use Command Palette → "Dev Containers: Reopen in Container")
4. Container builds and Ghost starts automatically (~2 minutes first time)
5. Visit http://localhost:3001/ghost to create admin account
6. Activate "headline" theme in Settings → Design

**GitHub Codespaces:**

- Click "Code" → "Codespaces" → "Create codespace on staging"
- Same devcontainer configuration runs in the cloud
- Access Ghost at forwarded port 3001

**First-time setup after container starts:**

```bash
pnpm install          # Install theme dependencies
pnpm dev          # Start asset compilation
```

### What's Inside

**Base image**: `node:24-bookworm`

- Debian GNU/Linux 12 (bookworm)
- Node.js 24 LTS with pnpm
- Git, curl, wget, standard Unix tools

**Docker Compose Services** (via `.devcontainer/docker-compose.yml`):

1. **devcontainer** (workspace):
   - Node.js 24 environment
   - Theme mounted at `/workspace`
   - VS Code runs here

2. **ghost-dev** (development Ghost):
   - Ghost latest (6.0+ compatible)
   - SQLite database (fast, ephemeral)
   - Port 3001 → http://localhost:3001
   - Auto-starts on container creation
   - Theme live-mounted at `/var/lib/ghost/content/themes/headline`
   - Volume: `ghost-dev-data` for persistent Ghost data

3. **ghost-prod** (optional production testing):
   - Ghost latest with MySQL backend
   - Port 2368 → http://localhost:2368
   - Manual start: `pnpm ghost:prod`
   - Volume: `ghost-prod-data` for persistent Ghost data

4. **db** (MySQL for production testing):
   - MySQL 8.0
   - Used by ghost-prod only
   - Volume: `ghost-prod-db` for persistent database

**Theme Mount**:

- `/workspace` (your code) → `/var/lib/ghost/content/themes/headline` (Ghost's theme directory)
- Changes to `.hbs`, `.css`, `.js` files trigger live reload
- Compiled assets (`assets/built/*`) automatically refresh in browser

**VS Code Extensions** (auto-installed via `devcontainer.json`):

**Handlebars & Templates:**

- `vscode.handlebars` - Handlebars syntax highlighting
- `esbenp.prettier-vscode` - Prettier formatter for templates

**JavaScript/CSS:**

- `dbaeumer.vscode-eslint` - ESLint linter
- `stylelint.vscode-stylelint` - CSS linting

**Infrastructure:**

- `redhat.vscode-yaml` - YAML language support (for routes.yaml)
- `github.vscode-pull-request-github` - GitHub PR integration

**Environment variables**:

- `$BROWSER` - Command to open URLs in host's default browser
- `NODE_ENV=development` - Development mode for Ghost

### Configuration Files

**`.devcontainer/devcontainer.json`**:

- Defines workspace container (Node.js 24)
- Lists VS Code extensions to install
- Mounts Docker socket for container management
- Configures post-start command (`pnpm install`)

**`.devcontainer/docker-compose.yml`**:

- Multi-container environment (workspace, ghost-dev, ghost-prod, db)
- Volume definitions for persistent Ghost data
- Port mappings (3001 dev, 2368 prod)
- Theme mount path configuration

**`.devcontainer/QUICKREF.md`**:

- Quick reference for Ghost commands
- Devcontainer workflow tips
- Troubleshooting common issues

### Customization

**Personal extensions**: Use VS Code's extension sync or install manually. They persist across container rebuilds.

**Local modifications**: Edit `.devcontainer/devcontainer.json` locally (add to `.git/info/exclude` to avoid committing).

**Rebuild container**: Command Palette → "Dev Containers: Rebuild Container" after changing configuration.

### Troubleshooting

**Ghost not accessible at localhost:3001:**

- Check containers running: `docker compose ps`
- View Ghost logs: `pnpm ghost:logs`
- Restart Ghost: `pnpm ghost:restart`

**Theme not appearing in Ghost Admin:**

- Verify theme mounted: `docker compose exec ghost-dev ls /var/lib/ghost/content/themes/`
- Check for template errors: `pnpm ghost:logs`
- Restart Ghost after major changes: `pnpm ghost:restart`

**Container won't start:**

- Check Docker is running and has sufficient resources
- Try "Dev Containers: Rebuild Container Without Cache"
- Check ports 3001/2368 aren't already in use: `lsof -i :3001`

**Assets not compiling:**

- Ensure `pnpm dev` is running in terminal
- Check for syntax errors in CSS/JS source files
- Verify source files are in `assets/css/` and `assets/js/`, not `assets/built/`

### Manual Setup Alternative

If not using devcontainer, you'll need:

- **Node.js 24+** with pnpm
- **Ghost CLI** (optional, for local Ghost instance)
- **Ghost instance** (cloud or local) to test theme

The devcontainer ensures exact version matches and provides complete Ghost environment.

## Code Quality Configuration

### Editor Configuration

| File/Tool       | Purpose                  | Key Configuration                                        |
| --------------- | ------------------------ | -------------------------------------------------------- |
| `.editorconfig` | Cross-editor consistency | 2 spaces, LF line endings, UTF-8                         |
| `package.json`  | Theme metadata           | Ghost version requirement (6.0+), Node requirement (24+) |
| `gulpfile.js`   | Build system             | PostCSS compilation, JS minification, asset watching     |
| GScan           | Ghost theme validator    | Validates templates, helpers, Ghost API compatibility    |

**No prettier/eslint config** - This is a Ghost theme using upstream's build system. Follow existing code style in templates and assets.

## Development Workflow

### Before Committing

**Pre-commit hooks** (recommended):

Pre-commit hooks automatically validate your changes before each commit. Install once:

```bash
# Install pre-commit (if not already installed)
pip install pre-commit
# or: brew install pre-commit (macOS)
# or: apt install pre-commit (Debian/Ubuntu)

# Install hooks for this repo
pre-commit install
```

**Hooks run automatically on `git commit`:**

- **Prettier formatting** - Auto-formats code for consistency (Handlebars, CSS, JS, JSON, YAML)
- **ESLint validation** - Checks JavaScript code quality, auto-fixes issues
- **GScan validation** - Ensures Ghost 6.0+ compatibility (catches breaking changes)
- **JSON syntax check** - Validates package.json and locales/\*.json
- **YAML validation** - Checks GitHub Actions workflows and routes.yaml
- **Built assets protection** - Prevents accidentally committing to assets/built/ (should edit source files)

**Manual hook execution:**

```bash
pre-commit run --all-files    # Run all hooks manually
pre-commit run gscan          # Run specific hook
```

**Always run validation:**

```bash
pnpm test          # GScan validation
pnpm lint          # ESLint JavaScript validation
pnpm zip           # Production build test
```

**Check for errors:**

- Template syntax errors in `pnpm ghost:logs`
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

```bash
# Development mode - watch and compile
pnpm dev

# Production build
pnpm zip    # Creates dist/headline.zip
```

### Code Quality

**Linting and formatting:**

```bash
# Check JavaScript code quality
pnpm lint          # ESLint validation (reports issues)
pnpm lint:fix      # Auto-fix ESLint issues

# Format code
pnpm exec prettier --write .              # Format all files
pnpm exec prettier --check .              # Check formatting without changes
npx prettier --write "**/*.hbs"     # Format Handlebars only
```

**ESLint checks:**

- Undefined variables (`no-undef`) - catches typos in function names
- Unused variables (`no-unused-vars`) - warns about dead code
- JSDoc types validation - encourages inline documentation
- ES2022 syntax support - modern JavaScript features

**Prettier formats:**

- Handlebars templates (`*.hbs`) - 120 char width, HTML parser
- CSS (`*.css`) - 100 char width, PostCSS compatible
- JavaScript (`*.js`) - 100 char width, double quotes, semicolons
- JSON (`*.json`) - No trailing commas (strict JSON)

**Both run automatically on commit** via pre-commit hooks.

### Running Validation

```bash
# Ghost compatibility check
pnpm test          # Quick GScan validation
pnpm validate      # Verbose GScan report with warnings

# Production package
pnpm zip           # Validates + compiles + packages
```

**GScan checks:**

- Ghost version compatibility (6.0+ required)
- Required templates present
- Ghost helper usage (no deprecated helpers)
- Theme metadata in package.json
- Asset references and file paths

### Testing in Ghost

**Development instance** (http://localhost:3001):

```bash
# Start asset watcher
pnpm dev

# View Ghost logs for template errors
pnpm ghost:logs

# Restart Ghost after major changes
pnpm ghost:restart

# Access Ghost Admin
open http://localhost:3001/ghost
```

**Production-like testing** (http://localhost:2368):

```bash
# Start MySQL-backed Ghost
pnpm ghost:prod

# View production logs
docker compose logs -f ghost-prod

# Stop production instance
pnpm ghost:stop
```

**Manual testing checklist:**

- Homepage (index.hbs) - post grid, pagination
- Post page (post.hbs) - content, author, images
- Tag page (tag.hbs) - filtered posts
- Author page (author.hbs) - author bio, posts
- Search functionality
- Mobile responsiveness
- Custom templates (custom-\*.hbs)
- Translations (locales/\*.json)

## Ghost Theme Architecture

### Template Files

Ghost uses Handlebars templates with specific routing:

| Template       | Route                            | Context               |
| -------------- | -------------------------------- | --------------------- |
| `index.hbs`    | `/` (homepage)                   | `posts`, `pagination` |
| `home.hbs`     | `/` (if exists, overrides index) | `posts`, `pagination` |
| `post.hbs`     | `/post-slug/`                    | `post`, `author`      |
| `page.hbs`     | `/page-slug/`                    | `page`                |
| `tag.hbs`      | `/tag/tag-slug/`                 | `tag`, `posts`        |
| `author.hbs`   | `/author/author-slug/`           | `author`, `posts`     |
| `custom-*.hbs` | Manual selection in Ghost Admin  | Varies by page type   |

**Partials** (`partials/*.hbs`):

- Reusable components included with `{{> partial-name}}`
- Example: `{{> loop-grid}}` for post grid layout

**Context objects**: https://ghost.org/docs/themes/context/

### Ghost Helpers

**Version constraints**: This theme supports Ghost 6.0+. Check helper compatibility:

- https://ghost.org/docs/themes/helpers/

**Common helpers:**

```handlebars
{{! Content }}
{{content}}
{{! Post/page HTML content }}
{{excerpt}}
{{! Post excerpt }}
{{title}}
{{! Post/page title }}

{{! Images }}
{{img_url feature_image size="l"}}
{{! Responsive image URL }}
{{#if feature_image}}...{{/if}}
{{! Conditional rendering }}

{{! Loops }}
{{#foreach posts}}
  {{title}}
{{/foreach}}

{{! Translations }}
{{t "Subscribe"}}
{{! From locales/*.json }}

{{! Pagination }}
{{pagination}}
{{! Pagination links }}
```

**Testing helpers:**

- View page in Ghost dev instance
- Check `pnpm ghost:logs` for errors
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
{{t "Subscribe"}}
{{t "Custom string"}}
```

**Fork customizations** (never change):

- `locales/en.json`: "Access site" (not "Access code"), "Password" (custom)

## Fork-Specific Constraints

### Never Change (Fork Identity)

**`package.json`:**

```json
{
  "name": "publicledger-headline-fork", // NEVER CHANGE
  "author": {
    "name": "Gasworks Data", // NEVER CHANGE
    "email": "info@gasworksdata.com" // NEVER CHANGE
  },
  "engines": {
    "node": ">=24.0.0", // NEVER CHANGE (devcontainer requirement)
    "ghost": ">=6.0.0" // Safe to update if needed
  },
  "scripts": {
    "ghost:dev": "...", // NEVER CHANGE (fork scripts)
    "ghost:logs": "...", // NEVER CHANGE
    "ghost:restart": "...", // NEVER CHANGE
    "ghost:prod": "...", // NEVER CHANGE
    "ghost:stop": "..." // NEVER CHANGE
  }
}
```

**`locales/en.json`:**

- Custom strings: "Access site", "Password" (intentionally different from upstream)

**`.devcontainer/`:**

- Entire directory is fork-only, not in upstream

**`.github/workflows/`:**

- Deployment automation is fork-specific

### Upstream Sync Protocol

**Before editing any file:**

1. Check if upstream modified it: `git log upstream/main..HEAD -- path/to/file`
2. Review [sync/README.md](sync/README.md) for known conflicts
3. Mark fork-specific changes: `{{!-- FORK CUSTOM: reason --}}`

**High conflict risk files:**

- `package.json` - Metadata differs from upstream
- `gulpfile.js` - Build system occasionally updated
- Core templates (default.hbs, post.hbs, etc.) - Frequently updated upstream

**Low conflict risk files:**

- `custom-*.hbs` - Fork-only custom templates
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
2. Enter the version to rollback to (e.g., `1.2.3`)
3. Optionally check "Delete the failed release"
4. Workflow will:
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

See [sync/README.md](sync/README.md) for detailed upstream sync and rollback procedures.

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

**Workflow:** `staging → PR → main (tests run) → merge → deploy-theme.yaml triggers`

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
- Find: Ghost Admin → Settings → Integrations → Custom Integration → Admin API Key

### Fork Integrity Validation

**Automated Validation**

The fork includes automated validation to prevent license violations and upstream drift:

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

**Local Validation**

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

**Installing Git Hooks**

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

**Responding to Validation Failures**

**LICENSE modified:**
```bash
git restore --staged LICENSE
git restore LICENSE
```

**package.json author incorrect:**
- Edit package.json to restore `"author": { "name": "Ghost Foundation", ... }`
- Add your attribution to `contributors` array instead

**Theme validation failed:**
- Fix GScan errors: `pnpm validate --verbose`
- Test build: `pnpm zip`

**Fork behind upstream:**
- Review: `git fetch upstream && git log HEAD..upstream/main`
- Sync: `./sync/upstream-sync.sh`

### Default Branch

Settings → General → Default branch: `main`

Why main? New clones get production-ready code, releases reference main, upstream sync targets main.

Developers: `git checkout staging`

## Ghost Admin Workflow

### Activating Theme

1. Access Ghost Admin: http://localhost:3001/ghost
2. Navigate to Settings → Design
3. Click "Change theme"
4. Select "headline" from installed themes
5. Click "Activate"

### Testing Content

**Create test content:**

1. Posts → New post
2. Add title, content, feature image
3. Assign tags and author
4. Publish

**Test different contexts:**

- Homepage (post grid)
- Single post (post.hbs)
- Tag archive (tag.hbs)
- Author archive (author.hbs)

**Custom templates:**

1. Pages → New page
2. Settings (gear icon) → Template
3. Select custom template (e.g., "Full feature image")

### Theme Settings

Ghost Admin → Settings → Design → Configure theme:

- Navigation layout (logo position, stacked)
- Typography options
- Color scheme customization
- Social media links

**Note**: Settings defined in `package.json` under `config.custom`

## Common Gotchas

### Editing Built Assets

❌ **Don't edit** `assets/built/screen.css` or `assets/built/main.min.js`  
✅ **Do edit** `assets/css/*.css` and `assets/js/*.js`, then run `pnpm dev`

### Ghost Helper Version

❌ **Don't use** Ghost 7+ exclusive helpers (breaks Ghost 6 compatibility)  
✅ **Do check** https://ghost.org/docs/themes/helpers/ for version support

### Template Context

❌ **Don't assume** all context objects available everywhere  
✅ **Do check** https://ghost.org/docs/themes/context/ for route-specific context

### Package.json Identity

❌ **Don't change** name, author, engines.node, ghost:\* scripts  
✅ **Do preserve** fork identity fields (see "Never Change" section)

### Upstream Conflicts

❌ **Don't edit** shared files without checking upstream changes  
✅ **Do review** sync/README.md before editing

## When to Escalate

Contact a developer if you see:

- **Ghost crashes** on startup (check `pnpm ghost:logs`)
- **White screen** in Ghost Admin or frontend
- **Database errors** in Ghost logs
- **Theme validation failures** that can't be resolved (GScan errors)
- **Merge conflicts** during upstream sync
- **Docker container failures** (containers won't start)
- **Asset compilation errors** that persist after restarting `pnpm dev`

## Additional Resources

- **Ghost Theme Docs**: https://ghost.org/docs/themes/
- **Handlebars Docs**: https://handlebarsjs.com/
- **GScan Validation**: https://gscan.ghost.org/
- **Upstream Repository**: https://github.com/TryGhost/Headline
- **Fork Documentation**:
  - [DEVCONTAINER.md](DEVCONTAINER.md) - Devcontainer setup and workflow
  - [sync/README.md](sync/README.md) - Upstream sync procedures
  - [AI_DEVELOPMENT.md](AI_DEVELOPMENT.md) - AI agent development guidelines
  - [AGENT_LESSONS.md](AGENT_LESSONS.md) - Common mistakes to avoid
