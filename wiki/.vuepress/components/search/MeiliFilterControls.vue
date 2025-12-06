<template>
  <div>
    <!-- 搜索输入框 + 已选标签都在同一圆角框里 -->
    <div class="mfs-bar">
      <div class="mfs-input-wrapper">
        <!-- 已选标签：显示在搜索框里，点击取消 -->
        <div
          v-for="tag in selectedTags"
          :key="tag"
          class="tag-card"
          @click="$emit('toggle-tag', tag)"
        >
          <span class="tag-box">
            {{ tag }}
            <span class="tag-circle"></span>
          </span>
        </div>

        <!-- 关键字输入 -->
        <input
          :value="keyword"
          class="mfs-input"
          type="search"
          placeholder="搜索角色 / 概念 / 势力 / 地理 / 历史……"
          @input="$emit('update:keyword', ($event.target as HTMLInputElement).value)"
          @keyup.enter="$emit('search')"
        />
      </div>

      <!-- 一键重置筛选条件 -->
      <button
        v-if="hasAnyFilter"
        class="mfs-reset-btn"
        @click="$emit('reset-filters')"
      >
        重置
      </button>

      <button class="mfs-btn" @click="$emit('search')">搜索</button>
    </div>

    <!-- 分类筛选按钮 -->
    <div class="mfs-filters">
      <span class="mfs-filters-label">分类：</span>
      <button
        v-for="opt in typeOptions"
        :key="String(opt.value)"
        class="mfs-filter-btn"
        :class="{ 'is-active': activeType === opt.value }"
        @click="$emit('set-type', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 标签筛选区域：只显示“未选中”的标签 -->
    <div class="mfs-tags" v-if="availableTags.length">
      <span class="mfs-tags-label">标签：</span>

      <button
        v-for="tag in visibleTags"
        :key="tag"
        class="mfs-tag-btn"
        :class="{ 'is-active': selectedTags.includes(tag) }"
        @click="$emit('toggle-tag', tag)"
      >
        <span class="tag-box">
          {{ tag }}
          <span class="tag-circle"></span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  keyword: string;
  selectedTags: string[];
  typeOptions: { value: string | null; label: string }[];
  activeType: string | null;
  availableTags: string[];
  visibleTags: string[];
  hasAnyFilter: boolean;
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "search"): void;
  (e: "toggle-tag", tag: string): void;
  (e: "set-type", value: string | null): void;
  (e: "reset-filters"): void;
}>();
</script>

<style scoped>
/* 搜索框 + 选中标签在同一圆角框里 */
.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* 外层圆角框 + 上方标签滚动 */
.mfs-input-wrapper {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;

  max-height: 4.5rem;    /* 允许两三行标签 */
  overflow-y: auto;      /* 超出时出现竖向滚动条 */
}

/* 真正的输入框 */
.mfs-input {
  flex: 1;
  min-width: 6rem;
  padding: 0.25rem 0.2rem;
  border: none;
  outline: none;
  font-size: 0.95rem;
}

/* 搜索按钮 */
.mfs-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
}

/* 重置按钮 */
.mfs-reset-btn {
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  color: #4b5563;
}

/* 分类按钮行 */
.mfs-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.mfs-filters-label {
  font-weight: 600;
}

.mfs-filter-btn {
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}

.mfs-filter-btn.is-active {
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
  border-color: transparent;
}

/* 标签区：最多三行，超出滚动 */
.mfs-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.4rem;
  margin-bottom: 0.75rem;

  max-height: calc(1.8rem * 3);
  overflow-y: auto;
  padding-right: 0.3rem;
}

.mfs-tags-label {
  font-weight: 600;
  margin-right: 0.25rem;
}

/* 统一：按钮 & 选中卡片的外层容器 */
.mfs-tag-btn,
.tag-card {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  font-size: 0.9rem;
  --tag-dot-size: 0.33em;
}

/* 标签矩形 */
.tag-box {
  position: relative;
  padding: 0.2em 0.9em 0.2em 0.4em;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1em;
  color: #374151;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

/* 右上角小圆点 */
.tag-circle {
  width: var(--tag-dot-size);
  height: var(--tag-dot-size);
  background: #ffffff;
  border: 0.5px solid #9ca3af;
  border-radius: 50%;
  position: absolute;
  right: 0.2em;
  top: 0.25em;
}

/* 选中状态：上方卡片 + 下方按钮统一样式 */
.mfs-tag-btn.is-active .tag-box,
.tag-card .tag-box {
  font-size: 1.1em;
  background: #6366f1;
  color: #ffffff;
  border-color: #6366f1;
}

.mfs-tag-btn.is-active .tag-circle,
.tag-card .tag-circle {
  background: #ffffff;
  border-color: #ffffff;
}
</style>