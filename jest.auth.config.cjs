module.exports = {
  collectCoverageFrom: [
    'backend/src/**/*.js',
    'frontend/src/**/*.jsx',
    '!backend/src/server.js',
  ],
  coverageDirectory: 'coverage/auth',
  moduleNameMapper: {
    '^.+\\.css$': '<rootDir>/tests/frontend/styleMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setupTests.js'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
};
