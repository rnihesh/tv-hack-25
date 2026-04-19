import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import AppNavigation from "../components/AppNavigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authAPI } from "../utils/api";
import {
  BarChart3,
  Bot,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";

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
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const token = authAPI.getToken();

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
        text: "# Welcome\n\nI'm your **AI business assistant**. I have full context about your business and can help you with:\n\n- Answering customer questions\n- Providing business insights\n- General inquiries and support\n- **Feedback analysis**\n- **CSV data analysis**\n\n*You can upload CSV files for instant analysis.*\n\n*How can I assist you today?*",
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
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "https://phoenix-sol.onrender.com/api";
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

  // Handle CSV file upload and analysis
  const handleCSVUpload = async (file) => {
    if (!file) return;

    setIsUploadingCSV(true);

    // Add user message about uploading file
    const uploadMessage = {
      id: Date.now(),
      text: `Uploading and analyzing CSV file: ${file.name}`,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, uploadMessage]);

    try {
      const formData = new FormData();
      formData.append("csvFile", file);

      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "https://phoenix-sol.onrender.com/api";

      // Use the new public upload and analyze endpoint
      const response = await fetch(
        `${API_BASE_URL}/csv-feedback/upload-and-analyze`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        const analysisMessage = {
          id: Date.now() + 1,
          text: data.data.analysis,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, analysisMessage]);
      } else {
        throw new Error(data.message || "Failed to analyze CSV file");
      }
    } catch (error) {
      console.error("CSV upload error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `**Error analyzing CSV file**: ${error.message}\n\nPlease make sure your CSV file has the correct format with columns like:\n- **text** or **comment** or **feedback** (main content)\n- **sentiment** (optional: positive/negative/neutral)\n- **source** (optional: platform name)\n- **date** (optional: timestamp)`,
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsUploadingCSV(false);
      setCsvFile(null);
      setShowFileUpload(false);
    }
  };

  // Format comprehensive feedback analysis
  const formatFeedbackAnalysis = (analysis, uploadStats) => {
    const { sentimentTrends, insights, recommendations, similarFeedback } =
      analysis;

    let response = `# Comprehensive Feedback Analysis Report\n\n`;

    // Upload Statistics
    response += `## File Processing Summary\n`;
    response += `- **Total Records**: ${uploadStats.total}\n`;
    response += `- **Successfully Processed**: ${uploadStats.processed}\n`;
    response += `- **Failed**: ${uploadStats.failed}\n`;
    response += `- **Skipped**: ${uploadStats.skipped}\n\n`;

    // Sentiment Overview
    if (sentimentTrends && sentimentTrends.overallMetrics) {
      const metrics = sentimentTrends.overallMetrics;
      response += `## Sentiment Distribution\n`;
      response += `- **Positive**: ${metrics.positivePercentage}% (${metrics.positive} items)\n`;
      response += `- **Negative**: ${metrics.negativePercentage}% (${metrics.negative} items)\n`;
      response += `- **Neutral**: ${metrics.neutralPercentage}% (${metrics.neutral} items)\n\n`;
    }

    // Key Insights
    if (insights && insights.llmInsights) {
      const llmInsights = insights.llmInsights;

      if (
        llmInsights.customer_pain_points &&
        llmInsights.customer_pain_points.length > 0
      ) {
        response += `## Customer Pain Points\n`;
        llmInsights.customer_pain_points.forEach((point, index) => {
          response += `${index + 1}. ${point}\n`;
        });
        response += `\n`;
      }

      if (
        llmInsights.positive_highlights &&
        llmInsights.positive_highlights.length > 0
      ) {
        response += `## What Customers Love\n`;
        llmInsights.positive_highlights.forEach((highlight, index) => {
          response += `${index + 1}. ${highlight}\n`;
        });
        response += `\n`;
      }

      if (
        llmInsights.improvement_areas &&
        llmInsights.improvement_areas.length > 0
      ) {
        response += `## Priority Improvement Areas\n`;
        llmInsights.improvement_areas.forEach((area, index) => {
          response += `${index + 1}. ${area}\n`;
        });
        response += `\n`;
      }

      if (llmInsights.business_impact) {
        response += `## Business Impact Assessment\n`;
        response += `${llmInsights.business_impact}\n\n`;
      }
    }

    // Themes Analysis
    if (insights && insights.themes && insights.themes.length > 0) {
      response += `## Top Discussion Themes\n`;
      insights.themes.slice(0, 5).forEach((theme, index) => {
        response += `${index + 1}. **${theme.theme}** (${
          theme.count
        } mentions)\n`;
      });
      response += `\n`;
    }

    // Recommendations
    if (recommendations) {
      if (
        recommendations.immediate_actions &&
        recommendations.immediate_actions.length > 0
      ) {
        response += `## Immediate Actions Recommended\n`;
        recommendations.immediate_actions.forEach((action, index) => {
          response += `${index + 1}. ${action}\n`;
        });
        response += `\n`;
      }

      if (
        recommendations.short_term_strategies &&
        recommendations.short_term_strategies.length > 0
      ) {
        response += `## Short-term Strategies (1-3 months)\n`;
        recommendations.short_term_strategies.forEach((strategy, index) => {
          response += `${index + 1}. ${strategy}\n`;
        });
        response += `\n`;
      }

      if (
        recommendations.success_metrics &&
        recommendations.success_metrics.length > 0
      ) {
        response += `## Success Metrics to Track\n`;
        recommendations.success_metrics.forEach((metric, index) => {
          response += `${index + 1}. ${metric}\n`;
        });
        response += `\n`;
      }
    }

    response += `---\n\n`;
    response += `**You can now ask me specific questions about this feedback data, such as:**\n`;
    response += `- "Show me negative feedback examples"\n`;
    response += `- "What are the main themes in positive feedback?"\n`;
    response += `- "Find feedback about [specific topic]"\n`;
    response += `- "What trends do you see over time?"\n`;

    return response;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    } else {
      toast.error("Please select a valid CSV file");
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
        text: "# Welcome\n\nI'm your **AI business assistant**. I have full context about your business and can help you with:\n\n- Answering customer questions\n- Providing business insights\n- General inquiries and support\n- **Feedback analysis**\n- **CSV data analysis**\n\n*You can upload CSV files for instant analysis.*\n\n*How can I assist you today?*",
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
    "Analyze customer feedback",
    "Show me sentiment trends from CSV",
    "What are customer pain points in feedback?",
    "Generate insights from feedback data",
    "Help me with a customer inquiry",
  ];

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  // Handle analyzing the public feedback.csv file
  const analyzePublicCSV = async () => {
    setIsLoading(true);

    // Add user message about analyzing public CSV
    const analysisMessage = {
      id: Date.now(),
      text: "Quick analysis for feedback.csv from public folder",
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, analysisMessage]);

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "https://phoenix-sol.onrender.com/api";

      // Call the quick CSV analysis endpoint for presentation
      const response = await fetch(
        `${API_BASE_URL}/csv-feedback/quick-analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.data.analysis,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.message || "Failed to analyze CSV file");
      }
    } catch (error) {
      console.error("CSV analysis error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `**Error analyzing feedback.csv**: ${error.message}\n\nThe file might not exist in the public folder or there could be a server issue.`,
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 enterprise-shell transition-colors duration-300">
      <AppNavigation />

      {/* Page Header */}
      <div className="glass-surface border-x-0 border-t-0 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-400/25 dark:to-indigo-400/20 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                <Bot className="w-6 h-6 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  AI Business Assistant
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Get contextual help and insights for your business using AI
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 gradient-panel rounded-lg">
              <Zap className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                1 credit per message
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-surface rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Feedback Analysis
              </h3>

              {/* CSV Upload Section */}
              <div className="mb-4 p-4 gradient-panel rounded-lg">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-2">
                  Upload CSV for Analysis
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  Upload customer feedback CSV files for instant AI analysis
                </p>

                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />

                  <label
                    htmlFor="csv-upload"
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose CSV File
                  </label>

                  {csvFile && (
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Selected: {csvFile.name}
                    </div>
                  )}

                  {csvFile && (
                    <button
                      onClick={() => handleCSVUpload(csvFile)}
                      disabled={isUploadingCSV}
                      className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium button-enterprise disabled:bg-slate-400 rounded-lg"
                    >
                      {isUploadingCSV ? (
                        <>
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analyze Feedback
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Public CSV Analysis Section */}
              <div className="mb-4 p-4 gradient-panel rounded-lg">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Quick Feedback Analysis
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  Instant analysis of feedback.csv (optimized for presentations)
                </p>

                <button
                  onClick={analyzePublicCSV}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium button-enterprise disabled:bg-slate-400 rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Analysis (&lt; 1sec)
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="glass-surface rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 text-sm bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="glass-surface rounded-2xl flex flex-col h-[700px] overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-slate-700/80 gradient-panel">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      AI Assistant
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Context-aware business helper
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-800/70 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/60 dark:bg-slate-900/35 backdrop-blur-sm">
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
                            ? "bg-red-100/85 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            : "bg-white/85 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80"
                          : "bg-blue-600 dark:bg-blue-500 text-white"
                      }`}
                    >
                      <MessageContent message={message} isBot={message.isBot} />
                      <p
                        className={`text-xs mt-2 ${
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
                    <div className="bg-white/85 dark:bg-slate-800/80 rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-6 border-t border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/65">
                <div className="flex items-end space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your business..."
                      className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                      rows="2"
                      style={{ minHeight: "60px", maxHeight: "120px" }}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-4 button-enterprise disabled:bg-slate-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
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
