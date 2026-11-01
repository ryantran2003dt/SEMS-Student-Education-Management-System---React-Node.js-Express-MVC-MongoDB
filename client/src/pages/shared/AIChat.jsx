import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Trash2,
  BookOpen,
  Code2,
  Database,
  Cpu,
  ChevronRight,
  Settings2,
  ExternalLink,
  Loader2,
  MessageCircle
} from 'lucide-react';

// Hàm render markdown đơn giản (bold, code block, inline code, list)
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`code-${i}`} className="my-2 rounded-xl overflow-hidden border border-slate-700">
          {lang && (
            <div className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-mono font-semibold uppercase">
              {lang}
            </div>
          )}
          <pre className="bg-slate-800 text-emerald-300 text-xs p-3 overflow-x-auto font-mono leading-relaxed">
            {codeLines.join('\n')}
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Table
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split('|').filter(c => c.trim());
      const rows = tableLines.slice(2).map(r => r.split('|').filter(c => c.trim()));
      elements.push(
        <div key={`table-${i}`} className="my-2 overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-indigo-50">
                {headers.map((h, idx) => (
                  <th key={idx} className="border border-slate-200 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="border border-slate-200 px-2.5 py-1.5 text-slate-700">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // List item
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 text-sm text-slate-700 py-0.5">
          <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
          <span>{parseLine(line.trim().slice(2))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 text-sm text-slate-700 py-0.5">
          <span className="text-indigo-600 font-bold shrink-0 min-w-[1.2rem]">{numMatch[1]}.</span>
          <span>{parseLine(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // Empty line = spacing
    if (!line.trim()) {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Normal line (with inline formatting)
    elements.push(
      <p key={`p-${i}`} className="text-sm text-slate-700 leading-relaxed">
        {parseLine(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function parseLine(text) {
  // Bold: **text**
  // Inline code: `code`
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
    const codeIdx = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;

    if (boldMatch && boldIdx <= codeIdx) {
      if (boldIdx > 0) parts.push(<span key={key++}>{remaining.slice(0, boldIdx)}</span>);
      parts.push(<strong key={key++} className="font-semibold text-slate-900">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (codeMatch && codeIdx < boldIdx) {
      if (codeIdx > 0) parts.push(<span key={key++}>{remaining.slice(0, codeIdx)}</span>);
      parts.push(
        <code key={key++} className="bg-slate-100 text-rose-600 font-mono text-xs px-1.5 py-0.5 rounded">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeIdx + codeMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      remaining = '';
    }
  }

  return parts;
}

const QUICK_PROMPTS = [
  { icon: Code2, label: 'JavaScript cơ bản', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', msg: 'Hãy giải thích các khái niệm cơ bản của JavaScript như biến, hàm, vòng lặp với ví dụ?' },
  { icon: BookOpen, label: 'Thuật toán sắp xếp', color: 'text-blue-600 bg-blue-50 border-blue-200', msg: 'So sánh các thuật toán sắp xếp phổ biến: Bubble Sort, Quick Sort, Merge Sort về độ phức tạp và ứng dụng?' },
  { icon: Database, label: 'SQL vs NoSQL', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', msg: 'Khi nào nên dùng SQL và khi nào nên dùng NoSQL? Cho ví dụ thực tế?' },
  { icon: Cpu, label: 'Lập trình OOP', color: 'text-purple-600 bg-purple-50 border-purple-200', msg: 'Giải thích 4 tính chất cơ bản của lập trình hướng đối tượng (OOP) với ví dụ bằng Python?' }
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! 👋 Tôi là Trợ lý AI Giáo dục của SEMS.\n\nTôi có thể giúp bạn:\n- 💻 Giải thích lập trình, thuật toán, cấu trúc dữ liệu\n- 📚 Hướng dẫn học tập môn Tin học\n- 🔍 Giải đáp các câu hỏi học thuật\n- 💡 Đưa ra ví dụ và bài tập thực hành\n\nBạn cần hỗ trợ gì hôm nay?',
      engine: 'SEMS AI'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configKey, setConfigKey] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchAiStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAiStatus = async () => {
    try {
      const res = await api.get('/ai/status');
      setAiStatus(res.data);
    } catch (err) {
      console.warn('AI Status error:', err);
    }
  };

  const handleSend = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Chuyển lịch sử trừ tin đầu tiên (greeting)
      const history = newMessages.slice(1, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const res = await api.post('/ai/chat', {
        message: text,
        history
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.data?.reply || res.reply || 'Xin lỗi, tôi không thể xử lý yêu cầu này.',
          engine: res.data?.engineUsed || res.engineUsed || ''
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Xin lỗi, đã xảy ra lỗi: ${err.message}. Vui lòng thử lại.`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    setConfigLoading(true);
    try {
      await api.post('/ai/config-key', { apiKey: configKey });
      await fetchAiStatus();
      setShowConfig(false);
      setConfigKey('');
    } catch (err) {
      alert(err.message);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Cuộc trò chuyện đã được làm mới. Tôi có thể giúp gì cho bạn?',
      engine: 'SEMS AI'
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              AI Trợ Giảng
              <span className="text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Miễn phí
              </span>
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${aiStatus?.hasGeminiKey ? 'bg-emerald-500' : 'bg-amber-500'} inline-block`} />
              {aiStatus?.activeEngine || 'SEMS AI Engine'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            title="Xóa lịch sử hội thoại"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Cài đặt AI</span>
          </button>
        </div>
      </div>

      {/* Config Panel */}
      {showConfig && (
        <div className="mt-3 p-4 rounded-2xl bg-purple-50 border border-purple-200 shrink-0">
          <form onSubmit={handleSaveKey} className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Google Gemini API Key (để nhận câu trả lời chính xác hơn):
              </label>
              <input
                type="text"
                value={configKey}
                onChange={(e) => setConfigKey(e.target.value)}
                placeholder="Dán AIzaSy... (để trống để dùng engine nội bộ)"
                className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl border border-purple-300 text-purple-700 text-xs font-semibold hover:bg-purple-100 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Lấy key miễn phí
              </a>
              <button
                type="submit"
                disabled={configLoading}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {configLoading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user'
                ? 'bg-blue-600'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              {msg.role === 'user'
                ? <User className="w-4 h-4 text-white" />
                : <Bot className="w-4 h-4 text-white" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 shadow-xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : msg.isError
                    ? 'bg-rose-50 border border-rose-200 rounded-tl-sm'
                    : 'bg-white border border-slate-200 rounded-tl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="space-y-1">
                    {renderMarkdown(msg.content)}
                  </div>
                )}
              </div>
              {msg.engine && (
                <span className="text-[10px] text-slate-400 px-1 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {msg.engine}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 flex-row">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-sm text-slate-500">AI đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (chỉ hiện khi messages ít) */}
      {messages.length <= 2 && (
        <div className="shrink-0 py-3">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Câu hỏi gợi ý:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.msg)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left hover:shadow-sm transition-all cursor-pointer ${prompt.color}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{prompt.label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto shrink-0 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-slate-200">
        <div className="flex items-end gap-2 p-1.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-indigo-400 focus-within:shadow-indigo-100 focus-within:shadow-md transition-all">
          <MessageCircle className="w-4 h-4 text-slate-400 ml-2 mb-2.5 shrink-0" />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về lập trình, thuật toán, cơ sở dữ liệu... (Enter để gửi, Shift+Enter để xuống dòng)"
            rows={1}
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none bg-transparent py-2 max-h-28 leading-relaxed"
            style={{ minHeight: '2.5rem' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0 mb-0.5"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
        </p>
      </div>
    </div>
  );
}
