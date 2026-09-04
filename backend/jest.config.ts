export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@dbstats/shared(.*)\\.js$': '<rootDir>../shared$1',
    '^@dbstats/shared(.*)$': '<rootDir>../shared$1',
    // ESM source imports carry an explicit .js extension pointing at the
    // compiled output; map them back to the sibling .ts source so ts-jest
    // can transform it directly.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  modulePaths: ['<rootDir>', '<rootDir>../shared'],
  roots: ['<rootDir>'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
};
