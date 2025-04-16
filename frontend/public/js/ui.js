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
            // 检查是否是有效的 Data URL 格式
            if (!dataURL || typeof dataURL !== 'string') {
                return new Blob([], {type: 'application/octet-stream'});
            }
            
            // 辅助函数：验证并清理base64字符串
            const cleanAndValidateBase64 = (base64Str) => {
                if (!base64Str) return '';
                // 移除所有非base64字符（包括空格、换行符等）
                const cleaned = base64Str.replace(/[^A-Za-z0-9+/=]/g, '');
                
                // 验证base64字符串长度是否为4的倍数，如果不是，尝试补齐
                let paddedStr = cleaned;
                const remainder = cleaned.length % 4;
                if (remainder > 0) {
                    paddedStr = cleaned + '='.repeat(4 - remainder);
                }
                
                return paddedStr;
            };
            
            // 辅助函数：安全的atob调用
            const safeAtob = (base64Str) => {
                if (!base64Str) return '';
                try {
                    return atob(base64Str);
                } catch (error) {
                    // 如果解码失败，尝试清理并验证字符串后再次尝试
                    const cleanedStr = cleanAndValidateBase64(base64Str);
                    try {
                        return atob(cleanedStr);
                    } catch (finalError) {
                        // 降级处理，避免错误日志
                        return '';
                    }
                }
            };
            
            // 辅助函数：创建Blob对象
            const createBlobFromString = (binaryString, mimeType = 'application/octet-stream') => {
                if (!binaryString) {
                    return new Blob([], {type: mimeType});
                }
                
                try {
                    const len = binaryString.length;
                    const u8arr = new Uint8Array(len);
                    
                    for (let i = 0; i < len; i++) {
                        u8arr[i] = binaryString.charCodeAt(i);
                    }
                    
                    return new Blob([u8arr], {type: mimeType});
                } catch (e) {
                    return new Blob([], {type: mimeType});
                }
            };
            
            // 检查数据是否已经是纯base64格式（没有Data URL前缀）
            if (!dataURL.includes(',') && !dataURL.includes(';base64,')) {
                // 假设这是纯base64数据，使用通用MIME类型
                const cleanBase64 = cleanAndValidateBase64(dataURL);
                const binaryString = safeAtob(cleanBase64);
                return createBlobFromString(binaryString);
            }
            
            // 尝试分割数据URL
            const arr = dataURL.split(',');
            
            // 如果分割失败或格式不正确，尝试作为纯base64处理
            if (arr.length !== 2) {
                const cleanData = cleanAndValidateBase64(dataURL);
                const binaryString = safeAtob(cleanData);
                return createBlobFromString(binaryString);
            }
            
            // 正常处理标准格式的Data URL
            const header = arr[0];
            let mime = 'application/octet-stream'; // 默认MIME类型
            let base64 = arr[1].trim();
            
            // 尝试从头部提取MIME类型
            if (header.includes('base64')) {
                const mimeMatch = header.match(/:(.*?);/);
                if (mimeMatch && mimeMatch[1]) {
                    mime = mimeMatch[1];
                }
            } else if (base64) {
                // 如果头部没有base64标识但有数据部分，尝试直接处理数据部分
                const binaryString = safeAtob(cleanAndValidateBase64(base64));
                return createBlobFromString(binaryString, mime);
            }
            
            // 检查base64部分是否为空
            if (!base64) {
                return new Blob([], {type: mime});
            }
            
            // 尝试标准处理
            const cleanBase64 = cleanAndValidateBase64(base64);
            const binaryString = safeAtob(cleanBase64);
            
            if (binaryString) {
                return createBlobFromString(binaryString, mime);
            }
            
            // 尝试URL安全的base64变体
            const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_');
            const safeCleanBase64 = cleanAndValidateBase64(urlSafeBase64);
            const safeBinaryString = safeAtob(safeCleanBase64);
            
            return createBlobFromString(safeBinaryString, mime);
        } catch (e) {
            // 静默处理所有错误，返回空Blob
            return new Blob([], {type: 'application/octet-stream'});
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