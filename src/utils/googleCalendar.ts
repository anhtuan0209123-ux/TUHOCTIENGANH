import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Calendar events management permission
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');

// In-memory cache for the OAuth access token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initCalendarAuth = (
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

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không thể lấy mã Access Token từ Google Auth.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutCalendar = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCachedToken = () => cachedAccessToken;

// Helper to get local timezone offset in RFC3339 format (e.g. +07:00 or -05:00)
export function getTimezoneOffsetString() {
  const tzo = -new Date().getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number) => String(Math.floor(Math.abs(num))).padStart(2, '0');
  return dif + pad(tzo / 60) + ':' + pad(tzo % 60);
}

// Helper to parse "05:00 - 06:15" given a date string like "2026-06-28"
export function parseTimeRange(timeStr: string, dateStr: string) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  const offset = getTimezoneOffsetString();
  
  if (!match) {
    return {
      start: `${dateStr}T09:00:00${offset}`,
      end: `${dateStr}T10:00:00${offset}`
    };
  }
  
  const startHour = match[1].padStart(2, '0');
  const startMin = match[2];
  const endHour = match[3].padStart(2, '0');
  const endMin = match[4];
  
  return {
    start: `${dateStr}T${startHour}:${startMin}:00${offset}`,
    end: `${dateStr}T${endHour}:${endMin}:00${offset}`
  };
}

interface CalendarEventTask {
  time: string;
  task: string;
}

export const syncTasksToGoogleCalendar = async (
  accessToken: string,
  tasks: CalendarEventTask[],
  dateStr: string
): Promise<{ successCount: number; failedCount: number; errors: string[] }> => {
  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

  for (const t of tasks) {
    try {
      const { start, end } = parseTimeRange(t.time, dateStr);

      const eventBody = {
        summary: t.task,
        description: `Nhiệm vụ Chiến dịch 13 tuần bứt phá kỷ luật. Thời gian dự kiến: ${t.time}`,
        start: {
          dateTime: start,
          timeZone: timeZone,
        },
        end: {
          dateTime: end,
          timeZone: timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'email', minutes: 30 }
          ]
        }
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Lỗi từ Google Calendar API');
      }

      successCount++;
    } catch (err: any) {
      console.error(`Lỗi đồng bộ nhiệm vụ "${t.task}":`, err);
      failedCount++;
      errors.push(`${t.task}: ${err.message}`);
    }
  }

  return { successCount, failedCount, errors };
};
