# CorridorOS Netlify Deployment Guide

## 🚀 Quick Deploy (Recommended)

### Option 1: Drag & Drop (Easiest)
1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag the entire COS folder to the "Deploy manually" area
3. Wait for deployment to complete
4. Get your free domain: `https://random-name-123456.netlify.app`

### Option 2: Git Integration
1. Push your code to GitHub/GitLab
2. Connect your repository to Netlify
3. Set build command: (leave empty)
4. Set publish directory: `.` (root)
5. Deploy automatically on every push

## 🔧 Manual Setup

### Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Login to Netlify
```bash
netlify login
```

### Deploy
```bash
./deploy_netlify.sh
```

## 🌐 Custom Domain Setup

### Free Subdomain
- Netlify provides: `https://your-site-name.netlify.app`
- Automatic HTTPS included
- No configuration needed

### Custom Domain (Later)
1. Buy domain from Namecheap, GoDaddy, etc.
2. Add domain in Netlify dashboard
3. Update DNS records
4. Automatic SSL certificate

## 📁 File Structure
```
COS/
├── index.html              # Landing page
├── corridoros_detailed.html # Main OS simulator (renamed from advanced)
├── corridoros_dashboard.html # Engineering dashboard
├── corridoros_simulator.html # Quick demo
├── netlify.toml            # Netlify configuration
├── deploy_netlify.sh       # Deployment script
└── ... (other files)
```

## ⚙️ Configuration

### netlify.toml
- Redirects root to main simulator
- Security headers
- HTTPS enforcement

### Features Included
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Custom 404 pages
- ✅ Form handling
- ✅ Branch previews
- ✅ Continuous deployment

## 🎯 URLs After Deployment
- **Main Site**: `https://your-site.netlify.app/`
- **OS Simulator**: `https://your-site.netlify.app/corridoros_detailed.html`
- **Dashboard**: `https://your-site.netlify.app/dashboard`
<!-- Quick Demo removed in v4: simulator page no longer linked. -->

## 🔒 Security Features
- HTTPS enforced
- Security headers
- XSS protection
- Content type protection
- Frame options

## 📊 Monitoring
- Netlify Analytics (free tier)
- Build logs
- Deploy previews
- Performance insights
