/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './lib',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
      '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  coverageReporters: ['text', 'cobertura'],
  coverageDirectory: '../coverage',
};