module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['react-refresh'],
  rules: {
    // Fast Refresh is a dev-time convenience with no production impact.
    // Splitting a single-file context into three files for a warning is
    // over-engineering at this project size; this project accepts full-page
    // reloads during editing. Re-enable if the app grows past ~30 components.
    'react-refresh/only-export-components': 'off',

    // Allow props that are intentionally unused (prefix with _)
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

    // Prefer const where possible — catches accidental reassignment early
    'prefer-const': 'warn',

    // Disallow console.log in committed code (allow warn/error for real logging)
    // Reason: prevents debugging output leaking into a shared console
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Enforce === over ==
    // Reason: avoids type coercion bugs that are silent in review
    eqeqeq: ['error', 'always'],

    // Prop types are not used because this is a JS project without TS;
    // runtime prop validation would be a PropTypes dependency we don't need.
    'react/prop-types': 'off',

    // Allow apostrophes in prose but still forbid characters that can break
    // JSX parsing (angle brackets, braces, straight quotes).
    // Reason: contractions in UI copy are inevitable on ward tablets
    // ("Don't save if unsure"); escaping every one is noise.
    'react/no-unescaped-entities': ['error', { forbid: ['>', '"', '}', '“', '”'] }],
  },
  overrides: [
    {
      files: ['tests/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
      env: { node: true },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  ],
};
