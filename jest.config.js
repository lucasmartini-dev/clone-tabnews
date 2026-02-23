const nextJest = require("next/jest");
const createJestConfig = nextJest({
  dir: ".",
});

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 600000,
});

const dotenv = require("dotenv");
dotenv.config({
  path: ".env.development",
});

module.exports = jestConfig;
