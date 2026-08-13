export interface StudyActivityData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  freezeCount: number; // Vé Đóng băng Streak (Streak Freeze)
  lastFreezeUsedDate?: string; // Ngày sử dụng vé freeze gần nhất
  activityLog: Record<string, number>; // YYYY-MM-DD -> activity event count
}

const STORAGE_KEY = 'quizlet_analytics_streak';

export function getTodayStr(): string {
  return new Date().toLocaleDateString('sv-SE');
}

export function getDaysDiff(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 0;
  try {
    const d1 = new Date(dateStr1 + 'T00:00:00');
    const d2 = new Date(dateStr2 + 'T00:00:00');
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 3600 * 24));
  } catch (e) {
    return 0;
  }
}

export function getStreakData(): StudyActivityData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          currentStreak: typeof parsed.currentStreak === 'number' ? Math.max(0, parsed.currentStreak) : 0,
          longestStreak: typeof parsed.longestStreak === 'number' ? Math.max(0, parsed.longestStreak) : 0,
          lastStudyDate: typeof parsed.lastStudyDate === 'string' ? parsed.lastStudyDate : '',
          freezeCount: typeof parsed.freezeCount === 'number' ? Math.max(0, parsed.freezeCount) : 2,
          lastFreezeUsedDate: typeof parsed.lastFreezeUsedDate === 'string' ? parsed.lastFreezeUsedDate : '',
          activityLog: parsed.activityLog && typeof parsed.activityLog === 'object' ? parsed.activityLog : {}
        };
      }
    }
  } catch (e) {
    console.error("Error reading streak data:", e);
  }
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: '',
    freezeCount: 2, // Mặc định tặng 2 vé freeze bảo vệ khi khởi tạo
    lastFreezeUsedDate: '',
    activityLog: {}
  };
}

export function saveStreakData(data: StudyActivityData): StudyActivityData {
  // Always maintain longest streak
  data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('study-activity-logged', { detail: data }));
  }
  return data;
}

export function checkAndUpdateStreakOnLoad(): StudyActivityData {
  const data = getStreakData();
  const todayStr = getTodayStr();

  if (data.lastStudyDate && data.lastStudyDate !== todayStr) {
    const daysDiff = getDaysDiff(data.lastStudyDate, todayStr);
    
    // If daysDiff > 1, missed 1 or more days
    if (daysDiff > 1) {
      const missedDays = daysDiff - 1;
      
      // Attempt to use Streak Freeze tickets if available
      if (data.freezeCount > 0) {
        const usedFreezes = Math.min(data.freezeCount, missedDays);
        data.freezeCount -= usedFreezes;
        
        // Calculate the date that is yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
        
        data.lastFreezeUsedDate = yesterdayStr;

        if (usedFreezes === missedDays) {
          // Streak fully protected by freeze tickets!
          // Treat yesterday as covered so today's study will increment streak smoothly
          data.lastStudyDate = yesterdayStr;
        } else {
          // Freeze tickets were not enough to cover all missed days
          data.currentStreak = 0;
        }
      } else {
        // Missed days with no freeze tickets available
        data.currentStreak = 0;
      }
      
      saveStreakData(data);
    }
  }

  return data;
}

export function trackStudyActivity(count: number = 1): StudyActivityData {
  const data = getStreakData();
  const todayStr = getTodayStr();
  
  // 1. Update activity log
  data.activityLog[todayStr] = (data.activityLog[todayStr] || 0) + count;
  
  // 2. Calculate streak updates
  if (data.lastStudyDate !== todayStr) {
    if (!data.lastStudyDate) {
      // First time completing a study session
      data.currentStreak = 1;
    } else {
      const daysDiff = getDaysDiff(data.lastStudyDate, todayStr);
      
      if (daysDiff === 1) {
        // Studied yesterday! Streak + 1
        data.currentStreak += 1;
      } else if (daysDiff > 1) {
        // Missed days
        const missedDays = daysDiff - 1;
        if (data.freezeCount > 0) {
          const usedFreezes = Math.min(data.freezeCount, missedDays);
          data.freezeCount -= usedFreezes;
          
          if (usedFreezes === missedDays) {
            // Missed days fully protected by Streak Freeze
            data.currentStreak += 1;
            data.lastFreezeUsedDate = todayStr;
          } else {
            // Freeze not enough, reset to 1 today
            data.currentStreak = 1;
          }
        } else {
          // No freeze tickets, reset to 1 today
          data.currentStreak = 1;
        }
      } else {
        // Fallback
        data.currentStreak = 1;
      }
    }
    
    data.lastStudyDate = todayStr;
  }
  
  return saveStreakData(data);
}

// Custom manual streak update helper (Admin / Customization Modal)
export function updateStreakConfig(updates: {
  currentStreak?: number;
  longestStreak?: number;
  freezeCount?: number;
  resetStreak?: boolean;
  markTodayStudied?: boolean;
}): StudyActivityData {
  const data = getStreakData();
  const todayStr = getTodayStr();

  if (updates.resetStreak) {
    data.currentStreak = 0;
    data.lastStudyDate = '';
  }

  if (typeof updates.currentStreak === 'number') {
    data.currentStreak = Math.max(0, updates.currentStreak);
    if (data.currentStreak > data.longestStreak) {
      data.longestStreak = data.currentStreak;
    }
  }

  if (typeof updates.longestStreak === 'number') {
    data.longestStreak = Math.max(data.currentStreak, updates.longestStreak);
  }

  if (typeof updates.freezeCount === 'number') {
    data.freezeCount = Math.max(0, updates.freezeCount);
  }

  if (updates.markTodayStudied) {
    data.activityLog[todayStr] = (data.activityLog[todayStr] || 0) + 1;
    if (data.lastStudyDate !== todayStr) {
      if (data.currentStreak === 0) {
        data.currentStreak = 1;
      }
      data.lastStudyDate = todayStr;
    }
  }

  return saveStreakData(data);
}

