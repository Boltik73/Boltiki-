
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  Shield, Menu, MoreVertical, ArrowDown, ArrowUp, 
  Settings, Globe, Zap, Terminal, Trash2, 
  ChevronDown, Cpu, Wifi, Bot, Send, 
  RefreshCw, Power
} from 'lucide-react';

// --- Types ---
type AppTab = 'dashboard' | 'ai' | 'settings';
interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dlSpeed, setDlSpeed] = useState('13,5 MB');
  const [ulSpeed, setUlSpeed] = useState('1,8 MB');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [messages, setMessages] = useState<{role:string, content:string}[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [...prev, { id: Math.random().toString(), time, message, type }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Симуляция трафика
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setDlSpeed((Math.random() * 20 + 5).toFixed(1).replace('.', ',') + ' MB');
      setUlSpeed((Math.random() * 5 + 1).toFixed(1).replace('.', ',') + ' MB');
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const toggleConnection = () => {
    if (isConnecting) return;
    
    if (isConnected) {
      setIsConnected(false);
      addLog("VPN Disconnected", "info");
    } else {
      setIsConnecting(true);
      addLog("Server Hostkey: ssh-ed25519", "info");
      
      setTimeout(() => addLog("Authenticating with password...", "info"), 500);
      setTimeout(() => addLog("Forward Successful", "success"), 1200);
      setTimeout(() => addLog("VPN Connected", "success"), 1800);
      setTimeout(() => addLog("Routes: 0.0.0.0/0", "info"), 2100);
      setTimeout(() => {
        addLog("VPNService Connected", "success");
        setIsConnecting(false);
        setIsConnected(true);
      }, 2500);
    }
  };

  const clearLogs = () => setLogs([]);

  const askAi = async () => {
    if (!input.trim() || isAiLoading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `VPN Status: ${isConnected ? 'Connected' : 'Disconnected'}. Logs: ${JSON.stringify(logs.slice(-5))}. User question: ${input}`,
        config: { systemInstruction: "Ты — инженер поддержки LOX-Tunnel. Тон технический, лаконичный. Анализируй логи и давай советы по обходу блокировок." }
      });
      setMessages(prev => [...prev, { role: 'model', content: response.text || "Анализ логов не выявил критических ошибок." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: "Ошибка нейромодуля. Проверьте сеть." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-white font-sans overflow-hidden select-none">
      
      {/* Top Header Section */}
      <div className="bg-[#7c3aed] pt-12 pb-4 px-6 relative shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <Menu className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">Lox-Tunnel</h1>
          <MoreVertical className="w-6 h-6" />
        </div>
        
        <div className="flex justify-between items-center text-xs font-bold opacity-90 px-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-md"><ArrowDown className="w-3 h-3" /></div>
            <span>{dlSpeed}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{ulSpeed}</span>
            <div className="p-1 bg-white/20 rounded-md"><ArrowUp className="w-3 h-3" /></div>
          </div>
        </div>
      </div>

      {/* Connection Area */}
      <div className="flex-1 bg-[#f4f4f4] dark:bg-[#1a1a1a] flex flex-col items-center relative overflow-y-auto no-scrollbar">
        
        {/* The Big Button Section */}
        <div className="w-full flex justify-center py-10 relative">
          <div className={`absolute w-64 h-64 rounded-full transition-all duration-1000 ${isConnected ? 'bg-emerald-500/10 scale-110' : 'bg-transparent'}`} />
          <button 
            onClick={toggleConnection}
            className={`w-40 h-40 rounded-full border-8 transition-all active:scale-95 flex items-center justify-center shadow-2xl relative z-10
              ${isConnected 
                ? 'bg-[#222] border-emerald-500 shadow-emerald-500/20' 
                : isConnecting 
                  ? 'bg-[#222] border-amber-500 animate-pulse' 
                  : 'bg-[#222] border-[#7c3aed]'}`}
          >
            <span className={`text-2xl font-black italic tracking-widest ${isConnecting ? 'text-amber-500' : 'text-white'}`}>
              {isConnecting ? '...' : isConnected ? 'STOP' : 'START'}
            </span>
          </button>
        </div>

        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8">
          Config Version: 42.0.LOX
        </div>

        {/* Selection Cards */}
        <div className="w-full px-6 space-y-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 flex items-center gap-4 shadow-sm border border-zinc-200 dark:border-white/5 active:scale-[0.98] transition-transform">
             <div className="w-12 h-12 bg-[#7c3aed]/10 rounded-2xl flex items-center justify-center text-[#7c3aed]">
               <Zap className="w-6 h-6" />
             </div>
             <div className="flex-1 text-left">
               <div className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest mb-0.5">TUNNEL METHOD</div>
               <div className="text-zinc-900 dark:text-white font-black text-sm uppercase italic">SSH Direct Protocol</div>
             </div>
             <ChevronDown className="text-zinc-400 w-5 h-5" />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 flex items-center gap-4 shadow-sm border border-zinc-200 dark:border-white/5 active:scale-[0.98] transition-transform">
             <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 text-2xl">
               🇺🇦
             </div>
             <div className="flex-1 text-left">
               <div className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest mb-0.5">SERVER LOCATION</div>
               <div className="text-zinc-900 dark:text-white font-black text-sm uppercase italic">Ukraine - Kyiv #7</div>
             </div>
             <ChevronDown className="text-zinc-400 w-5 h-5" />
          </div>
        </div>

        {/* AI Tab Access */}
        <button 
          onClick={() => setActiveTab('ai')}
          className="mx-6 p-4 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-2xl flex items-center justify-between shadow-lg active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5" />
            <span className="text-xs font-black uppercase italic">AI Security Assistant</span>
          </div>
          <Zap className="w-4 h-4 fill-white animate-pulse" />
        </button>
      </div>

      {/* Log Console Drawer */}
      <div className="h-64 bg-white dark:bg-[#121212] flex flex-col border-t border-zinc-200 dark:border-white/5">
        <div className="px-4 py-2 flex justify-between items-center bg-zinc-100 dark:bg-[#181818]">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {isConnected ? 'VPN Connected' : 'VPN Disconnected'}
            </span>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </div>
          <button onClick={clearLogs} className="bg-black text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 active:scale-90 transition-transform">
            <Trash2 className="w-3 h-3" /> CLEAR LOGS
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] no-scrollbar select-text">
          {logs.length === 0 ? (
            <div className="text-zinc-600 italic">Waiting for connection...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex gap-2">
                <span className="text-zinc-500 min-w-[35px]">{log.time}</span>
                <span className={`flex-1 break-all ${log.type === 'success' ? 'text-emerald-500' : log.type === 'error' ? 'text-rose-500' : 'text-zinc-400'}`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* AI Modal Overlay */}
      {activeTab === 'ai' && (
        <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase italic">AI OFFICER</h2>
                  <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Neural Support System</div>
                </div>
             </div>
             <button onClick={() => setActiveTab('dashboard')} className="p-2 bg-zinc-800 rounded-lg"><Trash2 className="w-5 h-5 text-zinc-500" /></button>
           </div>

           <div className="flex-1 overflow-y-auto space-y-4 mb-6 no-scrollbar">
              {messages.length === 0 && (
                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 text-center">
                  <Cpu className="w-12 h-12 text-[#7c3aed] mx-auto mb-4" />
                  <p className="text-sm text-zinc-400 italic">"Я проанализировал ваши логи. Соединение стабильно, но для максимальной скорости рекомендую сервер Frankfurt #12."</p>
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[20px] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-[#7c3aed] text-white' : 'bg-zinc-800 text-zinc-200 border border-white/5'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isAiLoading && <div className="text-[#7c3aed] text-[10px] font-black uppercase animate-pulse">Neural thinking...</div>}
           </div>

           <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-2xl border border-white/10">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && askAi()}
                className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold" 
                placeholder="Спроси об оптимизации..." 
              />
              <button onClick={askAi} className="p-3 bg-[#7c3aed] text-white rounded-xl active:scale-90 transition-transform"><Send className="w-5 h-5" /></button>
           </div>
        </div>
      )}

      {/* Navigation (Simple footer spacers) */}
      <div className="h-4 bg-zinc-100 dark:bg-[#121212]" />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
