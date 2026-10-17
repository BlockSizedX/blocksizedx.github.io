/* Shared site chrome: header, footer, mobile menu, scroll reveal, notice. */
(function () {
  'use strict';

  var body = document.body;
  var root = body.dataset.root || '';
  var page = body.dataset.page || '';
  var home = root || './';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NAV = [
    { id: 'home', label: 'Home', href: home },
    { id: 'works', label: 'Works', href: root + 'works/' },
    { id: 'get-website', label: 'Get a Website', href: root + 'get-website/' },
    { id: 'about', label: 'About', href: root + 'about/' },
    { id: 'contact', label: 'Contact', href: root + 'contact/' }
  ];

  function linksHtml() {
    return NAV.map(function (item) {
      var current = item.id === page ? ' aria-current="page"' : '';
      return '<a class="nav-link" href="' + item.href + '"' + current + '>' + item.label + '</a>';
    }).join('');
  }

  function renderHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;
    header.innerHTML =
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<div class="container nav">' +
        '<a class="brand" href="' + home + '" aria-label="BlockSizedX home">Block<span>Sized</span>X</a>' +
        '<nav class="nav-links" aria-label="Primary">' + linksHtml() + '</nav>' +
        '<div class="nav-actions">' +
          '<button type="button" class="btn btn--primary btn--sm">Sign Up</button>' +
          '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu"><span></span><span></span></button>' +
        '</div>' +
      '</div>' +
      '<nav class="mobile-menu" id="mobile-menu" aria-label="Mobile" hidden>' + linksHtml() + '</nav>';

    var toggle = header.querySelector('.nav-toggle');
    var menu = header.querySelector('#mobile-menu');

    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
    }

    toggle.addEventListener('click', function () {
      setMenu(menu.hidden);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        setMenu(false);
        toggle.focus();
      }
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });

    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > 4);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function renderFooter() {
    var footer = document.getElementById('site-footer');
    if (!footer) return;
    footer.innerHTML =
      '<div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<a class="brand" href="' + home + '">Block<span>Sized</span>X</a>' +
            '<p>Website design and development by Muhammed Nazal Naufal, based in Kannur, Kerala.</p>' +
          '</div>' +
          '<div class="footer-col"><h2>Pages</h2><ul>' +
            NAV.map(function (item) { return '<li><a href="' + item.href + '">' + item.label + '</a></li>'; }).join('') +
          '</ul></div>' +
          '<div class="footer-col"><h2>Get in touch</h2><ul>' +
            '<li><a href="https://wa.me/916238402221" target="_blank" rel="noopener">WhatsApp</a></li>' +
            '<li><a href="mailto:blocksizedx@gmail.com">blocksizedx@gmail.com</a></li>' +
            '<li><a href="https://instagram.com/blocksizedx" target="_blank" rel="noopener">Instagram</a></li>' +
            '<li><a href="https://github.com/BlockSizedX" target="_blank" rel="noopener">GitHub</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span>\u00a9 2026 BlockSizedX</span>' +
          '<span><a href="' + root + 'terms-and-conditions.html">Terms</a> \u00b7 <a href="' + root + 'privacy-policy.html">Privacy</a></span>' +
        '</div>' +
      '</div>';
  }

  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  function initNotice() {
    var KEY = 'bsx_notice_dismissed';
    try {
      if (localStorage.getItem(KEY) === '1') return;
    } catch (e) { /* storage unavailable: show the notice every visit */ }

    var notice = document.createElement('div');
    notice.className = 'consent';
    notice.setAttribute('role', 'region');
    notice.setAttribute('aria-label', 'Privacy notice');
    notice.innerHTML =
      '<span>This site uses Google Analytics and stores a small preference in your browser. ' +
      '<a href="' + root + 'privacy-policy.html">Privacy Policy</a></span>' +
      '<button type="button" class="btn btn--ghost btn--sm">Got it</button>';
    notice.querySelector('button').addEventListener('click', function () {
      notice.remove();
      try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
    });
    body.appendChild(notice);
  }

  renderHeader();
  renderFooter();
  initReveal();
  initNotice();
})();
