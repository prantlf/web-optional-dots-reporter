import pkg from './package.json' with { type: 'json' }

export default {
  input: 'lib/index.js',
  output: { file: pkg.main, format: 'cjs', sourcemap: true },
  external: source => !source.includes('/') || source.includes('@web/')
}
