/**
 * entity-picker card — the dropdown on section landing pages. Rendered server-side.
 *
 * Options ship in the HTML, so the list is crawlable and the control works with
 * JavaScript disabled: it is a real <form method="get"> whose submit lands on a
 * redirect-free URL. assets/js/cards/picker-nav.js only upgrades it to navigate on
 * change, so JS is an enhancement rather than a requirement.
 */

const SOURCES = {
  offices: data =>
    data.offices().map(o => ({
      label: `${o.name} — ${data.titleCase(o.jurisdiction)}`,
      href: `/jobs/${data.jurisdictionSlug(o)}/${o.slug}/`,
      group: data.titleCase(o.jurisdiction),
    })),

  officials: data =>
    data.candidates().map(c => ({
      label: data.titleCase(c.name.full) + (c.party ? ` (${c.party})` : ""),
      href: `/official/${c.slug}/`,
      group: c.party || "Unaffiliated",
    })),

  donors: data => {
    const d = data.donors();
    const slug = name =>
      String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const rows = [];
    (d.organizations || []).forEach(o =>
      rows.push({ label: o.name, href: `/donor/${o.slug || slug(o.name)}/`, group: "Organizations" })
    );
    (d.individuals || []).forEach(i => {
      const full = i.name && i.name.full ? i.name.full : i.name;
      rows.push({
        label: data.titleCase(full),
        href: `/donor/${i.slug || slug(full)}/`,
        group: "Individuals",
      });
    });
    return rows;
  },

  elections: data => {
    const seen = new Map();
    data.offices().forEach(o =>
      (o.elections || []).forEach(id => {
        if (!seen.has(id)) {
          seen.set(id, {
            label: id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            href: `/election/${data.jurisdictionSlug(o)}/${id}/`,
            group: data.titleCase(o.jurisdiction),
          });
        }
      })
    );
    return Array.from(seen.values());
  },

  jurisdictions: data => {
    const seen = new Map();
    data.offices().forEach(o => {
      const s = data.jurisdictionSlug(o);
      if (!seen.has(s)) {
        seen.set(s, { label: data.titleCase(o.jurisdiction), href: `/lookup/${s}/` });
      }
    });
    return Array.from(seen.values());
  },
};

module.exports = {
  className: "entity-picker custom-card",

  attrs: ctx => ({ "data-source": ctx.source || "offices" }),

  adminSummary(ctx, data) {
    const source = ctx.source || "offices";
    const build = SOURCES[source];
    const count = build ? build(data).length : 0;
    return `${source} · ${count} ${count === 1 ? "option" : "options"}`;
  },

  render(ctx, data) {
    const { e } = data;
    const source = ctx.source || "offices";
    const label = ctx.label || "Choose one";
    const build = SOURCES[source];
    if (!build) throw new Error(`Unknown picker source “${source}”.`);

    const options = build(data);
    if (!options.length) throw new Error(`No ${source} in the data package yet.`);

    const groups = options.reduce((acc, o) => {
      (acc[o.group || ""] = acc[o.group || ""] || []).push(o);
      return acc;
    }, {});
    const grouped = Object.keys(groups).length > 1 && Object.keys(groups)[0] !== "";

    const opt = o => `<option value="${e(o.href)}">${e(o.label)}</option>`;
    const optionHtml = grouped
      ? Object.keys(groups)
          .sort()
          .map(g => `<optgroup label="${e(g)}">${groups[g].map(opt).join("")}</optgroup>`)
          .join("")
      : options.map(opt).join("");

    const id = `pl-picker-${e(source)}`;

    // action="/go/" is never reached with JS on. Without JS the browser submits and
    // the chosen path is visible in the query string, so the list still has value.
    return `<form class="entity-picker-form" method="get" action="/">
  <label class="entity-picker-label" for="${id}">${e(label)}</label>
  <div class="entity-picker-row">
    <select class="entity-picker-select" id="${id}" name="go">
      <option value="">${e(label)}…</option>
      ${optionHtml}
    </select>
    <button class="entity-picker-go" type="submit">Go</button>
  </div>
  <p class="entity-picker-count">${e(options.length)} available</p>
</form>

<noscript>
  <ul class="entity-picker-list">
${options.map(o => `    <li><a href="${e(o.href)}">${e(o.label)}</a></li>`).join("\n")}
  </ul>
</noscript>`;
  },
};