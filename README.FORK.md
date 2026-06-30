# PublicLedger Headline Theme Fork

**Fork Repository:** https://github.com/PublicLedger/ghostcms-headline-theme-fork  
**Upstream Repository:** https://github.com/TryGhost/Headline

This is a forked version of the [Headline Ghost theme](https://github.com/TryGhost/Headline) configured with a complete **devcontainer environment** for local Ghost theme development and preview.

## Fork Relationship

This repository is a fork of [TryGhost/Headline](https://github.com/TryGhost/Headline) with customizations for The Public Ledger project. While we maintain compatibility and sync with upstream improvements, this is a distinct theme with:

- Custom branding and metadata
- PublicLedger-specific features
- Devcontainer development environment
- Automated deployment to our Ghost instance
- Enhanced development tooling (ESLint, Prettier, pre-commit hooks)
- Node.js 24 requirement (vs upstream Node 18+)

**Upstream syncs:** We periodically merge updates from the original Headline theme.  
**Contributing back:** Bug fixes may be contributed upstream via PR to TryGhost/Themes monorepo.

---

# 🚀 Quick Start (Devcontainer)

**For local development with full Ghost preview:**

1. Open this folder in VS Code
2. Click "Reopen in Container" when prompted (or use Command Palette: `Dev Containers: Reopen in Container`)
3. Wait for containers to start (~1-2 minutes first time)
4. Visit http://localhost:3001/ghost to set up your Ghost admin account
5. Activate the "headline" theme in Settings → Design
6. Run `pnpm dev` to start development with live reload

**📖 Full Documentation:** See [DEVCONTAINER.md](DEVCONTAINER.md) for complete setup guide and troubleshooting.

## What You Get

- ✅ **Full Ghost Instance** running locally in development mode (SQLite)
- ✅ **Live Reload** - Theme changes automatically update in browser
- ✅ **Node.js 24** environment with all build tools pre-installed
- ✅ **VS Code Integration** with recommended extensions
- ✅ **Optional MySQL** for production-like testing (ghost-prod container)
- ✅ **GScan Validation** built-in for Ghost theme compatibility
- ✅ **Code Quality Tools** - ESLint, Prettier, pre-commit hooks
- ✅ **Zero Config** - just open in VS Code and start developing

---

# Development Commands

## Theme Development

```bash
pnpm dev          # Watch and compile theme assets with live reload
pnpm test         # Validate theme with GScan
pnpm zip          # Build production theme zip file
pnpm lint         # Run ESLint on JavaScript files
pnpm lint:fix     # Auto-fix ESLint issues
```

## Ghost Management (Devcontainer Only)

```bash
pnpm ghost:logs     # View Ghost development logs
pnpm ghost:restart  # Restart Ghost development instance
pnpm ghost:stop     # Stop Ghost development instance
pnpm ghost:start    # Start Ghost development instance
```

## Code Quality

```bash
npx prettier --write .           # Format all files with Prettier
npx eslint . --fix              # Fix all auto-fixable ESLint issues
pre-commit run --all-files      # Run all pre-commit hooks manually
```

---

# Development Environments

## Option 1: Devcontainer (Recommended)

The devcontainer provides a complete Ghost development environment with:

- **devcontainer**: Node.js 24 workspace with VS Code integration
- **ghost-dev**: Ghost instance on SQLite (port 3001, auto-starts)
- **ghost-prod**: Optional Ghost on MySQL (port 2368, manual start)
- **db**: MySQL 8.0 for production testing

**Requirements:**

- Docker Desktop or Docker Engine + Docker Compose
- VS Code with Dev Containers extension

See [DEVCONTAINER.md](DEVCONTAINER.md) for complete setup guide.

## Option 2: Traditional Setup

If you prefer traditional development without Docker:

**Requirements:**

- Node.js v24+ (fork requirement)
- pnpm (manages dependencies)
- Your own Ghost instance to test the theme

**Setup:**

```bash
# Install dependencies
pnpm install

# Run build & watch for changes
pnpm dev

# Create production zip
pnpm zip
```

The `zip` task packages the theme into `dist/headline.zip` for upload to your Ghost site.

---

# Documentation

## Fork-Specific Documentation

- **[README.FORK.md](README.FORK.md)** ← You are here! Fork-specific setup and features
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development workflow, code quality standards, testing practices
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues, debugging tips, and solutions
- **[DEVCONTAINER.md](DEVCONTAINER.md)** - Complete devcontainer setup guide and environment architecture
- **[sync/README.md](sync/README.md)** - Complete upstream sync guide (strategy, commands, checklist)
- **[AI_DEVELOPMENT.md](AI_DEVELOPMENT.md)** - AI agent development guidelines and fork architecture
- **[AGENT_LESSONS.md](AGENT_LESSONS.md)** - Common mistakes to avoid when maintaining the fork

## Upstream Documentation

- **[README.md](README.md)** - Upstream theme documentation (synced from TryGhost/Headline)
- **[LICENSE](LICENSE)** - MIT License from Ghost Foundation

---

# Contributing

## To This Fork

For issues or improvements specific to the PublicLedger fork:

- Devcontainer configuration and setup
- Deployment automation to our Ghost instance
- Fork-specific customizations and features
- Development tooling and quality configurations

**Open an issue:** https://github.com/PublicLedger/ghostcms-headline-theme-fork/issues

**Development Guidelines:** See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development workflow and testing practices
- Code quality standards and validation
- Fork-specific constraints and upstream sync protocol
- Ghost theme architecture and best practices

**Need Help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and debugging tips.

## To Upstream Theme

General bug fixes and improvements that benefit the original theme can be contributed to:

- **Main repository:** [TryGhost/Themes](https://github.com/TryGhost/Themes) monorepo
- **Theme translations:** See `@TryGhost/Themes/theme-translations/README.md`

---

# Fork-Specific Features

## Package Manager

| **Package Manager** | pnpm 11.9.0             | pnpm 11.9.0             | Easier upstream sync      |
- **Upstream uses:** pnpm with `pnpm-lock.yaml`
- **Reason:** Simpler devcontainer setup, Node 24 compatibility

## Node.js Version

- **Fork requires:** Node.js 24+
- **Upstream requires:** Node.js 18+
- **Reason:** Latest LTS features and security updates

## Development Tooling

Added to fork (not in upstream):

- **ESLint** - JavaScript linting with Ghost-specific configuration
- **Prettier** - Code formatting with Handlebars support
- **Pre-commit hooks** - Automated validation before commits
- **EditorConfig** - Cross-editor consistency
- **VS Code settings** - Recommended editor configuration

## Custom Localization

Modified `locales/en.json` strings:

- "Access site" instead of "Access code"
- Custom password prompt text

See [AGENT_LESSONS.md](AGENT_LESSONS.md) for protected files that must be preserved during upstream syncs.

---

# Upstream Sync Status

**Last upstream sync:** 2026-06-29 (commit 73ee6a5)  
**Divergence:** See `git log --oneline upstream/main..staging`  
**Automated sync:** Planned via GitHub Actions (weekly cron)

To manually sync with upstream:

```bash
# Quick sync with helper script
./sync/upstream-sync.sh

# Or manual sync
git fetch upstream
git rebase upstream/main
pnpm install && pnpm test && pnpm zip
```

See [sync/README.md](sync/README.md) for complete sync procedure.

---

# Copyright & License

**Upstream theme:** Copyright (c) 2013-2026 Ghost Foundation  
**License:** Released under the [MIT license](LICENSE)

**Fork modifications:** Copyright (c) 2026 The Public Ledger  
**License:** Also released under MIT license (same as upstream)
