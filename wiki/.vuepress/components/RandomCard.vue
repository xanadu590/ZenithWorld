<!-- .vuepress/components/RandomCard.vue -->
<template>
  <ClientOnly>
    <div class="random-card" v-if="ready">
      <button class="nav-btn prev" :disabled="history.length===0" @click="showPrev">←</button>

      <!-- 卡片主体 -->
      <div class="card-body" @click="goCurrent" role="link" tabindex="0">
        <div class="title">{{ current?.title || current?.href }}</div>
        <div class="excerpt">{{ current?.excerpt || simpleExcerpt(current) }}</div>
      </div>

      <button class="nav-btn next" :disabled="candidates.length===0" @click="showNext">→</button>
    </div>

    <div class="random-card empty" v-else>
      <span>暂无推荐文章。</span>
      <button class="retry" @click="init">重试</button>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRandomPool } from '../composables/useRandomPool'

const { load, sample, resolveLink } = useRandomPool()

const ready = ref(false)
const candidates = ref<any[]>([])
const current = ref<any|null>(null)
const history = ref<any[]>([])
const maxHistory = 3

async function init() {
  ready.value = false
  await load()
  candidates.value = sample(20) // 随机预取 20 条
  if (candidates.value.length) {
    current.value = pickRandom(candidates.value)
    ready.value = true
  }
}

function showNext() {
  if (!current.value) return
  history.value.unshift(current.value)
  if (history.value.length > maxHistory) history.value.pop()
  let next = pickRandom(candidates.value)
  if (history.value[0] && next.href === history.value[0].href) {
    next = pickRandom(candidates.value)
  }
  if (history.value.some(h => h.href === next.href)) next = pickRandom(candidates.value)
  current.value = next
}

function showPrev() {
  if (!history.value.length) return
  current.value = history.value.shift()!
}

function goCurrent() {
  if (!current.value) return
  window.location.assign(resolveLink(current.value.href))
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function simpleExcerpt(c?: any): string {
  if (!c) return ''
  if (c.excerpt && c.excerpt.trim()) return c.excerpt.trim()
  if (c.title && c.title.trim() && c.title.trim() !== c.href) return c.title.trim()
  const m = c.href.match(/\/([^\/]+)\.html$/)
  return m ? decodeURIComponent(m[1]) : c.href
}

onMounted(init)
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
.random-card.empty {
  width: 100%;
  margin: 16px 0 0;
  padding: 10px 12px;
  border: 1px dashed var(--c-border, #e5e7eb);
  border-radius: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}
.retry {
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

</style>