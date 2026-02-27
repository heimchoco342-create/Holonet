import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, Key, Globe, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Settings {
  openaiApiKey: string;
  anthropicApiKey: string;
  agentServiceUrl: string;
}

// Extend Window interface locally for this component
declare global {
  interface Window {
    electronAPI?: {
      settings: {
        save: (settings: Settings) => Promise<{ success: boolean }>;
        load: () => Promise<Settings>;
      };
    };
  }
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'api-keys'>('api-keys');
  const [settings, setSettings] = useState<Settings>({
    openaiApiKey: '',
    anthropicApiKey: '',
    agentServiceUrl: ''
  });
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI?.settings?.load) {
        const loadedSettings = await window.electronAPI.settings.load();
        // Merge with existing state to ensure we don't lose default keys if API returns partial
        setSettings(prev => ({ ...prev, ...loadedSettings }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Don't show error to user on load, just log it. They'll see empty fields.
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      if (window.electronAPI?.settings?.save) {
        await window.electronAPI.settings.save(settings);
        setMessage({ type: 'success', text: 'Settings saved successfully' });
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        console.warn('Settings API not available');
        setMessage({ type: 'error', text: 'Settings API not available (Dev Mode)' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#18181b]">
          <h2 className="text-xl font-semibold text-white tracking-tight">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-[#a1a1aa] hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-[#27272a] bg-[#18181b]/50 p-3 space-y-1">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'api-keys' 
                  ? 'bg-[#27272a] text-white shadow-sm' 
                  : 'text-[#a1a1aa] hover:bg-[#27272a]/50 hover:text-white'
              }`}
            >
              <Key size={18} />
              <span>API Keys</span>
            </button>
            {/* Future tabs placeholder (commented out for now) */}
            {/* 
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#a1a1aa] hover:bg-[#27272a]/50 hover:text-white opacity-50 cursor-not-allowed">
              <Globe size={18} />
              <span>Network</span>
            </button> 
            */}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-[#09090b]">
            {activeTab === 'api-keys' && (
              <div className="p-6 max-w-lg">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-1">API Configuration</h3>
                  <p className="text-sm text-[#a1a1aa]">Manage your API keys and service connections.</p>
                </div>
                
                <div className="space-y-6">
                  {/* OpenAI Key */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#e4e4e7]">
                      OpenAI API Key
                    </label>
                    <div className="relative group">
                      <input
                        type={showOpenAI ? "text" : "password"}
                        value={settings.openaiApiKey}
                        onChange={(e) => setSettings(s => ({ ...s, openaiApiKey: e.target.value }))}
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-3 pr-10 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="sk-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenAI(!showOpenAI)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        {showOpenAI ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-[#52525b]">Required for LLM-based features.</p>
                  </div>

                  {/* Anthropic Key */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#e4e4e7]">
                      Anthropic API Key
                    </label>
                    <div className="relative group">
                      <input
                        type={showAnthropic ? "text" : "password"}
                        value={settings.anthropicApiKey}
                        onChange={(e) => setSettings(s => ({ ...s, anthropicApiKey: e.target.value }))}
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-3 pr-10 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="sk-ant-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowAnthropic(!showAnthropic)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        {showAnthropic ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Agent Service URL */}
                  <div className="space-y-2 pt-2 border-t border-[#27272a]">
                    <label className="block text-sm font-medium text-[#e4e4e7]">
                      Agent Service URL
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]">
                        <Globe size={16} />
                      </div>
                      <input
                        type="text"
                        value={settings.agentServiceUrl}
                        onChange={(e) => setSettings(s => ({ ...s, agentServiceUrl: e.target.value }))}
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="http://localhost:3000"
                      />
                    </div>
                    <p className="text-xs text-[#52525b]">URL for the backend agent service.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#27272a] bg-[#18181b]">
          <div className="text-sm font-medium min-h-[20px]">
            {message && (
              <span className={`flex items-center gap-2 ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                {message.type === 'success' && <ShieldCheck size={16} />}
                {message.text}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
