/* Sign-in page: create account, sign in, forgot password, password reset. */
(function () {
  'use strict';

  var A = window.BSXAuth;
  if (!A) return;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var DUPLICATE_MSG = 'We could not create an account with these details. If you already have one, sign in or reset your password.';

  function $(id) { return document.getElementById(id); }

  var loadingEl = $('auth-loading');
  var uiEl = $('auth-ui');
  var banner = $('auth-banner');
  var tablist = $('auth-tabs');
  var tabs = { create: $('tab-create'), signin: $('tab-signin') };
  var panels = { create: $('panel-create'), signin: $('panel-signin'), forgot: $('panel-forgot'), reset: $('panel-reset') };

  var params = new URLSearchParams(window.location.search);
  var hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  var resetFlow = params.get('reset') === '1';
  var hadCode = params.has('code');
  var linkError = hashParams.get('error_description') || params.get('error_description') || '';

  var inRecovery = resetFlow;
  var shown = false;
  var redirecting = false;

  /* ---------- Messages ---------- */

  function setMsg(el, text, kind) {
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.className = 'auth-msg auth-msg--' + (kind || 'error');
    el.textContent = text;
    el.hidden = false;
  }

  function setBanner(text, kind) { setMsg(banner, text, kind); }

  function fieldError(id, message) {
    var input = $(id);
    var node = $('e-' + id);
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      node.textContent = message;
      node.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      node.textContent = '';
      node.hidden = true;
    }
  }

  function clearAll() {
    setBanner('');
    ['m-create', 'm-signin', 'm-forgot', 'm-reset'].forEach(function (id) { setMsg($(id), ''); });
    ['c-name', 'c-email', 'c-password', 's-email', 's-password', 'f-email', 'r-password', 'r-confirm'].forEach(function (id) { fieldError(id, ''); });
  }

  function isNetworkError(err) {
    return !!err && (err.name === 'AuthRetryableFetchError' || err.status === 0 ||
      /failed to fetch|networkerror|network request failed|load failed/i.test(err.message || ''));
  }

  function authMessage(err) {
    if (!err) return 'Something went wrong. Please try again.';
    var code = err.code || '';
    var text = String(err.message || '').toLowerCase();
    if (code === 'client_unavailable') {
      return A.configured()
        ? 'Could not load the sign-in service. Check your connection and try again.'
        : 'Accounts are not available on this site yet. Please try again later.';
    }
    if (isNetworkError(err)) return 'Could not reach the sign-in service. Check your connection and try again.';
    if (err.status === 429 || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || /rate limit|too many/.test(text)) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (code === 'weak_password' || (/password/.test(text) && /(weak|least|short|characters)/.test(text))) {
      return 'Choose a stronger password with at least 8 characters.';
    }
    if (code === 'invalid_credentials' || /invalid login credentials/.test(text)) return 'Incorrect email or password.';
    if (code === 'email_not_confirmed' || /email not confirmed/.test(text)) {
      return 'Please verify your email address first. Check your inbox for the confirmation link.';
    }
    if (code === 'user_already_exists' || /already registered/.test(text)) return DUPLICATE_MSG;
    if (code === 'signup_disabled') return 'New sign-ups are currently disabled.';
    if (code === 'same_password') return 'Choose a password different from your current one.';
    if (code === 'email_address_invalid' || code === 'validation_failed') return 'Enter a valid email address.';
    if (/session missing/.test(text)) return 'This reset link has expired. Request a new one.';
    return 'Something went wrong. Please try again.';
  }

  function withClient() {
    return A.getClient().catch(function (err) {
      console.error('[auth]', err);
      var wrapped = new Error(err && err.message);
      wrapped.code = 'client_unavailable';
      throw wrapped;
    });
  }

  function setBusy(form, on, label) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (on) {
      button.dataset.label = button.textContent;
      button.textContent = label;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.label || button.textContent;
      button.disabled = false;
    }
  }

  function goAccount() {
    if (redirecting) return;
    redirecting = true;
    window.location.replace(A.url('account/'));
  }

  /* ---------- Tabs and panels ---------- */

  function showTab(name, focusTab) {
    ['create', 'signin'].forEach(function (key) {
      var selected = key === name;
      tabs[key].setAttribute('aria-selected', String(selected));
      tabs[key].tabIndex = selected ? 0 : -1;
      panels[key].hidden = !selected;
    });
    tablist.hidden = false;
    panels.forgot.hidden = true;
    panels.reset.hidden = true;
    clearAll();
    if (focusTab) tabs[name].focus();
  }

  function showPanel(name) {
    tablist.hidden = true;
    panels.create.hidden = true;
    panels.signin.hidden = true;
    panels.forgot.hidden = name !== 'forgot';
    panels.reset.hidden = name !== 'reset';
    var heading = $(name + '-title');
    if (heading) heading.focus({ preventScroll: true });
  }

  tabs.create.addEventListener('click', function () { showTab('create'); });
  tabs.signin.addEventListener('click', function () { showTab('signin'); });
  tablist.addEventListener('keydown', function (e) {
    var order = ['create', 'signin'];
    var current = tabs.create.getAttribute('aria-selected') === 'true' ? 0 : 1;
    var next = null;
    if (e.key === 'ArrowRight') next = (current + 1) % 2;
    else if (e.key === 'ArrowLeft') next = (current + 1) % 2;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 1;
    if (next === null) return;
    e.preventDefault();
    showTab(order[next], true);
  });

  $('open-forgot').addEventListener('click', function () {
    var typed = $('s-email').value.trim();
    clearAll();
    showPanel('forgot');
    if (typed && !$('f-email').value) $('f-email').value = typed;
  });
  $('back-signin').addEventListener('click', function () { showTab('signin', true); });

  /* ---------- Create account ---------- */

  $('form-create').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var msg = $('m-create');
    var name = $('c-name').value.trim().replace(/\s+/g, ' ');
    var email = $('c-email').value.trim();
    var password = $('c-password').value;

    setMsg(msg, '');
    var errors = {
      'c-name': name.length < 2 ? 'Enter your full name.' : name.length > 80 ? 'Use 80 characters or fewer.' : '',
      'c-email': !EMAIL_RE.test(email) ? 'Enter a valid email address.' : '',
      'c-password': password.length < 8 ? 'Use at least 8 characters.' : password.length > 72 ? 'Use 72 characters or fewer.' : ''
    };
    var firstBad = null;
    Object.keys(errors).forEach(function (id) {
      fieldError(id, errors[id]);
      if (errors[id] && !firstBad) firstBad = id;
    });
    if (firstBad) { $(firstBad).focus(); return; }

    setBusy(form, true, 'Creating account…');
    withClient().then(function (client) {
      return client.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: name }, emailRedirectTo: A.absUrl('sign-in/') }
      });
    }).then(function (res) {
      if (res.error) throw res.error;
      var data = res.data || {};
      // With email confirmation on, an existing address comes back as a user with no identities.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setMsg(msg, DUPLICATE_MSG, 'error');
        return;
      }
      A.markRegistered();
      if (data.session) { goAccount(); return; }
      form.reset();
      setMsg(msg, 'Almost there. We sent a verification link to ' + email + '. Verify your email first, then sign in.', 'ok');
    }).catch(function (err) {
      setMsg(msg, authMessage(err), 'error');
    }).then(function () {
      if (!redirecting) setBusy(form, false);
    });
  });

  /* ---------- Sign in ---------- */

  $('form-signin').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var msg = $('m-signin');
    var email = $('s-email').value.trim();
    var password = $('s-password').value;

    setMsg(msg, '');
    var errors = {
      's-email': !EMAIL_RE.test(email) ? 'Enter a valid email address.' : '',
      's-password': !password ? 'Enter your password.' : ''
    };
    var firstBad = null;
    Object.keys(errors).forEach(function (id) {
      fieldError(id, errors[id]);
      if (errors[id] && !firstBad) firstBad = id;
    });
    if (firstBad) { $(firstBad).focus(); return; }

    setBusy(form, true, 'Signing in…');
    withClient().then(function (client) {
      return client.auth.signInWithPassword({ email: email, password: password });
    }).then(function (res) {
      if (res.error) throw res.error;
      A.markRegistered();
      goAccount();
    }).catch(function (err) {
      setMsg(msg, authMessage(err), 'error');
    }).then(function () {
      if (!redirecting) setBusy(form, false);
    });
  });

  /* ---------- Forgot password ---------- */

  $('form-forgot').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var msg = $('m-forgot');
    var email = $('f-email').value.trim();

    setMsg(msg, '');
    fieldError('f-email', !EMAIL_RE.test(email) ? 'Enter a valid email address.' : '');
    if (!EMAIL_RE.test(email)) { $('f-email').focus(); return; }

    setBusy(form, true, 'Sending…');
    withClient().then(function (client) {
      return client.auth.resetPasswordForEmail(email, { redirectTo: A.absUrl('sign-in/?reset=1') });
    }).then(function (res) {
      // Same answer whether or not the address has an account. Only transport and rate-limit problems are shown.
      if (res.error && (isNetworkError(res.error) || res.error.status === 429 || /rate limit/i.test(res.error.message || ''))) {
        throw res.error;
      }
      setMsg(msg, 'If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.', 'ok');
    }).catch(function (err) {
      setMsg(msg, authMessage(err), 'error');
    }).then(function () {
      setBusy(form, false);
    });
  });

  /* ---------- Set new password ---------- */

  $('form-reset').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var msg = $('m-reset');
    var password = $('r-password').value;
    var confirm = $('r-confirm').value;

    setMsg(msg, '');
    var errors = {
      'r-password': password.length < 8 ? 'Use at least 8 characters.' : password.length > 72 ? 'Use 72 characters or fewer.' : '',
      'r-confirm': confirm !== password ? 'Passwords do not match.' : ''
    };
    var firstBad = null;
    Object.keys(errors).forEach(function (id) {
      fieldError(id, errors[id]);
      if (errors[id] && !firstBad) firstBad = id;
    });
    if (firstBad) { $(firstBad).focus(); return; }

    setBusy(form, true, 'Updating…');
    withClient().then(function (client) {
      return client.auth.updateUser({ password: password });
    }).then(function (res) {
      if (res.error) throw res.error;
      A.markRegistered();
      setMsg(msg, 'Password updated. Taking you to your account…', 'ok');
      window.setTimeout(goAccount, 1000);
    }).catch(function (err) {
      setMsg(msg, authMessage(err), 'error');
      setBusy(form, false);
    });
  });

  /* ---------- Auth state ---------- */

  function reveal() {
    if (shown) return;
    shown = true;
    loadingEl.hidden = true;
    uiEl.hidden = false;
  }

  A.onChange(function (user, event) {
    if (event === 'PASSWORD_RECOVERY') {
      inRecovery = true;
      if (shown) showPanel('reset');
      return;
    }
    if (user && event === 'SIGNED_IN' && !inRecovery) goAccount();
  });

  A.ready.then(function (user) {
    if (inRecovery && user) {
      reveal();
      showPanel('reset');
    } else if (user) {
      goAccount();
      return;
    } else if (resetFlow) {
      reveal();
      showPanel('forgot');
      setBanner('That reset link is invalid or has expired. Request a new one below.', 'error');
    } else {
      reveal();
      showTab(A.hasRegistered() ? 'signin' : 'create');
      if (linkError) {
        setBanner('That link is invalid or has expired. Sign in, or request a new link.', 'error');
      } else if (hadCode) {
        setBanner('If you just verified your email, sign in to continue.', 'ok');
      }
    }

    if (!A.configured()) {
      setBanner('Accounts are not available on this site yet. Please try again later.', 'error');
    } else {
      A.getClient().catch(function (err) {
        console.error('[auth]', err);
        setBanner('Could not load the sign-in service. Check your connection and reload.', 'error');
      });
    }

    // Keep one-time auth parameters out of the address bar and history.
    if (window.location.search || window.location.hash) {
      try { window.history.replaceState(null, '', window.location.pathname); } catch (err) { /* ignore */ }
    }
  });
})();
