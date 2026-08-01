/**
 * job-seat card — what the job is. Rendered server-side at seed time.
 * Keys off ctx.seat (the post slug) -> entities/offices.json
 */

const { officeLevelLabel } = require("./constants");

module.exports = {
  className: "job-seat-card custom-card",

  attrs: ctx => ({ "data-seat": ctx.seat || "" }),

  adminSummary(ctx, data) {
    const office = data.getOffice(ctx.seat);
    if (!office) return ctx.seat || "";
    const seats = office.seats > 1 ? `${office.seats} seats` : "1 seat";
    return `${office.name} · ${seats} · ${data.currency(office.totalRaisedAllTime)} raised`;
  },

  render(ctx, data) {
    const { e, currency } = data;
    if (!ctx.seat) throw new Error("job-seat card needs a seat slug in context");

    const office = data.getOffice(ctx.seat);
    if (!office) throw new Error(`No office record for “${ctx.seat}” in the data package.`);

    const level = officeLevelLabel(office.level);
    const races = (office.elections || []).length;
    const multi = office.seats > 1;

    return `<div class="custom-card-badge-wrapper">
  <span class="custom-card-badge custom-card-badge--muted">WHAT THE JOB IS</span>
</div>

<h2 class="job-seat-title">${e(office.name)}</h2>
<p class="job-seat-intro">${e(level)} serving ${e(data.titleCase(office.jurisdiction))}. ${
      multi ? e(office.seats) + " seats share this office." : "A single-seat office."
    }</p>

<div class="custom-card-grid">
  <div class="custom-card-metric">
    <div class="custom-card-metric-label">Term length</div>
    <div class="custom-card-metric-value">${e(office.termLength)}</div>
    <div class="custom-card-metric-sublabel">years</div>
  </div>
  <div class="custom-card-metric">
    <div class="custom-card-metric-label">Seats</div>
    <div class="custom-card-metric-value">${e(office.seats)}</div>
    <div class="custom-card-metric-sublabel">${multi ? "elected members" : "elected member"}</div>
  </div>
  <div class="custom-card-metric">
    <div class="custom-card-metric-label">Raised all time</div>
    <div class="custom-card-metric-value">${e(currency(office.totalRaisedAllTime))}</div>
    <div class="custom-card-metric-sublabel">across ${e(races)} tracked ${races === 1 ? "race" : "races"}</div>
  </div>
  <div class="custom-card-metric">
    <div class="custom-card-metric-label">Average per race</div>
    <div class="custom-card-metric-value">${e(currency(office.avgRaisedPerRace))}</div>
    <div class="custom-card-metric-sublabel">what it costs to run</div>
  </div>
</div>

<div class="custom-card-footer">Source: PublicLedger campaign finance records${
      ctx.agencyName ? " · " + e(ctx.agencyName) : ""
    }</div>`;
  },
};
