import { defineConfig } from 'vite';
import { appVersionPlugin } from './scripts/app-version-plugin.mjs';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [appVersionPlugin()],
  build: {
    rolldownOptions: { input: { app: 'index.html', analytics: 'analytics/index.html', beheer: 'beheer/index.html' } },
  },
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.data/**', '**/server/**', '**/*.sqlite*', '**/.task-backup/**', '**/sources/**'] },
  },
});
