import { defineConfig } from 'vite';
export default defineConfig({
  root: './inject-src',
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
        discordExecutor: 'inject-src/discordExecutor.ts',
      },
      output: {
        dir: 'assets/',
        entryFileNames: 'discordExecutor.js'
      },
    },
  },
});
