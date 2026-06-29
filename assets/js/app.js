(() => {
  'use strict';

  const RELEASE_UTC = new Date('2026-04-29T03:00:00Z');
  const DATA_BASE = 'data/';
  const SUPPORTED = ['ru', 'zh', 'en', 'ko', 'ja'];
  const CIS_LANGUAGE_PREFIXES = ['ru', 'uk', 'be', 'kk', 'uz', 'ky', 'hy', 'az', 'tg', 'tk', 'mo', 'ro'];

  const state = {
    status: null,
    evidence: null,
    history: null,
    timer: null,
    historyLimit: 40,
    deferredInstall: null,
    lang: 'ru',
  };

  const I18N = {
    ru: {
      locale: 'ru-RU',
      htmlLang: 'ru',
      documentTitle: 'NTE Russian Voice Watch',
      metaDescription: 'Независимый автоматический мониторинг официальной русской озвучки NTE: Neverness to Everness.',
      skip: 'К содержанию',
      languageLabel: 'Язык',
      navStatus: 'Статус',
      navSources: 'Источники',
      navHistory: 'История',
      navMethod: 'Методика',
      navAppeal: 'Обращение к разработчикам ↗',
      eyebrow: 'НЕЗАВИСИМЫЙ АВТОМОНИТОРИНГ',
      heroTitle: 'Сколько времени NTE<br><em>без русской озвучки?</em>',
      heroLead: 'Счётчик идёт с официального релиза. Статус меняется только после проверки официальных источников — без слухов, фанатских дубляжей и подмены «русского текста» озвучкой.',
      currentStatus: 'ТЕКУЩИЙ СТАТУС',
      sinceRelease: 'С РЕЛИЗА NTE',
      unitDays: 'дней',
      unitHours: 'часов',
      unitMinutes: 'минут',
      unitSeconds: 'секунд',
      copyStatus: 'Скопировать статус',
      openAppeal: 'Открыть обращение к разработчикам',
      textMetric: 'РУССКИЙ ТЕКСТ',
      textMetricSub: 'Интерфейс и субтитры',
      voiceMetric: 'РУССКИЙ ГОЛОС',
      voiceMetricSub: 'Полная озвучка',
      lastCheckMetric: 'ПОСЛЕДНЯЯ ПРОВЕРКА',
      dynamics: 'ДИНАМИКА',
      daysWithoutVoice: 'Дни без русской озвучки',
      chartLegend: 'время после релиза',
      chartEmpty: 'Недостаточно данных для графика.',
      importantDiff: 'ВАЖНОЕ РАЗЛИЧИЕ',
      textNotVoiceTitle: 'Русский текст ≠ русская озвучка',
      textNotVoiceBody: 'Галочка «Русский» может означать только интерфейс и субтитры. Для дубляжа магазины используют отдельные поля <strong>Full Audio</strong> или <strong>Voice</strong>. Монитор считает озвучку подтверждённой только по этим полям либо по прямому официальному анонсу.',
      falsePositiveLink: 'Как устроена защита от ложных срабатываний →',
      dayAnomaly: 'АНОМАЛИЯ ДНЯ',
      verifiedData: 'ПРОВЕРЯЕМЫЕ ДАННЫЕ',
      sourcesTitle: 'Источники и доказательства',
      sourcesLead: 'Каждый результат содержит ссылку на оригинал, время проверки, тип сигнала и короткую выдержку. Ошибка загрузки источника не превращается в вывод о наличии или отсутствии озвучки.',
      filter: 'Фильтр',
      filterAll: 'Все источники',
      filterOfficial: 'Официальные новости',
      filterStores: 'Магазины',
      filterSignals: 'Только сигналы',
      filterErrors: 'Ошибки проверки',
      continuousLog: 'НЕПРЕРЫВНЫЙ ЖУРНАЛ',
      historyTitle: 'История всех проверок',
      historyLead: 'Плановая проверка запускается четыре раза в сутки. История хранит состояние, здоровье источников и отпечаток доказательств — без копирования целых чужих страниц.',
      checksSaved: 'проверок сохранено',
      changesOnly: 'Только изменения',
      thDate: 'Дата и время',
      thStatus: 'Статус',
      thSources: 'Источники',
      thChanges: 'Изменения',
      thFingerprint: 'Отпечаток',
      loadMore: 'Показать ещё',
      howItWorks: 'КАК ЭТО РАБОТАЕТ',
      methodTitle: 'Методика без хайпа',
      methodLead: 'Монитор специально настроен так, чтобы лучше пропустить ранний слух, чем ошибочно объявить русский дубляж.',
      method1Title: 'Официальный периметр',
      method1Body: 'Проверяются региональные сайты NTE на английском, русском, китайском, японском и корейском, а также структурированные языковые поля Steam и PlayStation.',
      method2Title: 'Многоязычные правила',
      method2Body: 'Ищутся только явные пары «русский + озвучка/voice/full audio/配音/音声/더빙». Одиночное слово «Russian» не считается доказательством.',
      method3Title: 'Контекст и отрицания',
      method3Body: 'Фразы «не поддерживается», «пока недоступна» и аналоги распознаются как отрицательные. Будущее обещание отделяется от уже выпущенной функции.',
      method4Title: 'Структурированные поля',
      method4Body: 'Для Steam проверяется отдельная колонка Full Audio. Для PlayStation сравниваются Voice и Screen Languages.',
      method5Title: 'Консервативный статус',
      method5Body: 'Неоднозначное совпадение переводит сайт в состояние «возможное упоминание», но не в «озвучка вышла». Для публикации остаётся ссылка на первоисточник.',
      method6Title: 'Отказоустойчивость',
      method6Body: 'Сбой одного сайта отображается отдельно. Старый успешный результат помечается как устаревший и не выдаётся за текущую проверку.',
      stateModel: 'Модель состояний',
      flowNo: 'Нет озвучки',
      flowPossible: 'Возможное упоминание',
      flowAnnounced: 'Официальный анонс',
      flowReleased: 'Озвучка доступна',
      repoTitle: 'Логику можно проверить',
      repoBody: 'Код детектора, список источников, тесты и workflow лежат в открытом репозитории. Никаких платных API и скрытой базы данных.',
      openGithub: 'Открыть GitHub ↗',
      footerNote: 'Неофициальный общественный проект. Не связан с Hotta Studio, Perfect World Games, Steam или PlayStation.',
      footerAppeal: 'Обращение',
      footerSource: 'Исходный код',
      statusUnknown: 'Статус неизвестен',
      confidence: 'Уверенность',
      textAvailable: 'Доступен',
      textUnconfirmed: 'Не подтверждён',
      sourcesAvailable: '{ok}/{total} источников доступны',
      stale: 'устарело',
      snapshot: 'Снимок',
      nothingFound: 'Ничего не найдено',
      nothingFoundBody: 'Для выбранного фильтра сейчас нет записей.',
      confidenceMeta: 'уверенность',
      noRelevantQuote: 'Релевантного фрагмента не обнаружено.',
      lastSuccessful: 'Последняя успешная проверка',
      original: 'Оригинал ↗',
      errors: 'ошибок',
      yes: 'Да',
      no: 'Нет',
      noRecords: 'Записей пока нет.',
      release: 'релиз',
      copied: 'Статус скопирован',
      offline: 'Данные недоступны — показан офлайн-режим',
      anomaly: 'Аномальный канал открыт',
      shareTitle: 'NTE Russian Voice Watch',
      officialRelease: 'с официального релиза',
      russianText: 'Русский текст',
      russianVoice: 'Русская озвучка',
      lastCheck: 'Последняя проверка',
      statusLine: 'NTE: Neverness to Everness — {status}.',
      counterLine: '{days}, {time} с официального релиза.',
      languageLine: 'Русский текст: {text}. Русская озвучка: {voice}.',
      lastCheckLine: 'Последняя проверка: {date}.',
      textYes: 'есть',
      textNo: 'не подтверждён',
      installTitle: 'Установить PWA',
      shareTitleAttr: 'Поделиться',
      nextMilestone: 'До отметки «{title}» осталось {count}',
      allMilestones: 'Все подготовленные отметки пройдены. Счётчик отказался сдаваться.',
      infinity: '∞',
      daysWord: ['день', 'дня', 'дней'],
      dayLabel: '{n} {word}',
      evidenceLabels: { error: 'ОШИБКА', released: 'ДОСТУПНА', announced: 'АНОНС', possible: 'СИГНАЛ', not_available: 'НЕТ', not_listed: 'НЕ УКАЗАНА', neutral: 'БЕЗ ИЗМЕНЕНИЙ' },
      stateLabels: {
        NO_RUSSIAN_VOICE: { label: 'Русской озвучки нет', voice: 'Не анонсирован', context: 'без подтверждённой русской озвучки', confidence: 'высокая' },
        POSSIBLE_MENTION: { label: 'Нужно проверить сигнал', voice: 'Нужно проверить', context: 'до подтверждения русской озвучки', confidence: 'средняя' },
        CONFIRMED_ANNOUNCEMENT: { label: 'Русская озвучка анонсирована', voice: 'Официально анонсирована', context: 'до официального анонса русской озвучки', confidence: 'высокая' },
        RUSSIAN_VOICE_RELEASED: { label: 'Русская озвучка доступна', voice: 'Доступна', context: 'NTE прожила без русской озвучки', confidence: 'высокая' },
        UNKNOWN: { label: 'Статус не подтверждён', voice: 'Статус не подтверждён', context: 'с момента официального релиза', confidence: 'низкая' },
      },
      milestones: [
        { day: 30, title: 'Месяц тишины', text: 'Первый месяц пройден. Русский текст есть, а голоса всё ещё живут в параллельной вселенной.' },
        { day: 50, title: 'Полтинник', text: 'Пятьдесят дней. Это уже не задержка реплики, это отдельная сюжетная арка.' },
        { day: 100, title: 'Стодневная аномалия', text: 'Сто дней без русского дубляжа. Этеро официально умеет ждать лучше нас.' },
        { day: 250, title: 'Четверть тысячи', text: 'Двести пятьдесят дней. Озвучка пока существует только в разделе «хотелось бы».' },
        { day: 365, title: 'Год без голоса', text: 'Полный круг вокруг Солнца. Субтитры держат оборону, дубляж всё ещё не вышел из тумана.' },
        { day: 500, title: 'Пятисотая ночь', text: 'Пятьсот дней. Русская озвучка переходит из функции в городскую легенду.' },
        { day: 1000, title: 'Тысячедневная хроника', text: 'Тысяча дней. Это уже не счётчик, а исторический документ.' },
      ],
      defaultEasterTitle: 'Сигнал стабилен',
      defaultEasterText: 'Этеро продолжает говорить на четырёх языках. Русскоязычные оценщики всё ещё читают глазами.',
    },
    zh: {
      locale: 'zh-CN', htmlLang: 'zh-CN', documentTitle: 'NTE Russian Voice Watch',
      metaDescription: 'NTE: Neverness to Everness 官方俄语配音状态的独立自动监测。',
      skip: '跳到内容', languageLabel: '语言', navStatus: '状态', navSources: '来源', navHistory: '历史', navMethod: '方法', navAppeal: '致开发者的公开倡议 ↗',
      eyebrow: '独立自动监测', heroTitle: 'NTE 已经多久<br><em>没有俄语配音？</em>', heroLead: '计时从官方上线开始。状态只会在核查官方来源后改变：不使用传言、粉丝配音，也不把“俄语文本”当作配音。',
      currentStatus: '当前状态', sinceRelease: '自 NTE 上线以来', unitDays: '天', unitHours: '小时', unitMinutes: '分钟', unitSeconds: '秒',
      copyStatus: '复制状态', openAppeal: '打开致开发者的公开倡议', textMetric: '俄语文本', textMetricSub: '界面与字幕', voiceMetric: '俄语语音', voiceMetricSub: '完整配音', lastCheckMetric: '最后检查',
      dynamics: '趋势', daysWithoutVoice: '没有俄语配音的天数', chartLegend: '上线后的时间', chartEmpty: '没有足够数据生成图表。',
      importantDiff: '重要区别', textNotVoiceTitle: '俄语文本 ≠ 俄语配音', textNotVoiceBody: '“Russian” 勾选项可能只表示界面和字幕。商店通常会用单独的 <strong>Full Audio</strong> 或 <strong>Voice</strong> 字段表示配音。本监测只根据这些字段或明确的官方公告确认配音。',
      falsePositiveLink: '查看如何避免误判 →', dayAnomaly: '今日异常', verifiedData: '可核查数据', sourcesTitle: '来源与证据', sourcesLead: '每条结果都包含原始链接、检查时间、信号类型和简短摘录。来源加载错误不会被当作有无配音的结论。',
      filter: '筛选', filterAll: '全部来源', filterOfficial: '官方新闻', filterStores: '商店', filterSignals: '仅信号', filterErrors: '检查错误',
      continuousLog: '连续日志', historyTitle: '所有检查历史', historyLead: '计划检查每天运行四次。历史记录保存状态、来源健康度和证据指纹，不复制第三方页面全文。',
      checksSaved: '条检查已保存', changesOnly: '仅显示变化', thDate: '日期与时间', thStatus: '状态', thSources: '来源', thChanges: '变化', thFingerprint: '指纹', loadMore: '显示更多',
      howItWorks: '工作方式', methodTitle: '没有炒作的方法', methodLead: '监测器宁愿错过早期传言，也不会错误宣布俄语配音已经存在。',
      method1Title: '官方范围', method1Body: '检查英语、俄语、中文、日语和韩语的 NTE 地区页面，以及 Steam 和 PlayStation 的结构化语言字段。',
      method2Title: '多语言规则', method2Body: '只寻找明确的“俄语 + 配音/voice/full audio/配音/音声/더빙”组合。单独的 “Russian” 不算证据。',
      method3Title: '上下文与否定', method3Body: '“不支持”“暂不可用”等表达会被识别为否定。未来承诺会与已经上线的功能分开处理。',
      method4Title: '结构化字段', method4Body: 'Steam 检查单独的 Full Audio 列。PlayStation 会区分 Voice 和 Screen Languages。',
      method5Title: '保守状态', method5Body: '模糊匹配只会进入“可能提及”，不会变成“已上线”。每个结果都会保留原始来源链接。',
      method6Title: '容错', method6Body: '单个网站失败会单独显示。旧的成功结果会标记为过期，不会冒充当前检查。',
      stateModel: '状态模型', flowNo: '没有配音', flowPossible: '可能提及', flowAnnounced: '官方公告', flowReleased: '配音可用',
      repoTitle: '逻辑可以检查', repoBody: '检测器代码、来源列表、测试和 workflow 都在公开仓库中。没有付费 API，也没有隐藏数据库。',
      openGithub: '打开 GitHub ↗', footerNote: '非官方社区项目。与 Hotta Studio、Perfect World Games、Steam 或 PlayStation 无关。', footerAppeal: '公开倡议', footerSource: '源代码',
      statusUnknown: '状态未知', confidence: '可信度', textAvailable: '可用', textUnconfirmed: '未确认', sourcesAvailable: '{ok}/{total} 个来源可用', stale: '已过期',
      snapshot: '快照', nothingFound: '没有找到结果', nothingFoundBody: '当前筛选条件下没有记录。', confidenceMeta: '可信度', noRelevantQuote: '未发现相关片段。', lastSuccessful: '上次成功检查', original: '原文 ↗',
      errors: '个错误', yes: '是', no: '否', noRecords: '暂无记录。', release: '上线', copied: '状态已复制', offline: '数据不可用，已显示离线模式', anomaly: '异常频道已打开',
      shareTitle: 'NTE Russian Voice Watch', officialRelease: '自官方上线以来', russianText: '俄语文本', russianVoice: '俄语配音', lastCheck: '最后检查',
      statusLine: 'NTE: Neverness to Everness — {status}.', counterLine: '自官方上线以来：{days}，{time}。', languageLine: '俄语文本：{text}。俄语配音：{voice}。', lastCheckLine: '最后检查：{date}。',
      textYes: '有', textNo: '未确认', installTitle: '安装 PWA', shareTitleAttr: '分享', nextMilestone: '距离“{title}”还有 {count}', allMilestones: '所有预设节点都已通过。计时器拒绝放弃。', infinity: '∞',
      dayLabel: '{n} 天',
      evidenceLabels: { error: '错误', released: '可用', announced: '公告', possible: '信号', not_available: '没有', not_listed: '未列出', neutral: '无变化' },
      stateLabels: {
        NO_RUSSIAN_VOICE: { label: '没有俄语配音', voice: '未公告', context: '尚无确认的俄语配音', confidence: '高' },
        POSSIBLE_MENTION: { label: '需要核查信号', voice: '需要核查', context: '等待俄语配音确认', confidence: '中' },
        CONFIRMED_ANNOUNCEMENT: { label: '俄语配音已公告', voice: '官方已公告', context: '直到官方公告俄语配音', confidence: '高' },
        RUSSIAN_VOICE_RELEASED: { label: '俄语配音可用', voice: '可用', context: 'NTE 没有俄语配音的时间', confidence: '高' },
        UNKNOWN: { label: '状态未确认', voice: '状态未确认', context: '自官方上线以来', confidence: '低' },
      },
      milestones: [
        { day: 30, title: '沉默一个月', text: '第一个月过去了。俄语文本已经存在，但声音仍在另一个平行世界。' },
        { day: 50, title: '五十天', text: '五十天。这已经不是台词延迟，而是一条独立剧情线。' },
        { day: 100, title: '百日异常', text: '一百天没有俄语配音。等待本身快变成系统功能了。' },
        { day: 250, title: '四分之一千', text: '二百五十天。配音仍停留在“希望有”的分类中。' },
        { day: 365, title: '一年无声', text: '绕太阳一圈。字幕仍在坚守，配音还没走出迷雾。' },
        { day: 500, title: '第五百夜', text: '五百天。俄语配音正在从功能变成都市传说。' },
        { day: 1000, title: '千日记录', text: '一千天。这已经不是计时器，而是历史文档。' },
      ],
      defaultEasterTitle: '信号稳定', defaultEasterText: 'NTE 仍在用四种语言说话。俄语玩家还在用眼睛听剧情。',
    },
    en: {
      locale: 'en-US', htmlLang: 'en', documentTitle: 'NTE Russian Voice Watch',
      metaDescription: 'Independent automatic tracker for official Russian voice-over in NTE: Neverness to Everness.',
      skip: 'Skip to content', languageLabel: 'Language', navStatus: 'Status', navSources: 'Sources', navHistory: 'History', navMethod: 'Method', navAppeal: 'Developer appeal ↗',
      eyebrow: 'INDEPENDENT AUTO-MONITORING', heroTitle: 'How long has NTE<br><em>had no Russian voice-over?</em>', heroLead: 'The counter starts from the official release. The status changes only after official sources are checked — no rumors, fan dubs, or confusing Russian text support with voice-over.',
      currentStatus: 'CURRENT STATUS', sinceRelease: 'SINCE NTE RELEASE', unitDays: 'days', unitHours: 'hours', unitMinutes: 'minutes', unitSeconds: 'seconds',
      copyStatus: 'Copy status', openAppeal: 'Open developer appeal', textMetric: 'RUSSIAN TEXT', textMetricSub: 'Interface and subtitles', voiceMetric: 'RUSSIAN VOICE', voiceMetricSub: 'Full audio', lastCheckMetric: 'LAST CHECK',
      dynamics: 'DYNAMICS', daysWithoutVoice: 'Days without Russian voice-over', chartLegend: 'time since release', chartEmpty: 'Not enough data for the chart.',
      importantDiff: 'IMPORTANT DIFFERENCE', textNotVoiceTitle: 'Russian text ≠ Russian voice-over', textNotVoiceBody: 'A “Russian” checkbox may mean only interface text and subtitles. Stores use separate <strong>Full Audio</strong> or <strong>Voice</strong> fields for dubbing. This tracker confirms voice-over only from those fields or a direct official announcement.',
      falsePositiveLink: 'How false positives are avoided →', dayAnomaly: 'DAY ANOMALY', verifiedData: 'VERIFIABLE DATA', sourcesTitle: 'Sources and evidence', sourcesLead: 'Each result contains the original link, check time, signal type, and a short excerpt. A source loading error does not become a conclusion about voice-over availability.',
      filter: 'Filter', filterAll: 'All sources', filterOfficial: 'Official news', filterStores: 'Stores', filterSignals: 'Signals only', filterErrors: 'Check errors',
      continuousLog: 'CONTINUOUS LOG', historyTitle: 'Full check history', historyLead: 'Scheduled checks run four times a day. The history stores status, source health, and evidence fingerprints without copying entire third-party pages.',
      checksSaved: 'checks saved', changesOnly: 'Changes only', thDate: 'Date and time', thStatus: 'Status', thSources: 'Sources', thChanges: 'Changes', thFingerprint: 'Fingerprint', loadMore: 'Show more',
      howItWorks: 'HOW IT WORKS', methodTitle: 'Method without hype', methodLead: 'The monitor is intentionally conservative: it is better to miss an early rumor than falsely announce Russian dubbing.',
      method1Title: 'Official perimeter', method1Body: 'The tracker checks regional NTE websites in English, Russian, Chinese, Japanese and Korean, plus structured Steam and PlayStation language fields.',
      method2Title: 'Multilingual rules', method2Body: 'It searches only for explicit pairs like “Russian + voice-over/dubbing/full audio/配音/音声/더빙”. The word “Russian” alone is not proof.',
      method3Title: 'Context and negatives', method3Body: 'Phrases like “not supported” or “not available yet” are treated as negative. Future promises are separated from released features.',
      method4Title: 'Structured fields', method4Body: 'Steam is checked through the separate Full Audio column. PlayStation Voice and Screen Languages are compared separately.',
      method5Title: 'Conservative status', method5Body: 'Ambiguous matches become “possible mention”, not “released”. Every public result keeps a link to the original source.',
      method6Title: 'Fault tolerance', method6Body: 'A broken source is shown separately. Old successful results are marked stale and are not presented as current checks.',
      stateModel: 'State model', flowNo: 'No voice-over', flowPossible: 'Possible mention', flowAnnounced: 'Official announcement', flowReleased: 'Voice available',
      repoTitle: 'The logic is auditable', repoBody: 'Detector code, source list, tests, and workflows are in the public repository. No paid APIs and no hidden database.',
      openGithub: 'Open GitHub ↗', footerNote: 'Unofficial community project. Not affiliated with Hotta Studio, Perfect World Games, Steam, or PlayStation.', footerAppeal: 'Appeal', footerSource: 'Source code',
      statusUnknown: 'Status unknown', confidence: 'Confidence', textAvailable: 'Available', textUnconfirmed: 'Unconfirmed', sourcesAvailable: '{ok}/{total} sources available', stale: 'stale',
      snapshot: 'Snapshot', nothingFound: 'Nothing found', nothingFoundBody: 'There are no records for the selected filter.', confidenceMeta: 'confidence', noRelevantQuote: 'No relevant excerpt found.', lastSuccessful: 'Last successful check', original: 'Original ↗',
      errors: 'errors', yes: 'Yes', no: 'No', noRecords: 'No records yet.', release: 'release', copied: 'Status copied', offline: 'Data unavailable — offline mode shown', anomaly: 'Anomaly channel opened',
      shareTitle: 'NTE Russian Voice Watch', officialRelease: 'since official release', russianText: 'Russian text', russianVoice: 'Russian voice-over', lastCheck: 'Last check',
      statusLine: 'NTE: Neverness to Everness — {status}.', counterLine: '{days}, {time} since official release.', languageLine: 'Russian text: {text}. Russian voice-over: {voice}.', lastCheckLine: 'Last check: {date}.',
      textYes: 'yes', textNo: 'unconfirmed', installTitle: 'Install PWA', shareTitleAttr: 'Share', nextMilestone: '{count} until “{title}”', allMilestones: 'All prepared milestones have passed. The counter refuses to give up.', infinity: '∞',
      dayLabel: '{n} {word}', daysWord: ['day', 'days', 'days'],
      evidenceLabels: { error: 'ERROR', released: 'AVAILABLE', announced: 'ANNOUNCED', possible: 'SIGNAL', not_available: 'NO', not_listed: 'NOT LISTED', neutral: 'NO CHANGE' },
      stateLabels: {
        NO_RUSSIAN_VOICE: { label: 'No Russian voice-over', voice: 'Not announced', context: 'without confirmed Russian voice-over', confidence: 'high' },
        POSSIBLE_MENTION: { label: 'Signal needs verification', voice: 'Needs verification', context: 'until Russian voice-over is confirmed', confidence: 'medium' },
        CONFIRMED_ANNOUNCEMENT: { label: 'Russian voice-over announced', voice: 'Officially announced', context: 'until the official Russian voice-over announcement', confidence: 'high' },
        RUSSIAN_VOICE_RELEASED: { label: 'Russian voice-over available', voice: 'Available', context: 'NTE lived without Russian voice-over', confidence: 'high' },
        UNKNOWN: { label: 'Status unconfirmed', voice: 'Status unconfirmed', context: 'since official release', confidence: 'low' },
      },
      milestones: [
        { day: 30, title: 'A month of silence', text: 'The first month has passed. Russian text exists, while voices still live in a parallel universe.' },
        { day: 50, title: 'Fifty days', text: 'Fifty days. This is no longer a delayed line; it is a separate story arc.' },
        { day: 100, title: 'Hundred-day anomaly', text: 'One hundred days without Russian dubbing. Waiting is becoming a feature.' },
        { day: 250, title: 'Quarter thousand', text: 'Two hundred fifty days. Voice-over still exists only in the “would be nice” category.' },
        { day: 365, title: 'A year without voice', text: 'A full orbit around the Sun. Subtitles hold the line; the dub is still in the fog.' },
        { day: 500, title: 'The five-hundredth night', text: 'Five hundred days. Russian voice-over is turning from a feature into an urban legend.' },
        { day: 1000, title: 'Thousand-day chronicle', text: 'One thousand days. This is no longer a counter; it is a historical document.' },
      ],
      defaultEasterTitle: 'Signal stable', defaultEasterText: 'NTE keeps speaking in four languages. Russian-speaking players still listen with their eyes.',
    },
    ko: {
      locale: 'ko-KR', htmlLang: 'ko', documentTitle: 'NTE Russian Voice Watch',
      metaDescription: 'NTE: Neverness to Everness의 공식 러시아어 음성 더빙 상태를 추적하는 독립 자동 모니터입니다.',
      skip: '본문으로 이동', languageLabel: '언어', navStatus: '상태', navSources: '출처', navHistory: '기록', navMethod: '방식', navAppeal: '개발자에게 보내는 호소문 ↗',
      eyebrow: '독립 자동 모니터링', heroTitle: 'NTE는 얼마나 오래<br><em>러시아어 음성 없이 지냈을까요?</em>', heroLead: '카운터는 공식 출시일부터 시작됩니다. 상태는 공식 출처를 확인한 뒤에만 바뀝니다. 소문, 팬 더빙, 러시아어 텍스트 지원과 음성 더빙의 혼동은 제외합니다.',
      currentStatus: '현재 상태', sinceRelease: 'NTE 출시 이후', unitDays: '일', unitHours: '시간', unitMinutes: '분', unitSeconds: '초',
      copyStatus: '상태 복사', openAppeal: '개발자 호소문 열기', textMetric: '러시아어 텍스트', textMetricSub: '인터페이스와 자막', voiceMetric: '러시아어 음성', voiceMetricSub: '전체 음성', lastCheckMetric: '마지막 확인',
      dynamics: '추이', daysWithoutVoice: '러시아어 음성 없는 일수', chartLegend: '출시 후 시간', chartEmpty: '그래프를 그릴 데이터가 부족합니다.',
      importantDiff: '중요한 차이', textNotVoiceTitle: '러시아어 텍스트 ≠ 러시아어 음성', textNotVoiceBody: '“Russian” 체크 표시는 인터페이스와 자막만 의미할 수 있습니다. 더빙은 보통 별도의 <strong>Full Audio</strong> 또는 <strong>Voice</strong> 필드로 표시됩니다. 이 모니터는 해당 필드 또는 명확한 공식 발표만을 근거로 음성을 확인합니다.',
      falsePositiveLink: '오탐을 피하는 방식 보기 →', dayAnomaly: '오늘의 이상 현상', verifiedData: '검증 가능한 데이터', sourcesTitle: '출처와 근거', sourcesLead: '각 결과에는 원문 링크, 확인 시간, 신호 유형과 짧은 발췌가 포함됩니다. 출처 로딩 오류는 음성 제공 여부에 대한 결론이 되지 않습니다.',
      filter: '필터', filterAll: '전체 출처', filterOfficial: '공식 뉴스', filterStores: '상점', filterSignals: '신호만', filterErrors: '확인 오류',
      continuousLog: '연속 기록', historyTitle: '전체 확인 기록', historyLead: '예약 확인은 하루 네 번 실행됩니다. 기록에는 상태, 출처 상태, 근거 지문이 저장되며 외부 페이지 전체를 복사하지 않습니다.',
      checksSaved: '개의 확인 저장됨', changesOnly: '변경만', thDate: '날짜와 시간', thStatus: '상태', thSources: '출처', thChanges: '변경', thFingerprint: '지문', loadMore: '더 보기',
      howItWorks: '작동 방식', methodTitle: '과장 없는 방식', methodLead: '이 모니터는 보수적으로 작동합니다. 초기 소문을 놓치는 것이 러시아어 더빙을 잘못 발표하는 것보다 낫습니다.',
      method1Title: '공식 범위', method1Body: '영어, 러시아어, 중국어, 일본어, 한국어 NTE 지역 사이트와 Steam 및 PlayStation의 구조화된 언어 필드를 확인합니다.',
      method2Title: '다국어 규칙', method2Body: '“Russian + voice-over/dubbing/full audio/配音/音声/더빙”처럼 명확한 조합만 찾습니다. “Russian” 단어 하나만으로는 증거가 아닙니다.',
      method3Title: '문맥과 부정', method3Body: '“지원하지 않음”, “아직 제공되지 않음” 같은 표현은 부정으로 처리합니다. 미래 약속은 이미 출시된 기능과 분리합니다.',
      method4Title: '구조화된 필드', method4Body: 'Steam은 별도의 Full Audio 열을 확인합니다. PlayStation은 Voice와 Screen Languages를 따로 비교합니다.',
      method5Title: '보수적 상태', method5Body: '모호한 일치는 “가능한 언급”으로만 처리하며 “출시됨”으로 바꾸지 않습니다. 모든 공개 결과에는 원본 링크가 남습니다.',
      method6Title: '장애 허용', method6Body: '한 출처가 실패하면 별도로 표시합니다. 오래된 성공 결과는 현재 확인처럼 보이지 않도록 오래됨으로 표시됩니다.',
      stateModel: '상태 모델', flowNo: '음성 없음', flowPossible: '가능한 언급', flowAnnounced: '공식 발표', flowReleased: '음성 사용 가능',
      repoTitle: '로직을 확인할 수 있습니다', repoBody: '감지기 코드, 출처 목록, 테스트, workflow가 공개 저장소에 있습니다. 유료 API나 숨겨진 데이터베이스는 없습니다.',
      openGithub: 'GitHub 열기 ↗', footerNote: '비공식 커뮤니티 프로젝트입니다. Hotta Studio, Perfect World Games, Steam 또는 PlayStation과 관련이 없습니다.', footerAppeal: '호소문', footerSource: '소스 코드',
      statusUnknown: '상태 알 수 없음', confidence: '신뢰도', textAvailable: '사용 가능', textUnconfirmed: '미확인', sourcesAvailable: '{ok}/{total}개 출처 사용 가능', stale: '오래됨',
      snapshot: '스냅샷', nothingFound: '결과 없음', nothingFoundBody: '선택한 필터에 해당하는 기록이 없습니다.', confidenceMeta: '신뢰도', noRelevantQuote: '관련 발췌를 찾지 못했습니다.', lastSuccessful: '마지막 성공 확인', original: '원문 ↗',
      errors: '오류', yes: '예', no: '아니오', noRecords: '아직 기록이 없습니다.', release: '출시', copied: '상태가 복사되었습니다', offline: '데이터를 사용할 수 없어 오프라인 모드를 표시합니다', anomaly: '이상 채널이 열렸습니다',
      shareTitle: 'NTE Russian Voice Watch', officialRelease: '공식 출시 이후', russianText: '러시아어 텍스트', russianVoice: '러시아어 음성', lastCheck: '마지막 확인',
      statusLine: 'NTE: Neverness to Everness — {status}.', counterLine: '공식 출시 이후 {days}, {time}.', languageLine: '러시아어 텍스트: {text}. 러시아어 음성: {voice}.', lastCheckLine: '마지막 확인: {date}.',
      textYes: '있음', textNo: '미확인', installTitle: 'PWA 설치', shareTitleAttr: '공유', nextMilestone: '“{title}”까지 {count} 남음', allMilestones: '준비된 모든 지점을 지났습니다. 카운터는 포기하지 않습니다.', infinity: '∞',
      dayLabel: '{n}일',
      evidenceLabels: { error: '오류', released: '사용 가능', announced: '발표', possible: '신호', not_available: '없음', not_listed: '미표기', neutral: '변경 없음' },
      stateLabels: {
        NO_RUSSIAN_VOICE: { label: '러시아어 음성 없음', voice: '미발표', context: '확인된 러시아어 음성 없음', confidence: '높음' },
        POSSIBLE_MENTION: { label: '신호 확인 필요', voice: '확인 필요', context: '러시아어 음성 확인 전', confidence: '중간' },
        CONFIRMED_ANNOUNCEMENT: { label: '러시아어 음성 발표됨', voice: '공식 발표됨', context: '공식 러시아어 음성 발표 전까지', confidence: '높음' },
        RUSSIAN_VOICE_RELEASED: { label: '러시아어 음성 사용 가능', voice: '사용 가능', context: 'NTE가 러시아어 음성 없이 보낸 시간', confidence: '높음' },
        UNKNOWN: { label: '상태 미확인', voice: '상태 미확인', context: '공식 출시 이후', confidence: '낮음' },
      },
      milestones: [
        { day: 30, title: '침묵의 한 달', text: '첫 달이 지났습니다. 러시아어 텍스트는 있지만, 목소리는 여전히 평행세계에 있습니다.' },
        { day: 50, title: '오십 일', text: '오십 일. 이제는 대사 지연이 아니라 별도의 스토리 아크입니다.' },
        { day: 100, title: '백일 이상 현상', text: '러시아어 더빙 없이 백 일. 기다림이 기능이 되어 가고 있습니다.' },
        { day: 250, title: '사분의 일 천', text: '이백오십 일. 음성은 아직 “있으면 좋겠다” 범주에 있습니다.' },
        { day: 365, title: '목소리 없는 1년', text: '태양을 한 바퀴 돌았습니다. 자막은 버티고 있고, 더빙은 아직 안개 속입니다.' },
        { day: 500, title: '오백 번째 밤', text: '오백 일. 러시아어 음성은 기능에서 도시전설로 바뀌고 있습니다.' },
        { day: 1000, title: '천일 기록', text: '천 일. 이제 카운터가 아니라 역사 문서입니다.' },
      ],
      defaultEasterTitle: '신호 안정', defaultEasterText: 'NTE는 계속 네 가지 언어로 말합니다. 러시아어권 플레이어는 아직 눈으로 듣고 있습니다.',
    },
    ja: {
      locale: 'ja-JP', htmlLang: 'ja', documentTitle: 'NTE Russian Voice Watch',
      metaDescription: 'NTE: Neverness to Everness の公式ロシア語音声の状況を追跡する独立自動モニターです。',
      skip: '本文へ移動', languageLabel: '言語', navStatus: 'ステータス', navSources: 'ソース', navHistory: '履歴', navMethod: '方法', navAppeal: '開発者への要望 ↗',
      eyebrow: '独立自動モニタリング', heroTitle: 'NTE はどれくらい<br><em>ロシア語音声なし？</em>', heroLead: 'カウンターは公式リリース日から進みます。ステータスは公式情報を確認した後だけ変わります。噂、ファン吹き替え、ロシア語テキストと音声の混同は除外します。',
      currentStatus: '現在のステータス', sinceRelease: 'NTE リリースから', unitDays: '日', unitHours: '時間', unitMinutes: '分', unitSeconds: '秒',
      copyStatus: 'ステータスをコピー', openAppeal: '開発者への要望を開く', textMetric: 'ロシア語テキスト', textMetricSub: 'インターフェースと字幕', voiceMetric: 'ロシア語音声', voiceMetricSub: 'フル音声', lastCheckMetric: '最終チェック',
      dynamics: '推移', daysWithoutVoice: 'ロシア語音声なしの日数', chartLegend: 'リリース後の時間', chartEmpty: 'グラフに必要なデータが不足しています。',
      importantDiff: '重要な違い', textNotVoiceTitle: 'ロシア語テキスト ≠ ロシア語音声', textNotVoiceBody: '「Russian」のチェックはインターフェースと字幕だけを意味する場合があります。吹き替えには通常、別の <strong>Full Audio</strong> または <strong>Voice</strong> フィールドが使われます。このモニターは、それらのフィールドまたは明確な公式発表だけを根拠に音声を確認します。',
      falsePositiveLink: '誤検出を防ぐ仕組み →', dayAnomaly: '本日の異常', verifiedData: '検証可能なデータ', sourcesTitle: 'ソースと証拠', sourcesLead: '各結果には元リンク、確認時刻、シグナル種別、短い抜粋が含まれます。ソースの読み込みエラーは音声の有無の結論にはなりません。',
      filter: 'フィルター', filterAll: 'すべてのソース', filterOfficial: '公式ニュース', filterStores: 'ストア', filterSignals: 'シグナルのみ', filterErrors: '確認エラー',
      continuousLog: '継続ログ', historyTitle: '全チェック履歴', historyLead: '定期チェックは1日4回実行されます。履歴には状態、ソースの健全性、証拠のフィンガープリントが保存され、外部ページ全体はコピーしません。',
      checksSaved: '件のチェックを保存', changesOnly: '変更のみ', thDate: '日時', thStatus: 'ステータス', thSources: 'ソース', thChanges: '変更', thFingerprint: 'フィンガープリント', loadMore: 'さらに表示',
      howItWorks: '仕組み', methodTitle: '煽りなしの方法', methodLead: 'このモニターは保守的に設計されています。早い噂を見逃す方が、ロシア語吹き替えを誤って発表するより安全です。',
      method1Title: '公式範囲', method1Body: '英語、ロシア語、中国語、日本語、韓国語の NTE 地域サイトと、Steam / PlayStation の構造化された言語フィールドを確認します。',
      method2Title: '多言語ルール', method2Body: '「Russian + voice-over/dubbing/full audio/配音/音声/더빙」のような明確な組み合わせだけを探します。「Russian」単体は証拠ではありません。',
      method3Title: '文脈と否定', method3Body: '「未対応」「まだ利用不可」などの表現は否定として扱います。将来の約束と実装済み機能は分けて扱います。',
      method4Title: '構造化フィールド', method4Body: 'Steam では Full Audio 列を確認します。PlayStation では Voice と Screen Languages を別々に比較します。',
      method5Title: '保守的な状態', method5Body: '曖昧な一致は「可能性のある言及」に留まり、「リリース済み」にはしません。公開結果には元ソースへのリンクを残します。',
      method6Title: '障害耐性', method6Body: '一つのサイトが失敗しても別に表示します。古い成功結果は古いものとして扱い、現在のチェックのようには見せません。',
      stateModel: '状態モデル', flowNo: '音声なし', flowPossible: '可能性のある言及', flowAnnounced: '公式発表', flowReleased: '音声利用可能',
      repoTitle: 'ロジックは確認できます', repoBody: '検出コード、ソース一覧、テスト、workflow は公開リポジトリにあります。有料 API も隠しデータベースもありません。',
      openGithub: 'GitHub を開く ↗', footerNote: '非公式コミュニティプロジェクトです。Hotta Studio、Perfect World Games、Steam、PlayStation とは関係ありません。', footerAppeal: '要望', footerSource: 'ソースコード',
      statusUnknown: 'ステータス不明', confidence: '信頼度', textAvailable: '利用可能', textUnconfirmed: '未確認', sourcesAvailable: '{ok}/{total} ソース利用可能', stale: '古い',
      snapshot: 'スナップショット', nothingFound: '見つかりません', nothingFoundBody: '選択したフィルターに該当する記録はありません。', confidenceMeta: '信頼度', noRelevantQuote: '関連する抜粋は見つかりませんでした。', lastSuccessful: '最後の成功チェック', original: '原文 ↗',
      errors: 'エラー', yes: 'はい', no: 'いいえ', noRecords: 'まだ記録はありません。', release: 'リリース', copied: 'ステータスをコピーしました', offline: 'データを取得できないためオフライン表示です', anomaly: '異常チャンネルを開きました',
      shareTitle: 'NTE Russian Voice Watch', officialRelease: '公式リリースから', russianText: 'ロシア語テキスト', russianVoice: 'ロシア語音声', lastCheck: '最終チェック',
      statusLine: 'NTE: Neverness to Everness — {status}.', counterLine: '公式リリースから {days}、{time}。', languageLine: 'ロシア語テキスト: {text}。ロシア語音声: {voice}。', lastCheckLine: '最終チェック: {date}。',
      textYes: 'あり', textNo: '未確認', installTitle: 'PWA をインストール', shareTitleAttr: '共有', nextMilestone: '「{title}」まで {count}', allMilestones: '用意された節目はすべて通過しました。カウンターは諦めません。', infinity: '∞',
      dayLabel: '{n}日',
      evidenceLabels: { error: 'エラー', released: '利用可能', announced: '発表', possible: 'シグナル', not_available: 'なし', not_listed: '未記載', neutral: '変更なし' },
      stateLabels: {
        NO_RUSSIAN_VOICE: { label: 'ロシア語音声なし', voice: '未発表', context: '確認済みロシア語音声なし', confidence: '高' },
        POSSIBLE_MENTION: { label: 'シグナル確認が必要', voice: '確認が必要', context: 'ロシア語音声確認まで', confidence: '中' },
        CONFIRMED_ANNOUNCEMENT: { label: 'ロシア語音声が発表済み', voice: '公式発表済み', context: '公式ロシア語音声発表まで', confidence: '高' },
        RUSSIAN_VOICE_RELEASED: { label: 'ロシア語音声が利用可能', voice: '利用可能', context: 'NTE がロシア語音声なしで過ごした時間', confidence: '高' },
        UNKNOWN: { label: 'ステータス未確認', voice: 'ステータス未確認', context: '公式リリースから', confidence: '低' },
      },
      milestones: [
        { day: 30, title: '沈黙の1か月', text: '最初の1か月が過ぎました。ロシア語テキストはあり、声はまだ別の宇宙にあります。' },
        { day: 50, title: '50日', text: '50日。これはもう台詞の遅延ではなく、別のストーリーアークです。' },
        { day: 100, title: '100日異常', text: 'ロシア語吹き替えなしで100日。待つこと自体が機能になりつつあります。' },
        { day: 250, title: '250日', text: '250日。音声はまだ「あると嬉しい」カテゴリにあります。' },
        { day: 365, title: '声のない1年', text: '太陽を一周しました。字幕は守り続け、吹き替えはまだ霧の中です。' },
        { day: 500, title: '500番目の夜', text: '500日。ロシア語音声は機能から都市伝説へ変わりつつあります。' },
        { day: 1000, title: '1000日の記録', text: '1000日。これはもうカウンターではなく歴史資料です。' },
      ],
      defaultEasterTitle: 'シグナル安定', defaultEasterText: 'NTE はまだ4つの言語で話しています。ロシア語圏のプレイヤーは目で聞いています。',
    },
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const t = (key) => I18N[state.lang]?.[key] ?? I18N.en[key] ?? key;

  function interpolate(template, values = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  }

  function normalizeLanguage(value) {
    return String(value || '').toLowerCase().split('-')[0];
  }

  function detectLanguage() {
    const saved = localStorage.getItem('nte-language') || localStorage.getItem('nte-appeal-language');
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

  function setLanguage(lang, persist = true) {
    state.lang = SUPPORTED.includes(lang) ? lang : detectLanguage();
    if (persist) {
      localStorage.setItem('nte-language', state.lang);
      localStorage.setItem('nte-appeal-language', state.lang);
    }

    document.documentElement.lang = t('htmlLang');
    document.title = t('documentTitle');
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', t('metaDescription'));

    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    $$('[data-i18n-html]').forEach((node) => { node.innerHTML = t(node.dataset.i18nHtml); });

    $$('[data-lang-button]').forEach((button) => {
      const active = button.dataset.langButton === state.lang;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const install = $('#installButton');
    if (install) {
      install.title = t('installTitle');
      install.setAttribute('aria-label', t('installTitle'));
    }
    const share = $('#shareButton');
    if (share) {
      share.title = t('shareTitleAttr');
      share.setAttribute('aria-label', t('shareTitleAttr'));
    }

    renderStatus();
    renderEvidence();
    renderHistory();
    requestAnimationFrame(drawChart);
  }

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
    return new Intl.DateTimeFormat(t('locale'), {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {}),
    }).format(date);
  }

  function pluralRu(n, one, few, many) {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  }

  function dayText(n) {
    if (state.lang === 'ru') {
      const [one, few, many] = t('daysWord');
      return interpolate(t('dayLabel'), { n, word: pluralRu(n, one, few, many) });
    }
    if (state.lang === 'en') {
      return interpolate(t('dayLabel'), { n, word: n === 1 ? 'day' : 'days' });
    }
    return interpolate(t('dayLabel'), { n });
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
    const milestones = t('milestones');
    const reached = [...milestones].reverse().find((item) => days >= item.day);
    const next = milestones.find((item) => days < item.day);
    const previousDay = reached?.day ?? 0;
    const nextDay = next?.day ?? previousDay + 500;
    const span = Math.max(1, nextDay - previousDay);
    const progress = Math.max(0, Math.min(100, ((days - previousDay) / span) * 100));

    $('#milestoneProgress').style.width = `${progress}%`;
    $('#milestoneMessage').textContent = next
      ? interpolate(t('nextMilestone'), { title: next.title, count: dayText(next.day - days) })
      : t('allMilestones');
    $('#nextMilestone').textContent = next ? dayText(next.day) : t('infinity');
    $('#easterNumber').textContent = reached?.day ?? days;
    $('#easterTitle').textContent = reached?.title ?? t('defaultEasterTitle');
    $('#easterText').textContent = reached?.text ?? t('defaultEasterText');
  }

  function statusUi(key) {
    return t('stateLabels')[key] ?? t('stateLabels').UNKNOWN;
  }

  function renderStatus() {
    const data = state.status;
    if (!data) return;

    const ui = statusUi(data.state);
    $('#statusOrbit').dataset.state = data.state || 'UNKNOWN';
    $('#statusLabel').textContent = ui.label || t('statusUnknown');
    $('#confidenceLabel').textContent = `${t('confidence')}: ${ui.confidence}`;
    $('#counterContext').textContent = ui.context;
    $('#textStatus').textContent = data.russian_text?.supported ? t('textAvailable') : t('textUnconfirmed');
    $('#voiceStatus').textContent = ui.voice;
    $('#lastChecked').textContent = formatDate(data.last_checked_at);

    const health = data.source_health ?? {};
    $('#sourceHealth').textContent = interpolate(t('sourcesAvailable'), { ok: health.successful ?? 0, total: health.total ?? 0 });
    $('#footerVersion').textContent = `method v${data.methodology_version ?? '1.0.0'}`;

    const last = new Date(data.last_checked_at);
    const staleHours = (Date.now() - last.getTime()) / 36e5;
    if (Number.isFinite(staleHours) && staleHours > 24) {
      $('#lastChecked').textContent += ` · ${t('stale')}`;
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
    if (!item.ok) return t('evidenceLabels').error;
    return t('evidenceLabels')[item.classification] || item.classification?.toUpperCase() || '—';
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
    $('#evidenceGenerated').textContent = `${t('snapshot')}: ${formatDate(state.evidence.generated_at, true)}`;
    if (!items.length) {
      list.innerHTML = `<div class="glass-panel explain-card"><h2>${escapeHtml(t('nothingFound'))}</h2><p>${escapeHtml(t('nothingFoundBody'))}</p></div>`;
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
            <span>${escapeHtml(t('confidenceMeta'))}: ${escapeHtml(item.confidence || '—')}</span>
          </div>
          <p>${escapeHtml(item.quote || item.reason || t('noRelevantQuote'))}</p>
          ${!item.ok && item.last_successful_checked_at ? `<p>${escapeHtml(t('lastSuccessful'))}: ${escapeHtml(formatDate(item.last_successful_checked_at, true))}</p>` : ''}
        </div>
        <a class="evidence-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('original'))}</a>
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
        <td>${escapeHtml(statusUi(item.state).label || item.state)}</td>
        <td>${escapeHtml(item.successful)} OK · ${escapeHtml(item.failed)} ${escapeHtml(t('errors'))}</td>
        <td>${item.changed ? `<span class="flow-state state-yellow">${escapeHtml(t('yes'))}</span>` : escapeHtml(t('no'))}</td>
        <td><code>${escapeHtml(item.evidence_signature || '—')}</code></td>
      </tr>
    `).join('') || `<tr><td colspan="5">${escapeHtml(t('noRecords'))}</td></tr>`;
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

    t('milestones').filter((m) => m.day <= current).forEach((m) => {
      const x = pad.left + plotW * Math.min(1, m.day / Math.max(1, current));
      const y = pad.top + plotH * (1 - m.day / maxDay);
      ctx.fillStyle = '#ffd66b';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = 'rgba(156,165,195,.72)';
    ctx.fillText(t('release'), pad.left, height - 12);
    const label = dayText(current);
    const textWidth = ctx.measureText(label).width;
    ctx.fillText(label, width - pad.right - textWidth, height - 12);
  }

  function switchTab(name, updateHash = true) {
    $$('[data-tab-panel]').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.tabPanel === name));
    $$('[data-tab-target]').forEach((link) => link.classList.toggle('is-active', link.dataset.tabTarget === name));
    if (updateHash) window.history.replaceState(null, '', name === 'dashboard' ? location.pathname : `#${name}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'history') renderHistory();
    if (name === 'evidence') renderEvidence();
    if (name === 'dashboard') setTimeout(drawChart, 80);
  }

  function currentStatusText() {
    const p = elapsedParts();
    const s = state.status;
    const ui = statusUi(s?.state);
    return [
      interpolate(t('statusLine'), { status: ui.label || t('statusUnknown') }),
      interpolate(t('counterLine'), { days: dayText(p.days), time: `${String(p.hours).padStart(2, '0')}:${String(p.minutes).padStart(2, '0')}:${String(p.seconds).padStart(2, '0')}` }),
      interpolate(t('languageLine'), { text: s?.russian_text?.supported ? t('textYes') : t('textNo'), voice: ui.voice }),
      interpolate(t('lastCheckLine'), { date: formatDate(s?.last_checked_at, true) }),
      'https://bonaqu.github.io/nte-russian-voice-watch/',
    ].join('\n');
  }

  async function copyStatus() {
    const text = currentStatusText();
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('copied'));
    } catch {
      const area = document.createElement('textarea');
      area.value = text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove();
      showToast(t('copied'));
    }
  }

  async function share() {
    const data = { title: t('shareTitle'), text: currentStatusText(), url: location.href };
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

  function switchLanguageSmooth(lang) {
    if (!SUPPORTED.includes(lang) || lang === state.lang) return;
    document.body.classList.add('language-changing');
    window.setTimeout(() => {
      setLanguage(lang);
      window.setTimeout(() => document.body.classList.remove('language-changing'), 240);
    }, 90);
  }

  function setupEvents() {
    $$('[data-tab-target]').forEach((el) => {
      if (el.tagName === 'A') return;
      el.addEventListener('click', () => switchTab(el.dataset.tabTarget));
    });
    $$('[data-lang-button]').forEach((button) => {
      button.addEventListener('click', () => switchLanguageSmooth(button.dataset.langButton));
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
        showToast(t('anomaly'));
      }
    });
  }

  async function init() {
    state.lang = detectLanguage();
    setLanguage(state.lang, Boolean(localStorage.getItem('nte-language') || localStorage.getItem('nte-appeal-language')));
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
        state: 'UNKNOWN',
        russian_text: { supported: true },
        source_health: { successful: 0, total: 0 },
        last_checked_at: null,
      };
      showToast(t('offline'));
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
