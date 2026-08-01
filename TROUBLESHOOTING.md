# Troubleshooting

This guide covers common issues for the Headline Ghost theme fork and
devcontainer development environment.

> **Where commands run.** The devcontainer shares ghost-dev's network namespace,
> so `docker compose` is a **host** command and `localhost:3001` only resolves
> from your host browser. Inside the devcontainer, Ghost is on `localhost:2368`.

## General Browser & Ghost Issues

### Browser & Cache Issues

**Symptoms:** Theme changes not appearing, old styles showing, Ghost admin
behaving inconsistently, layout looks broken

**Solutions:**

- Hard refresh the page: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache completely (Settings → Privacy → Clear browsing data)
- Test in incognito/private window to rule out cached assets
- Try a different browser (Chrome, Firefox, Safari) to isolate browser-specific
  issues
- Disable browser extensions temporarily (ad blockers, privacy tools can
  interfere with Ghost admin)

### Using Browser Developer Tools

If you're seeing unexpected behavior, the browser console often reveals template
or asset errors:

**How to access:**

1. Press `F12` or right-click on page → "Inspect" or "Inspect Element"
2. Click the **Console** tab

**What to look for:**

- **Red text** = JavaScript errors (theme JS issues, Ghost API errors)
- **Yellow/orange text** = Warnings (may or may not need fixing)
- **Network tab** shows if assets are loading (CSS, JS, fonts, images)
- **404 errors** indicate missing files (broken asset paths, missing images)

**When reporting issues:**

- Take a screenshot of any red errors
- Copy the full error text (right-click error → Copy)
- Note which Ghost route you're on (homepage, post, tag, author)
- Share browser name and version
- Note if issue appears in Ghost admin or frontend

### Ghost Admin Access Issues

**Symptoms:** Can't access /ghost, login page not loading, infinite redirects,
"Site is not available" error

**Solutions:**

- Verify Ghost is running: `docker compose ps` (should show ghost-dev as "Up")
- Check Ghost logs: `docker compose logs ghost-dev` (look for startup errors)
- Restart Ghost from the host: `docker compose restart ghost-dev`
- Verify port 3001 is accessible from the host: `curl http://localhost:3001`
- Check for port conflicts: `lsof -i :3001` (make sure only Ghost is using it)
- Try accessing from host browser (not container):
  <http://localhost:3001/ghost>
- Clear browser cookies for localhost domain

### Theme Not Appearing in Ghost Admin

**Symptoms:** "publicledger-headline-fork" missing from Settings → Design →
Change theme, or theme shows but won't activate

**Solutions:**

- Verify theme is mounted:

  ```bash
  docker compose exec ghost-dev ls /var/lib/ghost/content/themes/
  ```

- Check for package.json in theme directory:

  ```bash
  docker compose exec ghost-dev \
    cat /var/lib/ghost/content/themes/publicledger-headline-fork/package.json
  ```

- Review Ghost logs for theme errors:
  `docker compose logs ghost-dev | grep -i error`
- Restart Ghost to reload themes: `docker compose restart ghost-dev`
- Validate theme structure: `pnpm test` (GScan validation)
- Check file permissions in container:

  ```bash
  docker compose exec ghost-dev \
    ls -la /var/lib/ghost/content/themes/publicledger-headline-fork/
  ```

### Template Errors

**Symptoms:** Page shows error message, blank content areas, "There was an error
rendering this page" in Ghost

**Solutions:**

- Check Ghost logs immediately: `docker compose logs ghost-dev` (errors appear
  here with template name and line number)
- Common template errors:
  - **Undefined helper**: Using `{{helper_name}}` that doesn't exist or is wrong
    Ghost version
  - **Undefined variable**: Using `{{variable}}` not in current context (e.g.,
    `{{author}}` in tag.hbs)
  - **Missing `{{#post}}` block**: a `custom-*.hbs` template gets no ambient post
    context, so `{{title}}` is empty and `{{content}}` renders the literal
    `undefined`
  - **Malformed syntax**: Missing closing `{{/if}}`, `{{/foreach}}`, or
    mismatched brackets
  - **Missing partial**: `{{> partial-name}}` file doesn't exist in partials/
- Verify template context: <https://ghost.org/docs/themes/context/>
- Test with minimal template first, then add complexity
- Check Ghost helper compatibility: <https://ghost.org/docs/themes/helpers/>

### Asset Compilation Issues

**Symptoms:** CSS changes not appearing, JavaScript errors, styles broken after
editing, pnpm dev shows errors

**Solutions:**

- Verify you're editing **source files** not built files:
  - ✅ Edit: `assets/css/*.css`, `assets/js/*.js`
  - ❌ Don't edit: `assets/built/screen.css`, `assets/built/main.min.js`
- Restart asset watcher: Stop `pnpm dev` (Ctrl+C) and restart
- Check for syntax errors in terminal output (PostCSS errors, JS parse errors)
- Clear built assets and rebuild:

  ```bash
  rm -rf assets/built/*
  pnpm dev
  ```

- Verify Gulp is watching correct files: Check gulpfile.js configuration
- Test production build: `pnpm zip` (compiles all assets fresh)

### Live Reload Not Working

**Symptoms:** Theme changes require manual browser refresh, Ghost doesn't pick up
template edits

**Solutions:**

- Verify `pnpm dev` is running (should show "Watching..." in terminal)
- Restart Ghost after major template changes:
  `docker compose restart ghost-dev`
- Check Ghost logs for theme reload messages: `docker compose logs ghost-dev`
- Force browser refresh: Hard reload (Ctrl+Shift+R / Cmd+Shift+R)
- For `.hbs` files: Ghost watches automatically, but may need restart for partials
- For CSS/JS: Must have `pnpm dev` running to compile changes

## Devcontainer-Specific Issues

### Container Won't Start

**Symptoms:** "Reopen in Container" fails, Docker errors, VS Code hangs on
container creation

**Solutions:**

- Verify Docker Desktop is running and up-to-date
- Check Docker has sufficient resources (4GB+ RAM, 20GB+ disk recommended)
- Try rebuilding without cache: Command Palette → "Dev Containers: Rebuild
  Container Without Cache"
- Check for port conflicts:

  ```bash
  lsof -i :3001  # Ghost dev port
  ```

- Review Docker logs for errors:

  ```bash
  docker compose logs
  docker compose logs ghost-dev
  ```

- Check Docker Compose file syntax: `.devcontainer/docker-compose.yml`
- Free up disk space if Docker storage is full
- Clean up Docker cruft (can fix "transport endpoint not connected" errors):

  ```bash
  docker system prune -af --volumes  # ⚠️ Deletes all unused Docker data
  ```

### Two Stacks Fighting Over ghost-dev

**Symptoms:** `Conflict. The container name "/ghost-dev" is already in use`, or
`scripts/ghost-exec.sh` refuses to guess between containers

`.devcontainer/docker-compose.yml` deliberately omits `container_name:`, because
a fixed name is global to the Docker daemon: a stack started from the CLI
(project `devcontainer`) collided with one started by VS Code (project
`<folder>_devcontainer`). Compose generates `<project>-ghost-dev-1` instead, and
`scripts/ghost-exec.sh` finds it by Compose service label.

**Solutions:**

- List what's running: `docker ps --filter label=com.docker.compose.service=ghost-dev`
- Stop the stack you are not using: `docker compose -p <project> down`

### Ghost Container Crashes on Startup

**Symptoms:** `docker compose ps` shows ghost-dev as "Exited" or "Restarting",
can't access localhost:3001

**Solutions:**

- View Ghost crash logs: `docker compose logs ghost-dev`
- Common causes:
  - **SQLite corruption**: Delete volume and restart:
    `docker compose down -v && docker compose up -d`
  - **Port already in use**: Change port in docker-compose.yml or stop
    conflicting process
  - **Memory limit**: Increase Docker memory allocation in Docker Desktop
    settings
  - **Missing environment variables**: Check docker-compose.yml environment
    section
- Start Ghost manually to see errors:

  ```bash
  docker compose up ghost-dev
  # Watch output for specific error messages
  ```

- Reset Ghost completely (⚠️ deletes all data):

  ```bash
  docker compose down -v
  docker compose up -d
  ```

### Theme Files Not Syncing to Container

**Symptoms:** Edit theme file in VS Code, changes don't appear in Ghost, file
edits don't trigger rebuild

**Solutions:**

- Verify volume mount in docker-compose.yml:

  ```yaml
  volumes:
    - ..:/var/lib/ghost/content/themes/publicledger-headline-fork:cached
  ```

- Check file exists in container:

  ```bash
  THEME=/var/lib/ghost/content/themes/publicledger-headline-fork
  docker compose exec ghost-dev ls $THEME/
  docker compose exec ghost-dev cat $THEME/index.hbs
  ```

- Restart Ghost to reload theme: `docker compose restart ghost-dev`
- Rebuild container if mount is broken: "Dev Containers: Rebuild Container"
- Check file permissions (shouldn't need sudo to edit files)

### Devcontainer Setup Only Half Ran

**Symptoms:** dependencies missing, theme not activated, `.ghost-setup-complete`
present but the environment is incomplete

`postCreateCommand` runs only on container **create**, and VS Code writes its own
marker at creation time, so a partial run never retries.

**Solution:** re-run it by hand.

```bash
bash .devcontainer/post-create.sh
```

### pnpm Commands Failing in Container

**Symptoms:** `pnpm install` errors, `pnpm dev` fails, package not found errors

**Solutions:**

- Verify Node.js 24 is installed: `node --version` (should be 24.x.x)
- Clear pnpm cache and reinstall:

  ```bash
  rm -rf node_modules
  pnpm install
  ```

  Do **not** delete `pnpm-lock.yaml` - it pins the versions shared with upstream.

- Check pnpm permissions (shouldn't need sudo inside container)
- Verify package.json is valid JSON: `node -e "require('./package.json')"`
- Check network connectivity from container: `ping github.com`

## Theme Development Issues

### GScan Validation Failures

**Symptoms:** `pnpm test` shows errors, theme upload to Ghost fails validation,
incompatibility warnings

**Solutions:**

- Review GScan output for specific errors (shown in terminal)
- Common GScan failures:
  - **Missing required templates**: Must have index.hbs, post.hbs, default.hbs
  - **Invalid Ghost helpers**: Using deprecated or Ghost 7+ helpers (we support
    Ghost 6+)
  - **Package.json errors**: Missing required fields (name, version,
    engines.ghost)
  - **Invalid routes.yaml**: Syntax errors in routing configuration
- Fix errors and retest: `pnpm test`
- Verbose validation report: `pnpm validate`
- Online validator: <https://gscan.ghost.org/> (upload
  `dist/publicledger-headline-fork.zip`)

### Theme Upload Fails

**Symptoms:** Can't upload theme zip to Ghost admin, "Invalid theme" error,
upload button doesn't work

**Solutions:**

- Build fresh production zip: `pnpm zip`
- Validate before uploading: `pnpm test` (must pass GScan)
- Check zip file size (Ghost has max upload size, usually 5-10MB)
- Verify zip contains package.json in root:

  ```bash
  unzip -l dist/publicledger-headline-fork.zip | head -20
  ```

- Check Ghost logs during upload: `docker compose logs ghost-dev`

### Handlebars Context Errors

**Symptoms:** Template shows blank content, `{{variable}}` renders empty,
conditional doesn't work as expected

**Solutions:**

- Verify you're using correct context for the route:
  - **Homepage (index.hbs)**: `posts`, `pagination`
  - **Post (post.hbs)**: `post`, `author`
  - **Tag (tag.hbs)**: `tag`, `posts`
  - **Author (author.hbs)**: `author`, `posts`
  - **Custom post template (`custom-*.hbs`)**: nothing until you open a
    `{{#post}}` block
- Check Ghost docs for context: <https://ghost.org/docs/themes/context/>
- Debug with `{{log variable}}` helper to see what's available
- Use conditionals to check existence:

  ```handlebars
  {{#if author}}
    {{author.name}}
  {{else}}
    No author available
  {{/if}}
  ```

- Check Ghost logs for specific context errors:
  `docker compose logs ghost-dev`

### Data Collection Issues

**This fork serves every data URL from a Ghost collection.** A record is a Post
whose slug is the entity, whose primary tag is the parent agency or jurisdiction,
and which carries an internal `#hash-*` tag selecting the collection. Common
issues:

#### Symptom: Data route returns 404

**`/jobs/lancaster-county/county-commissioner/` shows 404, but the template
exists.**

**Solutions:**

- Ghost only reads `routes.yaml` at boot or on upload. Reload it:

  ```bash
  pnpm ghost:refresh
  pnpm ghost:verify
  ```

- Confirm the collection is declared with a `permalink:`, not a literal path.
  Ghost's `routes:` block does **not** support path parameters - a key like
  `/jobs/{agency}/{seat}/` never matches. Verified against Ghost 6.53.

  ```yaml
  collections:
    /jobs/:
      permalink: /jobs/{primary_tag}/{slug}/
      filter: tag:hash-job
      template: job
  ```

- Check the post actually carries the internal tag (`#job`) and that its primary
  tag is the agency with `sort_order 0`
- Test the collection index first: `/jobs/` should resolve even with no records

#### Symptom: Ghost rejects routes.yaml entirely

**Every route 404s after editing `routes.yaml`.**

**Cause:** Ghost requires every post to belong to **exactly one** collection. The
`/articles/` catch-all must exclude every data collection:

```yaml
filter: tag:-hash-job+tag:-hash-election+tag:-hash-official+tag:-hash-donor+tag:-hash-lookup+tag:-hash-finance
```

Adding a collection without updating that filter leaves posts in two collections
and Ghost refuses the whole file.

**Solutions:**

- Reload and verify: `pnpm ghost:refresh && pnpm ghost:verify`. The upload step
  is what validates the file - Ghost rejects a malformed or overlapping routes
  file and says why.
- Check Ghost logs for the rejection reason: `docker compose logs ghost-dev`

#### Symptom: Post renders but title and body are empty

**A detail template outputs an empty `<h1>` and the literal text `undefined`.**

**Cause:** a custom post template gets no ambient post context.

**Solutions:**

- Wrap the body in `{{#post}}` … `{{/post}}` (see `partials/pl-record.hbs`)
- Inside `{{#post}}`, scope has shifted: a partial argument must be referenced as
  `{{../recordType}}`, because a bare `{{recordType}}` resolves against the post
  object and comes out empty

#### Symptom: Cards show stale numbers, or an error block

**A record's card shows old data, or a red `custom-card-error` message.**

**Cause:** cards are **not** live. Ghost themes are sandboxed, so a template
cannot read `@publicledger/data` at render time. Cards are rendered in Node at
seed time by `scripts/cards/*` and stored as Lexical `html` nodes in the post
body.

**Solutions:**

- Re-run the seed to refresh them: `pnpm ghost:records`
- An error block means the renderer threw - usually a slug with no matching
  record in the mock data package. The message is the thrown error.
- Do not hand-edit card HTML in Ghost Admin; the next seed overwrites it

#### Symptom: A card looks unstyled in Ghost Admin

**In the editor the card is a wall of text, but the public page looks right.**

**This is by design.** Ghost Admin injects card HTML raw with none of the theme
CSS, and runs it through DOMPurify with `FORBID_TAGS: ["style"]`. Each card
therefore ships two class sets: `.custom-card-admin` (a one-line chip styled by
Admin's own Tailwind build) and `.custom-card-body` (hidden in Admin, shown by
the theme).

**Solutions:**

- Check the public URL, not the editor, to judge a card
- After a Ghost upgrade, re-verify the Admin utility classes still exist:

  ```bash
  node scripts/check-admin-classes.js
  ```

#### Symptom: The entity picker doesn't navigate

**Choosing an option in a collection index does nothing.**

**Solutions:**

- The picker is progressive enhancement (`assets/js/cards/picker-nav.js`). With
  JS off, the form still submits and a `<noscript>` link list is available.
- Check the browser console for a JS error
- Confirm `assets/built/` is current: `pnpm dev`
- The picker options come from `partials/generated/picker-*.hbs`, which Gulp
  regenerates from the mock data package. Never edit them by hand.

### Translation Strings Not Working

**Symptoms:** `{{t "String"}}` shows raw key instead of translation, language
switching doesn't work

**Solutions:**

- Verify string exists in `locales/en.json`:

  ```bash
  grep "String" locales/en.json
  ```

- Check JSON syntax is valid:
  `node -e "require('./locales/en.json')"`
- Match key exactly (case-sensitive): `{{t "Subscribe"}}` needs
  `"Subscribe": "..."`
- For other languages, ensure translation file exists: `locales/de.json`, etc.
- Restart Ghost to reload locales: `docker compose restart ghost-dev`
- Check Ghost language setting: Admin → Settings → General → Publication language

### Custom Template Not Selectable

**Symptoms:** Custom template file exists but doesn't appear in Ghost admin page
settings

**Solutions:**

- Verify file naming: Must be `custom-*.hbs` or `page-*.hbs`
- Example: `custom-job-agency-seat.hbs` → "Job agency seat" in dropdown
- Check template is in theme root, not in subdirectory
- Restart Ghost to reload templates: `docker compose restart ghost-dev`
- Verify template has valid Handlebars syntax: `pnpm test`
- Check Ghost logs for template parsing errors:
  `docker compose logs ghost-dev`

## Fork-Specific Issues

### Package.json Identity Changed

**Symptoms:** Deployment fails, theme name shows wrong in Ghost admin, upstream
merge conflicts

**Solutions:**

- **Never change these fields** (fork identity):
  - `name`: "publicledger-headline-fork"
  - `author`: Ghost Foundation - required by the MIT license. Fork attribution
    belongs in `contributors` (Gasworks Data).
  - `engines.node`: ">=24.0.0"
  - Fork scripts: `ghost:*`, `validate:fork`, `lint*`, `format*`
- Restore from git if accidentally changed:

  ```bash
  git checkout package.json
  ```

- Check all of it at once: `pnpm validate:fork`

### Upstream Merge Conflicts

**Symptoms:** Can't merge upstream changes, git conflicts in package.json or
templates, sync fails

**Solutions:**

- Review conflict resolution guide: [sync/README.md](sync/README.md)
- Check which files have conflicts:

  ```bash
  git status
  git diff upstream/main
  ```

- Preserve fork customizations marked with `{{!-- FORK CUSTOM: ... --}}`
- For package.json conflicts, always keep fork name/engines.node and the
  Ghost Foundation author
- Test after resolving: `pnpm test && pnpm validate:fork && pnpm zip`

### Custom Locales Overwritten

**Symptoms:** "Access site" changed back to "Access code", custom strings lost
after upstream sync

**Solutions:**

- **Never change custom strings in locales/en.json**:
  - "Access site" (not "Access code") - intentional fork customization
  - "Password" - custom fork string
- Check current values: `grep "Access site\|Password" locales/en.json`
- Restore from git if accidentally changed:

  ```bash
  git checkout locales/en.json
  ```

- Mark in sync/README.md before syncing

### Devcontainer Config Changed

**Symptoms:** Container won't build after merge, Ghost won't start, ports
changed, volume mounts broken

**Solutions:**

- **Never merge .devcontainer/ from upstream** (fork-only directory)
- If accidentally merged, restore fork version:

  ```bash
  git checkout .devcontainer/
  ```

- Rebuild container after fixing: "Dev Containers: Rebuild Container"
- Verify docker-compose.yml is intact:

  ```bash
  cat .devcontainer/docker-compose.yml
  ```

### Upstream-Owned Docs Were Reformatted

**Symptoms:** `README.md`, `AGENTS.md` or `CLAUDE.md` show large diffs against
upstream, or a sync conflicts across the whole file

These three are the only Markdown files that also exist in `upstream/main`. Only
the fork note at the top of `README.md` is ours to edit. They are excluded from
`pnpm lint:md` in `.markdownlint-cli2.jsonc` for exactly this reason.

**Solutions:**

- See what diverged: `git diff upstream/main -- README.md AGENTS.md CLAUDE.md`
- Restore upstream content: `git checkout upstream/main -- README.md`, then
  re-add the fork note

## When to Escalate to Developer

Contact a developer if you see any of these symptoms:

- **Ghost crash loop**: Container repeatedly crashes and restarts
- **Database corruption**: SQLite errors, data loss, can't access content
- **Docker socket errors**: Permission denied errors, can't connect to Docker
- **Build system failures**: Gulp crashes, PostCSS errors that persist after
  reinstall
- **Upstream merge disasters**: Conflicts in 10+ files, can't resolve without
  losing work
- **Production deployment failures**: GitHub Actions workflow fails, theme won't
  deploy
- **Ghost API errors**: 500 errors in Ghost admin, API authentication failures
- **Volume mount failures**: Can't write to theme directory, permission errors in
  container
- **Network issues in container**: Can't reach npm registry, Docker networking
  broken

## Debugging Tips

### Enable Ghost Debug Mode

Add to ghost-dev environment in docker-compose.yml:

```yaml
environment:
  DEBUG: "ghost:*"
```

Restart Ghost from the host: `docker compose restart ghost-dev`

### Check Theme Structure

```bash
# List all theme files
tree -L 3

# Verify required templates exist
ls -la *.hbs

# Check partials
ls -la partials/

# Verify built assets
ls -la assets/built/
```

### Validate Config Files

```bash
# Check JSON syntax (node is always present; jq may not be)
node -e "require('./package.json')" && echo 'package.json ok'
node -e "require('./locales/en.json')" && echo 'locales/en.json ok'

# Check routes.yaml — Ghost validates it on upload and reports the reason
pnpm ghost:refresh
```

### Test Ghost API

From the **host** (port 3001):

```bash
curl http://localhost:3001
curl http://localhost:3001/ghost/api/admin/site/
```

From **inside the devcontainer** (port 2368 - 3001 is not reachable there):

```bash
curl http://localhost:2368/
pnpm ghost:verify   # checks every collection permalink at once
```

### Inspect What Actually Seeded

`updated_at` is **not** evidence a seed ran - Ghost does not bump it for a no-op
edit. Query the revision history instead:

```bash
bash scripts/ghost-exec.sh sqlite3 \
  /var/lib/ghost/content/data/ghost-dev.db \
  "SELECT post_id, created_at FROM post_revisions ORDER BY created_at DESC LIMIT 5;"
```

## Additional Resources

- **Devcontainer Guide**: [DEVCONTAINER.md](DEVCONTAINER.md)
- **Devcontainer Operations**: [.devcontainer/README.md](.devcontainer/README.md)
- **Upstream Sync**: [sync/README.md](sync/README.md)
- **Agent Guidelines**: [AI_DEVELOPMENT.md](AI_DEVELOPMENT.md)
- **Common Mistakes**: [AGENT_LESSONS.md](AGENT_LESSONS.md)
- **Ghost Theme Docs**: <https://ghost.org/docs/themes/>
- **GScan Validator**: <https://gscan.ghost.org/>
- **Ghost Forum**: <https://forum.ghost.org/>
