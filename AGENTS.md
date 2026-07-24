# AGENTS.md

## Scope

This package is the Headline Ghost theme fork for PublicLedger, featuring data-driven news routes with Page-based template content.

In the standalone mirror repository, this tree is pushed from `TryGhost/Themes/packages/headline` by subtree sync; make durable theme-content changes in `TryGhost/Themes` unless the task is explicitly repo-level metadata or GitHub settings.

## Architecture: Template Specificity Pattern

**Why we chose this:** Editorial control over high-traffic pages without code deployments, while generic templates handle all other routes.

**Pattern:** Ghost Pages serve as template content with specificity hierarchy:

1. Try specific Page: `job-agency-seat-lancaster-county-sheriff`
2. Fall back to generic: `job-agency-seat`
3. Show hardcoded fallback if neither exists

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

See [docs-local/TEMPLATE_SPECIFICITY.md](docs-local/TEMPLATE_SPECIFICITY.md) for complete implementation guide.

## Commands

Use pnpm, pinned by `package.json`.

```bash
pnpm install
pnpm dev
pnpm test
pnpm zip
```

From the `TryGhost/Themes` monorepo root, validate this package with:

```bash
pnpm test:ci --theme headline
```

## Boundaries

- Edit source CSS in `assets/css/`, source JavaScript in `assets/js/`, and templates/partials as `.hbs` files.
- Keep generated `assets/built/` files in sync when source assets change.
- Do not commit `node_modules/`, secrets, or local Ghost content.
- Translation changes normally belong in `TryGhost/Themes/packages/theme-translations`; package-local locale overrides should be intentional and rebuilt.
