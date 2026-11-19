function validatePasswordConfirmation(form) {
  if (form.id !== 'form_g-user-register') return;
  const password = form.elements.namedItem('pwd');
  const confirmation = form.elements.namedItem('pwd2');
  if (!password || !confirmation) return;
  const mismatch = confirmation.value !== '' && confirmation.value !== password.value;
  confirmation.setCustomValidity(mismatch ? 'Пароли не совпадают.' : '');
}

function consultationValidation(control) {
  const rules = {
    if6htdyfj_0: ['Укажите имя (не более 100 символов).', field => field.value.trim().length > 0 && field.value.length <= 100],
    ih6pdhj9c_0: ['Введите корректный адрес электронной почты.', field => {
      const value = field.value.trim();
      return value !== '' && field.validity.valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }],
    izyteexfm_0: ['Введите телефон в формате российского номера, например +7 (925) 309-82-27.', field => /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/.test(field.value.trim())],
    iiur1e8r5_0: ['Необходимо согласиться на обработку персональных данных.', field => field.checked],
  };
  const rule = rules[control.id];
  return rule ? { message: rule[0], valid: rule[1](control) } : { valid: true };
}

function validateConsultation(form) {
  if (form.id !== 'i63wo6lr0_0') return true;
  const controls = [...form.querySelectorAll('#if6htdyfj_0, #ih6pdhj9c_0, #izyteexfm_0, #iiur1e8r5_0')];
  let firstInvalid = null;
  for (const control of controls) {
    const { message, valid } = consultationValidation(control);
    const error = control.closest('.mosaic-form__field').querySelector('.mosaic-form__error');
    error.classList.toggle('is-removed', valid);
    if (!valid) {
      error.querySelector('.text-block-wrap-div').textContent = message;
      control.setAttribute('aria-describedby', error.id);
      control.setAttribute('aria-invalid', 'true');
      firstInvalid ||= control;
    } else {
      control.removeAttribute('aria-describedby');
      control.setAttribute('aria-invalid', 'false');
    }
  }
  firstInvalid?.focus();
  return !firstInvalid;
}

// Keep the original controls in the preview without starting real transactions.
function stopPreviewSubmit(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  const form = event.target.closest('form');
  if (!form) return;
  form.classList.add('preview-validated');
  if (!validateConsultation(form)) return;
  validatePasswordConfirmation(form);
  if (form.hasAttribute('data-question-form')) updateQuestionValidity(form);
  if (!form.reportValidity()) return;
  let notice = form.querySelector('.jkht-preview-notice');
  if (!notice) {
    notice = document.createElement('p');
    notice.className = 'jkht-preview-notice';
    notice.setAttribute('role', 'status');
    form.append(notice);
  }
  notice.textContent = 'Тестовая версия. Данные не отправлены.';
}

document.addEventListener('submit', stopPreviewSubmit, true);
document.addEventListener('invalid', (event) => {
  event.target.form?.classList.add('preview-validated');
}, true);
function refreshConsultationError(control) {
  if (!control.form || control.form.id !== 'i63wo6lr0_0') return;
  const error = control.closest('.mosaic-form__field')?.querySelector('.mosaic-form__error');
  if (!error) return;
  const { message, valid } = consultationValidation(control);
  error.classList.toggle('is-removed', valid);
  if (valid) {
    control.removeAttribute('aria-describedby');
    control.setAttribute('aria-invalid', 'false');
  } else {
    error.querySelector('.text-block-wrap-div').textContent = message;
    control.setAttribute('aria-describedby', error.id);
    control.setAttribute('aria-invalid', 'true');
  }
}

document.addEventListener('input', (event) => {
  const form = event.target.form;
  if (!form) return;
  if (event.target.name === 'pwd' || event.target.name === 'pwd2') {
    validatePasswordConfirmation(form);
  }
  refreshConsultationError(event.target);
  form.querySelector('.jkht-preview-notice[role="status"]')?.remove();
});
document.addEventListener('change', (event) => refreshConsultationError(event.target));
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

function updateQuestionValidity(form) {
  const name = form.querySelector('input[type="text"]');
  const phone = form.querySelector('input[type="tel"]');
  const [start, end] = form.querySelectorAll('input[type="date"]');
  // Match validatePhone on the existing site, including +7, 8 and a bare 10-digit number.
  const phonePattern = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  name.setCustomValidity(name.value && !name.value.trim() ? 'Укажите имя.' : '');
  phone.setCustomValidity(phone.value && !phonePattern.test(phone.value.trim())
    ? 'Проверьте номер телефона. Пример: +7 900 123-45-67.' : '');
  end.setCustomValidity(start.value && end.value && end.value < start.value
    ? 'Дата окончания должна быть не раньше даты начала.' : '');
}

document.addEventListener('input', (event) => {
  const form = event.target.form;
  if (form?.hasAttribute('data-question-form')) updateQuestionValidity(form);
});

// The original home page sends via a button click, before native submit validation.
function checkQuestionSubmit(event) {
  const control = event.type === 'click' && event.target.closest('button[type="submit"], button:not([type]), input[type="submit"]');
  const form = event.type === 'submit' ? event.target : control?.form;
  if (!form?.hasAttribute('data-question-form')) return;
  form.classList.add('preview-validated');
  updateQuestionValidity(form);
  if (form.reportValidity()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

document.addEventListener('click', checkQuestionSubmit, true);
document.addEventListener('submit', checkQuestionSubmit, true);

document.addEventListener('DOMContentLoaded', () => {
  for (const submenu of document.querySelectorAll('.hor-menu__list .hor-menu__sub_list')) {
    const item = submenu.parentElement;
    const trigger = item.querySelector(':scope > a');
    item.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !submenu.getClientRects().length) return;
      event.preventDefault();
      item.classList.add('submenu-dismissed');
      trigger.focus();
    });
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) item.classList.remove('submenu-dismissed');
    });
    item.addEventListener('pointerleave', () => item.classList.remove('submenu-dismissed'));
  }

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
  content.setAttribute('role', 'dialog');
  content.setAttribute('aria-modal', 'true');
  content.setAttribute('aria-label', 'Меню сайта');
  content.inert = true;
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
    content.inert = !visible;
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
    if (!panel.classList.contains('jkht-menu-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      showMenu(false);
    }
    if (event.key !== 'Tab') return;
    const controls = [...content.querySelectorAll('a[href], button, [tabindex="0"]')]
      .filter(control => control.getClientRects().length && getComputedStyle(control).visibility === 'visible');
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (!content.contains(active) || active === (event.shiftKey ? first : last)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  });
});
