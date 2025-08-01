import { useState } from 'react';
import SimpleChatInterface from './SimpleChatInterface';

const ChatbotDashboard = () => {
  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl heading-primary text-theme-primary mb-2">
                AI Chatbot
              </h1>
              <p className="text-theme-secondary">
                Chat with our intelligent AI assistant powered by Gemini
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="status-badge px-3 py-1 rounded-full">
                <span className="mr-2">🤖</span>
                Bot Online
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <SimpleChatInterface />
      </div>
    </div>
  );
};

export default ChatbotDashboard;
