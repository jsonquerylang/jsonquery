/** @type {import('vite').UserConfig} */
export default {
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es']
    },
    outDir: './lib',
    sourcemap: true
  },
  coverage: {
    provider: 'v8'
  }
}
