#!/bin/bash

echo "🚀 Setting up CorridorOS on New Repository"
echo "========================================="

# Navigate to project directory
cd /Users/mnasr/Desktop/COS

echo "📁 Current directory: $(pwd)"
echo ""

# Remove current remote
echo "🔄 Removing current remote..."
git remote remove origin

# Add new remote
echo "🔗 Adding new remote..."
git remote add origin https://github.com/mostafa-nasr-4277/CorridorOS.git

echo ""
echo "📋 Next steps:"
echo "1. You'll need to authenticate with the new GitHub account"
echo "2. Run: git push -u origin main --force"
echo ""
echo "🔐 Authentication options:"
echo "   - Use GitHub CLI: gh auth login"
echo "   - Use Personal Access Token when prompted"
echo "   - Or use SSH keys if configured"
echo ""

# Show current status
echo "📊 Current status:"
echo "   Remote: $(git remote get-url origin)"
echo "   Branch: $(git branch --show-current)"
echo "   Files: $(git ls-files | wc -l) tracked files"
echo ""

echo "✅ Repository setup complete!"
echo "🌐 After pushing, enable GitHub Pages at:"
echo "   https://github.com/mostafa-nasr-4277/CorridorOS/settings/pages"
