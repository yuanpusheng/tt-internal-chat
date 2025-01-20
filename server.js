const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 修改静态文件服务配置
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 用户管理
const clients = new Map(); // 存储连接的客户端

// 生成唯一ID的函数
function generateUniqueId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  console.log('Client connected');
  
  // 从请求中获取客户端ID
  const clientId = req.url.split('clientId=')[1] || generateUniqueId();
  const existingName = Array.from(clients.values()).find(client => client.id === clientId)?.name;
  
  // 设置客户端信息
  clients.set(ws, {
    id: clientId,
    name: existingName || `用户${clientId.substr(5, 4)}`
  });

  // 发送欢迎消息，包含用户ID和名称
  ws.send(JSON.stringify({
    type: 'welcome',
    id: clientId,
    name: clients.get(ws).name,
    message: `欢迎加入聊天室！`
  }));

  // 广播用户列表
  function broadcastUserList() {
    const userList = Array.from(clients.values()).map(client => ({
      id: client.id,
      name: client.name
    }));
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'userList',
          users: userList
        }));
      }
    });
  }

  broadcastUserList();

  ws.on('message', (message) => {
    try {
        const data = JSON.parse(message.toString());
        const sender = clients.get(ws);
        console.log('Received message type:', data.type, 'from:', sender.name);

        switch (data.type) {
            case 'message':
                // 构建消息对象
                const messageData = {
                    type: 'message',
                    sender: sender.name,
                    content: data.content,
                    time: new Date().toISOString()
                };

                if (data.targetId) {
                    // 私聊消息
                    const targetClient = Array.from(clients.entries())
                        .find(([_, client]) => client.id === data.targetId)?.[0];
                    
                    if (targetClient) {
                        messageData.isPrivate = true;
                        messageData.targetName = clients.get(targetClient).name;
                        
                        // 发送给目标用户
                        targetClient.send(JSON.stringify(messageData));
                        // 发送给发送者
                        ws.send(JSON.stringify(messageData));
                    }
                } else {
                    // 群发消息
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(messageData));
                        }
                    });
                }
                break;

            case 'rename':
                // 更新用户名
                sender.name = data.newName;
                // 发送确认消息给发送者
                ws.send(JSON.stringify({
                    type: 'renameConfirm',
                    newName: data.newName
                }));
                // 广播用户列表更新
                broadcastUserList();
                break;

            case 'file':
                // 构建广播消息
                const broadcastData = {
                    type: data.type,
                    senderId: sender.id,
                    senderName: sender.name,
                    timestamp: new Date().toISOString(),
                    name: data.name,
                    size: data.size,
                    data: data.data
                };

                console.log('Broadcasting message type:', broadcastData.type); // 添加日志

                // 发送消息
                if (data.targetId) {
                    // 发送给特定用户
                    wss.clients.forEach(client => {
                        const targetClient = clients.get(client);
                        if (targetClient && targetClient.id === data.targetId && client.readyState === WebSocket.OPEN) {
                            console.log('Sending to specific user:', targetClient.name); // 添加日志
                            client.send(JSON.stringify(broadcastData));
                        }
                    });
                } else {
                    // 广播给所有人（除了发送者）
                    wss.clients.forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            console.log('Broadcasting to all users'); // 添加日志
                            client.send(JSON.stringify(broadcastData));
                        }
                    });
                }
                break;

            default:
                console.error('Unknown message type:', data.type);
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      // 广播用户离开消息
      wss.clients.forEach(wsClient => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'system',
            message: `${client.name} 离开了聊天室`
          }));
        }
      });
    }
    
    clients.delete(ws);
    broadcastUserList();
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});