/**
 * Long Haul Ledger: free Monday Haul sign-up (Buttondown embed, email only) and the
 * unlinked archive scaffold. No network calls; the live endpoint is never posted to.
 */
import { readFileSync } from 'fs';
import { SIGNUP, SIGNUP_COPY, signupEndpoint, signupActive, signupHtml } from './signup.js';
import { validateHaul, haulHtml } from './scripts/check-haul.mjs';

let pass = 0, fail = 0;
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const BAD = /[\u2014~]/;
const MONEY = /paywall|pricing|premium|paid (?:tier|plan|subscription)|\$\d|per month|\/mo\b|upgrade|trial/i;

console.log('\n--- Config ---');
assert('Buttondown username is longhaulledger', SIGNUP.username === 'longhaulledger');
assert('endpoint is the Buttondown embed URL', signupEndpoint() === 'https://buttondown.com/api/emails/embed-subscribe/longhaulledger');
assert('flag on with a valid username', signupActive() === true);
assert('flag off or bad username renders nothing', !signupActive({ enabled: false, username: 'longhaulledger' }) && !signupActive({ enabled: true, username: '' }) && !signupActive({ enabled: true, username: 'a b/c' }));
assert('archive stays off until the first issue', SIGNUP.archive === false);

console.log('\n--- Markup ---');
const full = signupHtml({ id: 't' });
const compact = signupHtml({ id: 'c', compact: true });
assert('form posts to the endpoint', /<form [^>]*action="https:\/\/buttondown\.com\/api\/emails\/embed-subscribe\/longhaulledger"[^>]*method="post"/.test(full));
assert('email field is required, type email, named email, labelled', /<input class="signup-email" id="t-email" type="email" name="email" required autocomplete="email"/.test(full) && /<label class="visually-hidden" for="t-email">Email address<\/label>/.test(full));
assert('embed flag sent', /<input type="hidden" name="embed" value="1">/.test(full));
assert('no password or name fields', !/type="password"|name="(?:password|name|first_name)"/.test(full));
assert('title, promise and privacy line', full.includes('Get the Monday Haul, free') && full.includes(SIGNUP_COPY.promise) && full.includes('No spam. Unsubscribe anytime.'));
assert('compact box drops the promise, keeps privacy', !compact.includes(SIGNUP_COPY.promise) && compact.includes('No spam. Unsubscribe anytime.'));
assert('status line is live for the thanks state', /class="signup-msg" id="t-msg" role="status" aria-live="polite"/.test(full));
assert('thanks copy asks to confirm', SIGNUP_COPY.thanks === 'Thanks. Check your inbox to confirm your sign-up.');
assert('button is 44px tall in CSS', /\.signup-btn \{[^}]*min-height: 44px;/.test(read('./styles.css')) && /\.signup-email \{[^}]*min-height: 44px;/.test(read('./styles.css')));

console.log('\n--- Voice: free, sober ---');
const copy = JSON.stringify(SIGNUP_COPY) + full;
assert('no em dash or tilde', !BAD.test(copy));
assert('no pricing, paywall or paid language', !MONEY.test(JSON.stringify(SIGNUP_COPY)));
const html = read('./index.html');
assert('index.html has no pricing or paywall copy', !/paywall|pricing|paid tier|premium/i.test(html.replace(/<!--[\s\S]*?-->/g, '')));

console.log('\n--- Placement ---');
assert('slot under the news column', /<div class="feed" id="feed"><\/div>\s*<div class="signup-slot signup-slot-rail" id="signup-rail" hidden><\/div>/.test(html));
assert('slot in the footer, with the coming-soon fallback kept for flag off', /id="signup-footer" hidden><\/div>\s*<p class="haul-note">/.test(html));
assert('not in the header tab row', !/<nav class="sector-nav"[\s\S]*?signup[\s\S]*?<\/nav>/.test(html));
assert('app mounts the boxes', /import \{ mountSignup \} from '\.\/signup\.js';/.test(read('./app.js')) && /mountSignup\(document\);/.test(read('./app.js')));
const sw = read('./sw.js');
assert('SW v29 caches signup.js', /long-haul-ledger-v29/.test(sw) && /'\.\/signup\.js'/.test(sw));

console.log('\n--- Archive scaffold (unlinked, off Pages) ---');
const wf = read('./.github/workflows/soft-launch.yml');
assert('archive.html and data/monday-haul excluded from Pages', /archive\.html/.test(wf) && /data\/monday-haul/.test(wf) && /signup\.test\.mjs/.test(wf));
assert('nothing links to the archive', !/archive\.html/.test(html) && !/archive\.html/.test(read('./app.js')));
const issues = JSON.parse(read('./data/monday-haul/issues.json'));
assert('issues file is empty and valid', issues.version === 1 && Array.isArray(issues.issues) && issues.issues.length === 0);
const arch = read('./archive.html');
assert('archive page is noindex, shows an honest empty state', /<meta name="robots" content="noindex">/.test(arch) && /No issues yet\./.test(arch) && !BAD.test(arch));

console.log('\n--- Monday Haul drafts (hauls/, off Pages) ---');
const exList = (wf.match(/exclude_assets:\s*'([^']*)'/) || [])[1].split(',');
assert('hauls/ excluded from Pages', exList.includes('hauls'));
const example = read('./hauls/EXAMPLE-2026-10-05.md');
const ev = validateHaul(example);
assert('approved sample passes the checker', !ev.errors.length && ev.items.length === 8 && ev.items.filter((i) => i.section === 'energy').length === 5, ev.errors.join(' | '));
assert('template is not a valid issue (placeholders)', validateHaul(read('./hauls/TEMPLATE.md')).errors.some((e) => /placeholder/.test(e)));
assert('checker rejects an item without a dated source', validateHaul(example.replace('Source: [World Nuclear News](https://www.world-nuclear-news.org/articles/chinas-tianwan-7-connected-to-the-grid) (Oct 8)', 'Source: World Nuclear News')).errors.some((e) => /item 4/.test(e)));
assert('checker rejects a link without its date', validateHaul(example.replace('connected-to-the-grid) (Oct 8)', 'connected-to-the-grid)')).errors.some((e) => /needs a date/.test(e)));
assert('checker rejects em dashes and promo above the footer', validateHaul(example.replace('in plain words.', 'in plain words \u2014 sign up today.')).errors.length >= 2);
assert('checker rejects fewer than 6 items', validateHaul(example.replace(/\*\*[678]\. /g, '')).errors.some((e) => /6 to 8/.test(e)));
assert('footer keeps the unsubscribe link', /\{\{ unsubscribe_url \}\}/.test(example.split('\n---\n')[1] || '') && /\{\{ unsubscribe_url \}\}/.test(read('./hauls/TEMPLATE.md')));
assert('rendered HTML has every source link', ev.links.every((u) => haulHtml(example).includes(`href="${u}"`)));
const rr = read('./RESEARCH-RUNS.md');
const hs = rr.slice(rr.indexOf('## Monday Haul'));
assert('RESEARCH-RUNS has the Monday Haul routine', rr.includes('## Monday Haul') && /7:46 AM MT/.test(hs) && /6 to 8 items/.test(hs) && /about 5 under `## Energy`/.test(hs) && /World stories\s+first, then the United States/.test(hs));
assert('routine never sends email', /never send email, never call the\s+Buttondown API/.test(hs));
assert('routine requires the checker and HTTP 200 links', /npm run haul:check -- hauls\/YYYY-MM-DD\.md --links --html/.test(hs) && /HTTP 200/.test(hs));
assert('routine has the footer exception to rule 5, email only', /Footer exception to rule 5 \(email only\)/.test(hs) && /exception: the footer of the Monday Haul email/.test(rr));
assert('routine leaves the archive off', /archive` flag in `signup\.js`/.test(hs) && SIGNUP.archive === false);
assert('no em dash or tilde in the routine, template or sample', !BAD.test(hs) && !BAD.test(read('./hauls/TEMPLATE.md')) && !BAD.test(example));
assert('BUILD-PLAN section 2 marked paid, deferred / superseded', /## 2\. The Monday Haul template\n\n> \*\*Status: paid, deferred \/ superseded for the free Haul/.test(read('./BUILD-PLAN.md')));
assert('npm run haul:check exists', JSON.parse(read('./package.json')).scripts['haul:check'] === 'node scripts/check-haul.mjs');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
