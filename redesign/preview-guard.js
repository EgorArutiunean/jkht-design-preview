const phonePattern = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const previewErrors = new WeakMap();

function paymentFieldError(control, value) {
  if (control.id === 'client_orderid') {
    if (control.maxLength === 11 && !/^\d{8}(?:\d{3})?$/.test(value)) {
      return 'Введите 8 или 11 цифр лицевого счёта.';
    }
    if (control.maxLength === 8 && value.length < 7) {
      return 'Введите номер лицевого счёта (от 7 до 8 символов).';
    }
  }
  if (control.id === 'client_fio' && value.length < 7) return 'Укажите ФИО как в договоре.';
  if (control.id === 'client_car_number' && value.length < 5) return 'Укажите номер автомобиля.';
  return '';
}

function fieldError(control) {
  const value = control.value.trim();
  const { validity, type, form } = control;
  if (validity.badInput) return 'Проверьте формат введённых данных.';
  if (validity.valueMissing || (control.required && type !== 'password' && !value)) {
    if (control.id === 'iiur1e8r5_0') return 'Необходимо согласиться на обработку персональных данных.';
    if (type === 'checkbox') return 'Отметьте согласие, чтобы продолжить.';
    return 'Заполните это поле.';
  }
  if (type === 'email' && value && (validity.typeMismatch || !emailPattern.test(value))) {
    return 'Введите корректный адрес электронной почты.';
  }
  if (type === 'tel' && value && !phonePattern.test(value)) {
    return 'Введите телефон в формате российского номера, например +7 (925) 309-82-27.';
  }
  if (control.maxLength >= 0 && control.value.length > control.maxLength) {
    return `Введите не более ${control.maxLength} символов.`;
  }
  if (validity.rangeUnderflow) return `Минимальная сумма: ${control.min} ₽.`;
  if (form.id === 'form_g-user-register' && control.name === 'pwd2' &&
      control.value !== form.elements.namedItem('pwd').value) {
    return 'Пароли не совпадают.';
  }
  if (control.id === 'iuk46c2zz_0') {
    const start = form.querySelector('#itahrl7o2_0');
    if (control.valueAsNumber < start.valueAsNumber) return 'Дата окончания должна быть не раньше даты начала.';
  }
  if (form.id === 'TinkoffPayForm' && value) {
    const message = paymentFieldError(control, value);
    if (message) return message;
  }
  return control.validationMessage;
}

function renderFieldError(control, message) {
  const error = previewErrors.get(control);
  if (!error) return;

  const description = (control.getAttribute('aria-describedby') || '').split(/\s+/)
    .filter(id => id && id !== error.id);
  if (message) description.push(error.id);
  if (description.length) control.setAttribute('aria-describedby', description.join(' '));
  else control.removeAttribute('aria-describedby');
  control.setAttribute('aria-invalid', String(Boolean(message)));
  if (message) {
    if (error.textContent !== message) error.textContent = message;
    error.hidden = false;
    error.classList.remove('is-removed');
  } else {
    error.hidden = true;
    error.classList.add('is-removed');
  }
}

function validatePreviewForm(form, showErrors, editedControl) {
  let firstInvalid = null;
  for (const control of form.elements) {
    if (!control.willValidate || !previewErrors.has(control)) continue;
    control.setCustomValidity('');
    const message = fieldError(control);
    control.setCustomValidity(message);
    if (showErrors || control === editedControl || control.getAttribute('aria-invalid') === 'true') {
      renderFieldError(control, message);
    }
    if (message) firstInvalid ||= control;
  }
  return firstInvalid;
}

// Capture legacy button clicks too, before any scripts attached to the controls.
function stopPreviewSubmit(event) {
  const submitter = event.type === 'click' && event.target.closest('button, input');
  const form = event.type === 'submit' ? event.target : submitter?.form;
  if (!form || (submitter && submitter.type !== 'submit' && submitter.type !== 'image')) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  if (form.id === 'TinkoffPayForm') return;
  form.classList.add('preview-validated');
  let notice = form.querySelector('.jkht-preview-notice[role="status"]');
  const invalid = validatePreviewForm(form, true);
  if (invalid) {
    if (notice) notice.textContent = '';
    invalid.focus();
    return;
  }
  if (!notice) {
    notice = document.createElement('p');
    notice.className = 'jkht-preview-notice';
    notice.setAttribute('role', 'status');
    form.append(notice);
  }
  notice.textContent = 'Тестовая версия. Данные не отправлены.';
}

document.addEventListener('submit', stopPreviewSubmit, true);
document.addEventListener('click', stopPreviewSubmit, true);

function updatePreviewFields(event) {
  const control = event.target;
  const form = control.form;
  if (!form || !previewErrors.has(control)) return;
  const notice = form.querySelector('.jkht-preview-notice[role="status"]');
  if (notice) notice.textContent = '';
  validatePreviewForm(form, form.classList.contains('preview-validated'), control);
}

document.addEventListener('input', updatePreviewFields);
document.addEventListener('change', updatePreviewFields);

function preparePreviewForms() {
  for (const form of document.forms) {
    form.classList.add('jkht-form');
    form.noValidate = true;
    for (const control of form.elements) {
      if (!control.willValidate || !control.matches('input:not([type="submit"], [type="image"]), select, textarea')) continue;
      if (control.id === 'if6htdyfj_0') control.maxLength = 100;
      if (control.id === 'iiur1e8r5_0') control.setAttribute('aria-label', 'Согласие на обработку персональных данных');
      const field = control.closest('.mosaic-form__field');
      if (field && control.type === 'date') {
        const group = document.createElement('div');
        group.className = 'jkht-form-date';
        const label = document.createElement('label');
        label.htmlFor = control.id;
        label.textContent = control.getAttribute('aria-label');
        control.before(group);
        group.append(label, control);
      } else if (field && !control.labels?.length && control.placeholder && !control.hasAttribute('aria-label')) {
        const label = document.createElement('label');
        label.htmlFor = control.id;
        label.className = 'preview-field-label';
        label.textContent = control.placeholder;
        control.before(label);
      }
      let error = control.type === 'date' ? null : field?.querySelector('.mosaic-form__error');
      if (!error) {
        error = document.createElement('p');
        error.id = `${control.id}-preview-error`;
        (control.closest('label') || control).after(error);
      }
      error.classList.add('jkht-form-error');
      error.setAttribute('data-nosnippet', '');
      error.hidden = true;
      previewErrors.set(control, error);
    }
  }
}

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
  preparePreviewForms();

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

  const panel = document.querySelector('.side-panel');
  const open = panel?.querySelector('.side-panel__button-open');
  const close = panel?.querySelector('.side-panel__button-close');
  const mask = panel?.querySelector('.side-panel__mask');
  const content = panel?.querySelector('.side-panel__content');
  if (!open || !close || !mask || !content) return;

  const compactMenu = matchMedia('(width < 992px)');
  open.setAttribute('aria-controls', content.id);
  open.setAttribute('aria-expanded', 'false');
  mask.setAttribute('aria-hidden', 'true');
  content.setAttribute('role', 'dialog');
  content.setAttribute('aria-modal', 'true');
  content.setAttribute('aria-label', 'Меню сайта');
  content.setAttribute('aria-hidden', 'true');
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
    if (visible === panel.classList.contains('jkht-menu-open')) return;
    if (visible && !compactMenu.matches) return;

    const hadScrollbar = visible && window.innerWidth > document.documentElement.clientWidth;
    panel.classList.toggle('jkht-menu-had-scrollbar', hadScrollbar);
    panel.classList.toggle('jkht-menu-open', visible);
    open.setAttribute('aria-expanded', String(visible));
    if (visible) {
      content.inert = false;
      content.setAttribute('aria-hidden', 'false');
      close.focus({ preventScroll: true });
    } else {
      const returnTarget = compactMenu.matches ? open : document.querySelector('header .hor-menu__list > li > a');
      returnTarget?.focus({ preventScroll: true });
      content.inert = true;
      content.setAttribute('aria-hidden', 'true');
    }
  }

  compactMenu.addEventListener('change', ({ matches }) => {
    if (!matches) showMenu(false);
  });
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
