import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import Chat from './views/Chat.vue'
import './styles/main.scss'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/chat/:characterId', name: 'Chat', component: Chat, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const pinia = createPinia()

createApp(App)
  .use(pinia)
  .use(router)
  .mount('#app')
