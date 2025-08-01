# Vector Context System for LangChain Integration

This document explains the **Vector Context System** implementation for maintaining user/company context in AI-driven business applications using ChromaDB and LangChain.

## 🎯 Overview

The Vector Context System provides contextual awareness to all AI operations by:

- **Storing business context** in ChromaDB vector database
- **Retrieving relevant context** for each AI request
- **Learning from interactions** to improve future responses
- **Maintaining conversation memory** across sessions
- **Extracting business patterns** for strategic insights

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Request                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                Controller Layer                             │
│  • websiteController.js                                    │
│  • emailController.js                                      │
│  • chatbotController.js                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│            Contextual Chains Layer                          │
│  • WebsiteGenerationChain                                  │
│  • EmailMarketingChain                                     │
│  • ChatbotChain                                            │
│  • ImageGenerationChain                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│            Vector Context Service                           │
│  • Company-scoped collections                              │
│  • Context retrieval & storage                             │
│  • Business pattern extraction                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                ChromaDB                                     │
│  • Vector embeddings                                       │
│  • Semantic search                                         │
│  • Persistent storage                                      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
server/
├── services/langchain/
│   ├── vectorContext.js          # Vector storage service
│   ├── contextualChains.js       # Context-aware LangChain chains
│   └── models.js                 # LLM model configurations
├── controllers/
│   ├── websiteController.js      # Website generation with context
│   ├── emailController.js        # Email generation with context
│   └── chatbotController.js      # Chatbot with context
├── routes/
│   ├── websiteRoutes.js          # Website API endpoints
│   ├── emailRoutes.js            # Email API endpoints
│   └── chatbotRoutes.js          # Chatbot API endpoints
└── utils/
    └── testVectorContext.js      # Testing and initialization
```

## 🚀 Quick Start

### 1. Initialize Vector Context for a Company

```javascript
const { VectorContextService } = require("./services/langchain/vectorContext");

// Initialize for a specific company
const vectorService = new VectorContextService(companyId);
await vectorService.initialize();
```

### 2. Add Business Context

```javascript
// Add business information
await vectorService.addBusinessContext({
  type: "business_info",
  content: "Your company description and key information...",
  importance: 10,
  category: "company_overview",
});

// Add customer profiles
await vectorService.addCustomerContext({
  type: "customer_profile",
  content: "Target audience and customer insights...",
  importance: 9,
  category: "target_audience",
});

// Add product/service information
await vectorService.addProductContext({
  type: "service_catalog",
  content: "Services offered and pricing...",
  importance: 8,
  category: "services",
});
```

### 3. Use Contextual AI Chains

```javascript
const {
  WebsiteGenerationChain,
} = require("./services/langchain/contextualChains");

// Generate website with context
const websiteChain = new WebsiteGenerationChain(companyId);
const result = await websiteChain.generateWebsite({
  businessDescription: "Create a professional website",
  templateType: "business",
  style: "modern",
});

// Result includes:
// - result.websiteContent (generated content)
// - result.contextUsed (sources of context used)
// - result.contextInsights (key business insights)
// - result.metrics (performance data)
```

## 🔧 API Endpoints

### Website Generation

```http
POST /api/website/generate
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "prompt": "Create a professional website for our digital marketing agency",
  "templateType": "business",
  "style": "modern",
  "colorScheme": "blue-professional",
  "sections": ["hero", "services", "about", "contact"]
}
```

### Email Generation

```http
POST /api/email/generate
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "emailType": "promotional",
  "targetAudience": "small business owners",
  "campaignGoal": "promote website development services",
  "tone": "professional"
}
```

### Chatbot Response

```http
POST /api/chatbot/respond
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "userMessage": "How much does a website cost?",
  "conversationId": "conv_123",
  "intent": "inquiry"
}
```

## 🧪 Testing the System

### Run Automated Tests

```bash
# Navigate to server directory
cd server

# Run vector context tests
node utils/testVectorContext.js
```

### Manual Testing

```javascript
const { testWithExistingCompany } = require("./utils/testVectorContext");

// Test with existing company
const results = await testWithExistingCompany();
console.log("Test results:", results);
```

## 📊 Context Types and Categories

### Business Context Types

- **business_info**: Company overview, mission, values
- **customer_profile**: Target audience, demographics
- **service_catalog**: Products/services offered
- **pricing_info**: Pricing strategies and models
- **brand_guidelines**: Brand voice, style, messaging

### Customer Context Types

- **customer_interaction**: Past conversations, feedback
- **customer_journey**: Touchpoints, experiences
- **customer_pain_points**: Common issues, concerns
- **customer_success**: Case studies, testimonials

### Conversation Context Types

- **conversation_history**: Previous interactions
- **conversation_patterns**: Common topics, intents
- **conversation_outcomes**: Results, resolutions

## ⚙️ Configuration

### Environment Variables

```bash
# ChromaDB Configuration
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION_PREFIX=company_

# Vector Configuration
VECTOR_DIMENSION=1536
VECTOR_SIMILARITY_THRESHOLD=0.7
MAX_CONTEXT_DOCS=10
```

### Model Configuration

```javascript
// In services/langchain/models.js
const contextualModels = {
  website_generation: "gemini-pro",
  email_generation: "gemini-pro",
  chatbot_response: "ollama-llama2",
  image_generation: "dall-e-3",
};
```

## 🔍 Context Retrieval Logic

The system uses intelligent context retrieval:

1. **Semantic Search**: Find documents similar to current request
2. **Importance Scoring**: Prioritize high-importance context
3. **Category Filtering**: Include relevant context types
4. **Recency Weighting**: Favor recent interactions
5. **Pattern Matching**: Identify recurring themes

```javascript
// Example context retrieval
const relevantContext = await vectorService.getRelevantContext(
  query: "website design for restaurant",
  contextTypes: ['business_info', 'customer_profile', 'service_catalog'],
  maxResults: 5,
  similarityThreshold: 0.7
);
```

## 📈 Performance Monitoring

### Context Usage Analytics

```javascript
// Get context statistics
const stats = await vectorService.getContextStatistics();
console.log("Context usage:", stats);

// Extract business patterns
const patterns = await vectorService.extractBusinessPatterns();
console.log("Business insights:", patterns);
```

### Response Quality Metrics

- **Context Relevance Score**: How relevant retrieved context is
- **Response Quality**: User satisfaction with AI responses
- **Context Coverage**: Percentage of requests using context
- **Processing Time**: Time to retrieve and use context

## 🛠️ Advanced Features

### Conversation Memory

```javascript
// Maintain conversation context across sessions
await vectorService.addConversationContext({
  conversationId: "conv_123",
  userMessage: "How much does a website cost?",
  botResponse: "Our websites start at $2,000...",
  intent: "pricing_inquiry",
  resolved: true,
});
```

### Business Pattern Analysis

```javascript
// Extract insights from accumulated context
const insights = await vectorService.extractBusinessPatterns();
// Returns: customer trends, common pain points, successful strategies
```

### Context Optimization

```javascript
// Optimize context for better performance
await vectorService.optimizeContext({
  removeOldEntries: true,
  consolidateSimilar: true,
  updateImportanceScores: true,
});
```

## 🚨 Troubleshooting

### Common Issues

1. **ChromaDB Connection Failed**

   ```bash
   # Start ChromaDB
   docker run -p 8000:8000 chromadb/chroma
   ```

2. **Context Not Found**

   ```javascript
   // Verify collection exists
   const collections = await vectorService.listCollections();
   console.log("Available collections:", collections);
   ```

3. **Low Context Relevance**
   ```javascript
   // Adjust similarity threshold
   const context = await vectorService.getRelevantContext(
     query,
     { similarityThreshold: 0.5 } // Lower threshold
   );
   ```

### Debug Mode

```javascript
// Enable verbose logging
const vectorService = new VectorContextService(companyId, {
  debug: true,
  logLevel: "verbose",
});
```

## 🔐 Security Considerations

- **Company Isolation**: Each company has separate vector collections
- **Access Control**: Context access requires valid JWT token
- **Data Encryption**: Sensitive context encrypted at rest
- **Audit Logging**: All context operations logged for compliance

## 📚 Best Practices

1. **Context Quality**: Add high-quality, relevant business context
2. **Regular Updates**: Keep context current with business changes
3. **Performance Monitoring**: Track context usage and effectiveness
4. **Privacy Compliance**: Follow data protection regulations
5. **Gradual Implementation**: Start with core context, expand gradually

## 🔗 Related Documentation

- [LangChain Models Configuration](./services/langchain/README.md)
- [API Authentication Guide](../middlewares/README.md)
- [Database Setup Guide](../config/README.md)
- [Logging and Monitoring](../utils/README.md)

---

For questions or issues with the Vector Context System, please refer to the troubleshooting section or create an issue in the project repository.
