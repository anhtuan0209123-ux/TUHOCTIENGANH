import React, { useState } from 'react';
import { StudySet, ReviewLog } from '../types';
import { Plus, Trash2, Calendar, ClipboardCheck, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

interface ReviewLogPanelProps {
  set: StudySet;
  onUpdateLogs: (setId: string, logs: ReviewLog[]) => void;
}

export function ReviewLogPanel({ set, onUpdateLogs }: ReviewLogPanelProps) {
  const logs = set.reviewLogs || [];
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [correctCount, setCorrectCount] = useState<number>(set.cards.length);
  const [totalCount, setTotalCount] = useState<number>(set.cards.length);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Vui lòng chọn ngày ôn tập.');
      return;
    }
    if (correctCount < 0 || totalCount <= 0) {
      setError('Số câu đúng và tổng số câu không hợp lệ.');
      return;
    }
    if (correctCount > totalCount) {
      setError('Số câu đúng không thể vượt quá tổng số câu kiểm tra.');
      return;
    }

    const newLog: ReviewLog = {
      id: `log-${Date.now()}`,
      date,
      correctCount,
      totalCount,
      note: note.trim()
    };

    const updatedLogs = [newLog, ...logs];
    onUpdateLogs(set.id, updatedLogs);

    // Reset form
    setNote('');
    setError(null);
    setShowForm(false);
  };

  const handleDelete = (logId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dòng nhật ký ôn tập này không?')) {
      const updatedLogs = logs.filter(log => log.id !== logId);
      onUpdateLogs(set.id, updatedLogs);
    }
  };

  // Calculate some fun stats
  const averageAccuracy = logs.length > 0 
    ? Math.round((logs.reduce((sum, log) => sum + (log.correctCount / log.totalCount), 0) / logs.length) * 100)
    : 0;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (accuracy >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 text-brand rounded-lg">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800">
              Thống kê nhật ký ôn tập ({logs.length} lượt)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {logs.length > 0 
                ? `Tỉ lệ chính xác trung bình: ${averageAccuracy}%` 
                : 'Hãy bắt đầu làm kiểm tra và ghi nhận kết quả học tập của bạn tại đây.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            // Preset values based on current cards length
            setTotalCount(set.cards.length);
            setCorrectCount(set.cards.length);
            setDate(new Date().toISOString().split('T')[0]);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Plus size={14} />
          <span>Ghi chép lần ôn tập mới</span>
        </button>
      </div>

      {/* Add Log Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Sparkles size={16} className="text-brand" />
              Ghi chép kết quả ôn tập
            </span>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Hủy bỏ
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs font-semibold">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Ngày ôn tập:</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                  required
                />
              </div>
            </div>

            {/* Score Inputs */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Kết quả kiểm tra (Số câu đúng):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={totalCount}
                  value={correctCount}
                  onChange={(e) => setCorrectCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
                <span className="text-slate-400 font-bold">/</span>
                <input
                  type="number"
                  min="1"
                  value={totalCount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTotalCount(val);
                    if (correctCount > val) {
                      setCorrectCount(val);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
              </div>
            </div>

            {/* Quick Note input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Ghi chú nhanh:</label>
              <input
                type="text"
                placeholder="Ví dụ: Ôn tập buổi sáng, trắc nghiệm nhanh 100%"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-50">
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Lưu kết quả
            </button>
          </div>
        </form>
      )}

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Calendar size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-sm text-slate-800">Chưa có nhật ký ôn tập nào</h5>
            <p className="text-xs text-slate-550 max-w-md mx-auto leading-relaxed">
              Dành 5-10 phút kiểm tra định kỳ mỗi ngày, sau đó lưu lại lịch sử ôn tập tại đây để theo dõi tiến độ cải thiện ghi nhớ của bản thân nhé!
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4 text-center w-[10%]">LẦN ÔN</th>
                  <th className="py-3 px-4 w-[20%]">NGÀY ÔN TẬP</th>
                  <th className="py-3 px-4 w-[25%]">KẾT QUẢ KIỂM TRA</th>
                  <th className="py-3 px-4 w-[35%]">GHI CHÚ NHANH</th>
                  <th className="py-3 px-4 text-center w-[10%]">XÓA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log, index) => {
                  const accuracy = Math.round((log.correctCount / log.totalCount) * 100);
                  const colorClass = getAccuracyColor(accuracy);
                  const reversedIndex = logs.length - index;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-700">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {reversedIndex}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          {formatDate(log.date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${colorClass}`}>
                            {log.correctCount}/{log.totalCount} ({accuracy}%)
                          </span>
                          
                          {/* Mini Progress Bar */}
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block shrink-0">
                            <div 
                              className={`h-full rounded-full ${
                                accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium break-all">
                        {log.note ? (
                          <span className="flex items-center gap-1.5">
                            <MessageSquare size={13} className="text-slate-400 shrink-0" />
                            {log.note}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa ghi chép này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
