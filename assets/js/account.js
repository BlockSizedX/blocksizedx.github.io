/* Account page: requires a valid Supabase session. */
(function () {
  'use strict';

  var A = window.BSXAuth;
  if (!A) return;

  function $(id) { return document.getElementById(id); }

  var loadingEl = $('acc-loading');
  var uiEl = $('acc-ui');
  var msgEl = $('acc-msg');
  var panelName = $('panel-name');
  var panelDelete = $('panel-delete');
  var btnName = $('btn-change-name');
  var btnDelete = $('btn-delete');
  var btnSignOut = $('btn-signout');

  var user = null;
  var shown = false;
  var leaving = false;

  function leave() {
    if (leaving) return;
    leaving = true;
    window.location.replace(A.url('sign-in/'));
  }

  function setMsg(text, kind) {
    if (!text) { msgEl.hidden = true; msgEl.textContent = ''; return; }
    msgEl.className = 'auth-msg auth-msg--' + (kind || 'ok');
    msgEl.textContent = text;
    msgEl.hidden = false;
  }

  function nameError(message) {
    var input = $('n-name');
    var node = $('e-n-name');
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

  /* ---------- Rendering ---------- */

  function deleteMessage() {
    return [
      'Hello! I would like to request deletion of my BlockSizedX account.',
      '',
      'Name: ' + (A.displayName(user) || '(not set)'),
      'Email: ' + (user.email || ''),
      '',
      'Please confirm once the account has been deleted. Thank you!'
    ].join('\n');
  }

  function renderDelete() {
    var message = deleteMessage();
    var url = A.whatsappUrl(message);
    $('delete-preview').textContent = message;
    var link = $('wa-delete');
    if (url) {
      link.href = url;
      link.hidden = false;
      $('delete-unavailable').hidden = true;
    } else {
      link.hidden = true;
      $('delete-unavailable').hidden = false;
    }
  }

  function render(next) {
    user = next;
    $('acc-name').textContent = A.displayName(user) || 'Not set';
    $('acc-email').textContent = user.email || '';

    var badge = $('acc-verified');
    badge.hidden = false;
    if (user.email_confirmed_at) {
      badge.textContent = 'Verified';
      badge.className = 'account-badge';
    } else {
      badge.textContent = 'Not verified';
      badge.className = 'account-badge account-badge--warn';
    }

    var joined = user.created_at ? new Date(user.created_at) : null;
    $('acc-joined').textContent = joined && !isNaN(joined.getTime())
      ? joined.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Unknown';

    renderDelete();
  }

  function reveal() {
    if (shown) return;
    shown = true;
    loadingEl.hidden = true;
    uiEl.hidden = false;
  }

  /* ---------- Panels ---------- */

  function openPanel(which) {
    var isName = which === 'name';
    panelName.hidden = !isName;
    panelDelete.hidden = isName;
    btnName.setAttribute('aria-expanded', String(isName));
    btnDelete.setAttribute('aria-expanded', String(!isName));
    setMsg('');
    if (isName) {
      $('n-name').value = A.displayName(user);
      nameError('');
      $('n-name').focus();
    } else {
      renderDelete();
      $('delete-title').focus({ preventScroll: true });
      panelDelete.scrollIntoView({ block: 'nearest' });
    }
  }

  function closePanels() {
    panelName.hidden = true;
    panelDelete.hidden = true;
    btnName.setAttribute('aria-expanded', 'false');
    btnDelete.setAttribute('aria-expanded', 'false');
  }

  btnName.addEventListener('click', function () {
    if (!panelName.hidden) { closePanels(); return; }
    openPanel('name');
  });
  btnDelete.addEventListener('click', function () {
    if (!panelDelete.hidden) { closePanels(); return; }
    openPanel('delete');
  });
  $('cancel-name').addEventListener('click', function () { closePanels(); btnName.focus(); });
  $('cancel-delete').addEventListener('click', function () { closePanels(); btnDelete.focus(); });

  /* ---------- Change name ---------- */

  $('form-name').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var button = form.querySelector('button[type="submit"]');
    var name = $('n-name').value.trim().replace(/\s+/g, ' ');

    nameError('');
    if (name.length < 2) { nameError('Enter your full name.'); $('n-name').focus(); return; }
    if (name.length > 80) { nameError('Use 80 characters or fewer.'); $('n-name').focus(); return; }
    if (name === A.displayName(user)) { nameError('That is already your name.'); $('n-name').focus(); return; }

    button.disabled = true;
    A.getClient().then(function (client) {
      // Auth only ever updates the signed-in user, so another account cannot be touched from here.
      return client.auth.updateUser({ data: { full_name: name } });
    }).then(function (res) {
      if (res.error) throw res.error;
      if (res.data && res.data.user) render(res.data.user);
      closePanels();
      setMsg('Your name has been updated.', 'ok');
      btnName.focus();
    }).catch(function (err) {
      console.error('[auth]', err);
      nameError('Could not update your name. Check your connection and try again.');
    }).then(function () {
      button.disabled = false;
    });
  });

  /* ---------- Sign out ---------- */

  btnSignOut.addEventListener('click', function () {
    btnSignOut.disabled = true;
    setMsg('');
    A.getClient().then(function (client) {
      return client.auth.signOut({ scope: 'local' });
    }).then(function (res) {
      if (res && res.error) throw res.error;
      leave();
    }).catch(function (err) {
      console.error('[auth]', err);
      setMsg('Could not sign out. Check your connection and try again.', 'error');
      btnSignOut.disabled = false;
    });
  });

  /* ---------- Session ---------- */

  function sessionInvalid(err) {
    if (!err) return false;
    var code = err.code || '';
    return err.name === 'AuthSessionMissingError' || err.status === 401 || err.status === 403 ||
      code === 'user_not_found' || code === 'bad_jwt' || code === 'session_not_found';
  }

  A.onChange(function (next, event) {
    if (!shown) return;
    if (!next && event === 'SIGNED_OUT') { leave(); return; }
    if (next) render(next);
  });

  A.ready.then(function (current) {
    if (!current) { leave(); return; }
    render(current);
    reveal();

    // Confirm with the server that the session is still valid (not revoked, user not deleted).
    A.getClient().then(function (client) {
      return client.auth.getUser().then(function (res) {
        if (res.error) {
          if (sessionInvalid(res.error)) {
            return client.auth.signOut({ scope: 'local' }).then(leave, leave);
          }
          return; // offline or temporary failure: keep the locally restored session
        }
        if (res.data && res.data.user) render(res.data.user);
      });
    }).catch(function (err) {
      console.error('[auth]', err);
    });
  });
})();
