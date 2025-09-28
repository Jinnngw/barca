// 音频解码工具类 - 处理base64音频数据
export class AudioDecoder {
  constructor() {
    this.audioCache = new Map() // 缓存解码后的音频URL
    this.supportedFormats = ['.mp3', 'mp3', '.wav', 'wav', '.ogg', 'ogg', '.m4a', 'm4a', '.aac', 'aac', '.webm', 'webm']
  }

  /**
   * 检查音频格式是否支持
   * @param {string} format - 音频格式
   * @returns {boolean} 是否支持
   */
  isFormatSupported(format) {
    return this.supportedFormats.includes(format.toLowerCase())
  }

  /**
   * 将base64音频数据解码为可播放的音频URL
   * @param {string} base64Data - base64编码的音频数据
   * @param {string} audioFormat - 音频格式 (mp3, wav, ogg等)
   * @param {string} cacheKey - 缓存键，用于避免重复解码
   * @returns {Promise<string>} 可播放的音频URL
   */
  async decodeBase64Audio(base64Data, audioFormat = 'mp3', cacheKey = null) {
    try {
      // 生成缓存键
      const key = cacheKey || `${base64Data.substring(0, 20)}_${audioFormat}`
      
      // 检查缓存
      if (this.audioCache.has(key)) {
        console.log('使用缓存的音频URL:', key)
        return this.audioCache.get(key)
      }

      // 验证base64数据
      if (!base64Data || typeof base64Data !== 'string') {
        throw new Error('无效的base64音频数据')
      }

      // 清理base64数据（移除可能的前缀）
      let cleanBase64 = base64Data
      if (base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',')[1]
      }

      // 验证格式
      const format = audioFormat.toLowerCase()
      if (!this.isFormatSupported(format)) {
        console.warn(`不支持的音频格式: ${format}，尝试使用mp3`)
        audioFormat = 'mp3'
      }

      // 创建MIME类型
      const mimeType = this.getMimeType(format)
      
      // 解码base64数据
      const binaryString = atob(cleanBase64)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // 创建Blob
      const blob = new Blob([bytes], { type: mimeType })
      
      // 创建对象URL
      const audioUrl = URL.createObjectURL(blob)
      
      // 缓存URL
      this.audioCache.set(key, audioUrl)
      
      console.log(`音频解码成功: ${format}, 大小: ${blob.size} bytes`)
      
      return audioUrl
      
    } catch (error) {
      console.error('音频解码失败:', error)
      throw new Error(`音频解码失败: ${error.message}`)
    }
  }

  /**
   * 根据格式获取MIME类型
   * @param {string} format - 音频格式
   * @returns {string} MIME类型
   */
  getMimeType(format) {
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      'mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      'wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      'ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      'm4a': 'audio/mp4',
      '.aac': 'audio/aac',
      'aac': 'audio/aac',
      '.webm': 'audio/webm',
      'webm': 'audio/webm'
    }
    
    return mimeTypes[format.toLowerCase()] || 'audio/mpeg'
  }

  /**
   * 创建音频元素并预加载
   * @param {string} audioUrl - 音频URL
   * @returns {Promise<HTMLAudioElement>} 音频元素
   */
  async createAudioElement(audioUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      
      // 设置音频属性
      audio.crossOrigin = 'anonymous'
      audio.preload = 'auto'
      
      // 监听事件
      const handleLoadedMetadata = () => {
        console.log('音频元数据加载完成:', {
          duration: audio.duration,
          src: audio.src,
          readyState: audio.readyState
        })
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('error', handleError)
        resolve(audio)
      }
      
      const handleError = (error) => {
        console.error('音频加载失败:', {
          error: error,
          src: audio.src,
          networkState: audio.networkState,
          readyState: audio.readyState
        })
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('error', handleError)
        reject(new Error(`音频加载失败: ${error.message || 'Unknown error'}`))
      }
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('error', handleError)
      
      // 设置音频源并开始加载
      audio.src = audioUrl
      audio.load()
      
      // 设置超时
      setTimeout(() => {
        if (audio.readyState < 1) {
          console.warn('音频加载超时，尝试强制播放')
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audio.removeEventListener('error', handleError)
          resolve(audio) // 即使没有完全加载也返回，让播放时处理
        }
      }, 5000)
    })
  }

  /**
   * 播放base64音频数据
   * @param {string} base64Data - base64编码的音频数据
   * @param {string} audioFormat - 音频格式
   * @param {Object} options - 播放选项
   * @returns {Promise<HTMLAudioElement>}
   */
  async playBase64Audio(base64Data, audioFormat = 'mp3', options = {}) {
    try {
      console.log('开始播放base64音频:', {
        dataLength: base64Data?.length || 0,
        format: audioFormat,
        options
      })

      // 解码音频
      const audioUrl = await this.decodeBase64Audio(base64Data, audioFormat)
      console.log('音频解码完成，URL:', audioUrl)
      
      // 创建音频元素
      const audio = await this.createAudioElement(audioUrl)
      console.log('音频元素创建完成')
      
      // 设置播放选项
      if (options.volume !== undefined) {
        audio.volume = Math.min(Math.max(options.volume, 0), 1)
      }
      
      if (options.loop !== undefined) {
        audio.loop = options.loop
      }
      
      // 播放音频
      try {
        await audio.play()
        console.log('音频播放开始')
      } catch (playError) {
        console.error('音频播放失败:', playError)
        
        // 尝试用户交互后播放
        if (playError.name === 'NotAllowedError') {
          console.log('需要用户交互才能播放音频')
          // 返回音频元素，让用户点击播放
        } else {
          throw playError
        }
      }
      
      return audio
      
    } catch (error) {
      console.error('播放base64音频失败:', error)
      throw new Error(`播放base64音频失败: ${error.message}`)
    }
  }

  /**
   * 获取音频时长
   * @param {string} base64Data - base64编码的音频数据
   * @param {string} audioFormat - 音频格式
   * @returns {Promise<number>} 音频时长（秒）
   */
  async getAudioDuration(base64Data, audioFormat = 'mp3') {
    try {
      const audioUrl = await this.decodeBase64Audio(base64Data, audioFormat)
      const audio = await this.createAudioElement(audioUrl)
      
      return audio.duration
    } catch (error) {
      console.error('获取音频时长失败:', error)
      return 0
    }
  }

  /**
   * 清理缓存和资源
   * @param {string} cacheKey - 要清理的缓存键，不传则清理所有
   */
  cleanup(cacheKey = null) {
    if (cacheKey) {
      // 清理指定缓存
      if (this.audioCache.has(cacheKey)) {
        const url = this.audioCache.get(cacheKey)
        URL.revokeObjectURL(url)
        this.audioCache.delete(cacheKey)
        console.log('清理音频缓存:', cacheKey)
      }
    } else {
      // 清理所有缓存
      this.audioCache.forEach((url, key) => {
        URL.revokeObjectURL(url)
        console.log('清理音频缓存:', key)
      })
      this.audioCache.clear()
      console.log('清理所有音频缓存')
    }
  }

  /**
   * 获取缓存信息
   * @returns {Object} 缓存统计信息
   */
  getCacheInfo() {
    return {
      size: this.audioCache.size,
      keys: Array.from(this.audioCache.keys())
    }
  }
}

// 创建全局实例
export const audioDecoder = new AudioDecoder()

// 导出工具函数
export const decodeBase64Audio = (base64Data, audioFormat = 'mp3', cacheKey = null) => {
  return audioDecoder.decodeBase64Audio(base64Data, audioFormat, cacheKey)
}

export const playBase64Audio = (base64Data, audioFormat = 'mp3', options = {}) => {
  return audioDecoder.playBase64Audio(base64Data, audioFormat, options)
}

export const getAudioDuration = (base64Data, audioFormat = 'mp3') => {
  return audioDecoder.getAudioDuration(base64Data, audioFormat)
}
