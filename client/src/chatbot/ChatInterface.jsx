import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getApiBaseUrl } from "../utils/config.js";
import { MessageCircle, Minus, Send, Trash2 } from "lucide-react";

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("authToken");

  // Generate session ID on component mount
  useEffect(() => {
    const newSessionId = `chatbot_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    setSessionId(newSessionId);

    // Add welcome message
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI business assistant. How can I help you today?",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.data.response,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again.",
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI business assistant. How can I help you today?",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="button-enterprise p-4 rounded-full border border-white/25 dark:border-slate-500/40"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 h-[32rem] glass-surface rounded-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="gradient-panel text-slate-900 dark:text-slate-100 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Always here to help
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-full transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-full transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 dark:bg-slate-900/35 backdrop-blur-sm">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isBot ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.isBot
                  ? message.isError
                    ? "bg-red-100/85 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                    : "bg-white/85 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/80 dark:border-slate-700/80"
                  : "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
              <p
                className={`text-xs mt-1 ${
                  message.isBot
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-blue-100"
                }`}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/85 dark:bg-slate-800/80 rounded-2xl px-4 py-2 shadow-sm border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/90 dark:bg-slate-900/70 border-t border-slate-200/80 dark:border-slate-700/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full p-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/95 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
              rows="1"
              style={{ minHeight: "44px", maxHeight: "100px" }}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 button-enterprise disabled:bg-slate-400 disabled:shadow-none text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
