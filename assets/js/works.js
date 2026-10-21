/* Portfolio: renders project cards from window.BSX_WORKS, drives the scroll rail and the project modal. */
(function () {
  'use strict';

  var works = Array.isArray(window.BSX_WORKS) ? window.BSX_WORKS.slice() : [];
  var root = document.body.dataset.root || '';
  var FEATURED_COUNT = 3;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var newestFirst = works.slice().sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function isValidUrl(value) {
    if (typeof value !== 'string' || !value) return false;
    try {
      var url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch (e) {
      return false;
    }
  }

  function fallback(work) {
    return el('span', 'media-fallback', work.name);
  }

  function previewImage(work) {
    var src = work.images && work.images[0];
    if (!src) return fallback(work);
    var img = new Image();
    img.alt = work.name + ' website preview';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.addEventListener('error', function () {
      if (img.parentNode) img.replaceWith(fallback(work));
    }, { once: true });
    img.src = root + src;
    return img;
  }

  /* ---------- Cards ---------- */

  function createCard(work) {
    var card = el('button', 'work-card');
    card.type = 'button';
    card.dataset.id = work.id;
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', 'View project: ' + work.name);

    var media = el('span', 'work-card__media');
    media.appendChild(previewImage(work));

    var body = el('span', 'work-card__body');
    body.appendChild(el('span', 'work-card__title', work.name));
    var year = new Date(work.date).getFullYear();
    if (!isNaN(year)) body.appendChild(el('span', 'work-card__meta', String(year)));

    media.appendChild(body);
    card.appendChild(media);
    return card;
  }

  function renderInto(container, list) {
    var fragment = document.createDocumentFragment();
    list.forEach(function (work) { fragment.appendChild(createCard(work)); });
    container.replaceChildren(fragment);
  }

  /* ---------- Modal ---------- */

  function createMoreLink() {
    var link = el('a', 'rail-more');
    link.href = root + 'works/';
    link.appendChild(el('span', '', 'View All ' + works.length + ' Works'));
    var arrow = el('span', 'arrow', '\u2192');
    arrow.setAttribute('aria-hidden', 'true');
    link.appendChild(arrow);
    return link;
  }

  var modal = null;
  var lastTrigger = null;
  var pointerStartedOnBackdrop = false;

  function lockScroll() {
    var scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add('is-locked');
    if (scrollbar > 0) document.body.style.paddingRight = scrollbar + 'px';
  }

  function unlockScroll() {
    document.documentElement.classList.remove('is-locked');
    document.body.style.paddingRight = '';
  }

  function buildModal() {
    var dialog = document.createElement('dialog');
    dialog.className = 'modal';
    dialog.setAttribute('aria-labelledby', 'modal-title');
    dialog.innerHTML =
      '<div class="modal__panel">' +
        '<button type="button" class="modal__close" aria-label="Close project">\u00d7</button>' +
        '<div class="modal__media"></div>' +
        '<div class="modal__body">' +
          '<h2 class="modal__title" id="modal-title"></h2>' +
          '<p class="modal__desc"></p>' +
          '<ul class="modal__tags" aria-label="Technologies"></ul>' +
          '<div class="modal__actions">' +
            '<a class="btn btn--primary" target="_blank" rel="noopener noreferrer">Live Demo <span class="arrow" aria-hidden="true">\u2197</span></a>' +
          '</div>' +
        '</div>' +
      '</div>';

    dialog.querySelector('.modal__close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('pointerdown', function (e) { pointerStartedOnBackdrop = e.target === dialog; });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog && pointerStartedOnBackdrop) dialog.close();
    });
    dialog.addEventListener('close', function () {
      unlockScroll();
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
      lastTrigger = null;
    });

    document.body.appendChild(dialog);
    return dialog;
  }

  function openWork(id, trigger) {
    var work = works.find(function (w) { return w.id === id; });
    if (!work) return;
    if (!modal) modal = buildModal();
    if (modal.open) return;

    modal.querySelector('.modal__media').replaceChildren(previewImage(work));
    modal.querySelector('.modal__title').textContent = work.name;
    modal.querySelector('.modal__desc').textContent = work.description || '';

    var tags = modal.querySelector('.modal__tags');
    tags.replaceChildren.apply(tags, (work.tags || []).map(function (tag) { return el('li', '', tag); }));
    tags.hidden = !(work.tags && work.tags.length);

    var actions = modal.querySelector('.modal__actions');
    var hasDemo = isValidUrl(work.liveDemo);
    actions.hidden = !hasDemo;
    if (hasDemo) actions.querySelector('a').href = work.liveDemo;

    lastTrigger = trigger || null;
    lockScroll();
    modal.showModal();
  }

  /* ---------- Rail ---------- */

  function initRail(wrap) {
    var rail = wrap.querySelector('.rail');
    var bar = wrap.querySelector('.rail-progress span');
    var prev = wrap.querySelector('[data-rail-prev]');
    var next = wrap.querySelector('[data-rail-next]');
    var queued = false;

    function update() {
      queued = false;
      var max = rail.scrollWidth - rail.clientWidth;
      var scrollable = max > 2;
      wrap.classList.toggle('is-static', !scrollable);
      if (!scrollable) return;
      var visible = rail.clientWidth / rail.scrollWidth;
      var progress = rail.scrollLeft / max;
      if (bar) bar.style.width = (visible + (1 - visible) * progress) * 100 + '%';
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max - 2;
    }

    function page(direction) {
      var card = rail.querySelector('.work-card');
      if (!card) return;
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      var step = card.getBoundingClientRect().width + gap;
      var visibleCards = Math.max(1, Math.floor((rail.clientWidth + gap) / step));
      rail.scrollBy({ left: direction * step * visibleCards, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    rail.addEventListener('scroll', function () {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    if (prev) prev.addEventListener('click', function () { page(-1); });
    if (next) next.addEventListener('click', function () { page(1); });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(rail);
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Init ---------- */

  function initCounts() {
    document.querySelectorAll('[data-works-count]').forEach(function (node) {
      node.textContent = String(works.length);
    });
    document.querySelectorAll('[data-works-all]').forEach(function (link) {
      if (!works.length) { link.hidden = true; return; }
      var arrow = el('span', 'arrow', '\u2192');
      arrow.setAttribute('aria-hidden', 'true');
      link.replaceChildren(document.createTextNode('View All ' + works.length + ' Works '), arrow);
    });
  }

  function initContainers() {
    document.querySelectorAll('[data-works]').forEach(function (container) {
      var mode = container.dataset.works;
      renderInto(container, mode === 'featured' ? newestFirst.slice(0, FEATURED_COUNT) : newestFirst);
      if (mode === 'featured' && works.length) container.appendChild(createMoreLink());

      container.addEventListener('click', function (e) {
        var card = e.target.closest('.work-card');
        if (!card || !container.contains(card) || (modal && modal.open)) return;
        openWork(card.dataset.id, card);
      });

      var wrap = container.closest('.rail-wrap');
      if (wrap) initRail(wrap);
    });
  }

  function openFromHash() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    var card = document.querySelector('.work-card[data-id="' + id.replace(/"/g, '') + '"]');
    if (card) openWork(id, card);
  }

  initCounts();
  initContainers();
  openFromHash();
})();
