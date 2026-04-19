# Phoenix AI Toolkit — Project Overview

## 1) Main Purpose of the Project
Phoenix AI Toolkit is a full-stack AI platform built for small businesses.
Its main goal is to give one dashboard where a business can:
- generate website content,
- create marketing emails,
- generate marketing images,
- use an AI chatbot,
- analyze customer feedback,
- and buy usage credits.

In simple words: it is an **AI business co-pilot** for digital presence and marketing tasks.

---

## 2) Real-World Problem It Solves
Small businesses usually struggle with:
- limited marketing/design resources,
- expensive agencies and tools,
- lack of technical skills for websites and automation,
- fragmented tools (one for email, one for chatbot, one for analytics),
- slow response to customer feedback.

This project solves that by offering one integrated product where AI creates content quickly, tracks usage by credits, and keeps business context so outputs are more relevant.

---

## 3) Key Features Implemented

### Core Business Features
- **Authentication & company onboarding** (register/login/profile/JWT).
- **Credit-based usage model** (credits required per AI action).
- **Website generation** with AI + business context.
- **Email generation and campaign flow** (compose, preview, recipients, send/schedule).
- **Image generation** using Google AI + Cloudinary/local fallback.
- **Chatbot assistant** with conversation memory and context.
- **Community messaging** between users/companies.
- **Subscription/credit purchase** with Razorpay orders + payment verification.

### AI/Analytics Features
- **LangChain contextual chains** for website, chatbot, and email output.
- **Vector context memory** (company-scoped context retrieval using embeddings).
- **Feedback analysis module** for CSV-based sentiment/search/trends/insights.
- **Feedback chatbot integration** to ask natural-language questions about feedback.

### Platform/Engineering Features
- **Express middleware stack**: helmet, CORS, compression, auth, validation.
- **MongoDB models** for company, content, AI context, subscriptions, etc.
- **Logging system** (Winston) for app, HTTP, AI, business, and security events.

---

## 4) Overall Architecture (High-Level)

The project uses a classic **client-server architecture** with AI service orchestration:

1. **Frontend (React + Vite)**
   - Handles UI, routing, user sessions, and feature workflows.
   - Calls backend APIs with JWT tokens.

2. **Backend (Node.js + Express)**
   - Exposes REST APIs for auth, websites, chatbot, email, image, community, feedback, and subscription.
   - Enforces authentication, validation, and credit/usage checks.
   - Calls AI services and stores outputs.

3. **Data layer (MongoDB + Mongoose)**
   - Stores company profile, generated assets, usage, payments, conversation context, etc.

4. **AI orchestration layer (LangChain services)**
   - Builds context-aware prompts.
   - Retrieves relevant company context from vector memory.
   - Uses Gemini/Ollama for text and Imagen for image generation.

5. **External services**
   - **Google Gemini / Imagen** for AI generation,
   - **Cloudinary** for image hosting,
   - **Razorpay** for payments,
   - **Email provider via Nodemailer/Gmail OAuth** for email sending.

---

## 5) Important Folders and Responsibilities

## Root
- `client/` — React frontend app.
- `server/` — Express backend API and business logic.
- `data/` — feedback vector index/docstore artifacts.
- `cust.csv`, `client/public/feedback.csv` — sample customer/feedback data.

## Frontend (`client/src`)
- `components/` — shared UI blocks (navigation, dashboard, subscription page, auth wrappers).
- `contexts/` — global React context (`AuthContext`) for login state.
- `utils/` — API clients and environment-based URL configuration.
- `website-generator/` — website generation UI and feature-specific API wrapper.
- `mailer/` — email campaign workflow components.
- `chatbot/` — full chatbot page + floating assistant widget.
- `aiImageGenerator/` — image generation UI + history/preview.
- `community/` — collaboration/community messaging UI.

## Backend (`server`)
- `config/` — environment, DB, and third-party config (Cloudinary, Razorpay).
- `routes/` — endpoint definitions and middleware composition.
- `controllers/` — request handling + feature business logic.
- `models/` — Mongoose schemas (Company, Website, AIContext, Image, Subscription, etc.).
- `middlewares/` — auth, validation, error handling, demo auth logic.
- `services/` — deeper service logic:
  - `langchain/` for context-aware AI chains + vector context service,
  - `feedback-langchain/` for CSV feedback analytics and chatbot integration,
  - `emailService.js` for actual mail sending operations.
- `utils/` — logger and utility scripts.
- `uploads/` — uploaded/generated files.
- `logs/` — runtime log files.

---

## 6) Important Files and Their Roles

### Frontend
- `client/src/main.jsx` — React entry point.
- `client/src/App.jsx` — app router, protected/public routes, auth gating.
- `client/src/contexts/AuthContext.jsx` — login/register/logout/profile state and persistence.
- `client/src/components/Dashboard.jsx` — main feature landing page with usage overview.
- `client/src/components/AppNavigation.jsx` — global navigation + theme toggle + user actions.
- `client/src/utils/config.js` — environment-aware backend URL selection.
- `client/src/utils/api.js` — shared axios instance + auth/email API wrappers.
- `client/src/website-generator/WebsiteGenerator.jsx` — website generation workflow UI.
- `client/src/chatbot/ChatbotPage.jsx` — rich chatbot interface and CSV analysis trigger.
- `client/src/aiImageGenerator/ImageGenerator.jsx` — image generation, history, and delete/download flow.
- `client/src/mailer/MailingDashboard.jsx` — multi-step email campaign UX.
- `client/src/community/CommunityChat.jsx` — community message feed and posting UI.
- `client/src/components/SubscriptionPage.jsx` — package purchase and payment flow UI.

### Backend
- `server/server.js` — main Express app bootstrap, middleware registration, route mounting, startup checks.
- `server/config/env-config.js` — centralized environment variable loading and defaults.
- `server/middlewares/authMiddleware.js` — JWT protect + credit and usage-limit checks.
- `server/routes/*.js` — API endpoints grouped by domain (auth, websites, chatbot, email, images, feedback, community, subscription).
- `server/controllers/authController.js` — company registration/login/profile/credit APIs.
- `server/controllers/websiteController.js` — website AI generation + CRUD + deploy trigger.
- `server/controllers/chatbotController.js` — chatbot processing, history, feedback-query handling.
- `server/controllers/emailController.js` — email generation, campaign generation, list management, send/schedule.
- `server/controllers/imageGenController.js` — image creation pipeline, storage, and history.
- `server/controllers/subscriptionController.js` — package listing, Razorpay order, verification, webhook logic.
- `server/models/Company.js` — core company/account schema, preferences, subscription, credits, usage.
- `server/models/AIContext.js` + `server/models/VectorStore.js` — AI memory and vector metadata.
- `server/services/langchain/contextualChains.js` — reusable context-aware chains for AI tasks.
- `server/services/langchain/vectorContext.js` — embedding-based context add/search/retrieval.
- `server/services/feedback-langchain/*` — feedback ingestion, vector search, trend analysis, Q&A.
- `server/utils/logger.js` — centralized structured logging.

---

## 7) End-to-End Flow (Simplified)

1. User opens the React app and signs up or logs in.
2. Backend verifies credentials and returns a JWT token.
3. Frontend stores token and uses it in all API requests.
4. User chooses a feature (website/email/chatbot/image/etc.) from dashboard.
5. Frontend sends request to backend endpoint with business input.
6. Backend middleware validates token, checks credits/limits, and loads company context.
7. Controller calls LangChain/service layer, which:
   - retrieves relevant business context from vector memory,
   - builds contextual prompts,
   - calls AI model(s) (Gemini/Ollama/Imagen).
8. Backend stores generated output + updates usage and deducts credits.
9. Backend returns result to frontend.
10. Frontend displays generated content and allows follow-up actions (save/history/deploy/send/delete).
11. For payment, user purchases package via Razorpay; backend verifies payment and adds credits.

---

## Interview-Friendly Summary (30-second version)
This project is a full-stack AI digital toolkit for small businesses. It combines website generation, email marketing, chatbot support, image generation, community collaboration, and feedback analytics in one platform. The frontend is built with React, the backend with Express and MongoDB, and AI capabilities are orchestrated through LangChain with contextual memory using vector search. A credit-based subscription model controls usage, and integrations like Razorpay and Cloudinary handle payments and media hosting.

---

## Notes for Explaining in Interviews
- Emphasize **product thinking**: one platform replacing multiple disconnected tools.
- Emphasize **AI architecture**: contextual retrieval + prompt orchestration + multi-model fallback.
- Emphasize **engineering trade-offs**: middleware security, credit governance, modular routes/controllers/services.
- Emphasize **real-world readiness**: auth, logging, payment verification, environment config, deployable client/server split.