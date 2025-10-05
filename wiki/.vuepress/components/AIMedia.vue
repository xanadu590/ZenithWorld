<template>
  <ClientOnly>
    <figure class="ai-media" :style="figureStyle">
      <!-- 显示条件：全站开 或 单图点开 或 defaultShow -->
      <img
        v-show="visible"
        :src="src"
        :alt="alt"
        :width="width"
        :height="height"
        loading="lazy"
      />

      <div
        v-show="!visible"
        class="ai-veil"
        role="button"
        tabindex="0"
        :aria-label="ariaLabel"
        @click="reveal"
        @keydown.space.prevent="reveal"
        @keydown.enter.prevent="reveal"
      >
        <img
          v-show="blurPreview"
          class="ai-blur"
          :src="src"
          :alt="alt"
          :width="width"
          :height="height"
          loading="lazy"
        />
        <div class="ai-mask">
          <div class="ai-lock">🔒</div>
          <div class="ai-text">
            <slot name="placeholder">本图由 AI 生成，点击查看</slot>
          </div>
        </div>
      </div>

      <figcaption v-if="caption" class="ai-caption">
        <slot name="caption">{{ caption }}</slot>
      </figcaption>
    </figure>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { AI_INJECT_KEY } from '../client'

const props = defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
  caption?: string
  defaultShow?: boolean     // 单图默认显示，优先级低于全站开关
  blurPreview?: boolean     // 隐藏态是否显示模糊缩略图（默认 true）
}>()

// 全站开关
const ai = inject(AI_INJECT_KEY, { show: false } as { show: boolean })
const revealed = ref(!!props.defaultShow)
const reveal = () => (revealed.value = true)

const visible = computed(() => ai.show || revealed.value)

const ariaLabel = computed(
  () => (props.alt ? `AI 图片：${props.alt}。点击显示` : 'AI 图片。点击显示')
)

// 百分比宽度时，给 figure 施加宽度，防止 < img width="45%"> 不生效
const figureStyle = computed(() => {
  const s: Record<string, string> = { display: 'inline-block', margin: '.5rem', textAlign: 'center' }
  if (typeof props.width === 'string' && props.width.endsWith('%')) s.width = props.width
  return s
})

const blurPreview = computed(() => props.blurPreview !== false)
</script>

<style scoped>

/* 外层容器不要再占 inline 宽度，也不要外边距 */
.ai-media {
  vertical-align: top;    /* 顶部对齐 */
}

/* 图片占满容器，避免“看起来更小” */
.ai-media img {
  display: block;
  margin: 0 auto;
  object-fit: cover;    /* 保持比例并裁剪多余部分 */
  border-radius: 8px;
}

.ai-veil {
  position: relative;
  display: inline-block;
  cursor: pointer;
  outline: none;
  border-radius: 8px;
}
.ai-veil:focus .ai-mask {
  box-shadow: 0 0 0 3px rgba(25,120,255,.35);
}
/* 模糊状态：图片保留尺寸，只改变视觉样式 */
.ai-blur {
  filter: blur(18px) brightness(0.7);
  opacity: 0.6;              /* 半透明，不彻底隐藏 */
  pointer-events: none;      /* 防止点击 */
  transition: all 0.4s ease; /* 动画过渡 */
}
/* 聚焦/点击后恢复清晰 */
.ai-veil:focus .ai-blur,
.ai-veil:hover .ai-blur {
  filter: blur(0) brightness(1);
  opacity: 1;
  pointer-events: auto;
}
.ai-mask {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: rgba(0,0,0,.45);
  color: #fff;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 10px;
}
.ai-lock { font-size: 28px; line-height: 1; margin-bottom: 6px; }
.ai-text { font-size: 14px; }
.ai-caption { margin-top: 6px; color: #666; font-size: 13px; }
</style>