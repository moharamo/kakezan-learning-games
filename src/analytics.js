// Simple GA4 wrapper for this SPA
// Measurement ID: G-5WYRST72F8
const MEASUREMENT_ID = 'G-5WYRST72F8';

export function trackEvent(name, params = {}) {
  try {
    if (window.gtag) {
      window.gtag('event', name, params);
    } else {
      // graceful fallback during dev/testing
      console.debug('gtag not ready — event:', name, params);
    }
  } catch (e) {
    console.error('trackEvent error', e);
  }
}

export function trackPageView(path = '/', title = document.title) {
  try {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
      });
    } else {
      console.debug('gtag not ready — page_view', path, title);
    }
  } catch (e) {
    console.error('trackPageView error', e);
  }
}

export default { trackEvent, trackPageView };
