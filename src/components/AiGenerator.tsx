import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Loader2, FileText, ClipboardList, Zap, Check, AlertCircle, ShieldCheck, BookOpen, ExternalLink, Search, HelpCircle, Globe } from 'lucide-react';
import { StudySet } from '../types';
import { generateSetClient, analyzeVocabClient, academicAuditClient } from '../services/geminiClient';

interface AiGeneratorProps {
  onGenerated: (newSet: StudySet) => void;
}

const SUGGESTIONS = [
  'Từ vựng IELTS chủ đề Artificial Intelligence',
  'Ngữ pháp tiếng Anh bản xứ cơ bản',
  'Các câu lệnh Git thường dùng trong dự án',
  'Lịch sử Vương triều nhà Trần (1225 - 1400)',
  'Thuật ngữ Hóa học hữu cơ lớp 11',
  'Tâm lý học hành vi con người'
];

const BULK_EXAMPLES = [
  {
    title: 'Danh sách từ vựng thô',
    description: 'Danh sách từ - nghĩa thô',
    text: `obvious - rõ ràng, hiển nhiên
abundant - dồi dào, phong phú
resilience - khả năng phục hồi, kiên cường
empathy - sự thấu cảm`
  },
  {
    title: 'Đoạn văn đọc tiếng Anh',
    description: 'Trích xuất từ của bài viết/IELTS',
    text: `Artificial intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving. This technology is revolutionizing business workflows globally.`
  },
  {
    title: 'Thuật ngữ CNTT & React Hooks',
    description: 'Khái niệm lập trình',
    text: `React - Thư viện UI viết bởi Facebook
useState - Quản lý state cục bộ trong functional component
useEffect - Xử lý side effect như call API hay subscription
useMemo - Ghi nhớ kết quả tính toán đắt đỏ để tối ưu hiệu năng`
  }
];

const LOADING_STEPS = [
  'Kết nối với thế giới trí tuệ nhân tạo Gemini...',
  'Đang quét và lọc từ khóa quan trọng từ nội dung của bạn...',
  'Đang phác thảo danh sách chủ đề & định nghĩa tối ưu nhất...',
  'Đang dịch nghĩa chuẩn giáo trình & chọn lọc ví dụ cụ thể...',
  'Cấu trúc hóa thẻ học tập để dễ ghi nhớ nhất...',
  'Đang xuất bản học phần chất lượng cao...'
];

export const AiGenerator: React.FC<AiGeneratorProps> = ({ onGenerated }) => {
  const [activeSubTab, setActiveSubTab] = useState<'topic' | 'bulk' | 'audit'>('topic');
  const [topic, setTopic] = useState('');
  const [amount, setAmount] = useState(8);
  const [bulkText, setBulkText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Academic Audit Tool states
  const [auditSubject, setAuditSubject] = useState('Tiếng Anh');
  const [auditContent, setAuditContent] = useState('');
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditMode, setAuditMode] = useState<'fast' | 'deep'>('fast');

  // New fast import states
  const [parsedCards, setParsedCards] = useState<any[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [delimiter, setDelimiter] = useState<'auto' | 'tab' | 'dash' | 'colon'>('auto');

  // Rotate loading text messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 3000);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const parseTextToCards = (text: string, delim: 'auto' | 'tab' | 'dash' | 'colon'): any[] => {
    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const result: any[] = [];

    rawLines.forEach((line, index) => {
      let term = '';
      let definition = '';

      if (delim === 'tab' || (delim === 'auto' && line.includes('\t'))) {
        const parts = line.split('\t');
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (delim === 'colon' || (delim === 'auto' && line.includes(':'))) {
        const parts = line.split(':');
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (delim === 'dash' || (delim === 'auto' && (line.includes(' - ') || line.includes(' – ') || line.includes(' — ')))) {
        let separator = ' - ';
        if (line.includes(' – ')) separator = ' – ';
        else if (line.includes(' — ')) separator = ' — ';
        const parts = line.split(separator);
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (delim === 'auto' && line.includes('  ')) {
        const parts = line.split(/ {2,}/);
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else {
        const separatorIndex = line.indexOf(' - ') !== -1 ? line.indexOf(' - ')
                             : line.indexOf(' – ') !== -1 ? line.indexOf(' – ')
                             : line.indexOf(':') !== -1 ? line.indexOf(':')
                             : line.indexOf('-') !== -1 ? line.indexOf('-')
                             : line.indexOf('=');
        if (separatorIndex !== -1) {
          term = line.substring(0, separatorIndex).trim();
          definition = line.substring(separatorIndex + 1).trim();
        } else {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            term = parts[0].trim();
            definition = parts.slice(1).join(' ').trim();
          } else {
            term = line;
            definition = "";
          }
        }
      }

      term = term.replace(/^\d+[\.\s\-]+/, '').replace(/^[\-\*\+\s\•]+/, '').trim();
      definition = definition.trim();

      if (term) {
        result.push({
          term,
          definition: definition || `Định nghĩa học tập cho "${term}"`,
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
    
    const finalTitle = customTitle.trim() || `Học phần dán nhanh - ${dateFormatted}`;
    
    const newStudySet: StudySet = {
      id: `instant-set-${Date.now()}`,
      title: finalTitle,
      description: `Được bóc tách siêu tốc offline tự động gồm ${parsedCards.length} thuật ngữ dán trực tiếp.`,
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

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const rawSet = await generateSetClient(topic.trim(), amount);
      const newStudySet: StudySet = {
        id: `ai-set-${Date.now()}`,
        title: rawSet.title || topic,
        description: rawSet.description || `Học phần được kích hoạt tự động bằng AI về ${topic}`,
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
        throw new Error('AI không tạo ra được thẻ nào hợp lệ. Vui lòng thử lại!');
      }

      onGenerated(newStudySet);
      setTopic('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không kết nối được server. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const rawSet = await analyzeVocabClient(bulkText.trim());
      const newStudySet: StudySet = {
        id: `ai-set-${Date.now()}`,
        title: rawSet.title || "Thẻ học phân tích tự động",
        description: rawSet.description || `Được phân tích và biên soạn tự động từ nội dung nhập liệu của bạn`,
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
        throw new Error('AI không trích xuất được từ vựng nào từ văn bản này. Vui lòng kiểm tra lại nội dung.');
      }

      onGenerated(newStudySet);
      setBulkText('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không kết nối được server phân tích từ vựng. Vui lòng nhập lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcademicAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditContent.trim()) return;

    setIsAuditing(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const data = await academicAuditClient(auditSubject, auditContent.trim(), auditMode);
      setAuditResult(data);
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || 'Không kết nối được với Trợ lý Thẩm định Học thuật.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="bg-white text-slate-800 rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-xs border border-slate-100">
      <div className="relative z-10">
        
        {/* Header Title Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-brand">
            <Brain size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand">Độc quyền AI</span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-1.5 leading-tight">
              Tạo Học Phần Siêu Tốc <Sparkles size={20} className="text-amber-500 fill-amber-500" />
            </h2>
          </div>
        </div>

        {/* Sub tabs for different AI modes */}
        <div className="flex items-center border border-slate-200 bg-slate-50/70 p-1.5 rounded-xl w-fit mb-6 gap-1">
          <button
            id="subtab-generate-topic"
            type="button"
            onClick={() => {
              setActiveSubTab('topic');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'topic'
                ? 'bg-white shadow-xs text-brand'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={14} />
            Thiết kế theo chủ đề
          </button>
          <button
            id="subtab-generate-bulk"
            type="button"
            onClick={() => {
              setActiveSubTab('bulk');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'bulk'
                ? 'bg-white shadow-xs text-brand'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList size={14} />
            Phân tích danh sách & Văn bản lớn
          </button>
          <button
            id="subtab-generate-audit"
            type="button"
            onClick={() => {
              setActiveSubTab('audit');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-white shadow-xs text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={14} className="text-emerald-600 animate-pulse" />
            Thẩm định Học thuật 🔬
          </button>
        </div>

        {activeSubTab === 'topic' ? (
          <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-2xl">
            Chỉ cần gõ chủ đề bạn muốn học (ngoại ngữ, khoa học, lập trình, y khoa...), AI sẽ biên soạn toàn bộ thẻ ghi nhớ, định nghĩa chất lượng kèm ví dụ chi tiết trong nháy mắt.
          </p>
        ) : activeSubTab === 'bulk' ? (
          <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-2xl">
            Sao chép một đoạn tài liệu dài, bài viết IELTS, thuật ngữ lập trình hoặc danh sách từ vựng thô của bạn. Trí tuệ nhân tạo Gemini sẽ tự động phân tích sâu, lọc từ khóa quan trọng và thiết kế thẻ học tập hoàn chỉnh nhất.
          </p>
        ) : (
          <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-2xl">
            Nhập môn học và nội dung bài học thô để **Trợ lý Thẩm định Học thuật Cao cấp** rà soát lỗi chính tả, đối chiếu tính chuẩn xác của kiến thức/ngữ nghĩa, tạo mẫu câu ví dụ đạt chuẩn B1/B2 và dẫn chiếu nguồn chính phủ/từ điển uy tín nhất.
          </p>
        )}

        {/* LOADING BOX */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center min-h-[220px]">
            <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
            <div className="text-center h-12 flex flex-col justify-center">
              <p className="text-sm font-semibold text-slate-700 animate-pulse transition-all">
                {LOADING_STEPS[loadingStepIdx]}
              </p>
              <span className="text-xs text-slate-400 mt-2">Dựa trên nền tảng Gemini 3.5 Flash hoạt động tối ưu</span>
            </div>
            <div className="w-full max-w-md bg-slate-100 h-1.5 rounded-full overflow-hidden mt-6">
              <div 
                className="bg-brand h-full rounded-full transition-all duration-300"
                style={{ width: `${((loadingStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            {/* SUB TAB 1: GENERATE BY TOPIC FORM */}
            {activeSubTab === 'topic' && (
              <form id="ai-generator-topic-form" onSubmit={handleTopicSubmit} className="space-y-6">
                <div>
                  <label htmlFor="ai-topic-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Chủ đề muốn học tập hoặc từ vựng cần học
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      id="ai-topic-input"
                      type="text"
                      placeholder="Ví dụ: 10 từ vựng cốt lõi của React, 15 cụm từ giao tiếp khách sạn..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none text-slate-800 placeholder-slate-400 transition-all font-medium text-sm"
                    />
                    
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 sm:py-0 rounded-lg">
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Số lượng:</span>
                      <select
                        id="ai-card-amount"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="bg-transparent text-slate-800 outline-none font-bold text-sm cursor-pointer pr-4"
                      >
                        <option value={5}>5 thẻ</option>
                        <option value={8}>8 thẻ</option>
                        <option value={10}>10 thẻ</option>
                        <option value={15}>15 thẻ</option>
                        <option value={20}>20 thẻ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Suggestions list */}
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Chủ đề gợi ý phổ biến
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        id={`suggestion-${idx}`}
                        key={idx}
                        type="button"
                        onClick={() => setTopic(s)}
                        className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-full transition-colors font-medium cursor-pointer animate-fade-in"
                      >
                        💡 {s}
                      </button>
                    ))}
                  </div>
                </div>

                {errorMsg && (
                  <div id="ai-generator-error-topic" className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2.5">
                    <div className="h-5 w-5 shrink-0 rounded-full bg-rose-100 flex items-center justify-center font-bold text-xs text-rose-600">!</div>
                    <div className="flex-1">
                      <h4 className="font-bold">Lỗi khởi tạo bài học</h4>
                      <p className="mt-1 text-xs opacity-90 leading-relaxed">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-2">
                  <button
                    id="ai-generator-submit-btn"
                    type="submit"
                    disabled={!topic.trim()}
                    className={`w-full sm:w-auto px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      topic.trim()
                        ? 'bg-brand hover:bg-brand-hover text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles size={16} />
                    <span>Tự Động Tạo Bằng AI</span>
                  </button>
                </div>
              </form>
            )}

            {/* SUB TAB 2: BULK VOCAB IMPORT */}
            {activeSubTab === 'bulk' && (
              <form id="ai-generator-bulk-form" onSubmit={handleBulkSubmit} className="space-y-6 animate-fade-in text-slate-800">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                  <div>
                    <label htmlFor="ai-bulk-textarea" className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><ClipboardList size={14} className="text-brand" /> Quăng văn bản từ vựng thô vào đây</span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-normal normal-case">Hỗ trợ sao chép từ Excel/Quizlet/PDF/Docs</span>
                    </label>
                    <textarea
                      id="ai-bulk-textarea"
                      rows={6}
                      placeholder={`Ví dụ (Dán trực tiếp hoặc nhập tự do):\neconomic growth\tTăng trưởng kinh tế\neconomic development\tPhát triển kinh tế...`}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none text-slate-850 placeholder-slate-400 font-mono text-sm leading-relaxed transition-all resize-y shadow-xs"
                    />
                  </div>

                  {/* Bulk configurations */}
                  {bulkText.trim() && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs animate-fade-in relative z-20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="bulk-custom-title" className="block text-xs font-bold text-slate-500 mb-1.5">
                            Đặt tiêu đề học phần (Tùy chọn)
                          </label>
                          <input
                            id="bulk-custom-title"
                            type="text"
                            placeholder="Ví dụ: Từ vựng Kinh tế Vĩ mô..."
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-brand focus:bg-white outline-none text-xs font-semibold text-slate-800 transition"
                          />
                        </div>

                        <div>
                          <span className="block text-xs font-bold text-slate-500 mb-1.5">
                            Hình thức phân tách dấu (Delimiter)
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => setDelimiter('auto')}
                              className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                delimiter === 'auto'
                                  ? 'bg-blue-50 border-brand text-brand'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              ⚙️ Tự động
                            </button>
                            <button
                              type="button"
                              onClick={() => setDelimiter('tab')}
                              className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                delimiter === 'tab'
                                  ? 'bg-blue-50 border-brand text-brand'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              ⇥ Phím Tab
                            </button>
                            <button
                              type="button"
                              onClick={() => setDelimiter('dash')}
                              className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                delimiter === 'dash'
                                  ? 'bg-blue-50 border-brand text-brand'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              — Dấu gạch (-)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDelimiter('colon')}
                              className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                delimiter === 'colon'
                                  ? 'bg-blue-50 border-brand text-brand'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              : Dấu hai chấm (:)
                            </button>
                          </div>
                        </div>
                      </div>

                      {parsedCards.length > 0 ? (
                        <div className="border border-emerald-150 bg-emerald-50/40 rounded-xl p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">✅</span>
                              <div>
                                <h4 className="font-extrabold text-xs text-emerald-800 flex items-center gap-1">
                                  Đã bóc tách thành công: {parsedCards.length} từ vựng thô!
                                </h4>
                                <p className="text-[10px] text-emerald-600 font-medium font-sans">Bản xem trước trực quan thời gian thực. Chọn một phương thức lưu để tiếp tục.</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleInstantLocalCreate}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 uppercase tracking-wide"
                            >
                              <Zap size={14} fill="currentColor" />
                              <span>Tạo Học Phần Ăn Ngay ⚡</span>
                            </button>
                          </div>

                          {/* Live preview cards box */}
                          <div className="bg-white border border-emerald-100 rounded-lg max-h-44 overflow-y-auto p-2.5 divide-y divide-slate-100 text-[11px] font-mono shadow-inner">
                            {parsedCards.map((c, i) => (
                              <div key={i} className="py-2 flex items-start gap-4 hover:bg-slate-50 px-2 rounded transition">
                                <span className="text-slate-400 font-bold shrink-0 w-6">{i + 1}.</span>
                                <span className="text-emerald-700 font-extrabold shrink-0 w-1/3 truncate" title={c.term}>{c.term}</span>
                                <span className="text-slate-600 flex-1 truncate ml-1 text-left font-medium" title={c.definition}>{c.definition}</span>
                              </div>
                            ))}
                          </div>
                          
                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1 flex items-start gap-1">
                            <span>💡</span>
                            <span><strong>Mẹo:</strong> Nút <strong>Tạo Học Phần Ăn Ngay ⚡</strong> sẽ hoàn tất trong <strong>0.1 giây</strong> và lưu giữ đầy đủ 100% {parsedCards.length} từ của bạn mà không lo bị mô hình AI nén lại hay trì hoãn!</span>
                          </p>
                        </div>
                      ) : (
                        <div className="border border-amber-100 bg-amber-50/50 p-3 rounded-lg text-amber-800 text-xs flex items-center gap-2 font-sans">
                          <AlertCircle size={14} />
                          <span>Mã phân tích chưa nhận dạng được dòng từ nào thích hợp. Vui lòng kiểm tra lại xuống dòng hoặc dán một định dạng khác.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bulk interactive templates/examples */}
                {!bulkText.trim() && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Lấy mẫu cấu trúc từ vựng nhanh để thử nghiệm
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {BULK_EXAMPLES.map((example, idx) => (
                        <div
                          id={`bulk-example-box-${idx}`}
                          key={idx}
                          onClick={() => setBulkText(example.text)}
                          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-brand rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs group"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1 group-hover:text-brand transition-colors">
                              <FileText size={12} className="text-slate-400 group-hover:text-brand" /> {example.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                              {example.description}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-brand mt-3.5 block hover:underline">Sử dụng mẫu này →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div id="ai-generator-error-bulk" className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2.5">
                    <div className="h-5 w-5 shrink-0 rounded-full bg-rose-100 flex items-center justify-center font-bold text-xs text-rose-600 font-sans">!</div>
                    <div className="flex-1 font-sans">
                      <h4 className="font-bold">Lỗi phân tích nội dung</h4>
                      <p className="mt-1 text-xs opacity-90 leading-relaxed">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {bulkText.trim() && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-150">
                    <div className="text-xs text-slate-500 font-medium font-sans">
                      🤖 Hoặc bạn có thể chọn chạy phân tích sâu thông minh bằng tiếng Anh/Việt từ mô hình.
                    </div>
                    <button
                      id="ai-generator-bulk-submit-btn"
                      type="submit"
                      className="px-6 py-3 bg-brand hover:bg-[#3444cc] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Brain size={14} />
                      <span>Phân Tích & Giao Việc Cho AI Gemini 🤖</span>
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* SUB TAB 3: ACADEMIC AUDIT TOOL */}
            {activeSubTab === 'audit' && (
              <div className="space-y-6 animate-fade-in text-slate-800">
                {isAuditing ? (
                  <div className="py-12 flex flex-col items-center justify-center min-h-[250px] bg-slate-50/50 rounded-2xl border border-slate-100">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                    <div className="text-center space-y-2 animate-fade-in">
                      <p className="text-sm font-black text-slate-800 animate-pulse uppercase tracking-wider">
                        ĐANG TIẾN HÀNH THẨM ĐỊNH CHẤT LƯỢNG HỌC THUẬT...
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Hệ thống đang rà soát chính tả, đối chiếu kho từ điển thế giới (Oxford, Cambridge) và kiểm chứng tài liệu chính thống để đưa ra báo cáo chuẩn xác nhất.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form id="academic-audit-form" onSubmit={handleAcademicAuditSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                          Môn học / Ngôn ngữ
                        </label>
                        <select
                          value={auditSubject}
                          onChange={(e) => setAuditSubject(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none text-slate-800 font-bold text-sm cursor-pointer"
                        >
                          <option value="Tiếng Anh">Tiếng Anh (English)</option>
                          <option value="Ngữ văn">Ngữ văn (Literature - Check Viện Văn học & Chính phủ)</option>
                          <option value="Lịch sử">Lịch sử (History - Check Viện Sử học & Chính phủ)</option>
                          <option value="Địa lý">Địa lý (Geography - Check Tổng cục Thống kê & Viện Địa lý)</option>
                          <option value="Toán học">Toán học (Mathematics)</option>
                          <option value="Vật lý">Vật lý (Physics)</option>
                          <option value="Hóa học">Hóa học (Chemistry)</option>
                          <option value="Lập trình / CNTT">Lập trình / Công nghệ thông tin</option>
                          <option value="Sinh học">Sinh học (Biology)</option>
                          <option value="Khác">Môn học khác...</option>
                        </select>
                        
                        {auditSubject === 'Khác' && (
                          <input
                            type="text"
                            placeholder="Nhập tên môn học..."
                            onChange={(e) => setAuditSubject(e.target.value)}
                            className="mt-3 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand outline-none"
                          />
                        )}

                        <div className="mt-4">
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                            Tốc độ xử lý
                          </label>
                          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setAuditMode('fast')}
                              className={`py-2 px-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                auditMode === 'fast'
                                  ? 'bg-white text-emerald-600 shadow-xs'
                                  : 'text-slate-550 hover:text-slate-800'
                              }`}
                            >
                              ⚡ Siêu tốc
                            </button>
                            <button
                              type="button"
                              onClick={() => setAuditMode('deep')}
                              className={`py-2 px-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                auditMode === 'deep'
                                  ? 'bg-white text-blue-600 shadow-xs'
                                  : 'text-slate-550 hover:text-slate-800'
                              }`}
                            >
                              🔬 Chuyên sâu
                            </button>
                          </div>
                          <p className="mt-1.5 text-[10px] text-slate-450 leading-relaxed font-semibold">
                            {auditMode === 'fast' 
                              ? '⚡ Ưu tiên tốc độ: AI phản hồi siêu tốc dưới 2 giây.' 
                              : '🔬 Đối chiếu học thuật sâu hơn: AI rà soát kỹ lưỡng mất khoảng 5-10 giây.'}
                          </p>
                        </div>
                        
                        <div className="mt-4 p-4 rounded-xl border border-slate-100 bg-slate-50 text-[11px] text-slate-500 leading-relaxed font-medium space-y-2">
                          <p className="font-bold text-slate-700">📌 Quy chuẩn Thẩm định:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li><strong>Tiếng Anh:</strong> Oxford, Cambridge, Longman.</li>
                            <li><strong>Văn - Sử - Địa:</strong> Do 3 môn này liên quan mật thiết và cần độ chuẩn xác cao, hệ thống sẽ đối chiếu chéo giữa Cổng TT Điện tử Chính phủ (chinhphu.vn), Cục Đo đạc Bản đồ, Tổng cục Thống kê (gso.gov.vn), Viện Văn học, Viện Sử học, Viện Địa lý, Bảo tàng Lịch sử QG và Bộ Giáo dục & Đào tạo.</li>
                            <li><strong>Toán/Lý/Hóa:</strong> Sách giáo khoa chuẩn quốc gia (Kết nối tri thức, Chân trời sáng tạo, Cánh diều).</li>
                          </ul>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                            Nội dung cần kiểm tra (Từ vựng, Khái niệm, Lý thuyết thô...)
                          </label>
                          <textarea
                            rows={5}
                            placeholder="Nhập nội dung bạn cần thẩm định ở đây..."
                            value={auditContent}
                            onChange={(e) => setAuditContent(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none text-slate-850 placeholder-slate-400 font-medium text-sm leading-relaxed transition-all resize-none shadow-2xs"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={!auditContent.trim()}
                            className={`px-6 py-3.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                              auditContent.trim()
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <ShieldCheck size={16} />
                            <span>Bắt đầu Thẩm định Học thuật 🔬</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {auditError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Lỗi thẩm định</h4>
                      <p className="mt-1 text-xs opacity-90 leading-relaxed">{auditError}</p>
                    </div>
                  </div>
                )}

                {auditResult && (
                  <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/30 space-y-6 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-850 text-sm tracking-wide uppercase">BÁO CÁO THẨM ĐỊNH CHẤT LƯỢNG CAO CẤP</h3>
                          <p className="text-[10px] text-slate-500 font-bold">Môn học/Ngôn ngữ: {auditSubject}</p>
                        </div>
                      </div>
                      
                      {/* Interactive Button to Generate Flashcard right from the Audit Report */}
                      <button
                        type="button"
                        onClick={() => {
                          const cleanTerm = auditResult.corrected_content ? auditResult.corrected_content.replace(/\*\*|\*/g, '') : auditContent;
                          const cleanDef = auditResult.explanation?.reason ? `${auditResult.explanation.reason}\n\nNguồn: ${auditResult.sources?.[0]?.title || 'Học thuật chuẩn'}` : 'Đã được thẩm định';
                          const newStudySet: StudySet = {
                            id: `audit-set-${Date.now()}`,
                            title: `Thẩm định: ${cleanTerm.substring(0, 30)}`,
                            description: `Kết quả thẩm định học thuật cho nội dung "${cleanTerm}"`,
                            createdAt: new Date().toISOString(),
                            favorite: false,
                            isGenerated: true,
                            cards: [{
                              id: `audit-card-${Date.now()}`,
                              term: cleanTerm,
                              definition: cleanDef,
                              example: auditResult.explanation?.examples || '',
                              exampleTranslation: 'Đã dịch nghĩa học thuật'
                            }]
                          };
                          onGenerated(newStudySet);
                          // Notification
                          alert('🎉 Đã xuất thẻ ghi nhớ thẩm định thành công vào kho bài học của bạn!');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-indigo-200 transition flex items-center gap-1.5"
                      >
                        <Zap size={12} fill="currentColor" /> Xuất thẻ Flashcard ⚡
                      </button>
                    </div>

                    <div className="space-y-6 divide-y divide-slate-150">
                      
                      {/* SECTION 1: BÁO CÁO THẨM ĐỊNH (Diagnostic Report) */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-indigo-950 tracking-widest flex items-center gap-1.5 pt-4">
                          <Search size={14} className="text-indigo-600" />
                          <span>🔎 1. BÁO CÁO THẨM ĐỊNH (Diagnostic Report)</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Trạng thái Chính tả/Cú pháp:</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                                auditResult.status_spelling?.toLowerCase().includes('chính xác')
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {auditResult.status_spelling || 'CHƯA RÕ'}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Trạng thái Ngữ nghĩa/Kiến thức:</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                                auditResult.status_semantic?.toLowerCase().includes('đạt chuẩn') || auditResult.status_semantic?.toLowerCase().includes('chính xác')
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {auditResult.status_semantic || 'CHƯA RÕ'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: NỘI DUNG ĐÃ CHỈNH SỬA CHUẨN HÓA */}
                      <div className="pt-5 space-y-3">
                        <h4 className="text-xs font-black uppercase text-indigo-950 tracking-widest flex items-center gap-1.5 pt-4">
                          <Check size={14} className="text-emerald-600" />
                          <span>📝 2. NỘI DUNG ĐÃ CHỈNH SỬA CHUẨN HÓA</span>
                        </h4>
                        
                        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                          <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-semibold">
                            {auditResult.corrected_content?.split('**').map((chunk: string, index: number) => 
                              index % 2 === 1 ? <strong key={index} className="text-brand font-black underline decoration-indigo-200 decoration-2 underline-offset-4">{chunk}</strong> : chunk
                            ) || auditContent}
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: GIẢI THÍCH HỌC THUẬT CHI TIẾT */}
                      <div className="pt-5 space-y-4">
                        <h4 className="text-xs font-black uppercase text-indigo-950 tracking-widest flex items-center gap-1.5 pt-4">
                          <HelpCircle size={14} className="text-indigo-600" />
                          <span>💡 3. GIẢI THÍCH HỌC THUẬT CHI TIẾT</span>
                        </h4>
                        
                        <div className="space-y-3.5">
                          <div className="p-4 bg-white border border-slate-150 rounded-xl space-y-1.5">
                            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">🔍 Nguyên nhân lỗi / logic:</span>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold italic">
                              "{auditResult.explanation?.reason || 'Không phát hiện lỗi hoặc sai lệch kiến thức nào.'}"
                            </p>
                          </div>

                          {auditResult.explanation?.distinction && (
                            <div className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-xl space-y-1.5 animate-fade-in">
                              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest block">🧪 Phân biệt tinh tế:</span>
                              <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed font-medium">
                                {auditResult.explanation.distinction}
                              </p>
                            </div>
                          )}

                          {auditResult.explanation?.examples && (
                            <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-1.5">
                              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">🎯 Ví dụ thực hành nâng cao:</span>
                              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                                {auditResult.explanation.examples}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SECTION 4: NGUỒN ĐỐI CHIẾU THỰC TẾ & KIỂM CHỨNG */}
                      {auditResult.sources && auditResult.sources.length > 0 && (
                        <div className="pt-5 space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-widest flex items-center gap-1.5 pt-4">
                            <BookOpen size={14} className="text-amber-600" />
                            <span>📚 4. NGUỒN ĐỐI CHIẾU THỰC TẾ & KIỂM CHỨNG (Academic Sources)</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {auditResult.sources.map((source: any, idx: number) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                                className="p-4 bg-white border border-slate-150 rounded-xl hover:border-brand hover:shadow-xs transition flex items-start gap-3 group"
                              >
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-brand/10 group-hover:text-brand transition shrink-0 mt-0.5">
                                  <ExternalLink size={14} />
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-brand transition break-words">
                                    {source.title}
                                  </p>
                                  <p className="text-[10px] text-slate-450 truncate font-semibold">
                                    {source.url}
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
