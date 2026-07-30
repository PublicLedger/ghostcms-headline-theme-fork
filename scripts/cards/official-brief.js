/**
 * official-brief card — who currently holds the seat. Rendered server-side.
 *
 * On a seat page (ctx.seat -> offices.json) it renders every incumbent, since an
 * office can have several (county commissioner has 3 seats). On an official page
 * (ctx.slug -> candidates.json) it renders that one person.
 */

const { partyLabel } = require("./constants");

function person(p, data) {
  const { e, currency, titleCase } = data;
  const party = partyLabel(p.party);
  const variant = p.party === "DEM" ? "primary" : "warning";

  return `  <div class="official-brief-person">
    <div class="official-brief-person-header">
      <span class="official-brief-name">${e(titleCase(p.name.full))}</span>
      <span class="custom-card-badge custom-card-badge--${e(variant)}">${e(party)}</span>
    </div>
    <div class="official-brief-figures">
      <div class="official-brief-figure">
        <span class="official-brief-figure-label">Raised</span>
        <span class="official-brief-figure-value">${e(currency(p.totalRaised))}</span>
      </div>
      <div class="official-brief-figure">
        <span class="official-brief-figure-label">Spent</span>
        <span class="official-brief-figure-value">${e(currency(p.totalSpent))}</span>
      </div>
      <div class="official-brief-figure">
        <span class="official-brief-figure-label">Cash on hand</span>
        <span class="official-brief-figure-value">${e(currency(p.cashOnHand))}</span>
      </div>
    </div>${
      p.financeStatus
        ? `\n    <div class="official-brief-status">Filing status: ${e(p.financeStatus)}</div>`
        : ""
    }
  </div>`;
}

module.exports = {
  className: "official-brief-card custom-card",

  attrs: ctx => ({ "data-seat": ctx.seat || ctx.slug || "" }),

  render(ctx, data) {
    const { e } = data;
    const key = ctx.seat || ctx.slug;
    if (!key) throw new Error("official-brief card needs a seat or official slug in context");

    let holders = [];
    let heading;
    let intro;

    const office = data.getOffice(key);
    if (office) {
      holders = (office.incumbents || []).map(id => data.getCandidate(id)).filter(Boolean);
      heading = holders.length > 1 ? "Who holds these seats" : "Who holds this seat";
      intro =
        (holders.length > 1
          ? `${holders.length} people currently serve as `
          : "Currently serving as ") +
        office.name +
        ".";
      if (!holders.length) {
        return `<div class="custom-card-badge-wrapper">
  <span class="custom-card-badge custom-card-badge--muted">OFFICIAL BRIEF</span>
</div>
<p class="official-brief-empty">No officeholder on record for ${e(office.name)} yet.</p>`;
      }
    } else {
      const candidate = data.getCandidate(key);
      if (!candidate) {
        throw new Error(`No office or official record for “${key}” in the data package.`);
      }
      holders = [candidate];
      heading = "Who this is";
      intro = `${data.titleCase(candidate.name.full)} on the PublicLedger record.`;
    }

    return `<div class="custom-card-badge-wrapper">
  <span class="custom-card-badge custom-card-badge--muted">OFFICIAL BRIEF</span>
</div>

<h2 class="official-brief-title">${e(heading)}</h2>
<p class="official-brief-intro">${e(intro)}</p>

<div class="official-brief-people">
${holders.map(p => person(p, data)).join("\n")}
</div>

<div class="custom-card-footer">Source: PublicLedger campaign finance records</div>`;
  },
};
