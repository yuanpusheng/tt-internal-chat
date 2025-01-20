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

        // 检查是否是文件消息
        if (file && typeof file === 'object') {
            try {
                if (!file.data) {
                    throw new Error('No file data provided');
                }

                // 创建一个 Blob 对象并生成 URL
                const blob = this.dataURLtoBlob(file.data);
                const blobUrl = URL.createObjectURL(blob);
                
                // 创建文件消息元素
                const fileMessageDiv = document.createElement('div');
                fileMessageDiv.className = 'file-message';
                
                // 构建文件信息 HTML
                fileMessageDiv.innerHTML = `
                    <div class="file-info">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                        <span>${this.escapeHtml(file.name)}</span>
                    </div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                `;

                // 只为非发送者创建下载链接
                if (!isFromMe) {
                    const downloadLink = document.createElement('a');
                    downloadLink.href = blobUrl;
                    downloadLink.download = file.name;
                    downloadLink.className = 'download-link';
                    downloadLink.target = '_blank';
                    downloadLink.innerHTML = `
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        下载
                    `;
                    fileMessageDiv.querySelector('.file-info').appendChild(downloadLink);
                }
                
                messageContent = fileMessageDiv.outerHTML;

                // 设置 URL 释放定时器
                setTimeout(() => {
                    try {
                        URL.revokeObjectURL(blobUrl);
                    } catch (e) {
                        console.error('Error revoking blob URL:', e);
                    }
                }, 5 * 60 * 1000);
            } catch (e) {
                console.error('Error creating file message:', e);
                messageContent = `<div class="file-message error">文件处理失败: ${e.message}</div>`;
            }
        }

        messageDiv.innerHTML = `
            <span class="time">${time}</span>
            <strong>${this.escapeHtml(sender)}</strong>
            ${privateTarget ? `<span class="target-info">[私信${this.escapeHtml(privateTarget)}]</span>` : ''}
            <div class="content">${messageContent}</div>
        `;

        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    static formatFileSize(bytes) {
        if (!bytes || isNaN(bytes)) return '未知大小';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

    // 添加 DataURL 转 Blob 的辅助方法
    static dataURLtoBlob(dataURL) {
        try {
            const arr = dataURL.split(',');
            if (arr.length !== 2) {
                throw new Error('Invalid Data URL format');
            }
            
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            while(n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            return new Blob([u8arr], {type: mime});
        } catch (e) {
            console.error('Error converting dataURL to Blob:', e);
            throw e;
        }
    }

    // 添加 HTML 转义函数
    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
} 