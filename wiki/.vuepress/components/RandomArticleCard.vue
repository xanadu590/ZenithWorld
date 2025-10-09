<template>
  <!-- ✅ 放哪儿都行：占满容器宽度；建议插到文末 -->
  <ClientOnly>
    <div class="random-card" v-if="ready">
      <!-- 左箭头：回到上一条（最多 3 条） -->
      <button
        class="nav-btn prev"
        :disabled="history.length === 0"
        @click="showPrev"
        aria-label="上一条推荐"
        title="上一条推荐"
      >
        ←
      </button>

      <!-- 中间：卡片主体（点击即可跳转） -->
      <div
        class="card-body"
        role="link"
        tabindex="0"
        @click="goCurrent"
        @keydown.enter.prevent="goCurrent"
        :title="current?.title || current?.href"
      >
        <div class="title">{{ current?.title || current?.href }}</div>
        <div class="excerpt">
          <!-- 先用 a 文本或路径名做“摘要”；后续可扩展真实摘要 -->
          {{ current?.excerpt || simpleExcerpt(current) }}
        </div>
      </div>

      <!-- 右箭头：换下一条随机推荐 -->
      <button
        class="nav-btn next"
        :disabled="candidates.length === 0"
        @click="showNext"
        aria-label="下一条推荐"
        title="下一条推荐"
      >
        →
      </button>
    </div>

    <!-- 没找到候选链接的兜底提示 -->
    <div class="random-card empty" v-else>
      <span>未找到可用的站内文章链接。</span>
      <button class="retry" @click="init">重试</button>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * 功能说明（简版）：
 * - 从“当前页面中出现的站内链接”里，自动挑选候选项
 * - 也可通过 props.pool 手动传入候选项（更精准）
 * - 不依赖 VuePress 的 pages，避免你说的爆红
 * - 维护一个“最多 N 条”的回退栈（默认 3）
 */

import { onMounted, ref } from 'vue'

type Candidate = {
  href: string         // 必填：跳转地址（站内）
  title?: string       // 可选：标题（没有时用路径名兜底）
  excerpt?: string     // 可选：摘要（当前简版未抓取页面内容）
}

const props = withDefaults(defineProps<{
  /** 可选：外部直接喂候选列表（更干净） */
  pool?: Candidate[]
  /** 历史回退最大条数 */
  maxHistory?: number
}>(), {
  pool: () => [],
  maxHistory: 3,
})

/** 运行时状态 */
const ready = ref(false)            // 是否已经准备好显示卡片
const candidates = ref<Candidate[]>([]) // 备选池
const current = ref<Candidate | null>(null) // 当前展示
const history = ref<Candidate[]>([])       // 后退栈（先进后出）

/** 入口：优先使用 props.pool；否则扫描当前页内站内链接生成候选 */
const init = () => {
  ready.value = false
  candidates.value = []

  // 1) 先吃 props.pool
  const byProps = Array.isArray(props.pool) ? props.pool : []
  if (byProps.length > 0) {
    candidates.value = uniqueByHref(byProps.filter(validCandidate))
  } else {
    // 2) 兜底：从页面所有 <a> 里筛选“站内 .html 链接”
    candidates.value = collectFromDocument()
  }

  // 去掉当前页链接，避免随机到自己
  const cur = location.pathname.replace(location.origin, '')
  candidates.value = candidates.value.filter(c => normalize(c.href) !== normalize(cur))

  if (candidates.value.length > 0) {
    current.value = pickRandom(candidates.value)
    ready.value = true
  } else {
    ready.value = false
  }
}

/** 点击“下一条”：把当前推到历史栈 → 抽一个新随机 */
const showNext = () => {
  if (!current.value || candidates.value.length === 0) return
  // 入栈（维持长度上限）
  history.value.unshift(current.value)
  if (history.value.length > props.maxHistory) history.value.pop()

  // 随机，尽量避免跟上一条重复
  let next = pickRandom(candidates.value)
  if (history.value.length > 0 && next.href === history.value[0].href) {
    next = pickRandom(candidates.value)
  }
  current.value = next
}

/** 点击“上一条”：从历史栈弹出一个 */
const showPrev = () => {
  if (history.value.length === 0) return
  const prev = history.value.shift()!
  current.value = prev
}

/** 跳转当前链接 */
const goCurrent = () => {
  if (!current.value) return
  window.location.assign(current.value.href)
}

/** 工具：从文档中收集“站内 .html”链接 */
function collectFromDocument(): Candidate[] {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
  const sameOrigin = anchors.filter(a => {
    try {
      const u = new URL(a.href, location.href)
      // 站内：同域 && .html 结尾（避免锚点/外链）
      return u.origin === location.origin && /\.html$/.test(u.pathname)
    } catch { return false }
  })
  const mapped = sameOrigin.map(a => ({
    href: a.getAttribute('href') || a.href,
    title: (a.textContent || '').trim(),
  }))
  return uniqueByHref(mapped.filter(validCandidate))
}

/** 工具：校验一个候选是否有效 */
function validCandidate(c: Candidate): boolean {
  if (!c || !c.href) return false
  const h = normalize(c.href)
  return /\.html$/.test(h) && !h.startsWith('http')
}

/** 工具：按 href 去重 */
function uniqueByHref(list: Candidate[]): Candidate[] {
  const map = new Map<string, Candidate>()
  list.forEach(c => {
    const key = normalize(c.href)
    if (!map.has(key)) map.set(key, { ...c, href: key })
  })
  return Array.from(map.values())
}

/** 工具：简单随机 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 工具：标准化相对/绝对 href 为站内路径 */
function normalize(href: string): string {
  try {
    // 绝对 -> 取 pathname；相对 -> 保持
    const u = new URL(href, location.href)
    return u.pathname
  } catch {
    return href
  }
}

/** 工具：没有 excerpt 时，用路径名/标题做一个简短占位 */
function simpleExcerpt(c?: Candidate | null): string {
  if (!c) return ''
  if (c.excerpt && c.excerpt.trim()) return c.excerpt.trim()
  if (c.title && c.title.trim() && c.title.trim() !== c.href) return c.title.trim()
  // 从 /a/b/c.html 取 c 作为简要
  const m = c.href.match(/\/([^\/]+)\.html$/)
  return m ? decodeURIComponent(m[1]) : c.href
}

onMounted(init)
</script>

<style scoped>
/* ======= 外层卡片：占满容器宽度，贴近内容区 ======= */
.random-card {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin: 16px 0 0;
  padding: 0;
}

/* ======= 左右箭头 ======= */
.nav-btn {
  flex: none;
  width: 44px;
  min-height: 96px;
  border-radius: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  color: var(--c-text, #111);
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease, transform .1s ease;
}
.nav-btn:hover:enabled { transform: translateY(-1px); }
.nav-btn:disabled { opacity: .5; cursor: not-allowed; }

/* ======= 中部内容卡片（可点击） ======= */
.card-body {
  flex: 1;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,.04);
  cursor: pointer;
  transition: box-shadow .15s ease, border-color .15s ease, transform .1s ease;
}
.card-body:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
  border-color: var(--c-border, #cbd5e1);
}
.title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  margin: 2px 0 6px;
  color: var(--c-text, #111);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.excerpt {
  font-size: 14px;
  line-height: 1.6;
  color: var(--c-text-light, #65758b);
  display: -webkit-box;
  -webkit-line-clamp: 2;   /* 最多两行，超出省略 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}

/* ======= 暗色适配 ======= */
html[data-theme="dark"] .nav-btn,
html[data-theme="dark"] .card-body {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}
html[data-theme="dark"] .excerpt {
  color: #b4bdc6;
}

/* ======= 空态样式 ======= */
.random-card.empty {
  width: 100%;
  margin: 16px 0 0;
  padding: 10px 12px;
  border: 1px dashed var(--c-border, #e5e7eb);
  border-radius: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--c-text, #111);
}
.retry {
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  color: var(--c-text, #111);
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}
</style>