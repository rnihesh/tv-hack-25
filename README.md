# Phoenix AI Toolkit

A comprehensive AI-powered platform that helps small businesses create websites, manage email campaigns, deploy chatbots, and generate marketing content using advanced AI models.

## Features

**AI Website Generator**

- Generate responsive websites using Google Gemini 2.5 Flash and Ollama LLaMA3
- Multiple templates and customization options
- Mobile-first responsive design

**Email Marketing Suite**

- AI-powered email campaign generation
- Customer segmentation and targeting
- Performance analytics and tracking

**Context-Aware Chatbot**

- Business context memory across conversations
- Natural language processing
- Sentiment analysis and continuous learning

**Image Generation Studio**

- Create marketing visuals with Google Imagen 3
- Multiple artistic styles and aspect ratios
- Cloudinary integration for storage

**Feedback Analytics**

- Vector-based similarity search
- Sentiment trend analysis
- AI-generated business insights

## Technology Stack

**Frontend**

- React 19.1 with Vite 7.0
- Tailwind CSS 4.1
- React Router DOM 7.7

**Backend**

- Node.js 18+ with Express.js
- MongoDB with Mongoose ODM
- LangChain for AI orchestration
- In-memory vector storage (lazy-loaded)

**AI & Services**

- Google Gemini 2.5 Flash (text generation)
- Google Imagen 3 (image generation)
- Ollama LLaMA3 (local AI support)
- Stripe for payments
- Cloudinary for media management

## Project Structure

```
phoenix-ai-toolkit/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── website-generator/ # Website creation tools
│   │   ├── mailer/           # Email marketing suite
│   │   ├── chatbot/          # AI chatbot interface
│   │   ├── aiImageGenerator/ # Image generation studio
│   │   └── utils/            # Utility functions
└── server/                   # Node.js backend
    ├── controllers/          # Business logic
    ├── models/               # Database schemas
    ├── routes/               # API endpoints
    ├── services/             # AI & external services
    │   ├── langchain/        # LangChain integrations
    │   └── feedback-langchain/ # Feedback analysis
    ├── middlewares/          # Security & validation
    └── utils/                # Helper functions
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/phoenix-ai-toolkit.git
   cd phoenix-ai-toolkit
   ```

2. **Install dependencies**

   ```bash
   # Install all dependencies (client + server)
   npm run install:all
   ```

3. **Environment setup**

   ```bash
   # Copy environment template
   cp server/.env.example server/.env
   ```

4. **Configure environment variables**

   ```env
   # Database
   DBURL=mongodb://localhost:27017/phoenix-ai-toolkit

   # AI Services
   GEMINI_API_KEY=your-gemini-api-key
   OLLAMA_URL=http://localhost:11434

   # Security
   JWT_SECRET=your-super-secret-jwt-key

   # External Services
   STRIPE_SECRET_KEY=your-stripe-secret-key
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   ```

5. **Start development servers**

   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## API Overview

### Authentication

```http
POST /api/auth/register     # Register new company
POST /api/auth/login        # Company login
GET  /api/auth/profile      # Get company profile
PUT  /api/auth/profile      # Update company profile
```

### Website Generation

```http
POST /api/website/generate      # Generate new website (5 credits)
GET  /api/website/my-websites   # Get company's websites
GET  /api/website/:id           # Get specific website
PUT  /api/website/:id           # Update website
DELETE /api/website/:id         # Delete website
```

### Email Marketing

```http
POST /api/marketing/email/generate     # Generate marketing email (1 credit)
GET  /api/marketing/campaigns          # Get email campaigns
POST /api/marketing/campaigns/:id/send # Send email campaign
```

### AI Chatbot

```http
POST /api/chatbot/message     # Send message to chatbot (1 credit)
GET  /api/chatbot/config      # Get chatbot configuration
PUT  /api/chatbot/config      # Update chatbot configuration
```

### Image Generation

```http
POST /api/images/generate     # Generate images (2 credits)
GET  /api/images/history      # Get generated images
DELETE /api/images/:id        # Delete image
```

## Pricing Plans

| Plan             | Price     | Credits               | Features                                                            |
| ---------------- | --------- | --------------------- | ------------------------------------------------------------------- |
| **Free**         | $0        | 10 daily              | 1 website, 5 emails, 3 images, 50 chats                             |
| **Starter**      | $29/month | 100 daily + 500 bonus | 5 websites, 50 emails, 100 images, 1K chats                         |
| **Professional** | $99/month | 500 daily + 2K bonus  | Unlimited websites & emails, 500 images, 5K chats, priority support |

## Security Features

- JWT authentication with secure token management
- Rate limiting to prevent API abuse
- Input validation with Joi
- Password hashing with bcrypt
- CORS protection
- HTTP security headers with Helmet
- MongoDB injection prevention

## Development

### Available Scripts

**Frontend (client/)**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend (server/)**

```bash
npm run dev          # Start with nodemon
npm start            # Start with node --watch
npm test             # Run Jest tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Logging

Application logs are stored in:

```
server/logs/
├── combined.log    # All application logs
├── error.log       # Error logs only
├── access.log      # HTTP access logs
└── exceptions.log  # Unhandled exceptions
```

## Team

- **Nihesh** - Lead AI Engineer
- **Pavan** - Full Stack Developer
- **Mahesh** - UI/UX Designer
- **Ritheesh** - DevOps Engineer

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/phoenix-ai-toolkit/issues)
- **Email**: support@phoenix-ai-toolkit.com
- **Demo**: [phoenix-sol.vercel.app](https://phoenix-sol.vercel.app)

---

Built with ❤️ for small businesses everywhere.
