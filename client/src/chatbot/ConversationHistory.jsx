import { useState, useEffect } from 'react';
import { chatbotAPI } from '../utils/mailapi';

const ConversationHistory = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  // Mock conversation data
  const mockConversations = [
    {
      id: 'conv_001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      startTime: new Date('2025-01-31T10:30:00'),
      endTime: new Date('2025-01-31T10:45:00'),
      status: 'resolved',
      satisfaction: 4,
      messageCount: 12,
      intent: 'technical_support',
      escalated: false,
      messages: [
        { sender: 'user', message: 'Hi, I\'m having trouble logging into my account', timestamp: new Date('2025-01-31T10:30:00') },
        { sender: 'bot', message: 'I can help you with login issues. Can you tell me what error message you\'re seeing?', timestamp: new Date('2025-01-31T10:30:30') },
        { sender: 'user', message: 'It says "Invalid credentials" but I\'m sure my password is correct', timestamp: new Date('2025-01-31T10:31:00') },
        { sender: 'bot', message: 'Let me help you reset your password. I\'ll send a reset link to your email address.', timestamp: new Date('2025-01-31T10:31:30') }
      ]
    },
    {
      id: 'conv_002',
      customerName: 'Sarah Smith',
      customerEmail: 'sarah@example.com',
      startTime: new Date('2025-01-31T14:15:00'),
      endTime: new Date('2025-01-31T14:25:00'),
      status: 'escalated',
      satisfaction: 2,
      messageCount: 8,
      intent: 'billing',
      escalated: true,
      messages: [
        { sender: 'user', message: 'I was charged twice for my subscription this month', timestamp: new Date('2025-01-31T14:15:00') },
        { sender: 'bot', message: 'I understand your concern about duplicate charges. Let me check your billing history.', timestamp: new Date('2025-01-31T14:15:30') },
        { sender: 'user', message: 'This is really frustrating. I need this resolved immediately.', timestamp: new Date('2025-01-31T14:16:00') },
        { sender: 'bot', message: 'I apologize for the inconvenience. I\'m connecting you with a billing specialist who can resolve this immediately.', timestamp: new Date('2025-01-31T14:16:30') }
      ]
    },
    {
      id: 'conv_003',
      customerName: 'Mike Johnson',
      customerEmail: 'mike@example.com',
      startTime: new Date('2025-01-30T16:45:00'),
      endTime: new Date('2025-01-30T16:50:00'),
      status: 'resolved',
      satisfaction: 5,
      messageCount: 6,
      intent: 'product_inquiry',
      escalated: false,
      messages: [
        { sender: 'user', message: 'What are the differences between your Basic and Pro plans?', timestamp: new Date('2025-01-30T16:45:00') },
        { sender: 'bot', message: 'Great question! The Pro plan includes advanced analytics, priority support, and unlimited team members, while Basic is limited to 5 team members.', timestamp: new Date('2025-01-30T16:45:30') }
      ]
    }
  ];

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setConversations(mockConversations);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.intent.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    
    const matchesDate = filterDate === 'all' || (() => {
      const convDate = new Date(conv.startTime);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      switch (filterDate) {
        case 'today':
          return convDate.toDateString() === today.toDateString();
        case 'yesterday':
          return convDate.toDateString() === yesterday.toDateString();
        case 'week':
          return convDate >= weekAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getDuration = (start, end) => {
    const duration = Math.floor((end - start) / 60000); // minutes
    return `${duration}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'text-accent-success bg-accent-success-light';
      case 'escalated':
        return 'text-accent-error bg-accent-error-light';
      case 'ongoing':
        return 'text-accent-info bg-accent-info-light';
      default:
        return 'text-theme-secondary bg-theme-tertiary';
    }
  };

  const getSatisfactionStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  const exportConversation = (conversation) => {
    const data = {
      id: conversation.id,
      customer: {
        name: conversation.customerName,
        email: conversation.customerEmail
      },
      session: {
        startTime: conversation.startTime,
        endTime: conversation.endTime,
        duration: getDuration(conversation.startTime, conversation.endTime),
        status: conversation.status,
        satisfaction: conversation.satisfaction
      },
      messages: conversation.messages
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${conversation.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteConversation = async (conversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      setConversations(conversations.filter(conv => conv.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card p-4">
            <div className="loading-skeleton h-6 w-64 mb-2 rounded"></div>
            <div className="loading-skeleton h-4 w-48 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversation List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
            />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Status</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
              <option value="ongoing">Ongoing</option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="p-2 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last Week</option>
            </select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="space-y-3">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`card p-4 cursor-pointer transition-all ${
                selectedConversation?.id === conversation.id 
                  ? 'border-brand-500 bg-brand-50' 
                  : 'hover:border-brand-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-theme-primary">
                      {conversation.customerName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                      {conversation.status}
                    </span>
                    {conversation.escalated && (
                      <span className="text-accent-error text-xs">🚨 Escalated</span>
                    )}
                  </div>
                  
                  <div className="text-sm text-theme-secondary mb-2">
                    {conversation.customerEmail}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-theme-tertiary">
                    <span>{formatDate(conversation.startTime)}</span>
                    <span>{formatTime(conversation.startTime)} - {formatTime(conversation.endTime)}</span>
                    <span>{getDuration(conversation.startTime, conversation.endTime)}</span>
                    <span>{conversation.messageCount} messages</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {conversation.satisfaction > 0 && (
                    <div className="flex items-center">
                      {getSatisfactionStars(conversation.satisfaction)}
                    </div>
                  )}
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportConversation(conversation);
                      }}
                      className="p-1 text-theme-secondary hover:text-brand-600 hover:bg-brand-50 rounded"
                      title="Export conversation"
                    >
                      📥
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      className="p-1 text-theme-secondary hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete conversation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredConversations.length === 0 && (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-theme-primary mb-2">
                No conversations found
              </h3>
              <p className="text-theme-secondary">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className="space-y-6">
        {selectedConversation ? (
          <>
            {/* Conversation Info */}
            <div className="card p-4">
              <h3 className="font-semibold text-theme-primary mb-3">Conversation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Customer:</span>
                  <span className="font-medium text-theme-primary">
                    {selectedConversation.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Email:</span>
                  <span className="text-theme-primary">
                    {selectedConversation.customerEmail}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Duration:</span>
                  <span className="text-theme-primary">
                    {getDuration(selectedConversation.startTime, selectedConversation.endTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Messages:</span>
                  <span className="text-theme-primary">
                    {selectedConversation.messageCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Intent:</span>
                  <span className="text-theme-primary capitalize">
                    {selectedConversation.intent.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedConversation.status)}`}>
                    {selectedConversation.status}
                  </span>
                </div>
                {selectedConversation.satisfaction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-theme-secondary">Rating:</span>
                    <div className="flex">
                      {getSatisfactionStars(selectedConversation.satisfaction)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message History */}
            <div className="card p-4">
              <h3 className="font-semibold text-theme-primary mb-3">Message History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedConversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-brand-600 text-white'
                          : 'bg-theme-tertiary text-theme-primary'
                      }`}
                    >
                      <p>{message.message}</p>
                      <div className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-brand-100' : 'text-theme-tertiary'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="card p-4">
              <h3 className="font-semibold text-theme-primary mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => exportConversation(selectedConversation)}
                  className="w-full btn-secondary text-sm py-2 rounded-lg focus-ring"
                >
                  Export Conversation
                </button>
                <button className="w-full btn-secondary text-sm py-2 rounded-lg focus-ring">
                  Add to Training Data
                </button>
                <button className="w-full btn-secondary text-sm py-2 rounded-lg focus-ring">
                  Create FAQ from Conversation
                </button>
                <button
                  onClick={() => deleteConversation(selectedConversation.id)}
                  className="w-full btn-secondary text-sm py-2 rounded-lg focus-ring text-red-600 hover:bg-red-50"
                >
                  Delete Conversation
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">👈</div>
            <h3 className="text-lg font-semibold text-theme-primary mb-2">
              Select a Conversation
            </h3>
            <p className="text-theme-secondary">
              Choose a conversation from the list to view details and messages
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;
