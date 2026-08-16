import { StudySet, Folder, Card } from '../types';
import { presetStudySets } from '../presets';
import { sanitizeCardTerm, isValidCardTerm } from '../services/geminiClient';

export const normalizeUserEmail = (email?: string): string => {
  if (!email) return 'guest';
  const trimmed = email.trim().toLowerCase();
  return trimmed || 'guest';
};

export const getUserStorageKeys = (email: string) => {
  const norm = normalizeUserEmail(email);
  return {
    decks: `decks_${norm}`,
    folders: `folders_${norm}`,
    customCards: `custom_cards_${norm}`,
    streak: `streak_${norm}`,
  };
};

/**
 * Tải danh sách bộ bài học (Decks) theo Email
 * Nếu chưa từng có dữ liệu -> Khởi tạo bộ bài học mặc định (presetStudySets)
 */
export const loadUserDecks = (email: string): StudySet[] => {
  const norm = normalizeUserEmail(email);
  const keys = getUserStorageKeys(norm);

  try {
    const saved = localStorage.getItem(keys.decks);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed
          .map((set: any) => ({
            ...set,
            cards: (set.cards || [])
              .map((c: any) => ({
                ...c,
                term: sanitizeCardTerm(c.term || ''),
                definition: (c.definition || '').trim()
              }))
              .filter((c: any) => isValidCardTerm(c.term))
          }))
          .filter((set: any) => set.cards && set.cards.length > 0);

        if (sanitized.length > 0) {
          return sanitized;
        }
      }
    }
  } catch (err) {
    console.error(`Lỗi tải dữ liệu decks cho [${norm}]:`, err);
  }

  // Khởi tạo bài học mẫu mặc định cho người dùng mới
  const defaultSets = [...presetStudySets];
  try {
    localStorage.setItem(keys.decks, JSON.stringify(defaultSets));
  } catch (e) {
    console.error('Không thể lưu decks ban đầu:', e);
  }
  return defaultSets;
};

/**
 * Lưu danh sách bộ bài học (Decks) theo Email
 */
export const saveUserDecks = (email: string, sets: StudySet[]): void => {
  const keys = getUserStorageKeys(email);
  try {
    localStorage.setItem(keys.decks, JSON.stringify(sets));
  } catch (err) {
    console.error(`Lỗi lưu decks cho [${email}]:`, err);
  }
};

/**
 * Tải danh sách Thư mục (Folders) theo Email
 */
export const loadUserFolders = (email: string): Folder[] => {
  const keys = getUserStorageKeys(email);
  try {
    const saved = localStorage.getItem(keys.folders);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Lỗi tải folders cho [${email}]:`, err);
  }
  return [];
};

/**
 * Lưu danh sách Thư mục (Folders) theo Email
 */
export const saveUserFolders = (email: string, folders: Folder[]): void => {
  const keys = getUserStorageKeys(email);
  try {
    localStorage.setItem(keys.folders, JSON.stringify(folders));
  } catch (err) {
    console.error(`Lỗi lưu folders cho [${email}]:`, err);
  }
};

/**
 * Tải thẻ tùy chỉnh / Yêu thích (Custom Cards) theo Email
 */
export const loadUserCustomCards = (email: string): Card[] => {
  const keys = getUserStorageKeys(email);
  try {
    const saved = localStorage.getItem(keys.customCards);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Lỗi tải custom cards cho [${email}]:`, err);
  }
  return [];
};

/**
 * Lưu thẻ tùy chỉnh (Custom Cards) theo Email
 */
export const saveUserCustomCards = (email: string, cards: Card[]): void => {
  const keys = getUserStorageKeys(email);
  try {
    localStorage.setItem(keys.customCards, JSON.stringify(cards));
  } catch (err) {
    console.error(`Lỗi lưu custom cards cho [${email}]:`, err);
  }
};

/**
 * Lưu snapshot toàn bộ dữ liệu người dùng trước khi chuyển tài khoản
 */
export const saveUserSnapshot = (
  email: string,
  data: {
    studySets?: StudySet[];
    folders?: Folder[];
    customCards?: Card[];
  }
) => {
  if (data.studySets) saveUserDecks(email, data.studySets);
  if (data.folders) saveUserFolders(email, data.folders);
  if (data.customCards) saveUserCustomCards(email, data.customCards);
};

/**
 * Đồng bộ toàn bộ dữ liệu bài học cũ (các bộ thẻ, thư mục, thẻ tự tạo)
 * từ các key localStorage cũ sang tài khoản Gmail chỉ định (sherlockramosreal@gmail.com)
 */
export const migrateLegacyDataToUser = (targetEmail: string = 'sherlockramosreal@gmail.com'): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const norm = normalizeUserEmail(targetEmail);
  const targetKeys = getUserStorageKeys(norm);

  // 1. Quét & chuyển đổi Decks (Bộ thẻ bài học cũ)
  const legacyDeckKeys = [
    'quizlet_clone_sets',
    'decks',
    'app_decks',
    'study_sets',
    'decks_guest',
    'decks_anhtuan0209123@gmail.com'
  ];

  let collectedSets: StudySet[] = [];
  const existingTargetDecks = localStorage.getItem(targetKeys.decks);
  if (existingTargetDecks) {
    try {
      const parsed = JSON.parse(existingTargetDecks);
      if (Array.isArray(parsed) && parsed.length > 0) {
        collectedSets = parsed;
      }
    } catch {
      // ignore
    }
  }

  // Quét qua các key cũ để gom tất cả các bộ bài học
  for (const key of legacyDeckKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((candidateSet: StudySet) => {
            if (candidateSet && candidateSet.id) {
              const existingIdx = collectedSets.findIndex(s => s.id === candidateSet.id);
              if (existingIdx === -1) {
                collectedSets.push(candidateSet);
              } else if (
                candidateSet.cards &&
                candidateSet.cards.length > (collectedSets[existingIdx].cards?.length || 0)
              ) {
                // Ưu tiên bản có nhiều thẻ hơn nếu trùng id
                collectedSets[existingIdx] = candidateSet;
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn(`Lỗi khi đọc key [${key}] trong quá trình migrate:`, e);
    }
  }

  // Nếu không tìm thấy bộ nào từ các key cũ, lấy preset mặc định
  if (collectedSets.length === 0) {
    collectedSets = [...presetStudySets];
  }

  // Chuẩn hóa và làm sạch thẻ bài
  const sanitizedDecks = collectedSets
    .map(set => ({
      ...set,
      cards: (set.cards || [])
        .map(c => ({
          ...c,
          term: sanitizeCardTerm(c.term || ''),
          definition: (c.definition || '').trim()
        }))
        .filter(c => isValidCardTerm(c.term))
    }))
    .filter(set => set.cards && set.cards.length > 0);

  localStorage.setItem(targetKeys.decks, JSON.stringify(sanitizedDecks));

  // 2. Quét & chuyển đổi Folders (Thư mục cũ)
  const legacyFolderKeys = [
    'quizlet_clone_folders',
    'folders',
    'app_folders',
    'folders_guest',
    'folders_anhtuan0209123@gmail.com'
  ];

  let collectedFolders: Folder[] = [];
  const existingTargetFolders = localStorage.getItem(targetKeys.folders);
  if (existingTargetFolders) {
    try {
      const parsed = JSON.parse(existingTargetFolders);
      if (Array.isArray(parsed) && parsed.length > 0) {
        collectedFolders = parsed;
      }
    } catch {
      // ignore
    }
  }

  for (const key of legacyFolderKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((candFolder: Folder) => {
            if (candFolder && candFolder.id && !collectedFolders.some(f => f.id === candFolder.id)) {
              collectedFolders.push(candFolder);
            }
          });
        }
      }
    } catch (e) {
      console.warn(`Lỗi khi đọc folder [${key}]:`, e);
    }
  }

  localStorage.setItem(targetKeys.folders, JSON.stringify(collectedFolders));

  // 3. Quét & chuyển đổi Custom Cards (Thẻ tự tạo / chưa phân loại)
  const legacyCardKeys = [
    'custom_cards',
    'quizlet_custom_cards',
    'custom_cards_guest',
    'custom_cards_anhtuan0209123@gmail.com'
  ];

  let collectedCards: Card[] = [];
  const existingTargetCards = localStorage.getItem(targetKeys.customCards);
  if (existingTargetCards) {
    try {
      const parsed = JSON.parse(existingTargetCards);
      if (Array.isArray(parsed)) {
        collectedCards = parsed;
      }
    } catch {
      // ignore
    }
  }

  for (const key of legacyCardKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((candCard: Card) => {
            if (candCard && candCard.id && !collectedCards.some(c => c.id === candCard.id)) {
              collectedCards.push(candCard);
            }
          });
        }
      }
    } catch (e) {
      console.warn(`Lỗi khi đọc card [${key}]:`, e);
    }
  }

  localStorage.setItem(targetKeys.customCards, JSON.stringify(collectedCards));

  // 4. Quét & chuyển đổi Streak cũ nếu tài khoản đích chưa có Streak
  const legacyStreakKeys = [
    'streak_guest',
    'streak_data_guest',
    'streak_anhtuan0209123@gmail.com',
    'streak_data_anhtuan0209123@gmail.com',
    'quizlet_analytics_streak'
  ];

  const existingStreak = localStorage.getItem(targetKeys.streak);
  if (!existingStreak) {
    for (const key of legacyStreakKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          localStorage.setItem(targetKeys.streak, raw);
          break;
        }
      } catch {
        // ignore
      }
    }
  }
};

