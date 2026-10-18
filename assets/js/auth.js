/* Shared auth: lazy Supabase client, navbar state, form prefill. Exposes window.BSXAuth.
 * The Supabase library is only downloaded when a stored session or an auth redirect
 * exists, or on the sign-in page, so ordinary visitors never pay for it. */
(function () {
  'use strict';

  var cfg = window.BSX_CONFIG || {};
  var root = document.body.dataset.root || '';

  var STORE_KEY = 'bsx-auth';        // Supabase session storage key (managed by supabase-js)
  var REG_KEY = 'bsx_registered';    // non-sensitive flag: this browser has registered before
  var LIB_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.99.3/dist/umd/supabase.js';
  var LIB_SRI = 'sha384-DvC+YdtlL7wvOOuSrDKDL78GehYjJ2hsSfAWUFv5Rz7YcdCjlLMADTYKYym7cZrB';

  var ICON =
    '<svg class="auth-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"></path></svg>';

  var user = null;
  var isReady = false;
  var listeners = [];
  var clientPromise = null;
  var readyResolve;
  var ready = new Promise(function (resolve) { readyResolve = resolve; });

  function configured() {
    return !!(cfg.supabaseUrl && cfg.supabaseKey);
  }

  /* ---------- Helpers ---------- */

  function displayName(u) {
    var meta = (u && u.user_metadata) || {};
    return typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
  }

  function firstName(u) {
    var name = displayName(u);
    if (name) return name.split(/\s+/)[0];
    var email = (u && u.email) || '';
    return email ? email.split('@')[0] : 'Account';
  }

  function hasRegistered() {
    try { return localStorage.getItem(REG_KEY) === '1'; } catch (e) { return false; }
  }

  function markRegistered() {
    try { localStorage.setItem(REG_KEY, '1'); } catch (e) { /* storage unavailable */ }
  }

  function absUrl(path) {
    return new URL(root + path, window.location.href).href;
  }

  function whatsappUrl(message) {
    var number = String(cfg.whatsappNumber || '').replace(/\D/g, '');
    if (!number) return '';
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
  }

  /* ---------- Navbar ---------- */

  function navLinks() {
    return Array.prototype.slice.call(document.querySelectorAll('.nav-signup, .menu-signup'));
  }

  function setPending(on) {
    navLinks().forEach(function (a) {
      if (on) a.setAttribute('data-auth-pending', '');
      else a.removeAttribute('data-auth-pending');
    });
  }

  function updateNav() {
    navLinks().forEach(function (a) {
      a.removeAttribute('data-auth-pending');
      var key = user ? 'in:' + firstName(user) : 'out';
      if (a.dataset.authKey === key) return;
      a.dataset.authKey = key;
      if (user) {
        var name = firstName(user);
        a.href = root + 'account/';
        a.innerHTML = ICON + '<span class="auth-name"></span>';
        a.querySelector('.auth-name').textContent = name;
        a.setAttribute('aria-label', 'Account: ' + name);
      } else {
        a.href = root + 'sign-in/';
        a.textContent = 'Sign In';
        a.removeAttribute('aria-label');
      }
    });
  }

  /* ---------- Form prefill ---------- */

  /* Inputs opt in with data-prefill="name" or data-prefill="email".
   * A value is only written when the field is empty or still holds the last
   * value we wrote, so anything the visitor typed is never overwritten. */
  function applyPrefill() {
    var fields = document.querySelectorAll('[data-prefill]');
    Array.prototype.forEach.call(fields, function (input) {
      if (!input.dataset.prefillBound) {
        input.dataset.prefillBound = '1';
        input.addEventListener('input', function () { input.dataset.touched = '1'; });
      }
      var kind = input.dataset.prefill;
      var next = '';
      if (user) next = kind === 'email' ? (user.email || '') : kind === 'name' ? displayName(user) : '';
      var last = input.dataset.prefilled || '';
      var current = input.value;
      if (current !== '' && current !== last) return;
      if (current === '' && input.dataset.touched === '1') return;
      if (current !== next) input.value = next;
      input.dataset.prefilled = next;
    });
  }

  /* ---------- State ---------- */

  function setUser(next, event) {
    user = next || null;
    updateNav();
    applyPrefill();
    if (!isReady) {
      isReady = true;
      readyResolve(user);
    }
    listeners.slice().forEach(function (fn) {
      try { fn(user, event); } catch (err) { console.error(err); }
    });
  }

  function onChange(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (item) { return item !== fn; });
    };
  }

  /* ---------- Supabase client ---------- */

  function loadLib() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) { resolve(window.supabase); return; }
      var s = document.createElement('script');
      s.src = LIB_URL;
      s.integrity = LIB_SRI;
      s.crossOrigin = 'anonymous';
      s.async = true;
      s.onload = function () {
        if (window.supabase && window.supabase.createClient) resolve(window.supabase);
        else reject(new Error('Supabase library did not initialise'));
      };
      s.onerror = function () { reject(new Error('Supabase library failed to load')); };
      document.head.appendChild(s);
    });
  }

  function getClient() {
    if (!configured()) {
      return Promise.reject(new Error('Supabase is not configured. Set supabaseUrl and supabaseKey in assets/js/config.js.'));
    }
    if (clientPromise) return clientPromise;
    clientPromise = loadLib().then(function (lib) {
      var client = lib.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
        auth: {
          storageKey: STORE_KEY,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      });
      // Keep this callback synchronous and free of Supabase calls (avoids auth lock deadlocks).
      client.auth.onAuthStateChange(function (event, session) {
        setUser(session ? session.user : null, event);
      });
      return client;
    }, function (err) {
      clientPromise = null;
      throw err;
    });
    return clientPromise;
  }

  function hasStoredSession() {
    try { return !!localStorage.getItem(STORE_KEY); } catch (e) { return false; }
  }

  function hasAuthParams() {
    return /[?&#](code|access_token|error|error_code)=/.test(window.location.search + window.location.hash);
  }

  function start() {
    if (!configured()) {
      if (document.body.hasAttribute('data-auth-page')) {
        console.error('[auth] Supabase is not configured. Set supabaseUrl and supabaseKey in assets/js/config.js.');
      }
      setUser(null, 'UNCONFIGURED');
      return;
    }
    var stored = hasStoredSession();
    var eager = document.body.hasAttribute('data-auth-eager');
    if (!stored && !eager && !hasAuthParams()) {
      setUser(null, 'NO_SESSION');
      return;
    }
    if (stored) {
      setPending(true);
      // Never leave the navbar hidden if the library is slow or blocked.
      setTimeout(function () { if (!isReady) setPending(false); }, 5000);
    }
    getClient().catch(function (err) {
      console.error('[auth]', err);
      setUser(null, 'LOAD_FAILED');
    });
  }

  // A session created in another tab: pick it up if this tab never loaded the client.
  window.addEventListener('storage', function (e) {
    if (e.key === STORE_KEY && e.newValue && !clientPromise) start();
  });

  window.BSXAuth = {
    configured: configured,
    ready: ready,
    getClient: getClient,
    getUser: function () { return user; },
    onChange: onChange,
    displayName: displayName,
    firstName: firstName,
    hasRegistered: hasRegistered,
    markRegistered: markRegistered,
    url: function (path) { return root + path; },
    absUrl: absUrl,
    whatsappUrl: whatsappUrl
  };

  start();
})();
