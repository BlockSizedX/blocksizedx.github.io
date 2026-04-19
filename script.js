/* ============================================
   BlockSizedX — script.js
   Firebase Auth + Firestore — full rewrite
   ============================================ */

// ── Helpers ──────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// Only ONE localStorage key — stores username string after successful sign-in
const SESSION_KEY = 'bsx_session_user';

// ── Format date as "dd-Mon-yyyy" ─────────────────────────────────────────────
function formatDate(date) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = date instanceof Date ? date : new Date(date);
  return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

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
  if (localStorage.getItem('bsx_consent_closed') === '1') {
    bar.classList.add('hidden');
    return;
  }
  const close = () => {
    bar.classList.add('hidden');
    localStorage.setItem('bsx_consent_closed', '1');
  };
  $('#consent-close')?.addEventListener('click', close);
  $('#consent-accept')?.addEventListener('click', close);
}

// ── Auth helpers ──────────────────────────────
function getInitials(username) {
  return (username || '?').slice(0, 2).toUpperCase();
}

function getCachedUsername() {
  return localStorage.getItem(SESSION_KEY) || null;
}

function cacheUsername(username) {
  if (username) localStorage.setItem(SESSION_KEY, username);
  else localStorage.removeItem(SESSION_KEY);
}

async function fetchUsername(uid) {
  try {
    const { firebaseDb, firebaseFns } = window;
    const { getDoc, doc } = firebaseFns;
    const snap = await getDoc(doc(firebaseDb, 'users', uid));
    return snap.exists() ? (snap.data().username || null) : null;
  } catch {
    return null;
  }
}

// ── Render nav auth button / account pill ─────
// Task 1: clicking pill when logged in → go to /account/index.html
//         clicking button when logged out → open modal
function renderAuthButton(username) {
  const btn = $('#nav-auth-btn');
  const existingPill = $('#nav-account-pill');

  if (username) {
    const target = btn || existingPill;
    if (!target) return;
    target.outerHTML = `
      <div class="nav-account-pill" id="nav-account-pill" title="Signed in as ${username}" style="cursor:pointer;">
        <div class="nav-avatar">${getInitials(username)}</div>
        <span class="nav-account-name">${username}</span>
      </div>`;
    setTimeout(() => {
      // Redirect to account page when logged in
      $('#nav-account-pill')?.addEventListener('click', () => {
        window.location.href = '/account/';
      });
    }, 0);
  } else {
    if (existingPill) {
      existingPill.outerHTML = `
        <button id="nav-auth-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Sign In
        </button>`;
      setTimeout(() => {
        $('#nav-auth-btn')?.addEventListener('click', () => openModal('login'));
      }, 0);
    } else {
      btn?.addEventListener('click', () => openModal('login'));
    }
  }
}

// ── onAuthStateChanged listener ───────────────
function setupAuthListener() {
  const { firebaseAuth, firebaseFns } = window;
  const { onAuthStateChanged } = firebaseFns;

  // Optimistic render from cache so nav shows instantly
  const cached = getCachedUsername();
  if (cached) renderAuthButton(cached);

  onAuthStateChanged(firebaseAuth, async (fbUser) => {
    if (fbUser) {
      let username = getCachedUsername();
      if (!username) {
        username = await fetchUsername(fbUser.uid);
        cacheUsername(username);
      }
      renderAuthButton(username || fbUser.email);
    } else {
      cacheUsername(null);
      renderAuthButton(null);
    }
  });
}

// ── Modal ─────────────────────────────────────
function openModal(tab = 'login') {
  const overlay = $('#auth-modal');
  if (!overlay) return;
  overlay.classList.add('open');
  switchTab(tab);
}

function closeModal() {
  $('#auth-modal')?.classList.remove('open');
}

function switchTab(tab) {
  $$('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $$('.modal-panel').forEach(p => p.style.display = p.dataset.panel === tab ? 'flex' : 'none');
  clearModalMessages();
}

function clearModalMessages() {
  $$('.modal-error, .modal-success').forEach(el => el.classList.remove('show'));
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

function setFormLoading(formId, loading) {
  const form = $(`#${formId}`);
  if (!form) return;
  const btn = form.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = loading;
    btn.textContent = loading ? 'Please wait…'
      : formId === 'login-form' ? 'Sign In →' : 'Create Account →';
  }
}

// ── Friendly Firebase error messages ──────────
function firebaseErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':   return 'That email is already registered.';
    case 'auth/invalid-email':          return 'Please enter a valid email address.';
    case 'auth/weak-password':          return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':         return 'No account found with those credentials.';
    case 'auth/wrong-password':         return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':     return 'Incorrect username or password.';
    case 'auth/too-many-requests':      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default:                            return 'Something went wrong. Please try again.';
  }
}

// ── Modal init ────────────────────────────────
function initModal() {
  const overlay = $('#auth-modal');
  if (!overlay) return;

  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  $('#modal-close')?.addEventListener('click', closeModal);
  $$('.modal-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Sign In
  $('#login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalMessages();

    const usernameInput = $('#login-username').value.trim();
    const password = $('#login-password').value;

    if (!usernameInput || !password) {
      showModalError('login-error', 'Please fill in all fields.');
      return;
    }

    setFormLoading('login-form', true);

    try {
      const { firebaseDb, firebaseAuth, firebaseFns } = window;
      const { query, collection, where, getDocs, signInWithEmailAndPassword } = firebaseFns;

      // Find email by username
      const q = query(collection(firebaseDb, 'users'), where('username', '==', usernameInput));
      const snap = await getDocs(q);

      if (snap.empty) {
        showModalError('login-error', 'No account found with that username.');
        setFormLoading('login-form', false);
        return;
      }

      const email = snap.docs[0].data().email;
      await signInWithEmailAndPassword(firebaseAuth, email, password);

      cacheUsername(usernameInput);
      showModalSuccess('login-success', `Welcome back, ${usernameInput}!`);
      setTimeout(() => { closeModal(); location.reload(); }, 900);

    } catch (err) {
      showModalError('login-error', firebaseErrorMessage(err.code));
      setFormLoading('login-form', false);
    }
  });

  // Register
  $('#register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalMessages();

    const username = $('#reg-username').value.trim();
    const email    = $('#reg-email').value.trim();
    const password = $('#reg-password').value;

    if (!username || !email || !password) {
      showModalError('register-error', 'Please fill in all fields.');
      return;
    }
    if (username.length < 3) {
      showModalError('register-error', 'Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      showModalError('register-error', 'Password must be at least 6 characters.');
      return;
    }

    setFormLoading('register-form', true);

    try {
      const { firebaseDb, firebaseAuth, firebaseFns } = window;
      const { query, collection, where, getDocs, createUserWithEmailAndPassword, setDoc, doc } = firebaseFns;

      // Check username uniqueness
      const q = query(collection(firebaseDb, 'users'), where('username', '==', username));
      const snap = await getDocs(q);
      if (!snap.empty) {
        showModalError('register-error', 'Username already taken. Choose another.');
        setFormLoading('register-form', false);
        return;
      }

      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = credential.user;
      await user.reload();
      const uid = user.uid;

      await setDoc(doc(firebaseDb, 'users', uid), {
        username:  username,
        email:     email,
        joined:    formatDate(new Date()),
        createdAt: Date.now()
      });

      cacheUsername(username);
      showModalSuccess('register-success', `Account created! Welcome, ${username}!`);
      setTimeout(() => { closeModal(); location.reload(); }, 900);

    } catch (err) {
      showModalError('register-error', firebaseErrorMessage(err.code));
      setFormLoading('register-form', false);
    }
  });
}

// ── Guard: require login before action ────────
function requireLogin(action) {
  if (getCachedUsername()) { action(); return; }
  openModal('login');
}

// ── Works loader ──────────────────────────────
async function loadWorksPreview() {
  const grid = $('#works-grid');
  if (!grid) return;
  try {
    const res = await fetch('works.json');
    const works = await res.json();
    const preview = works.slice(0, 4);
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
    $$('#works-grid .reveal').forEach(el => revealObserver.observe(el));
  } catch {
    grid.innerHTML = '<p style="color:var(--text-3);font-size:14px;">Could not load works.</p>';
  }
}

// ── Contact guards ────────────────────────────
function initContactGuards() {
  $$('.contact-guard').forEach(el => {
    el.addEventListener('click', function(e) {
      if (!getCachedUsername()) {
        e.preventDefault();
        openModal('login');
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
    if (!getCachedUsername()) {
      openModal('login');
      return;
    }
    const name     = $('#req-name').value.trim();
    const email    = $('#req-email').value.trim();
    const company  = $('#req-company').value.trim();
    const type     = $('#req-type').value;
    const budget   = $('#req-budget').value;
    const desc     = $('#req-desc').value.trim();
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
    window.location.href = `mailto:blocksizedx@gmail.com?subject=${subject}&body=${body}`;
  });
}

// ── Task 3: Handle ?openLogin=true URL param ──
function handleOpenLoginParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('openLogin') === 'true') {
    // Clean URL immediately
    const cleanUrl = window.location.pathname + (params.toString().replace(/openLogin=true&?/, '').replace(/^&/, '') ? '?' + params.toString().replace(/openLogin=true&?/, '').replace(/^&/, '') : '');
    history.replaceState(null, '', cleanUrl || window.location.pathname);
    // Open modal after a brief delay to ensure DOM is ready
    setTimeout(() => openModal('login'), 100);
  }
}

// ── Task 10: Track ?from= analytics source ────
async function trackFromSource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('from');
    if (!source) return;

    // Wait until Firebase is ready (important)
    while (!window.firebaseDb || !window.firebaseFns) {
      await new Promise(r => setTimeout(r, 100));
    }

    const { firebaseDb, firebaseFns } = window;
    const { doc, setDoc, increment } = firebaseFns;

    await setDoc(
      doc(firebaseDb, 'analytics_sources', source),
      {
        source: source,
        count: increment(1),
        lastVisit: Date.now()
      },
      { merge: true }
    );

    console.log("Tracked:", source); // 👈 debug log

  } catch (err) {
    console.log("Tracking error:", err);
  }
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initConsent();
  initModal();
  handleOpenLoginParam();
  // setupAuthListener() is called from the Firebase module in index.html
  loadWorksPreview();
  initContactGuards();
  initRequestForm();

  // Smooth scroll
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
