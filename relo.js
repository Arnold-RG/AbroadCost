const COUNTRIES = window.RELO_COUNTRIES || [];
const CURRENCIES = window.RELO_CURRENCIES || [];
const DATA_SOURCE = window.RELO_DATA_SOURCE || {};
const FX_SOURCE = window.RELO_FX_SOURCE || {};
const SALARY_SOURCE = window.RELO_SALARY_SOURCE || {};
const FX = Object.fromEntries(CURRENCIES.map((c) => [c.code, Number(c.usd) || 1]));

/**
 * Mid-tier USA monthly basket for one adult (comfortable, not a high lifestyle).
 * Anchored to Numbeo / BLS-style mid-city US costs (outside top global cores).
 * Other countries = basket × destination COL (WB price level vs USA).
 */
const MONTHLY_USD = {
  housing: 1350,
  food: 500,
  transport: 200,
  utilities: 210,
  healthcare: 200,
  other: 250
};

/** Mid-range traveler daily costs in USA dollars (hotel + meals + local + misc). */
const TRAVEL_DAILY_USD = {
  lodging: 110,
  food: 48,
  transport: 22,
  local: 28
};

/**
 * Published / commonly charged visa fee ballparks (USD) by destination.
 * Defaults apply when a destination is not listed.
 */
const VISA_BY_DEST = {
  US: { tourist: 185, business: 185, student: 185, work: 205, transit: 185, dependent: 185, residence: 325 },
  GB: { tourist: 148, business: 148, student: 630, work: 827, transit: 82, dependent: 148, residence: 1910 },
  CA: { tourist: 100, business: 100, student: 150, work: 155, transit: 100, dependent: 100, residence: 850 },
  AU: { tourist: 20, business: 145, student: 710, work: 465, transit: 20, dependent: 145, residence: 3220 },
  NZ: { tourist: 35, business: 35, student: 330, work: 495, transit: 35, dependent: 35, residence: 2710 },
  DE: { tourist: 90, business: 90, student: 75, work: 100, transit: 90, dependent: 90, residence: 120 },
  FR: { tourist: 90, business: 90, student: 75, work: 100, transit: 90, dependent: 90, residence: 120 },
  IT: { tourist: 90, business: 90, student: 75, work: 100, transit: 90, dependent: 90, residence: 120 },
  ES: { tourist: 90, business: 90, student: 75, work: 100, transit: 90, dependent: 90, residence: 120 },
  NL: { tourist: 90, business: 90, student: 75, work: 100, transit: 90, dependent: 90, residence: 120 },
  BE: { tourist: 90, business: 90, student: 75, work: 100, transit: 90, dependent: 90, residence: 120 },
  PT: { tourist: 90, business: 90, student: 75, work: 100, transit: 90, dependent: 90, residence: 120 },
  IE: { tourist: 60, business: 60, student: 60, work: 1000, transit: 25, dependent: 60, residence: 1000 },
  CH: { tourist: 90, business: 90, student: 90, work: 120, transit: 90, dependent: 90, residence: 150 },
  SE: { tourist: 90, business: 90, student: 90, work: 150, transit: 90, dependent: 90, residence: 150 },
  NO: { tourist: 90, business: 90, student: 90, work: 150, transit: 90, dependent: 90, residence: 150 },
  DK: { tourist: 90, business: 90, student: 90, work: 150, transit: 90, dependent: 90, residence: 150 },
  PL: { tourist: 90, business: 90, student: 90, work: 120, transit: 90, dependent: 90, residence: 150 },
  RW: { tourist: 50, business: 50, student: 50, work: 100, transit: 30, dependent: 50, residence: 100 },
  KE: { tourist: 34, business: 34, student: 50, work: 150, transit: 20, dependent: 50, residence: 150 },
  UG: { tourist: 50, business: 100, student: 100, work: 250, transit: 50, dependent: 50, residence: 250 },
  TZ: { tourist: 50, business: 250, student: 250, work: 500, transit: 30, dependent: 50, residence: 500 },
  ZA: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  NG: { tourist: 60, business: 100, student: 100, work: 200, transit: 40, dependent: 60, residence: 200 },
  GH: { tourist: 60, business: 100, student: 100, work: 200, transit: 40, dependent: 60, residence: 200 },
  EG: { tourist: 25, business: 25, student: 25, work: 25, transit: 25, dependent: 25, residence: 25 },
  MA: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  IN: { tourist: 25, business: 80, student: 80, work: 100, transit: 20, dependent: 80, residence: 100 },
  CN: { tourist: 140, business: 140, student: 140, work: 140, transit: 140, dependent: 140, residence: 140 },
  JP: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  KR: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  SG: { tourist: 0, business: 0, student: 30, work: 105, transit: 0, dependent: 30, residence: 105 },
  TH: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  VN: { tourist: 25, business: 25, student: 25, work: 25, transit: 25, dependent: 25, residence: 25 },
  ID: { tourist: 35, business: 50, student: 50, work: 100, transit: 25, dependent: 35, residence: 100 },
  MY: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  PH: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  AE: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  SA: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  QA: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  TR: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  BR: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  MX: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  AR: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  CL: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  CO: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  RU: { tourist: 80, business: 80, student: 80, work: 80, transit: 80, dependent: 80, residence: 80 },
  UA: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 },
  IL: { tourist: 0, business: 0, student: 0, work: 0, transit: 0, dependent: 0, residence: 0 }
};

const VISA_FEE_USD = {
  none: 0, tourist: 65, business: 95, student: 140, work: 200,
  transit: 40, dependent: 95, residence: 320
};
const PAPERS_USD = { none: 0, basic: 40, standard: 160, full: 480 };
const PURPOSE_EXTRA_USD = {
  visit: 0, work: 140, study: 180, business: 70, family: 90,
  medical: 150, nomad: 75, permanent: 300
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

function haversineKm(from, to) {
  const lat1 = Number(from?.lat);
  const lon1 = Number(from?.lon);
  const lat2 = Number(to?.lat);
  const lon2 = Number(to?.lon);
  if (![lat1, lon1, lat2, lon2].every((v) => Number.isFinite(v))) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Region pair fallback when capitals are missing (approx one-way economy USD). */
const REGION_FLIGHT_USD = {
  Africa: { Africa: 280, Americas: 950, Asia: 720, Europe: 520, Oceania: 1100 },
  Americas: { Africa: 950, Americas: 320, Asia: 900, Europe: 650, Oceania: 980 },
  Asia: { Africa: 720, Americas: 900, Asia: 260, Europe: 580, Oceania: 620 },
  Europe: { Africa: 520, Americas: 650, Asia: 580, Europe: 180, Oceania: 1050 },
  Oceania: { Africa: 1100, Americas: 980, Asia: 620, Europe: 1050, Oceania: 240 }
};

/**
 * Country-to-country flight estimate from great-circle distance.
 * Calibrated to typical mid-2020s economy fares (not peak/sale outliers).
 */
function flightCostPerPerson(from, to, flightType) {
  if (flightType === "none") return 0;
  if (from.code === to.code) return 0;

  let km = haversineKm(from, to);
  let seat;
  if (km != null) {
    // Base + distance: short-haul denser yield, long-haul lower per-km
    if (km < 800) seat = 70 + km * 0.18;
    else if (km < 3000) seat = 90 + km * 0.13;
    else if (km < 7000) seat = 140 + km * 0.10;
    else seat = 220 + km * 0.085;
    seat = Math.max(55, Math.min(2400, seat));
  } else {
    const table = REGION_FLIGHT_USD[from.region] || REGION_FLIGHT_USD.Europe;
    seat = table[to.region] || 700;
  }

  // Slight destination COL nudge (expensive hubs cost more to fly into)
  seat *= 0.92 + 0.08 * Math.min(1.4, Number(to.col) || 1);

  if (flightType.includes("premium")) seat *= 2.4;
  if (flightType.startsWith("round")) seat *= 1.78;
  return Math.round(seat);
}

function adminCosts(from, to, people, purpose, visa, papers, flightType) {
  const p = Math.max(1, people | 0);
  const visaFee = visaFeeUsd(to.code, visa) * p;
  const paperFee = (PAPERS_USD[papers] || 0) * p;
  const purposeAdmin = (PURPOSE_EXTRA_USD[purpose] || 0) * p;
  let visaExtras = 0;
  if (visa !== "none" && ["US", "GB", "CA", "AU", "NZ", "IN", "CN"].includes(to.code)) visaExtras += 45 * p;
  if (visa === "work" || visa === "student" || visa === "residence") visaExtras += 75 * p;
  if (visa !== "none" && purpose === "permanent") visaExtras += 140 * p;
  const flights = flightCostPerPerson(from, to, flightType) * p;
  return {
    visaFee, visaExtras, paperFee, purposeAdmin, flights,
    admin: visaFee + paperFee + purposeAdmin + visaExtras,
    visaRequired: visa !== "none",
    flightKm: haversineKm(from, to)
  };
}

function permanentMoveBudget(opts) {
  const { from, to, people, life, purpose, visa, papers, flightType } = opts;
  const p = Math.max(1, people | 0);
  const monthly = monthlyBreakdown(to.col, life, p, 0);
  const a = adminCosts(from, to, people, purpose, visa, papers, flightType);
  const deposit = monthly.rows.housing * 2;
  const householdSetup = (850 + 750 * (Number(to.col) || 1)) * (1 + 0.45 * (p - 1));
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

function travelDailyRates(to, life, people) {
  const col = Math.max(0.14, Number(to.col) || 1);
  const lifeSafe = Number(life) > 0 ? Number(life) : 1;
  // Extra adults share rooms partially; children not modeled in travel people count
  const p = Math.max(1, people | 0);
  const roomScale = 1 + 0.55 * (p - 1);
  const personScale = p;
  return {
    lodging: TRAVEL_DAILY_USD.lodging * col * lifeSafe * roomScale,
    food: TRAVEL_DAILY_USD.food * col * lifeSafe * personScale,
    transport: TRAVEL_DAILY_USD.transport * col * lifeSafe * Math.sqrt(p),
    local: TRAVEL_DAILY_USD.local * col * lifeSafe * personScale
  };
}

function stayBudget(opts) {
  const { from, to, days, people, life, purpose, visa, papers, flightType } = opts;
  if (purpose === "permanent") return permanentMoveBudget(opts);

  const d = Math.max(1, days | 0);
  const p = Math.max(1, people | 0);
  const rates = travelDailyRates(to, life, p);
  const lodging = rates.lodging * d;
  const food = rates.food * d;
  const transport = rates.transport * d;
  const local = rates.local * d;
  // Arrival buffer: airport transfer, SIM, first-day friction (~1–2 travel days)
  const arrival = (rates.lodging + rates.food + rates.transport) * Math.min(2.2, Math.max(1.0, 2.4 - d / 25));
  const purposeSetup = { visit: 1, business: 1.08, family: 1.1, medical: 1.18, nomad: 1.15, study: 1.3, work: 1.35 }[purpose] || 1;
  const setupExtra = arrival * (purposeSetup - 1);
  const a = adminCosts(from, to, people, purpose, visa, papers, flightType);
  const living = lodging + food + transport + local + arrival + setupExtra;
  const monthly = monthlyBreakdown(to.col, life, p, 0).total;
  const daily = (lodging + food + transport + local) / d;
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

const fields = {};
let tableSort = { key: "region", dir: 1 };
let urlReady = false;
let urlTimer = 0;

const LIFE_HINT = {
  "0.8": "A tighter month, about a fifth under the mid-tier basket.",
  "1": "The mid-tier basket, unchanged.",
  "1.35": "A more comfortable month, about a third above the basket.",
  "1.85": "A high month, close to twice the mid-tier basket."
};

const MONTH_LABELS = {
  housing: "Housing / rent",
  food: "Food",
  transport: "Transport",
  utilities: "Utilities and internet",
  healthcare: "Healthcare",
  other: "Other living costs"
};

const FLIGHT_LABEL = {
  one_economy: "One-way economy",
  round_economy: "Round-trip economy",
  one_premium: "One-way premium",
  round_premium: "Round-trip premium",
  none: "No flights"
};

function scoreItem(item, q) {
  const label = item.label.toLowerCase();
  const code = String(item.value || "").toLowerCase();
  const meta = (item.meta || "").toLowerCase();
  if (!item.value && q) return label.startsWith(q) ? 1 : 0;
  if (label.startsWith(q) || code.startsWith(q)) return 3;
  const words = (label + " " + meta).split(/[^a-z0-9]+/);
  if (words.some((word) => word.startsWith(q))) return 2;
  return 0;
}

function countryItems() {
  return sortedCountries().map((c) => ({
    value: c.code,
    label: c.name,
    meta: c.region + " · " + c.currency
  }));
}

function currencyItems() {
  return sortedCurrencies().map((c) => ({
    value: c.code,
    label: c.code + " — " + c.name,
    meta: c.symbol || ""
  }));
}

function mountCombo(inputId, hiddenId, items, initial) {
  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  const list = document.getElementById(inputId.replace(/-q$/, "-list"));
  const combo = input.closest(".combo");
  let open = false;
  let typing = false;
  let active = -1;
  let filtered = items.slice();

  function current() {
    return items.find((item) => item.value === hidden.value) || null;
  }

  function restoreText() {
    const item = current();
    input.value = item ? item.label : "";
    typing = false;
  }

  function query() {
    return typing ? input.value.trim().toLowerCase() : "";
  }

  function place() {
    const rect = input.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    list.classList.toggle("flip", below < 220 && rect.top > below);
  }

  function paint() {
    const q = query();
    filtered = items.filter((item) => !q || scoreItem(item, q) > 0);
    if (q) filtered.sort((a, b) => scoreItem(b, q) - scoreItem(a, q) || a.label.localeCompare(b.label));
    list.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement("li");
      empty.setAttribute("role", "option");
      empty.setAttribute("aria-disabled", "true");
      empty.textContent = "No matches";
      list.appendChild(empty);
      active = -1;
      input.removeAttribute("aria-activedescendant");
      return;
    }
    if (active < 0 || active >= filtered.length) {
      const selected = filtered.findIndex((item) => item.value === hidden.value);
      active = selected >= 0 ? selected : 0;
    }
    filtered.forEach((item, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.id = list.id + "-opt-" + i;
      li.dataset.value = item.value;
      li.setAttribute("aria-selected", item.value === hidden.value ? "true" : "false");
      if (i === active) li.classList.add("active");
      const name = document.createElement("span");
      name.className = "opt-name";
      name.textContent = item.label;
      const meta = document.createElement("span");
      meta.className = "opt-meta";
      meta.textContent = item.meta || "";
      li.append(name, meta);
      list.appendChild(li);
    });
    if (active >= 0) input.setAttribute("aria-activedescendant", list.id + "-opt-" + active);
    else input.removeAttribute("aria-activedescendant");
    const currentEl = list.querySelector(".active");
    if (currentEl) {
      const top = currentEl.offsetTop;
      const bottom = top + currentEl.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    }
  }

  function openList() {
    const wasOpen = open;
    open = true;
    input.setAttribute("aria-expanded", "true");
    list.hidden = false;
    if (!wasOpen && !typing) active = -1;
    paint();
    place();
  }

  function closeList() {
    open = false;
    active = -1;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    list.hidden = true;
  }

  function commit(value) {
    const item = items.find((row) => row.value === value);
    if (!item) return;
    hidden.value = item.value;
    input.value = item.label;
    typing = false;
    closeList();
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function move(step) {
    if (!open) openList();
    if (!filtered.length) return;
    if (active < 0) active = step > 0 ? 0 : filtered.length - 1;
    else active = (active + step + filtered.length) % filtered.length;
    paint();
  }

  input.addEventListener("focus", () => {
    input.select();
  });

  input.addEventListener("click", () => {
    if (open) {
      restoreText();
      closeList();
    } else {
      typing = false;
      active = -1;
      openList();
      input.select();
    }
  });

  input.addEventListener("input", () => {
    typing = true;
    active = 0;
    openList();
  });

  input.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      move(1);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      move(-1);
    } else if (ev.key === "Home") {
      if (!open) return;
      ev.preventDefault();
      active = 0;
      paint();
    } else if (ev.key === "End") {
      if (!open) return;
      ev.preventDefault();
      active = Math.max(0, filtered.length - 1);
      paint();
    } else if (ev.key === "Enter") {
      if (!open) return;
      ev.preventDefault();
      if (active >= 0 && filtered[active]) commit(filtered[active].value);
      else if (filtered.length === 1) commit(filtered[0].value);
    } else if (ev.key === "Escape") {
      if (!open) return;
      ev.preventDefault();
      restoreText();
      closeList();
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (combo.contains(document.activeElement)) return;
      restoreText();
      closeList();
    }, 0);
  });

  list.addEventListener("pointerdown", (ev) => {
    const opt = ev.target.closest("[role='option']");
    if (!opt || opt.getAttribute("aria-disabled") === "true") return;
    ev.preventDefault();
    commit(opt.dataset.value);
  });

  document.addEventListener("pointerdown", (ev) => {
    if (!combo.contains(ev.target)) {
      restoreText();
      closeList();
    }
  });

  const api = {
    set(value, notify) {
      const item = items.find((row) => row.value === value);
      if (!item) return;
      hidden.value = item.value;
      input.value = item.label;
      typing = false;
      if (notify) hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
  api.set(initial, false);
  fields[hiddenId] = api;
}

function readNum(id, min, max, fallback) {
  const raw = document.getElementById(id).value;
  let v = Number(raw);
  if (!Number.isFinite(v)) v = fallback;
  return Math.min(max, Math.max(min, v));
}

function setBig(id, text) {
  const el = document.getElementById(id);
  const changed = el.textContent !== text && text !== "—";
  el.textContent = text;
  el.classList.toggle("is-long", text.length > 13);
  if (changed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  }
}

function paintShare(el, parts) {
  el.replaceChildren();
  const total = parts.reduce((sum, part) => sum + (part.value > 0 ? part.value : 0), 0);
  if (total <= 0) return;
  parts.forEach((part) => {
    if (!(part.value > 0)) return;
    const seg = document.createElement("i");
    seg.dataset.k = part.key;
    seg.style.width = ((part.value / total) * 100) + "%";
    el.appendChild(seg);
  });
}

function paintRows(el, lines) {
  el.replaceChildren();
  lines.forEach((line) => {
    const row = document.createElement("div");
    if (line.section) {
      row.className = "row section";
      const label = document.createElement("span");
      label.textContent = line.label;
      row.appendChild(label);
    } else {
      row.className = "row" + (line.total ? " total" : "");
      const sw = document.createElement("i");
      sw.className = "swatch";
      if (line.key) sw.dataset.k = line.key;
      else sw.style.visibility = "hidden";
      const name = document.createElement("span");
      name.textContent = line.label;
      const pct = document.createElement("span");
      pct.className = "pct";
      pct.textContent = line.pct || "";
      const amt = document.createElement("span");
      amt.className = "amt";
      amt.textContent = line.amount;
      row.append(sw, name, pct, amt);
    }
    el.appendChild(row);
  });
}

function pctOf(value, total) {
  if (!(total > 0)) return "";
  return Math.round((value / total) * 100) + "%";
}

function lifeHint(id, selectId) {
  const el = document.getElementById(id);
  const value = document.getElementById(selectId).value;
  el.textContent = LIFE_HINT[value] || "";
}

function renderMonthly() {
  const c = country(document.getElementById("m-country").value);
  if (!c) return;
  const adults = readNum("m-adults", 1, 10, 1);
  const children = readNum("m-children", 0, 10, 0);
  const life = +document.getElementById("m-life").value || 1;
  const cur = document.getElementById("m-currency").value || "USD";
  const { rows, total } = monthlyBreakdown(c.col, life, adults, children);
  lifeHint("m-life-hint", "m-life");

  setBig("m-total", money(total, cur));
  document.getElementById("m-total-sub").textContent = "per month";

  const parts = Object.keys(rows).map((key) => ({ key, label: MONTH_LABELS[key], value: rows[key] }));
  paintShare(document.getElementById("m-share"), parts);
  paintRows(document.getElementById("m-rows"), parts.map((part) => ({
    key: part.key,
    label: part.label,
    pct: pctOf(part.value, total),
    amount: money(part.value, cur)
  })));

  const usa = monthlyBreakdown(1, life, adults, children).total;
  const usaEl = document.getElementById("m-usa");
  usaEl.textContent = c.code === "US"
    ? "The United States is the reference the other price levels scale from."
    : "The same household in the United States would be " + money(usa, cur) + " a month.";

  const compareCode = document.getElementById("m-compare").value;
  const compareEl = document.getElementById("m-compare-out");
  const other = compareCode ? country(compareCode) : null;
  if (!other || other.code === c.code) {
    compareEl.textContent = "";
  } else {
    const otherTotal = monthlyBreakdown(other.col, life, adults, children).total;
    const diff = otherTotal - total;
    const gap = Math.abs(diff);
    if (total > 0 && gap / total < 0.01) {
      compareEl.textContent = other.name + " is within about 1% of this household budget.";
    } else if (diff > 0) {
      compareEl.textContent = other.name + " runs about " + money(gap, cur) + " higher each month for this household.";
    } else {
      compareEl.textContent = other.name + " runs about " + money(gap, cur) + " lower each month for this household.";
    }
  }

  const has = c.grossAvg != null;
  document.getElementById("m-gross").textContent = has ? salaryRangeText(c.grossLow, c.grossHigh, cur) : "—";
  document.getElementById("m-net").textContent = has ? salaryRangeText(c.netLow, c.netHigh, cur) : "—";
  document.getElementById("m-avg-salary").textContent = has ? money(c.grossAvg, cur) + " → " + money(c.netAvg, cur) : "—";

  const cover = document.getElementById("m-cover");
  if (c.netAvg == null || !(total > 0)) {
    cover.textContent = "There is no wage series for " + c.name + ", so this budget cannot be set against a typical salary.";
  } else {
    const ratio = Number(c.netAvg) / total;
    cover.textContent = "One typical net salary covers about " + ratio.toFixed(2) + "× this household budget.";
  }

  const note = document.getElementById("m-salary-note");
  if (!has) note.textContent = "";
  else {
    const year = c.salaryYear ? " (" + c.salaryYear + ")" : "";
    const tax = c.taxPct != null ? " About " + fmtNum(c.taxPct, 1) + "% of gross is modeled as tax and contributions." : "";
    note.textContent = "The range runs from about two-thirds to one-and-two-thirds of the average wage" + year + "." + tax;
  }

  document.getElementById("m-note").textContent =
    c.name + " · " + c.currency + " · price level " + Number(c.col).toFixed(2) +
    (c.colYear ? " (" + c.colYear + ")" : "") +
    ", where 1.00 is the United States. Amounts shown in " + cur + ".";
}

function syncPermanentUi(purpose) {
  const daysWrap = document.getElementById("s-days-wrap");
  const flight = document.getElementById("s-flight");
  const days = document.getElementById("s-days");
  const permanent = purpose === "permanent";
  daysWrap.hidden = permanent;
  days.disabled = permanent;
  if (permanent && flight && flight.value.startsWith("round")) flight.value = "one_economy";
}

function routeLine(from, to) {
  const route = document.getElementById("s-route");
  route.replaceChildren();
  const a = document.createElement("span");
  a.className = "name";
  a.textContent = from.name;
  const mid = document.createElement("span");
  mid.className = "to";
  mid.textContent = "to";
  const b = document.createElement("span");
  b.className = "name";
  b.textContent = to.name;
  route.append(a, mid, b);
}

function kmText(km) {
  if (km == null) return "";
  if (km < 1) return "Same capital";
  return "About " + Math.round(km).toLocaleString() + " km between capitals";
}

function renderStay() {
  const from = country(document.getElementById("s-from").value);
  const to = country(document.getElementById("s-to").value);
  if (!from || !to) return;
  const days = readNum("s-days", 1, 730, 30);
  const people = readNum("s-people", 1, 12, 1);
  const life = +document.getElementById("s-life").value || 1;
  const purpose = document.getElementById("s-purpose").value;
  const visa = document.getElementById("s-visa").value;
  const papers = document.getElementById("s-papers").value;
  const flightType = document.getElementById("s-flight").value;
  const cur = document.getElementById("s-currency").value || "USD";
  syncPermanentUi(purpose);
  lifeHint("s-life-hint", "s-life");
  const b = stayBudget({ from, to, days, people, life, purpose, visa, papers, flightType });
  routeLine(from, to);

  const distance = kmText(b.flightKm);
  const flightLabel = FLIGHT_LABEL[flightType] || "";
  const meta = [distance, flightLabel, PURPOSE_LABEL[purpose]].filter(Boolean).join(" · ");
  document.getElementById("s-route-meta").textContent = meta;

  if (b.mode === "permanent") {
    document.getElementById("s-result-label").textContent = "One-time cost to move";
    setBig("s-total", money(b.moveTotal, cur));
    document.getElementById("s-total-sub").textContent = "then " + money(b.monthlyTotal, cur) + " a month to live there";
    const moveParts = [
      { key: "visa", label: b.visaRequired ? "Visa fee (" + VISA_LABEL[visa] + ")" : "Visa fee, not required", value: b.visaFee },
      { key: "papers", label: "Visa extras", value: b.visaExtras },
      { key: "papers", label: "Paper preparation", value: b.paperFee },
      { key: "purpose", label: "Purpose admin (" + PURPOSE_LABEL[purpose] + ")", value: b.purposeAdmin },
      { key: "flights", label: "Flight tickets", value: b.flights },
      { key: "deposit", label: "Housing deposit, about two months", value: b.deposit },
      { key: "setup", label: "Household setup", value: b.householdSetup },
      { key: "settling", label: "Settling buffer", value: b.settling }
    ];
    paintShare(document.getElementById("s-share"), moveParts);
    const lines = [{ section: true, label: "One-time move" }];
    moveParts.forEach((part) => {
      if (!(part.value > 0) && part.key !== "visa") return;
      lines.push({
        key: part.key,
        label: part.label,
        pct: pctOf(part.value, b.moveTotal),
        amount: money(part.value, cur)
      });
    });
    lines.push({ total: true, label: "Move total", amount: money(b.moveTotal, cur) });
    lines.push({ section: true, label: "Monthly living after arrival" });
    Object.keys(b.monthlyRows).forEach((key) => {
      lines.push({
        key: key,
        label: MONTH_LABELS[key],
        pct: pctOf(b.monthlyRows[key], b.monthlyTotal),
        amount: money(b.monthlyRows[key], cur)
      });
    });
    lines.push({ total: true, label: "Monthly living total", amount: money(b.monthlyTotal, cur) });
    paintRows(document.getElementById("s-rows"), lines);
    document.getElementById("s-note").textContent =
      from.name + " to " + to.name + ", as a permanent stay. Shown in " + cur + ".";
    return;
  }

  document.getElementById("s-result-label").textContent = "Estimated traveling budget";
  setBig("s-total", money(b.total, cur));
  document.getElementById("s-total-sub").textContent = "for " + days + " day" + (days === 1 ? "" : "s");
  const parts = [
    { key: "lodging", label: "Lodging", value: b.lodging },
    { key: "food", label: "Food", value: b.food },
    { key: "transport", label: "Local transport", value: b.transport },
    { key: "local", label: "Day to day", value: b.local },
    { key: "arrival", label: "Arrival and setup", value: b.arrival },
    { key: "visa", label: b.visaRequired ? "Visa fee (" + VISA_LABEL[visa] + ")" : "Visa fee, not required", value: b.visaFee },
    { key: "papers", label: "Visa extras", value: b.visaExtras },
    { key: "papers", label: "Paper preparation", value: b.paperFee },
    { key: "purpose", label: "Purpose admin (" + PURPOSE_LABEL[purpose] + ")", value: b.purposeAdmin },
    { key: "flights", label: "Flight tickets", value: b.flights }
  ];
  paintShare(document.getElementById("s-share"), parts);
  const lines = [{ section: true, label: "While you are there" }];
  parts.forEach((part) => {
    if (!(part.value > 0) && part.key !== "visa" && part.key !== "flights") return;
    if (part.key === "flights" && !(part.value > 0)) return;
    lines.push({
      key: part.key,
      label: part.label,
      pct: pctOf(part.value, b.total),
      amount: money(part.value, cur)
    });
  });
  lines.push({ total: true, label: "Trip total", amount: money(b.total, cur) });
  lines.push({ label: "Average living per day", amount: money(b.daily, cur) });
  paintRows(document.getElementById("s-rows"), lines);
  const peopleLabel = people + " " + (people === 1 ? "person" : "people");
  document.getElementById("s-note").textContent =
    from.name + " to " + to.name + ". " + PURPOSE_LABEL[purpose] + " · " + VISA_LABEL[visa] +
    ". " + days + " days · " + peopleLabel + ". Shown in " + cur + ".";
}

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function prepCanvas(canvasId, height) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = height;
  canvas.style.height = h + "px";
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function fitText(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(cut + "…").width > max) cut = cut.slice(0, -1);
  return cut + "…";
}

function drawRank(canvasId, items, valueKey, highlight, opts) {
  const rows = (items || []).filter((item) => item[valueKey] != null && Number.isFinite(Number(item[valueKey])));
  const format = (opts && opts.format) || ((v) => fmtNum(v, 1));
  const signed = !!(opts && opts.signed);
  const sum = document.getElementById(canvasId + "-sum");
  if (!rows.length) {
    const prep = prepCanvas(canvasId, 64);
    if (prep) {
      prep.ctx.fillStyle = cssVar("--muted", "#5c564c");
      prep.ctx.font = "400 13px Outfit, sans-serif";
      prep.ctx.textBaseline = "top";
      prep.ctx.fillText("Nothing to plot for this selection.", 2, 16);
    }
    if (sum) sum.textContent = "No data to plot.";
    return;
  }
  const height = 12 + rows.length * 28;
  const prep = prepCanvas(canvasId, height);
  if (!prep) return;
  const ctx = prep.ctx;
  const w = prep.w;
  const ink = cssVar("--ink", "#1b1916");
  const muted = cssVar("--muted", "#5c564c");
  const hi = cssVar("--bar-hi", "#16382e");
  const bar = cssVar("--bar-muted", "#c4b49a");
  const line = cssVar("--line", "#e4dccf");
  const vals = rows.map((row) => Number(row[valueKey]));
  let min = signed ? Math.min(0, ...vals) : 0;
  let max = Math.max(0, ...vals);
  if (max === min) max = min + 1;
  const labelW = Math.min(156, Math.max(88, w * 0.34));
  const valueW = 76;
  const x0 = labelW + 12;
  const plotW = Math.max(24, w - x0 - valueW);
  const span = max - min;
  const zeroX = x0 + ((0 - min) / span) * plotW;
  ctx.font = "400 12.5px Outfit, sans-serif";
  ctx.textBaseline = "middle";
  rows.forEach((item, i) => {
    const v = Number(item[valueKey]);
    const y = 8 + i * 28;
    const selected = item.code === highlight;
    ctx.fillStyle = selected ? ink : muted;
    ctx.textAlign = "left";
    const label = item.name || item.code || "";
    ctx.fillText(fitText(ctx, label, labelW), 0, y + 8);
    const x1 = x0 + ((v - min) / span) * plotW;
    const left = Math.min(zeroX, x1);
    const width = Math.max(1.5, Math.abs(x1 - zeroX));
    ctx.fillStyle = selected ? hi : bar;
    ctx.fillRect(left, y + 2, width, 11);
    ctx.fillStyle = ink;
    ctx.textAlign = "right";
    ctx.fillText(format(v), w - 1, y + 8);
  });
  if (signed && min < 0) {
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(zeroX, 4);
    ctx.lineTo(zeroX, height - 4);
    ctx.stroke();
  }
  if (sum) {
    sum.textContent = rows.map((row) => (row.name || row.code) + ": " + format(Number(row[valueKey]))).join(". ") + ".";
  }
}

function drawRegionShare(slices) {
  const total = slices.reduce((sum, slice) => sum + (slice.value || 0), 0);
  const prep = prepCanvas("chart-region-gdp", 28);
  const legend = document.getElementById("region-legend");
  if (legend) legend.replaceChildren();
  if (!prep || !total) return;
  const ctx = prep.ctx;
  let x = 0;
  slices.forEach((slice, i) => {
    const width = ((slice.value || 0) / total) * prep.w;
    ctx.fillStyle = cssVar("--c" + (i + 1), "#16382e");
    ctx.fillRect(x, 8, Math.max(0, width - 3), 10);
    x += width;
    if (!legend) return;
    const li = document.createElement("li");
    const sw = document.createElement("i");
    sw.dataset.k = "c" + (i + 1);
    const pct = ((slice.value || 0) / total) * 100;
    li.append(sw, document.createTextNode(slice.label + " " + pct.toFixed(0) + "% · USD " + fmtNum(slice.value, 0) + " bn"));
    legend.appendChild(li);
  });
}

function drawSalary(countryRow) {
  const sum = document.getElementById("chart-salary-sum");
  if (!countryRow || countryRow.grossAvg == null) {
    const prep = prepCanvas("chart-salary", 64);
    if (prep) {
      prep.ctx.fillStyle = cssVar("--muted", "#5c564c");
      prep.ctx.font = "400 13px Outfit, sans-serif";
      prep.ctx.textBaseline = "top";
      prep.ctx.fillText("No salary series for this country.", 2, 16);
    }
    if (sum) sum.textContent = "No salary series for this country.";
    return;
  }
  const prep = prepCanvas("chart-salary", 180);
  if (!prep) return;
  const ctx = prep.ctx;
  const w = prep.w;
  const h = prep.h;
  const ink = cssVar("--ink", "#1b1916");
  const gross = cssVar("--bar-hi", "#16382e");
  const net = cssVar("--bar-muted", "#c4b49a");
  const line = cssVar("--line", "#e4dccf");
  const pairs = [
    { label: "Low", g: countryRow.grossLow, n: countryRow.netLow },
    { label: "Average", g: countryRow.grossAvg, n: countryRow.netAvg },
    { label: "High", g: countryRow.grossHigh, n: countryRow.netHigh }
  ];
  const max = Math.max(...pairs.flatMap((pair) => [pair.g || 0, pair.n || 0]), 1);
  const padL = 8;
  const padB = 28;
  const padT = 12;
  const plotH = h - padT - padB;
  const groupW = (w - padL) / pairs.length;
  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(padL, padT + plotH);
  ctx.lineTo(w - 4, padT + plotH);
  ctx.stroke();
  ctx.font = "400 12px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  pairs.forEach((pair, i) => {
    const bw = Math.min(28, groupW * 0.22);
    const x = padL + i * groupW + groupW * 0.5 - bw - 4;
    const gh = ((pair.g || 0) / max) * (plotH - 4);
    const nh = ((pair.n || 0) / max) * (plotH - 4);
    ctx.fillStyle = gross;
    ctx.fillRect(x, padT + plotH - gh, bw, gh);
    ctx.fillStyle = net;
    ctx.fillRect(x + bw + 8, padT + plotH - nh, bw, nh);
    ctx.fillStyle = ink;
    ctx.fillText(pair.label, padL + i * groupW + groupW * 0.5, h - 8);
  });
  if (sum) {
    sum.textContent = pairs.map((pair) =>
      pair.label + " gross " + money(pair.g, "USD") + ", net " + money(pair.n, "USD")
    ).join(". ") + ".";
  }
}

function filteredEconomyList() {
  const region = document.getElementById("e-region").value || "All";
  const q = (document.getElementById("e-search").value || "").toLowerCase().trim();
  let list = COUNTRIES.slice();
  if (region !== "All") list = list.filter((row) => row.region === region);
  if (q) {
    list = list.filter((row) => scoreItem({ label: row.name, value: row.code, meta: row.region }, q) > 0);
  }
  return list;
}

function pickTop(arr, key, n, include) {
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
}

function sortRows(list) {
  const dir = tableSort.dir;
  const key = tableSort.key;
  return list.slice().sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const aMissing = av == null || av === "";
    const bMissing = bv == null || bv === "";
    if (aMissing && bMissing) return a.name.localeCompare(b.name);
    if (aMissing) return 1;
    if (bMissing) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      if (av !== bv) return (av - bv) * dir;
      return a.name.localeCompare(b.name);
    }
    const cmp = String(av).localeCompare(String(bv));
    if (cmp !== 0) return cmp * dir;
    return a.name.localeCompare(b.name);
  });
}

function paintTable(list, selected) {
  const tbody = document.querySelector("#e-table tbody");
  const count = document.getElementById("e-count");
  count.textContent = list.length === 1 ? "1 country" : list.length + " countries";
  tbody.replaceChildren();
  if (!list.length) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = "No country matches that search.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  sortRows(list).forEach((row) => {
    const tr = document.createElement("tr");
    tr.dataset.code = row.code;
    if (row.code === selected) tr.className = "on";
    const values = [
      row.name,
      row.region,
      row.gdp == null ? "—" : fmtNum(row.gdp, 1),
      row.growth == null ? "—" : (row.growth >= 0 ? "+" : "") + row.growth + "%",
      row.liveRate == null ? "—" : row.liveRate + "%",
      row.jobGeneral == null ? "—" : row.jobGeneral + "%",
      row.grossAvg == null ? "—" : money(row.grossAvg, "USD"),
      row.netAvg == null ? "—" : money(row.netAvg, "USD")
    ];
    values.forEach((value, index) => {
      const td = document.createElement("td");
      if (index === 0) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "row-btn";
        btn.textContent = value;
        if (row.code === selected) btn.setAttribute("aria-current", "true");
        td.appendChild(btn);
      } else td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  document.querySelectorAll("#e-table th").forEach((th) => {
    const key = th.querySelector("[data-sort]").dataset.sort;
    if (key === tableSort.key) th.setAttribute("aria-sort", tableSort.dir > 0 ? "ascending" : "descending");
    else th.setAttribute("aria-sort", "none");
  });
}

function fmtPop(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Math.round(Number(value)).toLocaleString();
}

function renderEconomy(options) {
  const draw = !options || options.charts !== false;
  const sel = document.getElementById("e-country");
  if (!sel) return;
  const c = country(sel.value);
  if (!c) return;
  const rates = jobRates(c);
  const list = withJobRates(filteredEconomyList());
  const rated = { ...c, liveRate: rates.liveRate, jobGeneral: rates.jobGeneral };

  document.getElementById("e-gdp").textContent =
    c.gdp == null ? "—" : "USD " + fmtNum(c.gdp, 1) + " bn" + (c.gdpYear ? " (" + c.gdpYear + ")" : "");
  const growthEl = document.getElementById("e-growth");
  growthEl.textContent = c.growth == null ? "—" : (c.growth >= 0 ? "+" : "") + c.growth + "%" + (c.growthYear ? " (" + c.growthYear + ")" : "");
  growthEl.classList.toggle("is-down", c.growth != null && c.growth < 0);
  document.getElementById("e-live-rate").textContent =
    rates.liveRate == null ? "—" : rates.liveRate + "%" + (rates.cover != null ? " · " + rates.cover.toFixed(2) + "×" : "");
  document.getElementById("e-job-general").textContent = rates.jobGeneral == null ? "—" : rates.jobGeneral + "%";
  document.getElementById("e-unemp").textContent =
    c.unemp == null ? "—" : fmtNum(c.unemp, 1) + "%" + (c.jobsYear ? " (" + c.jobsYear + ")" : "");
  document.getElementById("e-pop").textContent =
    c.pop == null ? "—" : fmtPop(c.pop) + (c.popYear ? " (" + c.popYear + ")" : "");
  document.getElementById("e-gross").textContent = c.grossAvg == null ? "—" : salaryRangeText(c.grossLow, c.grossHigh, "USD");
  document.getElementById("e-net").textContent = c.netAvg == null ? "—" : salaryRangeText(c.netLow, c.netHigh, "USD");

  document.getElementById("e-summary").textContent =
    c.name + ". Living rate " + (rates.liveRate == null ? "unavailable" : rates.liveRate + " percent") +
    ". General job " + (rates.jobGeneral == null ? "unavailable" : rates.jobGeneral + " percent") + ".";

  if (draw && !document.getElementById("panel-economy").hidden) {
    const regionPeers = withJobRates(COUNTRIES.filter((row) => row.region === c.region));
    document.getElementById("chart-gdp-title").textContent = "Largest economies in this list";
    document.getElementById("chart-growth-title").textContent = "Fastest GDP growth in this list";
    document.getElementById("chart-live-title").textContent = "Living rate in " + c.region;
    document.getElementById("chart-job-title").textContent = "General hiring in " + c.region;
    document.getElementById("chart-salary-title").textContent = "Gross and net salary in " + c.name;
    const gdp = (v) => fmtNum(v, v >= 100 ? 0 : 1);
    const growth = (v) => (v >= 0 ? "+" : "") + fmtNum(v, 1) + "%";
    const rate = (v) => Math.round(v) + "%";
    drawRank("chart-gdp", pickTop(list.slice().sort((a, b) => (b.gdp || 0) - (a.gdp || 0)), "gdp", 8, rated), "gdp", c.code, { format: gdp });
    drawRank("chart-growth", pickTop(list.slice().sort((a, b) => (b.growth || 0) - (a.growth || 0)), "growth", 8, rated), "growth", c.code, { format: growth, signed: true });
    drawRank("chart-live-rate", pickTop(regionPeers.slice().sort((a, b) => (b.liveRate || 0) - (a.liveRate || 0)), "liveRate", 8, rated), "liveRate", c.code, { format: rate });
    drawRank("chart-job-general", pickTop(regionPeers.slice().sort((a, b) => (b.jobGeneral || 0) - (a.jobGeneral || 0)), "jobGeneral", 8, rated), "jobGeneral", c.code, { format: rate });
    const regionOrder = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
    drawRegionShare(regionOrder.map((region) => ({
      label: region,
      value: COUNTRIES.filter((row) => row.region === region && row.gdp != null).reduce((sum, row) => sum + row.gdp, 0)
    })));
    drawSalary(c);
  }

  paintTable(list, c.code);
  const note = document.getElementById("e-note");
  const pay = rates.net != null ? rates.net : rates.gross;
  let coverTxt = "";
  if (rates.living != null) {
    coverTxt = " A decent one-person month is about " + money(rates.living, "USD") +
      (pay != null ? ", against a typical salary of " + money(pay, "USD") : "") +
      (rates.cover != null ? " (" + rates.cover.toFixed(2) + "×)." : ".");
  }
  note.textContent =
    "Living rate compares typical take-home pay with a decent one-person budget. " +
    "Obtaining a general job describes pressure on ordinary hiring, not a specialty market." +
    coverTxt;
}

function setTab(name) {
  document.querySelectorAll(".tabs button").forEach((button) => {
    const on = button.dataset.tab === name;
    button.classList.toggle("on", on);
    button.setAttribute("aria-selected", on ? "true" : "false");
    button.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    const on = panel.id === "panel-" + name;
    panel.classList.toggle("on", on);
    panel.hidden = !on;
  });
  if (name === "economy") requestAnimationFrame(() => renderEconomy());
  writeUrl();
}

function applyTheme(theme, persist) {
  const mode = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", mode);
  if (persist) localStorage.setItem("abroadcost-theme", mode);
  document.querySelectorAll("[data-theme-set]").forEach((button) => {
    const on = button.dataset.themeSet === mode;
    button.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", mode === "dark" ? "#0c0f0e" : "#f3eee6");
}

function knownCountry(code) {
  return COUNTRIES.some((row) => row.code === code);
}

function applyUrl() {
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");
  if (tab === "stay" || tab === "economy" || tab === "monthly") setTab(tab);
  const countryCode = params.get("c");
  if (knownCountry(countryCode)) fields["m-country"].set(countryCode, false);
  const adults = params.get("a");
  if (adults) document.getElementById("m-adults").value = String(Math.min(10, Math.max(1, parseInt(adults, 10) || 1)));
  const children = params.get("k");
  if (children) document.getElementById("m-children").value = String(Math.min(10, Math.max(0, parseInt(children, 10) || 0)));
  const life = params.get("life");
  if (life && LIFE_HINT[life]) document.getElementById("m-life").value = life;
  const cur = params.get("cur");
  if (cur && FX[cur]) fields["m-currency"].set(cur, false);
  const vs = params.get("vs");
  if (vs === "" || vs == null) fields["m-compare"].set("", false);
  else if (knownCountry(vs)) fields["m-compare"].set(vs, false);
  const from = params.get("from");
  if (knownCountry(from)) fields["s-from"].set(from, false);
  const to = params.get("to");
  if (knownCountry(to)) fields["s-to"].set(to, false);
  const purpose = params.get("purpose");
  if (purpose && PURPOSE_LABEL[purpose]) document.getElementById("s-purpose").value = purpose;
  const visa = params.get("visa");
  if (visa && VISA_LABEL[visa]) document.getElementById("s-visa").value = visa;
  else if (purpose && PURPOSE_LABEL[purpose]) document.getElementById("s-visa").value = suggestVisaForPurpose(purpose);
  const days = params.get("days");
  if (days) document.getElementById("s-days").value = String(Math.min(730, Math.max(1, parseInt(days, 10) || 30)));
  const people = params.get("people");
  if (people) document.getElementById("s-people").value = String(Math.min(12, Math.max(1, parseInt(people, 10) || 1)));
  const flight = params.get("flight");
  if (flight && FLIGHT_LABEL[flight]) document.getElementById("s-flight").value = flight;
  const papers = params.get("papers");
  if (papers && PAPERS_USD[papers] != null) document.getElementById("s-papers").value = papers;
  const slife = params.get("slife");
  if (slife && LIFE_HINT[slife]) document.getElementById("s-life").value = slife;
  const scur = params.get("scur");
  if (scur && FX[scur]) fields["s-currency"].set(scur, false);
  const econ = params.get("e");
  if (knownCountry(econ)) fields["e-country"].set(econ, false);
  const region = params.get("region");
  if (region && ["All", "Africa", "Americas", "Asia", "Europe", "Oceania"].includes(region)) {
    document.getElementById("e-region").value = region;
  }
  const q = params.get("q");
  if (q) document.getElementById("e-search").value = q;
}

function writeUrl() {
  if (!urlReady) return;
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const params = new URLSearchParams();
    const tab = document.querySelector(".tabs button[aria-selected='true']");
    if (tab && tab.dataset.tab !== "monthly") params.set("tab", tab.dataset.tab);
    params.set("c", document.getElementById("m-country").value);
    params.set("a", document.getElementById("m-adults").value);
    params.set("k", document.getElementById("m-children").value);
    params.set("life", document.getElementById("m-life").value);
    params.set("cur", document.getElementById("m-currency").value);
    const vs = document.getElementById("m-compare").value;
    if (vs) params.set("vs", vs);
    params.set("from", document.getElementById("s-from").value);
    params.set("to", document.getElementById("s-to").value);
    params.set("purpose", document.getElementById("s-purpose").value);
    params.set("visa", document.getElementById("s-visa").value);
    params.set("days", document.getElementById("s-days").value);
    params.set("people", document.getElementById("s-people").value);
    params.set("flight", document.getElementById("s-flight").value);
    params.set("papers", document.getElementById("s-papers").value);
    params.set("slife", document.getElementById("s-life").value);
    params.set("scur", document.getElementById("s-currency").value);
    params.set("e", document.getElementById("e-country").value);
    if (document.getElementById("e-region").value !== "All") params.set("region", document.getElementById("e-region").value);
    const q = document.getElementById("e-search").value.trim();
    if (q) params.set("q", q);
    const url = new URL(location.href);
    const next = params.toString();
    if (url.search.replace(/^\?/, "") === next) return;
    url.search = next;
    history.replaceState(null, "", url);
  }, 160);
}

function refreshAll() {
  renderMonthly();
  renderStay();
  if (!document.getElementById("panel-economy").hidden) renderEconomy();
  writeUrl();
}

document.addEventListener("DOMContentLoaded", () => {
  const err = document.getElementById("data-error");
  if (!COUNTRIES.length) {
    err.hidden = false;
    err.textContent = "Country data did not load. Refresh the page. If you are running this from a file, use a local server so world_data.js can load.";
    return;
  }
  err.hidden = true;

  const saved = localStorage.getItem("abroadcost-theme");
  applyTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), false);
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  if (scheme.addEventListener) {
    scheme.addEventListener("change", (ev) => {
      if (!localStorage.getItem("abroadcost-theme")) {
        applyTheme(ev.matches ? "dark" : "light", false);
        if (!document.getElementById("panel-economy").hidden) requestAnimationFrame(() => renderEconomy());
      }
    });
  }
  document.querySelectorAll("[data-theme-set]").forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.themeSet, true);
      if (!document.getElementById("panel-economy").hidden) {
        requestAnimationFrame(() => requestAnimationFrame(() => renderEconomy()));
      }
    });
  });

  const countries = countryItems();
  const currencies = currencyItems();
  const compareItems = [{ value: "", label: "No comparison", meta: "" }].concat(countries);
  mountCombo("m-country-q", "m-country", countries, "RW");
  mountCombo("m-currency-q", "m-currency", currencies, "USD");
  mountCombo("m-compare-q", "m-compare", compareItems, "");
  mountCombo("s-from-q", "s-from", countries, "US");
  mountCombo("s-to-q", "s-to", countries, "RW");
  mountCombo("s-currency-q", "s-currency", currencies, "USD");
  mountCombo("e-country-q", "e-country", countries, "RW");

  if (location.search) applyUrl();

  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (ev) => ev.preventDefault());
  });

  document.querySelectorAll('input[type="number"]').forEach((el) => {
    el.addEventListener("wheel", (ev) => {
      if (document.activeElement === el) ev.preventDefault();
    }, { passive: false });
  });

  function bindClamp(id, min, max, fallback) {
    const el = document.getElementById(id);
    el.addEventListener("blur", () => {
      let v = Number(el.value);
      if (!Number.isFinite(v)) v = fallback;
      el.value = String(Math.min(max, Math.max(min, Math.round(v))));
      refreshAll();
    });
  }
  bindClamp("m-adults", 1, 10, 1);
  bindClamp("m-children", 0, 10, 0);
  bindClamp("s-days", 1, 730, 30);
  bindClamp("s-people", 1, 12, 1);

  const tabs = document.querySelector(".tabs");
  tabs.addEventListener("keydown", (ev) => {
    const buttons = Array.from(tabs.querySelectorAll('[role="tab"]'));
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    let next = null;
    if (ev.key === "ArrowRight") next = buttons[(index + 1) % buttons.length];
    else if (ev.key === "ArrowLeft") next = buttons[(index - 1 + buttons.length) % buttons.length];
    else if (ev.key === "Home") next = buttons[0];
    else if (ev.key === "End") next = buttons[buttons.length - 1];
    if (!next) return;
    ev.preventDefault();
    next.focus();
    setTab(next.dataset.tab);
  });
  document.querySelectorAll(".tabs button").forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });

  ["m-country", "m-adults", "m-children", "m-life", "m-currency", "m-compare"].forEach((id) => {
    const el = document.getElementById(id);
    const handler = () => {
      if (id === "m-country") {
        const picked = country(el.value);
        if (picked && FX[picked.currency]) fields["m-currency"].set(picked.currency, false);
      }
      renderMonthly();
      writeUrl();
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });

  ["s-from", "s-to", "s-days", "s-people", "s-life", "s-currency", "s-purpose", "s-visa", "s-papers", "s-flight"].forEach((id) => {
    const el = document.getElementById(id);
    const handler = () => {
      if (id === "s-to") {
        const picked = country(el.value);
        if (picked && FX[picked.currency]) fields["s-currency"].set(picked.currency, false);
      }
      renderStay();
      writeUrl();
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });

  document.getElementById("s-purpose").addEventListener("change", () => {
    const purpose = document.getElementById("s-purpose").value;
    document.getElementById("s-visa").value = suggestVisaForPurpose(purpose);
    const daysEl = document.getElementById("s-days");
    if (purpose === "study" && +daysEl.value < 180) daysEl.value = "180";
    if (purpose === "work" && +daysEl.value < 90) daysEl.value = "90";
    if (purpose === "visit" && +daysEl.value > 30) daysEl.value = "14";
    syncPermanentUi(purpose);
    renderStay();
    writeUrl();
  });

  document.getElementById("s-swap").addEventListener("click", () => {
    const from = document.getElementById("s-from").value;
    const to = document.getElementById("s-to").value;
    fields["s-from"].set(to, false);
    fields["s-to"].set(from, false);
    const dest = country(document.getElementById("s-to").value);
    if (dest && FX[dest.currency]) fields["s-currency"].set(dest.currency, false);
    renderStay();
    writeUrl();
  });

  document.getElementById("e-country").addEventListener("change", () => {
    renderEconomy();
    writeUrl();
  });
  document.getElementById("e-region").addEventListener("change", () => {
    renderEconomy();
    writeUrl();
  });
  let searchTimer = 0;
  document.getElementById("e-search").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      renderEconomy();
      writeUrl();
    }, 90);
  });

  document.querySelector("#e-table").addEventListener("click", (ev) => {
    const sortBtn = ev.target.closest("[data-sort]");
    if (sortBtn) {
      const key = sortBtn.dataset.sort;
      const numeric = ["gdp", "growth", "liveRate", "jobGeneral", "grossAvg", "netAvg"].includes(key);
      if (tableSort.key === key) tableSort.dir *= -1;
      else {
        tableSort.key = key;
        tableSort.dir = numeric ? -1 : 1;
      }
      renderEconomy({ charts: false });
      return;
    }
    const tr = ev.target.closest("tr[data-code]");
    if (!tr) return;
    const y = window.scrollY;
    fields["e-country"].set(tr.dataset.code, true);
    window.scrollTo(0, y);
  });

  const charts = document.querySelector(".charts");
  if (window.ResizeObserver && charts) {
    let resizeTimer = 0;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!document.getElementById("panel-economy").hidden) renderEconomy();
      }, 120);
    });
    observer.observe(charts);
  } else {
    window.addEventListener("resize", () => {
      if (!document.getElementById("panel-economy").hidden) renderEconomy();
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!document.getElementById("panel-economy").hidden) renderEconomy();
    });
  }

  const count = document.getElementById("country-count");
  if (count) count.textContent = String(COUNTRIES.length);
  const source = document.getElementById("source-line");
  if (source) source.textContent = sourceFootnote();

  renderMonthly();
  renderStay();
  urlReady = true;
  if (location.search) writeUrl();
});
