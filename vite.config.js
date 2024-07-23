/** @type {import('vite').UserConfig} */
export default {
  build: {
    lib: {
      name: 'JSONQuery',
      entry: 'src/jsonquery.ts',
      formats: ['es'],
      fileName: 'jsonquery'
    },
    outDir: './lib',
    sourcemap: true,
    minify: true
  }
}
