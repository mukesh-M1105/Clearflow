import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { Bot, Send, User, Sparkles, HelpCircle, Loader2, ArrowRight } from 'lucide-react';

export function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: "### Welcome to ClearFlow Revenue Assistant 👋\n\nI am your payment diagnostic and recovery intelligence co-pilot. I analyze transaction declines, calculate recovery probabilities, and recommend smart settlement timings based on live PostgreSQL database telemetry.\n\nAsk me about overall recovery performance or query a specific payment ID (e.g. `pay_demo_nova_85k`)."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "Why was payment pay_demo_nova_85k recoverable?",
    "Which failure reason causes the most revenue loss?",
    "How much revenue can we recover right now?",
    "Summarize today's recovery performance.",
    "Why is our recovery rate low?"
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(textToSend) {
    const question = textToSend || input;
    if (!question.trim() || loading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: question
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.askAssistant(question);
      if (res.success) {
        const aiMsg = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: res.data.reply,
          metadata: res.data.metadata
        };
        setMessages(prev => [...prev, aiMsg]);
        if (res.data.suggestedQuestions) {
          setSuggestedQuestions(res.data.suggestedQuestions);
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Diagnostic Error:** ${err.message || 'Unable to communicate with assistant engine.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Simple Markdown renderer for formatting paragraphs, bold, lists, and code
  function renderFormattedText(text) {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-base font-extrabold text-slate-900 mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed">
            {formatInline(line.replace('- ', ''))}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs text-slate-700 leading-relaxed">
            {formatInline(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-xs text-slate-700 leading-relaxed">{formatInline(line)}</p>;
    });
  }

  function formatInline(str) {
    // Regex replace for bold **text** and code `code`
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 bg-slate-100 font-mono text-teal-700 text-[11px] rounded border border-slate-200">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      {/* Assistant Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/25">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight">ClearFlow Intelligence Co-Pilot</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected to Live PostgreSQL Telemetry</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-teal-100 text-teal-700 border border-teal-200'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-teal-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none space-y-1'
              }`}
            >
              {msg.sender === 'user' ? (
                <p className="text-sm font-medium">{msg.text}</p>
              ) : (
                <div className="space-y-1">{renderFormattedText(msg.text)}</div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-xs flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Analyzing PostgreSQL recovery models...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts Carousel */}
      <div className="px-6 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-amber-500" /> Prompt Ideas:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="flex-shrink-0 text-left text-[11px] font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-700 px-3 py-1.5 rounded-full text-slate-700 transition-colors border border-slate-200/80 hover:border-teal-200"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about recovery rates, reasons for decline, or specific payment IDs..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
