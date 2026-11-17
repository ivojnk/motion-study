import { defineConfig } from 'vite';
import { appVersionPlugin } from './scripts/app-version-plugin.mjs';
import { staticEditionPlugin } from './scripts/static-edition-plugin.mjs';

export default defineConfig(({ mode }) => {
  const staticEdition = mode === 'static';
  return {
    base: process.env.BASE_PATH || (staticEdition ? '/motion-study/' : '/'),
    plugins: [...(staticEdition ? [staticEditionPlugin({ origin: process.env.STATIC_ORIGIN })] : []), appVersionPlugin()],
    build: {
      outDir: staticEdition ? 'dist-static' : 'dist',
      rolldownOptions: { input: staticEdition ? { app: 'index.html' } : { app: 'index.html', analytics: 'analytics/index.html', beheer: 'beheer/index.html' } },
    },
    server: {
      fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.data/**', '**/server/**', '**/*.sqlite*', '**/.task-backup/**', '**/sources/**'] },
    },
  };
});
