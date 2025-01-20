const { getClientInfo, getAllClients, updateClientName } = require('./clients');
const { WebSocket } = require('ws');

// 所有处理函数声明提前
function broadcastMessage(wss, messageData) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(messageData));
        }
    });
}

function broadcastUserList(wss) {
    const userList = getAllClients();
    console.log('Broadcasting user list:', userList);
    
    const message = {
        type: 'userList',
        users: userList
    };
    
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            console.log('Sending user list to client');
            client.send(JSON.stringify(message));
        }
    });
}

function handlePrivateMessage(ws, wss, messageData, targetId) {
    messageData.isPrivate = true;
    const targetClient = Array.from(wss.clients).find(client => 
        getClientInfo(client).id === targetId
    );

    if (targetClient) {
        messageData.targetName = getClientInfo(targetClient).name;
        targetClient.send(JSON.stringify(messageData));
        ws.send(JSON.stringify(messageData));
    }
}

function handleChatMessage(ws, wss, data, sender) {
    const messageData = {
        type: 'message',
        sender: sender.name,
        content: data.content,
        time: new Date().toISOString()
    };

    if (data.targetId) {
        handlePrivateMessage(ws, wss, messageData, data.targetId);
    } else {
        broadcastMessage(wss, messageData);
    }
}

function handleFileMessage(ws, wss, data, sender) {
    console.log('开始处理文件消息');
    console.log('发送者信息:', { 
        id: sender.id,
        name: sender.name
    });
    console.log('文件信息:', { 
        name: data.name,
        size: data.size,
        dataLength: data.data ? data.data.length : 0,
        targetId: data.targetId
    });

    try {
        // 检查文件数据是否完整
        if (!data.data || !data.name || !data.size) {
            throw new Error('Invalid file data');
        }

        const messageData = {
            type: 'message',
            sender: sender.name,
            content: `发送了文件: ${data.name}`,
            file: {
                name: data.name,
                size: data.size,
                data: data.data
            },
            time: new Date().toISOString()
        };

        // 私聊消息
        if (data.targetId) {
            console.log('准备发送私聊文件消息');
            const targetClient = Array.from(wss.clients).find(client => 
                client.userId === data.targetId
            );
            
            if (!targetClient) {
                throw new Error('目标用户未找到');
            }

            if (targetClient.readyState !== WebSocket.OPEN) {
                throw new Error('目标用户连接状态异常');
            }

            console.log('Sending private file message to:', data.targetId);
            targetClient.send(JSON.stringify({
                ...messageData,
                privateTarget: sender.name
            }));

            // 发送给发送者
            ws.send(JSON.stringify({
                ...messageData,
                privateTarget: targetClient.userName
            }));
        } 
        // 群发消息
        else {
            console.log('准备广播文件消息');
            let successCount = 0;
            let errorCount = 0;

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    try {
                        client.send(JSON.stringify(messageData));
                        successCount++;
                    } catch (error) {
                        console.error('发送给客户端失败:', error);
                        errorCount++;
                    }
                }
            });

            console.log('Broadcasting file message to all clients');
        }
    } catch (error) {
        console.error('文件处理错误:', error);
        try {
            ws.send(JSON.stringify({
                type: 'error',
                content: `文件处理失败: ${error.message}`
            }));
        } catch (e) {
            console.error('发送错误消息失败:', e);
        }
    }
}

function handleRename(ws, wss, data, sender) {
    const newName = data.newName.trim();
    if (newName) {
        updateClientName(ws, newName);
        
        ws.send(JSON.stringify({
            type: 'renameConfirm',
            newName: newName
        }));

        broadcastUserList(wss);
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function handleMessage(ws, wss, message) {
    try {
        const data = JSON.parse(message);
        const sender = getClientInfo(ws);
        
        if (!sender) {
            console.error('No sender info found');
            return;
        }

        console.log('Received message:', data.type, 'from:', sender.name);

        switch (data.type) {
            case 'message':
                handleChatMessage(ws, wss, data, sender);
                break;
            case 'rename':
                handleRename(ws, wss, data, sender);
                break;
            case 'file':
                handleFileMessage(ws, wss, data, sender);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
}

module.exports = {
    broadcastUserList,
    handleMessage,
    handleFileMessage
}; 