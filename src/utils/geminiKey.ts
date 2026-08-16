/**
 * Quản lý Gemini API Key tương thích Vercel, Netlify và môi trường Local/Client
 * 
 * Thứ tự ưu tiên lấy API Key:
 * 1. Key do người dùng tự cài đặt trên giao diện (lưu trong localStorage với key 'user_gemini_api_key' hoặc 'gemini_api_key')
 * 2. Key từ biến môi trường Vite Client (import.meta.env.VITE_GEMINI_API_KEY)
 * 3. Dự phòng các biến môi trường chuẩn khác (import.meta.env.GEMINI_API_KEY hoặc process.env.GEMINI_API_KEY)
 */

export const PRIMARY_KEY_STORAGE = 'user_gemini_api_key';
export const LEGACY_KEY_STORAGE = 'gemini_api_key';
export const ALT_KEY_STORAGE = 'GEMINI_API_KEY';

/**
 * Làm sạch chuỗi API Key (cắt khoảng trắng, bỏ dấu ngoặc kép thừa nếu dán từ .env)
 */
export function cleanApiKeyString(rawKey: unknown): string {
  if (typeof rawKey !== 'string') return '';
  let cleaned = rawKey.trim();
  // Xóa dấu nháy đơn hoặc nháy kép bao bọc nếu có
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim();
  return cleaned;
}

/**
 * Kiểm tra chuỗi API Key có hợp lệ về mặt hình thức cơ bản hay không
 */
export function isValidGeminiKeyFormat(key: unknown): boolean {
  const cleaned = cleanApiKeyString(key);
  return (
    cleaned.length >= 10 &&
    !cleaned.includes(' ') &&
    cleaned !== 'undefined' &&
    cleaned !== 'null' &&
    cleaned !== 'MY_GEMINI_API_KEY'
  );
}

/**
 * Lấy Gemini API Key theo đúng thứ tự ưu tiên
 */
export function getStoredGeminiKey(): string {
  // 1. Kiểm tra localStorage (Key cá nhân do người dùng nhập trên UI)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const userKey = cleanApiKeyString(localStorage.getItem(PRIMARY_KEY_STORAGE));
      if (userKey && isValidGeminiKeyFormat(userKey)) {
        return userKey;
      }
      
      // Fallback các khóa lưu trữ cũ
      const legacyKey = cleanApiKeyString(localStorage.getItem(LEGACY_KEY_STORAGE)) || 
                        cleanApiKeyString(localStorage.getItem(ALT_KEY_STORAGE));
      if (legacyKey && isValidGeminiKeyFormat(legacyKey)) {
        localStorage.setItem(PRIMARY_KEY_STORAGE, legacyKey);
        return legacyKey;
      }
    } catch {
      // Bỏ qua lỗi truy cập localStorage
    }
  }

  // 2. Kiểm tra biến môi trường Vite Client (chuẩn cho Vercel deploy và local .env)
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      const viteKey = cleanApiKeyString(metaEnv.VITE_GEMINI_API_KEY);
      if (viteKey && isValidGeminiKeyFormat(viteKey)) {
        return viteKey;
      }
      const standardKey = cleanApiKeyString(metaEnv.GEMINI_API_KEY);
      if (standardKey && isValidGeminiKeyFormat(standardKey)) {
        return standardKey;
      }
    }
  } catch {
    // Bỏ qua lỗi truy cập metaEnv
  }

  // 3. Dự phòng cho process.env (Node runtime hoặc bundler polyfills)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const procVite = cleanApiKeyString(process.env.VITE_GEMINI_API_KEY);
      if (procVite && isValidGeminiKeyFormat(procVite)) {
        return procVite;
      }
      const procKey = cleanApiKeyString(process.env.GEMINI_API_KEY);
      if (procKey && isValidGeminiKeyFormat(procKey)) {
        return procKey;
      }
    }
  } catch {
    // Bỏ qua lỗi truy cập process
  }

  // 4. Kiểm tra biến toàn cục window nếu được inject
  if (typeof window !== 'undefined') {
    const winKey = cleanApiKeyString((window as any).__GEMINI_API_KEY__);
    if (winKey && isValidGeminiKeyFormat(winKey)) {
      return winKey;
    }
  }

  return '';
}

/**
 * Lưu hoặc xóa API Key người dùng nhập từ giao diện
 */
export function setStoredGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const cleaned = cleanApiKeyString(key);
  
  try {
    if (cleaned) {
      localStorage.setItem(PRIMARY_KEY_STORAGE, cleaned);
      localStorage.setItem(LEGACY_KEY_STORAGE, cleaned);
      localStorage.setItem(ALT_KEY_STORAGE, cleaned);
    } else {
      localStorage.removeItem(PRIMARY_KEY_STORAGE);
      localStorage.removeItem(LEGACY_KEY_STORAGE);
      localStorage.removeItem(ALT_KEY_STORAGE);
    }
  } catch (err) {
    console.warn('Không thể lưu API Key vào localStorage:', err);
  }

  // Bắn event thông báo cập nhật toàn app
  window.dispatchEvent(new CustomEvent('gemini-key-updated', { detail: cleaned }));
}

/**
 * Xóa Key cá nhân đã lưu
 */
export function clearStoredGeminiKey(): void {
  setStoredGeminiKey('');
}

/**
 * Kiểm tra xem hiện tại đã có API Key hợp lệ hay chưa
 */
export function hasStoredGeminiKey(): boolean {
  return Boolean(getStoredGeminiKey());
}

/**
 * Nhận diện nguồn gốc của Key đang dùng để hiển thị trên UI
 */
export function getGeminiKeySource(): 'user' | 'env' | 'none' {
  if (typeof window !== 'undefined' && window.localStorage) {
    const userKey = cleanApiKeyString(localStorage.getItem(PRIMARY_KEY_STORAGE)) || 
                    cleanApiKeyString(localStorage.getItem(LEGACY_KEY_STORAGE));
    if (userKey && isValidGeminiKeyFormat(userKey)) {
      return 'user';
    }
  }
  
  if (getStoredGeminiKey()) {
    return 'env';
  }
  
  return 'none';
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


