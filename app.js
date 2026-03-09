// Live data endpoints
const stationURL = "https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv";
const fareURL = "https://opendata.mtr.com.hk/data/mtrfares.csv";

let stations = [];
let fareTable = {};

// Coverage zones (simplified — you’ll expand with full station arrays)
const passCoverage = {
  "Pass1": ["Sheung Shui", "Wu Kai Sha", "East Tsim Sha Tsui"], // East Rail + Tuen Ma section
  "Pass2": ["Tuen Mun", "Nam Cheong"],                         // Tuen Mun ↔ Nam Cheong
  "Pass3": ["Tuen Mun", "Hung Hom"],                           // Tuen Mun ↔ Hung Hom
  "Pass4": ["Tung Chung", "Nam Cheong"],                       // Tung Chung ↔ Nam Cheong
  "Pass5": ["Tung Chung", "Hong Kong"]                         // Tung Chung ↔ Hong Kong
};

// Boundary stations for connection journeys
const passBoundary = {
  "Pass1": "East Tsim Sha Tsui", // boundary for East Rail/Tuen Ma
  "Pass2": "Nam Cheong",
  "Pass3": "Hung Hom",
  "Pass4": "Nam Cheong",
  "Pass5": "Hong Kong"
};

// Parse CSV text into rows
function parseCSV(text) {
  return text.trim().split("\n").map(r => r.split(","));
}

// Load stations
async function loadStations() {
  const response = await fetch(stationURL);
  const text = await response.text();
  const rows = parseCSV(text);

  // Column 3 = English station name
  stations = rows.slice(1).map(r => r[2]).filter(Boolean);

  const fromSelect = document.getElementById("fromStation");
  const toSelect = document.getElementById("toStation");
  stations.forEach(st => {
    fromSelect.add(new Option(st, st));
    toSelect.add(new Option(st, st));
  });
}

// Load fares
async function loadFares() {
  const response = await fetch(fareURL);
  const text = await response.text();
  const rows = parseCSV(text);

  // Schema: FromStation, ToStation, Fare
  rows.slice(1).forEach(r => {
    const from = r[0], to = r[1], fare = parseFloat(r[2]);
    if (from && to && !isNaN(fare)) {
      fareTable[`${from}-${to}`] = fare;
    }
  });
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

  if (remainder > 0.05) {
    discounted = (Math.floor(tenth) + 1) / 10; // round up
  } else {
    discounted = Math.floor(tenth) / 10; // round down
  }
  return discounted;
}

// Check if journey fully covered
function isCoveredByPass(from, to, passOption) {
  const coverage = passCoverage[passOption];
  return coverage && coverage.includes(from) && coverage.includes(to);
}

// Get boundary station
function getBoundaryStation(passOption) {
  return passBoundary[passOption] || null;
}

// Main calculation
function calculateFare() {
  const from = document.getElementById("fromStation").value;
  const to = document.getElementById("toStation").value;
  const pass = document.getElementById("passOption").value.split(":")[0]; // "Pass2"

  const original = lookupFare(from, to);
  let passFare = original;

  if (pass !== "No Pass") {
    if (isCoveredByPass(from, to, pass)) {
      passFare = 0; // fully covered
    } else {
      const boundary = getBoundaryStation(pass);
      if (boundary) {
        const connectionFare = lookupFare(boundary, to);
        passFare = applyDiscount(connectionFare);
      }
    }
  }

  const diff = original - passFare;

  document.getElementById("passFare").innerText = `$${passFare.toFixed(1)}`;
  document.getElementById("originalFare").innerText = `$${original.toFixed(1)}`;
  document.getElementById("difference").innerText = `$${diff.toFixed(1)}`;
  document.getElementById("resultTable").style.display = "table";
}

// Initialize
window.onload = async () => {
  await loadStations();
  await loadFares();
};
