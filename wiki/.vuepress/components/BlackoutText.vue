<!-- wiki/.vuepress/components/BlackoutText.vue -->
<template>
  <span
    class="zw-blackout"
    :class="{ reveal: open }"
    role="button"
    tabindex="0"
    :aria-pressed="open ? 'true' : 'false'"
    @click="open = !open"
    @keydown.enter.prevent="open = !open"
    @keydown.space.prevent="open = !open"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false) // 默认遮住；点击展开/收起
</script>

<style scoped>
/* 可调参数 */
.zw-blackout{
  --blk-bg: #000;     /* 黑幕颜色 */
  --blk-radius: 0;      /* .25em; */
  --blk-pad-x: 0;       /*.2em; */
  --blk-pad-y: 0;       /*.05em; */
}

/* 直接用背景做“黑幕”，不需要 ::before 也不需要定位 */
.zw-blackout{
  display: inline;
  box-decoration-break: clone;       /* 多行逐行绘制背景，杜绝行尾残影 */
  -webkit-box-decoration-break: clone;

  background: var(--blk-bg);
  color: transparent;                /* 隐藏文字颜色 */
  -webkit-text-fill-color: transparent;
  text-shadow: none;

  border-radius: var(--blk-radius);
  padding: var(--blk-pad-y) var(--blk-pad-x);

  cursor: pointer;
  user-select: none;                 /* 折叠时不让选中文字防止露字 */
  transition: background .12s ease, color .12s ease;
}

/* 展开：去掉背景，恢复文字 */
.zw-blackout.reveal{
  background: transparent;
  color: inherit;
  -webkit-text-fill-color: initial;
  user-select: text;
}

/* 无障碍：键盘聚焦可见 */
.zw-blackout:focus-visible{
  outline: 2px solid color-mix(in oklab, var(--blk-bg), transparent 70%);
  outline-offset: 2px;
}
</style>