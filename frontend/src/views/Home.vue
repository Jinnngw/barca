<template>
  <div class="home">
    <!-- 头部 -->
    <header class="header">
      <div class="container">
        <h1 class="title">
          <span class="gradient-text">AI角色扮演</span>
        </h1>
        <p class="subtitle">与历史人物、文学角色进行深度对话</p>
      </div>
    </header>

    <!-- 搜索区域 -->
    <section class="search-section">
      <div class="container">
        <div class="search-box">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              v-model="characterStore.searchQuery"
              type="text"
              placeholder="搜索角色，如：哈利波特、苏格拉底..."
              class="search-input"
              @input="handleSearch"
            />
          </div>
          
          <div class="category-tabs">
            <button
              v-for="category in characterStore.categories"
              :key="category.value"
              :class="['category-tab', { active: characterStore.selectedCategory === category.value }]"
              @click="characterStore.setSelectedCategory(category.value)"
            >
              {{ category.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 角色网格 -->
    <section class="characters-section">
      <div class="container">
        <div v-if="characterStore.filteredCharacters.length === 0" class="no-results">
          <svg class="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>未找到相关角色</h3>
          <p>尝试搜索其他关键词或选择不同分类</p>
        </div>
        
        <div v-else class="characters-grid">
          <div
            v-for="character in characterStore.filteredCharacters"
            :key="character.id"
            class="character-card"
            :class="{ offline: !character.isOnline }"
            @click="goToChat(character.id)"
          >
            <div class="character-avatar">
              <img 
                :src="character.avatar" 
                :alt="character.name"
                :class="{ offline: !character.isOnline }"
              />
              <div class="online-indicator" :class="{ online: character.isOnline, offline: !character.isOnline }"></div>
            </div>
            
            <div class="character-info">
              <h3 class="character-name">{{ character.name }}</h3>
              <p class="character-description">{{ character.description }}</p>
              <div class="character-tags">
                <span class="tag category">{{ character.category }}</span>
                <span class="tag personality">{{ character.personality }}</span>
              </div>
            </div>
            
            <div class="character-actions">
              <button class="btn btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                开始对话
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 特色功能 -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">特色功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h3>智能对话</h3>
            <p>基于先进AI技术，提供自然流畅的对话体验</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7h4m0 0h4a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2h-4m-6 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
            <h3>语音交互</h3>
            <p>支持语音输入和输出，让对话更加生动自然</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>角色扮演</h3>
            <p>每个角色都有独特的性格和说话方式</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { useCharacterStore } from '../stores/characters'
import { useRouter } from 'vue-router'
import PlaceholderImage from '../components/PlaceholderImage.vue'

export default {
  name: 'Home',
  components: {
    PlaceholderImage
  },
  setup() {
    const characterStore = useCharacterStore()
    const router = useRouter()
    
    const handleSearch = () => {
      characterStore.setSearchQuery(characterStore.searchQuery)
    }
    
    const goToChat = (characterId) => {
      router.push({ name: 'Chat', params: { characterId } })
    }
    
    return {
      characterStore,
      handleSearch,
      goToChat
    }
  }
}
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background: $background-dark;
}

.header {
  padding: $spacing-2xl 0 $spacing-xl;
  text-align: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  
  .title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 $spacing-md;
    
    .gradient-text {
      background: $gradient-primary;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
  
  .subtitle {
    font-size: 1.2rem;
    color: $text-secondary;
    margin: 0;
  }
}

.search-section {
  padding: $spacing-xl 0;
  
  .search-box {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .search-input-wrapper {
    position: relative;
    margin-bottom: $spacing-lg;
    
    .search-icon {
      position: absolute;
      left: $spacing-md;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      color: $text-secondary;
    }
    
    .search-input {
      width: 100%;
      padding: $spacing-md $spacing-md $spacing-md 3rem;
      font-size: 1.1rem;
      background: $background-card;
      border: 2px solid $border-color;
      border-radius: $radius-lg;
      color: $text-primary;
      transition: all 0.3s ease;
      
      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      }
    }
  }
  
  .category-tabs {
    display: flex;
    gap: $spacing-sm;
    justify-content: center;
    flex-wrap: wrap;
    
    .category-tab {
      padding: $spacing-sm $spacing-md;
      background: transparent;
      border: 1px solid $border-color;
      border-radius: $radius-md;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        color: $text-primary;
        border-color: $primary-color;
      }
      
      &.active {
        background: $gradient-primary;
        color: $text-primary;
        border-color: transparent;
      }
    }
  }
}

.characters-section {
  padding: $spacing-xl 0;
  
  .no-results {
    text-align: center;
    padding: $spacing-2xl;
    
    .no-results-icon {
      width: 64px;
      height: 64px;
      color: $text-secondary;
      margin-bottom: $spacing-lg;
    }
    
    h3 {
      color: $text-primary;
      margin-bottom: $spacing-sm;
    }
    
    p {
      color: $text-secondary;
    }
  }
  
  .characters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: $spacing-lg;
  }
  
  .character-card {
    background: $gradient-card;
    border-radius: $radius-lg;
    padding: $spacing-lg;
    border: 1px solid $border-color;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-xl;
      border-color: $primary-color;
    }
    
    &.offline {
      cursor: pointer;
      opacity: 0.8;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: $shadow-lg;
        border-color: $text-secondary;
      }
    }
    
    .character-avatar {
      position: relative;
      width: 80px;
      height: 80px;
      margin-bottom: $spacing-md;
      
      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid $primary-color;
        transition: all 0.3s ease;
        
        &.offline {
          filter: grayscale(100%) brightness(0.4);
          border-color: $text-secondary;
        }
      }
      
      .online-indicator {
        position: absolute;
        bottom: 5px;
        right: 5px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid $background-dark;
        
        &.online {
          background: $success-color;
        }
        
        &.offline {
          background: $text-secondary;
        }
      }
    }
    
    .character-info {
      margin-bottom: $spacing-lg;
      
      .character-name {
        font-size: 1.3rem;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 $spacing-sm;
      }
      
      .character-description {
        color: $text-secondary;
        margin: 0 0 $spacing-md;
        line-height: 1.5;
      }
      
      .character-tags {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
        
        .tag {
          padding: $spacing-xs $spacing-sm;
          border-radius: $radius-sm;
          font-size: 0.8rem;
          font-weight: 500;
          
          &.category {
            background: rgba(99, 102, 241, 0.2);
            color: $primary-color;
          }
          
          &.personality {
            background: rgba(139, 92, 246, 0.2);
            color: $secondary-color;
          }
        }
      }
    }
    
    .character-actions {
      .btn {
        width: 100%;
        justify-content: center;
        gap: 4px; 
        
        svg {
          width: 18px;
          height: 18px;
          transform: translateY(4px); 
        }
      }
    }
  }
}

.features-section {
  padding: $spacing-2xl 0;
  background: rgba(255, 255, 255, 0.02);
  
  .section-title {
    text-align: center;
    font-size: 2rem;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $spacing-xl;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: $spacing-lg;
  }
  
  .feature-card {
    text-align: center;
    padding: $spacing-xl;
    
    .feature-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto $spacing-lg;
      background: $gradient-primary;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 32px;
        height: 32px;
        color: $text-primary;
      }
    }
    
    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: $spacing-sm;
    }
    
    p {
      color: $text-secondary;
      line-height: 1.6;
    }
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-md;
}

@media (max-width: 768px) {
  .header .title {
    font-size: 2rem;
  }
  
  .characters-grid {
    grid-template-columns: 1fr;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
