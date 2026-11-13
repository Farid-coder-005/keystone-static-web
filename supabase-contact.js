/*!
 * Supabase form integration
 * -------------------------------------------------------------------------
 * Intercepts the site's contact forms (Contact Form 7 and ActiveCampaign)
 * and newsletter forms (ActiveCampaign), stores them in the matching
 * Supabase table, shows a success message and clears the form fields.
 *
 * Contact forms  -> contact_submissions
 * Newsletter     -> newsletter_subscribers
 *
 * Requires the Supabase JS client (UMD build) to be loaded before this file.
 */
(function () {
  "use strict";

  if (window.__supabaseContactInitialized) return;
  window.__supabaseContactInitialized = true;

  var SUPABASE_URL = "https://tdclubxaiwdgntauhmiv.supabase.co";
  // Publishable (anon-equivalent) client key. Safe to ship to browsers: it is
  // not a JWT and carries no elevated/backend privileges. Never put a secret
  // key or an elevated JWT in this file.
  var SUPABASE_ANON_KEY = "sb_publishable_4OxRSNdZqTYKfScQQWjpTw_RysGxgQm";
  var TABLE = "contact_submissions";
  var STATUS_CLASS = "supabase-form-status";

  /* ------------------------------------------------------------------ */
  /* Abuse protection (client side)                                      */
  /* ------------------------------------------------------------------ */

  var RATE_LIMIT_KEY = "keystone_form_rate_limit_v1";
  var RATE_LIMIT_MAX = 3; // submissions per browser ...
  var RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // ... per 10 minutes
  var RATE_LIMIT_COOLDOWN_MS = 15 * 1000; // minimum gap between requests
  var HONEYPOT_ATTR = "data-supabase-honeypot";
  var HONEYPOT_NAME = "website_url";
  var inFlight = false;

  /* Hard character caps, mirrored by the maxlength attributes in the forms
     and by the CHECK constraints in supabase_security_hardening.sql.
     Truncating here protects against programmatically filled fields that
     bypass the native maxlength attribute. */
  var MAX_LENGTHS = {
    name: 120,
    email: 180,
    phone: 40,
    topic: 200,
    message: 2000
  };

  function cap(value, max) {
    if (typeof value !== "string") return value;
    return value.length > max ? value.slice(0, max) : value;
  }

  function readStamps() {
    try {
      var raw = window.localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      var now = Date.now();
      return parsed.filter(function (stamp) {
        return typeof stamp === "number" && now - stamp >= 0 && now - stamp < RATE_LIMIT_WINDOW_MS;
      });
    } catch (err) {
      return [];
    }
  }

  function writeStamps(stamps) {
    try {
      window.localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(stamps));
    } catch (err) {
      /* Storage can be unavailable (private mode); fail open, the server
         side trigger in supabase_security_hardening.sql is the real limit. */
    }
  }

  function checkRateLimit() {
    var stamps = readStamps();
    var now = Date.now();
    var last = stamps.length ? Math.max.apply(null, stamps) : 0;

    if (last && now - last < RATE_LIMIT_COOLDOWN_MS) {
      var wait = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (now - last)) / 1000);
      return {
        ok: false,
        message:
          "Please wait " + wait + " second" + (wait === 1 ? "" : "s") +
          " before sending another message."
      };
    }

    if (stamps.length >= RATE_LIMIT_MAX) {
      var oldest = Math.min.apply(null, stamps);
      var minutes = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 60000));
      return {
        ok: false,
        message:
          "Too many messages have been sent from this browser. Please try again in about " +
          minutes + " minute" + (minutes === 1 ? "" : "s") + "."
      };
    }

    return { ok: true };
  }

  function recordSubmission() {
    var stamps = readStamps();
    stamps.push(Date.now());
    if (stamps.length > RATE_LIMIT_MAX) {
      stamps = stamps.slice(stamps.length - RATE_LIMIT_MAX);
    }
    writeStamps(stamps);
  }

  // Invisible field that real visitors never fill in. Automated form fillers
  // usually populate every text input, so a non-empty value is a strong bot
  // signal. Such submissions are accepted with a fake success message and
  // never reach the Supabase API.
  function ensureHoneypot(form) {
    if (form.querySelector("[" + HONEYPOT_ATTR + "]")) return;
    var wrapper = document.createElement("div");
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.cssText =
      "position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;";
    var input = document.createElement("input");
    input.type = "text";
    input.name = HONEYPOT_NAME;
    input.id = "supabase-hp-" + Math.random().toString(36).slice(2, 10);
    input.tabIndex = -1;
    input.autocomplete = "off";
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute(HONEYPOT_ATTR, "1");
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  }

  function isHoneypotFilled(form) {
    var input = form.querySelector("[" + HONEYPOT_ATTR + "]");
    return !!(input && String(input.value || "").trim());
  }

  function getClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      console.error(
        "[Supabase contact] Supabase JS library not found. " +
          "Load https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 before supabase-contact.js."
      );
      return null;
    }
    if (!window.__supabaseContactClient) {
      window.__supabaseContactClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );
    }
    return window.__supabaseContactClient;
  }

  /* ------------------------------------------------------------------ */
  /* Form detection                                                      */
  /* ------------------------------------------------------------------ */

  function isContactForm(form) {
    if (!form || form.nodeName !== "FORM") return false;
    if (form.id === "keystone-newsletter-form" || (form.getAttribute && form.getAttribute("data-form-type") === "newsletter")) return true;
    if (form.classList && form.classList.contains("wpcf7-form")) return true;
    var action = (form.getAttribute("action") || "").toLowerCase();
    if (action.indexOf("activehosted.com") !== -1) return true;
    return false;
  }

  function isNewsletterForm(form) {
    if (!form || form.nodeName !== "FORM") return false;
    if (form.id === "keystone-newsletter-form" || (form.getAttribute && form.getAttribute("data-form-type") === "newsletter")) return false;
    var action = (form.getAttribute("action") || "").toLowerCase();
    if (action.indexOf("activehosted.com") === -1) return false;

    var hasFirstName = !!findField(form, [/^firstname$/i, /^first_name$/i, /^your-name(-[a-z]{2})?$/i]);
    var hasEmail = !!findField(form, [/^email$/i, /^your-email(-[a-z]{2})?$/i, /^e-mail$/i]);
    if (!hasFirstName || !hasEmail) return false;

    // Newsletter forms only collect a first name and email (plus consent
    // checkboxes). Any contact-only field means this is a regular contact form.
    var contactOnlyField = findField(form, [
      /^lastname$/i,
      /^last_name$/i,
      /^surname$/i,
      /^phone$/i,
      /^phone[-_]?iti$/i,
      /^tel$/i,
      /^telephone$/i,
      /^tel-code(-[a-z]{2})?$/i,
      /^business(-[a-z]{2})?$/i,
      /^field\[4\]$/i
    ]);
    if (contactOnlyField) return false;

    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Field helpers                                                       */
  /* ------------------------------------------------------------------ */

  function findField(form, patterns) {
    var fields = form.querySelectorAll("input, select, textarea");
    for (var p = 0; p < patterns.length; p++) {
      for (var i = 0; i < fields.length; i++) {
        var el = fields[i];
        var type = (el.type || "").toLowerCase();
        if (type === "hidden" || el.disabled) continue;
        var name = el.getAttribute("name") || "";
        var id = el.getAttribute("id") || "";
        if (patterns[p].test(name) || patterns[p].test(id)) return el;
      }
    }
    return null;
  }

  function valueOf(el) {
    return el && typeof el.value === "string" ? el.value.trim() : "";
  }

  function collectEntries(form) {
    var data = new FormData(form);
    var entries = [];
    data.forEach(function (value, name) {
      if (typeof value !== "string") return;
      var v = value.trim();
      if (!v || v === "~|") return;
      if (name.charAt(0) === "_") return; // CF7 internal fields
      if (/^(u|f|s|c|m|act|v|or)$/i.test(name)) return; // ActiveCampaign internals
      if (/^topic$/i.test(name)) {
        v = cap(v, MAX_LENGTHS.topic);
      }
      entries.push({ name: name, value: v });
    });
    return entries;
  }

  function isCoreField(name) {
    return /^(firstname|lastname|full[-_]?name|email|phone|phone[-_]?iti|phono-code(-[a-z]{2})?|tel-code(-[a-z]{2})?|your-name(-[a-z]{2})?|your-sname(-[a-z]{2})?|your-email(-[a-z]{2})?)$/i.test(
      name
    );
  }

  var LABELS = {
    "whatsapp": "WhatsApp",
    "field[2]": "WhatsApp",
    "field[4]": "Business",
    "field[24]": "Business website",
    "acceptance-369": "Urgent callback requested",
    "preferred_datetime": "Preferred Date & Time",
    "topic": "Topic / Message"
  };

  function prettify(str) {
    return String(str)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function prettyLabel(name) {
    if (LABELS[name]) return LABELS[name];
    if (/^business(-[a-z]{2})?$/i.test(name)) return "Business";
    var m = name.match(/^field\[(\d+)\]/);
    if (m && window.cfields && window.cfields[m[1]]) {
      return prettify(window.cfields[m[1]]);
    }
    return prettify(name.replace(/^field\[/, "").replace(/\]$/, ""));
  }

  function buildMessage(entries) {
    var lines = [];
    entries.forEach(function (entry) {
      if (isCoreField(entry.name)) return;
      lines.push(prettyLabel(entry.name) + ": " + entry.value);
    });
    return lines.join("\n") || "Contact form submission";
  }

  function buildPayload(form, entries) {
    var fullNameEl = findField(form, [/^full[-_]?name$/i]);
    var firstEl = findField(form, [/^firstname$/i, /^first_name$/i, /^your-name(-[a-z]{2})?$/i]);
    var lastEl = findField(form, [/^lastname$/i, /^last_name$/i, /^surname$/i, /^your-sname(-[a-z]{2})?$/i]);
    var emailEl = findField(form, [/^email$/i, /^your-email(-[a-z]{2})?$/i, /^e-mail$/i]);
    if (!emailEl) {
      var emailCandidates = form.querySelectorAll('input[type="email"]');
      if (emailCandidates.length) emailEl = emailCandidates[0];
    }
    var codeEl = findField(form, [/^phono-code(-[a-z]{2})?$/i, /^phone[-_]?code(-[a-z]{2})?$/i]);
    var phoneEl = findField(form, [/^phone$/i, /^phone-iti$/i, /^tel$/i, /^telephone$/i, /^tel-code(-[a-z]{2})?$/i]);
    if (!phoneEl) {
      var telCandidates = form.querySelectorAll('input[type="tel"]');
      if (telCandidates.length) phoneEl = telCandidates[0];
    }

    var first = valueOf(firstEl);
    var last = valueOf(lastEl);
    var explicitFullName = valueOf(fullNameEl);
    if (!first && !last && explicitFullName) {
      var nameParts = explicitFullName.split(/\s+/);
      first = nameParts.shift() || "";
      last = nameParts.join(" ");
    }
    var email = valueOf(emailEl);
    var code = valueOf(codeEl).replace(/^\+/, "");
    var number = valueOf(phoneEl).replace(/^\+/, "");

    var phone = "";
    if (code && number) phone = "+" + code + " " + number;
    else if (number) phone = number;
    else if (code) phone = "+" + code;

    // ActiveCampaign's intl-tel-input stores the complete number in a hidden
    // "phone" field; prefer that over the visible, partially formatted input.
    for (var i = 0; i < entries.length; i++) {
      if (/^phone$/i.test(entries[i].name) && entries[i].value) {
        phone = entries[i].value;
        break;
      }
    }

    first = cap(first, MAX_LENGTHS.name);
    last = cap(last, MAX_LENGTHS.name);
    email = cap(email, MAX_LENGTHS.email);
    phone = cap(phone, MAX_LENGTHS.phone);

    var fullName = cap([first, last].filter(Boolean).join(" "), MAX_LENGTHS.name);
    if (!fullName) fullName = first || last || email || "Website visitor";

    var isNewsletter = form.id === "keystone-newsletter-form" || (form.getAttribute && form.getAttribute("data-form-type") === "newsletter");
    var customMsgEl = form.querySelector('[name="formatted_message"], textarea[name="formatted_message"]');
    var finalMessage = (customMsgEl && customMsgEl.value && customMsgEl.value.trim())
      ? customMsgEl.value.trim()
      : (isNewsletter ? ("[NEWSLETTER SUBSCRIPTION] Name: " + (first || "Subscriber") + ", Email: " + email) : buildMessage(entries));
    finalMessage = cap(finalMessage, MAX_LENGTHS.message);

    var payload = {
      first_name: first || null,
      last_name: last || null,
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      message: finalMessage,
      locale: document.documentElement.lang || navigator.language || null,
      source_page: window.location.href,
      user_agent: navigator.userAgent || null
    };

    return payload;
  }

  function buildNewsletterPayload(form) {
    var firstEl = findField(form, [/^firstname$/i, /^first_name$/i, /^your-name(-[a-z]{2})?$/i]);
    var emailEl = findField(form, [/^email$/i, /^your-email(-[a-z]{2})?$/i, /^e-mail$/i]);
    if (!emailEl) {
      var emailCandidates = form.querySelectorAll('input[type="email"]');
      if (emailCandidates.length) emailEl = emailCandidates[0];
    }

    var firstName = cap(valueOf(firstEl), MAX_LENGTHS.name);
    var email = cap(valueOf(emailEl), MAX_LENGTHS.email);

    // The terms checkbox is required; validation must have passed before this
    // is called, so a required consent checkbox is checked by now.
    var consent = true;
    var terms = form.querySelector('input[type="checkbox"][required]');
    if (terms) consent = terms.checked;

    return {
      full_name: firstName || email || "Subscriber",
      email: email,
      consent: consent,
      locale: document.documentElement.lang || navigator.language || null
    };
  }

  /* ------------------------------------------------------------------ */
  /* Validation                                                          */
  /* ------------------------------------------------------------------ */

  function validateForm(form) {
    var newsletter = isNewsletterForm(form);
    var required = form.querySelectorAll('[required], [aria-required="true"]');
    for (var i = 0; i < required.length; i++) {
      var el = required[i];
      if (el.disabled) continue;
      var type = (el.type || "").toLowerCase();

      if (type === "radio") {
        var group = Array.prototype.filter.call(form.elements, function (candidate) {
          return candidate.type === "radio" && candidate.name === el.name;
        });
        var checked = group.some(function (candidate) {
          return candidate.checked;
        });
        if (!checked) {
          return { ok: false, el: el, message: "Please complete all required fields." };
        }
      } else if (type === "checkbox") {
        var checkboxGroup = Array.prototype.filter.call(form.elements, function (candidate) {
          return candidate.type === "checkbox" && candidate.name === el.name;
        });
        var surrounding = el.value || "";
        var label = el.closest ? el.closest("label") : null;
        if (label) surrounding += " " + label.textContent;
        var fieldset = el.closest ? el.closest("fieldset") : null;
        if (fieldset && fieldset.querySelector("legend")) {
          surrounding += " " + fieldset.querySelector("legend").textContent;
        }
        var isConsent = /agree|terms|privacy|consent|gdpr|confirm/i.test(surrounding);

        if (isConsent || newsletter) {
          if (!el.checked) {
            return { ok: false, el: el, message: "Please complete all required fields." };
          }
        } else {
          var anyChecked = checkboxGroup.some(function (candidate) {
            return candidate.checked;
          });
          if (!anyChecked) {
            return { ok: false, el: el, message: "Please complete all required fields." };
          }
        }
      } else {
        if (!valueOf(el)) {
          return { ok: false, el: el, message: "Please complete all required fields." };
        }
        if (type === "email" && typeof el.checkValidity === "function" && !el.checkValidity()) {
          return { ok: false, el: el, message: "Please enter a valid email address." };
        }
      }
    }
    return { ok: true };
  }

  /* ------------------------------------------------------------------ */
  /* UI helpers                                                          */
  /* ------------------------------------------------------------------ */

  function showStatus(form, type, message) {
    var el = form.querySelector("." + STATUS_CLASS);
    if (!el) {
      el = document.createElement("div");
      el.className = STATUS_CLASS;
      form.appendChild(el);
    }

    var success = type === "success";
    var palette;
    if (type === "success") {
      palette = { border: "#2e7d32", background: "#e8f5e9", color: "#1b5e20" };
    } else if (type === "info") {
      palette = { border: "#1565c0", background: "#e3f2fd", color: "#0d47a1" };
    } else {
      palette = { border: "#c62828", background: "#ffebee", color: "#b71c1c" };
    }

    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
    el.textContent = message;
    el.style.cssText =
      "margin:16px 0;padding:12px 16px;border-radius:6px;" +
      "border:1px solid " + palette.border + ";" +
      "background:" + palette.background + ";" +
      "color:" + palette.color + ";" +
      "font-size:15px;line-height:1.5;";

    // Contact Form 7 has its own response area; keep it in sync.
    var cf7Output = form.querySelector(".wpcf7-response-output");
    if (cf7Output) {
      cf7Output.textContent = message;
      cf7Output.style.display = "block";
      cf7Output.classList.remove("wpcf7-validation-errors", "wpcf7-mail-sent-ng", "wpcf7-mail-sent-ok");
      cf7Output.classList.add(success ? "wpcf7-mail-sent-ok" : "wpcf7-mail-sent-ng");
    }

    if (el.scrollIntoView) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (e) {
        el.scrollIntoView();
      }
    }
  }

  function clearStatus(form) {
    var nodes = form.querySelectorAll("." + STATUS_CLASS);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
    var cf7Output = form.querySelector(".wpcf7-response-output");
    if (cf7Output) {
      cf7Output.textContent = "";
      cf7Output.style.display = "none";
      cf7Output.classList.remove("wpcf7-mail-sent-ok", "wpcf7-mail-sent-ng");
    }
  }

  function clearForm(form) {
    var fields = form.querySelectorAll("input, select, textarea");
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      var type = (el.type || "").toLowerCase();
      if (
        type === "hidden" ||
        type === "submit" ||
        type === "button" ||
        type === "reset" ||
        type === "image"
      ) {
        continue;
      }
      if (type === "checkbox" || type === "radio") {
        el.checked = false;
      } else if (el.tagName === "SELECT") {
        el.selectedIndex = -1;
      } else {
        el.value = "";
      }
    }
  }

  function setBusy(form, busy) {
    var button = form.querySelector('input[type="submit"], button[type="submit"]');
    if (!button) return;

    if (busy) {
      if (button.dataset.supabaseOriginalValue === undefined) {
        button.dataset.supabaseOriginalValue = button.value || "";
      }
      if (button.dataset.supabaseOriginalHtml === undefined) {
        button.dataset.supabaseOriginalHtml = button.innerHTML || "";
      }
      button.disabled = true;
      if (button.tagName === "BUTTON") button.textContent = "Sending...";
      else button.value = "Sending...";
    } else {
      button.disabled = false;
      if (button.tagName === "INPUT" && button.dataset.supabaseOriginalValue !== undefined) {
        button.value = button.dataset.supabaseOriginalValue;
      } else if (button.dataset.supabaseOriginalHtml !== undefined) {
        button.innerHTML = button.dataset.supabaseOriginalHtml;
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Supabase insert (with small schema-safety fallbacks)                */
  /* ------------------------------------------------------------------ */

  async function saveSubmission(payload) {
    var client = getClient();
    if (!client) {
      return {
        error: {
          message: "The Supabase client could not be created.",
          code: "CLIENT_MISSING"
        }
      };
    }

    var attempt = Object.assign({}, payload);
    var result = null;

    for (var tries = 0; tries < 5; tries++) {
      result = await client.from(TABLE).insert(attempt);
      if (!result.error) return result;

      var message =
        (result.error.message || "") +
        " " +
        (result.error.details || "") +
        " " +
        (result.error.hint || "");
      var handled = false;

      // Generated columns cannot be written to.
      if (/generated column/i.test(message) && Object.prototype.hasOwnProperty.call(attempt, "full_name")) {
        delete attempt.full_name;
        handled = true;
      }

      // If status is required but has no default, send the common default.
      if (
        !handled &&
        (result.error.code === "23502" || /null value in column .*status/i.test(message)) &&
        !Object.prototype.hasOwnProperty.call(attempt, "status")
      ) {
        attempt.status = "new";
        handled = true;
      }

      // Unknown column (e.g. a slightly different schema) - drop and retry.
      if (!handled) {
        var unknown = message.match(/Could not find the '([^']+)' column/i);
        if (unknown && Object.prototype.hasOwnProperty.call(attempt, unknown[1])) {
          delete attempt[unknown[1]];
          handled = true;
        }
      }

      if (!handled) return result;
    }

    return result;
  }

  async function saveNewsletter(payload) {
    var client = getClient();
    if (!client) {
      return {
        error: {
          message: "The Supabase client could not be created.",
          code: "CLIENT_MISSING"
        }
      };
    }

    var attempt = Object.assign({}, payload);
    var result = null;

    for (var tries = 0; tries < 4; tries++) {
      result = await client.from("newsletter_subscribers").insert(attempt);
      if (!result.error) return result;

      var message =
        (result.error.message || "") +
        " " +
        (result.error.details || "") +
        " " +
        (result.error.hint || "");
      var handled = false;

      // Generated columns cannot be written to.
      if (
        /generated column/i.test(message) &&
        Object.prototype.hasOwnProperty.call(attempt, "full_name")
      ) {
        delete attempt.full_name;
        handled = true;
      }

      // If status is required but has no default, use the common value.
      if (
        !handled &&
        (result.error.code === "23502" || /null value in column .*status/i.test(message)) &&
        !Object.prototype.hasOwnProperty.call(attempt, "status")
      ) {
        attempt.status = "subscribed";
        handled = true;
      }

      // Unknown column (e.g. a slightly different schema) - drop and retry.
      if (!handled) {
        var unknown = message.match(/Could not find the '([^']+)' column/i);
        if (unknown && Object.prototype.hasOwnProperty.call(attempt, unknown[1])) {
          delete attempt[unknown[1]];
          handled = true;
        }
      }

      if (!handled) return result;
    }

    return result;
  }

  /* ------------------------------------------------------------------ */
  /* Submit handler                                                      */
  /* ------------------------------------------------------------------ */

  async function handleSubmit(form) {
    if (inFlight) return;

    clearStatus(form);
    ensureHoneypot(form);

    // Silent bot rejection: pretend everything worked, send nothing.
    if (isHoneypotFilled(form)) {
      clearForm(form);
      showStatus(form, "success", "Thank you! Your message has been sent successfully.");
      return;
    }

    var limit = checkRateLimit();
    if (!limit.ok) {
      showStatus(form, "info", limit.message);
      return;
    }

    var validation = validateForm(form);
    if (!validation.ok) {
      showStatus(form, "error", validation.message);
      if (validation.el && validation.el.focus) validation.el.focus();
      return;
    }

    var entries = collectEntries(form);
    var payload = buildPayload(form, entries);

    inFlight = true;
    form.setAttribute("aria-busy", "true");

    try {
      recordSubmission();
      setBusy(form, true);
      var result = await saveSubmission(payload);

      if (result.error) {
        console.error("[Supabase contact] Insert failed:", result.error);
        // Never surface raw database errors (schema/column names) to visitors.
        showStatus(
          form,
          "error",
          "Sorry, your submission could not be sent. Please try again."
        );
        return;
      }

      clearForm(form);
      var isNewsletterFormType = form.id === "keystone-newsletter-form" || (form.getAttribute && form.getAttribute("data-form-type") === "newsletter");
      showStatus(form, "success", isNewsletterFormType ? "Thank you for subscribing!" : "Thank you! Your message has been sent successfully.");
    } catch (err) {
      console.error("[Supabase contact] Unexpected error:", err);
      showStatus(
        form,
        "error",
        "Sorry, your submission could not be sent. Please check your connection and try again."
      );
    } finally {
      inFlight = false;
      form.removeAttribute("aria-busy");
      setBusy(form, false);
    }
  }

  async function handleNewsletterSubmit(form) {
    if (inFlight) return;

    clearStatus(form);
    ensureHoneypot(form);

    // Silent bot rejection: pretend everything worked, send nothing.
    if (isHoneypotFilled(form)) {
      clearForm(form);
      showStatus(form, "success", "Thank you for subscribing!");
      return;
    }

    var limit = checkRateLimit();
    if (!limit.ok) {
      showStatus(form, "info", limit.message);
      return;
    }

    var validation = validateForm(form);
    if (!validation.ok) {
      showStatus(form, "error", validation.message);
      if (validation.el && validation.el.focus) validation.el.focus();
      return;
    }

    var payload = buildNewsletterPayload(form);

    inFlight = true;
    form.setAttribute("aria-busy", "true");

    try {
      recordSubmission();
      setBusy(form, true);
      var result = await saveNewsletter(payload);

      if (result.error) {
        console.error("[Supabase newsletter] Insert failed:", result.error);
        if (
          result.error.code === "23505" ||
          /duplicate|already exists/i.test(result.error.message || "")
        ) {
          showStatus(form, "info", "This email address is already subscribed.");
        } else {
          showStatus(
            form,
            "error",
            "Sorry, your subscription could not be saved. Please try again."
          );
        }
        return;
      }

      clearForm(form);
      showStatus(form, "success", "Thank you for subscribing!");
    } catch (err) {
      console.error("[Supabase newsletter] Unexpected error:", err);
      showStatus(
        form,
        "error",
        "Sorry, your subscription could not be saved. Please check your connection and try again."
      );
    } finally {
      inFlight = false;
      form.removeAttribute("aria-busy");
      setBusy(form, false);
    }
  }

  // Add the honeypot to forms that already exist, and to forms injected later
  // by Contact Form 7 / ActiveCampaign.
  function prepareForms() {
    var forms = document.querySelectorAll("form");
    for (var i = 0; i < forms.length; i++) {
      if (isContactForm(forms[i]) || isNewsletterForm(forms[i])) ensureHoneypot(forms[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepareForms);
  } else {
    prepareForms();
  }

  // Capture phase so the original handler (Contact Form 7 / ActiveCampaign)
  // never receives the submit event.
  document.addEventListener(
    "submit",
    function (event) {
      var form = event.target;
      var newsletter = isNewsletterForm(form);
      if (!newsletter && !isContactForm(form)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      if (newsletter) handleNewsletterSubmit(form);
      else handleSubmit(form);
    },
    true
  );
})();
