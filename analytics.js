// Y.M.N project GA4 basic measurement with consent (Basic mode, all visitors).
// Before consent or after refusal: the Google Analytics tag is not loaded and nothing is sent.
// Sends page_view (via config) and select_entry for the three top entrances, only after consent.
// Never sends form values, names, emails or message text.
(function () {
  var MEASUREMENT_ID = 'G-3E1G9YHBWS';
  var CONSENT_KEY = 'ymn_analytics_consent';
  var CONSENT_VERSION = 1;
  var INTERNAL_KEY = 'ymn_internal';
  var loaded = false;
  var sessionChoice = null; // used when localStorage is unavailable

  function readChoice() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(CONSENT_KEY) || 'null');
      if (saved && saved.v === CONSENT_VERSION && (saved.choice === 'granted' || saved.choice === 'denied')) return saved.choice;
    } catch (error) { /* fall through */ }
    return sessionChoice;
  }

  function saveChoice(choice) {
    sessionChoice = choice;
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, choice: choice, at: new Date().toISOString() }));
    } catch (error) { /* keep for this page only */ }
  }

  function isInternal() {
    try {
      var flag = new URLSearchParams(window.location.search).get(INTERNAL_KEY);
      if (flag === '1') window.localStorage.setItem(INTERNAL_KEY, '1');
      if (flag === '0') window.localStorage.removeItem(INTERNAL_KEY);
      return window.localStorage.getItem(INTERNAL_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function loadAnalytics() {
    if (loaded) {
      // Re-consent on the same page after a refusal.
      window['ga-disable-' + MEASUREMENT_ID] = false;
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      return;
    }
    loaded = true;
    window['ga-disable-' + MEASUREMENT_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    // traffic_type must be set before config: as a config field alone it was not sent (verified 2026-11-25).
    if (isInternal()) window.gtag('set', { traffic_type: 'internal' });
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var loader = document.createElement('script');
    loader.async = true;
    loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(loader);
  }

  function stopAnalytics() {
    window['ga-disable-' + MEASUREMENT_ID] = true;
    if (loaded && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    var host = window.location.hostname;
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (domain) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + domain;
        });
      }
    });
  }

  // ---- Consent notice ----
  var STYLE = '' +
    '.ymn-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:560px;margin-left:auto;background:#1d1b1a;color:#eee9df;border:1px solid #f2eade3d;box-shadow:0 18px 50px #0008;padding:20px 22px;font:14px/1.8 "Zen Maru Gothic","Yu Gothic","Hiragino Kaku Gothic ProN",Meiryo,sans-serif}' +
    '.ymn-consent p{margin:0 0 14px}' +
    '.ymn-consent a{color:#f3a9c4;text-decoration:underline;text-underline-offset:3px}' +
    '.ymn-consent-actions{display:flex;gap:10px;flex-wrap:wrap}' +
    '.ymn-consent button{flex:1 1 140px;min-height:44px;padding:0 16px;border:1px solid #eee9df99;background:transparent;color:#eee9df;font:inherit;cursor:pointer}' +
    '.ymn-consent button:hover{border-color:#EE78A3;color:#fff}' +
    '.ymn-consent button:focus-visible,.ymn-consent a:focus-visible{outline:2px solid #EE78A3;outline-offset:3px}' +
    '@media(max-width:760px){.ymn-consent{left:12px;right:12px;bottom:12px;padding:16px 16px;font-size:13px}}';

  var notice = null;

  function closeNotice() {
    if (notice && notice.parentNode) notice.parentNode.removeChild(notice);
    notice = null;
    document.body.style.paddingBottom = '';
  }

  // While the notice is open, add space at the end of the page so it never hides the footer.
  function reserveSpace() {
    if (notice) document.body.style.paddingBottom = (notice.offsetHeight + 24) + 'px';
  }

  function choose(choice) {
    saveChoice(choice);
    closeNotice();
    if (choice === 'granted') loadAnalytics(); else stopAnalytics();
    updateStatus();
  }

  function showNotice(focusFirst) {
    if (notice) return;
    if (!document.getElementById('ymn-consent-style')) {
      var style = document.createElement('style');
      style.id = 'ymn-consent-style';
      style.textContent = STYLE;
      document.head.appendChild(style);
    }
    var policyUrl = (document.querySelector('link[rel="privacy-policy"]') || {}).href || 'privacy.html';
    notice = document.createElement('section');
    notice.className = 'ymn-consent';
    notice.setAttribute('role', 'region');
    notice.setAttribute('aria-label', 'アクセス解析の同意');
    notice.innerHTML = '<p>サイト改善のため、Googleアナリティクス（Cookieを使用）で利用状況を分析します。同意いただいた場合のみ読み込みます。詳しくは<a href="' + policyUrl + '">プライバシーポリシー</a>をご覧ください。</p>' +
      '<div class="ymn-consent-actions"><button type="button" data-choice="granted">同意する</button><button type="button" data-choice="denied">同意しない</button></div>';
    notice.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('button[data-choice]');
      if (button) choose(button.getAttribute('data-choice'));
    });
    document.body.appendChild(notice);
    reserveSpace();
    if (focusFirst) notice.querySelector('button').focus();
  }

  function updateStatus() {
    var status = document.getElementById('ymn-consent-status');
    if (!status) return;
    var choice = readChoice();
    status.textContent = choice === 'granted' ? '現在の設定：同意する（アクセス解析を利用中）'
      : choice === 'denied' ? '現在の設定：同意しない（アクセス解析を利用していません）'
      : '現在の設定：未選択（アクセス解析を利用していません）';
  }

  // ---- Entrance clicks (sent only after consent) ----
  var ENTRIES = { '#create': 'web_design', '#improve': 'business_improvement', '#products': 'products' };
  var LOCATIONS = [
    ['.hero-actions', 'hero'],
    ['.entrance-foot', 'hero_footer'],
    ['.lobby', 'lobby'],
    ['.mobile-menu', 'menu'],
    ['.museum-header', 'header']
  ];

  document.addEventListener('click', function (event) {
    var opener = event.target.closest && event.target.closest('#ymn-consent-open');
    if (opener) { event.preventDefault(); closeNotice(); showNotice(true); return; }
    if (!loaded || readChoice() !== 'granted') return;
    var link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link) return;
    var entryName = ENTRIES[link.getAttribute('href')];
    if (!entryName) return;
    var location = 'other';
    for (var i = 0; i < LOCATIONS.length; i += 1) {
      if (link.closest(LOCATIONS[i][0])) { location = LOCATIONS[i][1]; break; }
    }
    window.gtag('event', 'select_entry', { entry_name: entryName, entry_location: location });
  });

  window.addEventListener('resize', reserveSpace);

  function start() {
    var choice = readChoice();
    if (choice === 'granted') loadAnalytics();
    else if (choice !== 'denied') showNotice(false);
    updateStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
