const { getClientInfo, getAllClients, updateClientName } = require('./clients');

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
    console.log('Handling file message:', { 
        ...data,
        data: data.data ? '[DATA]' : 'null'
    });

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

    if (data.targetId) {
        const targetClient = Array.from(wss.clients).find(client => 
            client.userId === data.targetId
        );
        
        if (targetClient) {
            console.log('Sending private file message to:', data.targetId);
            targetClient.send(JSON.stringify({
                ...messageData,
                privateTarget: sender.name
            }));
            ws.send(JSON.stringify({
                ...messageData,
                privateTarget: targetClient.userName
            }));
        }
    } else {
        console.log('Broadcasting file message');
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
            }
        });
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
    handleMessage
}; 