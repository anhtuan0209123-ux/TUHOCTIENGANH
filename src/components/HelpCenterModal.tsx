import React, { useState, useMemo } from 'react';
import { 
  userGuideData, 
  GuideSection, 
  getYouTubeEmbedUrl 
} from '../data/userGuideData';
import { 
  BookOpen, Key, Sparkles, Layers, AlertTriangle, 
  Search, X, Play, ExternalLink, ChevronRight, ChevronDown, 
  HelpCircle, Lightbulb, Video, Info, Copy, Check, ArrowRight
} from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'sets' | 'folders' | 'ai' | 'analytics') => void;
  onOpenApiKeyModal?: () => void;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenApiKeyModal,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const activeSection = useMemo(() => {
    return userGuideData.sections.find(s => s.id === activeSectionId) || userGuideData.sections[0];
  }, [activeSectionId]);

  // Search filtering logic across all sections and FAQs
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return userGuideData.sections;

    const q = searchQuery.toLowerCase().trim();
    return userGuideData.sections.filter(sec => {
      const matchTitle = sec.title.toLowerCase().includes(q) || sec.description.toLowerCase().includes(q);
      const matchSummary = sec.summary.toLowerCase().includes(q);
      const matchHighlights = sec.highlights?.some(h => h.toLowerCase().includes(q));
      const matchSteps = sec.steps?.some(st => st.title.toLowerCase().includes(q) || st.detail.toLowerCase().includes(q));
      const matchFaqs = sec.faqs?.some(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
      
      return matchTitle || matchSummary || matchHighlights || matchSteps || matchFaqs;
    });
  }, [searchQuery]);

  const embedVideoUrl = useMemo(() => {
    return getYouTubeEmbedUrl(userGuideData.videoUrl);
  }, []);

  // Icon mapping helper
  const renderSectionIcon = (iconName: string, size: number = 18) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen size={size} />;
      case 'Key': return <Key size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      case 'Layers': return <Layers size={size} />;
      case 'AlertTriangle': return <AlertTriangle size={size} />;
      default: return <HelpCircle size={size} />;
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl my-auto max-h-[92vh] flex flex-col overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-brand text-white p-2 rounded-xl flex items-center justify-center shadow-xs">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  Trung Tâm Trợ Giúp & Hướng Dẫn
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-brand-light text-brand rounded-full">
                  {userGuideData.version}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Cẩm nang toàn tập phương pháp học thuộc thông minh, kết nối AI & xử lý sự cố
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm từ khóa (ví dụ: API Key, bóc tách AI, Spaced Repetition, lỗi permission...)"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand focus:bg-white rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Tìm thấy {filteredSections.length} chuyên mục phù hợp với "{searchQuery}"</span>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-brand hover:underline font-bold"
              >
                Xóa tìm kiếm
              </button>
            </div>
          )}
        </div>

        {/* Body Layout: Sidebar + Main Content */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
          
          {/* Left Navigation Sidebar */}
          <div className="w-full md:w-72 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 p-3 sm:p-4 flex flex-col gap-1 shrink-0 overflow-y-auto">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Danh mục hướng dẫn
            </div>

            {filteredSections.map((section) => {
              const isActive = activeSectionId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSectionId(section.id);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-brand text-white shadow-sm font-bold ring-1 ring-brand-hover'
                      : 'hover:bg-slate-200/60 text-slate-700 font-medium'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-brand'}`}>
                    {renderSectionIcon(section.icon, 16)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate leading-tight">
                        {section.title}
                      </span>
                      {section.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold shrink-0 ${
                          isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}

            <div className="mt-auto pt-4 border-t border-slate-200/80 px-2">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-xl p-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1">
                  <Info size={14} className="text-blue-600 shrink-0" />
                  <span>Cập nhật mới</span>
                </div>
                <p className="text-blue-700/80 text-[11px] leading-relaxed">
                  Đã cập nhật hệ thống phím tắt & video hướng dẫn mới nhất {userGuideData.lastUpdated}.
                </p>
              </div>
            </div>
          </div>

          {/* Right Main Content Scroll Area */}
          <div className="flex-1 p-5 sm:p-6 md:p-8 overflow-y-auto space-y-8 bg-white">

            {/* VIDEO TUTORIAL PLAYER EMBEDDED SECTION */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500 text-white p-1.5 rounded-lg flex items-center justify-center">
                    <Video size={16} />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">
                    {userGuideData.videoTitle}
                  </h3>
                </div>
                <a 
                  href={userGuideData.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0"
                >
                  <span>Xem trên YouTube</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Responsive 16:9 Video Player */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-white/10">
                <iframe
                  src={embedVideoUrl}
                  title={userGuideData.videoTitle}
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {userGuideData.videoDescription}
              </p>
            </div>

            {/* SECTION DETAIL DISPLAY */}
            <div className="space-y-6">
              {/* Section Header Banner */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-2 bg-brand-light text-brand rounded-xl font-bold">
                    {renderSectionIcon(activeSection.icon, 20)}
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand">
                    {activeSection.badge || "Hướng dẫn học thuật"}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {activeSection.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {activeSection.summary}
                </p>
              </div>

              {/* Highlights List */}
              {activeSection.highlights && activeSection.highlights.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Điểm nổi bật cốt lõi
                  </h4>
                  <ul className="space-y-2">
                    {activeSection.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <span className="p-1 bg-emerald-100 text-emerald-700 rounded-full mt-0.5 shrink-0">
                          <Check size={10} />
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Action Button contextually */}
              {activeSection.id === 'api-config' && onOpenApiKeyModal && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-amber-900">Thao tác nhanh</h5>
                    <p className="text-xs text-amber-800">Nhập hoặc thay đổi Google Gemini API Key ngay lập tức</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenApiKeyModal();
                    }}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Key size={14} /> Cấu hình API Key
                  </button>
                </div>
              )}

              {activeSection.id === 'ai-workflow' && onNavigateToTab && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-indigo-900">Trải nghiệm ngay</h5>
                    <p className="text-xs text-indigo-800">Mở công cụ bóc tách tài liệu bài giảng tự động bằng AI</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab('ai');
                    }}
                    className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles size={14} /> Mở Bóc Tách AI <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Steps List */}
              {activeSection.steps && activeSection.steps.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                    <span>Quy trình thực hiện theo các bước</span>
                  </h4>

                  <div className="space-y-3">
                    {activeSection.steps.map((step, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-4 hover:border-brand/40 transition shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-brand text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <h5 className="font-bold text-sm text-slate-900">
                              {step.title}
                            </h5>
                            <p className="text-xs text-slate-650 leading-relaxed">
                              {step.detail}
                            </p>
                            {step.tip && (
                              <div className="mt-2 text-[11px] font-medium text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                <Lightbulb size={12} className="text-amber-600 shrink-0" />
                                <span>{step.tip}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs Accordion Section */}
              {activeSection.faqs && activeSection.faqs.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h4 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                    <HelpCircle size={16} className="text-brand" />
                    <span>Các câu hỏi thường gặp & Giải pháp sự cố</span>
                  </h4>

                  <div className="space-y-2.5">
                    {activeSection.faqs.map((faq, idx) => {
                      const isOpenFaq = openFaqIndex === idx;
                      return (
                        <div 
                          key={idx}
                          className="border border-slate-200 rounded-xl overflow-hidden transition bg-white"
                        >
                          <button
                            onClick={() => setOpenFaqIndex(isOpenFaq ? null : idx)}
                            className="w-full text-left p-3.5 sm:p-4 bg-slate-50/50 hover:bg-slate-100/80 font-bold text-xs sm:text-sm text-slate-850 flex items-center justify-between gap-3 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              {faq.tag && (
                                <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-extrabold shrink-0">
                                  {faq.tag}
                                </span>
                              )}
                              <span>{faq.question}</span>
                            </span>
                            {isOpenFaq ? <ChevronDown size={16} className="text-brand shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                          </button>

                          {isOpenFaq && (
                            <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-700 leading-relaxed space-y-2.5 animate-fade-in">
                              <p>{faq.answer}</p>
                              
                              {faq.codeSnippet && (
                                <div className="relative bg-slate-900 text-slate-100 font-mono text-[11px] rounded-lg p-3 overflow-x-auto">
                                  <code>{faq.codeSnippet}</code>
                                  <button
                                    onClick={() => handleCopy(faq.codeSnippet!, `faq-${idx}`)}
                                    className="absolute right-2 top-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition flex items-center gap-1"
                                  >
                                    {copiedText === `faq-${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    <span>{copiedText === `faq-${idx}` ? 'Đã chép' : 'Sao chép'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pro Tip Callout */}
              {activeSection.proTip && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 bg-blue-500 text-white rounded-lg shrink-0 mt-0.5">
                    <Lightbulb size={18} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-blue-900 mb-1">
                      Mẹo học tập chuyên sâu (Pro-tip)
                    </h5>
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      {activeSection.proTip}
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Đã tích hợp Video Tutorial trực tiếp</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer text-xs"
          >
            Đã hiểu & Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
