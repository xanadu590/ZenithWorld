<!-- docs/.vuepress/components/search/TagPager.vue -->
<template>
  <!-- 标签区域：一行 + 左右翻页箭头 + 页码 -->
  <div class="mfs-tags" v-if="availableTags.length">
    <span class="mfs-tags-label">标签：</span>

    <!-- 左侧上一页箭头 -->
    <button
      class="mfs-tags-nav"
      :disabled="!hasPrevPage"
      @click="prevPage"
      title="上一组标签"
    >
      ▲
    </button>

    <!-- 中间这一页的标签（一行） -->
    <div class="mfs-tags-row" ref="tagsRowRef">
      <button
        v-for="tag in currentPageTags"
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

    <!-- 页码显示：第 x / y 页 -->
    <span class="mfs-tags-pageinfo">
      {{ currentPageNumber }} / {{ totalPages }}
    </span>

    <!-- 右侧下一页箭头 -->
    <button
      class="mfs-tags-nav"
      :disabled="!hasNextPage"
      @click="nextPage"
      title="下一组标签"
    >
      ▼
    </button>
  </div>

  <!-- 隐藏的测量容器：用来计算分页（不显示在页面上） -->
  <div ref="measureRowRef" class="mfs-tags-measure">
    <button
      v-for="tag in visibleTags"
      :key="tag"
      class="mfs-tag-measure"
    >
      <span class="tag-box">
        {{ tag }}
        <span class="tag-circle"></span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";

const props = defineProps<{
  availableTags: string[];
  visibleTags: string[];
  selectedTags: string[];
}>();

const emit = defineEmits<{
  (e: "toggle-tag", tag: string): void;
}>();

/** 实际显示标签的一行容器 */
const tagsRowRef = ref<HTMLElement | null>(null);
/** 隐藏的测量容器：里面渲染所有 visibleTags，用来计算宽度 */
const measureRowRef = ref<HTMLElement | null>(null);

/** 分好页的标签数组，例如 [ ['A','B'], ['C','D','E'], ... ] */
const pages = ref<string[][]>([]);
/** 当前页索引 */
const pageIndex = ref(0);

/** 当前这一页的标签 */
const currentPageTags = computed(() => {
  return pages.value[pageIndex.value] || [];
});

/** 页数 / 当前页（用于显示“第 x / y 页”） */
const totalPages = computed(() => (pages.value.length ? pages.value.length : 1));
const currentPageNumber = computed(() =>
  pages.value.length ? pageIndex.value + 1 : 1
);

/** 是否有上一页 / 下一页 */
const hasPrevPage = computed(() => pageIndex.value > 0);
const hasNextPage = computed(
  () => pageIndex.value < pages.value.length - 1
);

function prevPage() {
  if (hasPrevPage.value) pageIndex.value -= 1;
}

function nextPage() {
  if (hasNextPage.value) pageIndex.value += 1;
}

/**
 * 重新根据容器宽度 + 每个标签的宽度来划分页：
 * - 不截断标签
 * - 让每页刚好塞满一行（最后一页可能比较短）
 */
async function rebuildPages() {
  await nextTick();

  const row = tagsRowRef.value;
  const measure = measureRowRef.value;
  if (!row || !measure) {
    pages.value = [props.visibleTags.slice()];
    pageIndex.value = 0;
    return;
  }

  const maxWidth = row.clientWidth || row.offsetWidth;
  if (!maxWidth) {
    pages.value = [props.visibleTags.slice()];
    pageIndex.value = 0;
    return;
  }

  const children = Array.from(measure.children) as HTMLElement[];

  const result: string[][] = [];
  let current: string[] = [];
  let currentWidth = 0;

  const GAP = 8; // 标签间距（px），要和 .mfs-tags-row 的 gap 接近

  children.forEach((el, idx) => {
    const tag = props.visibleTags[idx];
    if (!tag) return;

    const w = el.offsetWidth;
    if (!w) return;

    const extra = current.length ? GAP : 0;

    if (current.length && currentWidth + extra + w > maxWidth) {
      result.push(current);
      current = [tag];
      currentWidth = w;
    } else {
      current.push(tag);
      currentWidth += extra + w;
    }
  });

  if (current.length) result.push(current);
  if (!result.length) result.push([]);

  pages.value = result;
  if (pageIndex.value >= result.length) {
    pageIndex.value = result.length - 1;
  }
}

/** 当可见标签集合变化时，重置到第一页并重新分页 */
watch(
  () => props.visibleTags,
  () => {
    pageIndex.value = 0;
    rebuildPages();
  },
  { deep: true }
);

function handleResize() {
  rebuildPages();
}

onMounted(() => {
  rebuildPages();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
/* 标签区域：一行 + 左右翻页箭头 + 页码 */
.mfs-tags {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.mfs-tags-label {
  font-weight: 600;
}

/* 左右箭头按钮 */
.mfs-tags-nav {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.mfs-tags-nav:disabled {
  opacity: 0.35;
  cursor: default;
}

/* 中间这一行的标签容器 */
.mfs-tags-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  overflow: hidden; /* 一行展示，真正的分页靠 JS 控制 */
}

/* 页码文字 */
.mfs-tags-pageinfo {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
}

/* 标签按钮 + 测量标签样式 */
.mfs-tag-btn,
.mfs-tag-measure {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  --tag-dot-size: 0.33em;
  flex-shrink: 0;
}

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

/* 高亮：已选标签 */
.mfs-tag-btn.is-active .tag-box {
  font-size: 1.1em;
  background: #6366f1;
  color: #ffffff;
  border-color: #6366f1;
}

.mfs-tag-btn.is-active .tag-circle {
  background: #ffffff;
  border-color: #ffffff;
}

/* 隐藏的测量容器：不占布局，只用于计算宽度 */
.mfs-tags-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
}
</style>