<template>
  <!-- ===========================
       组件主体：可复用的“角色信息卡片”
       用法：
       1) 纯 props：<RoleInfobox title="灵动骑士" image="/xx.png" ... />
       2) 用 frontmatter：在页面 fm 里写 role: {...}，这里不传 props 也能显示
       3) 多卡片并排：<RoleInfobox inline ... /> 多个放在一行
       =========================== -->
  <aside
    class="box"                 <!-- 外层卡片 -->
    :class="{ inline }"         <!-- 开启并排：加 .inline -->
    :style="boxStyle"           <!-- 行内样式：针对 block/inline 分别处理宽度 -->
  >
    <!-- 立绘（优先用 props.image；否则回退到 fm.role.image） -->
    <img
      v-if="role.image"
      :src="role.image"
      alt="立绘"
      class="portrait"
    />

    <!-- 标题（优先用 props.title；否则回退 page.title）
         可选 link：传入后标题可点击跳转 -->
    <h2 class="name">
      <a v-if="link" :href="link" class="name-link">{{ title }}</a >
      <template v-else>{{ title }}</template>
    </h2>

    <!-- 基础信息（按存在与否逐项展示） -->
    <ul class="meta">
      <li v-if="role.alias"><b>别名</b>：{{ role.alias }}</li>
      <li v-if="role.faction"><b>阵营</b>：{{ role.faction }}</li>
      <li v-if="role.status"><b>状态</b>：{{ role.status }}</li>
      <li v-if="role.first_appearance"><b>初登场</b>：{{ role.first_appearance }}</li>
    </ul>

    <!-- 能力列表（有则展示） -->
    <div v-if="role.abilities?.length" class="abilities">
      <b>能力</b>：
      <ul>
        <li v-for="(a, i) in role.abilities" :key="i">{{ a }}</li>
      </ul>
    </div>

    <!-- 预留插槽：需要时可以在卡片底部插入额外内容 -->
    <slot />
  </aside>
</template>

<script setup lang="ts">
/**
 * 模块：可复用角色信息卡片（RoleInfobox）
 * 作用：支持“传参即用、无参读 frontmatter 回退”，可在任意位置/页面重复使用
 */
import { computed } from 'vue'
import { usePageData, usePageFrontmatter } from 'vuepress/client'

/** ① Props：就地传参（全部可选） */
const props = defineProps<{
  title?: string                 // 卡片标题（不传则回退 page.title）
  image?: string                 // 立绘
  alias?: string                 // 别名
  faction?: string               // 阵营
  status?: string                // 状态
  firstAppearance?: string       // 初登场
  abilities?: string[]           // 能力列表
  link?: string                  // 点击标题跳转
  maxWidth?: string | number     // 卡片最大宽度，默认 360px（支持 "420px" 或 420）
  inline?: boolean               // 是否 inline 布局，便于同页多卡片并排
}>()

/** ② page & frontmatter：作为回退数据源 */
const page = usePageData()
const fm = usePageFrontmatter<any>()

/** ③ 标题来源：props 优先 → page.title 回退 */
const title = computed(() => props.title ?? page.value.title)

/** ④ 角色字段合集：props 优先 → frontmatter 回退 */
const role = computed(() => {
  const r = (fm.value?.role ?? {}) as any
  return {
    image:            props.image            ?? r.image,
    alias:            props.alias            ?? r.alias,
    faction:          props.faction          ?? r.faction,
    status:           props.status           ?? r.status,
    first_appearance: props.firstAppearance  ?? r.first_appearance,
    abilities:        props.abilities        ?? r.abilities,
  } as {
    image?: string
    alias?: string
    faction?: string
    status?: string
    first_appearance?: string
    abilities?: string[]
  }
})

/** ⑤ UI 控制：宽度样式与内联布局 */
const link = computed(() => props.link)
const inline = computed(() => !!props.inline)

// 工具：把 number 转 px
function toPx(v?: string | number) {
  if (typeof v === 'number') return `${v}px`
  return v || '360px'
}

/**
 * 关键修正：
 * - block 模式：保持 width:100%
 * - inline 模式：不要设置 width（让 .box.inline 的 width:auto 生效），只给 max-width
 */
const boxStyle = computed(() => {
  const maxW = toPx(props.maxWidth)
  return inline.value
    ? { maxWidth: maxW }                  // ★ 仅设置 max-width，不设置 width
    : { width: '100%', maxWidth: maxW }  // ★ 占满容器宽度
})
</script>

<style scoped>
/* ===========================
   样式：卡片外观（明/暗主题自适应）
   =========================== */
.box{
  display: block;                          /* 默认块级，单卡时更好排版 */
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 12px;
  padding: 14px;
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  margin: 12px auto;                       /* 居中友好 */
  box-shadow: 0 2px 10px rgba(0,0,0,.04);
}

/* 多卡片并排：开启 inline 后可一行放多个 */
.box.inline{
  display: inline-block;     /* 横排 */
  width: auto;               /* 交给内容决定宽度（配合 max-width） */
  max-width: 360px;          /* 最大宽度限制（可被 props 覆盖） */
  flex: 0 0 auto;            /* 放在 flex 容器时不拉伸 */
  vertical-align: top;       /* 顶对齐 */
  margin: 8px;               /* 卡片间距 */
}

/* 立绘 */
.portrait{
  width: 100%;
  border-radius: 10px;
  margin-bottom: 10px;
}

/* 标题（可点击时加下划线悬停态） */
.name{ margin: 6px 0 10px; font-size: 20px; }
.name-link{ text-decoration: none; color: inherit; }
.name-link:hover{ text-decoration: underline; }

/* 基础信息 */
.meta{ list-style: none; padding: 0; margin: 0 0 10px; }
.meta li{ margin: 4px 0; }

/* 能力列表 */
.abilities ul{ margin: 6px 0 0 18px; }

/* 暗色主题边框微调 */
html[data-theme="dark"] .box{ border-color: #333; }
</style>