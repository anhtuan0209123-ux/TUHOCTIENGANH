export interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  longestStreak: number;
}

export const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateStreak = (email: string): { data: StreakData; isNewStreak: boolean } => {
  const normalizedEmail = (email || 'guest').trim().toLowerCase();
  const storageKey = `streak_${normalizedEmail}`;
  const legacyKey = `streak_data_${normalizedEmail}`;
  const today = getTodayString();
  
  const savedData = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey);

  let data: StreakData = savedData
    ? JSON.parse(savedData)
    : { currentStreak: 0, lastActiveDate: '', longestStreak: 0 };

  let isNewStreak = false;

  if (!data.lastActiveDate) {
    // Lần đầu đăng nhập
    data = { currentStreak: 1, lastActiveDate: today, longestStreak: 1 };
    isNewStreak = true;
  } else if (data.lastActiveDate !== today) {
    const lastDate = new Date(data.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Đăng nhập ngày kế tiếp
      data.currentStreak += 1;
      data.longestStreak = Math.max(data.currentStreak, data.longestStreak);
      data.lastActiveDate = today;
      isNewStreak = true;
    } else if (diffDays > 1) {
      // Bị đứt chuỗi
      data.currentStreak = 1;
      data.lastActiveDate = today;
      isNewStreak = true;
    }
  }

  localStorage.setItem(storageKey, JSON.stringify(data));
  localStorage.setItem(legacyKey, JSON.stringify(data));
  return { data, isNewStreak };
};
