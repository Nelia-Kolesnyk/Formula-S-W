// Код для отслеживания аналитики на сайте
// Вставьте этот код в ваш HTML файл перед закрывающим тегом </body>

(function() {
  'use strict';

  // ВАЖНО: Замените эту ссылку на URL вашего Google Apps Script
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwxR3SmiGuwmEpi0PBzoPqe1cNv1Re6wvJ5pvHTsRp0gn_ack_SF1W2xrHxW8T7utYGQ/exec';

  // Генерация или получение уникального ID пользователя
  function getUserId() {
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('analytics_user_id', userId);
    }
    return userId;
  }

  // Отправка данных в Google Apps Script
  function sendData(action, data) {
    const payload = {
      action: action,
      userId: getUserId(),
      ...data
    };

    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }).catch(error => {
      console.error('Analytics error:', error);
    });
  }

  // Отслеживание посещения
  function trackVisit() {
    sendData('track_visit', {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    });
  }

  // Отслеживание скролла
  let maxScrollPercent = 0;
  let scrollCheckpoints = {
    25: false,
    50: false,
    75: false,
    100: false
  };
  let pageLoadTime = Date.now();

  function getScrollPercent() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    return Math.min(100, Math.max(0, scrollPercent));
  }

  function trackScroll() {
    const currentScroll = getScrollPercent();

    if (currentScroll > maxScrollPercent) {
      maxScrollPercent = currentScroll;
    }

    // Проверяем контрольные точки
    [25, 50, 75, 100].forEach(checkpoint => {
      if (currentScroll >= checkpoint && !scrollCheckpoints[checkpoint]) {
        scrollCheckpoints[checkpoint] = true;

        const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);

        sendData('track_scroll', {
          scrollPercent: checkpoint,
          maxScroll: Math.round(maxScrollPercent),
          timeOnPage: timeOnPage
        });
      }
    });
  }

  // Отслеживание скролла с задержкой
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(trackScroll, 500);
  });

  // Отправка финальных данных при уходе со страницы
  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    sendData('track_scroll', {
      scrollPercent: Math.round(maxScrollPercent),
      maxScroll: Math.round(maxScrollPercent),
      timeOnPage: timeOnPage
    });
  });

  // Получение аналитики через JSONP (обход CORS)
  function getAnalytics() {
    return new Promise((resolve, reject) => {
      // Создаем уникальное имя для callback функции
      const callbackName = 'analyticsCallback_' + Date.now();
      let timeoutId;
      let script;

      // Создаем глобальную callback функцию
      window[callbackName] = function(response) {
        // Очищаем таймаут
        clearTimeout(timeoutId);

        // Удаляем callback функцию
        delete window[callbackName];

        // Удаляем script тег
        if (script && script.parentNode) {
          document.body.removeChild(script);
        }

        if (response.status === 'success') {
          resolve(response.data);
        } else {
          reject(new Error(response.message || 'Unknown error'));
        }
      };

      // Создаем script тег для JSONP запроса
      script = document.createElement('script');
      script.src = SCRIPT_URL + '?action=get_analytics&callback=' + callbackName;

      script.onerror = function() {
        clearTimeout(timeoutId);
        delete window[callbackName];
        if (script && script.parentNode) {
          document.body.removeChild(script);
        }
        console.error('Ошибка загрузки аналитики. Проверьте:');
        console.error('1. URL скрипта правильный:', SCRIPT_URL);
        console.error('2. Google Apps Script развернут с доступом "Все"');
        console.error('3. Код из Code.gs обновлен в Google Apps Script');
        reject(new Error('Failed to load analytics script'));
      };

      // Таймаут на случай если скрипт не загрузится
      timeoutId = setTimeout(() => {
        delete window[callbackName];
        if (script && script.parentNode) {
          document.body.removeChild(script);
        }
        console.error('Таймаут загрузки аналитики');
        reject(new Error('Analytics request timeout'));
      }, 10000); // 10 секунд

      document.body.appendChild(script);
    });
  }

  // Показ окна с аналитикой
  function showAnalyticsModal(analytics) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'DM Sans', Arial, sans-serif;
      backdrop-filter: blur(5px);
      animation: fadeIn 0.3s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 40px;
      border-radius: 20px;
      max-width: 700px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(201, 151, 94, 0.3);
      animation: slideUp 0.4s ease;
    `;

    // Вычисляем проценты
    const uniqueUsers = analytics.uniqueUsers || 1; // Избегаем деления на 0
    const percent_0_25 = Math.round((analytics.scrollStats.percent_0_25 / uniqueUsers) * 100);
    const percent_25_50 = Math.round((analytics.scrollStats.percent_25_50 / uniqueUsers) * 100);
    const percent_50_75 = Math.round((analytics.scrollStats.percent_50_75 / uniqueUsers) * 100);
    const percent_75_100 = Math.round((analytics.scrollStats.percent_75_100 / uniqueUsers) * 100);
    const percent_100 = Math.round((analytics.scrollStats.percent_100 / uniqueUsers) * 100);

    content.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .stat-card {
          background: rgba(201, 151, 94, 0.1);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(201, 151, 94, 0.3);
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(201, 151, 94, 0.2);
        }
        .progress-bar {
          background: rgba(255, 255, 255, 0.1);
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #c9975e 0%, #d4a76a 100%);
          border-radius: 4px;
          transition: width 1s ease;
        }
      </style>
      <h2 style="margin-top: 0; color: #c9975e; font-size: 32px; font-weight: 600; text-align: center; margin-bottom: 30px; letter-spacing: -0.5px;">
        📊 Аналитика сайта
      </h2>

      <div style="margin: 30px 0;">
        <h3 style="color: #c9975e; margin-bottom: 20px; font-size: 20px; font-weight: 600; border-bottom: 2px solid rgba(201, 151, 94, 0.3); padding-bottom: 10px;">
          Общая статистика
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div class="stat-card">
            <div style="color: #888; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Всего посещений</div>
            <div style="color: #fff; font-size: 28px; font-weight: 700;">${analytics.totalVisits}</div>
          </div>
          <div class="stat-card">
            <div style="color: #888; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Уникальных</div>
            <div style="color: #c9975e; font-size: 28px; font-weight: 700;">${analytics.uniqueUsers}</div>
          </div>
          <div class="stat-card">
            <div style="color: #888; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Средний скролл</div>
            <div style="color: #fff; font-size: 28px; font-weight: 700;">${Math.round(analytics.averageScroll)}%</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.round(analytics.averageScroll)}%"></div>
            </div>
          </div>
          <div class="stat-card">
            <div style="color: #888; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Время на странице</div>
            <div style="color: #fff; font-size: 28px; font-weight: 700;">${Math.round(analytics.averageTimeOnPage)}с</div>
          </div>
        </div>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #c9975e; margin-bottom: 20px; font-size: 20px; font-weight: 600; border-bottom: 2px solid rgba(201, 151, 94, 0.3); padding-bottom: 10px;">
          Статистика по скроллу
        </h3>
        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 12px;">

          <div style="margin: 12px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #b0b0b0; font-size: 15px;">📍 0-25%</span>
              <div style="text-align: right;">
                <span style="color: #fff; font-weight: 600; font-size: 18px;">${analytics.scrollStats.percent_0_25}</span>
                <span style="color: #888; font-size: 14px;"> / ${analytics.uniqueUsers}</span>
                <span style="color: #c9975e; font-size: 16px; margin-left: 8px;">(${percent_0_25}%)</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent_0_25}%"></div>
            </div>
          </div>

          <div style="margin: 12px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #b0b0b0; font-size: 15px;">📍 25-50%</span>
              <div style="text-align: right;">
                <span style="color: #fff; font-weight: 600; font-size: 18px;">${analytics.scrollStats.percent_25_50}</span>
                <span style="color: #888; font-size: 14px;"> / ${analytics.uniqueUsers}</span>
                <span style="color: #c9975e; font-size: 16px; margin-left: 8px;">(${percent_25_50}%)</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent_25_50}%"></div>
            </div>
          </div>

          <div style="margin: 12px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #b0b0b0; font-size: 15px;">📍 50-75%</span>
              <div style="text-align: right;">
                <span style="color: #fff; font-weight: 600; font-size: 18px;">${analytics.scrollStats.percent_50_75}</span>
                <span style="color: #888; font-size: 14px;"> / ${analytics.uniqueUsers}</span>
                <span style="color: #c9975e; font-size: 16px; margin-left: 8px;">(${percent_50_75}%)</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent_50_75}%"></div>
            </div>
          </div>

          <div style="margin: 12px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #b0b0b0; font-size: 15px;">📍 75-100%</span>
              <div style="text-align: right;">
                <span style="color: #fff; font-weight: 600; font-size: 18px;">${analytics.scrollStats.percent_75_100}</span>
                <span style="color: #888; font-size: 14px;"> / ${analytics.uniqueUsers}</span>
                <span style="color: #c9975e; font-size: 16px; margin-left: 8px;">(${percent_75_100}%)</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent_75_100}%"></div>
            </div>
          </div>

          <div style="margin: 12px 0; padding: 15px; background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%); border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #4CAF50; font-size: 15px; font-weight: 600;">✅ До конца (100%)</span>
              <div style="text-align: right;">
                <span style="color: #4CAF50; font-weight: 700; font-size: 20px;">${analytics.scrollStats.percent_100}</span>
                <span style="color: #4CAF50; font-size: 14px; opacity: 0.8;"> / ${analytics.uniqueUsers}</span>
                <span style="color: #4CAF50; font-size: 18px; margin-left: 8px; font-weight: 700;">(${percent_100}%)</span>
              </div>
            </div>
            <div class="progress-bar" style="background: rgba(76, 175, 80, 0.2);">
              <div class="progress-fill" style="background: linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%); width: ${percent_100}%"></div>
            </div>
          </div>

        </div>
      </div>

      <button id="closeAnalytics" style="
        background: linear-gradient(135deg, #c9975e 0%, #b8864d 100%);
        color: white;
        border: none;
        padding: 16px 40px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        width: 100%;
        margin-top: 25px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(201, 151, 94, 0.3);
        letter-spacing: 0.5px;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(201, 151, 94, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(201, 151, 94, 0.3)'">
        Закрыть
      </button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Закрытие модального окна
    document.getElementById('closeAnalytics').addEventListener('click', function() {
      modal.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          document.body.removeChild(modal);
        }, 300);
      }
    });

    // Добавляем анимацию fadeOut
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Показ окна ввода пароля
  function showPasswordModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'DM Sans', Arial, sans-serif;
      backdrop-filter: blur(5px);
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 40px;
      border-radius: 20px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(201, 151, 94, 0.3);
    `;

    content.innerHTML = `
      <h2 style="margin-top: 0; color: #c9975e; font-size: 24px; font-weight: 600; text-align: center; margin-bottom: 25px;">
        🔐 Введите пароль
      </h2>
      <input type="password" id="analyticsPassword" placeholder="Пароль" style="
        width: 100%;
        padding: 15px;
        border: 2px solid rgba(201, 151, 94, 0.3);
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.3);
        color: white;
        font-size: 16px;
        font-family: 'DM Sans', Arial, sans-serif;
        margin-bottom: 20px;
        box-sizing: border-box;
        outline: none;
      " onfocus="this.style.borderColor='#c9975e'" onblur="this.style.borderColor='rgba(201, 151, 94, 0.3)'">
      <button id="submitPassword" style="
        background: linear-gradient(135deg, #c9975e 0%, #b8864d 100%);
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        width: 100%;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(201, 151, 94, 0.3);
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(201, 151, 94, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(201, 151, 94, 0.3)'">
        Войти
      </button>
      <button id="cancelPassword" style="
        background: transparent;
        color: #888;
        border: none;
        padding: 15px 30px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        width: 100%;
        margin-top: 10px;
        transition: all 0.3s ease;
      " onmouseover="this.style.color='#c9975e'" onmouseout="this.style.color='#888'">
        Отмена
      </button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const passwordInput = document.getElementById('analyticsPassword');
    const submitButton = document.getElementById('submitPassword');
    const cancelButton = document.getElementById('cancelPassword');

    function closeModal() {
      document.body.removeChild(modal);
    }

    function checkPassword() {
      if (passwordInput.value === '20092009') {
        closeModal();
        loadAndShowAnalytics();
      } else {
        passwordInput.style.borderColor = '#ff4444';
        passwordInput.value = '';
        passwordInput.placeholder = 'Неверный пароль';
        setTimeout(() => {
          passwordInput.style.borderColor = 'rgba(201, 151, 94, 0.3)';
          passwordInput.placeholder = 'Пароль';
        }, 2000);
      }
    }

    submitButton.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        checkPassword();
      }
    });
    cancelButton.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Загрузка и показ аналитики
  async function loadAndShowAnalytics() {
    const loadingModal = document.createElement('div');
    loadingModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-size: 24px;
      font-family: 'DM Sans', Arial, sans-serif;
    `;
    loadingModal.innerHTML = `
      <div style="font-size: 60px; margin-bottom: 20px; animation: pulse 1.5s infinite;">📊</div>
      <div style="font-size: 20px; color: #c9975e;">Загрузка аналитики...</div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      </style>
    `;
    document.body.appendChild(loadingModal);

    try {
      const analytics = await getAnalytics();
      document.body.removeChild(loadingModal);

      if (analytics) {
        showAnalyticsModal(analytics);
      } else {
        showErrorModal();
      }
    } catch (error) {
      document.body.removeChild(loadingModal);
      showErrorModal();
    }
  }

  // Показ ошибки
  function showErrorModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'DM Sans', Arial, sans-serif;
      backdrop-filter: blur(5px);
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 40px;
      border-radius: 20px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 68, 68, 0.3);
      text-align: center;
    `;

    content.innerHTML = `
      <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
      <h2 style="margin-top: 0; color: #ff4444; font-size: 24px; font-weight: 600; margin-bottom: 15px;">
        Ошибка
      </h2>
      <p style="color: #ccc; font-size: 16px; margin-bottom: 25px;">
        Не удалось загрузить аналитику. Проверьте подключение к интернету и попробуйте снова.
      </p>
      <button id="closeError" style="
        background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        width: 100%;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 68, 68, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 68, 68, 0.3)'">
        Закрыть
      </button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('closeError').addEventListener('click', function() {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Отслеживание 5 кликов на логотип
  let logoClickCount = 0;
  let logoClickTimeout;

  function setupLogoTracking() {
    // Ищем элемент "Формула Свободи" в навигации
    const logo = document.querySelector('.nav-logo');

    if (!logo) {
      console.warn('Элемент .nav-logo не найден');
      return;
    }

    logo.addEventListener('click', async function(e) {
      logoClickCount++;

      // Сбрасываем счетчик через 3 секунды
      clearTimeout(logoClickTimeout);
      logoClickTimeout = setTimeout(() => {
        logoClickCount = 0;
      }, 3000);

      // При 5 кликах показываем окно ввода пароля
      if (logoClickCount === 5) {
        e.preventDefault();
        logoClickCount = 0;

        showPasswordModal();
      }
    });

    console.log('✅ Отслеживание логотипа активировано. Кликните 5 раз для просмотра аналитики.');
  }

  // Инициализация при загрузке страницы
  window.addEventListener('load', function() {
    trackVisit();
    trackScroll(); // Первоначальная проверка скролла
    setupLogoTracking();
    console.log('✅ Аналитика активирована. User ID:', getUserId());
  });

})();
