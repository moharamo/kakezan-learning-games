const measurementId = () => {
  const configured = window.__GA4_MEASUREMENT_ID__;
  if (typeof configured !== 'string') return '';
  return configured.trim();
};

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

export function initAnalytics() {
  const id = measurementId();
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return false;

  ensureGtag();

  if (!document.querySelector('script[data-ga4-loader="true"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    script.setAttribute('data-ga4-loader', 'true');
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', id, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: false
  });

  return true;
}

export function trackEvent(name, params = {}) {
  const id = measurementId();
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return;

  ensureGtag();
  window.gtag('event', name, {
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    ...params
  });
}

export function trackPageView(path = '/', title = document.title) {
  trackEvent('page_view', {
    page_path: path,
    page_title: title
  });
}

export default { initAnalytics, trackEvent, trackPageView };
