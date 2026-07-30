/**
 * Server-side reader for the @publicledger/data package.
 *
 * Ghost themes are sandboxed — no server-side JS, no custom Handlebars helpers, and
 * {{#get}} only queries Ghost's own resources. So a template can never read this
 * data at render time. Instead the seeder reads it here, renders the card HTML, and
 * stores that HTML in the post. The numbers then ship in Ghost's server response:
 * crawlers, screen readers and no-JS clients all see them.
 *
 * The data is a published npm artifact, not live data — it changes when a package
 * version ships, so build/seed time is the correct place to read it.
 */

const fs = require("fs");
const path = require("path");

const THEME_ROOT = path.resolve(__dirname, "..", "..");

// Preference order: the real package once installed, the mock while developing,
// then the gulp-copied output that the browser would have fetched.
const CANDIDATE_ROOTS = [
  path.join(THEME_ROOT, "node_modules", "@publicledger", "data", "data"),
  path.join(THEME_ROOT, "test", "mocks", "publicledger-data", "data"),
  path.join(THEME_ROOT, "assets", "built", "data"),
];

let dataRoot = null;
const cache = new Map();

/**
 * Locate the data package on disk.
 * @returns {string} absolute path to the data directory
 */
function root() {
  if (dataRoot) return dataRoot;
  dataRoot = CANDIDATE_ROOTS.find(p => fs.existsSync(path.join(p, "meta.json")));
  if (!dataRoot) {
    throw new Error(
      "@publicledger/data not found. Looked in:\n  " + CANDIDATE_ROOTS.join("\n  ")
    );
  }
  return dataRoot;
}

/**
 * Read one JSON file from the data package.
 * @param {string} rel path relative to the data root, e.g. "entities/offices.json"
 * @returns {object} parsed JSON
 */
function load(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const file = path.join(root(), rel);
  if (!fs.existsSync(file)) throw new Error("missing data file: " + rel);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  cache.set(rel, json);
  return json;
}

const offices = () => load("entities/offices.json").offices || [];
const candidates = () => load("entities/candidates.json").candidates || [];
const donors = () => load("entities/donors.json").donors || {};
const meta = () => load("meta.json");

/**
 * Find an office by slug or id.
 * @param {string} idOrSlug office slug or id
 * @returns {object|null} the office record
 */
const getOffice = idOrSlug =>
  offices().find(o => o.slug === idOrSlug || o.id === idOrSlug) || null;

/**
 * Find a candidate by id or slug.
 * @param {string} idOrSlug candidate id or slug
 * @returns {object|null} the candidate record
 */
const getCandidate = idOrSlug =>
  candidates().find(c => c.id === idOrSlug || c.slug === idOrSlug) || null;

/** Escape a value for interpolation into HTML. */
function e(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Format a number as whole US dollars. */
const currency = amount =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

/** "AHMED AHMED" -> "Ahmed Ahmed" */
const titleCase = value =>
  String(value || "")
    .toLowerCase()
    .replace(/(^|[\s'’-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());

/**
 * The jurisdiction segment of a URL, which must match the Ghost primary-tag slug.
 * The data package supplies `jurisdictionSlug`; slugifying the display name is only
 * a fallback and does NOT always agree ("LANCASTER" slugifies to "lancaster" but the
 * jurisdiction is "lancaster-county").
 * @param {object} office an office record
 * @returns {string} the jurisdiction slug
 */
const jurisdictionSlug = office =>
  office.jurisdictionSlug ||
  String(office.jurisdiction || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

module.exports = {
  load,
  offices,
  candidates,
  donors,
  meta,
  getOffice,
  getCandidate,
  e,
  currency,
  titleCase,
  jurisdictionSlug,
};
