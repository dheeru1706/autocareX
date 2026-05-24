'use strict';

module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs',
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-empty': 'warn',
    'no-console': 'off',
    'no-process-exit': 'off',
    'no-prototype-builtins': 'warn',
  },
  ignorePatterns: ['node_modules/', 'coverage/', 'dist/', 'logs/'],
};
