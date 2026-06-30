# Agents

This document outlines the AI agent guidelines for the Ghost Headline theme fork. It is the single source of truth for shared conventions. Tool-specific files (CLAUDE.md, etc.) reference this file.

## Overview

This is a **forked Ghost theme** from TryGhost/Headline with active upstream synchronization. Core stack: Node.js 24 (Gulp build system), Ghost 6.0+, Handlebars templating. DevContainer runs multi-container environment (ghost-dev on SQLite:3001, optional ghost-prod on MySQL:2368). Theme auto-mounted with live reload. See [DEVCONTAINER.md](DEVCONTAINER.md) for environment setup, [sync/README.md](sync/README.md) for fork maintenance workflow.

**Critical constraint:** Every code change must preserve fork identity and account for future upstream merges.

## Fork Architecture

**Living Fork:** PublicLedger/ghostcms-headline-theme-fork tracks TryGhost/Headline  
**Divergence:** 5 commits ahead, ~19 commits behind (as of 2026-06-28)  
**Environment:** Docker devcontainer with Node.js 24, Ghost 6.0+, SQLite (dev) / MySQL (prod)  
**Theme Mount:** `/var/lib/ghost/content/themes/headline` with live reload

**Stack:**

- **Templates:** Handlebars (.hbs) - server-rendered by Ghost, context-based routing
- **Assets:** PostCSS (CSS) + Gulp (JS) → compiled to `assets/built/`
- **Config:** `package.json` (Ghost settings, theme options), `routes.yaml` (custom URLs)
- **i18n:** `locales/*.json` translation files

## Agent Guidelines

All AI agents working on this theme must:

1. **Preserve fork identity** - Never change `package.json` name, author, Node 24 requirement, or `ghost:*` scripts
2. **Check upstream conflicts** - Review [sync/README.md](sync/README.md) before editing files
3. **Test in devcontainer** - Verify changes at http://localhost:3001 before committing
4. **Document fork changes** - Mark custom code with `{{!-- FORK CUSTOM: ... --}}` comments
5. **Follow sync protocol** - See [sync/README.md](sync/README.md) for merge procedures

**Never change:**

- `package.json`: name, author, engines.node (24+), ghost:\* scripts
- `locales/en.json`: Custom strings ("Access site", "Password")
- `.devcontainer/`: Entire directory (fork-only)
- `.github/workflows/deploy-theme.yaml`: Deployment automation

## File Safety Guide

**✅ Safe to edit (low upstream conflict risk):**

- `.hbs` template files, `partials/*.hbs` components
- `assets/css/*.css` source files (not built/)
- `.devcontainer/*`, `.github/workflows/*` (fork-only)

**⚠️ Edit with caution (moderate risk):**

- `package.json` - Preserve fork metadata, check upstream before updating deps
- `locales/*.json` - Keep fork strings, merge new upstream keys
- `gulpfile.js` - Upstream occasionally updates build system

**❌ Avoid editing (high conflict risk):**

- `assets/built/*` - Auto-generated, rebuilt on upstream sync
- Core Ghost helpers - Upstream may change API

## Agent Development

When proposing changes:

1. Read [DEVCONTAINER.md](DEVCONTAINER.md) - Environment architecture and workflow
2. Check [sync/README.md](sync/README.md) - Known divergences and conflict resolution
3. Review [.devcontainer/FORK_STATUS.md](.devcontainer/FORK_STATUS.md) - Current fork state
4. Consider: "Will this conflict with upstream merges? Is documentation needed?"

## Key Commands

### Development

- `pnpm dev` — Watch and compile assets (Gulp), starts live reload
- `pnpm zip` — Build production theme package to `dist/`

### Validation & Testing

- `pnpm test` — Validate theme with GScan
- `pnpm validate` — Verbose GScan validation with compatibility report

### Ghost Management (devcontainer)

- `pnpm ghost:dev` — Show development Ghost URL (http://localhost:3001)
- `pnpm ghost:logs` — View Ghost development logs
- `pnpm ghost:restart` — Restart Ghost development instance
- `pnpm ghost:prod` — Start production-like Ghost with MySQL (port 2368)
- `pnpm ghost:stop` — Stop all Ghost containers

### Docker Management

- `docker compose ps` — View running containers
- `docker compose logs -f ghost-dev` — Follow development logs
- `docker compose restart ghost-dev` — Restart Ghost container
- `docker compose down` — Stop all containers
- `docker compose down -v` — Stop and delete all data (⚠️ destructive)

## Development Workflow

1. **Start devcontainer** - VS Code "Reopen in Container"
2. **Access Ghost Admin** - http://localhost:3001/ghost (create account if first run)
3. **Activate theme** - Settings → Design → Change theme → headline
4. **Start asset watcher** - `pnpm dev` in terminal
5. **Edit files** - Templates (.hbs) auto-reload, assets rebuild on save
6. **Validate before commit** - `pnpm test && pnpm zip`

## Upstream Sync Protocol

1. **Check if upstream modified the same file** - Review UPSTREAM_SYNC_PLAN.md for known divergences
2. **Preserve fork identity** - Never change package.json name, author, or ghost:\* scripts
3. **Test in devcontainer** - Always verify changes work in the Ghost development instance
4. **Document breaking changes** - Note any changes that might conflict with future syncs

**Full sync workflow:** See [sync/README.md](sync/README.md) for detailed sync procedures and step-by-step guide.

## Editing Rules

### Safe to Edit (Low Conflict Risk)

- `.hbs` template files, `partials/*.hbs` components
- `assets/css/*.css` source files (not built/)
- `.devcontainer/*`, `.github/workflows/*` (fork-only)

### Edit with Caution (Moderate Risk)

- `package.json` - Preserve fork metadata, check upstream before updating deps
- `locales/*.json` - Keep fork strings, merge new upstream keys
- `gulpfile.js` - Upstream occasionally updates build system

### Avoid Editing (High Conflict Risk)

- `assets/built/*` - Auto-generated, rebuilt on upstream sync
- Core Ghost helpers - Upstream may change API

## Package.json Editing Protocol

When modifying package.json:

```json
{
  "name": "publicledger-headline-fork", // NEVER CHANGE
  "description": "...", // NEVER CHANGE
  "author": {
    /* Gasworks Data */
  }, // NEVER CHANGE
  "engines": {
    "node": ">=24.0.0", // NEVER CHANGE (fork requirement)
    "ghost": ">=6.0.0" // Update if needed
  },
  "scripts": {
    "dev": "gulp", // Standard scripts (safe to update)
    "ghost:dev": "...", // Fork scripts (preserve)
    "ghost:*": "..." // Fork scripts (preserve)
  },
  "devDependencies": {
    // Safe to update versions, but check upstream first
  }
}
```

## Theme Development Guidelines

### Adding New Features

1. Use custom page templates (`custom-*.hbs`) over modifying core templates
2. Add custom CSS in separate files, import in screen.css
3. Document in code comments if feature depends on specific Ghost version
4. Test with `pnpm validate` for Ghost compatibility

### Modifying Existing Templates

1. Check if template is in upstream UPSTREAM_SYNC_PLAN.md conflict list
2. Add code comments marking fork-specific changes: `{{!-- FORK CUSTOM: ... --}}`
3. Keep changes minimal to reduce merge conflicts
4. Consider using partials for reusable custom components

### Asset Compilation

- CSS: Edit `assets/css/*.css`, run `pnpm dev` to compile
- JS: Edit `assets/js/*.js`, run `pnpm dev` to compile
- Built files: Never manually edit `assets/built/*`

## Ghost-Specific Patterns

### Template Context

```handlebars
{{! Context automatically available based on route }}
{{#post}}
  {{! Current post object }}
  {{title}}
  {{content}}
  {{! Renders post HTML }}
  {{excerpt}}
{{/post}}

{{#foreach posts}}
  {{! Loop collection }}
  {{title}}
{{/foreach}}
```

### Responsive Images

```handlebars
{{! Ghost generates responsive srcset }}
{{img_url feature_image size="l"}}
{{img_url feature_image size="m"}}
```

### Translations

```handlebars
{{! Use locales/*.json }}
{{t "Subscribe"}}
{{t "Email"}}
```

## Devcontainer Workflow

### When Editing Container Config

- `.devcontainer/devcontainer.json` - VS Code settings, extensions
- `.devcontainer/docker-compose.yml` - Services, ports, volumes
- After changes: Rebuild container in VS Code

### Testing Theme Changes

1. Ensure Ghost is running: `docker compose ps`
2. Access Ghost Admin: http://localhost:3001/ghost
3. Activate theme if not active: Settings → Design → headline
4. View frontend: http://localhost:3001
5. Watch logs: `pnpm ghost:logs`

## Common Questions

### "Should I update a dependency?"

- Check if upstream already updated it in UPSTREAM_SYNC_PLAN.md
- If yes, wait for upstream sync to get it
- If urgent, update but document in commit message

### "Can I change the theme name?"

- No - breaks fork identity and deployment automation

### "How do I test production mode?"

- `pnpm ghost:prod` starts MySQL-backed Ghost on port 2368
- More realistic caching/performance testing
- `pnpm ghost:stop` to clean up

### "What if GScan validation fails?"

- Review `pnpm validate` output
- Check if Ghost version requirement needs updating
- Some warnings are acceptable (check upstream's GScan status)

## Error Troubleshooting

### "Theme not appearing in Ghost Admin"

```bash
docker compose exec ghost-dev ls /var/lib/ghost/content/themes/
pnpm ghost:restart
```

### "CSS/JS changes not compiling"

```bash
# Ensure dev watcher is running
pnpm dev
# Check for syntax errors in terminal
```

### "Port 3001 already in use"

```bash
# Check what's using the port
lsof -i :3001
# Change port in .devcontainer/docker-compose.yml if needed
```

### "Container won't start"

```bash
docker compose logs ghost-dev
docker compose down
docker compose up -d
```

## Documentation References

When helping users, point to:

- Setup guide: DEVCONTAINER.md
- Quick reference: .devcontainer/QUICKREF.md
- Upstream sync: UPSTREAM_SYNC_PLAN.md
- Fork status: .devcontainer/FORK_STATUS.md
- Ghost docs: https://ghost.org/docs/themes/

## Code Style

- **Handlebars:** 2-space indent, lowercase helpers
- **CSS:** Follow existing PostCSS patterns
- **JavaScript:** ES6+, no jQuery (Ghost provides vanilla utilities)
- **Comments:** Explain "why" not "what"
- **Git commits:** Conventional commits (feat:, fix:, chore:)
