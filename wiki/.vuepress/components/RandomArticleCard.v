<template>
  <ClientOnly>
    <div class="random-card" v-if="ready">
      <button
        class="nav-btn prev"
        :disabled="history.length === 0"
        @click="showPrev"
        aria-label="上一条推荐"
        title="上一条推荐"
      >
        ←
      </button>

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
          {{ current?.excerpt || simpleExcerpt(current) }}
        </div>
      </div>

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

    <div class="random-card empty" v-else>
      <span>暂无推荐文章。</span>
      <button class="retry" @click="init">重试</button>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { withBase } from '@vuepress/client'

type Candidate = {
  href: string
  title?: string
  excerpt?: string
}

const props = withDefaults(defineProps<{
  maxHistory?: number
}>(), {
  maxHistory: 3,
})

const ready = ref(false)
const candidates = ref<Candidate[]>([])
const current = ref<Candidate | null>(null)
const history = ref<Candidate[]>([])

onMounted(init)

/** 初始化：读取全站 random-index.json */
async function init() {
  ready.value = false
  candidates.value = []

  const url = withBase('data/random-index.json')
  try {
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) throw new Error('fetch fail')
    const json = await res.json()
    candidates.value = normalizeIndex(json)
  } catch (e) {
    console.warn('[RandomCard] 加载 random-index.json 失败', e)
    candidates.value = []
  }

  const curPath = location.pathname
  candidates.value = candidates.value.filter(c => normalize(c.href) !== normalize(curPath))

  if (candidates.value.length > 0) {
    current.value = pickRandom(candidates.value)
    ready.value = true
  } else {
    ready.value = false
  }
}

/** 解析 random-index.json */
function normalizeIndex(json: any): Candidate[] {
  if (!json) return []
  if (Array.isArray(json.pages)) {
    return json.pages.map((i: any) => ({
      href: ensureLeadingSlash(i.path || i.link),
      title: i.title,
      excerpt: i.excerpt,
    }))
  }
  if (Array.isArray(json)) {
    return json.map((i: any) => ({
      href: ensureLeadingSlash(i.path || i.link),
      title: i.title,
      excerpt: i.excerpt,
    }))
  }
  return []
}

function showNext() {
  if (!current.value || candidates.value.length === 0) return
  history.value.unshift(current.value)
  if (history.value.length > props.maxHistory) history.value.pop()

  let next = pickRandom(candidates.value)
  if (history.value[0] && normalize(next.href) === normalize(history.value[0].href)) {
    next = pickRandom(candidates.value)
  }
  current.value = next
}

function showPrev() {
  if (history.value.length === 0) return
  current.value = history.value.shift()!
}

function goCurrent() {
  if (!current.value) return
  window.location.assign(withBase(stripBase(current.value.href)))
}

/* 工具函数 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function normalize(href: string): string {
  try { return new URL(href, location.href).pathname } catch { return href }
}
function ensureLeadingSlash(p: string) { return p.startsWith('/') ? p : `/${p}` }
function stripBase(p: string): string {
  const base = withBase('/').replace(location.origin, '')
  return p.startsWith(base) ? p.slice(base.length - 1) : p
}
function simpleExcerpt(c?: Candidate | null): string {
  if (!c) return ''
  if (c.excerpt && c.excerpt.trim()) return c.excerpt.trim()
  if (c.title && c.title.trim() && c.title.trim() !== c.href) return c.title.trim()
  const m = c.href.match(/\/([^\/]+)\.html$/)
  return m ? decodeURIComponent(m[1]) : c.href
}
</script>

<style scoped>
.random-card {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin: 16px 0 0;
}
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
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}
html[data-theme="dark"] .nav-btn,
html[data-theme="dark"] .card-body {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}
html[data-theme="dark"] .excerpt {
  color: #b4bdc6;
}
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