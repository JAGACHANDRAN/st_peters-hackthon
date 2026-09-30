import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { advisorApi } from '../api/advisor';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import { Bot, Send, User, ShieldAlert } from 'lucide-react';

const SUGGESTIONS = [
  'Can I afford a business loan with my current income?',
  'What government loan schemes match my enterprise?',
  'How does an SHG loan work and how do I apply?',
  'Why is a longer tenure safer for my monthly EMI?',
];

const Advisor = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const history = await advisorApi.getHistory();
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          const userName = user?.name ? ` ${user.name}` : '';
          setMessages([
            {
              role: 'assistant',
              content: `Namaste${userName}! I am your friendly financial guide. I can help explain your budget, safe loan amounts, and schemes like MUDRA or State SHG programs in simple everyday language. What would you like to know today?`,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const userMsg = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const res = await advisorApi.chat(messageText);
      const botMsg = { role: 'assistant', content: res.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError('Unable to reach advisor right now. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader message="Starting financial advisor session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 pb-20 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                AI Financial Advisor
              </h1>
              <p className="text-xs text-gray-500">
                Simple words • No banking jargon • Safe guidance
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Active Guide
          </span>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            We will never ask for your bank PIN, OTP, password, or Aadhaar number. Final loan decisions are made by your bank branch.
          </span>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBox message={error} />
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm overflow-y-auto max-h-[500px] space-y-4 mb-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser ? 'bg-brand-600 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-gray-500 italic p-2">
              <Bot className="w-4 h-4 text-amber-500 animate-spin" /> Thinking in simple words...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug)}
              disabled={sending}
              className="text-xs bg-white hover:bg-brand-50 border border-gray-200 text-gray-700 hover:text-brand-800 px-3 py-1.5 rounded-full transition shadow-sm"
            >
              💡 {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type your money or business question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="flex-1 px-3 py-2 text-xs sm:text-sm text-gray-900 outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>Send</span> <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Advisor;
