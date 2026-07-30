import React, { useState, useEffect } from 'react';
import { Brain, Loader2, ClipboardList, Sparkles, AlertCircle, FileText, Check, Zap } from 'lucide-react';
import { StudySet } from '../types';
import { analyzeVocabClient, sanitizeCardTerm, isValidCardTerm, parseLineToCard } from '../services/geminiClient';

interface AiGeneratorProps {
  onGenerated: (newSet: StudySet) => void;
}

const BULK_EXAMPLES = [
  {
    title: '📘 Bài đọc tiếng Anh & Từ vựng IELTS',
    description: 'Trích xuất trọn cụm từ ghép & từ vựng',
    text: `Artificial intelligence (AI) refers to the simulation of human intelligence in machines programmed to think and learn. Key concepts include Machine Learning, Deep Learning, Natural Language Processing, and Computer Vision. Expanding your Lexical Resource and speaking with Fluency and Coherence is essential for achieving a high IELTS score.`
  },
  {
    title: '💻 Lập Trình React & Công Nghệ',
    description: 'Khái niệm & thuật ngữ lập trình',
    text: `React là thư viện JavaScript dùng để xây dựng UI.
useState - Quản lý state cục bộ trong functional component
useEffect - Xử lý side effect như call API hay subscription
useMemo - Ghi nhớ kết quả tính toán đắt đỏ để tối ưu hiệu năng
Asynchronous programming - Lập trình bất đồng bộ giải phóng luồng chính`
  },
  {
    title: '🧪 Hóa Học & Tự Nhiên (100% Giữ cụm từ ghép)',
    description: 'Bóc tách đúng tên phản ứng & khái niệm',
    text: `Phản ứng xà phòng hóa là quá trình thủy phân este trong môi trường kiềm.
Cân bằng hóa học là trạng thái mà tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch.
Liên kết cộng hóa trị hình thành do sự dùng chung các electron giữa các nguyên tử.
Phản ứng trùng hợp tạo ra các chuỗi polime có khối lượng phân tử lớn.`
  }
];

const LOADING_STEPS = [
  'Đang quét tài liệu nguồn và lọc các cụm từ quan trọng...',
  'Phân tích cụm thuật ngữ ghép chuyên ngành (giữ nguyên không cắt lẻ)...',
  'Trích xuất định nghĩa chuẩn xác và súc tích nhất...',
  'Khởi tạo bộ thẻ Flashcard ghi nhớ thông minh...'
];

export const AiGenerator: React.FC<AiGeneratorProps> = ({ onGenerated }) => {
  const [bulkText, setBulkText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedCards, setParsedCards] = useState<any[]>([]);
  const [delimiter, setDelimiter] = useState<'auto' | 'tab' | 'dash' | 'colon'>('auto');

  // Rotate loading text messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const parseTextToCards = (text: string, _delim: 'auto' | 'tab' | 'dash' | 'colon'): any[] => {
    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const result: any[] = [];

    rawLines.forEach((line) => {
      const parsed = parseLineToCard(line);
      if (parsed) {
        result.push({
          term: parsed.term,
          definition: parsed.definition,
          example: ''
        });
      }
    });

    return result;
  };

  useEffect(() => {
    if (bulkText.trim()) {
      const cards = parseTextToCards(bulkText, delimiter);
      setParsedCards(cards);
    } else {
      setParsedCards([]);
    }
  }, [bulkText, delimiter]);

  const handleInstantLocalCreate = () => {
    if (parsedCards.length === 0) return;
    
    const dateFormatted = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const finalTitle = customTitle.trim() || `Tài liệu bóc tách - ${dateFormatted}`;
    
    const newStudySet: StudySet = {
      id: `instant-set-${Date.now()}`,
      title: finalTitle,
      description: `Gồm ${parsedCards.length} thuật ngữ bóc tách trực tiếp từ văn bản nguồn của bạn.`,
      createdAt: new Date().toISOString(),
      favorite: false,
      isGenerated: false,
      cards: parsedCards.map((c, idx) => ({
        id: `instant-card-${idx}-${Date.now()}`,
        term: c.term,
        definition: c.definition,
        example: ''
      }))
    };
    
    onGenerated(newStudySet);
    setBulkText('');
    setCustomTitle('');
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const rawSet = await analyzeVocabClient(bulkText.trim());
      const dateFormatted = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const newStudySet: StudySet = {
        id: `ai-set-${Date.now()}`,
        title: customTitle.trim() || rawSet.title || `Học phần bóc tách AI - ${dateFormatted}`,
        description: rawSet.description || `Được AI phân tích & trích xuất nguyên vẹn cụm thuật ngữ từ văn bản nguồn`,
        createdAt: new Date().toISOString(),
        favorite: false,
        isGenerated: true,
        cards: (rawSet.cards || []).map((card: any, idx: number) => ({
          id: `ai-card-${idx}-${Date.now()}`,
          term: card.term || '',
          definition: card.definition || '',
          example: card.example || '',
          exampleTranslation: card.exampleTranslation || ''
        }))
      };

      if (newStudySet.cards.length === 0) {
        throw new Error('AI không trích xuất được nội dung nào từ đoạn văn bản này. Vui lòng kiểm tra lại!');
      }

      onGenerated(newStudySet);
      setBulkText('');
      setCustomTitle('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không kết nối được server phân tích tài liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xs border border-slate-100">
      <div className="relative z-10">
        
        {/* Header Title Section */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-brand shrink-0">
            <Brain size={26} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand block">SMART PARSER</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2 leading-tight">
              Bóc Tách & Chuyển Đổi Tài Liệu Thành Flashcard 📄
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-3xl font-medium">
          Dán đoạn văn bản, danh sách ghi chú, tài liệu ôn tập hoặc đoạn mã nguồn của bạn. AI Gemini sẽ tự động phân tích và <strong>bảo toàn trọn vẹn cụm thuật ngữ ghép chuyên ngành</strong> (ví dụ: <em>Deep Learning</em>, <em>Phản ứng xà phòng hóa</em>) mà không bao giờ xé lẻ từ.
        </p>

        {/* Preset sample note buttons */}
        <div className="mb-6 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Thử nhanh với mẫu tài liệu có sẵn:
          </span>
          <div className="flex flex-wrap gap-2">
            {BULK_EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setBulkText(ex.text);
                  setCustomTitle(ex.title.replace(/^[^\w\s\u00C0-\u1EF9]+/, '').trim());
                  setErrorMsg(null);
                }}
                className="px-3.5 py-2 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-brand/40 rounded-xl text-xs font-bold text-slate-700 hover:text-brand transition cursor-pointer flex items-center gap-1.5"
              >
                <ClipboardList size={14} className="text-brand" />
                <span>{ex.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LOADING BOX */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center min-h-[250px] bg-blue-50/30 rounded-2xl border border-blue-100/60 my-6">
            <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
            <div className="text-center space-y-2 animate-fade-in px-4">
              <p className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {LOADING_STEPS[loadingStepIdx]}
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Gemini đang rà soát từng dòng tài liệu để trích xuất đầy đủ thuật ngữ và tạo bộ thẻ Flashcard cho bạn.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-6">
            {/* Custom title input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tên học phần (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="VD: Từ vựng IELTS Bài đọc Reading / Ghi chú React Hooks..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none text-slate-900 font-bold text-sm"
              />
            </div>

            {/* Document paste area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dán tài liệu nguồn / Danh sách ghi chú của bạn
                </label>
                {parsedCards.length > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                    <Check size={12} /> Nhận diện nhanh được {parsedCards.length} dòng
                  </span>
                )}
              </div>
              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Dán nội dung tài liệu của bạn vào đây...\n\nVí dụ:\n- React: useState (quản lý state), useEffect (xử lý side effect).\n- Hóa học: Phản ứng xà phòng hóa, Cân bằng hóa học, Liên kết cộng hóa trị.\n- Hoặc bài báo, đoạn văn bản đọc bất kỳ...`}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none text-slate-900 placeholder-slate-400 font-medium text-sm leading-relaxed transition-all resize-none shadow-2xs"
              />
            </div>

            {/* Error message display */}
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Lỗi bóc tách tài liệu</h4>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-400">
                {bulkText.trim() ? `${bulkText.trim().length} ký tự` : 'Sẵn sàng bóc tách'}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {parsedCards.length > 0 && (
                  <button
                    type="button"
                    onClick={handleInstantLocalCreate}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FileText size={16} />
                    <span>Tạo nhanh trực tiếp ({parsedCards.length} thẻ)</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!bulkText.trim() || isLoading}
                  className={`px-7 py-3.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    bulkText.trim() && !isLoading
                      ? 'bg-brand hover:bg-brand-hover text-white shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={16} className="fill-current" />
                  <span>⚡ AI Phân Tách & Tạo Học Phần Flashcard</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
