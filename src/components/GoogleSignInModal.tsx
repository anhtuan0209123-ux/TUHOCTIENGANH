import React, { useState } from 'react';
import { X, Mail, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({ isOpen, onClose }) => {
  const { login, currentEmail } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ Email Gmail.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Địa chỉ Email không đúng định dạng (VD: tenban@gmail.com).');
      return;
    }

    const displayName = nameInput.trim() || cleanEmail.split('@')[0];
    login({
      id: `user_${cleanEmail}`,
      name: displayName,
      email: cleanEmail,
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`
    });

    setErrorMsg('');
    setEmailInput('');
    setNameInput('');
    onClose();
  };

  const handleQuickSelect = (name: string, email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    login({
      id: `user_${cleanEmail}`,
      name,
      email: cleanEmail,
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        id="gmail-auth-modal"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-scale-up text-left"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-5 text-white relative">
          <button
            id="close-gmail-auth-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 mb-1.5 text-blue-200 text-xs font-black uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>Phân tách dữ liệu & Streak độc lập</span>
          </div>
          <h2 className="text-xl font-black text-white">Đăng nhập tài khoản Gmail</h2>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">
            Mỗi Gmail sở hữu kho bài học, thư mục và chuỗi Streak 🔥 hoàn toàn riêng biệt.
          </p>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Địa chỉ Gmail <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="gmail-input-field"
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="VD: userA@gmail.com hoặc anhtuan@gmail.com"
                  autoFocus
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  required
                />
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tên hiển thị (Tùy chọn)
              </label>
              <input
                id="name-input-field"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="VD: Tuấn Anh, Học viên A..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
                {errorMsg}
              </p>
            )}

            <button
              id="confirm-gmail-login-btn"
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Vào học với Gmail này</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Chọn nhanh tài khoản mẫu để kiểm tra phân tách dữ liệu */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-2">
              Tài khoản mẫu thử nghiệm phân tách:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('Anh Tuấn', 'anhtuan0209123@gmail.com')}
                className={`text-left p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                  currentEmail === 'anhtuan0209123@gmail.com'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xs font-bold shrink-0">
                  T
                </div>
                <div className="truncate">
                  <div className="font-bold truncate">anhtuan0209123@gmail.com</div>
                  <div className="text-[10px] text-slate-400 truncate">Dữ liệu cá nhân</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('User A', 'userA@gmail.com')}
                className={`text-left p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                  currentEmail === 'userA@gmail.com'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xs font-bold shrink-0">
                  A
                </div>
                <div className="truncate">
                  <div className="font-bold truncate">userA@gmail.com</div>
                  <div className="text-[10px] text-slate-400 truncate">Kho bài học User A</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('User B', 'userB@gmail.com')}
                className={`text-left p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                  currentEmail === 'userB@gmail.com'
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xs font-bold shrink-0">
                  B
                </div>
                <div className="truncate">
                  <div className="font-bold truncate">userB@gmail.com</div>
                  <div className="text-[10px] text-slate-400 truncate">Kho bài học User B</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('Tài khoản Khách', 'guest')}
                className={`text-left p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                  currentEmail === 'guest'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-slate-500 text-white flex items-center justify-center text-2xs font-bold shrink-0">
                  G
                </div>
                <div className="truncate">
                  <div className="font-bold truncate">Khách (Guest)</div>
                  <div className="text-[10px] text-slate-400 truncate">Kho mặc định</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
