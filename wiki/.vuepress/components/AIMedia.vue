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
/*
  组件名称：AIMedia
  功能综述：
    - 在文章中展示“受全局 AI 可见性开关控制”的图片媒体。
    - 当全局 show=true 时渲染图片与可选说明；否则渲染占位内容。
    - 对以 “/” 开头的站内图片路径自动补齐站点 base 前缀，兼容 GitHub Pages 等子路径部署。

  可调参数（Props）：
    // 必填：图片源地址；支持站内绝对路径（/开头）与外链
    - src: string
    // 选填：图片无障碍文本
    - alt?: string
    // 选填：宽度；数字按 px 处理，也可传 "180px"、"12rem"
    - width?: string | number
    // 选填：高度；数字按 px 处理，也可传 "270px"
    - height?: string | number
    // 选填：图片下方说明文字；传入才会渲染 <figcaption>
    - caption?: string

  用法示例：
    <AIMedia src="/images/hero.png" alt="海报" caption="宣传海报" />
    <AIMedia src="https://example.com/pic.jpg" :width="240" :height="360" />

  实现要点：
    // 1) 通过 inject(AI_INJECT_KEY) 读取全局 show 状态；不依赖 SSR 环境变量。
    // 2) 使用 srcUrl() 对站内路径进行 withBase 补前缀，避免部署在子路径时 404。
    // 3) 样式层使用固定可视区 + object-fit: cover，实现统一尺寸与自动裁剪。
*/

import { inject } from 'vue'
import { AI_INJECT_KEY } from '../client'
import { withBase } from '@vuepress/client'  // 保留：基于站点 base 构造完整资源路径

defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
  caption?: string
}>()

// 全局 AI 可见性对象：只读 show
const ai = inject(AI_INJECT_KEY) as { show: boolean }

// srcUrl：站内路径（/开头）自动补 base；外链保持原样
const srcUrl = (u?: string) => (!u ? '' : u.startsWith('/') ? withBase(u) : u)
</script>

<style scoped>
/* 说明文本：灰色小号，顶部留白 */
.ai-media figcaption {
  color:#666;
  font-size: 13px;
  margin-top: 6px;
}

/* 图片容器：可并排显示，顶部对齐，右侧留间距 */
.ai-media {
  display: inline-block;
  vertical-align: top;
  margin-right: 12px;
}

/* 固定显示区域：统一宽高，使用 cover 居中裁剪以保持比例且铺满 */
.ai-media img {
  border-radius: 6px;
  width: 180px;
  height: 270px;
  object-fit: cover;
  object-position: center;
}

/* 占位块：与图片接近的尺寸与对齐，保证隐藏状态下版式稳定 */
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

/* 暗色模式占位样式 */
html[data-theme='dark'] .ai-placeholder {
  background: #1e1e1e;
  border-color: #333;
  color: #aaa;
}
</style>