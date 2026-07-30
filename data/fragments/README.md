# Custom Card Library

**Data visualization cards as Ghost Page fragments.**

## Current Production Cards

1. **lancaster-county-profile** - Census demographics (residents, income, race, education)
2. **sheriff-election-2023** - Election result with winner visualization
3. **municipal-turnout-2025** - Voter participation funnel
4. **commissioner-top-donors** - Campaign finance top donors

## How It Works

### Page Fragment Pattern

Cards are Ghost Pages with specific slugs. Templates pull them in:

```handlebars
{{!-- In any template --}}
{{#get "pages" slug="lancaster-county-profile"}}
  {{#foreach pages}}
    {{{content}}}
  {{/foreach}}
{{/get}}
```

### Seed New Cards

```bash
# Create a new card page
docker exec ghost-dev sh /var/lib/ghost/content/themes/headline/scripts/seed-page.sh \
  lancaster-county-profile.hbs \
  lancaster-county-profile \
  "Lancaster County Profile"

# Or batch seed all cards
./scripts/seed-all-cards.sh
```

## File Structure

```text
data/fragments/
├── lancaster-county-profile.hbs   # Working example (hardcoded data)
├── sheriff-election-2023.hbs      # Working example
├── municipal-turnout-2025.hbs     # Working example
├── commissioner-top-donors.hbs    # Working example
├── census-reporter.hbs            # Template with {{placeholders}}
├── election-result.hbs            # Template with {{placeholders}}
├── voter-turnout.hbs              # Template with {{placeholders}}
└── top-donors.hbs                 # Template with {{placeholders}}

assets/css/cards/
├── _framework.css                 # Shared base styles (IMPORT THIS FIRST)
├── census-profile-card.css        # Card-specific styles
├── election-result-card.css
├── voter-turnout-card.css
└── top-donors-card.css

scripts/
├── seed-page.sh                   # Generic seeder (3 args: fragment, slug, title)
└── seed-all-cards.sh              # Batch seed all 4 production cards
```

## Shared CSS Framework

All cards inherit from `assets/css/cards/_framework.css`:
- `.custom-card` - Base container with border/padding
- `.custom-card-header` - Title and link section
- `.custom-card-grid` - Responsive column layout (auto-fit minmax)
- `.custom-card-timeline` - Vertical timeline with dots/lines
- `.custom-card-table` - Styled data tables
- `.custom-card-stat-bar` - Horizontal bar visualizations
- `.custom-card-footer` - Source citation styling

Import framework at top of each card CSS file:

```css
@import "_framework.css";

.your-custom-card {
  /* Card-specific overrides */
}
```

## Ghost Admin Display Issue

### Problem

Ghost Admin editor applies its own CSS that conflicts with card styles. Cards render correctly on frontend but look broken in Admin.

### Current Workaround

User added inline `<style>` blocks with `!important` overrides directly in fragment files. These are stripped from frontend (theme CSS takes over) but help Admin readability.

### Better Long-term Solution

Use semantic HTML that's readable even without CSS:

```html
<div class="custom-card">
  <header>
    <h3>Lancaster County — Census Profile</h3>
    <a href="...">Full data ↗</a>
  </header>
  
  <dl>
    <dt>Residents 18+</dt>
    <dd><strong>435,075</strong> eligible voters</dd>
  </dl>
  
  <footer>
    <small>Source: U.S. Census Bureau</small>
  </footer>
</div>
```

**Result in Admin:**
- Headers are visually distinct
- Data labels clear without styling
- Link text descriptive
- Structure scannable

**Result on Frontend:**
- CSS from theme applies
- Styled with colors, spacing, borders
- Data visualizations render

---

## Card Types & Layouts

### 1. Grid Layout (`--type=grid`)

**Best for:** Metrics, statistics, key figures

**Structure:**

```text
data/fragments/census-reporter.hbs        # Handlebars template with placeholders
assets/css/cards/census-profile-card.css  # Styles with CSS variables
scripts/update-census-cards.js            # Quarterly update automation
```

## Usage in Templates

### Basic Usage

```handlebars
{{!-- In any .hbs template (job.hbs, official.hbs, etc.) --}}
{{#get "pages" slug="census-reporter-lancaster-county"}}
  {{content}}
{{/get}}
```

### Dynamic Agency

```handlebars
{{!-- Where {{agency}} is a route parameter like "lancaster-county" --}}
{{#get "pages" slug=(concat "census-reporter-" agency)}}
  {{content}}
{{else}}
  {{!-- Fallback if no specific page exists --}}
  <p>Census data not available for this jurisdiction.</p>
{{/get}}
```

### Specificity Hierarchy

```handlebars
{{!-- Try specific page first, fall back to generic --}}
{{#get "pages" slug=(concat "census-reporter-" agency)}}
  {{content}}
{{else}}
  {{#get "pages" slug="census-reporter"}}
    {{content}}
  {{/get}}
{{/get}}
```

## Page Structure in Ghost

**Page Slug Format:** `census-reporter-{agency}`

Examples:
- `census-reporter` (generic template)
- `census-reporter-lancaster-county`
- `census-reporter-york-county`
- `census-reporter-dauphin-county`

**Page Properties:**
- **Title:** `CensusReporter: LANCASTER COUNTY`
- **Slug:** `census-reporter-lancaster-county`
- **Status:** Published
- **Visibility:** Public
- **Tags:** `fragment`, `census-reporter`

## CSS Variables

Theme can override colors via CSS variables:

```css
:root {
  /* Base colors */
  --census-border-color: #e5e7eb;
  --census-bg: white;
  --census-header-bg: #f3f4f6;
  --census-footer-bg: #f9fafb;
  
  /* Text colors */
  --census-title-color: #6b7280;
  --census-label-color: #6b7280;
  --census-value-color: #111827;
  --census-sublabel-color: #9ca3af;
  
  /* Link colors */
  --census-link-color: #3b82f6;
  --census-link-hover-color: #2563eb;
  
  /* Race/ethnicity colors */
  --census-race-white: #475569;
  --census-race-hispanic: #f97316;
  --census-race-mixed: #06b6d4;
  --census-race-other: #64748b;
  
  /* Education colors */
  --census-edu-less-hs: #f87171;
  --census-edu-hs: #fbbf24;
  --census-edu-some-college: #34d399;
  --census-edu-bachelors: #60a5fa;
  --census-edu-graduate: #a78bfa;
}
```

## Ghost Admin Compact Rendering

**Pattern:** Use `.custom-card` class with inline styles for compact admin preview.

### Purpose

Ghost Admin editor doesn't apply theme CSS. Inline styles with `!important` ensure compact rendering in the editor to avoid taking up excessive space.

### Implementation

```html
<style>
  /* Generic compact styles for custom cards in Ghost Admin */
  .custom-card {
    font-size: 12px !important;
    line-height: 1.4 !important;
    max-width: 100% !important;
    padding: 12px !important;
    margin: 8px 0 !important;
    border: 1px solid #e5e5e5 !important;
    border-radius: 4px !important;
    background: #fafafa !important;
  }
  .custom-card * {
    font-size: inherit !important;
    line-height: inherit !important;
  }
  .custom-card h1, .custom-card h2, .custom-card h3 {
    font-size: 14px !important;
    font-weight: 600 !important;
    margin: 0 0 8px 0 !important;
  }
  .custom-card p, .custom-card div {
    margin: 4px 0 !important;
  }
  .custom-card a {
    font-size: 11px !important;
    text-decoration: underline !important;
  }
</style>

<div class="your-card-class custom-card">
  <!-- Your card content -->
</div>
```

### Rules

1. **Always include inline `<style>` block** at the top of fragment files
2. **Always add `custom-card` class** to the root element of your card
3. **Use `!important`** on all styles to override Ghost Admin defaults
4. **Keep compact** - 12px base font, tight spacing, minimal padding
5. **Override specific elements** by adding `.custom-card .your-specific-class` rules

### Benefits

- **Consistent admin UX** across all custom cards
- **Space-efficient** editor preview without scrolling
- **Reusable pattern** for future card implementations
- **No Ghost Admin modifications** needed

## Quarterly Automation

### Manual Update

```bash
node scripts/update-census-cards.js
```

### GitHub Actions (Automated)

```yaml
name: Update Census Data

on:
  schedule:
    - cron: '0 0 1 */3 *'  # First day of every quarter
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: pnpm install
      - run: node scripts/update-census-cards.js
        env:
          GHOST_URL: ${{ secrets.GHOST_URL }}
          GHOST_ADMIN_KEY: ${{ secrets.GHOST_ADMIN_KEY }}
```

## Data Structure

From `@publicledger/data`:

```json
{
  "lancaster-county": {
    "residents18Plus": 435075,
    "medianIncome": 85802,
    "race": {
      "White (non-Hispanic)": { "percentage": 78.4 },
      "Hispanic / Latino": { "percentage": 12.1 },
      "Two or more races": { "percentage": 3.4 },
      "Other": { "percentage": 6.2 }
    },
    "education": {
      "Less than high school": { "percentage": 11.8 },
      "High school / GED": { "percentage": 32.0 },
      "Some college / Assoc.": { "percentage": 21.2 },
      "Bachelor's degree": { "percentage": 22.3 },
      "Graduate / Professional": { "percentage": 12.7 }
    },
    "source": {
      "name": "U.S. Census Bureau",
      "dataset": "ACS 2024 1-year",
      "url": "https://censusreporter.org/profiles/05000US42071-lancaster-county-pa/"
    }
  }
}
```

## Example Output

Renders a 4-column card:

1. **RESIDENTS 18+:** 435,075 eligible voters
2. **RACE & ETHNICITY:** Horizontal bars with percentages
3. **MEDIAN HH INCOME:** $85,802 per household/year
4. **EDUCATION (25+):** Horizontal bars with percentages

Footer: Source citation with link to Census Reporter

## Responsive Design

- **Desktop (1024px+):** 4 columns
- **Tablet (640px-1024px):** 2 columns
- **Mobile (<640px):** 1 column (stacked)

## Dark Mode

Automatic dark mode support via CSS variables in `prefers-color-scheme: dark` media query.

## Future Cards

Following the same pattern, create additional fragment types:

- `ballot-record-{agency}.hbs` - Election history
- `finance-summary-{agency}.hbs` - Campaign finance overview
- `contact-info-{agency}.hbs` - Official contact details

Each gets its own:
- `.hbs` template in `data/fragments/` (with `custom-card` class)
- CSS file in `assets/css/cards/`
- Update script in `scripts/`
- CSS variables for theming

**Remember:** Include the `custom-card` inline styles and class in each fragment for proper Ghost Admin rendering.
