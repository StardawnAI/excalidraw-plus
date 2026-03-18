'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, Upload, CheckCircle2, Activity, Pencil, Copy, Trash2, X, Search, Loader2, Server, Key, Bot, Box } from 'lucide-react';
import { configManager } from '../lib/config-manager.js';
import Notification from './Notification';
import ConfirmDialog from './ConfirmDialog';
import { cn } from '@/lib/utils';

export default function ConfigManager({ isOpen, onClose, onConfigSelect }) {
  const [configs, setConfigs] = useState([]);
  const [activeConfigId, setActiveConfigId] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Load configs when modal opens
  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  const loadConfigs = () => {
    try {
      const allConfigs = configManager.getAllConfigs();
      const activeId = configManager.getActiveConfigId();
      setConfigs(allConfigs);
      setActiveConfigId(activeId);
    } catch (err) {
      setError('Failed to load configurations: ' + err.message);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingConfig({
      name: '',
      type: 'openai',
      baseUrl: '',
      apiKey: '',
      model: '',
      description: ''
    });
  };

  const handleEdit = (config) => {
    setIsCreating(false);
    setEditingConfig({ ...config });
  };

  const handleDelete = async (configId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this configuration? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await configManager.deleteConfig(configId);
          loadConfigs();
          setError('');
          setNotification({
            isOpen: true,
            title: 'Deletion Successful',
            message: 'Configuration successfully deleted',
            type: 'success'
          });
        } catch (err) {
          setError('Failed to delete configuration: ' + err.message);
        }
      }
    });
  };

  const handleClone = (config) => {
    const newName = `${config.name} (Copy)`;

    try {
      configManager.cloneConfig(config.id, newName);
      loadConfigs();
      setError('');
      setNotification({
        isOpen: true,
        title: 'Clone Successful',
        message: 'Configuration successfully cloned',
        type: 'success'
      });
    } catch (err) {
      setError('Failed to clone configuration: ' + err.message);
    }
  };

  const handleSetActive = async (configId) => {
    try {
      await configManager.setActiveConfig(configId);
      loadConfigs();
      onConfigSelect?.(configManager.getActiveConfig());
      setError('');
    } catch (err) {
      setError('Failed to switch configuration: ' + err.message);
    }
  };

  const handleTestConnection = async (config) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await configManager.testConnection(config);
      if (result.success) {
        setNotification({
          isOpen: true,
          title: 'Connection Test Successful',
          message: result.message,
          type: 'success'
        });
      } else {
        setNotification({
          isOpen: true,
          title: 'Connection Test Failed',
          message: result.message,
          type: 'error'
        });
      }
    } catch (err) {
      setNotification({
        isOpen: true,
        title: 'Connection Test Failed',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (configData) => {
    try {
      if (isCreating) {
        const newConfig = configManager.createConfig(configData);
        if (configs.length === 0) {
          onConfigSelect?.(newConfig);
        }
      } else {
        configManager.updateConfig(editingConfig.id, configData);
        if (editingConfig.id === activeConfigId) {
          onConfigSelect?.(configManager.getConfig(editingConfig.id));
        }
      }

      setEditingConfig(null);
      setIsCreating(false);
      loadConfigs();
      setError('');
    } catch (err) {
      setError('Failed to save configuration: ' + err.message);
    }
  };

  const handleExport = () => {
    try {
      const exportData = configManager.exportConfigs();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'llm-configs.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export configuration: ' + err.message);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const result = configManager.importConfigs(text);
        if (result.success) {
          setNotification({
            isOpen: true,
            title: 'Import Successful',
            message: `Successfully imported ${result.count} configurations`,
            type: 'success'
          });
          loadConfigs();
        } else {
          setError('Failed to import configuration: ' + result.message);
        }
      } catch (err) {
        setError('Failed to import configuration: ' + err.message);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  if (editingConfig) {
    return <ConfigEditor
      config={editingConfig}
      isCreating={isCreating}
      onSave={handleSaveConfig}
      onCancel={() => {
        setEditingConfig(null);
        setIsCreating(false);
      }}
    />;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-zinc-200 rounded-lg shadow-sm">
                <Server className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-zinc-900">Local Configuration Management</h2>
                <p className="text-xs text-zinc-500">Manage your API connections and model parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-zinc-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <p className="text-xs text-zinc-500 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 inline-flex items-center">
              <Activity className="w-3.5 h-3.5 mr-2" />
              Note: If "Access Password" mode is enabled, server-side configuration will be prioritized.
           </p>
           <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                New Configuration
              </button>
           </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-sm text-red-600">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Config List */}
          <div className="grid grid-cols-1 gap-4">
            {configs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-white border border-dashed border-zinc-200 rounded-2xl">
                <Box className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No configurations</p>
                <p className="text-xs mt-1">Click "New Configuration" in the top right to get started</p>
              </div>
            ) : (
              configs.map((config) => {
                const isActive = config.id === activeConfigId;
                return (
                  <div
                    key={config.id}
                    className={cn(
                      "group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200",
                      isActive
                        ? "bg-white border-zinc-900 shadow-md ring-1 ring-zinc-900/5"
                        : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className={cn("font-semibold truncate", isActive ? "text-zinc-900" : "text-zinc-700")}>
                            {config.name}
                        </h3>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-zinc-900 text-white rounded-full">
                             <CheckCircle2 className="w-3 h-3" /> Currently Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-500 rounded-full uppercase border border-zinc-200">
                            {config.type}
                          </span>
                        )}
                      </div>
                      {config.description && (
                        <p className="text-sm text-zinc-500 mb-2 line-clamp-1">{config.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 font-mono">
                        <span className="flex items-center gap-1" title={config.baseUrl}>
                            <Server className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{config.baseUrl}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            {config.model}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-4 sm:mt-0 pl-0 sm:pl-4 sm:border-l sm:border-zinc-100">
                      {!isActive && (
                        <button
                          onClick={() => handleSetActive(config.id)}
                          title="Set as Active"
                          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {/* <button
                        onClick={() => handleTestConnection(config)}
                        disabled={isLoading}
                        title="Test Connection"
                        className={cn(
                           "p-2 rounded-lg transition-colors",
                           isLoading ? "text-zinc-300" : "text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
                        )}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                      </button> */}
                      <button
                        onClick={() => handleEdit(config)}
                        title="Edit"
                        className="p-2 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleClone(config)}
                        title="Clone"
                        className="p-2 rounded-lg text-zinc-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        title="Delete"
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      <Notification
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
      />
    </div>
  );
}

// Configuration Editor Component
function ConfigEditor({ config, isCreating, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...config });
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formData.model) {
      if (models.length > 0) {
        const exists = models.some(m => m.id === formData.model);
        setUseCustomModel(!exists);
      } else {
        setUseCustomModel(true);
      }
    }
  }, [models, formData.model]);

  const handleLoadModels = async () => {
    if (!formData.type || !formData.baseUrl || !formData.apiKey) {
      setError('Please fill in provider type, base URL and API key first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        type: formData.type,
        baseUrl: formData.baseUrl,
        apiKey: formData.apiKey,
      });

      const response = await fetch(`/api/models?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load models');
      }

      setModels(data.models);
    } catch (err) {
      setError(err.message);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.type || !formData.baseUrl || !formData.apiKey || !formData.model) {
      setError('Please fill in all required fields');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div className="relative bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <h2 className="text-lg font-semibold text-zinc-900">
            {isCreating ? 'New Configuration' : 'Edit Configuration'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
             <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-600">
               <X className="w-4 h-4 mt-0.5 shrink-0" />
               <span className="leading-relaxed">{error}</span>
             </div>
          )}

          <div className="space-y-4">
            {/* Name & Description */}
            <div className="space-y-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Configuration Name <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g.: My OpenAI"
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Description
                    </label>
                    <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Configuration description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white resize-none"
                    />
                </div>
            </div>

            {/* Connection Details */}
            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider px-1">Connection Information</h3>

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Provider Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value, model: '' })}
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white appearance-none"
                        >
                        <option value="openai">OpenAI (or compatible)</option>
                        <option value="anthropic">Anthropic</option>
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
                        value={formData.baseUrl}
                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                        placeholder={formData.type === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1'}
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
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder="sk-..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-4 border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider px-1">Model Selection</h3>
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
                                        setFormData({ ...formData, model: models[0].id });
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
                                    setFormData({ ...formData, model: '' });
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
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g.: gpt-4, claude-3-opus-20240229"
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-white"
                    />
                    )}
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-sm hover:shadow-md transition-all"
          >
            {isCreating ? 'Create Now' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}