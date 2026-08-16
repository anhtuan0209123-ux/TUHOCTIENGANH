import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculateStreak, StreakData } from '../utils/streakUtils';
import { normalizeUserEmail, migrateLegacyDataToUser } from '../utils/userDataStorage';

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export const DEFAULT_USER: User = {
  id: 'user_sherlockramosreal@gmail.com',
  name: 'Sherlock Ramos',
  email: 'sherlockramosreal@gmail.com',
  picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sherlockramosreal%40gmail.com'
};

export interface AuthContextType {
  user: User | null;
  currentEmail: string;
  streak: StreakData | null;
  showStreakToast: boolean;
  login: (userData: User) => void;
  logout: () => void;
  switchAccount: (email: string, name?: string) => void;
  dismissToast: () => void;
  refreshStreak: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Luôn migrate dữ liệu cũ vào tài khoản sherlockramosreal@gmail.com
    migrateLegacyDataToUser('sherlockramosreal@gmail.com');

    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('app_user') : null;
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          return parsed;
        }
      } catch (e) {
        console.error('Lỗi khi đọc app_user ban đầu:', e);
      }
    }
    // Mặc định tài khoản hiện tại là sherlockramosreal@gmail.com
    try {
      localStorage.setItem('app_user', JSON.stringify(DEFAULT_USER));
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  const [streak, setStreak] = useState<StreakData | null>(null);
  const [showStreakToast, setShowStreakToast] = useState(false);

  const currentEmail = user ? normalizeUserEmail(user.email) : 'sherlockramosreal@gmail.com';

  // Khởi tạo phiên đăng nhập & Streak khi load trang
  useEffect(() => {
    // Đảm bảo dữ liệu cũ đã được chuyển đầy đủ vào sherlockramosreal@gmail.com
    migrateLegacyDataToUser('sherlockramosreal@gmail.com');

    const savedUser = localStorage.getItem('app_user');
    let activeUser = DEFAULT_USER;
    if (savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        if (parsedUser && parsedUser.email) {
          activeUser = parsedUser;
        }
      } catch (e) {
        console.error('Lỗi khi đọc app_user từ localStorage:', e);
      }
    } else {
      localStorage.setItem('app_user', JSON.stringify(DEFAULT_USER));
    }

    setUser(activeUser);
    const normEmail = normalizeUserEmail(activeUser.email);
    const { data, isNewStreak } = calculateStreak(normEmail);
    setStreak(data);
    if (isNewStreak) {
      setShowStreakToast(true);
    }
  }, []);

  const refreshStreak = useCallback(() => {
    const targetEmail = user ? normalizeUserEmail(user.email) : 'sherlockramosreal@gmail.com';
    const { data } = calculateStreak(targetEmail);
    setStreak(data);
  }, [user]);

  const login = (userData: User) => {
    const cleanEmail = normalizeUserEmail(userData.email);
    const sanitizedUser: User = {
      ...userData,
      email: cleanEmail,
      name: userData.name || cleanEmail.split('@')[0],
      picture: userData.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`
    };

    setUser(sanitizedUser);
    try {
      localStorage.setItem('app_user', JSON.stringify(sanitizedUser));
    } catch (e) {
      console.error('Lỗi khi lưu app_user vào localStorage:', e);
    }

    // Tính Streak riêng biệt cho tài khoản vừa đăng nhập
    const { data, isNewStreak } = calculateStreak(cleanEmail);
    setStreak(data);
    if (isNewStreak) {
      setShowStreakToast(true);
    }

    // Bắn event thông báo chuyển tài khoản để các module tự đồng bộ dữ liệu
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-account-switched', { detail: { email: cleanEmail } }));
    }
  };

  const switchAccount = (newEmail: string, newName?: string) => {
    const cleanEmail = normalizeUserEmail(newEmail);
    const displayName = newName || cleanEmail.split('@')[0];
    login({
      id: `user_${cleanEmail}`,
      name: displayName,
      email: cleanEmail,
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`
    });
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('app_user');
    } catch (e) {
      console.error('Lỗi khi xóa app_user:', e);
    }

    // Chuyển về dữ liệu tài khoản khách (guest)
    const { data } = calculateStreak('guest');
    setStreak(data);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-account-switched', { detail: { email: 'guest' } }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentEmail,
        streak,
        showStreakToast,
        login,
        logout,
        switchAccount,
        dismissToast: () => setShowStreakToast(false),
        refreshStreak,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
