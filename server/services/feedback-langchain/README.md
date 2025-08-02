# Feedback Analyzer with LangChain Integration

A comprehensive feedback analysis system using LangChain for AI-powered insights and chatbot integration.

## 🎯 Overview

This feedback analyzer provides:

- **AI-Powered Analysis**: Sentiment, emotion, and theme analysis using LLM
- **Vector Search**: Find similar feedback using semantic search
- **Trend Analysis**: Track sentiment trends over time
- **Chatbot Integration**: Natural language interface for feedback queries
- **Insight Generation**: Automated business insights and recommendations
- **CSV Data Processing**: Load and process feedback from CSV files

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Query                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│            Chatbot Integration                              │
│  • Intent analysis                                         │
│  • Query routing                                           │
│  • Response formatting                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│            Feedback Analyzer                               │
│  • Sentiment trends                                        │
│  • Similar feedback search                                 │
│  • Insight generation                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│          LLM Service & Vector Store                        │
│  • Ollama / Google Gemini                                 │
│  • Memory Vector Store                                     │
│  • Text embeddings                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│            Data Processor                                  │
│  • CSV parsing                                            │
│  • Data enhancement                                       │
│  • Batch processing                                       │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
server/services/feedback-langchain/
├── analyzer.js                 # Main feedback analysis engine
├── chatbotIntegration.js      # Chatbot interface for feedback queries
├── dataProcessor.js           # CSV data loading and processing
├── llmService.js             # LLM service with Ollama/Gemini fallback
├── vectorStore.js            # Vector storage for feedback embeddings
└── README.md                 # This documentation
```

## 🚀 Quick Start

### 1. Initialize the Feedback System

```javascript
const { feedbackChatbotIntegration } = require('./services/feedback-langchain/chatbotIntegration');

// Initialize the system
await feedbackChatbotIntegration.initialize();
```

### 2. Load Feedback Data from CSV

```javascript
const { feedbackDataProcessor } = require('./services/feedback-langchain/dataProcessor');

// Load feedback from CSV file
const result = await feedbackDataProcessor.loadFromCSVFile();
console.log('Loaded feedback:', result.stats);
```

### 3. Use Chatbot Interface

```javascript
// Handle user queries about feedback
const response = await feedbackChatbotIntegration.handleFeedbackQuery(
  "What's the sentiment trend this month?",
  "user_session_123"
);

console.log('Bot Response:', response.response);
console.log('Follow-up suggestions:', response.suggestions);
```

## 🔧 API Integration

### Add to Chatbot Controller

```javascript
// In your chatbotController.js
const { feedbackChatbotIntegration } = require('../services/feedback-langchain/chatbotIntegration');

// Add feedback query handling
router.post('/feedback-query', protect, async (req, res) => {
  try {
    const { userMessage, sessionId } = req.body;
    const companyId = req.user.companyId;
    
    const response = await feedbackChatbotIntegration.handleFeedbackQuery(
      userMessage,
      `${companyId}_${sessionId}`
    );
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error in feedback query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process feedback query'
    });
  }
});
```

### New Feedback Routes

```javascript
// Enhanced feedbackRoutes.js
const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { feedbackDataProcessor } = require("../services/feedback-langchain/dataProcessor");
const { feedbackAnalyzer } = require("../services/feedback-langchain/analyzer");
const { feedbackChatbotIntegration } = require("../services/feedback-langchain/chatbotIntegration");

const router = express.Router();

// Load feedback data
router.post("/load", protect, async (req, res) => {
  try {
    const result = await feedbackDataProcessor.loadFromCSVFile();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get sentiment trends
router.get("/trends", protect, async (req, res) => {
  try {
    const { timeframe, source } = req.query;
    const trends = await feedbackAnalyzer.analyzeSentimentTrends({ timeframe, source });
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Chat with feedback system
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const response = await feedbackChatbotIntegration.handleFeedbackQuery(
      message,
      sessionId || `${req.user.companyId}_default`
    );
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

## 📊 Query Examples

### Sentiment Analysis
```javascript
// Ask about sentiment trends
"What's the sentiment trend this month?"
"Show me positive feedback from Twitter"
"How is customer sentiment changing?"
```

### Find Similar Feedback
```javascript
// Search for similar feedback
"Find feedback similar to 'great customer service'"
"Show me complaints about website design"
"Find feedback about pricing issues"
```

### Business Insights
```javascript
// Get business insights
"Give me insights about customer feedback"
"What are the main customer pain points?"
"Generate recommendations based on feedback"
```

### Trend Analysis
```javascript
// Analyze trends
"Show sentiment trends over the last quarter"
"What patterns do you see in the feedback?"
"How has customer satisfaction changed?"
```

## 🛠️ Configuration

### Environment Variables

The system uses the same LLM configuration as your existing setup:

```bash
# For Ollama (primary)
OLLAMA_URL=http://localhost:11434

# For Google Gemini (fallback)
GEMINI_API_KEY=your_gemini_api_key
```

### CSV Format

Expected CSV format (matches your feedback.csv):
```csv
Text, Sentiment, Source, Date/Time, User ID, Location, Confidence Score
"I love this product!", Positive, Twitter, 2023-06-15 09:23:14, @user123, New York, 0.85
```

## 🧪 Testing

### Load and Test Feedback Data

```javascript
const { feedbackDataProcessor } = require('./services/feedback-langchain/dataProcessor');
const { feedbackChatbotIntegration } = require('./services/feedback-langchain/chatbotIntegration');

async function testFeedbackSystem() {
  try {
    // Initialize system
    await feedbackChatbotIntegration.initialize();
    
    // Load data
    const loadResult = await feedbackDataProcessor.loadFromCSVFile();
    console.log('Data loaded:', loadResult.stats);
    
    // Test queries
    const queries = [
      "What's the overall sentiment?",
      "Find negative feedback about service",
      "Show me trends this month",
      "Give me business insights"
    ];
    
    for (const query of queries) {
      const response = await feedbackChatbotIntegration.handleFeedbackQuery(
        query,
        'test_session'
      );
      console.log(`Q: ${query}`);
      console.log(`A: ${response.response}\n`);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test
testFeedbackSystem();
```

## 📈 Features

### 1. Sentiment Analysis
- Real-time sentiment classification
- Confidence scoring
- Trend analysis over time
- Source-based filtering

### 2. Vector Search
- Semantic similarity search
- Find related feedback
- Context-aware matching
- Relevance scoring

### 3. AI Insights
- Theme extraction
- Business impact analysis
- Actionable recommendations
- Pattern recognition

### 4. Chatbot Integration
- Natural language queries
- Intent recognition
- Conversational context
- Follow-up suggestions

### 5. Data Processing
- CSV import/export
- Batch processing
- Data enhancement
- Error handling

## 🔍 Query Types Supported

1. **Sentiment Queries**: "What's the sentiment?", "Show positive feedback"
2. **Similarity Queries**: "Find similar feedback", "Show complaints about X"
3. **Trend Queries**: "Show trends", "How is sentiment changing?"
4. **Insight Queries**: "Give me insights", "What are the pain points?"
5. **Specific Queries**: "What do customers say about pricing?"

## 🚨 Error Handling

The system includes comprehensive error handling:

- **LLM Fallback**: Ollama → Google Gemini → Error response
- **Data Validation**: CSV parsing with error recovery
- **Query Fallback**: If analysis fails, provides helpful error messages
- **Session Management**: Handles conversation state safely

## 🔐 Security

- **Company Isolation**: Feedback data scoped by company/session
- **Input Validation**: All user inputs sanitized
- **Error Sanitization**: No sensitive data in error messages
- **Rate Limiting**: Can be integrated with existing rate limiting

## 📚 Integration Examples

### Frontend Integration

```javascript
// React component example
const FeedbackChat = () => {
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState([]);

  const sendMessage = async () => {
    const response = await fetch('/api/feedback/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        sessionId: 'user_session_123' 
      })
    });
    
    const data = await response.json();
    setResponses([...responses, data.data]);
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask about customer feedback..."
      />
      <button onClick={sendMessage}>Send</button>
      
      {responses.map((resp, index) => (
        <div key={index}>
          <p>{resp.response}</p>
          <div>
            {resp.suggestions.map(suggestion => (
              <button onClick={() => setMessage(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔗 Related Documentation

- [Main LangChain Integration](../langchain/README.md)
- [Chatbot Controller](../../controllers/chatbotController.js)
- [Vector Context System](../langchain/vectorContext.js)

For questions or issues, please refer to the troubleshooting section or create an issue in the project repository.
