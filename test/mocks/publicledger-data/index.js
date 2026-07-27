/**
 * `@publicledger/data` - Mock Package
 *
 * In production, this will be a real NPM package.
 * For development, this mock package provides the same structure.
 */

const path = require("path");

module.exports = {
  // Path to data directory
  dataPath: path.join(__dirname, "data"),

  // Metadata
  getMeta: () => require("./data/meta.json"),

  // Entity loaders
  getCandidates: () => require("./data/entities/candidates.json"),
  getOffices: () => require("./data/entities/offices.json"),
  getDonors: () => require("./data/entities/donors.json"),

  // Election data
  getElectionByYear: year => require(`./data/elections/by-year/${year}.json`),

  // Finance data
  getAggregates: () => require("./data/finance/aggregates.json"),
  getCampaign: campaignId => require(`./data/finance/campaigns/${campaignId}.json`),

  // Indexes
  getCandidatesByName: () => require("./data/indexes/candidates-by-name.json"),
  getCandidatesByOffice: () => require("./data/indexes/candidates-by-office.json"),
};
