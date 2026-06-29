(() => {
  'use strict';

  const labels = {
    ru: 'RU',
    zh: '中文',
    en: 'EN',
    ko: '한국어',
    ja: '日本語',
  };

  const names = {
    ru: 'Русский',
    zh: '中文',
    en: 'English',
    ko: '한국어',
    ja: '日本語',
  };

  const supported = Object.keys(labels);

  function ensureCompatibilitySelect() {
    let select = document.getElementById('languageSelect');
    if (select) return select;

    select = document.createElement('select');
    select.id = 'languageSelect';
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;
    select.className = 'language-compat-select';

    supported.forEach((lang) => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = labels[lang];
      select.append(option);
    });

    document.body.append(select);
    return select;
  }

  function syncActiveButton() {
    const select = document.getElementById('languageSelect');
    if (!select) return;

    document.querySelectorAll('.top-actions .language-switch [data-lang-button]').forEach((button) => {
      const active = button.dataset.langButton === select.value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function chooseLanguage(lang) {
    const select = ensureCompatibilitySelect();
    if (!select || select.value === lang) return;

    document.body.classList.add('language-changing');

    window.setTimeout(() => {
      select.value = lang;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncActiveButton();

      window.setTimeout(() => {
        document.body.classList.remove('language-changing');
      }, 240);
    }, 90);
  }

  function setupButtons() {
    const switcher = document.querySelector('.top-actions .language-switch');
    if (!switcher) return;

    switcher.querySelectorAll('[data-lang-button]').forEach((button) => {
      const lang = button.dataset.langButton;
      button.type = 'button';
      button.setAttribute('aria-label', names[lang] || button.textContent.trim());
      button.addEventListener('click', () => chooseLanguage(lang));
    });

    const select = ensureCompatibilitySelect();
    select.addEventListener('change', syncActiveButton);
    syncActiveButton();
  }

  ensureCompatibilitySelect();
  document.addEventListener('DOMContentLoaded', setupButtons);
})();
