import React, { useState, useEffect } from "react";
import axios from "axios";
import AppNavigation from "../components/AppNavigation";
import { getApiBaseUrl } from "../utils/config.js";
import {
  Briefcase,
  Lightbulb,
  Megaphone,
  MessageSquare,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

export default function CommunityChat() {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [messageTopics, setMessageTopics] = useState([]);

  const topics = [
    { id: "all", name: "All Topics", icon: MessageSquare, color: "gray" },
    { id: "general", name: "General", icon: MessageSquare, color: "blue" },
    { id: "business", name: "Business", icon: Briefcase, color: "purple" },
    { id: "ai", name: "AI & Tech", icon: Sparkles, color: "cyan" },
    { id: "marketing", name: "Marketing", icon: Megaphone, color: "green" },
    { id: "collaboration", name: "Collaboration", icon: Users, color: "orange" },
    { id: "feedback", name: "Feedback", icon: Lightbulb, color: "yellow" },
  ];

  useEffect(() => {
    fetchMessages();
  }, [selectedTopic]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = getApiBaseUrl();
      const response = await axios.get(`${API_BASE_URL}/community/messages`, {
        withCredentials: true,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      // Ensure we always get an array
      let allMessages = [];
      if (response.data && response.data.data) {
        if (Array.isArray(response.data.data)) {
          allMessages = response.data.data;
        } else if (Array.isArray(response.data.data.messages)) {
          allMessages = response.data.data.messages;
        }
      }

      const filteredMessages =
        selectedTopic === "all"
          ? allMessages
          : allMessages.filter(
              (msg) => msg.topics && msg.topics.includes(selectedTopic)
            );
      setMessages(filteredMessages);
      setError(null);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]); // Ensure messages is always an array
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        setError("Please log in to view community messages.");
      } else {
        setError("Failed to load community messages. Please try again.");
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE_URL = getApiBaseUrl();
      await axios.post(
        `${API_BASE_URL}/community/messages`,
        {
          content: newMsg,
          topics: messageTopics,
        },
        {
          withCredentials: true,
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      setNewMsg("");
      setMessageTopics([]);
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        setError("Please log in to send messages.");
      } else {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMessageTopic = (topicId) => {
    setMessageTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId]
    );
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 enterprise-shell transition-colors duration-300">
      {/* Navigation */}
      <AppNavigation />

      {/* Page Header */}
      <div className="glass-surface border-x-0 border-t-0 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-400/25 dark:to-indigo-400/20 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                <Users className="w-6 h-6 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Community Collaboration
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Connect, share ideas, and grow together
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 gradient-panel rounded-lg">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {Array.isArray(messages) ? messages.length : 0} messages
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Topics Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-surface rounded-xl p-5 sticky top-24">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Topics
              </h3>
              <div className="space-y-2">
                {topics.map((topic) => {
                  const TopicIcon = topic.icon;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                        selectedTopic === topic.id
                          ? "bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <TopicIcon className="w-4 h-4" />
                      <span className="font-medium">{topic.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="glass-surface rounded-xl overflow-hidden">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 m-6 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-400 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-red-800 dark:text-red-200 font-medium">
                        {error}
                      </p>
                      {!isAuthenticated && (
                        <button
                          onClick={() => (window.location.href = "/auth")}
                          className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Go to Login
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-slate-50/60 dark:bg-slate-900/30 backdrop-blur-sm">
                {(!Array.isArray(messages) || messages.length === 0) &&
                !error ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      No messages yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      Be the first to start the conversation!
                    </p>
                  </div>
                ) : (
                  Array.isArray(messages) &&
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className="bg-white/85 dark:bg-slate-800/80 rounded-xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(msg.author?.companyName || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {msg.author?.companyName || "Unknown User"}
                            </h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
                            {msg.content}
                          </p>
                          {msg.topics && msg.topics.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {msg.topics.map((topicId, index) => {
                                const topic = topics.find(
                                  (t) => t.id === topicId
                                );
                                return (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                  >
                                    {topic?.icon && <topic.icon className="w-3 h-3" />}
                                    {topic?.name || topicId}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-slate-200/80 dark:border-slate-700/80 bg-white/75 dark:bg-slate-900/60">
                {/* Topic Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Add topics to your message:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {topics.slice(1).map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleMessageTopic(topic.id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                          messageTopics.includes(topic.id)
                            ? "bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <topic.icon className="w-3 h-3 mr-1" />
                        {topic.name}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={sendMessage} className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Share your thoughts with the community..."
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      disabled={!isAuthenticated}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !isAuthenticated || !newMsg.trim()}
                    className="px-6 py-3 button-enterprise disabled:bg-slate-400 text-white font-medium rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
