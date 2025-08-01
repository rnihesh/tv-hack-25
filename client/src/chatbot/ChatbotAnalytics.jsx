import { useState, useEffect } from 'react';
import { chatbotAPI } from '../utils/mailapi';

const ChatbotAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock analytics data - replace with real API calls
  const mockAnalytics = {
    overview: {
      totalConversations: 1247,
      resolvedQueries: 1098,
      escalatedQueries: 149,
      averageRating: 4.2,
      averageResponseTime: 1.8,
      resolutionRate: 88.1
    },
    trends: {
      conversations: [
        { date: '2025-01-25', count: 45 },
        { date: '2025-01-26', count: 52 },
        { date: '2025-01-27', count: 38 },
        { date: '2025-01-28', count: 61 },
        { date: '2025-01-29', count: 47 },
        { date: '2025-01-30', count: 55 },
        { date: '2025-01-31', count: 42 }
      ],
      satisfaction: [
        { date: '2025-01-25', rating: 4.1 },
        { date: '2025-01-26', rating: 4.3 },
        { date: '2025-01-27', rating: 4.0 },
        { date: '2025-01-28', rating: 4.4 },
        { date: '2025-01-29', rating: 4.2 },
        { date: '2025-01-30', rating: 4.3 },
        { date: '2025-01-31', rating: 4.2 }
      ]
    },
    intents: [
      { name: 'Product Inquiry', count: 342, percentage: 27.4 },
      { name: 'Technical Support', count: 298, percentage: 23.9 },
      { name: 'Billing', count: 186, percentage: 14.9 },
      { name: 'General Info', count: 158, percentage: 12.7 },
      { name: 'Complaints', count: 134, percentage: 10.7 },
      { name: 'Other', count: 129, percentage: 10.4 }
    ],
    sentiment: {
      positive: 64.2,
      neutral: 28.5,
      negative: 7.3
    },
    topQuestions: [
      { question: 'How can I reset my password?', count: 89, resolved: 85 },
      { question: 'What are your pricing plans?', count: 76, resolved: 76 },
      { question: 'How do I cancel my subscription?', count: 64, resolved: 58 },
      { question: 'Is there a mobile app?', count: 52, resolved: 52 },
      { question: 'How do I upgrade my plan?', count: 41, resolved: 39 }
    ]
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setAnalyticsData(mockAnalytics);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setLoading(false);
    }
  };

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '3m', label: 'Last 3 Months' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card p-6">
            <div className="loading-skeleton h-6 w-48 mb-4 rounded"></div>
            <div className="loading-skeleton h-32 w-full rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl heading-secondary text-theme-primary">Performance Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="p-2 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-theme-primary">Total Conversations</h3>
            <span className="text-2xl">💬</span>
          </div>
          <div className="text-3xl font-bold text-brand-600 mb-1">
            {analyticsData?.overview.totalConversations.toLocaleString()}
          </div>
          <div className="text-sm text-accent-success">+12% from last period</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-theme-primary">Resolution Rate</h3>
            <span className="text-2xl">✅</span>
          </div>
          <div className="text-3xl font-bold text-brand-600 mb-1">
            {analyticsData?.overview.resolutionRate}%
          </div>
          <div className="text-sm text-accent-success">+3.2% improvement</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-theme-primary">Avg Response Time</h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="text-3xl font-bold text-brand-600 mb-1">
            {analyticsData?.overview.averageResponseTime}s
          </div>
          <div className="text-sm text-accent-success">-0.3s faster</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-theme-primary">Customer Satisfaction</h3>
            <span className="text-2xl">⭐</span>
          </div>
          <div className="text-3xl font-bold text-brand-600 mb-1">
            {analyticsData?.overview.averageRating}/5
          </div>
          <div className="text-sm text-accent-success">+0.1 rating</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-theme-primary">Escalated Queries</h3>
            <span className="text-2xl">🆘</span>
          </div>
          <div className="text-3xl font-bold text-brand-600 mb-1">
            {analyticsData?.overview.escalatedQueries}
          </div>
          <div className="text-sm text-accent-error">+5 from last period</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-theme-primary">Resolved Queries</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-3xl font-bold text-brand-600 mb-1">
            {analyticsData?.overview.resolvedQueries}
          </div>
          <div className="text-sm text-accent-success">+8% increase</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation Trends */}
        <div className="card p-6">
          <h3 className="font-semibold text-theme-primary mb-4">Conversation Trends</h3>
          <div className="h-64 flex items-end space-x-2">
            {analyticsData?.trends.conversations.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-brand-500 rounded-t min-h-4 w-full transition-all duration-300 hover:bg-brand-600"
                  style={{ height: `${(day.count / 70) * 100}%` }}
                  title={`${day.count} conversations on ${day.date}`}
                ></div>
                <div className="text-xs text-theme-tertiary mt-2 transform rotate-45">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intent Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-theme-primary mb-4">Popular Intent Categories</h3>
          <div className="space-y-3">
            {analyticsData?.intents.map((intent, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="font-medium text-theme-primary">{intent.name}</div>
                  <div className="flex-1 bg-theme-tertiary rounded-full h-2">
                    <div 
                      className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${intent.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-theme-secondary ml-4">
                  {intent.count} ({intent.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="card p-6">
        <h3 className="font-semibold text-theme-primary mb-4">Sentiment Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-2">😊</div>
            <div className="text-2xl font-bold text-accent-success mb-1">
              {analyticsData?.sentiment.positive}%
            </div>
            <div className="text-theme-secondary">Positive</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-2">😐</div>
            <div className="text-2xl font-bold text-theme-primary mb-1">
              {analyticsData?.sentiment.neutral}%
            </div>
            <div className="text-theme-secondary">Neutral</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-2">😞</div>
            <div className="text-2xl font-bold text-accent-error mb-1">
              {analyticsData?.sentiment.negative}%
            </div>
            <div className="text-theme-secondary">Negative</div>
          </div>
        </div>
      </div>

      {/* Top Questions */}
      <div className="card p-6">
        <h3 className="font-semibold text-theme-primary mb-4">Most Asked Questions</h3>
        <div className="space-y-4">
          {analyticsData?.topQuestions.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-theme-secondary rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-theme-primary mb-1">{item.question}</div>
                <div className="flex items-center space-x-4 text-sm text-theme-secondary">
                  <span>Asked {item.count} times</span>
                  <span>Resolved {item.resolved} times</span>
                  <span className={`font-medium ${
                    (item.resolved / item.count) > 0.9 ? 'text-accent-success' : 
                    (item.resolved / item.count) > 0.7 ? 'text-accent-warning' : 'text-accent-error'
                  }`}>
                    {Math.round((item.resolved / item.count) * 100)}% resolution rate
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-brand-600">#{index + 1}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div className="card p-6">
        <h3 className="font-semibold text-theme-primary mb-4">Recommended Actions</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-accent-warning-light rounded-lg">
            <span className="text-accent-warning text-lg">⚠️</span>
            <div>
              <div className="font-medium text-theme-primary">High Escalation Rate for Billing</div>
              <div className="text-sm text-theme-secondary">Consider adding more billing FAQs or improving responses</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-accent-info-light rounded-lg">
            <span className="text-accent-info text-lg">💡</span>
            <div>
              <div className="font-medium text-theme-primary">Popular Product Inquiry Pattern</div>
              <div className="text-sm text-theme-secondary">Create more detailed product documentation for common questions</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-accent-success-light rounded-lg">
            <span className="text-accent-success text-lg">✅</span>
            <div>
              <div className="font-medium text-theme-primary">Excellent Technical Support Resolution</div>
              <div className="text-sm text-theme-secondary">Technical support responses are performing very well</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotAnalytics;
