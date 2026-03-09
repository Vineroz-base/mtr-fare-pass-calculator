// Live data endpoints
const stationURL = `https://api.allorigins.win/get?url=${encodeURIComponent("https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv")}`;
const fareURL = `https://api.allorigins.win/get?url=${encodeURIComponent("https://opendata.mtr.com.hk/data/mtrfares.csv")}`;

let stations = [];
let fareTable = {};

// Coverage zones (expand with full station arrays)
const passCoverage = {
  "Pass1": [
    "Sheung Shui","Fanling","Tai Po Market","University","Sha Tin","Tai Wai",
    "Kowloon Tong","Mong Kok East","Hung Hom","East Tsim Sha Tsui",
    "Wu Kai Sha","Diamond Hill","Ho Man Tin"
    // Exclude Admiralty, Exhibition Centre, Racecourse, Lo Wu, Lok Ma Chau
  ],
  "Pass2": [
    "Tuen Mun","Siu Hong","Tin Shui Wai","Long Ping","Yuen Long","Kam Sheung Road",
    "Tsuen Wan West","Mei Foo","Nam Cheong"
  ],
  "Pass3": [
    "Tuen Mun","Siu Hong","Tin Shui Wai","Long Ping","Yuen Long","Kam Sheung Road",
    "Tsuen Wan West","Mei Foo","Nam Cheong","Austin","East Tsim Sha Tsui","Hung Hom"
  ],
  "Pass4": [
    "Tung Chung","Sunny Bay","Tsing Yi","Nam Cheong"
    // Exclude Disneyland Resort
  ],
  "Pass5": [
    "Tung Chung","Sunny Bay","Tsing Yi","Kowloon","Hong Kong","Central"
    // Exclude Disneyland Resort
  ]
};

// Boundary stations for connection journeys
const passBoundary = {
  "Pass1": "East Tsim Sha Tsui",
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
  const data = await response.json();
  const text = data.contents; // CSV text
  const rows = text.trim().split("\n").map(r => r.split(","));
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
  const data = await response.json();
  const text = data.contents; // CSV text
  const rows = text.trim().split("\n").map(r => r.split(","));
  fareTable = {};
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
