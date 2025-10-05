// .vuepress/client.ts
import { defineClientConfig } from 'vuepress/client'
import { reactive, h } from 'vue'
import AIToggle from './components/AIToggle.vue'
import AIMedia from './components/AIMedia.vue'

export type AISetting = {
  show: boolean
  setShow: (v: boolean) => void
}

const STORAGE_KEY = 'showAIImages'
export const AI_INJECT_KEY = Symbol('AISetting')

export default defineClientConfig({
  enhance({ app }) {
    // 全局可响应的开关（带本地持久化）
    const setting = reactive<AISetting>({
      show:
        typeof window !== 'undefined'
          ? (localStorage.getItem(STORAGE_KEY) ?? 'off') === 'on'
          : false,
      setShow(v: boolean) {
        setting.show = v
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, v ? 'on' : 'off')
        }
      },
    })

    // 注入到全局（供任意组件 inject 使用）
    app.provide(AI_INJECT_KEY, setting)

    // ✅ 显式注册全局组件（最稳妥）
    app.component('AIToggle', AIToggle)
    app.component('AIMedia', AIMedia)
  },

  // 在每个页面右上角挂一个总开关
  rootComponents: [h(AIToggle)],
})