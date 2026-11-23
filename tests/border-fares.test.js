const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createApp() {
  const context = vm.createContext({
    window: {},
    document: { getElementById: () => ({ addEventListener() {} }) }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"), context);
  vm.runInContext(`
    currentLang = "en";
    fareTable = {
      "78-68": 33, "76-68": 33, "75-68": 7.7,
      "78-75": 26.5, "76-75": 26.5, "76-78": 26.5,
      "78-1": 52.2, "75-1": 22.2, "80-1": 10.6,
      "67-1": 17.1, "11-1": 15.8, "8-1": 13.2,
      "84-1": 13.2, "64-1": 12.6,
      "120-78": 59.2, "120-75": 25, "120-53": 17.8, "53-75": 12.7,
      "20-75": 15, "64-75": 11.2, "21-75": 15,
      "43-76": 57.5, "43-75": 28.3,
      "1-39": 0, "1-26": 4.9, "39-26": 4.9,
      "1-28": 5.9, "39-28": 5.9, "1-31": 7.4, "39-31": 7.4,
      "1-34": 9.2, "39-34": 9.2, "43-26": 24.3,
      "1-3": 10.6, "39-3": 10.6, "53-3": 6.2,
      "1-50": 15.8, "39-50": 15.8, "53-50": 11, "21-50": 11,
      "26-50": 15.8, "53-20": 5.9, "21-20": 4.9,
      "53-26": 13.2, "21-26": 15.8
    };
  `, context);
  return expression => vm.runInContext(expression, context);
}

test("border journeys use full fare without re-entry for every pass", () => {
  const run = createApp();
  for (const [from, to, pass] of [
    ["78", "68", "Pass1"],
    ["120", "78", "Pass2"],
    ["78", "120", "Pass3"],
    ["43", "76", "Pass4"],
    ["76", "43", "Pass5"]
  ]) {
    assert.equal(run(`findCheapestConnectionCalculation("${pass}", "${from}", "${to}")`), null);
    assert.equal(run(`getPassScenarios("${from}", "${to}", lookupFare("${from}", "${to}"))
      .find(entry => entry.passKey === "${pass}").results.noExit`), undefined);
  }
});

test("Pass 1 re-entry at Sheung Shui covers a separate pass-zone leg in either direction", () => {
  const run = createApp();
  for (const [from, to] of [["78", "68"], ["68", "76"]]) {
    const result = run(`getPassScenarios("${from}", "${to}", lookupFare("${from}", "${to}"))
      .find(entry => entry.passKey === "Pass1").results["75"]`);
    assert.equal(result.fare, 26.5);
    assert.match(result.breakdown, /\$26\.5 \(full fare\)/);
    assert.match(result.breakdown, /Journey covered by pass: \$0\.0/);
    assert.ok(result.routes.some(route => route.stations.some(stop => stop.id === "75" && stop.isReentry)));
  }
});

test("re-entry at Sheung Shui can discount the non-border connection for each pass", () => {
  const run = createApp();
  for (const [from, to, pass, expected] of [
    ["78", "1", "Pass1", 34.4],
    ["120", "78", "Pass2", 36],
    ["78", "120", "Pass3", 34.9],
    ["43", "76", "Pass4", 36],
    ["76", "43", "Pass5", 36]
  ]) {
    for (const [origin, destination] of [[from, to], [to, from]]) {
      const result = run(`getPassScenarios("${origin}", "${destination}", lookupFare("${origin}", "${destination}"))
        .find(entry => entry.passKey === "${pass}").results["75"]`);
      assert.equal(result.fare, expected);
      assert.match(result.breakdown, /\$26\.5 \(full fare\)/);
      assert.match(result.breakdown, /× 75%/);
    }
  }
});

test("covered-station re-entry keeps the border leg full fare", () => {
  const run = createApp();
  run(`fareTable["78-53"] = 44.4`);
  const result = run(`getPassScenarios("120", "78", lookupFare("120", "78"))
    .find(entry => entry.passKey === "Pass2").results["53"]`);
  assert.equal(result.fare, 44.4);
  assert.match(result.breakdown, /\$44\.4 \(full fare\)/);
});

test("border-to-border trips and missing border fares do not create pass savings", () => {
  const run = createApp();
  assert.equal(run(`Object.keys(getPassScenarios("76", "78", 26.5)
    .find(entry => entry.passKey === "Pass1").results).length`), 0);
  run(`delete fareTable["78-75"]`);
  assert.equal(run(`getPassScenarios("78", "68", 33)
    .find(entry => entry.passKey === "Pass1").results["75"]`), undefined);
});

test("non-border discounts retain half-dime rounding down", () => {
  const run = createApp();
  assert.equal(run("applyDiscount(10.6)"), 7.9);
  assert.equal(run("applyDiscount(33)"), 24.7);
  assert.equal(run(`getPassScenarios("75", "1", 22.2)
    .find(entry => entry.passKey === "Pass1").results.noExit.fare`), 7.9);
});

test("Central and Hong Kong use the same Pass 5 boundary in both directions", () => {
  const run = createApp();
  for (const [outside, fare] of [["26", 4.9], ["28", 5.9], ["31", 7.4], ["34", 9.2]]) {
    for (const boundary of ["1", "39"]) {
      for (const [from, to] of [[boundary, outside], [outside, boundary]]) {
        assert.equal(run(`findCheapestConnectionCalculation("Pass5", "${from}", "${to}").fare`), fare);
        assert.equal(run(`lookupFare("${from}", "${to}")`), fare);
        assert.equal(run(`getPassScenarios("${from}", "${to}", ${fare})
          .find(entry => entry.passKey === "Pass5").results.noExit`), undefined);
      }
    }
  }
  assert.equal(run(`findCheapestConnectionCalculation("Pass5", "43", "26").fare`), 3.7);
  assert.equal(run(`calculateReentryLegFare("Pass5", "26", "1").fare`), 4.9);
  assert.equal(run(`calculateReentryLegFare("Pass5", "1", "26").fare`), 4.9);
  for (const boundary of ["1", "39"]) {
    for (const [from, to] of [[boundary, "50"], ["50", boundary]]) {
      const result = run(`getPassScenarios("${from}", "${to}", 15.8)
        .find(entry => entry.passKey === "Pass5").results.noExit`);
      assert.equal(result.fare, 8.2);
      assert.match(result.breakdown, /\$11\.0 × 75% = \$8\.2/);
    }
    assert.equal(run(`calculateReentryLegFare("Pass5", "${boundary}", "3").fare`), 4.6);
    assert.equal(run(`calculateReentryLegFare("Pass5", "${boundary}", "999")`), null);
  }
  run(`delete fareTable["1-50"]`);
  assert.equal(run(`calculateReentryLegFare("Pass5", "1", "50")`), null);
});

test("other pass boundaries can connect through another covered interchange", () => {
  const run = createApp();
  for (const [from, to] of [["53", "20"], ["20", "53"]]) {
    assert.equal(run(`getPassScenarios("${from}", "${to}", 5.9)
      .find(entry => entry.passKey === "Pass4").results.noExit.fare`), 3.7);
  }
});

test("re-entry at Central can use a covered leg in either direction", () => {
  const run = createApp();
  for (const [from, to] of [["26", "50"], ["50", "26"]]) {
    const result = run(`getPassScenarios("${from}", "${to}", 15.8)
      .find(entry => entry.passKey === "Pass5").results["1"]`);
    assert.equal(result.fare, 13.1);
    assert.match(result.breakdown, /\$11\.0 × 75% = \$8\.2/);
    assert.match(result.breakdown, /\$4\.9 \(full fare\)/);
    assert.ok(result.routes.some(route => route.stations.some(stop => stop.id === "1" && stop.isReentry)));
  }
});

test("walking between Central and Hong Kong is not a train stop", () => {
  const run = createApp();
  for (const [from, to] of [["26", "40"], ["40", "26"]]) {
    const route = run(`createRouteInfo(findStationRoutes("${from}", "${to}").fewestStations, null, "fewestStations")`);
    assert.equal(route.stationCount, 2);
    assert.equal(route.transferCount, 1);
    assert.deepEqual(Array.from(route.stations, station => station.id), [from, from === "26" ? "1" : "39", from === "26" ? "39" : "1", to]);
    assert.deepEqual(Array.from(route.segments, segment => segment.stationCount), [1, 0, 1]);
    assert.equal(route.segments[1].line, "Walking connection");
  }
  const walk = run(`createRouteInfo(findStationRoutes("1", "39").fewestStations, null, "fewestStations")`);
  assert.equal(walk.stationCount, 0);
  assert.equal(walk.transferCount, 0);
});

test("zero fares are displayed while missing fares remain unavailable", () => {
  const run = createApp();
  run(`
    let displayedFare;
    document.getElementById = id => ({
      value: id === "fromStation" ? "1" : "39",
      style: {}
    });
    renderFareResults = fare => { displayedFare = fare; };
    calculateFare();
  `);
  assert.equal(run("displayedFare"), 0);
  run(`delete fareTable["1-39"]; calculateFare()`);
  assert.equal(run("displayedFare"), null);
});
