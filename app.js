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

// ============================================================
// Populate passport & destination dropdowns
// ============================================================
function populateCountries(selectEl, countries) {
  countries.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    selectEl.appendChild(opt);
  });
}

// Passport dropdown: eligible 54 countries first, then divider, then all others
const eligibleSet = new Set(ELIGIBLE_COUNTRIES_144);
const sortedEligible = [...ELIGIBLE_COUNTRIES_144].sort();
const otherCountries = ALL_COUNTRIES.filter((c) => !eligibleSet.has(c)).sort();

// Add eligible group
const eligibleGroup = document.createElement("optgroup");
eligibleGroup.label = "Eligible for 144h / 72h transit";
sortedEligible.forEach((c) => {
  const opt = document.createElement("option");
  opt.value = c;
  opt.textContent = c;
  eligibleGroup.appendChild(opt);
});
passportSelect.appendChild(eligibleGroup);

// Add other group
const otherGroup = document.createElement("optgroup");
otherGroup.label = "Other countries (24h transit only)";
otherCountries.forEach((c) => {
  const opt = document.createElement("option");
  opt.value = c;
  opt.textContent = c;
  otherGroup.appendChild(opt);
});
passportSelect.appendChild(otherGroup);

// Destination: all countries except China
const destinations = ALL_COUNTRIES.filter(
  (c) => c !== "China" && c !== "Hong Kong" && c !== "Macau" && c !== "Taiwan"
);
populateCountries(destinationSelect, destinations.sort());

// Also add the special regions since they count as "third country/region"
["Hong Kong", "Macau", "Taiwan"].forEach((r) => {
  const opt = document.createElement("option");
  opt.value = r;
  opt.textContent = r;
  destinationSelect.appendChild(opt);
});

// ============================================================
// Build flat port lists by method from TRANSIT_ZONES
// ============================================================
function getPortsByMethod(method) {
  const ports = [];
  for (const [zoneKey, zone] of Object.entries(TRANSIT_ZONES)) {
    const zonePorts = zone.ports[method] || [];
    zonePorts.forEach((p) => {
      ports.push({
        ...p,
        zone: zoneKey,
        zoneLabel: zone.label,
        duration: zone.duration,
      });
    });
  }
  return ports;
}

function populatePorts(selectEl, method) {
  // Clear existing options
  selectEl.innerHTML = "";

  if (!method) {
    selectEl.innerHTML = '<option value="">Select method first...</option>';
    selectEl.disabled = true;
    return;
  }

  const ports = getPortsByMethod(method);

  if (ports.length === 0) {
    selectEl.innerHTML =
      '<option value="">No ports for this method</option>';
    selectEl.disabled = true;
    return;
  }

  selectEl.disabled = false;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select port...";
  selectEl.appendChild(placeholder);

  // Group by zone
  const byZone = {};
  ports.forEach((p) => {
    if (!byZone[p.zoneLabel]) byZone[p.zoneLabel] = [];
    byZone[p.zoneLabel].push(p);
  });

  for (const [zoneLabel, zonePorts] of Object.entries(byZone)) {
    const group = document.createElement("optgroup");
    group.label = zoneLabel;
    zonePorts.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = JSON.stringify({
        code: p.code,
        name: p.name,
        zone: p.zone,
        duration: p.duration,
        zoneLabel: p.zoneLabel,
      });
      opt.textContent = p.name;
      group.appendChild(opt);
    });
    selectEl.appendChild(group);
  }
}

// ============================================================
// Cascading selects: method -> port
// ============================================================
entryMethodSelect.addEventListener("change", () => {
  populatePorts(entryPortSelect, entryMethodSelect.value);
  clearResult();
});

exitMethodSelect.addEventListener("change", () => {
  populatePorts(exitPortSelect, exitMethodSelect.value);
  clearResult();
});

// Clear result on any change
[passportSelect, entryPortSelect, exitPortSelect, destinationSelect].forEach(
  (el) => el.addEventListener("change", clearResult)
);

function clearResult() {
  resultDiv.className = "";
  resultDiv.style.display = "none";
  resultDiv.innerHTML = "";
}

// ============================================================
// Eligibility check
// ============================================================
checkBtn.addEventListener("click", () => {
  const passport = passportSelect.value;
  const entryMethod = entryMethodSelect.value;
  const entryPortRaw = entryPortSelect.value;
  const exitMethod = exitMethodSelect.value;
  const exitPortRaw = exitPortSelect.value;
  const destination = destinationSelect.value;

  // Validation
  if (!passport || !entryMethod || !entryPortRaw || !exitMethod || !exitPortRaw || !destination) {
    showResult("info", "Missing Information", "Please fill in all fields before checking.");
    return;
  }

  const entryPort = JSON.parse(entryPortRaw);
  const exitPort = JSON.parse(exitPortRaw);
  const isEligible144 = eligibleSet.has(passport);

  // ----- Rule: destination must be a third country (not China) -----
  // Already filtered in the dropdown, but sanity check
  if (destination === "China") {
    showResult(
      "ineligible",
      "Not Eligible",
      "Transit visa-free policy requires you to be transiting <strong>through</strong> China to a third country or region. Your destination cannot be mainland China."
    );
    return;
  }

  // ----- 24-hour transit (any nationality) -----
  // All foreign nationals can transit for up to 24 hours without a visa
  // if they hold a connecting ticket to a third country.
  // They must stay within the airport (some ports allow city stay).

  // ----- 144/72-hour transit -----
  if (!isEligible144) {
    // Not in the 54-country list — only 24h transit
    showResult(
      "info",
      "24-Hour Transit Only",
      `<p>Passport holders from <strong>${passport}</strong> are not on the list of 54 countries eligible for 144/72-hour visa-free transit.</p>
       <p>However, you may still be eligible for <strong>24-hour visa-free transit</strong> at most international ports, provided you:</p>
       <ul>
         <li>Hold a confirmed onward ticket to a third country/region</li>
         <li>Stay within the permitted area (often airport-only)</li>
       </ul>
       <p>Contact the airline or the port's immigration office for details.</p>`
    );
    return;
  }

  // Check if entry and exit are at the same zone
  const sameZone = entryPort.zone === exitPort.zone;
  const entryZone = TRANSIT_ZONES[entryPort.zone];
  const exitZone = TRANSIT_ZONES[exitPort.zone];

  // The key rule: you can enter and exit from the SAME zone's ports.
  // Cross-zone transit is allowed for some linked zones, but the standard
  // policy is same-zone entry/exit.
  // Some special cross-zone combos exist (e.g., enter Beijing, exit Tianjin
  // is fine since they're in the same zone).

  if (sameZone) {
    const duration = entryPort.duration;
    const zone = TRANSIT_ZONES[entryPort.zone];
    let extra = zone.note ? `<p><em>${zone.note}</em></p>` : "";

    showResult(
      "eligible",
      `Eligible — ${duration}-Hour Visa-Free Transit`,
      `<p>Great news! As a <strong>${passport}</strong> passport holder, you are eligible for <strong>${duration}-hour visa-free transit</strong>.</p>
       <ul>
         <li><strong>Entry:</strong> ${entryPort.name}</li>
         <li><strong>Exit:</strong> ${exitPort.name}</li>
         <li><strong>Stay area:</strong> ${zone.stayArea}</li>
         <li><strong>Max stay:</strong> ${duration} hours from arrival</li>
         <li><strong>Destination:</strong> ${destination}</li>
       </ul>
       <p>You must carry:</p>
       <ul>
         <li>Valid passport (6+ months recommended)</li>
         <li>Confirmed onward ticket to <strong>${destination}</strong></li>
         <li>Completed arrival card</li>
       </ul>
       ${extra}`
    );
  } else {
    // Different zones — not standard eligible for visa-free transit
    showResult(
      "ineligible",
      "Not Eligible for Visa-Free Transit",
      `<p>Your entry port (<strong>${entryPort.name}</strong>) is in the <strong>${entryZone.label}</strong> zone, but your exit port (<strong>${exitPort.name}</strong>) is in the <strong>${exitZone.label}</strong> zone.</p>
       <p>The transit visa-free policy requires you to <strong>enter and exit from ports within the same transit zone</strong>.</p>
       <p>Options:</p>
       <ul>
         <li>Change your exit port to one within the <strong>${entryZone.label}</strong> zone</li>
         <li>Change your entry port to one within the <strong>${exitZone.label}</strong> zone</li>
         <li>Apply for a standard Chinese visa at your nearest embassy</li>
       </ul>`
    );
  }
});

function showResult(type, title, body) {
  resultDiv.className = type;
  resultDiv.style.display = "block";
  resultDiv.innerHTML = `<h3>${title}</h3>${body}`;
  resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
