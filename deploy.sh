#!/bin/bash

echo "🚀 Phoenix AI Toolkit - Deployment Preparation"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
echo "  → Installing root dependencies..."
npm install

echo "  → Installing client dependencies..."
cd client && npm install && cd ..

echo "  → Installing server dependencies..."
cd server && npm install && cd ..

# Build client for production
echo "🔨 Building client for production..."
cd client && npm run build && cd ..

# Verify build
if [ -d "client/dist" ]; then
    echo "✅ Client build successful"
else
    echo "❌ Client build failed"
    exit 1
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Push your changes to GitHub"
echo "2. Deploy frontend to Vercel (connects to GitHub automatically)"
echo "3. Deploy backend to Render (connects to GitHub automatically)"
echo ""
echo "🔗 Deployment URLs:"
echo "   Frontend: https://phoenix.vercel.app"
echo "   Backend:  https://phoenix.onrender.com"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
