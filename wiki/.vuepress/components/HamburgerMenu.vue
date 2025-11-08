<template>
  <!-- ✅ 根容器：用 ref 把整块当作“点击区域”，用于判断外击 -->
  <div class="hb-root" ref="rootRef" @keydown.esc="close">
    <!-- 🍔 按钮：阻止冒泡，避免被全局点击监听立刻关掉 -->
    <button
      class="hb-button"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="menu"
      @click.stop="toggle"
    >
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>

    <!-- 🔽 下拉菜单：同样阻止冒泡 -->
    <transition name="hb-fade">
      <div v-if="open" class="hb-menu" role="menu" ref="menuRef" @click.stop>
        <div
          v-for="(it, i) in items"
          :key="i"
          class="hb-item"
          role="menuitem"
          tabindex="0"
          @click="go(it)"
        >
          <span class="hb-text">{{ it.text }}</span>
        </div>
      </div>
    </transition>

    <!-- ✅ 背景遮罩：点击空白处时关闭（不会挡住按钮/菜单，因为上面 .stop 已拦截） -->
    <div v-if="open" class="hb-backdrop" @click="close"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

type MenuItem = { text: string; href?: string; onClick?: () => void }

const props = withDefaults(defineProps<{
  items: MenuItem[]
  top?: number
  right?: number
}>(), {
  items: () => [],
  top: 12,
  right: 12,
})

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

/** ✅ 关键点 1：toggle 内阻止冒泡（模板里也加了 @click.stop 双保险） */
function toggle(e?: MouseEvent) {
  if (e) e.stopPropagation()
  open.value = !open.value
}

function close() { open.value = false }

function go(it: MenuItem) {
  if (it.onClick) it.onClick()
  else if (it.href) window.location.assign(it.href)
  close()
}

/** ✅ 关键点 2：只在“点击根容器以外”时才关闭 */
function onDocClick(e: MouseEvent) {
  const root = rootRef.value
  if (!root) return
  if (!root.contains(e.target as Node)) close()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
/* ===============================
   🍔 汉堡菜单 - 全局右上角悬浮
   =============================== */
.hb-root{
  position: fixed;
  z-index: 100000; /* ✅ 提高层级，避免被顶部条遮住 */
  top: calc(env(safe-area-inset-top, 0px) + v-bind(top + 'px'));
  right: calc(env(safe-area-inset-right, 0px) + v-bind(right + 'px'));
}

/* 按钮样式（三条横线） */
.hb-button{
  width: 40px; height: 40px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,.06);
  transition: box-shadow .15s ease;
}
.hb-button:hover{ box-shadow: 0 4px 16px rgba(0,0,0,.08); }

.bar{
  width: 18px; height: 2px; background: var(--c-text, #111);
  display: block; border-radius: 2px;
  transition: transform .2s ease, opacity .2s ease;
}
.bar + .bar{ margin-top: 4px; }

/* 下拉菜单 */
.hb-menu{
  position: absolute; top: 44px; right: 0;
  min-width: 200px; max-width: min(90vw, 320px);
  max-height: min(70vh, 440px); overflow-y: auto;
  padding: 6px; border-radius: 12px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg, #fff);
  box-shadow: 0 10px 28px rgba(0,0,0,.12);
}
.hb-item{
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  color: var(--c-text, #111); font-size: .95rem;
  transition: background .15s ease;
}
.hb-item:hover,.hb-item:focus{ background: var(--vp-c-bg-soft, #f6f7fb); outline: none; }
.hb-text{ white-space: nowrap; }

/* 背景点击关闭 */
.hb-backdrop{
  position: fixed; inset: 0; z-index: 99999; /* 在菜单下、按钮上都能点到 */
  background: transparent;
}

/* 淡入淡出动画 */
.hb-fade-enter-from, .hb-fade-leave-to{ opacity: 0; transform: translateY(-6px); }
.hb-fade-enter-active, .hb-fade-leave-active{ transition: all .16s ease; }

/* 暗色模式 */
html[data-theme="dark"] .hb-button{
  border-color: #2f3340; background: #0b0f19;
}
html[data-theme="dark"] .bar{ background: #e5e5e5; }
html[data-theme="dark"] .hb-menu{
  border-color: #2f3340; background: #121726;
  box-shadow: 0 10px 28px rgba(0,0,0,.45);
}
html[data-theme="dark"] .hb-item:hover,
html[data-theme="dark"] .hb-item:focus{
  background: rgba(255,255,255,.06);
}

/* 手机端优化 */
@media (max-width: 640px){
  .hb-button{ width: 48px; height: 48px; }
  .hb-item{ padding: 12px 16px; font-size: 1rem; }
  .hb-menu{ border-radius: 14px; }
}
</style>