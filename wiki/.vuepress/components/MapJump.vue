<template>
  <div
    class="mapjump"
    :style="{
      backgroundImage: `url(${bgUrl})`,
      aspectRatio: ratioStyle,
    }"
    role="img"
    :aria-label="alt || '地图导航'"
  >
    <button
      v-for="r in regions"
      :key="r.id"
      class="hotspot"
      :style="spotStyle(r)"
      :title="r.title"
      :aria-label="r.title"
      @click="go(r.to)"
      @keydown.enter.prevent="go(r.to)"
    >
      <span class="hotspot-label" v-if="showLabel">{{ r.title }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { withBase } from '@vuepress/client'

type Region = {
  id: string | number
  title: string
  to: string                 // 目标：站内 /xxx 或 http(s) 外链
  x: number                  // 左上坐标（百分比 0~100）
  y: number
  w: number                  // 宽高（百分比 0~100）
  h: number
  r?: number                 // 可选：圆角半径（百分比）
}

const props = withDefaults(defineProps<{
  /** 背景图（建议放到 public/ 或相对当前页的路径） */
  src: string
  /** 热区数据 */
  regions: Region[]
  /** 读屏描述 */
  alt?: string
  /** 背景图宽高比：'16/9' | '4/3' | '1/1' ...，不传则由 CSS 自适应高度 */
  ratio?: string
  /** 是否显示文本标签（默认 false，仅 hover 有描边高亮） */
  showLabel?: boolean
}>(), {
  showLabel: false,
})

/** 处理图片地址（支持 / 开头补 base） */
const bgUrl = /^https?:\/\//i.test(props.src)
  ? props.src
  : props.src.startsWith('/') ? withBase(props.src) : props.src

const ratioStyle = props.ratio || 'auto'

const spotStyle = (r: Region) => ({
  left: r.x + '%',
  top: r.y + '%',
  width: r.w + '%',
  height: r.h + '%',
  borderRadius: (r.r ?? 6) + '%',
})

/** 站内用 withBase，外链原样 */
const go = (to: string) => {
  const url = to.startsWith('/') ? withBase(to) : to
  window.location.assign(url)
}
</script>

<style scoped>
.mapjump{
  position: relative;
  width: 100%;
  background: #eee center/cover no-repeat;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
  /* 若未给 ratio，可让容器按图片本身高度自动扩展 */
  min-height: 240px;
}

/* 热区按钮：百分比定位 */
.hotspot{
  position: absolute;
  display: grid;
  place-items: center;
  border: 2px solid transparent;
  background: transparent;
  cursor: pointer;
  outline: none;
  padding: 0;
}

/* hover/键盘聚焦的可视反馈（不挡住图）： */
.hotspot:hover,
.hotspot:focus-visible{
  border-color: rgba(255,255,255,.9);
  box-shadow: 0 0 0 3px rgba(0,0,0,.25) inset;
  background: rgba(0,0,0,.10);
}

/* 可选标签样式 */
.hotspot-label{
  font-size: 12px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(0,0,0,.55);
  color: #fff;
  backdrop-filter: blur(2px);
  user-select: none;
  pointer-events: none;
}
</style>