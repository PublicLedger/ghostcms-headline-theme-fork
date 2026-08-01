# Devcontainer Development

## What is a Devcontainer?

A [development container](https://containers.dev/) is a Docker-based environment
that provides a consistent, reproducible development setup. Benefits:

- **Zero manual setup** - All dependencies, tools, and services pre-configured
- **Consistent environments** - Same setup across all developers and machines
- **Isolated development** - No conflicts with host system packages
- **Version controlled** - Environment definition lives in `.devcontainer/`

## Why We Use It

This Ghost theme requires:

- Node.js 24 with pnpm
- Running Ghost instance for preview
- Theme build tools (Gulp, PostCSS, etc.)

The devcontainer handles all of this automatically - open the project in VS Code
and start coding.

## Quick Start

**Prerequisites:**

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [VS Code](https://code.visualstudio.com/) with
  [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

**Steps:**

1. Open this folder in VS Code
2. Click "Reopen in Container" when prompted (or Command Palette → "Dev
   Containers: Reopen in Container")
3. Wait for containers to start (~2 minutes first time)
4. Access Ghost Admin at <http://localhost:3001/ghost/> with auto-created
   credentials (`admin@example.com` / `RandomSecure123456789`)
5. Run `pnpm dev` to watch theme changes

## Daily Workflow

```bash
pnpm dev          # Watch and rebuild theme on changes
pnpm test         # Validate theme compatibility
pnpm zip          # Build distributable theme package
```

Ghost runs automatically when the devcontainer starts. Theme changes are
live-mounted and auto-detected.

## Operational Details

See [.devcontainer/README.md](.devcontainer/README.md) for:

- Architecture and networking details
- Commands reference
- Production content seeding
- Troubleshooting
- Data persistence and reset procedures
