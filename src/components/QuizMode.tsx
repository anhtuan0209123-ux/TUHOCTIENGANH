import React, { useState, useEffect } from 'react';
import { Card, StudySet, QuizQuestion } from '../types';
import { ArrowLeft, Check, X, Award, AlertCircle, RefreshCw } from 'lucide-react';
import { trackStudyActivity } from '../utils/analytics';
import { checkAnswerSmart, maskTermInExample } from '../utils/stringMatcher';

interface QuizModeProps {
  set: StudySet;
  onBack: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({ set, onBack }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    generateQuiz();
  }, [set.cards]);

  const generateQuiz = () => {
    const cardsCopy = [...set.cards];
    // Shuffle cards first and take 5 to 10 questions
    const shuffledCards = cardsCopy.sort(() => Math.random() - 0.5);
    const targetCount = Math.min(10, Math.max(5, shuffledCards.length));
    const selectedCards = shuffledCards.slice(0, targetCount);

    const generated: QuizQuestion[] = selectedCards.map((card, idx) => {
      const typeSeed = idx % 3;
      const questionId = `quiz-q-${idx}-${Date.now()}`;

      if (typeSeed === 0 || typeSeed === 1) {
        // MULTIPLE CHOICE (4 choices A, B, C, D)
        const otherTerms = set.cards
          .filter((c) => c.id !== card.id)
          .map((c) => c.term);
        const shuffledOthers = [...otherTerms].sort(() => Math.random() - 0.5);
        const distractors = shuffledOthers.slice(0, Math.min(3, shuffledOthers.length));
        
        // Ensure 4 choices if available
        while (distractors.length < 3) {
          distractors.push(`Phương án phụ ${distractors.length + 1}`);
        }
        
        const options = [card.term, ...distractors].sort(() => Math.random() - 0.5);

        return {
          id: questionId,
          cardId: card.id,
          questionText: `Thuật ngữ/Khái niệm nào phù hợp với định nghĩa sau:\n"${card.definition}"`,
          type: 'multiple-choice',
          options,
          correctAnswer: card.term,
        };
      } else {
        // TRUE / FALSE
        const isTrueAssertion = Math.random() > 0.5;
        let assertedDefinition = card.definition;
        let correctAnswer = 'Đúng';

        if (!isTrueAssertion && set.cards.length > 1) {
          const otherCards = set.cards.filter((c) => c.id !== card.id);
          const wrongCard = otherCards[Math.floor(Math.random() * otherCards.length)];
          assertedDefinition = wrongCard.definition;
          correctAnswer = 'Sai';
        }

        return {
          id: questionId,
          cardId: card.id,
          questionText: `Có phải thuật ngữ "${card.term}" mang định nghĩa sau đây:\n"${assertedDefinition}"?`,
          type: 'true-false',
          options: ['Đúng', 'Sai'],
          correctAnswer,
        };
      }
    });

    setQuestions(generated);
    setIsSubmitted(false);
    setScorePercent(0);
    setCorrectCount(0);
  };

  const handleOptionSelect = (qId: string, option: string) => {
    if (isSubmitted) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          return { ...q, userAnswer: option };
        }
        return q;
      })
    );
  };

  const handleWrittenChange = (qId: string, text: string) => {
    if (isSubmitted) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          return { ...q, userAnswer: text };
        }
        return q;
      })
    );
  };

  const handleGradeQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted) return;

    let correct = 0;
    const graded = questions.map((q) => {
      let isCorrect = false;

      if (q.type === 'written' || q.type === 'fill-blanks') {
        // flexible evaluation (lowercase, synonyms, ignore extra whitespaces/punctuation/Vietnam accents)
        isCorrect = checkAnswerSmart(q.userAnswer || '', q.correctAnswer);
      } else {
        isCorrect = (q.userAnswer || '').trim() === q.correctAnswer;
      }

      if (isCorrect) correct += 1;

      return {
        ...q,
        isCorrect,
      };
    });

    setQuestions(graded);
    setCorrectCount(correct);
    setScorePercent(Math.round((correct / questions.length) * 100));
    
    // Log full study assessment activity based on number of questions answered
    trackStudyActivity(questions.length || 5);

    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getAcademicGrade = (percent: number) => {
    if (percent >= 90) return { label: 'Hạng A+', color: 'text-amber-600 bg-amber-50' };
    if (percent >= 80) return { label: 'Hạng A', color: 'text-emerald-600 bg-emerald-50' };
    if (percent >= 70) return { label: 'Hạng B', color: 'text-brand bg-blue-50' };
    if (percent >= 50) return { label: 'Hạng C', color: 'text-amber-500 bg-amber-50/50' };
    return { label: 'Hạng F (Cần cố gắng)', color: 'text-rose-600 bg-rose-50' };
  };

  const gradeInfo = getAcademicGrade(scorePercent);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Quiz Top Action Rail */}
      <div className="flex items-center justify-between mb-8">
        <button
          id="quiz-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-brand transition"
        >
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </button>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
          Chế độ: Bài kiểm tra tổng hợp
        </span>
      </div>

      <div className="mb-8">
        <h1 id="quiz-title-header" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
          Kiểm Tra Năng Lực: {set.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Bài test tự động kết hợp câu hỏi Trắc nghiệm, Đúng/Sai & Viết thuật ngữ</p>
      </div>

      {isSubmitted && (
        /* Dynamic Score Certificate Banner Grid */
        <div id="quiz-result-header-panel" className="bg-white border border-slate-100 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs animate-fade-in relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10 text-center md:text-left flex-col md:flex-row">
            <div className={`p-4 rounded-full ${gradeInfo.color}`}>
              <Award size={40} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kết quả tổng điểm của bạn</span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-0.5">{scorePercent}% chính xác</h2>
              <p className="text-sm text-slate-500 mt-1">
                Đúng <span className="font-bold text-emerald-600">{correctCount}</span> trên tổng số <span className="font-bold text-slate-700">{questions.length}</span> câu hỏi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10 w-full md:w-auto">
            <button
              id="quiz-retry-btn"
              onClick={generateQuiz}
              className="flex-1 md:flex-none px-5 py-3 bg-brand hover:bg-[#3444cc] text-white font-bold text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} /> Trắc nghiệm lại
            </button>
            <button
              id="quiz-result-exit-btn"
              onClick={onBack}
              className="flex-1 md:flex-none px-5 py-3 bg-slate-55 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Trở về
            </button>
          </div>
        </div>
      )}

      {/* Main Form containing all the questions list */}
      <form onSubmit={handleGradeQuiz} className="space-y-6 relative z-10">
        {questions.map((q, qIdx) => {
          return (
            <div
              id={`quiz-question-row-${q.id}`}
              key={q.id}
              className={`bg-white rounded-xl p-6 sm:p-8 border shadow-xs relative transition-all duration-300 ${
                isSubmitted
                  ? q.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-rose-200 bg-rose-50/10'
                  : 'border-slate-100'
              }`}
            >
              {/* Question Index & type display */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <span className="text-slate-500 text-sm font-bold">Câu hỏi {qIdx + 1}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                  {q.type === 'multiple-choice' && 'Trắc nghiệm'}
                  {q.type === 'true-false' && 'Đúng / Sai'}
                  {q.type === 'written' && 'Ghi thuật ngữ học'}
                  {q.type === 'fill-blanks' && 'Bài điền khuyết 📝'}
                </span>
              </div>

              {/* Question prompt content */}
              <p className="text-base sm:text-lg font-bold text-slate-800 mb-6 whitespace-pre-line leading-relaxed">
                {q.questionText}
              </p>

              {/* MULTIPLE CHOICE / TRUE-FALSE LAYOUT */}
              {(q.type === 'multiple-choice' || q.type === 'true-false') && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((option, optIdx) => {
                    const isSelected = q.userAnswer === option;
                    let blockClass = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';

                    if (isSubmitted) {
                      if (option === q.correctAnswer) {
                        blockClass = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
                      } else if (isSelected) {
                        blockClass = 'bg-rose-50 border-rose-300 text-rose-800';
                      } else {
                        blockClass = 'bg-slate-50 opacity-50 border-slate-100 text-slate-400';
                      }
                    } else if (isSelected) {
                      blockClass = 'bg-blue-50 border-brand text-brand ring-2 ring-brand/10';
                    }

                    return (
                      <button
                        id={`quiz-q-${qIdx}-opt-${optIdx}`}
                        key={optIdx}
                        type="button"
                        onClick={() => handleOptionSelect(q.id, option)}
                        disabled={isSubmitted}
                        className={`p-4 border rounded-lg text-sm font-bold text-left transition flex items-center justify-between cursor-pointer ${blockClass}`}
                      >
                        <span className="break-words flex-1">{option}</span>
                        {isSubmitted && option === q.correctAnswer && <Check size={16} className="text-emerald-650 ml-2" />}
                        {isSubmitted && isSelected && option !== q.correctAnswer && <X size={16} className="text-rose-650 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* WRITTEN & FILL BLANKS EXERCISES LAYOUT */}
              {(q.type === 'written' || q.type === 'fill-blanks') && (
                <div className="space-y-3">
                  <input
                    id={`quiz-q-${qIdx}-written-input`}
                    type="text"
                    placeholder={q.type === 'fill-blanks' ? "Nhập từ khóa bị khuyết thích hợp..." : "Gõ chính xác thuật ngữ bằng bàn phím của bạn..."}
                    value={q.userAnswer || ''}
                    onChange={(e) => handleWrittenChange(q.id, e.target.value)}
                    disabled={isSubmitted}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-lg outline-none font-bold text-sm transition ${
                      isSubmitted
                        ? q.isCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-850'
                          : 'border-rose-300 bg-rose-50 text-rose-850'
                        : 'border-slate-200 focus:border-brand'
                    }`}
                  />

                  {isSubmitted && !q.isCorrect && (
                    <div className="p-3 bg-slate-50 border border-slate-110 rounded-lg text-xs flex items-center gap-2 text-slate-600">
                      <AlertCircle size={14} className="text-rose-500" />
                      <span>
                        Đáp án chuẩn: <strong className="text-slate-800 font-bold">"{q.correctAnswer}"</strong> (Được kiểm tra không phân biệt chữ hoa thường)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Action button bar */}
        <div className="flex justify-end pt-4 pb-12">
          {!isSubmitted ? (
            <button
              id="quiz-submit-test-btn"
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-brand hover:bg-[#3444cc] text-white font-bold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Nộp Bài & Chấm Điểm 📝</span>
            </button>
          ) : (
            <button
              id="quiz-restart-footer-btn"
              type="button"
              onClick={generateQuiz}
              className="w-full sm:w-auto px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Kiểm Tra Lại Đề Khác</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
