import React, { useState, useEffect } from 'react';
import { StudySet, StudyMode, Folder } from './types';
import { presetStudySets } from './presets';
import { SetCard } from './components/SetCard';
import { AiGenerator } from './components/AiGenerator';
import { SetCreator } from './components/SetCreator';
import { FlashcardViewer } from './components/FlashcardViewer';
import { VocabVerifier } from './components/VocabVerifier';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { BlockGame } from './components/BlockGame';
import { DinoGame } from './components/DinoGame';
import { SoccerPenalty } from './components/SoccerPenalty';
import { ExportPdfModal } from './components/ExportPdfModal';
import { ReviewLogPanel } from './components/ReviewLogPanel';
import { FolderPanel } from './components/FolderPanel';
import { ReviewLog } from './types';


import { AnalyticsPanel } from './components/AnalyticsPanel';
import { checkAndUpdateStreakOnLoad, StudyActivityData } from './utils/analytics';
import { 
  Sparkles, Plus, Search, BookOpen, Star, 
  HelpCircle, Trash2, Edit3, Volume2, ArrowLeft,
  GraduationCap, Layers, Gamepad2, Flame, Trophy, Zap,
  Printer, ClipboardCheck, Folder as FolderIcon, FolderPlus, X
} from 'lucide-react';

export default function App() {
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);
  const [activeMode, setActiveMode] = useState<StudyMode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [verifyingSet, setVerifyingSet] = useState<StudySet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'sets' | 'folders' | 'ai' | 'analytics'>('sets');
  const [detailTab, setDetailTab] = useState<'terms' | 'review'>('terms');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fav' | 'custom'>('all');
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddToFolderModal, setShowAddToFolderModal] = useState<StudySet | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [streakInfo, setStreakInfo] = useState<StudyActivityData>({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: '',
    activityLog: {}
  });

  // Load study sets and folders from localStorage on first boot
  useEffect(() => {
    const saved = localStorage.getItem('quizlet_clone_sets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStudySets(parsed);
      } catch (e) {
        console.error("Error parsing local study sets:", e);
        setStudySets(presetStudySets);
      }
    } else {
      // populate standard presets
      setStudySets(presetStudySets);
      localStorage.setItem('quizlet_clone_sets', JSON.stringify(presetStudySets));
    }

    const savedFolders = localStorage.getItem('quizlet_clone_folders');
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch (e) {
        console.error("Error parsing local folders:", e);
        setFolders([]);
      }
    } else {
      setFolders([]);
    }
  }, []);

  // Initialize and listen to streak activity updates
  useEffect(() => {
    const initialStreak = checkAndUpdateStreakOnLoad();
    setStreakInfo(initialStreak);

    const handleStreakChange = (e: Event) => {
      const customEvent = e as CustomEvent<StudyActivityData>;
      if (customEvent.detail) {
        setStreakInfo(customEvent.detail);
      }
    };

    window.addEventListener('study-activity-logged', handleStreakChange);
    return () => {
      window.removeEventListener('study-activity-logged', handleStreakChange);
    };
  }, []);

  // Reset detail tab when switching sets
  useEffect(() => {
    setDetailTab('terms');
  }, [currentSet?.id]);

  // Sync to localStorage
  const saveStudySets = (newSets: StudySet[]) => {
    setStudySets(newSets);
    localStorage.setItem('quizlet_clone_sets', JSON.stringify(newSets));
  };

  const saveFolders = (newFolders: Folder[]) => {
    setFolders(newFolders);
    localStorage.setItem('quizlet_clone_folders', JSON.stringify(newFolders));
  };

  const handleToggleFolderSet = (folderId: string, setId: string) => {
    const updated = folders.map(f => {
      if (f.id === folderId) {
        const exists = f.setIds.includes(setId);
        const newSetIds = exists 
          ? f.setIds.filter(id => id !== setId)
          : [...f.setIds, setId];
        return { ...f, setIds: newSetIds };
      }
      return f;
    });
    saveFolders(updated);
  };

  const handleQuickCreateFolder = (name: string, setId: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: name.trim(),
      description: 'Thư mục được tạo nhanh',
      createdAt: new Date().toISOString(),
      setIds: [setId]
    };
    saveFolders([newFolder, ...folders]);
  };

  // Handle favorite toggles
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the set
    const updated = studySets.map((s) => {
      if (s.id === id) {
        return { ...s, favorite: !s.favorite };
      }
      return s;
    });
    saveStudySets(updated);
    
    // Update active set sync if currently selected
    if (currentSet && currentSet.id === id) {
      setCurrentSet({ ...currentSet, favorite: !currentSet.favorite });
    }
  };

  // Handle delete actions
  const handleDeleteSet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the set
    setDeleteSetId(id);
  };

  const executeDeleteSet = (id: string) => {
    const filtered = studySets.filter((s) => s.id !== id);
    saveStudySets(filtered);
    
    // Also remove from folders
    const updatedFolders = folders.map(f => ({
      ...f,
      setIds: f.setIds.filter(setId => setId !== id)
    }));
    saveFolders(updatedFolders);

    if (currentSet && currentSet.id === id) {
      setCurrentSet(null);
      setActiveMode(null);
    }
    setDeleteSetId(null);
  };

  // Handle updating review logs for a study set
  const handleUpdateReviewLogs = (setId: string, logs: ReviewLog[]) => {
    const updated = studySets.map((s) => {
      if (s.id === setId) {
        return { ...s, reviewLogs: logs };
      }
      return s;
    });
    saveStudySets(updated);
    if (currentSet && currentSet.id === setId) {
      setCurrentSet({ ...currentSet, reviewLogs: logs });
    }
  };

  // Handle manual saving (create or update, intercepted for verification)
  const handleSaveSet = (savedSet: StudySet) => {
    setVerifyingSet(savedSet);
  };

  // Handle AI generated set receiving (intercepted for verification)
  const handleAiGenerated = (newSet: StudySet) => {
    setVerifyingSet(newSet);
  };

  // Final verified save handler
  const handleSaveVerifiedSet = (verifiedSet: StudySet) => {
    const exists = studySets.some((s) => s.id === verifiedSet.id);
    let updated: StudySet[];

    if (exists) {
      updated = studySets.map((s) => (s.id === verifiedSet.id ? verifiedSet : s));
    } else {
      updated = [verifiedSet, ...studySets];
    }

    saveStudySets(updated);
    setCurrentSet(verifiedSet);
    setVerifyingSet(null);
    setIsEditing(false);
    setActiveTab('sets'); // Switch back to sets review
  };

  // Speaks out card list definitions/terms
  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isVietnamese = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text);
    utterance.lang = isVietnamese ? 'vi-VN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Filter lists based on selected options and query
  const filteredSets = studySets.filter((s) => {
    // text query match
    const matchQuery = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchQuery) return false;

    // category filter matches
    if (selectedCategory === 'fav') return s.favorite;
    if (selectedCategory === 'custom') return !s.id.startsWith('preset-');
    return true;
  });

  return (
    <div className="bg-[#fafbfc] min-h-screen text-slate-900 font-sans antialiased pb-16">
      <div className="no-print">
        {/* Dynamic Header Navbar banner */}
      <header className="sticky top-0 bg-white border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => {
              setCurrentSet(null);
              setActiveMode(null);
              setIsEditing(false);
            }} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="bg-brand text-white p-2.5 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-brand">
              TỰ HỌC
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Duolingo Streak Flame Badge */}
            <div 
              id="header-streak-badge"
              onClick={() => {
                setCurrentSet(null);
                setActiveMode(null);
                setIsEditing(false);
                setActiveTab('analytics');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition ${
                streakInfo.currentStreak > 0
                  ? 'bg-orange-50 hover:bg-orange-100 text-orange-600 font-extrabold shadow-sm ring-1 ring-orange-500/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-400 font-bold'
              }`}
              title="Xem thống kê chuỗi ngày học của bạn 🔥"
            >
              <Flame size={16} fill={streakInfo.currentStreak > 0 ? 'currentColor' : 'none'} className={streakInfo.currentStreak > 0 ? 'animate-pulse text-orange-500' : ''} />
              <span className="text-xs">{streakInfo.currentStreak} ngày</span>
            </div>

            {/* Clear custom cache button */}
            <button
              id="header-reset-defaults"
              onClick={() => {
                setShowResetConfirm(true);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-650 px-2 py-1 hover:bg-slate-50 rounded-lg transition"
              title="Khôi phục trạng thái ban đầu"
            >
              Đặt lại mẫu mặc định
            </button>
          </div>
        </div>
      </header>

      {/* Primary Workspace container */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {verifyingSet ? (
          <VocabVerifier
            initialSet={verifyingSet}
            onFinish={handleSaveVerifiedSet}
            onCancel={() => setVerifyingSet(null)}
          />
        ) : isEditing ? (
          /* MANUAL EDITING / CREATING WORKSPACE CANVAS */
          <SetCreator
            initialSet={currentSet}
            onSave={handleSaveSet}
            onCancel={() => setIsEditing(false)}
            existingSets={studySets}
          />
        ) : currentSet ? (
          /* ACTIVE STUDY SET WORKSPACE PANEL */
          <div>
            {activeMode === 'flashcards' && (
              <FlashcardViewer set={currentSet} onBack={() => setActiveMode(null)} />
            )}
            {activeMode === 'learn' && (
              <LearnMode 
                set={currentSet} 
                onBack={() => setActiveMode(null)} 
                onUpdateSet={(updatedSet) => {
                  const updatedSets = studySets.map(s => s.id === updatedSet.id ? updatedSet : s);
                  saveStudySets(updatedSets);
                  setCurrentSet(updatedSet);
                }}
              />
            )}
            {activeMode === 'quiz' && (
              <QuizMode set={currentSet} onBack={() => setActiveMode(null)} />
            )}
            {activeMode === 'block-puzzle' && (
              <BlockGame set={currentSet} onBack={() => setActiveMode(null)} />
            )}
            {activeMode === 'dino-runner' && (
              <DinoGame set={currentSet} onBack={() => setActiveMode(null)} />
            )}
            {activeMode === 'soccer-penalty' && (
              <SoccerPenalty set={currentSet} onBack={() => setActiveMode(null)} />
            )}


            {!activeMode && (
              /* DETAILED VIEW STATS & CONTROL OF SELECTED STUDY SET */
              <div className="space-y-6">
                {/* Upper context breadcrumb */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    id="set-detail-back-btn"
                    onClick={() => setCurrentSet(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand transition-colors"
                  >
                    <ArrowLeft size={16} />
                    <span>Quay lại hòm học phần</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      id="set-detail-fav-btn"
                      onClick={(e) => handleToggleFavorite(currentSet.id, e)}
                      className={`p-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${
                        currentSet.favorite
                          ? 'border-amber-200 bg-amber-50 text-amber-655'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Star size={14} fill={currentSet.favorite ? 'currentColor' : 'none'} className={currentSet.favorite ? 'text-amber-500' : ''} />
                      <span>{currentSet.favorite ? 'Bỏ thích' : 'Yêu thích'}</span>
                    </button>
                     <button
                      id="set-detail-export-pdf-btn"
                      onClick={() => setShowExportModal(true)}
                      className="p-2 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-705 hover:text-brand rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Printer size={14} /> Xuất PDF (In ấn)
                    </button>
                    <button
                      id="set-detail-add-to-folder-btn"
                      onClick={() => setShowAddToFolderModal(currentSet)}
                      className="p-2 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-705 hover:text-brand rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <FolderIcon size={14} /> Phân vào thư mục
                    </button>
                    <button
                      id="set-detail-edit-btn"
                      onClick={() => setIsEditing(true)}
                      className="p-2 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-705 hover:text-brand rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Edit3 size={14} /> Chỉnh sửa học phần
                    </button>
                  </div>
                </div>

                {/* Main text content descriptions */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-400 pointer-events-none">
                    <BookOpen size={96} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-brand bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        {currentSet.cards.length} thẻ học tập
                      </span>
                      {currentSet.isGenerated && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
                          ✨ Tạo bởi AI
                        </span>
                      )}
                    </div>
                    <h1 id="active-set-hero-title" className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                      {currentSet.title}
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-3xl leading-relaxed">
                      {currentSet.description || 'Học phần này chưa được cấu hình mô tả súc tích.'}
                    </p>

                    {/* Folder tags */}
                    {folders.filter(f => f.setIds.includes(currentSet.id)).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 items-center border-t border-slate-50 pt-3">
                        <span className="text-xs font-bold text-slate-400">Thuộc thư mục:</span>
                        {folders.filter(f => f.setIds.includes(currentSet.id)).map(f => (
                          <span 
                            key={f.id}
                            onClick={() => {
                              setActiveFolderId(f.id);
                              setActiveTab('folders');
                            }}
                            className="inline-flex items-center gap-1 bg-blue-50/50 hover:bg-blue-100 border border-blue-100/60 hover:border-brand/30 text-[11px] font-bold text-slate-600 hover:text-brand rounded-md px-2.5 py-0.5 transition cursor-pointer"
                          >
                            <FolderIcon size={12} className="text-brand/70" />
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* PRACTICE STUDY MODES LIST TILES */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-brand" />
                      <span>Chọn chế độ học thuật chính</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Mode 1: Flashcards */}
                      <div
                        id="select-mode-flashcards"
                        onClick={() => setActiveMode('flashcards')}
                        className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-brand hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="p-3 bg-blue-50 group-hover:bg-blue-100 text-brand rounded-lg w-fit transition-all mb-4">
                            <Layers size={20} className="group-hover:scale-105 transition-transform" />
                          </div>
                          <h4 className="font-bold text-base text-slate-850 transition-colors">
                            Thẻ Ghi Nhớ (Flashcard)
                          </h4>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Học ghi nhớ nhanh hai chiều, lật thẻ 3D trực quan, hỗ trợ phát âm tiếng bản xứ chuẩn xác.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-brand mt-4 block">Bắt đầu ôn tập →</span>
                      </div>

                      {/* Mode 2: Learn */}
                      <div
                        id="select-mode-learn"
                        onClick={() => setActiveMode('learn')}
                        className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-brand hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="p-3 bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 rounded-lg w-fit transition-all mb-4">
                            <Sparkles size={20} className="group-hover:rotate-6 transition-transform" />
                          </div>
                          <h4 className="font-bold text-base text-slate-850 transition-colors">
                            Học & Nhớ (Learn)
                          </h4>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Lấy định nghĩa đoán thuật ngữ trắc nghiệm, phản xạ logic giúp ghi nhớ sâu từng từ khóa.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 mt-4 block">Bắt đầu ôn tập →</span>
                      </div>

                      {/* Mode 3: Test */}
                      <div
                        id="select-mode-test"
                        onClick={() => setActiveMode('quiz')}
                        className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-brand hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="p-3 bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 rounded-lg w-fit transition-all mb-4">
                            <Volume2 size={20} className="group-hover:scale-105 transition-transform" />
                          </div>
                          <h4 className="font-bold text-base text-slate-850 transition-colors">
                            Bài Kiểm Tra Tổng Hợp
                          </h4>
                          <p className="text-xs text-slate-550 mt-1.5 leading-relaxed">
                            Tự đánh giá toàn diện năng lực bản thân qua ngân hàng đề thi đa chuẩn (Trắc nghiệm, Điền từ).
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 mt-4 block">Bắt đầu thi thử →</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-1.5">
                      <Gamepad2 size={14} className="text-indigo-500 animate-pulse" />
                      <span>Trò chơi tương tác trí tuệ 🔥</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Mode 4: Block Puzzle Challenge */}
                      <div
                        id="select-mode-block-puzzle"
                        onClick={() => setActiveMode('block-puzzle')}
                        className="group p-6 bg-gradient-to-br from-white to-slate-50/50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="p-3 bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 rounded-lg w-fit transition-all mb-4">
                            <Layers size={20} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <h4 className="font-bold text-base text-slate-850 tracking-tight transition-colors">
                            Xếp Gạch Trí Tuệ (Block Puzzle)
                          </h4>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Xếp các khối gạch màu sắc vào bảng lưới 5x5. Cứ mỗi 4 khối đặt xuống thành công, hãy vượt qua câu hỏi từ vựng để nhận combo nhân đôi điểm số!
                          </p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 mt-4 block flex items-center gap-1">Chơi ngay & ôn tập <Gamepad2 size={12} /></span>
                      </div>

                      {/* Mode 5: Dino Runner Quiz */}
                      <div
                        id="select-mode-dino-runner"
                        onClick={() => setActiveMode('dino-runner')}
                        className="group p-6 bg-gradient-to-br from-white to-slate-50/50 border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="p-3 bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 rounded-lg w-fit transition-all mb-4">
                            <Flame size={20} className="group-hover:animate-bounce transition-transform" />
                          </div>
                          <h4 className="font-bold text-base text-slate-850 tracking-tight transition-colors">
                            Khủng Long Vượt Ải (Dino Runner)
                          </h4>
                          <p className="text-xs text-slate-550 mt-1.5 leading-relaxed">
                            Điều khiển Khủng long nhảy tránh chướng ngại vật tương ứng với bộ từ vựng. Hồi sinh bằng cách trả lời câu hỏi và chinh phục happy ending lãng mạn cuối con đường!
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 mt-4 block flex items-center gap-1">Bắt đầu vượt ải <Gamepad2 size={12} /></span>
                      </div>

                      {/* Mode 6: Soccer Penalty Shootout */}
                      <div
                        id="select-mode-soccer-penalty"
                        onClick={() => setActiveMode('soccer-penalty')}
                        className="group p-6 bg-gradient-to-br from-white to-slate-50/50 border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="p-3 bg-blue-50 group-hover:bg-blue-100 text-blue-600 rounded-lg w-fit transition-all mb-4">
                            <Trophy size={20} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <h4 className="font-bold text-base text-slate-850 tracking-tight transition-colors">
                            Sút Penalty Trí Tuệ (Soccer Shootout)
                          </h4>
                          <p className="text-xs text-slate-550 mt-1.5 leading-relaxed">
                            Chọn 19 CLB Premier League hay quái kiệt Champions League. Trả lời đúng để dứt điểm cực căng hiểm hóc, trả lời sai bóng sẽ bay ra ngoài!
                          </p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 mt-4 block flex items-center gap-1">Ra sân đấu Cup <Gamepad2 size={12} /></span>
                      </div>




                    </div>
                  </div>
                </div>

                {/* TABS CONTROLLER FOR TERMS OR REVIEW LOGS */}
                <div className="space-y-4">
                  <div className="flex border-b border-slate-200">
                    <button
                      id="detail-tab-terms"
                      onClick={() => setDetailTab('terms')}
                      className={`py-3 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
                        detailTab === 'terms'
                          ? 'border-brand text-brand font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <BookOpen size={16} />
                      <span>Danh sách thuật ngữ ({currentSet.cards.length})</span>
                    </button>
                    <button
                      id="detail-tab-review"
                      onClick={() => setDetailTab('review')}
                      className={`py-3 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
                        detailTab === 'review'
                          ? 'border-brand text-brand font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <ClipboardCheck size={16} className={detailTab === 'review' ? 'text-brand' : 'text-slate-400'} />
                      <span>Nhật ký ôn tập ({currentSet.reviewLogs?.length || 0})</span>
                    </button>
                  </div>

                  {detailTab === 'terms' ? (
                    /* THE COMPLETE GLOSSARY OF CARDS (Danh sách thẻ từ) */
                    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs animate-fade-in">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-5">Danh sách các thuật ngữ trong học phần</h3>
                      
                      <div className="divide-y divide-slate-100">
                        {currentSet.cards.map((card, idx) => (
                          <div
                            id={`glossary-row-${card.id}`}
                            key={card.id}
                            className="py-4 md:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 first:pt-2 last:pb-2 group/row"
                          >
                            <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
                              {/* Term (Left) */}
                              <div className="sm:w-1/4 font-mono font-bold text-brand text-base flex items-center gap-1.5 leading-snug">
                                <span className="text-slate-300 font-bold font-sans text-xs w-5">{idx + 1}.</span>
                                <span>{card.term}</span>
                              </div>
                              
                              {/* Definition & usage */}
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-700 leading-snug break-words">
                                  {card.definition}
                                </p>
                                {card.example && (
                                  <p className="text-[11px] text-slate-400 italic mt-1 font-medium bg-slate-50 px-2.5 py-1 rounded-md w-fit">
                                    Ví dụ: "{card.example}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Pronunciation triggers action */}
                            <button
                              id={`glossary-item-pronounce-${card.id}`}
                              onClick={() => handleSpeak(card.term)}
                              className="p-2 text-slate-400 hover:text-brand hover:bg-blue-50 bg-transparent rounded-lg transition-colors"
                              title="Phát âm từ này"
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* REVIEW LOG PANEL */
                    <ReviewLogPanel 
                      set={currentSet} 
                      onUpdateLogs={handleUpdateReviewLogs} 
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MAIN DASHBOARD (STUDY SETS & AI GENERATOR TABS) */
          <div className="space-y-8">
            {/* Visual Hero Panel Banner */}
            <div className="bg-white border border-slate-100 rounded-2xl p-8 sm:p-10 shadow-xs relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-44 h-44 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                  Làm chủ tri thức với thẻ ghi nhớ thông minh!
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed">
                  Tạo các học phần ghi nhớ, kết hợp công cụ luyện tập khoa học hoặc sử dụng Gemini AI để sinh tài liệu học lập trình, ngôn ngữ tức thời.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    id="hero-create-manual-btn"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-3 bg-brand hover:bg-brand-hover text-white rounded-lg font-bold text-sm shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus size={16} /> Tạo thẻ học thủ công
                  </button>
                  <button
                    id="hero-switch-ai-generator"
                    onClick={() => setActiveTab('ai')}
                    className="px-5 py-3 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles size={16} className="text-brand" /> Thiết kế học phần AI
                  </button>
                </div>
              </div>
            </div>

            {/* Main Tabs controller */}
            <div className="flex border-b border-slate-200">
              <button
                id="tab-study-sets"
                onClick={() => setActiveTab('sets')}
                className={`py-3.5 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'sets'
                    ? 'border-brand text-brand font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-705'
                }`}
              >
                <BookOpen size={16} />
                <span>Kho bài học của bạn</span>
              </button>
              <button
                id="tab-folders"
                onClick={() => setActiveTab('folders')}
                className={`py-3.5 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'folders'
                    ? 'border-brand text-brand font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-705'
                }`}
              >
                <FolderIcon size={16} className={activeTab === 'folders' ? 'text-brand' : 'text-slate-400'} />
                <span>Thư mục phân loại ({folders.length})</span>
              </button>
              <button
                id="tab-ai-generator"
                onClick={() => setActiveTab('ai')}
                className={`py-3.5 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'ai'
                    ? 'border-brand text-brand font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-705'
                }`}
              >
                <Sparkles size={16} className="text-brand" />
                <span>Trợ lý học thuật AI</span>
              </button>
              <button
                id="tab-analytics"
                onClick={() => setActiveTab('analytics')}
                className={`py-3.5 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'border-brand text-brand font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-705'
                }`}
              >
                <Flame size={16} className={streakInfo.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-400'} />
                <span>Thống Kê & Chuỗi Ngày 🔥</span>
              </button>
            </div>

            {/* TAB CONTENT: FOLDERS */}
            {activeTab === 'folders' && (
              <div className="animate-fade-in">
                <FolderPanel 
                  folders={folders} 
                  studySets={studySets} 
                  onUpdateFolders={saveFolders} 
                  onSelectSet={setCurrentSet}
                  selectedFolderId={activeFolderId}
                  onSelectedFolderIdChange={setActiveFolderId}
                />
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS & GRID HEATMAP */}
            {activeTab === 'analytics' && (
              <div className="animate-fade-in">
                <AnalyticsPanel studySets={studySets} />
              </div>
            )}

            {/* TAB CONTENT: AI GENERATION FORSET */}
            {activeTab === 'ai' && (
              <div className="animate-fade-in">
                <AiGenerator onGenerated={handleAiGenerated} />
              </div>
            )}

            {/* TAB CONTENT: STUDY SETS VIEW GRID */}
            {activeTab === 'sets' && (
              <div className="space-y-6 animate-fade-in">
                {/* Search query field & Category toggles */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {/* Category choices */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
                    <button
                      id="category-all-btn"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-white shadow-xs text-slate-800'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      id="category-fav-btn"
                      onClick={() => setSelectedCategory('fav')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                        selectedCategory === 'fav'
                          ? 'bg-white shadow-xs text-amber-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Mục yêu thích ⭐
                    </button>
                    <button
                      id="category-custom-btn"
                      onClick={() => setSelectedCategory('custom')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                        selectedCategory === 'custom'
                          ? 'bg-white shadow-xs text-brand'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Do bạn tạo
                    </button>
                  </div>

                  {/* Standard search bar */}
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="set-search-input"
                      type="text"
                      placeholder="Tìm kiếm bài học học phần..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/10 rounded-xl outline-none font-medium text-xs transition"
                    />
                  </div>
                </div>

                {/* Main list set grids */}
                {filteredSets.length > 0 ? (
                  <div id="sets-grid-board" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSets.map((set) => (
                      <SetCard
                        key={set.id}
                        set={set}
                        onSelect={setCurrentSet}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDeleteSet}
                      />
                    ))}
                  </div>
                ) : (
                  /* Empty state placeholder */
                  <div id="empty-sets-alert" className="p-12 text-center bg-white rounded-xl border border-slate-100 py-16">
                    <BookOpen size={48} className="mx-auto text-slate-300 mb-3 animate-pulse" />
                    <h3 className="font-extrabold text-slate-800 text-lg">Không tìm thấy bài học nào</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? 'Thử thay đổi từ khóa tìm kiếm hoặc lọc các học phần của bạn.'
                        : 'Bạn chưa tạo học phần cá nhân nào. Hãy chuyển qua Trợ lý học thuật AI để sinh thẻ học nhanh chóng!'}
                    </p>
                    <div className="mt-5 flex justify-center gap-2">
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg text-slate-600 transition cursor-pointer"
                        >
                          Xóa bộ lọc tìm kiếm
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('ai')}
                        className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                      >
                        💡 Biên soạn bằng AI
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CUSTOM CONFIRMATION MODAL FOR DELETING STUDY SET */}
      {deleteSetId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 rounded-full">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold">Xác nhận xóa học phần</h3>
            </div>
            
            <p className="text-slate-650 text-sm leading-relaxed mb-1 font-semibold">
              Bạn có chắc chắn muốn xóa học phần này không?
            </p>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Mọi thẻ từ và thông tin liên quan đến học phần này sẽ bị xóa vĩnh viễn khỏi thiết bị của bạn và không thể khôi phục lại.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteSetId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-250 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => executeDeleteSet(deleteSetId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL FOR RESETTING DEFAULTS */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-2 bg-amber-50 rounded-full">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-bold">Xác nhận đặt lại ứng dụng</h3>
            </div>
            
            <p className="text-slate-650 text-sm leading-relaxed mb-1 font-semibold">
              Bạn có muốn khôi phục lại dữ liệu mẫu mặc định không?
            </p>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Toàn bộ học phần của bạn tự soạn hoặc tạo bằng trí tuệ nhân tạo (AI) sẽ bị xóa sạch để đưa ứng dụng về trạng thái ban đầu của Thủ Khoa.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-250 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('quizlet_clone_sets');
                  setStudySets(presetStudySets);
                  setCurrentSet(null);
                  setActiveMode(null);
                  setIsEditing(false);
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              >
                Đồng ý đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* RENDER THE EXPORT PDF / PRINTING OPTIONS CONFIGURATION MODAL */}
      {showExportModal && currentSet && (
        <ExportPdfModal
          set={currentSet}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* RENDER ADD TO FOLDER MODAL */}
      {showAddToFolderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <FolderIcon size={18} className="text-brand" />
                  Phân loại vào thư mục
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Học phần: <span className="font-extrabold text-slate-600">{showAddToFolderModal.title}</span>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddToFolderModal(null)} 
                className="text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Folder list checkboxes */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {folders.length > 0 ? (
                folders.map((folder) => {
                  const isChecked = folder.setIds.includes(showAddToFolderModal.id);
                  return (
                    <label 
                      key={folder.id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand/30 hover:bg-blue-50/10 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderIcon 
                          size={16} 
                          className={isChecked ? 'text-brand' : 'text-slate-400'} 
                          fill={isChecked ? 'currentColor' : 'none'} 
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">{folder.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{folder.setIds.length} học phần</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleToggleFolderSet(folder.id, showAddToFolderModal.id)}
                        className="w-4 h-4 rounded-sm border-slate-300 text-brand focus:ring-brand cursor-pointer"
                      />
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  Bạn chưa có thư mục phân loại nào. Hãy tạo mới nhanh ở ô dưới!
                </div>
              )}
            </div>

            {/* Quick create folder form inside modal */}
            <div className="border-t border-slate-50 pt-4 space-y-2">
              <span className="block text-xs font-bold text-slate-650">Tạo nhanh thư mục mới:</span>
              <div className="flex gap-2">
                <input
                  id="quick-folder-input"
                  type="text"
                  placeholder="Nhập tên thư mục mới..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        handleQuickCreateFolder(input.value.trim(), showAddToFolderModal.id);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('quick-folder-input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleQuickCreateFolder(input.value.trim(), showAddToFolderModal.id);
                      input.value = '';
                    }
                  }}
                  className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                >
                  Tạo
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setShowAddToFolderModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 rounded-lg transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
