<template>
  <div class="zw-tip-card">
    <div class="tip-title">{{ term }}</div>
    <p v-if="tooltip" class="tip-summary">
      {{ tooltip }}
    </p >
  </div>
</template>

<script setup lang="ts">
defineProps<{
  term: string
  to: string
  tooltip?: string
  first?: string
}>()
</script>

<style scoped>
/* ====== 迷你版 RoleCard 外观 ====== */
.zw-tip-card {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translate(16px, -50%); /* 右偏 16px，垂直居中 */

  /* 尺寸控制：感觉类似一张小卡片 */
  width: 260px;           /* 可以按需调大调小 */
  max-width: 320px;
  box-sizing: border-box;

  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  box-shadow: 0 2px 12px rgba(0, 0, 0, .05);
  color: var(--c-text, #111);

  font-size: 0.8rem;      /* 和 .role-card 保持一个层级 */
  line-height: 1.5;
  z-index: 9999;

  /* 关键：正常横向排版、自动换行 */
  white-space: normal;
  word-break: break-word;

  display: none;          /* 默认隐藏，由外部 hover 控制显示 */
  text-decoration: none;
}

/* 暗色主题下的外观，照抄 RoleCard 的思路 */
html[data-theme="dark"] .zw-tip-card {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* 标题行，类似 .role-card 里的 .title */
.tip-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 6px;
}

/* 文本内容 */
.tip-summary {
  margin: 0;
}
</style>