// .vuepress/client.ts
import { defineClientConfig } from 'vuepress/client'
import { reactive, h } from 'vue'
import AIToggle from './components/AIToggle.vue'
import AIMedia from './components/AIMedia.vue' // ← 新增：显式引入
import WorldTimeline from './components/WorldTimeline.vue'
import RelationCards from './components/RelationCards.vue' 
import RelationGraph from './components/RelationGraph.vue'

export type AISetting = {
  show: boolean
  setShow: (v: boolean) => void
}

const KEY = 'showAIImages'
export const AI_INJECT_KEY = Symbol('AISetting')

export default defineClientConfig({
  enhance({ app }) {
    const setting = reactive<AISetting>({
      show:
        typeof window !== 'undefined'
          ? (localStorage.getItem(KEY) ?? 'off') === 'on'
          : false,
      setShow(v: boolean) {
        setting.show = v
        if (typeof window !== 'undefined') {
          localStorage.setItem(KEY, v ? 'on' : 'off')
        }
      },
    })

    // 全局注入
    app.provide(AI_INJECT_KEY, setting)

    // ✅ 显式注册组件（可选，不注册也能用）
    app.component('AIMedia', AIMedia)

    app.component('WorldTimeline', WorldTimeline)           // ← 新增：全局注册
    // ……你原来 AI 注入、rootComponents 等保留不动
    
    app.component('RelationCards', RelationCards)          // ← 新增：全局注册

    app.component('RelationGraph', RelationGraph)
  },

  // 右上角悬浮的总开关
  rootComponents: [h(AIToggle)],
})