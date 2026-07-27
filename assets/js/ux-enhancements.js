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

  function applyBrandAssets() {
    const iconHref = 'assets/brand/nte-favicon-transparent.svg';
    for (const rel of ['icon', 'shortcut icon']) {
      const link = document.createElement('link');
      link.rel = rel;
      link.type = 'image/svg+xml';
      link.sizes = 'any';
      link.href = iconHref;
      document.head.append(link);
    }
  }
  applyBrandAssets();

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
      confirmQ: 'Что считается подтверждением?',
      confirmA: 'Прямой официальный анонс NTE / Perfect World / Hotta Studio или русский язык в отдельном поле Full Audio / Voice на официальной площадке.',
      signalQ: 'Нашли упоминание?',
      signalA: 'Лучше сверить первоисточник: официальный сайт, Steam, PlayStation или другое store-поле. Неофициальная новость — это сигнал для проверки, но не факт.',
      helpQ: 'Как помочь проекту?',
      helpSite: 'Распространяйте ссылку на сайт.',
      helpAppeal: 'Вы можете делиться информацией об этом сайте с разработчиками, но вежливо и без спама.',
      helpSupport: 'Если хотите оказать добровольную поддержку проекту, это можно сделать по',
      helpLink: 'ссылке',
      line: 'Ключевые отметки',
      lineLead: 'Релиз, важные рубежи и текущий день.',
      release: 'Релиз',
      today: 'Сегодня',
      days: 'дней'
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
      confirmQ: 'What counts as confirmation?',
      confirmA: 'A direct official announcement from NTE / Perfect World / Hotta Studio or Russian appearing in a separate Full Audio / Voice field on an official platform.',
      signalQ: 'Found a mention?',
      signalA: 'Check the primary source first: official site, Steam, PlayStation, or another store voice field. A non-official article is a signal to verify, not a fact.',
      helpQ: 'How can I help?',
      helpSite: 'Share the site link.',
      helpAppeal: 'You can share information about this site with the developers, politely and without spam.',
      helpSupport: 'If you want to support the project voluntarily, you can do it via this',
      helpLink: 'link',
      line: 'Key milestones',
      lineLead: 'Release, milestones, and today.',
      release: 'Release',
      today: 'Today',
      days: 'days'
    }
  };
  dict.zh = { ...dict.en, locale: 'zh-CN', last: '最后检查', faq: '常见问题', line: '关键节点', release: '上线', today: '今天', days: '天' };
  dict.ko = { ...dict.en, locale: 'ko-KR', last: '마지막 확인', faq: 'FAQ', line: '주요 지점', release: '출시', today: '오늘', days: '일' };
  dict.ja = { ...dict.en, locale: 'ja-JP', last: '最終チェック', faq: 'FAQ', line: '主な節目', release: 'リリース', today: '今日', days: '日' };

  const STATE_LABELS = {
    ru: {
      NO_RUSSIAN_VOICE: 'Русской озвучки нет',
      POSSIBLE_MENTION: 'Нужно проверить сигнал',
      CONFIRMED_ANNOUNCEMENT: 'Русская озвучка анонсирована',
      RUSSIAN_VOICE_RELEASED: 'Русская озвучка доступна',
      UNKNOWN: 'Статус не подтверждён'
    },
    zh: {
      NO_RUSSIAN_VOICE: '没有俄语配音',
      POSSIBLE_MENTION: '需要核查信号',
      CONFIRMED_ANNOUNCEMENT: '俄语配音已公告',
      RUSSIAN_VOICE_RELEASED: '俄语配音可用',
      UNKNOWN: '状态未确认'
    },
    en: {
      NO_RUSSIAN_VOICE: 'No Russian voice-over',
      POSSIBLE_MENTION: 'Signal needs verification',
      CONFIRMED_ANNOUNCEMENT: 'Russian voice-over announced',
      RUSSIAN_VOICE_RELEASED: 'Russian voice-over available',
      UNKNOWN: 'Status unconfirmed'
    },
    ko: {
      NO_RUSSIAN_VOICE: '러시아어 음성 없음',
      POSSIBLE_MENTION: '신호 확인 필요',
      CONFIRMED_ANNOUNCEMENT: '러시아어 음성 발표됨',
      RUSSIAN_VOICE_RELEASED: '러시아어 음성 사용 가능',
      UNKNOWN: '상태 미확인'
    },
    ja: {
      NO_RUSSIAN_VOICE: 'ロシア語音声なし',
      POSSIBLE_MENTION: 'シグナル確認が必要',
      CONFIRMED_ANNOUNCEMENT: 'ロシア語音声が発表済み',
      RUSSIAN_VOICE_RELEASED: 'ロシア語音声が利用可能',
      UNKNOWN: 'ステータス未確認'
    }
  };

  function lang() {
    const h = document.documentElement.lang.toLowerCase();
    return h.startsWith('zh') ? 'zh' : h.startsWith('ko') ? 'ko' : h.startsWith('ja') ? 'ja' : h.startsWith('en') ? 'en' : 'ru';
  }
  function t(k) { return dict[lang()]?.[k] ?? dict.en[k] ?? k; }
  function stateLabel(state) {
    const code = state || 'UNKNOWN';
    return STATE_LABELS[lang()]?.[code] ?? STATE_LABELS.en[code] ?? STATE_LABELS[lang()].UNKNOWN;
  }
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
    n.innerHTML = `<section class="ux-panel glass-panel"><div class="ux-panel-head"><div><span class="micro-label">STATUS REPORT</span><h2>${esc(t('last'))}</h2><p>${esc(t('lead'))}</p></div><span class="ux-pill">${esc(t('rule'))}</span></div><div class="ux-compact-report"><article class="ux-stat"><small>${esc(t('checked'))}</small><strong>${esc(fmt(s.last_checked_at))}</strong><span>${esc(stateLabel(s.state))}</span></article><article class="ux-stat"><small>${esc(t('off'))}</small><strong>${esc((h.successful ?? 0) + '/' + (h.total ?? 0))}</strong><span>${esc(t('offHint'))}</span></article><article class="ux-stat"><small>${esc(t('watch'))}</small><strong>${esc(h.non_official_watch ?? 0)}</strong><span>${esc(t('watchHint'))}</span></article><article class="ux-stat"><small>${esc(t('sig'))}</small><strong>${esc(h.unverified_watch_signals ?? 0)}</strong><span>${esc(t('sigHint'))}</span></article></div></section>`;
  }

  function renderTimeline(s) {
    const card = $('.chart-card');
    if (!card) return;
    const d = days(s), max = Math.max(100, d), fill = Math.min(100, Math.round(d / max * 100));
    const marks = [0, 30, 50, 100, d].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    card.innerHTML = `<div class="ux-panel-head"><div><span class="micro-label">TIMELINE</span><h2>${esc(t('line'))}</h2><p>${esc(t('lineLead'))}</p></div></div><div class="ux-timeline"><div class="ux-timeline-track"><span class="ux-timeline-fill" style="width:${fill}%"></span></div><div class="ux-timeline-items">${marks.map(m => `<article class="ux-timeline-item"><b>${m === 0 ? t('release') : m === d ? t('today') : m + ' ' + t('days')}</b><span>${after(m)}</span></article>`).join('')}</div></div>`;
  }

  function supportCard(meta) {
    const support = meta?.support_url ? `${esc(t('helpSupport'))} <a href="${esc(meta.support_url)}" target="_blank" rel="noopener noreferrer">${esc(t('helpLink'))}</a>.` : '';
    return `<article class="ux-faq-card ux-faq-support"><h3>${esc(t('helpQ'))}</h3><ul><li>${esc(t('helpSite'))}</li><li>${esc(t('helpAppeal'))}</li>${support ? `<li>${support}</li>` : ''}</ul></article>`;
  }

  function renderFaq(meta) {
    const n = $('#uxFaqPanel');
    if (!n) return;
    n.innerHTML = `<section class="ux-panel glass-panel"><div class="ux-panel-head"><div><span class="micro-label">FAQ</span><h2>${esc(t('faq'))}</h2><p>${esc(t('faqLead'))}</p></div></div><div class="ux-faq-grid"><article class="ux-faq-card"><h3>${esc(t('rumorQ'))}</h3><p>${esc(t('rumorA'))}</p></article><article class="ux-faq-card"><h3>${esc(t('confirmQ'))}</h3><p>${esc(t('confirmA'))}</p></article><article class="ux-faq-card"><h3>${esc(t('signalQ'))}</h3><p>${esc(t('signalA'))}</p></article>${supportCard(meta)}</div></section>`;
  }

  let status = null, support = null;
  async function boot() {
    status = await readJson('data/status.json').catch(() => ({ state: 'UNKNOWN', state_label_ru: 'Статус временно не подтверждён', source_health: {} }));
    support = await readJson('assets/config/project.json').catch(() => null);
    const staleShare = $('#uxSharePanel');
    if (staleShare) { staleShare.innerHTML = ''; staleShare.style.display = 'none'; }
    $('#uxBottomPanel')?.remove();
    $('#uxBackingPanel')?.remove();
    $('#uxDonationPanel')?.remove();
    const all = () => { renderStatus(status); renderTimeline(status); renderFaq(support); };
    all();
    new MutationObserver(all).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
