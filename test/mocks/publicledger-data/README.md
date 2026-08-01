# @publicledger/data (Mock Package)

**Status:** This is a mock development package. The real package will be
published separately.

## Purpose

This mock package simulates the structure and data that will be provided by the
production `@publicledger/data` NPM package. It contains normalized JSON data for
Lancaster County elections and campaign finance records (2016-2023).

## Structure

```text
data/
  meta.json                         # Version metadata, cache key, counts
  entities/
    candidates.json                 # All candidates
    offices.json                    # All elected positions
    donors.json                     # Individuals, organizations, relationships
  elections/
    by-year/
      2023.json                     # All 2023 races
    by-office/                      # Historical races per office (empty in mock)
  finance/
    aggregates.json                 # Summary stats, top donors, trends
    campaigns/
      camp-*.json                   # Individual campaign finance files
    donors/                         # Individual donor profiles (empty in mock)
  indexes/
    candidates-by-name.json         # A-Z index
```

## Development Usage

The theme reads this package straight from the working tree - there is no
install or link step. Two consumers resolve the `data/` directory by path:

- `gulpfile.js` copies it into the build and watches it for changes
- `scripts/cards/data.js` reads it when seeding card HTML into Ghost posts

```bash
# Build theme and watch mock data for changes
pnpm dev

# Package theme for production
pnpm zip
```

## Migration to Production Package

When the real `@publicledger/data` package is published:

1. Add dependency to theme's `package.json`:

   ```json
   "dependencies": {
     "@publicledger/data": "^1.0.0"
   }
   ```

2. Remove the hardcoded mock paths in `gulpfile.js` and `scripts/cards/data.js`

3. Resolve the installed package instead:

   ```javascript
   const plData = require("@publicledger/data");
   const dataSource = plData.dataPath;
   ```

## Data Schema

The shape of each file is documented by the loaders in `index.js`. There is no
separate schema document in this repository.

## Mock Data Contents

- **10 candidates** across four office levels and parties (DEM, REP, DEM/REP)
- **5 offices** (county, city, school district, state)
- **1 election year** (2023) with 3 races
- **11 donors** (7 individuals, 4 organizations) plus 1 donor relationship
- **2 complete campaigns** with contributions and expenditures
- Realistic finance totals, categories, and relationships

> **Known gap:** The `by-office/` and `finance/donors/` directories are empty
> placeholders in the mock.
