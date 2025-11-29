<template>
  <button class="menu-item" @click.stop="open = true">
    🔥 热门文章
  </button>

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
          <!-- ⭐ 直接使用 HotPages 组件来显示列表 ⭐ -->
          <HotPages
            :title="undefined"
            :limit="10"
            :src="currentSrc"
            :showDate="false"
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

// 自动切换 API
const currentSrc = computed(() =>
  mode.value === "7"
    ? "/data/recommended-pages.json"         // 近 7天（你可以自定义）
    : "/data/recommended-pages-all.json"     // 历史最热（你可以自定义）
);

const close = () => (open.value = false);
</script>