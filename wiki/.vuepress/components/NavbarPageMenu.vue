<template>
  <ClientOnly>
    <div class="navbar-page-menu">
      <!-- 顶部导航栏里的按钮 -->
      <button class="menu-btn" @click.stop="toggleOpen">
        ⚙ 页面设置
      </button>

      <!-- 下拉菜单 -->
      <div v-if="open" class="menu-dropdown">
        <!-- 这里插入“插件项” -->
        <NavbarMenuAIItem />

        <!-- 以后在这里继续加更多插件项，例如： -->
        <!-- <NavbarMenuFontSizeItem /> -->
        <!-- <NavbarMenuLayoutItem /> -->
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
/*
  组件：NavbarPageMenu
  角色：
    - 只负责“菜单壳子”：按钮、展开/收起、下拉位置与外观。
    - 真正的功能项（比如 AI 开关）由子组件提供，如 <NavbarMenuAIItem />。
    - 以后扩展菜单，只需要继续在 <menu-dropdown> 中 import 并插入新的菜单项组件即可。
*/

import { ref, onMounted, onBeforeUnmount } from 'vue'
import NavbarMenuAIItem from './NavbarAIToggle.vue'

const open = ref(false)

const toggleOpen = () => {
  open.value = !open.value
}

const close = () => {
  open.value = false
}

// 点击菜单外部时收起菜单
const onClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.navbar-page-menu')) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => {
  window.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
/*
  导航栏“页面设置”菜单外观说明：

    - .navbar-page-menu：包住按钮 + 下拉面板的容器，提供相对定位。
    - .menu-btn：导航栏里显示的“⚙ 页面设置”按钮。
    - .menu-dropdown：下拉面板容器，绝对定位在按钮下方。
    - 菜单项样式通过 :deep(.menu-item) 统一应用到所有子插件组件中。
*/

/* 外层容器 */
.navbar-page-menu {
  position: relative;
  display: inline-block;
}

/* 顶部“页面设置”按钮样式 */
.menu-btn {
  border-radius: 999px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: transparent;
  color: var(--c-text, #111);
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.menu-btn:hover {
  border-color: var(--c-brand, #3a7bff);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* 下拉菜单面板 */
.menu-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  min-width: 180px;
  padding: 6px 0;
  border-radius: 8px;
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  border: 1px solid var(--c-border, #e5e7eb);
  z-index: 9999;
}

/* 统一控制所有“插件项”的样式：
   子组件只需要 root 用 class="menu-item"，就能吃到这些样式 */
.menu-dropdown :deep(.menu-item) {
  width: 100%;
  text-align: left;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: var(--c-text, #111);
  font-size: 13px;
  cursor: pointer;
}

.menu-dropdown :deep(.menu-item:hover) {
  background: rgba(0,0,0,0.04);
}

/* 暗色适配 */
html[data-theme='dark'] .menu-btn {
  color: var(--c-text, #eee);
  border-color: var(--c-border, #333);
}

html[data-theme='dark'] .menu-dropdown {
  background: var(--vp-c-bg-soft, #1e1e1e);
  border-color: var(--c-border, #333);
}

html[data-theme='dark'] .menu-dropdown :deep(.menu-item:hover) {
  background: rgba(255,255,255,0.06);
}
</style>