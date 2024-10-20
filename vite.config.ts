import { defineConfig } from 'vite';

export default defineConfig({
  root: './src/injected',
  base: '/',
  server: {
    watch: {
      disableGlobbing: true,
    },
  },
  build: {
    manifest: false,
    minify: false,
    sourcemap: false,
    emptyOutDir: false,
    rollupOptions: {
      input: {
        discordExecutor: 'src/injected/index.ts',
      },
      output: {
        dir: 'assets/',
        entryFileNames: 'discordExecutor.js'
      },
    },
  },
});
