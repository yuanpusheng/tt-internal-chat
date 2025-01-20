class ChatWs {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.socket = new WebSocket(WS_URL);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            UI.updateStatus('已连接');
            UI.enableSendButton();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message:', data); // 添加日志

            switch(data.type) {
                case 'message':
                    // 检查是否是文件消息
                    if (data.content.includes('发送了文件:')) {
                        UI.displayMessage(
                            data.sender,
                            data.content,
                            data.sender === this.currentUser?.name,
                            data.privateTarget,
                            data.file  // 确保传递完整的文件对象
                        );
                    } else {
                        UI.displayMessage(
                            data.sender,
                            data.content,
                            data.sender === this.currentUser?.name,
                            data.privateTarget
                        );
                    }
                    break;
                // ... other cases ...
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            UI.updateStatus('连接断开');
            UI.disableSendButton();
            setTimeout(() => this.setupWebSocket(), 5000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            UI.updateStatus('连接错误');
        };
    }

    sendFile(file, targetId = '') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const message = {
                type: 'file',
                name: file.name,
                size: file.size,
                data: e.target.result,
                targetId: targetId
            };
            console.log('Sending file message:', { ...message, data: '[DATA]' }); // 添加日志
            this.socket.send(JSON.stringify(message));
        };
        reader.readAsDataURL(file);
    }

    // ... 其他方法
} 