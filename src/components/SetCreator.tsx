import React, { useState } from 'react';
import { Card, StudySet } from '../types';
import { Plus, Trash2, Save } from 'lucide-react';
import { checkIsRepeatedTerm } from '../utils/stringMatcher';

interface SetCreatorProps {
  initialSet?: StudySet | null; // If editing
  onSave: (set: StudySet) => void;
  onCancel: () => void;
  existingSets?: StudySet[];
}

export const SetCreator: React.FC<SetCreatorProps> = ({
  initialSet,
  onSave,
  onCancel,
  existingSets = [],
}) => {
  const isEditing = !!initialSet;

  const [title, setTitle] = useState(initialSet?.title || '');
  const [description, setDescription] = useState(initialSet?.description || '');
  const [cards, setCards] = useState<Card[]>(
    initialSet?.cards || [
      { id: '1', term: '', definition: '', example: '' },
      { id: '2', term: '', definition: '', example: '' },
    ]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQuickImport, setShowQuickImport] = useState(false);
  const [quickImportText, setQuickImportText] = useState('');
  const [delimiter, setDelimiter] = useState<'auto' | 'tab' | 'dash' | 'colon'>('auto');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const handleProcessQuickImport = (mode: 'replace' | 'append') => {
    setErrorMsg(null);
    setImportSuccessMsg(null);

    const txt = quickImportText.trim();
    if (!txt) {
      setErrorMsg('Vui lòng dán văn bản danh sách từ vựng vào ô nhập nhanh!');
      return;
    }

    const lines = txt.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) {
      setErrorMsg('Không thể bóc tách dòng từ vựng nào hợp lệ!');
      return;
    }

    const newParsedCards: Card[] = [];

    lines.forEach((line, index) => {
      let term = '';
      let definition = '';

      // Support tab, colon, dash, equals, vertical bar, double space separator
      if (delimiter === 'tab' || (delimiter === 'auto' && line.includes('\t'))) {
        const parts = line.split('\t');
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (delimiter === 'colon' || (delimiter === 'auto' && line.includes(':'))) {
        const parts = line.split(':');
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (delimiter === 'dash' || (delimiter === 'auto' && (line.includes(' - ') || line.includes(' – ') || line.includes(' — ')))) {
        let separator = ' - ';
        if (line.includes(' – ')) separator = ' – ';
        else if (line.includes(' — ')) separator = ' — ';
        const parts = line.split(separator);
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (delimiter === 'auto' && line.includes('  ')) {
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
          // split by first group of whitespaces if no delimiters match
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            term = parts[0].trim();
            definition = parts.slice(1).join(' ').trim();
          } else {
            term = line;
            definition = "Định nghĩa cho " + line;
          }
        }
      }

      // Strip leading bullet formats e.g. "1. obvious" or "- obvious"
      term = term.replace(/^\d+[\.\s\-]+/, '').replace(/^[\-\*\+\s\•]+/, '').trim();

      if (term) {
        newParsedCards.push({
          id: `manual-card-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
          term,
          definition: definition || `Định nghĩa học tập cho "${term}"`,
          example: ''
        });
      }
    });

    if (newParsedCards.length === 0) {
      setErrorMsg('Không thể bóc tách từ vựng từ văn bản nhập liệu. Hãy đảm bảo từ vựng và định nghĩa được phân cách rõ ràng!');
      return;
    }

    if (mode === 'replace') {
      setCards(newParsedCards);
      setImportSuccessMsg(`🎉 Đã nhập thành công ${newParsedCards.length} thẻ ghi nhớ mới! (Các thẻ cũ đã được dọn sạch)`);
    } else {
      const activeOriginals = cards.filter(c => c.term.trim() || c.definition.trim());
      setCards([...activeOriginals, ...newParsedCards]);
      setImportSuccessMsg(`🎉 Đã nối thêm thành công ${newParsedCards.length} thẻ ghi nhớ mới vào học phần hiện tại!`);
    }

    setQuickImportText('');
    setShowQuickImport(false);
  };

  const handleAddCard = () => {
    const newId = `manual-card-${Date.now()}-${cards.length + 1}`;
    setCards([...cards, { id: newId, term: '', definition: '', example: '' }]);
  };

  const handleRemoveCard = (id: string) => {
    if (cards.length <= 2) {
      setErrorMsg('Một học phần phải có tối thiểu 2 thẻ từ vựng!');
      return;
    }
    setCards(cards.filter((card) => card.id !== id));
  };

  const handleCardChange = (id: string, field: keyof Card, value: string) => {
    setErrorMsg(null);
    setCards(
      cards.map((card) => {
        if (card.id === id) {
          return { ...card, [field]: value };
        }
        return card;
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Vui lòng điền tiêu đề học phần!');
      return;
    }

    // Validate cards
    const emptyCards = cards.filter(
      (c) => !c.term.trim() || !c.definition.trim()
    );
    if (emptyCards.length > 0) {
      setErrorMsg('Vui lòng điền đầy đủ Thuật ngữ và Định nghĩa cho tất cả các thẻ!');
      return;
    }

    const savedSet: StudySet = {
      id: initialSet?.id || `manual-set-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      favorite: initialSet?.favorite || false,
      createdAt: initialSet?.createdAt || new Date().toISOString(),
      isGenerated: initialSet?.isGenerated || false,
      cards: cards.map((c, idx) => {
        const cleanTerm = c.term.trim();
        const cleanId = c.id.startsWith('manual-') || c.id.startsWith('ai-') ? c.id : `card-${idx}-${Date.now()}`;
        const checkRepeat = checkIsRepeatedTerm(cleanTerm, c.id, initialSet?.id, existingSets, cards);
        return {
          ...c,
          id: cleanId,
          term: cleanTerm,
          definition: c.definition.trim(),
          example: c.example?.trim() || '',
          exampleTranslation: c.exampleTranslation?.trim() || '',
          isRepeated: checkRepeat.isRepeated,
          repeatSources: checkRepeat.sourceSets,
        };
      }),
    };

    onSave(savedSet);
  };

  return (
    <div className="bg-[#fafbfc] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-xl border border-slate-100 shadow-xs">
          <div>
            <h2 id="creator-workspace-heading" className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {isEditing ? 'Chỉnh Sửa Học Phần' : 'Tạo Học Phần Mới'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isEditing
                ? 'Cập nhật nội dung các thẻ ghi nhớ và thông tin'
                : 'Thêm tiêu đề, thuật ngữ học tập để xây dựng khóa học của riêng bạn'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="creator-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              id="creator-save-btn"
              onClick={handleSave}
              className="px-5 py-2.5 bg-brand hover:bg-[#3444cc] text-white rounded-lg font-bold text-sm shadow-sm flex items-center gap-1.5 transition"
            >
              <Save size={16} />
              <span>Lưu Học Phần</span>
            </button>
          </div>
        </div>

        {/* Error alerting */}
        {errorMsg && (
          <div id="creator-error-alert" className="mb-6 p-4 bg-rose-50 border border-rose-150 text-rose-700 rounded-lg font-bold text-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        {importSuccessMsg && (
          <div id="creator-success-alert" className="mb-6 p-4 bg-teal-50 border border-teal-150 text-teal-800 rounded-lg font-bold text-sm">
            {importSuccessMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Main info set fields */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <label htmlFor="set-title-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tiêu đề học phần *
              </label>
              <input
                id="set-title-input"
                type="text"
                placeholder='Nhập tiêu đề, ví dụ: "Anh Văn Giao Tiếp - Chủ Đề Ăn Uống"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand rounded-lg outline-none font-bold text-slate-800 transition"
              />
            </div>
            <div>
              <label htmlFor="set-desc-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mô tả (không bắt buộc)
              </label>
              <textarea
                id="set-desc-input"
                placeholder="Mô tả tóm tắt nội dung học phần để dễ dàng quản lý"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand rounded-lg outline-none text-slate-750 transition resize-none"
              />
            </div>
          </div>

          {/* Quick Import Panel */}
          <div className="bg-slate-50 p-5 rounded-xl border border-dashed border-slate-200 shadow-xs transition duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📋</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Nhập Danh Sách Từ Vực Nhanh (Quick Import)</h4>
                  <p className="text-xs text-slate-500">Dán trực tiếp danh sách từ của bạn (Hỗ trợ Tab, Dấu gạch ngang, Dấu hai chấm, Khoảng trắng)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowQuickImport(!showQuickImport);
                  setErrorMsg(null);
                  setImportSuccessMsg(null);
                }}
                className={`px-4 py-2 font-bold text-xs rounded-lg transition-all cursor-pointer ${
                  showQuickImport 
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-350' 
                    : 'bg-brand hover:bg-[#3444cc] text-white'
                }`}
              >
                {showQuickImport ? 'Đóng bảng nhập' : '📋 Mở Bảng Nhập Nhanh'}
              </button>
            </div>

            {showQuickImport && (
              <div className="mt-4 space-y-4 animate-fade-in relative z-20">
                <textarea
                  id="quick-import-textarea"
                  placeholder={`Ví dụ:\neconomic growth\tTăng trưởng kinh tế\neconomic development\tPhát triển kinh tế\n...`}
                  value={quickImportText}
                  onChange={(e) => setQuickImportText(e.target.value)}
                  rows={8}
                  className="w-full p-4 bg-white border border-slate-200 focus:border-brand rounded-lg outline-none font-mono text-xs text-slate-800 leading-relaxed placeholder-slate-400 transition"
                />
                
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 border border-slate-150 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Dấu phân tách:</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <label id="lbl-delim-auto" className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="delimiter-selector"
                          checked={delimiter === 'auto'}
                          onChange={() => setDelimiter('auto')}
                          className="text-brand focus:ring-brand"
                        />
                        <span>Tự động</span>
                      </label>
                      <label id="lbl-delim-tab" className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="delimiter-selector"
                          checked={delimiter === 'tab'}
                          onChange={() => setDelimiter('tab')}
                          className="text-brand focus:ring-brand"
                        />
                        <span>Phím Tab</span>
                      </label>
                      <label id="lbl-delim-dash" className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="delimiter-selector"
                          checked={delimiter === 'dash'}
                          onChange={() => setDelimiter('dash')}
                          className="text-brand focus:ring-brand"
                        />
                        <span>Dấu gạch (-)</span>
                      </label>
                      <label id="lbl-delim-colon" className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="delimiter-selector"
                          checked={delimiter === 'colon'}
                          onChange={() => setDelimiter('colon')}
                          className="text-brand focus:ring-brand"
                        />
                        <span>Dấu hai chấm (:)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="quick-import-append-btn"
                      type="button"
                      onClick={() => handleProcessQuickImport('append')}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Nối Thêm vào Học phần
                    </button>
                    <button
                      id="quick-import-replace-btn"
                      type="button"
                      onClick={() => handleProcessQuickImport('replace')}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-brand hover:bg-[#3444cc] text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Nhập Mới & Ghi Đè hoàn toàn
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  💡 <strong>Mẹo:</strong> Hoàn hảo để sao chép nguyên bảng từ Excel/Word/Quizlet hay dán trực tiếp danh sách từ vựng từ đề bài/tiết giảng dạy của bạn một cách nhanh chóng.
                </p>
              </div>
            )}
          </div>

          {/* Cards title division */}
          <div className="flex items-center justify-between pt-4">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Danh sách thẻ ghi nhớ ({cards.length})
            </h3>
            <button
              id="add-card-header-btn"
              type="button"
              onClick={handleAddCard}
              className="px-4 py-2 hover:bg-slate-50 text-brand hover:text-[#3444cc] rounded-lg border border-slate-200 font-bold text-xs flex items-center gap-1 transition"
            >
              <Plus size={14} /> Thêm Thẻ Từ
            </button>
          </div>

          {/* Dynamic Cards list */}
          <div className="space-y-5">
            {cards.map((card, index) => (
              <div
                id={`creator-card-row-${card.id}`}
                key={card.id}
                className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs relative group"
              >
                {/* Index & Control panel */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-xs font-bold text-slate-400">
                  <span className="text-sm font-extrabold text-slate-500">Mục {index + 1}</span>
                  <button
                    id={`remove-card-btn-${card.id}`}
                    type="button"
                    onClick={() => handleRemoveCard(card.id)}
                    className="p-1 px-2.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-150 hover:text-rose-600 flex items-center gap-1 transition"
                  >
                    <Trash2 size={13} />
                    <span>Xóa dòng này</span>
                  </button>
                </div>

                {/* Term and explanation fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  {/* Term */}
                  <div>
                    <label htmlFor={`card-${card.id}-term`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Thuật ngữ (Term) *
                    </label>
                    <input
                      id={`card-${card.id}-term`}
                      type="text"
                      placeholder="Keyword / Ý chính"
                      value={card.term}
                      onChange={(e) => handleCardChange(card.id, 'term', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand rounded-lg outline-none text-slate-850 font-medium transition"
                    />
                    {(() => {
                      const repeatCheck = checkIsRepeatedTerm(card.term, card.id, initialSet?.id, existingSets, cards);
                      if (repeatCheck.isRepeated) {
                        return (
                          <div className="mt-1.5 text-rose-605 text-[10px] font-bold flex items-center gap-1 bg-rose-50/70 border border-rose-105 p-1.5 px-2.5 rounded-lg animate-fade-in">
                            <span>⚠️ Từ vựng lặp: Đã học trong <strong>"{repeatCheck.sourceSets.join(', ')}"</strong>. Sẽ tự động kích hoạt ôn tập tăng cường!</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Definition */}
                  <div>
                    <label htmlFor={`card-${card.id}-def`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Định nghĩa (Definition) *
                    </label>
                    <input
                      id={`card-${card.id}-def`}
                      type="text"
                      placeholder="Nghĩa chi tiết / Diễn giải"
                      value={card.definition}
                      onChange={(e) => handleCardChange(card.id, 'definition', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand rounded-lg outline-none text-slate-850 font-medium transition"
                    />
                  </div>
                </div>

                {/* Example sentence usage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`card-${card.id}-ex`} className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                      Ví dụ minh họa (không bắt buộc)
                    </label>
                    <input
                      id={`card-${card.id}-ex`}
                      type="text"
                      placeholder="Câu mẫu / Ngữ cảnh thực tế"
                      value={card.example || ''}
                      onChange={(e) => handleCardChange(card.id, 'example', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand rounded-lg outline-none text-xs text-slate-650 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor={`card-${card.id}-ex-translation`} className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                      Dịch nghĩa câu ví dụ (không bắt buộc)
                    </label>
                    <input
                      id={`card-${card.id}-ex-translation`}
                      type="text"
                      placeholder="Bản dịch của câu ví dụ trên"
                      value={card.exampleTranslation || ''}
                      onChange={(e) => handleCardChange(card.id, 'exampleTranslation', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand rounded-lg outline-none text-xs text-slate-650 transition"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add card footer banner button */}
          <div className="pt-2">
            <button
              id="add-card-footer-btn"
              type="button"
              onClick={handleAddCard}
              className="w-full p-5 bg-white border border-dashed border-slate-300 hover:border-brand text-brand hover:text-[#3444cc] rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
            >
              <Plus size={20} />
              <span>Thêm Thẻ Mới Vào Danh Sách</span>
            </button>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex justify-end items-center gap-4 pt-6 pb-12 border-t border-slate-250">
            <button
              id="creator-footer-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-6 py-3 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Hủy bỏ thay đổi
            </button>
            <button
              id="creator-footer-save-btn"
              type="submit"
              className="px-8 py-3 bg-brand hover:bg-[#3444cc] text-white font-bold rounded-lg shadow-sm transition cursor-pointer"
            >
              Lưu Thẻ Ghi Nhớ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
