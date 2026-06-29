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
npm install

# Start asset compilation with live reload
npm run dev

# Visit Ghost Admin to activate theme
open http://localhost:3001/ghost
```

**Manual setup** (if not using devcontainer):

```bash
# Install Node.js 24+ first
npm install                    # Theme dependencies
npm run dev                    # Watch and compile assets
npm run test                   # Validate with GScan

# Optional: Install pre-commit hooks (recommended)
pip install pre-commit         # or: brew install pre-commit
pre-commit install
```

### Verify Setup

```bash
npm run test        # GScan validation (Ghost 6.0+ compatibility)
npm run dev         # Compile assets and watch for changes
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
npm install          # Install theme dependencies
npm run dev          # Start asset compilation
```

### What's Inside

**Base image**: `node:24-bookworm`

- Debian GNU/Linux 12 (bookworm)
- Node.js 24 LTS with npm
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
   - Manual start: `npm run ghost:prod`
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
- Configures post-start command (`npm install`)

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
- View Ghost logs: `npm run ghost:logs`
- Restart Ghost: `npm run ghost:restart`

**Theme not appearing in Ghost Admin:**

- Verify theme mounted: `docker compose exec ghost-dev ls /var/lib/ghost/content/themes/`
- Check for template errors: `npm run ghost:logs`
- Restart Ghost after major changes: `npm run ghost:restart`

**Container won't start:**

- Check Docker is running and has sufficient resources
- Try "Dev Containers: Rebuild Container Without Cache"
- Check ports 3001/2368 aren't already in use: `lsof -i :3001`

**Assets not compiling:**

- Ensure `npm run dev` is running in terminal
- Check for syntax errors in CSS/JS source files
- Verify source files are in `assets/css/` and `assets/js/`, not `assets/built/`

### Manual Setup Alternative

If not using devcontainer, you'll need:

- **Node.js 24+** with npm
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
npm run test          # GScan validation
npm run lint          # ESLint JavaScript validation
npm run zip           # Production build test
```

**Check for errors:**

- Template syntax errors in `npm run ghost:logs`
- Broken Ghost helpers or context usage
- Missing required templates (index.hbs, post.hbs, etc.)
- CSS/JS compilation errors in `npm run dev` output

### Asset Compilation

**Source files** (edit these):

- `assets/css/*.css` - PostCSS source files
- `assets/js/*.js` - JavaScript source files

**Built files** (auto-generated, never edit):

- `assets/built/screen.css` - Compiled CSS
- `assets/built/main.min.js` - Minified JavaScript

```bash
# Development mode - watch and compile
npm run dev

# Production build
npm run zip    # Creates dist/headline.zip
```

### Code Quality

**Linting and formatting:**

```bash
# Check JavaScript code quality
npm run lint          # ESLint validation (reports issues)
npm run lint:fix      # Auto-fix ESLint issues

# Format code
npx prettier --write .              # Format all files
npx prettier --check .              # Check formatting without changes
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
npm run test          # Quick GScan validation
npm run validate      # Verbose GScan report with warnings

# Production package
npm run zip           # Validates + compiles + packages
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
npm run dev

# View Ghost logs for template errors
npm run ghost:logs

# Restart Ghost after major changes
npm run ghost:restart

# Access Ghost Admin
open http://localhost:3001/ghost
```

**Production-like testing** (http://localhost:2368):

```bash
# Start MySQL-backed Ghost
npm run ghost:prod

# View production logs
docker compose logs -f ghost-prod

# Stop production instance
npm run ghost:stop
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
- Check `npm run ghost:logs` for errors
- Run `npm run test` to validate Ghost 6.0 compatibility

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
2. Review [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md) for known conflicts
3. Mark fork-specific changes: `{{!-- FORK CUSTOM: reason --}}`

**High conflict risk files:**

- `package.json` - Metadata differs from upstream
- `gulpfile.js` - Build system occasionally updated
- Core templates (default.hbs, post.hbs, etc.) - Frequently updated upstream

**Low conflict risk files:**

- `custom-*.hbs` - Fork-only custom templates
- `.devcontainer/*` - Fork-only
- `.github/workflows/*` - Fork-only

**Sync procedure**: See [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md) and [UPSTREAM_SYNC_CHECKLIST.md](UPSTREAM_SYNC_CHECKLIST.md)

## Dependency Management

### npm

Theme dependencies managed via `package.json`:

```bash
npm install          # Install dependencies
npm update           # Update dependencies (check upstream first!)
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

Deployment automation in `.github/workflows/deploy-theme.yaml`:

- Triggered on push to `main` branch
- Builds production theme (`npm run zip`)
- Deploys to PublicLedger Ghost instance

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
✅ **Do edit** `assets/css/*.css` and `assets/js/*.js`, then run `npm run dev`

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
✅ **Do review** UPSTREAM_SYNC_PLAN.md before editing

## When to Escalate

Contact a developer if you see:

- **Ghost crashes** on startup (check `npm run ghost:logs`)
- **White screen** in Ghost Admin or frontend
- **Database errors** in Ghost logs
- **Theme validation failures** that can't be resolved (GScan errors)
- **Merge conflicts** during upstream sync
- **Docker container failures** (containers won't start)
- **Asset compilation errors** that persist after restarting `npm run dev`

## Additional Resources

- **Ghost Theme Docs**: https://ghost.org/docs/themes/
- **Handlebars Docs**: https://handlebarsjs.com/
- **GScan Validation**: https://gscan.ghost.org/
- **Upstream Repository**: https://github.com/TryGhost/Headline
- **Fork Documentation**:
  - [DEVCONTAINER.md](DEVCONTAINER.md) - Devcontainer setup and workflow
  - [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md) - Upstream merge procedures
  - [AI_DEVELOPMENT.md](AI_DEVELOPMENT.md) - AI agent development guidelines
  - [AGENT_LESSONS.md](AGENT_LESSONS.md) - Common mistakes to avoid
