/**
 * Display labels for codes owned by the `@publicledger/data` package.
 *
 * Server-side only: these are consumed by the card renderers in this directory,
 * which run in Node at seed/build time. They are deliberately NOT in assets/js/ —
 * that bundle is concatenated and uglified into a classic <script>, so it has no
 * module system, and no client code needs these anyway.
 *
 * Both tables fall back to a neutral string when a code is unrecognised, so a new
 * party or office level shipped by the data package degrades rather than breaking.
 * Longer term these labels arguably belong in the data package itself, next to the
 * codes they describe.
 *
 * Note: rendered in Node, so these bypass Ghost's {{t}} / locales i18n. Fine while
 * the site is English-only.
 */

const PARTY = {
  DEM: "Democrat",
  REP: "Republican",
  IND: "Independent",
  GRN: "Green",
  LIB: "Libertarian",
};

const PARTY_FALLBACK = "Unaffiliated";

const OFFICE_LEVEL = {
  county: "County office",
  municipal: "Municipal office",
  state: "State office",
  school: "School district office",
};

const OFFICE_LEVEL_FALLBACK = "Elected office";

/**
 * Human-readable party name for a data-package party code.
 * @param {string} code e.g. "DEM"
 * @returns {string} display label, or the raw code, or "Unaffiliated"
 */
const partyLabel = code => PARTY[code] || code || PARTY_FALLBACK;

/**
 * Human-readable office level for a data-package level code.
 * @param {string} code e.g. "county"
 * @returns {string} display label, or "Elected office"
 */
const officeLevelLabel = code => OFFICE_LEVEL[code] || OFFICE_LEVEL_FALLBACK;

module.exports = {
  PARTY,
  OFFICE_LEVEL,
  PARTY_FALLBACK,
  OFFICE_LEVEL_FALLBACK,
  partyLabel,
  officeLevelLabel,
};
