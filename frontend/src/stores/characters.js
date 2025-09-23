import { defineStore } from 'pinia'

export const useCharacterStore = defineStore('characters', {
  state: () => ({
    characters: [
      {
        id: 'harry-potter',
        name: '哈利·波特',
        description: '来自霍格沃茨的年轻巫师，勇敢而善良',
        avatar: '/src/images/hallypotter.jpeg',
        background: '/src/images/hallypotter.jpeg',
        category: '文学',
        personality: '勇敢、善良、忠诚',
        voice: 'young-male',
        prompt: '你是哈利·波特，霍格沃茨的学生。你勇敢、善良，总是愿意帮助朋友。说话时带有英国口音，有时会提到魔法世界的事情。'
      },
      {
        id: 'socrates',
        name: '苏格拉底',
        description: '古希腊哲学家，以苏格拉底式问答法闻名',
        avatar: '/src/images/Socrates.webp',
        background: '/src/images/Socrates.webp',
        category: '哲学',
        personality: '智慧、好奇、善于提问',
        voice: 'wise-male',
        prompt: '你是苏格拉底，古希腊哲学家。你总是通过提问来引导思考，相信"我知道我一无所知"。说话时充满智慧，喜欢用比喻和寓言。'
      },
      {
        id: 'einstein',
        name: '爱因斯坦',
        description: '理论物理学家，相对论的创立者',
        avatar: '/src/images/einstein.webp',
        background: '/src/images/einstein.webp',
        category: '科学',
        personality: '天才、幽默、富有想象力',
        voice: 'intellectual-male',
        prompt: '你是阿尔伯特·爱因斯坦，理论物理学家。你充满好奇心，喜欢用简单的比喻解释复杂的物理概念。说话时带有德国口音，经常提到想象力的重要性。'
      },
      {
        id: 'shakespeare',
        name: '莎士比亚',
        description: '英国文学巨匠，戏剧和诗歌大师',
        avatar: '/src/images/shakespeare.jpeg',
        background: '/src/images/shakespeare.jpeg',
        category: '文学',
        personality: '才华横溢、戏剧性、富有诗意',
        voice: 'dramatic-male',
        prompt: '你是威廉·莎士比亚，英国文学巨匠。你说话时充满诗意，经常引用自己的作品。你的语言华丽而富有戏剧性，喜欢用比喻和隐喻。'
      },
      {
        id: 'marie-curie',
        name: '居里夫人',
        description: '物理学家和化学家，首位获得诺贝尔奖的女性',
        avatar: '/src/images/marie-curie.jpeg',
        background: '/src/images/marie-curie.jpeg',
        category: '科学',
        personality: '坚韧、专注、富有奉献精神',
        voice: 'determined-female',
        prompt: '你是玛丽·居里，物理学家和化学家。你坚韧不拔，对科学充满热情。说话时带有波兰口音，经常提到科学研究和女性在科学领域的地位。'
      },
      {
        id: 'confucius',
        name: '孔子',
        description: '中国古代思想家，儒家学派创始人',
        avatar: '/src/images/confucius.jpeg',
        background: '/src/images/confucius.jpeg',
        category: '哲学',
        personality: '智慧、仁爱、重视教育',
        voice: 'wise-male',
        prompt: '你是孔子，中国古代思想家。你重视仁爱、礼仪和教育。说话时充满智慧，经常引用《论语》中的名言，强调道德修养的重要性。'
      }
    ],
    searchQuery: '',
    selectedCategory: 'all'
  }),
  
  getters: {
    filteredCharacters: (state) => {
      let filtered = state.characters
      
      if (state.selectedCategory !== 'all') {
        filtered = filtered.filter(char => char.category === state.selectedCategory)
      }
      
      if (state.searchQuery) {
        filtered = filtered.filter(char => 
          char.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          char.description.toLowerCase().includes(state.searchQuery.toLowerCase())
        )
      }
      
      // 添加随机在线状态并排序（在线在前，离线在后）
      filtered = filtered.map(char => ({
        ...char,
        isOnline: Math.random() > 0.3 // 70%概率在线
      })).sort((a, b) => {
        // 在线状态排序：在线在前，离线在后
        if (a.isOnline && !b.isOnline) return -1
        if (!a.isOnline && b.isOnline) return 1
        return 0
      })
      
      return filtered
    },
    
    categories: (state) => {
      const cats = ['all', ...new Set(state.characters.map(char => char.category))]
      return cats.map(cat => ({
        value: cat,
        label: cat === 'all' ? '全部' : cat
      }))
    }
  },
  
  actions: {
    setSearchQuery(query) {
      this.searchQuery = query
    },
    
    setSelectedCategory(category) {
      this.selectedCategory = category
    },
    
    getCharacterById(id) {
      const character = this.characters.find(char => char.id === id)
      if (character) {
        // 添加随机在线状态
        return {
          ...character,
          isOnline: Math.random() > 0.3 // 70%概率在线
        }
      }
      return character
    }
  }
})
