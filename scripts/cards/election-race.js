/**
 * election-race card — what was on the ballot. Rendered server-side at seed time.
 *
 * Keys off ctx.slug (the post slug, e.g. "2023-primary") -> elections/by-year/{year}.json.
 * The year comes from the leading digits of the election id, which is the only link
 * between an election slug and its data file; the package has no by-id index.
 *
 * ctx.agency narrows the card to one jurisdiction. A by-year file holds every race in
 * that year statewide, but an election post lives under /election/{jurisdiction}/, so
 * showing all of them would contradict the URL the reader followed.
 */

const { partyLabel } = require("./constants");

/**
 * create a long date string from an ISO date
 * - e.g., "2023-05-16" -> "May 16, 2023" formatted in UTC
 * @param {string} iso the ISO date string
 * @returns {string} the long date string, or the original string if invalid
 */
function longDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "";
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function candidateRow(c, data) {
  const { e, currency, titleCase } = data;
  const record = data.getCandidate(c.candidateId);
  const name = titleCase(c.name || (record && record.name.full) || c.candidateId);
  const variant = c.party === "DEM" ? "primary" : "warning";

  return `      <li class="election-race-candidate">
        <span class="election-race-candidate-name">${
          record ? `<a href="/official/${e(record.slug)}/">${e(name)}</a>` : e(name)
        }</span>
        <span class="custom-card-badge custom-card-badge--${e(variant)}">${e(partyLabel(c.party))}</span>
        <span class="election-race-candidate-money">${e(currency(c.raised))} raised · ${e(
          currency(c.spent)
        )} spent</span>${
          c.resultLink
            ? `\n        <a class="election-race-result-link" href="${e(c.resultLink)}" rel="nofollow noopener" target="_blank">Official returns</a>`
            : ""
        }
      </li>`;
}

function raceBlock(race, data) {
  const { e, currency } = data;
  const seats = race.seats || 1;
  const candidates = race.candidates || [];

  return `  <div class="election-race-race">
    <div class="election-race-race-header">
      <h3 class="election-race-office">${e(race.officeName)}</h3>
      <span class="custom-card-badge">${e(seats)} ${seats === 1 ? "seat" : "seats"}</span>
    </div>${race.raceNotes ? `\n    <p class="election-race-notes">${e(race.raceNotes)}</p>` : ""}
    <ul class="election-race-candidates">
${candidates.map(c => candidateRow(c, data)).join("\n")}
    </ul>
    <p class="election-race-race-total">${e(currency(race.totalRaised))} raised across ${e(
      candidates.length
    )} ${candidates.length === 1 ? "candidate" : "candidates"}</p>
  </div>`;
}

module.exports = {
  className: "election-race-card custom-card",

  attrs: ctx => ({ "data-election": ctx.slug || ctx.seat || "" }),

  adminSummary(ctx, data) {
    const id = ctx.slug || ctx.seat || "";
    const year = (String(id).match(/^(\d{4})/) || [])[1];
    if (!year) return id;
    let races = [];
    try {
      races = (data.load(`elections/by-year/${year}.json`).races || []).filter(
        r => r.id === id || String(r.id).startsWith(id + "-")
      );
    } catch {
      return id;
    }
    if (ctx.agency) {
      races = races.filter(r => {
        const office = data.getOffice(r.office);
        return office && data.jurisdictionSlug(office) === ctx.agency;
      });
    }
    return `${id} · ${races.length} ${races.length === 1 ? "race" : "races"}`;
  },

  render(ctx, data) {
    const { e, currency } = data;
    const electionId = ctx.slug || ctx.seat;
    if (!electionId) throw new Error("election-race card needs an election slug in context");

    const year = (String(electionId).match(/^(\d{4})/) || [])[1];
    if (!year) {
      throw new Error(
        `Cannot read a year from election id “${electionId}” (expected e.g. 2023-primary).`
      );
    }

    let election;
    try {
      election = data.load(`elections/by-year/${year}.json`);
    } catch {
      throw new Error(`No election data for ${year} in the data package.`);
    }

    // A by-year file can hold several elections (primary and general), so match the
    // id prefix as well as the year.
    let races = (election.races || []).filter(
      r => r.id === electionId || String(r.id).startsWith(electionId + "-")
    );

    if (ctx.agency) {
      races = races.filter(r => {
        const office = data.getOffice(r.office);
        return office && data.jurisdictionSlug(office) === ctx.agency;
      });
    }

    const where = ctx.agencyName ? data.titleCase(ctx.agencyName) : "";
    const badge = `<div class="custom-card-badge-wrapper">
  <span class="custom-card-badge custom-card-badge--muted">ON THE BALLOT</span>
</div>`;

    if (!races.length) {
      return `${badge}
<p class="election-race-empty">No races on record for ${e(electionId)}${
        where ? " in " + e(where) : ""
      } yet.</p>`;
    }

    const candidateCount = races.reduce((n, r) => n + (r.candidates || []).length, 0);
    const raised = races.reduce((n, r) => n + (r.totalRaised || 0), 0);
    const spent = races.reduce((n, r) => n + (r.totalSpent || 0), 0);

    return `${badge}

<h2 class="election-race-title">${e(election.electionType || "Election")} · ${e(
      longDate(election.date)
    )}</h2>
<p class="election-race-intro">${e(races.length)} ${
      races.length === 1 ? "race" : "races"
    }${where ? " in " + e(where) : ""}, with ${e(candidateCount)} ${
      candidateCount === 1 ? "candidate" : "candidates"
    } on the PublicLedger record.</p>

<div class="custom-card-grid">
  <div class="custom-card-metric">
    <div class="custom-card-metric-label">Races</div>
    <div class="custom-card-metric-value">${e(races.length)}</div>
    <div class="custom-card-metric-sublabel">${where ? "in " + e(where) : "tracked"}</div>
  </div>
  <div class="custom-card-metric">
    <div class="custom-card-metric-label">Candidates</div>
    <div class="custom-card-metric-value">${e(candidateCount)}</div>
    <div class="custom-card-metric-sublabel">with finance records</div>
  </div>
  <div class="custom-card-metric">
    <div class="custom-card-metric-label">Raised</div>
    <div class="custom-card-metric-value">${e(currency(raised))}</div>
    <div class="custom-card-metric-sublabel">across these races</div>
  </div>
  <div class="custom-card-metric">
    <div class="custom-card-metric-label">Spent</div>
    <div class="custom-card-metric-value">${e(currency(spent))}</div>
    <div class="custom-card-metric-sublabel">reported to date</div>
  </div>
</div>

<div class="election-race-races">
${races.map(r => raceBlock(r, data)).join("\n")}
</div>

<div class="custom-card-footer">Source: PublicLedger election and campaign finance records</div>`;
  },
};
