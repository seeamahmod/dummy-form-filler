// Dummy Form Filler — injected into the page on each click.
// Reads every visible field, works out what it is for, and fills it with
// matching dummy data. Wrapped in an IIFE so it can be injected repeatedly.
// The value of the last expression (the fill count) is returned to background.js.

(() => {
  // ---------- random helpers ----------
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[rnd(0, arr.length - 1)];
  const digits = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? rnd(1, 9) : rnd(0, 9))).join("");
  const pad = (n, w = 2) => String(n).padStart(w, "0");

  // ---------- data pools ----------
  const FIRST = ["James", "Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan", "Sophia", "Lucas", "Mia", "Mason", "Amelia", "Logan", "Harper", "Aiden", "Ella", "Ryan", "Chloe", "Daniel", "Grace", "Arif", "Nadia", "Omar", "Sara", "Kenji", "Aisha"];
  const LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Martin", "Clark", "Lewis", "Walker", "Hall", "Young", "Rahman", "Khan", "Tanaka", "Garcia"];
  const STREETS = ["Maple Ave", "Oak Street", "Pine Road", "Cedar Lane", "Elm Street", "Washington Blvd", "Lakeview Drive", "Sunset Blvd", "Park Avenue", "Hillcrest Road", "River Road", "Main Street"];
  const CITIES = [
    ["Springfield", "Illinois", "IL"], ["Austin", "Texas", "TX"], ["Portland", "Oregon", "OR"], ["Denver", "Colorado", "CO"],
    ["Seattle", "Washington", "WA"], ["Boston", "Massachusetts", "MA"], ["Miami", "Florida", "FL"], ["Phoenix", "Arizona", "AZ"],
    ["San Diego", "California", "CA"], ["Columbus", "Ohio", "OH"], ["Nashville", "Tennessee", "TN"], ["Atlanta", "Georgia", "GA"],
  ];
  const COMPANIES = ["Acme Corp", "Globex Inc", "Initech", "Umbrella Labs", "Stark Solutions", "Wayne Enterprises", "Hooli", "Vandelay Industries", "Northwind Traders", "Contoso Ltd", "Blue Harbor Co", "Brightpath Digital"];
  const JOBS = ["Software Engineer", "Product Manager", "Designer", "Marketing Lead", "Data Analyst", "Sales Executive", "Operations Manager", "QA Engineer", "Accountant", "Consultant"];
  const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat".split(" ");
  const SUBJECTS = ["Quick question", "Project inquiry", "Partnership opportunity", "Support request", "Feedback on your service", "Booking request"];

  const sentence = (min = 6, max = 12) => {
    const n = rnd(min, max);
    const w = Array.from({ length: n }, () => pick(WORDS));
    w[0] = w[0][0].toUpperCase() + w[0].slice(1);
    return w.join(" ") + ".";
  };
  const paragraph = () => Array.from({ length: rnd(2, 4) }, () => sentence()).join(" ");

  // ---------- one consistent fake person per click ----------
  const first = pick(FIRST);
  const last = pick(LAST);
  const [city, stateName, stateCode] = pick(CITIES);
  const company = pick(COMPANIES);
  const user = `${first}.${last}${rnd(10, 99)}`.toLowerCase();
  const password = `Test@${digits(5)}`;
  const birth = new Date(rnd(1975, 2002), rnd(0, 11), rnd(1, 28));
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const P = {
    first, last,
    full: `${first} ${last}`,
    middle: pick(FIRST),
    user,
    email: `${user}@example.com`,
    password,
    phone: `(${rnd(201, 989)}) 555-${pad(rnd(100, 9999), 4)}`,
    company,
    job: pick(JOBS),
    address1: `${rnd(10, 9999)} ${pick(STREETS)}`,
    address2: `Apt ${rnd(1, 40)}${pick(["A", "B", "C", ""])}`,
    city, stateName, stateCode,
    zip: digits(5),
    country: "United States",
    website: `https://www.${company.toLowerCase().replace(/[^a-z]/g, "")}.com`,
    birth,
  };

  // ---------- figure out what a field is for ----------
  const norm = (s) =>
    String(s || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_\-\[\].:*]+/g, " ")
      .toLowerCase();

  function labelText(el) {
    const parts = [];
    if (el.labels) for (const l of el.labels) parts.push(l.textContent);
    const lb = el.getAttribute("aria-labelledby");
    if (lb) {
      const root = el.getRootNode();
      lb.split(/\s+/).forEach((id) => {
        const n = root.getElementById ? root.getElementById(id) : document.getElementById(id);
        if (n) parts.push(n.textContent);
      });
    }
    return parts.join(" ");
  }

  // Nearby text, for frameworks that don't use <label for>. Ignores other form controls.
  const CONTROL = "input, select, textarea, button";
  function nearbyText(el) {
    const parts = [];
    const prev = el.previousElementSibling;
    if (prev && !prev.matches(CONTROL) && !prev.querySelector(CONTROL)) {
      const t = prev.textContent || "";
      if (t.length < 60) parts.push(t);
    }
    const wrap = el.parentElement;
    if (wrap && wrap.querySelectorAll(CONTROL).length === 1) {
      const t = wrap.textContent || "";
      if (t.length < 60) parts.push(t);
    }
    return parts.join(" ");
  }

  // Primary hint: the field's own attributes and real labels. Secondary: nearby text.
  function hintsOf(el) {
    const own = norm(
      [
        el.getAttribute("autocomplete"),
        el.name,
        el.id,
        el.getAttribute("placeholder"),
        el.getAttribute("aria-label"),
        el.getAttribute("data-testid"),
        el.title,
        labelText(el),
      ].join(" | ")
    );
    return [own, norm(nearbyText(el))];
  }

  // Ordered: first match wins. Specific rules come before generic ones.
  const RULES = [
    [/confirm.*(pass|pwd)|(pass|pwd).*(confirm|again|repeat|verify)|re ?type/, () => P.password],
    [/pass(word)?|pwd/, () => P.password],
    [/e ?mail/, () => P.email],
    [/user ?name|login|nick ?name|handle|user ?id/, () => P.user],
    [/first ?name|given ?name|fname|forename/, () => P.first],
    [/last ?name|family ?name|surname|lname/, () => P.last],
    [/middle ?name/, () => P.middle],
    [/card ?(number|no)|cc ?num|credit ?card|cardnumber/, () => "4242 4242 4242 4242"],
    [/cvv|cvc|security ?code|csc/, () => digits(3)],
    [/exp(iry|iration)?.*(month)|cc ?exp ?month/, () => pad(rnd(1, 12))],
    [/exp(iry|iration)?.*(year)|cc ?exp ?year/, () => String(new Date().getFullYear() + rnd(1, 5))],
    [/exp(iry|iration)|valid ?thru|mm ?\/? ?yy/, () => `${pad(rnd(1, 12))}/${String(new Date().getFullYear() + 3).slice(2)}`],
    [/name ?on ?card|card ?holder|cc ?name/, () => P.full.toUpperCase()],
    [/company|organi[sz]ation|business|employer|org name/, () => P.company],
    [/job|position|occupation|designation|role/, () => P.job],
    [/phone|mobile|cell\b|\btel\b|whats ?app|contact ?number/, () => P.phone],
    [/address ?(line)? ?2|address2|apt|suite|unit|apartment/, () => P.address2],
    [/street|address|addr/, () => P.address1],
    [/city|town|locality/, () => P.city],
    [/state|province|region|county/, () => P.stateName],
    [/zip|postal|post ?code|pin ?code/, () => P.zip],
    [/country/, () => P.country],
    [/web ?site|homepage|url|link|portfolio|domain/, () => P.website],
    [/birth|dob|bday/, () => isoDate(P.birth)],
    [/\bage\b/, () => String(rnd(21, 60))],
    [/full ?name|your ?name|^name\b|\bname\b/, () => P.full],
    [/subject|topic|headline/, () => pick(SUBJECTS)],
    [/message|comment|description|bio|about|note|feedback|details|summary|enquiry|inquiry/, () => paragraph()],
    [/title/, () => sentence(3, 6).replace(/\.$/, "")],
    [/search|query|keyword/, () => pick(["laptop", "coffee", "shoes", "travel"])],
    [/otp|verification|pin\b|code/, () => digits(6)],
    [/amount|price|salary|budget|cost/, () => String(rnd(100, 5000))],
    [/qty|quantity|count|number of/, () => String(rnd(1, 10))],
  ];

  function guessText(hints) {
    for (const h of hints) {
      if (!h.trim()) continue;
      for (const [re, gen] of RULES) if (re.test(h)) return gen();
    }
    return null;
  }

  // ---------- value generators per input type ----------
  function numberFor(el, hint) {
    const min = el.min !== "" && !isNaN(+el.min) ? +el.min : null;
    const max = el.max !== "" && !isNaN(+el.max) ? +el.max : null;
    let lo = min ?? 1;
    let hi = max ?? lo + 100;
    if (min == null && max == null) {
      if (/age/.test(hint)) [lo, hi] = [21, 60];
      else if (/year/.test(hint)) [lo, hi] = [1980, 2024];
      else if (/zip|postal/.test(hint)) return P.zip;
      else if (/phone|mobile/.test(hint)) return digits(10);
      else if (/qty|quantity/.test(hint)) [lo, hi] = [1, 10];
      else if (/price|amount|salary/.test(hint)) [lo, hi] = [100, 5000];
    }
    const step = el.step && el.step !== "any" && !isNaN(+el.step) ? +el.step : 1;
    const steps = Math.max(0, Math.floor((hi - lo) / step));
    const v = lo + rnd(0, steps) * step;
    return String(Number.isInteger(step) ? v : +v.toFixed(4));
  }

  function dateFor(el, hint) {
    const d = /birth|dob/.test(hint) ? P.birth : new Date(Date.now() + rnd(-30, 60) * 864e5);
    switch (el.type) {
      case "date": return clampDate(el, isoDate(d));
      case "month": return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      case "week": return `${d.getFullYear()}-W${pad(rnd(1, 52))}`;
      case "time": return `${pad(rnd(8, 18))}:${pick(["00", "15", "30", "45"])}`;
      case "datetime-local": return `${isoDate(d)}T${pad(rnd(8, 18))}:${pick(["00", "30"])}`;
    }
    return isoDate(d);
  }

  function clampDate(el, v) {
    if (el.min && v < el.min) return el.min;
    if (el.max && v > el.max) return el.max;
    return v;
  }

  function textFor(el, hint, hints) {
    const type = (el.type || "text").toLowerCase();
    let v;
    if (type === "email") v = P.email;
    else if (type === "password") v = P.password;
    else if (type === "url") v = P.website;
    else if (type === "tel") v = P.phone;
    else v = guessText(hints);

    if (v == null) v = el.tagName === "TEXTAREA" ? paragraph() : `${pick(WORDS)} ${pick(WORDS)}`.replace(/^./, (c) => c.toUpperCase());

    // Respect length limits
    const maxLen = el.maxLength > 0 ? el.maxLength : null;
    const minLen = el.minLength > 0 ? el.minLength : null;
    if (type === "tel" && maxLen && maxLen < v.length) v = digits(Math.min(maxLen, 10));
    if (minLen && v.length < minLen) {
      if (type === "password") v = v + "x".repeat(minLen - v.length);
      else while (v.length < minLen) v += " " + pick(WORDS);
    }
    if (maxLen && v.length > maxLen) v = v.slice(0, maxLen).trim();

    // Respect simple numeric patterns like \d{6} or [0-9]{4,6}
    if (el.pattern) {
      try {
        const re = new RegExp(`^(?:${el.pattern})$`);
        if (!re.test(v)) {
          const m = el.pattern.match(/^(?:\\d|\[0-9\])\{(\d+)(?:,(\d+))?\}$/);
          if (m) v = digits(+m[1]);
          else if (/^\[?a-z/i.test(el.pattern)) v = pick(WORDS);
        }
      } catch (_) { /* invalid pattern — ignore */ }
    }
    return v;
  }

  // ---------- setting values so React/Vue/Angular notice ----------
  function setValue(el, value) {
    const proto =
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype :
      el instanceof HTMLSelectElement ? HTMLSelectElement.prototype :
      HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    el.focus({ preventScroll: true });
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.blur();
  }

  function setChecked(el, checked) {
    if (el.checked !== checked) el.click(); // click fires the events frameworks listen for
    if (el.checked !== checked) {
      el.checked = checked;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // ---------- visibility / eligibility ----------
  function usable(el) {
    if (el.disabled || el.readOnly) return false;
    if (el.closest("[aria-hidden='true'], [hidden], fieldset[disabled]")) return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    // Custom checkbox/radio UIs often visually hide the real input — allow those.
    if (el.type === "checkbox" || el.type === "radio") return true;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // Collect fields, including inside open shadow roots
  function collect(root, out = []) {
    root.querySelectorAll("input, textarea, select, [contenteditable='true'], [contenteditable='']").forEach((el) => out.push(el));
    root.querySelectorAll("*").forEach((n) => { if (n.shadowRoot) collect(n.shadowRoot, out); });
    return out;
  }

  const SKIP_TYPES = new Set(["hidden", "submit", "button", "reset", "image", "file"]);
  let filled = 0;
  const radioGroups = new Map();

  for (const el of collect(document)) {
    try {
      if (el.isContentEditable && !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
        if (!usable(el) || el.closest("input, textarea")) continue;
        // Skip big rich-text editors' inner nodes: only fill the outermost editable
        if (el.parentElement && el.parentElement.isContentEditable) continue;
        el.focus();
        el.textContent = paragraph();
        el.dispatchEvent(new InputEvent("input", { bubbles: true }));
        filled++;
        continue;
      }

      if (!usable(el)) continue;
      const hints = hintsOf(el);
      // Own attributes decide; fall back to nearby text only when they say nothing useful.
      const hint = guessText([hints[0]]) != null || !hints[1] ? hints[0] : hints.join(" | ");

      if (el instanceof HTMLSelectElement) {
        const opts = [...el.options].filter(
          (o) => !o.disabled && o.value !== "" && !/^\s*(-+|select|choose|pick|please)/i.test(o.text)
        );
        if (!opts.length) continue;
        if (el.multiple) {
          [...el.options].forEach((o) => (o.selected = false));
          opts.sort(() => Math.random() - 0.5).slice(0, rnd(1, Math.min(3, opts.length))).forEach((o) => (o.selected = true));
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          // Prefer an option matching our fake person (state, country) if present
          const want = [P.stateName, P.stateCode, P.country, "US", "USA"].map((s) => s.toLowerCase());
          const match = /state|province|country|region/.test(hint)
            ? opts.find((o) => want.includes(o.text.trim().toLowerCase()) || want.includes(o.value.toLowerCase()))
            : null;
          setValue(el, (match || pick(opts)).value);
        }
        filled++;
        continue;
      }

      if (el instanceof HTMLTextAreaElement) {
        setValue(el, textFor(el, hint, hints));
        filled++;
        continue;
      }

      const type = (el.type || "text").toLowerCase();
      if (SKIP_TYPES.has(type)) continue;

      if (type === "radio") {
        const key = (el.form ? "f" : "d") + ":" + (el.name || el.id);
        if (!radioGroups.has(key)) radioGroups.set(key, []);
        radioGroups.get(key).push(el);
        continue;
      }

      if (type === "checkbox") {
        // Always tick agreement / consent boxes; others random
        const must = el.required || /agree|terms|accept|consent|policy|confirm/.test(hint);
        setChecked(el, must || Math.random() < 0.5);
        filled++;
        continue;
      }

      let v;
      if (type === "number") v = numberFor(el, hint);
      else if (type === "range") v = numberFor(el, hint);
      else if (["date", "month", "week", "time", "datetime-local"].includes(type)) v = dateFor(el, hint);
      else if (type === "color") v = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
      else v = textFor(el, hint, hints);

      setValue(el, v);
      filled++;
    } catch (e) {
      console.debug("Dummy Form Filler skipped a field:", el, e);
    }
  }

  // One random choice per radio group
  for (const group of radioGroups.values()) {
    if (!group.length) continue;
    setChecked(pick(group), true);
    filled++;
  }

  // Small on-page toast (top frame only)
  if (window === window.top) {
    const old = document.getElementById("__dummy_filler_toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.id = "__dummy_filler_toast";
    t.textContent = filled ? `✓ Filled ${filled} field${filled === 1 ? "" : "s"} with dummy data` : "No fillable fields found";
    Object.assign(t.style, {
      position: "fixed", bottom: "20px", right: "20px", zIndex: 2147483647,
      background: filled ? "#188038" : "#5f6368", color: "#fff",
      font: "500 14px/1.4 system-ui, -apple-system, Segoe UI, sans-serif",
      padding: "10px 16px", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,.25)",
      transition: "opacity .3s", opacity: "1", pointerEvents: "none",
    });
    document.documentElement.appendChild(t);
    setTimeout(() => (t.style.opacity = "0"), 2200);
    setTimeout(() => t.remove(), 2600);
  }

  return filled;
})();
