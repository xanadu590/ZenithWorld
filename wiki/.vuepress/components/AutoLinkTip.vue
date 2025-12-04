<template>
  <!-- 包一层 span 用来定位提示卡片 -->
  <span
    class="zw-auto-link-wrapper"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <!-- 内部真实链接：仍然使用之前的 zw-auto-link class，所以你的下划线动画不需要改 -->
    <component
      :is="isInner(to) ? 'RouterLink' : 'a'"
      class="zw-auto-link"
      :class="kindClass"
      :to="isInner(to) ? to : undefined"
      :href="!isInner(to) ? to : undefined"
      @click.stop
    >
      <slot>{{ term }}</slot>
    </component>

    <!-- 提示卡片：悬停时显示，可以塞图片 + 文本 -->
    <div
      v-if="hover && hasAnyContent"
      class="zw-auto-link-card"
      :class="kindClass"
    >
      <div class="card-inner">
        <img
          v-if="avatar"
          class="card-avatar"
          :src="imgUrl(avatar)"
          alt=""
          loading="lazy"
        />
        <div class="card-main">
          <h4 class="card-title">{{ term }}</h4>
          <p v-if="summary" class="card-summary">
            {{ summary }}
          </p >
          <!-- 以后你想加“类型 / 阶位 / 阵营”等信息，也可以塞这里 -->
        </div>
      </div>
    </div>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { withBase } from "@vuepress/client";

const props = defineProps<{
  term: string;
  to: string;
  kind?: string;     // "character" | "place" | "faction" ...
  avatar?: string;   // 头像图片路径
  summary?: string;  // 简短介绍
}>();

const hover = ref(false);

const isInner = (link?: string) => !!link && link.startsWith("/");

const kindClass = computed(() =>
  props.kind ? `zw-auto-link--${props.kind}` : ""
);

const hasAnyContent = computed(() => {
  return !!(props.avatar || props.summary || props.term);
});

function imgUrl(u?: string) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return u.startsWith("/") ? withBase(u) : withBase("/" + u);
}
</script>

<style scoped>
.zw-auto-link-wrapper {
  position: relative;
  display: inline-block;
}

/* 这里不写 .zw-auto-link，本来你在全局 CSS 里已经有下划线 + 颜色了 */

/* 提示卡片外壳 */
.zw-auto-link-card {
  position: absolute;
  left: calc(100% + 12px); /* 链接右侧展开 */
  top: 50%;
  transform: translateY(-50%);
  z-index: 9999;

  min-width: 260px;
  max-width: 380px;

  background: var(--vp-c-bg-soft, #fff);
  color: var(--vp-c-text, #222);
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
  padding: 10px 12px;

  font-size: 12px;
  line-height: 1.5;
}

/* 内部布局，参考 RoleCard：左图右文 */
.card-inner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.card-avatar {
  width: 56px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.card-main {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 700;
}

.card-summary {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
  word-wrap: break-word;
}

/* 暗色适配 */
html[data-theme="dark"] .zw-auto-link-card {
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--vp-c-text, #e5e5e5);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* 根据 kind 区分颜色（先占坑，后面你可以调色盘） */
.zw-auto-link-card.zw-auto-link--character {
  border-left: 3px solid #3b82f6;
}
.zw-auto-link-card.zw-auto-link--place {
  border-left: 3px solid #10b981;
}
.zw-auto-link-card.zw-auto-link--faction {
  border-left: 3px solid #f59e0b;
}
</style>