const CONFIG = {
    development: {
        wsHost: '10.200.21.115:3000/ws',
        wsProtocol: 'ws:',
        reconnectInterval: 3000,
        maxFileSize: 10 * 1024 * 1024  // 10MB
    },
    test: {
        wsHost: 'test-api.example.com/ws',
        wsProtocol: 'wss:',
        reconnectInterval: 5000,
        maxFileSize: 20 * 1024 * 1024  // 20MB
    },
    production: {
        wsHost: window.location.host,
        wsProtocol: window.location.protocol === 'https:' ? 'wss:' : 'ws:',
        reconnectInterval: 5000,
        maxFileSize: 50 * 1024 * 1024  // 50MB
    }
}; 

// 根据环境选择配置
const ENV = 'development';
// 将配置导出到全局变量
window.CURRENT_CONFIG = CONFIG[ENV]; 