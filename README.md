# AI Studio Plus

基于 Vue 3 + TypeScript 构建的 AI 智能对话应用，支持多 AI 提供方管理和联网搜索功能。

## 系统要求

- **桌面设备**：最小屏幕宽度 964px
- **浏览器**：现代浏览器（Chrome、Firefox、Safari、Edge 最新版）
- **Node.js**：>= 20.19.0 或 >= 22.12.0

## 技术栈

| 类别     | 技术                       |
| -------- | -------------------------- |
| 前端框架 | Vue 3.5 + TypeScript       |
| 构建工具 | Vite 8                     |
| 状态管理 | Pinia 3                    |
| 路由     | Vue Router 5               |
| UI 组件  | Element Plus 2             |
| CSS 方案 | UnoCSS + TailwindCSS 4     |
| 本地存储 | Dexie (IndexedDB)          |
| Markdown | marked + highlight.js      |
| 代码规范 | oxlint + ESLint + Prettier |

## 功能特性

### 多 AI 模型管理

- 支持多种 AI 提供方（Provider）配置管理
- 按分组（Group）管理不同模型
- 支持 Chat、Image、OCR、Video、Audio 等多种模型类型
- 模型配置导入/导出

### 联网搜索

- 支持 SearXNG 自托管搜索
- 支持 Tavily API 搜索
- 可在对话中实时联网获取信息

### 归档功能

- 自动归档对话内容
- 支持 Joplin Web Clipper 集成
- 同步到指定 Joplin 笔记本

### AI 对话

- Markdown 渲染与代码高亮
- 流式响应支持
- 对话历史记录管理

## 快速开始

### 开发调试

```bash
# 安装模块
npm install

# 运行调试
npm run dev
```

### PM2 部署

::: 创建 :::

```bash
# 拉取代码
git clone https://github.com/kenote/ai-studio-plus.git

# 安装模块
cd ai-studio-plus && npm install

# 编译代码
npm run build:spa

# 启动 PM2
make start
```

::: 更新 :::

```bash
# 拉取新的源代码
git pull

# 重新编译代码
npm run build:spa

# 重启 PM2
make restart
```

### Docker 部署

::: 创建 :::

```bash
# 拉取代码
git clone https://github.com/kenote/ai-studio-plus.git

# 编译镜像
cd ai-studio-plus
docker build -f Dockerfile --tag ai-studio-plus .

# 编辑环境变量
cp .env.example .env

# 拷贝 Compose 文件
cp compose.example.yml compose.yml

# 启动 Compose 容器
docker-compose up -d
```

::: 更新 :::

```bash
# 拉取新的源代码
git pull

# 卸载 Compose  容器
docker-compose down

# 编译镜像
docker build -f Dockerfile --tag ai-studio-plus .

# 启动 Compose 容器
docker-compose up --build -d && sleep 3 && docker logs ai-studio-plus --tail 5
```

## License

this repo is released under the [MIT License](https://github.com/kenote/ai-studio-plus/blob/main/LICENSE).
