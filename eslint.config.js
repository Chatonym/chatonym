const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDir: __dirname,
  resolvePluginsRelativeTo: __dirname,
})

module.exports = compat.config({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'simple-import-sort'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    mocha: true,
  },
  ignorePatterns: ['dist/**/*.js', 'bot.js'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'off',
    'func-names': 'off',
    'no-process-exit': 'off',
    'object-shorthand': 'off',
    'class-methods-use-this': 'off',
    'global-require': 'off',
    'no-restricted-syntax': [
      'error',
      { selector: 'ForInStatement', message: 'Do not use for..in loops.' },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode',
      },
    ],
    camelcase: [
      'error',
      {
        ignoreDestructuring: true,
        allow: ['[^_]{2,}_(?:lt|le|gt|ge|in|nin|neq|eq|like|null)'],
      },
    ],
    'no-continue': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'simple-import-sort/imports': 'warn',
  },
  overrides: [
    {
      files: '*.spec.js',
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    {
      files: '*.js',
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
})
