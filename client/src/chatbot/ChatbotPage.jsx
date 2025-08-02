import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import AppNavigation from "../components/AppNavigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authAPI } from "../utils/api";

// Custom component for rendering markdown messages
const MessageContent = ({ message, isBot }) => {
  const markdownComponents = {
    // Headings
    h1: ({ children }) => (
      <h1 className="text-lg font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-base font-bold mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-bold mb-1">{children}</h3>
    ),

    // Paragraphs
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="text-sm">{children}</li>,

    // Code
    code: ({ inline, children }) =>
      inline ? (
        <code
          className={`px-1 py-0.5 rounded text-xs font-mono ${
            isBot
              ? "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
              : "bg-blue-400 text-white"
          }`}
        >
          {children}
        </code>
      ) : (
        <pre
          className={`p-3 rounded-lg text-xs font-mono overflow-x-auto mb-2 ${
            isBot
              ? "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
              : "bg-blue-400 text-white"
          }`}
        >
          <code>{children}</code>
        </pre>
      ),

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline hover:no-underline ${
          isBot ? "text-blue-600 dark:text-blue-400" : "text-blue-200"
        }`}
      >
        {children}
      </a>
    ),

    // Strong/Bold
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),

    // Emphasis/Italic
    em: ({ children }) => <em className="italic">{children}</em>,

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote
        className={`border-l-4 pl-4 my-2 italic ${
          isBot ? "border-gray-400 dark:border-gray-500" : "border-blue-300"
        }`}
      >
        {children}
      </blockquote>
    ),

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto mb-2">
        <table
          className={`min-w-full border border-collapse ${
            isBot ? "border-gray-300 dark:border-gray-600" : "border-blue-300"
          }`}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th
        className={`border px-2 py-1 text-xs font-semibold ${
          isBot
            ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
            : "border-blue-300 bg-blue-400"
        }`}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        className={`border px-2 py-1 text-xs ${
          isBot ? "border-gray-300 dark:border-gray-600" : "border-blue-300"
        }`}
      >
        {children}
      </td>
    ),
  };

  if (isBot) {
    return (
      <div className="text-sm leading-relaxed">
        <ReactMarkdown
          components={markdownComponents}
          remarkPlugins={[remarkGfm]}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    );
  } else {
    // For user messages, just display as plain text since users typically don't write markdown
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {message.text}
      </p>
    );
  }
};

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const token = authAPI.getToken();
  console.log("chatbot token : ", token);

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
        text: "# Welcome! 👋\n\nI'm your **AI business assistant**. I have full context about your business and can help you with:\n\n- Answering customer questions\n- Providing business insights\n- General inquiries and support\n- Feedback analysis\n\n*How can I assist you today?*",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  }, []);

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
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://phoenix.onrender.com/api';
      const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId
        })
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
        text: "# Welcome! 👋\n\nI'm your **AI business assistant**. I have full context about your business and can help you with:\n\n- Answering customer questions\n- Providing business insights\n- General inquiries and support\n- Feedback analysis\n\n*How can I assist you today?*",
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

  const suggestions = [
    "Tell me about my business",
    "How can I improve customer service?",
    "What services do we offer?",
    "Who is our target audience?",
    "Generate a marketing idea",
    "Help me with a customer inquiry",
  ];

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppNavigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Business Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Get contextual help and insights for your business using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col h-[700px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      AI Assistant
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Context-aware business helper
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.isBot
                          ? message.isError
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      }`}
                    >
                      <MessageContent message={message} isBot={message.isBot} />
                      <p
                        className={`text-xs mt-2 ${
                          message.isBot
                            ? "text-gray-500 dark:text-gray-400"
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
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-end space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your business..."
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      rows="2"
                      style={{ minHeight: "60px", maxHeight: "120px" }}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
