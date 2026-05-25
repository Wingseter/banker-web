/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
  testTimeout: 20000,
  forceExit: true,
  // We share a single test database, so tests must run serially —
  // parallel files would TRUNCATE each other's seed user mid-flight.
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
