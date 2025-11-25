<template>
  <!-- 下拉菜单中的一项 -->
  <button class="menu-item" @click.stop="handleOpen">
    🔥 热门文章
  </button>

  <!-- 弹窗，用 teleport 挂到 body 下，避免被导航栏布局影响 -->
  <teleport to="body">
    <div
      v-if="open"
      class="hot-modal-mask"
      @click.self="close"
    >
      <div class="hot-modal">
        <header class="hot-modal-header">
          <span class="hot-modal-title">🔥 热门文章</span>
          <button class="hot-modal-close" @click="close">✕</button>
        </header>

        <div class="hot-modal-body">
          <!-- 加一点加载 / 错误状态 -->
          <p v-if="loading">加载中……</p >
          <p v-else-if="error" class="hot-error">
            加载失败，请稍后重试
          </p >

          <ul v-else-if="items.length" class="hot-list">
            <li v-for="item in items" :key="item.path" class="hot-item">
              <a :href="item.path" class="hot-link">
                <span class="hot-title">{{ item.title }}</span>
                <span class="hot-pv">{{ item.pv }} 次访问</span>
              </a >
            </li>
          </ul>

          <p v-else>暂无热门文章数据</p >
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface PopularItem {
  path: string
  title: string
  pv: number
}

const API_BASE = 'https://comment.zenithworld.top'

const open = ref(false)
const items = ref<PopularItem[]>([])
const loading = ref(false)
const error = ref(false)

const fetchPopular = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await fetch(`${API_BASE}/api/popular?days=7&limit=10`)
    const data = await res.json()
    if (data.ok && Array.isArray(data.items)) {
      items.value = data.items
    } else {
      error.value = true
    }
  } catch (e) {
    console.error('加载热门文章失败', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

const handleOpen = () => {
  open.value = true
  // 每次打开都刷新一次数据（你要是觉得频繁，可以加个“只在第一次打开加载”的判断）
  fetchPopular()
}

const close = () => {
  open.value = false
}
</script>

<style scoped>
/* 遮罩层 */
.hot-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 弹窗主体 */
.hot-modal {
  width: min(640px, 100% - 32px);
  max-height: min(520px, 100% - 64px);
  background: var(--vp-c-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--c-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.hot-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--c-border, #e5e7eb);
}

.hot-modal-title {
  font-weight: 600;
  font-size: 14px;
}

.hot-modal-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 4px;
}

/* 内容区域 */
.hot-modal-body {
  padding: 8px 14px 12px;
  overflow: auto;
}

.hot-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.hot-item + .hot-item {
  margin-top: 4px;
}

.hot-link {
  display: flex;
  justify-content: space-between;
  text-decoration: none;
  font-size: 0.9rem;
}

.hot-title {
  flex: 1;
  margin-right: 0.5rem;
}

.hot-pv {
  opacity: 0.7;
  white-space: nowrap;
  font-size: 0.8rem;
}

.hot-error {
  color: #dc2626;
  font-size: 0.85rem;
}

/* 暗色模式适配 */
html[data-theme='dark'] .hot-modal {
  background: #1f1f1f;
  border-color: #333;
}
</style>