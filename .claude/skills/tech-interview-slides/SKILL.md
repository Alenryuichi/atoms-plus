---
name: tech-interview-slides
description: 创建高信息密度的技术面试演示文稿。Neon Cyber 深色科技风格，支持深度解析弹窗、架构图、难点卡片、代码块。适用于技术面试、架构分享、项目展示。
triggers:
  - 面试 PPT
  - 技术演示
  - presentation
  - slides
  - 幻灯片
  - 架构分享
  - 项目展示
  - interview slides
  - tech presentation
---

# Tech Interview Slides Skill

> **核心理念**: 用最小的高信号 token 集合，创建面试级别的技术演示文稿。

## 何时使用

✅ 用户说："帮我做一个技术面试的 PPT"
✅ 用户说："创建项目展示的幻灯片"
✅ 用户说："做一个架构分享的演示文稿"

## 核心原则 (5 条)

| 原则 | 说明 |
|------|------|
| **高信息密度** | 每页承载大量技术要点，通过卡片、网格、标签组织 |
| **深度解析弹窗** | 主幻灯片展示概览，点击"📖 深度解析"展开详情 |
| **面试导向** | 每个技术点都有"面试加分点"标签 |
| **零依赖** | 单 HTML 文件，内联 CSS/JS |
| **视口适配** | 每页 100dvh，clamp() 响应式 |

## 风格规范：Neon Cyber

### 配色方案

```css
:root {
    /* 背景色 */
    --bg-primary: #0a0a0f;     /* 深黑底色 */
    --bg-secondary: #12121a;   /* 卡片背景 */
    --bg-tertiary: #1a1a24;    /* 嵌套卡片 */

    /* 文字色 */
    --text-primary: #ffffff;
    --text-secondary: #a0a0b0;

    /* 强调色 */
    --accent: #00ff88;           /* 主强调 - 霓虹绿 */
    --accent-secondary: #00ccff; /* 次强调 - 霓虹蓝 */
    --accent-glow: rgba(0, 255, 136, 0.3);
    --orange: #fd6f32;           /* 警告/难点标记 */
    --orange-glow: rgba(253, 111, 50, 0.3);
}
```

### 字体配置

```css
/* 必须引入 Fontshare */
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700&display=swap">

--font-display: 'Clash Display', sans-serif;  /* 标题 */
--font-body: 'Satoshi', sans-serif;           /* 正文 */
/* 代码块使用 JetBrains Mono 或 Fira Code */
```

### 响应式字号 (必须使用 clamp)

```css
--title-size: clamp(2rem, 5vw, 4rem);
--h2-size: clamp(1.5rem, 3.5vw, 2.5rem);
--h3-size: clamp(1.1rem, 2vw, 1.5rem);
--body-size: clamp(0.8rem, 1.3vw, 1.1rem);
--small-size: clamp(0.7rem, 1vw, 0.9rem);
```

---

## 背景效果

### 渐变背景 (gradient-bg)

```css
.gradient-bg {
    background:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 255, 136, 0.15), transparent),
        radial-gradient(ellipse 60% 40% at 80% 50%, rgba(0, 204, 255, 0.08), transparent),
        radial-gradient(ellipse 50% 30% at 20% 80%, rgba(253, 111, 50, 0.05), transparent);
}
```

### 网格背景 (grid-bg)

```css
.grid-bg {
    background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
}
```

### 组合使用

```html
<section class="slide gradient-bg grid-bg">
    <!-- 同时应用渐变 + 网格背景 -->
</section>
```

---

## 核心组件库

### 1. 基础幻灯片结构

```html
<section class="slide gradient-bg grid-bg">
    <div class="slide-content">
        <span class="section-label reveal">SECTION_NAME</span>
        <h2 class="reveal">幻灯片标题</h2>

        <!-- 内容区域 -->
        <div class="reveal">
            <!-- 组件 -->
        </div>
    </div>
    <!-- 可选：深度解析按钮 -->
    <button class="detail-btn" onclick="openModal('modal-id')">深度解析</button>
</section>
```

### 2. Section Label (章节标签)

```html
<span class="section-label">TECHNICAL OVERVIEW</span>
```

```css
.section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: var(--small-size);
    font-weight: 500;
    color: var(--accent);
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.section-label::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent-glow);
}
```

### 3. Problem/Solution/Why Box (问题/方案/哲学框)

```html
<!-- 问题框 (红色边框) -->
<div class="problem-box">
    <div class="problem-label">问题</div>
    <p>LLM 生成的代码不可信，可能包含恶意命令</p>
</div>

<!-- 解决方案框 (绿色边框) -->
<div class="solution-box">
    <div class="solution-label">方案</div>
    <p>使用 Sandbox 沙盒隔离执行</p>
</div>

<!-- 设计哲学框 (强调色边框) -->
<div class="why-box">
    <div class="why-label">设计哲学</div>
    <p><strong>Zero Trust 原则</strong> — 永不信任 LLM 输出</p>
</div>
```

```css
.problem-box {
    background: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-left: 3px solid #f87171;
    border-radius: 8px;
    padding: clamp(0.6rem, 1.2vw, 1rem) clamp(0.8rem, 1.5vw, 1.2rem);
}

.solution-box {
    background: rgba(52, 211, 153, 0.08);
    border: 1px solid rgba(52, 211, 153, 0.2);
    border-left: 3px solid #34d399;
    border-radius: 8px;
    padding: clamp(0.6rem, 1.2vw, 1rem) clamp(0.8rem, 1.5vw, 1.2rem);
}

.why-box {
    background: rgba(0, 255, 136, 0.06);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-left: 3px solid var(--accent);
    border-radius: 8px;
    padding: clamp(0.6rem, 1.2vw, 1rem) clamp(0.8rem, 1.5vw, 1.2rem);
}
```

### 4. 难点卡片 (Challenge Card)

用于展示"难点 + 解决方案"的配对卡片：

```html
<div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:0.5rem;">
    <div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:0.3rem;">
        <span style="background:#ef4444;color:white;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.75em;font-weight:600;">难点 1</span>
        <strong style="color:#f87171;">代码执行安全</strong>
    </div>
    <p style="font-size:0.85em;color:var(--text-secondary);">LLM 生成的代码不可信</p>
    <div style="background:rgba(52,211,153,0.1);border-left:3px solid #34d399;padding:0.3rem 0.5rem;margin-top:0.3rem;">
        <strong style="color:#34d399;font-size:0.8em;">✅ 解决方案：Sandbox 沙盒隔离</strong>
        <ul style="margin:0.2rem 0 0 1rem;font-size:0.8em;color:var(--text-secondary);">
            <li>ProcessSandbox — 进程隔离</li>
            <li>DaytonaSandbox — 云端 VM</li>
        </ul>
    </div>
</div>
```

**颜色变体：**
| 难点编号 | 背景色 | 边框色 | 标签色 |
|---------|--------|--------|--------|
| 难点 1 | `rgba(239,68,68,0.05)` | `#ef4444` | 红 |
| 难点 2 | `rgba(249,115,22,0.05)` | `#f97316` | 橙 |
| 难点 3 | `rgba(234,179,8,0.05)` | `#eab308` | 黄 |
| 难点 4 | `rgba(99,102,241,0.05)` | `#6366f1` | 靛 |
| 难点 5 | `rgba(236,72,153,0.05)` | `#ec4899` | 粉 |
| 难点 6 | `rgba(20,184,166,0.05)` | `#14b8a6` | 青 |

### 5. Flow Node (流程节点)

```html
<div class="flow">
    <div class="flow-node">User Input</div>
    <span class="flow-arrow">→</span>
    <div class="flow-node active">Agent</div>
    <span class="flow-arrow">→</span>
    <div class="flow-node success">Output</div>
</div>
```

```css
.flow-node {
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(0.6rem, 0.9vw, 0.8rem);
    padding: 0.4em 0.8em;
    border-radius: 6px;
    background: var(--bg-tertiary);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-secondary);
}

.flow-node.active {
    border-color: rgba(0, 255, 136, 0.3);
    color: var(--accent);
    background: rgba(0, 255, 136, 0.1);
}

.flow-node.success {
    border-color: rgba(52, 211, 153, 0.3);
    color: #34d399;
    background: rgba(52, 211, 153, 0.1);
}

.flow-node.warn {
    border-color: rgba(251, 191, 36, 0.3);
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.1);
}
```

### 6. 架构层级图 (Architecture Diagram)

```html
<div class="arch-diagram">
    <div class="arch-layer">
        <span class="arch-layer-name">Entry Layer</span>
        <div class="arch-layer-content">
            <span class="arch-item">React SPA</span>
            <span class="arch-item">FastAPI</span>
        </div>
    </div>
    <div class="arch-layer orange">
        <span class="arch-layer-name">Core Engine</span>
        <div class="arch-layer-content">
            <span class="arch-item orange">Controller</span>
            <span class="arch-item orange">Agent</span>
        </div>
    </div>
</div>
```

### 7. 代码块 (Code Block)

```html
<div class="code-block">
    <pre><span class="comment"># Controller 核心循环</span>
<span class="keyword">async def</span> <span class="function">_step</span>(self):
    action = agent.<span class="function">step</span>(state)
    <span class="keyword">return</span> action</pre>
</div>
```

```css
.code-block {
    background: var(--bg-secondary);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 8px;
    padding: clamp(0.75rem, 1.5vw, 1rem);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: clamp(0.65rem, 0.9vw, 0.85rem);
    overflow-x: auto;
    line-height: 1.5;
}

.code-block .keyword { color: #ff79c6; }
.code-block .string { color: #f1fa8c; }
.code-block .function { color: #50fa7b; }
.code-block .comment { color: #6272a4; }
.code-block .class { color: #8be9fd; }
```

### 8. 技术标签 (Modal Tag)

```html
<span class="modal-tag">Factory Pattern</span>
<span class="modal-tag">Strategy Pattern</span>
<span class="modal-tag">Event Sourcing</span>
```

```css
.modal-tag {
    display: inline-block;
    background: rgba(99,102,241,0.2);
    color: var(--accent-secondary);
    padding: 0.2em 0.6em;
    border-radius: 4px;
    font-size: 0.75rem;
    margin-right: 0.3em;
    margin-bottom: 0.3em;
}
```

### 9. 统计卡片 (Stat Card)

```html
<div class="stat-grid">
    <div class="stat-card">
        <div class="stat-number">17+</div>
        <div class="stat-label">LLM 提供商</div>
    </div>
    <div class="stat-card">
        <div class="stat-number orange">50K+</div>
        <div class="stat-label">Token 上限</div>
    </div>
</div>
```

```css
.stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: clamp(0.5rem, 1vw, 1rem);
}

.stat-card {
    background: var(--bg-secondary);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: clamp(0.75rem, 1.5vw, 1.25rem);
    text-align: center;
}

.stat-number {
    font-family: 'Clash Display', sans-serif;
    font-size: clamp(1.5rem, 3vw, 2.5rem);
    font-weight: 700;
    color: var(--accent);
    line-height: 1.2;
}

.stat-number.orange { color: var(--orange); }
.stat-label { font-size: var(--small-size); color: var(--text-secondary); }
```

### 10. 三列网格布局 (Three Column Grid)

用于展示三个并列的内容块（如 Slide 2 的"核心引擎 / 安全扩展 / 工程实践"）：

```html
<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:0.4rem;font-size:0.72em;">
    <div>
        <div style="background:rgba(0,255,136,0.1);border:1px solid var(--accent);border-radius:6px;padding:0.3rem;text-align:center;">
            <div style="color:var(--accent);font-weight:600;font-size:0.8em;">🧠 核心引擎</div>
        </div>
        <!-- 子项目 -->
    </div>
    <div><!-- 第二列 --></div>
    <div><!-- 第三列 --></div>
</div>
```

### 11. 虚线边框 + ReAct Loop (Dashed Border)

用于强调重要的流程或算法框：

```html
<div style="border:2px dashed var(--accent);border-radius:8px;padding:0.4rem;background:rgba(99,102,241,0.05);">
    <div style="text-align:center;font-size:0.7em;color:var(--accent);margin-bottom:0.3rem;">⟳ ReAct Loop</div>
    <div style="display:flex;flex-direction:column;gap:0.15rem;font-size:0.7em;">
        <div style="display:flex;align-items:center;gap:0.3rem;">
            <span style="color:var(--accent);font-weight:bold;">1.</span>
            <span>Observe → 感知环境</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.3rem;">
            <span style="color:var(--accent);font-weight:bold;">2.</span>
            <span>Think → 推理决策</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.3rem;">
            <span style="color:var(--accent);font-weight:bold;">3.</span>
            <span>Act → 执行动作</span>
        </div>
    </div>
</div>
```

### 12. 表格样式 (Table)

用于对比展示（如 Sandbox 隔离对比表）：

```html
<table style="width:100%;font-size:0.9em;border-collapse:collapse;">
    <tr style="border-bottom:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);">
        <th style="text-align:left;padding:0.5em;">隔离维度</th>
        <th style="text-align:center;padding:0.5em;">ProcessSandbox</th>
        <th style="text-align:center;padding:0.5em;">DaytonaSandbox</th>
    </tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
        <td style="padding:0.5em;">🔒 文件系统</td>
        <td style="text-align:center;padding:0.5em;">进程隔离</td>
        <td style="text-align:center;padding:0.5em;color:var(--accent);">✅ VM 隔离</td>
    </tr>
</table>
```

### 13. 状态标签 (State Labels)

用于展示状态机的各个状态：

```html
<div style="display:flex;gap:0.3rem;flex-wrap:wrap;">
    <span style="background:#3b82f6;color:white;padding:0.1em 0.3em;border-radius:3px;font-size:0.75em;">LOADING</span>
    <span style="background:#22c55e;color:white;padding:0.1em 0.3em;border-radius:3px;font-size:0.75em;">RUNNING</span>
    <span style="background:#fbbf24;color:black;padding:0.1em 0.3em;border-radius:3px;font-size:0.75em;">AWAITING</span>
    <span style="background:#8b5cf6;color:white;padding:0.1em 0.3em;border-radius:3px;font-size:0.75em;">FINISHED</span>
    <span style="background:#ef4444;color:white;padding:0.1em 0.3em;border-radius:3px;font-size:0.75em;">ERROR</span>
</div>
```

### 14. 嵌套属性网格 (Nested Property Grid)

用于展示对象的属性列表：

```html
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.15rem;font-size:0.65em;">
    <div style="background:rgba(99,102,241,0.1);padding:0.15em 0.3em;border-radius:4px;">
        <strong>history</strong>: list[Event]
    </div>
    <div style="background:rgba(99,102,241,0.1);padding:0.15em 0.3em;border-radius:4px;">
        <strong>max_iterations</strong>: int
    </div>
    <div style="background:rgba(99,102,241,0.1);padding:0.15em 0.3em;border-radius:4px;">
        <strong>iteration</strong>: int
    </div>
    <div style="background:rgba(99,102,241,0.1);padding:0.15em 0.3em;border-radius:4px;">
        <strong>outputs</strong>: dict
    </div>
</div>
```

### 15. 内联代码 (Inline Code)

```html
<p>使用 <code>rm -rf /</code> 删除文件，或调用 <code>subprocess.Popen</code> 创建进程。</p>
```

```css
code {
    background: rgba(0, 255, 136, 0.1);
    color: var(--accent);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
}
```

---

## 深度解析弹窗 (Detail Modal)

每个技术幻灯片可配套一个深度解析弹窗，展开后显示详细说明、代码示例、面试加分点。

### 触发按钮

```html
<button class="detail-btn" onclick="openModal('modal-state')">深度解析</button>
```

```css
.detail-btn {
    position: absolute;
    bottom: calc(var(--slide-padding) + 0.5rem);
    right: calc(var(--slide-padding) + 0.5rem);
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%);
    color: var(--bg-primary);
    border: none;
    padding: 0.6em 1.2em;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px var(--accent-glow);
    z-index: 100;
    transition: transform 0.2s, box-shadow 0.2s;
}

.detail-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px var(--accent-glow);
}

.detail-btn::before {
    content: '📖';
    margin-right: 0.4em;
}
```

### 弹窗外层 (Modal Overlay)

```css
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s;
}

.modal-overlay.active {
    opacity: 1;
    visibility: visible;
}
```

### 弹窗内容 (Modal Content)

```css
.modal-content {
    background: var(--bg-secondary);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: clamp(1.5rem, 3vw, 2.5rem);
    max-width: 900px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    transform: translateY(20px);
    transition: transform 0.3s;
}

.modal-overlay.active .modal-content {
    transform: translateY(0);
}
```

### 弹窗结构

```html
<div class="modal-overlay" id="modal-state">
    <div class="modal-content">
        <button class="modal-close" onclick="closeModal('modal-state')">✕</button>
        <h3 class="modal-title">🧠 状态管理 — 深度解析</h3>

        <div class="modal-section">
            <h4>📌 核心概念</h4>
            <p>State 是 Agent 的"短期记忆"...</p>
            <ul>
                <li><strong>Event Sourcing</strong> — 状态是事件流的派生视图</li>
                <li><strong>断点恢复</strong> — 支持 Resume/Replay</li>
            </ul>
        </div>

        <div class="modal-section">
            <h4>🏗️ 架构设计</h4>
            <div class="strategy-card">
                <h5>FileStore 抽象</h5>
                <p>统一接口，4 种后端实现...</p>
            </div>
        </div>

        <div class="modal-section">
            <h4>🎯 面试加分点</h4>
            <p>
                <span class="modal-tag">Event Sourcing</span>
                <span class="modal-tag">Checkpoint</span>
            </p>
            <div class="modal-highlight">
                <strong>一句话总结：</strong>State 是 Agent 的"记忆中枢"...
            </div>
        </div>
    </div>
</div>
```

### 弹窗内部组件

```css
/* 章节标题 */
.modal-section h4 {
    color: var(--accent-secondary);
    font-size: 1rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5em;
}

/* 策略卡片 (弹窗内) */
.strategy-card {
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    padding: 0.8rem;
    margin-bottom: 0.6rem;
    background: rgba(255,255,255,0.03);
}

/* 触发条件框 */
.strategy-card .trigger-box {
    background: rgba(239,68,68,0.15);
    border: 1px solid #ef4444;
    border-radius: 6px;
    padding: 0.4rem 0.6rem;
    margin-top: 0.5rem;
    font-size: 0.85em;
}

/* 高亮总结框 */
.modal-highlight {
    background: rgba(0, 255, 136, 0.1);
    border-left: 3px solid var(--accent);
    padding: 0.8rem 1rem;
    border-radius: 0 8px 8px 0;
    margin-top: 0.5rem;
}

/* 代码块 (弹窗内) */
.modal-code {
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 1rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
}
```

---

## JavaScript 功能

### 幻灯片导航控制器

```javascript
(function() {
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progressBar');
    const navDots = document.getElementById('navDots');
    const slideNumber = document.getElementById('slideNumber');
    const totalSlides = slides.length;
    let currentSlide = 0;

    // 创建导航点
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'nav-dot';
        dot.setAttribute('aria-label', `Slide ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        navDots.appendChild(dot);
    });

    const dots = document.querySelectorAll('.nav-dot');

    function updateSlideState() {
        const progress = ((currentSlide + 1) / totalSlides) * 100;
        progressBar.style.width = `${progress}%`;
        slideNumber.textContent = `${currentSlide + 1} / ${totalSlides}`;
        dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
        slides.forEach((slide, index) => slide.classList.toggle('visible', index === currentSlide));
    }

    function goToSlide(index) {
        if (index >= 0 && index < totalSlides) {
            currentSlide = index;
            slides[index].scrollIntoView({ behavior: 'smooth' });
            updateSlideState();
        }
    }

    // 键盘导航
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
                e.preventDefault(); goToSlide(currentSlide + 1); break;
            case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
                e.preventDefault(); goToSlide(currentSlide - 1); break;
            case 'Home': e.preventDefault(); goToSlide(0); break;
            case 'End': e.preventDefault(); goToSlide(totalSlides - 1); break;
        }
    });

    // 滚轮导航
    let isScrolling = false;
    document.addEventListener('wheel', (e) => {
        if (isScrolling) return;
        isScrolling = true;
        if (e.deltaY > 0) goToSlide(currentSlide + 1);
        else goToSlide(currentSlide - 1);
        setTimeout(() => { isScrolling = false; }, 800);
    }, { passive: true });

    // 初始化
    goToSlide(0);
})();
```

### 弹窗控制

```javascript
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// 点击遮罩关闭
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// ESC 键关闭
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});
```

---

## 内容创建指南 (面试导向)

### 🎯 整体叙事弧

| 阶段 | Slide | 目的 | 面试价值 |
|------|-------|------|---------|
| **定位** | 1-2 | 建立项目定位和技术全景 | 展示系统设计的全局视野 |
| **挑战** | 3 | 展示真实工程难点 | 证明问题意识和解决能力 |
| **深度** | 4-9 | 逐个模块深入讲解 | 展示技术深度和工程细节 |
| **实战** | 10-11 | 真实案例和量化数据 | 证明生产环境经验 |
| **决策** | 12-13 | 技术选型和差异化 | 展示决策能力和竞争意识 |
| **未来** | 14-15 | 技术演进和 Q&A | 展示学习能力和团队意愿 |

### 📄 每页内容模板

#### Slide 1: 标题页
```
项目名称 v版本号
一句话定位（不是 X，而是 Y）
三大技术支柱（技能点 1 · 技能点 2 · 技能点 3）
面试岗位：XXX 工程师
```

**面试价值**: 30 秒内让面试官知道"这是什么"和"你是谁"

#### Slide 2: 技术要点总览
```
核心定位："不是 [常见误解]，而是 [真正定位]"

三列技术矩阵：
🧠 核心引擎（4 项）：核心算法/数据结构
🛡️ 安全与扩展（4 项）：安全机制/可扩展设计
⚙️ 工程实践（4 项）：技术栈/部署架构

设计模式标签（6 个）：Factory · Strategy · Event Sourcing · ...
```

**面试价值**: 建立技术地图，面试官问哪个就展开哪个

#### Slide 3: 核心难点与解决方案
```
6 个难点卡片（2×3 网格）：
🔴 难点1：[问题描述] → 解决方案 A
🟠 难点2：[问题描述] → 解决方案 B
🟡 难点3：[问题描述] → 解决方案 C
🟣 难点4：[问题描述] → 解决方案 D
🩷 难点5：[问题描述] → 解决方案 E
🩵 难点6：[问题描述] → 解决方案 F
```

**面试价值**: 展示问题意识 + 每个难点都有对应方案

#### Slide 4-9: 技术深潜页
```
每页结构：
1. Section Label（模块名称）
2. 标题（模块 + 核心价值）
3. 问题框（为什么需要这个模块）
4. 架构图/流程图（可视化核心逻辑）
5. 代码块（关键实现，<10 行）
6. 设计哲学框（一句话总结设计思想）
7. 深度解析按钮（链接到弹窗）
```

**面试价值**: 展示技术深度和工程细节

#### Slide 10: 实战案例
```
真实调试故事：
1. 问题描述（线上出现什么问题）
2. 排查过程（4 步：日志 → 抓包 → 定位 → 验证）
3. 解决方案（具体修复措施）
4. 经验总结（从这个问题学到什么）
```

**面试价值**: 证明生产环境经验，展示问题排查能力

#### Slide 11: 量化指标
```
4 个统计卡片：
- 数字 + 单位（如 17+ 模型、<100ms 启动）
- 每个数字都要有业务含义

部署架构说明：
- 前端（Vercel/Cloudflare）
- 后端（Railway/Fly.io）
- 数据库（Supabase/PlanetScale）
```

**面试价值**: 用数据说话，展示量化思维

#### Slide 12: 技术决策
```
3 个技术选择卡片：
- 技术 A vs 竞品（为什么选 A）
- 技术 B vs 竞品（为什么选 B）
- 技术 C vs 竞品（为什么选 C）

每个决策都要说明 Trade-off
```

**面试价值**: 展示技术决策能力，不是盲目跟风

#### Slide 13: 差异化优势
```
3 个差异化维度：
1. 从零构建 vs 使用框架（展示深度理解）
2. 生产验证 vs 只是 Demo（展示实战经验）
3. 架构思维 vs 只会编码（展示系统设计能力）
```

**面试价值**: 回答"为什么选你"

#### Slide 14: 技术演进
```
3 个未来方向：
1. 方向 A — 具体探索点
2. 方向 B — 具体探索点
3. 方向 C — 具体探索点

强调"持续学习"和"与团队一起探索"
```

**面试价值**: 展示学习能力和团队合作意愿

### 📦 深度解析弹窗内容模板

每个弹窗应包含 4-6 个章节：

```
### 📌 核心概念
- 一句话定义
- 为什么需要这个模块
- 与竞品/替代方案的区别

### 🏗️ 架构设计
- 分层架构图
- 核心组件职责
- 数据流向

### ⚙️ 实现细节
- 核心类名/方法名
- 关键参数和配置
- 代码示例（带语法高亮）

### ⚠️ 技术难点
- 难点 1 + 应对方案
- 难点 2 + 应对方案
- 难点 3 + 应对方案

### 🎯 面试加分点
- 技术标签（6-8 个）
- 一句话总结（用比喻说明核心价值）
```

### 💬 面试话术示例

| 模块 | 一句话总结 |
|------|-----------|
| **执行引擎** | "让 LLM 从'说话者'变成'执行者'，通过代码与真实环境交互" |
| **状态管理** | "Controller 是'大脑皮层'，State 是'短期记忆'，FileStore 是'长期记忆'" |
| **记忆压缩** | "Condenser 是'Agent 的海马体'，实现'符号裁剪 + 神经压缩'的混合策略" |
| **沙盒隔离** | "Sandbox 是'隔离病房'，核心原则是 Zero Trust — 永不信任 LLM 生成的代码" |
| **知识注入** | "Microagent 让 Agent 从'全知全能'变成'按需专家'" |

---

## 推荐幻灯片结构 (面试演示)

| # | 幻灯片类型 | 内容 |
|---|-----------|------|
| 1 | 标题页 | 项目名称、版本、面试岗位 |
| 2 | 技术要点总览 | 3 列网格：核心引擎 / 安全扩展 / 工程实践 |
| 3 | 核心难点与解决方案 | 6 个难点卡片 (2×3 网格) |
| 4-9 | 技术深潜 | 每个核心模块一页 + 深度解析弹窗 |
| 10 | 实战案例 | 调试故事、问题排查 |
| 11 | 量化指标 | 统计卡片展示性能数据 |
| 12 | 技术决策 | 技术选型理由 |
| 13 | 差异化优势 | 与竞品对比 |
| 14 | 技术演进 | 未来规划 |
| 15 | Q&A | 谢谢 + 联系方式 |

---

## 使用流程

### Phase 1: 内容收集

1. 询问用户项目名称、版本、面试目标
2. 收集核心技术点（建议 6-8 个）
3. 收集每个技术点的难点和解决方案
4. 收集量化指标（如果有）

### Phase 2: 生成演示文稿

1. 使用上述组件库生成完整 HTML
2. 确保每页符合视口高度限制
3. 为复杂技术点添加深度解析弹窗
4. 添加面试加分点标签

### Phase 3: 交付

```bash
open presentation.html
```

提示用户：
- **← → 或滚轮**切换幻灯片
- **点击"📖 深度解析"**展开详细说明
- **ESC** 关闭弹窗
- **颜色调整**：修改 `:root` CSS 变量

---

## 完整示例

参考 `atoms-plus-presentation.html` (18 页 + 5 弹窗)

### 示例 1: 标题页

```html
<section class="slide gradient-bg grid-bg">
    <div class="slide-content" style="text-align:center;">
        <div class="logo">🚀 项目名称 <span>v0.3.0</span></div>
        <h1>一句话定位</h1>
        <p class="subtitle">技能点 1 · 技能点 2 · 技能点 3</p>
        <div class="meta">面试岗位：XXX 工程师</div>
    </div>
</section>
```

### 示例 2: 难点卡片

```html
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;">
    <!-- 难点 1 -->
    <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:0.5rem;">
        <span style="background:#ef4444;color:white;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.75em;">难点 1</span>
        <strong style="color:#f87171;">代码执行安全</strong>
        <p style="font-size:0.85em;color:var(--text-secondary);">LLM 生成的代码不可信</p>
        <div style="background:rgba(52,211,153,0.1);border-left:3px solid #34d399;padding:0.3rem;">
            <strong style="color:#34d399;">✅ Sandbox 沙盒隔离</strong>
        </div>
    </div>
</div>
```

### 示例 3: 深度解析弹窗

```html
<div class="modal-overlay" id="modal-example">
    <div class="modal-content">
        <button class="modal-close" onclick="closeModal('modal-example')">✕</button>
        <h3 class="modal-title">🧠 模块名称 — 深度解析</h3>

        <div class="modal-section">
            <h4>📌 核心概念</h4>
            <p>一句话定义 + 为什么需要这个模块</p>
        </div>

        <div class="modal-section">
            <h4>🏗️ 架构设计</h4>
            <div class="strategy-card">具体实现细节</div>
        </div>

        <div class="modal-section">
            <h4>🎯 面试加分点</h4>
            <span class="modal-tag">设计模式 1</span>
            <span class="modal-tag">设计模式 2</span>
            <div class="modal-highlight">
                <strong>一句话总结：</strong>用比喻说明核心价值
            </div>
        </div>
    </div>
</div>
```

---

## 快速参考

| 组件 | 用途 | CSS 类 |
|------|------|--------|
| Section Label | 章节标记 | `.section-label` |
| 问题框 | 展示问题 | `.problem-box` |
| 方案框 | 展示方案 | `.solution-box` |
| 哲学框 | 设计理念 | `.why-box` |
| 流程节点 | 流程图 | `.flow-node` |
| 架构层 | 分层架构 | `.arch-layer` |
| 代码块 | 代码展示 | `.code-block` |
| 统计卡 | 数字展示 | `.stat-card` |
| 技术标签 | 关键词 | `.modal-tag` |
| 深度按钮 | 打开弹窗 | `.detail-btn` |

---

## 相关 Skill

- **frontend-slides** — 通用演示文稿（更多风格）
- **frontend-design** — 复杂交互页面

