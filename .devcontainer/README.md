# Ghost Theme Devcontainer Operations

Automated Ghost development environment with theme live-mounted as **headline**.

## Quick Start

1. **Open in devcontainer** → Ghost auto-starts
2. **Login**: http://localhost:3001/ghost/ with `admin@example.com` / `RandomSecure123456789`
3. **Theme is pre-activated** → start coding
4. **Watch mode**: `pnpm dev` to rebuild on changes

## Daily Workflow

After the one-time container setup, daily development requires **zero manual steps**:

```bash
pnpm dev          # Watch and rebuild theme assets
pnpm test         # Validate theme with GScan
pnpm zip          # Package theme for upload
```

Ghost runs automatically when the devcontainer starts. All data persists across container restarts.

**Access URLs:**
- **Ghost Admin**: http://localhost:3001/ghost/ (from host browser)
- **Public site**: http://localhost:3001/
- **Credentials**: `admin@example.com` / `RandomSecure123456789`
- **Inside container**: Ghost API at `localhost:2368` (scripts use this port)

## Production Content Seeding (Optional)

To sync content from production Ghost, add credentials to `.env` in the repository root:

```bash
GHOST_PRD_URL="https://publicledger.ghost.io"
GHOST_PRD_KEY="<content-api-key>"
GHOST_PRD_SECRET="<id:secret>"
```

Get credentials from production Ghost Admin → Settings → Integrations → Create custom integration.

Then run:
```bash
pnpm ghost:seed
```

⚠️ **Warning:** Seeding overwrites local content. See [docs-local/GHOST_SEED_SAFETY.md](../docs-local/GHOST_SEED_SAFETY.md) for safety guidelines.

## Commands Reference

### Theme Development
| Command | Purpose |
|---------|---------|
| `pnpm dev` | Watch mode - rebuild assets on changes |
| `pnpm test` | Validate theme compatibility (GScan) |
| `pnpm validate` | Verbose GScan validation |
| `pnpm zip` | Build distributable theme package |
| `pnpm lint` | Check JavaScript code quality |
| `pnpm lint:fix` | Auto-fix ESLint issues |

### Ghost Operations
| Command | Purpose |
|---------|---------|

| `pnpm ghost:seed` | Sync Pages from production (requires `.env`) |
| `pnpm ghost:logs` | View Ghost container logs (live tail) |
| `pnpm ghost:restart` | Restart Ghost container |

### Environment
| Command | Purpose |
|---------|---------|
| `pnpm check-env` | Validate full environment setup |

## Architecture

### Containers

Two Docker containers managed by the devcontainer:

1. **`devcontainer`** - Node.js 24 with pnpm, theme build tools
2. **`ghost-dev`** - Ghost 6-alpine with SQLite, exposed on port 3001 (only container needed for theme development)
   - **Healthcheck**: Polls `/ghost/` every 10s to verify Ghost is responding
   - **Auto-setup**: Runs `ghost-setup.sh` on startup (creates admin + activates theme)

### Port Mapping

The devcontainer uses `network_mode: service:ghost-dev` (shares ghost-dev's network):

- **Inside container**: Ghost at `localhost:2368` (Ghost's internal port)
- **From host browser**: Ghost at `localhost:3001` (Docker port mapping)

**Important:** Scripts inside the container use port 2368, your browser uses port 3001.

### Volume Mounts

- **Theme files**: Workspace live-mounted to `/var/lib/ghost/content/themes/headline`
- **Ghost content**: Persists in Docker volumes (`ghost-dev-data`, `ghost-dev-images`, `ghost-dev-logs`, etc.)

Changes to theme files are immediately visible to Ghost.

### Auto-Setup

On first start, Ghost automatically:

- Creates admin account: `admin@example.com` / `RandomSecure123456789`
- Sets site title: The Public Ledger
- Activates headline theme

The setup script logs to `/var/lib/ghost/content/logs/ghost-setup.log` (visible via `pnpm ghost:logs`). VS Code waits for setup completion (marker file: `.ghost-setup-complete` in workspace root) before showing the terminal prompt.

⚠️ **Local development only** - never use these credentials in production.

## Data Persistence

Ghost data survives devcontainer rebuilds via Docker volumes:

- `ghost-dev-data` - SQLite database
- `ghost-dev-images` - Uploaded images
- `ghost-dev-logs` - Ghost logs
- `ghost-dev-apps` - Ghost apps
- `ghost-dev-settings` - Custom settings

### Reset Database

To start with a fresh Ghost instance:

```bash
# From host terminal (outside container)
cd .devcontainer
docker compose down -v    # ⚠️ WARNING: Deletes all Ghost content
```

Then rebuild devcontainer in VS Code (Command Palette → "Dev Containers: Rebuild Container").

### Docker Cleanup

If Docker accumulates cruft (old containers, images, build cache), clean it periodically:

```bash
# From host terminal - removes all unused Docker data
docker system prune -af --volumes
```

⚠️ **WARNING**: Deletes all:
- Stopped containers
- Unused images
- Unused volumes (including Ghost data)
- Build cache

After cleanup, rebuild devcontainer to recreate environment.

## Troubleshooting

### Can't access Ghost Admin

**Symptom:** http://localhost:3001/ghost/ not loading

**Solutions:**
- Wait 30-60 seconds after container starts (Ghost initialization)
- Check VS Code port forwarding is active (Ports tab)
- Use host browser (not inside container terminal)
- Ensure URL includes `/ghost/` path and port 3001 (not 2368)

If Ghost isn't responding:
```bash
pnpm ghost:logs     # Check for errors
pnpm ghost:restart  # Restart Ghost
```

### Theme not appearing

**Symptom:** "headline" theme missing in Settings → Design

**Solutions:**
- Verify theme is built: `pnpm install && pnpm zip`
- Check mount: `ls -la /var/lib/ghost/content/themes/headline/package.json`
- Restart Ghost: rebuild devcontainer

### Theme changes not reflecting

**Symptom:** Updated templates/CSS/JS not showing

**Solutions:**
- Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Restart watch mode: `pnpm dev`
- Clear Ghost cache: rebuild devcontainer
- Check `assets/built/` has recent timestamps
- Check browser console for JavaScript errors

### Auto-setup timed out

**Symptom:** "Ghost admin account setup timed out" message on container start

**This is normal.** Ghost may still be initializing. Wait 1-2 minutes, then:

```bash
pnpm ghost:check    # Check if Ghost is now running
pnpm ghost:setup    # Retry admin account creation if needed
```

### Port conflicts

**Symptom:** "Port 3001 already in use"

**Solutions:**
1. Find conflicting process: `lsof -i :3001`
2. Stop conflicting service
3. Or change port in `.devcontainer/docker-compose.yml`:
   ```yaml
   ports:
     - "3002:2368"  # Change 3001 to 3002
   ```
4. Rebuild container

### View Ghost logs

**From terminal:**
```bash
pnpm ghost:logs    # Live tail of Ghost container logs
```

**From VS Code Docker extension:**
1. Open Docker extension (left sidebar)
2. Find `ghost-dev` container
3. Right-click → "View Logs"

### Extensions reinstalling on rebuild

**This is normal.** Extensions install inside the container (not on host). On rebuild:
1. Container recreates from scratch
2. Extensions reinstall (~30-60 seconds)
3. VS Code caches to speed this up

Tip: Remove unused extensions from `.devcontainer/devcontainer.json` to speed up rebuilds.

## Customizing Admin Credentials

Edit environment variables in `.devcontainer/docker-compose.yml`:

```yaml
environment:
  GHOST_ADMIN_EMAIL: your@email.com
  GHOST_ADMIN_PASSWORD: yourpassword
  GHOST_ADMIN_NAME: Your Name
  GHOST_SITE_TITLE: Your Site Title
```

Then rebuild: Command Palette → "Dev Containers: Rebuild Container"

## Production Deployment

When ready to deploy:

```bash
pnpm test                                    # Validate theme
pnpm zip                                     # Build dist/headline.zip
# Upload to Ghost Admin → Settings → Design
```

## Resources

- [Ghost Theme Documentation](https://ghost.org/docs/themes/)
- [Handlebars Templates](https://ghost.org/docs/themes/structure/)
- [GScan Validation](https://gscan.ghost.org/)
- [Dev Containers Docs](https://containers.dev/)
