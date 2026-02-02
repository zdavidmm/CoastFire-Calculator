(function (global) {
  const SPENDING_MIN = 50000;
  const SPENDING_MAX = 300000;
  const SPENDING_STEP = 1000;
  const ROWS = 70;

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

  function coastingAssets({ currentAssets, returnRate, inflation, currentAge, retirementAge }) {
    const growth = 1 + returnRate - inflation;
    const years = retirementAge - currentAge;
    if (growth <= 0) {
      return NaN;
    }
    return currentAssets * Math.pow(growth, years);
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

  function clampSpending(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return SPENDING_MIN;
    }
    return Math.min(SPENDING_MAX, Math.max(SPENDING_MIN, numeric));
  }

  const api = {
    SPENDING_MIN,
    SPENDING_MAX,
    SPENDING_STEP,
    ROWS,
    buildSpendingSeries,
    buildAgeSeries,
    requiredAssets,
    coastingAssets,
    findCoastAge,
    clampSpending,
  };

  global.CoastLogic = api;
})(globalThis);
