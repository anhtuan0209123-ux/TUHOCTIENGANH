import React, { useState, useEffect, useCallback } from 'react';
import { Card, StudySet } from '../types';
import { 
  ArrowLeft, ArrowRight, Volume2, Shuffle, 
  RotateCcw, Play, Pause, HelpCircle, Sparkles, Loader2, Filter, Info, Clock, Target
} from 'lucide-react';
import { trackStudyActivity } from '../utils/analytics';
import { deepDiveClient } from '../services/geminiClient';

interface FlashcardViewerProps {
  set: StudySet;
  onBack: () => void;
  onStartQuiz?: () => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ set, onBack, onStartQuiz }) => {
  const [cards, setCards] = useState<Card[]>([...set.cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Spaced Repetition Local Database Storage
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [spacedRepMap, setSpacedRepMap] = useState<Record<string, { status: 'again' | 'good' | 'easy'; nextReviewTime: number }>>(() => {
    try {
      const saved = localStorage.getItem('quizlet_spaced_data');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  const saveSpacedRepMap = (newMap: Record<string, { status: 'again' | 'good' | 'easy'; nextReviewTime: number }>) => {
    setSpacedRepMap(newMap);
    localStorage.setItem('quizlet_spaced_data', JSON.stringify(newMap));
  };

  const isCardDue = useCallback((cardId: string) => {
    const record = spacedRepMap[`${set.id}_${cardId}`];
    if (!record) return true; // not studied yet is always due!
    if (record.status === 'again') return true; // explicitly forgotten
    return record.nextReviewTime <= Date.now();
  }, [spacedRepMap, set.id]);

  // Compute filtered cards list
  const cardsToRender = cards.filter(c => !filterDueOnly || isCardDue(c.id));
  const currentCard = cardsToRender[currentIndex] || cardsToRender[0];

  // AI Deep Dive Storage Logic
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [deepDiveData, setDeepDiveData] = useState<{
    essence: string;
    examples: string[];
    mistakes: string;
  } | null>(null);
  const [deepDiveError, setDeepDiveError] = useState<string | null>(null);
  const [activeDeepDiveCardId, setActiveDeepDiveCardId] = useState<string | null>(null);

  const handleDeepDive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;

    setIsDeepDiving(true);
    setDeepDiveError(null);
    setDeepDiveData(null);
    setActiveDeepDiveCardId(currentCard.id);

    try {
      const data = await deepDiveClient(
        currentCard.term,
        currentCard.definition,
        currentCard.example || ""
      );
      setDeepDiveData(data);
    } catch (err: any) {
      console.error(err);
      setDeepDiveError(err.message || 'Không thể liên lạc với Gemini lúc này.');
    } finally {
      setIsDeepDiving(false);
    }
  };

  // Reset deep dive results on card shift
  useEffect(() => {
    setDeepDiveData(null);
    setDeepDiveError(null);
    setActiveDeepDiveCardId(null);
  }, [currentIndex, filterDueOnly]);

  // Handle spacing evaluation score response
  const handleSpacedRate = (cardId: string, status: 'again' | 'good' | 'easy', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    let interval = 60 * 1000; // default 1 min for 'again' (Chưa thuộc)
    if (status === 'good') {
      interval = 24 * 60 * 60 * 1000; // 1 day for 'good' (Tạm nhớ)
    } else if (status === 'easy') {
      interval = 4 * 24 * 60 * 60 * 1000; // 4 days for 'easy' (Đã thuộc)
    }

    const nextReviewTime = Date.now() + interval;
    const newMap = {
      ...spacedRepMap,
      [`${set.id}_${cardId}`]: { status, nextReviewTime }
    };
    saveSpacedRepMap(newMap);

    // Track study activity in the statistics engine!
    trackStudyActivity(1);

    // Soft visual flip-back/advance feedback after scoring
    setIsFlipped(false);
    setTimeout(() => {
      if (cardsToRender.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % cardsToRender.length);
      }
    }, 450);
  };

  // Sync index on filtered count changes
  useEffect(() => {
    if (currentIndex >= cardsToRender.length && cardsToRender.length > 0) {
      setCurrentIndex(0);
    }
  }, [cardsToRender.length, currentIndex]);

  // TTS speaker
  const handlePronounce = useCallback((text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Avoid triggering card flip
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ công cụ chuyển văn bản thành giọng nói (TTS).');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Simple regex to determine language
    const isVietnamese = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text);
    utterance.lang = isVietnamese ? 'vi-VN' : 'en-US';
    utterance.rate = 0.9; // Slightly slower for clear learning
    window.speechSynthesis.speak(utterance);
  }, []);

  // Card list control mechanisms
  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      if (cardsToRender.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % cardsToRender.length);
      }
    }, 150);
  }, [cardsToRender.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      if (cardsToRender.length > 0) {
        setCurrentIndex((prev) => (prev - 1 + cardsToRender.length) % cardsToRender.length);
      }
    }, 150);
  }, [cardsToRender.length]);

  const handleShuffle = () => {
    if (isShuffled) {
      // Restore original ordering
      setCards([...set.cards]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsShuffled(false);
    } else {
      // Shuffle list
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsShuffled(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsAutoPlaying(false);
  };

  // Reset Spaced Rep cache for this study set
  const handleResetSpacedRepForSet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có muốn đặt lại lịch ôn tập ngắt quãng cho toàn bộ các từ trong học phần này không?')) {
      const updatedMap = { ...spacedRepMap };
      set.cards.forEach(c => {
        delete updatedMap[`${set.id}_${c.id}`];
      });
      saveSpacedRepMap(updatedMap);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  // Auto playing timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        if (isFlipped) {
          // If flipped, go to next card and unflip
          handleNext();
        } else {
          // If not flipped, flip first to show definition
          setIsFlipped(true);
        }
      }, 3000); // Trigger action every 3 seconds
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, isFlipped, handleNext]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (e.code === 'KeyR') {
        handleReset();
      } else if (e.code === 'KeyS') {
        handleShuffle();
      } else if (e.key === '1') {
        e.preventDefault();
        if (currentCard) {
          handleSpacedRate(currentCard.id, 'again');
        }
      } else if (e.key === '2') {
        e.preventDefault();
        if (currentCard) {
          handleSpacedRate(currentCard.id, 'good');
        }
      } else if (e.key === '3') {
        e.preventDefault();
        if (currentCard) {
          handleSpacedRate(currentCard.id, 'easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isFlipped, currentCard, spacedRepMap]);

  if (!set.cards.length) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-100">
        <p className="text-slate-500 font-bold">Thao tác lỗi: Học phần không có thẻ hợp lệ.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-brand text-white font-bold rounded-lg">
          Trở lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Set Header context info */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="flashcard-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-brand transition"
        >
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </button>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
          Chế độ: Thẻ ghi nhớ
        </span>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 id="flashcard-set-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {set.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{set.description}</p>
        </div>
        {onStartQuiz && (
          <button
            id="start-ai-quiz-btn"
            onClick={onStartQuiz}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Target size={16} />
            <span>Thử thách Trắc nghiệm AI 🎯</span>
          </button>
        )}
      </div>

      {/* Spaced Repetition Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-150 p-4 rounded-xl mb-4 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-brand shrink-0" />
          <span className="font-bold text-slate-700">Thuật toán ôn tập Spaced Repetition</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="toggle-filter-due"
            onClick={() => { setFilterDueOnly(!filterDueOnly); setCurrentIndex(0); }}
            className={`px-3 py-2 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
              filterDueOnly 
                ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Filter size={12} />
            <span>{filterDueOnly ? 'Hiện tất cả các thẻ' : 'Chỉ lọc thẻ cần ôn tập ⏳'}</span>
          </button>
          <button
            id="reset-spaced-rep-btn"
            onClick={handleResetSpacedRepForSet}
            className="px-3 py-2 font-bold text-slate-550 hover:text-rose-600 hover:bg-rose-50 border border-slate-205 hover:border-rose-100 rounded-lg transition-all cursor-pointer"
            title="Xóa bộ nhớ lặp lại của học phần này"
          >
            Đặt lại lịch học 🔄
          </button>
        </div>
      </div>

      {cardsToRender.length === 0 ? (
        /* Empty Spaced Rep Completion Overlay */
        <div id="spaced-rep-empty-state" className="p-12 text-center bg-white rounded-2xl border border-slate-150 py-16 mb-6">
          <Sparkles size={48} className="mx-auto text-emerald-500 mb-3 animate-pulse" />
          <h3 className="font-extrabold text-slate-800 text-lg">Tuyệt vời! Bạn đã thuộc hết rồi! 🎉</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
            Không còn thẻ nào cần ôn tập hôm nay dựa theo thuật toán lặp lại ngắt quãng. Hãy tắt bộ lọc bằng cách bấm nút bên dưới để ôn luyện thường nhật nhé!
          </p>
          <button
            onClick={() => setFilterDueOnly(false)}
            className="mt-6 px-5 py-2.5 bg-brand hover:bg-[#3444cc] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            Tắt bộ lọc & Xem lại tất cả
          </button>
        </div>
      ) : (
        /* Render Active Flashcard */
        <>
          {/* Main Flashcard with smooth flipping animation */}
          <div 
            id="interactive-flashcard"
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-96 relative cursor-pointer select-none perspective-1000 group mb-6 focus:outline-none"
            tabIndex={0}
          >
            <div 
              className={`w-full h-full duration-500 transform-style-3d relative transition-transform ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT SIDE (Term) */}
              <div className="absolute w-full h-full bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-xs hover:border-brand/40 backface-hidden transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Thuật ngữ</span>
                  {(() => {
                    const record = spacedRepMap[`${set.id}_${currentCard.id}`];
                    if (!record) return null;
                    if (record.status === 'easy') return <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">Đã thuộc ✨</span>;
                    if (record.status === 'good') return <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-amber-50 text-amber-705 border border-amber-100 rounded-full">Tạm nhớ ⏳</span>;
                    return <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full">Ghi nhớ gấp 🚨</span>;
                  })()}
                </div>

                {/* AI Deep Dive absolute button for instant insights */}
                <button
                  id={`deep-dive-btn-front-${currentCard.id}`}
                  onClick={handleDeepDive}
                  disabled={isDeepDiving}
                  className="absolute top-6 right-6 p-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all duration-200 shadow-md flex items-center gap-1 cursor-pointer z-25 group"
                  title="Tìm hiểu chuyên sâu cùng Gemini AI"
                >
                  {isDeepDiving && activeDeepDiveCardId === currentCard.id ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                  ) : (
                    <Sparkles size={14} className="text-amber-300 animate-pulse" />
                  )}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider pr-1 hidden sm:inline">AI Deep Dive</span>
                </button>
                
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <h2 className="text-2xl sm:text-3.5xl font-mono font-bold text-slate-950 text-center leading-snug break-words max-w-full">
                    {currentCard.term}
                  </h2>
                  {currentCard.isRepeated && (
                    <div className="mt-4 flex flex-col items-center justify-center animate-fade-in text-center p-3.5 bg-rose-50 border border-rose-150 rounded-xl max-w-md">
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase text-rose-700 tracking-wider">
                        ⚠️ TỪ VỰNG LẶP ĐI LẶP LẠI (ÔN KỸ)
                      </span>
                      {currentCard.repeatSources && currentCard.repeatSources.length > 0 && (
                        <p className="text-[10px] font-bold text-rose-550/80 mt-1">
                          Đã có tại: {currentCard.repeatSources.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    id="pronounce-term-btn"
                    onClick={(e) => handlePronounce(currentCard.term, e)}
                    className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-brand rounded-xl transition-colors"
                    title="Phát âm tiếng bản xứ"
                  >
                    <Volume2 size={20} />
                  </button>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    Kích vào thẻ hoặc nhấn Phím Cách (Space) để lật
                  </span>
                </div>
              </div>

              {/* BACK SIDE (Definition) */}
              <div className="absolute w-full h-full bg-brand text-white rounded-2xl p-8 flex flex-col justify-between shadow-xs rotate-y-180 backface-hidden transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Định nghĩa & Ý nghĩa</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const record = spacedRepMap[`${set.id}_${currentCard.id}`];
                      if (!record) return null;
                      if (record.status === 'easy') return <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-white/20 text-white rounded-full">Đã thuộc ✨</span>;
                      if (record.status === 'good') return <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-white/20 text-white rounded-full">Tạm nhớ ⏳</span>;
                      return <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-white/20 text-white rounded-full font-mono">Lại sau 1 min 🚨</span>;
                    })()}

                    {/* AI Deep Dive button on Back Side too */}
                    <button
                      id={`deep-dive-btn-back-${currentCard.id}`}
                      onClick={handleDeepDive}
                      disabled={isDeepDiving}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer z-25 group"
                      title="AI Deep Dive"
                    >
                      {isDeepDiving && activeDeepDiveCardId === currentCard.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} className="text-amber-300" />
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-wider">AI Deep Dive</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center p-3 overflow-y-auto">
                  <p className="text-xl sm:text-2xl font-bold leading-relaxed max-w-full">
                    {currentCard.definition}
                  </p>
                  {currentCard.example && (
                    <div className="mt-3 p-2.5 bg-white/10 rounded-lg max-w-sm border border-white/10 text-2xs font-medium italic text-blue-100">
                      Ví dụ: "{currentCard.example}"
                      {currentCard.exampleTranslation && (
                        <span className="block not-italic text-blue-200 text-[11px] font-normal mt-1">
                          ({currentCard.exampleTranslation})
                        </span>
                      )}
                    </div>
                  )}
                  {currentCard.isRepeated && (
                    <div className="mt-3 p-2 bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-blue-100 max-w-sm animate-pulse">
                      ⚠️ TỪ VỰNG LẶP LẠI - CẦN LƯU Ý ÔN TẬP KỸ!
                    </div>
                  )}
                </div>

                {/* SPACED REPETITION RATING TRIGGER BUTTONS ROW */}
                <div className="bg-white/10 p-3 rounded-xl space-y-1.5 mb-3" onClick={(e) => e.stopPropagation()}>
                  <p className="text-[9px] font-extrabold text-center text-blue-105 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span>Đánh giá mức ghi nhớ thẻ này</span>
                    <span className="bg-blue-600/50 text-[8px] px-1 py-0.5 rounded-sm font-mono normal-case">Dùng phím 1, 2, 3</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      id={`spaced-rate-again-${currentCard.id}`}
                      onClick={(e) => handleSpacedRate(currentCard.id, 'again', e)}
                      className="px-2 py-1.5 bg-rose-600 hover:bg-rose-500 hover:scale-[1.02] text-white rounded-lg text-2xs font-extrabold transition flex flex-col items-center justify-center gap-0.5 border border-rose-450/30 cursor-pointer shadow-sm"
                      title="Học lại sau 1 phút - Nhấn phím 1"
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-mono bg-black/20 text-[8px] px-1 rounded-sm">1</span>
                        <span className="font-extrabold uppercase text-[9px] tracking-wide">Chưa thuộc</span>
                      </div>
                      <span className="text-[8px] text-rose-200 font-medium font-sans">Lại sau 1 min</span>
                    </button>
                    <button
                      id={`spaced-rate-good-${currentCard.id}`}
                      onClick={(e) => handleSpacedRate(currentCard.id, 'good', e)}
                      className="px-2 py-1.5 bg-amber-600 hover:bg-amber-500 hover:scale-[1.02] text-white rounded-lg text-2xs font-extrabold transition flex flex-col items-center justify-center gap-0.5 border border-amber-450/30 cursor-pointer shadow-sm"
                      title="Học lại sau 1 ngày - Nhấn phím 2"
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-mono bg-black/20 text-[8px] px-1 rounded-sm">2</span>
                        <span className="font-extrabold uppercase text-[9px] tracking-wide">Tạm nhớ</span>
                      </div>
                      <span className="text-[8px] text-amber-200 font-medium font-sans">Lại sau 1 ngày</span>
                    </button>
                    <button
                      id={`spaced-rate-easy-${currentCard.id}`}
                      onClick={(e) => handleSpacedRate(currentCard.id, 'easy', e)}
                      className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] text-white rounded-lg text-2xs font-extrabold transition flex flex-col items-center justify-center gap-0.5 border border-emerald-450/30 cursor-pointer shadow-sm"
                      title="Thuộc làu, học lại sau 4 ngày - Nhấn phím 3"
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-mono bg-black/20 text-[8px] px-1 rounded-sm">3</span>
                        <span className="font-extrabold uppercase text-[9px] tracking-wide">Đã thuộc</span>
                      </div>
                      <span className="text-[8px] text-emerald-200 font-medium font-sans">Lại sau 4 ngày</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    id="pronounce-def-btn"
                    onClick={(e) => handlePronounce(currentCard.definition, e)}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    title="Phát âm ý nghĩa"
                  >
                    <Volume2 size={20} />
                  </button>
                  <span className="text-xs font-medium text-blue-200">
                    Kích vào thẻ để lật lại thuật ngữ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Index Progress bar Indicator */}
          <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex-1 max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden mr-4">
              <div 
                className="bg-brand h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / cardsToRender.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700 font-mono">
              {currentIndex + 1} / {cardsToRender.length}
            </span>
          </div>
        </>
      )}

      {/* Dynamic Deep Dive Results Drawer Panel */}
      {(isDeepDiving || deepDiveData || deepDiveError) && (
        <div id="ai-deep-dive-results-panel" className="mt-6 p-6 bg-slate-900 border border-slate-700 rounded-2xl text-white shadow-xl animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-violet-500/20 to-indigo-500/20 p-2.5 rounded-xl border border-violet-500/10 text-indigo-400">
                <Sparkles size={18} className="animate-pulse text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <span>Trợ lý Trí tuệ Nhân tạo Gemini - Deep Dive</span>
                </h4>
                <p className="text-[10px] text-slate-400">Chuyên sâu thuật ngữ: <span className="text-white font-bold">"{currentCard?.term}"</span></p>
              </div>
            </div>
            <button 
              onClick={() => { setDeepDiveData(null); setDeepDiveError(null); }}
              className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all"
            >
              Đóng panel ×
            </button>
          </div>

          <div className="space-y-4 relative z-10">
            {isDeepDiving && (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 size={32} className="text-indigo-400 animate-spin" />
                <p className="text-sm font-bold text-indigo-200 animate-pulse">Gemini đang giải mã ý nghĩa & tạo mẹo ghi nhớ...</p>
                <div className="text-[10px] text-slate-500 max-w-xs text-center leading-relaxed">
                  Trích xuất khái niệm thực tiễn, soạn bản dịch ví dụ bản xứ và lập danh sách lỗi sai thường gặp.
                </div>
              </div>
            )}

            {deepDiveError && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>Rất tiếc: {deepDiveError}</span>
              </div>
            )}

            {deepDiveData && (
              <div className="space-y-4 text-xs font-sans">
                {/* Essence block */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                    <span>💡 Bản chất & Mẹo nhớ trực quan</span>
                  </span>
                  <div className="text-slate-200 leading-relaxed font-semibold bg-white/5 p-3 rounded-xl border border-white/5 shadow-inner">
                    {deepDiveData.essence}
                  </div>
                </div>

                {/* Examples block */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-300 flex items-center gap-1">
                    <span>📚 2 Ví dụ Sử dụng Thực tế Phong phú</span>
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deepDiveData.examples.map((ex, idx) => (
                      <div key={idx} className="bg-white/5 p-3.5 rounded-xl border border-white/5 leading-relaxed font-semibold italic text-slate-100 flex items-start gap-2 shadow-2xs">
                        <span className="text-amber-400 font-extrabold text-sm font-sans">0{idx + 1}.</span>
                        <p>{ex}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common mistakes block */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <span>⚠️ Các lỗi sai bẫy & Cách khắc phục</span>
                  </span>
                  <div className="text-slate-200 leading-relaxed font-semibold bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
                    {deepDiveData.mistakes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Controls panel bar */}
      <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        {/* Left utility buttons */}
        <div className="flex items-center gap-2">
          <button
            id="viewer-shuffle-btn"
            onClick={handleShuffle}
            className={`p-3 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-xs cursor-pointer ${
              isShuffled
                ? 'bg-blue-50 text-brand'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
            title="Trộn thẻ ngẫu nhiên"
          >
            <Shuffle size={16} />
            <span className="hidden sm:inline">{isShuffled ? 'Đã trộn' : 'Trộn thẻ'}</span>
          </button>

          <button
            id="viewer-restart-btn"
            onClick={handleReset}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Học lại từ đầu"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Center navigation controls */}
        <div className="flex items-center gap-4">
          <button
            id="viewer-prev-btn"
            onClick={handlePrev}
            disabled={cardsToRender.length <= 1}
            className="p-3 bg-blue-50/50 hover:bg-blue-50 text-brand active:scale-95 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Thẻ trước"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            id="viewer-autoplay-btn"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            disabled={cardsToRender.length === 0}
            className={`px-5 py-2.5 rounded-lg font-bold text-xs tracking-wide shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
              isAutoPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-brand hover:bg-[#3444cc] text-white'
            }`}
          >
            {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isAutoPlaying ? 'Dừng Tự Động' : 'Tự Động Chạy'}</span>
          </button>

          <button
            id="viewer-next-btn"
            onClick={handleNext}
            disabled={cardsToRender.length <= 1}
            className="p-3 bg-blue-50/50 hover:bg-blue-50 text-brand active:scale-95 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Thẻ tiếp theo"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Right utility info */}
        <div className="text-xs text-slate-400 font-medium hidden sm:flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <HelpCircle size={14} className="text-slate-400 animate-pulse" />
          <span>Phím tắt: Space (lật mặt), Phím 1/2/3 (đánh giá), Arrow keys (chuyển)</span>
        </div>
      </div>
    </div>
  );
};
