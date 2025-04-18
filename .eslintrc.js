module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-console': ['warn'],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'prefer-const': ['error'],
    'no-var': ['error'],
    'eqeqeq': ['error', 'always'],
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'no-trailing-spaces': ['error'],
    'eol-last': ['error', 'always']
  }
} 