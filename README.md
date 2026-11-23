# MTR Fare‑Pass Calculator

English | [繁體中文（香港）](README.zh-HK.md)

A simple, browser‑based tool that helps Hong Kong commuters understand how the **MTR Monthly Pass Extra (全月通)** affects their journey fares.

---

## 🎯 What it does

Select any two stations on the MTR network, and the calculator will compare the standard fare with any cheaper result from the five Monthly‑Pass zones:

- always show the **standard fare**,
- show pass discounts as rows and no-extra-re-entry/re-entry choices as columns,
- switch to expandable, pass-by-pass fare cards on mobile screens,
- group passes or re-entry stations when their fare results match, with matching re-entry calculations consolidated in the fare breakdown, and
- show savings beside each discounted fare.

It applies all of the pass rules:

- unlimited travel within the pass zone,
- 25 % discount outside the zone,
- compares the single-journey fare with same-station exit/re-entry options at pass-covered stations along the route, and at Sheung Shui for border journeys,
- shows only pass and exit/re-entry results that beat the standard fare, with savings beside each fare,
- reveals each re-entry option's discounted-leg calculation on hover, focus, or click,
- displays the route with the fewest interchanges by default, with the fewest-stations route available as a secondary choice, when a fare-result column header is selected,
- lets the original-fare label open the same route suggestions, even with no pass selected,
- models East Rail Line branches at Sheung Shui and the Tseung Kwan O Line branch at Tseung Kwan O when finding routes,
- treats Central and Hong Kong as a single fare boundary and includes their paid-area walking interchange in routes,
- shows the out-of-gate Tsim Sha Tsui / East Tsim Sha Tsui interchange as a single Octopus journey when completed within 30 minutes, with directional exit and entry labels, the first deduction and final adjustment or refund,
- labels routes using that interchange separately and notes the 30-minute transfer condition,
- compares separately any suggested route that uses this interchange and one that does not, including the monthly-pass connecting-fare exception for the interchange,
- compares eligible pass-zone interchanges even when a journey starts or ends at the pass boundary,
- charges the full fare for each journey leg to or from Lo Wu or Lok Ma Chau, with pass benefits available on a separate re-entry leg,
- excludes certain lines/stations (Airport Express, Racecourse, First‑Class) from pass benefits,
- and uses the official fare table from DATA.GOV.HK.

---

## 🧰 Features

- Dropdowns for **From** and **To**.
- Color-coded toggles to choose which Monthly Pass results to compare, with a toggle-all control.
- Real‑time fare calculation with breakdown.
- No backend – everything runs in the browser.
- Hosted on GitHub Pages; easy to fork or modify.

---

## Release notes

When publishing, add the release date and brief English and Traditional Chinese notes as the first entry in `release-history.js`. Older entries can remain in the file; the page displays only the first entry. The date describes the app release, not the freshness of the live fare data.

---

## 📂 Data

Fare data is embedded as JSON, sourced directly from the government dataset.
Monthly‑pass coverage and discount rules are implemented in JavaScript.

---

## 🚀 How to use

1. Open `index.html` in your browser or visit the GitHub Pages site.
2. Choose departure and arrival stations.
3. Use the color-coded toggles to choose which of the five Monthly Passes to compare – you don't pick a single pass type. Results update in real time.
4. Read the results: one row per selected pass, one column per route or re-entry option. On mobile, expand each pass card to see its fares.

The Tsim Sha Tsui / East Tsim Sha Tsui calculation assumes the same Octopus is used and the interchange qualifies within 30 minutes. MTR also requires that it not be used on other transport or for more than nine non-transport transactions during the interchange. Otherwise, the trips are charged separately; this calculator does not model an elapsed-time input or a separate over-30-minute result.

---

## 🛠 Technology

- **HTML / CSS / vanilla JavaScript**
- Static JSON data
- No build step – just open the page

---

## 📌 Notes & Limitations

- Not a substitute for the official MTR calculator; intended for quick comparisons only.
- Light Rail, feeder buses and other transit modes are not yet included.
- The fare dataset may occasionally require manual updates.

---

## 🔮 Future ideas

- Support Light Rail / bus transfers.
- Display monthly savings based on a user’s trip frequency.
- Make the station list searchable/autocomplete.

---

✨ Feel free to fork, extend or deploy – the code is MIT‑licensed.
