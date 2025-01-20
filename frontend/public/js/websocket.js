class ChatWebSocket {
    constructor() {
        this.ws = null;
        this.currentUserId = null;
        this.currentUserName = null;
        this.messageHandlers = new Map();
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        const storedUserId = localStorage.getItem('chatUserId');
        
        const wsUrl = `${CURRENT_CONFIG.wsProtocol}//${CURRENT_CONFIG.wsHost}${storedUserId ? `?clientId=${storedUserId}` : ''}`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            UI.updateStatus('已连接');
            UI.enableSendButton();
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            UI.updateStatus('连接已断开');
            UI.disableSendButton();
            setTimeout(() => this.initializeWebSocket(), CURRENT_CONFIG.reconnectInterval);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            UI.updateStatus('连接错误');
            UI.disableSendButton();
        };

        this.ws.onmessage = this.handleMessage.bind(this);
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            
            if (!data.type) {
                console.warn('Message missing type:', data);
                return;
            }

            const handler = this.messageHandlers.get(data.type);
            if (handler) {
                handler(data);
            } else {
                console.warn('No handler for message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    registerHandler(type, handler) {
        if (typeof handler !== 'function') {
            console.error('Handler must be a function');
            return;
        }
        this.messageHandlers.set(type, handler);
        console.log(`Registered handler for type: ${type}`);
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('WebSocket is not open. Current state:', this.ws?.readyState);
        }
    }

    sendMessage(content, targetId = '') {
        this.send({
            type: 'message',
            content,
            targetId
        });
    }

    sendFile(file, targetId = '') {
        console.log('Starting file send process:', { 
            fileName: file.name, 
            fileSize: file.size, 
            targetId 
        });

        const reader = new FileReader();
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
        };

        reader.onload = (e) => {
            console.log('File read complete, preparing to send');
            try {
                const message = {
                    type: 'file',
                    name: file.name,
                    size: file.size,
                    data: e.target.result,
                    targetId
                };
                
                console.log('Sending file message:', { 
                    ...message, 
                    data: '[DATA]' 
                });

                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify(message));
                    console.log('File message sent successfully');
                } else {
                    console.error('WebSocket is not open. Current state:', this.ws.readyState);
                }
            } catch (error) {
                console.error('Error sending file:', error);
            }
        };

        reader.readAsDataURL(file);
    }

    rename(newName) {
        this.send({
            type: 'rename',
            newName
        });
    }
} 