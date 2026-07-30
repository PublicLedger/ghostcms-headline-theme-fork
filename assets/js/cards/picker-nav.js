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

  function wire(form) {
    var select = form.querySelector(".entity-picker-select");
    if (!select) return;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (select.value) window.location.assign(select.value);
    });

    select.addEventListener("change", function () {
      if (select.value) window.location.assign(select.value);
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
