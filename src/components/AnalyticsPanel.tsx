import React, { useState, useEffect } from 'react';
import { StudySet } from '../types';
import { 
  Flame, Trophy, Activity, Sparkles, BookOpen, 
  Award, CheckCircle2, Calendar, TrendingUp, RotateCcw, HelpCircle, GraduationCap,
  ShieldAlert, Settings, ChevronLeft, ChevronRight, BarChart3, Clock, Check
} from 'lucide-react';
import { getStreakData, trackStudyActivity, checkAndUpdateStreakOnLoad, StudyActivityData, getTodayDateString } from '../utils/analytics';
import { StreakConfigModal } from './StreakConfigModal';

interface AnalyticsPanelProps {
  studySets: StudySet[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ studySets }) => {
  const [streakData, setStreakData] = useState<StudyActivityData>({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: '',
    freezeCount: 2,
    activityLog: {}
  });

  const [spacedRepMap, setSpacedRepMap] = useState<Record<string, { status: 'again' | 'good' | 'easy'; nextReviewTime: number }>>({});
  const [activeHistoryTab, setActiveHistoryTab] = useState<'weekly' | 'monthly'>('weekly');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [isTooltipActive, setIsTooltipActive] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Sync and load data on mount & real-time updates
  useEffect(() => {
    // 1. Core streak verification
    const activeData = checkAndUpdateStreakOnLoad();
    setStreakData(activeData);

    // 2. Load Spaced repetition maps
    try {
      const savedSpaced = localStorage.getItem('quizlet_spaced_data');
      if (savedSpaced) {
        setSpacedRepMap(JSON.parse(savedSpaced));
      }
    } catch (e) {
      console.error("Error reading spaced repetition cache inside analytics:", e);
    }

    // 3. Dynamically listen to new activities to update indicators instantly
    const handleActivityLogged = () => {
      const freshData = getStreakData();
      setStreakData(freshData);
      
      try {
        const savedSpaced = localStorage.getItem('quizlet_spaced_data');
        if (savedSpaced) {
          setSpacedRepMap(JSON.parse(savedSpaced));
        }
      } catch (err) {}
    };

    window.addEventListener('study-activity-logged', handleActivityLogged);
    window.addEventListener('activity_log_updated', handleActivityLogged);
    return () => {
      window.removeEventListener('study-activity-logged', handleActivityLogged);
      window.removeEventListener('activity_log_updated', handleActivityLogged);
    };
  }, []);

  // Compute stats based on real data
  const totalCardsCount = studySets.reduce((sum, set) => sum + set.cards.length, 0);
  
  let masteredCount = 0;
  let intermediateCount = 0;
  let againCount = 0;

  studySets.forEach(set => {
    set.cards.forEach(card => {
      const record = spacedRepMap[`${set.id}_${card.id}`];
      if (record) {
        if (record.status === 'easy') masteredCount++;
        else if (record.status === 'good') intermediateCount++;
        else if (record.status === 'again') againCount++;
      }
    });
  });

  const activeStudiedCount = masteredCount + intermediateCount + againCount;
  const unstudiedCount = Math.max(0, totalCardsCount - activeStudiedCount);

  const retentionRate = totalCardsCount > 0 
    ? Math.round((masteredCount / totalCardsCount) * 100) 
    : 0;

  const coverageRate = totalCardsCount > 0
    ? Math.round((activeStudiedCount / totalCardsCount) * 100)
    : 0;

  // Helper function to calculate time string from minutes
  const formatStudyTime = (cardCount: number) => {
    if (cardCount <= 0) return '0 phút';
    const totalMins = Math.round(cardCount * 1.5);
    if (totalMins < 60) return `${totalMins} phút`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hrs} giờ ${mins} phút` : `${hrs} giờ`;
  };

  // ==========================================
  // WEEKLY DATA CALCULATION (Tab 1)
  // ==========================================
  const getWeeklyData = () => {
    const todayStr = getTodayDateString();
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const weekDays = [];
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);

      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const dateNum = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dateNum}`;

      const count = streakData.activityLog[dateStr] || 0;
      const isToday = (dateStr === todayStr);

      weekDays.push({
        dayName: dayNames[i],
        dateStr,
        dateFormatted: `${dateNum}/${m}`,
        count,
        isToday,
        dateObj: current
      });
    }

    const sunday = weekDays[6].dateObj;
    const formatShort = (date: Date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const weekTitle = `Tuần ${formatShort(monday)} - ${formatShort(sunday)}/${monday.getFullYear()}`;

    const totalStudiedThisWeek = weekDays.reduce((sum, item) => sum + item.count, 0);
    const activeDaysThisWeek = weekDays.filter(item => item.count > 0).length;

    return {
      weekDays,
      weekTitle,
      totalStudiedThisWeek,
      activeDaysThisWeek
    };
  };

  // ==========================================
  // MONTHLY DATA CALCULATION (Tab 2)
  // ==========================================
  const getMonthlyData = () => {
    const today = new Date();
    const todayStr = getTodayDateString();

    const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-indexed

    const monthTitle = `Tháng ${month + 1}, ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Mon
    let leadingEmptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const calendarCells = [];

    // Leading empty days (previous month)
    for (let i = leadingEmptyDays; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      const pY = prevDate.getFullYear();
      const pM = String(prevDate.getMonth() + 1).padStart(2, '0');
      const pD = String(prevDate.getDate()).padStart(2, '0');
      const dateStr = `${pY}-${pM}-${pD}`;

      calendarCells.push({
        dateStr,
        dayNumber: prevDate.getDate(),
        count: streakData.activityLog[dateStr] || 0,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dateObj: prevDate
      });
    }

    // Current month days
    const totalDaysInMonth = lastDay.getDate();
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      calendarCells.push({
        dateStr,
        dayNumber: d,
        count: streakData.activityLog[dateStr] || 0,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        dateObj: new Date(year, month, d)
      });
    }

    // Trailing empty days (next month) to keep 7 columns format
    const totalCells = calendarCells.length;
    const trailingEmptyDays = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= trailingEmptyDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      const nY = nextDate.getFullYear();
      const nM = String(nextDate.getMonth() + 1).padStart(2, '0');
      const nD = String(nextDate.getDate()).padStart(2, '0');
      const dateStr = `${nY}-${nM}-${nD}`;

      calendarCells.push({
        dateStr,
        dayNumber: nextDate.getDate(),
        count: streakData.activityLog[dateStr] || 0,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dateObj: nextDate
      });
    }

    return {
      monthTitle,
      calendarCells
    };
  };

  const handleTestStudyLog = () => {
    trackStudyActivity(1);
    alert('🎉 Đã ghi nhận 1 hoạt động ôn bài thử nghiệm! Biểu đồ và Chuỗi ngày (Streak) của bạn đã được cập nhật ngay lập tức.');
  };

  const handleResetStreak = () => {
    if (confirm('Bản có thực sự muốn xoá sạch lịch sử ôn tập và chuỗi streak học tập để bắt đầu lại từ đầu không?')) {
      localStorage.removeItem('quizlet_analytics_streak');
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
        activityLog: {}
      });
      window.dispatchEvent(new CustomEvent('study-activity-logged', {
        detail: {
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: '',
          activityLog: {}
        }
      }));
    }
  };

  const weeklyInfo = getWeeklyData();
  const monthlyInfo = getMonthlyData();

  // Find maximum count in weekly view to scale chart heights smoothly
  const maxWeeklyCount = Math.max(...weeklyInfo.weekDays.map(d => d.count), 10);

  return (
    <div id="analytics-statistics-dashboard" className="space-y-6">
      
      {/* Top Banner Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak 🔥 Widget */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 opacity-15 translate-x-4 translate-y-4 pointer-events-none">
            <Flame size={120} className="animate-pulse" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Flame size={20} className="text-yellow-350 animate-bounce" fill="#fcb103" />
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-100">Chuỗi liên tục (Streak)</span>
              </div>
              
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                title="Tùy chỉnh Streak (Admin)"
              >
                <Settings size={14} />
                <span className="hidden sm:inline">Cấu hình</span>
              </button>
            </div>
            
            <div className="mt-4 flex items-baseline gap-2">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight font-mono">
                {streakData.currentStreak}
              </h2>
              <span className="text-sm font-extrabold text-amber-200">ngày liên tiếp 🔥</span>
            </div>
            
            <p className="text-xs text-orange-50 mt-2 leading-relaxed">
              {streakData.currentStreak > 0 
                ? 'Đại tuyệt vời! Hãy duy trì ngọn lửa này hàng ngày, đừng để lỡ một ngày nhé!' 
                : 'Ngọn lửa học thuật đang tắt. Hãy mở bất kỳ chế độ học tập nào để thắp sáng streak!'}
            </p>

            {/* Freeze tickets status row */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-lg text-2xs font-extrabold text-amber-50 border border-white/10">
              <ShieldAlert size={12} className="text-sky-300 shrink-0" />
              <span>Vé Băng bảo vệ: <strong className="font-mono text-white text-xs">{streakData.freezeCount || 0}</strong> vé</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-center text-xs relative z-10">
            <div className="flex items-center gap-1">
              <Trophy size={14} className="text-yellow-350" />
              <span className="font-bold text-amber-100">Kỷ lục chuỗi:</span>
              <span className="font-black text-white font-mono">{streakData.longestStreak} ngày</span>
            </div>
            <span className="text-[10px] text-orange-200 bg-white/10 px-2 py-0.5 rounded-md font-medium">
              {streakData.lastStudyDate ? `Học gần nhất: ${streakData.lastStudyDate}` : 'Chưa học'}
            </span>
          </div>
        </div>

        {/* Retention rate & Memory gauge chart */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400">Chỉ số ghi nhớ (Retention)</span>
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/40">
                <TrendingUp size={11} />
                <span>Trực quan</span>
              </span>
            </div>

            <div className="flex items-center gap-5 mt-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-100 dark:stroke-slate-700 fill-none"
                    strokeWidth="6.5"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-emerald-500 fill-none transition-all duration-1000"
                    strokeWidth="7"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - retentionRate / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none">{retentionRate}%</span>
                  <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Thuộc</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg leading-tight">Mastered Ratio</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 leading-normal max-w-[160px]">
                  Bạn đã thuộc làu <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{masteredCount}</strong> trên tổng số <strong className="text-slate-700 dark:text-slate-300 font-extrabold">{totalCardsCount}</strong> từ vựng.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700/80 pt-4 mt-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>Độ phủ Spaced Rep:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{coverageRate}% ({activeStudiedCount} từ)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${coverageRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Global Vocabulary Spaced Rep Levels summary block */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400">Trạng thái ghi nhớ chi tiết</span>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Đã thuộc (Thuần thục ✨)</span>
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{masteredCount} từ</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Tạm nhớ (Cần ôn lại sau ⏳)</span>
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{intermediateCount} từ</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Chưa thuộc (Cần học kĩ 🚨)</span>
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{againCount} từ</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-350 dark:bg-slate-600" />
                  <span>Chưa đưa vào học tập</span>
                </span>
                <span className="font-mono font-bold text-slate-500 dark:text-slate-400">{unstudiedCount} từ</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700/80 pt-2.5 mt-2.5 text-[10px] text-slate-400 dark:text-slate-400 font-medium leading-normal flex items-start gap-1 justify-center shrink-0">
            <HelpCircle size={12} className="shrink-0 mt-0.5" />
            <span>Đánh giá từ trong chế độ Thẻ ghi nhớ Spaced Repetition để đưa từ vào biểu đồ!</span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* RESTRUCTURED COMPACT ACTIVITY HISTORY SECTION WITH 2 TABS */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors">
        
        {/* Section Header & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-700/80">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar size={18} className="text-brand dark:text-indigo-400" />
              <span>Bảng Lịch Sử Học Tập</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
              Theo dõi nhịp độ ôn luyện bài học theo phong cách tối giản và khoa học.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveHistoryTab('weekly')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeHistoryTab === 'weekly'
                  ? 'bg-white dark:bg-slate-800 text-brand dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 size={14} />
              <span>Theo Tuần (Weekly)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveHistoryTab('monthly')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeHistoryTab === 'monthly'
                  ? 'bg-white dark:bg-slate-800 text-brand dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar size={14} />
              <span>Theo Tháng (Monthly)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: WEEKLY BAR CHART VIEW */}
        {activeHistoryTab === 'weekly' && (
          <div className="mt-5 space-y-6 animate-fade-in">
            {/* Week Controller Bar */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Tuần trước</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                  {weeklyInfo.weekTitle}
                </span>
                {weekOffset === 0 ? (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-black rounded-full border border-amber-200 dark:border-amber-800">
                    ★ Tuần hiện tại
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="px-2 py-0.5 bg-brand/10 text-brand dark:text-indigo-400 hover:bg-brand/20 text-[10px] font-bold rounded-full transition cursor-pointer flex items-center gap-0.5"
                  >
                    <RotateCcw size={10} /> Về tuần này
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span className="hidden sm:inline">Tuần sau</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 7 Columns Weekly Bar Chart */}
            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-4 h-60 sm:h-64 items-end pt-6 pb-2">
                {weeklyInfo.weekDays.map((day, idx) => {
                  const heightPercent = day.count > 0 
                    ? Math.min(100, Math.max(14, (day.count / maxWeeklyCount) * 100))
                    : 6;

                  return (
                    <div 
                      key={idx} 
                      className="flex flex-col items-center h-full justify-end group relative"
                      onMouseEnter={() => setIsTooltipActive(day.dateStr)}
                      onMouseLeave={() => setIsTooltipActive(null)}
                    >
                      {/* Studied badge above bar */}
                      <div className="mb-2 flex flex-col items-center gap-0.5 h-7 justify-end">
                        {day.count > 0 ? (
                          <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 animate-fade-in">
                            <CheckCircle2 size={12} className="shrink-0" />
                            <span className="font-mono text-[11px] sm:text-xs font-black">{day.count}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">0</span>
                        )}
                      </div>

                      {/* Bar Pillar */}
                      <div className="w-full max-w-[42px] bg-slate-200/50 dark:bg-slate-800/80 rounded-t-xl h-full flex items-end overflow-hidden p-0.5">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 relative ${
                            day.isToday
                              ? 'bg-gradient-to-t from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-400 shadow-md ring-2 ring-amber-400/50'
                              : day.count > 0
                              ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-400'
                              : 'bg-slate-200 dark:bg-slate-700/60'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Day Name & Date Label */}
                      <div className="mt-3 text-center space-y-0.5">
                        <div className={`text-xs font-black ${
                          day.isToday 
                            ? 'text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5' 
                            : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {day.dayName}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono">
                          {day.dateFormatted}
                        </div>
                      </div>

                      {/* Today indicator flag */}
                      {day.isToday && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap z-10">
                          ★ Hôm nay
                        </div>
                      )}

                      {/* Hover Tooltip */}
                      {isTooltipActive === day.dateStr && (
                        <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-2xl z-50 whitespace-nowrap border border-slate-700/80 pointer-events-none animate-fade-in backdrop-blur-md">
                          <div className="font-extrabold text-amber-400 mb-1">
                            {day.isToday ? '★ Hôm nay' : ''} ({day.dateFormatted})
                          </div>
                          <div>Đã ôn: <strong className="text-emerald-400 font-bold">{day.count} từ</strong></div>
                          <div className="text-slate-300">Thời gian: {formatStudyTime(day.count)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Stat 1 */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                <div className="p-3 bg-brand/10 dark:bg-indigo-950/80 text-brand dark:text-indigo-400 rounded-xl border border-brand/20 dark:border-indigo-800/40">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">Tổng từ đã học tuần này</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {weeklyInfo.totalStudiedThisWeek} từ
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">Số ngày học tích cực</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {weeklyInfo.activeDaysThisWeek} / 7 ngày
                  </div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/80 text-amber-500 rounded-xl border border-amber-100 dark:border-amber-800/40">
                  <Flame size={20} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">Chuỗi Streak hiện tại</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {streakData.currentStreak} ngày 🔥
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPACT MONTHLY CALENDAR VIEW */}
        {activeHistoryTab === 'monthly' && (
          <div className="mt-5 space-y-5 animate-fade-in">
            {/* Month Controller Bar */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setMonthOffset(prev => prev - 1)}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Tháng trước</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                  {monthlyInfo.monthTitle}
                </span>
                {monthOffset === 0 ? (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-black rounded-full border border-amber-200 dark:border-amber-800">
                    ★ Tháng hiện tại
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMonthOffset(0)}
                    className="px-2 py-0.5 bg-brand/10 text-brand dark:text-indigo-400 hover:bg-brand/20 text-[10px] font-bold rounded-full transition cursor-pointer flex items-center gap-0.5"
                  >
                    <RotateCcw size={10} /> Về tháng này
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMonthOffset(prev => prev + 1)}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span className="hidden sm:inline">Tháng sau</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 100% Width Month Grid */}
            <div className="w-full bg-slate-50/50 dark:bg-slate-900/30 p-3 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
              {/* Day Name Headers */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <div>T2</div>
                <div>T3</div>
                <div>T4</div>
                <div>T5</div>
                <div>T6</div>
                <div>T7</div>
                <div>CN</div>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {monthlyInfo.calendarCells.map((cell, idx) => {
                  const dayVi = cell.dateObj.toLocaleDateString('vi-VN', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric'
                  });

                  // Color gradient logic
                  const getCellBg = () => {
                    if (!cell.isCurrentMonth) {
                      return 'opacity-30 bg-slate-100 dark:bg-slate-800/20 text-slate-400 border-transparent';
                    }
                    if (cell.count === 0) {
                      return 'bg-white dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60';
                    }
                    if (cell.count <= 2) {
                      return 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 font-bold';
                    }
                    if (cell.count <= 5) {
                      return 'bg-emerald-300 dark:bg-emerald-800 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 font-extrabold';
                    }
                    if (cell.count <= 10) {
                      return 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600 text-white font-black';
                    }
                    return 'bg-emerald-600 dark:bg-emerald-500 border-emerald-700 text-white font-black shadow-xs';
                  };

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setIsTooltipActive(cell.dateStr)}
                      onMouseLeave={() => setIsTooltipActive(null)}
                      className={`min-h-[52px] sm:min-h-[64px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all relative cursor-pointer ${getCellBg()} ${
                        cell.isToday
                          ? 'ring-2 ring-amber-400 dark:ring-amber-500 border-amber-400 dark:border-amber-500 shadow-xs z-10'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-extrabold font-mono ${cell.isToday ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                          {cell.dayNumber}
                        </span>
                        {cell.isToday && (
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Hôm nay" />
                        )}
                      </div>

                      {cell.count > 0 && cell.isCurrentMonth && (
                        <div className="text-[10px] sm:text-xs font-black font-mono mt-1 text-right">
                          {cell.count} từ
                        </div>
                      )}

                      {/* Tooltip Popup */}
                      {isTooltipActive === cell.dateStr && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-2xl z-50 whitespace-nowrap border border-slate-700/80 pointer-events-none animate-fade-in backdrop-blur-md">
                          <div className="font-extrabold text-amber-400 mb-1">
                            Ngày {dayVi} {cell.isToday ? '(★ Hôm nay)' : ''}
                          </div>
                          <div>Đã ôn: <strong className="text-emerald-400 font-bold">{cell.count} từ</strong></div>
                          <div className="text-slate-300">Thời gian: {formatStudyTime(cell.count)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Density Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-bold pt-2 border-t border-slate-100 dark:border-slate-700/80">
              <span className="text-[11px] font-medium text-slate-400">💡 Mẹo: Nhấp hoặc rề chuột vào ô ngày để xem số từ & thời gian ôn chi tiết.</span>

              <div className="flex items-center gap-1.5 text-[11px]">
                <span>Chưa ôn</span>
                <div className="h-3 w-3 bg-white dark:bg-slate-800 rounded-xs border border-slate-200 dark:border-slate-700" />
                <div className="h-3 w-3 bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="h-3 w-3 bg-emerald-300 dark:bg-emerald-800 rounded-xs" />
                <div className="h-3 w-3 bg-emerald-500 dark:bg-emerald-600 rounded-xs" />
                <span>Nhiều 🔥</span>
                <div className="ml-2 flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                  <div className="h-3 w-3 bg-amber-100 dark:bg-amber-950 rounded-xs ring-2 ring-amber-400" />
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold">Hôm nay</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Gamified self testing triggers and developer utility panel */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-brand text-white rounded-xl shadow-2xs">
            <GraduationCap size={18} />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Kiến tạo động lực tích cực</h5>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Chu kỳ streak của bạn được tăng lên khi hoàn thành học bài tập hoặc xếp thẻ màu trong Spaced Rep.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="test-log-study-btn"
            onClick={handleTestStudyLog}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
            title="Thử nghiệm điểm danh cộng số lượt học"
          >
            🔥 Điểm danh học tập thử nghiệm (+1)
          </button>
          <button
            id="test-reset-streak-btn"
            onClick={handleResetStreak}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800/60 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-[11px] rounded-xl transition cursor-pointer"
          >
            Khôi phục mặc định 🔄
          </button>
        </div>
      </div>

      {/* Streak Config Modal inside Analytics tab */}
      <StreakConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        streakData={streakData}
      />
    </div>
  );
};
