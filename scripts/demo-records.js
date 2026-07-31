/**
 * The demo record per collection — one for every permalink shape in routes.yaml.
 *
 * Shared by seed-demo-records.sh (which creates them) and cards-report.js (which
 * checks, without touching Ghost, that the data package can actually fill their
 * cards). Keeping one list means the report can never drift from what gets seeded.
 *
 * Slugs are taken from the mock `@publicledger/data` package so the cards resolve
 * against real records rather than inventing placeholders.
 */

module.exports = [
  // type, parent tag ("" for single-segment collections), slug, title
  { type: "job", parent: "lancaster-county", slug: "county-commissioner", title: "County Commissioner" },
  { type: "official", parent: "", slug: "alice-yoder", title: "Alice Yoder" },
  { type: "election", parent: "lancaster-county", slug: "2023-primary", title: "2023 Primary" },
  { type: "donor", parent: "", slug: "pa-chamber-pac", title: "PA Chamber PAC" },
  { type: "lookup", parent: "", slug: "lancaster-county", title: "Lancaster County" },
  {
    type: "finance",
    parent: "",
    slug: "lancaster-county-finance",
    title: "Lancaster County Campaign Finance",
  },
];
