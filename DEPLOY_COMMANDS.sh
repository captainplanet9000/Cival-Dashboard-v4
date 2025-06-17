#!/bin/bash

# Fresh Repository Deployment Commands
# Run these commands after creating the repository on GitHub

echo "🚀 Deploying to Fresh Repository..."

# Replace YOUR_REPO_NAME with the actual repository name you created
REPO_NAME="cival-deploy-$(date +%Y%m%d-%H%M%S)"

# Add the fresh repository remote
git remote add fresh https://github.com/captainplanet9000/${REPO_NAME}.git

# Push the clean deployment branch to main
git push fresh clean-deploy:main

# Verify the push
echo "✅ Deployment completed!"
echo "📍 Repository URL: https://github.com/captainplanet9000/${REPO_NAME}"
echo "🔗 Railway Deployment: Connect this repository to Railway"

# Railway deployment commands
echo ""
echo "🚂 Railway Deployment Steps:"
echo "1. Go to railway.app"
echo "2. Click 'New Project'"
echo "3. Select 'Deploy from GitHub repo'"
echo "4. Choose: captainplanet9000/${REPO_NAME}"
echo "5. Railway will auto-detect Next.js and deploy"

echo ""
echo "🔧 Environment Variables Needed in Railway:"
echo "NODE_ENV=production"
echo "NEXT_PUBLIC_API_URL=https://your-backend-url"
echo "DATABASE_URL=your-supabase-database-url"
echo "REDIS_URL=your-redis-url"