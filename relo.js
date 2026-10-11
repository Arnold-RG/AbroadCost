const COUNTRIES = window.RELO_COUNTRIES || [];
const CURRENCIES = window.RELO_CURRENCIES || [];
const DATA_SOURCE = window.RELO_DATA_SOURCE || {};
const FX_SOURCE = window.RELO_FX_SOURCE || {};
const SALARY_SOURCE = window.RELO_SALARY_SOURCE || {};
const FX = Object.fromEntries(CURRENCIES.map((c) => [c.code, Number(c.usd) || 1]));

const MONTHLY_USD = {
  housing: 1400,
  food: 520,
  transport: 280,
  utilities: 220,
  healthcare: 180,
  other: 200
};

const VISA_BY_DEST = {
  US: { tourist: 185, business: 185, student: 185, work: 205, transit: 185, dependent: 185, residence: 325 },
  GB: { tourist: 148, business: 148, student: 630, work: 827, transit: 82, dependent: 148, residence: 1910 },
  CA: { tourist: 74, business: 74, student: 110, work: 155, transit: 74, dependent: 74, residence: 850 },
  AU: { tourist: 20, business: 145, student: 710, work: 465, transit: 20, dependent: 145, residence: 3220 },
  DE: { tourist: 98, business: 98, student: 82, work: 120, transit: 98, dependent: 98, residence: 130 },
  FR: { tourist: 98, business: 98, student: 82, work: 120, transit: 98, dependent: 98, residence: 130 },
  IT: { tourist: 98, business: 98, student: 82, work: 120, transit: 98, dependent: 98, residence: 130 },
  ES: { tourist: 98, business: 98, student: 82, work: 120, transit: 98, dependent: 98, residence: 130 },
  NL: { tourist: 98, business: 98, student: 82, work: 120, transit: 98, dependent: 98, residence: 130 },
  RW: { tourist: 50, business: 50, student: 50, work: 100, transit: 30, dependent: 50, residence: 100 },
  KE: { tourist: 34, business: 34, student: 50, work: 150, transit: 20, dependent: 50, residence: 150 },
  IN: { tourist: 25, business: 80, student: 80, work: 100, transit: 20, dependent: 80, residence: 100 },
  CN: { tourist: 140, business: 140, student: 140, work: 140, transit: 140, dependent: 140, residence: 140 },
  JP: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  AE: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 }
};

const VISA_FEE_USD = {
  none: 0, tourist: 70, business: 110, student: 150, work: 220,
  transit: 40, dependent: 110, residence: 350
};
const PAPERS_USD = { none: 0, basic: 45, standard: 180, full: 520 };
const PURPOSE_EXTRA_USD = {
  visit: 0, work: 150, study: 200, business: 75, family: 100,
  medical: 160, nomad: 80, permanent: 320
};
const PURPOSE_LABEL = {
  visit: "Visiting / tourism", work: "Work / employment", study: "Studying",
  business: "Business / meetings", family: "Family visit / joining family",
  medical: "Medical treatment", nomad: "Long stay / remote work",
  permanent: "Permanent stay / residence"
};
const VISA_LABEL = {
  none: "No visa / visa-free / visa on arrival", tourist: "Tourist visa",
  business: "Business visa", student: "Student visa", work: "Work / employment visa",
  transit: "Transit visa", dependent: "Dependent / family visa",
  residence: "Residence / permanent stay visa"
};

function country(code) {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0] || null;
}

function convert(usd, code) {
  return usd / (FX[code] || 1);
}

function money(usd, code) {
  if (usd == null || Number.isNaN(Number(usd))) return "—";
  const v = convert(Number(usd), code);
  const whole = ["JPY", "KRW", "VND", "IDR", "RWF", "UGX", "TZS", "CLP", "COP", "HUF", "ISK", "VUV", "XOF", "XAF"].includes(code);
  const n = whole
    ? Math.round(v).toLocaleString()
    : v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `${code} ${n}`;
}

function fmtNum(v, digits = 1) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function householdFactor(adults, children) {
  return 1 + 0.65 * (Math.max(1, adults | 0) - 1) + 0.4 * Math.max(0, children | 0);
}

function monthlyBreakdown(col, life, adults, children) {
  const h = householdFactor(adults, children);
  const colSafe = Number(col) > 0 ? Number(col) : 1;
  const rows = {};
  let total = 0;
  for (const [k, base] of Object.entries(MONTHLY_USD)) {
    const scale = k === "housing" ? 1 + (h - 1) * 0.65 : h;
    const v = base * colSafe * life * scale;
    rows[k] = v;
    total += v;
  }
  return { rows, total };
}

function visaFeeUsd(destCode, visa) {
  if (visa === "none") return 0;
  const row = VISA_BY_DEST[destCode];
  if (row && row[visa] != null) return row[visa];
  return VISA_FEE_USD[visa] || 0;
}

function flightCostPerPerson(from, to, flightType) {
  if (flightType === "none") return 0;
  const sameRegion = from.region === to.region;
  let seat = (sameRegion ? 220 : 720) * (0.85 + 0.15 * (((Number(from.col) || 1) + (Number(to.col) || 1)) / 2));
  if (flightType.includes("premium")) seat *= 2.35;
  if (flightType.startsWith("round")) seat *= 1.85;
  return Math.round(seat);
}

function adminCosts(from, to, people, purpose, visa, papers, flightType) {
  const p = Math.max(1, people | 0);
  const visaFee = visaFeeUsd(to.code, visa) * p;
  const paperFee = (PAPERS_USD[papers] || 0) * p;
  const purposeAdmin = (PURPOSE_EXTRA_USD[purpose] || 0) * p;
  let visaExtras = 0;
  if (visa !== "none" && ["US", "GB", "CA", "AU", "IN", "CN"].includes(to.code)) visaExtras += 40 * p;
  if (visa === "work" || visa === "student" || visa === "residence") visaExtras += 80 * p;
  if (visa !== "none" && purpose === "permanent") visaExtras += 150 * p;
  const flights = flightCostPerPerson(from, to, flightType) * p;
  return {
    visaFee, visaExtras, paperFee, purposeAdmin, flights,
    admin: visaFee + paperFee + purposeAdmin + visaExtras,
    visaRequired: visa !== "none"
  };
}

function permanentMoveBudget(opts) {
  const { from, to, people, life, purpose, visa, papers, flightType } = opts;
  const p = Math.max(1, people | 0);
  const monthly = monthlyBreakdown(to.col, life, p, 0);
  const a = adminCosts(from, to, people, purpose, visa, papers, flightType);
  const deposit = monthly.rows.housing * 2;
  const householdSetup = (900 + 700 * (Number(to.col) || 1)) * (1 + 0.45 * (p - 1));
  const settling = monthly.total * 0.35;
  return {
    mode: "permanent",
    moveTotal: a.admin + a.flights + deposit + householdSetup + settling,
    monthlyTotal: monthly.total,
    monthlyRows: monthly.rows,
    deposit, householdSetup, settling,
    ...a
  };
}

function stayBudget(opts) {
  const { from, to, days, people, life, purpose, visa, papers, flightType } = opts;
  if (purpose === "permanent") return permanentMoveBudget(opts);

  const d = Math.max(1, days | 0);
  const p = Math.max(1, people | 0);
  const h = householdFactor(p, 0);
  const monthly = Object.values(MONTHLY_USD).reduce((a, b) => a + b, 0) * (Number(to.col) || 1) * life * h;
  const daily = monthly / 30;
  const lodging = daily * 0.42 * d;
  const food = daily * 0.28 * d;
  const transport = daily * 0.14 * d;
  const local = daily * 0.16 * d;
  const arrival = daily * Math.min(18, Math.max(8, 22 - d / 20));
  const purposeSetup = { visit: 1, business: 1.05, family: 1.1, medical: 1.15, nomad: 1.2, study: 1.35, work: 1.4 }[purpose] || 1;
  const setupExtra = arrival * (purposeSetup - 1);
  const a = adminCosts(from, to, people, purpose, visa, papers, flightType);
  const living = lodging + food + transport + local + arrival + setupExtra;
  return {
    mode: "stay", total: living + a.admin + a.flights,
    lodging, food, transport, local, arrival: arrival + setupExtra,
    ...a, daily, living, monthlyEquivalent: monthly
  };
}

function sortedCountries() {
  return COUNTRIES.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function sortedCurrencies() {
  return CURRENCIES.slice().sort((a, b) => a.code.localeCompare(b.code));
}

function fillCountrySelect(el, selected) {
  if (!el) return;
  if (!COUNTRIES.length) {
    el.innerHTML = '<option value="">No countries loaded</option>';
    return;
  }
  const list = sortedCountries();
  el.innerHTML = list
    .map((c) => `<option value="${c.code}">${c.name} — ${c.currency}</option>`)
    .join("");
  if (selected && COUNTRIES.some((c) => c.code === selected)) el.value = selected;
}

function fillCurrencySelect(el, selected) {
  if (!el) return;
  if (!CURRENCIES.length) {
    el.innerHTML = '<option value="USD">USD — US Dollar</option>';
    return;
  }
  const list = sortedCurrencies();
  // Group A–Z with optgroups for easier scanning
  const groups = {};
  list.forEach((c) => {
    const letter = (c.code[0] || "#").toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(c);
  });
  el.innerHTML = Object.keys(groups).sort().map((letter) => {
    const opts = groups[letter]
      .map((c) => `<option value="${c.code}">${c.code} — ${c.name}</option>`)
      .join("");
    return `<optgroup label="${letter}">${opts}</optgroup>`;
  }).join("");
  if (selected && FX[selected]) el.value = selected;
}

function suggestVisaForPurpose(purpose) {
  return {
    visit: "tourist", work: "work", study: "student", business: "business",
    family: "dependent", medical: "tourist", nomad: "tourist", permanent: "residence"
  }[purpose] || "tourist";
}

function sourceFootnote() {
  const wb = DATA_SOURCE.provider || "World Bank WDI";
  const fx = FX_SOURCE.date
    ? `FX: ${FX_SOURCE.provider || "open.er-api.com"} (${FX_SOURCE.date})`
    : "FX: open.er-api.com";
  return `${wb}. ${fx}.`;
}

function salaryRangeText(low, high, cur) {
  if (low == null || high == null) return "No wage series";
  return `${money(low, cur)} – ${money(high, cur)}`;
}

function renderSalary(c, cur) {
  const has = c && c.grossAvg != null;
  const g = document.getElementById("m-gross");
  const n = document.getElementById("m-net");
  const a = document.getElementById("m-avg-salary");
  const note = document.getElementById("m-salary-note");
  if (g) g.textContent = has ? salaryRangeText(c.grossLow, c.grossHigh, cur) : "—";
  if (n) n.textContent = has ? salaryRangeText(c.netLow, c.netHigh, cur) : "—";
  if (a) a.textContent = has ? `${money(c.grossAvg, cur)} → ${money(c.netAvg, cur)}` : "—";
  if (note) {
    if (!has) {
      note.textContent = c ? `No salary range available for ${c.name}.` : "";
      return;
    }
    const y = c.salaryYear ? ` (${c.salaryYear})` : "";
    note.textContent =
      `Typical employee gross/net range at 67%–167% of average wage${y}.`;
  }
}

/**
 * Rates for a country (0–100):
 * - liveRate: typical take-home salary vs a decent living budget
 * - jobGeneral: how easy for one person to obtain a general (any) job
 */
function jobRates(c) {
  if (!c) {
    return {
      liveRate: null, jobGeneral: null,
      gross: null, net: null, living: null, cover: null
    };
  }

  const gross = c.grossAvg != null ? Number(c.grossAvg) : null;
  let net = c.netAvg != null ? Number(c.netAvg) : null;
  if (net == null && gross != null) {
    const keep = c.taxPct != null ? Math.max(0.4, 1 - Number(c.taxPct) / 100) : 0.78;
    net = gross * keep;
  }
  // Prefer net (take-home); fall back to gross
  const salary = net != null ? net : gross;

  // Decent life-standard budget (COL floor so low-PPP countries aren't understated)
  const colEff = Math.max(Number(c.col) || 0.35, 0.42);
  const living = monthlyBreakdown(colEff, 1.25, 1, 0).total;

  let liveRate = null;
  let cover = null;
  if (salary != null && living > 0) {
    cover = salary / living;
    // 1.0× budget ≈ 55; very low pay (e.g. Rwanda) ≈ single digits
    liveRate = Math.round(Math.max(5, Math.min(96, 5 + cover * 50)));
  }

  // General job obtainability: mainly unemployment pressure + growth.
  // Low absolute wages add a mild underemployment drag for general hiring.
  let hiringEase = null;
  if (c.unemp != null) {
    hiringEase = Math.max(10, Math.min(88, 90 - Number(c.unemp) * 3.8));
  } else if (c.jobs != null) {
    hiringEase = Math.max(10, Math.min(88, Number(c.jobs) * 0.82));
  }

  const growthScore = c.growth == null
    ? 48
    : Math.max(15, Math.min(85, 45 + Number(c.growth) * 4));

  let underempDrag = 55;
  if (salary != null) {
    // Very low pay ⇒ more underemployment / scarce stable jobs
    underempDrag = Math.max(12, Math.min(80, 15 + 65 * (1 - Math.exp(-salary / 900))));
  }

  let jobGeneral = null;
  if (hiringEase != null) {
    jobGeneral = Math.round(Math.max(
      8,
      Math.min(92, hiringEase * 0.55 + growthScore * 0.25 + underempDrag * 0.2)
    ));
  }

  return {
    liveRate,
    jobGeneral,
    gross,
    net,
    living,
    cover
  };
}

function withJobRates(list) {
  return list.map((c) => {
    const r = jobRates(c);
    return {
      ...c,
      liveRate: r.liveRate,
      jobGeneral: r.jobGeneral
    };
  });
}

function renderMonthly() {
  const c = country(document.getElementById("m-country").value);
  if (!c) return;
  const adults = +document.getElementById("m-adults").value || 1;
  const children = +document.getElementById("m-children").value || 0;
  const life = +document.getElementById("m-life").value || 1;
  const cur = document.getElementById("m-currency").value || "USD";
  const { rows, total } = monthlyBreakdown(c.col, life, adults, children);

  document.getElementById("m-total").textContent = money(total, cur) + " / month";
  const usa = monthlyBreakdown(1, life, adults, children).total;
  document.getElementById("m-bar").style.width = Math.min(100, (total / usa) * 55) + "%";

  const labels = {
    housing: "Housing / rent", food: "Food", transport: "Transport",
    utilities: "Utilities & internet", healthcare: "Healthcare (out-of-pocket band)",
    other: "Other living costs"
  };
  document.getElementById("m-rows").innerHTML = Object.keys(rows)
    .map((k) => `<div class="row"><span>${labels[k]}</span><span>${money(rows[k], cur)}</span></div>`)
    .join("");

  renderSalary(c, cur);
  document.getElementById("m-note").textContent =
    `${c.name} · ${c.currency} · COL ${Number(c.col).toFixed(2)}` +
    `${c.colYear ? ` (${c.colYear})` : ""} (1.00 = USA). Shown in ${cur}.`;
}

function syncPermanentUi(purpose) {
  const daysWrap = document.getElementById("s-days-wrap");
  const flight = document.getElementById("s-flight");
  if (!daysWrap) return;
  const isPermanent = purpose === "permanent";
  daysWrap.style.display = isPermanent ? "none" : "";
  if (isPermanent && flight && flight.value.startsWith("round")) flight.value = "one_economy";
}

function renderStay() {
  const from = country(document.getElementById("s-from").value);
  const to = country(document.getElementById("s-to").value);
  if (!from || !to) return;
  const days = +document.getElementById("s-days").value || 30;
  const people = +document.getElementById("s-people").value || 1;
  const life = +document.getElementById("s-life").value || 1;
  const purpose = document.getElementById("s-purpose").value;
  const visa = document.getElementById("s-visa").value;
  const papers = document.getElementById("s-papers").value;
  const flightType = document.getElementById("s-flight").value;
  const cur = document.getElementById("s-currency").value || "USD";
  syncPermanentUi(purpose);

  const b = stayBudget({ from, to, days, people, life, purpose, visa, papers, flightType });
  const labelEl = document.querySelector("#panel-stay .result-label");

  if (b.mode === "permanent") {
    if (labelEl) labelEl.textContent = "Cost to move there (one-time)";
    document.getElementById("s-total").textContent = money(b.moveTotal, cur);
    document.getElementById("s-bar").style.width =
      Math.min(100, (b.moveTotal / (b.monthlyTotal * 6 + 8000)) * 100) + "%";
    const monthLabels = {
      housing: "Housing / rent", food: "Food", transport: "Transport",
      utilities: "Utilities & internet", healthcare: "Healthcare (out-of-pocket band)",
      other: "Other living costs"
    };
    const lines = [
      ["— One-time move cost —", null],
      [b.visaRequired ? `Visa fee (${VISA_LABEL[visa]})` : "Visa fee (not required)", b.visaFee],
      ["Visa extras", b.visaExtras],
      ["Paper preparation", b.paperFee],
      [`Purpose admin (${PURPOSE_LABEL[purpose]})`, b.purposeAdmin],
      ["Flight tickets", b.flights],
      ["Housing deposit (≈ 2 months)", b.deposit],
      ["Household setup", b.householdSetup],
      ["Settling buffer", b.settling],
      ["Move total", b.moveTotal],
      ["— Monthly living —", null],
      ...Object.keys(b.monthlyRows).map((k) => [monthLabels[k], b.monthlyRows[k]]),
      ["Monthly living total", b.monthlyTotal]
    ];
    document.getElementById("s-rows").innerHTML = lines.map(([t, v]) =>
      v === null
        ? `<div class="row section"><span>${t}</span><span></span></div>`
        : `<div class="row"><span>${t}</span><span>${money(v, cur)}</span></div>`
    ).join("");
    document.getElementById("s-note").textContent =
      `${from.name} → ${to.name} permanent stay. One-time move + monthly living. Shown in ${cur}.`;
    return;
  }

  if (labelEl) labelEl.textContent = "Estimated traveling budget";
  document.getElementById("s-total").textContent = money(b.total, cur) + ` for ${days} days`;
  document.getElementById("s-bar").style.width =
    Math.min(100, (b.total / (b.monthlyEquivalent * Math.max(1, days / 30) * 1.8 + 2000)) * 100) + "%";

  const lines = [
    ["— Living while there —", null],
    ["Lodging / stay housing", b.lodging],
    ["Food", b.food],
    ["Local transport", b.transport],
    ["Day-to-day / misc", b.local],
    ["Arrival / setup buffer", b.arrival],
    ["— Papers, visa & flights —", null],
    [b.visaRequired ? `Visa fee (${VISA_LABEL[visa]})` : "Visa fee (not required)", b.visaFee],
    ["Visa extras", b.visaExtras],
    ["Paper preparation", b.paperFee],
    [`Purpose admin (${PURPOSE_LABEL[purpose]})`, b.purposeAdmin],
    ["Flight tickets", b.flights],
    ["— Totals —", null],
    ["Living subtotal", b.living],
    ["Admin + flights", b.admin + b.flights],
    ["Average living / day", b.daily]
  ];
  document.getElementById("s-rows").innerHTML = lines.map(([t, v]) =>
    v === null
      ? `<div class="row section"><span>${t}</span><span></span></div>`
      : `<div class="row"><span>${t}</span><span>${money(v, cur)}</span></div>`
  ).join("");
  document.getElementById("s-note").textContent =
    `${from.name} → ${to.name}. ${PURPOSE_LABEL[purpose]} · ${VISA_LABEL[visa]}. ` +
    `${days} days · ${people} person${people > 1 ? "s" : ""}. Shown in ${cur}.`;
}

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function filteredEconomyList() {
  const region = document.getElementById("e-region")?.value || "All";
  const q = (document.getElementById("e-search")?.value || "").toLowerCase().trim();
  let list = COUNTRIES.slice();
  if (region !== "All") list = list.filter((c) => c.region === region);
  if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  return list;
}

function prepCanvas(canvasId, height) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 320;
  const h = height || 220;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { canvas, ctx, w, h };
}

function drawBarChart(canvasId, items, valueKey, highlightCode, height) {
  const prep = prepCanvas(canvasId, height || 220);
  if (!prep) return;
  const { ctx, w, h } = prep;

  const usable = items.filter((i) => i[valueKey] != null && !Number.isNaN(Number(i[valueKey])));
  if (!usable.length) {
    ctx.fillStyle = cssVar("--muted", "#666");
    ctx.font = "13px Arial, sans-serif";
    ctx.fillText("No data", 16, 40);
    return;
  }

  const ink = cssVar("--ink", "#222");
  const muted = cssVar("--muted", "#666");
  const accent = cssVar("--accent", "#1a4f8b");
  const line = cssVar("--line", "#ccc");
  const padL = 36, padR = 10, padT = 12, padB = 48;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const max = Math.max(...usable.map((i) => Number(i[valueKey]) || 0), 0.1);

  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();

  const gap = plotW / usable.length;
  usable.forEach((item, i) => {
    const v = Number(item[valueKey]) || 0;
    const bh = (v / max) * (plotH - 4);
    const bw = Math.max(8, gap * 0.55);
    const x = padL + i * gap + (gap - bw) / 2;
    const y = padT + plotH - bh;
    ctx.fillStyle = item.code === highlightCode ? accent : muted;
    ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = ink;
    ctx.font = "11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(x + bw / 2, padT + plotH + 10);
    ctx.rotate(-0.55);
    ctx.fillText(item.code || item.label || "", 0, 0);
    ctx.restore();
  });
}

function drawDonutChart(canvasId, slices) {
  const prep = prepCanvas(canvasId, 240);
  if (!prep) return;
  const { ctx, w, h } = prep;
  const total = slices.reduce((a, s) => a + (s.value || 0), 0);
  if (!total) {
    ctx.fillStyle = cssVar("--muted", "#666");
    ctx.font = "13px Arial, sans-serif";
    ctx.fillText("No data", 16, 40);
    return;
  }
  const colors = ["#1a4f8b", "#0f6b5c", "#8a5a12", "#6b3fa0", "#b33b3b", "#3a7ca5"];
  const cx = w * 0.38;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.32;
  let angle = -Math.PI / 2;
  slices.forEach((s, i) => {
    const slice = ((s.value || 0) / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    angle += slice;
  });
  // hole
  ctx.beginPath();
  ctx.fillStyle = cssVar("--bg", "#f0f0ee");
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  const ink = cssVar("--ink", "#222");
  const muted = cssVar("--muted", "#666");
  let ly = 28;
  slices.forEach((s, i) => {
    const pct = ((s.value || 0) / total) * 100;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(w * 0.68, ly - 8, 10, 10);
    ctx.fillStyle = ink;
    ctx.font = "12px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${s.label} ${pct.toFixed(0)}%`, w * 0.68 + 16, ly);
    ctx.fillStyle = muted;
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText(`USD ${fmtNum(s.value, 0)} bn`, w * 0.68 + 16, ly + 14);
    ly += 34;
  });
}

function drawGroupedSalary(canvasId, country) {
  const prep = prepCanvas(canvasId, 240);
  if (!prep) return;
  const { ctx, w, h } = prep;
  if (!country || country.grossAvg == null) {
    ctx.fillStyle = cssVar("--muted", "#666");
    ctx.font = "13px Arial, sans-serif";
    ctx.fillText("No salary series for this country", 16, 40);
    return;
  }
  const ink = cssVar("--ink", "#222");
  const accent = cssVar("--accent", "#1a4f8b");
  const muted = cssVar("--muted", "#666");
  const line = cssVar("--line", "#ccc");
  const pairs = [
    { label: "Low", g: country.grossLow, n: country.netLow },
    { label: "Average", g: country.grossAvg, n: country.netAvg },
    { label: "High", g: country.grossHigh, n: country.netHigh }
  ];
  const max = Math.max(...pairs.flatMap((p) => [p.g || 0, p.n || 0]), 1);
  const padL = 44, padR = 12, padT = 20, padB = 40;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();

  const groupW = plotW / pairs.length;
  pairs.forEach((p, i) => {
    const bx = padL + i * groupW + groupW * 0.2;
    const bw = groupW * 0.25;
    const gh = ((p.g || 0) / max) * (plotH - 4);
    const nh = ((p.n || 0) / max) * (plotH - 4);
    ctx.fillStyle = accent;
    ctx.fillRect(bx, padT + plotH - gh, bw, gh);
    ctx.fillStyle = muted;
    ctx.fillRect(bx + bw + 6, padT + plotH - nh, bw, nh);
    ctx.fillStyle = ink;
    ctx.font = "11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.label, padL + i * groupW + groupW / 2, padT + plotH + 18);
  });
  ctx.fillStyle = accent;
  ctx.fillRect(padL, 6, 10, 10);
  ctx.fillStyle = ink;
  ctx.font = "11px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Gross", padL + 14, 15);
  ctx.fillStyle = muted;
  ctx.fillRect(padL + 60, 6, 10, 10);
  ctx.fillStyle = ink;
  ctx.fillText("Net", padL + 74, 15);
}

function renderEconomy() {
  const sel = document.getElementById("e-country");
  if (!sel) return;
  const c = country(sel.value);
  if (!c) return;
  const rates = jobRates(c);
  const list = withJobRates(filteredEconomyList());
  const cRated = {
    ...c,
    liveRate: rates.liveRate,
    jobGeneral: rates.jobGeneral
  };

  document.getElementById("e-gdp").textContent =
    c.gdp == null ? "—" : `USD ${fmtNum(c.gdp, 1)} bn${c.gdpYear ? ` (${c.gdpYear})` : ""}`;
  document.getElementById("e-growth").textContent =
    c.growth == null ? "—" : `${c.growth >= 0 ? "+" : ""}${c.growth}%${c.growthYear ? ` (${c.growthYear})` : ""}`;
  document.getElementById("e-live-rate").textContent =
    rates.liveRate == null
      ? "—"
      : `${rates.liveRate}%` + (rates.cover != null ? ` · ${rates.cover.toFixed(2)}×` : "");
  document.getElementById("e-job-general").textContent =
    rates.jobGeneral == null ? "—" : `${rates.jobGeneral}%`;
  document.getElementById("e-gross").textContent =
    c.grossAvg == null ? "—" : salaryRangeText(c.grossLow, c.grossHigh, "USD");
  document.getElementById("e-net").textContent =
    c.netAvg == null ? "—" : salaryRangeText(c.netLow, c.netHigh, "USD");

  const pickTop = (arr, key, n, include) => {
    const out = [];
    const seen = new Set();
    if (include && include[key] != null) {
      out.push(include);
      seen.add(include.code);
    }
    for (const row of arr) {
      if (seen.has(row.code) || row[key] == null) continue;
      out.push(row);
      seen.add(row.code);
      if (out.length >= n) break;
    }
    return out.sort((a, b) => (b[key] || 0) - (a[key] || 0));
  };

  const regionPeers = withJobRates(COUNTRIES.filter((x) => x.region === c.region));
  drawBarChart("chart-gdp", pickTop(list.slice().sort((a, b) => (b.gdp || 0) - (a.gdp || 0)), "gdp", 8, cRated), "gdp", c.code);
  drawBarChart("chart-growth", pickTop(list.slice().sort((a, b) => (b.growth || 0) - (a.growth || 0)), "growth", 8, cRated), "growth", c.code);
  drawBarChart("chart-live-rate", pickTop(regionPeers.slice().sort((a, b) => (b.liveRate || 0) - (a.liveRate || 0)), "liveRate", 10, cRated), "liveRate", c.code);
  drawBarChart("chart-job-general", pickTop(regionPeers.slice().sort((a, b) => (b.jobGeneral || 0) - (a.jobGeneral || 0)), "jobGeneral", 10, cRated), "jobGeneral", c.code);

  const regionOrder = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
  const regionGdp = regionOrder.map((r) => ({
    label: r,
    value: COUNTRIES.filter((x) => x.region === r && x.gdp != null).reduce((a, x) => a + x.gdp, 0)
  }));
  drawDonutChart("chart-region-gdp", regionGdp);
  drawGroupedSalary("chart-salary", c);

  const tbody = document.querySelector("#e-table tbody");
  tbody.innerHTML = list
    .slice()
    .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name))
    .map((row) => `
    <tr data-code="${row.code}" class="${row.code === c.code ? "on" : ""}">
      <td>${row.name}</td>
      <td>${row.region}</td>
      <td>${row.gdp == null ? "—" : fmtNum(row.gdp, 1)}</td>
      <td>${row.growth == null ? "—" : `${row.growth >= 0 ? "+" : ""}${row.growth}%`}</td>
      <td>${row.liveRate == null ? "—" : `${row.liveRate}%`}</td>
      <td>${row.jobGeneral == null ? "—" : `${row.jobGeneral}%`}</td>
      <td>${row.grossAvg == null ? "—" : money(row.grossAvg, "USD")}</td>
      <td>${row.netAvg == null ? "—" : money(row.netAvg, "USD")}</td>
    </tr>`).join("");

  const note = document.getElementById("e-note");
  if (note) {
    const pay = rates.net != null ? rates.net : rates.gross;
    const coverTxt = rates.living != null
      ? ` Living budget ≈ ${money(rates.living, "USD")} / mo` +
        (pay != null ? `; salary ≈ ${money(pay, "USD")}` : "") +
        (rates.cover != null ? ` (${rates.cover.toFixed(2)}×).` : ".")
      : "";
    note.textContent =
      `Living rate = typical take-home salary vs a decent living budget. ` +
      `Obtaining a general job = how hard/easy for one person to get any typical job.` +
      coverTxt;
  }
}

function setTab(name) {
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("on", p.id === `panel-${name}`));
  if (name === "economy") requestAnimationFrame(() => renderEconomy());
}

function applyTheme(theme) {
  const mode = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem("abroadcost-theme", mode);
  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    const on = btn.dataset.themeSet === mode;
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const err = document.getElementById("data-error");
  if (!COUNTRIES.length) {
    if (err) {
      err.hidden = false;
      err.textContent =
        "Country data failed to load (world_data.js). Hard-refresh the page (Ctrl+F5) or restart the local server.";
    }
    return;
  }
  if (err) err.hidden = true;

  const saved = localStorage.getItem("abroadcost-theme");
  applyTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.themeSet);
      setTimeout(() => {
        if (document.getElementById("panel-economy")?.classList.contains("on")) renderEconomy();
      }, 30);
    });
  });

  fillCountrySelect(document.getElementById("m-country"), "RW");
  fillCountrySelect(document.getElementById("s-from"), "US");
  fillCountrySelect(document.getElementById("s-to"), "RW");
  fillCountrySelect(document.getElementById("e-country"), "RW");
  fillCurrencySelect(document.getElementById("m-currency"), "USD");
  fillCurrencySelect(document.getElementById("s-currency"), "USD");

  document.querySelectorAll(".tabs button").forEach((b) => {
    b.addEventListener("click", () => setTab(b.dataset.tab));
  });

  ["e-country", "e-region", "e-search"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderEconomy);
    el.addEventListener("change", renderEconomy);
  });
  document.querySelector("#e-table")?.addEventListener("click", (ev) => {
    const tr = ev.target.closest("tr[data-code]");
    if (!tr) return;
    document.getElementById("e-country").value = tr.dataset.code;
    renderEconomy();
  });
  window.addEventListener("resize", () => {
    if (document.getElementById("panel-economy")?.classList.contains("on")) renderEconomy();
  });

  [
    "m-country", "m-adults", "m-children", "m-life", "m-currency",
    "s-from", "s-to", "s-days", "s-people", "s-life", "s-currency",
    "s-purpose", "s-visa", "s-papers", "s-flight"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => { renderMonthly(); renderStay(); });
    el.addEventListener("change", () => { renderMonthly(); renderStay(); });
  });

  document.getElementById("s-purpose").addEventListener("change", () => {
    const purpose = document.getElementById("s-purpose").value;
    document.getElementById("s-visa").value = suggestVisaForPurpose(purpose);
    const daysEl = document.getElementById("s-days");
    if (purpose === "study" && +daysEl.value < 180) daysEl.value = 180;
    if (purpose === "work" && +daysEl.value < 90) daysEl.value = 90;
    if (purpose === "visit" && +daysEl.value > 30) daysEl.value = 14;
    syncPermanentUi(purpose);
    renderStay();
  });

  document.getElementById("s-to").addEventListener("change", () => {
    const to = country(document.getElementById("s-to").value);
    if (to && FX[to.currency]) document.getElementById("s-currency").value = to.currency;
    renderStay();
  });
  document.getElementById("m-country").addEventListener("change", () => {
    const c = country(document.getElementById("m-country").value);
    if (c && FX[c.currency]) document.getElementById("m-currency").value = c.currency;
    renderMonthly();
  });

  const foot = document.getElementById("site-foot");
  if (foot) {
    foot.textContent = `${COUNTRIES.length} countries.`;
  }

  renderMonthly();
  renderStay();
});
