# MTR Fare Calculator with Monthly Pass Extra

## 📌 Project Description
This project is a lightweight, browser-based fare calculator for Hong Kong’s MTR system.  
It allows users to select a journey between two stations and apply one of the **Monthly Pass Extra (全月通)** options to see the effective fare.  

Unlike the official MTR Mobile app, which only shows standard fares, this tool integrates the **Monthly Pass Extra rules**:
- Unlimited rides within designated pass coverage zones  
- 25% discount on journeys outside the coverage  
- Excludes Airport Express, Lo Wu, Lok Ma Chau, Racecourse, and First Class fares  

The goal is to make savings transparent and help commuters decide whether a pass is worth buying.

---

## 🎛️ Features
- Three simple combo boxes:
  1. **From Station**  
  2. **To Station**  
  3. **Monthly Pass Option** (5 passes + no pass)  
- Result table with three rows:
  - **Fare with pass applied** (highlighted)  
  - Original fare (normal font)  
  - Fare difference (normal font)  

---

## 🗂️ Data Source
- Base fares are taken from the official **DATA.GOV.HK MTR fare dataset**.  
- Monthly Pass Extra rules are applied programmatically on top of the dataset.  

---

## 🚀 Usage
1. Open the GitHub Page.  
2. Select your journey (From → To).  
3. Choose a Monthly Pass option.  
4. Instantly see:  
   - Effective fare with pass  
   - Original fare  
   - Difference  

---

## 🔧 Tech Stack
- **Frontend:** HTML + CSS + JavaScript  
- **Data:** Embedded JSON (fare table + pass coverage rules)  
- **Hosting:** GitHub Pages  

---

## 📈 Future Enhancements
- Add support for Light Rail and feeder buses.  
- Visualize monthly savings based on usage frequency.  
- Compare multiple passes side by side.  
