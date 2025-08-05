#!/bin/bash

# PixelPro Deployment Script
# This script helps you deploy PixelPro to various hosting platforms

echo "🎨 PixelPro Deployment Script"
echo "=============================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Function to deploy to GitHub Pages
deploy_github_pages() {
    echo "🚀 Deploying to GitHub Pages..."
    
    # Check if this is already a git repository
    if [ ! -d ".git" ]; then
        echo "📁 Initializing Git repository..."
        git init
        git add .
        git commit -m "Initial commit: PixelPro pixel art editor"
        echo "✅ Git repository initialized"
    else
        echo "📁 Git repository already exists"
        git add .
        git commit -m "Update: PixelPro pixel art editor" || true
    fi
    
    echo ""
    echo "📋 Next steps for GitHub Pages:"
    echo "1. Create a new repository on GitHub: https://github.com/new"
    echo "2. Name it 'pixelpro' or 'pixel-art-editor'"
    echo "3. Run these commands:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/pixelpro.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo "4. Go to Settings → Pages → Source: Deploy from a branch"
    echo "5. Select 'main' branch and '/ (root)' folder"
    echo "6. Your app will be live at: https://YOUR_USERNAME.github.io/pixelpro"
    echo ""
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "🚀 Deploying to Netlify..."
    
    # Check if netlify-cli is installed
    if ! command -v netlify &> /dev/null; then
        echo "📦 Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    echo "🌐 Opening Netlify deploy page..."
    echo "📋 Instructions:"
    echo "1. Drag and drop this entire folder to the deploy area"
    echo "2. Your app will be live instantly with a random URL"
    echo "3. You can customize the URL in the site settings"
    echo ""
    echo "💡 Alternative: Use 'netlify deploy' command for CLI deployment"
    echo ""
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "🚀 Deploying to Vercel..."
    
    # Check if vercel is installed
    if ! command -v vercel &> /dev/null; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "🌐 Opening Vercel..."
    echo "📋 Instructions:"
    echo "1. Run: vercel"
    echo "2. Follow the prompts to create an account"
    echo "3. Your app will be deployed automatically"
    echo "4. You'll get a URL like: https://pixelpro-YOUR_USERNAME.vercel.app"
    echo ""
}

# Function to create a simple local server
start_local_server() {
    echo "🚀 Starting local development server..."
    
    # Check if Python is available
    if command -v python3 &> /dev/null; then
        echo "🐍 Starting Python HTTP server on port 8000..."
        echo "🌐 Open your browser to: http://localhost:8000"
        echo "📋 Press Ctrl+C to stop the server"
        echo ""
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        echo "🐍 Starting Python HTTP server on port 8000..."
        echo "🌐 Open your browser to: http://localhost:8000"
        echo "📋 Press Ctrl+C to stop the server"
        echo ""
        python -m http.server 8000
    elif command -v node &> /dev/null; then
        echo "📦 Installing and starting Node.js server..."
        npm install -g http-server
        echo "🌐 Open your browser to: http://localhost:8080"
        echo "📋 Press Ctrl+C to stop the server"
        echo ""
        http-server -p 8080
    else
        echo "❌ No suitable server found. Please install Python or Node.js."
        echo "💡 You can also open index.html directly in your browser."
    fi
}

# Function to validate files
validate_files() {
    echo "🔍 Validating project files..."
    
    required_files=("index.html" "style.css" "script-simple.js" "manifest.json")
    missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        echo "✅ All required files are present"
        return 0
    else
        echo "❌ Missing required files:"
        for file in "${missing_files[@]}"; do
            echo "   - $file"
        done
        return 1
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Choose a deployment option:"
    echo "1) Deploy to GitHub Pages (Free, Easy)"
    echo "2) Deploy to Netlify (Free, Professional)"
    echo "3) Deploy to Vercel (Free, Fast)"
    echo "4) Start local development server"
    echo "5) Validate project files"
    echo "6) Show deployment guide"
    echo "7) Exit"
    echo ""
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            deploy_github_pages
            ;;
        2)
            deploy_netlify
            ;;
        3)
            deploy_vercel
            ;;
        4)
            start_local_server
            ;;
        5)
            validate_files
            ;;
        6)
            echo ""
            echo "📖 Opening deployment guide..."
            if command -v open &> /dev/null; then
                open deploy-guide.md
            elif command -v xdg-open &> /dev/null; then
                xdg-open deploy-guide.md
            else
                echo "📄 Please open deploy-guide.md in your text editor"
            fi
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please try again."
            show_menu
            ;;
    esac
}

# Check if files are valid before showing menu
if validate_files; then
    show_menu
else
    echo "❌ Please ensure all required files are present before deploying."
    exit 1
fi 