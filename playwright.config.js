const path = require("path");

const htmlPath = path.resolve(__dirname, "index.html");

module.exports = {
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: `file://${htmlPath}`,
    viewport: { width: 1280, height: 720 },
    trace: "on-first-retry",
  },
};
