export interface StudyActivityData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  activityLog: Record<string, number>; // YYYY-MM-DD -> activity event count
}

export function getStreakData(): StudyActivityData {
  try {
    const saved = localStorage.getItem('quizlet_analytics_streak');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
          longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
          lastStudyDate: typeof parsed.lastStudyDate === 'string' ? parsed.lastStudyDate : '',
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
    activityLog: {}
  };
}

export function checkAndUpdateStreakOnLoad(): StudyActivityData {
  const data = getStreakData();
  const todayStr = new Date().toLocaleDateString('sv-SE');
  
  if (data.lastStudyDate && data.lastStudyDate !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
    
    // If last study date is older than yesterday, and it's not today, streak is broken
    if (data.lastStudyDate !== yesterdayStr) {
      data.currentStreak = 0;
      localStorage.setItem('quizlet_analytics_streak', JSON.stringify(data));
    }
  }
  return data;
}

export function trackStudyActivity(count: number = 1): StudyActivityData {
  const data = getStreakData();
  const todayStr = new Date().toLocaleDateString('sv-SE');
  
  // 1. Update activity log
  data.activityLog[todayStr] = (data.activityLog[todayStr] || 0) + count;
  
  // 2. Check and advance streak
  if (data.lastStudyDate !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
    
    if (data.lastStudyDate === yesterdayStr) {
      // Studied yesterday, increment streak!
      data.currentStreak += 1;
    } else {
      // Broken streak or first study session, starts at 1
      data.currentStreak = 1;
    }
    
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
    data.lastStudyDate = todayStr;
  }
  
  localStorage.setItem('quizlet_analytics_streak', JSON.stringify(data));
  
  // Dispatch custom window event to notify components dynamically
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('study-activity-logged', { detail: data }));
  }
  return data;
}
