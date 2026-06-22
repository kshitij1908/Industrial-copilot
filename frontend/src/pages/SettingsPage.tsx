import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Database, Server, Key, Brain, Bell, Shield, PaintBucket } from 'lucide-react'
import { useThemeStore } from '../stores/themeStore'

export default function SettingsPage() {
  const { isDark, toggleTheme } = useThemeStore()
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ai', label: 'AI & RAG', icon: Brain },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: PaintBucket },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-1">Manage application configuration and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-industrial-500/20 text-industrial-400 border border-industrial-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 md:p-8 min-h-[500px]">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">System Information</h2>
                  <p className="text-sm text-slate-500 mt-1">Basic information about the current deployment.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-800">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300">Application Name</label>
                    <input type="text" disabled value="Industrial Knowledge Copilot" className="col-span-2 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300">Version</label>
                    <input type="text" disabled value="v1.0.0-beta" className="col-span-2 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300">Backend URL</label>
                    <input type="text" disabled value="http://localhost:8000" className="col-span-2 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">AI & RAG Pipeline</h2>
                  <p className="text-sm text-slate-500 mt-1">Configure models and generation parameters.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-800">
                  <div className="grid grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium text-slate-300 block">LLM Model</label>
                      <span className="text-xs text-slate-500">Model used for answer generation</span>
                    </div>
                    <select className="col-span-2 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:border-industrial-500 outline-none">
                      <option>gemini-2.5-flash</option>
                      <option>gemini-1.5-pro</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium text-slate-300 block">Retrieval Chunks</label>
                      <span className="text-xs text-slate-500">Number of top chunks to send to LLM</span>
                    </div>
                    <input type="number" defaultValue={5} className="col-span-2 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:border-industrial-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium text-slate-300 block">Chunk Size</label>
                      <span className="text-xs text-slate-500">Characters per document chunk</span>
                    </div>
                    <input type="number" disabled defaultValue={1000} className="col-span-2 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-500" />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button className="bg-industrial-600 hover:bg-industrial-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Save Pipeline Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Appearance</h2>
                  <p className="text-sm text-slate-500 mt-1">Customize the interface.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <h3 className="font-medium text-slate-200">Dark Theme</h3>
                      <p className="text-sm text-slate-500">Use industrial dark mode.</p>
                    </div>
                    <button 
                      onClick={toggleTheme}
                      className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-industrial-500' : 'bg-slate-600'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isDark ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Database & Storage</h2>
                  <p className="text-sm text-slate-500 mt-1">Storage metrics and configuration.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Vector Store</div>
                    <div className="text-lg font-bold text-slate-200">ChromaDB</div>
                    <div className="text-sm text-slate-400 mt-2">Status: Connected</div>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Metadata Store</div>
                    <div className="text-lg font-bold text-slate-200">SQLite</div>
                    <div className="text-sm text-slate-400 mt-2">Status: Connected</div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  )
}
