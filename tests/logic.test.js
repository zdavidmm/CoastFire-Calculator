const assert = require("assert");
require("../logic");
const logic = global.CoastLogic;

function nearlyEqual(actual, expected, tolerance = 1e-6) {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `Expected ${expected} +/- ${tolerance}, got ${actual} (diff ${diff})`
  );
}

test("buildSpendingSeries bounds and step", () => {
  const values = logic.buildSpendingSeries();
  assert.strictEqual(values[0], logic.SPENDING_MIN);
  assert.strictEqual(values[values.length - 1], logic.SPENDING_MAX);
  assert.strictEqual(values[1] - values[0], logic.SPENDING_STEP);
});

test("buildAgeSeries returns 70 ages", () => {
  const ages = logic.buildAgeSeries(40);
  assert.strictEqual(ages.length, logic.ROWS);
  assert.strictEqual(ages[0], 40);
  assert.strictEqual(ages[ages.length - 1], 40 + logic.ROWS - 1);
});

test("requiredAssets returns NaN for invalid growth or swr", () => {
  const base = {
    spending: 50000,
    currentAge: 30,
    retirementAge: 35,
  };
  assert.ok(Number.isNaN(logic.requiredAssets({ ...base, swr: 0, returnRate: 0.05, inflation: 0.02 })));
  assert.ok(Number.isNaN(logic.requiredAssets({ ...base, swr: 0.04, returnRate: -1.1, inflation: 0.02 })));
});

test("coastingAssets returns NaN for non-positive growth", () => {
  const value = logic.coastingAssets({
    currentAssets: 1000,
    returnRate: -1.1,
    inflation: 0.02,
    currentAge: 30,
    retirementAge: 40,
  });
  assert.ok(Number.isNaN(value));
});

test("clampSpending enforces bounds and handles bad input", () => {
  assert.strictEqual(logic.clampSpending("not-a-number"), logic.SPENDING_MIN);
  assert.strictEqual(logic.clampSpending(0), logic.SPENDING_MIN);
  assert.strictEqual(logic.clampSpending(999999), logic.SPENDING_MAX);
  assert.strictEqual(logic.clampSpending(75000), 75000);
});

test("findCoastAge returns null when required assets are invalid", () => {
  const age = logic.findCoastAge({
    currentAssets: 1000,
    spending: 50000,
    swr: 0,
    returnRate: 0.05,
    inflation: 0.02,
    currentAge: 30,
  });
  assert.strictEqual(age, null);
});

test("findCoastAge returns null when assets never catch up", () => {
  const age = logic.findCoastAge({
    currentAssets: 1,
    spending: 300000,
    swr: 0.04,
    returnRate: 0.05,
    inflation: 0.02,
    currentAge: 30,
  });
  assert.strictEqual(age, null);
});

test("findCoastAge finds an age when assets exceed required", () => {
  const age = logic.findCoastAge({
    currentAssets: 2000000,
    spending: 50000,
    swr: 0.04,
    returnRate: 0.1,
    inflation: 0.04,
    currentAge: 30,
  });
  assert.strictEqual(age, 30);
});

test("coasting and required are consistent", () => {
  const required = logic.requiredAssets({
    spending: 50000,
    swr: 0.04,
    returnRate: 0.1,
    inflation: 0.04,
    currentAge: 30,
    retirementAge: 40,
  });

  const coast = logic.coastingAssets({
    currentAssets: required,
    returnRate: 0.1,
    inflation: 0.04,
    currentAge: 30,
    retirementAge: 40,
  });

  nearlyEqual(coast, 50000 / 0.04);
});

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}
