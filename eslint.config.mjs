import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  astro: true,
  unocss: true,
}, {
  files: ['tests/unit/**/*.ts', 'tests/artifacts/**/*.ts'],
  rules: {
    // These suites use the Node.js test runner configured in package.json.
    'test/no-import-node-test': 'off',
  },
})
