var TIP_DELAY_MS = 500;

function initQuickTips() {
  if (!document.body || typeof document.createElement !== 'function') return;  // headless test stubs
  var bubble = document.createElement('div');
  bubble.className = 'quick-tip';
  bubble.setAttribute('role', 'tooltip');
  bubble.hidden = true;
  document.body.appendChild(bubble);
  var target = null;
  var timer = 0;

  function place() {
    var r = target.getBoundingClientRect();
    var b = bubble.getBoundingClientRect();
    var left = Math.min(Math.max(8, r.left + r.width / 2 - b.width / 2), window.innerWidth - b.width - 8);
    var top = r.bottom + 6;
    if (top + b.height > window.innerHeight - 8) top = r.top - b.height - 6;  // no room below
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';
  }

  function hide() {
    clearTimeout(timer);
    bubble.hidden = true;
    if (target) {
      // put the title back unless something (i18n) already set a fresh one
      if (!target.hasAttribute('title')) target.setAttribute('title', target.dataset.tip);
      delete target.dataset.tip;
      target = null;
    }
  }

  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    var el = e.target.closest('[title], [data-tip]');
    if (el === target) return;
    hide();
    if (!el || !el.getAttribute('title')) return;
    target = el;
    target.dataset.tip = target.getAttribute('title');
    target.removeAttribute('title');
    timer = setTimeout(function () {
      if (!target || !document.contains(target)) return;
      bubble.textContent = target.dataset.tip;
      bubble.hidden = false;
      place();
    }, TIP_DELAY_MS);
  });
  document.addEventListener('pointerout', function (e) {
    if (target && !target.contains(e.relatedTarget)) hide();
  });
  document.addEventListener('pointerdown', hide);
  document.addEventListener('keydown', hide);
  window.addEventListener('scroll', hide, true);
  window.addEventListener('blur', hide);
}


