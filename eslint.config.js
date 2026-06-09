import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude', 'supabase']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow intentionally-unused names prefixed with _ (params, vars, caught errors).
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // Advisory React Compiler / Fast-Refresh hints: keep visible as warnings
      // rather than hard errors. They flag optimization/HMR concerns (not runtime
      // bugs) and "fixing" them can require risky refactors.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },

  // Frontend: no debug logging in committed code (console.warn/error are fine).
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // Backend (Vercel functions + the Express adapter): Node environment. Must not
  // import frontend code or use Vite-only import.meta.env (undefined in Node).
  {
    files: ['api/**/*.ts', 'server/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/src/*', '**/src/**', '../**/src/**', '../../src/**'],
          message:
            'Backend (api/, server/) must not import frontend code from src/. Put shared server code in api/lib/ or api/services/.',
        }],
      }],
      // Ban import.meta.env specifically (import.meta.url is fine for __dirname).
      'no-restricted-syntax': ['error', {
        selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
        message: 'import.meta.env is Vite-only and undefined in Node. Use process.env in backend code.',
      }],
    },
  },
])
