# Private-study privacy information

The user confirmed personal/private use, no company, and no intended public service. Privacy & opslag and Gebruik & contact contain practical facts rather than company terms. Both, plus existing source/license notices, are accessible before login and through the account menu. No controller identity or contact address was invented: private users are directed to the person who shared the app.

The required login checkbox acknowledges the information. It is separate from the optional, initially unchecked analytics choice. Server entry requires the current notice version and an explicit acknowledgement. Sessions predating this change need a fresh username entry, while account IDs and local learning data remain intact.

Analytics permission belongs to the current session. The server blocks recording while permission is absent; the browser sends no activity or lesson events by default. The Privacy & opslag toggle changes permission without ending the study session. Turning it off drops pending local analytics events. Existing server-side activity remains until the operator handles a deletion request. Accounts have no automatic expiry; the notice says so. This is implementation documentation, not a certification of legal compliance.

Actual boundaries matter: username-only login accepts new usernames and does not enforce invitations or identify the user. The code therefore does not claim that hosting is access-restricted. The personal/household exception must be assessed against the actual audience and processing. Before expanding beyond private use, review operator identification/contact, applicable legal bases, retention, rights handling, hosting contracts/transfers, and access controls.

Official sources checked on 5 October 2026:
- [AP: personal/household use and legal bases](https://autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslagen-avg-uitgelegd)
- [AP: information duty](https://autoriteitpersoonsgegevens.nl/nl/zelf-doen/privacyrechten/recht-op-informatie)
- [AP: cookies](https://autoriteitpersoonsgegevens.nl/nl/onderwerpen/internet-telefoon-tv-en-post/cookies)
- [EDPB: lawful processing and separate consent](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en)
- [Cloudflare: data processing addendum](https://www.cloudflare.com/cloudflare-customer-dpa/)

Verification: all 140 tests passed, including acknowledgement rejection, legacy-session migration, analytics refusal/withdrawal, and pending-buffer cleanup. Build passed. Browser checks covered login validation, pre-login dialogs, keyboard/Escape/focus restoration, opt-in/withdrawal/reload, unrelated learning storage preservation, 320/390/1280px overflow and emulated mobile taps. Screenshots are in output/playwright/privacy-*.png. No physical-device or screen-reader check was performed. No deployment was requested in this chat.

Release integration: the isolated account-privacy checkout was based on the latest origin/main, preserving the merged home-screen installation. All 143 current tests, the production build and Cloudflare Worker dry-run passed. Local data, secrets, browser artifacts and unrelated logo work were excluded.
