import React, { useState } from 'react';
import { Folder, StudySet } from '../types';
import { 
  Folder as FolderIcon, 
  FolderPlus, 
  FolderOpen, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  Plus, 
  X, 
  BookOpen, 
  Calendar, 
  ChevronRight, 
  PlusCircle, 
  MinusCircle,
  FolderMinus,
  Sparkles
} from 'lucide-react';

interface FolderPanelProps {
  folders: Folder[];
  studySets: StudySet[];
  onUpdateFolders: (folders: Folder[]) => void;
  onSelectSet: (set: StudySet) => void;
  selectedFolderId?: string | null;
  onSelectedFolderIdChange?: (id: string | null) => void;
}

export function FolderPanel({ 
  folders, 
  studySets, 
  onUpdateFolders, 
  onSelectSet,
  selectedFolderId: propSelectedFolderId,
  onSelectedFolderIdChange
}: FolderPanelProps) {
  const [localSelectedFolderId, setLocalSelectedFolderId] = useState<string | null>(null);

  const selectedFolderId = propSelectedFolderId !== undefined ? propSelectedFolderId : localSelectedFolderId;
  const setSelectedFolderId = (id: string | null) => {
    if (onSelectedFolderIdChange) {
      onSelectedFolderIdChange(id);
    } else {
      setLocalSelectedFolderId(id);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Folder | null>(null);
  const [showAddSetsModal, setShowAddSetsModal] = useState(false);

  // Custom confirmation modal states
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [setToRemove, setSetToRemove] = useState<{ folderId: string; setId: string; setTitle: string } | null>(null);

  // Form states for creating
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states for editing
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDesc, setEditFolderDesc] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  // Create folder
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newFolderName.trim()) {
      setCreateError('Vui lòng nhập tên thư mục.');
      return;
    }

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      description: newFolderDesc.trim(),
      createdAt: new Date().toISOString(),
      setIds: []
    };

    onUpdateFolders([newFolder, ...folders]);
    setNewFolderName('');
    setNewFolderDesc('');
    setShowCreateModal(false);
  };

  // Edit folder
  const handleEditFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!showEditModal) return;
    if (!editFolderName.trim()) {
      setEditError('Vui lòng nhập tên thư mục.');
      return;
    }

    const updated = folders.map(f => {
      if (f.id === showEditModal.id) {
        return {
          ...f,
          name: editFolderName.trim(),
          description: editFolderDesc.trim()
        };
      }
      return f;
    });

    onUpdateFolders(updated);
    setShowEditModal(null);
  };

  // Delete folder trigger
  const handleDeleteFolderClick = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToDelete(folder);
  };

  const executeDeleteFolder = () => {
    if (!folderToDelete) return;
    const folderId = folderToDelete.id;
    const updated = folders.filter(f => f.id !== folderId);
    onUpdateFolders(updated);
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }
    setFolderToDelete(null);
  };

  // Add study set to folder
  const handleAddSetToFolder = (folderId: string, setId: string) => {
    const updated = folders.map(f => {
      if (f.id === folderId) {
        if (!f.setIds.includes(setId)) {
          return { ...f, setIds: [...f.setIds, setId] };
        }
      }
      return f;
    });
    onUpdateFolders(updated);
  };

  // Remove study set from folder trigger
  const handleRemoveSetFromFolderClick = (folderId: string, setId: string, setTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSetToRemove({ folderId, setId, setTitle });
  };

  const executeRemoveSetFromFolder = () => {
    if (!setToRemove) return;
    const { folderId, setId } = setToRemove;
    const updated = folders.map(f => {
      if (f.id === folderId) {
        return { ...f, setIds: f.setIds.filter(id => id !== setId) };
      }
      return f;
    });
    onUpdateFolders(updated);
    setSetToRemove(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Get study sets in selected folder
  const currentFolderSets = selectedFolder 
    ? studySets.filter(s => selectedFolder.setIds.includes(s.id))
    : [];

  // Get study sets NOT in selected folder
  const setsNotInFolder = selectedFolder
    ? studySets.filter(s => !selectedFolder.setIds.includes(s.id))
    : [];

  return (
    <div className="space-y-6">
      {/* 1. FOLDER DETAIL VIEW */}
      {selectedFolder ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header breadcrumb & actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button
              onClick={() => setSelectedFolderId(null)}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Quay lại danh sách thư mục</span>
            </button>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setEditFolderName(selectedFolder.name);
                  setEditFolderDesc(selectedFolder.description);
                  setShowEditModal(selectedFolder);
                }}
                className="flex-1 sm:flex-initial p-2 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-brand rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Edit3 size={14} /> Sửa thư mục
              </button>
              <button
                onClick={(e) => handleDeleteFolderClick(selectedFolder, e)}
                className="flex-1 sm:flex-initial p-2 px-3 border border-rose-100 bg-white hover:bg-rose-50 text-rose-600 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Trash2 size={14} /> Xóa thư mục
              </button>
            </div>
          </div>

          {/* Folder Information Card */}
          <div className="bg-gradient-to-r from-blue-50/50 via-slate-50 to-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-brand pointer-events-none">
              <FolderOpen size={96} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Thư mục học tập
                </span>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(selectedFolder.createdAt)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                {selectedFolder.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-500 max-w-3xl leading-relaxed">
                {selectedFolder.description || 'Thư mục này chưa có mô tả nào.'}
              </p>
            </div>
          </div>

          {/* Folder Contents Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <BookOpen size={14} className="text-brand" />
                <span>Các học phần trong thư mục ({currentFolderSets.length})</span>
              </h3>

              <button
                onClick={() => setShowAddSetsModal(true)}
                className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm học phần</span>
              </button>
            </div>

            {currentFolderSets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentFolderSets.map((set) => (
                  <div
                    key={set.id}
                    onClick={() => onSelectSet(set)}
                    className="bg-white border border-slate-200 hover:border-brand hover:shadow-xs rounded-xl p-5 transition duration-200 cursor-pointer flex flex-col justify-between relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {set.cards.length} thuật ngữ
                        </span>
                        
                        {/* Remove from folder action */}
                        <button
                          onClick={(e) => handleRemoveSetFromFolderClick(selectedFolder.id, set.id, set.title, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Bỏ khỏi thư mục"
                        >
                          <FolderMinus size={15} />
                        </button>
                      </div>

                      <h4 className="font-bold text-slate-850 mt-3 text-sm tracking-tight line-clamp-1">
                        {set.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {set.description || 'Không có mô tả.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 mt-4 pt-3 text-[10px] text-slate-400 font-bold">
                      <span>{set.reviewLogs ? `Đã ôn ${set.reviewLogs.length} lần` : 'Chưa ôn lần nào'}</span>
                      <span className="text-brand flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Học ngay <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-100 py-16">
                <FolderOpen size={44} className="mx-auto text-slate-300 mb-3 animate-pulse" />
                <h4 className="font-bold text-slate-800 text-sm">Thư mục trống</h4>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                  Hãy thêm các học phần ghi nhớ vào thư mục này để phân loại các phần học của bạn một cách có hệ thống.
                </p>
                <button
                  onClick={() => setShowAddSetsModal(true)}
                  className="mt-4 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus size={12} /> Thêm ngay học phần
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. LIST ALL FOLDERS VIEW */
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderIcon size={20} className="text-brand" />
                <span>Thư mục phân loại học tập</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Tạo các thư mục chuyên môn để phân chia học tập (ví dụ: "Tiếng Anh Giao Tiếp", "Lập Trình Web", "Từ Vựng Đại Học").
              </p>
            </div>

            <button
              onClick={() => {
                setNewFolderName('');
                setNewFolderDesc('');
                setCreateError(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderPlus size={15} />
              <span>Tạo thư mục mới</span>
            </button>
          </div>

          {folders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {folders.map((folder) => {
                const folderSets = studySets.filter(s => folder.setIds.includes(s.id));
                const totalCards = folderSets.reduce((sum, s) => sum + s.cards.length, 0);

                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="group bg-white border border-slate-200 hover:border-brand hover:shadow-xs rounded-xl p-5 transition duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="p-2.5 bg-blue-50 text-brand rounded-lg group-hover:scale-105 transition-transform">
                          <FolderIcon size={18} fill="currentColor" className="text-brand/20" />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDeleteFolderClick(folder, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Xóa thư mục"
                          >
                            <Trash2 size={13} />
                          </button>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            {folder.setIds.length} học phần
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-850 mt-4 text-base tracking-tight leading-snug group-hover:text-brand transition-colors line-clamp-1">
                        {folder.name}
                      </h3>
                      
                      <p className="text-xs text-slate-450 mt-1 line-clamp-2 leading-relaxed">
                        {folder.description || 'Không có mô tả cho thư mục này.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 mt-5 pt-3.5 text-[10px] text-slate-400 font-bold">
                      <span>Tổng số: {totalCards} thuật ngữ</span>
                      <span className="text-brand flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Mở thư mục <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-100 py-16 space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <FolderIcon size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800">Chưa có thư mục phân loại nào</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Tạo các thư mục để tổ chức, sắp xếp các phần học khoa học hơn theo chủ đề hoặc lịch trình thi cử.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer inline-flex items-center gap-1"
              >
                <FolderPlus size={13} /> Tạo thư mục đầu tiên
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. MODAL: CREATE NEW FOLDER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <form 
            onSubmit={handleCreateFolder} 
            className="bg-white w-full max-w-md rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                <FolderPlus size={18} className="text-brand" />
                Tạo thư mục mới
              </span>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Tên thư mục *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Từ Vựng IELTS, Lập Trình React..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Mô tả thư mục (Không bắt buộc)</label>
                <textarea
                  placeholder="Ghi chú nhanh mục tiêu, thời hạn học hoặc nội dung tổng quát của thư mục này..."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 text-xs font-medium text-slate-700 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-lg shadow-sm hover:shadow transition cursor-pointer"
              >
                Tạo thư mục
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. MODAL: EDIT FOLDER */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <form 
            onSubmit={handleEditFolderSubmit} 
            className="bg-white w-full max-w-md rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                <Edit3 size={18} className="text-brand" />
                Sửa thông tin thư mục
              </span>
              <button 
                type="button" 
                onClick={() => setShowEditModal(null)} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Tên thư mục *</label>
                <input
                  type="text"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Mô tả thư mục</label>
                <textarea
                  value={editFolderDesc}
                  onChange={(e) => setEditFolderDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 text-xs font-medium text-slate-700 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-lg shadow-sm hover:shadow transition cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. MODAL: ADD STUDY SETS TO FOLDER */}
      {showAddSetsModal && selectedFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                  <PlusCircle size={18} className="text-brand" />
                  Thêm học phần vào thư mục
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Thư mục: <span className="font-extrabold text-slate-600">{selectedFolder.name}</span></p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddSetsModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {setsNotInFolder.length > 0 ? (
                setsNotInFolder.map((set) => (
                  <div 
                    key={set.id}
                    className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{set.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{set.cards.length} thuật ngữ &bull; {set.description || 'Không có mô tả.'}</p>
                    </div>
                    <button
                      onClick={() => handleAddSetToFolder(selectedFolder.id, set.id)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand text-[10px] font-extrabold rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus size={11} /> Thêm
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Tất cả các học phần hiện có đã được thêm vào thư mục này.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddSetsModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: CONFIRM DELETE FOLDER */}
      {folderToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-full">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Xóa thư mục học tập</h3>
                <p className="text-xs text-slate-400 mt-0.5">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa thư mục <span className="font-extrabold text-slate-800">"{folderToDelete.name}"</span>? 
              Các học phần từ vựng bên trong thư mục này <span className="font-bold text-slate-800">sẽ không</span> bị xóa khỏi tài khoản của bạn.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeDeleteFolder}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm hover:shadow transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: CONFIRM REMOVE STUDY SET FROM FOLDER */}
      {setToRemove && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-3 bg-amber-50 rounded-full">
                <FolderMinus size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Bỏ học phần khỏi thư mục</h3>
                <p className="text-xs text-slate-400 mt-0.5">Thay đổi phân loại thư mục</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn loại bỏ học phần <span className="font-extrabold text-slate-800">"{setToRemove.setTitle}"</span> ra khỏi thư mục này? 
              Học phần này vẫn sẽ xuất hiện đầy đủ trong danh sách bài học của bạn.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSetToRemove(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeRemoveSetFromFolder}
                className="px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-lg shadow-sm hover:shadow transition cursor-pointer"
              >
                Xác nhận bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
