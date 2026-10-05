import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: {
    rolldownOptions: { input: { app: 'index.html', analytics: 'analytics/index.html', beheer: 'beheer/index.html' } },
  },
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.data/**', '**/server/**', '**/*.sqlite*', '**/.task-backup/**', '**/sources/**'] },
  },
});
