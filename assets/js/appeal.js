(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const BRAND_ICON = 'assets/brand/nte-site-icon.svg';
  const BRAND_SYMBOL = 'assets/brand/nte-symbol.svg';

  const SUPPORTED = ['ru', 'zh', 'en', 'ko', 'ja'];
  const CIS_LANGUAGE_PREFIXES = ['ru', 'uk', 'be', 'kk', 'uz', 'ky', 'hy', 'az', 'tg', 'tk', 'mo', 'ro'];

  const LANG_META = {
    ru: { html: 'ru', copy: 'Скопировать обращение', copied: 'Обращение скопировано', failed: 'Не удалось скопировать', back: '← К счётчику' },
    zh: { html: 'zh-CN', copy: '复制倡议文本', copied: '倡议文本已复制', failed: '复制失败', back: '← 返回计数器' },
    en: { html: 'en', copy: 'Copy appeal', copied: 'Appeal copied', failed: 'Copy failed', back: '← Back to counter' },
    ko: { html: 'ko', copy: '호소문 복사', copied: '호소문이 복사되었습니다', failed: '복사하지 못했습니다', back: '← 카운터로' },
    ja: { html: 'ja', copy: '要望文をコピー', copied: '要望文をコピーしました', failed: 'コピーできませんでした', back: '← カウンターへ' }
  };

  let activeLanguage = detectLanguage();
  let toastTimer;

  function applyBrandAssets() {
    for (const rel of ['icon', 'shortcut icon']) {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.append(link);
      }
      link.href = BRAND_ICON;
      link.type = 'image/svg+xml';
      link.sizes = 'any';
    }
    if (!document.getElementById('appealBrandStyle')) {
      const style = document.createElement('style');
      style.id = 'appealBrandStyle';
      style.textContent = `.appeal-header .brand{gap:14px!important}.appeal-header .brand-mark{width:48px!important;height:48px!important;border:0!important;border-radius:0!important;display:block!important;place-items:unset!important;transform:none!important;background:url('${BRAND_SYMBOL}') center/contain no-repeat!important;box-shadow:none!important;filter:drop-shadow(0 0 16px rgba(143,120,255,.36)) drop-shadow(0 0 18px rgba(86,217,255,.18))}.appeal-header .brand-mark>span{display:none!important}.appeal-header .brand-copy strong{letter-spacing:.13em}.appeal-header .brand-copy small{letter-spacing:.2em}@media(max-width:700px){.appeal-header .brand-mark{width:42px!important;height:42px!important}}`;
      document.head.append(style);
    }
  }

  function normalizeLanguage(value) {
    return String(value || '').toLowerCase().split('-')[0];
  }

  function detectLanguage() {
    const saved = localStorage.getItem('nte-appeal-language') || localStorage.getItem('nte-language');
    if (SUPPORTED.includes(saved)) return saved;

    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const raw of languages) {
      const lang = normalizeLanguage(raw);
      if (lang === 'zh') return 'zh';
      if (lang === 'ko') return 'ko';
      if (lang === 'ja') return 'ja';
      if (CIS_LANGUAGE_PREFIXES.includes(lang)) return 'ru';
      if (lang === 'en') return 'en';
    }
    return 'en';
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function switchLanguage(lang) {
    if (!LANG_META[lang]) return;
    activeLanguage = lang;
    localStorage.setItem('nte-appeal-language', lang);
    localStorage.setItem('nte-language', lang);

    $$('[data-lang-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.langPanel !== lang;
    });
    $$('[data-lang-button]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.langButton === lang);
    });

    document.documentElement.lang = LANG_META[lang].html;
    $('#copyAppeal').textContent = LANG_META[lang].copy;
    const back = $('.appeal-actions a[href="index.html"]');
    if (back) back.textContent = LANG_META[lang].back;
    window.scrollTo({ top: 0, behavior: 'auto' });
    updateProgress();
  }

  function appealText() {
    const panel = $(`[data-lang-panel="${activeLanguage}"]`);
    const clone = panel.cloneNode(true);

    clone.querySelectorAll('button, .appeal-index').forEach((node) => node.remove());

    return [...clone.querySelectorAll('h1,h2,h3,p,.pull-quote,.final-quote,.final-requests span')]
      .map((node) => node.textContent.trim())
      .filter(Boolean)
      .join('\n\n') + '\n\nhttps://bonaqu.github.io/nte-russian-voice-watch/appeal.html';
  }

  async function copyAppeal() {
    try {
      await navigator.clipboard.writeText(appealText());
      showToast(LANG_META[activeLanguage].copied);
    } catch {
      showToast(LANG_META[activeLanguage].failed);
    }
  }

  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? scrollY / max : 0;
    $('#appealProgress').style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyBrandAssets();
    $$('[data-lang-button]').forEach((button) => {
      button.addEventListener('click', () => switchLanguage(button.dataset.langButton));
    });
    $('#copyAppeal').addEventListener('click', copyAppeal);
    $$('[data-copy-appeal]').forEach((button) => button.addEventListener('click', copyAppeal));
    addEventListener('scroll', updateProgress, { passive: true });
    addEventListener('resize', updateProgress);
    switchLanguage(activeLanguage);
  });
})();
