import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';
import { ChevronDown, RefreshCw, LogOut, Flame } from 'lucide-react';

export interface UserAuthHeaderProps {
  onOpenStreakModal?: () => void;
}

export const UserAuthHeader: React.FC<UserAuthHeaderProps> = ({ onOpenStreakModal }) => {
  const { user, streak, logout, currentEmail } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hiển thị Huy hiệu Streak 🔥 riêng cho từng Gmail */}
        {streak && (
          <div
            id="header-daily-streak-badge"
            onClick={onOpenStreakModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-full font-bold text-orange-600 dark:text-orange-400 cursor-pointer transition shadow-3xs"
            title={`Chuỗi Streak của [${currentEmail}]: ${streak.currentStreak} ngày. Kỷ lục cao nhất: ${streak.longestStreak} ngày.`}
          >
            <Flame size={16} fill="currentColor" className="text-orange-500 animate-pulse" />
            <span className="text-xs sm:text-sm">{streak.currentStreak} ngày</span>
          </div>
        )}

        {/* Thông tin Tài khoản Gmail / Nút Đăng nhập */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              id="header-user-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 py-1 px-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200/60 dark:border-slate-700"
              title={`Đang đăng nhập: ${user.email}`}
            >
              <img 
                src={user.picture} 
                alt={user.name} 
                referrerPolicy="no-referrer" 
                className="w-7 h-7 rounded-full border border-slate-300 dark:border-gray-600 object-cover bg-white shrink-0" 
              />
              <div className="flex flex-col text-left max-w-[130px] sm:max-w-[180px] hidden xs:block">
                <span className="text-xs font-bold text-slate-800 dark:text-gray-100 truncate block">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 truncate block font-mono">
                  {user.email}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </button>

            {/* Menu thả xuống (Dropdown) */}
            {showMenu && (
              <div 
                id="header-user-dropdown"
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-left animate-scale-up"
              >
                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-1.5 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Đang học với tài khoản
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-2xs text-blue-600 dark:text-blue-400 truncate font-mono mt-0.5">
                    {user.email}
                  </div>
                </div>

                <button
                  id="header-switch-account-btn"
                  onClick={() => {
                    setShowMenu(false);
                    setShowLoginModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition cursor-pointer"
                >
                  <RefreshCw size={14} className="text-blue-500 shrink-0" />
                  <span>🔄 Đổi sang Gmail khác</span>
                </button>

                <button
                  id="header-logout-btn"
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer mt-0.5"
                >
                  <LogOut size={14} className="text-red-500 shrink-0" />
                  <span>🚪 Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            id="header-login-btn"
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-xl transition cursor-pointer active:scale-95 shadow-3xs"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887C18.2 15.685 15.75 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.47 0 2.805.54 3.84 1.425l2.55-2.55C17.085 3.33 14.805 2.4 12.24 2.4 6.96 2.4 2.7 6.66 2.7 11.94s4.26 9.54 9.54 9.54c5.52 0 9.18-3.885 9.18-9.36 0-.63-.06-1.245-.18-1.835H12.24z" />
            </svg>
            <span>Đăng nhập</span>
          </button>
        )}
      </div>

      {/* Modal Đăng nhập / Đổi Gmail */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
};
