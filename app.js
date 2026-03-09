// Example station list (replace with full dataset from DATA.GOV.HK)
const stations = [
  "Admiralty", "Central", "Tsim Sha Tsui", "Sheung Shui", "Wu Kai Sha",
  "Tuen Mun", "Hung Hom", "Tung Chung", "Hong Kong", "Nam Cheong", "To Kwa Wan"
];

// Example fare table (replace with full dataset)
const fareTable = {
  "Admiralty-Central": 5.0,
  "Admiralty-Tsim Sha Tsui": 10.0,
  "Sheung Shui-Tsim Sha Tsui": 20.0,
  "Tuen Mun-Hung Hom": 25.0,
  "Tung Chung-Hong Kong": 30.0,
  "Nam Cheong-To Kwa Wan": 12.4
};

// Populate station dropdowns
window.onload = () => {
  const fromSelect = document.getElementById("fromStation");
  const toSelect = document.getElementById("toStation");
  stations.forEach(st => {
    fromSelect.add(new Option(st, st));
    toSelect.add(new Option(st, st));
  });
};

// Coverage zones (simplified)
const passCoverage = {
  "Pass1": ["Sheung Shui", "Wu Kai Sha", "East Tsim Sha Tsui"],
  "Pass2": ["Tuen Mun", "Nam Cheong"],
  "Pass3": ["Tuen Mun", "Hung Hom"],
  "Pass4": ["Tung Chung", "Nam Cheong"],
  "Pass5": ["Tung Chung", "Hong Kong"]
};

// Boundary stations for connection journeys
const passBoundary = {
  "Pass2": "Nam Cheong",
  "Pass3": "Hung Hom",
  "Pass4": "Nam Cheong",
  "Pass5": "Hong Kong"
};

// Lookup fare
function lookupFare(from, to) {
  return fareTable[`${from}-${to}`] || fareTable[`${to}-${from}`] || 0;
}

// Apply discount with rounding rule
function applyDiscount(fare, discountRate) {
  let discounted = fare * (1 - discountRate);
  let tenth = discounted * 10;
  let remainder = tenth - Math.floor(tenth);

  if (remainder > 0.05) {
    discounted = (Math.floor(tenth) + 1) / 10; // round up
  } else {
    discounted = Math.floor(tenth) / 10; // round down
  }
  return discounted;
}

// Main calculation
function calculateFare() {
  const from = document.getElementById("fromStation").value;
  const to = document.getElementById("toStation").value;
  const pass = document.getElementById("passOption").value;

  const original = lookupFare(from, to);
  let passFare = original;

  if (pass !== "No Pass") {
    const coverage = passCoverage[pass.split(":")[0]];
    if (coverage && coverage.includes(from) && coverage.includes(to)) {
      passFare = 0; // fully covered
    } else {
      const boundary = passBoundary[pass.split(":")[0]];
      if (boundary) {
        const connectionFare = lookupFare(boundary, to);
        passFare = applyDiscount(connectionFare, 0.25);
      }
    }
  }

  const diff = original - passFare;

  document.getElementById("passFare").innerText = `$${passFare.toFixed(1)}`;
  document.getElementById("originalFare").innerText = `$${original.toFixed(1)}`;
  document.getElementById("difference").innerText = `$${diff.toFixed(1)}`;
  document.getElementById("resultTable").style.display = "table";
}
