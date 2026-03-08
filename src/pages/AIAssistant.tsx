import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { useApp } from "../context/AppContext";

export default function AIAssistant() {
  const { expenses, debtors } = useData();
  const { theme } = useApp();
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([
    {
      role: "model",
      text: "Hello! I am your SPENDORA AI Assistant. I can help you analyze your expenses, track debts, or answer questions about your financial data. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please configure VITE_GEMINI_API_KEY in your .env file.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const context = `
        You are an AI financial assistant for an app called SPENDORA.
        Here is the user's current data:
        Expenses: ${JSON.stringify(expenses)}
        Debtors: ${JSON.stringify(debtors)}
        
        Answer the user's question based on this data. Be concise, helpful, and professional.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${context}\n\nUser: ${userMessage}`,
      });

      setMessages((prev) => [
        ...prev,
        { role: "model", text: response.text || "I could not generate a response." },
      ]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `Error: ${error.message || "Failed to connect to AI."}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          AI Assistant
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Ask questions about your expenses and debts
        </p>
      </div>

      <div
        className="flex-1 rounded-2xl overflow-hidden flex flex-col shadow-xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === "user" ? "ml-4" : "mr-4"
                    }`}
                  style={
                    msg.role === "user"
                      ? { background: "rgba(var(--accent-rgb, 0,229,255),0.15)", color: "var(--accent)" }
                      : { background: "rgba(168,85,247,0.15)", color: "#a855f7" }
                  }
                >
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl ${msg.role === "user" ? "rounded-tr-none" : "rounded-tl-none"
                    }`}
                  style={
                    msg.role === "user"
                      ? {
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }
                      : {
                        background: "var(--bg-muted)",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                      }
                  }
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] flex-row">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full mr-4 flex items-center justify-center"
                  style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}
                >
                  <Bot size={20} />
                </div>
                <div
                  className="p-4 rounded-2xl rounded-tl-none flex items-center space-x-2"
                  style={{
                    background: "var(--bg-muted)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <form onSubmit={handleSend} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your spending habits, total debts, etc..."
              className="flex-1 rounded-xl px-4 py-3 outline-none transition-all"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 text-black rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              style={{ background: "var(--accent)" }}
            >
              <span>Send</span>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
