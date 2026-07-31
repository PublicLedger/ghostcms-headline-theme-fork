#!/usr/bin/env node
/**
 * seed-record.js — create one collection record via the Ghost Admin API.
 *
 *   node scripts/seed-record.js <type> <parent|-> <slug> [title]
 *   node scripts/seed-record.js job lancaster-county county-commissioner "County Commissioner"
 *   node scripts/seed-record.js official - alice-yoder "Alice Yoder"
 *
 * <type> selects the collection (job|official|election|donor|lookup|finance).
 * <parent> is the primary tag filling {primary_tag}; pass "-" for single-segment
 * collections (/official/{slug}/ etc.) which have no parent segment.
 *
 * Uses the Admin API, NOT direct SQLite writes. Ghost builds its URL map in memory,
 * and a post inserted behind its back is unroutable (301 to /404/) until Ghost
 * restarts. Restarting is not an option from inside the devcontainer: it shares
 * ghost-dev's network namespace via `network_mode: service:ghost-dev`, so bouncing
 * ghost-dev destroys the devcontainer's own networking, leaving it with only `lo`.
 * Going through the API keeps Ghost's caches correct and needs no restart.
 *
 * The body is sent as Lexical, not HTML — see bodyLexical() for why.
 */

const { renderCard } = require("./cards");

// These two are deliberately different values, and neither is GHOST_URL.
//
// API_BASE is where the request is SENT. Ghost listens on 2368; the devcontainer
// shares ghost-dev's network namespace, so 2368 is right from both containers and
// 3001 (the host publish) is reachable from neither.
//
// SITE_URL is the origin Ghost VALIDATES the request against — it must equal the
// `url` in Ghost's config, which is the host-facing http://localhost:3001. Send the
// API base here instead and every write is rejected with "Request made from
// incorrect origin".
const API_BASE = process.env.GHOST_API_URL || "http://localhost:2368";
const SITE_URL = process.env.GHOST_SITE_URL || "http://localhost:3001";
const EMAIL = process.env.GHOST_ADMIN_EMAIL || "admin@example.com";
const PASSWORD = process.env.GHOST_ADMIN_PASSWORD || "RandomSecure123456789";

const TYPES = {
  job: { template: "custom-job-agency-seat", cards: ["job-seat", "official-brief"] },
  official: { template: "custom-official", cards: ["official-brief"] },
  election: { template: "custom-election", cards: [] },
  donor: { template: "custom-donor", cards: [] },
  lookup: { template: "custom-lookup", cards: ["entity-picker"] },
  finance: { template: "custom-finance", cards: [] },
};

const [type, parentArg, slug, title] = process.argv.slice(2);
const spec = TYPES[type];
if (!spec || !slug) {
  console.error("Usage: node scripts/seed-record.js <type> <parent|-> <slug> [title]");
  console.error("Types: " + Object.keys(TYPES).join(", "));
  process.exit(1);
}
const parent = parentArg && parentArg !== "-" ? parentArg : "";
const postTitle = title || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const text = value => ({
  type: "text",
  text: value,
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  version: 1,
});

const para = value => ({
  type: "paragraph",
  version: 1,
  direction: "ltr",
  format: "",
  indent: 0,
  children: [text(value)],
});

const heading = value => ({
  type: "heading",
  tag: "h2",
  version: 1,
  direction: "ltr",
  format: "",
  indent: 0,
  children: [text(value)],
});

const htmlCard = markup => ({ type: "html", version: 1, html: markup });

/**
 * The editor-facing body, as Lexical.
 *
 * Sent as `lexical`, NOT as `html` with ?source=html. Ghost's html-to-lexical
 * converter silently DROPS unknown block elements, so card shells written as
 * <div data-card-type="..."> vanish from the post entirely. Building the document
 * here keeps each block an explicit node, and each card its own `html` node, which
 * is what makes them independently draggable in Admin.
 * @returns {string} serialised Lexical document
 */
function bodyLexical() {
  const children = [
    para(
      `${postTitle}${parent ? " — " + parent.replace(/-/g, " ") : ""}. This opening paragraph is editor-owned copy.`
    ),
    htmlCard(
      `<blockquote class="pl-pullquote-placeholder" data-future-card="pullquote-rotator">In their own words: pullquote rotator goes here, a future Card.</blockquote>`
    ),
    heading("Reported in depth"),
    para(
      "Editorial reporting about the role, its history and why it matters. Embeds live here too. None of this is generated."
    ),
    heading("Official brief"),
    // Cards are rendered here, server-side, from the @publicledger/data package.
    // The HTML is stored in the post, so the numbers ship in Ghost's response —
    // no browser fetch, and crawlers/screen-readers/no-JS clients all see them.
    ...spec.cards.map(c =>
      htmlCard(
        renderCard(c, {
          agency: parent,
          agencyName: parent ? parent.replace(/-/g, " ") : "",
          seat: slug,
          slug,
          source: c === "entity-picker" ? "offices" : undefined,
          label: c === "entity-picker" ? "Offices in this jurisdiction" : undefined,
        })
      )
    ),
  ];
  return JSON.stringify({
    root: { children, direction: "ltr", format: "", indent: 0, type: "root", version: 1 },
  });
}

let cookie = "";

/**
 * Call the Ghost Admin API, carrying the session cookie between calls.
 * @param {string} path API path beginning with /ghost/api/admin/
 * @param {object} options fetch options
 * @returns {Promise<{status: number, json: object|null, text: string}>} the response
 */
async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: SITE_URL,
      Referer: SITE_URL + "/ghost/",
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // The session endpoint answers with a bare string, not JSON.
  }
  return { status: res.status, json, text };
}

async function main() {
  const login = await api("/ghost/api/admin/session/", {
    method: "POST",
    body: JSON.stringify({ username: EMAIL, password: PASSWORD }),
  });
  if (login.status >= 400) throw new Error("login failed: " + login.text.slice(0, 200));

  // Array order becomes sort_order, so the parent tag must come first to be primary.
  const tags = [];
  if (parent) tags.push({ name: parent.replace(/-/g, " "), slug: parent });
  tags.push({ name: "#" + type });

  const payload = {
    posts: [
      {
        title: postTitle,
        slug,
        lexical: bodyLexical(),
        status: "published",
        tags,
        custom_template: spec.template,
      },
    ],
  };

  const existing = await api(`/ghost/api/admin/posts/slug/${encodeURIComponent(slug)}/?formats=html`);

  let res;
  if (existing.status === 200 && existing.json && existing.json.posts && existing.json.posts[0]) {
    const current = existing.json.posts[0];
    // Ghost rejects an update without the current updated_at (collision detection).
    payload.posts[0].updated_at = current.updated_at;
    res = await api(`/ghost/api/admin/posts/${current.id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (res.status >= 400) throw new Error("update failed: " + res.text.slice(0, 300));
    console.log(`updated  ${type.padEnd(9)} ${slug}`);
  } else {
    res = await api("/ghost/api/admin/posts/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.status >= 400) throw new Error("create failed: " + res.text.slice(0, 300));
    console.log(`created  ${type.padEnd(9)} ${slug}`);
  }

  const post = res.json.posts[0];
  console.log(`  url        : ${String(post.url || "").replace(SITE_URL, "")}`);
  console.log(`  primary tag: ${post.primary_tag ? post.primary_tag.slug : "(none)"}`);
  console.log(`  template   : ${post.custom_template}`);
}

main().catch(err => {
  console.error("✗ " + err.message);
  process.exit(1);
});