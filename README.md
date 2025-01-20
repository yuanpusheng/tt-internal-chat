# Chat App

## 项目结构

```
tt-internal-chat/
├── backend/
│   ├── src/
│   │   ├── server.js          # 主服务器文件
│   │   ├── websocket/         # WebSocket 相关代码
│   │   │   ├── handler.js     # WebSocket 消息处理
│   │   │   └── clients.js     # 客户端管理
│   │       └── helpers.js    # 辅助函数
│   ├── package.json
│   ├── Dockerfile            # 后端 Docker 配置
│
├── frontend/
│   ├── public/
│   │   ├── index.html        # 主页面
│   │   ├── css/
│   │   │   ├── style.css     # 主样式文件
│   │   │   ├── variables.css # CSS变量
│   │   │   └── chat.css      # 聊天相关样式
│   │   └── js/
│   │       ├── main.js       # 主JavaScript文件
│   │       ├── websocket.js  # WebSocket客户端代码
│   │       ├── ui.js         # UI相关代码
│   │       └── utils.js      # 工具函数
│   ├── package.json
│   ├── Dockerfile            # 前端 Docker 配置
│   └── nginx.conf            # Nginx 配置文件
│
├── docker-compose.yml        # Docker 编排配置
├── .gitignore
└── README.md
```

## 安装和运行

1. 安装依赖
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd frontend
npm install
```

2. 运行应用
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务（可选）
cd frontend
npm run dev
```

3. 访问应用
打开浏览器访问 `http://localhost:3001`

## 开发说明

### 后端结构
- `server.js`: 主服务器文件，处理 Express 和 WebSocket 服务器的设置
- `websocket/handler.js`: 处理所有 WebSocket 消息的逻辑
- `websocket/clients.js`: 管理连接的客户端和用户信息
- `utils/helpers.js`: 通用辅助函数

### 前端结构
- `js/main.js`: 应用的主入口点，初始化和事件处理
- `js/websocket.js`: WebSocket 客户端类，处理所有 WebSocket 通信
- `js/ui.js`: UI 类，处理所有界面相关的操作
- `js/utils.js`: 通用工具函数

### CSS 结构
- `variables.css`: 全局 CSS 变量定义
- `chat.css`: 聊天相关的样式
- `style.css`: 主样式文件和通用样式

### Docker 配置
- `frontend/Dockerfile`: 前端 Nginx 容器配置
  - 基于 nginx:alpine 镜像
  - 复制前端文件到 Nginx 目录
  - 配置 Nginx 服务器设置
- `backend/Dockerfile`: 后端 Node.js 容器配置
  - 基于 node:alpine 镜像
  - 安装依赖
  - 配置应用环境
- `docker-compose.yml`: 多容器编排配置
  - 定义前端和后端服务
  - 配置网络和端口映射
  - 设置容器间依赖关系

## 开发指南

1. 后端开发
   - 使用 nodemon 实现热重载
   - 所有新的 WebSocket 消息处理器添加到 `handler.js`
   - 客户端管理相关的功能添加到 `clients.js`

2. 前端开发
   - WebSocket 相关的新功能添加到 `websocket.js`
   - UI 更新相关的代码添加到 `ui.js`
   - 主要的事件处理添加到 `main.js`
   - 样式修改应该遵循 CSS 文件的分层结构

3. Docker 开发
   - 修改 Dockerfile 时注意镜像大小优化
   - 使用多阶段构建减小最终镜像体积
   - 确保正确配置容器间的通信
   - 注意环境变量的管理

## 注意事项

- 确保在开发时遵循项目的文件结构
- 新功能开发时注意代码的模块化
- 保持代码风格的一致性
- 定期测试所有功能的正常运行
- Docker 相关修改需要重新构建镜像 

## 快速开始

### Docker 一键部署

1. 克隆项目
```bash
git clone https://github.com/yourusername/chat-app.git
cd chat-app
```

2. 构建并启动容器
```bash
docker-compose up -d
```

3. 访问应用
- 打开浏览器访问 `http://localhost:9999`
- WebSocket 服务运行在 `ws://localhost:9999/ws`

4. 查看日志
```bash
# 查看所有容器日志
docker-compose logs -f

# 查看前端容器日志
docker-compose logs -f frontend

# 查看后端容器日志
docker-compose logs -f backend
```

5. 停止服务
```bash
docker-compose down
```

### 环境要求
- Docker 20.10.0 或更高版本
- Docker Compose 2.0.0 或更高版本
- 确保 9999 端口未被占用

### 常见问题
1. 端口冲突
   - 修改 `docker-compose.yml` 中的端口映射
   - 修改 `frontend/nginx.conf` 中的监听端口
   - 修改 `frontend/public/js/config.js` 中的 WebSocket 连接地址

2. 容器无法启动
   - 检查 Docker 服务状态
   - 查看容器日志定位问题
   - 确保所有配置文件存在

3. WebSocket 连接失败
   - 检查 nginx 配置中的 WebSocket 代理设置
   - 确认后端服务正常运行
   - 查看浏览器控制台网络请求