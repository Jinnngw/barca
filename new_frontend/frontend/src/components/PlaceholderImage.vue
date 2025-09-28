<template>
  <div 
    class="placeholder-image" 
    :class="[`placeholder-${type}`, { circle: circle }]"
    :style="placeholderStyle"
  >
    <div class="placeholder-content">
      <svg v-if="showIcon" class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path v-if="type === 'avatar'" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle v-if="type === 'avatar'" cx="12" cy="7" r="4"></circle>
        <rect v-if="type === 'background'" x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <path v-if="type === 'background'" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span v-if="showText" class="placeholder-text">{{ text }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlaceholderImage',
  props: {
    type: {
      type: String,
      default: 'avatar',
      validator: (value) => ['avatar', 'background', 'card'].includes(value)
    },
    width: {
      type: [String, Number],
      default: '80px'
    },
    height: {
      type: [String, Number],
      default: '80px'
    },
    circle: {
      type: Boolean,
      default: false
    },
    showIcon: {
      type: Boolean,
      default: true
    },
    showText: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: ''
    },
    gradient: {
      type: String,
      default: ''
    }
  },
  computed: {
    placeholderStyle() {
      const width = typeof this.width === 'number' ? `${this.width}px` : this.width
      const height = typeof this.height === 'number' ? `${this.height}px` : this.height
      
      let background = this.gradient
      if (!background) {
        switch (this.type) {
          case 'avatar':
            background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            break
          case 'background':
            background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
            break
          case 'card':
            background = 'linear-gradient(145deg, #1e1e1e, #2a2a2a)'
            break
          default:
            background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      }
      
      return {
        width,
        height,
        background
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.placeholder-image {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  
  &.circle {
    border-radius: 50%;
  }
  
  .placeholder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
    
    .placeholder-icon {
      width: 50%;
      height: 50%;
      stroke-width: 1.5;
    }
    
    .placeholder-text {
      font-size: 0.8rem;
      margin-top: 4px;
      font-weight: 500;
    }
  }
  
  &.placeholder-avatar {
    .placeholder-icon {
      width: 60%;
      height: 60%;
    }
  }
  
  &.placeholder-background {
    .placeholder-icon {
      width: 40%;
      height: 40%;
    }
  }
}
</style>

