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

        // 配置分片上传参数
        const CHUNK_SIZE = 1024 * 1024; // 1MB 分片大小
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let currentChunk = 0;
        let fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9); // 生成唯一文件ID
        
        // 创建进度显示元素
        let progressElement = document.getElementById('upload-progress');
        if (!progressElement) {
            progressElement = document.createElement('div');
            progressElement.id = 'upload-progress';
            progressElement.style.display = 'none';
            progressElement.innerHTML = '<div class="progress-bar"></div><div class="progress-text"></div>';
            document.body.appendChild(progressElement);
            
            // 添加样式
            const style = document.createElement('style');
            style.textContent = `
                #upload-progress {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    z-index: 1000;
                    width: 250px;
                }
                .progress-bar {
                    height: 6px;
                    background: #4CAF50;
                    width: 0%;
                    border-radius: 3px;
                    margin: 5px 0;
                    transition: width 0.3s;
                }
                .progress-text {
                    font-size: 12px;
                }
            `;
            document.head.appendChild(style);
        }
        
        const progressBar = progressElement.querySelector('.progress-bar');
        const progressText = progressElement.querySelector('.progress-text');
        
        // 显示进度条
        progressElement.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '准备上传...';
        
        // 先移除可能存在的旧处理程序
        if (this.messageHandlers.has('upload_progress')) {
            this.messageHandlers.delete('upload_progress');
        }
        
        // 注册上传进度处理程序
        const uploadProgressHandler = (data) => {
            if (data.fileId === fileId) {
                progressBar.style.width = data.progress + '%';
                progressText.textContent = `服务器接收中 ${data.progress}%`;
                
                // 如果上传完成，移除处理程序并重置进度条
                if (data.progress >= 100) {
                    this.messageHandlers.delete('upload_progress');
                    setTimeout(() => {
                        progressElement.style.display = 'none';
                        // 重置进度条状态，以便下次上传
                        progressBar.style.width = '0%';
                        progressText.textContent = '';
                    }, 3000);
                }
            }
        };
        
        // 注册上传进度处理程序
        this.registerHandler('upload_progress', uploadProgressHandler);
        
        // 分片读取并发送文件
        const sendNextChunk = () => {
            if (currentChunk >= totalChunks) {
                console.log('File upload complete');
                progressText.textContent = '上传完成，等待服务器处理...';
                // 确保在完成后重置处理程序状态
                setTimeout(() => {
                    // 如果3秒后仍然显示此消息，则清除它
                    if (progressText.textContent === '上传完成，等待服务器处理...') {
                        progressElement.style.display = 'none';
                        progressBar.style.width = '0%';
                        progressText.textContent = '';
                    }
                }, 5000);
                return;
            }
            
            const start = currentChunk * CHUNK_SIZE;
            const end = Math.min(file.size, start + CHUNK_SIZE);
            const chunk = file.slice(start, end);
            
            const reader = new FileReader();
            
            reader.onerror = (error) => {
                console.error('Error reading file chunk:', error);
                progressText.textContent = '上传出错';
            };
            
            reader.onload = (e) => {
                try {
                    // 正确处理二进制数据
                    const arrayBuffer = e.target.result;
                    const bytes = new Uint8Array(arrayBuffer);
                    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
                    const base64Data = btoa(binary);
                    
                    const message = {
                        type: 'file_chunk',
                        fileId: fileId,
                        name: file.name,
                        size: file.size,
                        chunkIndex: currentChunk,
                        totalChunks: totalChunks,
                        data: base64Data,
                        targetId
                    };
                    
                    console.log('Sending file chunk:', { 
                        ...message, 
                        data: '[DATA]',
                        chunkIndex: currentChunk,
                        totalChunks: totalChunks
                    });
                    
                    if (this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify(message));
                        
                        // 更新客户端进度
                        currentChunk++;
                        const progress = Math.round((currentChunk / totalChunks) * 100);
                        progressBar.style.width = progress + '%';
                        progressText.textContent = `上传中 ${progress}%`;
                        
                        // 发送下一个分片
                        setTimeout(sendNextChunk, 50); // 添加小延迟避免浏览器卡顿
                    } else {
                        console.error('WebSocket is not open. Current state:', this.ws.readyState);
                        progressText.textContent = '连接已断开';
                    }
                } catch (error) {
                    console.error('Error sending file chunk:', error);
                    progressText.textContent = '上传出错';
                }
            };
            
            // 使用readAsArrayBuffer代替readAsDataURL
            reader.readAsArrayBuffer(chunk);
        };
        
        // 开始发送第一个分片
        sendNextChunk();
    }

    rename(newName) {
        this.send({
            type: 'rename',
            newName
        });
    }
}