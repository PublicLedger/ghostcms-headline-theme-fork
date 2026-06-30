# Ghost Theme Development - Devcontainer Setup

This is a forked version of the [Headline theme](https://github.com/TryGhost/Headline) for Ghost CMS, configured with a complete devcontainer environment for local theme development and preview.

## Features

- **Full Devcontainer Environment**: Pre-configured VS Code devcontainer with Node.js 24
- **Local Ghost Preview**: Automatic Ghost instance running in development mode
- **Live Reload**: Theme changes automatically reload in the browser
- **Production Testing**: Optional MySQL-backed Ghost instance for production-like testing
- **Theme Validation**: Built-in GScan for theme compatibility checking

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) or Docker Engine + Docker Compose
- [VS Code](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Getting Started

1. **Open in Devcontainer**
   - Open this folder in VS Code
   - When prompted, click "Reopen in Container" (or use Command Palette: `Dev Containers: Reopen in Container`)
   - Wait for the container to build and start

2. **Access Ghost**
   - Development instance: http://localhost:3001
   - Ghost Admin: http://localhost:3001/ghost
   - Create your admin account on first visit

3. **Activate the Theme**
   - Go to http://localhost:3001/ghost
   - Navigate to Settings → Design
   - Click "Change theme" and select "headline"
   - Click "Activate"

4. **Start Developing**
   - Edit theme files in VS Code
   - Run `pnpm dev` to watch for changes and rebuild assets
   - Changes auto-reload in the browser

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode for asset compilation (Gulp) |
| `pnpm test` | Validate theme with GScan |
| `pnpm validate` | Verbose GScan validation |
| `pnpm zip` | Build theme zip for upload |
| `pnpm ghost:dev` | Show Ghost dev instance URL |
| `pnpm ghost:prod` | Start production-like Ghost with MySQL |
| `pnpm ghost:stop` | Stop all Ghost containers |
| `pnpm ghost:logs` | View Ghost development logs |
| `pnpm ghost:restart` | Restart Ghost development instance |

## Architecture

### Containers

1. **devcontainer**: Your development environment with Node.js, pnpm, and all theme build tools
2. **ghost-dev**: Ghost in development mode with SQLite (auto-starts, port 3001)
3. **ghost-prod**: Ghost in production mode with MySQL (optional, port 2368)
4. **db**: MySQL 8.0 database (optional, for production testing)

### Volume Mounts

- Theme files are mounted from your workspace to `/var/lib/ghost/content/themes/headline`
- Ghost content (images, data, settings) persists in Docker volumes
- Changes to theme files are immediately visible to Ghost

### Development Mode vs Production Mode

**Development Mode (default, port 3001)**
- Uses SQLite database
- Less caching for faster iteration
- Auto-reloads theme changes
- Logs to stdout

**Production Mode (optional, port 2368)**
- Uses MySQL database
- Full caching enabled
- Requires `pnpm ghost:prod` to start
- More accurate testing environment

## Theme Development Workflow

1. **Make Changes**: Edit `.hbs` templates, CSS in `assets/css/`, or JavaScript in `assets/js/`
2. **Build Assets**: Run `pnpm dev` to watch and compile CSS/JS
3. **View Changes**: Ghost automatically detects template changes
4. **Validate**: Run `pnpm test` to check theme compatibility
5. **Package**: Run `pnpm zip` to create distributable theme

## Ghost Documentation

- [Theme Development Guide](https://ghost.org/docs/themes/)
- [Handlebars Templates](https://ghost.org/docs/themes/structure/)
- [Theme Configuration](https://ghost.org/docs/themes/config/)
- [GScan Validation](https://gscan.ghost.org/)

## Troubleshooting

### Ghost container not starting
```bash
# Check container logs
docker compose logs ghost-dev

# Restart containers
docker compose restart
```

### Theme not appearing
```bash
# Verify theme is mounted
docker compose exec ghost-dev ls -la /var/lib/ghost/content/themes/

# Restart Ghost to detect theme
pnpm ghost:restart
```

### Port conflicts
If ports 2368 or 3001 are in use, edit `.devcontainer/docker-compose.yml` and change the port mappings.

### Clear Ghost data
```bash
# Stop containers
pnpm ghost:stop

# Remove volumes (WARNING: deletes all Ghost content)
docker compose down -v
```

## Production Deployment

When ready to deploy:

1. Validate theme: `pnpm test`
2. Build production zip: `pnpm zip`
3. Upload `dist/headline.zip` to your Ghost instance via Admin → Settings → Design

## Theme Structure

```
.
├── *.hbs                 # Template files
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript
│   ├── fonts/            # Custom fonts
│   └── built/            # Compiled assets (generated)
├── partials/             # Reusable template partials
├── locales/              # Translation files
├── package.json          # Theme metadata and dependencies
└── routes.yaml           # Custom routing configuration
```

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Credits

Based on [Headline](https://github.com/TryGhost/Headline) theme by [Ghost Foundation](https://ghost.org/).
