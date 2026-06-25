(() => {
  'use strict';

  const RELEASE_UTC = new Date('2026-04-29T03:00:00Z');
  const DATA_BASE = 'data/';
  const state = {
    status: null,
    evidence: null,
    history: null,
    timer: null,
    historyLimit: 40,
    deferredInstall: null,
  };

  const milestones = [
    { day: 30, title: 'Месяц тишины', text: 'Первый месяц пройден. Русский текст есть, а голоса всё ещё живут в параллельной вселенной.' },
    { day: 50, title: 'Полтинник', text: 'Пятьдесят дней. Это уже не задержка реплики, это отдельная сюжетная арка.' },
    { day: 100, title: 'Стодневная аномалия', text: 'Сто дней без русского дубляжа. Этеро официально умеет ждать лучше нас.' },
    { day: 150, title: 'Полсезона ожидания', text: 'Сто пятьдесят дней. Русскоязычная аудитория всё ещё проходит сюжет глазами.' },
    { day: 250, title: 'Четверть тысячи', text: 'Двести пятьдесят дней. Озвучка пока существует только в разделе «хотелось бы».' },
    { day: 365, title: 'Год без голоса', text: 'Полный круг вокруг Солнца. Субтитры держат оборону, дубляж всё ещё не вышел из тумана.' },
    { day: 500, title: 'Пятисотая ночь', text: 'Пятьсот дней. Русская озвучка переходит из функции в городскую легенду.' },
    { day: 750, title: 'Три четверти тысячи', text: 'Семьсот пятьдесят дней. Даже аномалии уже начали спрашивать, когда будет дубляж.' },
    { day: 1000, title: 'Тысячедневная хроника', text: 'Тысяча дней. Это уже не счётчик, а исторический документ.' },
    { day: 1250, title: 'Дальняя орбита', text: 'Тысяча двести пятьдесят дней. Сигнал всё ещё идёт, надежда пока не снята с производства.' },
    { day: 1500, title: 'Архив ожидания', text: 'Полторы тысячи дней. Проект пережил несколько поколений баннеров и всё ещё слушает тишину.' },
    { day: 2000, title: 'Легендарный уровень', text: 'Две тысячи дней. Если дубляж появится сейчас, это будет финальный босс локализации.' },
  ];

  const labels = {
    NO_RUSSIAN_VOICE: {
      voice: 'Не анонсирован',
      context: 'без подтверждённой русской озвучки',
      confidence: 'высокая',
    },
    POSSIBLE_MENTION: {
      voice: 'Нужно проверить',
      context: 'до подтверждения русской озвучки',
      confidence: 'средняя',
    },
    CONFIRMED_ANNOUNCEMENT: {
      voice: 'Официально анонсирована',
      context: 'до официального анонса русской озвучки',
      confidence: 'высокая',
    },
    RUSSIAN_VOICE_RELEASED: {
      voice: 'Доступна',
      context: 'NTE прожила без русской озвучки',
      confidence: 'высокая',
    },
    UNKNOWN: {
      voice: 'Статус не подтверждён',
      context: 'с момента официального релиза',
      confidence: 'низкая',
    },
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  async function fetchJson(path) {
    const response = await fetch(`${DATA_BASE}${path}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDate(value, withSeconds = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {}),
    }).format(date);
  }

  function plural(n, one, few, many) {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  }

  function elapsedTarget() {
    const event = state.status?.confirmed_event?.detected_at;
    if (state.status?.state === 'RUSSIAN_VOICE_RELEASED' && event) return new Date(event);
    return new Date();
  }

  function elapsedParts() {
    const total = Math.max(0, Math.floor((elapsedTarget() - RELEASE_UTC) / 1000));
    return {
      total,
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    };
  }

  function updateCounter() {
    const parts = elapsedParts();
    $('[data-unit="days"]').textContent = String(parts.days).padStart(3, '0');
    $('[data-unit="hours"]').textContent = String(parts.hours).padStart(2, '0');
    $('[data-unit="minutes"]').textContent = String(parts.minutes).padStart(2, '0');
    $('[data-unit="seconds"]').textContent = String(parts.seconds).padStart(2, '0');
    renderMilestone(parts.days);
  }

  function renderMilestone(days) {
    const reached = [...milestones].reverse().find((item) => days >= item.day);
    const next = milestones.find((item) => days < item.day);
    const previousDay = reached?.day ?? 0;
    const nextDay = next?.day ?? previousDay + 500;
    const span = Math.max(1, nextDay - previousDay);
    const progress = Math.max(0, Math.min(100, ((days - previousDay) / span) * 100));
    $('#milestoneProgress').style.width = `${progress}%`;
    $('#milestoneMessage').textContent = next
      ? `До отметки «${next.title}» осталось ${next.day - days} ${plural(next.day - days, 'день', 'дня', 'дней')}`
      : 'Все подготовленные отметки пройдены. Счётчик отказался сдаваться.';
    $('#nextMilestone').textContent = next ? `${next.day} дней` : '∞';
    $('#easterNumber').textContent = reached?.day ?? days;
    $('#easterTitle').textContent = reached?.title ?? 'Сигнал стабилен';
    $('#easterText').textContent = reached?.text ?? 'Этеро продолжает говорить на четырёх языках. Русскоязычные оценщики всё ещё читают глазами.';
  }

  function renderStatus() {
    const data = state.status;
    if (!data) return;
    const ui = labels[data.state] ?? labels.UNKNOWN;
    $('#statusOrbit').dataset.state = data.state;
    $('#statusLabel').textContent = data.state_label_ru || 'Статус неизвестен';
    $('#confidenceLabel').textContent = `Уверенность: ${ui.confidence}`;
    $('#counterContext').textContent = ui.context;
    $('#textStatus').textContent = data.russian_text?.supported ? 'Доступен' : 'Не подтверждён';
    $('#voiceStatus').textContent = ui.voice;
    $('#lastChecked').textContent = formatDate(data.last_checked_at);
    const health = data.source_health ?? {};
    $('#sourceHealth').textContent = `${health.successful ?? 0}/${health.total ?? 0} источников доступны`;
    $('#footerVersion').textContent = `method v${data.methodology_version ?? '1.0.0'}`;

    const last = new Date(data.last_checked_at);
    const staleHours = (Date.now() - last.getTime()) / 36e5;
    if (Number.isFinite(staleHours) && staleHours > 24) {
      $('#lastChecked').textContent += ' · устарело';
    }

    clearInterval(state.timer);
    updateCounter();
    state.timer = setInterval(updateCounter, 1000);
  }

  function evidenceClass(item) {
    if (!item.ok) return 'error';
    return item.classification || 'neutral';
  }

  function evidenceLabel(item) {
    if (!item.ok) return 'ОШИБКА';
    return {
      released: 'ДОСТУПНА',
      announced: 'АНОНС',
      possible: 'СИГНАЛ',
      not_available: 'НЕТ',
      not_listed: 'НЕ УКАЗАНА',
      neutral: 'БЕЗ ИЗМЕНЕНИЙ',
    }[item.classification] || item.classification?.toUpperCase() || '—';
  }

  function filteredEvidence() {
    const value = $('#evidenceFilter')?.value || 'all';
    const items = state.evidence?.results ?? [];
    if (value === 'official') return items.filter((x) => String(x.category).startsWith('official'));
    if (value === 'stores') return items.filter((x) => String(x.category).startsWith('store_'));
    if (value === 'signals') return items.filter((x) => ['released', 'announced', 'possible'].includes(x.classification));
    if (value === 'errors') return items.filter((x) => !x.ok);
    return items;
  }

  function renderEvidence() {
    const list = $('#evidenceList');
    if (!list || !state.evidence) return;
    const items = filteredEvidence();
    $('#evidenceGenerated').textContent = `Снимок: ${formatDate(state.evidence.generated_at, true)}`;
    if (!items.length) {
      list.innerHTML = '<div class="glass-panel explain-card"><h2>Ничего не найдено</h2><p>Для выбранного фильтра сейчас нет записей.</p></div>';
      return;
    }
    list.innerHTML = items.map((item) => `
      <article class="evidence-card">
        <span class="evidence-state ${escapeHtml(evidenceClass(item))}">${escapeHtml(evidenceLabel(item))}</span>
        <div class="evidence-main">
          <h3>${escapeHtml(item.title)}</h3>
          <div class="evidence-meta">
            <span>${escapeHtml(item.language || '—')}</span>
            <span>${escapeHtml(item.category || '—')}</span>
            <span>${escapeHtml(formatDate(item.checked_at, true))}</span>
            <span>confidence: ${escapeHtml(item.confidence || '—')}</span>
          </div>
          <p>${escapeHtml(item.quote || item.reason || 'Релевантного фрагмента не обнаружено.')}</p>
          ${!item.ok && item.last_successful_checked_at ? `<p>Последняя успешная проверка: ${escapeHtml(formatDate(item.last_successful_checked_at, true))}</p>` : ''}
        </div>
        <a class="evidence-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Оригинал ↗</a>
      </article>
    `).join('');
  }

  function historyItems() {
    const entries = [...(state.history?.entries ?? [])].reverse();
    return $('#changesOnly')?.checked ? entries.filter((x) => x.changed) : entries;
  }

  function renderHistory() {
    const body = $('#historyTable');
    if (!body || !state.history) return;
    const all = historyItems();
    $('#historyCount').textContent = String(state.history.entries?.length ?? 0);
    const visible = all.slice(0, state.historyLimit);
    body.innerHTML = visible.map((item) => `
      <tr>
        <td><strong>${escapeHtml(formatDate(item.checked_at, true))}</strong></td>
        <td>${escapeHtml(item.state_label_ru || item.state)}</td>
        <td>${escapeHtml(item.successful)} OK · ${escapeHtml(item.failed)} ошибок</td>
        <td>${item.changed ? '<span class="flow-state state-yellow">Да</span>' : 'Нет'}</td>
        <td><code>${escapeHtml(item.evidence_signature || '—')}</code></td>
      </tr>
    `).join('') || '<tr><td colspan="5">Записей пока нет.</td></tr>';
    $('#loadMoreHistory').hidden = visible.length >= all.length;
  }

  function drawChart() {
    const canvas = $('#daysChart');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.floor(rect.width));
    const height = 310;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const current = elapsedParts().days;
    const pad = { left: 48, right: 20, top: 26, bottom: 38 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const maxDay = Math.max(30, Math.ceil((current + 15) / 25) * 25);
    const start = RELEASE_UTC.getTime();
    const end = elapsedTarget().getTime();
    const points = [];
    const sampleCount = Math.max(2, Math.min(120, current + 1));
    for (let i = 0; i < sampleCount; i += 1) {
      const ratio = i / (sampleCount - 1);
      const at = start + (end - start) * ratio;
      points.push({ x: pad.left + plotW * ratio, y: pad.top + plotH * (1 - ((at - start) / 864e5) / maxDay) });
    }

    ctx.font = '10px Manrope, sans-serif';
    ctx.fillStyle = 'rgba(156,165,195,.7)';
    ctx.strokeStyle = 'rgba(169,178,255,.11)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i += 1) {
      const y = pad.top + (plotH / gridLines) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
      const value = Math.round(maxDay * (1 - i / gridLines));
      ctx.fillText(String(value), 10, y + 3);
    }

    const gradient = ctx.createLinearGradient(pad.left, 0, width - pad.right, 0);
    gradient.addColorStop(0, '#8f78ff');
    gradient.addColorStop(1, '#55e9ff');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();

    const fill = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
    fill.addColorStop(0, 'rgba(143,120,255,.28)');
    fill.addColorStop(1, 'rgba(143,120,255,0)');
    ctx.lineTo(points.at(-1).x, height - pad.bottom);
    ctx.lineTo(points[0].x, height - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    milestones.filter((m) => m.day <= current).forEach((m) => {
      const x = pad.left + plotW * Math.min(1, m.day / Math.max(1, current));
      const y = pad.top + plotH * (1 - m.day / maxDay);
      ctx.fillStyle = '#ffd66b';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = 'rgba(156,165,195,.72)';
    ctx.fillText('релиз', pad.left, height - 12);
    const label = `${current} ${plural(current, 'день', 'дня', 'дней')}`;
    const textWidth = ctx.measureText(label).width;
    ctx.fillText(label, width - pad.right - textWidth, height - 12);
  }

  function switchTab(name, updateHash = true) {
    $$('[data-tab-panel]').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.tabPanel === name));
    $$('[data-tab-target]').forEach((link) => link.classList.toggle('is-active', link.dataset.tabTarget === name));
    if (updateHash) history.replaceState(null, '', name === 'dashboard' ? location.pathname : `#${name}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'history') renderHistory();
    if (name === 'evidence') renderEvidence();
    if (name === 'dashboard') setTimeout(drawChart, 80);
  }

  function currentStatusText() {
    const p = elapsedParts();
    const s = state.status;
    return [
      `NTE: Neverness to Everness — ${s?.state_label_ru ?? 'статус неизвестен'}.`,
      `${p.days} ${plural(p.days, 'день', 'дня', 'дней')}, ${String(p.hours).padStart(2, '0')}:${String(p.minutes).padStart(2, '0')}:${String(p.seconds).padStart(2, '0')} с официального релиза.`,
      `Русский текст: ${s?.russian_text?.supported ? 'есть' : 'не подтверждён'}. Русская озвучка: ${labels[s?.state]?.voice ?? 'неизвестно'}.`,
      `Последняя проверка: ${formatDate(s?.last_checked_at, true)}.`,
      'https://bonaqu.github.io/nte-russian-voice-watch/',
    ].join('\n');
  }

  async function copyStatus() {
    const text = currentStatusText();
    try {
      await navigator.clipboard.writeText(text);
      showToast('Статус скопирован');
    } catch {
      const area = document.createElement('textarea');
      area.value = text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove();
      showToast('Статус скопирован');
    }
  }

  async function share() {
    const data = { title: 'NTE Russian Voice Watch', text: currentStatusText(), url: location.href };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (error) { if (error.name === 'AbortError') return; }
    }
    await copyStatus();
  }

  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function setupInstall() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      state.deferredInstall = event;
      $('#installButton').hidden = false;
    });
    $('#installButton').addEventListener('click', async () => {
      if (!state.deferredInstall) return;
      state.deferredInstall.prompt();
      await state.deferredInstall.userChoice;
      state.deferredInstall = null;
      $('#installButton').hidden = true;
    });
  }

  function setupEvents() {
    $$('[data-tab-target]').forEach((el) => {
      if (el.tagName === 'A') return;
      el.addEventListener('click', () => switchTab(el.dataset.tabTarget));
    });
    $('#copyStatusButton').addEventListener('click', copyStatus);
    $('#shareButton').addEventListener('click', share);
    $('#evidenceFilter').addEventListener('change', renderEvidence);
    $('#changesOnly').addEventListener('change', () => { state.historyLimit = 40; renderHistory(); });
    $('#loadMoreHistory').addEventListener('click', () => { state.historyLimit += 80; renderHistory(); });
    window.addEventListener('resize', () => { if ($('#tab-dashboard').classList.contains('is-active')) drawChart(); });

    let sequence = '';
    window.addEventListener('keydown', (event) => {
      if (event.key.length !== 1) return;
      sequence = (sequence + event.key.toLowerCase()).slice(-5);
      if (sequence === 'voice') {
        document.body.classList.toggle('anomaly-mode');
        showToast('Аномальный канал открыт');
      }
    });
  }

  async function init() {
    setupEvents();
    setupInstall();
    const hashTab = location.hash.replace('#', '');
    if (['evidence', 'history', 'methodology'].includes(hashTab)) switchTab(hashTab, false);

    const results = await Promise.allSettled([
      fetchJson('status.json'),
      fetchJson('evidence.json'),
      fetchJson('history.json'),
    ]);
    if (results[0].status === 'fulfilled') state.status = results[0].value;
    if (results[1].status === 'fulfilled') state.evidence = results[1].value;
    if (results[2].status === 'fulfilled') state.history = results[2].value;

    if (!state.status) {
      state.status = {
        state: 'UNKNOWN', state_label_ru: 'Не удалось загрузить статус',
        russian_text: { supported: true }, source_health: { successful: 0, total: 0 },
        last_checked_at: null,
      };
      showToast('Данные недоступны — показан офлайн-режим');
    }
    renderStatus();
    renderEvidence();
    renderHistory();
    requestAnimationFrame(drawChart);

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
