/* Hero typing effect: types a phrase, pauses, erases it, then moves to the next. */
(function () {
  'use strict';

  var target = document.getElementById('typer');
  if (!target) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var phrases = [
    'Fast, beautiful websites.',
    'Designed for every screen.',
    'Genuinely useful, not just pretty.'
  ];
  var TYPE_MS = 55;
  var ERASE_MS = 28;
  var HOLD_MS = 1800;
  var GAP_MS = 350;

  var index = 0;
  var length = phrases[0].length;
  var erasing = true;
  var timer;

  function tick() {
    var phrase = phrases[index];
    var delay;

    if (erasing) {
      length -= 1;
      delay = ERASE_MS;
      if (length <= 0) {
        length = 0;
        erasing = false;
        index = (index + 1) % phrases.length;
        delay = GAP_MS;
      }
    } else {
      length += 1;
      delay = TYPE_MS;
      if (length >= phrase.length) {
        length = phrase.length;
        erasing = true;
        delay = HOLD_MS;
      }
    }

    target.textContent = phrases[index].slice(0, length);
    timer = setTimeout(tick, delay);
  }

  document.addEventListener('visibilitychange', function () {
    clearTimeout(timer);
    if (!document.hidden) timer = setTimeout(tick, 400);
  });

  timer = setTimeout(tick, HOLD_MS);
})();
