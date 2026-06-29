(() => {
  'use strict';
  const RELEASE = new Date('2026-04-29T03:00:00Z');
  const $ = (s, r = document) => r.querySelector(s);
  for (const href of ['assets/css/ux-prod.css', 'assets/css/final-polish.css']) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = href;
    document.head.append(css);
  }

  const dict = {
    ru: {
      locale: 'ru-RU',
      last: 'Последняя проверка',
      lead: 'Что реально влияет на публичный статус сайта.',
      checked: 'Проверено',
      off: 'Official / store',
      offHint: 'меняют главный статус',
      watch: 'Watchlist',
      watchHint: 'ранние неофициальные сигналы',
      sig: 'Сигналы',
      sigHint: 'неподтверждённые упоминания',
      rule: 'Статус считается только по официальным источникам и store metadata.',
      faq: 'Частые вопросы',
      faqLead: 'Только полезная информация для пользователей.',
      rumorQ: 'Почему слухи не меняют статус?',
      rumorA: 'Слух, пост или поисковая выдача могут быть ошибкой или пересказом. Они попадают только в watchlist; главный статус меняется после официального анонса или поля Full Audio / Voice.',
      helpQ: 'Как помочь проекту?',
      helpA: 'Делитесь ссылкой на сайт, отправляйте обращение разработчикам вежливо и без спама, не выдавайте слухи за факт.',
      confirmQ: 'Что считается подтверждением?',
      confirmA: 'Прямой официальный анонс NTE / Perfect World / Hotta Studio или русский язык в отдельном поле Full Audio / Voice на официальной площадке.',
      line: 'Ключевые отметки',
      lineLead: 'Релиз, важные рубежи и текущий день.',
      release: 'Релиз',
      today: 'Сегодня',
      days: 'дней',
      donateTitle: 'Поддержать проект',
      donateText: 'Если проект вам оказался интересным или полезным, или вы просто хотите поддержать проект, это можно сделать по',
      donateLink: 'ссылке'
    },
    en: {
      locale: 'en-US',
      last: 'Last check',
      lead: 'What actually affects the public status.',
      checked: 'Checked',
      off: 'Official / store',
      offHint: 'can change the main status',
      watch: 'Watchlist',
      watchHint: 'early non-official signals',
      sig: 'Signals',
      sigHint: 'unverified mentions',
      rule: 'Public status is based only on official sources and store metadata.',
      faq: 'FAQ',
      faqLead: 'Useful information for visitors.',
      rumorQ: 'Why do rumors not change the status?',
      rumorA: 'A rumor, post, or search result may be wrong or copied. It can only appear in watchlist; the main status changes after an official announcement or Full Audio / Voice field.',
      helpQ: 'How can I help?',
      helpA: 'Share the site, send the appeal politely without spam, and do not present rumors as facts.',
      confirmQ: 'What counts as confirmation?',
      confirmA: 'A direct official announcement from NTE / Perfect World / Hotta Studio or Russian appearing in a separate Full Audio / Voice field on an official platform.',
      line: 'Key milestones',
      lineLead: 'Release, milestones, and today.',
      release: 'Release',
      today: 'Today',
      days: 'days',
      donateTitle: 'Support the project',
      donateText: 'If the project is interesting or useful to you, or you simply want to support it, you can do it via this',
      donateLink: 'link'
    }
  };
  dict.zh = { ...dict.en, locale: 'zh-CN', last: '最后检查', faq: '常见问题', line: '关键节点', release: '上线', today: '今天', days: '天' };
  dict.ko = { ...dict.en, locale: 'ko-KR', last: '마지막 확인', faq: 'FAQ', line: '주요 지점', release: '출시', today: '오늘', days: '일' };
  dict.ja = { ...dict.en, locale: 'ja-JP', last: '最終チェック', faq: 'FAQ', line: '主な節目', release: 'リリース', today: '今日', days: '日' };

  function lang() {
    const h = document.documentElement.lang.toLowerCase();
    return h.startsWith('zh') ? 'zh' : h.startsWith('ko') ? 'ko' : h.startsWith('ja') ? 'ja' : h.startsWith('en') ? 'en' : 'ru';
  }
  function t(k) { return dict[lang()]?.[k] ?? dict.en[k] ?? k; }
  function esc(v) { return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
  function fmt(v, dateOnly = false) {
    if (!v) return '—';
    const d = new Date(v);
    return new Intl.DateTimeFormat(dict[lang()].locale, dateOnly ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  }
  function days(status) {
    const end = status?.state === 'RUSSIAN_VOICE_RELEASED' && status?.confirmed_event?.detected_at ? new Date(status.confirmed_event.detected_at) : new Date();
    return Math.max(0, Math.floor((end - RELEASE) / 864e5));
  }
  function after(n) { return fmt(new Date(RELEASE.getTime() + n * 864e5).toISOString(), true); }
  async function readJson(p) {
    const r = await fetch(p, { cache: 'no-store' });
    if (!r.ok) throw new Error(p);
    return r.json();
  }

  function renderStatus(s) {
    const h = s.source_health || {}, n = $('#uxStatusPanel');
    if (!n) return;
    n.innerHTML = `<section class="ux-panel glass-panel"><div class="ux-panel-head"><div><span class="micro-label">STATUS REPORT</span><h2>${esc(t('last'))}</h2><p>${esc(t('lead'))}</p></div><span class="ux-pill">${esc(t('rule'))}</span></div><div class="ux-compact-report"><article class="ux-stat"><small>${esc(t('checked'))}</small><strong>${esc(fmt(s.last_checked_at))}</strong><span>${esc(s.state_label_ru || s.state)}</span></article><article class="ux-stat"><small>${esc(t('off'))}</small><strong>${esc((h.successful ?? 0) + '/' + (h.total ?? 0))}</strong><span>${esc(t('offHint'))}</span></article><article class="ux-stat"><small>${esc(t('watch'))}</small><strong>${esc(h.non_official_watch ?? 0)}</strong><span>${esc(t('watchHint'))}</span></article><article class="ux-stat"><small>${esc(t('sig'))}</small><strong>${esc(h.unverified_watch_signals ?? 0)}</strong><span>${esc(t('sigHint'))}</span></article></div></section>`;
  }

  function renderTimeline(s) {
    const card = $('.chart-card');
    if (!card) return;
    const d = days(s), max = Math.max(100, d), fill = Math.min(100, Math.round(d / max * 100));
    const marks = [0, 30, 50, 100, d].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    card.innerHTML = `<div class="ux-panel-head"><div><span class="micro-label">TIMELINE</span><h2>${esc(t('line'))}</h2><p>${esc(t('lineLead'))}</p></div></div><div class="ux-timeline"><div class="ux-timeline-track"><span class="ux-timeline-fill" style="width:${fill}%"></span></div><div class="ux-timeline-items">${marks.map(m => `<article class="ux-timeline-item"><b>${m === 0 ? t('release') : m === d ? t('today') : m + ' ' + t('days')}</b><span>${after(m)}</span></article>`).join('')}</div></div>`;
  }

  function renderFaq() {
    const n = $('#uxFaqPanel');
    if (!n) return;
    n.innerHTML = `<section class="ux-panel glass-panel"><div class="ux-panel-head"><div><span class="micro-label">FAQ</span><h2>${esc(t('faq'))}</h2><p>${esc(t('faqLead'))}</p></div></div><div class="ux-faq-grid"><article class="ux-faq-card"><h3>${esc(t('rumorQ'))}</h3><p>${esc(t('rumorA'))}</p></article><article class="ux-faq-card"><h3>${esc(t('confirmQ'))}</h3><p>${esc(t('confirmA'))}</p></article><article class="ux-faq-card"><h3>${esc(t('helpQ'))}</h3><p>${esc(t('helpA'))}</p></article></div></section>`;
  }

  function renderDonation(meta) {
    const oldShare = $('#uxSharePanel');
    if (oldShare) { oldShare.innerHTML = ''; oldShare.style.display = 'none'; }
    $('#uxBottomPanel')?.remove();
    $('#uxBackingPanel')?.remove();
    if (!meta?.support_url) return;
    const host = $('#uxFaqPanel');
    if (!host) return;
    let n = $('#uxDonationPanel');
    if (!n) { n = document.createElement('div'); n.id = 'uxDonationPanel'; n.className = 'ux-slot'; host.after(n); }
    n.innerHTML = `<section class="ux-donation-mini glass-panel"><div><span class="micro-label">SUPPORT</span><p>${esc(t('donateText'))} <a href="${esc(meta.support_url)}" target="_blank" rel="noopener noreferrer">${esc(t('donateLink'))}</a>.</p></div>${meta.qr_url ? `<a class="ux-donation-qr" href="${esc(meta.support_url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(meta.qr_url)}" alt="QR" loading="lazy"></a>` : ''}</section>`;
  }

  let status = null, donation = null;
  async function boot() {
    status = await readJson('data/status.json').catch(() => ({ state: 'UNKNOWN', state_label_ru: 'Статус временно не подтверждён', source_health: {} }));
    donation = await readJson('assets/config/project.json').catch(() => null);
    const all = () => { renderStatus(status); renderTimeline(status); renderFaq(); renderDonation(donation); };
    all();
    new MutationObserver(all).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
