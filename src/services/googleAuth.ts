import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Setup Google Auth Provider with Google Slides and Drive scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/presentations');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Listen to auth state and maintain access token in memory
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const setManualAccessToken = (token: string) => {
  cachedAccessToken = token.trim();
};

// Sign in with Google (Firebase Popup with fallback to Direct Google OAuth Implicit Popup)
export const googleSignIn = async (): Promise<{ user?: User; accessToken: string }> => {
  isSigningIn = true;
  try {
    // Try Firebase Auth signInWithPopup first
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: cachedAccessToken };
    }
  } catch (error: any) {
    console.warn('Firebase Auth signInWithPopup failed or blocked by iframe:', error?.code || error?.message);
    
    // Check if error is network/iframe related or popup blocked
    if (error?.code === 'auth/network-request-failed' || error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      // Try Direct Google OAuth Implicit Popup Flow using Client ID
      try {
        const directToken = await directGoogleOAuthPopup();
        cachedAccessToken = directToken;
        return { accessToken: directToken };
      } catch (directErr: any) {
        throw new Error(
          'Không thể kết nối tự động do trình duyệt/iframe chặn Popup. Bạn có thể sử dụng tính năng "Nhập Access Token" để xuất Slide.'
        );
      }
    }
    throw error;
  } finally {
    isSigningIn = false;
  }

  throw new Error('Không lấy được Google Access Token.');
};

// Direct Google OAuth 2.0 Popup Flow (Implicit Grant)
export const directGoogleOAuthPopup = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const clientId = firebaseConfig.oAuthClientId || '479757758743-laqanv0e23qricfdbghbs2kocs2oqhl3.apps.googleusercontent.com';
    const redirectUri = window.location.origin;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive.file email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=consent`;

    const popup = window.open(authUrl, 'google_oauth_popup', 'width=550,height=650');
    if (!popup) {
      reject(new Error('Trình duyệt đã chặn cửa sổ Popup. Vui lòng cho phép popup để đăng nhập Google.'));
      return;
    }

    let intervalId: any = null;
    const checkHash = () => {
      try {
        if (popup.closed) {
          clearInterval(intervalId);
          reject(new Error('Cửa sổ đăng nhập đã bị đóng.'));
          return;
        }

        const href = popup.location.href;
        if (href && href.includes('access_token=')) {
          const params = new URLSearchParams(href.split('#')[1]);
          const token = params.get('access_token');
          popup.close();
          clearInterval(intervalId);
          if (token) {
            resolve(token);
          } else {
            reject(new Error('Không tìm thấy Access Token trong phản hồi từ Google.'));
          }
        }
      } catch (e) {
        // Cross-origin restriction before redirect to origin is expected
      }
    };

    intervalId = setInterval(checkHash, 500);
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (e) {}
  cachedAccessToken = null;
};

