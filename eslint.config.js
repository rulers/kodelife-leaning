import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['inkplay/app.js', 'fluid3d/demo/app.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
  eslintConfigPrettier,
];