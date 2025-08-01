# Copilot Instructions for AI Digital Toolkit (tv-hack-25)

## Big Picture Architecture

- **Monorepo** with `client/` (React+Vite frontend) and `server/` (Node.js+Express backend)
- **Backend** is modular: business logic in `controllers/`, data models in `models/`, API endpoints in `routes/`, and AI/LLM logic in `services/langchain/`
- **MongoDB** is the main database, with ChromaDB for vector storage (AI context)
- **LangChain** is used for orchestrating AI tasks (website gen, email, chatbot, etc.)
- **Credit-based billing**: Each company has a credit balance, tracked in MongoDB, with daily resets and subscription tiers
- **Stripe** is integrated for payments and subscription management
- **Logging** is handled via Winston (`server/utils/logger.js`)
- **Validation** is enforced via `express-validator` and custom middlewares

## Developer Workflows

- **Start backend**: `cd server && npm install && npm run dev` (uses `.env` for config)
- **Start frontend**: `cd client && npm install && npm run dev`
- **Environment setup**: Copy `server/.env.example` to `.env` and fill in secrets
- **Run MongoDB/ChromaDB/Ollama**: See `server/README.md` for Docker and local commands
- **API health check**: `GET /health` or `GET /api/status` on backend
- **Logs**: Check `server/logs/` for error, combined, and access logs
- **Testing**: Use `npm test` in `server/` (Jest)

## Project-Specific Patterns

- **Company-centric**: All business logic is scoped to a company (not generic users)
- **Credit deduction**: API endpoints for AI services (website, email, image, chatbot) deduct credits via model methods (see `Company.js`)
- **Context memory**: AI context is stored in `AIContext.js` and `VectorStore.js`, referenced by company and session
- **LangChain models**: Configured in `services/langchain/models.js` (Gemini, Ollama, etc.)
- **API endpoints**: Organized by feature in `routes/` and `controllers/` (e.g., `websiteRoutes.js`, `websiteController.js`)
- **Validation**: All input is validated via `middlewares/validator.js` before controller logic
- **Error handling**: Centralized in `middlewares/errorHandler.js`
- **Security**: JWT auth (`authMiddleware.js`), rate limiting, helmet, CORS
- **Subscription plans**: Defined in `models/Subscription.js` and referenced in company logic

## Integration Points

- **MongoDB**: All models use Mongoose schemas; connection in `config/db.js`
- **ChromaDB**: Used for vector storage; see `VectorStore.js` and `services/langchain/`
- **Stripe**: Payment integration; keys in `.env`, logic in `Subscription.js` and controllers
- **LangChain**: AI orchestration; models configured in `services/langchain/models.js`, chains/prompts in subfolders
- **Frontend**: Communicates via REST API endpoints (see `server/README.md` for docs)

## Examples

- **Website Generation**: `POST /api/website/generate` (deducts credits, uses LangChain, stores result)
- **Company Registration**: `POST /api/auth/register` (creates company, initializes vector store)
- **Credit Check**: Middleware `checkCredits()` before AI endpoints
- **Contextual AI**: `AIContext.js` stores conversation history, business context, and vector doc references

## Conventions

- **All business logic is company-scoped** (never generic user accounts)
- **Credits and usage are tracked per company**
- **AI context is always persisted for traceability**
- **All API input is validated before controller logic**
- **Logs are written for all major events (auth, AI, payments, errors)**
- **Environment variables are required for all integrations**

## Key Files/Directories

- `server/models/Company.js` — Company schema, credit logic
- `server/models/AIContext.js` — AI context memory
- `server/models/VectorStore.js` — Vector DB integration
- `server/services/langchain/models.js` — LLM model configs
- `server/controllers/websiteController.js` — Website generation logic
- `server/routes/websiteRoutes.js` — Website API endpoints
- `server/middlewares/validator.js` — Input validation
- `server/middlewares/authMiddleware.js` — JWT auth, credit checks
- `server/utils/logger.js` — Logging
- `server/README.md` — Full backend documentation

---

If any conventions or workflows are unclear, ask the user for clarification and update this file accordingly.
