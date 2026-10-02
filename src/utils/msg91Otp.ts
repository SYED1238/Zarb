// MSG91 OTP Widget Integration Utility for ZARB (India-only Phone OTP)
// Credentials are fetched from the server-side otp-service Edge Function.
// NO secrets are stored in client-side code.

import { supabase, isSupabaseConfigured } from '../lib/supabase';

declare global {
  interface Window {
    initSendOTP?: (config: any) => void;
    sendOTP?: any;
  }
}

// NOTE: MSG91 widgetId and tokenAuth are fetched from the server at runtime.
// The old hardcoded values have been removed for security.
// ⚠️ The previously exposed tokenAuth should be ROTATED/REVOKED in the MSG91 dashboard.

let isScriptLoading = false;
let isScriptLoaded = false;

/**
 * Dynamically load the MSG91 OTP script if not already present
 */
export const loadMsg91Script = (): Promise<boolean> => {
  if (isScriptLoaded && typeof window.initSendOTP === 'function') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    if (typeof window.initSendOTP === 'function') {
      isScriptLoaded = true;
      resolve(true);
      return;
    }

    if (isScriptLoading) {
      const check = setInterval(() => {
        if (typeof window.initSendOTP === 'function') {
          clearInterval(check);
          isScriptLoaded = true;
          resolve(true);
        }
      }, 100);
      return;
    }

    isScriptLoading = true;
    const urls = [
      'https://verify.msg91.com/otp-provider.js',
      'https://verify.phone91.com/otp-provider.js',
    ];

    let i = 0;
    function attempt() {
      const s = document.createElement('script');
      s.src = urls[i];
      s.async = true;
      s.onload = () => {
        isScriptLoading = false;
        isScriptLoaded = true;
        resolve(true);
      };
      s.onerror = () => {
        i++;
        if (i < urls.length) {
          attempt();
        } else {
          isScriptLoading = false;
          resolve(false);
        }
      };
      document.head.appendChild(s);
    }
    attempt();
  });
};

/**
 * Fetch MSG91 OTP configuration from the secure server-side Edge Function
 */
async function fetchOtpConfig(phone?: string): Promise<{ widgetId: string; tokenAuth: string } | null> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured — cannot fetch OTP config');
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('otp-service', {
      body: { action: 'get-config', phone: phone || '' },
    });

    if (error || !data?.widgetId || !data?.tokenAuth) {
      console.error('Failed to fetch OTP config from server:', error || data);
      return null;
    }

    return { widgetId: data.widgetId, tokenAuth: data.tokenAuth };
  } catch (err) {
    console.error('Error fetching OTP config:', err);
    return null;
  }
}

/**
 * Trigger the MSG91 OTP Widget popup modal for user phone verification
 */
export const openMsg91OtpWidget = async (options: {
  mobileNumber?: string;
  onSuccess: (data: any) => void;
  onFailure?: (error: any) => void;
}) => {
  // 1. Fetch OTP credentials from server
  const otpConfig = await fetchOtpConfig(options.mobileNumber);
  if (!otpConfig) {
    options.onFailure?.('Unable to initialize OTP service. Please try again.');
    return;
  }

  // 2. Load the MSG91 widget script
  const loaded = await loadMsg91Script();
  if (!loaded || typeof window.initSendOTP !== 'function') {
    console.error('Failed to load MSG91 OTP widget script');
    options.onFailure?.('Unable to connect to MSG91 OTP server. Please verify your connection.');
    return;
  }

  // 3. Format identifier: only digits, 10-digit Indian number prefixed by 91
  let formattedNumber = '';
  if (options.mobileNumber) {
    const digits = options.mobileNumber.replace(/\D/g, '');
    if (digits.length >= 10) {
      formattedNumber = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits.slice(-10)}`;
    }
  }

  // 4. Initialize the widget with server-provided credentials
  const configuration = {
    widgetId: otpConfig.widgetId,
    tokenAuth: otpConfig.tokenAuth,
    identifier: formattedNumber || undefined,
    success: (data: any) => {
      console.log('MSG91 OTP Verification Success');
      options.onSuccess(data);
    },
    failure: (error: any) => {
      console.warn('MSG91 OTP Verification Failure/Cancelled:', error);
      options.onFailure?.(error);
    },
  };

  try {
    window.initSendOTP(configuration);
  } catch (err) {
    console.error('Error invoking window.initSendOTP:', err);
    options.onFailure?.(err);
  }
};
