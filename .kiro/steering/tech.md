# Technology Stack & Build System

## Frontend Stack

- **React 19.1** with Vite 7.0 for development and builds
- **Tailwind CSS 4.1** for styling with utility-first approach
- **React Router DOM 7.7** for client-side routing
- **Axios** for API communication
- **React Markdown** with remark-gfm for content rendering
- **Lucide React** for icons

## Backend Stack

- **Node.js 18+** with Express.js framework
- **MongoDB** with Mongoose ODM for data persistence
- **LangChain** for AI workflow orchestration
- **Google Gemini 2.5 Flash** and **Ollama LLaMA3** for AI models
- **ChromaDB/FAISS** for vector storage and semantic search
- **JWT** with bcrypt for authentication
- **Winston** for logging
- **Joi** and express-validator for input validation

## External Services

- **Stripe** for payment processing
- **Cloudinary** for image management and optimization
- **Gmail API** for email sending
- **Razorpay** for additional payment options

## Development Tools

- **ESLint** with React hooks and refresh plugins
- **Nodemon** for backend development
- **Jest** for testing
- **PM2** for production process management

## Common Commands

### Frontend (client/)

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend (server/)

```bash
npm run dev          # Start with nodemon (development)
npm start            # Start with node --watch
npm test             # Run Jest tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Full Stack Development

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

## Environment Requirements

- Node.js 18+
- MongoDB 4.4+
- ChromaDB (optional, for vector storage)
- Ollama (optional, for local AI models)
