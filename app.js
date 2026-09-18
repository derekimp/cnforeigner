// ============================================================
// DOM refs
// ============================================================
const passportSelect = document.getElementById("passport");
const entryMethodSelect = document.getElementById("entry-method");
const entryPortSelect = document.getElementById("entry-port");
const exitMethodSelect = document.getElementById("exit-method");
const exitPortSelect = document.getElementById("exit-port");
const destinationSelect = document.getElementById("destination");
const checkBtn = document.getElementById("check-btn");
const resultDiv = document.getElementById("result");

const OTHER_PORT = "__other__";

const transitSet = new Set(TRANSIT_COUNTRIES);
const visaFreeSet = new Set(VISA_FREE_30_DAY);

// ============================================================
// Dropdowns
// ============================================================
function addOption(parent, value, text) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = text;
  parent.appendChild(opt);
  return opt;
}

function addGroup(selectEl, label, countries) {
  const group = document.createElement("optgroup");
  group.label = label;
  countries.forEach((c) => addOption(group, c, c));
  selectEl.appendChild(group);
}

// Passport: the two groups that change the outcome, then everyone else.
const visaFreePassports = ALL_COUNTRIES.filter((c) => visaFreeSet.has(c));
const transitOnlyPassports = ALL_COUNTRIES.filter(
  (c) => transitSet.has(c) && !visaFreeSet.has(c)
);
const otherPassports = ALL_COUNTRIES.filter(
  (c) => !transitSet.has(c) && !visaFreeSet.has(c)
);

addGroup(passportSelect, "30-day visa-free entry", visaFreePassports);
addGroup(passportSelect, `${POLICY.transitHours}-hour visa-free transit`, transitOnlyPassports);
addGroup(passportSelect, "Visa or 24-hour transit only", otherPassports);

// Destination: anywhere outside mainland China.
DESTINATIONS.forEach((c) => addOption(destinationSelect, c, c));

// ============================================================
// Ports
// ============================================================
function populatePorts(selectEl, method) {
  selectEl.innerHTML = "";
  addOption(selectEl, "", "Select port...");

  PORTS.forEach((region) => {
    const matching = method
      ? region.ports.filter((p) => p.method === method)
      : region.ports;
    if (matching.length === 0) return;

    const group = document.createElement("optgroup");
    group.label = region.region;
    matching.forEach((p) => {
      const value = JSON.stringify({
        name: p.name,
        code: p.code,
        method: p.method,
        region: region.region
      });
      addOption(group, value, `${p.name} (${p.method})`);
    });
    selectEl.appendChild(group);
  });

  addOption(selectEl, OTHER_PORT, "My port is not listed");
}

populatePorts(entryPortSelect, "");
populatePorts(exitPortSelect, "");

entryMethodSelect.addEventListener("change", () => {
  populatePorts(entryPortSelect, entryMethodSelect.value);
  clearResult();
});

exitMethodSelect.addEventListener("change", () => {
  populatePorts(exitPortSelect, exitMethodSelect.value);
  clearResult();
});

[passportSelect, entryPortSelect, exitPortSelect, destinationSelect].forEach(
  (el) => el.addEventListener("change", clearResult)
);

function clearResult() {
  resultDiv.className = "";
  resultDiv.style.display = "none";
  resultDiv.innerHTML = "";
}

// ============================================================
// Rendering helpers
// ============================================================
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function stayAreaHtml() {
  const items = STAY_REGIONS.map((r) =>
    r.scope === "all"
      ? escapeHtml(r.name)
      : `${escapeHtml(r.name)} <em>(${r.scope.map(escapeHtml).join(", ")} only)</em>`
  );
  return `<p>You may travel freely between all ${POLICY.regionCount} permitted areas,
    including across provincial boundaries:</p>
    <p class="regions">${items.join(" &middot; ")}</p>
    <p class="muted">Not covered: ${EXCLUDED_REGIONS.map(escapeHtml).join(", ")}.</p>`;
}

function requirementsHtml() {
  return `<p>Bring with you:</p><ul>${TRANSIT_REQUIREMENTS.map(
    (r) => `<li>${escapeHtml(r)}</li>`
  ).join("")}</ul>`;
}

function showResult(type, title, body) {
  resultDiv.className = type;
  resultDiv.style.display = "block";
  resultDiv.innerHTML = `<h3>${escapeHtml(title)}</h3>${body}`;
  resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ============================================================
// Eligibility check
// ============================================================
checkBtn.addEventListener("click", () => {
  const passport = passportSelect.value;
  const entryRaw = entryPortSelect.value;
  const exitRaw = exitPortSelect.value;
  const destination = destinationSelect.value;

  if (!passport || !entryRaw || !exitRaw || !destination) {
    showResult("info", "Missing information",
      "<p>Please fill in every field before checking.</p>");
    return;
  }

  // A transit stay has to end outside mainland China.
  if (destination === "China") {
    showResult("ineligible", "Not a transit journey",
      `<p>Visa-free transit requires you to be travelling <strong>through</strong>
       mainland China to a third country or region. Hong Kong, Macao and Taiwan
       all count as third regions; mainland China does not.</p>`);
    return;
  }

  const safePassport = escapeHtml(passport);
  const safeDestination = escapeHtml(destination);

  // The 30-day policy has no transit conditions at all, so it wins outright.
  if (visaFreeSet.has(passport)) {
    showResult("eligible", "No visa needed — 30 days visa-free",
      `<p><strong>${safePassport}</strong> passport holders can enter mainland China
       visa-free for up to <strong>30 days</strong> under the unilateral visa-free
       policy. You do not need to satisfy any transit conditions: no onward ticket
       to a third country, no designated port, no restricted stay area.</p>
       <p>You are free to travel anywhere in mainland China, and your onward trip to
       <strong>${safeDestination}</strong> does not affect this.</p>
       <p class="muted">This policy currently runs to 31 December 2026 for most
       nationalities. Confirm the end date before you travel.</p>`);
    return;
  }

  if (!transitSet.has(passport)) {
    showResult("info", "24-hour transit only",
      `<p><strong>${safePassport}</strong> is not among the ${TRANSIT_COUNTRIES.length}
       nationalities eligible for ${POLICY.transitHours}-hour visa-free transit.</p>
       <p>You can still use <strong>24-hour visa-free transit</strong>: with a confirmed
       onward ticket to a third country you may stay airside at any international
       airport without a visa. Leaving the airport generally requires a visa.</p>
       <p>For a longer stay, apply for a Chinese visa before you travel.</p>`);
    return;
  }

  // Eligible nationality — now check both ports are designated.
  const entryUnlisted = entryRaw === OTHER_PORT;
  const exitUnlisted = exitRaw === OTHER_PORT;

  if (entryUnlisted || exitUnlisted) {
    const which = entryUnlisted && exitUnlisted
      ? "Neither of your ports is"
      : `Your ${entryUnlisted ? "entry" : "exit"} port is not`;
    showResult("info", "Check your port against the official list",
      `<p><strong>${safePassport}</strong> passport holders are eligible for
       ${POLICY.transitHours}-hour visa-free transit, but the policy only applies at
       designated ports. ${which} in this tool's list.</p>
       <p>This tool tracks the ${POLICY.officialPortCount} designated ports, but the
       official list changes often. Check your port against the
       <a href="${POLICY.sourceUrl}" target="_blank" rel="noopener">National Immigration
       Administration list</a> before relying on this.</p>`);
    return;
  }

  const entryPort = JSON.parse(entryRaw);
  const exitPort = JSON.parse(exitRaw);
  const addedOn = TRANSIT_COUNTRY_ADDED[passport];
  const crossRegion = entryPort.region !== exitPort.region;

  const addedNote = addedOn
    ? `<p class="muted">${safePassport} was added to the policy on
       ${escapeHtml(addedOn)}. If an airline is working from an older list, the
       National Immigration Administration page is the authority.</p>`
    : "";

  const crossRegionNote = crossRegion
    ? `<p>You are entering in <strong>${escapeHtml(entryPort.region)}</strong> and
       leaving from <strong>${escapeHtml(exitPort.region)}</strong>. Since
       ${POLICY.effectiveFrom} that is allowed — entry and exit ports no longer have
       to be in the same region.</p>`
    : "";

  showResult("eligible", `Eligible — ${POLICY.transitHours}-hour visa-free transit`,
    `<p>As a <strong>${safePassport}</strong> passport holder travelling on to
     <strong>${safeDestination}</strong>, you qualify for
     <strong>${POLICY.transitHours} hours (10 days)</strong> in mainland China
     without a visa.</p>
     <ul>
       <li><strong>Entry:</strong> ${escapeHtml(entryPort.name)} (${escapeHtml(entryPort.region)})</li>
       <li><strong>Exit:</strong> ${escapeHtml(exitPort.name)} (${escapeHtml(exitPort.region)})</li>
       <li><strong>Clock starts:</strong> 00:00 on the day after you arrive</li>
     </ul>
     ${crossRegionNote}
     ${stayAreaHtml()}
     ${requirementsHtml()}
     ${addedNote}`);
});
