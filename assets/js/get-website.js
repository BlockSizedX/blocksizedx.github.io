/* Get a Website: guided flow that ends in a prefilled WhatsApp message. Client-side only. */
(function () {
  'use strict';

  var flow = document.getElementById('flow');
  var startButton = document.getElementById('start-flow');
  if (!flow || !startButton) return;

  var WA_NUMBER = '916238402221';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BUDGETS = ['Under ₹3,000', '₹3,000–₹5,000', '₹5,000–₹10,000', 'Above ₹10,000', 'Not sure yet'];

  var PACKS = [
    {
      id: 'launch',
      name: 'Launch Pack',
      budget: 'Under ₹3,000',
      text: 'A straightforward starting point for a small, focused web presence.',
      suits: 'Personal pages, simple profiles, announcements'
    },
    {
      id: 'essential',
      name: 'Essential Pack',
      budget: '₹3,000–₹5,000',
      text: 'A tidy, well-presented site for a small business or portfolio.',
      suits: 'Small businesses, portfolios, local services'
    },
    {
      id: 'growth',
      name: 'Growth Pack',
      budget: '₹5,000–₹10,000',
      text: 'Room for more content and more care in the design.',
      suits: 'Businesses with several services, brands, creators'
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      budget: 'Above ₹10,000',
      text: 'For larger or more involved websites planned around your requirements.',
      suits: 'Larger business sites, online stores, web apps'
    }
  ];

  var FIELDS = ['name', 'phone', 'budget', 'requirements'];
  var STEP_INDEX = { path: 1, packs: 1, details: 2, result: 3 };

  var state = { step: null, path: null, pack: null };

  var panels = Array.prototype.slice.call(flow.querySelectorAll('[data-panel]'));
  var stepperItems = Array.prototype.slice.call(flow.querySelectorAll('.stepper li'));
  var packGrid = document.getElementById('pack-grid');
  var form = document.getElementById('request-form');
  var selectedRow = document.getElementById('selected-pack');
  var selectedName = document.getElementById('selected-pack-name');
  var preview = document.getElementById('message-preview');
  var waLink = document.getElementById('wa-link');
  var resultStatus = document.getElementById('result-status');
  var copyButton = document.getElementById('copy-message');
  var copyStatus = document.getElementById('copy-status');

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function input(key) { return document.getElementById('f-' + key); }
  function errorNode(key) { return document.getElementById('e-' + key); }

  /* ---------- Steps ---------- */

  function show(step, moveFocus) {
    state.step = step;
    var index = STEP_INDEX[step];

    panels.forEach(function (panel) { panel.hidden = panel.dataset.panel !== step; });
    stepperItems.forEach(function (item, i) {
      var number = i + 1;
      item.classList.toggle('is-done', number < index);
      if (number === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });

    if (moveFocus === false) return;
    var heading = flow.querySelector('[data-panel="' + step + '"] .step-title');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    flow.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function openFlow() {
    flow.hidden = false;
    startButton.setAttribute('aria-expanded', 'true');
    show('path');
  }

  function goBack() {
    if (state.step === 'packs') show('path');
    else if (state.step === 'details') show(state.path === 'pack' ? 'packs' : 'path');
    else if (state.step === 'result') show('details');
  }

  /* ---------- Packs ---------- */

  function renderPacks() {
    PACKS.forEach(function (pack) {
      var card = el('article', 'pack');
      card.dataset.pack = pack.id;
      card.appendChild(el('p', 'pack__name', pack.name));
      card.appendChild(el('p', 'pack__budget', pack.budget));
      card.appendChild(el('p', 'pack__text', pack.text));

      var suits = el('p', 'pack__suits');
      suits.appendChild(el('strong', '', 'May suit'));
      suits.appendChild(document.createTextNode(pack.suits));
      card.appendChild(suits);

      var button = el('button', 'btn btn--primary', 'Select Pack');
      button.type = 'button';
      button.dataset.selectPack = pack.id;
      button.setAttribute('aria-label', 'Select ' + pack.name + ', ' + pack.budget);
      card.appendChild(button);

      packGrid.appendChild(card);
    });
  }

  function markSelectedPack() {
    Array.prototype.forEach.call(packGrid.children, function (card) {
      var selected = !!state.pack && card.dataset.pack === state.pack.id;
      card.classList.toggle('is-selected', selected);
    });
  }

  function selectPack(id) {
    var pack = PACKS.filter(function (p) { return p.id === id; })[0];
    if (!pack) return;
    state.path = 'pack';
    state.pack = pack;
    markSelectedPack();
    input('budget').value = pack.budget;
    clearError('budget');
    selectedName.textContent = pack.name + ' · ' + pack.budget;
    selectedRow.hidden = false;
    show('details');
  }

  function chooseCustom() {
    state.path = 'custom';
    state.pack = null;
    markSelectedPack();
    selectedRow.hidden = true;
    show('details');
  }

  /* ---------- Form ---------- */

  function renderBudgetOptions() {
    var select = input('budget');
    BUDGETS.forEach(function (label) {
      var option = el('option', '', label);
      option.value = label;
      select.appendChild(option);
    });
  }

  function readValues() {
    return {
      name: input('name').value.trim(),
      phone: input('phone').value.trim(),
      budget: input('budget').value,
      requirements: input('requirements').value.trim(),
      pack: state.pack ? state.pack.name : ''
    };
  }

  function validate(values) {
    var errors = {};
    if (!values.name) errors.name = 'Enter your full name.';

    var digits = values.phone.replace(/\D/g, '');
    if (!values.phone) {
      errors.phone = 'Enter your WhatsApp or mobile number.';
    } else if (!/^\+?[\d\s().-]+$/.test(values.phone) || digits.length < 8 || digits.length > 15) {
      errors.phone = 'Enter a valid number with 8 to 15 digits.';
    }

    if (!values.budget) errors.budget = 'Choose a budget range.';
    if (!values.requirements) errors.requirements = 'Tell me briefly what the website needs.';
    return errors;
  }

  function showError(key, message) {
    var field = input(key);
    var node = errorNode(key);
    field.setAttribute('aria-invalid', 'true');
    node.textContent = message;
    node.hidden = false;
  }

  function clearError(key) {
    var field = input(key);
    var node = errorNode(key);
    field.removeAttribute('aria-invalid');
    node.textContent = '';
    node.hidden = true;
  }

  function buildMessage(values) {
    return [
      "Hello! I'm interested in getting a website.",
      '',
      'Name: ' + values.name,
      'Phone: ' + values.phone,
      'Package: ' + (values.pack || 'Custom Website'),
      'Budget: ' + values.budget,
      '',
      'Requirements:',
      values.requirements,
      '',
      'Please let me know the next steps. Thank you!'
    ].join('\n');
  }

  function whatsappUrl(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function onSubmit(event) {
    event.preventDefault();
    var values = readValues();
    var errors = validate(values);

    FIELDS.forEach(function (key) {
      if (errors[key]) showError(key, errors[key]);
      else clearError(key);
    });

    var firstInvalid = FIELDS.filter(function (key) { return errors[key]; })[0];
    if (firstInvalid) {
      input(firstInvalid).focus();
      return;
    }

    var message = buildMessage(values);
    var url = whatsappUrl(message);
    preview.textContent = message;
    waLink.href = url;
    copyStatus.textContent = '';

    var opened = window.open(url, '_blank');
    if (opened) opened.opener = null;
    resultStatus.textContent = opened
      ? 'WhatsApp should be opening in a new tab. If it did not, use Open WhatsApp below.'
      : 'Your browser blocked the new window. Use Open WhatsApp below instead.';

    show('result');
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    area.remove();
    return ok;
  }

  function copyMessage() {
    var text = preview.textContent;
    function done(ok) {
      copyStatus.textContent = ok ? 'Message copied.' : 'Copy failed. Select the text above and copy it manually.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  }

  /* ---------- Wiring ---------- */

  var pathChoice = null;
  var pathContinue = flow.querySelector('[data-path-continue]');

  function markPath() {
    Array.prototype.forEach.call(flow.querySelectorAll('[data-path]'), function (card) {
      var selected = card.dataset.path === pathChoice;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
    pathContinue.disabled = !pathChoice;
  }

  renderPacks();
  renderBudgetOptions();

  startButton.addEventListener('click', function () {
    if (flow.hidden) openFlow();
    else flow.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  flow.addEventListener('click', function (e) {
    var pathButton = e.target.closest('[data-path]');
    if (pathButton) {
      pathChoice = pathButton.dataset.path;
      markPath();
      return;
    }
    if (e.target.closest('[data-path-continue]')) {
      if (pathChoice === 'pack') { state.path = 'pack'; show('packs'); }
      else if (pathChoice === 'custom') chooseCustom();
      return;
    }
    var packButton = e.target.closest('[data-select-pack]');
    if (packButton) { selectPack(packButton.dataset.selectPack); return; }
    if (e.target.closest('[data-go-back]')) { goBack(); return; }
    if (e.target.closest('[data-change-pack]')) { show('packs'); return; }
    if (e.target.closest('[data-edit-details]')) { show('details'); }
  });

  form.addEventListener('submit', onSubmit);
  FIELDS.forEach(function (key) {
    input(key).addEventListener('input', function () { clearError(key); });
    input(key).addEventListener('change', function () { clearError(key); });
  });
  copyButton.addEventListener('click', copyMessage);
})();
