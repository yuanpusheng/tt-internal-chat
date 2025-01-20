let ws;
let currentUserId = null;
let currentUserName = null;

const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const status = document.getElementById('status');
const messageTarget = document.getElementById('messageTarget');
const nameInput = document.getElementById('nameInput');
const userList = document.getElementById('userList');

// 初始化WebSocket连接
function initializeWebSocket() {
    // 从localStorage获取用户ID
    const storedUserId = localStorage.getItem('chatUserId');
    const storedUserName = localStorage.getItem('chatUserName');
    
    // 构建WebSocket URL，包含客户端ID
    const wsUrl = `ws://${window.location.host}${storedUserId ? `?clientId=${storedUserId}` : ''}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        status.textContent = '已连接到服务器';
        sendBtn.disabled = false;
    };

    ws.onmessage = async (message) => {
        try {
            let data;
            if (message.data instanceof Blob) {
                const text = await message.data.text();
                data = JSON.parse(text);
            } else {
                data = JSON.parse(message.data);
            }
            
            console.log('Received message type:', data.type);

            switch (data.type) {
                case 'welcome':
                    currentUserId = data.id;
                    // 如果localStorage中没有存储的用户名，则使用服务器分配的默认名称
                    currentUserName = localStorage.getItem('chatUserName') || data.name;
                    // 保存用户信息到localStorage
                    localStorage.setItem('chatUserId', currentUserId);
                    localStorage.setItem('chatUserName', currentUserName);
                    // 如果有存储的用户名，自动发送改名请求
                    if (localStorage.getItem('chatUserName')) {
                        ws.send(JSON.stringify({
                            type: 'rename',
                            newName: currentUserName
                        }));
                    }
                    displaySystemMessage(data.message);
                    nameInput.placeholder = `当前用户名: ${data.name}`;
                    break;
                    
                case 'renameConfirm':
                    currentUserName = data.newName;
                    localStorage.setItem('chatUserName', currentUserName);
                    displaySystemMessage(`你的昵称已更改为：${currentUserName}`);
                    break;
                    
                case 'userList':
                    updateUserList(data.users);
                    break;
                
                case 'system':
                    displaySystemMessage(data.message);
                    break;
                
                case 'message':
                    // 显示消息
                    const isFromMe = data.sender === currentUserName;
                    const displayName = isFromMe ? '我' : data.sender;
                    displayMessage(
                        displayName, 
                        data.content, 
                        false, 
                        data.isPrivate ? (isFromMe ? data.targetName : '私信') : null
                    );
                    break;
                
                case 'file':
                    if (data.senderId !== currentUserId) {
                        handleReceivedFile(data);
                    }
                    break;
            }
        } catch (err) {
            console.error('Message processing error:', err);
        }
    };

    ws.onclose = () => {
        status.textContent = '连接断开';
        sendBtn.disabled = true;
        // 5秒后尝试重新连接
        setTimeout(initializeWebSocket, 5000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        status.textContent = '连接错误';
    };
}

// 更新用户列表
function updateUserList(users) {
    console.log('Updating user list:', users);
    userList.innerHTML = '';
    messageTarget.innerHTML = '<option value="">发送给：所有人</option>';
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.classList.add('online-user');
        
        if (user.id === currentUserId) {
            userElement.classList.add('current-user');
            userElement.innerHTML = `
                <span class="status-indicator online"></span>
                <span class="user-name">
                    ${user.name} <span class="user-tag">(我)</span>
                </span>
            `;
            userElement.onclick = showRenameDialog;
        } else {
            userElement.innerHTML = `
                <span class="status-indicator ${user.status !== 'offline' ? 'online' : 'offline'}"></span>
                <span class="user-name">${user.name}</span>
            `;
            userElement.onclick = () => {
                messageTarget.value = user.id;
                document.querySelectorAll('.online-user').forEach(el => 
                    el.classList.remove('selected'));
                userElement.classList.add('selected');
            };
            
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            messageTarget.appendChild(option);
        }
        
        userList.appendChild(userElement);
    });
}

// 修改昵称对话框函数
function showRenameDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'rename-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <h3>修改昵称</h3>
            <input type="text" id="newNameInput" placeholder="输入新的昵称" maxlength="20" value="${currentUserName}">
            <div class="dialog-buttons">
                <button id="confirmRename">确定</button>
                <button id="cancelRename">取消</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    const newNameInput = dialog.querySelector('#newNameInput');
    const confirmBtn = dialog.querySelector('#confirmRename');
    const cancelBtn = dialog.querySelector('#cancelRename');
    
    newNameInput.focus();
    newNameInput.select();
    
    confirmBtn.onclick = () => {
        const newName = newNameInput.value.trim();
        if (newName) {
            ws.send(JSON.stringify({
                type: 'rename',
                newName: newName
            }));
        }
        document.body.removeChild(dialog);
    };
    
    // 取消修改
    cancelBtn.onclick = () => {
        document.body.removeChild(dialog);
    };
    
    // 点击外部关闭弹窗
    dialog.onclick = (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
        }
    };
    
    // 按ESC关闭弹窗
    document.addEventListener('keydown', function closeDialog(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(dialog);
            document.removeEventListener('keydown', closeDialog);
        }
    });
}

// 文件输入变化时的处理
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (file.size > maxSize) {
            alert(`文件大小不能超过 ${formatFileSize(maxSize)}`);
            fileInput.value = '';
            return;
        }

        // 直接开始发送文件
        sendFile(file);
    }
});

// 发送文件函数
function sendFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const targetId = messageTarget.value;
        const targetName = targetId 
            ? messageTarget.options[messageTarget.selectedIndex].text 
            : '所有人';

        const fileData = {
            type: 'file',
            name: file.name,
            size: file.size,
            data: e.target.result,
            targetId: targetId
        };

        ws.send(JSON.stringify(fileData));
        
        const confirmMessage = targetId 
            ? `发送文件给 ${targetName}: ${file.name} (${formatFileSize(file.size)})` 
            : `发送文件给所有人: ${file.name} (${formatFileSize(file.size)})`;
        
        displayMessage('我', confirmMessage, true, targetId ? targetName : null);
        
        fileInput.value = '';
    };

    reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('文件读取失败，请重试');
    };

    reader.readAsDataURL(file);
}

// 发送消息按钮点击事件
sendBtn.addEventListener('click', sendMessage);

// 输入框回车事件
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 发送消息函数
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        const targetId = messageTarget.value;
        ws.send(JSON.stringify({
            type: 'message',
            content: message,
            targetId: targetId
        }));
        messageInput.value = '';
    }
}

// 监听输入框变化来启用/禁用发送按钮
messageInput.addEventListener('input', () => {
    sendBtn.disabled = !messageInput.value.trim();
});

// 处理接收到的文件
function handleReceivedFile(fileData) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    const time = new Date().toLocaleTimeString();
    messageElement.innerHTML = `
        <span class="time">[${time}]</span>
        <strong>${fileData.senderName || '对方'}:</strong> 
    `;
    
    const fileContainer = document.createElement('div');
    fileContainer.className = 'file-message';
    
    const fileInfo = document.createElement('span');
    fileInfo.textContent = `文件: ${fileData.name} (${formatFileSize(fileData.size)})`;
    fileContainer.appendChild(fileInfo);
    
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '下载';
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = fileData.data;
        link.download = fileData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    fileContainer.appendChild(downloadBtn);
    
    messageElement.appendChild(fileContainer);
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

// 更新显示消息的函数
function displayMessage(sender, content, isFile = false, privateTarget = null) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (sender === '我') {
        messageElement.classList.add('message-self');
    }
    
    if (privateTarget) {
        messageElement.classList.add('private-message');
    }

    const time = new Date().toLocaleTimeString();
    let messageContent = `
        <span class="time">[${time}]</span>
        <strong>${sender}${privateTarget ? ` → ${privateTarget}` : ''}</strong>: 
    `;

    if (isFile) {
        messageContent += `
            <div class="file-message">
                <span class="file-info">${content}</span>
                ${privateTarget ? `<span class="target-info">(私密文件)</span>` : ''}
            </div>
        `;
    } else {
        messageContent += `
            <span class="content">${content}</span>
            ${privateTarget ? `<span class="target-info">(私聊)</span>` : ''}
        `;
    }

    messageElement.innerHTML = messageContent;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

function displaySystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('system-message');
    const time = new Date().toLocaleTimeString();
    messageElement.innerHTML = `
        <span class="time">[${time}]</span>
        <span class="content">${message}</span>
    `;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 页面加载时初始化WebSocket连接
document.addEventListener('DOMContentLoaded', initializeWebSocket);