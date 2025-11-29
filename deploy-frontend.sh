#!/bin/bash

# Frontend Deployment Script for Forex AI Trader
# This script deploys your React frontend to Vercel

set -e  # Exit on any error

echo "🚀 Starting frontend deployment for Forex AI Trader..."

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the frontend directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo "🏗️  Building the frontend..."
npm run build

echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Frontend deployment successful!"
echo "🌐 Your trading bot frontend is now live!"
echo ""
echo "📊 Next steps:"
echo "   1. Test your frontend at the provided URL"
echo "   2. Verify it connects to your backend"
echo "   3. Monitor performance in Vercel dashboard"
echo ""
echo "💰 Cost: FREE with Vercel!"
echo "   - Unlimited static hosting"
echo "   - Global CDN"
echo "   - Automatic HTTPS"
