import React, { useEffect } from 'react';
import { Flame, X, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StreakCelebrationToast: React.FC = () => {
  const { showStreakToast, dismissToast, streak } = useAuth();

  useEffect(() => {
    if (showStreakToast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showStreakToast, dismissToast]);

  if (!showStreakToast || !streak) return null;

  return (
    <div 
      id="streak-celebration-toast"
      className="fixed top-5 right-5 sm:right-8 z-50 animate-bounce-in max-w-md w-[calc(100vw-2.5rem)] sm:w-auto shadow-2xl"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-0.5 shadow-xl">
        <div className="flex items-center gap-3.5 bg-slate-900/95 text-white px-4 py-3.5 rounded-[14px] backdrop-blur-md">
          {/* Flame Icon Container with Glowing Background */}
          <div className="relative shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md animate-pulse">
            <Flame size={24} fill="currentColor" className="text-white" />
            <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-200 animate-spin" />
          </div>

          {/* Toast Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Trophy size={13} />
              <span>Thành tích Chuỗi Ngày Học!</span>
            </div>
            <p className="text-sm font-extrabold text-white mt-0.5 leading-snug">
              🔥 Bạn đã duy trì chuỗi {streak.currentStreak} ngày học!
            </p>
            <p className="text-[11px] text-amber-200/80 mt-0.5">
              Kỷ lục cao nhất: <span className="font-bold text-white">{streak.longestStreak} ngày</span> liên tiếp
            </p>
          </div>

          {/* Close Button */}
          <button
            id="close-streak-toast-btn"
            onClick={dismissToast}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
