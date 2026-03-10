---
name: deployment
type: task
version: 2.0.0
agent: CodeActAgent
triggers:
- deploy
- vercel
- railway
- netlify
- publish
- go live
- 部署
- 发布
- 上线
- 发布上线
- 部署到
---

# Deployment Assistant

When the user wants to deploy their app, execute the deployment workflow.

## Smart Defaults

- **Frontend**: Vercel (default) or Netlify
- **Backend**: Railway (default) or Render
- **Static sites**: Cloudflare Pages

## Workflow

### Step 1: Detect Project Type

Check for:
- `next.config.*` → Next.js
- `nuxt.config.*` → Nuxt 3
- `vite.config.*` → Vite (React/Vue)
- `package.json` with build script → Generic Node

### Step 2: Pre-deployment Checks

```bash
# Ensure build works locally
npm run build

# Check for TypeScript errors
npm run type-check 2>/dev/null || true

# Check environment variables
cat .env.example 2>/dev/null || echo "No .env.example found"
```

### Step 3: Deploy to Vercel (Frontend)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy (will prompt for login if needed)
vercel --prod
```

### Step 4: Deploy to Railway (Backend)

```bash
# Install Railway CLI if needed
npm i -g @railway/cli

# Login and deploy
railway login
railway up
```

### Step 5: Configure Environment Variables

**Vercel:**
```bash
vercel env add NEXT_PUBLIC_API_URL
vercel env add SUPABASE_URL
```

**Railway:**
```bash
railway variables set API_KEY=xxx
railway variables set DATABASE_URL=xxx
```

### Step 6: Report

```
✅ Deployment complete!

🌐 URLs:
- Production: https://your-app.vercel.app
- Preview: https://your-app-git-branch.vercel.app

📋 Checklist:
- ✅ Build succeeded
- ✅ Environment variables set
- ✅ Domain configured (if custom)

⚠️ Remember to:
- Set up CORS for API if separate backend
- Configure custom domain DNS
- Enable HTTPS (automatic on Vercel/Railway)
```

## Platform-Specific Notes

### Vercel
- Auto-detects Next.js, Vite, Nuxt
- Serverless functions in `/api`
- Edge functions supported

### Railway
- Dockerfile or Nixpacks auto-detection
- Persistent volumes available
- PostgreSQL/Redis add-ons

### Netlify
- Use `netlify.toml` for redirects
- Edge functions supported
- Form handling built-in

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check `npm run build` locally first |
| 404 on refresh | Add SPA redirect rule |
| Env vars missing | Use platform dashboard or CLI |
| CORS errors | Set `Access-Control-Allow-Origin` |
