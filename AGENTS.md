# AGENTS.md

## Scope

This is the **PublicLedger fork** of the Headline Ghost theme, featuring data-driven news routes with Page-based template content.

**[This Fork Repository](https://github.com/PublicLedger/ghostcms-headline-theme-fork)** you are here
**[Upstream Repository](https://github.com/TryGhost/Headline)** go check it out!

### Fork vs Upstream

- **Upstream (TryGhost/Headline):** Standard blog theme synced from `TryGhost/Themes/packages/headline` monorepo subtree
- **This Fork:** Civic data journalism platform with custom architecture:
  - 15+ data route templates (jobs, elections, finance, donors)
  - Ghost Pages as template fragments pattern
  - `@publicledger/data` integration for quarterly route generation
  - Enhanced devcontainer and deployment automation

**Sync Strategy:** In standalone mirror repository, this tree is pushed from `TryGhost/Themes/packages/headline` by subtree sync; make durable theme-content changes in `TryGhost/Themes` unless the task is explicitly repo-level metadata or GitHub settings.

For **AI agent development guidelines**, see [AI_DEVELOPMENT.md](AI_DEVELOPMENT.md).

---

## Architecture: Template Specificity Pattern

**Why we chose this:** Editorial control over high-traffic pages without code deployments, while generic templates handle all other routes.

**Pattern:** Ghost Pages serve as template content with specificity hierarchy:

1. Try specific Page: `job-agency-seat-lancaster-county-sheriff`
1. Fall back to generic: `job-agency-seat`
1. Show hardcoded fallback if neither exists

**15 data route templates:**

- Lookup: `lookup.hbs`, `lookup-agency.hbs`
- Jobs/Positions: `job.hbs`, `job-agency.hbs`, `job-agency-seat.hbs`
- Officials: `officials.hbs`, `official.hbs`
- Elections: `election.hbs`, `election-agency.hbs`, `election-agency-seat.hbs`, `election-agency-seat-year.hbs`
- Finance: `finance-explorer.hbs`, `finance-agency-seat.hbs`
- Donors: `donors.hbs`, `donor.hbs`

### PROS (Why This Works)

- **Editorial flexibility** - Copy/layout changes via CMS, no theme deployments. Non-technical editors control page structure.
- **Specificity** - Customize Lancaster County Sheriff page without affecting all other county sheriffs.
- **Fast updates** - Page republish: 1-5 sec (no theme rebuild). Ghost cache invalidation automatic.
- **Development separation** - Theme = data logic + templates, CMS = content. Clear boundaries, fewer merge conflicts.
- **Version control** - Page history in Ghost (revert copy), theme history in Git (revert logic).

### CONS (Watch Out For)

- **Brittle dependencies** - Theme expects exact slugs (`job-agency-seat-lancaster-county-sheriff`). Deleting/renaming breaks rendering. No type safety.
- **Testing complexity** - Local dev requires seeding Pages from production. Hard to catch breaking changes in CI. Template tests don't validate Page structure.
- **Performance overhead** - 2 `{{#get}}` queries per route (specific attempt + generic fallback). Ghost caches aggressively but cache misses hurt.
- **Debugging challenges** - Logic split between `.hbs` files and CMS Page HTML. Errors could be theme bug OR Page structure bug. Stack traces don't show Page content.
- **Two deployment paths** - Content (edit in Ghost) vs Theme (Git → CI). Must coordinate: new theme version expecting new Page that doesn't exist yet.

### Critical Constraints

- **Slug exactness** - `job-agency-seat-lancaster-county-sheriff` (lowercase, hyphens, match URL segments exactly). NOT `job-agency-seats` or `job_agency_seat`.
- **No Handlebars in Pages** - Page content is static HTML/Markdown only. Dynamic variables (`{{agency}}`, `{{seat}}`) only work in `.hbs` template files.
- **Route params must match** - URL `/jobs/lancaster-county/sheriff/` provides `{{agency}}` and `{{seat}}` variables to template via `routes.yaml`.
- **Generic Pages required** - Each template needs at least one generic Page (e.g., `job-agency-seat`) or falls back to hardcoded message.

### When to Edit What

**Edit `.hbs` template files when:**

- Changing data rendering logic (JavaScript, PublicLedgerData API calls)
- Modifying template structure or layout
- Adding new routes or specificity hierarchy
- Fixing template bugs or Ghost helper usage

**Edit Ghost Pages (via Admin UI) when:**

- Updating editorial copy or descriptions
- Customizing specific high-traffic pages
- Adding rich content (images, formatted text)
- A/B testing copy variations

**NEVER:**

- Use Handlebars variables in Ghost Page content (they render literally)
- Delete generic Pages (breaks all routes without specific overrides)
- Edit `assets/built/*` files (edit `assets/css/`, `assets/js/` sources instead)

See [docs/TEMPLATE_FRAGMENTS.md](docs/TEMPLATE_FRAGMENTS.md) for complete implementation guide.

---

## Commands

This fork uses **pnpm** (matching upstream) for easier sync compatibility:

```bash
pnpm install      # Install dependencies
pnpm dev          # Watch and compile theme assets
pnpm test         # Validate with GScan
pnpm zip          # Build production theme zip
pnpm lint         # Run ESLint
pnpm lint:fix     # Auto-fix ESLint issues
```

### Fork-Specific Commands

```bash
# Ghost management (devcontainer only)
pnpm ghost:logs      # View Ghost logs
pnpm ghost:restart   # Restart Ghost instance
pnpm ghost:seed      # Seed Pages from production

# Route generation (planned)
pnpm build:routes    # Generate routes.yaml from entity data
```

### Code Quality

```bash
npx prettier --write .           # Format all files
npx eslint . --fix              # Fix ESLint issues
pre-commit run --all-files      # Run pre-commit hooks
pnpm check-env                  # Validate environment setup (optional)
```

From the `TryGhost/Themes` monorepo root, validate this package with:

```bash
pnpm test:ci --theme headline
```

### Documentation Standards

All Markdown files must pass markdownlint validation:

**Critical Rules:**

- **MD034**: Wrap bare URLs in angle brackets `<https://example.com>` or link syntax `[text](url)`
- **MD040**: Specify language for all fenced code blocks (`bash`, `json`, `text`, etc.)
- **MD060**: Align table columns with pipe characters
- **MD031/MD032**: Add blank lines around code blocks and lists

**Validation:**

```bash
# Check Problems panel in VS Code for linting errors
# Or validate specific files programmatically
```

**When generating Markdown:**

- Always specify code block languages
- Use `<url>` format for bare URLs
- Add blank lines around lists and fenced code blocks
- Align table columns properly
- Validate with VS Code Problems panel or `get_errors()` after editing

See `/memories/repo/markdown-standards.md` for complete linting requirements.

---

## Fork Maintenance

### Upstream Sync

Periodically merge updates from TryGhost/Headline:

```bash
git fetch upstream
git rebase upstream/main
# Resolve conflicts, rebuild assets, test
pnpm install
pnpm test
pnpm zip
```

See [sync/README.md](sync/README.md) for complete sync procedure.

### Protected Files

Before editing, check if the file exists in upstream to avoid future merge conflicts:

```bash
git ls-tree -r upstream/main --name-only | grep "FILENAME"
```

See [AGENT_LESSONS.md](AGENT_LESSONS.md) Pattern #13 for details.

**Requires Caution (Protected for Upstream Sync):**

- **package.json:** Preserve `name: "publicledger-headline-fork"`, `author`, Node 24 requirement
- **locales/en.json:** Custom strings ("Access site", "Password")
- **.github/workflows/:** Deployment automation
- **README.md:** Synced from upstream (fork note at top only)

---

## Development Environment

### Option 1: Devcontainer (Recommended)

Complete Ghost development environment with Docker:

- Node.js 24 workspace
- Ghost dev instance (SQLite, port 3001)
- Live reload, GScan validation, code quality tools

See [DEVCONTAINER.md](DEVCONTAINER.md) for setup.

### Option 2: Traditional Setup

Requirements:

- Node.js 24+
- pnpm (specified in package.json, version 11.9.0)
- Your own Ghost instance for testing

```bash
pnpm install
pnpm dev
```

---

## Boundaries

### Safe to Edit

- **Templates:** `*.hbs` files, `partials/*.hbs`
- **Source CSS:** `assets/css/`
- **Source JavaScript:** `assets/js/`
- **Fork documentation:** `README.FORK.md`, `CONTRIBUTING.md`, `TROUBLESHOOTING.md`, `AI_DEVELOPMENT.md`, etc.
- **Devcontainer:** `.devcontainer/`, `DEVCONTAINER.md`
- **Development tooling:** `.vscode/`, `.prettierrc`, `.eslintrc`, `.editorconfig`
- **Data routes:** `routes.yaml`, data route templates (`job*.hbs`, `election*.hbs`, `finance*.hbs`, `donor*.hbs`)

### Never Edit Directly

- **assets/built/:** Auto-generated by Gulp (rebuild with `pnpm dev`)
- **node_modules/:** Package dependencies
- **dist/:** Build output directory

### Translation Changes

- **Upstream approach:** Belongs in `TryGhost/Themes/packages/theme-translations`
- **Fork approach:** Package-local overrides in `locales/*.json` are intentional and rebuilt
- **Protected:** `locales/en.json` has custom PublicLedger strings

---

## Documentation

### Fork Documentation

- **[README.FORK.md](README.FORK.md)** - Fork-specific features and setup
- **[AI_DEVELOPMENT.md](AI_DEVELOPMENT.md)** - AI agent development guidelines
- **[AGENT_LESSONS.md](AGENT_LESSONS.md)** - Common mistakes and best practices
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development workflow and standards
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[DEVCONTAINER.md](DEVCONTAINER.md)** - Devcontainer setup and usage
- **[docs/TEMPLATE_FRAGMENTS.md](docs/TEMPLATE_FRAGMENTS.md)** - Page fragment pattern implementation
- **[docs/MOCK_PACKAGE.md](docs/MOCK_PACKAGE.md)** - Mock NPM package and route generation
- **[docs-local/NPM_PACKAGE_MIGRATION.md](docs-local/NPM_PACKAGE_MIGRATION.md)** - Migration to separate data repository

### Upstream Documentation

- **[README.md](README.md)** - Theme overview (synced from upstream)

---

## Package Manager

| Aspect          | Upstream            | This Fork            |
|-----------------|---------------------|----------------------|
| Package Manager | pnpm 11+            | pnpm 11+             |
| Lock File       | pnpm-lock.yaml      | pnpm-lock.yaml       |
| Node Version    | 18+                 | 24+                  |
| Rationale       | Monorepo workspace  | Easier upstream sync |

Both use the same package manager for conflict-free upstream merges.
