<template>
  <!-- 导航栏里的按钮 -->
  <button class="menu-item" @click.stop="open = true">
    🔥 热门文章
  </button>

  <!-- 弹窗挂到 body 下 -->
  <teleport to="body">
    <div v-if="open" class="hot-modal-mask" @click.self="close">
      <div class="hot-modal">
        <header class="hot-modal-header">
          <span class="hot-modal-title">
            🔥 热门文章 · {{ mode === '7' ? '近 7 天' : '历史最热' }}
          </span>

          <div class="hot-tabs">
            <button
              class="hot-tab"
              :class="{ 'is-active': mode === '7' }"
              @click="mode = '7'"
            >
              近 7 天
            </button>

            <button
              class="hot-tab"
              :class="{ 'is-active': mode === 'all' }"
              @click="mode = 'all'"
            >
              历史最热
            </button>

            <button class="hot-modal-close" @click="close">✕</button>
          </div>
        </header>

        <div class="hot-modal-body">
          <!-- ⭐ 交给 HotPages 渲染，按 days 用真实访问量 -->
          <HotPages
            :key="mode"         
            :title="undefined"
            :limit="10"
            :days="currentDays"
          />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import HotPages from "../../plugins/recommended-articles/HotPages.vue";

const open = ref(false);
const mode = ref<"7" | "all">("7");

// 根据模式选择统计天数：近 7 天 / 历史（约 100 年）
const currentDays = computed(() =>
  mode.value === "7" ? 7 : 36500
);

const close = () => {
  open.value = false;
};
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

/* Tab 区域 + 关闭按钮 */
.hot-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hot-tab {
  border: 1px solid transparent;
  background: transparent;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}

.hot-tab.is-active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.6);
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

/* 暗色模式适配 */
html[data-theme="dark"] .hot-modal {
  background: #1f1f1f;
  border-color: #333;
}
</style>