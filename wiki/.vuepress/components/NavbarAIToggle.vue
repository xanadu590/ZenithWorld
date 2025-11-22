<template>
  <!-- 单独的一个菜单项：AI 图片开关 -->
  <button class="menu-item" @click="toggleAI">
    <span>{{ ai.show ? '🔓 显示 AI 图片' : '🔒 隐藏 AI 图片' }}</span>
  </button>
</template>

<script setup lang="ts">
/*
  组件：NavbarMenuAIItem
  职责：
    - 只做一件事：在菜单里提供一个“AI 图片显示/隐藏”开关。
    - 使用全局注入的 AI_INJECT_KEY，与其他 AIToggle / AIMedia 联动。
*/

import { inject } from 'vue'
import { AI_INJECT_KEY } from '../client'

const ai = inject(AI_INJECT_KEY) as { show: boolean; setShow: (v: boolean) => void }

const toggleAI = () => {
  ai.setShow(!ai.show)
}
</script>

<!-- 这里不写样式，样式交给外层菜单用 :deep(.menu-item) 统一控制 -->