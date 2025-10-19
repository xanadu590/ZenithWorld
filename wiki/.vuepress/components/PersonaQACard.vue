<template>
  <div class="qa-card" :style="cardStyle">
    <!-- 问题行 -->
    <div class="q">
      <span class="q-label">Q：</span>
      <span class="q-text">{{ current?.q || '（暂无问题）' }}</span>
      <button v-if="allowNext" class="btn-next" @click="nextOne">换一个</button>
    </div>

    <!-- 答案行（可揭示） -->
    <div class="a" :class="{ reveal: !revealed }">
      <span class="a-label">A：</span>

      <!-- 未揭示：显示遮罩 -->
      <span v-if="!revealed" class="mask" @click="revealed = true">
        点击显示回答
      </span>

      <!-- 已揭示：显示答案 -->
      <span v-else class="a-text" v-html="safeHtml(current?.a)"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PersonaQACard
 * - 从“同一页面”的 <script type="application/json" id="qa-bank"> 读取 Q&A 数组
 * - 不显示头像/名称等头部，只保留“问题 + 答案”
 * - 支持：随机抽取，点击“换一个”，点击遮罩显示答案，暗色适配
 *
 * 使用方式见文件末尾注释。
 */

import { ref, onMounted } from 'vue'

type QA = { q: string; a: string }

const props = withDefaults(defineProps<{
  /** JSON 脚本块的 id（同页读取），默认 'qa-bank' */
  sourceId?: string
  /** 初次加载是否随机抽取问题，默认 true */
  randomOnMount?: boolean
  /** 是否显示“换一个”按钮，默认 true */
  allowNext?: boolean
  /** 卡片宽高（可不传，走自适应） */
  width?: number | string
  height?: number | string
}>(), {
  sourceId: 'qa-bank',
  randomOnMount: true,
  allowNext: true,
})

const pool = ref<QA[]>([])
const idx = ref<number>(-1)
const revealed = ref(false)

/** 生成内联样式：可在使用时传入 width/height */
const cardStyle = {
  width: typeof props.width === 'number' ? `${props.width}px` : (props.width || ''),
  height: typeof props.height === 'number' ? `${props.height}px` : (props.height || ''),
} as Record<string, string>

/** 当前题目 */
const current = ref<QA | null>(null)

/** 读取页面上的 JSON Q&A */
function loadFromDom(id: string) {
  const el = document.getElementById(id)
  if (!el) return []
  try {
    if (el.tagName.toLowerCase() === 'script' && (el as HTMLScriptElement).type === 'application/json') {
      const json = JSON.parse(el.textContent || '[]')
      return normalize(json)
    }
  } catch (e) {
    console.warn('[PersonaQACard] JSON 解析失败：', e)
  }
  return []
}

/** 兜底清洗 */
function normalize(raw: any): QA[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((x) => {
      const q = String(x?.q ?? '').trim()
      const a = String(x?.a ?? '').trim()
      return q && a ? { q, a } : null
    })
    .filter(Boolean) as QA[]
}

/** 抽一个随机索引（避免与上一次重复） */
function pickNextIndex(): number {
  if (!pool.value.length) return -1
  if (pool.value.length === 1) return 0
  let n = Math.floor(Math.random() * pool.value.length)
  if (n === idx.value) n = (n + 1) % pool.value.length
  return n
}

/** 下一题 */
function nextOne() {
  revealed.value = false
  idx.value = pickNextIndex()
  current.value = idx.value >= 0 ? pool.value[idx.value] : null
}

/** 简易转义（允许 <br> 等），也可换成更严格的白名单渲染器 */
function safeHtml(s?: string): string {
  if (!s) return ''
  // 允许手写换行：\n -> <br>
  return s.replace(/\n/g, '<br>')
}

onMounted(() => {
  pool.value = loadFromDom(props.sourceId)
  if (!pool.value.length) {
    console.warn(`[PersonaQACard] 没有在本页找到 id="${props.sourceId}" 的问答数据。`)
    current.value = null
    return
  }
  if (props.randomOnMount) {
    nextOne()
  } else {
    idx.value = 0
    current.value = pool.value[0]
  }
})
</script>

<style scoped>
/* 卡片外观（可自由微调） */
.qa-card {
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
  padding: 14px;
  color: var(--c-text, #111);
}

/* 暗色模式适配 */
html[data-theme="dark"] .qa-card{
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* 问题行 */
.q{
  display: flex;
  gap: 8px;
  align-items: center;
  line-height: 1.35;
  margin-bottom: 8px; /* ← 调整“问题”和“答案”之间的行距 */
}
.q-label{
  font-weight: 700;
}
.q-text{
  flex: 1;
  min-width: 0;
}

/* “换一个”按钮 */
.btn-next{
  flex: none;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, #f7f7f7);
  color: inherit;
  cursor: pointer;
}
.btn-next:hover{
  background: rgba(0,0,0,.06);
}
html[data-theme="dark"] .btn-next{
  background: rgba(255,255,255,.04);
  border-color: #3a3a3a;
}
html[data-theme="dark"] .btn-next:hover{
  background: rgba(255,255,255,.08);
}

/* 答案行 */
.a{
  display: flex;
  gap: 8px;
  align-items: flex-start;
  line-height: 1.65;
}

/* 未揭示状态：显示遮罩块 */
.a.reveal .mask{
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;          /* 占满整行 */
  min-height: 44px;     /* 遮罩高度（你可以改） */
  border-radius: 8px;
  background: rgba(0,0,0,.06);
  color: var(--c-text-light, #65758b);
  font-size: 0.92rem;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: background .2s ease;
}
html[data-theme="dark"] .a.reveal .mask{
  background: rgba(255,255,255,.08);
}
.a.reveal .mask:hover{
  background: rgba(0,0,0,.1);
}
html[data-theme="dark"] .a.reveal .mask:hover{
  background: rgba(255,255,255,.12);
}

/* 已揭示：正常文本 */
.a-text{
  white-space: normal;
  word-break: break-word;
}

/* “Q: / A:” 标签 */
.q-label, .a-label{
  color: var(--c-text, #111);
  font-weight: 700;
}
html[data-theme="dark"] .q-label, html[data-theme="dark"] .a-label{
  color: var(--c-text, #e5e5e5);
}
</style>