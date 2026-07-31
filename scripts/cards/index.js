/**
 * Server-side card renderers.
 *
 * Each renderer returns the full HTML stored in a post's Lexical `html` card, so the
 * content ships in Ghost's server response rather than being fetched by the browser.
 *
 * The rendered content identifies itself — each card leads with its own badge and
 * heading — so there is no hidden admin-only label. An earlier version added one for
 * the empty-shell design that this replaced.
 *
 * ---------------------------------------------------------------------------
 * Why the markup carries two sets of classes
 * ---------------------------------------------------------------------------
 * Ghost Admin injects a card's HTML raw into the editor (koenig-lexical's html card
 * does `dangerouslySetInnerHTML` into a plain <div>) and loads NONE of the theme CSS.
 * A full card therefore renders in Admin as an unstyled wall of text — every grid
 * label, value and sublabel on its own line.
 *
 * Two facts make a quiet Admin view possible without touching the public one:
 *
 *   1. Admin runs the card through DOMPurify with FORBID_TAGS: ["style"], so a <style>
 *      block inside a card is stripped there while surviving on the public site —
 *      exactly backwards from what we want. <style> is not an option.
 *   2. Admin loads its own Tailwind build (assets/index-*.css); the theme's screen.css
 *      contains none of those utilities. So a Tailwind class is styling that applies
 *      in Admin and is inert in public.
 *
 * The two stylesheets never load together, which is what lets the show/hide pair work
 * with no !important and no specificity fight:
 *
 *   .custom-card-body  is `hidden` in Admin (Tailwind), `display:block` in the theme
 *   .custom-card-admin has no Admin rule so it shows, `display:none` in the theme
 *
 * Keep Admin-facing classes to utilities verified present in Ghost's Tailwind build —
 * it is purged, so only classes Admin itself uses survive. See AGENT_LESSONS.md.
 */

const data = require("./data");

const RENDERERS = {
  "job-seat": require("./job-seat"),
  "official-brief": require("./official-brief"),
  "election-race": require("./election-race"),
  "entity-picker": require("./entity-picker"),
};

// Utilities confirmed present in Ghost 6 Admin's index-*.css and absent from the
// theme's built screen.css. Verify with scripts/check-admin-classes.js after a Ghost
// upgrade — a purged-away class silently degrades the chip to unstyled text.
const CHIP = "flex items-center gap-2 rounded border border-grey-200 bg-grey-50 px-3 py-2 select-none";
const CHIP_TYPE = "font-mono text-xs uppercase tracking-wide text-grey-700";
const CHIP_TEXT = "truncate text-sm text-grey-600";

/**
 * The one-line stand-in an editor sees in Admin in place of the full card.
 * @param {string} type card type, e.g. "job-seat"
 * @param {string} summary short human description of what this card resolved to
 * @returns {string} HTML for the chip
 */
function adminChip(type, summary) {
  return `<div class="custom-card-admin ${CHIP}">
  <span class="${CHIP_TYPE}">${data.e(type)}</span>
  <span class="${CHIP_TEXT}">${data.e(summary)}</span>
</div>`;
}

/**
 * Render one card to HTML.
 * @param {string} type card type, e.g. "job-seat"
 * @param {object} ctx routing context, e.g. { agency, seat, slug }
 * @returns {string} HTML for the card block
 */
function renderCard(type, ctx) {
  const renderer = RENDERERS[type];
  if (!renderer) throw new Error("no server renderer for card type: " + type);

  const attrs = Object.entries(renderer.attrs ? renderer.attrs(ctx) : {})
    .map(([k, v]) => ` ${k}="${data.e(v)}"`)
    .join("");
  const open = `<div class="${data.e(renderer.className || "custom-card")}" data-card-type="${data.e(type)}"${attrs}>`;

  let body;
  try {
    body = renderer.render(ctx, data);
  } catch (err) {
    // A missing record must not abort a seed run — leave a visible placeholder. This
    // one is NOT collapsed behind the chip: a broken card is precisely what an editor
    // needs to see in Admin.
    return `${open}
<div class="custom-card-error">${data.e(err.message)}</div>
</div>`;
  }

  let summary;
  try {
    summary = renderer.adminSummary ? renderer.adminSummary(ctx, data) : "";
  } catch {
    // The card itself rendered, so a summary that throws is cosmetic — fall back
    // rather than turn a working card into an error block.
    summary = "";
  }

  return `${open}
${adminChip(type, summary)}
<div class="custom-card-body hidden">
${body}
</div>
</div>`;
}

module.exports = { renderCard, adminChip, types: Object.keys(RENDERERS) };
