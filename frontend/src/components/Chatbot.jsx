import React, { useEffect, useRef } from "react";
import { MessageSquare, Trash2, Send, Bot, User, Sparkles } from "lucide-react";

export default function Chatbot({
  currentUser,
  messages,
  question,
  setQuestion,
  askChatbot,
  clearChat,
  chatLoading,
  handleChatKeyDown
}) {
  const scrollRef = useRef(null);

  // Automatically scroll chat history to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl mt-10 max-w-5xl border border-slate-800/80 animate-fade-in-up">
      {/* Chat Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 animate-pulse-glow">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AI Portfolio Assistant
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                Live Advisor
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Ask questions about asset volatility, weights, and health status.</p>
          </div>
        </div>

        <button
          onClick={clearChat}
          disabled={chatLoading}
          className="p-2 px-3 rounded-lg bg-slate-850 hover:bg-slate-850/80 text-slate-400 hover:text-red-400 border border-slate-800/80 transition-all duration-150 flex items-center gap-2 text-xs font-semibold disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Message History */}
      <div 
        ref={scrollRef}
        className="space-y-4 mb-5 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800"
      >
        {messages.length === 0 && (
          <div className="p-6 bg-slate-950/40 rounded-xl border border-slate-800/80 text-center text-slate-500 flex flex-col items-center justify-center gap-2.5">
            <MessageSquare className="w-8 h-8 text-slate-700" />
            <div className="text-sm">
              {currentUser
                ? `Initiate conversation as ${currentUser.name}.`
                : "Complete user details setup to store chat sessions."}
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`flex ${isUser ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-2xl p-4 rounded-2xl border transition-all duration-150 ${
                  isUser
                    ? "bg-slate-900/90 border-slate-800/80 text-slate-100 rounded-bl-sm"
                    : "bg-gradient-to-r from-emerald-600/90 to-teal-600/90 border-emerald-500/30 text-white rounded-br-sm shadow-md shadow-emerald-500/5"
                }`}
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold opacity-75 mb-2">
                  {isUser ? (
                    <>
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>{currentUser?.name || "Client"}</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Financial Advisor</span>
                    </>
                  )}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                {msg.created_at && (
                  <div className="mt-2.5 text-[10px] opacity-60 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {chatLoading && (
          <div className="flex justify-end">
            <div className="bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/20 p-4 rounded-2xl rounded-br-sm text-slate-300 max-w-sm flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-semibold text-emerald-400">Advisor is analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea
          placeholder="Ask a question about asset diversification, risk score reduction, or rebalancing strategy..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleChatKeyDown}
          rows={3}
          className="w-full p-4 pr-14 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 resize-none text-sm"
        />

        <button
          onClick={askChatbot}
          disabled={chatLoading || !question.trim()}
          className={`absolute right-3.5 bottom-4 p-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-150 ${
            chatLoading || !question.trim()
              ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-850"
              : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-[0.98]"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs">
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 font-mono text-[10px]">Enter</kbd> to submit queries directly.</span>
      </div>
    </div>
  );
}
