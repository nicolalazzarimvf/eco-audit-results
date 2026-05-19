(function () {
  "use strict";
  console.log("optimizely.js loaded");
  try {
    window.__ecoAuditScriptLoaded = true;
    console.info("[CRO-674 Eco Audit] script loaded");
  } catch (e) {
    /* no-op */
  }

  var CONFIG = {
    ecoAuditUrl:
      window.__ECO_AUDIT_TYP_URL__ || "https://eco-audit-next.vercel.app/",
    // Optional endpoint returning { uprn, lat, lng, address, paon, street } for postcode.
    // Example: https://example.com/location-lookup?postcode=SW1A1AA
    locationLookupEndpoint: window.__ECO_AUDIT_LOOKUP_ENDPOINT__ || "",
    lookupTimeoutMs: 7000,
    debug: false,
    billAnswerId: "46ce875b-361e-11f0-b929-026b0caa8275",
    hasEvAnswerId: "b9f10adf-995a-11e7-bbea-02e4563f24a3",
    homeownerAnswerId: "a2f8b4ab-f96c-11e4-824b-22000a699fb3",
    propertyTypeAnswerId: "128a72ad-041e-11ed-a6b2-062f1bcd6de3",
    postcodeAnswerKey: "answers[primary_address_postalcode]",
  };

  var LOG_PREFIX = "[CRO-674 Eco Audit]";
  var alreadyApplied = false;
  var blockHostRedirectUntil = 0;
  var debugEvents = (window.__ecoAuditDebugEvents = window.__ecoAuditDebugEvents || []);
  var nativeSetTimeout = window.setTimeout.bind(window);
  var isProjectSolarTypPage =
    window.location.hostname === "quotes.theecoexperts.co.uk" &&
    window.location.pathname.indexOf("/typ/project-solar/sp-uk/") === 0;
  var isLegacyRedirectInterceptionEnabled = false;
  var STORED_PAYLOAD_KEY = "__ecoAuditRedirectPayload";

  function startEarlyRedirectNeutralizer() {
    var path = "";
    try {
      path = String(window.location && window.location.pathname ? window.location.pathname : "");
    } catch (_) {
      path = "";
    }
    if (path.indexOf("/5-reasons-to-install-solar-panels/") === -1) return;

    var startedAt = Date.now();
    var neutralizeForMs = 30000;
    var tick = function () {
      if (Date.now() - startedAt > neutralizeForMs) return;
      try {
        if (window.redirectUrlAfterSubmission) {
          window.redirectUrlAfterSubmission = "";
          captureDebugEvent("early-redirect-neutralized");
        }
      } catch (_) {
        /* no-op */
      }
      nativeSetTimeout(tick, 100);
    };
    tick();
  }

  if (isLegacyRedirectInterceptionEnabled && !isProjectSolarTypPage) {
    startEarlyRedirectNeutralizer();
  }

  function shouldBlockHostRedirectCallback(callback) {
    if (typeof callback !== "function") return false;
    var callbackSource = "";
    try {
      callbackSource = String(callback);
    } catch (_) {
      callbackSource = "";
    }
    return (
      callbackSource.indexOf("window.location.href = redirectUrlAfterSubmission") !== -1 ||
      callbackSource.indexOf("redirectUrlAfterSubmission + '?sid='") !== -1
    );
  }

  window.setTimeout = function (callback, delay) {
    if (
      isLegacyRedirectInterceptionEnabled &&
      !isProjectSolarTypPage &&
      shouldBlockHostRedirectCallback(callback)
    ) {
      log("Blocked host-level redirect timeout (global hard block).");
      captureDebugEvent("host-redirect-timeout-blocked-hard");
      return nativeSetTimeout(function () {}, delay);
    }

    if (Date.now() < blockHostRedirectUntil && typeof callback === "function") {
      log("Host redirect protection window active.", { delay: delay || 0 });
    }

    return nativeSetTimeout(callback, delay);
  };

  function isDebugEnabled() {
    var search = "";
    try {
      search = String(window.location && window.location.search ? window.location.search : "");
    } catch (e) {
      /* no-op */
    }
    return (
      CONFIG.debug === true ||
      /(?:\?|&)ecoAuditDebug=(1|true)(?:&|$)/i.test(search) ||
      /(?:\?|&)optly_qa=true(?:&|$)/i.test(search)
    );
  }

  function log() {
    if (!isDebugEnabled()) return;
    try {
      var args = Array.prototype.slice.call(arguments);
      debugEvents.push({
        ts: new Date().toISOString(),
        args: args.map(function (a) {
          try {
            return typeof a === "string" ? a : JSON.stringify(a);
          } catch (_) {
            return String(a);
          }
        }),
      });
      args.unshift(LOG_PREFIX);
      console.log.apply(console, args);
    } catch (e) {
      /* no-op */
    }
  }

  function captureDebugEvent(label, payload) {
    try {
      debugEvents.push({
        ts: new Date().toISOString(),
        label: label,
        payload: payload || null,
      });
    } catch (_) {
      /* no-op */
    }
  }

  function toString(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeLower(value) {
    return toString(value).toLowerCase();
  }

  function normalizePostcode(raw) {
    var compact = toString(raw).replace(/\s+/g, "").toUpperCase();
    if (!compact) return "";
    if (compact.length <= 3) return compact;
    return compact.slice(0, -3) + " " + compact.slice(-3);
  }

  function asBoolean01(value) {
    var v = normalizeLower(value);
    return v === "yes" || v === "1" || v === "true" ? "1" : "0";
  }

  function parseMonthlyBill(raw) {
    var value = normalizeLower(raw);
    if (!value) return "";
    if (value.indexOf("under") !== -1 && value.indexOf("100") !== -1) return "100";
    if (value.indexOf("100") !== -1 && value.indexOf("200") !== -1) return "150";
    if (value.indexOf("200") !== -1 && value.indexOf("300") !== -1) return "250";
    if (value.indexOf("300") !== -1 && value.indexOf("400") !== -1) return "350";
    if (value.indexOf("400") !== -1 || value.indexOf("over") !== -1) return "450";
    var numeric = value.match(/[\d.]+/);
    return numeric ? numeric[0] : "";
  }

  function persistPayloadForRedirect(payload) {
    try {
      sessionStorage.setItem(STORED_PAYLOAD_KEY, JSON.stringify(payload || {}));
      captureDebugEvent("payload-stored-for-redirect", {
        postcode: payload && payload.postcode ? payload.postcode : null,
      });
    } catch (_) {
      /* no-op */
    }
  }

  function readStoredPayload() {
    try {
      var raw = sessionStorage.getItem(STORED_PAYLOAD_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.postcode) return null;
      return {
        uprn: toString(parsed.uprn || ""),
        lat: toString(parsed.lat || ""),
        lng: toString(parsed.lng || ""),
        address: toString(parsed.address || ""),
        postcode: normalizePostcode(parsed.postcode || ""),
        paon: toString(parsed.paon || ""),
        street: toString(parsed.street || ""),
        bill: toString(parsed.bill || ""),
        hev: toString(parsed.hev || "0"),
      };
    } catch (_) {
      return null;
    }
  }

  function writePayloadToCurrentUrl(payload) {
    try {
      var current = new URL(window.location.href);
      if (payload.uprn) current.searchParams.set("uprn", payload.uprn);
      if (payload.lat) current.searchParams.set("lat", payload.lat);
      if (payload.lng) current.searchParams.set("lng", payload.lng);
      if (payload.address) current.searchParams.set("address", payload.address);
      if (payload.postcode) current.searchParams.set("postcode", payload.postcode);
      if (payload.paon) current.searchParams.set("paon", payload.paon);
      if (payload.street) current.searchParams.set("street", payload.street);
      if (payload.bill) current.searchParams.set("bill", payload.bill);
      current.searchParams.set("hev", payload.hev || "0");
      current.searchParams.set("src", "optimizely");
      window.history.replaceState({}, "", current.toString());
      captureDebugEvent("payload-written-to-url", {
        postcode: payload.postcode || null,
        hasLatLng: Boolean(payload.lat && payload.lng),
      });
    } catch (_) {
      /* no-op */
    }
  }

  function getOptimizelyInfo() {
    var dl = Array.isArray(window.dataLayer) ? window.dataLayer : [];
    for (var i = dl.length - 1; i >= 0; i--) {
      if (dl[i] && dl[i].event === "optimizelyExperimentData") {
        return dl[i].experimentInfo || {};
      }
    }
    return {};
  }

  function setControlledRedirect(url) {
    var finalUrl = toString(url);
    try {
      window.redirectUrlAfterSubmission = finalUrl;
      captureDebugEvent("redirect-set", { redirectUrl: finalUrl });
      log("Redirect assigned", { redirectUrl: finalUrl });
    } catch (e) {
      captureDebugEvent("redirect-set-failed", { error: e && e.message, redirectUrl: finalUrl });
      log("Redirect assignment failed", { error: e && e.message, redirectUrl: finalUrl });
    }
  }

  function keepRedirectDisabled(durationMs) {
    if (!isLegacyRedirectInterceptionEnabled || isProjectSolarTypPage) {
      return null;
    }
    var stopAt = Date.now() + (durationMs || 10000);
    blockHostRedirectUntil = stopAt;
    try {
      window.redirectUrlAfterSubmission = "";
    } catch (_) {
      /* no-op */
    }
    var interval = nativeSetTimeout(function tick() {
      if (Date.now() >= stopAt) return;
      try {
        window.redirectUrlAfterSubmission = "";
      } catch (_) {
        /* no-op */
      }
      nativeSetTimeout(tick, 120);
    }, 120);
    return interval;
  }

  function getFormHostElement() {
    var formIframe = document.querySelector('iframe[id^="mvfFormWidget-"], iframe[id^="mvfFormWidget"]');
    if (!formIframe) return null;
    return formIframe.closest("div") || formIframe.parentElement || null;
  }

  function findTypAnchorElement() {
    var headings = document.querySelectorAll("h1,h2,h3,h4,strong,p,div,span");
    for (var i = 0; i < headings.length; i++) {
      var text = toString(headings[i].textContent || "");
      if (text.indexOf("Why 50,000 UK Homes Trust Project Solar") !== -1) {
        return headings[i].closest("section,div,article") || headings[i];
      }
    }
    return null;
  }

  function ensureTypInjectedBlock() {
    var existing = document.getElementById("eco-audit-injected-block");
    if (existing) return existing;

    var root = document.getElementById("eco-audit-app-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "eco-audit-app-root";
      root.style.minHeight = "100vh";
      root.style.background = "#edf4f8";
      root.style.padding = "0";
      root.style.margin = "0 0 18px";
      root.innerHTML =
        '<section id="eco-audit-injected-block" style="max-width:1140px;margin:0 auto;padding:18px 16px 28px;">' +
        '<div id="eco-audit-panel-shell"></div>' +
        '<div id="eco-audit-report-shell"></div>' +
        "</section>";

      var anchor =
        document.querySelector("main") ||
        document.querySelector("#content") ||
        document.querySelector(".container");

      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(root, anchor);
        captureDebugEvent("typ-root-inserted-before-main");
      } else if (document.body) {
        document.body.insertBefore(root, document.body.firstChild);
        captureDebugEvent("typ-root-inserted-before-body-first-child");
      } else {
        return null;
      }
    }

    return document.getElementById("eco-audit-injected-block");
  }

  function isTypReportMounted() {
    return Boolean(document.getElementById("eco-audit-results-iframe"));
  }

  function mountTypReportWithRetry(url) {
    if (!isProjectSolarTypPage || !url) {
      return Promise.resolve(false);
    }

    var delays = [0, 150, 400, 800, 1500, 3000];
    var attemptIndex = 0;

    function runAttempt() {
      if (isTypReportMounted()) {
        return Promise.resolve(true);
      }
      if (attemptIndex >= delays.length) {
        captureDebugEvent("typ-mount-gave-up", { url: url });
        return Promise.resolve(false);
      }

      var delayMs = delays[attemptIndex];
      if (attemptIndex > 0) {
        captureDebugEvent("typ-mount-retry", { attempt: attemptIndex, delayMs: delayMs });
      }
      attemptIndex += 1;

      return waitMs(delayMs).then(function () {
        return mountDetailedReportInContent(url).then(function () {
          if (isTypReportMounted()) {
            return true;
          }
          return runAttempt();
        });
      });
    }

    if (document.readyState !== "complete") {
      window.addEventListener(
        "load",
        function onWindowLoad() {
          if (isTypReportMounted()) return;
          captureDebugEvent("typ-mount-retry", { attempt: "load", delayMs: 0 });
          mountDetailedReportInContent(url);
        },
        { once: true }
      );
    }

    return runAttempt();
  }

  function mountTypReportFromPayload(payload) {
    return mountTypReportWithRetry(buildDetailedReportUrl(payload));
  }

  function maybeRemountTypReportFromPayload() {
    if (!isProjectSolarTypPage) return;
    var payload = getPayloadFromCurrentUrl() || getPayloadFromDataLayer() || readStoredPayload();
    if (!payload || !payload.postcode) return;
    mountTypReportFromPayload(payload);
  }

  function getPanelMountElement() {
    if (isProjectSolarTypPage) {
      var typBlock = ensureTypInjectedBlock();
      if (!typBlock) return null;
      return typBlock.querySelector("#eco-audit-panel-shell") || typBlock;
    }

    var existing = document.getElementById("eco-audit-postcode-panel");
    if (existing) return existing;

    var transition = document.querySelector(".formTransitionContainer");
    if (transition) return transition;

    var formHost = getFormHostElement();
    if (!formHost || !formHost.parentElement) return null;

    var fallback = document.getElementById("eco-audit-postcode-panel-fallback");
    if (fallback) return fallback;

    fallback = document.createElement("div");
    fallback.id = "eco-audit-postcode-panel-fallback";
    fallback.setAttribute("data-eco-audit-panel-fallback", "1");
    fallback.style.display = "block";
    fallback.style.width = "100%";
    fallback.style.maxWidth = "710px";
    fallback.style.margin = "12px auto 0";
    formHost.parentElement.insertBefore(fallback, formHost.nextSibling);
    captureDebugEvent("panel-fallback-created");
    return fallback;
  }

  function waitForPanelMount(timeoutMs) {
    var startedAt = Date.now();
    return new Promise(function (resolve) {
      (function poll() {
        var mount = getPanelMountElement();
        if (mount) {
          resolve(mount);
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          resolve(null);
          return;
        }
        nativeSetTimeout(poll, 150);
      })();
    });
  }

  function getAppOrigin() {
    try {
      return new URL(CONFIG.ecoAuditUrl).origin;
    } catch (_) {
      return "";
    }
  }

  function fetchAddressOptions(postcode) {
    var appOrigin = getAppOrigin();
    if (!appOrigin) return Promise.resolve([]);
    var endpoint =
      appOrigin +
      "/api/addresses?postcode=" +
      encodeURIComponent(postcode.replace(/\s+/g, ""));
    return fetchWithTimeout(endpoint, CONFIG.lookupTimeoutMs)
      .then(function (payload) {
        return Array.isArray(payload && payload.addresses) ? payload.addresses : [];
      })
      .catch(function () {
        return [];
      });
  }

  function toStreetFromLine1(line1) {
    var compact = toString(line1);
    if (!compact) return "";
    var parts = compact.split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  }

  function closeChameleonModal() {
    var closeButton = document.querySelector(".js-chameleon-overlay-close");
    if (closeButton && typeof closeButton.click === "function") {
      closeButton.click();
      captureDebugEvent("modal-close-clicked");
      return;
    }
    var overlay = document.querySelector(".js-chameleon-overlay");
    if (overlay) {
      overlay.style.display = "none";
      captureDebugEvent("modal-close-fallback-hidden");
    }
  }

  function waitMs(ms) {
    return new Promise(function (resolve) {
      nativeSetTimeout(resolve, ms);
    });
  }

  function runAddressSubmitLoader() {
    var panel = document.getElementById("eco-audit-postcode-panel");
    if (!panel) return Promise.resolve();
    panel.innerHTML =
      '<div id="eco-audit-submit-loader" style="padding:16px 8px;">' +
      '<div style="font-size:18px;font-weight:700;color:#0b3342;margin-bottom:6px;">Preparing your accurate report</div>' +
      '<p id="eco-audit-submit-loader-text" style="margin:0 0 10px;color:#486170;font-size:14px;">Validating your selected address...</p>' +
      '<div style="height:8px;background:#e5f0f5;border-radius:999px;overflow:hidden;">' +
      '<div style="height:100%;width:35%;background:#0fb356;animation:ecoAuditLoading 1.2s ease-in-out infinite alternate;"></div>' +
      "</div>" +
      "</div>";
    var textNode = document.getElementById("eco-audit-submit-loader-text");
    return waitMs(500)
      .then(function () {
        if (textNode) textNode.textContent = "Calculating personalised savings...";
        return waitMs(700);
      })
      .then(function () {
        if (textNode) textNode.textContent = "Building your detailed report sections...";
        return waitMs(700);
      });
  }

  function mountDetailedReportInContent(url) {
    var targetHost = null;
    if (isProjectSolarTypPage) {
      var typBlock = ensureTypInjectedBlock();
      targetHost = typBlock ? typBlock.querySelector("#eco-audit-report-shell") : null;
    }
    if (!targetHost) {
      targetHost = document.querySelector("#content") || document.querySelector("main") || document.body;
    }
    if (!targetHost) return Promise.resolve(false);

    var iframe = document.getElementById("eco-audit-results-iframe");
    var loader = document.getElementById("eco-audit-content-loader");
    var hasExistingShell = Boolean(
      iframe &&
        iframe.closest &&
        iframe.closest("#eco-audit-content-shell") &&
        targetHost.contains(iframe)
    );

    if (!hasExistingShell) {
      targetHost.innerHTML =
        '<div id="eco-audit-content-shell" style="max-width:1140px;margin:18px auto;padding:0 16px 32px;">' +
        '<div id="eco-audit-content-loader" style="background:#fff;border:1px solid #dce8ef;border-radius:12px;padding:14px;margin-bottom:10px;color:#365463;font-size:14px;">Loading full report cards and calculations...</div>' +
        '<iframe id="eco-audit-results-iframe" title="Detailed Eco Audit report" src="' +
        String(url).replace(/"/g, "&quot;") +
        '" style="width:100%;height:900px;border:0;background:#fff;display:block;border-radius:12px;" loading="eager" referrerpolicy="origin-when-cross-origin"></iframe>' +
        "</div>";
      window.scrollTo({ top: 0, behavior: "smooth" });
      iframe = document.getElementById("eco-audit-results-iframe");
      loader = document.getElementById("eco-audit-content-loader");
    } else {
      if (loader) loader.style.display = "block";
      if (iframe && iframe.src !== url) {
        iframe.src = url;
      }
    }
    captureDebugEvent("detailed-report-mounted-in-content", { url: url });
    return new Promise(function (resolve) {
      if (!iframe) {
        resolve(false);
        return;
      }
      iframe.onload = function () {
        if (loader) loader.style.display = "none";
        resolve(true);
      };
      nativeSetTimeout(function () {
        if (loader) loader.style.display = "none";
        resolve(true);
      }, 5500);
    });
  }

  function buildSummaryKpis(payload) {
    var annualEstimate = "";
    if (payload.bill) {
      var billNum = Number(payload.bill);
      if (!isNaN(billNum) && billNum > 0) {
        annualEstimate = Math.round(billNum * 12 * 0.22);
      }
    }
    var items = [];
    if (payload.postcode) items.push("Postcode area: " + payload.postcode);
    if (annualEstimate) items.push("Estimated annual saving: ~£" + annualEstimate);
    if (payload.hev === "1") items.push("EV household detected");
    return items;
  }

  function renderPostcodePanel(payload) {
    if (isProjectSolarTypPage) {
      captureDebugEvent("postcode-panel-skipped-typ-embedded-in-iframe");
      return Promise.resolve(true);
    }
    return waitForPanelMount(10000).then(function (mount) {
      if (!mount) {
        captureDebugEvent("panel-mount-missing");
        return false;
      }
      mount.style.display = "block";
      var existingPanel = document.getElementById("eco-audit-postcode-panel");
      if (!existingPanel) {
        existingPanel = document.createElement("section");
        existingPanel.id = "eco-audit-postcode-panel";
        existingPanel.style.padding = "16px";
        existingPanel.style.background = "#fff";
        existingPanel.style.border = "1px solid #dce3ea";
        existingPanel.style.borderRadius = "12px";
        existingPanel.style.marginTop = "10px";
        existingPanel.style.fontFamily = "'Be Vietnam Pro',Arial,sans-serif";
        mount.appendChild(existingPanel);
      }
      var kpis = buildSummaryKpis(payload);
      var kpiHtml = kpis
        .map(function (item) {
          return (
            '<div style="padding:6px 10px;border:1px solid #dce3ea;border-radius:999px;font-size:12px;color:#244655;background:#f8fbfd;">' +
            item +
            "</div>"
          );
        })
        .join("");
      existingPanel.innerHTML =
        '<div style="background:linear-gradient(180deg,#f7fcff 0%,#f5fbf9 100%);border:1px solid #d9eaf1;border-radius:14px;padding:14px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
        '<div>' +
        '<div style="font-size:11px;color:#547080;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Postcode average report</div>' +
        '<h3 style="font-size:22px;line-height:1.2;margin:0;color:#0a2533;">Your report is ready</h3>' +
        '<p style="margin:6px 0 0;font-size:14px;line-height:1.45;color:#455865;">You are viewing postcode-average insights. Add your address below to unlock accurate house-level calculations.</p>' +
        "</div>" +
        '<div style="padding:7px 10px;border-radius:999px;border:1px solid #cde2ec;background:#fff;color:#0f4559;font-size:12px;font-weight:700;">AVG mode</div>' +
        "</div>" +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 10px;">' +
        kpiHtml +
        "</div>" +
        '<button type="button" id="eco-audit-address-load" style="padding:10px 14px;border-radius:10px;border:1px solid #b8d2de;background:#fff;color:#123746;cursor:pointer;font-weight:600;">Find addresses</button>' +
        '<div id="eco-audit-address-block" style="margin-top:10px;display:none;">' +
        '<label for="eco-audit-address-select" style="font-size:13px;color:#244655;display:block;margin-bottom:6px;font-weight:600;">Select your address</label>' +
        '<select id="eco-audit-address-select" style="width:100%;padding:11px;border:1px solid #c9d7e0;border-radius:10px;background:#fff;color:#0a2533;font-size:14px;"><option value="">Choose an address...</option></select>' +
        '<label style="display:flex;align-items:flex-start;gap:8px;margin-top:10px;font-size:12px;color:#1f4d60;">' +
        '<input type="checkbox" id="eco-audit-privacy-tick" style="margin-top:2px;inline-size:16px;block-size:16px;accent-color:#0c8f49;border:1px solid #2f6a82;background:#fff;" />' +
        '<span>I consent to using my address data for an accurate report and accept the <a href="https://www.theecoexperts.co.uk/privacy-policy" target="_blank" rel="noreferrer">privacy policy</a>.</span>' +
        "</label>" +
        '<button type="button" id="eco-audit-confirm-address" disabled style="margin-top:10px;padding:11px 14px;border-radius:10px;border:1px solid #0b8c45;background:#0fb356;color:#fff;opacity:0.45;cursor:not-allowed;font-weight:700;width:100%;">Get accurate report</button>' +
        '<div id="eco-audit-address-error" style="margin-top:8px;font-size:12px;color:#a62a24;"></div>' +
        "</div>" +
        "</div>";

      var loadBtn = document.getElementById("eco-audit-address-load");
      var block = document.getElementById("eco-audit-address-block");
      var select = document.getElementById("eco-audit-address-select");
      var privacy = document.getElementById("eco-audit-privacy-tick");
      var confirmBtn = document.getElementById("eco-audit-confirm-address");
      var errorEl = document.getElementById("eco-audit-address-error");
      var addressOptions = [];

      function refreshConfirmState() {
        var enabled = Boolean(select && select.value) && Boolean(privacy && privacy.checked);
        if (!confirmBtn) return;
        confirmBtn.disabled = !enabled;
        confirmBtn.style.opacity = enabled ? "1" : "0.45";
        confirmBtn.style.cursor = enabled ? "pointer" : "not-allowed";
      }

      if (loadBtn) {
        loadBtn.addEventListener("click", function () {
          if (!block || !select) return;
          block.style.display = "block";
          loadBtn.disabled = true;
          loadBtn.textContent = "Loading...";
          fetchAddressOptions(payload.postcode || "")
            .then(function (options) {
              addressOptions = options;
              select.innerHTML = '<option value="">Choose an address...</option>';
              options.forEach(function (option, idx) {
                var opt = document.createElement("option");
                opt.value = String(idx);
                opt.textContent = toString(option.label || option.line1 || option.postcode);
                opt.style.color = "#0a2533";
                select.appendChild(opt);
              });
              if (errorEl) {
                if (options.length === 0) {
                  errorEl.style.color = "#a62a24";
                  errorEl.textContent = "No addresses found for this postcode.";
                } else {
                  errorEl.style.color = "#1b6b3a";
                  errorEl.textContent = options.length + " addresses found.";
                }
              }
              captureDebugEvent("address-options-loaded", { count: options.length });
            })
            .finally(function () {
              loadBtn.disabled = false;
              loadBtn.textContent = "Find addresses";
            });
        });
      }

      if (select) {
        select.addEventListener("change", refreshConfirmState);
      }
      if (privacy) {
        privacy.addEventListener("change", refreshConfirmState);
      }

      if (confirmBtn) {
        confirmBtn.addEventListener("click", function () {
          var idx = Number(select && select.value);
          var selected = addressOptions[idx];
          if (!selected) {
            if (errorEl) errorEl.textContent = "Select an address to continue.";
            return;
          }
          if (!privacy || !privacy.checked) {
            if (errorEl) errorEl.textContent = "Please confirm privacy consent first.";
            return;
          }
          var detailedPayload = {
            uprn: payload.uprn || "",
            lat: payload.lat || "",
            lng: payload.lng || "",
            address: toString(selected.line1),
            postcode: normalizePostcode(selected.postcode || payload.postcode),
            paon: toString(selected.line1).split(/\s+/)[0] || "",
            street: toStreetFromLine1(selected.line1),
            bill: payload.bill || "",
            hev: payload.hev || "0",
          };
          var detailedUrl = buildDetailedReportUrl(detailedPayload) + "&accuracy=address";
          confirmBtn.disabled = true;
          runAddressSubmitLoader()
            .then(function () {
              return mountTypReportWithRetry(detailedUrl);
            })
            .then(function () {
              if (!isProjectSolarTypPage) {
                closeChameleonModal();
              }
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                event: "ecoAuditDetailedReportOpened",
                postcode: detailedPayload.postcode,
                address: detailedPayload.address || null,
                reportUrl: detailedUrl,
              });
              captureDebugEvent("detailed-report-triggered", detailedPayload);
            });
        });
      }

      captureDebugEvent("postcode-panel-rendered", payload);
      return true;
    });
  }

  function attachIframeResizeListener() {
    window.addEventListener("message", function (event) {
      var data = event && event.data ? event.data : null;
      if (!data || data.source !== "eco-audit-app" || data.type !== "ecoAuditResize") {
        return;
      }
      var nextHeight = Number(data.height || 0);
      if (!nextHeight) return;
      var iframe = document.getElementById("eco-audit-results-iframe");
      if (!iframe) return;
      var safeHeight = Math.max(560, Math.min(1800, Math.round(nextHeight + 10)));
      iframe.style.height = safeHeight + "px";
      captureDebugEvent("results-iframe-resized", { height: safeHeight });
    });
  }

  function lookupLocationFromPostcode(postcode) {
    // If a custom lookup endpoint is provided, use it.
    if (CONFIG.locationLookupEndpoint) {
      var endpoint = CONFIG.locationLookupEndpoint;
      var separator = endpoint.indexOf("?") === -1 ? "?" : "&";
      var url = endpoint + separator + "postcode=" + encodeURIComponent(postcode.replace(/\s+/g, ""));
      log("Running custom postcode lookup", { postcode: postcode, url: url });
      return fetchWithTimeout(url, CONFIG.lookupTimeoutMs).then(function (payload) {
        log("Custom postcode lookup success", payload);
        return {
          uprn: toString(payload && payload.uprn),
          lat: toString(payload && payload.lat),
          lng: toString(payload && payload.lng),
          address: toString(payload && payload.address),
          paon: toString(payload && payload.paon),
          street: toString(payload && payload.street),
        };
      });
    }

    // Fallback: public postcodes.io for lat/lng only.
    var postcodesIoUrl =
      "https://api.postcodes.io/postcodes/" +
      encodeURIComponent(postcode.replace(/\s+/g, ""));
    log("Running postcodes.io lookup", { postcode: postcode, url: postcodesIoUrl });
    return fetchWithTimeout(postcodesIoUrl, CONFIG.lookupTimeoutMs)
      .then(function (payload) {
        log("postcodes.io lookup success", payload);
        var result = payload && payload.result ? payload.result : {};
        return {
          uprn: "",
          lat: toString(result.latitude),
          lng: toString(result.longitude),
          address: "",
          paon: "",
          street: "",
        };
      })
      .catch(function () {
        log("postcodes.io lookup failed");
        return {
          uprn: "",
          lat: "",
          lng: "",
          address: "",
          paon: "",
          street: "",
        };
      });
  }

  function fetchWithTimeout(url, timeoutMs) {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, timeoutMs);
    return fetch(url, { signal: controller.signal })
      .then(function (res) {
        if (!res.ok) {
          log("Lookup HTTP error", { url: url, status: res.status });
          throw new Error("Lookup failed: " + res.status);
        }
        return res.json();
      })
      .catch(function (err) {
        log("Lookup failed/aborted", { url: url, timeoutMs: timeoutMs, error: err && err.message });
        throw err;
      })
      .finally(function () {
        clearTimeout(timeoutId);
      });
  }

  function buildEcoAuditUrl(data) {
    var url = new URL(CONFIG.ecoAuditUrl);
    if (data.uprn) url.searchParams.set("uprn", data.uprn);
    if (data.lat) url.searchParams.set("lat", data.lat);
    if (data.lng) url.searchParams.set("lng", data.lng);
    if (data.address) url.searchParams.set("address", data.address);
    if (data.postcode) url.searchParams.set("postcode", data.postcode);
    if (data.paon) url.searchParams.set("paon", data.paon);
    if (data.street) url.searchParams.set("street", data.street);
    if (data.bill) url.searchParams.set("bill", data.bill);
    url.searchParams.set("hev", data.hev || "0");
    url.searchParams.set("src", "optimizely");
    return url.toString();
  }

  function buildDetailedReportUrl(data) {
    var url = buildEcoAuditUrl(data);
    if (url.indexOf("reportView=detailed") === -1) {
      url += "&reportView=detailed";
    }
    return url;
  }

  // Chameleon thankYou redirect logic always appends `?sid=...&fid=...` to redirectUrlAfterSubmission.
  // To avoid malformed URLs (`...?foo=bar?sid=...`), we keep redirectUrlAfterSubmission query-less
  // and push Eco Audit params into the host page URL first, so Chameleon forwards them.
  function buildChameleonCompatibleRedirect(data) {
    var target = new URL(CONFIG.ecoAuditUrl);
    target.search = "";
    target.hash = "";

    var current = new URL(window.location.href);
    if (data.uprn) current.searchParams.set("uprn", data.uprn);
    if (data.lat) current.searchParams.set("lat", data.lat);
    if (data.lng) current.searchParams.set("lng", data.lng);
    if (data.address) current.searchParams.set("address", data.address);
    if (data.postcode) current.searchParams.set("postcode", data.postcode);
    if (data.paon) current.searchParams.set("paon", data.paon);
    if (data.street) current.searchParams.set("street", data.street);
    if (data.bill) current.searchParams.set("bill", data.bill);
    current.searchParams.set("hev", data.hev || "0");
    current.searchParams.set("src", "optimizely");

    // Replace URL without reloading to let Chameleon copy these params.
    window.history.replaceState({}, "", current.toString());
    return target.toString();
  }

  function isSubmissionEvent(eventObj) {
    if (!eventObj || !eventObj.event) return false;
    var name = String(eventObj.event);
    return (
      name === "webform_submission_completed" ||
      name === "resultsPageURL" ||
      name === "thankYouPageRequested"
    );
  }

  function getPayloadFromCurrentUrl() {
    var current = new URL(window.location.href);
    var src = toString(current.searchParams.get("src"));
    var postcode = normalizePostcode(current.searchParams.get("postcode"));
    var lat = toString(current.searchParams.get("lat"));
    var lng = toString(current.searchParams.get("lng"));
    var bill = toString(current.searchParams.get("bill"));
    var hev = toString(current.searchParams.get("hev"));

    if (src !== "optimizely" || !postcode) return null;

    return {
      uprn: toString(current.searchParams.get("uprn")),
      lat: lat,
      lng: lng,
      address: toString(current.searchParams.get("address")),
      postcode: postcode,
      paon: toString(current.searchParams.get("paon")),
      street: toString(current.searchParams.get("street")),
      bill: bill,
      hev: hev || "0",
    };
  }

  function getPayloadFromDataLayer() {
    var dl = Array.isArray(window.dataLayer) ? window.dataLayer : [];
    for (var i = dl.length - 1; i >= 0; i--) {
      var item = dl[i] || {};
      var answers = item.answers || {};
      var postcode = normalizePostcode(
        item.postcode ||
          answers.primary_address_postalcode ||
          answers[CONFIG.postcodeAnswerKey] ||
          ""
      );
      if (!postcode) continue;

      var billRaw =
        item.bill ||
        answers["answers[" + CONFIG.billAnswerId + "]"] ||
        "";
      var hevRaw =
        item.hev ||
        answers["answers[" + CONFIG.hasEvAnswerId + "]"] ||
        "";

      return {
        uprn: toString(item.uprn || ""),
        lat: toString(item.lat || ""),
        lng: toString(item.lng || ""),
        address: toString(item.address || ""),
        postcode: postcode,
        paon: toString(item.paon || ""),
        street: toString(item.street || ""),
        bill: parseMonthlyBill(billRaw) || toString(billRaw),
        hev: toString(hevRaw) ? asBoolean01(hevRaw) : "0",
      };
    }
    return null;
  }

  function applyRedirectOverride(submissionEvent) {
    var answers = (submissionEvent && submissionEvent.answers) || {};
    var postcodeRaw =
      answers.primary_address_postalcode ||
      answers[CONFIG.postcodeAnswerKey] ||
      "";
    var postcode = normalizePostcode(postcodeRaw);
    var billRaw = answers["answers[" + CONFIG.billAnswerId + "]"] || "";
    var hasEvRaw = answers["answers[" + CONFIG.hasEvAnswerId + "]"] || "";
    var immediatePayload = {
      uprn: "",
      lat: "",
      lng: "",
      address: "",
      postcode: postcode,
      paon: "",
      street: "",
      bill: parseMonthlyBill(billRaw),
      hev: asBoolean01(hasEvRaw),
    };

    if (!isProjectSolarTypPage) {
      // On form page, only persist data for the redirect destination.
      if (postcode) {
        persistPayloadForRedirect(immediatePayload);
        writePayloadToCurrentUrl(immediatePayload);
        lookupLocationFromPostcode(postcode).then(function (location) {
          var enriched = {
            uprn: location.uprn || "",
            lat: location.lat || "",
            lng: location.lng || "",
            address: location.address || "",
            postcode: postcode,
            paon: location.paon || "",
            street: location.street || "",
            bill: parseMonthlyBill(billRaw),
            hev: asBoolean01(hasEvRaw),
          };
          persistPayloadForRedirect(enriched);
          writePayloadToCurrentUrl(enriched);
        });
      }
      captureDebugEvent("submission-event-persisted-non-typ", {
        postcode: postcode || null,
      });
      return;
    }

    if (alreadyApplied) return;
    log("Submission event captured", submissionEvent);
    log("Postcode extracted from answers", { raw: postcodeRaw, normalized: postcode });
    if (!postcode) {
      log("No postcode available in submission payload.");
      captureDebugEvent("postcode-missing");
      return;
    }
    keepRedirectDisabled(25000);
    mountTypReportFromPayload(immediatePayload);
    renderPostcodePanel(immediatePayload);
    log("In-modal postcode panel started", immediatePayload);
    captureDebugEvent("in-modal-postcode-panel-started", immediatePayload);
    alreadyApplied = true;

    lookupLocationFromPostcode(postcode)
      .then(function (location) {
        var payload = {
          uprn: location.uprn || "",
          lat: location.lat || "",
          lng: location.lng || "",
          address: location.address || "",
          postcode: postcode,
          paon: location.paon || "",
          street: location.street || "",
          bill: parseMonthlyBill(billRaw),
          hev: asBoolean01(hasEvRaw),
        };
        keepRedirectDisabled(20000);
        renderPostcodePanel(payload);
        if (isProjectSolarTypPage) {
          // Refresh the same iframe container with enriched coordinates.
          mountTypReportFromPayload(payload);
        }
        log("Postcode panel refreshed with lookup data", payload);
        captureDebugEvent("postcode-panel-with-lookup", payload);

        window.dataLayer = window.dataLayer || [];
        var opty = getOptimizelyInfo();
        window.dataLayer.push({
          event: "ecoAuditRedirectInitiated",
          redirectUrl: null,
          postcode: postcode,
          submissionId: submissionEvent.submissionId || null,
          optyExperimentId: opty.optyExperimentId || null,
          optyVariationId: opty.optyVariationId || null,
          optyVariationName: opty.optyVariationName || null,
        });
      })
      .catch(function (err) {
        log("Lookup failed; keeping postcode-only panel.", err && err.message);
        captureDebugEvent("lookup-failed", { error: err && err.message });
        renderPostcodePanel(immediatePayload);
      });
  }

  function attachDataLayerListener() {
    window.dataLayer = window.dataLayer || [];
    var originalPush = window.dataLayer.push;

    // Catch future pushes.
    window.dataLayer.push = function () {
      var args = Array.prototype.slice.call(arguments);
      log("dataLayer.push intercepted", args);
      captureDebugEvent("datalayer-push", {
        events: args.map(function (a) {
          return a && a.event ? a.event : null;
        }),
      });
      for (var i = 0; i < args.length; i++) {
        var item = args[i];
        if (isSubmissionEvent(item)) {
          applyRedirectOverride(item);
        }
        if (item && item.event === "thankYouPageRequested") {
          maybeRemountTypReportFromPayload();
        }
      }
      return originalPush.apply(window.dataLayer, args);
    };

    // Catch already-pushed submission event.
    for (var j = window.dataLayer.length - 1; j >= 0; j--) {
      if (isSubmissionEvent(window.dataLayer[j])) {
        applyRedirectOverride(window.dataLayer[j]);
        break;
      }
    }
  }

  function bootstrapFromExistingUrl() {
    if (!isProjectSolarTypPage) return;
    if (alreadyApplied) return;
    var payload = getPayloadFromCurrentUrl() || getPayloadFromDataLayer() || readStoredPayload();
    if (!payload) return;

    alreadyApplied = true;
    keepRedirectDisabled(25000);
    mountTypReportFromPayload(payload);
    renderPostcodePanel(payload);

    var mount = function (finalPayload) {
      keepRedirectDisabled(20000);
      renderPostcodePanel(finalPayload);
      if (isProjectSolarTypPage) {
        mountTypReportFromPayload(finalPayload);
      }
      captureDebugEvent("bootstrap-panel-mounted", finalPayload);
    };

    if (payload.lat && payload.lng) {
      log("Bootstrapping modal results directly from URL params.", payload);
      captureDebugEvent("bootstrap-from-url", payload);
      mount(payload);
      return;
    }

    log("Bootstrapping from URL without lat/lng; running postcode lookup.", payload);
    lookupLocationFromPostcode(payload.postcode)
      .then(function (location) {
        if (location.lat && location.lng) {
          payload.lat = location.lat;
          payload.lng = location.lng;
          payload.uprn = location.uprn || payload.uprn;
          payload.address = location.address || payload.address;
          payload.paon = location.paon || payload.paon;
          payload.street = location.street || payload.street;
        }
        mount(payload);
      })
      .catch(function (err) {
        captureDebugEvent("bootstrap-lookup-failed", { error: err && err.message });
        mount(payload);
      });
  }

  attachDataLayerListener();
  attachIframeResizeListener();
  bootstrapFromExistingUrl();
  captureDebugEvent("script-initialized", {
    debugEnabled: isDebugEnabled(),
    ecoAuditUrl: CONFIG.ecoAuditUrl,
  });
  log("Eco Audit script initialized", {
    debugEnabled: isDebugEnabled(),
    ecoAuditUrl: CONFIG.ecoAuditUrl,
    locationLookupEndpoint: CONFIG.locationLookupEndpoint || "postcodes.io fallback",
  });
})();
