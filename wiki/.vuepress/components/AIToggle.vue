<!-- .vuepress/components/AIToggle.vue -->
<template>
  <ClientOnly>
    <!--
      视图说明：
      - 固定在页面右上角的一个按钮，用于切换“是否显示 AI 生成图片”。
      - 按钮文本根据全局状态 ai.show 动态变化（true/false）。
      - 包裹在 <ClientOnly> 内以防止 SSR 阶段出现窗口依赖报错。
    -->
    <button class="ai-toggle" @click="toggle" :title="ai.show ? '点击隐藏 AI 图片' : '点击显示 AI 图片'">
      <span v-if="ai.show">🔓 显示 AI 图</span>
      <span v-else>🔒 隐藏 AI 图</span>
    </button>
  </ClientOnly>
</template>

<script setup lang="ts">
/*
  模块名称：AIToggle
  功能说明：
    - 提供全局可视化切换按钮，用于控制“AI 生成内容”是否显示。
    - 通过 inject() 从全局状态中读取并写入 show 值，从而和 AIMedia 等组件联动。
  
  依赖项：
    - inject：Vue 内置依赖注入方法，用于从上层 App 注入上下文。
    - AI_INJECT_KEY：在 ../client 中定义的 Symbol Key，用于全局共享 AI 显隐状态。
      * show: boolean —— 当前是否显示 AI 生成内容
      * setShow(v: boolean): void —— 切换显隐状态的函数

  使用方法：
    <AIToggle />      // 放在全局布局或导航栏中即可使用
*/

import { inject } from 'vue'
import { AI_INJECT_KEY } from '../client'

// 从全局注入对象中读取当前状态（show）与切换函数（setShow）
const ai = inject(AI_INJECT_KEY) as { show: boolean; setShow: (v: boolean) => void }

/* 
  toggle()
  功能：切换 AI 显示状态。
  实现：取当前 ai.show 的反值并写回 setShow()，触发联动。
*/
const toggle = () => ai.setShow(!ai.show)
</script>

<style scoped>
/*
  外观样式说明：
    - 使用 Theme Hope 主题变量（--c-text、--vp-c-bg-soft、--c-border、--c-brand）以自动适配明暗模式。
    - 默认固定于右上角，可根据需要调整 top/right。
    - 悬停时边框高亮并带轻微浮动。
*/

/* 固定位置的切换按钮（默认明亮主题） */
.ai-toggle {
  position: fixed;
  z-index: 9999;
  top: 12px;                /* 控制距离顶部的间距，可调整 */
  right: 300px;             /* 控制距离右侧的间距，可调整 */
  font-size: 13px;          /* 按钮内文字大小，可调整 */
  padding: 6px 10px;        /* 按钮内边距，可调整 */
  border-radius: 999px;     /* 胶囊外观 */
  cursor: pointer;

  /* 使用主题变量自动匹配主题颜色 */
  color: var(--c-text, #111);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border: 1px solid var(--c-border, #e5e7eb);

  /* 阴影与过渡效果 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

/* 悬停态：边框变为主题色并轻微上移 */
.ai-toggle:hover {
  border-color: var(--c-brand, #3a7bff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* 暗色主题下的外观样式 */
html[data-theme='dark'] .ai-toggle {
  background: var(--vp-c-bg-soft, #1e1e1e);
  color: var(--c-text, #eee);
  border-color: var(--c-border, #333);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 暗色主题下的悬停效果 */
html[data-theme='dark'] .ai-toggle:hover {
  border-color: var(--c-brand, #5c9dff);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}
</style>