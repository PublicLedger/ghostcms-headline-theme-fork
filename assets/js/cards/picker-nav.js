/**
 * Progressive enhancement for the entity-picker.
 *
 * Cards are rendered server-side (see scripts/cards/), so nothing here is required
 * to read the page. This only upgrades the picker's <form> so choosing an option
 * navigates immediately instead of needing the Go button. With JS off the form
 * still submits and the <noscript> link list is available.
 */
(function () {
  "use strict";

  /**
   * Only same-site absolute paths are navigable. Option values come from our
   * own templates, but reading a destination out of the DOM and handing it
   * straight to location.assign would run a "javascript:" value and follow a
   * "//evil.example" one off-site. Requiring a leading "/" that is not itself
   * followed by "/" or "\" rejects both.
   * @param {string} value the selected option's value
   * @returns {string|null} the path if it is same-site, otherwise null
   */
  function safePath(value) {
    return typeof value === "string" && /^\/[^/\\]/.test(value) ? value : null;
  }

  function go(select) {
    var target = safePath(select.value);
    if (target) window.location.assign(target);
  }

  function wire(form) {
    var select = form.querySelector(".entity-picker-select");
    if (!select) return;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      go(select);
    });

    select.addEventListener("change", function () {
      go(select);
    });
  }

  function init() {
    document.querySelectorAll(".entity-picker-form").forEach(wire);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
