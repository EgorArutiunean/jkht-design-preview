// Keep the original controls in the preview without starting real transactions.
function stopPreviewSubmit(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  const form = event.target.closest('form');
  if (!form) return;
  let notice = form.querySelector('.jkht-preview-notice');
  if (!notice) {
    notice = document.createElement('p');
    notice.className = 'jkht-preview-notice';
    notice.setAttribute('role', 'status');
    form.append(notice);
  }
  notice.textContent = 'Локальный макет. Данные не отправлены.';
}

document.addEventListener('submit', stopPreviewSubmit, true);
document.addEventListener('click', (event) => {
  const control = event.target.closest('button, input, #zakazForm');
  if (control?.closest('form') && (control.type === 'submit' || control.id === 'zakazForm')) {
    stopPreviewSubmit(event);
  }
}, true);

function layOutMapPins(canvas) {
  const pins = [...canvas.querySelectorAll('.object-map-pin')];
  const { clientWidth: width, clientHeight: height } = canvas;
  if (!width || !height || !pins.length) return;
  const gap = pins[0].offsetWidth + 4;
  const steps = [0, 1, -1, 2, -2, 3, -3];
  const offsets = steps.flatMap(x => steps.map(y => [x * gap, y * gap]))
    .sort(([ax, ay], [bx, by]) => Math.hypot(ax, ay) - Math.hypot(bx, by));
  const placed = [];
  for (const pin of pins) {
    const x = parseFloat(pin.style.getPropertyValue('--pin-x')) / 100 * width;
    const y = parseFloat(pin.style.getPropertyValue('--pin-y')) / 100 * height;
    const [dx, dy] = offsets.find(([u, v]) => {
      const nextX = x + u;
      const nextY = y + v;
      return nextX >= gap / 2 && nextX <= width - gap / 2 && nextY >= gap / 2 && nextY <= height - gap / 2 &&
        placed.every(([px, py]) => Math.hypot(px - nextX, py - nextY) >= gap);
    }) || [0, 0];
    placed.push([x + dx, y + dy]);
    pin.style.setProperty('--pin-offset-x', `${dx}px`);
    pin.style.setProperty('--pin-offset-y', `${dy}px`);
    pin.style.setProperty('--pin-leader', `${Math.hypot(dx, dy)}px`);
    pin.style.setProperty('--pin-angle', `${Math.atan2(-dy, -dx)}rad`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const map = document.querySelector('.object-map-canvas');
  if (map) {
    layOutMapPins(map);
    new ResizeObserver(() => layOutMapPins(map)).observe(map);
  }

  const backToTop = document.querySelector('.button-up');
  if (backToTop) {
    backToTop.setAttribute('aria-label', 'Наверх');
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0 });
      document.querySelector('#i7mod9irj_0')?.focus({ preventScroll: true });
    });
  }

  const consultation = document.querySelector('dialog#ivjuqflx5_0');
  if (consultation) {
    const trigger = document.querySelector('.hero-consultation');
    trigger.addEventListener('click', () => consultation.showModal());
    consultation.querySelector('button.mosaic-popup__close').addEventListener('click', () => consultation.close());
    consultation.addEventListener('close', () => trigger.focus());
  }

  for (const field of document.querySelectorAll('.mosaic-form :is(input, textarea)[placeholder]')) {
    if (!field.labels?.length && !field.hasAttribute('aria-label')) {
      field.setAttribute('aria-label', field.placeholder);
    }
  }

  const panel = document.querySelector('.side-panel');
  const open = panel?.querySelector('.side-panel__button-open');
  const close = panel?.querySelector('.side-panel__button-close');
  const content = panel?.querySelector('.side-panel__content');
  if (!open || !close || !content) return;

  open.setAttribute('aria-controls', content.id);
  for (const [button, label] of [[open, 'Открыть меню'], [close, 'Закрыть меню']]) {
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', label);
    button.tabIndex = 0;
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        button.click();
      }
    });
  }

  function showMenu(visible) {
    panel.classList.toggle('jkht-menu-open', visible);
    open.setAttribute('aria-expanded', String(visible));
    (visible ? close : open).focus();
  }

  open.setAttribute('aria-expanded', 'false');
  panel.addEventListener('click', (event) => {
    if (event.target.closest('.side-panel__button-open, .side-panel__button-close, .side-panel__mask')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showMenu(Boolean(event.target.closest('.side-panel__button-open')));
    }
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('jkht-menu-open')) showMenu(false);
  });
});
