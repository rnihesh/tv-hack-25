# Project Structure & Organization

## Root Level Organization

```
phoenix-ai-toolkit/
├── client/          # React frontend application
├── server/          # Node.js backend API
├── data/           # Vector storage and indexes
├── .kiro/          # Kiro AI assistant configuration
├── .github/        # GitHub workflows and templates
└── .vscode/        # VS Code workspace settings
```

## Frontend Structure (client/)

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── AppNavigation.jsx
│   │   ├── Dashboard.jsx
│   │   └── SubscriptionPage.jsx
│   ├── aiImageGenerator/    # Image generation feature
│   │   ├── components/     # Feature-specific components
│   │   ├── ImageGenerator.jsx
│   │   └── api.js
│   ├── website-generator/   # Website creation feature
│   │   ├── components/
│   │   ├── WebsiteGenerator.jsx
│   │   └── api.js
│   ├── mailer/             # Email marketing feature
│   ├── chatbot/            # AI chatbot interface
│   ├── community/          # Community features
│   ├── contexts/           # React contexts (AuthContext)
│   ├── utils/              # Utility functions and API clients
│   └── assets/             # Static assets
├── public/                 # Public static files
├── dist/                   # Build output
└── package.json
```

## Backend Structure (server/)

```
server/
├── config/                 # Configuration files
│   ├── db.js              # MongoDB connection
│   ├── env-config.js      # Environment variables
│   ├── cloudinary.js      # Image service config
│   └── razorpay.js        # Payment config
├── controllers/           # Business logic handlers
│   ├── authController.js
│   ├── websiteController.js
│   ├── imageGenController.js
│   ├── chatbotController.js
│   └── [feature]Controller.js
├── models/               # Mongoose schemas
│   ├── Company.js        # Main user/company model
│   ├── AIContext.js      # AI conversation context
│   ├── VectorStore.js    # Vector database management
│   ├── Subscription.js   # Payment and subscription data
│   └── [Feature].js      # Feature-specific models
├── routes/               # Express route definitions
├── services/             # External service integrations
│   ├── langchain/        # AI model management
│   │   ├── models.js     # Model initialization
│   │   ├── contextualChains.js
│   │   ├── vectorContext.js
│   │   └── memoryVectorStore.js
│   ├── feedback-langchain/ # Feedback analysis system
│   └── emailService.js
├── middlewares/          # Express middleware
│   ├── authMiddleware.js # JWT authentication
│   ├── validator.js      # Input validation
│   └── errorHandler.js   # Error handling
├── utils/                # Utility functions
├── logs/                 # Application logs
├── uploads/              # File upload storage
│   ├── images/
│   └── feedback/
└── package.json
```

## Key Architectural Patterns

### Feature-Based Organization

- Each major feature (website-generator, mailer, chatbot, etc.) has its own folder
- Feature folders contain components, API clients, and feature-specific logic
- Shared components live in the main components/ directory

### API Structure

- RESTful endpoints organized by feature: `/api/website/`, `/api/chatbot/`, etc.
- Controllers handle business logic, routes define endpoints
- Middleware handles cross-cutting concerns (auth, validation, logging)

### AI Integration Pattern

- LangChain services in `server/services/langchain/`
- Model management centralized in `models.js`
- Vector storage and context management separated into dedicated services
- AI contexts stored in MongoDB with vector embeddings in ChromaDB/FAISS

### Credit System Integration

- All AI operations consume credits (defined in controllers)
- Credit validation happens in middleware before expensive operations
- Usage tracking integrated into business logic

### File Naming Conventions

- React components: PascalCase (e.g., `ImageGenerator.jsx`)
- API files: camelCase (e.g., `api.js`, `mailapi.js`)
- Backend files: camelCase (e.g., `authController.js`)
- Configuration files: kebab-case or camelCase (e.g., `env-config.js`)

### Environment Configuration

- Frontend: `.env` files with `VITE_` prefix for public variables
- Backend: `.env` files loaded via `env-config.js`
- Production configs: `.env.production` files for deployment
