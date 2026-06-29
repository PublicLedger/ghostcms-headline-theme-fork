# Troubleshooting

This guide covers common issues for the Headline Ghost theme fork and devcontainer development environment.

## General Browser & Ghost Issues

### Browser & Cache Issues

**Symptoms:** Theme changes not appearing, old styles showing, Ghost admin behaving inconsistently, layout looks broken

**Solutions:**

- Hard refresh the page: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache completely (Settings → Privacy → Clear browsing data)
- Test in incognito/private window to rule out cached assets
- Try a different browser (Chrome, Firefox, Safari) to isolate browser-specific issues
- Disable browser extensions temporarily (ad blockers, privacy tools can interfere with Ghost admin)

### Using Browser Developer Tools

If you're seeing unexpected behavior, the browser console often reveals template or asset errors:

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

**Symptoms:** Can't access /ghost, login page not loading, infinite redirects, "Site is not available" error

**Solutions:**

- Verify Ghost is running: `docker compose ps` (should show ghost-dev as "Up")
- Check Ghost logs: `npm run ghost:logs` (look for startup errors or crashes)
- Restart Ghost: `npm run ghost:restart`
- Verify port 3001 is accessible: `curl http://localhost:3001`
- Check for port conflicts: `lsof -i :3001` (make sure only Ghost is using it)
- Try accessing from host browser (not container): http://localhost:3001/ghost
- Clear browser cookies for localhost domain

### Theme Not Appearing in Ghost Admin

**Symptoms:** "headline" theme missing from Settings → Design → Change theme, or theme shows but won't activate

**Solutions:**

- Verify theme is mounted: `docker compose exec ghost-dev ls /var/lib/ghost/content/themes/`
- Check for package.json in theme directory: `docker compose exec ghost-dev cat /var/lib/ghost/content/themes/headline/package.json`
- Review Ghost logs for theme errors: `npm run ghost:logs | grep -i error`
- Restart Ghost to reload themes: `npm run ghost:restart`
- Validate theme structure: `npm run test` (GScan validation)
- Check file permissions in container: `docker compose exec ghost-dev ls -la /var/lib/ghost/content/themes/headline/`

### Template Errors

**Symptoms:** Page shows error message, blank content areas, "There was an error rendering this page" in Ghost

**Solutions:**

- Check Ghost logs immediately: `npm run ghost:logs` (errors appear here with template name and line number)
- Common template errors:
  - **Undefined helper**: Using `{{helper_name}}` that doesn't exist or is wrong Ghost version
  - **Undefined variable**: Using `{{variable}}` not in current context (e.g., `{{author}}` in tag.hbs)
  - **Malformed syntax**: Missing closing `{{/if}}`, `{{/foreach}}`, or mismatched brackets
  - **Missing partial**: `{{> partial-name}}` file doesn't exist in partials/
- Verify template context: https://ghost.org/docs/themes/context/
- Test with minimal template first, then add complexity
- Check Ghost helper compatibility: https://ghost.org/docs/themes/helpers/

### Asset Compilation Issues

**Symptoms:** CSS changes not appearing, JavaScript errors, styles broken after editing, npm run dev shows errors

**Solutions:**

- Verify you're editing **source files** not built files:
  - ✅ Edit: `assets/css/*.css`, `assets/js/*.js`
  - ❌ Don't edit: `assets/built/screen.css`, `assets/built/main.min.js`
- Restart asset watcher: Stop `npm run dev` (Ctrl+C) and restart
- Check for syntax errors in terminal output (PostCSS errors, JS parse errors)
- Clear built assets and rebuild:
  ```bash
  rm -rf assets/built/*
  npm run dev
  ```
- Verify Gulp is watching correct files: Check gulpfile.js configuration
- Test production build: `npm run zip` (compiles all assets fresh)

### Live Reload Not Working

**Symptoms:** Theme changes require manual browser refresh, Ghost doesn't pick up template edits

**Solutions:**

- Verify `npm run dev` is running (should show "Watching..." in terminal)
- Restart Ghost after major template changes: `npm run ghost:restart`
- Check Ghost logs for theme reload messages: `npm run ghost:logs`
- Force browser refresh: Hard reload (Ctrl+Shift+R / Cmd+Shift+R)
- For `.hbs` files: Ghost watches automatically, but may need restart for partials
- For CSS/JS: Must have `npm run dev` running to compile changes

## Devcontainer-Specific Issues

### Container Won't Start

**Symptoms:** "Reopen in Container" fails, Docker errors, VS Code hangs on container creation

**Solutions:**

- Verify Docker Desktop is running and up-to-date
- Check Docker has sufficient resources (4GB+ RAM, 20GB+ disk recommended)
- Try rebuilding without cache: Command Palette → "Dev Containers: Rebuild Container Without Cache"
- Check for port conflicts:
  ```bash
  lsof -i :3001  # Ghost dev port
  lsof -i :2368  # Ghost prod port
  lsof -i :3306  # MySQL port
  ```
- Review Docker logs for errors:
  ```bash
  docker compose logs
  docker compose logs ghost-dev
  ```
- Check Docker Compose file syntax: `.devcontainer/docker-compose.yml`
- Free up disk space if Docker storage is full

### Ghost Container Crashes on Startup

**Symptoms:** `docker compose ps` shows ghost-dev as "Exited" or "Restarting", can't access localhost:3001

**Solutions:**

- View Ghost crash logs: `npm run ghost:logs` or `docker compose logs ghost-dev`
- Common causes:
  - **SQLite corruption**: Delete volume and restart: `docker compose down -v && docker compose up -d`
  - **Port already in use**: Change port in docker-compose.yml or stop conflicting process
  - **Memory limit**: Increase Docker memory allocation in Docker Desktop settings
  - **Missing environment variables**: Check docker-compose.yml environment section
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

**Symptoms:** Edit theme file in VS Code, changes don't appear in Ghost, file edits don't trigger rebuild

**Solutions:**

- Verify volume mount in docker-compose.yml:
  ```yaml
  volumes:
    - ../:/var/lib/ghost/content/themes/headline
  ```
- Check file exists in container:
  ```bash
  docker compose exec ghost-dev ls /var/lib/ghost/content/themes/headline/
  docker compose exec ghost-dev cat /var/lib/ghost/content/themes/headline/index.hbs
  ```
- Restart Ghost to reload theme: `npm run ghost:restart`
- Rebuild container if mount is broken: "Dev Containers: Rebuild Container"
- Check file permissions (shouldn't need sudo to edit files)

### npm Commands Failing in Container

**Symptoms:** `npm install` errors, `npm run dev` fails, package not found errors

**Solutions:**

- Verify Node.js 24 is installed: `node --version` (should be 24.x.x)
- Clear npm cache and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- Check npm permissions (shouldn't need sudo inside container)
- Verify package.json is valid JSON: `cat package.json | jq .`
- Update npm itself: `npm install -g npm@latest`
- Check network connectivity from container: `ping github.com`

### Production Ghost (MySQL) Won't Start

**Symptoms:** `npm run ghost:prod` fails, ghost-prod container exits, port 2368 not accessible

**Solutions:**

- Verify MySQL container is running: `docker compose ps db`
- Check MySQL logs: `docker compose logs db`
- Verify database credentials in docker-compose.yml match Ghost config
- Wait for MySQL to finish initializing (first start takes ~30 seconds)
- Check port 2368 is available: `lsof -i :2368`
- View ghost-prod logs: `docker compose logs ghost-prod`
- Reset production environment (⚠️ deletes production data):
  ```bash
  npm run ghost:stop
  docker compose down -v
  npm run ghost:prod
  ```

## Theme Development Issues

### GScan Validation Failures

**Symptoms:** `npm run test` shows errors, theme upload to Ghost fails validation, incompatibility warnings

**Solutions:**

- Review GScan output for specific errors (shown in terminal)
- Common GScan failures:
  - **Missing required templates**: Must have index.hbs, post.hbs, default.hbs
  - **Invalid Ghost helpers**: Using deprecated or Ghost 7+ helpers (we support Ghost 6+)
  - **Package.json errors**: Missing required fields (name, version, engines.ghost)
  - **Invalid routes.yaml**: Syntax errors in routing configuration
- Fix errors and retest: `npm run test`
- Verbose validation report: `npm run validate`
- Online validator: https://gscan.ghost.org/ (upload dist/headline.zip)

### Theme Upload Fails

**Symptoms:** Can't upload theme zip to Ghost admin, "Invalid theme" error, upload button doesn't work

**Solutions:**

- Build fresh production zip: `npm run zip`
- Validate before uploading: `npm run test` (must pass GScan)
- Check zip file size (Ghost has max upload size, usually 5-10MB)
- Verify zip contains package.json in root: `unzip -l dist/headline.zip | head -20`
- Try uploading via Ghost CLI instead:
  ```bash
  ghost-cli theme install dist/headline.zip
  ```
- Check Ghost logs during upload: `npm run ghost:logs`

### Handlebars Context Errors

**Symptoms:** Template shows blank content, `{{variable}}` renders empty, conditional doesn't work as expected

**Solutions:**

- Verify you're using correct context for the route:
  - **Homepage (index.hbs)**: `posts`, `pagination`
  - **Post (post.hbs)**: `post`, `author`
  - **Tag (tag.hbs)**: `tag`, `posts`
  - **Author (author.hbs)**: `author`, `posts`
- Check Ghost docs for context: https://ghost.org/docs/themes/context/
- Debug with `{{log variable}}` helper to see what's available
- Use conditionals to check existence:
  ```handlebars
  {{#if author}}
    {{author.name}}
  {{else}}
    No author available
  {{/if}}
  ```
- Check Ghost logs for specific context errors: `npm run ghost:logs`

### Translation Strings Not Working

**Symptoms:** `{{t "String"}}` shows raw key instead of translation, language switching doesn't work

**Solutions:**

- Verify string exists in `locales/en.json`:
  ```bash
  grep "String" locales/en.json
  ```
- Check JSON syntax is valid: `cat locales/en.json | jq .`
- Match key exactly (case-sensitive): `{{t "Subscribe"}}` needs `"Subscribe": "..."`
- For other languages, ensure translation file exists: `locales/de.json`, etc.
- Restart Ghost to reload locales: `npm run ghost:restart`
- Check Ghost language setting: Admin → Settings → General → Publication language

### Custom Template Not Selectable

**Symptoms:** Custom template file exists but doesn't appear in Ghost admin page settings

**Solutions:**

- Verify file naming: Must be `custom-*.hbs` or `page-*.hbs`
- Example: `custom-wide-feature-image.hbs` → "Wide feature image" in dropdown
- Check template is in theme root, not in subdirectory
- Restart Ghost to reload templates: `npm run ghost:restart`
- Verify template has valid Handlebars syntax: `npm run test`
- Check Ghost logs for template parsing errors: `npm run ghost:logs`

## Fork-Specific Issues

### Package.json Identity Changed

**Symptoms:** Deployment fails, theme name shows wrong in Ghost admin, upstream merge conflicts

**Solutions:**

- **Never change these fields** (fork identity):
  - `name`: "publicledger-headline-fork"
  - `author`: Gasworks Data
  - `engines.node`: ">=24.0.0"
  - Ghost scripts: `ghost:dev`, `ghost:logs`, `ghost:restart`, etc.
- Restore from git if accidentally changed:
  ```bash
  git checkout package.json
  ```
- Review AI_DEVELOPMENT.md for protected fields: `cat AI_DEVELOPMENT.md | grep -A10 "Never change"`

### Upstream Merge Conflicts

**Symptoms:** Can't merge upstream changes, git conflicts in package.json or templates, sync fails

**Solutions:**

- Review conflict resolution guide: [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md)
- Follow step-by-step checklist: [UPSTREAM_SYNC_CHECKLIST.md](UPSTREAM_SYNC_CHECKLIST.md)
- Check which files have conflicts:
  ```bash
  git status
  git diff upstream/main
  ```
- Preserve fork customizations marked with `{{!-- FORK CUSTOM: ... --}}`
- For package.json conflicts, always keep fork name/author/engines.node
- Test after resolving: `npm run test && npm run zip`

### Custom Locales Overwritten

**Symptoms:** "Access site" changed back to "Access code", custom strings lost after upstream sync

**Solutions:**

- **Never change custom strings in locales/en.json**:
  - "Access site" (not "Access code") - intentional fork customization
  - "Password" - custom fork string
- Check current values: `grep "Access site\|Password" locales/en.json`
- Restore from git if accidentally changed:
  ```bash
  git checkout locales/en.json
  ```
- Mark in UPSTREAM_SYNC_PLAN.md before syncing

### Devcontainer Config Changed

**Symptoms:** Container won't build after merge, Ghost won't start, ports changed, volume mounts broken

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

## When to Escalate to Developer

Contact a developer if you see any of these symptoms:

- **Ghost crash loop**: Container repeatedly crashes and restarts
- **Database corruption**: SQLite errors, data loss, can't access content
- **Docker socket errors**: Permission denied errors, can't connect to Docker
- **Build system failures**: Gulp crashes, PostCSS errors that persist after reinstall
- **Upstream merge disasters**: Conflicts in 10+ files, can't resolve without losing work
- **Production deployment failures**: GitHub Actions workflow fails, theme won't deploy
- **Ghost API errors**: 500 errors in Ghost admin, API authentication failures
- **Volume mount failures**: Can't write to theme directory, permission errors in container
- **Network issues in container**: Can't reach npm registry, Docker networking broken

## Debugging Tips

### Enable Ghost Debug Mode

Add to ghost-dev environment in docker-compose.yml:

```yaml
environment:
  DEBUG: "ghost:*"
```

Restart Ghost: `npm run ghost:restart`

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

### Validate JSON Files

```bash
# Check package.json syntax
cat package.json | jq .

# Check routes.yaml syntax
cat routes.yaml

# Check locale files
cat locales/en.json | jq .
```

### Test Ghost API

```bash
# Check Ghost is responding
curl http://localhost:3001

# Check admin API
curl http://localhost:3001/ghost/api/admin/site/

# Check content API
curl http://localhost:3001/ghost/api/content/posts/
```

## Additional Resources

- **Devcontainer Guide**: [DEVCONTAINER.md](DEVCONTAINER.md)
- **Quick Reference**: [.devcontainer/QUICKREF.md](.devcontainer/QUICKREF.md)
- **Upstream Sync**: [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md)
- **Agent Guidelines**: [AI_DEVELOPMENT.md](AI_DEVELOPMENT.md)
- **Common Mistakes**: [AGENT_LESSONS.md](AGENT_LESSONS.md)
- **Ghost Theme Docs**: https://ghost.org/docs/themes/
- **GScan Validator**: https://gscan.ghost.org/
- **Ghost Forum**: https://forum.ghost.org/
