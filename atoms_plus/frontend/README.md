# Atoms Plus Frontend 扩展

这是 Atoms Plus 的前端组件，独立于 OpenHands 核心前端。

## 集成到 OpenHands 前端

### 方法 1: 复制文件（推荐用于快速测试）

```bash
# 复制组件到 OpenHands 前端
cp atoms_plus/frontend/components/RaceMode.tsx frontend/src/routes/race-mode.tsx
cp atoms_plus/frontend/api/race-service.ts frontend/src/api/race-service.ts

# 修改 frontend/src/routes.ts 添加路由
# 在 layout("routes/root-layout.tsx", [...]) 中添加:
# route("race-mode", "routes/race-mode.tsx"),
```

### 方法 2: 符号链接（开发时）

```bash
# 创建符号链接
ln -s ../../atoms_plus/frontend/components/RaceMode.tsx frontend/src/routes/race-mode.tsx
ln -s ../../atoms_plus/frontend/api/race-service.ts frontend/src/api/race-service.ts
```

### 方法 3: 作为独立应用

前端组件可以作为独立的 React 应用运行，连接到 Atoms Plus 后端。

## 文件结构

```
atoms_plus/frontend/
├── README.md                 # 本文件
├── api/
│   └── race-service.ts       # API 客户端（独立，无 OpenHands 依赖）
└── components/
    └── RaceMode.tsx          # Race Mode 页面组件
```

## 依赖

- React 18+
- Tailwind CSS（用于样式）
- fetch API（无需 axios）

## 注意事项

1. `race-service.ts` 是独立的，使用原生 fetch，不依赖 OpenHands 的 axios 实例
2. 集成到 OpenHands 时，可能需要修改 import 路径
3. 组件使用 Tailwind CSS 类名，确保目标项目已配置 Tailwind

