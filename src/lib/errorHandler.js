/**
 * Error Handler & Monitoring Service
 * Menangkap dan log error global untuk debugging dan monitoring
 */

const isProduction = import.meta.env.PROD;
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

// Error types
export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  DATABASE: 'DATABASE_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// Store errors for later retrieval (optional)
const errorStore = [];
const MAX_STORED_ERRORS = 50;

/**
 * Log error dengan detail lengkap
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    type: errorInfo?.type || ErrorType.UNKNOWN,
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...context,
  };

  // Simpan ke store lokal
  errorStore.push(errorInfo);
  if (errorStore.length > MAX_STORED_ERRORS) {
    errorStore.shift();
  }

  // Log ke console (selalu, termasuk production untuk debugging)
  console.error('❌ [Error Monitor]', errorInfo);

  // Kirim ke Sentry jika tersedia
  if (SENTRY_DSN && typeof window !== 'undefined') {
    sendToSentry(errorInfo);
  }

  // Kirim ke backend analytics (opsional)
  if (!isProduction) {
    sendToBackend(errorInfo);
  }

  return errorInfo;
};

/**
 * Tangkap error dari Supabase responses
 */
export const handleSupabaseError = (error, operation = 'database operation') => {
  const errorType = mapSupabaseError(error);
  
  logError(error, {
    type: errorType,
    operation,
    source: 'supabase',
  });

  // Return user-friendly message
  const userMessages = {
    [ErrorType.NETWORK]: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
    [ErrorType.DATABASE]: 'Terjadi kesalahan pada database. Silakan coba lagi.',
    [ErrorType.AUTH]: 'Sesi login telah berakhir. Silakan login ulang.',
    [ErrorType.VALIDATION]: 'Data yang dimasukkan tidak valid.',
    [ErrorType.UNKNOWN]: 'Terjadi kesalahan tak terduga.',
  };

  return {
    success: false,
    error: userMessages[errorType] || userMessages[ErrorType.UNKNOWN],
    details: isProduction ? null : error,
  };
};

/**
 * Map Supabase error codes to our error types
 */
const mapSupabaseError = (error) => {
  if (!error) return ErrorType.UNKNOWN;
  
  const code = error.code;
  const message = error.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK;
  }
  
  if (code?.startsWith('PGRST') || code?.includes('database')) {
    return ErrorType.DATABASE;
  }
  
  if (message.includes('auth') || message.includes('session') || code === '401') {
    return ErrorType.AUTH;
  }
  
  if (message.includes('valid') || code === '400') {
    return ErrorType.VALIDATION;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Send error to Sentry (if configured)
 */
const sendToSentry = async (errorInfo) => {
  try {
    // Implementasi Sentry bisa ditambahkan nanti
    // Untuk sekarang, kita log saja
    console.log('📤 Would send to Sentry:', errorInfo);
  } catch (e) {
    console.error('Failed to send to Sentry:', e);
  }
};

/**
 * Send error to backend for analytics
 */
const sendToBackend = async (errorInfo) => {
  try {
    // Bisa diimplementasikan untuk kirim ke endpoint khusus
    // await fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorInfo) });
    console.log('📤 Would send to backend:', errorInfo);
  } catch (e) {
    console.error('Failed to send to backend:', e);
  }
};

/**
 * Get stored errors (for admin/debug purposes)
 */
export const getStoredErrors = () => [...errorStore];

/**
 * Clear error store
 */
export const clearErrorStore = () => {
  errorStore.length = 0;
};

/**
 * Setup global error handlers
 */
export const setupGlobalErrorHandler = () => {
  // Tangkap unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    logError(event.reason, {
      type: ErrorType.UNKNOWN,
      source: 'unhandledrejection',
    });
  });

  // Tangkap global errors
  window.addEventListener('error', (event) => {
    event.preventDefault();
    logError(event.error || event.message, {
      type: ErrorType.UNKNOWN,
      source: 'global',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  console.log('✅ Global error handler initialized');
};

export default {
  logError,
  handleSupabaseError,
  getStoredErrors,
  clearErrorStore,
  setupGlobalErrorHandler,
  ErrorType,
};
