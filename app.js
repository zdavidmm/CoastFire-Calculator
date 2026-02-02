const DEFAULTS = {
  currentAssets: 400000,
  currentAge: 30,
  swr: 0.04,
  returnRate: 0.1,
  inflation: 0.04,
  spending: 50000,
};

const SPENDING_MIN = 50000;
const SPENDING_MAX = 300000;
const SPENDING_STEP = 1000;
const ROWS = 70;

const els = {
  currentAssets: document.getElementById("currentAssets"),
  currentAge: document.getElementById("currentAge"),
  swr: document.getElementById("swr"),
  returnRate: document.getElementById("returnRate"),
  inflation: document.getElementById("inflation"),
  spendRange: document.getElementById("spendRange"),
  spendInput: document.getElementById("spendInput"),
  warnings: document.getElementById("warnings"),
  statAssets: document.getElementById("statAssets"),
  statSpend: document.getElementById("statSpend"),
  statCoast: document.getElementById("statCoast"),
  table: document.getElementById("gridTable"),
  tableWrap: document.getElementById("tableWrap"),
  downloadCsv: document.getElementById("downloadCsv"),
  scrollTop: document.getElementById("scrollTop"),
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyTight = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  notation: "compact",
});

function formatCurrency(value) {
  return currency.format(Math.round(value));
}

function formatCompact(value) {
  return currencyTight.format(Math.round(value));
}

function getInputs() {
  return {
    currentAssets: Number(els.currentAssets.value),
    currentAge: Number(els.currentAge.value),
    swr: Number(els.swr.value),
    returnRate: Number(els.returnRate.value),
    inflation: Number(els.inflation.value),
    spending: Number(els.spendInput.value),
  };
}

function buildSpendingSeries() {
  const values = [];
  for (let v = SPENDING_MIN; v <= SPENDING_MAX; v += SPENDING_STEP) {
    values.push(v);
  }
  return values;
}

function buildAgeSeries(currentAge) {
  const ages = [];
  for (let i = 0; i < ROWS; i += 1) {
    ages.push(currentAge + i);
  }
  return ages;
}

function requiredAssets({ spending, swr, returnRate, inflation, currentAge, retirementAge }) {
  const growth = 1 + returnRate - inflation;
  const years = retirementAge - currentAge;
  if (growth <= 0 || swr <= 0) {
    return NaN;
  }
  return (spending / swr) / Math.pow(growth, years);
}

function findCoastAge({ currentAssets, spending, swr, returnRate, inflation, currentAge }) {
  const ages = buildAgeSeries(currentAge);
  for (const age of ages) {
    const need = requiredAssets({
      spending,
      swr,
      returnRate,
      inflation,
      currentAge,
      retirementAge: age,
    });
    if (!Number.isFinite(need)) {
      return null;
    }
    if (currentAssets >= need) {
      return age;
    }
  }
  return null;
}

function buildGrid(inputs) {
  const spendingValues = buildSpendingSeries();
  const ages = buildAgeSeries(inputs.currentAge);
  let html = "<thead><tr><th>Retirement Age</th>";
  for (const spending of spendingValues) {
    html += `<th>${formatCurrency(spending)}</th>`;
  }
  html += "</tr></thead><tbody>";

  for (const age of ages) {
    html += `<tr><td>${age}</td>`;
    for (const spending of spendingValues) {
      const value = requiredAssets({
        spending,
        swr: inputs.swr,
        returnRate: inputs.returnRate,
        inflation: inputs.inflation,
        currentAge: inputs.currentAge,
        retirementAge: age,
      });
      html += `<td>${Number.isFinite(value) ? formatCompact(value) : "-"}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody>";
  els.table.innerHTML = html;
}

function downloadCsv(inputs) {
  const spendingValues = buildSpendingSeries();
  const ages = buildAgeSeries(inputs.currentAge);
  const header = ["Retirement Age", ...spendingValues].join(",");
  const rows = [header];

  for (const age of ages) {
    const row = [age];
    for (const spending of spendingValues) {
      const value = requiredAssets({
        spending,
        swr: inputs.swr,
        returnRate: inputs.returnRate,
        inflation: inputs.inflation,
        currentAge: inputs.currentAge,
        retirementAge: age,
      });
      row.push(Number.isFinite(value) ? value.toFixed(2) : "");
    }
    rows.push(row.join(","));
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "coastfire-grid.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

let chart;
let growthChart;

function buildChart(inputs) {
  const ages = buildAgeSeries(inputs.currentAge);
  const required = ages.map((age) =>
    requiredAssets({
      spending: inputs.spending,
      swr: inputs.swr,
      returnRate: inputs.returnRate,
      inflation: inputs.inflation,
      currentAge: inputs.currentAge,
      retirementAge: age,
    })
  );

  const current = ages.map(() => inputs.currentAssets);
  const requiredPoints = ages.map((age, index) => ({ x: age, y: required[index] }));
  const currentPoints = ages.map((age, index) => ({ x: age, y: current[index] }));

  const ctx = document.getElementById("coastChart");
  if (chart) {
    chart.data.datasets[0].data = requiredPoints;
    chart.data.datasets[1].data = currentPoints;
    chart.options.scales.x.min = ages[0];
    chart.options.scales.x.max = ages[ages.length - 1];
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Required Assets Today",
          data: requiredPoints,
          borderColor: "#ff7a59",
          backgroundColor: "rgba(255, 122, 89, 0.15)",
          tension: 0.25,
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: "Current Assets (Today)",
          data: currentPoints,
          borderColor: "#0b7a75",
          borderDash: [6, 6],
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          type: "linear",
          min: ages[0],
          max: ages[ages.length - 1],
          ticks: {
            stepSize: 5,
          },
        },
        y: {
          ticks: {
            callback: (value) => formatCompact(value),
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
    },
  });
}

function buildGrowthChart(inputs) {
  const ages = buildAgeSeries(inputs.currentAge);
  const growth = 1 + inputs.returnRate - inputs.inflation;
  const coasting = ages.map((age) => {
    const years = age - inputs.currentAge;
    if (growth <= 0) {
      return NaN;
    }
    return inputs.currentAssets * Math.pow(growth, years);
  });

  const requiredTarget = inputs.swr > 0 ? inputs.spending / inputs.swr : NaN;
  const required = ages.map(() => requiredTarget);
  const coastingPoints = ages.map((age, index) => ({ x: age, y: coasting[index] }));
  const requiredPoints = ages.map((age, index) => ({ x: age, y: required[index] }));

  const ctx = document.getElementById("coastGrowthChart");
  if (growthChart) {
    growthChart.data.datasets[0].data = coastingPoints;
    growthChart.data.datasets[1].data = requiredPoints;
    growthChart.options.scales.x.min = ages[0];
    growthChart.options.scales.x.max = ages[ages.length - 1];
    growthChart.update();
    return;
  }

  growthChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Required Nest Egg (Spending / SWR)",
          data: requiredPoints,
          borderColor: "#ff7a59",
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: "Coasting Assets (Future Value)",
          data: coastingPoints,
          borderColor: "#0b7a75",
          backgroundColor: "rgba(11, 122, 117, 0.12)",
          tension: 0.25,
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          type: "linear",
          min: ages[0],
          max: ages[ages.length - 1],
          ticks: {
            stepSize: 5,
          },
        },
        y: {
          ticks: {
            callback: (value) => formatCompact(value),
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
    },
  });
}

function render() {
  const inputs = getInputs();
  const warnings = [];

  if (inputs.swr <= 0) {
    warnings.push("Safe withdrawal rate must be greater than 0.");
  }
  if (1 + inputs.returnRate - inputs.inflation <= 0) {
    warnings.push("Return minus inflation must be greater than -1 (so growth stays positive).");
  }

  els.warnings.textContent = warnings.join(" ");

  els.statAssets.textContent = formatCurrency(inputs.currentAssets);
  els.statSpend.textContent = formatCurrency(inputs.spending);

  const coastAge = findCoastAge(inputs);
  els.statCoast.textContent = coastAge ? `Age ${coastAge}` : "Not in range";

  buildChart(inputs);
  buildGrowthChart(inputs);
  buildGrid(inputs);
}

function syncSpending(value) {
  const numeric = Number(value);
  const clamped = Math.min(SPENDING_MAX, Math.max(SPENDING_MIN, numeric));
  els.spendRange.value = clamped;
  els.spendInput.value = clamped;
}

function init() {
  els.currentAssets.value = DEFAULTS.currentAssets;
  els.currentAge.value = DEFAULTS.currentAge;
  els.swr.value = DEFAULTS.swr;
  els.returnRate.value = DEFAULTS.returnRate;
  els.inflation.value = DEFAULTS.inflation;
  syncSpending(DEFAULTS.spending);

  const inputs = document.querySelectorAll(".input-grid input");
  inputs.forEach((input) => input.addEventListener("input", render));

  els.spendRange.addEventListener("input", (event) => {
    syncSpending(event.target.value);
    render();
  });

  els.spendInput.addEventListener("input", (event) => {
    syncSpending(event.target.value);
    render();
  });

  els.downloadCsv.addEventListener("click", () => downloadCsv(getInputs()));
  els.scrollTop.addEventListener("click", () => {
    els.tableWrap.scrollTo({ top: 0, behavior: "smooth" });
  });

  render();
}

init();
