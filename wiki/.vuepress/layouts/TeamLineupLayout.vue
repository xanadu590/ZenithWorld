<!-- docs/.vuepress/layouts/TeamLineupLayout.vue -->
<template>
  <div class="team-layout">
    <!-- 顶部标题区域（可选，有就显示） -->
    <header class="team-header" v-if="teamName || teamSubtitle">
      <h1 class="team-title" v-if="teamName">{{ teamName }}</h1>
      <p class="team-subtitle" v-if="teamSubtitle">{{ teamSubtitle }}</p >
    </header>

    <!-- 角色横排阵容 -->
    <main class="team-main">
      <section class="team-lineup" v-if="characters && characters.length">
        <div
          v-for="(ch, index) in characters"
          :key="ch.id || ch.name || index"
          class="character-slot"
          :class="slotClasses(index)"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
          @click="handleClick(ch)"
        >
          <!-- 倾斜的槽位背景 -->
          <div class="slot-bg"></div>

          <!-- 立绘容器（稍微回正，不被 skew 拉变形） -->
          <div
            class="character-figure"
            :class="{ 'is-hovered': hoveredIndex === index }"
          >
            <img
              v-if="ch.image"
              class="character-image"
              :src="ch.image"
              :alt="ch.name || ''"
              loading="lazy"
            />
            <div v-else class="character-image placeholder">
              {{ ch.name || 'Unknown' }}
            </div>
          </div>

          <!-- 简介卡片：根据左右位置决定出现在左/右 -->
          <transition name="fade">
            <aside
              v-if="hoveredIndex === index"
              class="character-info"
              :class="infoPositionClasses(index)"
              @click.stop
            >
              <h2 class="info-name">
                {{ ch.name }}
              </h2>
              <p class="info-role" v-if="ch.role">
                {{ ch.role }}
              </p >
              <p class="info-intro" v-if="ch.intro">
                {{ ch.intro }}
              </p >
            </aside>
          </transition>
        </div>
      </section>

      <!-- 可选：下方继续渲染 Markdown 正文内容（如果你希望这个页面下还有文字说明） -->
      <section class="team-content">
        <Content />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePageFrontmatter } from '@vuepress/client'

interface CharacterItem {
  id?: string | number
  name: string
  image?: string
  role?: string
  intro?: string
  link?: string
}

interface TeamFrontmatter {
  [key: string]: unknown;

  teamName?: string
  teamSubtitle?: string
  characters?: CharacterItem[]
}

const frontmatter = usePageFrontmatter<TeamFrontmatter>()
const hoveredIndex = ref<number | null>(null)

const teamName = computed(() => frontmatter.value.teamName || '')
const teamSubtitle = computed(() => frontmatter.value.teamSubtitle || '')
const characters = computed(() => frontmatter.value.characters || [])

/**
 * 根据索引判断属于左、中、右区域：
 * - 左边区域：前 1/3
 * - 右边区域：后 1/3
 * - 中间区域：中间 1/3
 */
const regionOfIndex = (index: number) => {
  const total = characters.value.length || 1
  const leftThreshold = Math.floor(total / 3)
  const rightThreshold = Math.floor((total * 2) / 3)

  if (index < leftThreshold) return 'left'
  if (index >= rightThreshold) return 'right'
  return 'middle'
}

const slotClasses = (index: number) => {
  const region = regionOfIndex(index)
  return {
    'slot-left': region === 'left',
    'slot-middle': region === 'middle',
    'slot-right': region === 'right',
    'slot-hovered': hoveredIndex.value === index,
  }
}

const infoPositionClasses = (index: number) => {
  const region = regionOfIndex(index)
  // 中间也统一向右
  if (region === 'right') {
    return 'info-left'
  }
  return 'info-right'
}

const handleClick = (ch: CharacterItem) => {
  if (ch.link) {
    // 使用浏览器跳转，让 VuePress 处理路由
    window.location.href = ch.link
  }
}
</script>

<style scoped>
/* 整体布局 */
.team-layout {
  min-height: 100vh;
  padding: 3rem 1.5rem 2rem;
  box-sizing: border-box;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.06), transparent 60%),
    linear-gradient(135deg, #0b0c10, #161925);
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 顶部标题区域 */
.team-header {
  text-align: center;
  margin-bottom: 0.5rem;
}

.team-title {
  font-size: 2.2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.team-subtitle {
  margin-top: 0.5rem;
  opacity: 0.8;
}

/* 主区域 */
.team-main {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* 阵容区域 */
.team-lineup {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 0.25rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* 每个角色槽位：带轻微倾斜的竖条感 */
.character-slot {
  position: relative;
  flex: 1;
  min-width: 80px;
  max-width: 200px;
  height: 420px;
  cursor: pointer;
  /* 让整体有一点倾斜感 */
  transform: skewX(-6deg);
  transition: transform 0.25s ease, filter 0.25s ease;
}

/* hover 高亮 */
.character-slot.slot-hovered {
  filter: brightness(1.15);
  transform: skewX(-6deg) translateY(-8px);
}

/* 背景竖条，营造“列”的感觉但不死板 */
.slot-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.02)
  );
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
}

/* 立绘容器，反向 skew 回正图像 */
.character-figure {
  position: absolute;
  inset: 12px 8px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transform: skewX(6deg);
  transition: transform 0.25s ease, filter 0.25s ease;
  z-index: 1;
}

.character-figure.is-hovered {
  transform: skewX(6deg) scale(1.1) translateY(-12px);
  filter: drop-shadow(0 12px 26px rgba(0, 0, 0, 0.8));
}

/* 立绘图片 */
.character-image {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  pointer-events: none;
}

.character-image.placeholder {
  border-radius: 999px;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  padding: 1rem;
  font-size: 0.9rem;
  opacity: 0.7;
}

/* 简介卡片 */
.character-info {
  position: absolute;
  bottom: 40%;
  z-index: 3;
  max-width: 260px;
  padding: 0.9rem 1rem;
  background: rgba(15, 16, 25, 0.96);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.7);
}

/* 出现在右侧 */
.character-info.info-right {
  left: 100%;
  margin-left: 0.75rem;
}

/* 出现在左侧 */
.character-info.info-left {
  right: 100%;
  margin-right: 0.75rem;
  text-align: right;
}

/* 简介中的文字样式 */
.info-name {
  margin: 0 0 0.2rem;
  font-size: 1.1rem;
}

.info-role {
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

.info-intro {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.4;
  opacity: 0.9;
}

/* 渐隐动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* 下方 Markdown 内容区域 */
.team-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 0;
  background: rgba(5, 6, 12, 0.75);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* 移动端适配：改为纵向排列 + 不倾斜 */
@media (max-width: 768px) {
  .team-layout {
    padding: 1.5rem 1rem 2rem;
  }

  .team-lineup {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .character-slot {
    width: 80%;
    max-width: 320px;
    height: 380px;
    transform: none;
  }

  .character-slot.slot-hovered {
    transform: translateY(-4px);
  }

  .character-figure {
    transform: none;
  }

  .character-figure.is-hovered {
    transform: scale(1.06) translateY(-10px);
  }

  .character-info {
    position: static;
    margin-top: 0.5rem;
    max-width: none;
  }

  .character-info.info-left,
  .character-info.info-right {
    text-align: left;
    margin: 0.5rem 0 0;
  }
}
</style>