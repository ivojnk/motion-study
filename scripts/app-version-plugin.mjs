import { createHash } from 'node:crypto';

export function appVersionPlugin() {
  return {
    name: 'motionstudy-app-version',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const hash = createHash('sha256');
        for (const name of Object.keys(bundle).sort()) {
          const file = bundle[name];
          hash.update(name).update(file.type === 'chunk' ? file.code : file.source);
        }
        const version = hash.digest('hex');
        const html = bundle['index.html'];
        if (!html || html.type !== 'asset') throw new Error('App version requires index.html');
        if (!String(html.source).includes('name="app-version" content="development"')) throw new Error('Missing app version meta tag');
        html.source = String(html.source).replace('name="app-version" content="development"', `name="app-version" content="${version}"`);
        this.emitFile({ type: 'asset', fileName: 'app-version.json', source: JSON.stringify({ version }) });
      },
    },
  };
}
