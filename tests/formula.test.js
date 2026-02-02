const assert = require("assert");

const DEFAULTS = {
  currentAssets: 400000,
  currentAge: 30,
  swr: 0.04,
  returnRate: 0.1,
  inflation: 0.04,
};

function requiredAssets({ spending, swr, returnRate, inflation, currentAge, retirementAge }) {
  const growth = 1 + returnRate - inflation;
  const years = retirementAge - currentAge;
  return (spending / swr) / Math.pow(growth, years);
}

function coastingAssets({ currentAssets, returnRate, inflation, currentAge, retirementAge }) {
  const growth = 1 + returnRate - inflation;
  const years = retirementAge - currentAge;
  return currentAssets * Math.pow(growth, years);
}

function coastAgeByRequiredToday({ currentAssets, spending, swr, returnRate, inflation, currentAge }, maxYears = 69) {
  for (let i = 0; i <= maxYears; i += 1) {
    const age = currentAge + i;
    const needToday = requiredAssets({
      spending,
      swr,
      returnRate,
      inflation,
      currentAge,
      retirementAge: age,
    });
    if (currentAssets >= needToday) {
      return age;
    }
  }
  return null;
}

function coastAgeByFutureValue({ currentAssets, spending, swr, returnRate, inflation, currentAge }, maxYears = 69) {
  const target = spending / swr;
  for (let i = 0; i <= maxYears; i += 1) {
    const age = currentAge + i;
    const coast = coastingAssets({
      currentAssets,
      returnRate,
      inflation,
      currentAge,
      retirementAge: age,
    });
    if (coast >= target) {
      return age;
    }
  }
  return null;
}

function nearlyEqual(actual, expected, tolerance = 1e-3) {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `Expected ${expected} +/- ${tolerance}, got ${actual} (diff ${diff})`
  );
}

// These expected values are from the spreadsheet's default inputs.
const samples = [
  {
    name: "Required assets at current age for $50k spending",
    params: { spending: 50000, retirementAge: 30 },
    expected: 1250000,
  },
  {
    name: "Required assets at age 38 for $57k spending",
    params: { spending: 57000, retirementAge: 38 },
    expected: 894062.6292,
  },
  {
    name: "Required assets at age 58 for $97k spending",
    params: { spending: 97000, retirementAge: 58 },
    expected: 474403.097,
  },
  {
    name: "Required assets at age 99 for $300k spending",
    params: { spending: 300000, retirementAge: 99 },
    expected: 134572.5742,
  },
];

for (const sample of samples) {
  const actual = requiredAssets({
    spending: sample.params.spending,
    retirementAge: sample.params.retirementAge,
    ...DEFAULTS,
  });
  nearlyEqual(actual, sample.expected);
}

// Sanity: coasting at current age equals current assets.
const coastingNow = coastingAssets({
  currentAssets: DEFAULTS.currentAssets,
  returnRate: DEFAULTS.returnRate,
  inflation: DEFAULTS.inflation,
  currentAge: DEFAULTS.currentAge,
  retirementAge: DEFAULTS.currentAge,
});
nearlyEqual(coastingNow, DEFAULTS.currentAssets, 1e-6);

// Coast age should match whether using required-today or future-value comparison.
const coastA = coastAgeByRequiredToday({
  ...DEFAULTS,
  spending: 50000,
});
const coastB = coastAgeByFutureValue({
  ...DEFAULTS,
  spending: 50000,
});
assert.strictEqual(coastA, coastB, "Coast age mismatch between methods.");

console.log("All formula tests passed.");
