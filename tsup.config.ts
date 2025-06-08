import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['lib/index.ts'],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: false, // Set to true if you want minified output
  sourcemap: true, // Optional: helpful for debugging
});
