(function (global) {
  var AGENTS = {
    claude: { open: "https://claude.ai/new?q=", max: 16000 },
    chatgpt: { open: "https://chatgpt.com/?q=", max: 14000 },
    grok: { open: "https://grok.com/?q=", max: 2000 }
  };
  var PASTE_HINT = "The prompt is on the clipboard. Paste it, then do your job.";
  var STORE = "kindel.fiveps.wizard.v1";
  var STEPS = ["purpose", "principles", "priorities", "people", "plan"];
  var STEP_LABELS = ["Purpose", "Principles", "Priorities", "People", "Plan"];
  var PEOPLE_EXAMPLE = "me (owner), sally (engineering), fred (pm), bob (accounting/informed)";
  var MONTHS = {
    january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
    april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
    august: 7, aug: 7, september: 8, sep: 8, sept: 8, october: 9, oct: 9,
    november: 10, nov: 10, december: 11, dec: 11
  };
  var SEASONS = {
    spring: { month: 2, day: 31, label: "Spring" },
    summer: { month: 5, day: 30, label: "Summer" },
    fall: { month: 8, day: 30, label: "Fall" },
    autumn: { month: 8, day: 30, label: "Fall" },
    winter: { month: 11, day: 31, label: "Winter" }
  };

  function todayStart() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function lastDay(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function iso(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function fromIso(s) {
    if (!s) return null;
    var p = String(s).split("-");
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function addMonths(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
    if (x.getDate() !== d.getDate()) x = new Date(x.getFullYear(), x.getMonth() + 1, 0);
    return x;
  }

  function formatDate(hit) {
    if (!hit) return "";
    if (hit.kind === "season") return hit.season + " " + hit.year;
    if (hit.kind === "quarter") return "Q" + hit.quarter + " " + hit.year;
    if (hit.kind === "year") return String(hit.year);
    if (hit.kind === "month") return hit.monthName + " " + hit.year;
    var d = fromIso(hit.iso);
    if (!d) return hit.label || hit.iso;
    return monthName(d.getMonth()) + " " + d.getDate() + ", " + d.getFullYear();
  }

  function monthName(i) {
    return ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"][i];
  }

  function guessEnd() {
    var d = addMonths(todayStart(), 6);
    return {
      iso: iso(d),
      kind: "day",
      label: formatDate({ iso: iso(d), kind: "day" }),
      source: "guess"
    };
  }

  function parseDateText(text) {
    if (!text) return null;
    var src = String(text);
    var hits = [];

    function push(hit, index) {
      if (!hit) return;
      hit.index = index;
      hits.push(hit);
    }

    src.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, function (m, y, mo, d, i) {
      var dt = new Date(+y, +mo - 1, +d);
      if (dt.getFullYear() === +y && dt.getMonth() === +mo - 1 && dt.getDate() === +d) {
        push({
          iso: m,
          kind: "day",
          year: +y,
          label: formatDate({ iso: m, kind: "day" })
        }, i);
      }
      return m;
    });

    src.replace(/\bQ([1-4])\s+(\d{4})\b/gi, function (m, q, y, i) {
      var month = (+q * 3) - 1;
      var year = +y;
      push({
        iso: iso(new Date(year, month, lastDay(year, month))),
        kind: "quarter",
        quarter: +q,
        year: year,
        label: "Q" + q + " " + year
      }, i);
      return m;
    });

    src.replace(/\b(spring|summer|fall|autumn|winter)\s+(\d{4})\b/gi, function (m, s, y, i) {
      var sea = SEASONS[s.toLowerCase()];
      var year = +y;
      push({
        iso: iso(new Date(year, sea.month, sea.day)),
        kind: "season",
        season: sea.label,
        year: year,
        label: sea.label + " " + year
      }, i);
      return m;
    });

    src.replace(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi, function (m, mon, day, y, i) {
      var mi = MONTHS[mon.toLowerCase()];
      var year = +y;
      var d = +day;
      if (d < 1 || d > lastDay(year, mi)) return m;
      var dt = new Date(year, mi, d);
      push({
        iso: iso(dt),
        kind: "day",
        year: year,
        label: formatDate({ iso: iso(dt), kind: "day" })
      }, i);
      return m;
    });

    src.replace(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s+(\d{4})\b/gi, function (m, mon, y, i) {
      var mi = MONTHS[mon.toLowerCase()];
      var year = +y;
      var dt = new Date(year, mi, lastDay(year, mi));
      push({
        iso: iso(dt),
        kind: "month",
        monthName: monthName(mi),
        year: year,
        label: monthName(mi) + " " + year
      }, i);
      return m;
    });

    src.replace(/\b(?:end\s+of\s+)?(\d{4})\b/gi, function (m, y, i) {
      var year = +y;
      if (year < 2020 || year > 2100) return m;
      push({
        iso: iso(new Date(year, 11, 31)),
        kind: "year",
        year: year,
        label: String(year)
      }, i);
      return m;
    });

    if (!hits.length) return null;
    hits = hits.filter(function (h, i, all) {
      if (h.kind !== "year") return true;
      return !all.some(function (other) {
        return other !== h && other.year === h.year && other.kind !== "year";
      });
    });
    if (!hits.length) return null;
    var by = src.toLowerCase().lastIndexOf("by ");
    if (by >= 0) {
      var after = hits.filter(function (h) { return h.index >= by; });
      if (after.length) return after[after.length - 1];
    }
    return hits[hits.length - 1];
  }

  function parsePeople(text) {
    if (!text || !text.trim()) return [];
    return text.split(/[\n;]+|,(?![^()]*\))/).map(function (part) {
      var s = part.replace(/^\s+|\s+$/g, "");
      if (!s) return null;
      var m = s.match(/^(.+?)\s*\((.+)\)\s*$/);
      if (m) return { name: m[1].replace(/^\s+|\s+$/g, ""), role: m[2].replace(/^\s+|\s+$/g, "") };
      return { name: s, role: "" };
    }).filter(Boolean);
  }

  function uid() {
    return "m" + Math.random().toString(36).slice(2, 9);
  }

  function emptyItems() {
    return [{ title: "", body: "" }, { title: "", body: "" }];
  }

  function defaultState() {
    var end = guessEnd();
    return {
      step: 0,
      purpose: "",
      endDate: end,
      purposeDate: null,
      principles: emptyItems(),
      priorities: emptyItems(),
      peopleText: "",
      milestones: []
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return defaultState();
      var s = JSON.parse(raw);
      var base = defaultState();
      Object.keys(base).forEach(function (k) {
        if (s[k] != null) base[k] = s[k];
      });
      if (!base.endDate || !base.endDate.iso) base.endDate = guessEnd();
      if (!Array.isArray(base.principles) || !base.principles.length) base.principles = emptyItems();
      if (!Array.isArray(base.priorities) || !base.priorities.length) base.priorities = emptyItems();
      if (!Array.isArray(base.milestones)) base.milestones = [];
      return base;
    } catch (e) {
      return defaultState();
    }
  }

  function saveState(state) {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  function filledItems(items) {
    return (items || []).filter(function (it) {
      return (it.title && it.title.trim()) || (it.body && it.body.trim());
    }).map(function (it) {
      return { title: (it.title || "").trim(), body: (it.body || "").trim() };
    });
  }

  function itemLine(it, i) {
    var title = it.title || ("Item " + (i + 1));
    var body = it.body || "";
    if (title && body) return (i + 1) + ". **" + title + ".** " + body;
    if (title) return (i + 1) + ". **" + title + ".**";
    return (i + 1) + ". " + body;
  }

  function workText(state) {
    var parts = [];
    if (state.purpose && state.purpose.trim()) {
      parts.push("## Purpose\n\n" + state.purpose.trim());
    }
    var prin = filledItems(state.principles);
    if (prin.length) {
      parts.push("## Principles\n\n" + prin.map(itemLine).join("\n"));
    }
    var prio = filledItems(state.priorities);
    if (prio.length) {
      parts.push("## Priorities\n\n" + prio.map(itemLine).join("\n"));
    }
    var people = parsePeople(state.peopleText);
    if (people.length) {
      parts.push("## People\n\n" + people.map(function (p) {
        if (p.role) return "- **" + p.name + ".** " + p.role + ".";
        return "- **" + p.name + ".**";
      }).join("\n"));
    }
    var plan = planLines(state);
    if (plan) parts.push(plan);
    return parts.join("\n\n");
  }

  function planLines(state) {
    var end = state.endDate;
    if (!end || !end.iso) return "";
    var start = todayStart();
    var lines = ["## Plan", ""];
    var endLabel = end.label || formatDate(end);
    if (end.source === "guess") lines.push("**End date:** " + endLabel + " (guess).");
    else lines.push("**End date:** " + endLabel + ".");
    lines.push("");
    lines.push("- **" + formatDate({ iso: iso(start), kind: "day" }) + ".** Start.");
    (state.milestones || []).slice().sort(function (a, b) {
      return (a.iso || "").localeCompare(b.iso || "");
    }).forEach(function (m) {
      if (!m.label || !m.label.trim()) return;
      var when = m.labelDate || formatDate({ iso: m.iso, kind: "day" });
      lines.push("- **" + when + ".** " + m.label.trim() + ".");
    });
    lines.push("- **" + endLabel + ".** Done.");
    return lines.join("\n");
  }

  function copyFallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  function writeClipboard(text, onDone) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onDone).catch(function () {
        copyFallback(text);
        onDone();
      });
    } else {
      copyFallback(text);
      onDone();
    }
  }

  function flash(btn, label) {
    var idle = btn.getAttribute("data-idle") || btn.textContent;
    btn.textContent = label;
    window.setTimeout(function () { btn.textContent = idle; }, 1600);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  global.kindelFivePsWizard = function (opts) {
    opts = opts || {};
    var root = document.getElementById(opts.root || "fiveps-wizard");
    var promptEl = document.getElementById(opts.prompt || "fiveps-prompt");
    if (!root) return;

    var state = loadState();
    var drag = null;
    var suppressTrackClick = false;

    function promptText() {
      return (promptEl && promptEl.textContent) || "";
    }

    function payload() {
      var work = workText(state);
      var prompt = promptText();
      if (!work) return prompt;
      return "The human wrote this:\n\n" + work + "\n\nNow do your job.\n\n" + prompt;
    }

    function persist() {
      saveState(state);
    }

    function setEndFromHit(hit, source) {
      if (!hit) return;
      state.endDate = {
        iso: hit.iso,
        kind: hit.kind,
        label: hit.label || formatDate(hit),
        monthName: hit.monthName,
        year: hit.year,
        quarter: hit.quarter,
        season: hit.season,
        source: source
      };
    }

    function applyPurposeDate() {
      var hit = parseDateText(state.purpose);
      if (hit) {
        state.purposeDate = hit;
        if (!state.endDate || state.endDate.source !== "plan") {
          setEndFromHit(hit, "purpose");
        }
      } else {
        state.purposeDate = null;
        if (state.endDate && state.endDate.source === "purpose") {
          state.endDate = guessEnd();
        }
      }
    }

    function render() {
      persist();
      root.innerHTML = markup();
      bind();
    }

    function markup() {
      var panels = [
        panelPurpose,
        function () {
          return panelList("principles", 1, "Principles", "Non-negotiable rules. How we act. Title, then the rule on the same line.", "A few things, very well", "We do a few things very well. We are better off not having a capability than doing it poorly.");
        },
        function () {
          return panelList("priorities", 2, "Priorities", "P1 goes first, with more energy. What waits if P1 slips belongs here. If everything is P1, nothing is.", "Consumer developer", "Products for the general public. This is where the mass goes first. If this slips, enterprise work waits.");
        },
        panelPeople,
        panelPlan
      ];
      return stepNav() + panels[state.step]() + stepButtons() + actions();
    }

    function stepNav() {
      var items = STEPS.map(function (id, i) {
        var cls = "fiveps-step";
        if (i === state.step) cls += " is-current";
        else if (i < state.step) cls += " is-done";
        return "<button type=\"button\" class=\"" + cls + "\" data-goto=\"" + i + "\">" +
          "<span class=\"fiveps-step-num\">" + (i + 1) + "</span>" +
          "<span class=\"fiveps-step-name\">" + STEP_LABELS[i] + "</span></button>";
      }).join("");
      return "<nav class=\"fiveps-steps\" aria-label=\"5Ps steps\">" + items + "</nav>";
    }

    function panelPurpose() {
      var end = state.endDate || guessEnd();
      var note = "";
      if (state.purposeDate) {
        note = "<p class=\"fiveps-note\">End date is <strong>" + esc(end.label) + "</strong>. Purpose names it. Plan keeps it.</p>";
      } else if (end.source === "guess") {
        note = "<p class=\"fiveps-note\">Purpose is unfinished without a by-when. The Plan is using <strong>" + esc(end.label) + "</strong> as a guess.</p>";
      } else {
        note = "<p class=\"fiveps-note\">End date is <strong>" + esc(end.label) + "</strong>.</p>";
      }
      return "<section class=\"fiveps-panel\" data-panel=\"0\">" +
        "<p class=\"kld-section-label\">Step 1</p>" +
        "<h2>Purpose</h2>" +
        "<p>Why this exists, for whom, what you will deliver, and by when. One sentence is enough. The date is the end date.</p>" +
        "<label class=\"fiveps-field-label\" for=\"fiveps-purpose\">The purpose</label>" +
        "<textarea id=\"fiveps-purpose\" class=\"fiveps-work\" rows=\"4\" placeholder=\"Deliver foo by May 2027\">" + esc(state.purpose) + "</textarea>" +
        "<div class=\"fiveps-endrow\">" +
        "<label class=\"fiveps-field-label\" for=\"fiveps-end\">End date</label>" +
        "<input id=\"fiveps-end\" class=\"fiveps-end\" type=\"text\" value=\"" + esc(end.label || "") + "\" placeholder=\"May 2027\">" +
        "</div>" +
        note +
        "</section>";
    }

    function panelList(key, step, title, help, phTitle, phBody) {
      var rows = (state[key] || emptyItems()).map(function (it, i) {
        return "<li class=\"fiveps-item\">" +
          "<span class=\"fiveps-item-num\">" + (i + 1) + "</span>" +
          "<input class=\"fiveps-item-title\" data-list=\"" + key + "\" data-i=\"" + i + "\" data-field=\"title\" value=\"" + esc(it.title) + "\" placeholder=\"" + esc(phTitle) + "\">" +
          "<input class=\"fiveps-item-body\" data-list=\"" + key + "\" data-i=\"" + i + "\" data-field=\"body\" value=\"" + esc(it.body) + "\" placeholder=\"" + esc(phBody) + "\">" +
          "<button type=\"button\" class=\"fiveps-item-remove\" data-remove=\"" + key + "\" data-i=\"" + i + "\" aria-label=\"Remove\">×</button>" +
          "</li>";
      }).join("");
      var extra = "";
      if (key === "principles") {
        extra = "<p class=\"fiveps-help\">For the craft of the list, use the <a href=\"https://kindel.com/tenets/\">tenet editor</a>.</p>";
      }
      return "<section class=\"fiveps-panel\" data-panel=\"" + step + "\">" +
        "<p class=\"kld-section-label\">Step " + (step + 1) + "</p>" +
        "<h2>" + title + "</h2>" +
        "<p>" + help + "</p>" +
        "<ol class=\"fiveps-items\">" + rows + "</ol>" +
        "<p><button type=\"button\" class=\"fiveps-add\" data-add=\"" + key + "\">Add another</button></p>" +
        extra +
        "</section>";
    }

    function panelPeople() {
      var people = parsePeople(state.peopleText);
      var chips = people.map(function (p) {
        var role = p.role ? "<span class=\"fiveps-chip-role\">" + esc(p.role) + "</span>" : "";
        return "<li class=\"fiveps-chip\"><strong>" + esc(p.name) + "</strong>" + role + "</li>";
      }).join("");
      return "<section class=\"fiveps-panel\" data-panel=\"3\">" +
        "<p class=\"kld-section-label\">Step 4</p>" +
        "<h2>People</h2>" +
        "<p>Named humans, and what they own. Type a list. Roles go in parentheses.</p>" +
        "<label class=\"fiveps-field-label\" for=\"fiveps-people\">Who is on this</label>" +
        "<textarea id=\"fiveps-people\" class=\"fiveps-work fiveps-work-short\" rows=\"3\" placeholder=\"" + esc(PEOPLE_EXAMPLE) + "\">" + esc(state.peopleText) + "</textarea>" +
        "<p class=\"fiveps-example\">Example. <button type=\"button\" class=\"fiveps-example-use\" id=\"fiveps-use-people\">" + esc(PEOPLE_EXAMPLE) + "</button></p>" +
        (chips ? "<ul class=\"fiveps-chips\">" + chips + "</ul>" : "") +
        "</section>";
    }

    function panelPlan() {
      var end = state.endDate || guessEnd();
      var startLabel = formatDate({ iso: iso(todayStart()), kind: "day" });
      var rows = (state.milestones || []).slice().sort(function (a, b) {
        return (a.iso || "").localeCompare(b.iso || "");
      }).map(function (m) {
        return "<li class=\"fiveps-ms-row\" data-mid=\"" + esc(m.id) + "\">" +
          "<input class=\"fiveps-ms-date\" type=\"date\" data-ms-date=\"" + esc(m.id) + "\" value=\"" + esc(m.iso) + "\">" +
          "<input class=\"fiveps-ms-label\" data-ms-label=\"" + esc(m.id) + "\" value=\"" + esc(m.label || "") + "\" placeholder=\"Milestone\">" +
          "<button type=\"button\" class=\"fiveps-item-remove\" data-ms-remove=\"" + esc(m.id) + "\" aria-label=\"Remove milestone\">×</button>" +
          "</li>";
      }).join("");
      return "<section class=\"fiveps-panel\" data-panel=\"4\">" +
        "<p class=\"kld-section-label\">Step 5</p>" +
        "<h2>Plan</h2>" +
        "<p>Today is on the left. The end date is on the right. Add milestones, then slide them to make room. Drag the end to expand.</p>" +
        "<div class=\"fiveps-timeline\" id=\"fiveps-timeline\" tabindex=\"0\">" +
        "<div class=\"fiveps-track\" id=\"fiveps-track\">" +
        "<span class=\"fiveps-rail\"></span>" +
        timelineMarks() +
        "</div></div>" +
        "<p class=\"fiveps-tl-legend\"><span>Today · " + esc(startLabel) + "</span><span>" + esc(end.label) + "</span></p>" +
        "<p><button type=\"button\" class=\"fiveps-add\" id=\"fiveps-add-ms\">Add a milestone</button></p>" +
        (rows ? "<ul class=\"fiveps-ms-list\">" + rows + "</ul>" : "") +
        "</section>";
    }

    function range() {
      var start = todayStart().getTime();
      var end = fromIso((state.endDate && state.endDate.iso) || guessEnd().iso);
      if (!end || end.getTime() <= start) end = addMonths(todayStart(), 1);
      return { start: start, end: end.getTime(), span: Math.max(end.getTime() - start, 86400000) };
    }

    function pctForIso(s) {
      var d = fromIso(s);
      if (!d) return 0;
      var r = range();
      return Math.max(0, Math.min(1, (d.getTime() - r.start) / r.span));
    }

    function isoAtPct(pct) {
      var r = range();
      var t = r.start + (r.span * Math.max(0, Math.min(1, pct)));
      var d = new Date(t);
      return iso(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    function timelineMarks() {
      var marks = [];
      marks.push(mark("start", iso(todayStart()), "Today", 0, true));
      (state.milestones || []).forEach(function (m) {
        marks.push(mark(m.id, m.iso, m.label || "Milestone", pctForIso(m.iso), false));
      });
      marks.push(mark("end", state.endDate.iso, state.endDate.label || "End", 1, false, true));
      return marks.join("");
    }

    function mark(id, dateIso, label, pct, locked, isEnd) {
      var cls = "fiveps-mark";
      if (locked) cls += " is-locked";
      if (isEnd) cls += " is-end";
      var left = (pct * 100).toFixed(2);
      var day = formatDate({ iso: dateIso, kind: "day" });
      var showDay = label && day && label !== day && !(isEnd && state.endDate && state.endDate.kind !== "day");
      return "<button type=\"button\" class=\"" + cls + "\" data-mark=\"" + esc(id) + "\" style=\"left:" + left + "%\" " +
        (locked ? "disabled " : "") + ">" +
        "<span class=\"fiveps-mark-dot\"></span>" +
        "<span class=\"fiveps-mark-label\">" + esc(label) + "</span>" +
        (showDay ? "<span class=\"fiveps-mark-date\">" + esc(day) + "</span>" : "") +
        "</button>";
    }

    function stepButtons() {
      var back = state.step === 0 ? " hidden" : "";
      var nextLabel = state.step === 4 ? "" : "Next";
      var next = state.step === 4 ? " hidden" : "";
      return "<p class=\"fiveps-pager\">" +
        "<button type=\"button\" class=\"fiveps-back\" id=\"fiveps-back\"" + back + ">Back</button>" +
        "<button type=\"button\" class=\"fiveps-next\" id=\"fiveps-next\"" + next + ">" + nextLabel + "</button>" +
        "</p>";
    }

    function actions() {
      return "<p class=\"fiveps-actions\" id=\"fiveps-actions\">" +
        "<button type=\"button\" class=\"fiveps-open\" data-agent=\"claude\" data-idle=\"Claude\">Claude</button>" +
        "<button type=\"button\" class=\"fiveps-open\" data-agent=\"chatgpt\" data-idle=\"ChatGPT\">ChatGPT</button>" +
        "<button type=\"button\" class=\"fiveps-open\" data-agent=\"grok\" data-idle=\"Grok\">Grok</button>" +
        "<button type=\"button\" class=\"fiveps-copy\" data-agent=\"copy\" data-idle=\"Copy\">Copy</button>" +
        "</p>" +
        "<p class=\"fiveps-actions-note\">Copy the prompt, or open an agent with it filled in. Works on every step.</p>" +
        "<p class=\"fiveps-reset-wrap\"><button type=\"button\" class=\"fiveps-reset\" id=\"fiveps-reset\">Start over</button></p>";
    }

    function bind() {
      root.querySelectorAll("[data-goto]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.step = +btn.getAttribute("data-goto");
          render();
        });
      });
      var back = document.getElementById("fiveps-back");
      if (back) back.addEventListener("click", function () {
        state.step = Math.max(0, state.step - 1);
        render();
      });
      var next = document.getElementById("fiveps-next");
      if (next) next.addEventListener("click", function () {
        state.step = Math.min(4, state.step + 1);
        render();
      });
      var purpose = document.getElementById("fiveps-purpose");
      if (purpose) {
        purpose.addEventListener("input", function () {
          state.purpose = purpose.value;
          applyPurposeDate();
          persist();
          refreshPurposeNote();
          var end = document.getElementById("fiveps-end");
          if (end && state.endDate) end.value = state.endDate.label;
        });
      }
      var endInput = document.getElementById("fiveps-end");
      if (endInput) {
        endInput.addEventListener("change", function () {
          var hit = parseDateText(endInput.value);
          if (hit) {
            setEndFromHit(hit, "plan");
            render();
          } else {
            endInput.value = state.endDate.label;
          }
        });
      }
      root.querySelectorAll("[data-list]").forEach(function (input) {
        input.addEventListener("input", function () {
          var key = input.getAttribute("data-list");
          var i = +input.getAttribute("data-i");
          var field = input.getAttribute("data-field");
          if (!state[key][i]) state[key][i] = { title: "", body: "" };
          state[key][i][field] = input.value;
          persist();
        });
      });
      root.querySelectorAll("[data-add]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-add");
          state[key].push({ title: "", body: "" });
          render();
          var titles = root.querySelectorAll("[data-list=\"" + key + "\"][data-field=\"title\"]");
          if (titles.length) titles[titles.length - 1].focus();
        });
      });
      root.querySelectorAll("[data-remove]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-remove");
          var i = +btn.getAttribute("data-i");
          state[key].splice(i, 1);
          if (!state[key].length) state[key] = emptyItems();
          render();
        });
      });
      var people = document.getElementById("fiveps-people");
      if (people) {
        people.addEventListener("input", function () {
          state.peopleText = people.value;
          persist();
          refreshPeopleChips();
        });
      }
      var usePeople = document.getElementById("fiveps-use-people");
      if (usePeople) {
        usePeople.addEventListener("click", function () {
          state.peopleText = PEOPLE_EXAMPLE;
          render();
        });
      }
      var addMs = document.getElementById("fiveps-add-ms");
      if (addMs) addMs.addEventListener("click", function () { addMilestone(); });
      root.querySelectorAll("[data-ms-remove]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-ms-remove");
          state.milestones = state.milestones.filter(function (m) { return m.id !== id; });
          render();
        });
      });
      root.querySelectorAll("[data-ms-label]").forEach(function (input) {
        input.addEventListener("input", function () {
          var id = input.getAttribute("data-ms-label");
          var m = findMs(id);
          if (m) { m.label = input.value; persist(); refreshTimeline(); }
        });
      });
      root.querySelectorAll("[data-ms-date]").forEach(function (input) {
        input.addEventListener("change", function () {
          var id = input.getAttribute("data-ms-date");
          var m = findMs(id);
          if (m && input.value) {
            m.iso = input.value;
            m.labelDate = formatDate({ iso: input.value, kind: "day" });
            maybeExpandEnd(m.iso);
            render();
          }
        });
      });
      bindTimeline();
      var actionsEl = document.getElementById("fiveps-actions");
      if (actionsEl) {
        actionsEl.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-agent]");
          if (!btn) return;
          var agent = btn.getAttribute("data-agent");
          var text = payload();
          if (agent === "copy") {
            writeClipboard(text, function () {
              flash(btn, "Copied");
              if (typeof gtag === "function") gtag("event", "fiveps_copy");
            });
            return;
          }
          var spec = AGENTS[agent];
          if (!spec) return;
          var url = spec.open + encodeURIComponent(text);
          if (url.length > spec.max) {
            writeClipboard(text, function () {
              flash(btn, "Copied. Paste it");
              window.open(spec.open + encodeURIComponent(PASTE_HINT), "_blank", "noopener");
              if (typeof gtag === "function") gtag("event", "fiveps_copy");
            });
            return;
          }
          window.open(url, "_blank", "noopener");
          if (typeof gtag === "function") gtag("event", "fiveps_open", { agent: agent });
        });
      }
      var reset = document.getElementById("fiveps-reset");
      if (reset) reset.addEventListener("click", function () {
        if (!window.confirm("Clear this 5Ps and start over?")) return;
        state = defaultState();
        render();
      });
    }

    function refreshPurposeNote() {
      var panel = root.querySelector("[data-panel=\"0\"]");
      if (!panel) return;
      var note = panel.querySelector(".fiveps-note");
      if (!note || !state.endDate) return;
      if (state.purposeDate) {
        note.innerHTML = "End date is <strong>" + esc(state.endDate.label) + "</strong>. Purpose names it. Plan keeps it.";
      } else if (state.endDate.source === "guess") {
        note.innerHTML = "Purpose is unfinished without a by-when. The Plan is using <strong>" + esc(state.endDate.label) + "</strong> as a guess.";
      } else {
        note.innerHTML = "End date is <strong>" + esc(state.endDate.label) + "</strong>.";
      }
    }

    function refreshPeopleChips() {
      var panel = root.querySelector("[data-panel=\"3\"]");
      if (!panel) return;
      var people = parsePeople(state.peopleText);
      var old = panel.querySelector(".fiveps-chips");
      if (old) old.remove();
      if (!people.length) return;
      var ul = document.createElement("ul");
      ul.className = "fiveps-chips";
      ul.innerHTML = people.map(function (p) {
        var role = p.role ? "<span class=\"fiveps-chip-role\">" + esc(p.role) + "</span>" : "";
        return "<li class=\"fiveps-chip\"><strong>" + esc(p.name) + "</strong>" + role + "</li>";
      }).join("");
      var example = panel.querySelector(".fiveps-example");
      if (example && example.parentNode) example.parentNode.insertBefore(ul, example.nextSibling);
      else panel.appendChild(ul);
    }

    function findMs(id) {
      return state.milestones.filter(function (m) { return m.id === id; })[0];
    }

    function addMilestone(atIso, label) {
      var r = range();
      var dateIso = atIso;
      if (!dateIso) {
        var used = [iso(todayStart()), state.endDate.iso].concat(state.milestones.map(function (m) { return m.iso; }));
        dateIso = largestGapIso(used, r);
      }
      state.milestones.push({
        id: uid(),
        iso: dateIso,
        label: label || "Milestone",
        labelDate: formatDate({ iso: dateIso, kind: "day" })
      });
      render();
      var labels = root.querySelectorAll("[data-ms-label]");
      if (labels.length) {
        labels[labels.length - 1].focus();
        labels[labels.length - 1].select();
      }
    }

    function largestGapIso(used, r) {
      var times = used.map(function (s) {
        var d = fromIso(s);
        return d ? d.getTime() : r.start;
      }).sort(function (a, b) { return a - b; });
      var best = r.start;
      var bestSpan = 0;
      for (var i = 0; i < times.length - 1; i++) {
        var span = times[i + 1] - times[i];
        if (span > bestSpan) {
          bestSpan = span;
          best = times[i] + span / 2;
        }
      }
      var d = new Date(best);
      return iso(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    function maybeExpandEnd(dateIso) {
      var d = fromIso(dateIso);
      var end = fromIso(state.endDate.iso);
      if (d && end && d.getTime() > end.getTime()) {
        setEndFromHit({ iso: dateIso, kind: "day", label: formatDate({ iso: dateIso, kind: "day" }) }, "plan");
      }
    }

    function refreshTimeline() {
      var track = document.getElementById("fiveps-track");
      if (!track) return;
      var rail = track.querySelector(".fiveps-rail");
      track.innerHTML = "";
      if (rail) track.appendChild(rail);
      else {
        var span = document.createElement("span");
        span.className = "fiveps-rail";
        track.appendChild(span);
      }
      track.insertAdjacentHTML("beforeend", timelineMarks());
      bindMarks();
    }

    function bindTimeline() {
      var track = document.getElementById("fiveps-track");
      if (!track) return;
      track.addEventListener("click", function (e) {
        if (suppressTrackClick) {
          suppressTrackClick = false;
          return;
        }
        if (e.target.closest("[data-mark]")) return;
        var rect = track.getBoundingClientRect();
        if (!rect.width) return;
        var pct = (e.clientX - rect.left) / rect.width;
        addMilestone(isoAtPct(pct), "Milestone");
      });
      bindMarks();
    }

    function bindMarks() {
      root.querySelectorAll("[data-mark]").forEach(function (btn) {
        if (btn.disabled) return;
        btn.addEventListener("pointerdown", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var track = document.getElementById("fiveps-track");
          if (!track) return;
          drag = {
            id: btn.getAttribute("data-mark"),
            track: track
          };
          btn.classList.add("is-dragging");
          btn.setPointerCapture(e.pointerId);
        });
        btn.addEventListener("pointermove", function (e) {
          if (!drag || drag.id !== btn.getAttribute("data-mark")) return;
          moveMark(drag.id, e.clientX);
        });
        btn.addEventListener("pointerup", function () {
          if (!drag) return;
          btn.classList.remove("is-dragging");
          drag = null;
          suppressTrackClick = true;
          render();
        });
        btn.addEventListener("pointercancel", function () {
          drag = null;
          suppressTrackClick = true;
          render();
        });
      });
    }

    function moveMark(id, clientX) {
      var track = document.getElementById("fiveps-track");
      if (!track) return;
      var rect = track.getBoundingClientRect();
      var pct = (clientX - rect.left) / rect.width;
      var nextIso = isoAtPct(pct);
      if (id === "end") {
        var minEnd = todayStart();
        state.milestones.forEach(function (m) {
          var d = fromIso(m.iso);
          if (d && d > minEnd) minEnd = d;
        });
        var next = fromIso(nextIso);
        if (next && next < minEnd) nextIso = iso(minEnd);
        setEndFromHit({ iso: nextIso, kind: "day", label: formatDate({ iso: nextIso, kind: "day" }) }, "plan");
        refreshTimeline();
        persist();
        return;
      }
      var m = findMs(id);
      if (!m) return;
      m.iso = nextIso;
      m.labelDate = formatDate({ iso: nextIso, kind: "day" });
      pushNeighbors(id, track.clientWidth);
      maybeExpandEnd(m.iso);
      refreshTimeline();
      persist();
    }

    function pushNeighbors(movedId, width) {
      var r = range();
      var minMs = Math.max(7 * 86400000, r.span * (36 / Math.max(width, 1)));
      var items = state.milestones.slice().sort(function (a, b) {
        return fromIso(a.iso).getTime() - fromIso(b.iso).getTime();
      });
      var idx = -1;
      items.forEach(function (m, i) { if (m.id === movedId) idx = i; });
      if (idx < 0) return;
      for (var i = idx; i < items.length - 1; i++) {
        var a = fromIso(items[i].iso).getTime();
        var b = fromIso(items[i + 1].iso).getTime();
        if (b - a < minMs) {
          var pushed = new Date(a + minMs);
          items[i + 1].iso = iso(new Date(pushed.getFullYear(), pushed.getMonth(), pushed.getDate()));
          items[i + 1].labelDate = formatDate({ iso: items[i + 1].iso, kind: "day" });
        }
      }
      for (var j = idx; j > 0; j--) {
        var c = fromIso(items[j].iso).getTime();
        var d = fromIso(items[j - 1].iso).getTime();
        if (c - d < minMs) {
          var back = new Date(c - minMs);
          var floor = todayStart().getTime() + 86400000;
          if (back.getTime() < floor) back = new Date(floor);
          items[j - 1].iso = iso(new Date(back.getFullYear(), back.getMonth(), back.getDate()));
          items[j - 1].labelDate = formatDate({ iso: items[j - 1].iso, kind: "day" });
        }
      }
      items.forEach(function (m) { maybeExpandEnd(m.iso); });
    }

    applyPurposeDate();
    render();
  };

  global.kindelFivePsParseDate = parseDateText;
  global.kindelFivePsParsePeople = parsePeople;
})(window);
