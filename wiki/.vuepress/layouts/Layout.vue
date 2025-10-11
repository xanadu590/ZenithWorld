<!-- wiki/.vuepress/layouts/Layout.vue -->
<script setup lang="ts">
import { Layout } from "vuepress-theme-hope/client"
import { usePageFrontmatter, usePageData } from "@vuepress/client"
import { computed, onMounted, onBeforeUnmount, nextTick, ref } from "vue"

/** 1) Frontmatter 优先（双通道兜底） */
type FM = { summary?: string }
const fmA = usePageFrontmatter<FM>()              // 常规通道
const page = usePageData()                        // 兜底通道（个别主题写在 page.frontmatter）
const fmSummaryA = computed(() => (fmA.value?.summary ?? "").trim())
const fmSummaryB = computed(
  () => String((page.value?.frontmatter as any)?.summary ?? "").trim()
)

/** 2) 自动抓正文首段（只有在 frontmatter 没给时才触发） */
const detectedSummary = ref("")
let mo: MutationObserver | null = null

function pickFirstParagraph(): string {
  // 常见正文容器（有序优先）
  const roots: Element[] = [
    document.querySelector(".theme-hope-content"),
    document.querySelector(".theme-default-content"),
    document.querySelector(".content__default"),
    document.querySelector("article"),
    document.querySelector(".page"),
    document.querySelector("main"),
  ].filter(Boolean) as Element[]

  // 尝试的选择器
  const selectors = [
    "p:not(.auto-summary)",             // 普通第一段
    ".markdown-body p:not(.auto-summary)",
    "div > p:not(.auto-summary)",
  ]

  for (const root of roots) {
    for (const sel of selectors) {
      const p = root.querySelector<HTMLParagraphElement>(sel)
      const t = (p?.textContent ?? "").replace(/\s+/g, " ").trim()
      if (t) {
        return t.length > 160 ? t.slice(0, 160) + "…" : t
      }
    }
  }
  return ""
}

async function detectSummaryWithRetries() {
  // 等两帧，等主题把正文挂出来
  await nextTick()
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  await new Promise<void>(r => requestAnimationFrame(() => r()))

  // 先尝试直接拿
  const t = pickFirstParagraph()
  if (t) {
    detectedSummary.value = t
    return
  }

  // 再用 MutationObserver 监听一次渲染完成
  const root =
    document.querySelector(".theme-hope-content") ||
    document.querySelector(".theme-default-content") ||
    document.querySelector(".content__default") ||
    document.querySelector("article") ||
    document.querySelector(".page") ||
    document.querySelector("main") ||
    document.body

  mo = new MutationObserver(() => {
    const tt = pickFirstParagraph()
    if (tt) {
      detectedSummary.value = tt
      mo?.disconnect()
      mo = null
    }
  })
  mo.observe(root!, { childList: true, subtree: true })

  // 最长监听 5s，避免遗留
  setTimeout(() => { mo?.disconnect(); mo = null }, 5000)
}

onMounted(() => {
  // 只有两个 frontmatter 通道都为空时才尝试自动抓
  if (!(fmSummaryA.value || fmSummaryB.value)) {
    detectSummaryWithRetries()
  }
})
onBeforeUnmount(() => { mo?.disconnect(); mo = null })

/** 最终展示的简介：A/B 任一有值即用，否则用自动抓取 */
const summaryToShow = computed(
  () => fmSummaryA.value || fmSummaryB.value || detectedSummary.value
)
</script>

<template>
  <Layout>
    <template #default>
      <div class="zen-page-wrap">
        <!-- 自动简介：优先 frontmatter.summary，没有就抓正文第一段 -->
        <p v-if="summaryToShow" class="auto-summary">
          {{ summaryToShow }}
        </p >

        <!-- 正文 -->
        <Content />
      </div>
    </template>
  </Layout>
</template>

<style scoped>
.zen-page-wrap {}

/* 居中、略大、加粗、舒适行高 */
.auto-summary{
  margin: 12px 0 18px;
  text-align: center;
  font-size: clamp(15px, 1.6vw, 18px);
  line-height: 1.65;
  color: var(--c-text, #111);
  font-weight: 600;
  word-break: break-word;
}
html[data-theme="dark"] .auto-summary{ color:#e5e5e5; }
</style>