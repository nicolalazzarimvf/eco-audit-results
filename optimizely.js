(function () {
  "use strict";

  try {
    window.__ecoAuditScriptLoaded = true;
    console.info("[CRO-674 Eco Audit] script loaded");
  } catch (e) {
    /* no-op */
  }

  var CONFIG = {
    ecoAuditUrl:
      window.__ECO_AUDIT_TYP_URL__ || "https://eco-audit-ebon.vercel.app/",
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
  var debugEvents = (window.__ecoAuditDebugEvents = window.__ecoAuditDebugEvents || []);

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
    return eventObj && eventObj.event === "webform_submission_completed";
  }

  function applyRedirectOverride(submissionEvent) {
    if (alreadyApplied) return;
    log("Submission event captured", submissionEvent);
    var answers = (submissionEvent && submissionEvent.answers) || {};
    var postcodeRaw =
      answers.primary_address_postalcode ||
      answers[CONFIG.postcodeAnswerKey] ||
      "";
    var postcode = normalizePostcode(postcodeRaw);
    log("Postcode extracted from answers", { raw: postcodeRaw, normalized: postcode });
    if (!postcode) {
      log("No postcode available in submission payload.");
      captureDebugEvent("postcode-missing");
      return;
    }

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
    setControlledRedirect(buildChameleonCompatibleRedirect(immediatePayload));
    log("Immediate postcode-only redirect set", immediatePayload);
    captureDebugEvent("postcode-only-redirect", immediatePayload);
    alreadyApplied = true;

    lookupLocationFromPostcode(postcode)
      .then(function (location) {
        if (!location.lat || !location.lng) {
          log("Location lookup did not return lat/lng. Using postcode-only redirect.");
          return;
        }
        var payload = {
          uprn: location.uprn,
          lat: location.lat,
          lng: location.lng,
          address: location.address,
          postcode: postcode,
          paon: location.paon,
          street: location.street,
          bill: parseMonthlyBill(billRaw),
          hev: asBoolean01(hasEvRaw),
        };

        var redirectUrl = buildChameleonCompatibleRedirect(payload);
        setControlledRedirect(redirectUrl);
        log("Redirect upgraded with lookup data", payload);
        captureDebugEvent("lookup-redirect", payload);

        window.dataLayer = window.dataLayer || [];
        var opty = getOptimizelyInfo();
        window.dataLayer.push({
          event: "ecoAuditRedirectInitiated",
          redirectUrl: redirectUrl,
          postcode: postcode,
          submissionId: submissionEvent.submissionId || null,
          optyExperimentId: opty.optyExperimentId || null,
          optyVariationId: opty.optyVariationId || null,
          optyVariationName: opty.optyVariationName || null,
        });
      })
      .catch(function (err) {
        log("Lookup failed; using default TYP.", err && err.message);
        captureDebugEvent("lookup-failed", { error: err && err.message });
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
        if (isSubmissionEvent(args[i])) {
          applyRedirectOverride(args[i]);
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

  attachDataLayerListener();
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
