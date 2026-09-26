// Drives the real page in Chromium and asserts on what the user actually sees.
//
//   npm test
//
// Set CHROMIUM_PATH to use a pre-installed browser instead of Playwright's
// own download (handy in sandboxes that ship one).

const { chromium } = require("playwright");
const path = require("path");

const PAGE_URL = "file://" + path.join(__dirname, "..", "index.html");
const OTHER_PORT = "__other__";

// Each case fills the form, clicks through, and checks the result banner's
// class plus the presence or absence of specific phrases.
const cases = [
  {
    name: "eligible nationality, ports in different regions",
    passport: "United States", origin: "United States", entry: "PVG", exit: "CAN",
    destination: "Japan",
    expect: "eligible",
    contains: ["240", "no longer have to be in the same region"]
  },
  {
    name: "30-day visa-free nationality skips the transit rules",
    passport: "Germany", origin: "Germany", entry: "PEK", exit: "PEK",
    destination: "Thailand",
    expect: "eligible",
    contains: ["30 days"],
    // The transit branch is the only one that lists border documents.
    notContains: ["Bring with you"]
  },
  {
    name: "nationality off both lists gets 24-hour transit only",
    passport: "India", origin: "India", entry: "PEK", exit: "PEK",
    destination: "Thailand",
    expect: "info",
    contains: ["24-hour"]
  },
  {
    name: "recently added nationality is flagged with its start date",
    passport: "Vietnam", origin: "Vietnam", entry: "KMG", exit: "CAN",
    destination: "Singapore",
    expect: "eligible",
    contains: ["20 August 2026"]
  },
  {
    name: "unlisted port is unconfirmed, never a hard no",
    passport: "United States", origin: "United States", entry: OTHER_PORT, exit: "PEK",
    destination: "Japan",
    expect: "info",
    contains: ["official list"],
    notContains: ["Not eligible"]
  },
  {
    name: "same-region itinerary omits the cross-region note",
    passport: "United States", origin: "United States", entry: "PVG", exit: "SHA",
    destination: "Japan",
    expect: "eligible",
    notContains: ["no longer have to be in the same region"]
  },
  {
    // The third-country rule: arrival and onward country must differ.
    name: "round trip to the same country fails the third-country rule",
    passport: "United States", origin: "United States", entry: "PVG", exit: "PVG",
    destination: "United States",
    expect: "ineligible",
    contains: ["third", "Hong Kong"],
    notContains: ["Eligible"]
  },
  {
    // Hong Kong is a third region, so the China leg still qualifies.
    name: "same country via Hong Kong satisfies the third-country rule",
    passport: "United States", origin: "United States", entry: "PVG", exit: "CAN",
    destination: "Hong Kong",
    expect: "eligible",
    contains: ["240"]
  },
  {
    // The third-country rule is a transit rule; 30-day entry is not transit.
    name: "30-day nationality may still fly a round trip",
    passport: "Germany", origin: "Germany", entry: "PEK", exit: "PEK",
    destination: "Germany",
    expect: "eligible",
    contains: ["30 days"],
    notContains: ["Bring with you"]
  },
  {
    // Nationalities off the transit list need a third country too.
    name: "24-hour nationality on a round trip is told it is not transit",
    passport: "India", origin: "India", entry: "PEK", exit: "PEK",
    destination: "India",
    expect: "ineligible",
    contains: ["third"]
  },
  {
    name: "Australia is on the 30-day list, so a round trip is fine",
    passport: "Australia", origin: "Australia", entry: "PEK", exit: "PEK",
    destination: "Australia",
    expect: "eligible",
    contains: ["30 days", "unilateral"]
  },
  {
    name: "mutual-exemption nationality gets the bilateral answer",
    passport: "Thailand", origin: "Thailand", entry: "PEK", exit: "PEK",
    destination: "Thailand",
    expect: "eligible",
    contains: ["mutual visa exemption"],
    notContains: ["Bring with you"]
  },
  {
    name: "Yunnan transit lists its permitted cities, not the whole province",
    passport: "United States", origin: "United States", entry: "LJG", exit: "KMG",
    destination: "Japan",
    expect: "eligible",
    contains: ["Lijiang", "Xishuangbanna"]
  },
  {
    name: "incomplete form asks for the missing fields",
    passport: "United States", origin: null, entry: null, exit: null, destination: null,
    expect: "info",
    contains: ["every field"]
  }
];

// Data-level invariants that a careless edit to data.js would break.
function dataChecks() {
  const problems = [];
  const dup = (list, label) => {
    const seen = new Set(), dupes = new Set();
    list.forEach((c) => (seen.has(c) ? dupes.add(c) : seen.add(c)));
    if (dupes.size) problems.push(`${label} has duplicates: ${[...dupes].join(", ")}`);
  };

  dup(TRANSIT_COUNTRIES, "TRANSIT_COUNTRIES");
  dup(VISA_FREE_30_DAY, "VISA_FREE_30_DAY");
  dup(DESTINATIONS, "DESTINATIONS");
  dup(MUTUAL_VISA_EXEMPT, "MUTUAL_VISA_EXEMPT");

  const both = VISA_FREE_30_DAY.filter((c) => MUTUAL_VISA_EXEMPT.includes(c));
  if (both.length) {
    problems.push(`on both the unilateral and mutual lists: ${both.join(", ")}`);
  }

  const noOrigin = [...VISA_FREE_30_DAY, ...MUTUAL_VISA_EXEMPT]
    .filter((c) => !DESTINATIONS.includes(c));
  if (noOrigin.length) {
    problems.push(`not selectable as origin or destination: ${noOrigin.join(", ")}`);
  }

  const missing = [...TRANSIT_COUNTRIES, ...VISA_FREE_30_DAY, ...MUTUAL_VISA_EXEMPT]
    .filter((c) => !ALL_COUNTRIES.includes(c));
  if (missing.length) {
    problems.push(`not selectable in the passport dropdown: ${missing.join(", ")}`);
  }

  if (DESTINATIONS.includes("China")) {
    problems.push("mainland China must not be offered as a transit destination");
  }

  if (STAY_REGIONS.length !== POLICY.regionCount) {
    problems.push(
      `STAY_REGIONS has ${STAY_REGIONS.length} entries but POLICY.regionCount is ${POLICY.regionCount}`
    );
  }

  const overlap = STAY_REGIONS.map((r) => r.name)
    .filter((n) => EXCLUDED_REGIONS.includes(n));
  if (overlap.length) {
    problems.push(`listed as both permitted and excluded: ${overlap.join(", ")}`);
  }

  const portRegions = new Set(PORTS.map((p) => p.region));
  const stayNames = new Set(STAY_REGIONS.map((r) => r.name));
  const orphans = [...portRegions].filter((r) => !stayNames.has(r));
  if (orphans.length) {
    problems.push(`ports in regions with no permitted stay area: ${orphans.join(", ")}`);
  }

  return problems;
}

async function selectPort(page, selector, code) {
  if (code === OTHER_PORT) {
    await page.selectOption(selector, OTHER_PORT);
    return;
  }
  const value = await page.evaluate(({ selector, code }) => {
    const options = [...document.querySelectorAll(selector + " option")];
    const match = options.find((o) => {
      try { return JSON.parse(o.value).code === code; } catch { return false; }
    });
    return match ? match.value : null;
  }, { selector, code });

  if (!value) throw new Error(`no port with code ${code} in ${selector}`);
  await page.selectOption(selector, value);
}

(async () => {
  const executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox"] } : {}
  );
  const page = await browser.newPage();

  const jsErrors = [];
  page.on("pageerror", (e) => jsErrors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") jsErrors.push("console: " + m.text());
  });

  await page.goto(PAGE_URL);

  let failures = 0;

  const dataProblems = await page.evaluate(dataChecks);
  if (dataProblems.length) {
    failures += dataProblems.length;
    dataProblems.forEach((p) => console.log("FAIL  data: " + p));
  } else {
    console.log("PASS  data invariants");
  }

  for (const c of cases) {
    await page.reload();
    if (c.passport) await page.selectOption("#passport", c.passport);
    if (c.origin) await page.selectOption("#origin", c.origin);
    if (c.entry) await selectPort(page, "#entry-port", c.entry);
    if (c.exit) await selectPort(page, "#exit-port", c.exit);
    if (c.destination) await page.selectOption("#destination", c.destination);
    await page.click("#check-btn");

    const result = await page.evaluate(() => ({
      className: document.getElementById("result").className,
      text: document.getElementById("result").innerText
    }));

    const missing = (c.contains || []).filter((s) => !result.text.includes(s));
    const unexpected = (c.notContains || []).filter((s) => result.text.includes(s));
    const ok = result.className === c.expect && !missing.length && !unexpected.length;

    if (ok) {
      console.log("PASS  " + c.name);
    } else {
      failures++;
      console.log(
        "FAIL  " + c.name +
        `\n      expected banner "${c.expect}", got "${result.className}"` +
        (missing.length ? `\n      missing: ${JSON.stringify(missing)}` : "") +
        (unexpected.length ? `\n      unexpected: ${JSON.stringify(unexpected)}` : "")
      );
    }
  }

  if (jsErrors.length) {
    failures += jsErrors.length;
    jsErrors.forEach((e) => console.log("FAIL  javascript error: " + e));
  }

  await browser.close();
  console.log(failures ? `\n${failures} failing` : "\nall passing");
  process.exit(failures ? 1 : 0);
})();
