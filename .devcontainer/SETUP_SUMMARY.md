# Ghost Theme Devcontainer - Setup Summary

## What Was Created

This devcontainer setup provides a complete Ghost development environment with the following components:

### 1. Devcontainer Configuration
- **`.devcontainer/devcontainer.json`**: VS Code devcontainer configuration
  - Node.js 24 environment
  - Recommended extensions (ESLint, Prettier, Tailwind CSS, Ghost)
  - Port forwarding for Ghost instances
  - Auto-installs dependencies on container creation

### 2. Docker Compose Services
- **`.devcontainer/docker-compose.yml`**: Multi-container orchestration
  - `devcontainer`: Development environment with Node.js
  - `ghost-dev`: Ghost in development mode (SQLite, port 3001)
  - `ghost-prod`: Optional production-like Ghost (MySQL, port 2368)
  - `db`: MySQL 8.0 for production testing

### 3. Enhanced Package Scripts
- **`package.json`**: Added convenience scripts
  - `npm run ghost:dev` - Show Ghost URL
  - `npm run ghost:prod` - Start production instance
  - `npm run ghost:logs` - View logs
  - `npm run ghost:restart` - Restart Ghost
  - `npm run validate` - Verbose GScan validation

### 4. Documentation
- **`DEVCONTAINER.md`**: Comprehensive setup guide
  - Quick start instructions
  - Architecture overview
  - Development workflow
  - Troubleshooting guide
- **`README.md`**: Updated with devcontainer instructions
- **`.devcontainer/README.md`**: Extension and settings info

### 5. Supporting Files
- **`.dockerignore`**: Optimizes Docker build performance

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ VS Code Devcontainer (Node.js 24)                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Your Workspace                                      │ │
│ │ - Edit .hbs templates                               │ │
│ │ - Edit CSS/JS                                       │ │
│ │ - Run npm scripts                                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Volume Mount
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Ghost Development Instance (Port 3001)                  │
│ - Auto-reloads theme changes                            │
│ - SQLite database                                       │
│ - Theme mounted at /var/lib/ghost/content/themes/headline│
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 🔄 Live Reload
- Ghost automatically detects theme file changes
- No manual restart needed for template changes
- CSS/JS rebuild with `npm run dev`

### 🎯 Multiple Test Environments
- **Development (3001)**: Fast iteration with SQLite
- **Production (2368)**: MySQL-backed for realistic testing

### 📦 Self-Contained
- Everything runs in Docker
- No local Node.js or Ghost installation needed
- Consistent environment across team members

### 🔧 VS Code Integration
- Extensions auto-installed
- Format-on-save configured
- Port forwarding automatic
- Integrated terminal in container

## Workflow

1. **Open Project**: VS Code prompts to reopen in container
2. **Wait for Startup**: Containers start, dependencies install
3. **Setup Ghost**: Visit localhost:3001/ghost, create admin
4. **Activate Theme**: Settings → Design → Change theme → headline
5. **Develop**: Edit files, run `npm run dev`, see changes live
6. **Validate**: Run `npm run test` before deploying
7. **Build**: Run `npm run zip` to create production package

## Next Steps

### To Start Development
```bash
# In VS Code terminal (inside container)
npm run dev
```

### To Access Ghost
- Frontend: http://localhost:3001
- Admin: http://localhost:3001/ghost

### To Test Production Mode
```bash
npm run ghost:prod
# Then visit http://localhost:2368
```

### To Stop Everything
```bash
npm run ghost:stop
# Or close VS Code and containers stop automatically
```

## Research Summary

Based on Ghost documentation and Docker Hub official image:

### Ghost Local Development Recommendations
1. **Development Mode**: Use `NODE_ENV=development` with SQLite
2. **Theme Location**: Mount to `/var/lib/ghost/content/themes/`
3. **Auto-Reload**: Ghost watches theme directory automatically
4. **Validation**: Use GScan tool for compatibility checking
5. **Docker Approach**: Official Ghost Docker image preferred over ghost-cli for containers

### Implementation Decisions
- ✅ Use official `ghost:6-alpine` image (smaller footprint)
- ✅ Development mode as default (faster iteration)
- ✅ Optional production mode with MySQL (realistic testing)
- ✅ Devcontainer shares network with Ghost (simplified access)
- ✅ Named volumes for persistent Ghost data
- ✅ Theme mounted read-only from workspace

## Troubleshooting Resources

1. **Container Issues**: Check `docker compose logs ghost-dev`
2. **Port Conflicts**: Edit ports in docker-compose.yml
3. **Theme Not Found**: Verify mount with `docker compose exec ghost-dev ls /var/lib/ghost/content/themes/`
4. **Reset Ghost**: `docker compose down -v` (WARNING: deletes data)

## References

- Ghost Local Install: https://docs.ghost.org/install/local/
- Ghost Docker Image: https://hub.docker.com/_/ghost/
- GScan Validation: https://gscan.ghost.org/
- Theme Development: https://ghost.org/docs/themes/

---

**Setup Complete!** 🎉

Open this folder in VS Code and click "Reopen in Container" to get started.
