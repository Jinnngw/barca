import { defineStore } from 'pinia'
import { sessionAPI, handleAPIError } from '../services/api'

export const useChatStore = defineStore('chat', {
  state: () => {
    // 初始化时从本地存储加载数据
    let conversations = {}
    try {
      const savedConversations = localStorage.getItem('chat-conversations')
      if (savedConversations) {
        const parsedData = JSON.parse(savedConversations)
        // 将字符串时间戳转换回Date对象
        conversations = Object.keys(parsedData).reduce((acc, characterId) => {
          acc[characterId] = parsedData[characterId].map(message => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }))
          return acc
        }, {})
        console.log('Chat conversations loaded from localStorage:', conversations)
      } else {
        console.log('No saved conversations found in localStorage')
      }
    } catch (error) {
      console.error('Failed to parse saved conversations:', error)
      conversations = {}
    }
    
    return {
      // 按角色ID存储聊天记录
      conversations,
      isTyping: false,
      isRecording: false,
      isPlaying: false,
      currentAudio: null,
      audioQueue: [],
      currentCharacterId: null,
      // 会话管理
      currentSessionId: null,
      sessionMap: {} // 角色ID -> 会话ID 映射
    }
  },
  
  getters: {
    // 获取当前角色的聊天记录
    messages: (state) => {
      if (!state.currentCharacterId) return []
      return state.conversations[state.currentCharacterId] || []
    }
  },
  
  actions: {
    // 保存聊天记录到本地存储
    saveToLocalStorage() {
      try {
        localStorage.setItem('chat-conversations', JSON.stringify(this.conversations))
        console.log('Chat conversations saved to localStorage:', this.conversations)
      } catch (error) {
        console.error('Failed to save conversations to localStorage:', error)
      }
    },
    
    // 设置当前角色并创建会话
    async setCurrentCharacter(characterId) {
      this.currentCharacterId = characterId
      
      // 如果该角色还没有聊天记录，初始化空数组
      if (!this.conversations[characterId]) {
        this.conversations[characterId] = []
      }
      
      // 如果该角色还没有会话，创建新会话
      if (!this.sessionMap[characterId]) {
        try {
          console.log('=== 开始创建会话 ===')
          console.log('角色ID:', characterId)
          console.log('角色ID类型:', typeof characterId)
          console.log('当前sessionMap:', this.sessionMap)
          
          const response = await sessionAPI.createSession(characterId)
          
          console.log('会话创建响应:', response)
          this.sessionMap[characterId] = response.sessionId
          this.currentSessionId = response.sessionId
          console.log('会话创建成功，会话ID:', response.sessionId)
          console.log('=== 会话创建完成 ===')
        } catch (error) {
          console.error('=== 创建会话失败 ===')
          console.error('错误详情:', error)
          const errorMessage = handleAPIError(error)
          console.error('处理后的错误消息:', errorMessage)
          console.error('=== 创建会话失败结束 ===')
          throw new Error(`创建会话失败: ${errorMessage}`)
        }
      } else {
        this.currentSessionId = this.sessionMap[characterId]
        console.log('使用现有会话:', this.currentSessionId)
      }
    },
    
    addMessage(message) {
      if (!this.currentCharacterId) return
      
      const newMessage = {
        id: Date.now() + Math.random(),
        ...message,
        timestamp: new Date()
      }
      
      this.conversations[this.currentCharacterId].push(newMessage)
      
      // 自动保存到本地存储
      this.saveToLocalStorage()
    },
    
    setTyping(isTyping) {
      this.isTyping = isTyping
    },
    
    setRecording(isRecording) {
      this.isRecording = isRecording
    },
    
    setPlaying(isPlaying) {
      this.isPlaying = isPlaying
    },
    
    setCurrentAudio(audio) {
      this.currentAudio = audio
    },
    
    addToAudioQueue(audio) {
      this.audioQueue.push(audio)
    },
    
    // 清空当前角色的聊天记录
    clearMessages() {
      if (this.currentCharacterId) {
        this.conversations[this.currentCharacterId] = []
        // 保存到本地存储
        this.saveToLocalStorage()
      }
    },
    
    // 清空所有聊天记录
    clearAllMessages() {
      this.conversations = {}
      // 保存到本地存储
      this.saveToLocalStorage()
    },
    
    // 获取指定角色的聊天记录
    getMessagesByCharacter(characterId) {
      return this.conversations[characterId] || []
    },
    
    // 发送消息到后端并获取AI回复
    async sendMessageToAPI(message, isAudio = false) {
      if (!this.currentSessionId) {
        throw new Error('没有活跃的会话')
      }
      
      try {
        let response
        if (isAudio) {
          // 发送语音消息
          response = await sessionAPI.sendAudioMessage(this.currentSessionId, message)
        } else {
          // 发送文本消息
          response = await sessionAPI.sendTextMessage(this.currentSessionId, message)
        }
        
        return response
      } catch (error) {
        console.error('发送消息失败:', error)
        const errorMessage = handleAPIError(error)
        throw new Error(`发送消息失败: ${errorMessage}`)
      }
    },

    // 生成AI回复 (保留原有逻辑作为备用)
    async generateAIResponse(character, userMessage, voiceOutputEnabled = true) {
      this.setTyping(true)
      
      console.log('AI回复检查 - 角色信息:', {
        name: character.name,
        isOnline: character.isOnline,
        id: character.id
      })
      
      // 如果角色离线，不回复消息
      if (character.isOnline === false || character.isOnline === undefined) {
        console.log('角色离线，不回复消息 - isOnline:', character.isOnline)
        this.setTyping(false)
        return
      }
      
      console.log('角色在线，继续生成回复')
      
      try {
        // 使用真实API发送消息
        const response = await this.sendMessageToAPI(userMessage)
        
        // 添加AI回复消息
        this.addMessage({
          type: 'ai',
          content: response.message || response.text || '收到回复',
          character: character,
          isVoice: response.isVoice || false
        })
        
      } catch (error) {
        console.error('API调用失败，使用备用回复:', error)
        
        // 备用回复逻辑
        const responses = {
          'harry-potter': [
            "哇，这让我想起了在霍格沃茨的日子！",
            "你知道吗，赫敏总是说知识就是力量。",
            "有时候我觉得麻瓜世界也挺有趣的。",
            "罗恩会喜欢这个想法的！"
          ],
          'socrates': [
            "让我问你一个问题：什么是真正的智慧？",
            "正如我常说的，我知道我一无所知。",
            "思考这个问题：如果没有人看到，美德还存在吗？",
            "让我们通过对话来探索真理吧。"
          ],
          'einstein': [
            "想象力比知识更重要，因为知识是有限的。",
            "这让我想到了相对论的有趣之处。",
            "如果我用光速旅行，时间会如何变化呢？",
            "宇宙中最不可理解的事情就是它是可以理解的。"
          ],
          'shakespeare': [
            "生存还是毁灭，这是一个值得考虑的问题。",
            "爱情是盲目的，恋人们看不见自己做的傻事。",
            "整个世界就是一个舞台，所有的男男女女不过是演员。",
            "时间会刺破青春的华美精致。"
          ],
          'marie-curie': [
            "在科学中，我们应该对事不对人。",
            "生活中没有什么可怕的东西，只有需要理解的东西。",
            "我们必须相信，我们天生就是为了做某件事。",
            "科学的美在于它的普遍性。"
          ],
          'confucius': [
            "学而时习之，不亦说乎？",
            "己所不欲，勿施于人。",
            "三人行，必有我师焉。",
            "温故而知新，可以为师矣。"
          ]
        }
        
        const characterResponses = responses[character.id] || ["这是一个很有趣的观点。"]
        const randomResponse = characterResponses[Math.floor(Math.random() * characterResponses.length)]
        
        this.addMessage({
          type: 'ai',
          content: randomResponse,
          character: character,
          isVoice: Math.random() > 0.5
        })
      }
      
      this.setTyping(false)
    }
  }
})
