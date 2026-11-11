/*
  main.js — минимальная интерактивность проекта.
  Сайт полностью работает и без JavaScript:
  - меню и фильтры просто остаются раскрытыми;
  - кнопки «Заказать» — обычные ссылки на страницу order.html.
  Скрипт только улучшает поведение на маленьких экранах и в формах.
*/

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Мобильное меню ----------
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.getElementById('site-nav');
  const desktopQuery = window.matchMedia('(min-width: 768px)');

  const setMenu = (isOpen) => {
    if (!menuToggle || !siteNav) return;
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    siteNav.classList.toggle('site-nav--open', isOpen);
  };

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      setMenu(!isOpen);
    });

    // Escape закрывает меню и возвращает фокус на кнопку
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && siteNav.classList.contains('site-nav--open')) {
        setMenu(false);
        menuToggle.focus();
      }
    });

    // Клик по пункту меню (например, якорю) закрывает меню
    siteNav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });

    // При переходе на планшетную ширину меню сбрасывается
    desktopQuery.addEventListener('change', () => setMenu(false));
  }

  // ---------- Фильтры каталога на телефоне ----------
  const filters = document.querySelector('.filters');
  const filtersToggle = document.querySelector('.filters__toggle');

  if (filters && filtersToggle) {
    filtersToggle.addEventListener('click', () => {
      const isOpen = filtersToggle.getAttribute('aria-expanded') === 'true';
      filtersToggle.setAttribute('aria-expanded', String(!isOpen));
      filtersToggle.textContent = isOpen ? 'Показать фильтры' : 'Скрыть фильтры';
      filters.classList.toggle('filters--open', !isOpen);
    });
  }

  // ---------- Кнопка «Наверх» ----------
  const toTop = document.querySelector('.to-top');

  if (toTop) {
    const updateToTop = () => {
      toTop.classList.toggle('to-top--visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', updateToTop, { passive: true });
    updateToTop();
  }

  // ---------- Уведомление об отправке ----------
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    toastText.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 6000);
  };

  // ---------- Модальное окно быстрой заявки ----------
  const orderDialog = document.getElementById('order-dialog');
  const quickPlant = document.getElementById('quick-plant');

  if (orderDialog && typeof orderDialog.showModal === 'function') {
    // Ссылки «Заказать» с data-product открывают окно вместо перехода
    document.querySelectorAll('[data-product]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        if (quickPlant) quickPlant.value = link.dataset.product;
        orderDialog.showModal();
        // Фокус сразу на первое незаполненное поле
        const firstEmpty = orderDialog.querySelector('input:not([type="checkbox"])');
        if (firstEmpty) firstEmpty.focus();
      });
    });

    orderDialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
      button.addEventListener('click', () => orderDialog.close());
    });

    // Клик по затемнённому фону закрывает окно
    orderDialog.addEventListener('click', (event) => {
      if (event.target === orderDialog) orderDialog.close();
    });
  }

  // ---------- Валидация форм ----------
  const messages = {
    valueMissing: 'Заполните это поле',
    typeMismatch: 'Проверьте формат: например, example@mail.ru',
    patternMismatch: 'Введите телефон в формате +7 (900) 000-00-00',
    tooShort: 'Слишком коротко',
    rangeUnderflow: 'Значение слишком маленькое',
    rangeOverflow: 'Значение слишком большое',
  };

  const getMessage = (field) => {
    if (field.type === 'checkbox' && field.validity.valueMissing) {
      return 'Нужно согласие, чтобы отправить заявку';
    }
    if (field.tagName === 'SELECT' && field.validity.valueMissing) {
      return 'Выберите вариант из списка';
    }
    if (field.validity.tooShort) {
      return `Минимум ${field.minLength} символа`;
    }
    const key = Object.keys(messages).find((name) => field.validity[name]);
    return key ? messages[key] : field.validationMessage;
  };

  const showFieldState = (field) => {
    const error = document.getElementById(`${field.id}-error`);
    const isValid = field.checkValidity();
    if (isValid) {
      field.removeAttribute('aria-invalid');
    } else {
      field.setAttribute('aria-invalid', 'true');
    }
    if (error) error.textContent = isValid ? '' : getMessage(field);
    return isValid;
  };

  const successText = {
    'quick-form': 'Заявка отправлена. Перезвоним в течение 15 минут.',
    'order-form': 'Заказ отправлен. Менеджер перезвонит для подтверждения.',
    'feedback-form': 'Сообщение отправлено. Ответим в течение рабочего дня.',
  };

  document.querySelectorAll('.order-form').forEach((form) => {
    const fields = Array.from(form.elements).filter((el) => el.willValidate && el.id);

    // Ошибка пропадает, как только поле исправлено
    fields.forEach((field) => {
      const eventName = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, () => {
        if (field.getAttribute('aria-invalid') === 'true') showFieldState(field);
      });
      field.addEventListener('blur', () => {
        if (field.value) showFieldState(field);
      });
    });

    form.addEventListener('submit', (event) => {
      // Backend пока не подключён, поэтому отправку отменяем
      event.preventDefault();
      const invalid = fields.filter((field) => !showFieldState(field));

      if (invalid.length > 0) {
        invalid[0].focus();
        return;
      }

      form.reset();
      const dialog = form.closest('dialog');
      if (dialog) dialog.close();
      showToast(successText[form.id] || 'Отправлено');
    });

    form.addEventListener('reset', () => {
      fields.forEach((field) => {
        field.removeAttribute('aria-invalid');
        const error = document.getElementById(`${field.id}-error`);
        if (error) error.textContent = '';
      });
    });
  });

  // ---------- Страница заказа ----------
  const orderPlant = document.getElementById('order-plant');
  const orderDate = document.getElementById('order-date');
  const address = document.getElementById('order-address');

  // Растение из ссылки order.html?plant=monstera выбирается автоматически
  if (orderPlant) {
    const plant = new URLSearchParams(window.location.search).get('plant');
    if (plant && orderPlant.querySelector(`option[value="${CSS.escape(plant)}"]`)) {
      orderPlant.value = plant;
    }
  }

  // Нельзя выбрать прошедшую дату доставки
  if (orderDate) {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    orderDate.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  }

  // При самовывозе поле адреса отключается — состояние :disabled
  document.querySelectorAll('input[name="delivery"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!address) return;
      address.disabled = radio.value === 'pickup' && radio.checked;
    });
  });
});
