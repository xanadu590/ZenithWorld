<!-- wiki/.vuepress/components/LeadBlock.vue -->
<template>
  <ClientOnly>
    <!--
      视图说明：
        - 用于在页面中展示一段“引言/台词”样式的文本。
        - 可自定义文字大小（quoteSize）和对齐方式（quoteAlign）。
        - 默认灰色、斜体、无边框风格，适合插入章节间或角色对白处。
        - 包裹在 <ClientOnly> 内以防止 SSR 阶段报错。
    -->
    <blockquote
      v-if="quote"
      class="lead-quote"
      :style="{ fontSize: quoteSizePx, textAlign: quoteAlign }"
    >
      “{{ quote }}”
    </blockquote>
  </ClientOnly>
</template>

<script setup lang="ts">
/*
  模块名称：LeadBlock
  功能说明：
    - 渲染一段可自定义样式的引用型文字（通常为角色台词、引言、诗句等）。
    - 提供 quoteSize 和 quoteAlign 属性控制文字的字号与对齐方式。
    - 若未传入 quote，则不显示任何内容（v-if 控制）。
  
  使用示例：
    <LeadBlock quote="光之所在，即是吾之归途。" />
    <LeadBlock quote="……" quoteSize="lg" quoteAlign="left" />
    <LeadBlock quote="……" :quoteSize="20" quoteAlign="right" />
*/

import { computed } from 'vue'

/*
  props 定义：
    quote        —— 台词文本（必填才会显示）
    quoteSize    —— 字号，可为以下几种类型：
                     'sm' | 'md' | 'lg' | 数字（px）| 自定义带单位字符串(px/rem/em/%)
    quoteAlign   —— 对齐方式，可选 'left' | 'center' | 'right'，默认 center。
*/
const props = defineProps<{
  quote?: string
  quoteSize?: string | number
  quoteAlign?: 'left' | 'center' | 'right'
}>()

/* 
  quote：
    - 去除输入文本前后空格。
    - 若为空字符串则不显示。
*/
const quote = computed(() => String(props.quote ?? '').trim())

/*
  quoteSizePx：
    - 计算最终用于样式的字号字符串。
    - 内置预设：
        sm → 14px
        md → 16px
        lg → 20px
    - 若用户传入合法的 CSS 尺寸（如 "1.2rem"、"80%"）也可直接使用。
    - 默认值为 18px。
*/
const quoteSizePx = computed(() => {
  const v = props.quoteSize
  if (typeof v === 'number') return `${v}px`
  if (typeof v === 'string') {
    const map: Record<string, string> = { sm: '14px', md: '16px', lg: '20px' }
    if (map[v]) return map[v]
    if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(v)) return v
  }
  return '18px'
})

/*
  quoteAlign：
    - 控制文本对齐方式。
    - 若未传入，则默认 'center'。
*/
const quoteAlign = computed(() => props.quoteAlign ?? 'center')
</script>

<style scoped>
/*
  样式说明：
    - 主要呈现为灰色、斜体的无边框文本块。
    - 适合插入段落或人物对白处。
*/

/* 明亮主题：浅灰色文本，带行距，斜体 */
.lead-quote {
  margin: 8px 0;                     /* 上下留白 */
  padding: 0;                        /* 去掉默认 padding */
  color: var(--c-text-light, #6b7280); /* 灰色文本（可根据主题变量自适应） */
  font-style: italic;                /* 斜体风格 */
  line-height: 1.75;                 /* 行高略大，便于阅读 */
  word-break: break-word;            /* 自动换行 */
  border: none;                      /* 去掉 blockquote 默认边框 */
}

/* 暗色主题下颜色加亮，确保可读性 */
html[data-theme="dark"] .lead-quote {
  color: #b4bdc6;
}
</style>