/** @type {import('vite').UserConfig} */
export default {
  build: {
    lib: {
      entry: 'src/jsonquery.ts',
      formats: ['es']
    },
    outDir: './lib',
    sourcemap: true
  },
  coverage: {
    provider: 'v8'
  }
}
