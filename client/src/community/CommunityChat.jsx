import React, { useState, useEffect } from "react";
import axios from "axios";
import AppNavigation from "../components/AppNavigation";
import { getApiBaseUrl } from "../utils/config.js";

export default function CommunityChat() {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [messageTopics, setMessageTopics] = useState([]);

  const topics = [
    { id: "all", name: "All Topics", icon: "💬", color: "gray" },
    { id: "general", name: "General", icon: "🗨️", color: "blue" },
    { id: "business", name: "Business", icon: "💼", color: "purple" },
    { id: "ai", name: "AI & Tech", icon: "🤖", color: "cyan" },
    { id: "marketing", name: "Marketing", icon: "📢", color: "green" },
    { id: "collaboration", name: "Collaboration", icon: "🤝", color: "orange" },
    { id: "feedback", name: "Feedback", icon: "💡", color: "yellow" },
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

  const getTopicColor = (topicId) => {
    const topic = topics.find((t) => t.id === topicId);
    return topic?.color || "gray";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <AppNavigation />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Community Collaboration
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Connect, share ideas, and grow together
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Topics
              </h3>
              <div className="space-y-2">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                      selectedTopic === topic.id
                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="text-lg">{topic.icon}</span>
                    <span className="font-medium">{topic.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
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
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No messages yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Be the first to start the conversation!
                    </p>
                  </div>
                ) : (
                  Array.isArray(messages) &&
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(msg.author?.companyName || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {msg.author?.companyName || "Unknown User"}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
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
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                  >
                                    {topic?.icon} {topic?.name || topicId}
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
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                {/* Topic Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        <span className="mr-1">{topic.icon}</span>
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all duration-200"
                      disabled={!isAuthenticated}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !isAuthenticated || !newMsg.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
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
                        <svg
                          className="w-4 h-4"
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
