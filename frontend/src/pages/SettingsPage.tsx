import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Database, Server, Key, Brain, Bell, Shield, PaintBucket, Sun, Moon } from 'lucide-react'
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
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Settings</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Manage application configuration and preferences.</p>
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
                  ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)]' 
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg p-6 md:p-8 min-h-[500px]">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">System Information</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Basic information about the current deployment.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-[hsl(var(--border))]">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-[hsl(var(--foreground))]">Application Name</label>
                    <input type="text" disabled value="FactoryMind" className="col-span-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-[hsl(var(--foreground))]">Version</label>
                    <input type="text" disabled value="v1.0.0-beta" className="col-span-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-[hsl(var(--foreground))]">Backend URL</label>
                    <input type="text" disabled value="http://localhost:8000" className="col-span-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">AI & RAG Pipeline</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Configure models and generation parameters.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-[hsl(var(--border))]">
                  <div className="grid grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium text-[hsl(var(--foreground))] block">LLM Model</label>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">Model used for answer generation</span>
                    </div>
                    <select className="col-span-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] outline-none">
                      <option>gemini-2.5-flash</option>
                      <option>gemini-1.5-pro</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium text-[hsl(var(--foreground))] block">Retrieval Chunks</label>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">Number of top chunks to send to LLM</span>
                    </div>
                    <input type="number" defaultValue={5} className="col-span-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium text-[hsl(var(--foreground))] block">Chunk Size</label>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">Characters per document chunk</span>
                    </div>
                    <input type="number" disabled defaultValue={1000} className="col-span-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]" />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button className="bg-[hsl(var(--primary))] hover:opacity-90 text-[hsl(var(--primary-foreground))] px-4 py-2 rounded-md text-sm font-medium transition-opacity">
                      Save Pipeline Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Appearance</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Customize the interface theme.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-[hsl(var(--border))]">
                  {/* Theme Toggle Card */}
                  <div className="flex items-center justify-between p-5 bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))]">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-amber-400/20'}`}>
                        {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-[hsl(var(--foreground))]">{isDark ? 'Dark Mode' : 'Light Mode'}</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{isDark ? 'Industrial dark theme active' : 'Clean light theme active'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggleTheme}
                      className={`w-14 h-7 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 ${isDark ? 'bg-[hsl(var(--primary))]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow transition-transform ${isDark ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Theme Previews */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => !isDark && toggleTheme()}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${isDark ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)/0.3)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]'}`}
                    >
                      <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 mb-3 flex items-end p-2">
                        <div className="h-2 w-12 rounded bg-cyan-400 opacity-80" />
                      </div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">Dark Industrial</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Vibrant, high-contrast</p>
                    </button>
                    <button
                      onClick={() => isDark && toggleTheme()}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${!isDark ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)/0.3)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]'}`}
                    >
                      <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-100 to-white mb-3 flex items-end p-2 border border-slate-200">
                        <div className="h-2 w-12 rounded bg-sky-500 opacity-80" />
                      </div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">Light Clean</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Minimal, easy on eyes</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Database & Storage</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Storage metrics and configuration.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[hsl(var(--border))]">
                  <div className="p-4 bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))]">
                    <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold mb-1">Vector Store</div>
                    <div className="text-lg font-bold text-[hsl(var(--foreground))]">ChromaDB</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Status: Connected</div>
                  </div>
                  <div className="p-4 bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))]">
                    <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold mb-1">Metadata Store</div>
                    <div className="text-lg font-bold text-[hsl(var(--foreground))]">SQLite</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Status: Connected</div>
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
