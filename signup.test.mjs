/**
 * Long Haul Ledger: free Monday Haul sign-up (Buttondown embed, email only) and the
 * unlinked archive scaffold. No network calls; the live endpoint is never posted to.
 */
import { readFileSync } from 'fs';
import { SIGNUP, SIGNUP_COPY, signupEndpoint, signupActive, signupHtml } from './signup.js';

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
assert('SW v27 caches signup.js', /long-haul-ledger-v27/.test(sw) && /'\.\/signup\.js'/.test(sw));

console.log('\n--- Archive scaffold (unlinked, off Pages) ---');
const wf = read('./.github/workflows/soft-launch.yml');
assert('archive.html and data/monday-haul excluded from Pages', /archive\.html/.test(wf) && /data\/monday-haul/.test(wf) && /signup\.test\.mjs/.test(wf));
assert('nothing links to the archive', !/archive\.html/.test(html) && !/archive\.html/.test(read('./app.js')));
const issues = JSON.parse(read('./data/monday-haul/issues.json'));
assert('issues file is empty and valid', issues.version === 1 && Array.isArray(issues.issues) && issues.issues.length === 0);
const arch = read('./archive.html');
assert('archive page is noindex, shows an honest empty state', /<meta name="robots" content="noindex">/.test(arch) && /No issues yet\./.test(arch) && !BAD.test(arch));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
