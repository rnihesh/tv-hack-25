# AI Digital Toolkit - Backend Server

A comprehensive AI-powered backend API for small businesses to manage their digital presence through automated website generation, email marketing, chatbots, and more.

## 🚀 Features

- **AI-Powered Website Generation**: Create professional websites using Gemini/Ollama models
- **Email Marketing Automation**: Generate and send personalized marketing emails
- **Intelligent Chatbot**: Context-aware customer service chatbot with memory
- **Image Generation**: Create marketing images and visuals
- **Credit-Based System**: Flexible usage tracking with subscription tiers
- **Vector Context System**: Contextual AI responses using LangChain + in-memory vector store
- **Comprehensive Authentication**: JWT-based auth with role management
- **Payment Integration**: Stripe-based subscription and credit purchasing
- **Analytics & Monitoring**: Detailed usage analytics and performance monitoring

## 🏗️ Architecture

### Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Vector Store**: In-memory vector store with MongoDB metadata persistence
- **AI/ML**: LangChain with Google Gemini and Ollama support
- **Authentication**: JWT with bcrypt password hashing
- **Payments**: Stripe for subscriptions and credit purchases
- **Logging**: Winston for comprehensive logging
- **Validation**: Joi + express-validator

### Project Structure

```
server/
├── config/
│   ├── db.js                 # MongoDB connection
│   └── env-config.js         # Environment configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── websiteController.js  # Website generation
│   ├── marketingController.js # Email marketing
│   ├── mediaController.js    # Image generation
│   ├── chatbotController.js  # Chatbot functionality
│   └── feedbackController.js # User feedback
├── models/
│   ├── Company.js            # Main user/company model
│   ├── AIContext.js          # AI conversation context
│   ├── VectorStore.js        # Vector database management
│   ├── Subscription.js       # Subscription plans & payments
│   └── [other models...]
├── services/
│   └── langchain/
│       ├── models.js         # AI model management
│       ├── chains/           # LangChain implementations
│       ├── prompts/          # Structured prompts
│       └── memory/           # Conversation memory
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   ├── websiteRoutes.js      # Website generation endpoints
│   └── [other route files...]
├── middlewares/
│   ├── authMiddleware.js     # JWT authentication
│   ├── validator.js          # Input validation
│   └── errorHandler.js       # Error handling
├── utils/
│   └── logger.js             # Logging utilities
└── server.js                 # Main application entry
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Ollama (optional, for local AI models)

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DBURL=mongodb://localhost:27017/ai-business-toolkit

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI Models
GEMINI_API_KEY=your-gemini-api-key-here
OLLAMA_URL=http://localhost:11434

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Vector Store (uses in-memory with MongoDB metadata)
# No additional configuration needed
```

### 3. Start Required Services

**MongoDB:**

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install locally and start
mongod
```

**Ollama (Optional):**

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama3
ollama pull mistral
ollama pull codellama
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Register new company
- `POST /api/auth/login` - Company login
- `GET /api/auth/profile` - Get company profile
- `PUT /api/auth/profile` - Update company profile
- `GET /api/auth/credits` - Get credit balance and usage

### Website Generation

- `POST /api/website/generate` - Generate new website (5 credits)
- `GET /api/website/my-websites` - Get company's websites
- `GET /api/website/:id` - Get specific website
- `PUT /api/website/:id` - Update website
- `DELETE /api/website/:id` - Delete website

### Email Marketing

- `POST /api/marketing/email/generate` - Generate marketing email (1 credit)
- `GET /api/marketing/campaigns` - Get email campaigns
- `POST /api/marketing/campaigns/:id/send` - Send email campaign

### Image Generation

- `POST /api/media/images/generate` - Generate images (2 credits)
- `GET /api/media/images` - Get generated images
- `DELETE /api/media/images/:id` - Delete image

### Chatbot

- `POST /api/chatbot/chat` - Send message to chatbot (0.1 credits)
- `GET /api/chatbot/config` - Get chatbot configuration
- `PUT /api/chatbot/config` - Update chatbot configuration

## 💳 Subscription Plans

### Free Plan

- 10 daily credits
- 1 website template
- 5 email campaigns
- 3 image generations
- 50 chatbot queries

### Starter Plan ($29/month)

- 100 daily credits + 500 bonus
- 5 website templates
- 50 email campaigns
- 100 image generations
- 1,000 chatbot queries

### Professional Plan ($99/month)

- 500 daily credits + 2000 bonus
- Unlimited websites
- Unlimited email campaigns
- 500 image generations
- 5,000 chatbot queries
- Priority support
- Custom branding

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: bcrypt with high salt rounds
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Additional HTTP security headers
- **MongoDB Injection Protection**: Input sanitization

## 📊 Monitoring & Logging

The server includes comprehensive logging:

- **HTTP Requests**: All API calls with response times
- **Database Operations**: Query performance and errors
- **AI Model Usage**: Token usage, costs, and response times
- **Business Events**: User registrations, subscriptions, content generation
- **Security Events**: Failed authentication, rate limiting
- **Performance Monitoring**: Slow queries and memory usage

Logs are stored in:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/access.log` - HTTP access logs

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Test specific model health
curl http://localhost:3000/health
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DBURL=mongodb://your-production-db-url
JWT_SECRET=your-very-long-and-secure-production-jwt-secret
GEMINI_API_KEY=your-production-gemini-key
STRIPE_SECRET_KEY=sk_live_your-live-stripe-key
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 Process Manager

```bash
npm install -g pm2
pm2 start server.js --name "ai-toolkit-api"
pm2 startup
pm2 save
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Email: support@yourcompany.com
- Documentation: [API Docs](http://localhost:3000/api-docs)

---

**Built with ❤️ for small businesses to thrive digitally**
