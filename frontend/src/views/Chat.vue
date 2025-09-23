<template>
  <div class="chat-container">
    <!-- 聊天头部 -->
    <header class="chat-header">
      <div class="character-info">
        <img 
          :src="character.avatar" 
          :alt="character.name" 
          class="character-avatar"
          :class="{ offline: !character.isOnline }"
        />
        <div class="character-details">
          <h2 class="character-name">{{ character.name }}</h2>
          <p class="character-status">
            <span 
              class="status-dot" 
              :class="{ online: character.isOnline, offline: !character.isOnline }"
            ></span>
            {{ character.isOnline ? '在线' : '离线' }}
          </p>
        </div>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-ghost" @click="toggleVoiceOutput" :class="{ active: voiceOutputEnabled }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
        
        <button class="btn btn-ghost" @click="goBack">
          <svg t="1758632027608" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5439" width="200" height="200"><path d="M512 1024C229.376 1024 0 794.624 0 512S229.376 0 512 0s512 229.376 512 512-229.376 512-512 512z m0-975.36C257.024 48.64 48.64 257.024 48.64 512c0 254.976 207.872 463.36 463.36 463.36S975.36 767.488 975.36 512 766.976 48.64 512 48.64z" fill="#8A8A8A" p-id="5440"></path><path d="M548.864 512l195.072-195.072c9.728-9.728 9.728-25.6 0-36.864l-1.536-1.536c-9.728-9.728-25.6-9.728-35.328 0L512 475.136 316.928 280.064c-9.728-9.728-25.6-9.728-35.328 0l-1.536 1.536c-9.728 9.728-9.728 25.6 0 36.864L475.136 512 280.064 707.072c-9.728 9.728-9.728 25.6 0 36.864l1.536 1.536c9.728 9.728 25.6 9.728 35.328 0L512 548.864l195.072 195.072c9.728 9.728 25.6 9.728 35.328 0l1.536-1.536c9.728-9.728 9.728-25.6 0-36.864L548.864 512z" fill="#8A8A8A" p-id="5441"></path></svg>
        </button>
      </div>
    </header>

    <!-- 聊天区域 -->
    <div class="chat-area" ref="chatArea">
      <div class="chat-background">
        <div class="background-image" :style="{ backgroundImage: `url(${character.background})` }"></div>
      </div>
      
      <div class="messages-container">
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-content">
            <img :src="character.avatar" :alt="character.name" class="welcome-avatar" />
            <h3>你好！我是{{ character.name }}</h3>
            <p>{{ character.description }}</p>
            <p class="personality">{{ character.personality }}</p>
          </div>
        </div>
        
        <div
          v-for="message in groupedMessages"
          :key="message.id"
          :class="['message', message.type]"
        >
          <!-- 历史消息分隔符 -->
          <div v-if="message.type === 'divider'" class="message-divider">
            <div class="divider-line"></div>
            <span class="divider-text">{{ message.content }}</span>
            <div class="divider-line"></div>
          </div>
          
          <!-- 普通消息 -->
          <template v-else>
            <!-- AI消息：头像在左边 -->
            <div class="message-avatar" v-if="message.type === 'ai'">
              <img 
                :src="message.character.avatar" 
                :alt="message.character.name"
                :class="{ offline: !character.isOnline }"
              />
            </div>
            
            <!-- 用户消息：头像在右边 -->
            <div class="message-avatar" v-if="message.type === 'user'">
              <PlaceholderImage 
                type="avatar"
                :width="32"
                :height="32"
                circle
                text="用户"
              />
            </div>
            
            <div class="message-content">
              <div class="message-bubble" :class="{ 'voice-message': message.isVoice }">
                <p v-if="!message.isVoice">{{ message.content }}</p>
                
                <div v-else class="voice-content">
                  <button 
                    class="play-button"
                    @click="playVoiceMessage(message)"
                    :disabled="isPlaying"
                  >
                    <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  </button>
                  <span class="voice-duration">{{ message.duration || '3' }}s</span>
                  <span class="voice-text">{{ message.content }}</span>
                </div>
              </div>
              
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </template>
        </div>
        
        <!-- 打字指示器 -->
        <div v-if="isTyping" class="message ai typing">
          <div class="message-avatar">
            <img :src="character.avatar" :alt="character.name" />
          </div>
          <div class="message-content">
            <div class="message-bubble typing-indicator">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="quick-replies" v-if="showQuickReplies">
        <button
          v-for="reply in quickReplies"
          :key="reply"
          class="quick-reply-btn"
          @click="sendQuickReply(reply)"
        >
          {{ reply }}
        </button>
      </div>
      
      <div class="input-container">
        <div class="input-wrapper">
          <textarea
            v-model="inputMessage"
            placeholder="发消息..."
            class="message-input"
            @keydown.enter.prevent="sendMessage"
            @input="handleInput"
            ref="messageInput"
          ></textarea>
          
          <div class="input-actions">
            <button
              class="btn btn-ghost"
              @click="toggleQuickReplies"
              :class="{ active: showQuickReplies }"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
            </button>
            
            <button
              class="btn btn-ghost"
              @click="toggleVoiceInput"
              :class="{ active: isRecording, recording: isRecording }"
            >
              <svg v-if="!isRecording" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            </button>
            
            <button
              class="btn btn-primary"
              @click="sendMessage"
              :disabled="!inputMessage.trim() && !isRecording"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
              </svg>
            </button>
            
            <!-- 测试按钮 -->
            <button
              class="btn btn-secondary"
              @click="createTestMessages"
              style="margin-left: 8px;"
            >
              测试历史消息
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/characters'
import { useChatStore } from '../stores/chat'
import { voiceChatManager } from '../utils/voiceChat'
import PlaceholderImage from '../components/PlaceholderImage.vue'

export default {
  name: 'Chat',
  components: {
    PlaceholderImage
  },
  props: {
    characterId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const characterStore = useCharacterStore()
    const chatStore = useChatStore()
    
    const chatArea = ref(null)
    const messageInput = ref(null)
    const inputMessage = ref('')
    const voiceOutputEnabled = ref(true)
    const showQuickReplies = ref(false)
    
    const character = computed(() => characterStore.getCharacterById(props.characterId))
    const messages = computed(() => chatStore.messages)
    
    // 处理消息分组，添加历史消息分隔符
    const groupedMessages = computed(() => {
      const msgs = chatStore.messages
      console.log('Processing messages for grouping:', msgs)
      
      if (msgs.length === 0) return []
      
      const grouped = []
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      console.log('Time references:', { now, today, yesterday, weekAgo })
      
      let lastMessageDate = null
      
      msgs.forEach((message, index) => {
        const messageDate = new Date(message.timestamp)
        const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
        
        console.log(`Message ${index}:`, { messageDate, messageDateOnly, lastMessageDate })
        
        // 检查是否需要添加历史消息分隔符
        if (lastMessageDate === null || messageDateOnly.getTime() !== lastMessageDate.getTime()) {
          // 判断时间显示格式
          let timeLabel = ''
          if (messageDateOnly.getTime() === today.getTime()) {
            // 今天 - 不显示分隔符
            console.log('Today message, no divider')
          } else if (messageDateOnly.getTime() === yesterday.getTime()) {
            timeLabel = '昨天'
            console.log('Yesterday message, adding divider:', timeLabel)
          } else if (messageDateOnly.getTime() >= weekAgo.getTime()) {
            // 一周内 - 显示星期几
            const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
            timeLabel = weekdays[messageDate.getDay()]
            console.log('Weekday message, adding divider:', timeLabel)
          } else {
            // 一周后 - 显示年月日
            timeLabel = messageDate.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            console.log('Old message, adding divider:', timeLabel)
          }
          
          if (timeLabel) {
            grouped.push({
              id: `divider-${message.id}`,
              type: 'divider',
              content: timeLabel,
              timestamp: message.timestamp
            })
            console.log('Added divider:', timeLabel)
          }
          
          lastMessageDate = messageDateOnly
        }
        
        grouped.push(message)
      })
      
      console.log('Final grouped messages:', grouped)
      return grouped
    })
    
    // 设置当前角色，确保聊天记录隔离
    onMounted(() => {
      chatStore.setCurrentCharacter(props.characterId)
    })
    
    // 监听角色ID变化，切换聊天记录
    watch(() => props.characterId, (newCharacterId) => {
      chatStore.setCurrentCharacter(newCharacterId)
    })
    const isTyping = computed(() => chatStore.isTyping)
    const isRecording = computed(() => chatStore.isRecording)
    const isPlaying = computed(() => chatStore.isPlaying)
    
    const quickReplies = ref([
      '你好！',
      '能告诉我一些关于你的故事吗？',
      '你有什么建议给我吗？',
      '今天过得怎么样？'
    ])
    
    // 检查角色是否存在
    if (!character.value) {
      router.push('/')
      return
    }
    
    const scrollToBottom = () => {
      nextTick(() => {
        if (chatArea.value) {
          chatArea.value.scrollTop = chatArea.value.scrollHeight
        }
      })
    }
    
    const formatTime = (timestamp) => {
      // 确保timestamp是Date对象
      let date
      if (timestamp instanceof Date) {
        date = timestamp
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp)
      } else {
        console.error('Invalid timestamp format:', timestamp)
        return '--:--'
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', timestamp)
        return '--:--'
      }
      
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    
    const sendMessage = async () => {
      console.log('sendMessage called, inputMessage:', inputMessage.value)
      console.log('isRecording:', isRecording.value)
      
      if (!inputMessage.value.trim() && !isRecording.value) {
        console.log('No message to send')
        return
      }
      
      const messageContent = inputMessage.value.trim()
      console.log('Message content:', messageContent)
      
      if (messageContent) {
        console.log('Adding user message to store')
        chatStore.addMessage({
          type: 'user',
          content: messageContent,
          isVoice: false
        })
        
        inputMessage.value = ''
        scrollToBottom()
        
        console.log('Generating AI response')
        // 生成AI回复
        await chatStore.generateAIResponse(character.value, messageContent, voiceOutputEnabled.value)
        scrollToBottom()
      }
    }
    
    const sendQuickReply = async (reply) => {
      inputMessage.value = reply
      await sendMessage()
      showQuickReplies.value = false
    }
    
    
    const toggleQuickReplies = () => {
      showQuickReplies.value = !showQuickReplies.value
    }
    
    const toggleVoiceInput = async () => {
      if (isRecording.value) {
        await stopRecording()
      } else {
        await startRecording()
      }
    }
    
    const startRecording = async () => {
      try {
        const support = voiceChatManager.checkSupport()
        if (!support.recording) {
          alert('您的浏览器不支持录音功能')
          return
        }
        
        await voiceChatManager.startRecording()
        chatStore.setRecording(true)
        console.log('开始录音...')
      } catch (error) {
        console.error('录音失败:', error)
        alert('录音失败: ' + error.message)
      }
    }
    
    const stopRecording = async () => {
      try {
        voiceChatManager.stopRecording()
        chatStore.setRecording(false)
        console.log('停止录音...')
      } catch (error) {
        console.error('停止录音失败:', error)
      }
    }
    
    const toggleVoiceOutput = () => {
      voiceOutputEnabled.value = !voiceOutputEnabled.value
      console.log('语音输出状态切换为:', voiceOutputEnabled.value ? '启用' : '禁用')
      
      // 如果正在播放，动态调整音量
      if (isPlaying.value) {
        const newVolume = voiceOutputEnabled.value ? 1 : 0
        console.log('正在播放中，动态调整音量为:', newVolume)
        voiceChatManager.adjustVolume(newVolume)
      }
    }
    
    const playVoiceMessage = async (message) => {
      if (isPlaying.value) return
      
      try {
        chatStore.setPlaying(true)
        
        if (message.audioUrl) {
          // 播放录制的音频
          await voiceChatManager.playAudio(message.audioUrl)
        } else {
          // 使用TTS播放文本
          await voiceChatManager.speakText(message.content, {
            rate: 0.9,
            pitch: 1,
            volume: voiceOutputEnabled.value ? 1 : 0 // 根据语音输出设置调整音量
          })
        }
        
        chatStore.setPlaying(false)
      } catch (error) {
        console.error('播放失败:', error)
        chatStore.setPlaying(false)
      }
    }
    
    const handleInput = () => {
      // 自动调整输入框高度
      if (messageInput.value) {
        messageInput.value.style.height = 'auto'
        messageInput.value.style.height = messageInput.value.scrollHeight + 'px'
      }
    }
    
    const goBack = () => {
      router.push('/')
    }
    
    // 测试功能：创建不同时间的消息
    const createTestMessages = () => {
      console.log('Creating test messages with different timestamps')
      
      // 先发送一些消息，然后修改它们的时间戳
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      
      console.log('Time references:', { now, yesterday, threeDaysAgo, tenDaysAgo })
      
      // 发送今天的消息
      chatStore.addMessage({
        type: 'user',
        content: '这是今天的消息',
        isVoice: false
      })
      
      chatStore.addMessage({
        type: 'ai',
        content: '你好！这是今天的回复',
        character: character.value,
        isVoice: false
      })
      
      // 发送昨天的消息
      chatStore.addMessage({
        type: 'user',
        content: '这是昨天的消息',
        isVoice: false
      })
      
      chatStore.addMessage({
        type: 'ai',
        content: '你好！这是昨天的回复',
        character: character.value,
        isVoice: false
      })
      
      // 发送3天前的消息
      chatStore.addMessage({
        type: 'user',
        content: '这是3天前的消息',
        isVoice: false
      })
      
      chatStore.addMessage({
        type: 'ai',
        content: '你好！这是3天前的回复',
        character: character.value,
        isVoice: false
      })
      
      // 发送10天前的消息
      chatStore.addMessage({
        type: 'user',
        content: '这是10天前的消息',
        isVoice: false
      })
      
      chatStore.addMessage({
        type: 'ai',
        content: '你好！这是10天前的回复',
        character: character.value,
        isVoice: false
      })
      
      // 现在修改时间戳
      const conversations = chatStore.conversations
      const currentCharacterId = chatStore.currentCharacterId
      
      if (conversations[currentCharacterId]) {
        const messages = conversations[currentCharacterId]
        console.log('Modifying timestamps for', messages.length, 'messages')
        
        // 修改时间戳
        messages.forEach((message, index) => {
          if (index < 2) {
            message.timestamp = now
            console.log(`Message ${index}: today`)
          } else if (index < 4) {
            message.timestamp = yesterday
            console.log(`Message ${index}: yesterday`)
          } else if (index < 6) {
            message.timestamp = threeDaysAgo
            console.log(`Message ${index}: 3 days ago`)
          } else {
            message.timestamp = tenDaysAgo
            console.log(`Message ${index}: 10 days ago`)
          }
        })
        
        // 保存到localStorage
        chatStore.saveToLocalStorage()
        console.log('Test messages timestamps updated')
      }
    }
    
    // 监听消息变化，自动滚动到底部
    watch(messages, () => {
      scrollToBottom()
    }, { deep: true })
    
    // 监听录音完成事件
    const handleRecordingComplete = (event) => {
      const { audioBlob, audioUrl, duration } = event.detail
      
      // 添加语音消息
      chatStore.addMessage({
        type: 'user',
        content: '语音消息',
        isVoice: true,
        duration: duration,
        audioUrl: audioUrl,
        audioBlob: audioBlob
      })
      
      scrollToBottom()
      
      // 生成AI回复
      setTimeout(async () => {
        await chatStore.generateAIResponse(character.value, '语音消息', voiceOutputEnabled.value)
        scrollToBottom()
      }, 1000)
    }
    
    onMounted(() => {
      scrollToBottom()
      
      // 监听录音完成事件
      window.addEventListener('recordingComplete', handleRecordingComplete)
      
      // 检查语音支持
      const support = voiceChatManager.checkSupport()
      if (!support.supported) {
        console.warn('浏览器不完全支持语音功能')
      }
    })
    
    onUnmounted(() => {
      // 清理事件监听器
      window.removeEventListener('recordingComplete', handleRecordingComplete)
      
      // 清理语音资源
      voiceChatManager.cleanup()
    })
    
    return {
      chatArea,
      messageInput,
      inputMessage,
      voiceOutputEnabled,
      showQuickReplies,
      character,
      messages,
      groupedMessages,
      isTyping,
      isRecording,
      isPlaying,
      quickReplies,
      sendMessage,
      sendQuickReply,
      toggleQuickReplies,
      toggleVoiceInput,
      toggleVoiceOutput,
      playVoiceMessage,
      handleInput,
      formatTime,
      goBack,
      createTestMessages
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $background-dark;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background: $background-card;
  border-bottom: 1px solid $border-color;
  z-index: 10;
  
  .character-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    
    .character-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid $primary-color;
      transition: all 0.3s ease;
      
      &.offline {
        filter: grayscale(100%) brightness(0.6);
        border-color: $text-secondary;
      }
    }
    
    .character-details {
      .character-name {
        font-size: 1.2rem;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 $spacing-xs;
      }
      
      .character-status {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        color: $text-secondary;
        font-size: 0.9rem;
        margin: 0;
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          
          &.online {
            background: $success-color;
          }
          
          &.offline {
            background: $text-secondary;
          }
        }
      }
    }
  }
  
  .header-actions {
    display: flex;
    gap: $spacing-sm;
    
    .btn {
      svg {
        width: 18px;
        height: 18px;
      }
      
      &.active {
        background: $primary-color;
        color: $text-primary;
      }
    }
  }
}

.chat-area {
  flex: 1;
  position: relative;
  overflow-y: auto;
  
  .chat-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    
    .background-image {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0.1;
    }
  }
  
  .messages-container {
    position: relative;
    z-index: 2;
    padding: $spacing-lg;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
}

.welcome-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  
  .welcome-content {
    text-align: center;
    background: rgba(0, 0, 0, 0.8);
    padding: $spacing-xl;
    border-radius: $radius-lg;
    backdrop-filter: blur(10px);
    
    .welcome-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: $spacing-md;
      border: 3px solid $primary-color;
    }
    
    h3 {
      color: $text-primary;
      margin-bottom: $spacing-sm;
    }
    
    p {
      color: $text-secondary;
      margin-bottom: $spacing-sm;
      
      &.personality {
        color: $accent-color;
        font-style: italic;
      }
    }
  }
}

.message {
  display: flex;
  align-items: flex-end;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  
  &.user {
    flex-direction: row-reverse;
    
    .message-content {
      align-items: flex-end;
      
      .message-bubble {
        background: $gradient-primary;
        color: $text-primary;
      }
    }
  }
  
  &.ai {
    .message-bubble {
      background: rgba(255, 255, 255, 0.1);
      color: $text-primary;
      backdrop-filter: blur(10px);
    }
  }
  
  &.divider {
    justify-content: center;
    margin: $spacing-lg 0;
    
    .message-divider {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      width: 100%;
      
      .divider-line {
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
      }
      
      .divider-text {
        color: $text-secondary;
        font-size: 0.8rem;
        font-weight: 500;
        padding: $spacing-xs $spacing-sm;
        background: rgba(255, 255, 255, 0.1);
        border-radius: $radius-sm;
        backdrop-filter: blur(10px);
      }
    }
  }
  
  .message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: all 0.3s ease;
      
      &.offline {
        filter: grayscale(100%) brightness(0.6);
      }
    }
  }
  
  .message-content {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    
    .message-bubble {
      padding: $spacing-sm $spacing-md;
      border-radius: $radius-lg;
      word-wrap: break-word;
      
      &.voice-message {
        padding: $spacing-sm;
        
        .voice-content {
          display: flex;
          align-items: center;
          gap: $spacing-sm;
          
          .play-button {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: $text-primary;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            
            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            
            svg {
              width: 16px;
              height: 16px;
            }
          }
          
          .voice-duration {
            font-size: 0.8rem;
            color: $text-secondary;
            min-width: 20px;
          }
          
          .voice-text {
            font-size: 0.9rem;
            opacity: 0.8;
          }
        }
      }
      
      p {
        margin: 0;
        line-height: 1.4;
      }
    }
    
    .message-time {
      font-size: 0.7rem;
      color: $text-secondary;
      margin-top: $spacing-xs;
      align-self: flex-end;
    }
  }
  
  &.typing {
    .typing-indicator {
      padding: $spacing-md;
      
      .typing-dots {
        display: flex;
        gap: 4px;
        
        span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: $text-secondary;
          animation: typing 1.4s infinite ease-in-out;
          
          &:nth-child(1) { animation-delay: -0.32s; }
          &:nth-child(2) { animation-delay: -0.16s; }
          &:nth-child(3) { animation-delay: 0s; }
        }
      }
    }
  }
}

.input-area {
  background: $background-card;
  border-top: 1px solid $border-color;
  padding: $spacing-md $spacing-lg;
  
  .quick-replies {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    flex-wrap: wrap;
    
    .quick-reply-btn {
      padding: $spacing-xs $spacing-sm;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid $border-color;
      border-radius: $radius-md;
      color: $text-secondary;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: $text-primary;
      }
    }
  }
  
  .input-container {
    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: $spacing-sm;
      background: $background-dark;
      border: 1px solid $border-color;
      border-radius: $radius-lg;
      padding: $spacing-sm;
      
      .message-input {
        flex: 1;
        background: transparent;
        border: none;
        color: $text-primary;
        font-size: 1rem;
        resize: none;
        min-height: 20px;
        max-height: 120px;
        
        &:focus {
          outline: none;
        }
        
        &::placeholder {
          color: $text-secondary;
        }
      }
      
      .input-actions {
        display: flex;
        gap: $spacing-xs;
        
        .btn {
          padding: $spacing-sm;
          min-width: 40px;
          height: 40px;
          
          &.active {
            background: $primary-color;
            color: $text-primary;
          }
          
          &.recording {
            background: $error-color;
            color: $text-primary;
            animation: pulse 1s infinite;
          }
          
          svg {
            width: 18px;
            height: 18px;
          }
        }
      }
    }
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .chat-header {
    padding: $spacing-sm $spacing-md;
    
    .character-info .character-details .character-name {
      font-size: 1rem;
    }
  }
  
  .message .message-content {
    max-width: 85%;
  }
  
  .input-area {
    padding: $spacing-sm $spacing-md;
  }
}
</style>
