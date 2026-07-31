#!/usr/bin/env node
/**
 * Ghost Seed - Copy pages from production Ghost to local Ghost
 * Seeds local development environment with production content
 * Usage: npm run ghost:seed
 *
 * Reads from production Ghost Content API, writes directly to local SQLite database
 *
 * Uses the read-only Content API (GHOST_PRD_KEY) rather than the Admin API on
 * purpose: an Admin API key grants full read/write access to members' PII, staff
 * accounts, and settings, and Ghost offers no read-only variant. That key must not
 * be present inside the devcontainer. Tradeoff: the Content API only returns
 * PUBLISHED pages, so production drafts are not seeded.
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");
const { execFileSync } = require("child_process");
const fs = require("fs");

// Configuration
const DB_PATH = process.env.GHOST_DB_PATH || "/var/lib/ghost/content/data/ghost-dev.db";
const PROD_URL = process.env.GHOST_PRD_URL || "https://publicledger.ghost.io";
const PROD_KEY = process.env.GHOST_PRD_KEY || "PROD_KEY_REQUIRED";

// Make HTTP request to Ghost Content API (key is passed as a query param, no JWT)
function ghostRequest(baseUrl, apiKey, endpoint, method = "GET") {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    url.searchParams.set("key", apiKey);
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PublicLedger-Ghost-Seed/1.0",
      },
    };

    const req = client.request(options, res => {
      let body = "";
      res.on("data", chunk => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body || "{}"));
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

// Execute SQLite command
//
// Runs sqlite3 directly rather than through a shell. The previous version built
// a shell string and escaped only double quotes, which left backticks and $()
// live -- and `query` carries page titles and HTML fetched from production, so
// a page title could run commands in the devcontainer. Passing argv avoids the
// shell entirely, so no escaping is needed.
function sqliteExec(query) {
  try {
    const result = execFileSync("sqlite3", [DB_PATH, query], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim();
  } catch (err) {
    throw new Error(`SQLite error: ${err.message}`, { cause: err });
  }
}

// Escape SQL string
function sqlEscape(str) {
  if (!str) return "NULL";
  return `'${str.replace(/'/g, "''")}'`;
}

// Fetch all pages from production
async function fetchAllFromProduction() {
  try {
    const response = await ghostRequest(PROD_URL, PROD_KEY, "/ghost/api/content/pages/?limit=all");
    return response.pages || [];
  } catch (err) {
    console.error("Failed to fetch production pages:", err.message);
    throw err;
  }
}

// Copy theme's routes.yaml to Ghost settings directory
function copyRoutesToGhost() {
  const themeRoutesPath = "/workspace/routes.yaml";
  const ghostRoutesPath = "/var/lib/ghost/content/settings/routes.yaml";

  // Check if theme has routes.yaml
  if (!fs.existsSync(themeRoutesPath)) {
    return false;
  }

  // Copy from theme directory to settings directory inside ghost-dev.
  // Since /workspace is mounted at /var/lib/ghost/content/themes/publicledger-headline-fork in ghost-dev.
  // ghost-exec.sh resolves the container by Compose service label — it has no fixed
  // name, see the header of .devcontainer/docker-compose.yml.
  try {
    // Destination is passed as $1 rather than interpolated into the sh -c
    // string, so the path can never be read as shell syntax.
    execFileSync(
      "bash",
      [
        "/workspace/scripts/ghost-exec.sh",
        "sh",
        "-c",
        'mkdir -p /var/lib/ghost/content/settings && cp /var/lib/ghost/content/themes/publicledger-headline-fork/routes.yaml "$1"',
        "_",
        ghostRoutesPath,
      ],
      { stdio: "pipe" }
    );
    return true;
  } catch (err) {
    console.log(`  ⚠ Failed to copy routes.yaml: ${err.message}`);
    return false;
  }
}

// Get existing page slugs from local database
function getLocalPageSlugs() {
  const result = sqliteExec("SELECT slug FROM posts WHERE type='page';");
  return result ? result.split("\n").filter(Boolean) : [];
}

// Delete all pages from local database
function deleteAllLocalPages() {
  sqliteExec("DELETE FROM posts WHERE type='page';");
}

// Insert page into local database
function insertPage(page) {
  const now = new Date().toISOString().replace("T", " ").split(".")[0];
  const id = generateId();

  const query = `
    INSERT INTO posts (
      id, uuid, title, slug, html, 
      plaintext, feature_image, featured, type, status,
      visibility, email_recipient_filter, created_at, 
      updated_at, published_at, published_by
    ) VALUES (
      ${sqlEscape(id)},
      ${sqlEscape(generateUUID())},
      ${sqlEscape(page.title)},
      ${sqlEscape(page.slug)},
      ${sqlEscape(page.html)},
      ${sqlEscape(page.plaintext || "")},
      ${sqlEscape(page.feature_image)},
      ${page.featured ? 1 : 0},
      'page',
      ${sqlEscape(page.status || "published")},
      ${sqlEscape(page.visibility || "public")},
      ${sqlEscape(page.email_recipient_filter || "none")},
      ${sqlEscape(now)},
      ${sqlEscape(now)},
      ${sqlEscape(page.published_at || now)},
      '1'
    );
  `;

  sqliteExec(query);
}

// Generate Ghost-style ID (24-char hex)
function generateId() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// Generate UUID v4
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Main seed function
async function seedLocal() {
  console.log("\n=== Ghost Seed (Production → Local) ===");
  console.log(`Source: ${PROD_URL}`);
  console.log(`Target: ${DB_PATH}`);
  console.log("");

  // Check production API key
  if (PROD_KEY.includes("REQUIRED")) {
    console.error("✗ Production API key not configured!");
    console.error("");
    console.error("Edit .env:");
    console.error("  GHOST_PRD_URL=https://publicledger.ghost.io");
    console.error("  GHOST_PRD_KEY=<content-api-key>");
    console.error("");
    console.error("Get the CONTENT API key from:");
    console.error("  Ghost Admin → Settings → Integrations → your custom integration");
    console.error("  Use the 'Content API Key', NOT the Admin API Key.");
    console.error("");
    process.exit(1);
  }

  // Check database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`✗ Ghost database not found: ${DB_PATH}`);
    console.error("");
    console.error("Make sure Ghost is running and has been set up.");
    console.error("Check logs: pnpm ghost:logs");
    console.error("");
    process.exit(1);
  }

  // Fetch pages from production
  console.log("Fetching pages from production...");
  const prodPages = await fetchAllFromProduction();
  console.log(`✓ Found ${prodPages.length} published pages in production`);
  console.log("  (Content API returns published pages only — drafts are not seeded)");

  if (prodPages.length === 0) {
    console.log("\nNo pages to sync.");
    return;
  }

  // Get local pages
  const localSlugs = getLocalPageSlugs();
  console.log(`Found ${localSlugs.length} pages in local database`);

  // Delete all local pages
  console.log("\nDeleting existing local pages...");
  deleteAllLocalPages();
  console.log("✓ Cleared local pages");

  // Add proof-of-concept test page
  console.log("\nAdding test page for routing proof...");
  const testPage = {
    title: "Fragment: Lancaster County Commissioner",
    slug: "job-agency-seat-lancaster-county-county-commissioner",
    html: `<h1>Lancaster County Commissioner</h1>
<p>The Lancaster County Board of Commissioners is the chief governing body of Lancaster County, Pennsylvania.</p>

<h2>Key Responsibilities</h2>
<ul>
  <li><strong>Budget:</strong> Approves $600M+ annual county budget</li>
  <li><strong>Administration:</strong> Oversees county departments and services</li>
  <li><strong>Planning:</strong> County development and land use decisions</li>
</ul>

<p><strong>Term:</strong> 4 years | <strong>Seats:</strong> 3 commissioners | <strong>Salary:</strong> $85,000</p>`,
    status: "published",
    visibility: "public",
    featured: false,
  };
  insertPage(testPage);
  console.log(`✓ Created: ${testPage.slug}`);

  // Add Sheriff test page
  const sheriffPage = {
    title: "Fragment: Lancaster County Sheriff",
    slug: "job-agency-seat-lancaster-county-sheriff",
    html: `<p>Hello, world! Custom Sheriff content goes here.</p>`,
    status: "published",
    visibility: "public",
    featured: false,
  };
  insertPage(sheriffPage);
  console.log(`✓ Created: ${sheriffPage.slug}`);

  // Insert production pages
  console.log("\nInserting production pages...");
  let inserted = 0;
  for (const page of prodPages) {
    try {
      insertPage(page);
      inserted++;
      process.stdout.write(`\r  Progress: ${inserted}/${prodPages.length}`);
    } catch (err) {
      console.error(`\n✗ Failed to insert "${page.slug}": ${err.message}`);
    }
  }

  console.log(`\n✓ Inserted ${inserted} pages`);

  // Copy theme's routes.yaml (controls homepage and custom routing)
  console.log("\nCopying routes.yaml to Ghost...");
  const routesCopied = copyRoutesToGhost();
  if (routesCopied) {
    console.log("✓ Copied routes.yaml from theme");
    console.log("  (Restart Ghost to apply: pnpm ghost:restart)");
  } else {
    console.log("  No routes.yaml in theme (using Ghost defaults)");
  }

  console.log("\n=== Seed Complete ===");
  console.log("\nRefresh Ghost Admin to see changes:");
  console.log("  http://localhost:3001/ghost/");
  console.log("");
}

// Run
seedLocal().catch(err => {
  console.error("\n✗ Seed failed:", err.message);
  process.exit(1);
});
