import React, { useState, useEffect } from 'react';
import { StudySet } from '../types';
import { 
  Flame, Trophy, Activity, Sparkles, BookOpen, 
  Award, CheckCircle2, Calendar, TrendingUp, RotateCcw, HelpCircle, GraduationCap
} from 'lucide-react';
import { getStreakData, trackStudyActivity, checkAndUpdateStreakOnLoad, StudyActivityData } from '../utils/analytics';

interface AnalyticsPanelProps {
  studySets: StudySet[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ studySets }) => {
  const [streakData, setStreakData] = useState<StudyActivityData>({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: '',
    activityLog: {}
  });

  const [spacedRepMap, setSpacedRepMap] = useState<Record<string, { status: 'again' | 'good' | 'easy'; nextReviewTime: number }>>({});
  const [isTooltipActive, setIsTooltipActive] = useState<string | null>(null);

  // Sync and load data on mount
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
    const handleActivityLogged = (e: Event) => {
      const customEvent = e as CustomEvent<StudyActivityData>;
      if (customEvent.detail) {
        setStreakData(customEvent.detail);
      }
      
      // refresh spaced rep status too
      try {
        const savedSpaced = localStorage.getItem('quizlet_spaced_data');
        if (savedSpaced) {
          setSpacedRepMap(JSON.parse(savedSpaced));
        }
      } catch (err) {}
    };

    window.addEventListener('study-activity-logged', handleActivityLogged);
    return () => {
      window.removeEventListener('study-activity-logged', handleActivityLogged);
    };
  }, []);

  // Compute stats based on real data
  const totalCardsCount = studySets.reduce((sum, set) => sum + set.cards.length, 0);
  
  // Filter only those keys that belong to existing cards and sets to prevent ghost counts
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

  // Retention rate calculation (Mastered cards / Total active cards)
  const retentionRate = totalCardsCount > 0 
    ? Math.round((masteredCount / totalCardsCount) * 100) 
    : 0;

  // Spaced rep coverage
  const coverageRate = totalCardsCount > 0
    ? Math.round((activeStudiedCount / totalCardsCount) * 100)
    : 0;

  // Generate GitHub contributions grid
  const renderHeatmap = () => {
    const today = new Date();
    const tempDate = new Date(today);
    
    // We want 16 weeks of contribution squares (16 weeks * 7 days = 112 squares)
    // Align starting date to 111 days ago first, then pull back to previous Sunday to sync calendar rows
    tempDate.setDate(today.getDate() - 111);
    const dayOfWeek = tempDate.getDay(); // 0 is Sunday
    tempDate.setDate(tempDate.getDate() - dayOfWeek);

    const weeksGrid: Array<{ dateStr: string; count: number; dateObj: Date }> = [];
    
    // Populate exactly 16 columns * 7 days = 112 elements
    for (let i = 0; i < 112; i++) {
      const dateStr = tempDate.toLocaleDateString('sv-SE');
      const count = streakData.activityLog[dateStr] || 0;
      weeksGrid.push({
        dateStr,
        count,
        dateObj: new Date(tempDate)
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Helper translation string
    const getDensityColor = (count: number) => {
      if (count === 0) return 'bg-slate-100 hover:bg-slate-205 border border-slate-150/40';
      if (count <= 2) return 'bg-emerald-100 hover:scale-105 border border-emerald-200/30';
      if (count <= 5) return 'bg-emerald-300 hover:scale-105 border border-emerald-400/20';
      if (count <= 10) return 'bg-emerald-500 hover:scale-105 border border-emerald-500/20';
      return 'bg-emerald-700 hover:scale-105 shadow-2xs';
    };

    // Calculate months labels to display on top of grid columns (approx 16 columns)
    const monthLabels: Array<{ name: string; colSpan: number }> = [];
    let currentMonthName = '';
    let currentSpan = 0;

    for (let col = 0; col < 16; col++) {
      const firstDayOfWeek = weeksGrid[col * 7].dateObj;
      const monthName = firstDayOfWeek.toLocaleDateString('vi-VN', { month: 'short' });
      
      if (monthName !== currentMonthName) {
        if (currentSpan > 0) {
          monthLabels.push({ name: currentMonthName, colSpan: currentSpan });
        }
        currentMonthName = monthName;
        currentSpan = 1;
      } else {
        currentSpan++;
      }
    }
    // push final segment
    if (currentSpan > 0) {
      monthLabels.push({ name: currentMonthName, colSpan: currentSpan });
    }

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-brand" />
          <span>Lịch Sử Học Tập Thường Nhật (Activity Grid)</span>
        </h4>

        {/* Heatmap Layout with Week Labels Row on Top & Weekday labels on Left */}
        <div className="flex flex-col select-none">
          {/* Month headers row */}
          <div className="flex pl-8 mb-1 text-[10px] font-bold text-slate-400">
            {monthLabels.map((lbl, idx) => (
              <span 
                key={idx} 
                style={{ width: `${(lbl.colSpan / 16) * 100}%` }}
                className="truncate block"
              >
                {lbl.name}
              </span>
            ))}
          </div>

          <div className="flex items-stretch gap-2">
            {/* Weekday indicator labels on the left side */}
            <div className="flex flex-col justify-between py-1.5 text-[9px] font-extrabold text-slate-400 w-6 text-right leading-none pr-1">
              <span>CN</span>
              <span>T3</span>
              <span>T5</span>
              <span>T7</span>
            </div>

            {/* Main grid representing 112 days vertically sync-column layout */}
            <div className="flex-1 overflow-x-auto scrollbar-none pb-2">
              <div 
                className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[320px]"
                style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
              >
                {weeksGrid.map((day, idx) => {
                  const formatDayVi = day.dateObj.toLocaleDateString('vi-VN', {
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  });
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setIsTooltipActive(day.dateStr)}
                      onMouseLeave={() => setIsTooltipActive(null)}
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-[3px] transition-all cursor-pointer relative ${getDensityColor(day.count)}`}
                    >
                      {/* Interactive CSS Tooltip */}
                      {isTooltipActive === day.dateStr && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold p-2 rounded-lg shadow-xl z-50 whitespace-nowrap border border-slate-705 leading-normal animate-fade-in">
                          <span className="block font-black text-amber-300">{day.count} hoạt động ôn tập</span>
                          <span className="text-[8px] text-slate-400 font-medium">{formatDayVi}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Density legend indicators row */}
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400 font-bold mt-3 border-t border-slate-50 pt-3">
            <span>Ít học</span>
            <div className="h-3 w-3 bg-slate-100 rounded-[3px] border border-slate-150/10" />
            <div className="h-3 w-3 bg-emerald-100 rounded-[3px]" />
            <div className="h-3 w-3 bg-emerald-300 rounded-[3px]" />
            <div className="h-3 w-3 bg-emerald-500 rounded-[3px]" />
            <div className="h-3 w-3 bg-emerald-700 rounded-[3px]" />
            <span>Chăm chỉ 🔥</span>
          </div>
        </div>
      </div>
    );
  };

  const handleTestStudyLog = () => {
    trackStudyActivity(1);
    alert('🎉 Đã ghi nhận 1 hoạt động ôn bài gõ tay thử nghiệm! Biểu đồ và Chuỗi ngày (Streak) của bạn đã được cập nhật.');
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

  return (
    <div id="analytics-statistics-dashboard" className="space-y-6">
      
      {/* Top Banner Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak 🔥 Duolingo Widget */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 opacity-15 translate-x-4 translate-y-4 pointer-events-none">
            <Flame size={120} className="animate-pulse" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Flame size={20} className="text-yellow-350 animate-bounce" fill="#fcb103" />
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-100">Chuỗi liên tục (Streak)</span>
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
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Chỉ số ghi nhớ (Retention)</span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                <TrendingUp size={11} />
                <span>Trực quan</span>
              </span>
            </div>

            <div className="flex items-center gap-5 mt-4">
              {/* SVG Radial Gauge */}
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-100 fill-none"
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
                  <span className="text-lg font-black text-slate-900 font-mono leading-none">{retentionRate}%</span>
                  <span className="text-[8px] font-bold text-emerald-600 mt-0.5">Thuộc</span>
                </div>
              </div>

              {/* Stat text breakdown description */}
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-lg leading-tight">Mastered Ratio</h3>
                <p className="text-xs text-slate-400 leading-normal max-w-[160px]">
                  Bạn đã thuộc làu <strong className="text-emerald-600 font-extrabold">{masteredCount}</strong> trên tổng số <strong className="text-slate-700 font-extrabold">{totalCardsCount}</strong> từ vựng.
                </p>
              </div>
            </div>
          </div>

          {/* Mini horizontal breakdown progress line */}
          <div className="border-t border-slate-50 pt-4 mt-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span>Độ phủ Spaced Rep:</span>
              <span className="font-mono text-emerald-600">{coverageRate}% ({activeStudiedCount} từ)</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${coverageRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Global Vocabulary Spaced Rep Levels summary block */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Trạng thái ghi nhớ chi tiết</span>
            
            <div className="space-y-2.5">
              {/* Easy level ("Đã thuộc") */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Đã thuộc (Thuần thục ✨)</span>
                </span>
                <span className="font-mono font-bold text-slate-800">{masteredCount} từ</span>
              </div>

              {/* Good level ("Tạm nhớ") */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Tạm nhớ (Cần ôn lại sau ⏳)</span>
                </span>
                <span className="font-mono font-bold text-slate-800">{intermediateCount} từ</span>
              </div>

              {/* Again level ("Chưa thuộc / Gấp") */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Chưa thuộc (Cần học kĩ 🚨)</span>
                </span>
                <span className="font-mono font-bold text-slate-800">{againCount} từ</span>
              </div>

              {/* Unstudied level */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-350" />
                  <span>Chưa đưa vào học tập</span>
                </span>
                <span className="font-mono font-bold text-slate-550">{unstudiedCount} từ</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-50 pt-2.5 mt-2.5 text-[10px] text-slate-400 font-medium leading-normal flex items-start gap-1 justify-center shrink-0">
            <HelpCircle size={12} className="shrink-0 mt-0.5" />
            <span>Đánh giá từ trong chế độ Thẻ ghi nhớ Spaced Repetition để đưa từ vào biểu đồ!</span>
          </div>
        </div>

      </div>

      {/* GitHub Contributions Grid Heatmap Box */}
      {renderHeatmap()}

      {/* Gamified self testing triggers and developer utility panel */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-brand text-white rounded-xl">
            <GraduationCap size={18} />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase text-slate-850">Kiến tạo động lực tích cực</h5>
            <p className="text-[10px] text-slate-400 mt-0.5">Chu kỳ streak của bạn được tăng lên khi hoàn thành học bài tập hoặc xếp thẻ màu trong Spaced Rep.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="test-log-study-btn"
            onClick={handleTestStudyLog}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-205 text-slate-700 font-bold text-[11px] rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
            title="Sử di chuyển sự tương tác không cần click qua bài thật để cảm nhận heatmap trước"
          >
            🔥 Điểm danh học tập thử nghiệm (+1)
          </button>
          <button
            id="test-reset-streak-btn"
            onClick={handleResetStreak}
            className="px-4 py-2.5 bg-white hover:bg-rose-50 border border-slate-201 hover:border-rose-100 text-slate-500 hover:text-rose-600 font-semibold text-[11px] rounded-xl transition cursor-pointer"
          >
            Khôi phục mặc định 🔄
          </button>
        </div>
      </div>

    </div>
  );
};
