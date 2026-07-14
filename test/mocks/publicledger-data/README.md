# @publicledger/data (Mock Package)

**Status:** This is a mock development package. The real package will be published separately.

## Purpose

This mock package simulates the structure and data that will be provided by the production `@publicledger/data` NPM package. It contains normalized JSON data for Lancaster County elections and campaign finance records (2016-2023).

## Structure

```
data/
  meta.json                        # Version metadata, cache key, counts
  entities/
    candidates.json                 # All candidates
    offices.json                    # All elected positions
    donors.json                     # All donors (individuals + orgs)
  elections/
    by-year/
      2023.json                     # All 2023 races
    by-office/
      *.json                        # Historical races per office
  finance/
    aggregates.json                 # Summary stats, top donors, trends
    campaigns/
      camp-*.json                   # Individual campaign finance files
    donors/
      donor-*.json                  # Individual donor profiles
  indexes/
    candidates-by-name.json         # A-Z index
    candidates-by-office.json       # Office → candidates map
```

## Development Usage

This mock package is automatically linked during theme development via the build scripts.

```bash
# Build theme (automatically uses mock data)
pnpm gulp build

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

2. Remove mock package setup from build scripts

3. Update `gulpfile.js` to use installed package:
   ```javascript
   const plData = require('@publicledger/data');
   const dataSource = plData.dataPath;
   ```

## Data Schema

See `/workspace/docs-local/DATA_SCHEMA.md` for complete schema documentation.

## Mock Data Contents

- **10 candidates** across various offices and parties
- **5 offices** (county, city, school district, state)
- **2 election years** (2023, 2020, 2019, 2018)
- **9 donors** (5 individuals, 4 organizations)
- **2 complete campaigns** with contributions and expenditures
- Realistic finance totals, categories, and relationships
