<template>
  <ClientOnly>
    <div id="twikoo-comment"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
// 让 TypeScript 认识 window.twikooInited
declare global {
  interface Window {
    twikooInited?: boolean
    twikoo?: any
  }
}

import { onMounted } from 'vue'

const ENV_ID = 'https://twikoo-tau-lime-63.vercel.app' // ← 你的 Twikoo 云函数地址

onMounted(() => {
  if (typeof window === 'undefined') return

  const initTwikoo = () => {
    // 避免重复初始化：同一个元素，只初始化一次
    if (!window.twikooInited) {
      window.twikooInited = true
    } else {
      // 多次导航时，先清空一下 DOM 再重新渲染
      const el = document.getElementById('twikoo-comment')
      if (el) el.innerHTML = ''
    }

    // @ts-ignore
    window.twikoo.init({
      envId: 'https://comment.zenithworld.top/api/twikoo',
      el: '#twikoo-comment',
      lang: 'zh-CN',
      // 用路径当作评论唯一 ID，跟路由绑定
      path: window.location.pathname + window.location.hash
    })
  }

  // 如果页面已经加载了 twikoo 脚本，直接初始化
  // @ts-ignore
  if (window.twikoo) {
    initTwikoo()
  } else {
    // 否则动态加载 CDN 脚本
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.all.min.js'
    script.defer = true
    script.onload = () => initTwikoo()
    document.head.appendChild(script)
  }
})
</script>

<style scoped>
#twikoo-comment {
  margin-top: 2rem;
}
</style>