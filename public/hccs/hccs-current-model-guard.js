(function () {
  "use strict";

  const MODE_KEY = "salga_dashboard_feed_mode";
  const params = new URLSearchParams(window.location.search);

  if (params.get("hccsSmoke") === "1") {
    try {
      window.localStorage.setItem(MODE_KEY, "HCCS");
    } catch (_) {}
  }

  function isHccs() {
    try {
      return window.localStorage.getItem(MODE_KEY) === "HCCS";
    } catch (_) {
      return false;
    }
  }

  function heading(text) {
    return Array.from(document.querySelectorAll("h1,h2,h3,h4"))
      .find(el => (el.textContent || "").trim() === text) || null;
  }

  function containerForHeading(el) {
    if (!el) return null;
    return el.closest("section") || el.parentElement;
  }

  function safePanel(title, body) {
    const h = heading(title);
    if (!h) return;
    const box = containerForHeading(h);
    if (!box || box.dataset.hccsCurrentGuard === "1") return;

    box.dataset.hccsCurrentGuard = "1";
    box.innerHTML =
      '<h3 style="margin:0 0 8px 0;font-size:20px">' + title + '</h3>' +
      '<div style="padding:10px;border-left:4px solid #f07d00;background:#fff7ed;color:#374151;font-size:12px;line-height:1.55">' +
      body +
      '</div>';
  }

  function safeCard(oldTitle, newTitle, value, primary, secondary) {
    const h = heading(oldTitle);
    if (!h) return;
    const box = containerForHeading(h);
    if (!box || box.dataset.hccsCurrentGuard === "1") return;

    box.dataset.hccsCurrentGuard = "1";
    box.innerHTML =
      '<h3 style="margin:0 0 6px 0;font-size:14px">' + newTitle + '</h3>' +
      '<div style="font-size:11px;color:#6b7280;margin-bottom:6px">Current governed HCCS model</div>' +
      '<div style="font-size:20px;font-weight:700;color:#111827;line-height:1.2">' + value + '</div>' +
      '<div style="font-size:12px;color:#6b7280;margin-top:6px;line-height:1.4">' + primary + '</div>' +
      (secondary ? '<div style="font-size:12px;color:#6b7280;line-height:1.4">' + secondary + '</div>' : '');
  }

  function statusBanner() {
    if (document.getElementById("hccs-current-model-status")) return;

    const title = Array.from(document.querySelectorAll("h1"))
      .find(el => {
        const t = (el.textContent || "").trim();
        return t === "SALGA Differentiation & Complexity Model" ||
               t === "Municipal Profile";
      });

    if (!title) return;

    const banner = document.createElement("div");
    banner.id = "hccs-current-model-status";
    banner.setAttribute("data-hccs-current-guard", "1");
    banner.style.cssText =
      "margin:8px 0 12px 0;padding:9px 11px;border-left:4px solid #f07d00;" +
      "background:#fff7ed;color:#374151;font-size:12px;line-height:1.45;border-radius:6px";
    banner.innerHTML =
      "<strong>Current HCCS model status:</strong> " +
      "All 80 canonical indicators are mapped across 213 municipalities. " +
      "Current numeric coverage is incomplete for some indicators and themes. " +
      "<strong>Capacity allocation is not computed</strong> and no six-theme overall score is shown.";

    title.insertAdjacentElement("afterend", banner);
  }

  function replaceLegacyNarrative() {
    const elements = Array.from(document.querySelectorAll("p,div,span"));

    for (const el of elements) {
      if (el.children.length > 0) continue;
      const t = (el.textContent || "").trim();

      if (t === "Map selector: capacity and support load") {
        el.textContent = "Map selector: current HCCS evidence and drivers";
      }

      if (t.startsWith("High-complexity municipalities nationally:")) {
        el.textContent =
          "Overall municipal complexity classification: Not computed under the current six-theme completeness contract.";
      }

      if (t === "Municipality score guides support targeting; it does not assign a provincial capacity level.") {
        el.textContent =
          "Current municipality indicator drivers support targeting; an overall municipal complexity score is not computed where six-theme completeness is absent.";
      }
    }
  }

  function patch() {
    if (!isHccs()) return;

    statusBanner();

    safeCard(
      "Scored municipalities",
      "Mapped municipalities",
      "213",
      "All 213 canonical municipalities are mapped across the 80-indicator architecture.",
      "Numeric theme and indicator coverage remains explicitly coverage-aware."
    );

    safeCard(
      "High-complexity municipalities",
      "Overall municipal complexity",
      "Not computed",
      "A six-theme municipal overall is blocked where complete theme coverage is absent.",
      "No missing-theme reweighting is permitted."
    );

    safeCard(
      "Highest-scoring province",
      "Provincial overall",
      "Not computed",
      "No province currently has a complete six-theme overall score.",
      "Complete province-theme scores remain available where all municipalities in that province are covered."
    );

    safeCard(
      "Capacity level coverage",
      "Capacity allocation",
      "Not computed",
      "The 1-to-4 capacity-allocation output remains blocked until the complete model contract is satisfied.",
      "The 1-to-4 indicator score scale remains active."
    );

    safePanel(
      "Capacity requirement profile",
      "<strong>Capacity allocation is not computed.</strong><br>" +
      "The current model reports only complete indicator, theme and geographic results. " +
      "A capacity level will not be inferred from missing overall scores."
    );

    safePanel(
      "Capacity and resourcing implications",
      "<strong>Current decision boundary:</strong> no capacity-allocation matrix result is published yet.<br>" +
      "Use the current indicator drivers, complete theme scores and geographic coverage views for evidence-led planning."
    );

    safeCard(
      "Complexity score",
      "Overall complexity",
      "Not computed",
      "The profile retains current indicator drivers and evidence.",
      "No six-theme municipal overall is inferred."
    );

    safeCard(
      "Provincial allocation lens",
      "Provincial allocation lens",
      "Not computed",
      "Capacity allocation is blocked under the current completeness contract.",
      "Province-theme results remain available where complete."
    );

    safeCard(
      "Profile feed",
      "Profile feed",
      "Current",
      "Municipal Profile reads the current governed HCCS adapters.",
      "All 80 canonical indicators remain mapped in the evidence contract."
    );

    replaceLegacyNarrative();
  }

  let timer = null;
  const observer = new MutationObserver(function () {
    clearTimeout(timer);
    timer = setTimeout(patch, 30);
  });

  function start() {
    patch();
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener("storage", patch);
    window.addEventListener("popstate", function () {
      setTimeout(patch, 50);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
