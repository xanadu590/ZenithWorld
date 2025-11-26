<!-- docs/.vuepress/layouts/TeamLineupLayout.vue -->
<template>
  <div class="team-layout">
    <main class="team-main">
      <!-- 只有角色横排阵容 -->
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
          <!-- 背景竖条 -->
          <div class="slot-bg"></div>

          <!-- 立绘 -->
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

          <!-- 简介卡片 -->
          <transition name="fade">
            <aside
              v-if="hoveredIndex === index"
              class="character-info"
              :class="infoPositionClasses(index)"
              @click.stop
            >
              <h2 class="info-name">{{ ch.name }}</h2>
              <p class="info-role" v-if="ch.role">{{ ch.role }}</p >
              <p class="info-intro" v-if="ch.intro">{{ ch.intro }}</p >
            </aside>
          </transition>
        </div>
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
  [key: string]: unknown
  teamName?: string
  teamSubtitle?: string
  characters?: CharacterItem[]
}

const frontmatter = usePageFrontmatter<TeamFrontmatter>()
const hoveredIndex = ref<number | null>(null)

const teamName = computed(() => frontmatter.value.teamName || '')
const teamSubtitle = computed(() => frontmatter.value.teamSubtitle || '')
const characters = computed(() => frontmatter.value.characters || [])

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
  if (region === 'right') return 'info-left'
  return 'info-right'
}

const handleClick = (ch: CharacterItem) => {
  if (ch.link) window.location.href = ch.link
}
</script>

<style scoped>
/* 整体布局：上下左右都贴边 */
.team-layout {
  min-height: 100vh;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.06), transparent 60%),
    linear-gradient(135deg, #0b0c10, #161925);
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.team-main {
  flex: 1;
}

/* 阵容：横向铺满屏幕，列之间无间隙 */
.team-lineup {
  width: 100%;
  height: 100vh;              /* 整个阵容区域占满可视高度 */
  padding: 0;
  box-sizing: border-box;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  gap: 0;                     /* 列与列之间无间隙 */
  margin: 0;
  position: relative;
}

/* 每个角色槽位：宽度自适应，满高 */
.character-slot {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  cursor: pointer;
  transition: transform 0.25s ease, filter 0.25s ease;
  overflow: hidden;           /* 默认裁剪立绘超出部分 */
  z-index: 0;                 /* 默认层级 */
}

/* hover：轻微上浮 & 展开（允许溢出） */
.character-slot.slot-hovered {
  transform: translateY(-8px);
  filter: brightness(1.08);
  overflow: visible;          /* 悬停时放大可以溢出格子 */
  z-index: 100;               /* 整列抬到最上层 */
}

/* 背景竖条：无圆角 */
.slot-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.10),
    rgba(255, 255, 255, 0.02)
  );
  border-radius: 0;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 1;                 /* 槽位内第一层 */
}

/* 立绘容器：占满整个格子 */
.character-figure {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;        /* 如果想脚踩地，可以改 flex-end */
  justify-content: center;
  transition: transform 0.25s ease, filter 0.25s ease;
  z-index: 2;                 /* 在背景上面 */
}

/* 悬停时：增加阴影 */
.character-figure.is-hovered {
  filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.95));
}

/* 立绘图片：默认 cover 铺满格子，多余裁剪 */
.character-image {
  width: 100%;
  height: 100%;
  object-fit: cover;          /* 默认：填满竖条，超出裁剪 */
  pointer-events: none;
  transition: transform 0.25s ease, width 0.25s ease, height 0.25s ease;
}

/* 悬停时：展示整张图（contain），略微放大弹出 */
.character-figure.is-hovered .character-image {
  width: auto;
  height: auto;
  max-height: 90vh;           /* 确保整张图在屏幕内完整显示 */
  max-width: 110vw;           /* 允许横向稍微溢出 */
  object-fit: contain;        /* 展示整张图片 */
  transform: scale(1.05);     /* 稍微放大，产生“弹出”感觉 */
}

/* 无图占位：无圆角 */
.character-image.placeholder {
  border-radius: 0;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  padding: 1rem;
  font-size: 0.9rem;
  opacity: 0.7;
}

/* 简介卡片：无圆角，左右浮出 */
.character-info {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;                 /* 在本列背景 & 图片之上 */
  max-width: 260px;
  padding: 0.9rem 1rem;
  background: rgba(15, 16, 25, 0.96);
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.7);
}

/* 右侧 */
.character-info.info-right {
  left: 100%;
  margin-left: 1rem;
}

/* 左侧 */
.character-info.info-left {
  right: 100%;
  margin-right: 1rem;
  text-align: right;
}

/* 简介文字 */
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

/* 出现/消失动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* 移动端：改成竖排，不再占满一整屏高度 */
@media (max-width: 768px) {
  .team-lineup {
    flex-direction: column;
    align-items: center;
    height: auto;
  }

  .character-slot {
    width: 85%;
    max-width: 360px;
    height: 380px;
  }

  .character-slot.slot-hovered {
    transform: translateY(-4px);
  }

  .character-figure.is-hovered .character-image {
    max-height: 100%;
    max-width: 100%;
    transform: scale(1.02);
  }

  .character-info {
    position: static;
    transform: none;
    margin-top: 0.75rem;
    max-width: none;
  }

  /* 简介卡片：更宽，更像信息面板 */
  .character-info {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 3;

    width: 400px;                   /* 原本是 max-width:260 → 改为 400px */
    padding: 1.2rem 1.5rem;         /* 更宽后 padding 也跟着优化 */

    background: rgba(15, 16, 25, 0.96);
    border-radius: 0;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.75);

    color: #f0f0f0;
    line-height: 1.6;
    font-size: 1rem;
  }
  

  .character-info.info-left,
  .character-info.info-right {
    text-align: left;
    margin: 0.75rem 0 0;
  }
}
</style>