# MTR Fare‑Pass Calculator

A simple, browser‑based tool that helps Hong Kong commuters understand how the **MTR Monthly Pass Extra (全月通)** affects their journey fares.

---

## 🎯 What it does

Select any two stations on the MTR network, choose one of the five Monthly‑Pass zones (or “no pass”), and the calculator will:

- show the **effective fare with the pass applied** (highlighted),
- display the **standard fare** for the same journey, and
- compute the **savings or extra cost**.

It applies all of the pass rules:

- unlimited travel within the pass zone,
- 25 % discount outside the zone,
- excludes certain lines/stations (Airport Express, Lo Wu, Lok Ma Chau, Racecourse, First‑Class),
- and uses the official fare table from DATA.GOV.HK.

---

## 🧰 Features

- Dropdowns for **From**, **To** and **Pass option**.
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
3. Pick a Monthly Pass.
4. Read the results in the three‑row table.

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
- Allow multi‑pass comparison.
- Make the station list searchable/autocomplete.

---

✨ Feel free to fork, extend or deploy – the code is MIT‑licensed.
