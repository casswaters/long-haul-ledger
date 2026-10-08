/**
 * Long Haul Ledger: free Monday Haul email sign-up (Buttondown, email only, double opt-in).
 * Everything is free. No pricing, no paywall, no passwords.
 *
 * Turn the box on or off here. With `enabled: false` (or no username) nothing renders and the
 * footer keeps its "coming soon" note. The archive page stays unlinked until `archive: true`.
 */
export const SIGNUP = {
  enabled: true,
  username: 'longhaulledger',
  archive: false,
};

export const SIGNUP_COPY = {
  title: 'Get the Monday Haul, free',
  promise: 'One short email each Monday: the week\u2019s most important energy and sector stories, each with its source and date.',
  privacy: 'No spam. Unsubscribe anytime.',
  button: 'Sign up free',
  label: 'Email address',
  thanks: 'Thanks. Check your inbox to confirm your sign-up.',
  invalid: 'Enter a valid email address.',
};

/** Buttondown embed endpoint for a username. */
export function signupEndpoint(username = SIGNUP.username) {
  return `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(username)}`;
}

export function signupActive(cfg = SIGNUP) {
  return !!(cfg && cfg.enabled && typeof cfg.username === 'string' && /^[A-Za-z0-9_-]{2,64}$/.test(cfg.username));
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Markup for one sign-up box. `compact` is the small version under the news column. */
export function signupHtml({ id = 'signup', compact = false, cfg = SIGNUP } = {}) {
  const c = SIGNUP_COPY;
  return `<form class="signup${compact ? ' signup-compact' : ''}" id="${esc(id)}" action="${esc(signupEndpoint(cfg.username))}" method="post" target="_blank" novalidate data-signup aria-labelledby="${esc(id)}-title">
    <p class="signup-title" id="${esc(id)}-title">${esc(c.title)}</p>
    ${compact ? '' : `<p class="signup-promise">${esc(c.promise)}</p>`}
    <div class="signup-row">
      <label class="visually-hidden" for="${esc(id)}-email">${esc(c.label)}</label>
      <input class="signup-email" id="${esc(id)}-email" type="email" name="email" required autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" aria-describedby="${esc(id)}-msg">
      <input type="hidden" name="embed" value="1">
      <button class="signup-btn" type="submit">${esc(c.button)}</button>
    </div>
    <p class="signup-msg" id="${esc(id)}-msg" role="status" aria-live="polite">${esc(c.privacy)}</p>
  </form>`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Submit in the background and show the thanks state; without JS the form still posts to Buttondown. */
export function wireSignup(form, { fetchImpl = (...a) => fetch(...a) } = {}) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type=email]');
    const msg = form.querySelector('.signup-msg');
    const email = (input.value || '').trim();
    if (!EMAIL_RE.test(email)) {
      msg.textContent = SIGNUP_COPY.invalid;
      form.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    form.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    const btn = form.querySelector('button');
    btn.disabled = true;
    const body = new FormData(form);
    body.set('email', email);
    fetchImpl(form.action, { method: 'POST', body, mode: 'no-cors' })
      .then(() => {
        form.classList.add('is-done');
        form.querySelector('.signup-row').hidden = true;
        msg.textContent = SIGNUP_COPY.thanks;
        msg.setAttribute('tabindex', '-1');
        msg.focus({ preventScroll: true });
      })
      .catch(() => { btn.disabled = false; form.submit(); });
  });
}

/** Render the boxes into their slots: under the news column and in the footer. */
export function mountSignup(doc = document, cfg = SIGNUP) {
  if (!signupActive(cfg)) return 0;
  let n = 0;
  const rail = doc.getElementById('signup-rail');
  if (rail) { rail.innerHTML = signupHtml({ id: 'signup-rail-form', compact: true, cfg }); rail.hidden = false; n++; }
  const foot = doc.getElementById('signup-footer');
  if (foot) { foot.innerHTML = signupHtml({ id: 'signup-footer-form', cfg }); foot.hidden = false; n++; }
  doc.querySelectorAll('.haul-note').forEach((el) => { el.hidden = true; });
  doc.querySelectorAll('form[data-signup]').forEach((f) => wireSignup(f));
  return n;
}
