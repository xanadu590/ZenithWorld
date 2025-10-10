<!-- .vuepress/components/RandomCard.vue -->
<template>
  <ClientOnly>
    <!-- 外层卡片区域：占满父容器宽度；ready 才渲染 -->
    <div class="random-card" v-if="ready">
      <!-- 左箭头：返回上一条（栈为空则禁用） -->
      <button
        class="nav-btn prev"
        :disabled="history.length === 0"
        @click="showPrev"
        aria-label="上一条推荐"
        title="上一条推荐"
      >
        ←
      </button>

      <!-- 中部：当前推荐卡片主体（整块可点击/回车） -->
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

      <!-- 右箭头：换下一条（候选为空则禁用） -->
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

    <!-- 空态：未取到任何候选时显示 -->
    <div class="random-card empty" v-else>
      <span>暂无推荐文章。</span>
      <button class="retry" @click="init" aria-label="重试">重试</button>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * 轻量随机文章卡片（页尾展示版）
 * 依赖 composable：useRandomPool（统一加载全站随机池 / 兜底扫描本页链接 / 处理 base）
 */
import { ref, onMounted } from 'vue'
import { useRandomPool } from '../composables/useRandomPool'

/** 从随机池拿到：加载函数、抽样函数、跳转链接解析（自动加 base） */
const { load, sample, resolveLink } = useRandomPool()

/** 组件内部状态 */
const ready = ref(false)                 // 是否准备就绪（有可展示的候选）
const candidates = ref<any[]>([])        // 预取的一小批候选（用来“下一条”快速切换）
const current = ref<any | null>(null)    // 当前显示的候选
const history = ref<any[]>([])           // 最近浏览栈（先进后出）
const maxHistory = 3                     // 回退栈最大长度（保持你的默认）

/** 初始化：加载全站随机池 → 预取 20 条 → 选 1 条显示 */
async function init() {
  ready.value = false
  current.value = null
  candidates.value = []
  history.value = []

  // 1) 加载全站随机池（内部会自动解析 base / 去掉当前页等）
  await load()

  // 2) 预取一小批候选，方便“下一条”瞬时切换（数量可按需调整）
  candidates.value = sample(20)

  // 3) 有候选则取随机 1 条作为当前项
  if (candidates.value.length > 0) {
    current.value = pickRandom(candidates.value)
    ready.value = true
  } else {
    ready.value = false
  }
}

/** 下一条：
 * - 当前项推入 history（保留最近 3 条）
 * - 从候选里再随机取 1 条；若与刚刚那条重复则再取一次
 * - 若候选本身只有 1 条，按钮点击没有意义，直接返回（避免“看似无反应”）
 */
function showNext() {
  if (!current.value) return
  if (candidates.value.length <= 1) return

  // 入栈并控制长度
  history.value.unshift(current.value)
  if (history.value.length > maxHistory) history.value.pop()

  // 取下一条，尽量避免与上一条重复
  let next = pickRandom(candidates.value)
  if (history.value[0] && next.href === history.value[0].href) {
    next = pickRandom(candidates.value)
  }
  // 再兜底一次：避免命中历史中的其他项
  if (history.value.some(h => h.href === next.href)) {
    next = pickRandom(candidates.value)
  }

  current.value = next
}

/** 上一条：从历史栈弹出一项覆盖当前项 */
function showPrev() {
  if (!history.value.length) return
  current.value = history.value.shift()!
}

/** 跳转当前项：用 resolveLink 自动拼上 base（避免不同部署前缀导致 404） */
function goCurrent() {
  if (!current.value) return
  window.location.assign(resolveLink(current.value.href))
}

/** 小工具：从数组中随机取 1 个元素 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 小工具：当没有 excerpt 时，用标题或路径名生成一个简短摘要 */
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
/* ====== 外层容器：占满宽度，跟邻近内容留出 16px 间距 ====== */
.random-card {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin: 16px 0 0;
}

/* ====== 左右箭头（上一条/下一条） ====== */
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

/* ====== 中部推荐卡片（整块可点/可回车） ====== */
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

/* 标题：单行省略 */
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

/* 摘要：最多展示两行，超出省略 */
.excerpt {
  font-size: 14px;
  line-height: 1.6;
  color: var(--c-text-light, #65758b);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 3;
}

/* ====== 空态（未拿到候选） ====== */
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