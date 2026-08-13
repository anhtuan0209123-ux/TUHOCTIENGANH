import React, { useState, useRef } from 'react';
import { StudySet } from '../types';
import { 
  X, Printer, FileText, Grid, Check, Info, 
  Sparkles, Scissors, Eye, Settings, Download, Loader2,
  Volume2, Briefcase, Zap, GraduationCap, BookOpen, Layers
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ExportPdfModalProps {
  set: StudySet;
  isOpen: boolean;
  onClose: () => void;
}

type PrintLayoutType = 'study-sheet' | 'diy-flashcards';
type PrintFontSize = 'sm' | 'md' | 'lg';

export function ExportPdfModal({ set, isOpen, onClose }: ExportPdfModalProps) {
  const [layout, setLayout] = useState<PrintLayoutType>('study-sheet');
  const [fontSize, setFontSize] = useState<PrintFontSize>('md');
  const [includeExamples, setIncludeExamples] = useState(true);
  const [includeGuidelines, setIncludeGuidelines] = useState(true);
  const [includeNotesColumn, setIncludeNotesColumn] = useState(true);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [customTitle, setCustomTitle] = useState(set.title);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Helper to dynamically match sets to visual themes and categories
  const getCategoryIconAndColor = (categoryStr?: string) => {
    const cat = (categoryStr || '').toLowerCase();
    if (cat.includes('speak') || cat.includes('giao tiep') || cat.includes('pronun') || cat.includes('phat am')) {
      return { 
        icon: <Volume2 size={13} className="text-emerald-700" />, 
        colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800', 
        barColor: '#059669', 
        barColorClass: 'bg-emerald-600',
        label: 'SPEAKING & PHONETICS' 
      };
    }
    if (cat.includes('work') || cat.includes('business') || cat.includes('cong viec') || cat.includes('office') || cat.includes('career')) {
      return { 
        icon: <Layers size={13} className="text-blue-700" />, 
        colorClass: 'bg-blue-50 border-blue-200 text-blue-800', 
        barColor: '#2563eb', 
        barColorClass: 'bg-blue-600',
        label: 'BUSINESS ENGLISH' 
      };
    }
    if (cat.includes('it') || cat.includes('tech') || cat.includes('code') || cat.includes('computer') || cat.includes('science')) {
      return { 
        icon: <Zap size={13} className="text-amber-700" />, 
        colorClass: 'bg-amber-50 border-amber-200 text-amber-800', 
        barColor: '#d97706', 
        barColorClass: 'bg-amber-500',
        label: 'TECH & SCIENCE' 
      };
    }
    if (cat.includes('academic') || cat.includes('ielts') || cat.includes('toeic') || cat.includes('exam')) {
      return { 
        icon: <GraduationCap size={13} className="text-indigo-700" />, 
        colorClass: 'bg-indigo-50 border-indigo-200 text-indigo-800', 
        barColor: '#4f46e5', 
        barColorClass: 'bg-indigo-600',
        label: 'ACADEMIC EXAM PREP' 
      };
    }
    // Default
    return { 
      icon: <BookOpen size={13} className="text-slate-700" />, 
      colorClass: 'bg-slate-100 border-slate-200 text-slate-800', 
      barColor: '#4b5563', 
      barColorClass: 'bg-slate-600',
      label: 'GENERAL VOCABULARY' 
    };
  };

  // Helper to dynamically calculate study schedule cycle dates from today
  const getMilestoneDates = () => {
    const baseDate = new Date();
    const addDays = (d: number) => {
      const copy = new Date(baseDate);
      copy.setDate(baseDate.getDate() + d);
      return `${copy.getDate()}/${copy.getMonth() + 1}`;
    };
    return {
      m1: addDays(1),   // 24h
      m2: addDays(3),   // 3 days
      m3: addDays(7),   // 7 days
      m4: addDays(30),  // 30 days
    };
  };

  const normalizeText = (text: string | undefined | null): string => {
    if (!text) return '';
    return text.normalize('NFC');
  };

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(set, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(customTitle || set.title).replace(/[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ ]/g, "").trim() || 'hoc-phan'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Thuật ngữ,Định nghĩa,Ví dụ,Dịch ví dụ\n";
    set.cards.forEach(card => {
      const term = `"${(card.term || '').replace(/"/g, '""')}"`;
      const def = `"${(card.definition || '').replace(/"/g, '""')}"`;
      const ex = `"${(card.example || '').replace(/"/g, '""')}"`;
      const exTrans = `"${(card.exampleTranslation || '').replace(/"/g, '""')}"`;
      csvContent += `${term},${def},${ex},${exTrans}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `${(customTitle || set.title).replace(/[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ ]/g, "").trim() || 'hoc-phan'}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadPdfDirect = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const element = previewRef.current;
      let imgData = '';
      
      try {
        imgData = await toPng(element, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
          fontEmbedCSS: '',
        });
      } catch (pngErr) {
        console.warn("toPng failed, using html2canvas fallback:", pngErr);
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });
        imgData = canvas.toDataURL('image/png');
      }
      
      const format = paperSize.toLowerCase() === 'a4' ? 'a4' : 'letter';
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: format
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const ratio = imgWidth / pdfWidth;
      const calculatedHeight = imgHeight / ratio;
      
      if (calculatedHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, calculatedHeight);
      } else {
        let heightLeft = calculatedHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, calculatedHeight);
        heightLeft -= pdfHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - calculatedHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, calculatedHeight);
          heightLeft -= pdfHeight;
        }
      }
      
      const safeName = customTitle.replace(/[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ ]/g, "").trim() || 'flashcards';
      pdf.save(`${safeName}.pdf`);
    } catch (error) {
      console.error("Error generating direct PDF:", error);
      alert("Đã xảy ra lỗi trong quá trình tạo tệp PDF trực tiếp. Vui lòng thử nút Mở Hộp thoại In hoặc Xuất file JSON/CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTriggerPrint = () => {
    // Small delay to ensure render updates are complete before printing
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Font size classes for preview/printing
  const getFontSizeClass = (type: 'term' | 'def' | 'ex') => {
    if (fontSize === 'sm') {
      if (type === 'term') return 'text-[11px]';
      if (type === 'def') return 'text-[10px]';
      return 'text-[9px]';
    }
    if (fontSize === 'lg') {
      if (type === 'term') return 'text-[14px]';
      if (type === 'def') return 'text-[13px]';
      return 'text-[11px]';
    }
    // md default
    if (type === 'term') return 'text-[12px]';
    if (type === 'def') return 'text-[11px]';
    return 'text-[10px]';
  };

  return (
    <>
      <style>{`
        .academic-print-mode, .academic-print-mode * {
          font-family: "Times New Roman", Times, "Baskerville", Georgia, serif !important;
        }
      `}</style>
      {/* 
        ========================================================================
        1. SCREEN INTERACTIVE UI (Hidden during physical paper printing)
        ========================================================================
      */}
      <div className="no-print fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Dialog Content */}
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl relative z-10 flex flex-col md:flex-row h-[90vh] md:h-[85vh] overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-in transition-colors">
          
          {/* LEFT COLUMN: Controls Panel */}
          <div className="w-full md:w-5/12 bg-slate-50 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand bg-blue-50 dark:bg-blue-950/80 dark:text-blue-300 px-2 py-0.5 rounded tracking-wider border border-blue-100 dark:border-blue-900/50">
                    Tính năng In ấn & Lưu trữ
                  </span>
                  <h2 className="text-lg font-black text-slate-850 dark:text-white mt-1 flex items-center gap-1.5">
                    <Printer size={18} className="text-brand" />
                    Xuất PDF / In Học Phần
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Input Custom Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  Tựa đề tài liệu in ấn:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Nhập tựa đề tùy chỉnh..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium text-slate-805 dark:text-slate-100"
                />
              </div>

              {/* Layout Type Selection Cards */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  1. Chọn định dạng layout PDF:
                </label>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option 1: Study Sheet List */}
                  <div
                    onClick={() => setLayout('study-sheet')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                      layout === 'study-sheet' 
                        ? 'border-brand bg-blue-50/20 dark:bg-blue-950/40' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${layout === 'study-sheet' ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-550 dark:text-slate-300'}`}>
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase flex items-center justify-between">
                        Bản Danh Sách Học Tập
                        {layout === 'study-sheet' && <Check size={12} className="text-brand stroke-[3]" />}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Dạng bảng 2 cột tổng hợp thuật ngữ, nét nghĩa kèm ví dụ minh họa và cột ghi chú để dễ dàng ôn tập, tự kiểm tra.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: DIY Folding Flashcards */}
                  <div
                    onClick={() => setLayout('diy-flashcards')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                      layout === 'diy-flashcards' 
                        ? 'border-brand bg-blue-50/20 dark:bg-blue-950/40' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${layout === 'diy-flashcards' ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-550 dark:text-slate-300'}`}>
                      <Grid size={16} />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase flex items-center justify-between">
                        Thẻ Gập Cắt DIY Vật Lý
                        {layout === 'diy-flashcards' && <Check size={12} className="text-brand stroke-[3]" />}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Định dạng lưới có đường nét đứt để cắt kéo và nếp gấp ở giữa. Hoàn hảo để tự chế thẻ học 2 mặt tại nhà!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customization Options Switches */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Settings size={13} className="text-slate-400" />
                  2. Tùy chỉnh chi tiết:
                </label>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  {/* Font Size Selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Cỡ chữ văn bản:</span>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {(['sm', 'md', 'lg'] as PrintFontSize[]).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setFontSize(sz)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition ${
                            fontSize === sz 
                              ? 'bg-white dark:bg-slate-800 text-brand dark:text-blue-400 shadow-xs' 
                              : 'text-slate-505 dark:text-slate-400 hover:text-slate-705'
                          }`}
                        >
                          {sz === 'sm' ? 'Nhỏ' : sz === 'md' ? 'Vừa' : 'Lớn'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Include Examples Switch */}
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Bao gồm câu ví dụ:</span>
                    <input
                      type="checkbox"
                      checked={includeExamples}
                      onChange={(e) => setIncludeExamples(e.target.checked)}
                      className="w-4 h-4 text-brand bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-sm focus:ring-brand cursor-pointer"
                    />
                  </label>

                  {layout === 'study-sheet' && (
                    <>
                      {/* Include Leitner Guidelines */}
                      <label className="flex items-center justify-between cursor-pointer py-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Hướng dẫn chu trình trí nhớ:</span>
                        <input
                          type="checkbox"
                          checked={includeGuidelines}
                          onChange={(e) => setIncludeGuidelines(e.target.checked)}
                          className="w-4 h-4 text-brand bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-sm focus:ring-brand cursor-pointer"
                        />
                      </label>

                      {/* Include Memorization Checkbox Column */}
                      <label className="flex items-center justify-between cursor-pointer py-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Thêm cột tích hợp ôn tập:</span>
                        <input
                          type="checkbox"
                          checked={includeNotesColumn}
                          onChange={(e) => setIncludeNotesColumn(e.target.checked)}
                          className="w-4 h-4 text-brand bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-sm focus:ring-brand cursor-pointer"
                        />
                      </label>
                    </>
                  )}

                  {/* Paper Size selector */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Khổ giấy in ấn:</span>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 p-1 px-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="A4">Khổ A4 (Chuẩn VN)</option>
                      <option value="Letter">Letter (Chuẩn US)</option>
                    </select>
                  </div>

                  {/* Other Data Export Formats */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tải file dữ liệu:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md transition cursor-pointer"
                        title="Xuất học phần dưới dạng tệp JSON"
                      >
                        File JSON
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md transition cursor-pointer"
                        title="Xuất học phần dạng bảng Excel/CSV"
                      >
                        File CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons footer */}
            <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer text-center disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleTriggerPrint}
                disabled={isExporting}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-center disabled:opacity-50"
              >
                <Printer size={15} />
                <span>Mở Hộp thoại In</span>
              </button>
              <button
                onClick={handleDownloadPdfDirect}
                disabled={isExporting}
                className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer text-center disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Đang tạo PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Tải PDF trực tiếp</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-time Live Print Preview */}
          <div className="flex-1 flex flex-col bg-slate-250 overflow-hidden relative">
            {/* Preview panel top label bar */}
            <div className="h-11 bg-slate-100 border-b border-slate-250 flex items-center justify-between px-5">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wide flex items-center gap-1.5">
                <Eye size={12} className="text-slate-400" /> Bản xem trước trang in thực tế (PDF Print Preview)
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                {paperSize} Size • {set.cards.length} Cards
              </span>
            </div>

            {/* Preview scrolling container */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-300">
              {/* Simulated Paper sheet */}
              <div 
                ref={previewRef}
                className="academic-print-mode bg-white p-12 shadow-xl border border-slate-400 max-w-[210mm] w-full min-h-[297mm] h-fit flex flex-col space-y-6"
                style={{
                  fontSize: fontSize === 'sm' ? '12px' : fontSize === 'lg' ? '16px' : '14px',
                  fontFamily: '"Times New Roman", Times, "Baskerville", Georgia, serif'
                }}
              >
                {/* Document Header Section */}
                <div className="border-b-2 border-slate-900 pb-3.5 mb-2 flex flex-col gap-1.5">
                  <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-950">
                    {normalizeText(customTitle || set.title || 'SPEAKING')} - 10/07/2026
                  </h1>
                  <p className="text-[11.5px] italic text-slate-600">
                    {normalizeText(`Tổng số từ: ${set.cards.length} thẻ • Trạng thái: Đã kiểm duyệt • Khổ giấy: ${paperSize} Portrait • Đơn vị biên soạn: QuizSet AI Hub`)}
                  </p>
                </div>

                {/* Toggleable Guidelines Box: Bullet points for Leitner milestones */}
                {layout === 'study-sheet' && includeGuidelines && (() => {
                  const dates = getMilestoneDates();
                  return (
                    <div className="bg-[#FDFDFD] border border-[#E0E0E0] rounded-lg p-3.5 text-xs text-slate-805 space-y-1.5 w-full">
                      <p className="font-bold uppercase text-[11px] text-slate-900 tracking-wider">
                        ★ {normalizeText('HƯỚNG DẪN CHU KỲ TRÍ NHỚ LEITNER:')}
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-700">
                        <li>
                          <strong>{normalizeText('Mốc 1')}</strong> ({normalizeText('24h')}): {normalizeText('Che và đọc để gợi nhớ thụ động')} ({dates.m1})
                        </li>
                        <li>
                          <strong>{normalizeText('Mốc 2')}</strong> ({normalizeText('3d')}): {normalizeText('Tập trung ôn tập những từ chưa thuộc')} ({dates.m2})
                        </li>
                        <li>
                          <strong>{normalizeText('Mốc 3')}</strong> ({normalizeText('7d')}): {normalizeText('Tự viết câu thực tế sử dụng từ vựng')} ({dates.m3})
                        </li>
                        <li>
                          <strong>{normalizeText('Mốc 4')}</strong> ({normalizeText('30d')}): {normalizeText('Khắc cốt ghi tâm, chuyển hóa thành trí nhớ dài hạn')} ({dates.m4})
                        </li>
                      </ul>
                    </div>
                  );
                })()}

                {/* TEMPLATE 1: Study Sheet List */}
                {layout === 'study-sheet' && (
                  <div className="flex-1">
                    <table className="w-full table-fixed text-left border-collapse border border-[#E0E0E0]">
                      <thead>
                        <tr className="bg-[#F2F2F2] text-[11px] font-bold uppercase text-slate-800 tracking-wide border-b border-[#E0E0E0]">
                          <th className="py-1 px-2 border-r border-[#E0E0E0] text-center w-[6%]">STT</th>
                          <th className="py-1 px-2 border-r border-[#E0E0E0] w-[24%]">{normalizeText('THUẬT NGỮ (TERM)')}</th>
                          <th className={`py-1 px-2 border-r border-[#E0E0E0] ${includeNotesColumn ? 'w-[42%]' : 'w-[70%]'}`}>{normalizeText('NGHĨA & VÍ DỤ (MEANING & CONTEXT)')}</th>
                          {includeNotesColumn && (
                            <th className="py-1 px-2 text-center w-[28%]">{normalizeText('TIẾN ĐỘ LEITNER')}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {set.cards.map((card, idx) => (
                          <tr 
                            key={card.id} 
                            className={`border-b border-[#E0E0E0] hover:bg-slate-50/40 ${idx % 2 === 1 ? 'bg-[#F9F9F9]' : 'bg-white'}`}
                          >
                            {/* Index */}
                            <td className="py-1 px-2 border-r border-[#E0E0E0] text-center text-[11px] font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            {/* English Term: bold Times New Roman */}
                            <td className={`py-1 px-2 border-r border-[#E0E0E0] font-bold text-black leading-tight break-words ${getFontSizeClass('term')}`}>
                              {normalizeText(card.term)}
                            </td>
                            {/* Definition & Examples: Regular Times New Roman with Italic examples */}
                            <td className="py-1 px-2 border-r border-[#E0E0E0] space-y-1 text-left">
                              <p className={`font-normal text-slate-900 leading-tight ${getFontSizeClass('def')}`}>
                                {normalizeText(card.definition)}
                              </p>
                              {includeExamples && card.example && (
                                <div className="border-t border-dotted border-[#CCCCCC] pt-1 mt-1 space-y-0.5">
                                  <p className={`font-medium italic text-[#555555] leading-tight ${getFontSizeClass('ex')}`}>
                                    "{normalizeText(card.example)}"
                                  </p>
                                  {card.exampleTranslation && (
                                    <p className="text-[10px] text-[#555555] font-medium leading-tight italic">
                                      ➔ {normalizeText(card.exampleTranslation)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                            {/* Notes Checkboxes Column (Scientific 4-cycle checklist) */}
                            {includeNotesColumn && (
                              <td className="py-1 px-2 text-center whitespace-nowrap">
                                <div className="border border-slate-300 rounded px-1.5 py-1 bg-white flex items-center justify-between w-full whitespace-nowrap text-[9px] select-none">
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <span className="text-slate-400 text-[11px] leading-none">☐</span>
                                    <span className="font-semibold text-slate-700">24h</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <span className="text-slate-400 text-[11px] leading-none">☐</span>
                                    <span className="font-semibold text-slate-700">3d</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <span className="text-slate-400 text-[11px] leading-none">☐</span>
                                    <span className="font-semibold text-slate-700">7d</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <span className="text-slate-400 text-[11px] leading-none">☐</span>
                                    <span className="font-semibold text-slate-700">30d</span>
                                  </div>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TEMPLATE 2: DIY Foldable Flashcards Grid */}
                {layout === 'diy-flashcards' && (
                  <div className="space-y-4">
                    {/* Cutting instructions */}
                    <div className="bg-indigo-50/50 border border-indigo-200 p-3.5 rounded-xl text-slate-700 text-[10px] space-y-1 flex items-start gap-2.5 shadow-2xs">
                      <Scissors size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1">
                          BỘ THẺ GẬP FLASHCARD DIY 'BẢN ĐỒ TRÍ NHỚ' (CHỐNG NHÌN XUYÊN)
                        </p>
                        <p className="leading-relaxed opacity-90 font-medium">
                          1. Dùng kéo cắt đứt dọc theo các <strong className="text-indigo-900">đường nét đứt màu xám (scissors guide)</strong> bên ngoài. <br />
                          2. Gập đôi mảnh giấy theo đường <strong className="text-indigo-900">vạch nếp gấp chống nhìn xuyên ở giữa (folding guide)</strong>.<br />
                          3. Miết phẳng nếp gấp và dán keo để có ngay một tấm thẻ Flashcard 2 mặt cực kỳ cứng cáp và sành điệu!
                        </p>
                      </div>
                    </div>

                    {/* Flashcard grids */}
                    <div className="grid grid-cols-1 gap-4">
                      {set.cards.map((card, idx) => {
                        const cardStyle = getCategoryIconAndColor(set.title);
                        return (
                          <div 
                            key={card.id}
                            className="border-2 border-dashed border-slate-350 rounded-xl overflow-hidden flex items-stretch min-h-[110px] relative bg-white group hover:border-brand/40 transition-colors"
                          >
                            {/* Left Corner Scissors Icon Guide */}
                            <div className="absolute top-1 left-1 opacity-40 pointer-events-none">
                              <Scissors size={10} className="text-slate-400 rotate-90" />
                            </div>
                            
                            {/* Front Side: English Term */}
                            <div className="w-[47%] bg-white p-3.5 flex flex-col justify-between items-center text-center relative">
                              {/* Header stripe with dynamic category */}
                              <div className="absolute top-0 left-0 right-0">
                                <div className="h-1.5 w-full" style={{ backgroundColor: cardStyle.barColor }} />
                                <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-100">
                                  <span className="flex items-center gap-1 text-[8px] font-extrabold text-slate-550 uppercase tracking-widest leading-none">
                                    {cardStyle.icon} {cardStyle.label}
                                  </span>
                                  <span className="text-[7.5px] font-mono font-bold text-slate-400">FRONT • #{idx + 1}</span>
                                </div>
                              </div>
                              
                              <div className="my-auto pt-6 pb-2">
                                <h3 className={`font-sans font-black text-slate-950 leading-snug tracking-tight ${getFontSizeClass('term')}`}>
                                  {card.term}
                                </h3>
                              </div>

                              <div className="text-[7.5px] font-bold text-slate-350 tracking-widest uppercase flex items-center gap-1">
                                QuizSet AI Hub • Bản Đồ Trí Nhớ
                              </div>
                            </div>

                            {/* Folding Divider bar: Thick dark patterned band "la-mông" (anti-shine-through layer) */}
                            <div 
                              className="w-[6%] bg-slate-900 border-x border-slate-950 flex flex-col justify-center items-center shrink-0 z-10 text-white relative overflow-hidden"
                              style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 2px, transparent 6px)',
                                backgroundColor: '#1e293b'
                              }}
                            >
                              {/* Dashed fold guide line inside the band */}
                              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0 border-l border-dashed border-slate-500/80 z-10" />
                              <span className="bg-slate-950/90 text-white text-[6.5px] font-black rounded-full p-0.5 px-2 rotate-90 shrink-0 select-none whitespace-nowrap z-20 shadow-xs border border-slate-800">
                                GẤP Ở ĐÂY
                              </span>
                            </div>

                            {/* Back Side: Vietnamese Definition & Example */}
                            <div className="w-[47%] bg-white p-3.5 flex flex-col justify-between items-start text-left relative">
                              {/* Header stripe with dynamic category */}
                              <div className="absolute top-0 left-0 right-0">
                                <div className="h-1.5 w-full" style={{ backgroundColor: cardStyle.barColor }} />
                                <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-100">
                                  <span className="flex items-center gap-1 text-[8px] font-extrabold text-slate-550 uppercase tracking-widest leading-none">
                                    {cardStyle.icon} {cardStyle.label}
                                  </span>
                                  <span className="text-[7.5px] font-mono font-bold text-slate-400">BACK • #{idx + 1}</span>
                                </div>
                              </div>

                              <div className="my-auto w-full space-y-1.5 pt-6 pb-2">
                                <p className={`font-serif font-black text-slate-900 leading-snug ${getFontSizeClass('def')}`}>
                                  {normalizeText(card.definition)}
                                </p>
                                {includeExamples && card.example && (
                                  <div className="text-slate-550 leading-tight space-y-0.5 border-t border-slate-200/50 pt-1.5 w-full font-serif">
                                    <p className={`italic font-medium ${getFontSizeClass('ex')}`}>
                                      "{normalizeText(card.example)}"
                                    </p>
                                    {card.exampleTranslation && (
                                      <p className="text-[9px] text-slate-400 font-medium">
                                        ➔ {normalizeText(card.exampleTranslation)}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="w-full text-right text-[7px] font-mono font-bold text-slate-450 uppercase flex justify-between items-center border-t border-slate-100 pt-1">
                                <span className="text-left font-sans font-bold">24h | 3d | 7d | 30d</span>
                                <span>LEITNER CYCLE</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Print Footer Disclaimer branding */}
                <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-medium text-center flex items-center justify-between">
                  <span>© {new Date().getFullYear()} QuizSet AI Hub. Toàn quyền biên soạn nội dung học tập.</span>
                  <span>In ấn chất lượng cao từ Học phần ôn thi thủ khoa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. PHYSICAL PRINT SHEETS CONTAINER (Only visible when browser printing)
        ========================================================================
      */}
      <div 
        id="print-container-root" 
        className="academic-print-mode print-only hidden print:block w-full bg-white text-black leading-normal text-left"
        style={{
          fontFamily: '"Times New Roman", Times, "Baskerville", Georgia, serif'
        }}
      >
        <div className="mx-auto w-full max-w-[210mm] p-4">
          
          {/* Document Header Section */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-950">
              {normalizeText(customTitle || set.title || 'SPEAKING')} - 10/07/2026
            </h1>
            <p className="text-[11.5px] italic text-slate-600">
              {normalizeText(`Tổng số từ: ${set.cards.length} thẻ • Trạng thái: Đã kiểm duyệt • Khổ giấy: ${paperSize} Portrait • Đơn vị biên soạn: QuizSet AI Hub`)}
            </p>
          </div>

          {/* Toggleable Guidelines Box: Bullet points for Leitner milestones for Print */}
          {layout === 'study-sheet' && includeGuidelines && (() => {
            const dates = getMilestoneDates();
            return (
              <div className="bg-[#FDFDFD] border border-[#E0E0E0] rounded-lg p-3.5 text-xs text-slate-805 space-y-1.5 w-full mb-4 print-avoid-break">
                <p className="font-bold uppercase text-[11px] text-slate-900 tracking-wider">
                  ★ {normalizeText('HƯỚNG DẪN CHU KỲ TRÍ NHỚ LEITNER:')}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-700">
                  <li>
                    <strong>{normalizeText('Mốc 1')}</strong> ({normalizeText('24h')}): {normalizeText('Che và đọc để gợi nhớ thụ động')} ({dates.m1})
                  </li>
                  <li>
                    <strong>{normalizeText('Mốc 2')}</strong> ({normalizeText('3d')}): {normalizeText('Tập trung ôn tập những từ chưa thuộc')} ({dates.m2})
                  </li>
                  <li>
                    <strong>{normalizeText('Mốc 3')}</strong> ({normalizeText('7d')}): {normalizeText('Tự viết câu thực tế sử dụng từ vựng')} ({dates.m3})
                  </li>
                  <li>
                    <strong>{normalizeText('Mốc 4')}</strong> ({normalizeText('30d')}): {normalizeText('Khắc cốt ghi tâm, chuyển hóa thành trí nhớ dài hạn')} ({dates.m4})
                  </li>
                </ul>
              </div>
            );
          })()}

          {/* TEMPLATE 1: Study Sheet List */}
          {layout === 'study-sheet' && (
            <div className="w-full">
              <table className="w-full table-fixed text-left border-collapse border border-[#E0E0E0]">
                <thead>
                  <tr className="bg-[#F2F2F2] text-[11px] font-bold uppercase text-slate-800 tracking-wide border-b border-[#E0E0E0]">
                    <th className="py-1 px-2 border-r border-[#E0E0E0] text-center w-[6%]">STT</th>
                    <th className="py-1 px-2 border-r border-[#E0E0E0] w-[24%]">{normalizeText('THUẬT NGỮ (TERM)')}</th>
                    <th className={`py-1 px-2 border-r border-[#E0E0E0] ${includeNotesColumn ? 'w-[42%]' : 'w-[70%]'}`}>{normalizeText('NGHĨA & VÍ DỤ (MEANING & CONTEXT)')}</th>
                    {includeNotesColumn && (
                      <th className="py-1 px-2 text-center w-[28%]">{normalizeText('TIẾN ĐỘ LEITNER')}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {set.cards.map((card, idx) => (
                    <tr 
                      key={card.id} 
                      className={`border-b border-[#E0E0E0] print-avoid-break ${idx % 2 === 1 ? 'bg-[#F9F9F9]' : 'bg-white'}`}
                    >
                      {/* Index */}
                      <td className="py-1 px-2 border-r border-[#E0E0E0] text-center text-[11px] font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      {/* English Term */}
                      <td className={`py-1 px-2 border-r border-[#E0E0E0] font-bold text-black leading-tight break-words ${getFontSizeClass('term')}`}>
                        {normalizeText(card.term)}
                      </td>
                      {/* Definition & Examples */}
                      <td className="py-1 px-2 border-r border-[#E0E0E0] space-y-1 text-left">
                        <p className={`font-normal text-slate-900 leading-tight ${getFontSizeClass('def')}`}>
                          {normalizeText(card.definition)}
                        </p>
                        {includeExamples && card.example && (
                          <div className="border-t border-dotted border-[#CCCCCC] pt-1 mt-1 space-y-0.5">
                            <p className={`font-medium italic text-[#555555] leading-tight ${getFontSizeClass('ex')}`}>
                              "{normalizeText(card.example)}"
                            </p>
                            {card.exampleTranslation && (
                              <p className="text-[10px] text-[#555555] font-medium leading-tight italic">
                                ➔ {normalizeText(card.exampleTranslation)}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      {/* Notes Checkboxes Column (Scientific 4-cycle checklist) */}
                      {includeNotesColumn && (
                        <td className="py-1 px-2 text-center whitespace-nowrap">
                          <div className="border border-slate-300 rounded px-1.5 py-1 bg-white flex items-center justify-between w-full whitespace-nowrap text-[9px] select-none">
                            <div className="flex items-center gap-0.5 shrink-0">
                              <span className="text-slate-400 text-[11px] leading-none">☐</span>
                              <span className="font-semibold text-slate-700">24h</span>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <span className="text-slate-400 text-[11px] leading-none">☐</span>
                              <span className="font-semibold text-slate-700">3d</span>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <span className="text-slate-400 text-[11px] leading-none">☐</span>
                              <span className="font-semibold text-slate-700">7d</span>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <span className="text-slate-400 text-[11px] leading-none">☐</span>
                              <span className="font-semibold text-slate-700">30d</span>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TEMPLATE 2: DIY Foldable Flashcards Grid */}
          {layout === 'diy-flashcards' && (
            <div className="space-y-6">
              {/* Cutting instructions */}
              <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl text-slate-800 text-[10px] space-y-1 mb-6 flex items-start gap-2.5 shadow-2xs">
                <span className="text-base shrink-0">✂️</span>
                <div>
                  <p className="font-extrabold uppercase tracking-wider text-slate-950">
                    BỘ THẺ GẬP FLASHCARD DIY 'BẢN ĐỒ TRÍ NHỚ' (CHỐNG NHÌN XUYÊN)
                  </p>
                  <p className="leading-relaxed opacity-95 font-medium">
                    1. Cắt dọc theo các <strong>đường nét đứt màu xám bên ngoài (scissors guide)</strong>. <br />
                    2. Gập đôi mảnh giấy theo <strong>nếp gấp vạch đen chống nhìn xuyên ở giữa (folding guide)</strong>.<br />
                    3. Miết nếp gấp cho phẳng rồi dán keo để có ngay tấm thẻ Flashcard 2 mặt cực kỳ cứng cáp và xịn mịn!
                  </p>
                </div>
              </div>

              {/* Flashcard grids for print */}
              <div className="grid grid-cols-1 gap-5">
                {set.cards.map((card, idx) => {
                  const cardStyle = getCategoryIconAndColor(set.title);
                  return (
                    <div 
                      key={card.id}
                      className="border-2 border-dashed border-slate-400 rounded-xl overflow-hidden flex items-stretch min-h-[110px] print-avoid-break bg-white relative"
                    >
                      {/* Left Corner Scissors Icon Guide */}
                      <div className="absolute top-1 left-1 opacity-40 pointer-events-none">
                        <span>✂️</span>
                      </div>

                      {/* Front Side: English Term */}
                      <div className="w-[47%] p-4 flex flex-col justify-between items-center text-center relative bg-white">
                        {/* Header stripe with dynamic category */}
                        <div className="absolute top-0 left-0 right-0">
                          <div className="h-1.5 w-full" style={{ backgroundColor: cardStyle.barColor }} />
                          <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-250">
                            <span className="flex items-center gap-1 text-[8px] font-extrabold text-slate-700 uppercase tracking-widest leading-none">
                              {cardStyle.label}
                            </span>
                            <span className="text-[7.5px] font-mono font-bold text-slate-500">FRONT • #{idx + 1}</span>
                          </div>
                        </div>

                        <div className="my-auto pt-6 pb-2">
                          <h3 className={`font-sans font-black text-black leading-snug tracking-tight ${getFontSizeClass('term')}`}>
                            {card.term}
                          </h3>
                        </div>

                        <div className="text-[7.5px] font-bold text-slate-400 tracking-widest uppercase">
                          QuizSet AI Hub • Bản Đồ Trí Nhớ
                        </div>
                      </div>

                      {/* Folding Divider bar: Thick dark patterned band "la-mông" (anti-shine-through layer) */}
                      <div 
                        className="w-[6%] bg-slate-900 border-x border-slate-950 flex flex-col justify-center items-center shrink-0 z-10 text-white relative overflow-hidden"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 2px, transparent 6px)',
                          backgroundColor: '#1e293b'
                        }}
                      >
                        {/* Dashed fold guide line inside the band */}
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0 border-l border-dashed border-slate-500/80 z-10" />
                        <span className="bg-slate-950/90 text-white text-[6.5px] font-black rounded-full p-0.5 px-1.5 rotate-90 shrink-0 select-none whitespace-nowrap z-20 border border-slate-800">
                          GẤP Ở ĐÂY
                        </span>
                      </div>

                      {/* Back Side: Vietnamese Definition & Example */}
                      <div className="w-[47%] p-4 flex flex-col justify-between items-start text-left relative bg-white">
                        {/* Header stripe with dynamic category */}
                        <div className="absolute top-0 left-0 right-0">
                          <div className="h-1.5 w-full" style={{ backgroundColor: cardStyle.barColor }} />
                          <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-250">
                            <span className="flex items-center gap-1 text-[8px] font-extrabold text-slate-700 uppercase tracking-widest leading-none">
                              {cardStyle.label}
                            </span>
                            <span className="text-[7.5px] font-mono font-bold text-slate-500">BACK • #{idx + 1}</span>
                          </div>
                        </div>

                        <div className="my-auto w-full space-y-1.5 pt-6 pb-2">
                          <p className={`font-serif font-black text-slate-950 leading-snug ${getFontSizeClass('def')}`}>
                            {normalizeText(card.definition)}
                          </p>
                          {includeExamples && card.example && (
                            <div className="text-slate-800 leading-tight space-y-1 border-t border-slate-300 pt-1.5 w-full font-serif">
                              <p className={`italic font-medium ${getFontSizeClass('ex')}`}>
                                "{normalizeText(card.example)}"
                              </p>
                              {card.exampleTranslation && (
                                <p className="text-[9.5px] text-slate-600 font-medium font-serif">
                                  ➔ {normalizeText(card.exampleTranslation)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-full text-right text-[7px] font-mono font-bold text-slate-500 uppercase flex justify-between items-center border-t border-slate-200 pt-1">
                          <span className="text-left font-sans font-bold text-slate-700">24h | 3d | 7d | 30d</span>
                          <span>LEITNER CYCLE</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Print Footer Disclaimer branding */}
          <div className="border-t border-slate-300 mt-8 pt-4 text-[9px] text-slate-500 font-medium text-center flex items-center justify-between">
            <span>© {new Date().getFullYear()} QuizSet AI Hub. Toàn quyền biên soạn nội dung học tập.</span>
            <span>In ấn chất lượng cao từ Học phần ôn thi thủ khoa</span>
          </div>
        </div>
      </div>

      {/* 
        CRITICAL NO-PRINT INJECTED GLOBAL STYLE FOR PHYSICAL PRINTING 
        This is perfectly clean, isolated, and applies only when the user hits print!
      */}
      <style>{`
        @media print {
          /* Hide the interactive web application shell completely */
          body > #root, 
          body > div:not(#print-container-root),
          .no-print {
            display: none !important;
          }

          /* Force heights and overflows of all elements to auto/visible to allow paging */
          html, 
          body, 
          #root, 
          #print-container-root, 
          #print-container-root * {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-y: visible !important;
          }

          /* Force exact table limits, layout and auto margin/width sizing to prevent right border overflow */
          table, 
          .w-full {
            width: 100% !important;
            table-layout: fixed !important;
            box-sizing: border-box !important;
          }

          /* Remove container max-width and paddings when printing to allow true 100% printable width */
          #print-container-root > div {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Elevate the print root so it spans full paper sheet width */
          #print-container-root {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }

          /* Force browser page-breaks rules */
          tr, 
          td, 
          th, 
          .print-card-row, 
          .border-dashed, 
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          @page {
            size: ${paperSize === 'A4' ? 'A4' : 'letter'} portrait;
            margin: 1cm 1.2cm; /* Narrower margins to maximize table space and save paper */
          }
          
          /* Remove background limitations for table headers and colors */
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Enforce academic font pairing globally for print mode and its preview */
        .academic-print-mode,
        .academic-print-mode * {
          font-family: "Times New Roman", Times, "Baskerville", Georgia, serif !important;
        }
      `}</style>
    </>
  );
}
