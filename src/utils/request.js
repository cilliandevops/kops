import axios from 'axios';

const httpClient = axios.create({
    validateStatus(status) {
        return status >= 200 && status < 504 // 设置默认的合法的状态
    },
    timeout: 60000
});


httpClient.defaults.retry = 3 // 请求重试次数
httpClient.defaults.retryDelay = 1000 // 请求重试时间间隔
httpClient.defaults.shouldRetry = true // 是否重试

httpClient.interceptors.request.use(
    config => {
        config.headers['Content-Type'] = 'application/json'
        config.headers['Accept-Language'] = 'zh-CN'
        config.headers['Authorization'] = localStorage.getItem('token') // 可以全局设置接口请求header中带token
        if (config.method === 'post') {
            if (!config.data) { // 没有参数时，config.data为null，需要转下类型
                config.data = {}
            }
            // config.data = JSON.stringify(config.data) // qs序列化参数
        }
        return config
    },
    error => {
        Promise.reject(error)
    }
);

httpClient.interceptors.response.use(
    response => {
        if (response.status !== 200) {
            return Promise.reject(response.data)
        } else {
            return response.data
        }
    },
    err => {
        return Promise.reject(err)
    }
);

export default httpClient;