// Live data endpoints
const stationURL = `https://mtr-proxy.vineroz.workers.dev?url=https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv`;
const fareURL = `https://mtr-proxy.vineroz.workers.dev?url=https://opendata.mtr.com.hk/data/mtr_lines_fares.csv`;

let stations = [];
let fareTable = {};
let fareBreakdownId = 0;
let activeRouteButton = null;
let activeRouteOption = null;

let currentLang = "zh"; // default language

const translations = {
  en: {
    fromLine: "From Line",
    fromStation: "From Station",
    toLine: "To Line",
    toStation: "To Station",
    calculate: "Calculate",
    monthlyPasses: "Monthly passes",
    toggleAll: "Toggle all",
    noPassesSelected: "Select a pass to see its results",
    originalFare: "Original Fare:",
    saving: amount => `save $${amount.toFixed(1)}`,
    passDiscountAxis: "Pass discounts",
    reentryDiscountAxis: "Re-entry discounts",
    noReentry: "No re-entry",
    fewestInterchanges: "Fewest interchanges",
    fewestStations: "Fewest stations",
    interchangeCount: count => `${count} ${count === 1 ? "interchange" : "interchanges"}`,
    stationCountLabel: count => `${count} ${count === 1 ? "station" : "stations"}`,
    routeSuggestionLabel: "Route suggestions",
    noDiscountResults: "No pass discount",
    passLabels: labels => labels.join(" / "),
    reenterAt: station => `Re-entry at ${station}`,
    reentryStationGroup: count => `${count} re-entry stations with the same fare`,
    reentryGroupBreakdown: (stationNames, origin, destination, firstLeg, secondLeg, fare) =>
      `Same fare at: ${stationNames.join(", ")}\n${origin} → each station: ${firstLeg}\nEach station → ${destination}: ${secondLeg}\nTotal at each station: ${formatFare(fare)}`,
    breakdownLabel: "Show fare calculation",
    passCovered: fare => `Journey covered by pass: ${formatFare(fare)}`,
    fullFare: "full fare",
    viaStation: station => `via ${station}`,
    total: "Total",
    showRoute: "Show route",
    routeFor: label => `Route: ${label}`,
    interchange: "Interchange",
    exitReenter: "Exit and re-enter",
    stationCount: count => `${count} ${count === 1 ? "stop" : "stops"}`,
    lines: {
      "Tuen Ma Line": "Tuen Ma Line",
      "East Rail Line": "East Rail Line",
      "Tung Chung Line": "Tung Chung Line",
      "Tsuen Wan Line": "Tsuen Wan Line",
      "Kwun Tong Line": "Kwun Tong Line",
      "Island Line": "Island Line",
      "Tseung Kwan O Line": "Tseung Kwan O Line",
      "South Island Line": "South Island Line",
      "Disneyland Resort Line": "Disneyland Resort Line"
    },
    passes: {
      "Pass1": "East Rail Line + Tuen Ma Line",
      "Pass2": "Tuen Mun ↔ Nam Cheong",
      "Pass3": "Tuen Mun ↔ Hung Hom",
      "Pass4": "Tung Chung ↔ Nam Cheong",
      "Pass5": "Tung Chung ↔ Hong Kong"
    }
  },
  zh: {
    fromLine: "起點路線",
    fromStation: "起點車站",
    toLine: "終點路線",
    toStation: "終點車站",
    calculate: "計算",
    monthlyPasses: "全月通",
    toggleAll: "全選／取消全選",
    noPassesSelected: "請選擇全月通以顯示結果",
    originalFare: "原價：",
    saving: amount => `省 $${amount.toFixed(1)}`,
    passDiscountAxis: "全月通折扣",
    reentryDiscountAxis: "出閘再入閘折扣",
    noReentry: "不出閘",
    fewestInterchanges: "最少轉車",
    fewestStations: "最少車站",
    interchangeCount: count => `${count}次轉車`,
    stationCountLabel: count => `${count}站`,
    routeSuggestionLabel: "路線建議",
    noDiscountResults: "沒有全月通折扣",
    passLabels: labels => labels.join("／"),
    reenterAt: station => `於${station}站出閘／入閘`,
    reentryStationGroup: count => `${count}個相同票價的出閘／入閘車站`,
    reentryGroupBreakdown: (stationNames, origin, destination, firstLeg, secondLeg, fare) =>
      `以下車站票價相同：${stationNames.join('、')}\n${origin} → 各車站：${firstLeg}\n各車站 → ${destination}：${secondLeg}\n每次合共：${formatFare(fare)}`,
    breakdownLabel: "顯示票價計算",
    passCovered: fare => `全程由全月通覆蓋：${formatFare(fare)}`,
    fullFare: "原價",
    viaStation: station => `經${station}`,
    total: "合共",
    showRoute: "顯示路線",
    routeFor: label => `路線：${label}`,
    interchange: "轉車",
    exitReenter: "出閘／入閘",
    stationCount: count => `${count}站`,
    lines: {
      "Tuen Ma Line": "屯馬綫",
      "East Rail Line": "東鐵綫",
      "Tung Chung Line": "東涌綫",
      "Tsuen Wan Line": "荃灣綫",
      "Kwun Tong Line": "觀塘綫",
      "Island Line": "港島綫",
      "Tseung Kwan O Line": "將軍澳綫",
      "South Island Line": "南港島綫",
      "Disneyland Resort Line": "迪士尼綫"
    },
    passes: {
      "Pass1": "東鐵綫 + 屯馬綫",
      "Pass2": "屯門 ↔ 南昌",
      "Pass3": "屯門 ↔ 紅磡",
      "Pass4": "東涌 ↔ 南昌",
      "Pass5": "東涌 ↔ 香港"
    }
  }
};


const lineStations = {
  "Tuen Ma Line": ["103","102","101","100","99","98","97","96","67","90","11","91","92","93","84","64","80","111","53","20","114","115","116","117","118","119","120"],
  "East Rail Line": ["76","75","74","73","72","71","69","68","67","8","65","64","94","2","78"],
  "Tung Chung Line": ["43","54","42","21","53","41","40","39"],
  "Tsuen Wan Line": ["25","24","23","22","21","20","19","18","17","16","6","5","4","3","2","1"],
  "Kwun Tong Line": ["49","48","38","15","14","13","12","11","10","9","8","7","16","6","5","84","85"],
  "Island Line": ["37","36","35","34","33","32","31","30","29","28","27","2","1","26","81","82","83"],
  "Tseung Kwan O Line": ["52","51","50","49","48","32","31","57"],
  "South Island Line": ["2","86","87","88","89"],
  "Disneyland Resort Line": ["54","55"]
 };

const branchedLinePaths = {
  "East Rail Line": [
    ["2","94","64","65","8","67","68","69","71","72","73","74","75","76"],
    ["2","94","64","65","8","67","68","69","71","72","73","74","75","78"]
  ],
  "Tseung Kwan O Line": [
    ["31","32","48","49","50","51","52"],
    ["31","32","48","49","50","57"]
  ]
};

function getLinePaths(line) {
  return branchedLinePaths[line] || [lineStations[line]];
}

const lineColors = {
  "Airport Express": "#00888A",
  "Disneyland Resort Line": "#F173AC",
  "East Rail Line": "#53B7E8",
  "Island Line": "#007DC5",
  "Kwun Tong Line": "#00AB4E",
  "South Island Line": "#BAC429",
  "Tseung Kwan O Line": "#7D499D",
  "Tsuen Wan Line": "#ED1D24",
  "Tuen Ma Line": "#923011",
  "Tung Chung Line": "#F7943E"
};

// Coverage zones (full official station arrays)
const passCoverageIds = {
  "Pass1": [
    // East Rail Line (Sheung Shui ↔ Hung Hom)
    "75","74","73","72","71","69","68","67","8","65","64",
    // Ma On Shan Line (Wu Kai Sha ↔ East Tsim Sha Tsui)
    "103","102","101","100","99","98","97","96","90","11","91","92","93","84","80"
    // Excludes Admiralty (2), Exhibition Centre (94), Racecourse, Lo Wu (76), Lok Ma Chau (78)
  ],
  "Pass2": [
    // Tuen Mun ↔ Nam Cheong
    "120","119","118","117","116","115","114","20","53"
  ],
  "Pass3": [
    // Tuen Mun ↔ Hung Hom
    "120","119","118","117","116","115","114","20","53",
    "111","80","64" // Austin, East Tsim Sha Tsui, Hung Hom
  ],
  "Pass4": [
    // Tung Chung ↔ Nam Cheong
    "43","54","42","21","53"
    // Excludes Disneyland Resort (55)
  ],
  "Pass5": [
    // Tung Chung ↔ Hong Kong
    "43","54","42","21","53","41","40","39","1"
    // Excludes Disneyland Resort (55)
  ]
};

// Boundary stations for connection journeys
const passBoundaryIds = {
  "Pass1": "80", // East Tsim Sha Tsui
  "Pass2": "53", // Nam Cheong
  "Pass3": "64", // Hung Hom
  "Pass4": "53", // Nam Cheong
  "Pass5": "39"   // Hong Kong
};

// Interchange stations for connection journeys
const passInterchangeIds = {
  "Pass1": ["67","11","8","84","64"], // Tai Wai, Diamond Hill, Kowloon Tong, Ho Man Tin, Hung Hom
  "Pass2": ["20"],                    // Mei Foo
  "Pass3": ["20","53"],               // Mei Foo, Nam Cheong
  "Pass4": ["21"],                    // Lai King
  "Pass5": ["21","53"]                // Lai King, Nam Cheong
};

const selectedPasses = new Set(Object.keys(passCoverageIds));
const passColors = {
  "Pass1": "#53B7E8",
  "Pass2": "#923011",
  "Pass3": "#F7943E",
  "Pass4": "#BAC429",
  "Pass5": "#00888A"
};

function setLanguage(lang) {
  const selectedFromLine = document.getElementById("fromLine").value;
  const selectedFromStation = document.getElementById("fromStation").value;
  const selectedToLine = document.getElementById("toLine").value;
  const selectedToStation = document.getElementById("toStation").value;

  document.querySelector("label[for='fromLine']").textContent = translations[lang].fromLine;
  document.querySelector("label[for='fromStation']").textContent = translations[lang].fromStation;
  document.querySelector("label[for='toLine']").textContent = translations[lang].toLine;
  document.querySelector("label[for='toStation']").textContent = translations[lang].toStation;
  document.querySelector("button[onclick='calculateFare()']").textContent = translations[lang].calculate;
  document.getElementById("passToggleLegend").textContent = translations[lang].monthlyPasses;
  document.getElementById("toggleAllPasses").textContent = translations[lang].toggleAll;
  renderPassToggles();

  // Refresh dropdowns when language changes
  populateLineDropdowns();
  document.getElementById("fromLine").value = selectedFromLine;
  document.getElementById("toLine").value = selectedToLine;
  updateStationDropdown("fromLine", "fromStation");
  updateStationDropdown("toLine", "toStation");
  document.getElementById("fromStation").value = selectedFromStation;
  document.getElementById("toStation").value = selectedToStation;
  if (document.getElementById("resultTable").style.display !== "none") {
    calculateFare();
  }
}

function renderPassToggles() {
  const container = document.getElementById("passToggles");
  if (!container) return;
  container.replaceChildren();

  Object.keys(passCoverageIds).forEach(passKey => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pass-toggle";
    button.textContent = translations[currentLang].passes[passKey];
    button.style.setProperty("--pass-color", passColors[passKey]);
    button.setAttribute("aria-pressed", String(selectedPasses.has(passKey)));
    button.classList.toggle("is-selected", selectedPasses.has(passKey));
    button.addEventListener("click", () => {
      if (selectedPasses.has(passKey)) selectedPasses.delete(passKey);
      else selectedPasses.add(passKey);
      renderPassToggles();
      refreshVisibleResults();
    });
    container.append(button);
  });

  const allSelected = selectedPasses.size === Object.keys(passCoverageIds).length;
  const toggleAll = document.getElementById("toggleAllPasses");
  toggleAll.setAttribute("aria-pressed", String(allSelected));
  toggleAll.onclick = () => {
    if (selectedPasses.size === Object.keys(passCoverageIds).length) {
      selectedPasses.clear();
    } else {
      Object.keys(passCoverageIds).forEach(passKey => selectedPasses.add(passKey));
    }
    renderPassToggles();
    refreshVisibleResults();
  };
}

function refreshVisibleResults() {
  if (document.getElementById("resultTable").style.display !== "none") {
    calculateFare();
  }
}

document.getElementById("langToggle").addEventListener("click", () => {
  currentLang = currentLang === "en" ? "zh" : "en";
  setLanguage(currentLang);
  document.getElementById("langToggle").textContent = currentLang === "en" ? "🌐" : "🌐";
});

function populateLineDropdowns() {
  const fromLineSelect = document.getElementById("fromLine");
  const toLineSelect   = document.getElementById("toLine");
  fromLineSelect.innerHTML = "";
  toLineSelect.innerHTML = "";

  Object.keys(lineStations).forEach(line => {
    const displayName = translations[currentLang].lines[line];
    fromLineSelect.add(new Option(displayName, line));
    toLineSelect.add(new Option(displayName, line));
  });
}

function updateStationDropdown(lineSelectId, stationSelectId) {
  const line = document.getElementById(lineSelectId).value;
  const stationSelect = document.getElementById(stationSelectId);

  stationSelect.innerHTML = "";

  lineStations[line].slice().reverse().forEach(stationId => {
    const station = stations.find(st => st.id === stationId);
    const stationName = currentLang === "en" ? station?.en : station?.zh;
    stationSelect.add(new Option(stationName, stationId));
  });
}

// Load stations
async function loadStations() {
  console.log("[loadStations] Fetching station list...");
  const response = await fetch(stationURL);
  const text = await response.text();
  console.log("[loadStations] Station CSV length:", text.length);

  const rows = text.trim().split("\n").map(r => r.split(","));
  console.log("[loadStations] Parsed rows:", rows.length);

  const lines = {};
  rows.slice(1).forEach(r => {
    const line = r[0].replace(/"/g, "");
    const code = r[2].replace(/"/g, "");
    const id   = r[3].replace(/"/g, "");
    const enName = r[5].replace(/"/g, "");
    const zhName = r[4].replace(/"/g, "");
    const seq  = parseFloat(r[6]);

    if (!lines[line]) lines[line] = [];
    if (!lines[line].some(st => st.id === id)) {
      const stationObj = { id, code, en: enName, zh: zhName, seq };
      lines[line].push(stationObj);
      stations.push(stationObj);
    }
  });

  console.log("[loadStations] Lines built:", Object.keys(lines));

  const fromSelect = document.getElementById("fromStation");
  const toSelect   = document.getElementById("toStation");

  Object.keys(lines).forEach(line => {
    const header = new Option(line, "");
    header.disabled = true;
    fromSelect.add(header);
    toSelect.add(header.cloneNode(true));

    lines[line].sort((a, b) => b.seq - a.seq);

    lines[line].forEach(st => {
      const displayName = currentLang === "en" ? st.en : st.zh;
      fromSelect.add(new Option(displayName, st.id));
      toSelect.add(new Option(displayName, st.id));
    });
  });

  console.log("[loadStations] Dropdowns populated.");
}

// Load fares
async function loadFares() {
  console.log("[loadFares] Fetching fare table...");
  const response = await fetch(fareURL);
  const text = await response.text();
  console.log("[loadFares] Fare CSV length:", text.length);

  const rows = text.trim().split("\n").map(r => r.split(","));
  console.log("[loadFares] Parsed rows:", rows.length);

  fareTable = {};
  rows.slice(1).forEach(r => {
    const fromId = r[1].replace(/"/g, "");
    const toId   = r[3].replace(/"/g, "");
    const octAdult = parseFloat(r[4]);

    if (!isNaN(octAdult)) {
      const key = `${fromId}-${toId}`;
      fareTable[key] = octAdult;
    }
  });

  console.log("[loadFares] Fare table entries:", Object.keys(fareTable).length);
}

// Main calculation
function calculateFare() {
  const fromId = document.getElementById("fromStation").value;
  const toId   = document.getElementById("toStation").value;
  const fare   = lookupFare(fromId, toId);

  console.log("[calculateFare] Inputs:", { fromId, toId, fare });

  if (fare > 0) {
    const originalFare = fare;

    renderFareResults(originalFare, getPassScenarios(fromId, toId, originalFare));
    document.getElementById("resultTable").style.display = "table";
  } else {
    console.warn("[calculateFare] No fare found for stations:", { fromId, toId });
    renderFareResults(null, []);
    document.getElementById("resultTable").style.display = "table";
  }
}

function renderFareResults(originalFare, results) {
  const table = document.getElementById("resultTable");
  const thead = table.tHead;
  const tbody = table.tBodies[0];
  thead.replaceChildren();
  tbody.replaceChildren();

  const columns = groupReentryColumns(results);
  const passGroups = groupPassResults(results);
  const topHeader = document.createElement("tr");
  const passAxis = document.createElement("th");
  passAxis.scope = "col";
  passAxis.rowSpan = 2;
  passAxis.className = "matrix-axis-label";
  passAxis.textContent = translations[currentLang].passDiscountAxis;
  topHeader.append(passAxis);
  const reentryAxis = document.createElement("th");
  reentryAxis.scope = "colgroup";
  reentryAxis.colSpan = columns.length;
  reentryAxis.className = "matrix-axis-label";
  reentryAxis.textContent = translations[currentLang].reentryDiscountAxis;
  topHeader.append(reentryAxis);
  thead.append(topHeader);

  const columnHeader = document.createElement("tr");
  columns.forEach(column => {
    const header = document.createElement("th");
    header.scope = "col";
    header.className = "matrix-column-header";
    const renderOption = option => {
      const label = document.createElement("div");
      label.className = "matrix-option-label";
      if (option.routes?.length) {
        renderRouteHeader(label, option);
      } else {
        label.textContent = option.label;
      }
      header.append(label);
    };
    if (column.options.length > 1 && column.optionIds.every(id => id !== "noExit")) {
      const group = document.createElement("details");
      group.className = "matrix-reentry-group";
      const summary = document.createElement("summary");
      summary.textContent = translations[currentLang].reentryStationGroup(column.options.length);
      group.append(summary);
      const options = document.createElement("div");
      options.className = "matrix-reentry-group-options";
      column.options.forEach(option => {
        const label = document.createElement("div");
        label.className = "matrix-option-label";
        renderRouteHeader(label, option, getStationName(option.id));
        options.append(label);
      });
      group.append(options);
      header.append(group);
    } else {
      column.options.forEach(renderOption);
    }
    columnHeader.append(header);
  });
  thead.append(columnHeader);

  const standardRow = document.createElement("tr");
  const standardLabel = document.createElement("th");
  standardLabel.scope = "row";
  standardLabel.className = "matrix-standard-label";
  standardLabel.textContent = translations[currentLang].originalFare;
  standardRow.append(standardLabel);
  const standardCell = document.createElement("td");
  standardCell.colSpan = columns.length;
  standardCell.textContent = formatFare(originalFare);
  standardRow.append(standardCell);
  tbody.append(standardRow);

  if (originalFare !== null) {
    if (passGroups.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = columns.length;
      emptyCell.className = "matrix-empty-state";
      emptyCell.textContent = translations[currentLang].noPassesSelected;
      emptyRow.append(document.createElement("th"), emptyCell);
      tbody.append(emptyRow);
    }

    passGroups.forEach(group => {
      const row = document.createElement("tr");
      const passLabel = document.createElement("th");
      passLabel.scope = "row";
      passLabel.className = "matrix-pass-label";
      group.entries.forEach((entry, index) => {
        if (index > 0) {
          passLabel.append(document.createTextNode(currentLang === "en" ? " / " : "／"));
        }
        const label = document.createElement("span");
        label.textContent = translations[currentLang].passes[entry.passKey];
        label.style.setProperty("--pass-color", passColors[entry.passKey]);
        passLabel.append(label);
      });
      row.append(passLabel);

      const fares = columns
        .map(column => group.entries[0].results[column.optionIds[0]]?.fare)
        .filter(fare => fare !== undefined);
      const cheapestFare = fares.length ? Math.min(...fares) : null;
      columns.forEach(column => {
        const cell = document.createElement("td");
        cell.className = "matrix-fare-cell";
        const result = group.entries[0].results[column.optionIds[0]] || null;
        if (result) {
          if (result.fare === cheapestFare) {
            cell.classList.add("is-cheapest");
            cell.style.setProperty("--pass-color", passColors[group.entries[0].passKey]);
          }
          cell.append(document.createTextNode(formatFare(result.fare)));
          const saving = document.createElement("span");
          saving.className = "fare-saving";
          saving.textContent = translations[currentLang].saving(originalFare - result.fare);

          const optionResults = [];
          group.entries.forEach(entry => {
            column.optionIds.forEach(optionId => {
              const optionResult = entry.results[optionId];
              if (optionResult) optionResults.push(optionResult);
            });
          });
          const breakdown = createFareBreakdownText(optionResults, column.optionIds.length > 1);
          if (breakdown) {
            saving.append(createFareBreakdown(breakdown));
          }
          cell.append(saving);
        } else if (passGroups.length === 1 && !results.some(entry =>
          Object.values(entry.results).some(Boolean)
        )) {
          cell.textContent = translations[currentLang].noDiscountResults;
        } else {
          cell.textContent = "—";
        }
        row.append(cell);
      });
      tbody.append(row);
    });
  }

  closeRouteDiagram();
}

function renderRouteHeader(header, result, visibleLabel = result.label) {
  header.replaceChildren();
  if (!result.routes?.length) {
    header.textContent = result.label;
    return;
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "route-header-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "routeTable");
  toggle.setAttribute("aria-label", `${translations[currentLang].showRoute}: ${result.label}`);

  const label = document.createElement("span");
  label.textContent = visibleLabel;
  const icon = document.createElement("span");
  icon.className = "route-header-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "⌄";
  toggle.append(label, icon);
  toggle.addEventListener("click", () => toggleRouteDiagram(toggle, result));
  header.append(toggle);
}

function toggleRouteDiagram(button, result) {
  const routeTable = document.getElementById("routeTable");
  if (!routeTable.hidden && activeRouteButton === button && activeRouteOption === result) {
    closeRouteDiagram();
    return;
  }

  if (activeRouteButton) {
    activeRouteButton.setAttribute("aria-expanded", "false");
  }
  activeRouteButton = button;
  activeRouteOption = result;
  activeRouteButton.setAttribute("aria-expanded", "true");
  document.getElementById("routeTableTitle").textContent =
    translations[currentLang].routeFor(result.label);
  renderRouteChoices(result, 0);
  routeTable.hidden = false;
}

function renderRouteChoices(result, selectedIndex) {
  const choices = document.getElementById("routeChoices");
  choices.replaceChildren();
  choices.setAttribute("aria-label", translations[currentLang].routeSuggestionLabel);
  result.routes.forEach((routeOption, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "route-choice";
    button.textContent = `${routeOption.label} (${routeOption.detail})`;
    button.setAttribute("aria-pressed", String(index === selectedIndex));
    if (index === selectedIndex) button.classList.add("is-selected");
    button.addEventListener("click", () => renderRouteChoices(result, index));
    choices.append(button);
  });
  renderRouteDiagram(result.routes[selectedIndex]);
}

function closeRouteDiagram() {
  document.getElementById("routeTable").hidden = true;
  activeRouteOption = null;
  if (activeRouteButton) {
    activeRouteButton.setAttribute("aria-expanded", "false");
    activeRouteButton = null;
  }
}

function renderRouteDiagram(route) {
  const container = document.getElementById("routeDiagram");
  container.replaceChildren();

  const diagram = document.createElement("div");
  diagram.className = "route-line";
  route.stations.forEach((station, index) => {
    const stop = document.createElement("div");
    stop.className = "route-stop";
    if (station.isInterchange) stop.classList.add("is-interchange");

    const name = document.createElement("span");
    name.className = "route-stop-name";
    name.textContent = station.name;
    stop.append(name);

    const marker = document.createElement("span");
    marker.className = "route-stop-marker";
    marker.setAttribute("aria-hidden", "true");
    stop.append(marker);

    if (station.isInterchange) {
      const interchangeLabel = document.createElement("span");
      interchangeLabel.className = "route-stop-note";
      interchangeLabel.textContent = translations[currentLang].interchange;
      stop.append(interchangeLabel);
    }
    if (station.isReentry) {
      const reentryLabel = document.createElement("span");
      reentryLabel.className = "route-stop-note";
      reentryLabel.textContent = translations[currentLang].exitReenter;
      stop.append(reentryLabel);
    }
    diagram.append(stop);

    if (index < route.segments.length) {
      const segment = document.createElement("div");
      segment.className = "route-segment";
      segment.style.setProperty("--route-color", lineColors[route.segments[index].line] || "#94989A");

      const track = document.createElement("span");
      track.className = "route-segment-track";
      track.setAttribute("aria-hidden", "true");
      const stationCount = document.createElement("span");
      stationCount.className = "route-segment-count";
      stationCount.textContent = translations[currentLang].stationCount(
        route.segments[index].stationCount
      );
      const lineName = document.createElement("span");
      lineName.className = "route-segment-name";
      lineName.textContent = translations[currentLang].lines[route.segments[index].line]
        || route.segments[index].line;
      segment.append(stationCount, track, lineName);
      diagram.append(segment);
    }
  });
  container.append(diagram);
}

function createFareBreakdownText(results, canGroupReentries) {
  const breakdowns = [...new Set(results.map(result => result.breakdown).filter(Boolean))];
  if (!canGroupReentries) return breakdowns.join("\n\n") || "";

  const details = results.map(result => result.breakdownDetails).filter(Boolean);
  if (details.length < 2) return breakdowns.join("\n\n") || "";

  const signature = detail => JSON.stringify([
    detail.originName,
    detail.destinationName,
    detail.firstLegFormula,
    detail.secondLegFormula,
    detail.fare
  ]);
  if (new Set(details.map(signature)).size !== 1) {
    return breakdowns.join("\n\n") || "";
  }

  const grouped = details[0];
  const stationNames = [...new Set(details.map(detail => detail.stationName))];
  if (stationNames.length < 2) return breakdowns.join("\n\n") || "";

  return translations[currentLang].reentryGroupBreakdown(
    stationNames,
    grouped.originName,
    grouped.destinationName,
    grouped.firstLegFormula,
    grouped.secondLegFormula,
    grouped.fare
  );
}

function createFareBreakdown(text) {
  const wrapper = document.createElement("span");
  wrapper.className = "fare-breakdown";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "fare-breakdown-toggle";
  toggle.textContent = "i";
  toggle.setAttribute("aria-label", translations[currentLang].breakdownLabel);
  toggle.setAttribute("aria-expanded", "false");

  const tooltip = document.createElement("span");
  tooltip.className = "fare-breakdown-tooltip";
  tooltip.id = `fare-breakdown-${fareBreakdownId += 1}`;
  tooltip.setAttribute("role", "tooltip");
  tooltip.textContent = text;
  toggle.setAttribute("aria-controls", tooltip.id);
  toggle.setAttribute("aria-describedby", tooltip.id);

  toggle.addEventListener("click", () => {
    const isOpen = wrapper.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  wrapper.append(toggle, tooltip);
  return wrapper;
}

function formatFare(fare) {
  if (fare === null) return "-";
  return fare < 0
    ? `-$${Math.abs(fare).toFixed(1)}`
    : `$${fare.toFixed(1)}`;
}

function getPassScenarios(fromId, toId, originalFare) {
  const routes = findStationRoutes(fromId, toId);
  return Object.keys(passCoverageIds)
    .filter(passKey => selectedPasses.has(passKey))
    .map(passKey => {
    const covered = isCoveredByPass(fromId, toId, passKey);
    const connection = covered
      ? null
      : findCheapestConnectionCalculation(passKey, fromId, toId);
    const passFare = covered ? 0 : connection?.fare ?? originalFare;
    const results = {};
    if (passFare < originalFare) {
      results.noExit = {
        label: translations[currentLang].noReentry,
        fare: passFare,
        breakdown: covered
          ? translations[currentLang].passCovered(passFare)
          : connection?.formula,
        routes: createRouteOptions(routes, null)
      };
    }

    getReentryScenarios(fromId, toId, passKey, routes).forEach(result => {
      results[result.stationId] = {
        ...result,
        label: result.label
      };
    });
    return { passKey, results, routes: createRouteOptions(routes, null) };
    });
}

function groupPassResults(passResults) {
  const resultIds = [...new Set(
    passResults.flatMap(entry => Object.keys(entry.results))
  )];
  const discountedPasses = passResults.filter(entry =>
    Object.keys(entry.results).length > 0
  );
  const entries = discountedPasses.length ? discountedPasses : passResults;
  const groups = new Map();

  entries.forEach(entry => {
    const signature = JSON.stringify(resultIds.map(id => entry.results[id]?.fare ?? null));
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(entry);
  });
  return [...groups.values()].map(entries => ({ entries }));
}

function groupReentryColumns(passResults) {
  const optionIds = [
    "noExit",
    ...new Set(passResults.flatMap(entry =>
      Object.keys(entry.results).filter(id => id !== "noExit")
    ))
  ];
  const passGroups = groupPassResults(passResults);
  const options = optionIds.map(id => {
    if (id === "noExit") {
      return {
        id,
        label: translations[currentLang].noReentry,
        routes: passResults.find(entry => entry.routes)?.routes || []
      };
    }

    const result = passResults.find(entry => entry.results[id])?.results[id];
    return {
      id,
      label: result?.label || id,
      routes: result?.routes || []
    };
  });
  const grouped = new Map();

  options.forEach(option => {
    const signature = JSON.stringify(passGroups.map(group =>
      group.entries[0].results[option.id]?.fare ?? null
    ));
    const key = option.id === "noExit" ? `noExit:${signature}` : `reentry:${signature}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(option);
  });

  return [...grouped.values()].map(options => ({
    options,
    optionIds: options.map(option => option.id)
  }));
}

function getReentryScenarios(fromId, toId, passOption, routes = findStationRoutes(fromId, toId)) {
  if (!isOutsidePassCoverage(fromId, toId, passOption)) return [];

  if (!routes.fewestInterchanges && !routes.fewestStations) return [];
  const candidateRoutes = [
    { type: "fewestInterchanges", route: routes.fewestInterchanges },
    { type: "fewestStations", route: routes.fewestStations }
  ].filter(option => option.route);

  const candidates = passCoverageIds[passOption];
  return candidates
    .filter((stationId, index) =>
      stationId !== fromId &&
      stationId !== toId &&
      candidateRoutes.some(option => option.route.includes(stationId)) &&
      candidates.indexOf(stationId) === index
    )
    .map(stationId => {
      const firstLeg = calculateReentryFirstLegFare(passOption, fromId, stationId);
      const secondLeg = calculateReentrySecondLegFare(passOption, stationId, toId);
      if (firstLeg.fare <= 0 || secondLeg.fare <= 0) return null;

      const fare = firstLeg.fare + secondLeg.fare;
      const originalFare = lookupFare(fromId, toId);
      if (fare >= originalFare) return null;

      const station = stations.find(item => item.id === stationId);
      const name = currentLang === "en" ? station?.en : station?.zh;
      const originName = getStationName(fromId);
      const destinationName = getStationName(toId);
      const stationRoutes = candidateRoutes
        .filter(option => option.route.includes(stationId))
        .map(option => createRouteInfo(option.route, stationId, option.type))
        .filter(Boolean);
      return {
        stationId,
        label: translations[currentLang].reenterAt(name || stationId),
        fare,
        routes: stationRoutes,
        breakdownDetails: {
          stationName: name || stationId,
          originName,
          destinationName,
          firstLegFormula: firstLeg.formula,
          secondLegFormula: secondLeg.formula,
          fare
        },
        breakdown: [
          `${originName} → ${name}: ${firstLeg.formula}`,
          `${name} → ${destinationName}: ${secondLeg.formula}`,
          `${translations[currentLang].total}: ${formatFare(fare)}`
        ].join("\n")
      };
    })
    .filter(result => result !== null);
}

function createRouteOptions(routes, reentryStation) {
  if (!routes) return [];
  return [
    ["fewestInterchanges", routes.fewestInterchanges],
    ["fewestStations", routes.fewestStations]
  ]
    .filter(([type, route], index, options) =>
      route && options.findIndex(([, otherRoute]) =>
        JSON.stringify(otherRoute) === JSON.stringify(route)
      ) === index
    )
    .map(([type, route]) => createRouteInfo(route, reentryStation, type))
    .filter(Boolean);
}

function createRouteInfo(route, reentryStation, type) {
  if (!route || route.length < 2) return null;

  const edgeLines = route.slice(0, -1).map((stationId, index) =>
    getLineForSegment(stationId, route[index + 1])
  );
  if (edgeLines.some(line => !line)) return null;

  const landmarkIndexes = new Set([0, route.length - 1]);
  for (let index = 1; index < route.length - 1; index += 1) {
    if (edgeLines[index - 1] !== edgeLines[index] || route[index] === reentryStation) {
      landmarkIndexes.add(index);
    }
  }

  const indexes = [...landmarkIndexes].sort((a, b) => a - b);
  const transferCount = edgeLines.slice(1).reduce((count, line, index) =>
    count + (line === edgeLines[index] ? 0 : 1), 0);
  const details = {
    fewestInterchanges: translations[currentLang].fewestInterchanges,
    fewestStations: translations[currentLang].fewestStations
  };
  const detail = type === "fewestStations"
    ? translations[currentLang].stationCountLabel(route.length - 1)
    : translations[currentLang].interchangeCount(transferCount);
  return {
    type,
    label: details[type],
    detail,
    transferCount,
    stationCount: route.length - 1,
    stations: indexes.map(index => ({
      id: route[index],
      name: getStationName(route[index]),
      isInterchange: index > 0 && index < route.length - 1 &&
        edgeLines[index - 1] !== edgeLines[index],
      isReentry: route[index] === reentryStation
    })),
    segments: indexes.slice(0, -1).map((startIndex, index) => ({
      line: edgeLines[startIndex],
      stationCount: indexes[index + 1] - startIndex
    }))
  };
}

function getLineForSegment(fromId, toId) {
  return Object.entries(lineStations).find(([line]) =>
    getLinePaths(line).some(stationIds => {
      const index = stationIds.indexOf(fromId);
      return index >= 0 &&
        (stationIds[index - 1] === toId || stationIds[index + 1] === toId);
    })
  )?.[0] || null;
}

function calculateReentryFirstLegFare(passOption, fromId, reentryStation) {
  const fare = lookupFare(fromId, reentryStation);
  if (reentryStation === getBoundaryStation(passOption)) {
    return { fare, formula: `${formatFare(fare)} (${translations[currentLang].fullFare})` };
  }

  return findCheapestConnectionCalculation(passOption, fromId, reentryStation)
    || { fare, formula: `${formatFare(fare)} (${translations[currentLang].fullFare})` };
}

function calculateReentrySecondLegFare(passOption, reentryStation, toId) {
  const candidates = [
    getBoundaryStation(passOption),
    ...(passInterchangeIds[passOption] || [])
  ];

  let cheapest = null;
  for (const candidate of candidates) {
    const fare = lookupFare(candidate, toId);
    if (fare <= 0) continue;

    const discounted = candidate !== reentryStation && candidate !== toId;
    const effectiveFare = discounted ? applyDiscount(fare) : fare;
    if (!cheapest || effectiveFare < cheapest.fare) {
      cheapest = {
        fare: effectiveFare,
        formula: discounted
          ? `${formatFare(fare)} × 75% = ${formatFare(effectiveFare)} (${translations[currentLang].viaStation(getStationName(candidate))})`
          : `${formatFare(fare)} (${translations[currentLang].fullFare})`
      };
    }
  }

  return cheapest || { fare: 0, formula: "" };
}

function findCheapestConnectionCalculation(passOption, fromId, toId) {
  const coverage = passCoverageIds[passOption];
  if (!coverage) return null;

  const fromInside = coverage.includes(fromId);
  const toInside = coverage.includes(toId);
  if (!((fromInside && !toInside) || (!fromInside && toInside))) return null;

  const boundary = getBoundaryStation(passOption);
  if (fromId === boundary || toId === boundary) return null;

  const outsideStation = fromInside ? toId : fromId;
  const candidates = [boundary, ...(passInterchangeIds[passOption] || [])];
  let cheapest = null;

  for (const candidate of candidates) {
    const fare = lookupFare(candidate, outsideStation);
    if (fare <= 0) continue;

    const discounted = candidate !== fromId && candidate !== toId;
    const effectiveFare = discounted ? applyDiscount(fare) : fare;
    if (!cheapest || effectiveFare < cheapest.fare) {
      cheapest = {
        fare: effectiveFare,
        formula: discounted
          ? `${formatFare(fare)} × 75% = ${formatFare(effectiveFare)} (${translations[currentLang].viaStation(getStationName(candidate))})`
          : `${formatFare(fare)} (${translations[currentLang].fullFare})`
      };
    }
  }

  return cheapest;
}

function getStationName(stationId) {
  const station = stations.find(item => item.id === stationId);
  return currentLang === "en" ? station?.en || stationId : station?.zh || stationId;
}

function findStationRoutes(fromId, toId) {
  const graph = new Map();
  Object.keys(lineStations).forEach(line => {
    getLinePaths(line).forEach(stationIds => {
      for (let index = 1; index < stationIds.length; index += 1) {
        const previous = stationIds[index - 1];
        const current = stationIds[index];
        if (!graph.has(previous)) graph.set(previous, []);
        if (!graph.has(current)) graph.set(current, []);
        graph.get(previous).push({ stationId: current, line });
        graph.get(current).push({ stationId: previous, line });
      }
    });
  });

  function search(compareCosts) {
    const queue = [{
      stationId: fromId,
      line: null,
      stations: [fromId],
      transfers: 0,
      stops: 0
    }];
    const bestCosts = new Map();
    while (queue.length) {
      queue.sort((a, b) => compareCosts(a, b));
      const current = queue.shift();
      if (current.stationId === toId) return current.stations;

      for (const edge of graph.get(current.stationId) || []) {
        if (current.stations.includes(edge.stationId)) continue;
        const next = {
          stationId: edge.stationId,
          line: edge.line,
          stations: [...current.stations, edge.stationId],
          transfers: current.transfers + (current.line && current.line !== edge.line ? 1 : 0),
          stops: current.stops + 1
        };
        const stateKey = `${next.stationId}:${next.line}`;
        const known = bestCosts.get(stateKey);
        if (known && compareCosts(next, known) >= 0) continue;
        bestCosts.set(stateKey, next);
        queue.push(next);
      }
    }
    return null;
  }

  return {
    fewestInterchanges: search((a, b) =>
      a.transfers - b.transfers || a.stops - b.stops
    ),
    fewestStations: search((a, b) =>
      a.stops - b.stops || a.transfers - b.transfers
    )
  };
}

function findStationRoute(fromId, toId) {
  return findStationRoutes(fromId, toId).fewestInterchanges;
}

function isOutsidePassCoverage(fromId, toId, passOption) {
  const coverage = passCoverageIds[passOption];
  return coverage && !coverage.includes(fromId) && !coverage.includes(toId);
}

// Lookup fare
function lookupFare(from, to) {
  return fareTable[`${from}-${to}`] || fareTable[`${to}-${from}`] || 0;
}

// Apply discount with rounding rule
function applyDiscount(fare) {
  const discountedTenths = Math.round(fare * 10) * 3;
  const roundedTenths = Math.floor(discountedTenths / 4)
    + (discountedTenths % 4 > 2 ? 1 : 0);
  return roundedTenths / 10;
}

// Check if journey fully covered
function isCoveredByPass(from, to, passOption) {
  const coverage = passCoverageIds[passOption];
  return coverage && coverage.includes(from) && coverage.includes(to);
}

// Get boundary station
function getBoundaryStation(passOption) {
  return passBoundaryIds[passOption] || null;
}

window.onload = async () => {
  await loadStations();
  await loadFares();

  populateLineDropdowns();
  updateStationDropdown("fromLine", "fromStation");
  updateStationDropdown("toLine", "toStation");

  // Initialize default language AFTER dropdowns exist
  setLanguage(currentLang);

  document.getElementById("fromLine").addEventListener("change", () => {
    updateStationDropdown("fromLine", "fromStation");
  });
  document.getElementById("toLine").addEventListener("change", () => {
    updateStationDropdown("toLine", "toStation");
  });
};
