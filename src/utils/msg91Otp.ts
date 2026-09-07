// MSG91 OTP Widget Integration Utility for ZARB (India-only Phone OTP)

declare global {
  interface Window {
    initSendOTP?: (config: any) => void;
    sendOTP?: any;
  }
}

export const MSG91_CONFIG = {
  widgetId: '366967677778343938383039',
  tokenAuth: '568506Tub0GL8Mw6a9e748aP1',
};

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
 * Trigger the MSG91 OTP Widget popup modal for user phone verification
 */
export const openMsg91OtpWidget = async (options: {
  mobileNumber?: string;
  onSuccess: (data: any) => void;
  onFailure?: (error: any) => void;
}) => {
  const loaded = await loadMsg91Script();
  if (!loaded || typeof window.initSendOTP !== 'function') {
    console.error('Failed to load MSG91 OTP widget script');
    options.onFailure?.('Unable to connect to MSG91 OTP server. Please verify your connection.');
    return;
  }

  // Format identifier: only digits, 10-digit Indian number prefixed by 91
  let formattedNumber = '';
  if (options.mobileNumber) {
    const digits = options.mobileNumber.replace(/\D/g, '');
    if (digits.length >= 10) {
      formattedNumber = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits.slice(-10)}`;
    }
  }

  const configuration = {
    widgetId: MSG91_CONFIG.widgetId,
    tokenAuth: MSG91_CONFIG.tokenAuth,
    identifier: formattedNumber || undefined,
    success: (data: any) => {
      console.log('MSG91 OTP Verification Success:', data);
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
