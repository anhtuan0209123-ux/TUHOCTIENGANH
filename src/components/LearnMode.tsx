import React, { useState, useEffect } from 'react';
import { Card, StudySet } from '../types';
import { ArrowLeft, Sparkles, AlertCircle, CheckCircle, RefreshCcw, ThumbsUp, Loader2, Shuffle, Infinity } from 'lucide-react';
import { trackStudyActivity } from '../utils/analytics';
import { checkAnswerSmart, maskTermInExample, getCleanExample } from '../utils/stringMatcher';

interface LearnModeProps {
  set: StudySet;
  onBack: () => void;
  onUpdateSet?: (updatedSet: StudySet) => void;
}

interface Question {
  card: Card;
  promptText: string;
  correctAnswer: string;
  options: string[];
  originalDirection: 'vi-to-en' | 'en-to-vi' | 'translate-sentence';
  isDoubleReview?: boolean;
  forcedSubMode?: 'multiple-choice' | 'type-to-learn' | 'fill-blanks' | 'translate-sentence';
  isReinforcement?: boolean;
}

export const LearnMode: React.FC<LearnModeProps> = ({ set, onBack, onUpdateSet }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [showSummary, setShowSummary] = useState(false);

  // Spelling reinforcement on multiple-choice incorrect answers
  const [reinforceSuccess, setReinforceSuccess] = useState(true);
  const [reinforceTypedCount, setReinforceTypedCount] = useState(0);
  const [reinforceInputValue, setReinforceInputValue] = useState('');

  // Gemini AI daily-life example sentences
  const [geminiSentences, setGeminiSentences] = useState<{ sentence: string; translation: string }[]>([]);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);

  // Type to Learn Sub-mode properties
  const [studySubMode, setStudySubMode] = useState<'multiple-choice' | 'type-to-learn' | 'fill-blanks' | 'translate-sentence'>('multiple-choice');
  // Translation Direction: English to Vietnamese (default) or Vietnamese to English or Mixed
  const [studyDirection, setStudyDirection] = useState<'vi-to-en' | 'en-to-vi' | 'mixed'>('en-to-vi');
  const [typedAnswer, setTypedAnswer] = useState('');

  // Continuous and Shuffling Configurations
  const [isShuffled, setIsShuffled] = useState(true);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isTransitioningBatch, setIsTransitioningBatch] = useState(false);
  const [addedCards, setAddedCards] = useState<Card[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [hintMessage, setHintMessage] = useState('');

  // Generate complete learning path
  useEffect(() => {
    generateAllQuestions(false);
  }, [set.cards, studySubMode, studyDirection, isShuffled]);

  const generateAllQuestions = (clearAdded = false) => {
    let activeAdded = addedCards;
    if (clearAdded) {
      activeAdded = [];
      setAddedCards([]);
    }
    const cardsCopy = [...set.cards, ...activeAdded];
    if (cardsCopy.length === 0) return;
    const generated: Question[] = [];

    cardsCopy.forEach((card) => {
      // Determine study direction for this card
      let currentDir: 'vi-to-en' | 'en-to-vi' = 'vi-to-en';
      if (studyDirection === 'en-to-vi') {
        currentDir = 'en-to-vi';
      } else if (studyDirection === 'mixed') {
        currentDir = Math.random() > 0.5 ? 'en-to-vi' : 'vi-to-en';
      }

      // If we are in translate-sentence mode, the direction is sentence translation
      const isTranslateSentence = studySubMode === 'translate-sentence';
      const isFillBlanks = studySubMode === 'fill-blanks';

      let promptText = '';
      let correctAnswer = '';
      let options: string[] = [];

      if (isTranslateSentence) {
        const cleanEx = getCleanExample(card);
        promptText = cleanEx.example;
        correctAnswer = cleanEx.exampleTranslation || card.definition || '';
      } else if (isFillBlanks) {
        const cleanEx = getCleanExample(card);
        promptText = cleanEx.example;
        correctAnswer = card.term;
      } else if (currentDir === 'vi-to-en') {
        // Vietnamese definition to English Term (🇻🇳 ➔ 🇺🇸)
        promptText = card.definition;
        correctAnswer = card.term;

        const otherTerms = cardsCopy.filter((c) => c.id !== card.id).map((c) => c.term);
        const shuffledOthers = [...otherTerms].sort(() => Math.random() - 0.5).slice(0, Math.min(3, otherTerms.length));
        options = [correctAnswer, ...shuffledOthers].sort(() => Math.random() - 0.5);
      } else {
        // English Term to Vietnamese definition (🇺🇸 ➔ 🇻🇳)
        promptText = card.term;
        correctAnswer = card.definition;

        const otherDefs = cardsCopy.filter((c) => c.id !== card.id).map((c) => c.definition);
        const shuffledOthers = [...otherDefs].sort(() => Math.random() - 0.5).slice(0, Math.min(3, otherDefs.length));
        options = [correctAnswer, ...shuffledOthers].sort(() => Math.random() - 0.5);
      }

      if (card.isRepeated && !isTranslateSentence) {
        // Repeated Term: Create DOUBLE review questions (1 MC testing vocabulary term, 1 Active recall)
        const mcPromptText = card.definition;
        const mcCorrectAnswer = card.term;
        const otherTerms = cardsCopy.filter((c) => c.id !== card.id).map((c) => c.term);
        const shuffledOthers = [...otherTerms].sort(() => Math.random() - 0.5).slice(0, Math.min(3, otherTerms.length));
        const mcOptions = [mcCorrectAnswer, ...shuffledOthers].sort(() => Math.random() - 0.5);

        generated.push({
          card,
          promptText: mcPromptText,
          correctAnswer: mcCorrectAnswer,
          options: mcOptions,
          originalDirection: 'vi-to-en',
          isDoubleReview: true,
          forcedSubMode: 'multiple-choice'
        });

        const activeRecallMode: 'fill-blanks' | 'type-to-learn' = 'fill-blanks';
        const cleanEx = getCleanExample(card);
        generated.push({
          card,
          promptText: activeRecallMode === 'fill-blanks' ? cleanEx.example : promptText,
          correctAnswer: activeRecallMode === 'fill-blanks' ? card.term : correctAnswer,
          options,
          originalDirection: currentDir,
          isDoubleReview: true,
          forcedSubMode: activeRecallMode
        });
      } else {
        generated.push({
          card,
          promptText,
          correctAnswer,
          options,
          originalDirection: isTranslateSentence ? 'translate-sentence' : (isFillBlanks ? 'fill-blanks' as any : currentDir)
        });
      }
    });

    // Shuffle questions altogether if enabled, or keep original order
    const finalQuestions = isShuffled ? generated.sort(() => Math.random() - 0.5) : generated;

    setQuestions(finalQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setIsSubmitted(false);
    setScore({ correct: 0, incorrect: 0 });
    setShowSummary(false);
  };

  // Support pressing ENTER key to submit and go to next question conveniently
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSummary || isTransitioningBatch || questions.length === 0) return;

      // Ignore keydown events originating from input or textarea elements to avoid interference with their local handlers
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Enter') {
        const currentQuestion = questions[currentIndex];
        const activeQuestionMode = currentQuestion?.forcedSubMode || studySubMode;

        if (isSubmitted) {
          if (activeQuestionMode !== 'translate-sentence') {
            e.preventDefault();
            handleNext();
          }
        } else {
          if (activeQuestionMode === 'multiple-choice' && selectedAnswer) {
            e.preventDefault();
            handleSubmit();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSummary, isTransitioningBatch, currentIndex, questions, isSubmitted, selectedAnswer, studySubMode]);

  const handleLoadMoreCards = async (isAutoGrow = false) => {
    if (isGeneratingMore) return;
    setIsGeneratingMore(true);
    if (isAutoGrow) {
      setIsTransitioningBatch(true);
    }

    try {
      const currentTerms = [...set.cards, ...addedCards].map(c => c.term);

      const response = await fetch('/api/generate-more-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: set.title,
          existingTerms: currentTerms,
          amount: 5
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi mạng khi tải thêm thẻ.");
      }

      const data = await response.json();
      if (data && data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
        const newCards: Card[] = data.cards.map((c: any) => ({
          id: `dynamic-card-${Date.now()}-${Math.random()}`,
          term: c.term,
          definition: c.definition,
          example: c.example || '',
          exampleTranslation: c.exampleTranslation || '',
          isRepeated: false
        }));

        setAddedCards(prev => [...prev, ...newCards]);

        const newQuestions: Question[] = [];
        newCards.forEach((card) => {
          let currentDir: 'vi-to-en' | 'en-to-vi' = 'vi-to-en';
          if (studyDirection === 'en-to-vi') {
            currentDir = 'en-to-vi';
          } else if (studyDirection === 'mixed') {
            currentDir = Math.random() > 0.5 ? 'en-to-vi' : 'vi-to-en';
          }

          const isTranslateSentence = studySubMode === 'translate-sentence';
          const isFillBlanks = studySubMode === 'fill-blanks';
          let promptText = '';
          let correctAnswer = '';
          let options: string[] = [];

          if (isTranslateSentence) {
            const cleanEx = getCleanExample(card);
            promptText = cleanEx.example;
            correctAnswer = cleanEx.exampleTranslation || card.definition || '';
          } else if (isFillBlanks) {
            const cleanEx = getCleanExample(card);
            promptText = cleanEx.example;
            correctAnswer = card.term;
          } else if (currentDir === 'vi-to-en') {
            promptText = card.definition;
            correctAnswer = card.term;

            const allTerms = [...set.cards, ...addedCards, ...newCards].map(c => c.term);
            const otherTerms = allTerms.filter(t => t !== card.term);
            const shuffledOthers = [...otherTerms].sort(() => Math.random() - 0.5).slice(0, 3);
            options = [correctAnswer, ...shuffledOthers].sort(() => Math.random() - 0.5);
          } else {
            promptText = card.term;
            correctAnswer = card.definition;

            const allDefs = [...set.cards, ...addedCards, ...newCards].map(c => c.definition);
            const otherDefs = allDefs.filter(d => d !== card.definition);
            const shuffledOthers = [...otherDefs].sort(() => Math.random() - 0.5).slice(0, 3);
            options = [correctAnswer, ...shuffledOthers].sort(() => Math.random() - 0.5);
          }

          newQuestions.push({
            card,
            promptText,
            correctAnswer,
            options,
            originalDirection: isTranslateSentence ? 'translate-sentence' : (isFillBlanks ? 'fill-blanks' as any : currentDir)
          });
        });

        const finalNewQuestions = isShuffled ? newQuestions.sort(() => Math.random() - 0.5) : newQuestions;
        const oldLength = questions.length;

        setQuestions(prev => [...prev, ...finalNewQuestions]);

        setCurrentIndex(oldLength);
        setSelectedAnswer(null);
        setTypedAnswer('');
        setIsSubmitted(false);
        setShowSummary(false);
      } else {
        setSubmitError("Không tìm thấy thêm từ vựng mới nào phù hợp.");
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(`Không thể tải thêm thẻ: ${err.message || 'Lỗi API'}`);
    } finally {
      setIsGeneratingMore(false);
      setIsTransitioningBatch(false);
    }
  };

  // Fetch dynamic example sentences from Gemini for a word
  const fetchGeminiSentences = async (term: string, definition: string) => {
    setIsLoadingGemini(true);
    setGeminiSentences([]);
    try {
      const response = await fetch('/api/generate-dynamic-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.sentences)) {
          setGeminiSentences(data.sentences);
        }
      }
    } catch (error) {
      console.error("Error fetching Gemini sentences:", error);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  // Process spelling typing reinforcement
  const handleReinforceSubmit = () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const target = currentQuestion.card.term;
    const typed = reinforceInputValue;

    if (checkAnswerSmart(typed, target)) {
      const nextCount = reinforceTypedCount + 1;
      setReinforceTypedCount(nextCount);
      setReinforceInputValue('');
      setSubmitError(''); // Clear error on correct spelling
      
      if (nextCount >= 2) {
        setReinforceSuccess(true);
        setSubmitSuccess(`🎉 Tuyệt vời! Bạn đã gõ chính xác 2 lần. Hãy nhấn "Tiếp Tục" hoặc Enter ↵ để chuyển câu tiếp theo.`);
      } else {
        setSubmitSuccess(`✨ Hoàn thành xuất sắc: Gõ chính xác lần 1! Hãy gõ lại đúng từ vựng thêm 1 lần nữa để vượt qua.`);
      }
    } else {
      setSubmitSuccess('');
      setSubmitError(`Chưa chính xác! Bạn đã gõ "${reinforceInputValue}". Hãy gõ lại chính xác từ vựng: "${currentQuestion.card.term}"`);
    }
  };

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedAnswer(option);
    setSubmitError(''); // Clear error when selecting option
    setSubmitSuccess('');
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    setSubmitSuccess('');

    const currentQuestion = questions[currentIndex];
    const activeQuestionMode = currentQuestion.forcedSubMode || studySubMode;
    let isCorrect = false;

    if (activeQuestionMode === 'multiple-choice') {
      if (!selectedAnswer) {
        setSubmitError('Vui lòng chọn một đáp án trắc nghiệm trước khi kiểm tra!');
        return;
      }
      setSubmitError('');
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;

      if (isCorrect) {
        // If correct, dynamically insert a typing reinforcement question right after the current index
        const reinforcementQuestion: Question = {
          card: currentQuestion.card,
          promptText: currentQuestion.promptText,
          correctAnswer: currentQuestion.correctAnswer,
          options: currentQuestion.options,
          originalDirection: currentQuestion.originalDirection,
          forcedSubMode: 'type-to-learn',
          isReinforcement: true
        };

        setQuestions((prev) => {
          const updated = [...prev];
          updated.splice(currentIndex + 1, 0, reinforcementQuestion);
          return updated;
        });
        setReinforceSuccess(true);
      } else {
        // If wrong, require typing the English word 2 times!
        setReinforceSuccess(false);
        setReinforceTypedCount(0);
        setReinforceInputValue('');
      }
    } else if (activeQuestionMode === 'translate-sentence') {
      if (!typedAnswer.trim()) {
        setSubmitError('Vui lòng nhập bản dịch của bạn trước khi kiểm tra!');
        return;
      }
      setSubmitError('');
      // For sentence translation, we do self grading, so we set a default match but don't count until user confirms
      isCorrect = checkAnswerSmart(typedAnswer, currentQuestion.correctAnswer);
      setSelectedAnswer(typedAnswer);
      setReinforceSuccess(true);
    } else {
      if (!typedAnswer.trim()) {
        const errorMsg = currentQuestion.originalDirection === 'en-to-vi'
          ? 'Vui lòng nhập định nghĩa tiếng Việt trước khi kiểm tra!'
          : 'Vui lòng nhập từ vựng tiếng Anh trước khi kiểm tra!';
        setSubmitError(errorMsg);
        return;
      }
      setSubmitError('');
      isCorrect = checkAnswerSmart(typedAnswer, currentQuestion.correctAnswer);
      setSelectedAnswer(typedAnswer);
      setReinforceSuccess(true);
    }

    if (!isCorrect) {
      // Fetch dynamic daily-life sentence context continuously from Gemini
      fetchGeminiSentences(currentQuestion.card.term, currentQuestion.card.definition);
    }

    if (activeQuestionMode !== 'translate-sentence') {
      setScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      }));
    }

    // Record study activity
    trackStudyActivity(1);

    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (!reinforceSuccess) {
      setSubmitError(`Hãy hoàn thành gõ lại từ vựng đúng 2 lần để tiếp tục học nhé! (Đang hoàn thành: ${reinforceTypedCount}/2)`);
      // Highlight / focus reinforcement input
      const inputEl = document.getElementById('reinforce-spell-input');
      if (inputEl) {
        inputEl.focus();
        inputEl.classList.add('ring-rose-500/30', 'border-rose-400');
        setTimeout(() => {
          inputEl.classList.remove('ring-rose-500/30', 'border-rose-400');
        }, 1500);
      }
      return;
    }
    setSubmitError('');
    setSubmitSuccess('');

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setTypedAnswer('');
      setIsSubmitted(false);
      // Reset reinforcement state and Gemini sentences for next question
      setReinforceSuccess(true);
      setReinforceTypedCount(0);
      setReinforceInputValue('');
      setGeminiSentences([]);
      setHintMessage('');
    } else if (isContinuousMode) {
      handleLoadMoreCards(true);
    } else {
      setShowSummary(true);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-100 shadow-xs">
        <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
        <p className="text-slate-500 font-bold">Đang tải câu hỏi học tập...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const activeQuestionMode = currentQuestion?.forcedSubMode || studySubMode;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Upper Navigation panel */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="learn-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-brand transition"
        >
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </button>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
          Chế độ: Học & Nhớ
        </span>
      </div>

      {/* Sub-mode selector tabs */}
      {!showSummary && (
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200 mb-4 gap-2">
          <button
            id="submode-choice-btn"
            onClick={() => { 
              setStudySubMode('multiple-choice'); 
              setTypedAnswer(''); 
              setSelectedAnswer(null); 
              setIsSubmitted(false); 
              setReinforceSuccess(true); 
              setReinforceTypedCount(0); 
              setReinforceInputValue(''); 
              setGeminiSentences([]); 
              setSubmitError('');
            }}
            className={`py-2 font-bold text-xs rounded-lg transition-all text-center cursor-pointer ${
              studySubMode === 'multiple-choice'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🎯 Trắc nghiệm
          </button>
          <button
            id="submode-type-btn"
            onClick={() => { 
              setStudySubMode('type-to-learn'); 
              setTypedAnswer(''); 
              setSelectedAnswer(null); 
              setIsSubmitted(false); 
              setReinforceSuccess(true); 
              setReinforceTypedCount(0); 
              setReinforceInputValue(''); 
              setGeminiSentences([]); 
              setSubmitError('');
            }}
            className={`py-2 font-bold text-xs rounded-lg transition-all text-center cursor-pointer ${
              studySubMode === 'type-to-learn'
                ? 'bg-white text-brand shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⌨️ Gõ câu trả lời
          </button>
          <button
            id="submode-cloze-btn"
            onClick={() => { 
              setStudySubMode('fill-blanks'); 
              setTypedAnswer(''); 
              setSelectedAnswer(null); 
              setIsSubmitted(false); 
              setReinforceSuccess(true); 
              setReinforceTypedCount(0); 
              setReinforceInputValue(''); 
              setGeminiSentences([]); 
              setSubmitError('');
            }}
            className={`py-2 font-bold text-xs rounded-lg transition-all text-center cursor-pointer ${
              studySubMode === 'fill-blanks'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 Điền khuyết
          </button>
          <button
            id="submode-sentence-btn"
            onClick={() => { 
              setStudySubMode('translate-sentence'); 
              setTypedAnswer(''); 
              setSelectedAnswer(null); 
              setIsSubmitted(false); 
              setReinforceSuccess(true); 
              setReinforceTypedCount(0); 
              setReinforceInputValue(''); 
              setGeminiSentences([]); 
              setSubmitError('');
            }}
            className={`py-2 font-bold text-xs rounded-lg transition-all text-center cursor-pointer ${
              studySubMode === 'translate-sentence'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💬 Dịch câu ví dụ
          </button>
        </div>
      )}

      {/* Study direction switcher */}
      {!showSummary && studySubMode !== 'translate-sentence' && (
        <div className="flex bg-slate-50 border border-slate-200/60 p-1.5 rounded-xl mb-4 items-center justify-between text-xs font-bold text-slate-500">
          <span className="pl-2">Chiều học dịch thuật:</span>
          <div className="flex gap-1">
            <button
              id="direction-en-vi"
              type="button"
              onClick={() => setStudyDirection('en-to-vi')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                studyDirection === 'en-to-vi'
                  ? 'bg-white shadow-3xs text-brand border border-slate-200/80'
                  : 'hover:text-slate-800 text-slate-400'
              }`}
            >
              🇺🇸 ➔ 🇻🇳 EN-VI
            </button>
            <button
              id="direction-vi-en"
              type="button"
              onClick={() => setStudyDirection('vi-to-en')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                studyDirection === 'vi-to-en'
                  ? 'bg-white shadow-3xs text-brand border border-slate-200/80'
                  : 'hover:text-slate-800 text-slate-400'
              }`}
            >
              🇻🇳 ➔ 🇺🇸 VI-EN
            </button>
            <button
              id="direction-mixed"
              type="button"
              onClick={() => setStudyDirection('mixed')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                studyDirection === 'mixed'
                  ? 'bg-white shadow-3xs text-brand border border-slate-200/80'
                  : 'hover:text-slate-800 text-slate-400'
              }`}
            >
              🔄 Trộn lẫn
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Advanced Learning Controls */}
      {!showSummary && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl mb-6 text-xs font-bold text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cấu hình:</span>
            
            {/* Shuffle toggle */}
            <button
              id="toggle-shuffle-btn"
              type="button"
              onClick={() => setIsShuffled(!isShuffled)}
              className={`px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                isShuffled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shuffle size={12} />
              <span>{isShuffled ? '🔀 Đang trộn câu' : '➡️ Thứ tự gốc'}</span>
            </button>
            
            {/* Infinite mode toggle */}
            <button
              id="toggle-infinite-btn"
              type="button"
              onClick={() => setIsContinuousMode(!isContinuousMode)}
              className={`px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                isContinuousMode
                  ? 'bg-rose-50 border-rose-200 text-rose-750 ring-2 ring-rose-500/10'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-850'
              }`}
              title="Tự động sử dụng Gemini AI tạo thêm từ vựng nâng cao liên quan khi học xong bộ cũ!"
            >
              <Infinity size={12} />
              <span>{isContinuousMode ? 'Học vô tận: BẬT 🤖' : 'Học vô tận: TẮT'}</span>
            </button>
          </div>

          {/* Load manual cards button */}
          <button
            id="manual-load-more-btn"
            type="button"
            disabled={isGeneratingMore}
            onClick={() => handleLoadMoreCards(false)}
            className="px-3 py-1.5 bg-brand hover:bg-[#3444cc] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
          >
            {isGeneratingMore ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Đang tạo từ...</span>
              </>
            ) : (
              <>
                <Sparkles size={12} />
                <span>➕ Thêm 5 câu mới (AI)</span>
              </>
            )}
          </button>
        </div>
      )}

      {isTransitioningBatch ? (
        /* Continuous mode fetching transition card */
        <div className="bg-white border border-slate-200 p-12 rounded-xl shadow-xs text-center min-h-[220px] flex flex-col justify-center items-center space-y-4 animate-pulse">
          <Sparkles className="w-10 h-10 text-brand animate-spin" />
          <h3 className="text-lg font-bold text-slate-800">🤖 AI đang soạn tiếp 5 câu hỏi nâng cao...</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mx-auto">
            Học phần đang được mở rộng liên tục! Hệ thống đang kết nối Gemini để tạo ra các từ vựng và câu ví dụ mới liên quan mà không trùng lặp.
          </p>
        </div>
      ) : showSummary ? (
        /* End of Learning Path Certificate Summary Display */
        <div id="learn-summary-panel" className="bg-white border border-slate-100 p-8 rounded-xl shadow-xs text-center">
          <div className="inline-flex p-4 bg-blue-50 text-brand rounded-full mb-4 animate-pulse">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tuyệt vời! Bạn Đã Hoàn Thành</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Học phần: <span className="font-bold text-slate-800">"{set.title}"</span> đã được ghi nhớ thành công vào thư viện não bộ của bạn!
          </p>

          {/* Stats cards block */}
          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
              <span className="block text-xs font-bold text-emerald-600 uppercase">Trả lời đúng</span>
              <span className="block text-3xl font-bold text-emerald-700 mt-1">{score.correct}</span>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-center">
              <span className="block text-xs font-bold text-rose-600 uppercase">Trả lời sai</span>
              <span className="block text-3xl font-bold text-rose-700 mt-1">{score.incorrect}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mb-6 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-605">Phần trăm chính xác:</span>
            <span className="text-lg font-bold text-brand">
              {Math.round((score.correct / questions.length) * 100)}%
            </span>
          </div>

          {/* Navigation/Restart Buttons */}
          <div className="space-y-3">
            <button
              id="learn-add-more-ai-btn"
              onClick={() => handleLoadMoreCards(false)}
              disabled={isGeneratingMore}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isGeneratingMore ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span>Tạo thêm 5 từ vựng mới từ AI 🤖</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="learn-restart-btn"
                onClick={() => generateAllQuestions(true)}
                className="flex-1 py-3 bg-brand hover:bg-[#3444cc] text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCcw size={16} />
                <span>Học từ đầu (Xóa từ phụ)</span>
              </button>
              <button
                id="learn-home-btn"
                onClick={onBack}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-lg transition cursor-pointer"
              >
                Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Action Practice Mode Layout */
        <div className="space-y-6">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Câu hỏi số {currentIndex + 1} / {questions.length}</span>
            <span>Độ chính xác: {score.correct} Đúng | {score.incorrect} Sai</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / questions.length) * 100}%` }}
            />
          </div>

          {/* Question definition card prompt */}
          <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-xs text-center min-h-[140px] flex flex-col justify-center">
            {currentQuestion.isDoubleReview && (
              <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3.5 animate-pulse text-center">
                <span className="text-rose-700 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                  🔥 ÔN TẬP TĂNG CƯỜNG (TỪ VỰNG LẶP)
                </span>
                <p className="text-[10px] text-rose-550/90 font-bold mt-1">
                  Đã có ở các bài khác. Bắt buộc ôn qua 2 dải câu hỏi! {activeQuestionMode === 'multiple-choice' ? '🎯 (Đáp án Trắc Nghiệm)' : '✍️ (Chủ động Nhập/Gõ)'}
                </p>
              </div>
            )}
            {currentQuestion.isReinforcement && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center animate-pulse">
                <span className="text-emerald-700 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 animate-bounce">
                  🧠 ĐÃ TRẢ LỜI ĐÚNG TRẮC NGHIỆM!
                </span>
                <p className="text-[10px] text-emerald-650 font-extrabold mt-1">
                  Hãy tự gõ lại để khắc sâu hoàn toàn vào trí nhớ dài hạn ✍️
                </p>
              </div>
            )}
            {activeQuestionMode === 'fill-blanks' ? (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 block flex items-center justify-center gap-1.5">
                  📝 Bài tập điền khuyết (Cloze Test)
                </span>
                {(() => {
                  const cleanEx = getCleanExample(currentQuestion.card);
                  const { maskedText } = maskTermInExample(cleanEx.example, currentQuestion.correctAnswer, currentQuestion.card.definition);
                  return (
                    <div>
                      <p className="text-lg sm:text-xl font-extrabold text-slate-900 leading-relaxed whitespace-pre-line">
                        {maskedText}
                      </p>
                      <div className="mt-2.5 p-2 bg-emerald-50/80 border border-emerald-150 rounded-lg text-xs text-emerald-900 font-medium text-left">
                        <span>💡 Nghĩa tiếng Việt của từ cần điền: <strong className="text-emerald-950 font-extrabold">{currentQuestion.card.definition}</strong></span>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : activeQuestionMode === 'translate-sentence' ? (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 block">
                  💬 Bài tập dịch câu ví dụ (Dịch thoát ý)
                </span>
                <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 leading-relaxed whitespace-pre-line">
                  "{currentQuestion.promptText}"
                </p>
                <div className="mt-2.5 p-2 bg-indigo-50/80 border border-indigo-150 rounded-lg text-xs text-indigo-800 font-medium text-left flex items-center justify-between">
                  <span>🎯 Từ vựng trong câu: <strong className="text-indigo-950 font-extrabold">{currentQuestion.card.term}</strong></span>
                  <span className="text-indigo-600 text-[11px] font-normal">({currentQuestion.card.definition})</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  {activeQuestionMode === 'multiple-choice'
                    ? (currentQuestion.originalDirection === 'en-to-vi'
                        ? "Thuật ngữ tiếng Anh (US) ➔ Chọn định nghĩa tiếng Việt (VN) đúng:"
                        : "Khái niệm tiếng Việt (VN) ➔ Chọn từ vựng tiếng Anh (US) tương ứng:")
                    : (currentQuestion.originalDirection === 'en-to-vi'
                        ? "Thuật ngữ tiếng Anh (US) ➔ Gõ định nghĩa tiếng Việt (VN):"
                        : "Khái niệm tiếng Việt (VN) ➔ Gõ từ vựng tiếng Anh (US):")}
                </span>
                <p className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
                  {currentQuestion.promptText}
                </p>
              </>
            )}
          </div>

          {activeQuestionMode === 'multiple-choice' ? (
            /* Multiple choice options board selection */
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                let btnClass = 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300';
                
                if (isSubmitted) {
                  if (option === currentQuestion.correctAnswer) {
                    // Always highlight correct answer green
                    btnClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20';
                  } else if (isSelected) {
                    // Selected wrong option gets highlighted red
                    btnClass = 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500/20';
                  } else {
                    // Secondary dimming
                    btnClass = 'bg-white opacity-50 text-slate-400 border-slate-100';
                  }
                } else if (isSelected) {
                  // Pre-submit highlighted option
                  btnClass = 'bg-blue-50/50 text-brand border-brand ring-2 ring-brand/15';
                }

                return (
                  <button
                    id={`learn-option-${idx}`}
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    disabled={isSubmitted}
                    className={`w-full p-4 border rounded-xl font-bold text-sm text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${btnClass}`}
                  >
                    <span className="flex-1 break-words">{option}</span>
                    {isSubmitted && option === currentQuestion.correctAnswer && (
                      <CheckCircle size={18} className="text-emerald-600 shrink-0 ml-3" />
                    )}
                    {isSubmitted && isSelected && option !== currentQuestion.correctAnswer && (
                      <AlertCircle size={18} className="text-rose-600 shrink-0 ml-3" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Type to Learn / Cloze Test / Sentence Translation sub-mode layout input */
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-2xs space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {currentQuestion.isReinforcement
                    ? "✍️ Gõ lại chính xác từ vựng này để khắc sâu trí nhớ:"
                    : activeQuestionMode === 'fill-blanks'
                    ? "Gõ thuật ngữ thích hợp để hoàn thiện chỗ trống:"
                    : activeQuestionMode === 'translate-sentence'
                    ? "Gõ bản dịch thoát ý tiếng Việt cho câu trên:"
                    : (currentQuestion.originalDirection === 'en-to-vi'
                        ? "Gõ định nghĩa Tiếng Việt (VN) tương ứng:"
                        : "Gõ từ vựng Tiếng Anh (US) tương ứng:")}
                </label>
                <input
                  id="type-to-learn-text-input"
                  type="text"
                  disabled={isSubmitted}
                  placeholder={
                    currentQuestion.isReinforcement
                      ? "Nhập từ vựng bạn vừa trả lời đúng..."
                      : activeQuestionMode === 'fill-blanks'
                      ? "Nhập từ khóa bị khuyết..."
                      : activeQuestionMode === 'translate-sentence'
                      ? "Nhập bản dịch nghĩa tiếng Việt..."
                      : (currentQuestion.originalDirection === 'en-to-vi'
                          ? "Nhập định nghĩa tiếng Việt..."
                          : "Nhập từ vựng tiếng Anh...")
                  }
                  value={typedAnswer}
                  onChange={(e) => { setTypedAnswer(e.target.value); setSubmitError(''); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isSubmitted) {
                        handleSubmit();
                      }
                    }
                  }}
                  className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 rounded-xl outline-none font-bold text-slate-900 transition text-sm"
                  autoComplete="off"
                  autoCapitalize="off"
                />

                {hintMessage && (
                  <div className="p-2.5 bg-indigo-50/50 text-indigo-900 border border-indigo-100 rounded-lg text-2xs font-bold flex items-center gap-1.5 animate-fade-in">
                    <Sparkles size={12} className="text-indigo-500 shrink-0" />
                    <span>Gợi ý: {hintMessage}</span>
                  </div>
                )}

                {!isSubmitted && (
                  <div className="flex justify-between items-center pt-2 text-xs">
                    {activeQuestionMode === 'translate-sentence' ? (
                      <span className="text-2xs font-semibold text-indigo-600">
                        💡 Dịch thoát ý là được, không lo sai sót chính tả!
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const term = currentQuestion.correctAnswer;
                          setHintMessage(`Khái niệm này bắt đầu bằng chữ "${term[0].toUpperCase()}" và chứa tổng cộng ${term.length} kí tự.`);
                        }}
                        className="text-2xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                      >
                        💡 Xem gợi ý chữ cái đầu
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">Nhấn phím ENTER để nộp bài</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action guidance prompts and navigation control bars */}
          <div className="pt-4 flex flex-col items-stretch">
            {submitError && (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce mb-4">
                <AlertCircle size={14} className="text-amber-500 shrink-0 animate-pulse" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce mb-4">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 animate-pulse" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {isSubmitted ? (
              <div className="space-y-4">
                {activeQuestionMode === 'translate-sentence' ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3 text-sm">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-700 block">
                        📊 So sánh & Tự nhận xét bản dịch của bạn:
                      </span>
                      <div>
                        <span className="text-slate-500 block text-xs">Bài dịch của bạn:</span>
                        <p className="font-bold text-slate-800 italic mt-0.5 whitespace-pre-line">"{typedAnswer}"</p>
                      </div>
                      <div className="pt-2 border-t border-indigo-200/50">
                        <span className="text-emerald-700 font-bold block text-xs">Bản dịch sát nghĩa gợi ý:</span>
                        <p className="font-bold text-emerald-800 mt-0.5 whitespace-pre-line">"{currentQuestion.correctAnswer}"</p>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed pt-1">
                        *(Ý nghĩa cốt lõi tương đồng là đạt yêu cầu. Bạn dịch ra ý tương ứng là được rồi nhé!)*
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-center text-xs text-slate-400 font-bold">Hãy tự chấm điểm chất lượng câu trả lời của bạn:</span>
                      <div className="flex gap-3">
                        <button
                          id="self-grade-correct"
                          type="button"
                          onClick={() => {
                            setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
                            handleNext();
                          }}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm hover:shadow active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer animate-fade-in"
                        >
                          <ThumbsUp size={16} />
                          <span>Tôi dịch đúng ý (+1 điểm)</span>
                        </button>
                        <button
                          id="self-grade-incorrect"
                          type="button"
                          onClick={() => {
                            setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
                            handleNext();
                          }}
                          className="flex-1 py-3 bg-slate-150 hover:bg-slate-200 text-slate-700 border border-slate-250 font-bold text-xs sm:text-sm rounded-lg active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer animate-fade-in"
                        >
                          <span>Tôi dịch chưa đạt / Sai</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Result banner overlay */}
                    {(() => {
                      const checkCorrect = activeQuestionMode === 'multiple-choice'
                        ? selectedAnswer === currentQuestion.correctAnswer
                        : checkAnswerSmart(typedAnswer, currentQuestion.correctAnswer);

                      if (checkCorrect) {
                         return (
                           <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg flex items-center gap-2 text-sm font-bold">
                             <ThumbsUp size={18} className="text-emerald-600 shrink-0" />
                             <span>Thật xuất sắc! Câu trả lời của bạn hoàn toàn chính xác.</span>
                           </div>
                         );
                      } else {
                         return (
                           <div className="space-y-4">
                             <div className="p-4 bg-rose-50 text-rose-850 border border-rose-100 rounded-lg flex items-start gap-2 text-sm font-medium">
                               <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                               <div>
                                 <span className="font-bold block">Hãy ghi nhớ câu trả lời chính xác:</span>
                                 <span className="text-xs leading-relaxed block mt-1">
                                   {(activeQuestionMode === 'type-to-learn' || activeQuestionMode === 'fill-blanks') && typedAnswer.trim() ? (
                                     <>Bạn đã nhập: <strong className="text-slate-650 break-all">"{typedAnswer}"</strong>. </>
                                   ) : null}
                                   Đáp án đúng là <strong className="text-emerald-800 underline">"{currentQuestion.correctAnswer}"</strong>.
                                 </span>
                               </div>
                             </div>

                             {/* Gemini AI Daily-life Example Sentences - updates dynamically */}
                             <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-100/80 p-5 rounded-xl space-y-3.5 mt-3 animate-fade-in text-left">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-1.5 text-indigo-700">
                                   <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                                   <span className="text-xs font-black uppercase tracking-wider">
                                     💡 Trợ lý AI Gemini: Ngữ cảnh đời sống thực tế
                                   </span>
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => fetchGeminiSentences(currentQuestion.card.term, currentQuestion.card.definition)}
                                   disabled={isLoadingGemini}
                                   className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-indigo-150 shadow-3xs animate-fade-in"
                                 >
                                   <RefreshCcw size={11} className={isLoadingGemini ? "animate-spin" : ""} />
                                   <span>Đổi câu khác (AI)</span>
                                 </button>
                               </div>

                               {isLoadingGemini ? (
                                 <div className="py-6 flex flex-col items-center justify-center space-y-2">
                                   <Loader2 size={20} className="text-indigo-500 animate-spin" />
                                   <span className="text-2xs font-bold text-indigo-400 animate-pulse">Gemini đang cập nhật câu mới...</span>
                                 </div>
                               ) : geminiSentences.length > 0 ? (
                                 <div className="space-y-3">
                                   {geminiSentences.map((item, index) => (
                                     <div key={index} className="p-3 bg-white/80 rounded-lg border border-slate-100 text-xs shadow-3xs hover:border-indigo-200 transition-colors">
                                       <p className="font-extrabold text-slate-800 leading-relaxed font-sans">
                                         {item.sentence}
                                       </p>
                                       <p className="text-slate-550 mt-1 font-medium italic">
                                         {item.translation}
                                       </p>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <div className="text-center py-2 text-2xs text-slate-400 font-bold">
                                   Chưa thể kết nối tới trợ lý AI để tạo ngữ cảnh, hãy dùng câu ví dụ mặc định.
                                 </div>
                               )}
                               <p className="text-[10px] text-slate-400 leading-normal font-medium">
                                 💡 Gợi ý: Học từ qua nhiều ngữ cảnh đời sống đa dạng sẽ giúp bạn tăng tốc độ tiếp thu gấp 3 lần!
                               </p>
                             </div>

                             {/* Multiple-choice incorrect spelling reinforcement */}
                             {activeQuestionMode === 'multiple-choice' && !reinforceSuccess && (
                               <div className="bg-rose-50/50 border border-rose-100/80 p-5 rounded-xl space-y-3 mt-3 animate-fade-in text-left">
                                 <span className="text-xs font-black uppercase tracking-wider text-rose-700 block flex items-center gap-1.5">
                                   ✍️ LUYỆN TẬP BẮT BUỘC: GÕ LẠI TỪ VỰNG 2 LẦN
                                 </span>
                                 <p className="text-xs text-rose-950 font-bold leading-relaxed">
                                   Bạn đã trả lời sai câu hỏi trắc nghiệm! Hãy gõ lại chính xác từ vựng này <span className="text-rose-600 font-extrabold font-mono underline">{currentQuestion.card.term}</span> đúng 2 lần để tiếp tục học.
                                 </p>
                                 
                                 <div className="flex items-center gap-2">
                                   <input
                                     id="reinforce-spell-input"
                                     type="text"
                                     placeholder={`Gõ lại chính xác từ: "${currentQuestion.card.term}"`}
                                     value={reinforceInputValue}
                                     onChange={(e) => { setReinforceInputValue(e.target.value); setSubmitError(''); setSubmitSuccess(''); }}
                                     onKeyDown={(e) => {
                                       if (e.key === 'Enter') {
                                         e.preventDefault();
                                         e.stopPropagation();
                                         if (reinforceSuccess) {
                                           handleNext();
                                         } else {
                                           handleReinforceSubmit();
                                         }
                                       }
                                     }}
                                     className="flex-1 p-3 bg-white border border-rose-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 rounded-lg outline-none font-bold text-slate-800 text-xs shadow-3xs transition"
                                     autoComplete="off"
                                     autoCapitalize="off"
                                   />
                                   <button
                                     type="button"
                                     onClick={handleReinforceSubmit}
                                     className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition shadow-3xs cursor-pointer active:scale-95 text-center flex items-center justify-center shrink-0"
                                   >
                                     Kiểm tra
                                   </button>
                                 </div>
                                 
                                 <div className="flex items-center justify-between text-2xs font-extrabold text-slate-400 uppercase tracking-widest pt-1">
                                   <span>Đã gõ đúng:</span>
                                   <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-xs">
                                     {reinforceTypedCount} / 2 lần
                                   </span>
                                 </div>
                               </div>
                             )}
                           </div>
                         );
                      }
                    })()}

                    <button
                      id="learn-next-btn"
                      onClick={handleNext}
                      className="w-full py-3.5 bg-brand hover:bg-[#3444cc] text-white font-bold text-sm rounded-lg transition active:scale-98 flex items-center justify-center cursor-pointer shadow-sm"
                    >
                      {!reinforceSuccess 
                        ? `Tiếp Tục (Yêu cầu gõ lại từ vựng: ${reinforceTypedCount}/2)` 
                        : currentIndex + 1 < questions.length 
                          ? 'Tiếp Theo (Nhấn Enter ↵)' 
                          : 'Xem Kết Quả Tổng Kết 📈 (Nhấn Enter ↵)'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                id="learn-submit-btn"
                onClick={handleSubmit}
                className="w-full py-3.5 bg-brand hover:bg-[#3444cc] text-white font-bold text-sm rounded-lg transition active:scale-98 flex items-center justify-center cursor-pointer shadow-sm"
              >
                {activeQuestionMode === 'multiple-choice' && selectedAnswer
                  ? 'Kiểm Tra Câu Trả Lời (Nhấn Enter ↵)'
                  : activeQuestionMode !== 'multiple-choice' && typedAnswer.trim()
                  ? 'Kiểm Tra Câu Trả Lời (Nhấn Enter ↵)'
                  : 'Kiểm Tra Câu Trả Lời'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
