let chatWs;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // 添加日志
    
    chatWs = new ChatWebSocket();
    
    // 注册消息处理器
    chatWs.registerHandler('welcome', handleWelcome);
    chatWs.registerHandler('message', handleMessage);
    chatWs.registerHandler('userList', handleUserList);
    chatWs.registerHandler('renameConfirm', handleRenameConfirm);
    
    console.log('Handlers registered'); // 添加日志
    
    // 事件监听器
    UI.elements.sendBtn.addEventListener('click', handleSendMessage);
    UI.elements.messageInput.addEventListener('keypress', handleKeyPress);
    UI.elements.fileInput.addEventListener('change', handleFileSelect);
    UI.elements.messageInput.addEventListener('input', handleInput);

    // 添加调试日志
    console.log('File input element:', UI.elements.fileInput);
    UI.elements.fileInput.addEventListener('click', () => {
        console.log('File input clicked');
    });
});

// 消息处理函数
function handleWelcome(data) {
    chatWs.currentUserId = data.id;
    chatWs.currentUserName = localStorage.getItem('chatUserName') || data.name;
    
    localStorage.setItem('chatUserId', chatWs.currentUserId);
    localStorage.setItem('chatUserName', chatWs.currentUserName);
    
    if (localStorage.getItem('chatUserName')) {
        chatWs.rename(chatWs.currentUserName);
    }
    
    UI.updateStatus('已连接');
}

function handleMessage(data) {
    const isFromMe = data.sender === chatWs.currentUserName;
    const displayName = isFromMe ? '我' : data.sender;
    UI.displayMessage(
        displayName,
        data.content,
        isFromMe,
        data.isPrivate ? (isFromMe ? data.targetName : '私信') : null,
        data.file
    );
}

function handleUserList(data) {
    console.log('Received user list:', data.users); // 添加日志
    if (!Array.isArray(data.users)) {
        console.error('Invalid user list data:', data);
        return;
    }
    UI.updateUserList(data.users, chatWs.currentUserId);
}

function handleRenameConfirm(data) {
    chatWs.currentUserName = data.newName;
    localStorage.setItem('chatUserName', chatWs.currentUserName);
    UI.updateStatus(`昵称已更改为：${chatWs.currentUserName}`);
}

// 事件处理函数
function handleSendMessage() {
    const message = UI.elements.messageInput.value.trim();
    if (message) {
        chatWs.sendMessage(message, UI.elements.messageTarget.value);
        UI.elements.messageInput.value = '';
        UI.elements.sendBtn.disabled = true;
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
}

function handleFileSelect(e) {
    console.log('File select triggered', e);
    const file = e.target.files[0];
    if (file) {
        console.log('Selected file:', file);
        const maxSize = CURRENT_CONFIG.maxFileSize;
        if (file.size > maxSize) {
            alert(`文件大小不能超过 ${formatFileSize(maxSize)}`);
            e.target.value = '';
            return;
        }
        chatWs.sendFile(file, UI.elements.messageTarget.value);
    }
}

function handleInput() {
    UI.elements.sendBtn.disabled = !UI.elements.messageInput.value.trim();
} 