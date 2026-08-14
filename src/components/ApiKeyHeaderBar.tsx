import React, { useState, useEffect } from 'react';
import { Key, Check, Eye, EyeOff, ExternalLink, AlertTriangle, Trash2, Sparkles, HelpCircle } from 'lucide-react';
import { getStoredGeminiKey, setStoredGeminiKey } from '../utils/geminiKey';

export function ApiKeyHeaderBar() {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const current = getStoredGeminiKey();
    setSavedKey(current);
    setApiKeyInput(current);

    const handleKeyUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const val = customEvent.detail || getStoredGeminiKey();
      setSavedKey(val);
      setApiKeyInput(val);
    };

    window.addEventListener('gemini-key-updated', handleKeyUpdate);
    return () => {
      window.removeEventListener('gemini-key-updated', handleKeyUpdate);
    };
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = apiKeyInput.trim();
    setStoredGeminiKey(trimmed);
    setSavedKey(trimmed);
    setIsSavedNotice(true);
    setIsEditing(false);
    setTimeout(() => {
      setIsSavedNotice(false);
    }, 2500);
  };

  const handleClear = () => {
    setStoredGeminiKey('');
    setSavedKey('');
    setApiKeyInput('');
    setIsEditing(true);
  };

  return (
    <div className="w-full bg-slate-100/80 border-b border-slate-200 px-4 py-2 text-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left branding & status indicator */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
          <div className="p-1 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center">
            <Key size={15} />
          </div>
          <span className="font-semibold text-slate-700">GEMINI_API_KEY:</span>

          {savedKey && !isEditing ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Check size={12} />
                Đã cài đặt
              </span>
              <span className="text-slate-500 font-mono text-xs hidden sm:inline">
                ({savedKey.substring(0, 6)}...{savedKey.slice(-4)})
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangle size={12} />
              Chưa lưu Key cá nhân
            </span>
          )}
        </div>

        {/* Input form or Edit controls */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {(!savedKey || isEditing) ? (
            <form onSubmit={handleSave} className="flex items-center gap-1.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Nhập GEMINI_API_KEY (AIzaSy...)..."
                  className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs px-3 py-1.5 pr-8 rounded-lg border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title={showKey ? "Ẩn Key" : "Hiện Key"}
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!apiKeyInput.trim()}
                className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-xs shrink-0 cursor-pointer"
              >
                {isSavedNotice ? <Check size={13} /> : <Sparkles size={13} />}
                {isSavedNotice ? 'Đã lưu!' : 'Lưu Key'}
              </button>

              {savedKey && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                >
                  Hủy
                </button>
              )}
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Đổi Key
              </button>
              <button
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                title="Xóa Key khỏi localStorage"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-help-center', { detail: 'api-config' }));
            }}
            className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 transition shrink-0 ml-1 border-l border-slate-300 pl-2 cursor-pointer font-semibold"
            title="Xem video & hướng dẫn cấu hình API Key"
          >
            <HelpCircle size={11} />
            <span>Hướng dẫn API</span>
          </button>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-amber-700 transition shrink-0 ml-1 border-l border-slate-300 pl-2 font-medium"
            title="Lấy API Key miễn phí từ Google AI Studio"
          >
            <span>Lấy Key miễn phí</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Reminder notification banner if no key is saved */}
      {!savedKey && (
        <div className="max-w-6xl mx-auto mt-1.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-amber-800 font-medium bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="shrink-0 text-amber-600" />
            <span>
              <strong>Nhắc nhở:</strong> Nhập <strong>GEMINI_API_KEY</strong> của bạn ở ô trên để sử dụng các tính năng AI (Tạo bài học AI, phân tích từ vựng, dượt bài...). Key sẽ được bảo mật lưu trong localStorage trình duyệt của bạn.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
