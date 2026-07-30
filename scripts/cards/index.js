/**
 * Server-side card renderers.
 *
 * Each renderer returns the full HTML stored in a post's Lexical `html` card, so the
 * content ships in Ghost's server response rather than being fetched by the browser.
 *
 * The rendered content identifies itself — each card leads with its own badge and
 * heading — so there is no hidden admin-only label. An earlier version added one for
 * the empty-shell design that this replaced.
 */

const data = require("./data");

const RENDERERS = {
  "job-seat": require("./job-seat"),
  "official-brief": require("./official-brief"),
  "entity-picker": require("./entity-picker"),
};

/**
 * Render one card to HTML.
 * @param {string} type card type, e.g. "job-seat"
 * @param {object} ctx routing context, e.g. { agency, seat, slug }
 * @returns {string} HTML for the card block
 */
function renderCard(type, ctx) {
  const renderer = RENDERERS[type];
  if (!renderer) throw new Error("no server renderer for card type: " + type);

  let body;
  try {
    body = renderer.render(ctx, data);
  } catch (err) {
    // A missing record must not abort a seed run — leave a visible placeholder.
    body = `<div class="custom-card-error">${data.e(err.message)}</div>`;
  }

  const attrs = Object.entries(renderer.attrs ? renderer.attrs(ctx) : {})
    .map(([k, v]) => ` ${k}="${data.e(v)}"`)
    .join("");

  return `<div class="${data.e(renderer.className || "custom-card")}" data-card-type="${data.e(type)}"${attrs}>
${body}
</div>`;
}

module.exports = { renderCard, types: Object.keys(RENDERERS) };
