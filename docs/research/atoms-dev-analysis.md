# Atoms.dev 深度调研报告

> 调研日期: 2026-03-01
> 目标: 复刻 Atoms.dev 网站

## 1. 平台概述

### 基本信息
- **名称**: Atoms.dev (原名 MetaGPT X / MGX)
- **类型**: AI驱动的无代码平台，用于构建网站和应用
- **标语**: "Turn ideas into products that sell"
- **核心特点**: 多智能体AI系统，模拟完整的软件开发团队

### 公司背景
- 基于开源项目 MetaGPT (54,000+ GitHub Stars)
- 获得 $31M A轮和A+轮融资
- 关联项目: OpenManus, Foundation Agents

---

## 2. 技术栈分析

### 前端技术
| 技术 | 说明 |
|------|------|
| **框架** | Nuxt.js (Vue.js) |
| **UI库** | PrimeVue (100+ 组件) |
| **状态管理** | Pinia |
| **样式** | CSS Variables + 自定义主题 |

### 基础设施
| 服务 | 配置 |
|------|------|
| **CDN** | public-frontend-cos.metadl.com |
| **部署域名** | atoms.world |
| **主域名** | atoms.dev |
| **Docs域名** | docs.atoms.dev |

### 集成服务
- **数据库**: Supabase (PostgreSQL, Auth, Realtime)
- **支付**: Stripe
- **分析**: PostHog, Sentry, Google Analytics
- **社交追踪**: TikTok, Reddit, LinkedIn pixels
- **CDN**: Cloudflare

### Nuxt配置摘要
```javascript
{
  BASE_URL: "https://atoms.dev/",
  MODE: "prod",
  cdnPath: "https://public-frontend-cos.metadl.com",
  isAtoms: true
}
```

---

## 3. AI 智能体系统

### 团队成员
| 角色 | 名称 | 职责 |
|------|------|------|
| Team Leader | Mike | 协调团队处理请求 |
| Product Manager | Emma | 生成PRD，对齐产品目标与市场需求 |
| Architect | Bob | 设计精简但完整的软件系统 |
| Project Manager | Eve | 根据PRD/技术设计分解任务 |
| Engineer | Alex | 游戏、应用和Web开发 |
| Data Analyst | David | 数据分析、ML、深度学习、Web爬虫等 |
| Deep Researcher | Iris | 深度研究、分析和整合海量信息 |
| SEO Specialist | Sarah | 提升网站可见性和自然流量 |

### 核心功能
1. **Vibe Coding** - 自然语言转工作软件
2. **Race Mode** - 多AI并行编码，选择最佳结果
3. **Deep Research** - Iris智能体深度研究
4. **One-Click Deployment** - 一键部署到 atoms.world
5. **GitHub Integration** - 代码导出和同步
6. **Stripe Integration** - 内置支付处理

---

## 4. 支持的 LLM 模型

### Claude (Anthropic)
- Claude Opus 4.6
- Claude Sonnet 4.6, 4.5, 4, 3.7

### GPT (OpenAI)
- GPT-5, GPT-5-Chat
- GPT-4o, GPT-4o-mini

### Gemini (Google)
- Gemini 3.1 Pro Preview, 3 Pro Preview, 3 Flash Preview
- Gemini 2.5 Pro, 2.5 Flash

### 其他
- DeepSeek V3.2, V3.2-Exp, V3
- Qwen3 Coder Plus
- GLM-5, GLM-4.7

---

## 5. 定价模型

### 积分系统
- 每日积分 + 每月积分
- 自动使用顺序: 每日积分 → 订阅积分 → 奖励积分

### 计划详情
| 计划 | 价格 | 每日积分 | 每月积分 | 特点 |
|------|------|----------|----------|------|
| **Free** | $0/月 | 15 | 2,500,000 | 永久免费 |
| **Pro 20** | $20/月 | 15 | 10,000,000 | 10G存储 |
| **Pro 50** | $50/月 | 15 | 25,000,000 | 10G存储 |
| **Pro 70** | $70/月 | 15 | 35,000,000 | 10G存储 |
| **Max 100** | $100/月 | 15 | 50,000,000 | Race Mode, 100G存储 |
| **Max 200-3000** | $200-$3000/月 | 15 | 100M-1500M | 更高准确度 |

### 年付优惠
- 年付享 ~18% 折扣

---

## 6. 网站结构

### 页面路由
```
/                 - 首页 (Landing Page)
/pricing          - 定价页
/blog             - 博客列表
/blog/:slug       - 博客详情
/video            - 视频库
/metagpt          - MetaGPT介绍
/app/:id          - 应用详情/编辑
/share/:id        - 分享应用
```

### 导航结构
```
Header:
├── Logo (Atoms)
├── Pricing
├── Resources
│   ├── Blog
│   ├── Use Cases
│   ├── Videos
│   └── GitHub
├── Log in
└── Sign up

Footer:
├── Product: Pricing, ChangeLog, Help center
├── Resources: Blog, Use Cases, Videos, GitHub
├── About: MetaGPT, OpenManus, Foundation Agents, Privacy Policy, Terms of Service
├── Community: Affiliates, Explorer Program, X/Twitter, LinkedIn, Discord
└── Language Selector
```

---

## 7. PrimeVue 组件清单

### 表单组件
AutoComplete, Calendar, CascadeSelect, Checkbox, Chips, ColorPicker, DatePicker,
Dropdown, FloatLabel, InputChips, InputGroup, InputMask, InputNumber, InputOtp,
InputSwitch, InputText, Knob, Listbox, MultiSelect, Password, RadioButton,
Rating, Select, SelectButton, Slider, Textarea, ToggleButton, ToggleSwitch, TreeSelect

### 按钮组件
Button, ButtonGroup, SpeedDial, SplitButton

### 数据展示
DataTable, DataView, Column, Row, ColumnGroup, OrderList, OrganizationChart,
Paginator, PickList, Tree, TreeTable, Timeline, VirtualScroller

### 面板组件
Accordion, Card, DeferredContent, Divider, Fieldset, Panel, ScrollPanel,
Splitter, Stepper, TabView, Tabs, Toolbar

### 覆盖层
ConfirmDialog, ConfirmPopup, Dialog, Drawer, DynamicDialog, OverlayPanel,
Popover, Sidebar

### 导航
Breadcrumb, ContextMenu, Dock, Menu, Menubar, MegaMenu, PanelMenu, Steps,
TabMenu, TieredMenu

### 消息
Message, InlineMessage, Toast

### 媒体
Carousel, Galleria, Image, ImageCompare

### 其他
Avatar, Badge, BlockUI, Chip, Inplace, MeterGroup, OverlayBadge, ScrollTop,
Skeleton, ProgressBar, ProgressSpinner, Tag, Terminal, FileUpload

---

## 8. 状态管理 (Pinia Stores)

```javascript
// 主要 Store 结构
stores: {
  device: { isMobile, isTablet, isDesktop, isNoLocked },
  theme: {},
  global: {
    chatVisible, activePannel, allChatVisible, panelMode,
    webConfig, clientId, localAvatarUrl, discordBannerVisible
  },
  mainChat: {
    chatFetching, chatList, boNLoading, allowBoN,
    chatGrid, funcseaAble, chatPanelMode
  },
  settings: { settingsVisible, currentSettingKey },
  plan: { plan, subscriptionLoading, currentPaymentInfo, paymentModalVisible },
  chatConfig: {
    default_model, channelVisible, messageAvatarVisible,
    basic_models, adv_models, enable_mgx_backend, agent_mode
  },
  intergration_stripe: { stripeAccounts, oAuthLoading, ... },
  secret: { secretList, secretFetching, ... },
  'ai-capability': { modelConfigs, availableModelNames, loading },
  leftUserbox: { plan, user, leftPannelVisible, leftPannelLocked }
}
```

---

## 9. 关键业务逻辑

### 积分消耗规则
1. 每日积分(15)优先使用
2. 然后使用订阅积分
3. 最后使用奖励积分
4. 未使用积分可滚动到下月(仅一个月)

### 升级/降级规则
- **升级**: 立即生效，支付差价
- **降级**: 当前计费周期结束后生效，不退款

### Race Mode (Max计划专属)
- 多个AI智能体并行编码
- 提高准确度最多3倍
- 选择最佳结果

---

## 10. 复刻实施计划

### Phase 1: 基础架构 (Week 1-2)
- [ ] 初始化 Nuxt.js 项目
- [ ] 配置 PrimeVue UI库
- [ ] 设置 Pinia 状态管理
- [ ] 配置 Supabase 后端
- [ ] 实现基础认证系统

### Phase 2: 核心页面 (Week 3-4)
- [ ] Landing Page (首页)
- [ ] Pricing Page (定价页)
- [ ] Blog System (博客系统)
- [ ] Video Library (视频库)
- [ ] User Dashboard

### Phase 3: 聊天系统 (Week 5-6)
- [ ] 聊天界面设计
- [ ] 多智能体可视化
- [ ] 消息流处理
- [ ] 文件上传功能

### Phase 4: AI集成 (Week 7-8)
- [ ] LLM API 集成
- [ ] 智能体系统实现
- [ ] Race Mode 逻辑
- [ ] Deep Research 功能

### Phase 5: 部署与支付 (Week 9-10)
- [ ] Stripe 支付集成
- [ ] 积分系统实现
- [ ] 应用部署功能
- [ ] 自定义域名支持

---

## 11. 技术建议

### 推荐技术栈
```
Frontend: Nuxt.js 3 + PrimeVue 4 + Pinia + TypeScript
Backend: Supabase (PostgreSQL + Auth + Realtime + Storage)
AI: 多LLM API集成 (OpenAI, Anthropic, Google)
Payment: Stripe
Deployment: Vercel / Cloudflare Pages
```

### 关键依赖
```json
{
  "nuxt": "^3.x",
  "primevue": "^4.x",
  "@primevue/forms": "^4.x",
  "pinia": "^2.x",
  "@supabase/supabase-js": "^2.x",
  "stripe": "^14.x"
}
```

---

## 12. 参考资源

- **官网**: https://atoms.dev
- **文档**: https://docs.atoms.dev
- **GitHub (MetaGPT)**: https://github.com/geekan/MetaGPT
- **Twitter**: https://x.com/MetaGPT_
- **Discord**: discord.com/invite/NMrp44aahe
- **LinkedIn**: linkedin.com/showcase/atoms-dev

