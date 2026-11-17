import { readFile } from 'node:fs/promises';

// Keep one learning-page template while removing server-only controls from the
// static edition before Vite discovers its module entry point.
export function staticEditionPlugin({ origin = 'https://ivojnk.github.io' } = {}) {
  const publicOrigin = new URL(origin).origin;
  return {
    name: 'motionstudy-static-edition',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        function replace(pattern, replacement) {
          if (!pattern.test(html)) throw new Error('Static template is missing ' + pattern);
          html = html.replace(pattern, replacement);
        }
        replace(/src="\/src\/bootstrap\.js"/, 'src="/src/static-bootstrap.js"');
        replace(/<meta name="app-version"/, '<meta name="app-edition" content="static" />\n  <meta name="app-version"');
        html = html.replaceAll('https://lottequiz-motionstudy.jonkersivo.workers.dev', publicOrigin);
        replace(/<div id="login-install">[\s\S]*?<\/div>/, '');
        replace(/<section id="account-screen"[\s\S]*?<\/section>/,
          '<p id="static-loading" class="account-screen" role="status">Laden…</p>');
        replace(/<summary aria-label="Accountmenu">/, '<summary aria-label="Appmenu">');
        replace(/<div class="account-menu-heading">[\s\S]*?<\/div>/,
          '<div class="account-menu-heading"><strong>Op dit apparaat</strong></div>');
        replace(/<button id="account-logout"[\s\S]*?<\/button>/, '');
        replace(/<span id="logout-message"[\s\S]*?<\/span>/, '');
        const progressTransfer = html.match(/<section id="progress-transfer"[\s\S]*?<\/section>/)?.[0];
        if (!progressTransfer) throw new Error('Static template is missing progress transfer controls');
        replace(/<dialog id="privacy"[\s\S]*?<\/dialog>/, `
  <dialog id="privacy" class="legal-dialog" aria-labelledby="privacy-title">
    <button class="close-dialog" data-legal-close type="button" aria-label="Sluiten" autofocus><img class="icon" src="./icons/x.svg" alt="" /></button>
    <h2 id="privacy-title">Privacy & opslag</h2>
    <p>Je gebruikt deze versie zonder account. De app verzamelt geen gebruiksstatistieken.</p>
    <p>Antwoorden, scores, XP, herhaalplanning en onafgemaakte lessen blijven in deze browser. Ze worden niet naar een server verstuurd en synchroniseren niet met andere apparaten.</p>
    <p>Iedereen die deze browser op dit apparaat gebruikt, kan dezelfde voortgang openen. Sitegegevens wissen verwijdert je voortgang.</p>
    ${progressTransfer}
    <p>De hostingdienst verwerkt technisch verkeer wanneer je de app laadt. Zie de <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">privacyinformatie van GitHub</a>.</p>
  </dialog>`);
        replace(/<p>Gebruik je eigen account\.[\s\S]*?<\/p>/,
          '<p>Je voortgang hoort bij deze browser. Gebruik steeds hetzelfde apparaat en dezelfde browser om verder te leren.</p>');
        replace(/Vragen, fouten of accountverzoeken\?/, 'Vragen of fouten?');
        return html;
      },
    },
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
      for (const fileName of ['LICENSE', 'ATTRIBUTION.md']) {
        this.emitFile({ type: 'asset', fileName, source: await readFile(new URL('../' + fileName, import.meta.url), 'utf8') });
      }
    },
  };
}
