# 使用Cursor实现 WebSocket 聊天应用

使用Cursor实现，一个基于 WebSocket 的实时聊天应用，支持私聊、文件传输和用户状态显示。

## 功能特性

- 实时消息传递
- 私聊功能
- 文件传输
- 用户状态显示
- 昵称修改
- 响应式设计

## 技术栈

- 后端：Node.js, Express, ws
- 前端：原生 JavaScript, WebSocket API

## 项目结构

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── server.js          # 主服务器文件
│   │   ├── websocket/         # WebSocket 相关代码
│   │   │   ├── handler.js     # WebSocket 消息处理
│   │   │   └── clients.js     # 客户端管理
│   │   └── utils/            # 工具函数
│   │       └── helpers.js    # 辅助函数
│   ├── package.json
│   └── .env                  # 环境变量配置
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
│   └── package.json
│
├── .gitignore
│
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

## 注意事项

- 确保在开发时遵循项目的文件结构
- 新功能开发时注意代码的模块化
- 保持代码风格的一致性
- 定期测试所有功能的正常运行 
