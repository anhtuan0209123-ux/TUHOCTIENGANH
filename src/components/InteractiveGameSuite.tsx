import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, ArrowLeftRight, FileText, Check, CheckCircle2, 
  AlertCircle, Trophy, RefreshCw, Gamepad2, Move, Clock, Flame, 
  Award, HelpCircle, Layers, ArrowLeft
} from 'lucide-react';
import { StudySet, Card } from '../types';
import { trackStudyActivity } from '../utils/analytics';

interface InteractiveGameSuiteProps {
  isOpen: boolean;
  onClose: () => void;
  studySetData: StudySet;
  onGameComplete?: (stats: { gameMode: string; score: number; timeTaken: number }) => void;
}

// Simple Web Audio API Synth for instant audio feedback without external file dependencies
function playAudioSound(type: 'success' | 'error' | 'victory') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'victory') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
      });
    }
  } catch (e) {
    // Ignore audio context autoplay restrictions
  }
}

// Interface for Matching game cards
interface MatchingItem {
  id: string;
  cardId: string;
  text: string;
  type: 'term' | 'definition';
  state: 'default' | 'selected' | 'matched' | 'wrong';
  isDisappeared: boolean;
}

// Interface for Cloze test
interface ClozeBlank {
  id: string;
  correctTerm: string;
  currentPlacedTerm: string | null;
  hint?: string;
  status: 'empty' | 'placed' | 'correct' | 'incorrect';
}

interface ClozeWordItem {
  id: string;
  term: string;
  isPlaced: boolean;
}

export const InteractiveGameSuite: React.FC<InteractiveGameSuiteProps> = ({
  isOpen,
  onClose,
  studySetData,
  onGameComplete
}) => {
  const [selectedGame, setSelectedGame] = useState<'matching' | 'cloze' | null>(null);

  // General game stats
  const [score, setScore] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isGameFinished, setIsGameFinished] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // GAME 1: Matching Pairs State
  const [leftItems, setLeftItems] = useState<MatchingItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchingItem[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<MatchingItem | null>(null);
  const [selectedRight, setSelectedRight] = useState<MatchingItem | null>(null);
  const [matchedCount, setMatchedCount] = useState<number>(0);

  // GAME 2: Cloze Test State
  const [storySegments, setStorySegments] = useState<Array<{ type: 'text' | 'blank'; value: string }>>([]);
  const [blanks, setBlanks] = useState<ClozeBlank[]>([]);
  const [wordBank, setWordBank] = useState<ClozeWordItem[]>([]);
  const [selectedBankWord, setSelectedBankWord] = useState<ClozeWordItem | null>(null);
  const [checkedResults, setCheckedResults] = useState<boolean>(false);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer on active game
  useEffect(() => {
    if (selectedGame && !isGameFinished) {
      timerRef.current = setInterval(() => {
        setTimeTaken(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedGame, isGameFinished]);

  // Handle Game Reset / Switch
  const resetSuite = () => {
    setSelectedGame(null);
    setScore(0);
    setTimeTaken(0);
    setIsGameFinished(false);
    setLeftItems([]);
    setRightItems([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedCount(0);
    setStorySegments([]);
    setBlanks([]);
    setWordBank([]);
    setSelectedBankWord(null);
    setCheckedResults(false);
  };

  // ==========================================
  // INITIALIZE GAME 1: MATCHING PAIRS (5x5)
  // ==========================================
  const startMatchingGame = () => {
    setSelectedGame('matching');
    setScore(0);
    setTimeTaken(0);
    setIsGameFinished(false);
    setMatchedCount(0);
    setSelectedLeft(null);
    setSelectedRight(null);

    const cards = studySetData?.cards || [];
    if (cards.length === 0) return;

    // Pick up to 5 random cards
    const shuffledCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, 5);

    const left: MatchingItem[] = shuffledCards.map((c, idx) => ({
      id: `L_${c.id}_${idx}`,
      cardId: c.id,
      text: c.term,
      type: 'term' as const,
      state: 'default' as const,
      isDisappeared: false
    })).sort(() => 0.5 - Math.random());

    const right: MatchingItem[] = shuffledCards.map((c, idx) => ({
      id: `R_${c.id}_${idx}`,
      cardId: c.id,
      text: c.definition,
      type: 'definition' as const,
      state: 'default' as const,
      isDisappeared: false
    })).sort(() => 0.5 - Math.random());

    setLeftItems(left);
    setRightItems(right);
  };

  // Evaluate matching pair
  const evaluateMatch = (leftItem: MatchingItem, rightItem: MatchingItem) => {
    if (leftItem.cardId === rightItem.cardId) {
      // MATCH SUCCESS
      playAudioSound('success');
      setScore(prev => prev + 10);

      // Highlight green
      setLeftItems(prev => prev.map(i => i.id === leftItem.id ? { ...i, state: 'matched' } : i));
      setRightItems(prev => prev.map(i => i.id === rightItem.id ? { ...i, state: 'matched' } : i));

      // After 500ms, disappear
      setTimeout(() => {
        setLeftItems(prev => prev.map(i => i.id === leftItem.id ? { ...i, isDisappeared: true } : i));
        setRightItems(prev => prev.map(i => i.id === rightItem.id ? { ...i, isDisappeared: true } : i));
        setSelectedLeft(null);
        setSelectedRight(null);

        setMatchedCount(count => {
          const newCount = count + 1;
          if (newCount >= leftItems.length) {
            // FINISHED ALL PAIRS
            setTimeout(() => {
              triggerGameFinish('matching');
            }, 300);
          }
          return newCount;
        });
      }, 500);

    } else {
      // MATCH WRONG
      playAudioSound('error');
      setLeftItems(prev => prev.map(i => i.id === leftItem.id ? { ...i, state: 'wrong' } : i));
      setRightItems(prev => prev.map(i => i.id === rightItem.id ? { ...i, state: 'wrong' } : i));

      setTimeout(() => {
        setLeftItems(prev => prev.map(i => i.id === leftItem.id ? { ...i, state: 'default' } : i));
        setRightItems(prev => prev.map(i => i.id === rightItem.id ? { ...i, state: 'default' } : i));
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  };

  // Click handler for left (term)
  const handleLeftClick = (item: MatchingItem) => {
    if (item.isDisappeared || item.state === 'matched') return;
    if (selectedLeft?.id === item.id) {
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(item);

    if (selectedRight) {
      evaluateMatch(item, selectedRight);
    }
  };

  // Click handler for right (definition)
  const handleRightClick = (item: MatchingItem) => {
    if (item.isDisappeared || item.state === 'matched') return;
    if (selectedRight?.id === item.id) {
      setSelectedRight(null);
      return;
    }
    setSelectedRight(item);

    if (selectedLeft) {
      evaluateMatch(selectedLeft, item);
    }
  };

  // Drag & drop handlers for Matching game
  const handleDragStartLeft = (e: React.DragEvent, item: MatchingItem) => {
    e.dataTransfer.setData('text/matching-left-id', item.id);
    setSelectedLeft(item);
  };

  const handleDragStartRight = (e: React.DragEvent, item: MatchingItem) => {
    e.dataTransfer.setData('text/matching-right-id', item.id);
    setSelectedRight(item);
  };

  const handleDropOnRight = (e: React.DragEvent, targetRightItem: MatchingItem) => {
    e.preventDefault();
    const draggedLeftId = e.dataTransfer.getData('text/matching-left-id');
    if (!draggedLeftId) return;
    const foundLeft = leftItems.find(i => i.id === draggedLeftId);
    if (foundLeft) {
      evaluateMatch(foundLeft, targetRightItem);
    }
  };

  const handleDropOnLeft = (e: React.DragEvent, targetLeftItem: MatchingItem) => {
    e.preventDefault();
    const draggedRightId = e.dataTransfer.getData('text/matching-right-id');
    if (!draggedRightId) return;
    const foundRight = rightItems.find(i => i.id === draggedRightId);
    if (foundRight) {
      evaluateMatch(targetLeftItem, foundRight);
    }
  };

  // ==========================================
  // INITIALIZE GAME 2: CLOZE TEST (ĐOẠN VĂN ĐỤC LỖ)
  // ==========================================
  const startClozeGame = async () => {
    setSelectedGame('cloze');
    setScore(0);
    setTimeTaken(0);
    setIsGameFinished(false);
    setCheckedResults(false);
    setSelectedBankWord(null);

    const cards = studySetData?.cards || [];
    if (cards.length === 0) return;

    const targetCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, 4);

    setIsAiLoading(true);

    try {
      // Try to fetch AI generated cloze text
      const res = await fetch('/api/cloze-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: studySetData.title || (studySetData as any).name || 'Học tập',
          cards: targetCards
        })
      });

      if (res.ok) {
        const data = await res.json();
        setupClozeData(data.story, data.blanks, targetCards, data.distractors || []);
      } else {
        throw new Error('API Fallback');
      }
    } catch (e) {
      // Intelligent local fallback cloze text
      const localBlanks = targetCards.map((c, idx) => ({
        id: `b_${idx + 1}`,
        correctTerm: c.term,
        hint: c.definition
      }));

      const storyText = targetCards.map((c, idx) => {
        const def = c.definition ? ` (định nghĩa: "${c.definition}")` : '';
        return `Trong bài học, thuật ngữ [___] mang ý nghĩa quan trọng${def}.`;
      }).join(' ');

      setupClozeData(storyText, localBlanks, targetCards, []);
    } finally {
      setIsAiLoading(false);
    }
  };

  const setupClozeData = (
    storyRaw: string, 
    blanksRaw: Array<{ id: string; correctTerm: string; hint?: string }>,
    cards: Card[],
    distractors: string[]
  ) => {
    const parts = storyRaw.split('[___]');
    const segments: Array<{ type: 'text' | 'blank'; value: string }> = [];

    const parsedBlanks: ClozeBlank[] = blanksRaw.map((b, idx) => ({
      id: b.id || `b_${idx + 1}`,
      correctTerm: b.correctTerm,
      currentPlacedTerm: null,
      hint: b.hint,
      status: 'empty'
    }));

    parts.forEach((p, idx) => {
      if (p) segments.push({ type: 'text', value: p });
      if (idx < parsedBlanks.length) {
        segments.push({ type: 'blank', value: parsedBlanks[idx].id });
      }
    });

    setStorySegments(segments);
    setBlanks(parsedBlanks);

    // Build word bank (correct terms + any extra cards/distractors)
    const bankTerms = Array.from(new Set([
      ...parsedBlanks.map(b => b.correctTerm),
      ...cards.map(c => c.term),
      ...distractors
    ])).filter(Boolean);

    const bankItems: ClozeWordItem[] = bankTerms.map((term, idx) => ({
      id: `w_${idx}_${term}`,
      term: term,
      isPlaced: false
    })).sort(() => 0.5 - Math.random());

    setWordBank(bankItems);
  };

  // Place word into blank
  const placeWordInBlank = (wordItem: ClozeWordItem, blankId: string) => {
    // If blank already has a word, return that existing word back to word bank
    const targetBlank = blanks.find(b => b.id === blankId);
    if (!targetBlank) return;

    setBlanks(prev => prev.map(b => {
      if (b.id === blankId) {
        return { ...b, currentPlacedTerm: wordItem.term, status: 'placed' };
      }
      return b;
    }));

    // Mark current word as placed in Word Bank
    setWordBank(prev => prev.map(w => {
      if (w.id === wordItem.id) return { ...w, isPlaced: true };
      // If previous word was freed from this blank, make it available again
      if (targetBlank.currentPlacedTerm && w.term === targetBlank.currentPlacedTerm && w.isPlaced) {
        return { ...w, isPlaced: false };
      }
      return w;
    }));

    setSelectedBankWord(null);
  };

  // Remove word from blank
  const removeWordFromBlank = (blankId: string) => {
    const targetBlank = blanks.find(b => b.id === blankId);
    if (!targetBlank || !targetBlank.currentPlacedTerm) return;

    const removedTerm = targetBlank.currentPlacedTerm;

    setBlanks(prev => prev.map(b => {
      if (b.id === blankId) {
        return { ...b, currentPlacedTerm: null, status: 'empty' };
      }
      return b;
    }));

    // Free word back in Word Bank
    setWordBank(prev => {
      let freed = false;
      return prev.map(w => {
        if (!freed && w.term === removedTerm && w.isPlaced) {
          freed = true;
          return { ...w, isPlaced: false };
        }
        return w;
      });
    });
  };

  // Check answers for Cloze Test
  const handleCheckClozeAnswers = () => {
    let currentScore = 0;
    let allCorrect = true;

    const updatedBlanks = blanks.map(b => {
      if (!b.currentPlacedTerm) {
        allCorrect = false;
        return { ...b, status: 'incorrect' as const };
      }
      const isCorrect = b.currentPlacedTerm.trim().toLowerCase() === b.correctTerm.trim().toLowerCase();
      if (isCorrect) {
        currentScore += 10;
        return { ...b, status: 'correct' as const };
      } else {
        allCorrect = false;
        return { ...b, status: 'incorrect' as const };
      }
    });

    setBlanks(updatedBlanks);
    setScore(currentScore);
    setCheckedResults(true);

    if (allCorrect) {
      playAudioSound('victory');
      setTimeout(() => {
        triggerGameFinish('cloze', currentScore);
      }, 600);
    } else {
      playAudioSound('error');
    }
  };

  // Finish Game & Record Streak
  const triggerGameFinish = (mode: string, finalScore?: number) => {
    setIsGameFinished(true);
    playAudioSound('victory');

    const calculatedScore = finalScore !== undefined ? finalScore : score + 50;
    setScore(calculatedScore);

    // Update Streak Activity in localStorage
    trackStudyActivity(1);

    if (onGameComplete) {
      onGameComplete({
        gameMode: mode,
        score: calculatedScore,
        timeTaken
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white w-[95vw] max-w-3xl md:max-w-4xl h-[90vh] max-h-[850px] rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP BAR / HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {selectedGame ? (
              <button
                onClick={resetSuite}
                className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Quay lại chọn game"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Chọn trò chơi</span>
              </button>
            ) : (
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-inner text-white">
                <Gamepad2 size={20} className="animate-pulse" />
              </div>
            )}

            <div>
              <h2 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-1.5 sm:gap-2">
                <span>Trò Chơi Kéo Thả Trí Tuệ</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono bg-amber-400/20 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-400/30">
                  Drag & Drop
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium line-clamp-1 max-w-[180px] sm:max-w-xs">
                {studySetData.title || (studySetData as any).name || 'Bộ Thẻ Học Tập'} ({studySetData.cards?.length || 0} thuật ngữ)
              </p>
            </div>
          </div>

          {/* Timer & Score when game in progress */}
          {selectedGame && !isGameFinished && (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold font-mono">
                <Clock size={13} className="text-amber-400" />
                <span>{Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black">
                <Trophy size={13} />
                <span>{score} điểm</span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl transition text-slate-300 hover:text-white cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL MAIN BODY CONTENT WITH SAFE AREA PADDING & NO SCROLLBAR */}
        <div className="flex-1 bg-slate-50/70 p-3 sm:p-6 overflow-y-auto no-scrollbar relative pb-8 sm:pb-6">

          {/* =================================================== */}
          {/* VIEW 1: GAME SELECTION SCREEN (MÀN HÌNH CHỌN GAME)   */}
          {/* =================================================== */}
          {!selectedGame && (
            <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  <Sparkles size={14} /> Chọn Chế Độ Ôn Tập Kéo Thả
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-850 tracking-tight">
                  Tăng tốc phản xạ & ghi nhớ cực sâu
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                  Rèn luyện tư duy ngôn ngữ bằng các thao tác tương tác sinh động, kéo thả mượt mà trên máy tính và điện thoại.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* GAME 1 CARD: MATCHING PAIRS */}
                <div
                  onClick={startMatchingGame}
                  className="group relative bg-white p-6 rounded-3xl border-2 border-slate-200 hover:border-brand shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3.5 bg-blue-50 text-brand rounded-2xl group-hover:bg-brand group-hover:text-white transition-colors">
                        <ArrowLeftRight size={26} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">
                        5x5 Matching
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-extrabold text-slate-850 group-hover:text-brand transition-colors">
                        Nối Từ 2 Cột (Matching Pairs)
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Nối 5 cặp Thuật ngữ & Định nghĩa. Kéo thả trực tiếp hoặc chạm chọn phản xạ 2 chiều để loại bỏ thẻ bài!
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-brand">
                    <span>Bắt đầu ghép cặp →</span>
                    <Move size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* GAME 2 CARD: CLOZE TEST */}
                <div
                  onClick={startClozeGame}
                  className="group relative bg-white p-6 rounded-3xl border-2 border-slate-200 hover:border-indigo-600 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText size={26} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
                        AI Cloze Test
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-extrabold text-slate-850 group-hover:text-indigo-600 transition-colors">
                        Đoạn Văn Đục Lỗ (Cloze Test)
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Đoạn ngữ cảnh tự nhiên bị đục lỗ. Kéo từ vựng ở Ngân hàng từ thả vào chính xác vị trí trong văn bản!
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-indigo-600">
                    <span>Thử thách điền từ →</span>
                    <Move size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Game Info Footnote */}
              <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
                <Flame size={20} className="text-amber-500 shrink-0" />
                <span>
                  <strong>Hỗ trợ Streak & Thống kê:</strong> Hoàn thành mỗi lượt chơi sẽ được cộng ngay điểm XP và tính chuỗi ngày học liên tục vào hệ thống!
                </span>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* GAME 1: MATCHING PAIRS (NỐI TỪ 2 CỘT 5x5)          */}
          {/* =================================================== */}
          {selectedGame === 'matching' && !isGameFinished && (
            <div className="h-full flex flex-col justify-between max-w-3xl mx-auto space-y-3 sm:space-y-4 animate-fade-in">
              {/* Top Hint Bar */}
              <div className="bg-white p-3 px-4 rounded-xl sm:rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs gap-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                  <Move size={15} className="text-brand shrink-0" />
                  <span>Kéo thả thẻ hoặc <strong>chạm chọn 2 thẻ</strong> tương ứng để ghép đôi.</span>
                </span>
                <span className="font-extrabold text-brand bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full font-mono text-[11px] sm:text-xs shrink-0">
                  {matchedCount}/{leftItems.length}
                </span>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 flex-1 my-auto items-start">
                
                {/* LEFT COLUMN: TERMS */}
                <div className="space-y-2.5">
                  <div className="text-[11px] sm:text-xs font-black uppercase text-slate-400 tracking-wider px-1 flex items-center justify-between">
                    <span>Cột 1: Thuật ngữ</span>
                    <span className="text-[10px] text-slate-400">Chạm hoặc Kéo</span>
                  </div>

                  {leftItems.map((item) => {
                    if (item.isDisappeared) {
                      return (
                        <div key={item.id} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200/60 bg-slate-100/30 flex items-center justify-center opacity-30">
                          <Check size={18} className="text-emerald-500" />
                        </div>
                      );
                    }

                    const isSelected = selectedLeft?.id === item.id;
                    const isMatched = item.state === 'matched';
                    const isWrong = item.state === 'wrong';

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStartLeft(e, item)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnLeft(e, item)}
                        onClick={() => handleLeftClick(item)}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 cursor-grab active:cursor-grabbing select-none shadow-2xs flex items-center justify-between min-h-[52px] sm:min-h-[58px] ${
                          isMatched
                            ? 'bg-emerald-600 text-white border-emerald-500 scale-102 shadow-md'
                            : isWrong
                            ? 'bg-rose-500 text-white border-rose-600 animate-shake'
                            : isSelected
                            ? 'bg-blue-50 text-brand border-brand ring-4 ring-brand/20 shadow-md scale-102'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-brand/60 hover:bg-slate-50/80'
                        }`}
                      >
                        <span className="font-extrabold text-xs sm:text-sm leading-snug break-words pr-2">
                          {item.text}
                        </span>
                        {isMatched && <CheckCircle2 size={18} className="text-white shrink-0" />}
                        {isWrong && <X size={18} className="text-white shrink-0" />}
                        {!isMatched && !isWrong && (
                          <span className={`text-xs shrink-0 ${isSelected ? 'text-brand font-black' : 'text-slate-300'}`}>●</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT COLUMN: DEFINITIONS */}
                <div className="space-y-2.5">
                  <div className="text-[11px] sm:text-xs font-black uppercase text-slate-400 tracking-wider px-1 flex items-center justify-between">
                    <span>Cột 2: Định nghĩa</span>
                    <span className="text-[10px] text-slate-400">Ô nhận thả</span>
                  </div>

                  {rightItems.map((item) => {
                    if (item.isDisappeared) {
                      return (
                        <div key={item.id} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200/60 bg-slate-100/30 flex items-center justify-center opacity-30">
                          <Check size={18} className="text-emerald-500" />
                        </div>
                      );
                    }

                    const isSelected = selectedRight?.id === item.id;
                    const isMatched = item.state === 'matched';
                    const isWrong = item.state === 'wrong';

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStartRight(e, item)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnRight(e, item)}
                        onClick={() => handleRightClick(item)}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 cursor-grab active:cursor-grabbing select-none shadow-2xs flex items-center justify-between min-h-[52px] sm:min-h-[58px] ${
                          isMatched
                            ? 'bg-emerald-600 text-white border-emerald-500 scale-102 shadow-md'
                            : isWrong
                            ? 'bg-rose-500 text-white border-rose-600 animate-shake'
                            : isSelected
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-500 ring-4 ring-indigo-500/20 shadow-md scale-102'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80'
                        }`}
                      >
                        <span className="font-medium text-xs sm:text-sm leading-snug break-words pr-2">
                          {item.text}
                        </span>
                        {isMatched && <CheckCircle2 size={18} className="text-white shrink-0 ml-1" />}
                        {isWrong && <X size={18} className="text-white shrink-0 ml-1" />}
                        {!isMatched && !isWrong && (
                          <span className={`text-xs shrink-0 ${isSelected ? 'text-indigo-600 font-black' : 'text-slate-300'} ml-1`}>●</span>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Reset button */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={startMatchingGame}
                  className="px-3.5 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw size={14} /> Tráo lại lượt chơi mới
                </button>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* GAME 2: CLOZE TEST (ĐOẠN VĂN ĐỤC LỖ)                */}
          {/* =================================================== */}
          {selectedGame === 'cloze' && !isGameFinished && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in flex flex-col h-full justify-between">
              
              {isAiLoading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-700">AI đang khởi tạo đoạn văn đục lỗ ngữ cảnh...</p>
                </div>
              ) : (
                <>
                  {/* Instructions */}
                  <div className="bg-indigo-50/80 border border-indigo-100 p-3 px-4 rounded-xl sm:rounded-2xl flex items-center justify-between text-xs text-indigo-900 shadow-2xs gap-2">
                    <span className="font-bold flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                      <Sparkles size={15} className="text-indigo-600 shrink-0" />
                      <span>
                        Kéo thả hoặc <strong>bấm chọn từ vựng → bấm ô trống [ ___ ]</strong> để điền vào đoạn văn.
                      </span>
                    </span>
                    <span className="font-mono text-[10px] uppercase font-extrabold bg-indigo-200/60 px-2 py-0.5 rounded-md shrink-0">
                      Cloze Test
                    </span>
                  </div>

                  {/* PARAGRAPH CLOZE CONTAINER */}
                  <div className="bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-sm leading-relaxed text-slate-800 text-sm sm:text-base md:text-lg font-serif space-y-2.5">
                    <div className="flex flex-wrap items-baseline gap-y-2.5 gap-x-1 sm:gap-x-1.5">
                      {storySegments.map((seg, idx) => {
                        if (seg.type === 'text') {
                          return <span key={idx}>{seg.value}</span>;
                        }

                        // Render Blank Zone
                        const blank = blanks.find(b => b.id === seg.value);
                        if (!blank) return null;

                        const isCorrect = blank.status === 'correct';
                        const isIncorrect = blank.status === 'incorrect';
                        const isPlaced = Boolean(blank.currentPlacedTerm);

                        return (
                          <span
                            key={blank.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const wordData = e.dataTransfer.getData('text/cloze-word-id');
                              const foundWord = wordBank.find(w => w.id === wordData);
                              if (foundWord) placeWordInBlank(foundWord, blank.id);
                            }}
                            onClick={() => {
                              if (selectedBankWord) {
                                placeWordInBlank(selectedBankWord, blank.id);
                              } else if (blank.currentPlacedTerm) {
                                removeWordFromBlank(blank.id);
                              }
                            }}
                            className={`inline-flex items-center justify-center font-sans font-bold text-xs sm:text-sm px-2.5 sm:px-3.5 py-1 rounded-lg sm:rounded-xl border-2 transition-all cursor-pointer min-w-[80px] sm:min-w-[100px] my-1 duration-200 ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-500 shadow-xs'
                                : isIncorrect
                                ? 'bg-rose-100 text-rose-900 border-rose-500 animate-shake shadow-xs'
                                : isPlaced
                                ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-xs hover:border-blue-600'
                                : selectedBankWord
                                ? 'bg-amber-50 text-amber-800 border-amber-400 border-dashed ring-2 ring-amber-400/30 animate-pulse'
                                : 'bg-slate-100 text-slate-400 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-200/60'
                            }`}
                            title={blank.hint ? `Gợi ý: ${blank.hint}` : 'Bấm để gỡ từ'}
                          >
                            {blank.currentPlacedTerm ? (
                              <span className="flex items-center gap-1">
                                {blank.currentPlacedTerm}
                                {isCorrect && <Check size={14} className="text-emerald-600" />}
                                {isIncorrect && <X size={14} className="text-rose-600" />}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono">[ ___ ]</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* WORD BANK (NGÂN HÀNG TỪ VỰNG) */}
                  <div className="bg-slate-100/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 space-y-2.5">
                    <div className="text-[11px] sm:text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                      <span>Ngân hàng từ vựng (Word Bank):</span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">Kéo hoặc chạm để chọn từ</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {wordBank.map((word) => {
                        if (word.isPlaced) {
                          return (
                            <span 
                              key={word.id} 
                              className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-200/50 text-slate-400 text-xs font-bold line-through opacity-50 cursor-not-allowed select-none"
                            >
                              {word.term}
                            </span>
                          );
                        }

                        const isSelected = selectedBankWord?.id === word.id;

                        return (
                          <div
                            key={word.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/cloze-word-id', word.id);
                              setSelectedBankWord(word);
                            }}
                            onClick={() => {
                              if (selectedBankWord?.id === word.id) {
                                setSelectedBankWord(null);
                              } else {
                                setSelectedBankWord(word);
                              }
                            }}
                            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 cursor-grab active:cursor-grabbing select-none border shadow-2xs active:scale-95 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/20 scale-105'
                                : 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200 hover:border-blue-400'
                            }`}
                          >
                            {word.term}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={startClozeGame}
                      className="px-3.5 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <RefreshCw size={14} /> Bài mới
                    </button>

                    <button
                      type="button"
                      onClick={handleCheckClozeAnswers}
                      className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-95 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95"
                    >
                      <CheckCircle2 size={16} />
                      <span>Kiểm tra đáp án ✅</span>
                    </button>
                  </div>
                </>
              )}

            </div>
          )}

          {/* =================================================== */}
          {/* VIEW 3: GAME FINISHED / VICTORY SCREEN               */}
          {/* =================================================== */}
          {selectedGame && isGameFinished && (
            <div className="max-w-md mx-auto py-8 sm:py-12 text-center space-y-6 animate-scale-up">
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl rotate-3">
                <Trophy size={42} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  🎉 Hoàn thành xuất sắc!
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-850">
                  {selectedGame === 'matching' ? 'Master Nối Cặp 5x5!' : 'Bậc Thầy Cloze Test!'}
                </h3>
                <p className="text-xs text-slate-500">
                  Bạn đã vượt qua thử thách phản xạ ghi nhớ của bộ thẻ học phần này!
                </p>
              </div>

              {/* Stats Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[10px] uppercase font-extrabold text-amber-700 block">Tổng Điểm Số</span>
                  <span className="text-2xl font-black text-amber-600 font-mono">+{score} XP</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[10px] uppercase font-extrabold text-blue-700 block">Thời Gian</span>
                  <span className="text-2xl font-black text-blue-600 font-mono">
                    {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Streak Boost Notice */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-2xl text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <Flame size={24} className="animate-bounce text-yellow-300" fill="currentColor" />
                  <div className="text-left">
                    <span className="text-xs font-black block">Chuỗi Ngày Học (Streak) +1</span>
                    <span className="text-[11px] text-amber-100">Đã cập nhật dữ liệu thống kê của bạn!</span>
                  </div>
                </div>
                <CheckCircle2 size={20} className="text-white" />
              </div>

              {/* Control Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedGame === 'matching') startMatchingGame();
                    else startClozeGame();
                  }}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw size={15} /> Chơi lại màn này
                </button>
                <button
                  type="button"
                  onClick={resetSuite}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gamepad2 size={15} /> Đổi game khác
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
