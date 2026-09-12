/**
 * Browser Detection Utilities for ZARB
 * Reliable, lightweight detection of in-app webviews (specifically Instagram)
 * without dependencies, preventing false positives on normal Chrome, Safari, Firefox, etc.
 */

export const BROWSER_PREFERENCE_STORAGE_KEY = 'zarb_browser_preference';

/**
 * Checks if the current visitor is browsing via Instagram's in-app webview.
 * Evaluates the User-Agent defensively and ensures normal Chrome, Safari,
 * Firefox, Samsung Internet, Edge, and desktop browsers are never falsely flagged.
 *
 * @param customUserAgent Optional user agent for testing or SSR environments
 */
export function isInstagramInAppBrowser(customUserAgent?: string): boolean {
  if (typeof window === 'undefined' && !customUserAgent) return false;

  const ua = customUserAgent ?? (
    typeof navigator !== 'undefined'
      ? (navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '')
      : ''
  );

  if (!ua || typeof ua !== 'string') return false;

  // Instagram app embeds 'Instagram' into its User-Agent string across iOS & Android:
  // e.g. "Mozilla/5.0 (iPhone; ... Instagram 280.0.0.17.112 ...)"
  // e.g. "Mozilla/5.0 (Linux; Android 13; ... Instagram 280.0.0.17.112 Android ...)"
  const isInstagramUa = /instagram/i.test(ua);

  return isInstagramUa;
}

/**
 * Detects if the current environment is Android
 */
export function isAndroidDevice(customUserAgent?: string): boolean {
  const ua = customUserAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /android/i.test(ua);
}

/**
 * Detects if the current environment is iOS (iPhone, iPad, iPod)
 */
export function isIosDevice(customUserAgent?: string): boolean {
  const ua = customUserAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /iphone|ipad|ipod/i.test(ua);
}

/**
 * Reads the stored browser preference from sessionStorage or localStorage
 */
export function getBrowserPreference(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(BROWSER_PREFERENCE_STORAGE_KEY) ||
           localStorage.getItem(BROWSER_PREFERENCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the user's browser choice so they are not repeatedly prompted
 */
export function setBrowserPreference(preference: 'instagram' | 'browser'): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(BROWSER_PREFERENCE_STORAGE_KEY, preference);
    localStorage.setItem(BROWSER_PREFERENCE_STORAGE_KEY, preference);
  } catch {
    // Graceful fallback if storage is restricted or disabled
  }
}

/**
 * Evaluates whether the Instagram choice prompt should be displayed:
 * Must be in Instagram's in-app browser AND must not have previously chosen to continue in Instagram.
 */
export function shouldShowInstagramChoice(): boolean {
  if (!isInstagramInAppBrowser()) return false;
  const pref = getBrowserPreference();
  return pref !== 'instagram';
}

/**
 * Attempts to hand off the current page URL to the device's default / external browser.
 * Preserves the full URL including pathname, search query parameters (e.g. UTM tags, coupons),
 * and hash fragments.
 *
 * @param url Optional target URL; defaults to current window.location.href
 */
export function openInExternalBrowser(url?: string): {
  success: boolean;
  isAndroid: boolean;
  isIos: boolean;
  targetUrl: string;
} {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const isAndroid = isAndroidDevice();
  const isIos = isIosDevice();

  if (!targetUrl || typeof window === 'undefined') {
    return { success: false, isAndroid, isIos, targetUrl: '' };
  }

  // Persist preference that the user requested the independent browser
  setBrowserPreference('browser');

  if (isAndroid) {
    // Standard Android Intent URI: Launches default browser handler for HTTPS without locking to a single package
    const cleanUrl = targetUrl.replace(/^https?:\/\//i, '');
    const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end;`;

    try {
      window.location.href = intentUrl;
      return { success: true, isAndroid, isIos, targetUrl };
    } catch (err) {
      console.warn('Android Intent handoff failed, falling back to window.open:', err);
    }
  }

  // iOS or Universal Fallback:
  // In iOS Instagram WebKit, direct window.location assignment is sandboxed.
  // We trigger an anchor tag with noopener and target _blank, while also providing
  // the user on-screen guidance to use Instagram's native "••• -> Open in Safari / Chrome"
  try {
    const link = document.createElement('a');
    link.href = targetUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, isAndroid, isIos, targetUrl };
  } catch (err) {
    console.warn('Universal link trigger failed:', err);
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return { success: true, isAndroid, isIos, targetUrl };
    } catch {
      return { success: false, isAndroid, isIos, targetUrl };
    }
  }
}
