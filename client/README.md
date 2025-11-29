# Phoenix AI Toolkit - Frontend

A modern React-based frontend for the Phoenix AI Toolkit platform, providing small businesses with AI-powered tools for digital presence management.

## 🚀 Features

- **AI Website Generator** - Create professional websites with AI assistance
- **Email Marketing Suite** - Design and manage email campaigns
- **Smart Chatbot Interface** - Context-aware customer service chatbot
- **Image Generation Studio** - Create marketing visuals with Google Imagen 3
- **Community Platform** - Connect with other businesses
- **Feedback Analytics** - Analyze customer feedback with AI insights

## 🛠️ Tech Stack

- **Framework**: React 19.1 with Vite 7.0
- **Styling**: Tailwind CSS 4.1
- **Routing**: React Router DOM 7.7
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Components**: Lucide React Icons

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Environment Configuration

Create a `.env` file in the client directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
```

See `ENVIRONMENT_CONFIG.md` for detailed configuration options.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard widgets
│   └── Common/         # Shared components
├── website-generator/  # Website creation tools
├── mailer/            # Email marketing suite
├── chatbot/           # AI chatbot interface
├── aiImageGenerator/  # Image generation studio
├── community/         # Community platform
├── contexts/          # React Context providers
├── utils/             # Utility functions
└── assets/            # Static assets
```

## 🔗 API Integration

The frontend connects to the backend API at `VITE_API_URL`. Key endpoints:

- `/auth/*` - Authentication
- `/website/*` - Website generation
- `/chatbot/*` - AI chatbot
- `/media/*` - Image generation
- `/marketing/*` - Email campaigns

## 📱 Responsive Design

The application is fully responsive with:

- Mobile-first design approach
- Tailwind CSS breakpoints
- Adaptive layouts for all screen sizes

## 🚀 Deployment

The project is configured for deployment on Vercel. See `vercel.json` for configuration.

```bash
# Deploy to Vercel
vercel --prod
```

## 📝 Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Part of the Phoenix AI Toolkit** - Built with ❤️ for small businesses
