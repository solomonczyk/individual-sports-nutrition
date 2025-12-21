/**
 * Jest Configuration for React Native Mobile App
 * 
 * Configures Jest to test React Native components with Expo,
 * TypeScript support, and proper module resolution.
 */

module.exports = {
  preset: 'jest-expo',
  
  // Test environment
  testEnvironment: 'node',
  
  // Collect coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/app.json',
  ],
  
  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    './src/screens/': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}',
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts',
  ],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '.expo',
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '/node_modules/',
    '.expo',
  ],
  
  // Coverage ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
  ],
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset mocks between tests
  resetMocks: true,
};
