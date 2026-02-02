# CoastFIRE by Age and Spend

This is a static web version of the spreadsheet in this repo. It matches the core formulas and shows:
- Interactive inputs for assets, age, SWR, return, inflation.
- A chart for required assets vs retirement age for the selected spending level.
- The full retirement age x spending grid with CSV export.

## Run locally
Open `index.html` directly in a browser, or serve the folder with any static server.

## GitHub Pages
Enable Pages for the repository and point it at the root of the repo. The site uses static assets only.

## Formula
Required assets today for a given retirement age and spending:

```
(spending / SWR) / (1 + return - inflation) ^ (retirementAge - currentAge)
```

The grid uses the same retirement ages and spending increments as the spreadsheet:
- Retirement ages: current age to current age + 69
- Spending: $50,000 to $300,000 (step $1,000)
