class UI {
    static elements = {
        messages: document.getElementById('messages'),
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn'),
        fileInput: document.getElementById('fileInput'),
        status: document.getElementById('status'),
        messageTarget: document.getElementById('messageTarget'),
        userList: document.getElementById('userList')
    };

    static updateStatus(text) {
        this.elements.status.textContent = text;
    }

    static updateUserList(users, currentUserId) {
        console.log('Updating UI user list:', users, 'currentUserId:', currentUserId);
        const userList = this.elements.userList;
        const messageTarget = this.elements.messageTarget;
        
        if (!userList || !messageTarget) {
            console.error('User list or message target elements not found');
            return;
        }

        // 清空现有列表
        userList.innerHTML = '';
        messageTarget.innerHTML = '<option value="">发送给：所有人</option>';

        users.forEach(user => {
            // 创建用户元素
            const userDiv = document.createElement('div');
            userDiv.className = `online-user ${user.id === currentUserId ? 'current-user' : ''}`;
            
            // 添加用户状态和名称
            userDiv.innerHTML = `
                <span class="status-indicator ${user.status || 'online'}"></span>
                <span class="user-name">
                    ${user.name}
                    ${user.id === currentUserId ? '<span class="user-tag">(我)</span>' : ''}
                </span>
            `;

            // 为当前用户添加点击修改昵称功能
            if (user.id === currentUserId) {
                userDiv.onclick = () => this.promptRename();
            }

            // 为其他用户添加点击选择私聊功能
            else {
                userDiv.onclick = () => {
                    messageTarget.value = user.id;
                    document.querySelectorAll('.online-user').forEach(el => 
                        el.classList.remove('selected'));
                    userDiv.classList.add('selected');
                };
            }

            userList.appendChild(userDiv);

            // 添加到私聊选择下拉框
            if (user.id !== currentUserId) {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `发送给：${user.name}`;
                messageTarget.appendChild(option);
            }
        });
    }

    static displayMessage(sender, content, isFromMe = false, privateTarget = null, file = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isFromMe ? 'message-self' : ''} ${privateTarget ? 'private-message' : ''}`;
        
        const time = new Date().toLocaleTimeString();
        let messageContent = content;

        if (file) {
            messageContent = `
                <div class="file-message">
                    <div class="file-info">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                        <span>${file.name}</span>
                    </div>
                </div>`;
        }

        messageDiv.innerHTML = `
            <span class="time">${time}</span>
            <strong>${sender}</strong>
            ${privateTarget ? `<span class="target-info">[私信${privateTarget}]</span>` : ''}
            <div class="content">${messageContent}</div>
        `;

        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    static promptRename() {
        const modal = document.getElementById('renameModal');
        const input = document.getElementById('newNameInput');
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');

        const closeModal = () => {
            modal.classList.remove('show');
            input.value = '';
        };

        const handleRename = () => {
            const newName = input.value.trim();
            if (newName) {
                chatWs.rename(newName);
                closeModal();
            } else {
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 1000);
            }
        };

        // 显示模态框
        modal.classList.add('show');
        input.focus();

        // 事件监听
        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;
        confirmBtn.onclick = handleRename;
        
        // 按键事件
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                handleRename();
            }
        };

        // 点击外部关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
    }

    static enableSendButton() {
        this.elements.sendBtn.disabled = false;
    }

    static disableSendButton() {
        this.elements.sendBtn.disabled = true;
    }
} 