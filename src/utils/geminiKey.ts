export const GEMINI_KEY_STORAGE = 'gemini_api_key';

export function getStoredGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GEMINI_KEY_STORAGE)?.trim() || localStorage.getItem('GEMINI_API_KEY')?.trim() || '';
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
