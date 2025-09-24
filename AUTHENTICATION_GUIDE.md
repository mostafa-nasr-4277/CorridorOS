# 🔐 Authentication Guide for New GitHub Repository

## Current Issue
You're authenticated as `mostafanasrrsp` but trying to push to `mostafa-nasr-4277/CorridorOS`. You need to authenticate with the correct account.

## Solutions

### Option 1: Use GitHub CLI (Recommended)
```bash
# Install GitHub CLI if not installed
brew install gh

# Login with the new account
gh auth login

# Select GitHub.com
# Select HTTPS
# Authenticate via web browser
# Login as mostafa-nasr-4277

# Then push
git push -u origin main --force
```

### Option 2: Use Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Generate new token (Classic)
3. Select scopes: `repo`, `workflow`
4. Copy the token
5. When git asks for password, use the token instead

### Option 3: Use SSH Keys
1. Generate SSH key: `ssh-keygen -t ed25519 -C "your-email@example.com"`
2. Add to SSH agent: `ssh-add ~/.ssh/id_ed25519`
3. Add public key to GitHub: https://github.com/settings/keys
4. Change remote to SSH: `git remote set-url origin git@github.com:mostafa-nasr-4277/CorridorOS.git`

### Option 4: Clone Fresh Repository
```bash
cd ..
git clone https://github.com/mostafa-nasr-4277/CorridorOS.git CorridorOS_new
cd CorridorOS_new
cp -r ../COS/* .
cp -r ../COS/.* . 2>/dev/null || true
git add .
git commit -m "Initial CorridorOS deployment"
git push origin main
```

## After Successful Push

1. **Enable GitHub Pages:**
   - Go to: https://github.com/mostafa-nasr-4277/CorridorOS/settings/pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Save

2. **Your site will be live at:**
   https://mostafa-nasr-4277.github.io/CorridorOS

3. **Custom domain (optional):**
   - Add your custom domain in Pages settings
   - Configure DNS to point to GitHub Pages

## Troubleshooting

- **403 Error**: Wrong account authentication
- **Permission denied**: Need to authenticate with correct account
- **Repository not found**: Check repository name and permissions
