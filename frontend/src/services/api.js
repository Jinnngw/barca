// API服务模块 - 封装后端接口调用
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 通过Vite代理访问HTTPS后端
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false // 明确设置不发送cookies
})

console.log('API实例创建完成，baseURL:', api.defaults.baseURL)

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('=== API请求开始 ===')
    console.log('baseURL:', config.baseURL)
    console.log('请求方法:', config.method?.toUpperCase())
    console.log('请求URL:', config.url)
    console.log('完整URL:', config.baseURL + config.url)
    console.log('请求数据:', config.data)
    console.log('请求头:', config.headers)
    console.log('=== API请求结束 ===')
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('=== API响应成功 ===')
    console.log('响应状态:', response.status)
    console.log('响应数据:', response.data)
    console.log('=== API响应结束 ===')
    return response
  },
  (error) => {
    console.error('=== API错误 ===')
    console.error('错误状态:', error.response?.status)
    console.error('错误数据:', error.response?.data)
    console.error('错误消息:', error.message)
    console.error('完整错误:', error)
    console.error('=== API错误结束 ===')
    return Promise.reject(error)
  }
)

// 会话管理API
export const sessionAPI = {
  // 1. 创建会话 - POST /api/v1/sessions/createSession?characterId=harry
  createSession(characterId) {
    console.log('创建会话 - characterId:', characterId)
    return api.post(`/v1/sessions/createSession?characterId=${characterId}`)
      .then(response => response.data)
  },

  // 2. 发送文本消息 - POST /api/v1/sessions/{sessionId}/messages
  sendTextMessage(sessionId, text) {
    console.log('发送文本消息 - sessionId:', sessionId, 'text:', text)
    return api.post(`/v1/sessions/${sessionId}/messages`, { text })
      .then(response => response.data)
  },

  // 3. 发送语音消息 - POST /api/v1/sessions/{sessionId}/audio
  sendAudioMessage(sessionId, audioFile) {
    console.log('发送语音消息 - sessionId:', sessionId, 'audioFile:', audioFile)
    const formData = new FormData()
    formData.append('audio', audioFile)
    
    return api.post(`/v1/sessions/${sessionId}/audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => response.data)
  }
}

// 媒体处理API
export const mediaAPI = {
  // 4. 语音转文本 (ASR) - POST /api/v1/media/asr
  speechToText(audioFile) {
    console.log('语音转文本 - audioFile:', audioFile)
    const formData = new FormData()
    formData.append('audio', audioFile)
    
    return api.post('/v1/media/asr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => response.data)
  },

  // 5. 文字转语音 (TTS) - POST /api/v1/media/tts
  textToSpeech(text) {
    console.log('文字转语音 - text:', text)
    return api.post('/v1/media/tts', { text }, {
      responseType: 'blob' // 接收音频文件
    }).then(response => {
      // 创建音频URL
      const audioUrl = URL.createObjectURL(response.data)
      return {
        audioUrl,
        audioBlob: response.data
      }
    })
  }
}

// 错误处理工具
export const handleAPIError = (error) => {
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response
    switch (status) {
      case 400:
        return `请求参数错误: ${data.message || 'Bad Request'}`
      case 401:
        return '未授权访问'
      case 403:
        return '禁止访问'
      case 404:
        return '资源不存在'
      case 500:
        return `服务器内部错误: ${data.message || 'Internal Server Error'}`
      default:
        return `请求失败 (${status}): ${data.message || 'Unknown Error'}`
    }
  } else if (error.request) {
    // 网络错误
    return '网络连接失败，请检查网络设置'
  } else {
    // 其他错误
    return `请求配置错误: ${error.message}`
  }
}

// 测试后端连接
export const testBackendConnection = async () => {
  try {
    console.log('=== 测试后端连接 ===')
    console.log('测试URL: /api (通过Vite代理访问HTTPS后端)')
    
    // 通过代理测试HTTPS后端连接
    const response = await fetch('/api/v1/sessions/createSession?characterId=test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('代理连接测试结果:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.text() // 改为text()因为后端返回的是text/plain
      console.log('代理连接响应数据:', data)
    } else {
      console.error('代理连接失败:', response.status, response.statusText)
    }
    
    console.log('=== 后端连接测试完成 ===')
    
  } catch (error) {
    console.error('=== 后端连接测试失败 ===')
    console.error('错误详情:', error)
    console.error('=== 后端连接测试失败结束 ===')
  }
}

// 导出默认实例
export default api
