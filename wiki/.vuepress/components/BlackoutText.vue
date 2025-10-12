<template>
  <!-- 黑幕文字组件 -->
  <span
    class="blackout"
    :class="{ revealed }"
    @click="toggle"
  >
    <slot />
  </span>
</template>

<script setup>
import { ref } from 'vue'

/**
 * 控制点击状态
 * revealed = 是否已揭示
 */
const revealed = ref(false)

const toggle = () => {
  revealed.value = !revealed.value
}
</script>

<style scoped>
/* 黑幕基础样式 */
.blackout {
  color: transparent;
  background-color: #000;
  border-radius: 3px;
  padding: 0 4px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
  box-shadow: 0 0 2px #000;
}

/* 鼠标悬停时显示轻微提示 */
.blackout:hover {
  background-color: #111;
}

/* 已揭示状态：恢复原始颜色与背景 */
.blackout.revealed {
  color: inherit;
  background-color: transparent;
  box-shadow: none;
}

/* 暗色模式优化 */
html[data-theme="dark"] .blackout {
  background-color: #444;
  box-shadow: 0 0 3px #000;
}
html[data-theme="dark"] .blackout:hover {
  background-color: #555;
}
</style>