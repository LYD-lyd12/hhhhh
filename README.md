# TeleToken Router

AI 模型聚合中台，一站式智能服务网关

## 功能特性

- **统一API网关**：兼容OpenAI API协议，提供标准化API入口
- **多厂商模型接入**：支持火山引擎、智谱AI、MiniMax、阿里云等主流AI厂商
- **Token实时计量**：精确统计Token消耗，支持多种计费策略
- **智能路由**：基于延迟、成本的智能路由和负载均衡
- **限流插件**：用户级、应用级、系统级限流

## 技术栈

- **框架**: Next.js 16
- **语言**: TypeScript
- **样式**: Tailwind CSS 3
- **图表**: Recharts
- **图标**: Lucide React

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   └── app.tsx             # 主应用组件
├── components/             # UI组件
│   ├── Layout/            # 布局组件
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── Dashboard/         # 仪表盘
│   ├── Models/            # 模型市场
│   ├── API/               # API文档
│   ├── Billing/           # 用量看板
│   ├── Nodes/             # 节点监控
│   ├── Users/             # 用户管理
│   └── Settings/          # 系统设置
└── fixtures/              # 模拟数据
    ├── api-examples.ts
    ├── vendor-config.ts
    ├── billing.ts
    ├── nodes.ts
    └── rate-limit.ts
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm run start
```

### 代码检查

```bash
npm run lint
```

## 主要页面

| 页面 | 路径 | 描述 |
|------|------|------|
| 仪表盘 | `/` | 业务概览和统计数据 |
| 模型市场 | `/models` | 浏览和管理AI模型 |
| API文档 | `/api` | API接口文档和示例 |
| 用量看板 | `/billing` | 消费统计和账单管理 |
| 节点监控 | `/nodes` | 模型节点状态监控 |
| 用户管理 | `/users` | 平台用户管理 |
| 系统设置 | `/settings` | 系统配置管理 |

## License

MIT