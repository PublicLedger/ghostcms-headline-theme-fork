/**
 * Data Loader for PublicLedger Election & Finance Data
 * Handles loading and caching of normalized JSON data
 */

(function () {
  "use strict";

  // Cache for loaded data
  const dataCache = {};
  let metaCache = null;

  /**
   * Get the data cache key from meta.json
   * @returns {Promise<string>}
   */
  async function getCacheKey() {
    if (!metaCache) {
      try {
        const response = await fetch("/assets/built/data/meta.json");
        metaCache = await response.json();
      } catch (error) {
        console.error("Failed to load meta.json:", error);
        metaCache = { cacheKey: Date.now().toString() };
      }
    }
    return metaCache.cacheKey;
  }

  /**
   * Load JSON data from the data directory with cache busting
   * @param {string} path - Path relative to /assets/built/data/
   * @returns {Promise<Object>}
   */
  async function loadData(path) {
    // Check cache first
    if (dataCache[path]) {
      return dataCache[path];
    }

    try {
      const cacheKey = await getCacheKey();
      const url = `/assets/built/data/${path}?v=${cacheKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Verify version matches meta
      if (data.version && metaCache && data.version !== metaCache.version) {
        console.warn(
          `Version mismatch for ${path}. Expected ${metaCache.version}, got ${data.version}`
        );
      }

      // Cache the data
      dataCache[path] = data;
      return data;
    } catch (error) {
      console.error(`Failed to load ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get candidate by ID
   * @param {string} candidateId
   * @returns {Promise<Object|null>}
   */
  async function getCandidateById(candidateId) {
    const data = await loadData("entities/candidates.json");
    return data.candidates.find(c => c.id === candidateId) || null;
  }

  /**
   * Get candidate by slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  async function getCandidateBySlug(slug) {
    const data = await loadData("entities/candidates.json");
    return data.candidates.find(c => c.slug === slug) || null;
  }

  /**
   * Get office by ID or slug
   * @param {string} idOrSlug
   * @returns {Promise<Object|null>}
   */
  async function getOffice(idOrSlug) {
    const data = await loadData("entities/offices.json");
    return data.offices.find(o => o.id === idOrSlug || o.slug === idOrSlug) || null;
  }

  /**
   * Get election by year
   * @param {number|string} year
   * @returns {Promise<Object|null>}
   */
  async function getElectionByYear(year) {
    try {
      return await loadData(`elections/by-year/${year}.json`);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get campaign finance data
   * @param {string} campaignId
   * @returns {Promise<Object|null>}
   */
  async function getCampaign(campaignId) {
    try {
      return await loadData(`finance/campaigns/${campaignId}.json`);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get donor by ID
   * @param {string} donorId
   * @returns {Promise<Object|null>}
   */
  async function getDonor(donorId) {
    try {
      return await loadData(`finance/donors/${donorId}.json`);
    } catch (error) {
      // Fallback to searching in entities/donors.json
      const data = await loadData("entities/donors.json");
      const individual = data.donors.individuals.find(d => d.id === donorId);
      if (individual) return individual;

      const org = data.donors.organizations.find(d => d.id === donorId);
      return org || null;
    }
  }

  /**
   * Get all donors (summary list)
   * @returns {Promise<Object>}
   */
  async function getAllDonors() {
    return await loadData("entities/donors.json");
  }

  /**
   * Get finance aggregates
   * @returns {Promise<Object>}
   */
  async function getFinanceAggregates() {
    return await loadData("finance/aggregates.json");
  }

  /**
   * Search candidates by name
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async function searchCandidates(query) {
    const data = await loadData("entities/candidates.json");
    const searchTerm = query.toLowerCase();
    return data.candidates.filter(
      c => c.name.full.toLowerCase().includes(searchTerm) || c.slug.includes(searchTerm)
    );
  }

  /**
   * Get candidates by office
   * @param {string} officeId
   * @returns {Promise<Array>}
   */
  async function getCandidatesByOffice(officeId) {
    try {
      const index = await loadData("indexes/candidates-by-office.json");
      return index.index[officeId] || [];
    } catch (error) {
      // Fallback: filter candidates manually
      const data = await loadData("entities/candidates.json");
      return data.candidates.filter(c => c.races.some(r => r.includes(officeId)));
    }
  }

  /**
   * Format currency
   * @param {number} amount
   * @returns {string}
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format date
   * @param {string} dateString
   * @returns {string}
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  // Expose public API
  window.PublicLedgerData = {
    loadData,
    getCandidateById,
    getCandidateBySlug,
    getOffice,
    getElectionByYear,
    getCampaign,
    getDonor,
    getAllDonors,
    getFinanceAggregates,
    searchCandidates,
    getCandidatesByOffice,
    formatCurrency,
    formatDate,
    getCacheKey,
  };
})();
