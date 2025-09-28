// 音频处理示例 - 展示如何处理接口返回的base64音频数据

import { audioDecoder } from './audioDecoder'
import { voiceChatManager } from './voiceChat'

/**
 * 处理从接口返回的音频消息
 * @param {Object} messageData - 接口返回的消息数据
 * @returns {Object} 处理后的消息对象
 */
export const processAudioMessage = (messageData) => {
  console.log('处理音频消息:', messageData)
  
  const { audioData, audioFormat, text, id, time } = messageData
  
  if (!audioData) {
    console.warn('消息中没有音频数据')
    return {
      id,
      type: 'ai',
      content: text || '无音频数据',
      timestamp: new Date(time),
      isVoice: false
    }
  }
  
  // 创建消息对象，包含base64音频数据
  const message = {
    id,
    type: 'ai',
    content: text || '语音消息',
    timestamp: new Date(time),
    isVoice: true,
    audioData: audioData,           // 原始base64数据
    audioFormat: audioFormat || 'mp3', // 音频格式
    audioDuration: messageData.audioDuration || 3,
    hasAudioData: true
  }
  
  console.log('音频消息处理完成:', {
    id: message.id,
    hasAudioData: message.hasAudioData,
    format: message.audioFormat,
    dataLength: audioData.length
  })
  
  return message
}

/**
 * 播放接口返回的base64音频
 * @param {Object} message - 包含audioData的消息对象
 * @param {Object} options - 播放选项
 */
export const playInterfaceAudio = async (message, options = {}) => {
  try {
    console.log('播放接口音频:', {
      messageId: message.id,
      hasAudioData: !!message.audioData,
      format: message.audioFormat
    })
    
    if (!message.audioData) {
      throw new Error('消息中没有音频数据')
    }
    
    // 使用音频解码器播放
    const audio = await voiceChatManager.playBase64Audio(
      message.audioData,
      message.audioFormat || 'mp3',
      {
        volume: options.volume || 1,
        loop: options.loop || false
      }
    )
    
    console.log('接口音频播放成功')
    return audio
    
  } catch (error) {
    console.error('播放接口音频失败:', error)
    throw error
  }
}

/**
 * 模拟接口返回的音频数据格式
 * @returns {Object} 模拟的接口响应
 */
export const createMockAudioResponse = () => {
  // 这是一个1秒静音的WAV文件的base64编码
  const mockAudioData = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
  
  return {
    userMessage: {
      id: 'user-123',
      text: '你好，请说句话',
      time: new Date().toISOString()
    },
    assistantMessage: {
      id: 'ai-456',
      text: '你好！这是一条语音消息',
      time: new Date().toISOString(),
      audioData: mockAudioData,    // base64音频数据
      audioFormat: 'wav',          // 音频格式
      audioDuration: 1.0          // 音频时长（秒）
    }
  }
}

/**
 * 测试完整的音频处理流程
 */
export const testAudioProcessingFlow = async () => {
  try {
    console.log('=== 开始测试音频处理流程 ===')
    
    // 1. 创建模拟的接口响应
    const mockResponse = createMockAudioResponse()
    console.log('模拟接口响应:', mockResponse)
    
    // 2. 处理音频消息
    const processedMessage = processAudioMessage(mockResponse.assistantMessage)
    console.log('处理后的消息:', processedMessage)
    
    // 3. 播放音频
    await playInterfaceAudio(processedMessage, { volume: 0.3 })
    console.log('音频播放完成')
    
    console.log('=== 音频处理流程测试完成 ===')
    
  } catch (error) {
    console.error('=== 音频处理流程测试失败 ===')
    console.error('错误详情:', error)
  }
}

/**
 * 批量处理多个音频消息
 * @param {Array} messages - 消息数组
 */
export const processMultipleAudioMessages = async (messages) => {
  console.log('批量处理音频消息:', messages.length)
  
  const processedMessages = messages.map(message => {
    if (message.audioData) {
      return processAudioMessage(message)
    }
    return message
  })
  
  console.log('批量处理完成:', processedMessages.length)
  return processedMessages
}

// 导出所有功能
export default {
  processAudioMessage,
  playInterfaceAudio,
  createMockAudioResponse,
  testAudioProcessingFlow,
  processMultipleAudioMessages
}
