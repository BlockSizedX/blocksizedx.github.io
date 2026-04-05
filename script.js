/* ============================================
   BlockSizedX — script.js
   ============================================ */

// ── Helpers ──────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: k => { try { localStorage.removeItem(k); } catch {} }
};

// ── Navbar scroll effect ──────────────────────
const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Mobile nav ────────────────────────────────
const hamburger = $('#hamburger');
const mobileNav = $('#mobile-nav');
hamburger?.addEventListener('click', () => {
  mobileNav?.classList.toggle('open');
});
mobileNav?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileNav.classList.remove('open'));
});

// ── Active nav link ───────────────────────────
function updateActiveNav() {
  const sections = $$('section[id]');
  const scrollY = window.scrollY + 100;
  sections.forEach(sec => {
    const top = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    const id = sec.id;
    $$(`a[href="#${id}"]`).forEach(a => {
      a.classList.toggle('active', scrollY >= top && scrollY < bottom);
    });
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });

// ── Scroll reveal ─────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function initReveal() {
  $$('.reveal, .reveal-left, .reveal-right, .stagger').forEach(el => {
    revealObserver.observe(el);
  });
}

// ── Consent Bar ───────────────────────────────
function initConsent() {
  const bar = $('#consent-bar');
  if (!bar) return;
  if (store.get('bsx_consent_closed')) {
    bar.classList.add('hidden');
    return;
  }
  $('#consent-close')?.addEventListener('click', () => {
    bar.classList.add('hidden');
    store.set('bsx_consent_closed', true);
  });
  $('#consent-accept')?.addEventListener('click', () => {
    bar.classList.add('hidden');
    store.set('bsx_consent_closed', true);
  });
}

// ── Auth System ───────────────────────────────
const AUTH_KEY = 'bsx_users';
const SESSION_KEY = 'bsx_session';

function getUsers() {
  return store.get(AUTH_KEY) || {};
}
function saveUsers(users) {
  store.set(AUTH_KEY, users);
}
function getCurrentUser() {
  return store.get(SESSION_KEY);
}
function setSession(username) {
  store.set(SESSION_KEY, { username, loginAt: Date.now() });
}
function clearSession() {
  store.remove(SESSION_KEY);
}

function getInitials(username) {
  return username.slice(0, 2).toUpperCase();
}

function renderAuthButton() {
  const btn = $('#nav-auth-btn');
  if (!btn) return;
  const user = getCurrentUser();
  if (user) {
    btn.outerHTML = `
      <div class="nav-account-pill" id="nav-account-pill" title="Account: ${user.username}">
        <div class="nav-avatar">${getInitials(user.username)}</div>
        <span class="nav-account-name">${user.username}</span>
      </div>`;
    setTimeout(() => {
      $('#nav-account-pill')?.addEventListener('click', () => {
        if (confirm(`Signed in as: ${user.username}\n\nSign out?`)) {
          clearSession();
          location.reload();
        }
      });
    }, 0);
  } else {
    if (!$('#nav-auth-btn')) {
      // Already a pill, skip
    }
    btn?.addEventListener('click', () => openModal('login'));
  }
}



// ── Modal ─────────────────────────────────────
let _modalReason = null;

function openModal(tab = 'login', reason = null) {
  _modalReason = reason;
  const overlay = $('#auth-modal');
  if (!overlay) return;
  overlay.classList.add('open');
  switchTab(tab);
}

function closeModal() {
  $('#auth-modal')?.classList.remove('open');
  _modalReason = null;
}

function switchTab(tab) {
  $$('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $$('.modal-panel').forEach(p => p.style.display = p.dataset.panel === tab ? 'flex' : 'none');
  clearModalMessages();
}

function clearModalMessages() {
  $$('.modal-error, .modal-success').forEach(el => el.classList.remove('show'));
}

function initModal() {
  const overlay = $('#auth-modal');
  if (!overlay) return;

  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  $('#modal-close')?.addEventListener('click', closeModal);
  $$('.modal-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Login
  $('#login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;
    const users = getUsers();
    if (!users[username]) {
      showModalError('login-error', 'No account found with that username.');
      return;
    }
    if (users[username].password !== btoa(password)) {
      showModalError('login-error', 'Incorrect password.');
      return;
    }
    setSession(username);
    showModalSuccess('login-success', `Welcome back, ${username}!`);
    setTimeout(() => { closeModal(); location.reload(); }, 900);
  });

  // Register
  $('#register-form')?.addEventListener('submit', async e => {
    e.preventDefault();

    const username = $('#reg-username').value.trim();
    const email = $('#reg-email').value.trim();
    const password = $('#reg-password').value;

    if (password.length < 6) {
      showModalError('register-error', 'Password must be at least 6 characters.');
      return;
    }

    const users = getUsers();
    if (users[username]) {
      showModalError('register-error', 'Username already taken.');
      return;
    }

    try {
      // 🔥 CREATE USER IN FIREBASE AUTH
      const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
      const user = userCredential.user;

      // 🔥 SAVE USERNAME + EMAIL IN DATABASE
      await window.setDoc(window.doc(window.db, "users", user.uid), {
        username: username,
        email: email,
        createdAt: Date.now()
      });

      // ✅ your existing system
      users[username] = { email, password: btoa(password), createdAt: Date.now() };
      saveUsers(users);
      setSession(username);

      showModalSuccess('register-success', `Account created! Welcome, ${username}!`);

      setTimeout(() => { closeModal(); location.reload(); }, 900);

    } catch (error) {
      showModalError('register-error', error.message);
    }
  });
}

function showModalError(id, msg) {
  const el = $(`#${id}`);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function showModalSuccess(id, msg) {
  const el = $(`#${id}`);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

// ── Guard: require login before action ────────
function requireLogin(action, prompt = 'Please sign in to continue.') {
  if (getCurrentUser()) { action(); return; }
  openModal('login', prompt);
  // After login, action will need to be re-triggered by user
}

// ── Works loader (index.html) ─────────────────
async function loadWorksPreview() {
  const grid = $('#works-grid');
  if (!grid) return;
  try {
    const res = await fetch('works.json');
    const works = await res.json();
    const preview = works.slice(0, 2);
    grid.innerHTML = preview.map(w => `
      <div class="work-card-mini reveal">
        <div class="work-card-mini-cover">
          <img src="${w.icon}" alt="${w.name}" loading="lazy">
        </div>
        <div class="work-card-mini-name">${w.name}</div>
        <div class="work-card-mini-tags">${w.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="work-card-mini-actions">
          ${w.liveDemo ? `<a href="${w.liveDemo}" target="_blank" rel="noopener" class="btn-demo">Live Demo ↗</a>` : ''}
          <a href="works/#${w.id}" class="btn-more">See More</a>
        </div>
      </div>
    `).join('');
    // Re-observe new elements
    $$('#works-grid .reveal').forEach(el => revealObserver.observe(el));
  } catch (err) {
    grid.innerHTML = '<p style="color:var(--text-3);font-size:14px;">Could not load works.</p>';
  }
}

// ── Contact guards ────────────────────────────
function initContactGuards() {
  $$('.contact-guard').forEach(el => {
    el.addEventListener('click', function(e) {
      if (!getCurrentUser()) {
        e.preventDefault();
        openModal('login', 'Sign in to get contact details.');
      }
    });
  });
}

// ── Request form ──────────────────────────────
function initRequestForm() {
  const form = $('#request-form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!getCurrentUser()) {
      openModal('login', 'Please sign in before submitting your request.');
      return;
    }
    const name = $('#req-name').value.trim();
    const email = $('#req-email').value.trim();
    const company = $('#req-company').value.trim();
    const type = $('#req-type').value;
    const budget = $('#req-budget').value;
    const desc = $('#req-desc').value.trim();
    const deadline = $('#req-deadline').value;

    const subject = encodeURIComponent(`Website Request from ${name} — BlockSizedX`);
    const body = encodeURIComponent(
`New Website Request via BlockSizedX Portfolio

━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name}
Email: ${email}
Company/Brand: ${company || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━
Website Type: ${type}
Budget Range: ${budget}
Deadline: ${deadline || 'Flexible'}

━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━
${desc}

━━━━━━━━━━━━━━━━━━━━━━━━
Sent from BlockSizedX Portfolio
`);
    window.location.href = `mailto:hello@blocksizedx.com?subject=${subject}&body=${body}`;
  });
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initConsent();
  initModal();
  renderAuthButton();
  loadWorksPreview();
  initContactGuards();
  initRequestForm();

  // Smooth scroll for anchor links
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
