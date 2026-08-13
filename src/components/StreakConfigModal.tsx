import React, { useState, useEffect } from 'react';
import { 
  Flame, Trophy, ShieldAlert, RotateCcw, 
  Check, X, Plus, Minus, Sparkles, CheckCircle2, AlertCircle, Save, Settings
} from 'lucide-react';
import { StudyActivityData, updateStreakConfig, getTodayStr } from '../utils/analytics';

interface StreakConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakData: StudyActivityData;
}

export const StreakConfigModal: React.FC<StreakConfigModalProps> = ({
  isOpen,
  onClose,
  streakData
}) => {
  const [streakVal, setStreakVal] = useState<number>(streakData.currentStreak);
  const [freezeVal, setFreezeVal] = useState<number>(streakData.freezeCount || 0);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const todayStr = getTodayStr();
  const isStudiedToday = streakData.lastStudyDate === todayStr;

  useEffect(() => {
    if (isOpen) {
      setStreakVal(streakData.currentStreak);
      setFreezeVal(streakData.freezeCount || 0);
      setSavedSuccessMsg(null);
    }
  }, [isOpen, streakData]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateStreakConfig({
      currentStreak: streakVal,
      freezeCount: freezeVal
    });
    setSavedSuccessMsg('✨ Đã cập nhật thành công thông số Streak!');
    setTimeout(() => {
      setSavedSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleQuickAddStreak = (delta: number) => {
    setStreakVal(prev => Math.max(0, prev + delta));
  };

  const handleQuickAddFreeze = (delta: number) => {
    setFreezeVal(prev => Math.max(0, prev + delta));
  };

  const handleResetStreakToZero = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại Chuỗi ngày học (Streak) về 0?')) {
      updateStreakConfig({ resetStreak: true });
      setStreakVal(0);
      setSavedSuccessMsg('🔄 Đã đặt lại Chuỗi ngày học về 0!');
    }
  };

  const handleMarkStudiedToday = () => {
    updateStreakConfig({ markTodayStudied: true });
    setSavedSuccessMsg('🎉 Đã đánh dấu hoàn thành ngày học hôm nay!');
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up space-y-0 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-600 p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-2 bottom-2 opacity-10 pointer-events-none">
            <Flame size={100} />
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-yellow-300">
              <Settings size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>Cấu hình & Tùy chỉnh Streak</span>
                <span className="text-[10px] uppercase bg-black/20 px-2 py-0.5 rounded-full font-mono text-amber-200">Admin Mode</span>
              </h3>
              <p className="text-xs text-amber-100 font-medium">Quản lý chuỗi ngày học & vé băng bảo vệ</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white cursor-pointer relative z-10"
            title="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert Banner */}
        {savedSuccessMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-100 dark:border-emerald-800 p-3 px-5 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Live Overview Box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-100 dark:border-orange-900/50 p-3.5 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] uppercase tracking-wider mb-1">
                <Flame size={14} className="animate-pulse" />
                <span>Streak hiện tại</span>
              </div>
              <span className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono">{streakData.currentStreak}</span>
              <span className="text-[10px] text-orange-400 dark:text-orange-300/80 block font-bold">ngày</span>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50 p-3.5 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider mb-1">
                <Trophy size={14} />
                <span>Kỷ lục Streak</span>
              </div>
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">{streakData.longestStreak}</span>
              <span className="text-[10px] text-amber-500 dark:text-amber-300/80 block font-bold">ngày</span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/50 p-3.5 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-sky-700 dark:text-sky-300 font-extrabold text-[10px] uppercase tracking-wider mb-1">
                <ShieldAlert size={14} />
                <span>Băng bảo vệ</span>
              </div>
              <span className="text-2xl font-black text-sky-700 dark:text-sky-300 font-mono">{streakData.freezeCount || 0}</span>
              <span className="text-[10px] text-sky-500 dark:text-sky-300/80 block font-bold">vé có sẵn</span>
            </div>
          </div>

          {/* Today Status Indicator */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
            <div className="flex items-center gap-2.5">
              {isStudiedToday ? (
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-lg">
                  <CheckCircle2 size={18} />
                </div>
              ) : (
                <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-lg">
                  <AlertCircle size={18} />
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  Trạng thái học hôm nay ({todayStr}):
                </span>
                <span className={`text-[11px] font-extrabold ${isStudiedToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {isStudiedToday ? '🎉 Đã hoàn thành 1 bài học/ôn tập' : '⏳ Chưa ôn tập hôm nay'}
                </span>
              </div>
            </div>

            {!isStudiedToday && (
              <button
                type="button"
                onClick={handleMarkStudiedToday}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition shadow-2xs cursor-pointer shrink-0"
              >
                Đánh dấu đã học
              </button>
            )}
          </div>

          {/* Custom Edit Section 1: Edit Current Streak Count */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Flame size={15} className="text-orange-500" />
              <span>Sửa thủ công Chuỗi Streak (currentStreak):</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-orange-500/20">
                <button
                  type="button"
                  onClick={() => handleQuickAddStreak(-1)}
                  className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <Minus size={16} />
                </button>
                <input 
                  type="number"
                  min="0"
                  max="9999"
                  value={streakVal}
                  onChange={(e) => setStreakVal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 text-center font-mono font-black text-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAddStreak(1)}
                  className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAddStreak(5)}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  +5 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddStreak(10)}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  +10 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setStreakVal(30)}
                  className="px-2.5 py-1.5 bg-orange-100 dark:bg-orange-950/80 hover:bg-orange-200 dark:hover:bg-orange-900/80 text-orange-800 dark:text-orange-300 font-extrabold text-xs rounded-lg transition cursor-pointer"
                >
                  30 ngày 🔥
                </button>
              </div>
            </div>
          </div>

          {/* Custom Edit Section 2: Edit Streak Freeze Tickets */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-sky-600 dark:text-sky-400" />
              <span>Số lượng vé Băng Bảo Vệ Streak (Streak Freeze):</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-500/20">
                <button
                  type="button"
                  onClick={() => handleQuickAddFreeze(-1)}
                  className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <Minus size={16} />
                </button>
                <input 
                  type="number"
                  min="0"
                  max="99"
                  value={freezeVal}
                  onChange={(e) => setFreezeVal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 text-center font-mono font-black text-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAddFreeze(1)}
                  className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Quick freeze presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFreezeVal(2)}
                  className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold text-xs rounded-lg border border-sky-200 dark:border-sky-800 transition cursor-pointer"
                >
                  Mặc định (2 vé)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddFreeze(5)}
                  className="px-2.5 py-1.5 bg-sky-100 dark:bg-sky-950/80 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-sky-800 dark:text-sky-300 font-extrabold text-xs rounded-lg transition cursor-pointer"
                >
                  +5 vé 🧊
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Vé Băng bảo vệ sẽ tự động kích hoạt khi bạn lỡ 1 ngày không học để giữ nguyên chuỗi Streak.
            </p>
          </div>

          {/* Reset Action Area */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Khôi phục chuỗi về 0</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Xóa dữ liệu chuỗi Streak hiện tại nếu muốn học lại từ đầu</span>
            </div>
            <button
              type="button"
              onClick={handleResetStreakToZero}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-extrabold text-xs rounded-xl transition border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCcw size={14} />
              <span>Đặt lại về 0</span>
            </button>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition"
          >
            <Save size={14} />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
