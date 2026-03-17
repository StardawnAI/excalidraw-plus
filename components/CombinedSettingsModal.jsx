'use client';

import { useState, useEffect } from 'react';
import { Settings, KeyRound, Server, Laptop, X, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfigManager from './ConfigManager';

/**
 * 组合设置弹窗：
 * - 左侧：展示当前模式（本地配置 / 访问密码）
 * - 访问密码模式：验证密码，从服务端获取远程 LLM 配置并写入 smart-diagram-remote-config
 * - "保存"按钮：持久化访问密码与模式开关 smart-diagram-use-password
 */
export default function CombinedSettingsModal({
  isOpen,
  onClose,
  usePassword: initialUsePassword,
  currentConfig,
  onConfigSelect,
}) {
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [isConfigManagerOpen, setIsConfigManagerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window !== 'undefined') {
      const savedPassword =
        localStorage.getItem('smart-diagram-access-password') || '';
      const savedUsePassword =
        localStorage.getItem('smart-diagram-use-password') === 'true';
      setPassword(savedPassword);
      setUsePassword(
        savedUsePassword !== null
          ? savedUsePassword
          : !!initialUsePassword,
      );
      setMessage('');
    }
  }, [isOpen, initialUsePassword]);

  /**
   * Validate access password and fetch remote LLM config from server
   */
  const handleValidate = async () => {
    if (!password) {
      setMessage('Please enter access password');
      setMessageType('error');
      return;
    }

    setIsValidating(true);
    setMessage('');

    try {
      const response = await fetch('/api/llm/config', {
        method: 'POST',
        headers: { 'x-access-password': password },
      });

      const data = await response.json();

      if (data.success && data.config) {
        const remoteConfig = {
          name: 'Server Config (Access Password)',
          type: data.config.type,
          baseUrl: data.config.baseUrl,
          model: data.config.model,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'smart-diagram-remote-config',
            JSON.stringify(remoteConfig),
          );
        }

        setMessage('Validation successful, server configuration obtained');
        setMessageType('success');

      } else {
        setMessage(data.error || 'Remote configuration validation failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Validation request failed: ' + error.message);
      setMessageType('error');
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Save configuration
   */
  const handleSave = () => {
    if (typeof window !== 'undefined') {
      // Only update access password when in “access password” mode,
      // Keep previously saved password when switching to “local config” mode
      if (usePassword) {
        localStorage.setItem(
          'smart-diagram-access-password',
          password,
        );
      }
      localStorage.setItem(
        'smart-diagram-use-password',
        usePassword.toString(),
      );
      window.dispatchEvent(
        new CustomEvent('password-settings-changed', {
          detail: { usePassword },
        }),
      );
    }
    setMessage('Settings saved');
    setMessageType('success');
    setTimeout(() => {
      onClose?.();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="relative bg-white w-full max-w-xl shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-zinc-100 rounded-lg border border-zinc-200">
                <Settings className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Configuration Settings</h2>
                <p className="text-xs text-zinc-500">Choose how to use AI models</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            
            {/* 1. Current active status display */}
            <div className={cn(
              "flex items-center justify-between px-4 py-3 rounded-xl border",
              usePassword
                ? "bg-emerald-50/50 border-emerald-100"
                : "bg-blue-50/50 border-blue-100"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                  usePassword ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                )}>
                  {usePassword ? <ShieldCheck className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Current Mode</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    usePassword ? "text-emerald-700" : "text-blue-700"
                  )}>
                    {usePassword ? 'Server-Managed Mode' : 'Local/Custom Mode'}
                  </span>
                </div>
              </div>
              {!usePassword && currentConfig && (
                <div className="text-xs px-2.5 py-1 rounded-md bg-white/60 border border-blue-200 text-blue-800 font-medium">
                  {currentConfig.name || currentConfig.type}
                </div>
              )}
            </div>

            {/* 2. Mode switcher segmented control */}
            <div className="bg-zinc-100/80 p-1 rounded-xl flex relative">
              <button
                type="button"
                onClick={() => setUsePassword(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 z-10",
                  !usePassword
                    ? "bg-white text-zinc-900 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Laptop className="w-4 h-4" />
                Local Config
              </button>
              <button
                type="button"
                onClick={() => setUsePassword(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 z-10",
                  usePassword
                    ? "bg-white text-zinc-900 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Server className="w-4 h-4" />
                Access Password
              </button>
            </div>

            {/* 3. Content area */}
            <div className="space-y-4 min-h-[120px]">
              {!usePassword ? (
                // Local config mode content
                <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-4">
                   <div className="text-sm text-zinc-600 leading-relaxed">
                      Use your own API Key to connect to OpenAI, Ollama or other compatible services. Configuration is saved locally in your browser.
                   </div>
                   <button
                    onClick={() => setIsConfigManagerOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-sm transition-all group"
                  >
                    <span className="text-sm font-medium text-zinc-700">Manage Local Model Configurations</span>
                    <Settings className="w-4 h-4 text-zinc-400 group-hover:rotate-90 transition-transform duration-500" />
                  </button>
                </div>
              ) : (
                // Access password mode content
                <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-4">
                  <div className="text-sm text-zinc-600 leading-relaxed">
                    Enter access password to use server-configured AI capabilities. No API Key configuration required.
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                      <input
                        type="password"
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter access password"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                      />
                    </div>
                    <button
                      onClick={handleValidate}
                      disabled={isValidating || !password}
                      className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-w-[80px] justify-center"
                    >
                      {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 反馈消息 */}
            {message && (
              <div className={cn(
                "px-4 py-3 rounded-xl border text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2",
                messageType === 'success' 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                  : "bg-red-50 border-red-100 text-red-700"
              )}>
                {messageType === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span className="leading-5">{message}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save & Apply
            </button>
          </div>
        </div>
      </div>

      {/* ConfigManager as secondary modal */}
      {isConfigManagerOpen && (
        <ConfigManager
          isOpen={true}
          onClose={() => setIsConfigManagerOpen(false)}
          onConfigSelect={onConfigSelect}
        />
      )}
    </>
  );
}