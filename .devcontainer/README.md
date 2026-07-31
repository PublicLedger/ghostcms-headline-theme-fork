# Ghost Theme Devcontainer Operations

Automated Ghost development environment with the theme live-mounted as
**publicledger-headline-fork**.

## Quick Start

1. **Open in devcontainer** → Ghost auto-starts
2. **Login**: <http://localhost:3001/ghost/> with `admin@example.com` /
   `RandomSecure123456789`
3. **Theme is pre-activated** → start coding
4. **Watch mode**: `pnpm dev` to rebuild on changes

## Daily Workflow

After the one-time container setup, daily development requires **zero manual
steps**:

```bash
pnpm dev          # Watch and rebuild theme assets
pnpm test         # Validate theme with GScan
pnpm zip          # Package theme for upload
```

Ghost runs automatically when the devcontainer starts. All data persists across
container restarts.

**Access URLs:**

- **Ghost Admin**: <http://localhost:3001/ghost/> (from host browser)
- **Public site**: <http://localhost:3001/>
- **Credentials**: `admin@example.com` / `RandomSecure123456789`
- **Inside container**: Ghost API at `localhost:2368` (scripts use this port)

## Production Content Seeding (Optional)

To sync content from production Ghost, add credentials to `.env` in the
repository root:

```bash
GHOST_PRD_URL="https://publicledger.ghost.io"
GHOST_PRD_KEY="<content-api-key>"
```

Get the credential from production Ghost Admin → Settings → Integrations → Create
custom integration, and copy the **Content API Key**.

> **Do not put the Admin API Key in `.env`.** It is injected into the devcontainer
> via `env_file` and would be readable by every process there. Ghost Admin API
> keys cannot be scoped: one grants full read/write access to members' PII, staff
> accounts, and settings. The seeder only reads published pages, which the Content
> API covers.

Note: the Content API returns **published pages only**. Production drafts are not
seeded; `ghost-seed.js` creates its own local test fragment pages for routing
work.

Then run:

```bash
pnpm ghost:seed
```

⚠️ **Warning:** `ghost:seed` deletes every page before inserting, with no
confirmation prompt. Run it *before* `pnpm ghost:records`, never after. See
[Content Seeding](../CONTRIBUTING.md#content-seeding) for the full sequence.

## Commands Reference

### Theme Development

| Command          | Purpose                                |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Watch mode - rebuild assets on changes |
| `pnpm test`      | Validate theme compatibility (GScan)   |
| `pnpm validate`  | Verbose GScan validation               |
| `pnpm zip`       | Build distributable theme package      |
| `pnpm lint`      | Check JavaScript code quality          |
| `pnpm lint:fix`  | Auto-fix ESLint issues                 |
| `pnpm lint:md`   | Check Markdown against markdownlint    |

### Ghost Operations

| Command             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `pnpm ghost:seed`   | Sync pages from production (requires `.env`)       |
| `pnpm ghost:records`| Seed one demo record per collection                |
| `pnpm ghost:refresh`| Reload `routes.yaml` without restarting Ghost      |
| `pnpm ghost:verify` | Check that every collection permalink resolves     |

All three `ghost:*` container commands go through `scripts/ghost-exec.sh`, which
locates `ghost-dev` by its Compose service label rather than by container name.

> **There is no restart command.** `pnpm ghost:restart` exits with an error on
> purpose: restarting Ghost from inside the devcontainer hangs the terminal. Use
> `pnpm ghost:refresh` for routing changes, or restart from the **host**:
>
> ```bash
> docker compose restart ghost-dev
> ```

### Viewing Logs

There is no `pnpm` wrapper for logs. From the **host** terminal:

```bash
docker compose logs -f ghost-dev
```

The auto-setup script writes to
`/var/lib/ghost/content/logs/ghost-setup.log` inside the container:

```bash
bash scripts/ghost-exec.sh cat /var/lib/ghost/content/logs/ghost-setup.log
```

## Architecture

### Containers

Two Docker containers managed by the devcontainer:

1. **`devcontainer`** - Node.js 24 with pnpm, theme build tools
2. **`ghost-dev`** - Ghost 6-alpine with SQLite, exposed on port 3001 (only
   container needed for theme development)
   - **Healthcheck**: Polls `/ghost/` every 10s to verify Ghost is responding
   - **Auto-setup**: Runs `ghost-setup.sh` on startup (creates admin + activates
     theme)

Neither container is given a fixed `container_name`, so Compose generates
`<project>-ghost-dev-1`. A fixed name is global to the Docker daemon, and a stack
started from the CLI would collide with one started by VS Code.

### Port Mapping

The devcontainer uses `network_mode: service:ghost-dev` (shares ghost-dev's
network):

- **Inside container**: Ghost at `localhost:2368` (Ghost's internal port)
- **From host browser**: Ghost at `localhost:3001` (Docker port mapping)

**Important:** Scripts inside the container use port 2368, your browser uses port
3001. Because the network namespace is shared, `localhost:3001` is *not*
reachable from inside the devcontainer.

### Volume Mounts

- **Theme files**: Workspace live-mounted to
  `/var/lib/ghost/content/themes/publicledger-headline-fork`
- **Ghost content**: Persists in Docker volumes (`ghost-dev-data`,
  `ghost-dev-images`, `ghost-dev-logs`, etc.)

Changes to theme files are immediately visible to Ghost.

### Auto-Setup

On first start, Ghost automatically:

- Creates admin account: `admin@example.com` / `RandomSecure123456789`
- Sets site title: The Public Ledger
- Activates the publicledger-headline-fork theme

The setup script logs to `/var/lib/ghost/content/logs/ghost-setup.log`. VS Code
waits for setup completion (marker file: `.ghost-setup-complete` in workspace
root) before showing the terminal prompt.

`postCreateCommand` runs only on container **create**, and VS Code writes its own
marker at creation time, so a partial run never retries. Re-run it by hand:

```bash
bash .devcontainer/post-create.sh
```

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

Then rebuild devcontainer in VS Code (Command Palette → "Dev Containers: Rebuild
Container").

### Docker Cleanup

If Docker accumulates cruft (old containers, images, build cache), clean it
periodically:

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

**Symptom:** <http://localhost:3001/ghost/> not loading

**Solutions:**

- Wait 30-60 seconds after container starts (Ghost initialization)
- Check VS Code port forwarding is active (Ports tab)
- Use host browser (not inside container terminal)
- Ensure URL includes `/ghost/` path and port 3001 (not 2368)

If Ghost isn't responding, check its logs from the host:

```bash
docker compose logs -f ghost-dev
docker compose restart ghost-dev
```

### Theme not appearing

**Symptom:** "publicledger-headline-fork" theme missing in Settings → Design

**Solutions:**

- Verify theme is built: `pnpm install && pnpm zip`
- Check mount:
  `ls -la /var/lib/ghost/content/themes/publicledger-headline-fork/package.json`
- Restart Ghost: rebuild devcontainer

### Theme changes not reflecting

**Symptom:** Updated templates/CSS/JS not showing

**Solutions:**

- Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Restart watch mode: `pnpm dev`
- Clear Ghost cache: rebuild devcontainer
- Check `assets/built/` has recent timestamps
- Check browser console for JavaScript errors

### Routes changed but URLs 404

**Symptom:** A collection added to `routes.yaml` returns 404

Ghost only reads `routes.yaml` at boot or on upload. Reload it without a restart:

```bash
pnpm ghost:refresh
pnpm ghost:verify
```

### Auto-setup timed out

**Symptom:** "Ghost admin account setup timed out" message on container start

**This is normal.** Ghost may still be initializing. Wait 1-2 minutes, then re-run
the create hook:

```bash
bash .devcontainer/post-create.sh
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

**From host terminal:**

```bash
docker compose logs -f ghost-dev
```

**From VS Code Docker extension:**

1. Open Docker extension (left sidebar)
2. Find the `ghost-dev` container
3. Right-click → "View Logs"

### Extensions reinstalling on rebuild

**This is normal.** Extensions install inside the container (not on host). On
rebuild:

1. Container recreates from scratch
2. Extensions reinstall (~30-60 seconds)
3. VS Code caches to speed this up

Tip: Remove unused extensions from `.devcontainer/devcontainer.json` to speed up
rebuilds.

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
pnpm test    # Validate theme
pnpm zip     # Build dist/publicledger-headline-fork.zip
# Upload to Ghost Admin → Settings → Design
```

## Resources

- [Ghost Theme Documentation](https://ghost.org/docs/themes/)
- [Handlebars Templates](https://ghost.org/docs/themes/structure/)
- [GScan Validation](https://gscan.ghost.org/)
- [Dev Containers Docs](https://containers.dev/)
