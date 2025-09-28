// API服务模块 - 封装后端接口调用
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api', // 使用本地服务器API
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
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
  // 发送文本消息 - POST /api/v1/sessions/{sessionId}/messages
  sendTextMessage(sessionId, text) {
    console.log('发送文本消息 - sessionId:', sessionId, 'text:', text)
    return api.post(`/v1/sessions/${sessionId}/messages`, { text })
      .then(response => response.data)
  },

  // 3. 发送语音消息 - POST /api/v1/sessions/{sessionId}/audio
  async sendAudioMessage(sessionId, audioFile) {
    console.log('发送语音消息 - sessionId:', sessionId, 'audioFile:', audioFile)
    
    const maxRetries = 3
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`尝试发送语音消息 (第${attempt}次)`)
        
        // 首先尝试Base64 JSON格式
        try {
          const result = await this.sendAudioAsBase64(sessionId, audioFile)
          console.log('语音消息发送成功 (Base64格式):', result)
          return result
        } catch (base64Error) {
          console.warn('Base64格式发送失败，尝试FormData格式:', base64Error.message)
          
          // 如果Base64失败，降级到FormData格式
          const result = await this.sendAudioAsFormData(sessionId, audioFile)
          console.log('语音消息发送成功 (FormData格式):', result)
          return result
        }
        
      } catch (error) {
        lastError = error
        console.error(`第${attempt}次尝试失败:`, error.message)
        
        if (attempt < maxRetries) {
          console.log(`等待${attempt * 1000}ms后重试...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        }
      }
    }
    
    console.error('发送音频失败，已重试', maxRetries, '次:', lastError)
    throw lastError
  },

  // 使用Base64 JSON格式发送音频
  async sendAudioAsBase64(sessionId, audioFile) {
    // 将音频文件转换为Base64字符串
    const base64Audio = await this.convertAudioToBase64(audioFile)
    console.log('音频文件转换为Base64完成，数据长度:', base64Audio.length)
    
    // 获取音频格式
    const audioFormat = this.getAudioFormat(audioFile)
    console.log('检测到的音频格式:', audioFormat)
    
    // 发送JSON数据
    const response = await fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        audioData: base64Audio,
        audioFormat: audioFormat,
        audioSize: audioFile.size
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // 使用FormData格式发送音频
  async sendAudioAsFormData(sessionId, audioFile) {
    const formData = new FormData()
    formData.append('audio', audioFile) // 参数名必须是 'audio'
    
    const response = await fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/audio`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
      // 注意：不要设置 Content-Type，让浏览器自动设置
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // 将音频文件转换为Base64字符串
  async convertAudioToBase64(audioFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        try {
          // 获取Base64数据（移除data:audio/...;base64,前缀）
          const base64String = reader.result.split(',')[1]
          console.log('音频文件转换为Base64成功，原始大小:', audioFile.size, 'Base64长度:', base64String.length)
          resolve(base64String)
        } catch (error) {
          console.error('处理Base64数据失败:', error)
          reject(error)
        }
      }
      
      reader.onerror = (error) => {
        console.error('读取音频文件失败:', error)
        reject(error)
      }
      
      // 以Base64格式读取文件
      reader.readAsDataURL(audioFile)
    })
  },

  // 获取音频文件格式
  getAudioFormat(audioFile) {
    const mimeType = audioFile.type
    console.log('音频文件MIME类型:', mimeType)
    
    // 根据MIME类型确定格式
    const formatMap = {
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/wave': '.wav',
      'audio/x-wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/mp4': '.m4a',
      'audio/m4a': '.m4a',
      'audio/aac': '.aac',
      'audio/webm': '.webm',
      'audio/webm;codecs=opus': '.webm'
    }
    
    const format = formatMap[mimeType] || '.mp3' // 默认使用.mp3
    console.log('映射的音频格式:', format)
    return format
  }
}

// 媒体处理API
export const mediaAPI = {
  // 4. 语音转文本 (ASR) - POST /api/v1/media/asr
  async speechToText(audioFile) {
    console.log('语音转文本 - audioFile:', audioFile)
    
    try {
      // 首先尝试Base64 JSON格式
      try {
        const result = await this.speechToTextAsBase64(audioFile)
        console.log('ASR成功 (Base64格式):', result)
        return result
      } catch (base64Error) {
        console.warn('ASR Base64格式失败，尝试FormData格式:', base64Error.message)
        
        // 如果Base64失败，降级到FormData格式
        const result = await this.speechToTextAsFormData(audioFile)
        console.log('ASR成功 (FormData格式):', result)
        return result
      }
      
    } catch (error) {
      console.error('ASR失败:', error)
      throw error
    }
  },

  // 使用Base64 JSON格式进行ASR
  async speechToTextAsBase64(audioFile) {
    // 将音频文件转换为Base64字符串
    const base64Audio = await sessionAPI.convertAudioToBase64(audioFile)
    console.log('ASR音频文件转换为Base64完成，数据长度:', base64Audio.length)
    
    // 获取音频格式
    const audioFormat = sessionAPI.getAudioFormat(audioFile)
    console.log('ASR检测到的音频格式:', audioFormat)
    
    // 发送JSON数据
    return api.post('/v1/media/asr', {
      audioData: base64Audio,
      audioFormat: audioFormat,
      audioSize: audioFile.size
    }).then(response => response.data)
  },

  // 使用FormData格式进行ASR
  async speechToTextAsFormData(audioFile) {
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

// 测试音频格式更改
export const testAudioFormatChange = () => {
  console.log('=== 测试音频格式更改 ===')
  
  // 创建不同MIME类型的测试Blob
  const testBlobs = [
    new Blob(['test'], { type: 'audio/mpeg' }),
    new Blob(['test'], { type: 'audio/wav' }),
    new Blob(['test'], { type: 'audio/ogg' }),
    new Blob(['test'], { type: 'audio/mp4' }),
    new Blob(['test'], { type: 'audio/webm' }),
    new Blob(['test'], { type: 'unknown/format' }) // 测试默认值
  ]
  
  testBlobs.forEach((blob, index) => {
    const format = sessionAPI.getAudioFormat(blob)
    console.log(`测试 ${index + 1}:`, {
      mimeType: blob.type,
      detectedFormat: format
    })
  })
  
  console.log('=== 音频格式测试完成 ===')
  console.log('现在所有格式都使用点号前缀，默认格式为 .mp3')
  
  return true
}

// 测试音频文件转Base64功能
export const testAudioToBase64Conversion = async () => {
  try {
    console.log('=== 测试音频文件转Base64功能 ===')
    
    // 创建一个测试音频Blob
    const testAudioBlob = new Blob(['test audio data'], { type: 'audio/wav' })
    
    // 测试转换
    const base64Data = await sessionAPI.convertAudioToBase64(testAudioBlob)
    console.log('音频转Base64成功:', {
      originalSize: testAudioBlob.size,
      base64Length: base64Data.length,
      base64Preview: base64Data.substring(0, 50) + '...'
    })
    
    // 测试格式检测
    const format = sessionAPI.getAudioFormat(testAudioBlob)
    console.log('音频格式检测成功:', format)
    
    console.log('=== 音频文件转Base64测试完成 ===')
    return true
    
  } catch (error) {
    console.error('=== 音频文件转Base64测试失败 ===')
    console.error('错误详情:', error)
    return false
  }
}

// 测试base64音频解码功能
export const testBase64AudioDecoding = async () => {
  try {
    console.log('=== 测试base64音频解码功能 ===')
    
    // 创建一个更简单的测试音频数据（使用data URL格式）
    const testAudioData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
    
    // 动态导入音频解码器
    const { audioDecoder } = await import('../utils/audioDecoder')
    
    console.log('开始解码测试音频...')
    
    // 提取纯base64数据
    const base64Data = testAudioData.split(',')[1]
    
    // 测试解码
    const audioUrl = await audioDecoder.decodeBase64Audio(base64Data, 'wav', 'test-audio')
    console.log('测试音频解码成功:', audioUrl)
    
    // 测试创建音频元素
    const audio = await audioDecoder.createAudioElement(audioUrl)
    console.log('测试音频元素创建成功:', {
      duration: audio.duration,
      src: audio.src,
      readyState: audio.readyState
    })
    
    // 清理测试资源
    setTimeout(() => {
      audioDecoder.cleanup('test-audio')
      console.log('测试资源已清理')
    }, 3000)
    
    console.log('=== base64音频解码测试完成 ===')
    return true
    
  } catch (error) {
    console.error('=== base64音频解码测试失败 ===')
    console.error('错误详情:', error)
    return false
  }
}

// 测试音频发送格式兼容性
export const testAudioSendingCompatibility = async () => {
  try {
    console.log('=== 测试音频发送格式兼容性 ===')
    
    // 创建一个测试音频Blob
    const testAudioBlob = new Blob(['test audio data'], { type: 'audio/wav' })
    
    console.log('测试音频Blob:', {
      size: testAudioBlob.size,
      type: testAudioBlob.type
    })
    
    // 测试Base64转换
    const base64Data = await sessionAPI.convertAudioToBase64(testAudioBlob)
    console.log('Base64转换成功:', {
      base64Length: base64Data.length,
      base64Preview: base64Data.substring(0, 50) + '...'
    })
    
    // 测试格式检测
    const format = sessionAPI.getAudioFormat(testAudioBlob)
    console.log('格式检测成功:', format)
    
    console.log('=== 音频发送格式兼容性测试完成 ===')
    console.log('系统将自动尝试两种格式：')
    console.log('1. Base64 JSON格式 (优先)')
    console.log('2. FormData格式 (降级)')
    
    return true
    
  } catch (error) {
    console.error('=== 音频发送格式兼容性测试失败 ===')
    console.error('错误详情:', error)
    return false
  }
}

// 测试后端连接
export const testBackendConnection = async () => {
  try {
    console.log('=== 测试后端连接 ===')
    console.log('测试URL: http://localhost:8080/api')
    
    // 先测试服务器是否可达
    console.log('测试服务器连通性...')
    try {
      const pingResponse = await fetch('http://localhost:8080/', {
        method: 'GET',
        mode: 'no-cors' // 避免CORS问题
      })
      console.log('服务器连通性测试完成')
    } catch (pingError) {
      console.warn('服务器连通性测试失败:', pingError.message)
    }
    
    // 先测试OPTIONS请求（CORS预检）
    console.log('测试CORS预检请求...')
    const optionsResponse = await fetch('http://localhost:8080/api/v1/sessions', {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    })
    
    console.log('CORS预检结果:', optionsResponse.status, optionsResponse.statusText)
    
    // 然后测试实际的POST请求
    console.log('测试POST请求...')
    const response = await fetch('http://localhost:8080/api/v1/sessions?characterId=test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    console.log('远程服务器连接测试结果:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.text() // 改为text()因为后端返回的是text/plain
      console.log('远程服务器响应数据:', data)
    } else {
      console.error('远程服务器连接失败:', response.status, response.statusText)
    }
    
    console.log('=== 后端连接测试完成 ===')
    
  } catch (error) {
    console.error('=== 后端连接测试失败 ===')
    console.error('错误类型:', error.name)
    console.error('错误消息:', error.message)
    console.error('错误详情:', error)
    
    // 提供具体的错误建议
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('建议: 检查网络连接或服务器是否运行')
    } else if (error.message.includes('ERR_EMPTY_RESPONSE')) {
      console.error('建议: 服务器没有响应，可能服务器未启动或配置错误')
    } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.error('建议: 连接被拒绝，检查服务器地址和端口')
    }
    
    console.error('=== 后端连接测试失败结束 ===')
  }
}

// 导出默认实例
export default api