# Template Fragments: In-Ghost Partial Content Pattern

## Concept

**Ghost Pages as template fragments** - editorial content blocks injected into data-driven templates via slug-based lookup.

**Architecture:**

- **Theme templates** (`.hbs` files) = structure + data rendering logic
- **Ghost Pages** (CMS content) = editorial HTML fragments inserted by slug
- **Specificity hierarchy** = specific fragment → generic fragment → hardcoded fallback

**Why:** Editors control high-traffic page content without code deployments. Developers control structure, data APIs, and fallback behavior.

---

## How It Works

### Routes Configuration (routes.yaml)

Specificity is handled by **route ordering** - explicit routes before generic catch-alls:

```yaml
routes:
  # Explicit route with custom Page content
  /jobs/lancaster-county/sheriff/:
    template: job-agency-seat
    data: page.job-agency-seat-lancaster-county-sheriff
  
  # Another explicit route
  /jobs/lancaster-county/county-commissioner/:
    template: job-agency-seat
    data: page.job-agency-seat-lancaster-county-county-commissioner
  
  # Generic catch-all (no data property)
  /jobs/{agency}/{seat}/:
    template: job-agency-seat
```

**Ghost loads Page automatically** when route has `data: page.{slug}` - no queries needed in template.

### Template Structure (job-agency-seat.hbs)

```handlebars
{{!< default}}

<main class="gh-main">
  {{!-- OPTIONAL: Custom Page content (loaded via routes.yaml) --}}
  {{#if page}}
    <section class="gh-content gh-canvas">
      <article class="gh-article">
        {{{page.html}}}  {{!-- Ghost injects Page HTML automatically --}}
      </article>
    </section>
  {{/if}}

  {{!-- ALWAYS: Data-driven section (theme-controlled) --}}
  <section class="job-data">
    <div class="gh-canvas">
      <div id="job-seat-app" data-agency="{{agency}}" data-seat="{{seat}}">
        <h2>Position Data</h2>
        <p>Current officeholder, election history load here from PublicLedgerData API</p>
      </div>
    </div>
  </section>
</main>
```

### Fragment Anatomy

**Ghost Page slug:** `job-agency-seat-lancaster-county-sheriff`

**Page content (HTML fragment):**

```html
<h1>Lancaster County Sheriff</h1>
<p>The Lancaster County Sheriff manages the county prison, court security, and warrant service.</p>

<h2>Responsibilities</h2>
<ul>
  <li>Lancaster County Prison (1,200 capacity)</li>
  <li>Court security for all county courts</li>
  <li>Civil process and warrant execution</li>
</ul>

<p><strong>Term:</strong> 4 years | <strong>Salary:</strong> $145,000</p>
```

**Routes configuration:**

```yaml
/jobs/lancaster-county/sheriff/:
  template: job-agency-seat
  data: page.job-agency-seat-lancaster-county-sheriff
```

**Result:** Ghost loads Page via `data:` property, template checks `{{#if page}}` and injects HTML, data section renders below.

---

## Key Distinctions

### Ghost Pages Are NOT Full Pages

**Traditional Ghost usage:**

- Page = complete standalone page with URL
- `/about/` → `about` Page → renders in `page.hbs` template
- One Page = one URL

**This pattern:**

- Page = content fragment with slug (no URL)
- `/jobs/lancaster-county/sheriff/` → custom route → looks up `job-agency-seat-lancaster-county-sheriff` Page → injects fragment into `job-agency-seat.hbs` template
- Many URLs can use same Page (generic), or override with specific Page

### Separation of Concerns

| Layer                             | Responsibility                       | Changed By                     | Frequency    |
|-----------------------------------|--------------------------------------|--------------------------------|--------------|
| **Routes** (`routes.yaml`)        | URL patterns, Page mappings          | Developers (theme deployment)  | Quarterly    |
| **Templates** (`.hbs` files)      | Structure, data APIs                 | Developers (theme deployment)  | Occasionally |
| **Fragments** (Ghost Pages)       | Editorial content, descriptions      | Editors (CMS publish)          | Frequently   |
| **Data** (PublicLedgerData API)   | Officials, elections, finance        | Backend (data updates)         | Daily        |

**Benefit:** Editorial team updates page content instantly without touching code or waiting for deployments. Quarterly route regeneration adds explicit routes for new positions as they appear in data source.

---

## Fragment Naming Convention

### Pattern: `{template-name}[-{param1}[-{param2}...]]`

**Specific fragments** (created for pages needing custom content):

- `job-agency-seat-lancaster-county-sheriff` - Custom LC Sheriff content
- `job-agency-seat-lancaster-county-district-attorney` - Custom LC DA content
- `election-agency-seat-year-lancaster-county-sheriff-2024` - Custom 2024 Sheriff race coverage
- `donor-john-smith` - Custom donor profile (if slug-based, not ID-based)

### Slug Construction Rules

1. **Start with template name** - matches `.hbs` filename without extension
1. **Append route params in order** - as they appear in URL
1. **Use hyphens** - lowercase, no underscores/spaces
1. **Match URL segments exactly** - `/lancaster-county/` → `lancaster-county`

**Examples:**

| Route                                       | Template                        | Generic Fragment            | Specific Fragment Example                                 |
|---------------------------------------------|-------------------------------- |-----------------------------|-----------------------------------------------------------|
| `/jobs/`                                    | `job.hbs`                       | `job`                       | N/A (no params)                                           |
| `/jobs/lancaster-county/`                   | `job-agency.hbs`                | `job-agency`                | `job-agency-lancaster-county`                             |
| `/jobs/lancaster-county/sheriff/`           | `job-agency-seat.hbs`           | `job-agency-seat`           | `job-agency-seat-lancaster-county-sheriff`                |
| `/elections/lancaster-county/sheriff/2024/` | `election-agency-seat-year.hbs` | `election-agency-seat-year` | `election-agency-seat-year-lancaster-county-sheriff-2024` |

---

## Fragment Content Guidelines

### What Goes in Fragments (Ghost Pages)

✅ **Include:**

- Introductory text and descriptions
- Role responsibilities and background
- Historical context and significance  
- Rich editorial content (formatted text, lists, links)
- SEO-friendly copy

❌ **Exclude:**

- Handlebars variables (won't render: `{{agency}}`, `{{seat}}`)
- Dynamic data (current officeholder name, election results)
- JavaScript/complex interactivity (data rendering is template's job)
- Conditional logic (can't do "if Lancaster County show X")

### Content Pattern

**Specific fragment example** (`job-agency-seat-lancaster-county-sheriff`):

```html
<h1>Lancaster County Sheriff</h1>
<p>The Lancaster County Sheriff is an elected constitutional officer responsible for law enforcement, court security, and corrections.</p>

<h2>Key Responsibilities</h2>
<ul>
  <li><strong>Corrections:</strong> Operates Lancaster County Prison with 1,200-inmate capacity</li>
  <li><strong>Court Security:</strong> Provides security for all county courts and judges</li>
  <li><strong>Civil Process:</strong> Serves warrants, summons, and executes court orders</li>
  <li><strong>Real Estate:</strong> Conducts sheriff sales and tax collections</li>
</ul>

<h2>Office Details</h2>
<p><strong>Term Length:</strong> 4 years | <strong>Salary:</strong> $145,000 | <strong>Staff:</strong> 400+ employees | <strong>Budget:</strong> $60M+</p>

<p><strong>Official Website:</strong> <a href="https://www.lcso.org" target="_blank">lcso.org</a></p>
```

**Dynamic data section** (in template, below fragment):

```javascript
// Rendered by template after fragment injection
window.PublicLedgerData.getOfficialsByAgencySeat('lancaster-county', 'sheriff')
  .then(officials => {
    // Show current Sheriff: [Name], since [Date]
    // Show past Sheriffs: timeline
    // Show election results: chart
  });
```

---

## Implementation Workflow

### Phase 1: Template Creation (Developer)

1. Create `.hbs` template with two-layer structure:

   ```handlebars
   {{!-- Optional Page content --}}
   {{#if page}}
     <section class="gh-content gh-canvas">
       <article class="gh-article">{{{page.html}}}</article>
     </section>
   {{/if}}
   
   {{!-- Always-present data section --}}
   <section class="job-data">
     <div id="job-seat-app">...</div>
   </section>
   ```

1. Add generic route to `routes.yaml`:

   ```yaml
   /jobs/{agency}/{seat}/:
     template: job-agency-seat
   ```

1. Deploy theme

### Phase 2: Data Build & Route Generation (Quarterly)

1. Build script reads PublicLedgerData entities (offices, seats)
1. Generates explicit routes in `routes.yaml` for all positions:

   ```yaml
   /jobs/lancaster-county/sheriff/:
     template: job-agency-seat
     data: page.job-agency-seat-lancaster-county-sheriff
   
   /jobs/york-county/sheriff/:
     template: job-agency-seat
     data: page.job-agency-seat-york-county-sheriff
   ```  

1. Explicit routes placed **before** generic catch-all
1. Deploy updated theme with expanded routes

### Phase 3: Fragment Creation (Editor, as needed)

1. Identify position needing custom content
1. Ghost Admin → Pages → New Page
1. Slug: `job-agency-seat-lancaster-county-sheriff` (must match route's `data:` property)
1. Write custom editorial content
1. Mark as **NOT featured** (these aren't standalone pages)
1. Publish
1. Route shows custom content (1-5 sec cache invalidation)

### Phase 4: Maintenance (Ongoing)

- Edit fragments anytime via Ghost Admin (instant updates)
- Create new fragments for positions as needed
- Routes without matchitemplate + 50 explicit routes + custom fragments only where needed

### SEO Control

Editors can optimize content per-page:

- Custom meta descriptions
- Rich content with keywords
- Structured data in HTML
- Internal linking strategy

### Version Control

Ghost tracks Page edit history:

- Revert bad edits
- See who changed what when
- A/B test content variations

### Scalability

- **15 templates** (developer maintains)
- **50-200 explicit routes** (quarterly build generates from data)
- **0-100 specific fragments** (editor creates only where custom content needed)
- **No code changes** for content updates between quarterly builds

---

## Performance

### No Query Overhead

Pages are loaded by Ghost automatically via `data: page.{slug}` in routes.yaml:

- **Page exists:** Loaded with request context (no additional queries)
- **Page missing:** Simple null check in template `{{#if page}}`
- **Zero query overhead** compared to traditional routing

**Ghost caching:** Page data cached with route rendering.

### Cache Invalidation

Ghost automatically invalidates Page cache on publish:

- Edit fragment → Publish → Cache clears → Next request fetches new content
- Typically 1-5 seconds for updated content to appear

---

## Debugging

### Fragment Not Rendering

**Check:**

1. **Slug exact match** - Page slug must exactly match `data:` value (without `page.` prefix). Example: `job-agency-seat` not `job-agency-seats` (plural)
1. **Page published** - Draft Pages won't be loaded
1. **Route has `data:` property** - `data: page.job-agency-seat-lancaster-county-sheriff` in routes.yaml
1. **Route order** - Explicit routes must be **before** generic catch-all routes
1. **Ghost logs** - Check for template errors: `docker logs ghost-dev 2>&1 | tail -50`

### No Custom Content Showing

**Expected behavior:** Routes without `data:` property or without matching Pages show only data section (no `{{#if page}}` content).

**If you want custom content:**

1. Create Ghost Page with slug matching desired route pattern
1. Add explicit route to routes.yaml **before** generic catch-all:

   ```yaml
   /jobs/lancaster-county/sheriff/:
     template: job-agency-seat
     data: page.job-agency-seat-lancaster-county-sheriff
   ```  

1. Deploy theme with updated routes
1. Restart Ghost to load new routes

### Routes Not Loading

**Issue:** Changes to routes.yaml not taking effect

**Fix:**

1. Copy routes.yaml to Ghost container: `docker cp routes.yaml ghost-dev:/var/lib/ghost/content/settings/`
1. Restart Ghost: `docker restart ghost-dev`
1. Wait 10-15 seconds for Ghost to fully restart
1. Test route with curl or browser

## Comparison to Alternatives

### vs. Headless CMS (Strapi, Contentful)

**Headless CMS:**

- Separate content API + theme frontend
- Complex infrastructure (CMS server + app server)
- API calls for every page render
- More moving parts to maintain

**Ghost `data:` property (this pattern):**

- Content integrated in Ghost
- Single server, simpler architecture
- Pages loaded automatically via routes.yaml
- Fewer dependencies

### vs. All Hardcoded Templates

**Hardcoded:**

- 50 elected seats = 50 template files or massive switch statements
- Content changes = code deployment
- No editor control

**Fragments:**

- 50 elected seats = 1 template + 50 explicit routes + fragments only where needed
- Content changes = CMS publish (instant)
- Full editor control

### vs. Single Dynamic Template

**Single template:**

- All pages identical
- No customization
- Generic content only

**Fragments:**

- Same template structure for all
- Custom content inserts where beneficial
- High-traffic pages get custom editorial content
- Scales efficiently with quarterly route generation

---

## Migration Patterns

### From Hardcoded Templates

1. **Extract editorial content** from templates to separate HTML files
1. **Update template** to two-layer structure (`{{#if page}}` + data section)
1. **Test generic route** - should render data section only
1. **Deploy theme**
1. **Create Ghost Pages** for positions needing custom content
1. **Add explicit routes** with `data: page.{slug}` for those Pages
1. **Redeploy theme** - custom content now appears

### From External CMS

1. **Export CMS content** as HTML
1. **Create Ghost Pages** with content (slug = content fragment identifier)
1. **Update templates** to use `{{#if page}}` instead of CMS API
1. **Create explicit routes** in routes.yaml with `data: page.{slug}`
1. **Remove CMS integration** code
1. **Deploy updated theme**

---

## Best Practices

### Fragment Organization

**Naming Ghost Pages:**

- Use descriptive titles: "Lancaster County Sheriff"
- Add tags: `fragment`, `template:job-agency-seat`
- Document which route uses each fragment

**Tracking fragments:**
Maintain list (via Ghost Admin or external doc) of which routes have explicit entries:

```text
Routes with Custom Fragments:
✓ /jobs/lancaster-county/sheriff/ → job-agency-seat-lancaster-county-sheriff
✓ /jobs/lancaster-county/district-attorney/ → job-agency-seat-lancaster-county-district-attorney
✓ /elections/lancaster-county/sheriff/2024/ → election-agency-seat-year-lancaster-county-sheriff-2024

Total Explicit Routes: 50
Routes with Custom Content: 23
Generic Routes (no data:): All others fall through to catch-all
```

### Content Guidelines for Editors

**Do:**

- Create Pages only for routes needing custom content
- Match Page slug exactly to route's `data:` property (without `page.` prefix)
- Use semantic HTML (`<h2>`, `<ul>`, `<strong>`)
- Include relevant links
- Keep content evergreen (facts that don't change often)

**Don't:**

- Include Handlebars variables (won't work)
- Add dynamic data (current officeholder name, etc.) - theme handles that
- Create Pages for every route - only high-traffic ones need specific fragments
- Change Page slugs after creation - breaks template lookups

### Template Guidelines for Developers

**Do:**

- Use two-layer structure: optional `{{#if page}}` + always-present data section
- Handle missing Pages gracefully (data section shows regardless)
- Keep Page content separate from data rendering
- Document which routes should have explicit entries in routes.yaml
- Test both with and without Page content

**Don't:**

- Put editorial content in templates (that's what Pages are for)
- Assume `page` variable exists (always check `{{#if page}}`)
- Mix Page content with data rendering (separate sections)
- Add `data:` properties without creating corresponding Pages first

---

## Testing

### Local Development

1. **Test generic route** (no explicit route or Page):

   ```bash
   curl http://localhost:3001/jobs/york-county/sheriff/
   # Should show: data section only (no custom content at top)
   ```

2. **Create specific fragment** via Ghost Admin:
   - Slug: `job-agency-seat-lancaster-county-sheriff`
   - Content: Custom LC Sheriff content
   - Publish

3. **Add explicit route** to routes.yaml:

   ```yaml
   /jobs/lancaster-county/sheriff/:
     template: job-agency-seat
     data: page.job-agency-seat-lancaster-county-sheriff
   ```

4. **Deploy route update**:

   ```bash
   docker cp routes.yaml ghost-dev:/var/lib/ghost/content/settings/
   docker restart ghost-dev
   ```

5. **Test explicit route with Page**:

   ```bash
   curl http://localhost:3001/jobs/lancaster-county/sheriff/
   # Should show: custom Sheriff content + data section
   ```

6. **Verify generic route still works**:

   ```bash
   curl http://localhost:3001/jobs/york-county/sheriff/
   # Should show: data section only (no explicit route or Page)
   ```

### Production Deployment

1. **Run quarterly build** to generate routes.yaml with all explicit routes
1. **Deploy theme** with updated routes.yaml
1. **Create specific fragments** in Ghost Admin for pages needing custom content
1. **Monitor** which routes get traffic, create more fragments as needed
1. **Track performance** - Ghost rendering time

---

## Implementation Status

### Templates Updated to Two-Layer Structure

- ✅ `job-agency-seat.hbs` (tested and verified)
- ⏳ Other templates need updates to match pattern

### Proof of Concept Verified

- ✅ `/jobs/lancaster-county/county-commissioner/` with full custom content
- ✅ `/jobs/lancaster-county/sheriff/` with simple test content  
- ✅ Generic routes work without custom content (data section only)
- ✅ Pattern scales: same template, different Page content per route

### Routes Configuration

- ✅ `routes.yaml` defines all URL patterns
- ✅ Dynamic routes with parameters (`{agency}`, `{seat}`, `{year}`, `{slug}`)
- ✅ Explicit test routes with `data:` properties
- ✅ Generic catch-all routes for all URL patterns
- ⏳ Quarterly build script to generate all explicit routes from data

### Next Steps

- [ ] Update remaining templates to two-layer pattern
- [ ] Build quarterly route generation script (scripts/build-routes.js)
- [ ] Create specific fragments for high-traffic pages

---

## See Also

- **Route Configuration:** `routes.yaml` (defines URL patterns and template mappings)
- **Data Rendering:** `assets/js/data-loader.js` (PublicLedgerData API integration)
- **Theme Architecture:** `AGENTS.md` (overview of fork-specific design patterns)
- **Development Setup:** `DEVCONTAINER.md` (local Ghost instance for testing)
