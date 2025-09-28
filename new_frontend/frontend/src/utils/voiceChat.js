// 语音聊天工具类
import { mediaAPI, handleAPIError } from '../services/api'
import { audioDecoder } from './audioDecoder'

export class VoiceChatManager {
  constructor() {
    this.mediaRecorder = null
    this.audioChunks = []
    this.isRecording = false
    this.audioContext = null
    this.speechSynthesis = window.speechSynthesis
    this.currentUtterance = null
  }

  // 检查浏览器支持
  checkSupport() {
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const hasMediaRecorder = !!window.MediaRecorder
    const hasSpeechSynthesis = !!window.speechSynthesis
    
    return {
      recording: hasGetUserMedia && hasMediaRecorder,
      playback: hasSpeechSynthesis,
      supported: hasGetUserMedia && hasMediaRecorder && hasSpeechSynthesis
    }
  }

  // 请求麦克风权限
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      return stream
    } catch (error) {
      console.error('麦克风权限被拒绝:', error)
      throw new Error('无法访问麦克风，请检查权限设置')
    }
  }

  // 开始录音
  async startRecording() {
    try {
      const stream = await this.requestMicrophonePermission()
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      this.audioChunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.onRecordingComplete(audioBlob)
      }
      
      this.mediaRecorder.start()
      this.isRecording = true
      
      return true
    } catch (error) {
      console.error('录音失败:', error)
      throw error
    }
  }

  // 停止录音
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      
      // 停止所有音频轨道
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  // 录音完成回调
  onRecordingComplete(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    
    // 计算音频时长
    audio.addEventListener('loadedmetadata', () => {
      const duration = Math.round(audio.duration)
      
      // 触发录音完成事件
      const event = new CustomEvent('recordingComplete', {
        detail: {
          audioBlob,
          audioUrl,
          duration
        }
      })
      window.dispatchEvent(event)
    })
  }

  // 播放音频
  playAudio(audioUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl)
      
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('音频播放失败'))
      
      audio.play().catch(reject)
    })
  }

  // 播放base64音频数据
  async playBase64Audio(base64Data, audioFormat = 'mp3', options = {}) {
    try {
      console.log('VoiceChatManager: 播放base64音频:', {
        dataLength: base64Data?.length || 0,
        format: audioFormat,
        options
      })

      // 停止当前播放
      this.stopSpeaking()

      // 直接使用音频解码器播放，避免循环导入
      const audio = await audioDecoder.playBase64Audio(base64Data, audioFormat, {
        volume: options.volume || 1,
        loop: options.loop || false
      })

      console.log('VoiceChatManager: 音频播放成功')

      // 监听播放结束
      audio.addEventListener('ended', () => {
        console.log('VoiceChatManager: base64音频播放结束')
        // 不立即清理URL，让系统自动管理
      })

      audio.addEventListener('error', (error) => {
        console.error('VoiceChatManager: base64音频播放失败:', error)
        // 清理资源
        if (audio.src && audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src)
        }
      })

      this.currentAudio = audio
      return audio

    } catch (error) {
      console.error('VoiceChatManager: 播放base64音频失败:', error)
      
      // 提供更友好的错误信息
      if (error.message.includes('NotAllowedError')) {
        throw new Error('需要用户交互才能播放音频，请点击播放按钮')
      } else if (error.message.includes('NotSupportedError')) {
        throw new Error('浏览器不支持该音频格式')
      } else {
        throw new Error(`音频播放失败: ${error.message}`)
      }
    }
  }

  // 解码base64音频为URL
  async decodeBase64Audio(base64Data, audioFormat = 'mp3', cacheKey = null) {
    try {
      return await audioDecoder.decodeBase64Audio(base64Data, audioFormat, cacheKey)
    } catch (error) {
      console.error('解码base64音频失败:', error)
      throw error
    }
  }

  // 文本转语音 - 优先使用后端TTS API
  async speakText(text, options = {}) {
    return new Promise(async (resolve, reject) => {
      // 停止当前播放
      this.stopSpeaking()
      
      // 如果音量为0，使用静音模式
      if (options.volume === 0) {
        console.log('静音模式：模拟播放但不产生声音')
        
        // 创建临时的utterance来获取实际播放时长
        const tempUtterance = new SpeechSynthesisUtterance(text)
        tempUtterance.rate = options.rate || 0.9
        tempUtterance.pitch = options.pitch || 1
        tempUtterance.volume = 0 // 设置为0，不产生声音
        tempUtterance.lang = options.lang || 'zh-CN'
        
        // 尝试设置语音
        const voices = this.speechSynthesis.getVoices()
        const chineseVoice = voices.find(voice => 
          voice.lang.includes('zh') || voice.lang.includes('CN')
        )
        
        if (chineseVoice) {
          tempUtterance.voice = chineseVoice
        }
        
        // 监听播放结束事件
        tempUtterance.onend = () => {
          console.log('静音播放结束')
          resolve()
        }
        
        tempUtterance.onerror = (event) => {
          console.error('静音播放失败:', event)
          // 如果失败，使用估算时间作为后备
          const estimatedDuration = text.length * 100
          setTimeout(() => {
            console.log('静音播放结束（估算时间）')
            resolve()
          }, estimatedDuration)
        }
        
        // 播放但不产生声音
        this.currentUtterance = tempUtterance
        this.speechSynthesis.speak(tempUtterance)
        return
      }
      
      try {
        // 优先使用后端TTS API
        console.log('使用后端TTS API:', text.substring(0, 20) + '...')
        const ttsResponse = await mediaAPI.textToSpeech(text)
        
        // 播放后端返回的音频
        const audio = new Audio(ttsResponse.audioUrl)
        
        audio.onended = () => {
          console.log('后端TTS播放结束')
          URL.revokeObjectURL(ttsResponse.audioUrl) // 清理资源
          resolve()
        }
        
        audio.onerror = (error) => {
          console.error('后端TTS播放失败:', error)
          URL.revokeObjectURL(ttsResponse.audioUrl) // 清理资源
          // 降级到浏览器TTS
          this.fallbackToBrowserTTS(text, options, resolve, reject)
        }
        
        // 设置音量
        audio.volume = Math.min(Math.max(options.volume || 1, 0), 1)
        
        await audio.play()
        this.currentAudio = audio
        
      } catch (error) {
        console.error('后端TTS失败，降级到浏览器TTS:', error)
        // 降级到浏览器TTS
        this.fallbackToBrowserTTS(text, options, resolve, reject)
      }
    })
  }

  // 降级到浏览器TTS
  fallbackToBrowserTTS(text, options, resolve, reject) {
    const utterance = new SpeechSynthesisUtterance(text)
    
    // 设置语音参数
    utterance.rate = options.rate || 0.9
    utterance.pitch = options.pitch || 1
    utterance.volume = Math.min(Math.max(options.volume || 1, 0), 1)
    utterance.lang = options.lang || 'zh-CN'
    
    console.log('浏览器TTS播放设置:', {
      text: text.substring(0, 20) + '...',
      volume: utterance.volume,
      rate: utterance.rate,
      pitch: utterance.pitch
    })
    
    // 尝试设置语音
    const voices = this.speechSynthesis.getVoices()
    const chineseVoice = voices.find(voice => 
      voice.lang.includes('zh') || voice.lang.includes('CN')
    )
    
    if (chineseVoice) {
      utterance.voice = chineseVoice
    }
    
    utterance.onend = () => {
      console.log('浏览器TTS播放结束')
      resolve()
    }
    
    utterance.onerror = (event) => {
      console.error('浏览器TTS失败:', event)
      // 使用setTimeout模拟播放完成
      const estimatedDuration = text.length * 100
      setTimeout(() => {
        console.log('TTS播放结束（估算时间）')
        resolve()
      }, estimatedDuration)
    }
    
    this.currentUtterance = utterance
    this.speechSynthesis.speak(utterance)
  }

  // 停止语音播放
  stopSpeaking() {
    if (this.speechSynthesis.speaking) {
      console.log('立即停止语音播放')
      this.speechSynthesis.cancel()
    }
    
    // 停止音频播放
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    
    this.currentUtterance = null
  }
  
  // 动态调整音量（通过重新播放实现）
  adjustVolume(newVolume) {
    if ((this.currentUtterance && this.speechSynthesis.speaking) || this.currentAudio) {
      console.log('动态调整音量为:', newVolume)
      
      // 停止当前播放
      this.stopSpeaking()
      
      // 如果有当前文本，重新播放
      if (this.currentUtterance) {
        const currentText = this.currentUtterance.text
        const currentRate = this.currentUtterance.rate
        const currentPitch = this.currentUtterance.pitch
        const currentLang = this.currentUtterance.lang
        
        // 立即重新播放，使用新的音量
        setTimeout(() => {
          this.speakText(currentText, {
            rate: currentRate,
            pitch: currentPitch,
            volume: newVolume,
            lang: currentLang
          })
        }, 50) // 短暂延迟确保停止完成
      }
    }
  }

  // 暂停语音播放
  pauseSpeaking() {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.pause()
    }
  }

  // 恢复语音播放
  resumeSpeaking() {
    if (this.speechSynthesis.paused) {
      this.speechSynthesis.resume()
    }
  }

  // 获取可用的语音列表
  getAvailableVoices() {
    return this.speechSynthesis.getVoices()
  }

  // 语音识别 - 使用后端ASR API
  async recognizeSpeech(audioBlob) {
    try {
      console.log('开始语音识别，音频大小:', audioBlob.size)
      
      // 使用后端ASR API
      const response = await mediaAPI.speechToText(audioBlob)
      
      console.log('ASR识别结果:', response)
      
      return {
        text: response.text || response.transcript || '识别失败',
        confidence: response.confidence || 0.8
      }
    } catch (error) {
      console.error('语音识别失败:', error)
      const errorMessage = handleAPIError(error)
      
      // 返回错误信息，但保持接口一致性
      return {
        text: `语音识别失败: ${errorMessage}`,
        confidence: 0
      }
    }
  }

  // 清理资源
  cleanup() {
    this.stopRecording()
    this.stopSpeaking()
    
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

// 创建全局实例
export const voiceChatManager = new VoiceChatManager()
