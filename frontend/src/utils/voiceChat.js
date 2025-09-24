// 语音聊天工具类
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

  // 文本转语音
  speakText(text, options = {}) {
    return new Promise((resolve, reject) => {
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
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      // 设置语音参数
      utterance.rate = options.rate || 0.9
      utterance.pitch = options.pitch || 1
      utterance.volume = Math.min(Math.max(options.volume || 1, 0), 1) // 确保音量在0-1范围内
      utterance.lang = options.lang || 'zh-CN'
      
      console.log('语音播放设置:', {
        text: text.substring(0, 20) + '...',
        volume: utterance.volume,
        rate: utterance.rate,
        pitch: utterance.pitch,
        isMuted: options.volume === 0
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
        console.log('语音播放结束')
        resolve()
      }
      utterance.onerror = (event) => {
        console.error('语音合成失败:', event)
        console.log('尝试使用备用方案...')
        // 使用setTimeout模拟播放完成
        const estimatedDuration = text.length * 100 // 估算播放时间
        setTimeout(() => {
          console.log('语音播放结束（备用方案）')
          resolve()
        }, estimatedDuration)
      }
      
      this.currentUtterance = utterance
      this.speechSynthesis.speak(utterance)
    })
  }

  // 停止语音播放
  stopSpeaking() {
    if (this.speechSynthesis.speaking) {
      console.log('立即停止语音播放')
      this.speechSynthesis.cancel()
    }
    this.currentUtterance = null
  }
  
  // 动态调整音量（通过重新播放实现）
  adjustVolume(newVolume) {
    if (this.currentUtterance && this.speechSynthesis.speaking) {
      console.log('动态调整音量为:', newVolume)
      // 由于Web Speech API不支持动态调整音量，我们需要重新播放
      const currentText = this.currentUtterance.text
      const currentRate = this.currentUtterance.rate
      const currentPitch = this.currentUtterance.pitch
      const currentLang = this.currentUtterance.lang
      
      // 停止当前播放
      this.stopSpeaking()
      
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

  // 语音识别（需要额外的API支持）
  async recognizeSpeech(audioBlob) {
    try {
      // 这里需要集成语音识别服务，如Web Speech API或第三方服务
      // 目前返回模拟结果
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            text: '这是语音识别的结果',
            confidence: 0.95
          })
        }, 1000)
      })
    } catch (error) {
      console.error('语音识别失败:', error)
      throw error
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
