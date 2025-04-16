const CONFIG = {
    development: {
        wsHost: '10.200.21.246:9999/ws',
        wsProtocol: 'ws:',
        reconnectInterval: 3000,
        maxFileSize: 100 * 1024 * 1024  // 100MB
    },
    test: {
        wsHost: 'test-api.example.com/ws',
        wsProtocol: 'wss:',
        reconnectInterval: 5000,
        maxFileSize: 200 * 1024 * 1024  // 200MB
    },
    production: {
        wsHost: window.location.host,
        wsProtocol: window.location.protocol === 'https:' ? 'wss:' : 'ws:',
        reconnectInterval: 5000,
        maxFileSize: 500 * 1024 * 1024  // 500MB
    }
}; 

// 根据环境选择配置
const ENV = 'development';
// 将配置导出到全局变量
window.CURRENT_CONFIG = CONFIG[ENV]; 