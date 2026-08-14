export const GEMINI_KEY_STORAGE = 'gemini_api_key';

export function getStoredGeminiKey(): string {
  // 1. Check localStorage if in browser environment
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem(GEMINI_KEY_STORAGE)?.trim() || localStorage.getItem('GEMINI_API_KEY')?.trim();
    if (fromStorage) return fromStorage;
  }

  // 2. Check Vite environment variables (Vercel Vite build or local .env)
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      if (typeof metaEnv.VITE_GEMINI_API_KEY === 'string' && metaEnv.VITE_GEMINI_API_KEY.trim()) {
        return metaEnv.VITE_GEMINI_API_KEY.trim();
      }
      if (typeof metaEnv.GEMINI_API_KEY === 'string' && metaEnv.GEMINI_API_KEY.trim()) {
        return metaEnv.GEMINI_API_KEY.trim();
      }
    }
  } catch {
    // Ignore environment access errors in restricted contexts
  }

  // 3. Check process.env (Node runtime or bundler polyfills)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (typeof process.env.GEMINI_API_KEY === 'string' && process.env.GEMINI_API_KEY.trim()) {
        return process.env.GEMINI_API_KEY.trim();
      }
      if (typeof process.env.VITE_GEMINI_API_KEY === 'string' && process.env.VITE_GEMINI_API_KEY.trim()) {
        return process.env.VITE_GEMINI_API_KEY.trim();
      }
    }
  } catch {
    // Ignore process access errors
  }

  return '';
}

export function setStoredGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
    localStorage.setItem('GEMINI_API_KEY', trimmed);
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    localStorage.removeItem('GEMINI_API_KEY');
  }
  window.dispatchEvent(new CustomEvent('gemini-key-updated', { detail: trimmed }));
}

let isInterceptorSetup = false;
export function setupGeminiFetchInterceptor(): void {
  if (isInterceptorSetup || typeof window === 'undefined') return;
  isInterceptorSetup = true;

  try {
    const originalFetch = window.fetch.bind(window);
    const interceptedFetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const key = getStoredGeminiKey();
      if (key) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has('x-gemini-api-key')) {
          headers.set('x-gemini-api-key', key);
        }
        init.headers = headers;
      }
      return originalFetch(input, init);
    };

    try {
      Object.defineProperty(window, 'fetch', {
        value: interceptedFetch,
        writable: true,
        configurable: true,
      });
    } catch {
      try {
        (window as any).fetch = interceptedFetch;
      } catch (err) {
        console.warn('Could not override window.fetch:', err);
      }
    }
  } catch (err) {
    console.warn('Could not setup fetch interceptor:', err);
  }
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const key = getStoredGeminiKey();
  if (key) {
    init = init || {};
    const headers = new Headers(init.headers || {});
    if (!headers.has('x-gemini-api-key')) {
      headers.set('x-gemini-api-key', key);
    }
    init.headers = headers;
  }
  return fetch(input, init);
}
