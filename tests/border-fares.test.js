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

test("re-entry breakdowns group matching calculations and retain distinct ones", () => {
  const run = createApp();
  run(`
    const firstLeg = "$4.9 × 75% = $3.7 (via Diamond Hill)";
    const secondLeg = "$22.2 × 75% = $16.6 (via East Tsim Sha Tsui)";
    const reentries = ["Hung Hom", "East Tsim Sha Tsui", "Ho Man Tin", "Kai Tak", "Sung Wong Toi", "To Kwa Wan"]
      .map(stationName => {
        const secondLegFormula = stationName === "East Tsim Sha Tsui"
          ? "$22.2 × 75% = $16.6 (via Diamond Hill)" : secondLeg;
        const breakdownDetails = {
          stationName, originName: "Kowloon Bay", destinationName: "Disneyland Resort",
          firstLegFormula: firstLeg, secondLegFormula, fare: 20.3
        };
        return {
          breakdownDetails,
          breakdown: \`Kowloon Bay → \${stationName}: \${firstLeg}\\n\${stationName} → Disneyland Resort: \${secondLegFormula}\\nTotal: $20.3\`
        };
      });
  `);
  const text = run("createFareBreakdownText([...reentries, reentries[0]], true)");
  const sections = text.split("\n\n");
  assert.equal(sections.length, 2);
  assert.match(sections[0], /^Same fare at: Hung Hom, Ho Man Tin, Kai Tak, Sung Wong Toi, To Kwa Wan\n/);
  assert.match(sections[0], /Each station → Disneyland Resort: \$22\.2 × 75% = \$16\.6 \(via East Tsim Sha Tsui\)/);
  assert.equal(sections[1], run("reentries[1].breakdown"));
  assert.equal(run("createFareBreakdownText(reentries, false)").split("\n\n").length, 6);
});

test("re-entry breakdowns retain distinct groups and unstructured calculations", () => {
  const run = createApp();
  const sections = run(`createFareBreakdownText([
    ...["A", "B", "C", "D"].map((stationName, index) => ({
      breakdown: stationName,
      breakdownDetails: {
        stationName, originName: "Origin", destinationName: "Destination",
        firstLegFormula: "first", secondLegFormula: index < 2 ? "second" : "other", fare: 10
      }
    })),
    { breakdown: "Additional calculation" }
  ], true)`).split("\n\n");
  assert.equal(sections.length, 3);
  assert.match(sections[0], /^Same fare at: A, B\n/);
  assert.match(sections[1], /^Same fare at: C, D\n/);
  assert.equal(sections[2], "Additional calculation");
});

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

test("TST interchange reconciles normal fares and permits refunds", () => {
  const run = createApp();
  run(`
    fareTable["111-80"] = 4.9;
    fareTable["111-4"] = 4.9;
    fareTable["4-3"] = 4.9;
  `);
  const forward = run(`calculateTstInterchange(null, "111", "4", ["111", "80", "3", "4"])`);
  assert.equal(forward.first, 4.9);
  assert.equal(forward.adjustment, 0);
  assert.equal(forward.total, 4.9);
  const reverse = run(`calculateTstInterchange(null, "4", "111", ["4", "3", "80", "111"])`);
  assert.equal(reverse.first, 4.9);
  assert.equal(reverse.adjustment, 0);
  run(`fareTable["4-3"] = 7`);
  assert.equal(run(`calculateTstInterchange(null, "4", "111", ["4", "3", "80", "111"]).adjustment`), -2.1);
});

test("Nam Cheong passes reconcile connecting fares in both directions", () => {
  const run = createApp();
  run(`
    Object.assign(fareTable, {
      "43-80": 14, "120-80": 14, "53-80": 8, "21-80": 12, "20-80": 12,
      "43-4": 15, "120-4": 15, "53-4": 10, "21-4": 12, "20-4": 12,
      "4-3": 9
    });
  `);
  for (const [pass, covered] of [["Pass2", "120"], ["Pass4", "43"]]) {
    const forward = run(`calculateTstInterchange("${pass}", "${covered}", "4", ["${covered}", "53", "111", "80", "3", "4"])`);
    assert.equal(forward.first, 6);
    assert.equal(forward.adjustment, 1.5);
    assert.equal(forward.total, 7.5);
    const reverse = run(`calculateTstInterchange("${pass}", "4", "${covered}", ["4", "3", "80", "111", "53", "${covered}"])`);
    assert.equal(reverse.first, 9);
    assert.equal(reverse.adjustment, -1.5);
    assert.equal(reverse.total, 7.5);
  }
});

test("a pass covering East TST has a free first leg and refunds in reverse", () => {
  const run = createApp();
  run(`
    Object.assign(fareTable, {
      "111-80": 4.9, "111-4": 12, "4-3": 9,
      "64-4": 12, "53-4": 10, "20-4": 12
    });
  `);
  const forward = run(`calculateTstInterchange("Pass3", "111", "4", ["111", "80", "3", "4"])`);
  assert.equal(forward.first, 0);
  assert.equal(forward.adjustment, 7.5);
  assert.equal(forward.total, 7.5);
  const reverse = run(`calculateTstInterchange("Pass3", "4", "111", ["4", "3", "80", "111"])`);
  assert.equal(reverse.first, 9);
  assert.equal(reverse.adjustment, -1.5);
  assert.equal(reverse.total, 7.5);
});

test("qualifying TST transfer enables the boundary exception and respects the fare cap", () => {
  const run = createApp();
  run(`
    Object.assign(fareTable, { "53-80": 8, "21-80": 12, "53-4": 10, "21-4": 12, "4-3": 9 });
  `);
  for (const [from, to] of [["53", "4"], ["4", "53"]]) {
    assert.equal(run(`findCheapestConnectionCalculation("Pass4", "${from}", "${to}").fare`), 9);
    assert.equal(run(`findCheapestConnectionCalculation("Pass4", "${from}", "${to}", true).fare`), 7.5);
  }
  const result = run(`calculateTstInterchange("Pass4", "4", "53", ["4", "3", "80", "111", "53"])`);
  assert.equal(result.first, 9);
  assert.equal(result.adjustment, -1.5);
  assert.equal(result.total, 7.5);
  run(`fareTable["53-4"] = 4`);
  assert.equal(run(`calculateTstInterchange("Pass4", "4", "53", ["4", "3", "80", "111", "53"]).total`), 3);
  run(`fareTable["43-4"] = 2`);
  assert.equal(run(`calculateTstInterchange("Pass4", "4", "43", ["4", "3", "80", "111", "53", "43"]).total`), 2);
});

test("TST route alternatives have independent pass fares and breakdowns", () => {
  const run = createApp();
  run(`
    Object.assign(fareTable, { "53-27": 10, "21-27": 12, "53-80": 8, "21-80": 12 });
    const routeAlternatives = findStationRoutes("53", "27");
  `);
  const result = run(`getPassScenarios("53", "27", 10, routeAlternatives)
    .find(entry => entry.passKey === "Pass4")`);
  assert.equal(result.results.noExit.fare, 9);
  assert.equal(result.results.tstTransfer.fare, 7.5);
  assert.match(result.results.tstTransfer.breakdown, /First exit: \$8\.0/);
  assert.equal(result.results.tstTransfer.routes[0].segments.some(segment => segment.line === "TST out-of-gate interchange"), true);
  const columns = run(`groupReentryColumns(getPassScenarios("53", "27", 10, routeAlternatives))`);
  assert.ok(columns.some(column => column.optionIds.length === 1 && column.optionIds[0] === "tstTransfer"));
  assert.equal(columns[0].options[0].label, "Without TST / East TST interchange");
  assert.equal(columns.find(column => column.optionIds[0] === "tstTransfer").options[0].label, "Via TST / East TST");
});

test("primary TST transfer and alternative routes have distinct labels", () => {
  const run = createApp();
  run(`Object.assign(fareTable, { "4-11": 9.2, "4-80": 4.9, "4-3": 4.9 });`);
  const result = run(`getPassScenarios("4", "11", 9.2).find(entry => entry.passKey === "Pass1")`);
  assert.equal(result.results.noExit.label, "Via TST / East TST");
  assert.equal(result.results.otherRoute.label, "Without TST / East TST interchange");
  assert.equal(result.results.noExit.fare, 3.7);
  assert.equal(result.results.otherRoute.fare, 3.7);
  const columns = run(`groupReentryColumns(getPassScenarios("4", "11", 9.2))`);
  assert.equal(columns[0].options[0].label, "Via TST / East TST");
  assert.equal(columns.find(column => column.optionIds[0] === "otherRoute").options[0].label, "Without TST / East TST interchange");
  assert.equal(run(`groupReentryColumns(getPassScenarios("75", "1", 22.2))[0].options[0].label`), "No extra re-entry");
});

test("original fare opens both route suggestions without a selected pass", () => {
  const run = createApp();
  run(`
    function testElement() {
      return {
        children: [], attributes: {}, listeners: {}, style: { setProperty() {} },
        classList: { add() {} },
        append(...nodes) { this.children.push(...nodes); },
        replaceChildren(...nodes) { this.children = nodes; },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(name, callback) { this.listeners[name] = callback; }
      };
    }
    const testElements = Object.fromEntries(
      ["resultTable", "mobileFareResults", "routeTable", "routeTableTitle", "routeChoices", "routeDiagram"]
        .map(id => [id, testElement()])
    );
    testElements.resultTable.tHead = testElement();
    testElements.resultTable.tBodies = [testElement()];
    document.createElement = testElement;
    document.createTextNode = text => ({ textContent: text });
    document.getElementById = id => testElements[id];
    const standardRoute = {
      label: translations[currentLang].originalFare,
      routes: createRouteOptions(findStationRoutes("4", "11"), null)
    };
    renderFareResults(9.2, [], null, standardRoute);
  `);
  for (const expression of [
    "testElements.resultTable.tBodies[0].children[0].children[0].children[0]",
    "testElements.mobileFareResults.children[0].children[0].children[0]"
  ]) {
    const button = run(expression);
    assert.equal(button.attributes["aria-label"], "Show route: Original Fare:");
    button.listeners.click();
    assert.equal(run("testElements.routeTable.hidden"), false);
    assert.equal(run("testElements.routeChoices.children.length"), 2);
    assert.equal(run("testElements.routeTableTitle.textContent"), "Route: Original Fare:");
    const segment = run(`testElements.routeDiagram.children[0].children
      .find(node => node.children.some(child => child.title))`);
    const label = segment.children.find(child => child.title);
    assert.equal(label.textContent, "Exit & walk\nwithin 30 min");
    assert.equal(label.attributes["aria-label"], "Exit and walk to the other station (within 30 minutes)");
  }

  const stopNotes = () => JSON.parse(run(`JSON.stringify(testElements.routeDiagram.children[0].children
    .filter(node => node.className === "route-stop")
    .map(node => [node.children[0].textContent,
      node.children.find(child => child.className === "route-stop-note")?.textContent || null]))`));
  assert.deepEqual(stopNotes(), [["4", null], ["3", "Exit"], ["80", "Enter"], ["11", null]]);
  run(`renderRouteDiagram(createRouteInfo(["10", "9", "8", "65", "64", "80", "3", "4"], null, "fewestStations"))`);
  assert.deepEqual(stopNotes(), [
    ["10", null], ["8", "Interchange"], ["64", "Interchange"], ["80", "Exit"], ["3", "Enter"], ["4", null]
  ]);
  run(`currentLang = "zh"; renderRouteDiagram(createRouteInfo(["4", "3", "80", "111"], null, "fewestStations"))`);
  assert.deepEqual(stopNotes(), [["4", null], ["3", "出閘"], ["80", "入閘"], ["111", null]]);
});

test("TST walking connection is an out-of-gate transfer, not a station or same-station re-entry", () => {
  const run = createApp();
  for (const [from, to] of [["111", "4"], ["4", "111"]]) {
    const route = run(`createRouteInfo(findStationRoutes("${from}", "${to}").fewestStations, null, "fewestStations")`);
    assert.equal(route.stationCount, 2);
    assert.equal(route.transferCount, 1);
    assert.deepEqual(Array.from(route.stations, station => station.id), [from, from === "111" ? "80" : "3", from === "111" ? "3" : "80", to]);
    assert.equal(route.segments[1].line, "TST out-of-gate interchange");
    assert.equal(route.segments[1].stationCount, 0);
  }
  assert.equal(run(`getTstTransferIndex(findStationRoutes("3", "111").fewestStations)`), -1);
  assert.equal(run(`isSameStation("3", "80")`), false);
});

test("a missing first-sector fare is reported rather than inventing a gate adjustment", () => {
  const run = createApp();
  run(`fareTable["111-4"] = 4.9`);
  const result = run(`calculateTstInterchange(null, "111", "4", ["111", "80", "3", "4"])`);
  assert.equal(result.adjustment, undefined);
  assert.match(result.breakdown, /unavailable/);
});

test("a separate re-entry leg retains the TST transfer adjustment", () => {
  const run = createApp();
  run(`
    Object.assign(fareTable, {
      "4-53": 10, "4-21": 12, "4-3": 9,
      "53-120": 20, "21-120": 12, "4-120": 30
    });
    const route = ["4", "3", "80", "111", "53", "20", "114", "115", "116", "117", "118", "119", "120"];
  `);
  const result = run(`getReentryScenarios("4", "120", "Pass4",
    { fewestInterchanges: route, fewestStations: route }).find(entry => entry.stationId === "53")`);
  assert.equal(result.fare, 16.5);
  assert.match(result.breakdown, /Final exit adjustment: -\$1\.5/);
  assert.match(result.breakdown, /\$12\.0 × 75% = \$9\.0/);
});
