# MTR Fare‑Pass Calculator

English | [繁體中文（香港）](README.zh-HK.md)

A simple, browser‑based tool that helps Hong Kong commuters understand how the **MTR Monthly Pass Extra (全月通)** affects their journey fares.

---

## 🎯 What it does

Select any two stations on the MTR network, and the calculator will compare the standard fare with any cheaper result from the five Monthly‑Pass zones:

- always show the **standard fare**,
- show pass discounts as rows and no-exit/re-entry choices as columns,
- switch to expandable, pass-by-pass fare cards on mobile screens,
- group passes or re-entry stations when their fare results match, with a shared fare breakdown for grouped re-entry stations, and
- show savings beside each discounted fare.

It applies all of the pass rules:

- unlimited travel within the pass zone,
- 25 % discount outside the zone,
- compares the no-exit fare with same-station exit/re-entry options at pass-covered stations along the route, and at Sheung Shui for border journeys,
- shows only pass and exit/re-entry results that beat the standard fare, with savings beside each fare,
- reveals each re-entry option's discounted-leg calculation on hover, focus, or click,
- displays the route with the fewest interchanges by default, with the fewest-stations route available as a secondary choice, when a fare-result column header is selected,
- models East Rail Line branches at Sheung Shui and the Tseung Kwan O Line branch at Tseung Kwan O when finding routes,
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

## 📂 Data

Fare data is embedded as JSON, sourced directly from the government dataset.
Monthly‑pass coverage and discount rules are implemented in JavaScript.

---

## 🚀 How to use

1. Open `index.html` in your browser or visit the GitHub Pages site.
2. Choose departure and arrival stations.
3. Use the color-coded toggles to choose which of the five Monthly Passes to compare – you don't pick a single pass type. Results update in real time.
4. Read the results: one row per selected pass, one column per no-exit/re-entry option. On mobile, expand each pass card to see its fares.

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
