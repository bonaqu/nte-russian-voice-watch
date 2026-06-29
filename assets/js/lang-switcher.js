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

  function enhanceLanguageSelect() {
    const select = document.getElementById('languageSelect');
    if (!select || select.dataset.enhanced === 'true') return;

    const holder = select.closest('.site-language') || select.parentElement;
    if (!holder) return;

    select.dataset.enhanced = 'true';
    holder.classList.add('is-enhanced');

    const switcher = document.createElement('div');
    switcher.className = 'language-switch main-language-switch';
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Language');

    [...select.options].forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.langButton = option.value;
      button.textContent = labels[option.value] || option.textContent;
      button.setAttribute('aria-label', names[option.value] || option.textContent);
      button.addEventListener('click', () => chooseLanguage(option.value));
      switcher.append(button);
    });

    holder.append(switcher);

    select.addEventListener('change', syncActiveButton);
    syncActiveButton();
  }

  function syncActiveButton() {
    const select = document.getElementById('languageSelect');
    if (!select) return;

    document.querySelectorAll('[data-lang-button]').forEach((button) => {
      const active = button.dataset.langButton === select.value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function chooseLanguage(lang) {
    const select = document.getElementById('languageSelect');
    if (!select || select.value === lang) return;

    document.body.classList.add('language-changing');

    window.setTimeout(() => {
      select.value = lang;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncActiveButton();

      window.setTimeout(() => {
        document.body.classList.remove('language-changing');
      }, 220);
    }, 90);
  }

  document.addEventListener('DOMContentLoaded', enhanceLanguageSelect);
})();
