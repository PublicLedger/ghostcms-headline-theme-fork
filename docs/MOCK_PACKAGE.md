# Mock NPM Package Structure

## Overview

The theme will use `@publicledger/data` (separate NPM package) for **entity data** to generate static routes quarterly. Currently uses mock package at `test/mocks/publicledger-data/` to simulate the workflow.

## Purpose: Quarterly Route Generation

**Not runtime data loading** - This package provides entities for **build-time route generation**.

**Workflow:**

```bash
pnpm build:routes  # Read entities from @publicledger/data → generate routes.yaml
pnpm gulp build    # Build theme assets
pnpm zip           # Package theme with explicit routes
```

**Result:** 500+ explicit static routes like:

```yaml
/jobs/lancaster-county/sheriff/: ...
/jobs/york-county/sheriff/: ...
/elections/lancaster-county/sheriff/2024/: ...
```

## Directory Structure

```text
test/mocks/publicledger-data/
├── package.json          # Mock package manifest
├── index.js              # API exports (dataPath)
├── README.md             # Package documentation
└── data/
    ├── meta.json         # Version metadata
    └── entities/
        ├── offices.json  # Office/seat entities (route generation)
        └── donors.json   # Donor entities (route generation)
```

**Focus:** `entities/*.json` files drive route generation.

## How It Works

### Route Generation (Build Time)

```javascript
// scripts/build-routes.js reads entities
const { dataPath } = require('@publicledger/data');
const offices = require(`${dataPath}/entities/offices.json`);

// Generates routes.yaml with explicit entries per entity
offices.offices.forEach(office => {
  office.seats.forEach(seat => {
    // Create route: /jobs/{agency}/{seat}/
  });
});
```

### Development Flow

```bash
pnpm build:routes  # Generate routes.yaml from mock entities
pnpm gulp build    # Build assets  
pnpm zip           # Package theme
```

## Migration to Separate Repo

### 1. Install Real Package

```bash
pnpm add @publicledger/data
```

### 2. No Code Changes Needed

```javascript
// scripts/build-routes.js already uses package abstraction
const { dataPath } = require('@publicledger/data');
// Works with both mock (test/mocks/...) and real (node_modules/@publicledger/data)
```

### 3. Remove Mock Package

```bash
rm -rf test/mocks/publicledger-data
```

### 4. Quarterly Workflow

```bash
# Update data package (new entities)
pnpm update @publicledger/data

# Regenerate routes
pnpm build:routes

# Build and deploy theme
pnpm gulp build && pnpm zip
```

## Mock Data Contents

Current mock entities for route generation:

**entities/offices.json:**

- 4 counties: Lancaster, York, Berks, Lebanon
- 5 seats per county: Sheriff, District Attorney, County Commissioner, Treasurer, Coroner
- **Generates:** ~20 `/jobs/{county}/{seat}/` routes

## Key Concepts

### Entities vs Routes vs Pages

**Entities** (in @publicledger/data):

- `entities/offices.json` - County/seat combinations
- Source data for route generation
- Updated quarterly or when new entities added

**Routes** (generated in routes.yaml):

- Explicit static routes created from entities
- `/jobs/lancaster-county/sheriff/` - one route per entity
- Regenerated quarterly when entities change

**Pages** (in Ghost CMS):

- Optional editorial fragments: `job-agency-seat-lancaster-county-sheriff`
- Managed by editors, updated anytime
- No theme rebuild needed for Page edits

### Static App Behavior

Routes are **explicit and complete** at build time:

- No dynamic `{agency}` pattern matching in production
- All URLs known upfront (like a baked static site)
- Optional CMS fragments add editorial flexibility
- Performance: static routing + optional content injection

### Quarterly Rebuild

**When entities change:**

1. Update @publicledger/data (new county, seat, etc.)
1. Run `pnpm build:routes` (regenerate routes.yaml)
1. Deploy theme to Ghost
1. New routes immediately available

**Between rebuilds:**

- Editorial team updates Page fragments anytime
- No theme deployment needed
- Content changes instant (1-5 sec cache invalidation)

## CI/CD Updates

When real package exists:

1. Update GitHub Actions to `pnpm install` (will fetch real package)
1. Build process will prefer real package over mock
1. Remove mock package from repo

## File Locations

| Phase                       | Data Source                              | Built Output             | Theme Package |
|-----------------------------|------------------------------------------|--------------------------|---------------|
| **Development**             | `test/mocks/publicledger-data/data/`     | `assets/built/data/`     | ✅ Included   |
| **Production (future)**     | `node_modules/@publicledger/data/data/`  | `assets/built/data/`     | ✅ Included   |

**Key Point:** The theme package **always** includes compiled data in `assets/built/data/`, regardless of source. Only the *source* location changes between development and production.
