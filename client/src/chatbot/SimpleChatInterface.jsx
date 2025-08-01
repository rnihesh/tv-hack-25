import { useState, useRef, useEffect } from 'react';

const SimpleChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      message: 'Hello! I\'m your AI assistant powered by Gemini. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
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

    try {
      // Make API call to backend
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.message,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        message: data.response || 'Sorry, I couldn\'t process your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        message: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        message: 'Hello! I\'m your AI assistant powered by Gemini. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="card p-6 h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-theme mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-700 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-theme-primary">AI Assistant</h3>
            <p className="text-sm text-theme-secondary">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="btn-secondary px-3 py-1 text-sm rounded-lg focus-ring"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-theme-tertiary text-theme-primary'
              }`}
            >
              <p className="text-sm">{message.message}</p>
              <div className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-brand-100' : 'text-theme-tertiary'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-theme-tertiary text-theme-primary max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-theme-secondary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-theme-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-theme-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-theme-secondary">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex space-x-3">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={isLoading}
          className="flex-1 p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder-theme-tertiary focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
          rows="1"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="btn-primary px-6 py-3 rounded-lg focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>Send</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setInputMessage('What can you help me with?')}
          className="px-3 py-1 text-sm bg-theme-tertiary text-theme-secondary rounded-full hover:bg-theme border border-theme focus-ring"
        >
          What can you do?
        </button>
        <button
          onClick={() => setInputMessage('Tell me about your features')}
          className="px-3 py-1 text-sm bg-theme-tertiary text-theme-secondary rounded-full hover:bg-theme border border-theme focus-ring"
        >
          Features
        </button>
        <button
          onClick={() => setInputMessage('How do I get started?')}
          className="px-3 py-1 text-sm bg-theme-tertiary text-theme-secondary rounded-full hover:bg-theme border border-theme focus-ring"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default SimpleChatInterface;
