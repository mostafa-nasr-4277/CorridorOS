#!/bin/bash

echo "🚀 Deploying CorridorOS to GitHub Pages"
echo "======================================"

# Navigate to project directory
cd /Users/mnasr/Desktop/COS

echo "📁 Current directory: $(pwd)"
echo "📦 Committing any changes..."

# Add all changes
git add .

# Commit changes
git commit -m "Deploy CorridorOS $(date)"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo "🌐 GitHub Pages will automatically deploy your site"
echo "🔗 Your site will be available at: https://mostafa-nasr-4277.github.io/CorridorOS"
echo ""
echo "📋 To enable GitHub Pages:"
echo "   1. Go to: https://github.com/mostafa-nasr-4277/CorridorOS/settings/pages"
echo "   2. Source: Deploy from a branch"
echo "   3. Branch: main"
echo "   4. Folder: / (root)"
echo "   5. Click Save"
echo ""
echo "⏱️  Deployment usually takes 2-5 minutes after enabling Pages"
