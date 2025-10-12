<!-- .vuepress/components/AIMedia.vue -->
<template>
  <ClientOnly>
    <figure v-if="ai.show" class="ai-media">
      <!-- ✅ 修复图片路径：加上 withBase 自动补 base 前缀 -->
      <img :src="srcUrl(src)" :alt="alt" :width="width" :height="height" loading="lazy" />
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
import { withBase } from '@vuepress/client'   // ✅ 新增导入

defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
  caption?: string
}>()

const ai = inject(AI_INJECT_KEY) as { show: boolean }

// ✅ 新增：自动补 base 前缀的函数
const srcUrl = (u?: string) => (!u ? '' : u.startsWith('/') ? withBase(u) : u)
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
  width: 180px;
  height: 270px;
  object-fit: cover;
  object-position: center;
}

/* 占位符也保持相同尺寸 */
.ai-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 275.5px;
  border: 1px dashed #ddd;
  border-radius: 6px;
  padding: 10px;
  color: #666;
  text-align: center;
  font-size: 14px;
  background: #fafafa;
  margin-right: 12px;
}

html[data-theme='dark'] .ai-placeholder {
  background: #1e1e1e;
  border-color: #333;
  color: #aaa;
}
</style>