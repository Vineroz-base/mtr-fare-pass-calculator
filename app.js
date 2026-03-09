// Live data endpoints
const stationURL = `https://mtr-proxy.vineroz.workers.dev?url=https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv`;
const fareURL = `https://mtr-proxy.vineroz.workers.dev?url=https://opendata.mtr.com.hk/data/mtr_lines_fares.csv`;

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
  const text = await response.text();
  const rows = text.trim().split("\n").map(r => r.split(","));

  // Group stations by line
  const lines = {};
  rows.slice(1).forEach(r => {
    const line = r[0].replace(/"/g, "");
    const code = r[2].replace(/"/g, "");
    const id   = r[3].replace(/"/g, "");
    const name = r[5].replace(/"/g, "");
    const seq  = parseFloat(r[6]);

    if (!lines[line]) lines[line] = [];
    // Deduplicate by ID
    if (!lines[line].some(st => st.id === id)) {
      lines[line].push({ id, code, name, seq });
    }
  });

  const fromSelect = document.getElementById("fromStation");
  const toSelect   = document.getElementById("toStation");

  Object.keys(lines).forEach(line => {
    // Add line header (disabled)
    const header = new Option(line, "");
    header.disabled = true;
    header.style.backgroundColor = "#ddd";
    fromSelect.add(header);
    toSelect.add(header.cloneNode(true));

    // Sort stations by sequence
    lines[line].sort((a, b) => a.seq - b.seq);

    // Add stations: show name, store ID
    lines[line].forEach(st => {
      fromSelect.add(new Option(st.name, st.id));
      toSelect.add(new Option(st.name, st.id));
    });
  });
}

// Load fares
async function loadFares() {
  const response = await fetch(fareURL);
  const text = await response.text();
  const rows = text.trim().split("\n").map(r => r.split(","));

  fareTable = {};
  rows.slice(1).forEach(r => {
    const fromId = r[1].replace(/"/g, "");  // SRC_STATION_ID
    const toId   = r[3].replace(/"/g, "");  // DEST_STATION_ID
    const octAdult = parseFloat(r[4]);      // OCT_ADT_FARE

    if (!isNaN(octAdult)) {
      const key = `${fromId}-${toId}`;
      fareTable[key] = octAdult;
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
  const fromId = document.getElementById("fromStation").value;
  const toId   = document.getElementById("toStation").value;
  const pass   = document.getElementById("monthlyPass").value; // dropdown for pass type
  const key    = `${fromId}-${toId}`;
  const fare   = fareTable[key];

  const table = document.getElementById("fareTable");
  table.innerHTML = ""; // clear previous results

  if (fare !== undefined) {
    // Base Octopus Adult fare
    const originalFare = fare;

    // Adjusted fare depending on pass type
    let passFare = originalFare;
    if (pass && pass !== "none") {
      if (isMonthlyPassEligible(pass, fromId, toId)) {
        passFare = 0; // unlimited rides within pass zone
      } else if (isMonthlyPassConnection(pass, fromId, toId)) {
        passFare = originalFare * 0.75; // 25% discount outside zone
      }
    }

    // Difference
    const difference = originalFare - passFare;

    // Build results table
    const rows = [
      ["Fare with selected pass", `$${passFare.toFixed(1)}`],
      ["Original Octopus Adult fare", `$${originalFare.toFixed(1)}`],
      ["Difference", `$${difference.toFixed(1)}`]
    ];

    rows.forEach(([label, value]) => {
      const row = document.createElement("tr");
      const cell1 = document.createElement("td");
      const cell2 = document.createElement("td");
      cell1.textContent = label;
      cell2.textContent = value;
      row.appendChild(cell1);
      row.appendChild(cell2);
      table.appendChild(row);
    });
  } else {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;
    cell.textContent = "No fare found for this route.";
    row.appendChild(cell);
    table.appendChild(row);
  }
}

// Initialize
window.onload = async () => {
  await loadStations();
  await loadFares();
};
