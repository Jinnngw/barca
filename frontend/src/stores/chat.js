import { defineStore } from 'pinia'

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
      currentCharacterId: null
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
    
    // 设置当前角色
    setCurrentCharacter(characterId) {
      this.currentCharacterId = characterId
      // 如果该角色还没有聊天记录，初始化空数组
      if (!this.conversations[characterId]) {
        this.conversations[characterId] = []
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
    
    // 模拟AI回复
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
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
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
        isVoice: Math.random() > 0.5 // 随机决定是否为语音消息，播放时根据voiceOutputEnabled调整音量
      })
      
      this.setTyping(false)
    }
  }
})
