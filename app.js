// Live data endpoints
const stationURL = `https://mtr-proxy.vineroz.workers.dev?url=https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv`;
const fareURL = `https://mtr-proxy.vineroz.workers.dev?url=https://opendata.mtr.com.hk/data/mtr_lines_fares.csv`;

let stations = [];
let fareTable = {};

let currentLang = "zh"; // default language

const translations = {
  en: {
    fromLine: "From Line",
    fromStation: "From Station",
    toLine: "To Line",
    toStation: "To Station",
    monthlyPass: "Monthly Pass",
    calculate: "Calculate",
    fareWithPass: "Fare with Pass:",
    originalFare: "Original Fare:",
    difference: "Difference:",
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
      "Pass1": "East Rail + Ma On Shan",
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
    monthlyPass: "全月通",
    calculate: "計算",
    fareWithPass: "使用全月通票票價：",
    originalFare: "原價：",
    difference: "差額：",
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

function setLanguage(lang) {
  document.querySelector("label[for='fromLine']").textContent = translations[lang].fromLine;
  document.querySelector("label[for='fromStation']").textContent = translations[lang].fromStation;
  document.querySelector("label[for='toLine']").textContent = translations[lang].toLine;
  document.querySelector("label[for='toStation']").textContent = translations[lang].toStation;
  document.querySelector("label[for='monthlyPass']").textContent = translations[lang].monthlyPass;
  document.querySelector("button[onclick='calculateFare()']").textContent = translations[lang].calculate;
  document.querySelector("#resultTable tr:first-child td:first-child").textContent = translations[lang].fareWithPass;
  document.querySelector("#resultTable tr:nth-child(2) td:first-child").textContent = translations[lang].originalFare;
  document.querySelector("#resultTable tr:nth-child(3) td:first-child").textContent = translations[lang].difference;

  // Refresh dropdowns and passes when language changes
  updateStationDropdown("fromLine", "fromStation");
  updateStationDropdown("toLine", "toStation");
  populatePasses();
}

document.getElementById("langToggle").addEventListener("click", () => {
  currentLang = currentLang === "en" ? "zh" : "en";
  setLanguage(currentLang);
  document.getElementById("langToggle").textContent = currentLang === "en" ? "🌐" : "🌐";
});

function populateLineDropdowns() {
  const fromLineSelect = document.getElementById("fromLine");
  const toLineSelect   = document.getElementById("toLine");

  Object.keys(lineStations).forEach(line => {
    const displayName = translations[currentLang].lines[line];
    fromLineSelect.add(new Option(displayName, line));
    toLineSelect.add(new Option(displayName, line));
  });
}

function populatePasses() {
  const passSelect = document.getElementById("monthlyPass");
  passSelect.innerHTML = "";

  Object.keys(passCoverageIds).forEach(passKey => {
    const displayName = translations[currentLang].passes[passKey];
    passSelect.add(new Option(displayName, passKey));
  });
}

function updateStationDropdown(lineSelectId, stationSelectId) {
  const line = document.getElementById(lineSelectId).value;
  const stationSelect = document.getElementById(stationSelectId);

  stationSelect.innerHTML = "";

  lineStations[line].forEach(stationId => {
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

    lines[line].sort((a, b) => a.seq - b.seq);

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
  const pass   = document.getElementById("monthlyPass").value;
  const key    = `${fromId}-${toId}`;
  const fare   = fareTable[key];

  console.log("[calculateFare] Inputs:", { fromId, toId, pass, key, fare });

  if (fare !== undefined) {
    const originalFare = fare;
    const fromStation = stations.find(st => st.id === fromId);
    const toStation   = stations.find(st => st.id === toId);
    const fromName = currentLang === "en" ? fromStation?.en : fromStation?.zh;
    const toName   = currentLang === "en" ? toStation?.en : toStation?.zh;

    console.log("[calculateFare] Station names:", { fromName, toName });

    let passFare = originalFare;
    if (pass && pass !== "none") {
      const passKey = pass.split(":")[0].trim();
      console.log("[calculateFare] Pass selected:", passKey);

      if (isCoveredByPass(fromId, toId, passKey)) {
        console.log("[calculateFare] Journey fully covered by pass.");
        passFare = 0;
      } else {
        const connectionFare = calculateConnectionFare(passKey, fromId, toId);
        if (connectionFare !== null) {
          console.log("[calculateFare] Journey is a boundary connection.");
          passFare = connectionFare;
        } else {
          console.log("[calculateFare] Journey outside pass zone.");
        }
      }
    }

    const difference = originalFare - passFare;
    console.log("[calculateFare] Results:", { originalFare, passFare, difference });

    document.getElementById("passFare").textContent = `$${passFare.toFixed(1)}`;
    document.getElementById("originalFare").textContent = `$${originalFare.toFixed(1)}`;
    document.getElementById("difference").textContent = `$${difference.toFixed(1)}`;
    document.getElementById("resultTable").style.display = "table";
  } else {
    console.warn("[calculateFare] No fare found for key:", key);
    document.getElementById("passFare").textContent = "-";
    document.getElementById("originalFare").textContent = "-";
    document.getElementById("difference").textContent = "-";
    document.getElementById("resultTable").style.display = "table";
  }
}

// Calculate connection fare for inside ↔ outside journeys
function calculateConnectionFare(passOption, fromId, toId) {
  const coverage = passCoverageIds[passOption];
  if (!coverage) return null;

  const fromInside = coverage.includes(fromId);
  const toInside   = coverage.includes(toId);

  // Only valid if exactly one station is inside and the other outside
  if (!((fromInside && !toInside) || (!fromInside && toInside))) {
    return null;
  }

  // Collect boundary + interchange stations
  const boundary = getBoundaryStation(passOption);
  
  // Guard: boundary ↔ outside direct → no discount
  if (fromId === boundary || toId === boundary) {
    return null;
  }

  const interchanges = passInterchangeIds[passOption] || [];
  const candidates = [boundary, ...interchanges];

  // Determine which is the outside station
  const outsideStation = fromInside ? toId : fromId;

  // Compute fares from each candidate → outside station
  let cheapest = Infinity;
  for (const candidate of candidates) {
    const fare = lookupFare(candidate, outsideStation);
    if (fare > 0 && fare < cheapest) {
      cheapest = fare;
    }
  }

  // If no valid fare found, return null
  if (cheapest === Infinity) return null;

  // Apply 25% discount with rounding
  return applyDiscount(cheapest);
}

// Lookup fare
function lookupFare(from, to) {
  return fareTable[`${from}-${to}`] || fareTable[`${to}-${from}`] || 0;
}

// Apply discount with rounding rule
function applyDiscount(fare) {
  let discounted = fare * 0.75;
  let tenth = discounted * 10;
  let remainder = tenth - Math.floor(tenth);

  if (remainder > 0.5) {
    discounted = (Math.floor(tenth) + 1) / 10; // round up
  } else {
    discounted = Math.floor(tenth) / 10; // round down
  }
  return discounted;
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
  populatePasses();

  // Initialize default language AFTER dropdowns exist
  setLanguage(currentLang);

  document.getElementById("fromLine").addEventListener("change", () => {
    updateStationDropdown("fromLine", "fromStation");
  });
  document.getElementById("toLine").addEventListener("change", () => {
    updateStationDropdown("toLine", "toStation");
  });
};

