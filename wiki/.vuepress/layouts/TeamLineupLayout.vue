<!-- docs/.vuepress/layouts/TeamLineupLayout.vue -->
<template>
  <div class="team-layout">
    <main class="team-main">
      <section class="team-lineup" v-if="characters && characters.length">
        <!-- 遮罩：有 hover 时才出现，颜色/图片由 dimStyle 控制 -->
        <div
          v-if="hoveredIndex !== null && overlayType !== 'none'"
          class="team-dim"
          :style="dimStyle"
        ></div>

        <!-- 角色列 -->
        <div
          v-for="(ch, index) in characters"
          :key="ch.id || ch.name || index"
          class="character-slot"
          :class="slotClasses(index)"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
          @click="handleClick(ch)"
        >
          <!-- 竖条背景：现在只是淡淡分隔，不再彩虹 -->
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
              :style="imageStyle(ch, index)"
              loading="lazy"
            />
            <div v-else class="character-image placeholder">
              {{ ch.name || 'Unknown' }}
            </div>
          </div>

          <!-- 简介：纯文字，无背景框 -->
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

/** 单个角色配置：现在多了 hoverScale */
interface CharacterItem {
  id?: string | number
  name: string
  image?: string
  role?: string
  intro?: string
  link?: string

  /** 单个角色的缩放与位移微调 */
  scale?: number
  hoverscale?: number
  offsetX?: number
  offsetY?: number
}

type OverlayType = 'auto' | 'color' | 'image' | 'none'

interface TeamFrontmatter {
  [key: string]: unknown
  teamName?: string
  teamSubtitle?: string
  characters?: CharacterItem[]

  /** 遮罩类型: 'auto'(默认按光谱自动), 'color', 'image', 'none' */
  overlayType?: OverlayType
  /** 遮罩纯色 */
  overlayColor?: string
  /** 遮罩图片地址 */
  overlayImage?: string
  /** 遮罩整体透明度: 0~1 */
  overlayOpacity?: number

  /** 全局默认缩放与位移 */
  imageScale?: number
  imageOffsetX?: number
  imageOffsetY?: number
  /** 全局：悬停时在基础 scale 上再乘的倍数 */
  hoverScale?: number
}

const frontmatter = usePageFrontmatter<TeamFrontmatter>()
const hoveredIndex = ref<number | null>(null)

const characters = computed(() => frontmatter.value.characters || [])

/* ======= 全局图片缩放 & 偏移配置 ======= */
const globalScale = computed(() => frontmatter.value.imageScale ?? 1)
const globalOffsetX = computed(() => frontmatter.value.imageOffsetX ?? 0)
const globalOffsetY = computed(() => frontmatter.value.imageOffsetY ?? 0)
/** 全局悬停倍数，默认 1.6 */
const globalHoverFactor = computed(() => frontmatter.value.hoverScale ?? 1.6)

/**
 * 计算某一角色图片的 transform：
 * - 基础大小 baseScale：优先用 ch.scale，没有则用全局 imageScale，再没有就是 1
 * - 悬停倍数 hoverFactor：优先用 ch.hoverScale，没有则用全局 hoverScale，再没有就是 1.6
 * - 位移 offsetX / offsetY：优先角色，再用全局，默认为 0
 */
const imageStyle = (ch: CharacterItem, index: number): any => {
  const baseScale =
    typeof ch.scale === 'number' && !Number.isNaN(ch.scale)
      ? ch.scale
      : globalScale.value

  const hoverFactor =
    typeof ch.hoverscale === 'number' && !Number.isNaN(ch.hoverscale)
      ? ch.hoverscale
      : globalHoverFactor.value

  const baseX =
    typeof ch.offsetX === 'number' && !Number.isNaN(ch.offsetX)
      ? ch.offsetX
      : globalOffsetX.value

  const baseY =
    typeof ch.offsetY === 'number' && !Number.isNaN(ch.offsetY)
      ? ch.offsetY
      : globalOffsetY.value

  const isHover = hoveredIndex.value === index
  const finalScale = isHover ? baseScale * hoverFactor : baseScale

  return {
    transform: `translate(${baseX}px, ${baseY}px) scale(${finalScale})`,
    transformOrigin: 'center center',
    transition: 'transform 0.25s ease',
    position: 'relative',
    zIndex: isHover ? 20 : 1,
  }
}

/* ======= 遮罩配置 ======= */
const overlayType = computed<OverlayType>(() => {
  return (frontmatter.value.overlayType as OverlayType) || 'auto'
})
const overlayColor = computed(() => frontmatter.value.overlayColor || '')
const overlayImage = computed(() => frontmatter.value.overlayImage || '')
const overlayOpacity = computed(() => {
  const raw = frontmatter.value.overlayOpacity
  if (typeof raw === 'number') {
    if (raw < 0) return 0
    if (raw > 1) return 1
    return raw
  }
  // 默认透明度
  return 0.55
})

/** 左中右区域，用来决定简介是在左边还是右边 */
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

/**
 * 光谱颜色生成函数：
 * - 用于 overlayType === 'auto' 时，按 hover 的列索引生成遮罩颜色
 * - total 列就把 hue 从 0°~300° 等分 total 个点
 */
const spectrumMaskStyle = (index: number) => {
  const total = characters.value.length || 1
  const t = total === 1 ? 0.5 : index / (total - 1) // [0,1]
  const hue = 300 * t // 0°(红) → 300°(紫)
  const saturation = '80%'

  const alphaTop = 0.35
  const alphaBottom = 0.55
  const lightTop = '75%'
  const lightBottom = '60%'

  const top = `hsla(${hue}, ${saturation}, ${lightTop}, ${alphaTop})`
  const bottom = `hsla(${hue}, ${saturation}, ${lightBottom}, ${alphaBottom})`

  return {
    background: `linear-gradient(to bottom, ${top}, ${bottom})`,
  }
}

/**
 * 遮罩样式：
 * - overlayType = 'none'         → 不显示遮罩（上面 v-if 已拦截）
 * - overlayType = 'color'        → 使用 overlayColor + overlayOpacity
 * - overlayType = 'image'        → 使用 overlayImage + overlayOpacity
 * - overlayType = 'auto'(默认)   → 使用光谱颜色（跟悬停列一一对应）
 */
const dimStyle = computed(() => {
  const idx = hoveredIndex.value
  if (idx === null) return {}

  // 强制关闭遮罩
  if (overlayType.value === 'none') return {}

  // 纯色遮罩
  if (overlayType.value === 'color' && overlayColor.value) {
    return {
      background: overlayColor.value,
      opacity: overlayOpacity.value,
    }
  }

  // 图片遮罩
  if (overlayType.value === 'image' && overlayImage.value) {
    return {
      backgroundImage: `url(${overlayImage.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: overlayOpacity.value,
    }
  }

  // 默认：光谱遮罩
  return Object.assign(spectrumMaskStyle(idx), {
    opacity: 1, // 已经在 hsla 里带了 alpha，这里不再额外降
  })
})

const handleClick = (ch: CharacterItem) => {
  if (ch.link) window.location.href = ch.link
}
</script>

<style scoped>
/* ================== 基础布局（浅色为默认） ================== */

/* 浅色：白底 + 黑字 */
.team-layout {
  min-height: 100vh;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background: #ffffff;
  color: #111111;
  display: flex;
  flex-direction: column;
}

.team-main {
  flex: 1;
}

/* 横向满屏阵容 */
.team-lineup {
  width: 100%;
  height: 100vh;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  gap: 0;
  margin: 0;
  position: relative;
}

/* 遮罩：颜色或图片由 dimStyle 动态控制 */
.team-dim {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

/* ================== 竖条与立绘 ================== */

/* 角色列 */
.character-slot {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  cursor: pointer;
  transition: transform 0.25s ease, filter 0.25s ease;
  overflow: hidden;           /* 默认裁剪立绘超出部分 */
  z-index: 1;                 /* 在遮罩下方，hover 时抬上去 */
}

.character-slot.slot-hovered {
  transform: translateY(-8px);
  filter: brightness(1.05);
  overflow: visible;          /* 展开可以溢出竖条 */
  z-index: 10;                /* 高于遮罩 & 其他列 */
}

/* 背景竖条：现在只是细微分隔，不再彩虹 */
.slot-bg {
  position: absolute;
  inset: 0;
  border-radius: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.02),
    rgba(0, 0, 0, 0.06)
  );
}

/* 立绘容器 */
.character-figure {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;        /* 想脚踩地可以改 flex-end */
  justify-content: center;
  transition: transform 0.25s ease, filter 0.25s ease;
  z-index: 3;                 /* 在本列背景之上，并高于遮罩 */
}

.character-figure.is-hovered {
  filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.6));
}

/* ================== 立绘（裁剪，缩放交给 JS） ================== */

/* 默认：立绘填满竖条，多余裁剪；真正的缩放由内联 style 控制 */
.character-image {
  width: 100%;
  height: 100%;
  object-fit: cover;                 /* 保证不变形，多余部分裁掉 */
  pointer-events: none;
  transform-origin: center center;
  /* 不写 transform，这样不会覆盖 imageStyle 返回的值 */
}

/* 无图占位 */
.character-image.placeholder {
  border-radius: 0;
  border: 1px dashed rgba(0, 0, 0, 0.4);
  padding: 1rem;
  font-size: 0.9rem;
  opacity: 0.7;
}

/* ================== 简介：纯文字，无背景框 ================== */

.character-info {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 11;                /* 在本列立绘之上 */
  width: 400px;               /* 适中面板宽度 */
  padding: 0;

  color: inherit;             /* 跟随当前主题文字颜色 */

  /* 浅色模式下，文字压在图上，用浅色光晕提升可读性 */
  text-shadow:
    0 0 3px rgba(255, 255, 255, 0.7),
    0 0 6px rgba(255, 255, 255, 0.5);
}

/* 简介出现位置：右 / 左 */
.character-info.info-right {
  left: 100%;
  margin-left: 1.2rem;
}

.character-info.info-left {
  right: 100%;
  margin-right: 1.2rem;
  text-align: right;
}

/* 文字样式 */
.info-name {
  margin: 0 0 0.3rem;
  font-size: 2rem;       /* 字体大小 */
  font-weight: 700;
}

.info-role {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  opacity: 0.85;
}

.info-intro {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.6;
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

/* ================== 移动端 ================== */
@media (max-width: 768px) {
  .team-lineup {
    flex-direction: column;
    align-items: center;
    height: auto;
  }

  .team-dim {
    display: none; /* 移动端不加遮罩，避免太晃眼 */
  }

  .character-slot {
    width: 85%;
    max-width: 360px;
    height: 380px;
  }

  .character-slot.slot-hovered {
    transform: translateY(-4px);
  }

  .character-info {
    position: static;
    transform: none;
    margin-top: 0.75rem;
    width: 100%;
    text-align: left;
  }

  .character-info.info-left,
  .character-info.info-right {
    margin: 0.5rem 0 0;
  }
}

/* ================== 深色模式：跟随 html.dark ================== */

/* 深色：渐变黑底 + 白字 */
:deep(html.dark) .team-layout {
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.06), transparent 60%),
    linear-gradient(135deg, #0b0c10, #161925);
  color: #f5f5f5;
}

/* 深色下竖条略微换成浅亮竖条 */
:deep(html.dark) .slot-bg {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.02)
  );
}

/* 深色下：简介文字在深背景上，用黑色晕影加强对比 */
:deep(html.dark) .character-info {
  text-shadow:
    0 0 3px rgba(0, 0, 0, 0.9),
    0 0 12px rgba(0, 0, 0, 0.9);
}
</style>