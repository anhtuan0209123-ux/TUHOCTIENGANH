import React from 'react';
import { StudySet } from '../types';
import { BookOpen, Sparkles, Star, Calendar, Trash2 } from 'lucide-react';

interface SetCardProps {
  set: StudySet;
  onSelect: (set: StudySet) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

export const SetCard: React.FC<SetCardProps> = ({
  set,
  onSelect,
  onToggleFavorite,
  onDelete
}) => {
  const formattedDate = new Date(set.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div
      id={`set-card-${set.id}`}
      className="group relative flex flex-col justify-between p-6 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-xs hover:shadow-md hover:border-brand/40 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => onSelect(set)}
    >
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-blue-50 dark:bg-indigo-900/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10">
        {/* Set Header Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-brand dark:text-indigo-400 bg-blue-50 dark:bg-indigo-950/60 rounded-full border border-blue-100/50 dark:border-indigo-800/40">
            {set.isGenerated ? (
              <>
                <Sparkles size={12} className="text-brand dark:text-indigo-400 animate-pulse" />
                <span>Trí tuệ nhân tạo (AI)</span>
              </>
            ) : (
              <>
                <BookOpen size={12} />
                <span>Thủ công</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              id={`fav-btn-${set.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(set.id, e);
              }}
              className={`p-1.5 rounded-full transition-colors ${
                set.favorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                  : 'text-slate-400 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={set.favorite ? "Bỏ yêu thích" : "Yêu thích"}
            >
              <Star size={16} fill={set.favorite ? "currentColor" : "none"} />
            </button>
            {onDelete && (
              <button
                id={`del-btn-${set.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(set.id, e);
                }}
                className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full transition-colors"
                title="Xóa học phần"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <h3 id={`set-title-${set.id}`} className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
          {set.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-8 mb-4">
          {set.description || 'Không có mô tả nào cho học phần này.'}
        </p>
      </div>

      {/* Footer statistics */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
          {set.cards.length} thuật ngữ
        </span>
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};
