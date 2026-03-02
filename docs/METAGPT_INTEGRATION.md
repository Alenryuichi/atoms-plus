# MetaGPT 集成工作总结

> **返回主文档**: [DEMO_DOCUMENTATION.md](../DEMO_DOCUMENTATION.md)

---

## 一、为什么选择 MetaGPT？

### 1.1 选择初衷和预期价值

- **复刻 Atoms.dev 功能**：Atoms.dev 的核心是多代理协作代码生成，MetaGPT 提供类似的多角色 AI 团队（产品经理、架构师、工程师、QA）
- **软件工程流程模拟**：MetaGPT 能模拟完整的软件开发流程：需求分析 → 架构设计 → 编码 → 代码审查 → 测试

### 1.2 MetaGPT 相比 OpenHands 的优势

| 特性 | OpenHands | MetaGPT |
|------|-----------|---------|
| 模式 | 单代理对话 | 多代理协作 |
| 流程 | 指令执行 | 软件工程流程 |
| 产出 | 代码片段 | 完整项目结构 |
| 角色 | 通用助手 | 专业化分工 |

### 1.3 需要 MetaGPT 实现的功能

1. **多代理协作**：Mike(产品)、Emma(架构)、Bob(开发)、Eve(QA)、Alex(审查)
2. **项目级代码生成**：一次性生成完整可运行项目
3. **软件工程最佳实践**：自动生成 PRD、设计文档、测试用例

---

## 二、当前进度

### 2.1 工作分支

- **分支名称**: `feature/metagpt-integration`
- **远程仓库**: https://github.com/Alenryuichi/atoms-plus.git

### 2.2 已完成的工作

| 任务 | 状态 |
|------|------|
| MetaGPT API 服务架构设计 | ✅ 完成 |
| `services/metagpt-api/main.py` 实现 | ✅ 完成 |
| FastAPI 端点设计（REST + WebSocket） | ✅ 完成 |
| Railway 部署配置 | ✅ 完成 |
| Mock 模式实现和部署 | ✅ 运行中 |
| 阿里云容器镜像推送流程 | ✅ 完成 |
| 跨平台 Docker 构建 (ARM → AMD64) | ✅ 完成 |

### 2.3 目前卡在哪一步

**启用真实 MetaGPT（非 Mock 模式）部署到 Railway**

当前 Mock 服务运行正常：https://metagpt-api-production.up.railway.app

---

## 三、遇到的问题（详细列出）

### 问题 1: MetaGPT 官方 Docker 镜像的 Pydantic 版本冲突 ⚠️ 核心问题

**问题描述**：MetaGPT 官方镜像 `metagpt/metagpt:latest` 中存在损坏的 Pydantic `.so` 编译文件

**错误信息**：
```
ImportError: cannot import name 'version_short' from 'pydantic.version'
(/usr/local/lib/python3.9/site-packages/pydantic/version.cpython-39-x86_64-linux-gnu.so)
```

**调用链**：`anthropic SDK → pydantic.generics → pydantic._migration → pydantic.version (损坏的.so文件)`

**尝试过的解决方案（v4-v11，全部失败）**：

| 版本 | 尝试方法 | 结果 |
|------|----------|------|
| v4 | 降级到 Pydantic v1 兼容的 FastAPI | MetaGPT 需要 Pydantic v2，无法导入 |
| v5-v6 | 升级 Pydantic 到 2.12.5 | 同样的 version_short 错误 |
| v7-v8 | 使用 `--no-deps` 避免触碰 Pydantic | 失败 |
| v9-v10 | 指定 Pydantic 2.6.0 + pydantic-core 2.16.1 | 失败 |
| v11 | 强制卸载 + 清理所有 pydantic 文件 + 重装 | 失败 |

**为什么没成功**：
- 官方镜像中的 `.so` 编译文件是预编译的二进制
- 即使删除 Python 包，编译扩展可能残留在其他位置
- anthropic SDK 依赖特定的 Pydantic 内部 API

### 问题 2: 构建超时

**问题描述**：Railway 源码构建 MetaGPT 时超时（MetaGPT 依赖非常多）

**尝试过的解决方案**：
- 本地构建 Docker 镜像，推送到阿里云容器镜像服务
- 使用 `docker buildx build --platform linux/amd64` 跨平台构建

**结果**：✅ 解决了超时问题，但遇到 Pydantic 问题

### 问题 3: 平台架构不匹配

**问题描述**：Mac M 系列芯片（ARM64）构建的镜像无法在 Railway（AMD64）运行

**错误信息**：`no matching manifest for linux/amd64 in the manifest list entries`

**解决方案**：使用 `docker buildx build --platform linux/amd64` ✅ 已解决

### 问题 4: 容器镜像仓库权限

**问题描述**：阿里云镜像仓库推送失败

**解决方案**：使用已有的公开仓库 `registry.cn-hangzhou.aliyuncs.com/alenryuichi/kylin_for_test` ✅ 已解决

---

## 四、相关文件和代码

### 4.1 创建/修改的关键文件

```
services/metagpt-api/
├── main.py                  # FastAPI 应用主文件
├── Dockerfile               # Mock 模式 Dockerfile
├── Dockerfile.full          # Full 模式 Dockerfile（问题所在）
├── requirements.txt         # Mock 模式依赖
├── requirements.full.txt    # Full 模式依赖
└── config.yaml.template     # MetaGPT 配置模板
```

### 4.2 Railway 服务记录

| 服务 | 镜像 | 状态 |
|------|------|------|
| metagpt-api | Source build | ✅ Mock 模式运行 |
| metagpt-api-v11 | kylin_for_test:metagpt-api-v11 | ❌ Pydantic 错误 |
| metagpt-api-v12 | 构建中... | 🔄 使用 python:3.10-slim 基础镜像 |

---

## 五、我的建议

### 5.1 短期建议：继续尝试 v12 方案

当前正在构建的 v12 使用完全干净的 `python:3.10-slim` 基础镜像，从头安装 MetaGPT，避免官方镜像的损坏依赖：

```dockerfile
FROM python:3.10-slim  # 而不是 metagpt/metagpt:latest
RUN pip install metagpt>=0.8.0  # 从 PyPI 干净安装
```

- **如果 v12 成功**：问题解决，继续集成前端
- **如果 v12 失败**：考虑以下替代方案

### 5.2 替代方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. 使用 MetaGPT 的旧版本镜像 | 可能没有 Pydantic 问题 | 功能可能不完整 |
| B. 自建多代理系统 | 完全可控 | 开发成本高 |
| C. 使用 AutoGPT/AgentGPT | 成熟生态 | 与 Atoms 风格不同 |
| D. 仅使用 OpenHands | 已集成 | 缺少多代理协作 |
| E. LangGraph 多代理 | 灵活轻量 | 需要从头实现流程 |

### 5.3 需要的帮助

1. **等待 v12 构建结果** - 如果干净镜像构建成功，问题可能就解决了
2. **如果继续失败**：
   - 联系 MetaGPT 团队报告官方镜像问题
   - 或考虑使用 LangGraph 实现轻量级多代理系统

---

## 六、当前状态总结

```
┌─────────────────────────────────────────────────────────┐
│  MetaGPT 集成进度                                        │
├─────────────────────────────────────────────────────────┤
│  [✅] API 服务设计                                       │
│  [✅] Mock 模式部署 (metagpt-api-production)            │
│  [✅] 跨平台构建流程                                     │
│  [✅] 容器镜像推送                                       │
│  [🔄] Full 模式部署 (v12 构建中...)                     │
│  [⏳] 前端集成                                          │
│  [⏳] OpenHands 整合                                    │
└─────────────────────────────────────────────────────────┘
```

---

*文档更新时间：2026-03-02*

