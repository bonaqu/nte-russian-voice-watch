(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let activeLanguage = localStorage.getItem('nte-appeal-language') || 'ru';
  let toastTimer;

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function switchLanguage(lang) {
    activeLanguage = lang;
    localStorage.setItem('nte-appeal-language', lang);
    $$('[data-lang-panel]').forEach((panel) => { panel.hidden = panel.dataset.langPanel !== lang; });
    $$('[data-lang-button]').forEach((button) => button.classList.toggle('is-active', button.dataset.langButton === lang));
    document.documentElement.lang = lang;
    $('#copyAppeal').textContent = lang === 'ru' ? 'Скопировать обращение' : 'Copy appeal';
    window.scrollTo({ top: 0, behavior: 'auto' });
    updateProgress();
  }

  function appealText() {
    const panel = $(`[data-lang-panel="${activeLanguage}"]`);
    const clone = panel.cloneNode(true);
    clone.querySelectorAll('a, button, .appeal-index, .source-note, .honesty-note, .disclaimer').forEach((node) => {
      if (node.matches('a') && !node.closest('.source-note')) return;
      if (node.matches('button')) node.remove();
    });
    return [...clone.querySelectorAll('h1,h2,h3,p,.pull-quote,.final-quote,.final-requests span')]
      .map((node) => node.textContent.trim()).filter(Boolean).join('\n\n') + '\n\nhttps://bonaqu.github.io/nte-russian-voice-watch/appeal.html';
  }

  async function copyAppeal() {
    try {
      await navigator.clipboard.writeText(appealText());
      showToast(activeLanguage === 'ru' ? 'Обращение скопировано' : 'Appeal copied');
    } catch {
      showToast(activeLanguage === 'ru' ? 'Не удалось скопировать' : 'Copy failed');
    }
  }

  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? scrollY / max : 0;
    $('#appealProgress').style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $$('[data-lang-button]').forEach((button) => button.addEventListener('click', () => switchLanguage(button.dataset.langButton)));
    $('#copyAppeal').addEventListener('click', copyAppeal);
    $$('[data-copy-appeal]').forEach((button) => button.addEventListener('click', copyAppeal));
    addEventListener('scroll', updateProgress, { passive: true });
    addEventListener('resize', updateProgress);
    switchLanguage(activeLanguage);
  });
})();
