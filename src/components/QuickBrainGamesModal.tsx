import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Zap, SortAsc, Target, HeartPulse, Heart, Trophy, RefreshCw, 
  CheckCircle2, AlertCircle, Clock, Sparkles, Flame, HelpCircle, 
  RotateCcw, ArrowLeft, Lightbulb, Volume2, Award, Check, ChevronRight
} from 'lucide-react';
import { StudySet, Card } from '../types';
import { trackStudyActivity } from '../utils/analytics';

interface QuickBrainGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  studySetData: StudySet;
  initialGameMode?: 'true_false' | 'word_scramble' | 'hangman' | null;
  onGameComplete?: (stats: { gameMode: string; score: number; timeTaken: number }) => void;
}

// Web Audio API Synth for instant, rich audio feedback
function playAudioSound(type: 'success' | 'error' | 'combo' | 'victory') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'combo') {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.15);
      });
    } else if (type === 'victory') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
      });
    }
  } catch (e) {
    // Ignore autoplay restriction errors
  }
}

// Interfaces
interface TrueFalseQuestion {
  id: string;
  term: string;
  displayDefinition: string;
  isTrue: boolean;
  originalDefinition: string;
}

interface WordScrambleItem {
  id: string;
  term: string;
  definition: string;
  aiHint: string;
  exampleSentence?: string;
}

interface HangmanItem {
  id: string;
  term: string;
  definition: string;
  aiHint: string;
  revealLetterHint?: string;
}

export const QuickBrainGamesModal: React.FC<QuickBrainGamesModalProps> = ({
  isOpen,
  onClose,
  studySetData,
  initialGameMode = null,
  onGameComplete
}) => {
  const [activeGame, setActiveGame] = useState<'true_false' | 'word_scramble' | 'hangman' | null>(initialGameMode);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiAssistLoading, setAiAssistLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Common stats
  const [score, setScore] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // GAME 1: Speed True/False State
  const [tfQuestions, setTfQuestions] = useState<TrueFalseQuestion[]>([]);
  const [tfIndex, setTfIndex] = useState<number>(0);
  const [tfLives, setTfLives] = useState<number>(3);
  const [tfTimerProgress, setTfTimerProgress] = useState<number>(100);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [tfFeedback, setTfFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [tfHintText, setTfHintText] = useState<string | null>(null);

  // GAME 2: Word Scramble State
  const [scrambleItems, setScrambleItems] = useState<WordScrambleItem[]>([]);
  const [scrambleIndex, setScrambleIndex] = useState<number>(0);
  const [scrambledLetters, setScrambledLetters] = useState<Array<{ id: number; char: string; isUsed: boolean }>>([]);
  const [placedLetters, setPlacedLetters] = useState<Array<{ letterId: number; char: string }>>([]);
  const [showAiHintModal, setShowAiHintModal] = useState<boolean>(false);
  const [scrambleStatus, setScrambleStatus] = useState<'normal' | 'correct' | 'wrong'>('normal');
  const [scrambleAiHintText, setScrambleAiHintText] = useState<string | null>(null);

  // GAME 3: Hangman Survival State
  const [hangmanItems, setHangmanItems] = useState<HangmanItem[]>([]);
  const [hangmanIndex, setHangmanIndex] = useState<number>(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [hangmanLives, setHangmanLives] = useState<number>(6);
  const [usedAiAssist, setUsedAiAssist] = useState<boolean>(false);
  const [hangmanAiHintText, setHangmanAiHintText] = useState<string | null>(null);

  // Timer reference
  const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tfCountdownRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Sync initial game mode when changed externally
  useEffect(() => {
    if (initialGameMode && isOpen) {
      setActiveGame(initialGameMode);
    }
  }, [initialGameMode, isOpen]);

  // Main game timer
  useEffect(() => {
    if (activeGame && !isFinished) {
      mainTimerRef.current = setInterval(() => {
        setTimeTaken(prev => prev + 1);
      }, 1000);
    } else {
      if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    }
    return () => {
      if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    };
  }, [activeGame, isFinished]);

  // Instant 0.1s Game Startup using Local JS from studySetData.cards
  useEffect(() => {
    if (activeGame && isOpen) {
      setIsLoadingAi(false);
      setIsFinished(false);
      setScore(0);
      setTimeTaken(0);
      setTfHintText(null);
      setScrambleAiHintText(null);
      setHangmanAiHintText(null);
      setupLocalFallbackData(activeGame, studySetData?.cards || []);
    }
  }, [activeGame, isOpen, studySetData]);

  // Speed True/False Countdown timer
  useEffect(() => {
    if (activeGame === 'true_false' && !isFinished && tfQuestions.length > 0 && !tfFeedback) {
      setTfTimerProgress(100);
      const startTime = Date.now();
      const DURATION = 4000; // 4 seconds per question

      tfCountdownRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remainingPct = Math.max(0, 100 - (elapsed / DURATION) * 100);
        setTfTimerProgress(remainingPct);

        if (elapsed >= DURATION) {
          if (tfCountdownRef.current) clearInterval(tfCountdownRef.current);
          handleTrueFalseAnswer(null); // Time expired -> Count as wrong
        }
      }, 50);

      return () => {
        if (tfCountdownRef.current) clearInterval(tfCountdownRef.current);
      };
    }
  }, [activeGame, tfIndex, tfQuestions, isFinished, tfFeedback]);

  // On-demand Gemini AI Assist Handler
  const requestAiAssist = async (gameType: 'true_false' | 'word_scramble' | 'hangman') => {
    if (aiAssistLoading) return;
    setAiAssistLoading(true);

    let currentTerm = '';
    let currentDefinition = '';
    let currentDisplayDef = '';
    let currentIsTrue = false;

    if (gameType === 'true_false') {
      const q = tfQuestions[tfIndex];
      if (!q) { setAiAssistLoading(false); return; }
      currentTerm = q.term;
      currentDefinition = q.originalDefinition;
      currentDisplayDef = q.displayDefinition;
      currentIsTrue = q.isTrue;
    } else if (gameType === 'word_scramble') {
      const item = scrambleItems[scrambleIndex];
      if (!item) { setAiAssistLoading(false); return; }
      currentTerm = item.term;
      currentDefinition = item.definition;
    } else if (gameType === 'hangman') {
      const item = hangmanItems[hangmanIndex];
      if (!item) { setAiAssistLoading(false); return; }
      currentTerm = item.term;
      currentDefinition = item.definition;
    }

    try {
      const res = await fetch('/api/game-ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType,
          term: currentTerm,
          definition: currentDefinition,
          displayDefinition: currentDisplayDef,
          isTrue: currentIsTrue,
          title: studySetData?.title || (studySetData as any)?.name || 'Học tập'
        })
      });

      if (!res.ok) {
        throw new Error('AI Assist API returned non-OK status');
      }

      const data = await res.json();
      const hint = data.hint || `Gợi ý: Thuật ngữ này có nghĩa là "${currentDefinition}"`;

      if (gameType === 'true_false') {
        setTfHintText(hint);
      } else if (gameType === 'word_scramble') {
        setScrambleAiHintText(data.exampleSentence ? `${hint} (${data.exampleSentence})` : hint);
        setShowAiHintModal(true);
      } else if (gameType === 'hangman') {
        const targetTermUpper = currentTerm.toUpperCase();
        const unrevealedLetters = targetTermUpper
          .split('')
          .filter(ch => /[A-Z0-9]/i.test(ch) && !guessedLetters.has(ch));

        if (unrevealedLetters.length > 0) {
          const revealedChar = unrevealedLetters[0];
          handleGuessLetter(revealedChar);
          setHangmanAiHintText(`AI Cứu trợ: Mở khóa chữ '${revealedChar}'! ${hint}`);
        } else {
          setHangmanAiHintText(`AI Cứu trợ: ${hint}`);
        }
        setUsedAiAssist(true);
      }
    } catch (err) {
      console.warn("Gemini AI Assist failed, falling back to local hint:", err);
      showToast("Gemini đang bận, thử lại sau nhé!");

      // Local Fallback hint
      if (gameType === 'true_false') {
        setTfHintText(`Gợi ý local: Thuật ngữ "${currentTerm}" có định nghĩa thực sự là "${currentDefinition}".`);
      } else if (gameType === 'word_scramble') {
        setScrambleAiHintText(`Gợi ý local: Từ "${currentTerm}" gồm ${currentTerm.length} ký tự, nghĩa là: "${currentDefinition}".`);
        setShowAiHintModal(true);
      } else if (gameType === 'hangman') {
        const targetTermUpper = currentTerm.toUpperCase();
        const unrevealedLetters = targetTermUpper
          .split('')
          .filter(ch => /[A-Z0-9]/i.test(ch) && !guessedLetters.has(ch));

        if (unrevealedLetters.length > 0) {
          const revealedChar = unrevealedLetters[0];
          handleGuessLetter(revealedChar);
          setHangmanAiHintText(`Gợi ý local: Mở khóa chữ '${revealedChar}'. Thuật ngữ có nghĩa: "${currentDefinition}".`);
        } else {
          setHangmanAiHintText(`Gợi ý local: "${currentDefinition}"`);
        }
        setUsedAiAssist(true);
      }
    } finally {
      setAiAssistLoading(false);
    }
  };

  // Setup state using local fallback
  const setupLocalFallbackData = (mode: string, rawCards: Card[]) => {
    const shuffled = [...rawCards].sort(() => 0.5 - Math.random());

    if (mode === 'true_false') {
      const questions: TrueFalseQuestion[] = shuffled.map((c, idx) => {
        const isTrue = idx % 2 === 0;
        const wrongCard = shuffled[(idx + 1) % shuffled.length];
        return {
          id: `tf_${idx}`,
          term: c.term,
          displayDefinition: isTrue ? c.definition : wrongCard.definition,
          isTrue,
          originalDefinition: c.definition
        };
      });
      setTfQuestions(questions);
      setTfIndex(0);
      setTfLives(3);
      setComboStreak(0);
      setMaxCombo(0);
      setTfHintText(null);
    } else if (mode === 'word_scramble') {
      const items: WordScrambleItem[] = shuffled.map((c, idx) => ({
        id: `ws_${idx}`,
        term: c.term,
        definition: c.definition,
        aiHint: `Từ có ${c.term.length} ký tự, nghĩa là: ${c.definition}`,
        exampleSentence: c.example || `Từ gợi ý: ${c.definition}`
      }));
      setScrambleItems(items);
      setScrambleIndex(0);
      if (items.length > 0) initWordScrambleRound(items[0]);
    } else if (mode === 'hangman') {
      const items: HangmanItem[] = shuffled.map((c, idx) => ({
        id: `hm_${idx}`,
        term: c.term,
        definition: c.definition,
        aiHint: `Thuật ngữ gồm ${c.term.length} chữ cái`,
        revealLetterHint: `Chữ cái đầu tiên là '${c.term.charAt(0).toUpperCase()}'`
      }));
      setHangmanItems(items);
      setHangmanIndex(0);
      if (items.length > 0) initHangmanRound(items[0]);
    }
  };

  // Reset current suite
  const resetGameSelection = () => {
    setActiveGame(null);
    setIsFinished(false);
    setScore(0);
    setTimeTaken(0);
    if (tfCountdownRef.current) clearInterval(tfCountdownRef.current);
  };

  // Trigger game complete
  const finishGame = (mode: string, finalScore?: number) => {
    setIsFinished(true);
    playAudioSound('victory');
    const calculatedScore = finalScore !== undefined ? finalScore : score;
    setScore(calculatedScore);

    // Save streak
    trackStudyActivity(1);

    if (onGameComplete) {
      onGameComplete({
        gameMode: mode,
        score: calculatedScore,
        timeTaken
      });
    }
  };

  // ==========================================
  // GAME 1 LOGIC: SPEED TRUE/FALSE
  // ==========================================
  const handleTrueFalseAnswer = (userAnswer: boolean | null) => {
    if (tfFeedback || isFinished) return;
    if (tfCountdownRef.current) clearInterval(tfCountdownRef.current);

    const currentQ = tfQuestions[tfIndex];
    if (!currentQ) return;

    const isCorrect = userAnswer === currentQ.isTrue;

    if (isCorrect) {
      // CORRECT ANSWER
      const newCombo = comboStreak + 1;
      setComboStreak(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      const points = newCombo >= 5 ? 20 : 10;
      setScore(s => s + points);
      setTfFeedback('correct');

      if (newCombo >= 5 && newCombo % 5 === 0) {
        playAudioSound('combo');
      } else {
        playAudioSound('success');
      }

      setTimeout(() => {
        setTfFeedback(null);
        setTfHintText(null);
        if (tfIndex + 1 < tfQuestions.length) {
          setTfIndex(idx => idx + 1);
        } else {
          finishGame('true_false');
        }
      }, 400);

    } else {
      // WRONG ANSWER OR TIMEOUT
      playAudioSound('error');
      setComboStreak(0);
      setTfFeedback('wrong');

      const nextLives = tfLives - 1;
      setTfLives(nextLives);

      setTimeout(() => {
        setTfFeedback(null);
        setTfHintText(null);
        if (nextLives <= 0 || tfIndex + 1 >= tfQuestions.length) {
          finishGame('true_false');
        } else {
          setTfIndex(idx => idx + 1);
        }
      }, 500);
    }
  };

  // ==========================================
  // GAME 2 LOGIC: WORD SCRAMBLE AI
  // ==========================================
  const initWordScrambleRound = (item: WordScrambleItem) => {
    const rawChars = item.term.split('');
    const lettersObj = rawChars.map((char, index) => ({
      id: index,
      char,
      isUsed: false
    })).sort(() => 0.5 - Math.random());

    setScrambledLetters(lettersObj);
    setPlacedLetters([]);
    setScrambleStatus('normal');
    setShowAiHintModal(false);
    setScrambleAiHintText(null);
  };

  const handleSelectScrambleLetter = (letterItem: { id: number; char: string; isUsed: boolean }) => {
    if (letterItem.isUsed || scrambleStatus === 'correct') return;

    // Mark as used in bank
    setScrambledLetters(prev => prev.map(l => l.id === letterItem.id ? { ...l, isUsed: true } : l));

    // Append to placed letters
    const updatedPlaced = [...placedLetters, { letterId: letterItem.id, char: letterItem.char }];
    setPlacedLetters(updatedPlaced);

    // Auto-check if all letters placed
    if (updatedPlaced.length === scrambledLetters.length) {
      checkScrambleAnswer(updatedPlaced);
    }
  };

  const handleRemovePlacedLetter = (indexToRemove: number) => {
    if (scrambleStatus === 'correct') return;
    const itemToRemove = placedLetters[indexToRemove];
    if (!itemToRemove) return;

    // Unmark in bank
    setScrambledLetters(prev => prev.map(l => l.id === itemToRemove.letterId ? { ...l, isUsed: false } : l));

    // Remove from placed
    setPlacedLetters(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setScrambleStatus('normal');
  };

  const handleClearScramble = () => {
    setScrambledLetters(prev => prev.map(l => ({ ...l, isUsed: false })));
    setPlacedLetters([]);
    setScrambleStatus('normal');
  };

  const checkScrambleAnswer = (currentPlaced: Array<{ letterId: number; char: string }>) => {
    const currentWord = currentPlaced.map(p => p.char).join('');
    const targetWord = scrambleItems[scrambleIndex].term;

    if (currentWord.trim().toLowerCase() === targetWord.trim().toLowerCase()) {
      // CORRECT
      setScrambleStatus('correct');
      playAudioSound('success');
      setScore(s => s + 15);

      setTimeout(() => {
        if (scrambleIndex + 1 < scrambleItems.length) {
          const nextIdx = scrambleIndex + 1;
          setScrambleIndex(nextIdx);
          initWordScrambleRound(scrambleItems[nextIdx]);
        } else {
          finishGame('word_scramble');
        }
      }, 700);

    } else {
      // WRONG
      setScrambleStatus('wrong');
      playAudioSound('error');
    }
  };

  // ==========================================
  // GAME 3 LOGIC: HANGMAN SURVIVAL
  // ==========================================
  const initHangmanRound = (item: HangmanItem) => {
    setGuessedLetters(new Set());
    setHangmanLives(6);
    setUsedAiAssist(false);
    setHangmanAiHintText(null);
  };

  const handleGuessLetter = (letter: string) => {
    if (isFinished || hangmanLives <= 0) return;
    const upper = letter.toUpperCase();

    if (guessedLetters.has(upper)) return;

    const newSet = new Set(guessedLetters);
    newSet.add(upper);
    setGuessedLetters(newSet);

    const targetTermUpper = hangmanItems[hangmanIndex].term.toUpperCase();

    if (targetTermUpper.includes(upper)) {
      // CORRECT GUESS
      playAudioSound('success');

      // Check if word complete
      const isWordComplete = targetTermUpper.split('').every(ch => {
        if (ch === ' ' || ch === '-' || ch === '/' || ch === '_') return true;
        return newSet.has(ch);
      });

      if (isWordComplete) {
        setScore(s => s + 20);
        playAudioSound('victory');

        setTimeout(() => {
          if (hangmanIndex + 1 < hangmanItems.length) {
            const nextIdx = hangmanIndex + 1;
            setHangmanIndex(nextIdx);
            initHangmanRound(hangmanItems[nextIdx]);
          } else {
            finishGame('hangman');
          }
        }, 800);
      }

    } else {
      // WRONG GUESS
      playAudioSound('error');
      const nextLives = hangmanLives - 1;
      setHangmanLives(nextLives);

      if (nextLives <= 0) {
        // LOSE
        setTimeout(() => {
          finishGame('hangman');
        }, 500);
      }
    }
  };

  const handleAiAssistHangman = () => {
    if (usedAiAssist || hangmanLives >= 3) return;
    setUsedAiAssist(true);

    const currentItem = hangmanItems[hangmanIndex];
    const targetTermUpper = currentItem.term.toUpperCase();

    // Reveal 1 unrevealed correct letter
    const unrevealedLetters = targetTermUpper
      .split('')
      .filter(ch => /[A-Z0-9]/i.test(ch) && !guessedLetters.has(ch));

    if (unrevealedLetters.length > 0) {
      const revealedChar = unrevealedLetters[0];
      handleGuessLetter(revealedChar);
      setHangmanAiHintText(`AI Cứu trợ: Đã mở khóa chữ cái '${revealedChar}'! ${currentItem.revealLetterHint || ''}`);
    } else {
      setHangmanAiHintText(currentItem.aiHint || currentItem.definition);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white w-[95vw] max-w-2xl h-[90vh] max-h-[850px] rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {activeGame ? (
              <button
                onClick={resetGameSelection}
                className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Quay lại chọn trò chơi"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Trò chơi khác</span>
              </button>
            ) : (
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-inner text-white">
                <Zap size={20} className="animate-pulse" />
              </div>
            )}

            <div>
              <h2 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-1.5 sm:gap-2">
                <span>Trò Chơi Trí Tuệ 🔥</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono bg-indigo-400/20 text-indigo-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Quick Brain
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium line-clamp-1 max-w-[180px] sm:max-w-xs">
                {studySetData.title || (studySetData as any).name || 'Bộ Thẻ Học Tập'} ({studySetData.cards?.length || 0} thuật ngữ)
              </p>
            </div>
          </div>

          {/* Timer & Score in active game */}
          {activeGame && !isFinished && (
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

        {/* MODAL BODY WITH SAFE AREA BOTTOM PADDING & HIDDEN SCROLLBAR */}
        <div className="flex-1 bg-slate-50/70 p-3 sm:p-6 overflow-y-auto no-scrollbar relative pb-8 sm:pb-6">


          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="sticky top-2 z-50 max-w-sm mx-auto bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 text-xs font-bold flex items-center justify-center gap-2 animate-bounce my-2">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* =================================================== */}
          {/* SELECTION SCREEN: CHỌN 1 TRONG 3 MINI GAME         */}
          {/* =================================================== */}
          {!activeGame && (
            <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  <Sparkles size={14} /> Bộ 3 Mini-game Phản Xạ AI
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-850 tracking-tight">
                  Tăng tốc trí nhớ & Phản xạ ngôn ngữ
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto">
                  Thử thách phản xạ nhanh, suy luận ngữ cảnh từ gợi ý Gemini AI và chinh phục các mức điểm thưởng XP hấp dẫn!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* GAME 1 CARD */}
                <div
                  onClick={() => setActiveGame('true_false')}
                  className="group relative bg-white p-6 rounded-3xl border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Zap size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg">
                        Speed 4s
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-850 group-hover:text-amber-600 transition-colors">
                        Đúng Hay Sai Chớp Nhoáng ⚡
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Phản xạ 4 giây/câu! Quyết định Thuật ngữ & Định nghĩa ghép ĐÚNG hay SAI. Chuỗi đúng 5 câu x2 điểm!
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-600">
                    <span>Thách thức ngay →</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* GAME 2 CARD */}
                <div
                  onClick={() => setActiveGame('word_scramble')}
                  className="group relative bg-white p-6 rounded-3xl border-2 border-slate-200 hover:border-indigo-600 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <SortAsc size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-lg">
                        Scramble
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-850 group-hover:text-indigo-600 transition-colors">
                        Sắp Xếp Chữ Cái 🔤
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Chữ cái xáo trộn cần xếp lại đúng từ gốc. Sử dụng Gợi ý Gemini AI 💡 đục lỗ câu ví dụ khi cần!
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-indigo-600">
                    <span>Xếp chữ ngay →</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* GAME 3 CARD */}
                <div
                  onClick={() => setActiveGame('hangman')}
                  className="group relative bg-white p-6 rounded-3xl border-2 border-slate-200 hover:border-rose-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <Target size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded-lg">
                        6 Lives ❤️
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-850 group-hover:text-rose-600 transition-colors">
                        Đoán Chữ Cứu Mạng 🎯
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Thử thách Hangman 6 trái tim. Đoán ký tự đúng trước khi hết mạng. Gọi AI Cứu Trợ 🤖 khi nguy cấp!
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-rose-600">
                    <span>Đoán chữ cứu mạng →</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 text-xs text-indigo-900">
                <Flame size={20} className="text-amber-500 shrink-0 animate-bounce" />
                <span>
                  <strong>AI Sinh Đề & Thử Thách Thông Minh:</strong> Nội dung game được Gemini AI biên soạn các định nghĩa bẫy và câu gợi ý ngữ cảnh độc đáo giúp nâng cao hiệu quả nhớ lâu!
                </span>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* GAME 1: SPEED TRUE/FALSE ("ĐÚNG HAY SAI CHỚP NHOÁNG") */}
          {/* =================================================== */}
          {activeGame === 'true_false' && !isFinished && (
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-between space-y-6 animate-fade-in">
              {isLoadingAi ? (
                <div className="py-20 text-center space-y-4 my-auto">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Gemini AI đang tạo câu hỏi trắc nghiệm bẫy Đúng/Sai...</p>
                </div>
              ) : tfQuestions.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <AlertCircle size={40} className="text-amber-500 mx-auto" />
                  <p className="text-sm font-bold">Không đủ dữ liệu thẻ bài để tạo game!</p>
                </div>
              ) : (
                <>
                  {/* Top Status Bar: Question Counter, Combo Streak, Lives */}
                  <div className="flex items-center justify-between bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-bold text-slate-600">
                      <span>Câu {tfIndex + 1}/{tfQuestions.length}</span>
                    </div>

                    {/* Combo Streak Counter */}
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-extrabold">
                      <Flame size={14} className={comboStreak >= 5 ? "text-orange-500 animate-bounce" : "text-amber-500"} />
                      <span>Combo x{comboStreak} {comboStreak >= 5 && '🔥 (x2)'}</span>
                    </div>

                    {/* Lives Hearts */}
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      {[1, 2, 3].map(heartNum => (
                        <Heart
                          key={heartNum}
                          size={16}
                          className={heartNum <= tfLives ? "text-rose-500 fill-rose-500" : "text-slate-200 fill-slate-200"}
                        />
                      ))}
                    </div>
                  </div>

                  {/* COUNTDOWN TIMER BAR (4 SECONDS) */}
                  <div className="w-full bg-slate-200 h-2 sm:h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-75 ${
                        tfTimerProgress > 50 ? 'bg-emerald-500' : tfTimerProgress > 25 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                      }`}
                      style={{ width: `${tfTimerProgress}%` }}
                    />
                  </div>

                  {/* QUESTION CARD */}
                  <div className={`bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl border-2 transition-all duration-200 shadow-md text-center space-y-4 my-auto ${
                    tfFeedback === 'correct'
                      ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-400/20 scale-102'
                      : tfFeedback === 'wrong'
                      ? 'border-rose-500 bg-rose-50/40 ring-4 ring-rose-400/20 animate-shake'
                      : 'border-slate-200'
                  }`}>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        Thuật ngữ (Term)
                      </span>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-850 mt-2 tracking-tight break-words px-2">
                        {tfQuestions[tfIndex]?.term}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Định nghĩa hiển thị (Definition)
                      </span>
                      <p className="text-sm sm:text-base md:text-lg font-medium text-slate-700 mt-1.5 leading-relaxed break-words px-2">
                        "{tfQuestions[tfIndex]?.displayDefinition}"
                      </p>
                    </div>
                  </div>

                  {/* AI Hint Banner in True/False */}
                  {tfHintText && (
                    <div className="bg-indigo-50 border border-indigo-200 p-2.5 px-3.5 rounded-xl text-xs text-indigo-900 font-bold flex items-center gap-2 animate-fade-in my-1">
                      <Sparkles size={15} className="text-indigo-600 shrink-0 animate-bounce" />
                      <span className="break-words">{tfHintText}</span>
                    </div>
                  )}

                  <div className="flex justify-end my-1">
                    <button
                      type="button"
                      onClick={() => requestAiAssist('true_false')}
                      disabled={aiAssistLoading}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-60 active:scale-95"
                    >
                      {aiAssistLoading ? (
                        <RefreshCw size={13} className="animate-spin text-indigo-600" />
                      ) : (
                        <Sparkles size={13} className="text-indigo-600" />
                      )}
                      <span>{aiAssistLoading ? 'AI đang suy nghĩ...' : 'Gợi ý Gemini AI 🤖'}</span>
                    </button>
                  </div>

                  {/* ACTION BUTTONS: TRUE or FALSE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTrueFalseAnswer(true)}
                      disabled={Boolean(tfFeedback)}
                      className="min-h-[56px] py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white rounded-2xl font-black text-base sm:text-lg shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 size={22} />
                      <span>ĐÚNG (TRUE)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTrueFalseAnswer(false)}
                      disabled={Boolean(tfFeedback)}
                      className="min-h-[56px] py-3.5 sm:py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 text-white rounded-2xl font-black text-base sm:text-lg shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                    >
                      <X size={22} />
                      <span>SAI (FALSE)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* GAME 2: WORD SCRAMBLE AI ("SẮP XẾP CHỮ CÁI")       */}
          {/* =================================================== */}
          {activeGame === 'word_scramble' && !isFinished && (
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-between space-y-6 animate-fade-in">
              {isLoadingAi ? (
                <div className="py-20 text-center space-y-4 my-auto">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Gemini AI đang sinh từ vựng xáo trộn & gợi ý...</p>
                </div>
              ) : scrambleItems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <AlertCircle size={40} className="text-indigo-500 mx-auto" />
                  <p className="text-sm font-bold">Không đủ dữ liệu thẻ bài để tạo game!</p>
                </div>
              ) : (
                <>
                  {/* Top Bar: Item count & Score */}
                  <div className="flex items-center justify-between bg-white p-3 px-4 rounded-xl sm:rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                    <span>Từ {scrambleIndex + 1} / {scrambleItems.length}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!scrambleAiHintText) {
                          requestAiAssist('word_scramble');
                        } else {
                          setShowAiHintModal(!showAiHintModal);
                        }
                      }}
                      disabled={aiAssistLoading}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition flex items-center gap-1.5 font-extrabold cursor-pointer disabled:opacity-60 border border-indigo-200 text-[11px] sm:text-xs active:scale-95"
                    >
                      {aiAssistLoading ? (
                        <RefreshCw size={14} className="animate-spin text-indigo-600" />
                      ) : (
                        <Lightbulb size={15} className="text-amber-500 animate-pulse" />
                      )}
                      <span>{aiAssistLoading ? 'AI đang suy nghĩ...' : 'Gợi ý Gemini AI 💡'}</span>
                    </button>
                  </div>

                  {/* AI Hint Banner Popup */}
                  {showAiHintModal && (
                    <div className="bg-amber-50 border border-amber-200 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-xs text-amber-900 space-y-1.5 animate-fade-in">
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                        <Sparkles size={14} /> Gợi ý ngữ cảnh từ AI:
                      </div>
                      <p className="leading-relaxed break-words">
                        {scrambleAiHintText || scrambleItems[scrambleIndex]?.aiHint}
                      </p>
                      {scrambleItems[scrambleIndex]?.exampleSentence && !scrambleAiHintText && (
                        <p className="italic text-amber-800/80 mt-1 border-t border-amber-200/60 pt-1 break-words">
                          "{scrambleItems[scrambleIndex]?.exampleSentence}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* DEFINITION DISPLAY CARD */}
                  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-sm space-y-1.5 text-center">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      Định nghĩa (Definition)
                    </span>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800 pt-1 leading-relaxed break-words">
                      "{scrambleItems[scrambleIndex]?.definition}"
                    </p>
                  </div>

                  {/* ANSWER PLACED SLOTS ZONE */}
                  <div className="space-y-2 text-center">
                    <div className="text-[10px] uppercase font-mono font-extrabold text-slate-400">
                      Từ cần xếp ({scrambledLetters.length} chữ cái):
                    </div>

                    <div className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[64px] sm:min-h-[72px] bg-white rounded-2xl sm:rounded-3xl border-2 transition-all ${
                      scrambleStatus === 'correct'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-4 ring-emerald-400/20'
                        : scrambleStatus === 'wrong'
                        ? 'border-rose-500 bg-rose-50/50 animate-shake shadow-md ring-4 ring-rose-400/20'
                        : 'border-slate-200'
                    }`}>
                      {scrambledLetters.map((_, idx) => {
                        const placed = placedLetters[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (placed) handleRemovePlacedLetter(idx);
                            }}
                            className={`w-9 h-11 sm:w-11 sm:h-13 rounded-xl sm:rounded-2xl border-2 font-black text-base sm:text-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs select-none shrink-0 ${
                              placed
                                ? scrambleStatus === 'correct'
                                  ? 'bg-emerald-600 text-white border-emerald-500 scale-105'
                                  : scrambleStatus === 'wrong'
                                  ? 'bg-rose-500 text-white border-rose-600'
                                  : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700'
                                : 'bg-slate-100/70 border-dashed border-slate-300 text-transparent'
                            }`}
                          >
                            {placed ? placed.char : '_'}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SCRAMBLED LETTER PILLS (NGÂN HÀNG CHỮ CÁI) */}
                  <div className="bg-slate-100/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-2.5">
                    <div className="text-[11px] sm:text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                      <span>Các chữ cái bị xáo trộn:</span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">Chạm để chọn xếp chữ</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                      {scrambledLetters.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          disabled={item.isUsed || scrambleStatus === 'correct'}
                          onClick={() => handleSelectScrambleLetter(item)}
                          className={`min-w-[38px] sm:min-w-[44px] h-10 sm:h-12 px-2.5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all duration-150 cursor-pointer shadow-2xs border select-none flex items-center justify-center ${
                            item.isUsed
                              ? 'bg-slate-200/50 text-slate-400 border-slate-200 opacity-40 cursor-not-allowed scale-90'
                              : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-200 hover:border-indigo-400 active:scale-95'
                          }`}
                        >
                          {item.char}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Control Buttons: Clear */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleClearScramble}
                      className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <RotateCcw size={14} /> Xóa / Làm lại
                    </button>

                    <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                      Bấm chữ đã điền để xóa vị trí đó
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* GAME 3: HANGMAN SURVIVAL ("ĐOÁN CHỮ CỨU MẠNG")       */}
          {/* =================================================== */}
          {activeGame === 'hangman' && !isFinished && (
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-between space-y-4 animate-fade-in">
              {isLoadingAi ? (
                <div className="py-20 text-center space-y-4 my-auto">
                  <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Gemini AI đang sinh câu đố Hangman...</p>
                </div>
              ) : hangmanItems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <AlertCircle size={40} className="text-rose-500 mx-auto" />
                  <p className="text-sm font-bold">Không đủ dữ liệu thẻ bài để tạo game!</p>
                </div>
              ) : (
                <>
                  {/* Top Status Bar: Question Count & 6 Heart Lives */}
                  <div className="flex items-center justify-between bg-white p-3 px-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-bold text-slate-700">
                      Từ {hangmanIndex + 1} / {hangmanItems.length}
                    </span>

                    {/* 6 Heart Lives */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6].map(hNum => (
                        <Heart
                          key={hNum}
                          size={16}
                          className={hNum <= hangmanLives ? "text-rose-500 fill-rose-500 animate-pulse" : "text-slate-200 fill-slate-200"}
                        />
                      ))}
                    </div>
                  </div>

                  {/* DEFINITION CARD */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-sm space-y-1.5 text-center">
                    <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                      Định nghĩa (Definition)
                    </span>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800 pt-1 leading-relaxed break-words">
                      "{hangmanItems[hangmanIndex]?.definition}"
                    </p>
                  </div>

                  {/* AI ASSIST BANNER & BUTTON */}
                  {hangmanAiHintText ? (
                    <div className="bg-rose-50 border border-rose-200 p-2.5 px-3.5 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-2 animate-fade-in">
                      <Sparkles size={15} className="text-rose-600 shrink-0 animate-bounce" />
                      <span className="break-words">{hangmanAiHintText}</span>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => requestAiAssist('hangman')}
                        disabled={aiAssistLoading}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                          aiAssistLoading
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md hover:opacity-95 animate-pulse'
                        }`}
                        title="Cứu trợ Gemini AI"
                      >
                        {aiAssistLoading ? (
                          <RefreshCw size={14} className="animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        <span>{aiAssistLoading ? 'AI đang suy nghĩ...' : 'Cứu trợ Gemini AI 🤖'}</span>
                      </button>
                    </div>
                  )}

                  {/* WORD CHARACTERS BLANK DISPLAY */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 min-h-[64px] sm:min-h-[76px]">
                    {hangmanItems[hangmanIndex]?.term.split('').map((char, cIdx) => {
                      const isNonAlpha = !/[A-Z0-9]/i.test(char);
                      const isGuessed = isNonAlpha || guessedLetters.has(char.toUpperCase());

                      return (
                        <div
                          key={cIdx}
                          className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl sm:rounded-2xl border-2 font-black text-base sm:text-lg flex items-center justify-center transition-all shrink-0 ${
                            isNonAlpha
                              ? 'bg-slate-100 border-slate-200 text-slate-600'
                              : isGuessed
                              ? 'bg-rose-600 text-white border-rose-600 scale-105 shadow-2xs'
                              : 'bg-slate-50 border-dashed border-slate-300 text-transparent'
                          }`}
                        >
                          {isGuessed ? char.toUpperCase() : '_'}
                        </div>
                      );
                    })}
                  </div>

                  {/* VIRTUAL ALPHABET KEYBOARD (A-Z) */}
                  <div className="bg-slate-100/90 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-1.5">
                    <div className="text-[10px] font-black uppercase text-slate-400 text-center">
                      Bàn phím chọn chữ cái:
                    </div>

                    <div className="grid grid-cols-7 sm:grid-cols-9 gap-1 sm:gap-1.5 max-w-lg mx-auto">
                      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(letter => {
                        const isUsed = guessedLetters.has(letter);
                        const isCorrectInTerm = hangmanItems[hangmanIndex]?.term.toUpperCase().includes(letter);

                        return (
                          <button
                            key={letter}
                            type="button"
                            disabled={isUsed || hangmanLives <= 0}
                            onClick={() => handleGuessLetter(letter)}
                            className={`h-9 sm:h-11 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all duration-150 cursor-pointer shadow-2xs border flex items-center justify-center select-none active:scale-95 ${
                              isUsed
                                ? isCorrectInTerm
                                  ? 'bg-emerald-600 text-white border-emerald-600 opacity-60 cursor-not-allowed'
                                  : 'bg-slate-300 text-slate-500 border-slate-300 opacity-40 cursor-not-allowed line-through'
                                : 'bg-white hover:bg-rose-50 text-slate-800 border-slate-200 hover:border-rose-400'
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* VIEW: GAME FINISHED / SUMMARY                      */}
          {/* =================================================== */}
          {activeGame && isFinished && (
            <div className="max-w-md mx-auto py-8 sm:py-12 text-center space-y-6 animate-scale-up">
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl rotate-3">
                <Trophy size={42} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  🎉 Hoàn thành lượt chơi!
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-850">
                  {activeGame === 'true_false'
                    ? 'Đúng Hay Sai Chớp Nhoáng'
                    : activeGame === 'word_scramble'
                    ? 'Sắp Xếp Chữ Cái Master'
                    : 'Đoán Chữ Cứu Mạng Hangman'}
                </h3>
                <p className="text-xs text-slate-500">
                  Bạn đã xuất sắc ghi nhớ lượng từ vựng tuyệt vời từ bài học này!
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
                    <span className="text-[11px] text-amber-100">Đã thắp sáng tiến độ trên hệ thống!</span>
                  </div>
                </div>
                <CheckCircle2 size={20} className="text-white" />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFinished(false);
                    setScore(0);
                    setTimeTaken(0);
                    setupLocalFallbackData(activeGame, studySetData?.cards || []);
                  }}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw size={15} /> Chơi lại màn này
                </button>
                <button
                  type="button"
                  onClick={resetGameSelection}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap size={15} /> Đổi game khác
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
