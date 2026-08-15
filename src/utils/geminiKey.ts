/**
 * Quản lý Gemini API Key tương thích Vercel và môi trường Local/Client
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
 * Kiểm tra chuỗi API Key có hợp lệ về mặt hình thức cơ bản hay không
 */
export function isValidGeminiKeyFormat(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  // Key Gemini thông thường bắt đầu bằng AIza và có độ dài trên 20 ký tự
  return trimmed.length >= 10 && !trimmed.includes(' ') && trimmed !== 'undefined' && trimmed !== 'null';
}

/**
 * Lấy Gemini API Key theo đúng thứ tự ưu tiên
 */
export function getStoredGeminiKey(): string {
  // 1. Kiểm tra localStorage (Key cá nhân do người dùng nhập trên UI)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const userKey = localStorage.getItem(PRIMARY_KEY_STORAGE)?.trim();
      if (userKey && isValidGeminiKeyFormat(userKey)) {
        return userKey;
      }
      
      // Fallback các khóa lưu trữ cũ để không làm mất Key của người dùng
      const legacyKey = localStorage.getItem(LEGACY_KEY_STORAGE)?.trim() || localStorage.getItem(ALT_KEY_STORAGE)?.trim();
      if (legacyKey && isValidGeminiKeyFormat(legacyKey)) {
        // Tự động di chuyển sang key chuẩn mới
        localStorage.setItem(PRIMARY_KEY_STORAGE, legacyKey);
        return legacyKey;
      }
    } catch {
      // Bỏ qua lỗi truy cập localStorage (chế độ ẩn danh nghiêm ngặt)
    }
  }

  // 2. Kiểm tra biến môi trường Vite Client (chuẩn cho Vercel deploy và local .env)
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      const viteKey = metaEnv.VITE_GEMINI_API_KEY;
      if (typeof viteKey === 'string' && isValidGeminiKeyFormat(viteKey)) {
        return viteKey.trim();
      }
    }
  } catch {
    // Bỏ qua lỗi truy cập metaEnv
  }

  // 3. Dự phòng cho các biến môi trường chuẩn khác (GEMINI_API_KEY trên Vite hoặc process.env)
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      const standardKey = metaEnv.GEMINI_API_KEY;
      if (typeof standardKey === 'string' && isValidGeminiKeyFormat(standardKey)) {
        return standardKey.trim();
      }
    }
  } catch {
    // Bỏ qua lỗi
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      const procKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (typeof procKey === 'string' && isValidGeminiKeyFormat(procKey)) {
        return procKey.trim();
      }
    }
  } catch {
    // Bỏ qua lỗi truy cập process
  }

  return '';
}

/**
 * Lưu hoặc xóa API Key người dùng nhập từ giao diện
 */
export function setStoredGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = (key || '').trim();
  
  try {
    if (trimmed) {
      localStorage.setItem(PRIMARY_KEY_STORAGE, trimmed);
      localStorage.setItem(LEGACY_KEY_STORAGE, trimmed);
      localStorage.setItem(ALT_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(PRIMARY_KEY_STORAGE);
      localStorage.removeItem(LEGACY_KEY_STORAGE);
      localStorage.removeItem(ALT_KEY_STORAGE);
    }
  } catch (err) {
    console.warn('Không thể lưu API Key vào localStorage:', err);
  }

  // Bắn event thông báo cập nhật toàn app
  window.dispatchEvent(new CustomEvent('gemini-key-updated', { detail: trimmed }));
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
    const userKey = localStorage.getItem(PRIMARY_KEY_STORAGE)?.trim() || 
                    localStorage.getItem(LEGACY_KEY_STORAGE)?.trim();
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

