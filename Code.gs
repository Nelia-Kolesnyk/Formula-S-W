// Google Apps Script для аналитики сайта
// Этот код нужно вставить в Google Apps Script вашей таблицы

// Название листов в таблице
const SHEET_VISITS = 'Посещения';
const SHEET_SCROLL = 'Скролл';
const SHEET_ANALYTICS = 'Аналитика';

// Функция для обработки POST запросов с сайта
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'track_visit') {
      return trackVisit(data);
    } else if (action === 'track_scroll') {
      return trackScroll(data);
    } else if (action === 'get_analytics') {
      return getAnalytics(data);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Функция для обработки GET запросов
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;

  if (action === 'get_analytics') {
    const analytics = getAnalyticsData();

    // Если есть callback параметр, возвращаем JSONP
    if (callback) {
      const jsonp = callback + '(' + JSON.stringify({
        status: 'success',
        data: analytics
      }) + ');';
      return ContentService.createTextOutput(jsonp)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    // Иначе возвращаем обычный JSON
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: analytics
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Unknown action'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Отслеживание посещения
function trackVisit(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_VISITS);

  // Создаем лист если не существует
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_VISITS);
    sheet.appendRow(['Дата и время', 'User ID', 'User Agent', 'Referrer', 'Screen Width', 'Screen Height']);
  }

  const userId = data.userId;
  const timestamp = new Date();
  const userAgent = data.userAgent || '';
  const referrer = data.referrer || '';
  const screenWidth = data.screenWidth || '';
  const screenHeight = data.screenHeight || '';

  sheet.appendRow([timestamp, userId, userAgent, referrer, screenWidth, screenHeight]);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Visit tracked'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Отслеживание скролла
function trackScroll(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SCROLL);

  // Создаем лист если не существует
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SCROLL);
    sheet.appendRow(['Дата и время', 'User ID', 'Процент скролла', 'Макс. скролл', 'Время на странице (сек)']);
  }

  const userId = data.userId;
  const timestamp = new Date();
  const scrollPercent = data.scrollPercent || 0;
  const maxScroll = data.maxScroll || 0;
  const timeOnPage = data.timeOnPage || 0;

  sheet.appendRow([timestamp, userId, scrollPercent, maxScroll, timeOnPage]);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Scroll tracked'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Получение аналитики
function getAnalytics(data) {
  const analytics = getAnalyticsData();

  // Обновляем лист аналитики
  updateAnalyticsSheet(analytics);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: analytics
  })).setMimeType(ContentService.MimeType.JSON);
}

// Функция для получения данных аналитики (без обновления листа)
function getAnalyticsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const visitsSheet = ss.getSheetByName(SHEET_VISITS);
  const scrollSheet = ss.getSheetByName(SHEET_SCROLL);

  let analytics = {
    totalVisits: 0,
    uniqueUsers: 0,
    scrollStats: {
      percent_0_25: 0,
      percent_25_50: 0,
      percent_50_75: 0,
      percent_75_100: 0,
      percent_100: 0
    },
    averageScroll: 0,
    averageTimeOnPage: 0
  };

  // Подсчет посещений и уникальных пользователей
  if (visitsSheet) {
    const visitsData = visitsSheet.getDataRange().getValues();
    if (visitsData.length > 1) {
      analytics.totalVisits = visitsData.length - 1; // минус заголовок

      // Подсчет уникальных пользователей
      const uniqueUserIds = new Set();
      for (let i = 1; i < visitsData.length; i++) {
        uniqueUserIds.add(visitsData[i][1]); // User ID в колонке B
      }
      analytics.uniqueUsers = uniqueUserIds.size;
    }
  }

  // Анализ скролла
  if (scrollSheet) {
    const scrollData = scrollSheet.getDataRange().getValues();
    if (scrollData.length > 1) {
      let totalScroll = 0;
      let totalTime = 0;
      let maxScrollByUser = {}; // Храним максимальный скролл для каждого пользователя

      for (let i = 1; i < scrollData.length; i++) {
        const userId = scrollData[i][1];
        const scrollPercent = parseFloat(scrollData[i][2]) || 0;
        const maxScroll = parseFloat(scrollData[i][3]) || 0;
        const timeOnPage = parseFloat(scrollData[i][4]) || 0;

        // Обновляем максимальный скролл для пользователя
        if (!maxScrollByUser[userId] || maxScroll > maxScrollByUser[userId]) {
          maxScrollByUser[userId] = maxScroll;
        }

        totalScroll += scrollPercent;
        totalTime += timeOnPage;
      }

      // Подсчет по диапазонам скролла (на основе максимального скролла каждого пользователя)
      for (let userId in maxScrollByUser) {
        const maxScroll = maxScrollByUser[userId];

        if (maxScroll >= 100) {
          analytics.scrollStats.percent_100++;
        }
        if (maxScroll >= 75) {
          analytics.scrollStats.percent_75_100++;
        }
        if (maxScroll >= 50) {
          analytics.scrollStats.percent_50_75++;
        }
        if (maxScroll >= 25) {
          analytics.scrollStats.percent_25_50++;
        }
        if (maxScroll >= 0) {
          analytics.scrollStats.percent_0_25++;
        }
      }

      analytics.averageScroll = totalScroll / (scrollData.length - 1);
      analytics.averageTimeOnPage = totalTime / (scrollData.length - 1);
    }
  }

  return analytics;
}

// Обновление листа с аналитикой
function updateAnalyticsSheet(analytics) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ANALYTICS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ANALYTICS);
  }

  sheet.clear();

  // Заголовок
  sheet.appendRow(['АНАЛИТИКА САЙТА']);
  sheet.appendRow(['Обновлено:', new Date()]);
  sheet.appendRow([]);

  // Общая статистика
  sheet.appendRow(['ОБЩАЯ СТАТИСТИКА']);
  sheet.appendRow(['Всего посещений:', analytics.totalVisits]);
  sheet.appendRow(['Уникальных пользователей:', analytics.uniqueUsers]);
  sheet.appendRow(['Средний скролл (%):', Math.round(analytics.averageScroll * 100) / 100]);
  sheet.appendRow(['Среднее время на странице (сек):', Math.round(analytics.averageTimeOnPage * 100) / 100]);
  sheet.appendRow([]);

  // Статистика по скроллу
  sheet.appendRow(['СТАТИСТИКА ПО СКРОЛЛУ']);
  sheet.appendRow(['Пользователей прокрутили 0-25%:', analytics.scrollStats.percent_0_25]);
  sheet.appendRow(['Пользователей прокрутили 25-50%:', analytics.scrollStats.percent_25_50]);
  sheet.appendRow(['Пользователей прокрутили 50-75%:', analytics.scrollStats.percent_50_75]);
  sheet.appendRow(['Пользователей прокрутили 75-100%:', analytics.scrollStats.percent_75_100]);
  sheet.appendRow(['Пользователей прокрутили до конца (100%):', analytics.scrollStats.percent_100]);

  // Форматирование
  sheet.getRange('A1').setFontWeight('bold').setFontSize(14);
  sheet.getRange('A4').setFontWeight('bold');
  sheet.getRange('A11').setFontWeight('bold');
  sheet.setColumnWidth(1, 300);
  sheet.setColumnWidth(2, 150);
}

// Функция для ручного обновления аналитики (можно вызвать из меню)
function manualUpdateAnalytics() {
  const analytics = getAnalyticsData();
  updateAnalyticsSheet(analytics);
  SpreadsheetApp.getUi().alert('Аналитика обновлена!');
}

// Создание меню при открытии таблицы
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Аналитика')
    .addItem('Обновить аналитику', 'manualUpdateAnalytics')
    .addToUi();
}
