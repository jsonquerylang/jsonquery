import terser from '@rollup/plugin-terser'

export default {
  input: './src/jsonquery.js',
  output: {
    name: 'JSONQuery',
    file: 'lib/jsonquery.js',
    format: 'umd',
    compact: true,
    sourcemap: true,
    plugins: [terser()]
  }
}
