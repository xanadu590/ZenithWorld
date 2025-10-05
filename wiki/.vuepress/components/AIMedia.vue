<!-- .vuepress/components/AIMedia.vue -->
<template>
  <ClientOnly>
    <figure v-if="ai.show" class="ai-media">
      <img :src="src" :alt="alt" :width="width" :height="height" loading="lazy" />
      <figcaption v-if="caption">{{ caption }}</figcaption>
    </figure>

    <div v-else class="ai-placeholder">
      <slot name="placeholder">
        🔒 AI 生成内容已隐藏
      </slot>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { AI_INJECT_KEY } from '../client'

defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
  caption?: string
}>()

const ai = inject(AI_INJECT_KEY) as { show: boolean }
</script>

<style scoped>
.ai-media figcaption {
  color:#666;
  font-size: 13px;
  margin-top: 6px;
}

/* [CHANGE] 图片裁剪与对齐增强 */
.ai-media {
  display: inline-block;
  vertical-align: top;
  margin-right: 12px;
}

/* 固定显示区域，高度统一、自动裁剪、保持居中 */
.ai-media img {
  border-radius: 6px;
  width: 220px;           /* 固定宽度，可根据需要调整 */
  height: 330px;          /* 固定高度，确保并排统一 */
  object-fit: cover;      /* 自动裁剪图片而不变形 */
  object-position: center;/* 居中裁剪区域 */
}

/* 占位符也保持相同尺寸 */
.ai-placeholder {
  display: inline-flex; /* 改为 inline-flex 支持横向排列 */
  align-items: center;  /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  width: 220px;
  height: 300px;
  border: 1px dashed #ddd;
  border-radius: 6px;
  padding: 10px;
  color: #666;
  text-align: center;
  font-size: 14px;
  background: #fafafa;
  margin-right: 12px;
}
</style>