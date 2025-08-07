#!/bin/bash

# PixelPro Deployment Script
# This script helps deploy PixelPro to various hosting platforms

echo "🎨 PixelPro Deployment Script"
echo "=============================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Please run this script from the PixelPro directory"
    exit 1
fi

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: PixelPro pixel art editor"
fi

echo ""
echo "🌐 Choose your deployment platform:"
echo "1. GitHub Pages (Free)"
echo "2. Netlify (Free, recommended)"
echo "3. Vercel (Free)"
echo "4. Firebase Hosting (Free)"
echo "5. Manual deployment"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Deploying to GitHub Pages..."
        echo ""
        echo "📋 Steps to deploy to GitHub Pages:"
        echo "1. Create a new repository on GitHub"
        echo "2. Push your code to GitHub:"
        echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
        echo "   git branch -M main"
        echo "   git push -u origin main"
        echo "3. Go to repository Settings > Pages"
        echo "4. Select 'Deploy from a branch' and choose 'main'"
        echo "5. Your site will be available at: https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"
        ;;
    2)
        echo "🚀 Deploying to Netlify..."
        echo ""
        echo "📋 Steps to deploy to Netlify:"
        echo "1. Go to https://netlify.com and sign up/login"
        echo "2. Click 'New site from Git'"
        echo "3. Connect your GitHub account"
        echo "4. Select your PixelPro repository"
        echo "5. Deploy settings:"
        echo "   - Build command: (leave empty)"
        echo "   - Publish directory: ."
        echo "6. Click 'Deploy site'"
        echo "7. Your site will be available at the provided URL"
        ;;
    3)
        echo "🚀 Deploying to Vercel..."
        echo ""
        echo "📋 Steps to deploy to Vercel:"
        echo "1. Go to https://vercel.com and sign up/login"
        echo "2. Click 'New Project'"
        echo "3. Import your GitHub repository"
        echo "4. Configure project:"
        echo "   - Framework Preset: Other"
        echo "   - Root Directory: ."
        echo "5. Click 'Deploy'"
        echo "6. Your site will be available at the provided URL"
        ;;
    4)
        echo "🚀 Deploying to Firebase Hosting..."
        echo ""
        echo "📋 Steps to deploy to Firebase:"
        echo "1. Install Firebase CLI: npm install -g firebase-tools"
        echo "2. Login to Firebase: firebase login"
        echo "3. Initialize Firebase: firebase init hosting"
        echo "4. Configure:"
        echo "   - Public directory: ."
        echo "   - Single-page app: Yes"
        echo "5. Deploy: firebase deploy"
        echo "6. Your site will be available at the provided URL"
        ;;
    5)
        echo "📁 Manual Deployment Options:"
        echo ""
        echo "You can deploy to any static hosting service:"
        echo "- Upload all files to your hosting provider"
        echo "- Ensure index.html is in the root directory"
        echo "- Configure your server to serve index.html for all routes"
        echo ""
        echo "Alternative local server for testing:"
        echo "python3 -m http.server 8000"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment instructions provided!"
echo ""
echo "💡 Tips:"
echo "- Make sure all your files are committed to git"
echo "- Test locally first: python3 -m http.server 8000"
echo "- Check browser console for any errors"
echo "- Update the README.md with your live URL once deployed"
echo ""
echo "🎨 Happy pixel art creating!" 