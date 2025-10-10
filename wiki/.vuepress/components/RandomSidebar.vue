<!-- wiki/.vuepress/components/RandomSidebar.vue -->
<template>
  <ClientOnly>
    <!-- 有数据时渲染推荐列表 -->
    <aside
      class="random-sidebar"
      :class="{ sticky }"
      v-if="ready && items.length"
      role="complementary"
      aria-label="随机文章推荐"
    >
      <div class="sb-title">随机推荐</div>

      <ul class="sb-list">
        <!-- 遍历推荐条目 -->
        <li
          v-for="it in items"
          :key="it.href"
          class="sb-item"
          @click="go(it)"
          @keydown.enter.prevent="go(it)"
          role="link"
          tabindex="0"
          :title="it.title || it.href"
        >
          <div class="sb-item-title">
            {{ it.title || nameFromPath(it.href) }}
          </div>
          <div class="sb-item-excerpt">
            {{ it.excerpt || brief(it) }}
          </div>
        </li>
      </ul>

      <!-- 换一批按钮 -->
      <button
        class="sb-refresh"
        @click="refresh"
        aria-label="换一批"
        title="换一批"
      >
        换一批
      </button>
    </aside>

    <!-- 空态（首次加载失败或无推荐） -->
    <aside v-else class="random-sidebar empty" :class="{ sticky }">
      <div class="sb-title">随机推荐</div>
      <div class="sb-empty">
        暂无推荐
        <button class="sb-refresh" @click="refresh">重试</button>
      </div>
    </aside>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * 右侧“随机推荐”组件
 * - 从 useRandomPool 获取随机池数据
 * - 展示 N 条随机推荐
 * - 可点击“换一批”刷新
 * - 自动排除当前页
 */
import { ref, onMounted } from 'vue'
import { useRandomPool, type RandomItem } from '../composables/useRandomPool'

/** 可传入参数：条数 count、是否吸顶 sticky */
const props = withDefaults(
  defineProps<{
    /** 展示条数 */
    count?: number
    /** 是否吸顶（跟随滚动固定在视口顶部） */
    sticky?: boolean
  }>(),
  {
    count: 6,
    sticky: true,
  },
)

/** 组件内部状态 */
const ready = ref(false)               // 是否已加载完成
const items = ref<RandomItem[]>([])    // 当前展示的随机推荐列表

/** 从随机池中取方法 */
const { load, sample, resolveLink } = useRandomPool()

/**
 * 刷新推荐列表：
 * - 首次调用时会加载 random-index.json；
 * - 后续调用仅重新抽样，不重复加载。
 */
const refresh = async () => {
  if (!ready.value) {
    await load()
    ready.value = true
  }
  // 每次随机抽样 count 条（至少 1 条）
  items.value = sample(Math.max(1, props.count))
}

/**
 * 跳转函数：
 * - 使用 resolveLink() 自动添加 base；
 * - 确保在不同 base 下（如 / 或 /ZenithWorld/）都能正确跳转。
 */
const go = (it: RandomItem) => {
  window.location.assign(resolveLink(it.href))
}

/** 根据路径提取文件名（无标题时兜底用） */
function nameFromPath(p: string) {
  const m = p.match(/\/([^/]+)\.html$/)
  return m ? decodeURIComponent(m[1]) : p
}

/** 生成摘要文本（优先 excerpt → title → 路径名） */
function brief(i: RandomItem) {
  if (i.excerpt && i.excerpt.trim()) return i.excerpt.trim()
  if (i.title && i.title.trim()) return i.title.trim()
  return nameFromPath(i.href)
}

/** 组件挂载后立即加载并刷新 */
onMounted(refresh)
</script>

<style scoped>
/* ========= 外观与布局 ========= */

/* 右侧推荐栏主体 */
.random-sidebar {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 12px;
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

/* 吸顶模式：常用于右侧固定推荐栏 */
.random-sidebar.sticky {
  position: sticky;
  top: 84px; /* 按你的导航栏高度微调 */
}

/* 标题 */
.sb-title {
  font-weight: 700;
  margin-bottom: 8px;
  font-size: 16px;
  color: var(--c-text, #111);
}

/* 列表 */
.sb-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

/* 每条推荐 */
.sb-item {
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
}
.sb-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  border-color: var(--c-border, #cbd5e1);
}

/* 推荐标题 */
.sb-item-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--c-text, #111);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

/* 推荐摘要 */
.sb-item-excerpt {
  font-size: 13px;
  line-height: 1.55;
  color: var(--c-text-light, #65758b);
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 最多两行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}

/* 刷新按钮 */
.sb-refresh {
  width: 100%;
  margin-top: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  color: var(--c-text, #111);
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}

/* ========= 暗色模式 ========= */
html[data-theme='dark'] .random-sidebar,
html[data-theme='dark'] .sb-item,
html[data-theme='dark'] .sb-refresh {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}
html[data-theme='dark'] .sb-item-excerpt {
  color: #b4bdc6;
}

/* ========= 小屏隐藏（按需调整） ========= */
@media (max-width: 1024px) {
  .random-sidebar {
    display: none;
  }
}

/* ========= 空态样式 ========= */
.random-sidebar.empty .sb-empty {
  font-size: 13px;
  color: var(--c-text-light, #65758b);
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>