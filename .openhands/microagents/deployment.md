---
name: deployment
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
- deploy
- vercel
- 部署
- 上线
- netlify
- cloudflare
---

# 项目部署指南

Atoms Plus 支持多种部署平台，推荐使用 Vercel 进行一键部署。

## Vercel 部署

### 方式一：CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署（自动检测框架）
vercel

# 部署到生产环境
vercel --prod
```

### 方式二：Git 集成

1. 将项目推送到 GitHub/GitLab/Bitbucket
2. 在 Vercel Dashboard 导入项目
3. 配置环境变量
4. 自动部署

### 环境变量配置

在 Vercel Dashboard 或使用 CLI 配置：

```bash
# 添加环境变量
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# 查看环境变量
vercel env ls
```

## Netlify 部署

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 登录
netlify login

# 初始化项目
netlify init

# 部署
netlify deploy --prod
```

### netlify.toml 配置

```toml
[build]
  command = "npm run build"
  publish = "dist"  # 或 "out" for Next.js static

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Cloudflare Pages 部署

```bash
# 安装 Wrangler CLI
npm i -g wrangler

# 登录
wrangler login

# 创建项目
wrangler pages project create my-project

# 部署
wrangler pages deploy dist
```

## 框架特定配置

### Next.js

```javascript
// next.config.mjs
export default {
  output: 'standalone', // 用于 Docker 部署
  // 或
  output: 'export',     // 用于静态部署
};
```

### Nuxt 3

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel', // 或 'netlify', 'cloudflare-pages'
  }
});
```

### Vite (React/Vue)

```typescript
// vite.config.ts
export default defineConfig({
  base: '/', // 设置基础路径
  build: {
    outDir: 'dist',
  }
});
```

## 自定义域名

### Vercel

1. 在 Dashboard 进入 Project Settings > Domains
2. 添加域名（如 `app.example.com`）
3. 按提示配置 DNS 记录

### DNS 配置示例

```
类型    名称    值
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

## 部署检查清单

- [ ] 所有环境变量已配置
- [ ] 构建命令正确（`npm run build`）
- [ ] 输出目录正确（`dist`/`out`/`.next`）
- [ ] 域名 DNS 已配置
- [ ] HTTPS 已启用
- [ ] 404 页面已配置
- [ ] SEO meta 标签已添加

## 常见问题

### 构建失败

```bash
# 本地测试构建
npm run build

# 检查 TypeScript 错误
npm run type-check
```

### 环境变量未生效

- 确保变量名以 `NEXT_PUBLIC_` 或 `VITE_` 开头（客户端可访问）
- 重新部署以应用新变量

