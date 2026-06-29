# Ghost Theme Devcontainer - Quick Reference

## 🚀 Getting Started
```bash
1. Open folder in VS Code
2. Click "Reopen in Container"
3. Wait ~1-2 minutes
4. Visit http://localhost:3001/ghost
5. npm run dev
```

## 🔗 Important URLs
- **Ghost Frontend**: http://localhost:3001
- **Ghost Admin**: http://localhost:3001/ghost
- **Production Mode**: http://localhost:2368 (if started)

## 📝 Common Commands

### Development
```bash
npm run dev              # Watch & compile assets
npm run test             # Validate theme (GScan)
npm run validate         # Verbose validation
npm run zip              # Build production zip
```

### Ghost Management
```bash
npm run ghost:dev        # Show dev URL
npm run ghost:logs       # View logs
npm run ghost:restart    # Restart Ghost
npm run ghost:stop       # Stop all containers
npm run ghost:prod       # Start production mode
```

### Docker Commands
```bash
docker compose ps                    # View running containers
docker compose logs -f ghost-dev     # Follow logs
docker compose restart ghost-dev     # Restart Ghost
docker compose down                  # Stop all
docker compose down -v               # Stop + delete data
```

## 📁 Key Files

### Devcontainer Config
- `.devcontainer/devcontainer.json` - VS Code config
- `.devcontainer/docker-compose.yml` - Container orchestration

### Theme Files
- `*.hbs` - Handlebars templates
- `assets/css/screen.css` - Main stylesheet (compile target)
- `assets/js/main.js` - Main JavaScript
- `package.json` - Theme metadata & scripts
- `routes.yaml` - Custom routing

### Documentation
- `DEVCONTAINER.md` - Full setup guide
- `README.md` - Project overview
- `.devcontainer/SETUP_SUMMARY.md` - What was built

## 🔧 Theme Activation

1. Go to http://localhost:3001/ghost
2. Settings → Design
3. Click "Change theme"
4. Select "headline"
5. Click "Activate"

## 🐛 Troubleshooting

### Container won't start
```bash
docker compose down
docker compose up -d
docker compose logs ghost-dev
```

### Theme not appearing
```bash
docker compose exec ghost-dev ls -la /var/lib/ghost/content/themes/
npm run ghost:restart
```

### Port already in use
Edit `.devcontainer/docker-compose.yml`:
```yaml
ports:
  - "3002:2368"  # Change 3001 to 3002
```

### Reset everything
```bash
docker compose down -v  # ⚠️ Deletes all Ghost data
```

## 📚 Resources

- [Full Documentation](DEVCONTAINER.md)
- [Ghost Docs](https://ghost.org/docs/themes/)
- [GScan Validator](https://gscan.ghost.org/)
- [Handlebars Guide](https://ghost.org/docs/themes/helpers/)

## 💡 Tips

- **Auto-reload**: Template changes are instant
- **CSS/JS**: Requires `npm run dev` to compile
- **New files**: Restart Ghost to detect new template files
- **Validation**: Run `npm run test` before deploying
- **Production**: Use `npm run ghost:prod` to test with MySQL

## 🎯 Development Workflow

1. Edit `.hbs`, `.css`, or `.js` files
2. If editing CSS/JS, ensure `npm run dev` is running
3. Templates auto-reload; assets rebuild automatically
4. Check http://localhost:3001 to see changes
5. Before deploy: `npm run test && npm run zip`

## 📦 Deployment

```bash
# Validate
npm run test

# Build
npm run zip

# Upload dist/headline.zip to your Ghost site
# via Ghost Admin → Settings → Design → Upload theme
```

---

**Need help?** See [DEVCONTAINER.md](DEVCONTAINER.md) for detailed documentation.
