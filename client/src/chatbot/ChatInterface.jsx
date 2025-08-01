import { useState, useRef, useEffect } from 'react';
import { chatbotAPI } from '../utils/mailapi';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      message: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date(Date.now() - 300000),
      intent: 'greeting'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationId] = useState(`conv_${Date.now()}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      message: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await chatbotAPI.generateResponse({
        userMessage: inputMessage.trim(),
        conversationId,
        intent: 'general'
      });

      // Simulate typing delay for better UX
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          message: response.response,
          timestamp: new Date(),
          intent: response.detectedIntent,
          confidence: response.confidence
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Chat error:', error);
      setTimeout(() => {
        const errorMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          message: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.',
          timestamp: new Date(),
          intent: 'error',
          isError: true
        };

        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const clearConversation = () => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        message: 'Conversation cleared. How can I help you today?',
        timestamp: new Date(),
        intent: 'greeting'
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Chat Interface */}
      <div className="lg:col-span-3">
        <div className="card h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-theme">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                  <span className="text-brand-600 font-semibold">AI</span>
                </div>
                <div>
                  <h3 className="font-semibold text-theme-primary">Customer Support Assistant</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-accent-success rounded-full"></div>
                    <span className="text-theme-secondary">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={clearConversation}
                  className="btn-secondary px-3 py-1 text-sm rounded-lg focus-ring"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-brand-600 text-white'
                      : message.isError
                      ? 'bg-accent-error-light text-accent-error border border-accent-error'
                      : 'bg-theme-secondary text-theme-primary border border-theme'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${
                      message.sender === 'user' 
                        ? 'text-brand-100' 
                        : 'text-theme-tertiary'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.confidence && (
                      <span className="text-xs text-theme-tertiary ml-2">
                        {Math.round(message.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-theme-secondary text-theme-primary border border-theme px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-theme-tertiary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-theme-tertiary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-theme-tertiary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-theme">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="btn-primary px-4 py-3 rounded-lg focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Info Panel */}
      <div className="space-y-6">
        {/* Conversation Stats */}
        <div className="card p-4">
          <h3 className="font-semibold text-theme-primary mb-3">Session Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-theme-secondary text-sm">Messages</span>
              <span className="font-medium text-theme-primary">{messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-secondary text-sm">Duration</span>
              <span className="font-medium text-theme-primary">
                {Math.floor((Date.now() - messages[0]?.timestamp) / 60000)}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-secondary text-sm">Status</span>
              <span className="text-accent-success text-sm font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-4">
          <h3 className="font-semibold text-theme-primary mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full btn-secondary text-sm py-2 rounded-lg focus-ring">
              Export Conversation
            </button>
            <button className="w-full btn-secondary text-sm py-2 rounded-lg focus-ring">
              Escalate to Human
            </button>
            <button className="w-full btn-secondary text-sm py-2 rounded-lg focus-ring">
              Save as FAQ
            </button>
          </div>
        </div>

        {/* Recent Intents */}
        <div className="card p-4">
          <h3 className="font-semibold text-theme-primary mb-3">Detected Intents</h3>
          <div className="space-y-2">
            {messages
              .filter(m => m.sender === 'user' && m.intent)
              .slice(-5)
              .map((message, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-theme-secondary truncate">{message.intent}</span>
                  <span className="text-brand-600 font-medium">
                    {message.confidence ? `${Math.round(message.confidence * 100)}%` : '-'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
