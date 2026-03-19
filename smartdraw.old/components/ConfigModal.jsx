'use client';

import { useState, useEffect } from 'react';
import { Settings, X, Server, Key, Bot, Search, Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConfigModal({ isOpen, onClose, onSave, initialConfig }) {
  const [config, setConfig] = useState({
    name: '',
    type: 'openai',
    baseUrl: '',
    apiKey: '',
    model: '',
  });
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCustomModel, setUseCustomModel] = useState(false);

  // 仅在初始配置变更时同步到本地表单状态
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // 根据当前表单中的模型与可用模型列表，决定是否使用自定义输入
  useEffect(() => {
    if (config.model) {
      if (models.length > 0) {
        const exists = models.some(m => m.id === config.model);
        setUseCustomModel(!exists);
      } else {
        setUseCustomModel(true);
      }
    }
  }, [models, config.model]);

  const handleLoadModels = async () => {
    if (!config.type || !config.baseUrl || !config.apiKey) {
      setError('Please fill in provider type, base URL and API key first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        type: config.type,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
      });

      const response = await fetch(`/api/models?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load models');
      }

      setModels(data.models);
      if (data.models.length > 0) {
        // If current model is not in the newly loaded list, switch to list selection mode
        if (config.model && !data.models.some(m => m.id === config.model)) {
          setUseCustomModel(false);
          setConfig(prev => ({ ...prev, model: data.models[0].id }));
        } else if (!config.model && !useCustomModel) {
          // If no model is selected and not in manual input mode, automatically select the first one
          setConfig(prev => ({ ...prev, model: data.models[0].id }));
        }
      }
    } catch (err) {
      setError(err.message);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!config.type || !config.baseUrl || !config.apiKey || !config.model) {
      setError('Please fill in all required fields');
      return;
    }

    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-zinc-200 rounded-lg shadow-sm">
              <Settings className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-zinc-900">LLM Configuration</h2>
                <p className="text-xs text-zinc-500">Configure API connection parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Alerts */}
          <div className="space-y-3">
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className=”px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-2 text-sm text-blue-600”>
                <Info className=”w-4 h-4 mt-0.5 shrink-0” />
                <span>Note: If “Access Password” mode is enabled, the system will prioritize using the server-side configuration.</span>
              </div>
          </div>

          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g.: My OpenAI"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white"
                />
            </div>
          </div>

          {/* Section 2: Connection Settings */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider px-1">Connection Settings</h3>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Provider Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={config.type}
                  onChange={(e) => setConfig({ ...config, type: e.target.value, model: '' })}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white appearance-none"
                >
                  <option value="openai">OpenAI Compatible (e.g. DeepSeek)</option>
                  <option value="anthropic">Anthropic Compatible</option>
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-400">
                   <Bot className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Base URL <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Server className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder={config.type === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1'}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Model Settings */}
          <div className="space-y-4 pt-2 border-t border-zinc-100">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider px-1">Model Parameters</h3>
                <button
                  onClick={handleLoadModels}
                  disabled={loading}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  {loading ? 'Loading...' : 'Get Model List'}
                </button>
             </div>

            <div>
              {models.length > 0 && (
                <div className="mb-3 flex p-1 bg-zinc-100 rounded-lg w-full">
                    <button
                        type="button"
                        onClick={() => {
                            setUseCustomModel(false);
                            if (models.length > 0) {
                                setConfig({ ...config, model: models[0].id });
                            }
                        }}
                        className={cn(
                            "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                            !useCustomModel ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        Select from List
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setUseCustomModel(true);
                            setConfig({ ...config, model: '' });
                        }}
                        className={cn(
                            "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                            useCustomModel ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        Manual Input
                    </button>
                </div>
              )}

              {models.length > 0 && !useCustomModel ? (
                <div className="relative">
                    <select
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white appearance-none"
                    >
                    {models.map((model) => (
                        <option key={model.id} value={model.id}>
                        {model.name || model.id}
                        </option>
                    ))}
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-400">
                        <Bot className="w-4 h-4" />
                    </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder="e.g.: gpt-4, claude-3-opus-20240229"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white"
                />
              )}
              <p className="text-[10px] text-zinc-400 mt-1.5 px-1">
                  Recommended: claude-sonnet-3.5 or gpt-4o for best results
              </p>
            </div>
          </div>
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
            className="px-6 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-sm hover:shadow-md transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}