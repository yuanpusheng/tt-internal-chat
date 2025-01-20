process.noDeprecation = true;

const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');
const readline = require('readline');
const { 
    generateUniqueId, 
    addClient, 
    removeClient, 
    updateClientName,
    getClientInfo
} = require('./websocket/clients');
const { broadcastUserList, handleMessage } = require('./websocket/handler');

const app = express();

// 检查是否需要手动输入端口
const needPortInput = process.argv.includes('--port');

function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        console.log('Client connected');
        
        const clientId = req.url.split('clientId=')[1] || generateUniqueId();
        addClient(ws, clientId);

        ws.send(JSON.stringify({
            type: 'welcome',
            id: clientId,
            name: getClientInfo(ws).name
        }));

        broadcastUserList(wss);

        ws.on('message', (message) => handleMessage(ws, wss, message));

        ws.on('close', () => {
            console.log('Client disconnected');
            removeClient(ws);
            broadcastUserList(wss);
        });
    });
}

if (needPortInput) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('请输入要使用的端口号: ', (port) => {
        port = parseInt(port);
        if (isNaN(port) || port < 1 || port > 65535) {
            console.error('无效的端口号！请输入 1-65535 之间的数字。');
            process.exit(1);
        }
        startServer(port);
        rl.close();
    });
} else {
    startServer(process.env.PORT || 3000);
} 