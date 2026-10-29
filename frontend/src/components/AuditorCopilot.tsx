import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, X, Minimize2, Maximize2, Sparkles, 
  HelpCircle, Copy, Check, Clock, ShieldCheck, 
  ChevronRight, RefreshCw, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelSource?: string;
  modelName?: string;
  latencyMs?: number;
}

export const AuditorCopilot: React.FC = () => {
  const { language, currentLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "👋 **Welcome to the AICTE Regulatory Auditor Co-Pilot (Qwen 8B)**.\n\nI monitor **241 institutions across 23 States**, tracking real-time intake caps, duplicate student collisions, and APH 2024-27 statutory compliance. How can I assist your regulatory inspection today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelSource: "regulatory_ai_engine",
      modelName: "Qwen 2.5 8B / Regulatory Engine"
    }
  ]);

  const promptSuggestions = [
    "Which colleges have excess intake?",
    "Show duplicate student collisions",
    "Explain 10% EWS & 5% TFWS quota rules",
    "What are APH Chapter 7 penalty clauses?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.queryCopilot(text.trim(), language, history);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelSource: res.model_source,
        modelName: res.model_name,
        latencyMs: res.latency_ms
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Audit Co-Pilot Error**: Unable to complete regulatory lookup (${err.message || 'Network error'}). Please retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render markdown text simply into HTML elements
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const bodyRows = tableRows.slice(2); // Skip separator row
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-2 border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="p-2 border-r border-slate-200 last:border-r-0">
                      {col.trim().replace(/\*\*/g, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0 text-slate-700">
                        {cell.trim().replace(/\*\*/g, '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // Table row detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cols = trimmed.slice(1, -1).split('|');
        tableRows.push(cols);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={idx} className="text-xs font-black text-slate-900 mt-2.5 mb-1 text-indigo-950 flex items-center gap-1.5">
            {trimmed.replace('### ', '')}
          </h4>
        );
      } else if (trimmed.startsWith('#### ')) {
        elements.push(
          <h5 key={idx} className="text-[11px] font-bold text-slate-800 mt-2 mb-1">
            {trimmed.replace('#### ', '')}
          </h5>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={idx} className="text-xs text-slate-700 ml-4 list-disc leading-relaxed my-0.5">
            {trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li key={idx} className="text-xs text-slate-700 ml-4 list-decimal leading-relaxed my-0.5">
            {trimmed.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
          </li>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={idx} className="p-2 bg-indigo-50/70 border-l-2 border-indigo-500 rounded-r text-[11px] text-indigo-900 italic my-1.5">
            {trimmed.replace('> ', '').replace(/\*\*(.*?)\*\*/g, '$1')}
          </div>
        );
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={idx} className="text-xs text-slate-700 leading-relaxed my-1">
            {trimmed.replace(/\*\*(.*?)\*\*/g, '$1')}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable();
    }

    return elements;
  };

  return (
    <>
      {/* Floating Co-Pilot Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AICTE Auditor Co-Pilot (Qwen 8B)"
          className="fixed bottom-5 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border border-blue-400/30 group cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900"></span>
          </div>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
              <span>Auditor Co-Pilot</span>
              <span className="text-[9px] bg-white/20 text-blue-100 font-bold px-1.5 py-0.2 rounded-full uppercase">
                Qwen 8B
              </span>
            </div>
            <div className="text-[10px] text-blue-200 font-medium">
              {currentLanguage.nativeName} • Live Audit Assistant
            </div>
          </div>
        </button>
      )}

      {/* Floating Co-Pilot Chat Drawer */}
      {isOpen && (
        <div 
          className={`fixed bottom-5 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
            isExpanded ? "w-[680px] h-[720px]" : "w-[440px] h-[580px]"
          }`}
          role="dialog"
          aria-label="AICTE Auditor Co-Pilot"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/80 border border-blue-400/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>AICTE Auditor Co-Pilot</span>
                  <span className="text-[9px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold px-1.5 py-0.2 rounded">
                    Qwen 8B Local
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Grounded Live DB • {currentLanguage.nativeName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isExpanded ? "Restore Size" : "Expand Size"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Co-Pilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prompt Suggestions Bar */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 pl-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Quick:
            </span>
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-full font-medium transition-all shadow-2xs hover:border-blue-300 flex-shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Conversation Messages Thread */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div 
                  key={m.id} 
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 px-1">
                    <span>{isUser ? "You (Auditor)" : (m.modelName || "AICTE Regulatory Engine")}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                    {m.latencyMs && (
                      <span className="text-slate-400 font-mono">({m.latencyMs}ms)</span>
                    )}
                  </div>

                  <div 
                    className={`p-3.5 rounded-2xl text-xs max-w-[90%] shadow-2xs ${
                      isUser 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none relative group'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    ) : (
                      <>
                        <div className="leading-relaxed">
                          {renderFormattedContent(m.text)}
                        </div>

                        {/* Copy response action */}
                        <button
                          onClick={() => handleCopy(m.id, m.text)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy response text"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 p-3 bg-white border border-slate-200 rounded-2xl max-w-xs shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-600 font-medium">
                  Auditor Co-Pilot reviewing APH regulations & DB...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder={t('copilot_placeholder') || "Ask about colleges, regulations, or audit queries..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                aria-label="Send query to Auditor Co-Pilot"
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-40 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('copilot_ask') || "Ask"}</span>
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="font-mono">Local Qwen 8B / Live Grounding Active</span>
              <span className="text-indigo-600 font-semibold">{currentLanguage.nativeName} ({currentLanguage.code.toUpperCase()})</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
