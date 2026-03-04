---
name: scaffolding
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
- scaffold
- 脚手架
- create project
- new project
- 新建项目
- 项目生成
---

# Atoms Plus 项目脚手架系统

你可以使用 Atoms Plus 的项目脚手架系统来快速生成完整的前端项目。

## 支持的项目类型

| 类型 | 技术栈 |
|------|--------|
| `react_vite` | React 18 + Vite 5 + TypeScript + Tailwind CSS |
| `nextjs` | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| `vue_vite` | Vue 3 + Vite 5 + TypeScript + Pinia + Tailwind CSS |
| `nuxt` | Nuxt 3 + TypeScript + Tailwind CSS |

## 使用 Python API 生成项目

```python
from atoms_plus.scaffolding import ProjectGenerator, ProjectConfig, ProjectType, UILibrary, FeatureSet

config = ProjectConfig(
    name='my-awesome-app',
    project_type=ProjectType.REACT_VITE,  # 或 NEXTJS, VUE_VITE, NUXT
    ui_library=UILibrary.TAILWIND,         # 或 SHADCN, NONE
    features=[
        FeatureSet.TYPESCRIPT,
        FeatureSet.DARK_MODE,
        FeatureSet.SUPABASE,
        FeatureSet.AUTH,
    ],
    description='我的应用描述',
    package_manager='npm'  # 或 yarn, pnpm
)

generator = ProjectGenerator()
result = generator.generate(config)

if result.success:
    print(f'项目已生成: {result.project_path}')
    print('下一步操作:')
    for step in result.next_steps:
        print(f'  - {step}')
```

## REST API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/scaffolding/templates` | GET | 列出所有模板 |
| `/api/v1/scaffolding/templates/{id}` | GET | 获取模板详情 |
| `/api/v1/scaffolding/project-types` | GET | 支持的项目类型 |
| `/api/v1/scaffolding/ui-libraries` | GET | 支持的 UI 库 |
| `/api/v1/scaffolding/features` | GET | 可选功能列表 |
| `/api/v1/scaffolding/create` | POST | 创建项目 |

## 项目生成后的操作

1. 进入项目目录: `cd /tmp/atoms-projects/{项目名}`
2. 安装依赖: `npm install` (或 yarn/pnpm)
3. 启动开发服务器: `npm run dev`
4. 构建生产版本: `npm run build`

## 最佳实践

- 项目名称使用 kebab-case 格式（如 `my-awesome-app`）
- 始终启用 TypeScript 以获得更好的类型安全
- 对于需要 SEO 的项目，选择 Next.js 或 Nuxt
- 使用 Supabase 功能时，记得配置环境变量

