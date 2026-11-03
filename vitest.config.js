import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Fixed UTC+2 zone with no DST (POSIX-style Etc id: GMT-2 == UTC+2) so local-time output is deterministic.
    env: { TZ: 'Etc/GMT-2' },
    setupFiles: ['./src/setupTests.js'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.jsx', 'src/**/*.js'],
    },
  },
});
