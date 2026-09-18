(function () {
  'use strict';

  function detectDevice() {
    const ua = navigator.userAgent || '';
    const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIPhone = /iPhone/.test(ua) && !isIPad;
    const isAndroid = /Android/.test(ua);
    const isMobile = isIPhone || isIPad || isAndroid || /Mobile/.test(ua);
    let type = 'desktop';
    let label = 'Компьютер / другое устройство';
    if (isIPhone) { type = 'iphone'; label = 'iPhone'; }
    else if (isIPad) { type = 'ipad'; label = 'iPad'; }
    else if (isAndroid) { type = 'android'; label = 'Android'; }
    return { type, label, isIos: type === 'iphone' || type === 'ipad', isAndroid: type === 'android', isMobile };
  }

  const device = detectDevice();

  function getTheme() {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function getFavorites() {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
  }
  function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) favs = favs.filter(f => f !== id);
    else favs.push(id);
    localStorage.setItem('favorites', JSON.stringify(favs));
    return favs.includes(id);
  }
  function isFavorite(id) { return getFavorites().includes(id); }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem('history') || '[]'); } catch { return []; }
  }
  function addToHistory(id) {
    let hist = getHistory().filter(h => h !== id);
    hist.unshift(id);
    hist = hist.slice(0, 20);
    localStorage.setItem('history', JSON.stringify(hist));
  }

  function getAppById(id) { return window.APPS.find(a => a.id === id); }
  function getCategoryName(id) {
    const cat = window.CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
  }
  function platformLabel(p) {
    if (p === 'ios') return 'iOS';
    if (p === 'android') return 'Android';
    if (p === 'web') return 'Веб';
    return p;
  }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function searchApps(query) {
    if (!query || query.trim().length < 1) return [];
    const q = query.trim().toLowerCase();
    return window.APPS.filter(app => {
      return (
        app.name.toLowerCase().includes(q) ||
        app.developer.toLowerCase().includes(q) ||
        (app.description && app.description.toLowerCase().includes(q)) ||
        (app.categories && app.categories.some(c => getCategoryName(c).toLowerCase().includes(q))) ||
        app.id.includes(q)
      );
    }).slice(0, 12);
  }

  function renderAppCard(app) {
    const platforms = (app.platforms || []).map(p =>
      `<span class="badge platform-${p === 'ios' ? 'ios' : p === 'android' ? 'android' : ''}">${platformLabel(p)}</span>`
    ).join('');
    const favActive = isFavorite(app.id) ? 'active' : '';
    const favIcon = isFavorite(app.id) ? '★' : '☆';
    return `
      <div class="app-card fade-in" data-id="${escapeHtml(app.id)}" role="button" tabindex="0">
        <img class="icon" src="${escapeHtml(app.icon)}" alt="${escapeHtml(app.name)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect fill=%22%23e2e8f0%22 width=%2264%22 height=%2264%22 rx=%2214%22/><text x=%2232%22 y=%2240%22 text-anchor=%22middle%22 font-size=%2224%22>📱</text></svg>'">
        <div class="content">
          <div class="name">${escapeHtml(app.name)}</div>
          <div class="developer">${escapeHtml(app.developer)}</div>
          <div class="meta">
            <span class="badge category">${escapeHtml(getCategoryName(app.category))}</span>
            ${platforms}
            ${app.rating ? `<span class="badge">★ ${app.rating}</span>` : ''}
          </div>
          <div class="desc">${escapeHtml(app.description)}</div>
          <div class="actions">
            <a href="#/app/${escapeHtml(app.id)}" class="btn btn-primary btn-sm" onclick="event.stopPropagation()">Подробнее</a>
            <button class="btn-fav ${favActive}" data-fav="${escapeHtml(app.id)}" title="Избранное" onclick="event.stopPropagation()">${favIcon}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderInstallOptions(app) {
    const links = app.links || {};
    let html = '';
    if (device.isIos || !device.isMobile) {
      if (links.ios) {
        html += `
          <div class="install-option">
            <div class="platform-icon">🍎</div>
            <div class="content">
              <h3>App Store (iPhone / iPad)</h3>
              <p>Официальная установка через App Store.</p>
              <div class="status status-ok">✅ Доступно</div>
              <a href="${escapeHtml(links.ios)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Открыть в App Store</a>
            </div>
          </div>`;
      } else if (links.web) {
        html += `
          <div class="install-option">
            <div class="platform-icon">🍎</div>
            <div class="content">
              <h3>Прямая установка на iPhone / iPad</h3>
              <p class="status status-no">❌ Прямая установка на это устройство недоступна.</p>
              <p>Можно использовать веб-версию:</p>
              <a href="${escapeHtml(links.web)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Открыть веб-версию</a>
            </div>
          </div>`;
      } else {
        html += `
          <div class="install-option">
            <div class="platform-icon">🍎</div>
            <div class="content">
              <h3>iPhone / iPad</h3>
              <p class="status status-no">❌ Прямая установка на это устройство недоступна.</p>
              ${!app.free ? '<p class="status status-warn">⚠️ Бесплатная легальная установка недоступна. Используйте официальный источник для покупки.</p>' : ''}
            </div>
          </div>`;
      }
    }
    if (device.isAndroid || !device.isMobile) {
      if (links.android) {
        html += `
          <div class="install-option">
            <div class="platform-icon">🤖</div>
            <div class="content">
              <h3>Google Play</h3>
              <p>Официальная установка через Google Play.</p>
              <div class="status status-ok">✅ Доступно</div>
              <a href="${escapeHtml(links.android)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Открыть в Google Play</a>
            </div>
          </div>`;
      }
    }
    if (links.web) {
      html += `
        <div class="install-option">
          <div class="platform-icon">🌐</div>
          <div class="content">
            <h3>Веб-версия</h3>
            <p>Полноценный доступ через браузер — работает на любом устройстве.</p>
            <div class="status status-ok">✅ Доступно</div>
            <a href="${escapeHtml(links.web)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Открыть веб-версию</a>
          </div>
        </div>`;
    }
    if (links.official) {
      html += `
        <div class="install-option">
          <div class="platform-icon">🔗</div>
          <div class="content">
            <h3>Официальный сайт</h3>
            <p>Сайт разработчика. Там могут быть дополнительные способы загрузки.</p>
            <a href="${escapeHtml(links.official)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Перейти на сайт</a>
          </div>
        </div>`;
    }
    if (!app.free && !links.ios && !links.android) {
      html += `<div class="notice warning">Бесплатная легальная установка недоступна. Приложение платное — используйте официальные магазины для покупки.</div>`;
    }
    if (!html) html = `<p class="status status-no">Нет доступных способов установки для вашего устройства.</p>`;
    return html;
  }

  function renderHome() {
    const popular = window.APPS.filter(a => a.popular).slice(0, 8);
    const games = window.APPS.filter(a => a.category === 'games' || (a.categories && a.categories.includes('games'))).slice(0, 6);
    const news = window.APPS.filter(a => a.categories && a.categories.includes('new')).slice(0, 4);
    const historyIds = getHistory().slice(0, 6);
    const historyApps = historyIds.map(id => getAppById(id)).filter(Boolean);
    return `
      <div class="container">
        <section class="hero">
          <h1>Скачай, что надо!</h1>
          <p>Каталог как App Store и RuStore. Найди <strong>любое</strong> приложение — даже то, которое недоступно на iPhone или Android. Без регистрации.</p>
          <div class="search-box">
            <span class="search-icon">🔎</span>
            <input type="search" class="search-input" id="search-input" placeholder="Что хотите скачать? Minecraft, Telegram, ChatGPT..." autocomplete="off" enterkeyhint="search">
            <div class="search-results" id="search-results"></div>
          </div>
        </section>
        ${historyApps.length ? `
        <section class="section">
          <div class="section-header"><h2 class="section-title">Недавно смотрели</h2></div>
          <div class="apps-grid">${historyApps.map(renderAppCard).join('')}</div>
        </section>` : ''}
        <section class="section">
          <div class="section-header"><h2 class="section-title">⭐ Популярные</h2><a href="#/catalog" class="section-link">Все →</a></div>
          <div class="apps-grid">${popular.map(renderAppCard).join('')}</div>
        </section>
        <section class="section">
          <div class="section-header"><h2 class="section-title">🎮 Игры</h2><a href="#/games" class="section-link">Все →</a></div>
          <div class="apps-grid">${games.map(renderAppCard).join('')}</div>
        </section>
        ${news.length ? `
        <section class="section">
          <div class="section-header"><h2 class="section-title">🆕 Новинки</h2></div>
          <div class="apps-grid">${news.map(renderAppCard).join('')}</div>
        </section>` : ''}
        <section class="section">
          <div class="section-header"><h2 class="section-title">Категории</h2><a href="#/categories" class="section-link">Все →</a></div>
          <div class="categories-grid">
            ${window.CATEGORIES.slice(0, 12).map(c => `
              <a href="#/category/${c.id}" class="category-card">
                <div class="icon">${c.icon}</div>
                <div class="name">${escapeHtml(c.name)}</div>
              </a>`).join('')}
          </div>
        </section>
      </div>`;
  }

  function renderCatalog(filter = {}) {
    let list = [...window.APPS];
    if (filter.category) list = list.filter(a => a.category === filter.category || (a.categories && a.categories.includes(filter.category)));
    if (filter.platform === 'ios') list = list.filter(a => a.platforms && a.platforms.includes('ios'));
    if (filter.platform === 'android') list = list.filter(a => a.platforms && a.platforms.includes('android'));
    if (filter.games) list = list.filter(a => a.category === 'games' || (a.categories && a.categories.includes('games')));
    if (filter.appsOnly) list = list.filter(a => a.category !== 'games' && !(a.categories && a.categories.includes('games')));
    const title = filter.category ? getCategoryName(filter.category)
      : filter.platform === 'ios' ? 'Для iPhone / iPad'
      : filter.platform === 'android' ? 'Для Android'
      : filter.games ? 'Игры'
      : filter.appsOnly ? 'Приложения'
      : 'Каталог';
    return `
      <div class="container">
        <div class="section-header">
          <h1 class="section-title">${escapeHtml(title)}</h1>
          <span class="badge">${list.length} приложений</span>
        </div>
        <div class="filters">
          <a href="#/catalog" class="filter-btn ${!filter.category && !filter.platform && !filter.games && !filter.appsOnly ? 'active' : ''}">Все</a>
          <a href="#/games" class="filter-btn ${filter.games ? 'active' : ''}">Игры</a>
          <a href="#/apps" class="filter-btn ${filter.appsOnly ? 'active' : ''}">Приложения</a>
          <a href="#/iphone" class="filter-btn ${filter.platform === 'ios' ? 'active' : ''}">iOS</a>
          <a href="#/android" class="filter-btn ${filter.platform === 'android' ? 'active' : ''}">Android</a>
        </div>
        ${list.length ? `<div class="apps-grid">${list.map(renderAppCard).join('')}</div>` : `<div class="empty-state"><div class="icon">📭</div><p>Ничего не найдено</p></div>`}
      </div>`;
  }

  function renderCategories() {
    return `
      <div class="container">
        <h1 class="section-title" style="margin-bottom:20px">Категории</h1>
        <div class="categories-grid">
          ${window.CATEGORIES.map(c => `
            <a href="#/category/${c.id}" class="category-card">
              <div class="icon">${c.icon}</div>
              <div class="name">${escapeHtml(c.name)}</div>
            </a>`).join('')}
        </div>
      </div>`;
  }

  function renderAppPage(id) {
    const app = getAppById(id);
    if (!app) return `<div class="container empty-state"><div class="icon">😕</div><h2>Приложение не найдено</h2><p><a href="#/">Вернуться на главную</a></p></div>`;
    addToHistory(id);
    const platforms = (app.platforms || []).map(p => `<span class="badge platform-${p === 'ios' ? 'ios' : p === 'android' ? 'android' : ''}">${platformLabel(p)}</span>`).join('');
    const favActive = isFavorite(id) ? 'active' : '';
    const favIcon = isFavorite(id) ? '★' : '☆';
    const favText = isFavorite(id) ? 'В избранном' : 'В избранное';
    document.title = `${app.name} — скачать | Скачай, что надо!`;
    return `
      <div class="container app-detail fade-in">
        <div class="app-detail-header">
          <img class="app-detail-icon" src="${escapeHtml(app.icon)}" alt="${escapeHtml(app.name)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22><rect fill=%22%23e2e8f0%22 width=%22120%22 height=%22120%22 rx=%2224%22/><text x=%2260%22 y=%2275%22 text-anchor=%22middle%22 font-size=%2248%22>📱</text></svg>'">
          <div class="app-detail-info">
            <h1>${escapeHtml(app.name)}</h1>
            <div class="developer">${escapeHtml(app.developer)}</div>
            <div class="app-detail-meta">
              <span class="badge category">${escapeHtml(getCategoryName(app.category))}</span>
              ${platforms}
              ${app.rating ? `<span class="badge">★ ${app.rating}</span>` : ''}
              ${app.version ? `<span class="badge">v${escapeHtml(app.version)}</span>` : ''}
              ${app.size ? `<span class="badge">${escapeHtml(app.size)}</span>` : ''}
              ${app.free === false ? `<span class="badge">Платное</span>` : `<span class="badge">Бесплатно</span>`}
            </div>
            <div class="app-detail-actions">
              <button class="btn btn-outline btn-fav-page ${favActive}" data-fav="${escapeHtml(id)}">${favIcon} ${favText}</button>
            </div>
          </div>
        </div>
        <div class="install-section">
          <h2>Как установить</h2>
          <p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.9rem">Вы используете: <strong>${escapeHtml(device.label)}</strong>. Ниже показаны реально доступные способы.</p>
          ${renderInstallOptions(app)}
          ${app.note ? `<div class="notice warning" style="margin-top:12px">${escapeHtml(app.note)}</div>` : ''}
        </div>
        <div class="description-section">
          <h2>Описание</h2>
          <p>${escapeHtml(app.fullDescription || app.description)}</p>
        </div>
        <div class="description-section">
          <h2>Информация</h2>
          <p>
            <strong>Разработчик:</strong> ${escapeHtml(app.developer)}<br>
            ${app.updated ? `<strong>Обновлено:</strong> ${escapeHtml(app.updated)}<br>` : ''}
            ${app.version ? `<strong>Версия:</strong> ${escapeHtml(app.version)}<br>` : ''}
            ${app.size ? `<strong>Размер:</strong> ${escapeHtml(app.size)}<br>` : ''}
            <strong>Поддерживаемые платформы:</strong> ${(app.platforms || []).map(platformLabel).join(', ')}
          </p>
        </div>
      </div>`;
  }

  function renderFavorites() {
    const favs = getFavorites().map(id => getAppById(id)).filter(Boolean);
    return `
      <div class="container">
        <h1 class="section-title" style="margin-bottom:20px">⭐ Избранное</h1>
        ${favs.length ? `<div class="apps-grid">${favs.map(renderAppCard).join('')}</div>` : `<div class="empty-state"><div class="icon">☆</div><p>Пока ничего нет. Нажмите ☆ на карточке приложения, чтобы добавить.</p><p style="margin-top:12px"><a href="#/catalog">Перейти в каталог</a></p></div>`}
      </div>`;
  }

  function renderSettings() {
    return `
      <div class="container" style="max-width:600px">
        <h1 class="section-title" style="margin-bottom:20px">Настройки</h1>
        <div class="settings-card">
          <h3>Тема оформления</h3>
          <p>Выберите светлую или тёмную тему. Выбор сохраняется в браузере.</p>
          <button class="btn btn-outline" id="set-light">☀️ Светлая</button>
          <button class="btn btn-outline" id="set-dark">🌙 Тёмная</button>
        </div>
        <div class="settings-card">
          <h3>Ваше устройство</h3>
          <p>Определено: <strong>${escapeHtml(device.label)}</strong></p>
        </div>
        <div class="settings-card">
          <h3>Данные</h3>
          <p>Избранное и история хранятся только в вашем браузере.</p>
          <button class="btn btn-outline" id="clear-history">Очистить историю</button>
          <button class="btn btn-outline" id="clear-favorites" style="margin-left:8px">Очистить избранное</button>
        </div>
        <div class="settings-card">
          <h3>О проекте</h3>
          <p>«Скачай, что надо!» — бесплатный каталог приложений. Мы не распространяем пиратский контент. Все ссылки ведут на официальные источники.</p>
        </div>
      </div>`;
  }

  function parseRoute() {
    const hash = location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);
    return { path: parts[0] || 'home', param: parts[1] };
  }

  function navigate() {
    const { path, param } = parseRoute();
    const main = document.getElementById('main-content');
    if (!main) return;
    document.querySelectorAll('.nav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.page === path || (path === 'home' && el.dataset.page === 'home') || (path === 'category' && el.dataset.page === 'categories'));
    });
    document.getElementById('main-nav')?.classList.remove('open');
    let html = '';
    switch (path) {
      case 'home': case '': document.title = 'Скачай, что надо! — каталог приложений и игр'; html = renderHome(); break;
      case 'catalog': document.title = 'Каталог — Скачай, что надо!'; html = renderCatalog({}); break;
      case 'categories': document.title = 'Категории — Скачай, что надо!'; html = renderCategories(); break;
      case 'category': document.title = `${getCategoryName(param)} — Скачай, что надо!`; html = renderCatalog({ category: param }); break;
      case 'games': document.title = 'Игры — Скачай, что надо!'; html = renderCatalog({ games: true }); break;
      case 'apps': document.title = 'Приложения — Скачай, что надо!'; html = renderCatalog({ appsOnly: true }); break;
      case 'iphone': document.title = 'Для iPhone — Скачай, что надо!'; html = renderCatalog({ platform: 'ios' }); break;
      case 'android': document.title = 'Для Android — Скачай, что надо!'; html = renderCatalog({ platform: 'android' }); break;
      case 'favorites': document.title = 'Избранное — Скачай, что надо!'; html = renderFavorites(); break;
      case 'settings': document.title = 'Настройки — Скачай, что надо!'; html = renderSettings(); break;
      case 'app': html = renderAppPage(param); break;
      default: html = renderHome();
    }
    main.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (searchInput && searchResults) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value;
        const results = searchApps(q);
        if (results.length && q.trim()) {
          searchResults.innerHTML = results.map(app => `
            <div class="search-result-item" data-id="${escapeHtml(app.id)}">
              <img src="${escapeHtml(app.icon)}" alt="" loading="lazy" onerror="this.style.display='none'">
              <div class="info">
                <div class="name">${escapeHtml(app.name)}</div>
                <div class="meta">${escapeHtml(app.developer)} · ${escapeHtml(getCategoryName(app.category))}</div>
              </div>
            </div>`).join('');
          searchResults.classList.add('visible');
        } else {
          searchResults.classList.remove('visible');
          searchResults.innerHTML = '';
        }
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim();
          if (q) {
            const results = searchApps(q);
            if (results.length === 1) location.hash = `#/app/${results[0].id}`;
          }
        }
      });
      searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) { location.hash = `#/app/${item.dataset.id}`; searchResults.classList.remove('visible'); }
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) searchResults.classList.remove('visible');
      });
    }
    document.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        const id = card.dataset.id;
        if (id) location.hash = `#/app/${id}`;
      });
    });
    document.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.fav;
        const now = toggleFavorite(id);
        if (btn.classList.contains('btn-fav-page')) {
          btn.innerHTML = now ? '★ В избранном' : '☆ В избранное';
          btn.classList.toggle('active', now);
        } else {
          btn.textContent = now ? '★' : '☆';
          btn.classList.toggle('active', now);
        }
      });
    });
    document.getElementById('set-light')?.addEventListener('click', () => setTheme('light'));
    document.getElementById('set-dark')?.addEventListener('click', () => setTheme('dark'));
    document.getElementById('clear-history')?.addEventListener('click', () => { localStorage.removeItem('history'); alert('История очищена'); });
    document.getElementById('clear-favorites')?.addEventListener('click', () => { localStorage.removeItem('favorites'); alert('Избранное очищено'); navigate(); });
  }

  function init() {
    setTheme(getTheme());
    const banner = document.getElementById('device-banner');
    if (banner) document.getElementById('device-text').textContent = `Вы используете: ${device.label}`;
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('main-nav')?.classList.toggle('open');
    });
    window.addEventListener('hashchange', navigate);
    navigate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
