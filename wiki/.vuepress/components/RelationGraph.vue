<!--
  组件用途：RelationGraph —— 用于在页面中可视化“人物/事物关系图谱”
  - 支持传入节点(nodes)与边(edges)
  - 节点可点击跳转到对应条目
  - 亮/暗主题自适应
  - 采用 vis-network 渲染，交互友好
-->

<template>
  <!-- 模板模块：仅在浏览器端渲染，避免 SSR 期间访问 DOM -->
  <ClientOnly>
    <div ref="el" class="rg-wrap" :style="wrapStyle"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * 脚本模块：关系图谱核心逻辑（初始化、更新与销毁）
 * - 动态导入 vis-network/standalone
 * - 处理属性：height/nodes/edges
 * - 点击节点跳转、主题适配
 */
import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'
import 'vis-network/styles/vis-network.css' // 样式模块：vis-network 默认样式（节点/连线必需）

/** 节点与边的数据结构定义（对外 props） */
type NodeItem = {
  id: string | number
  label: string
  url?: string
  group?: string
  image?: string
  shape?: string
}
type EdgeItem = { from: string | number; to: string | number; type?: string }

/** 组件对外属性（保持与既有功能一致） */
const props = defineProps<{
  height?: number | string
  nodes: NodeItem[]
  edges: EdgeItem[]
}>()

/** DOM 容器与网络实例句柄 */
const el = ref<HTMLElement | null>(null)
let net: any = null

/** 计算容器样式：支持高度可配置，默认 420px */
const wrapStyle = computed(() => {
  const h =
    typeof props.height === 'number'
      ? `${props.height}px`
      : (props.height || '420px')
  return {
    width: '100%',
    height: h,
    borderRadius: '12px',
    border: '1px solid var(--c-border, #e5e7eb)',
    background: 'var(--vp-c-bg-soft, var(--c-bg, #fff))',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
  } as Record<string, string>
})

/** 初始化关系图：仅在客户端执行 */
async function init() {
  if (!el.value) return

  // 按需加载 vis-network（模块组件：第三方渲染引擎）
  const { Network, DataSet } = await import('vis-network/standalone')

  // 安全节点集：有 image 用 circularImage，无图用 dot（保持既有逻辑）
  const safeNodes = (props.nodes ?? []).map(n => ({
    ...n,
    shape: n.image ? 'circularImage' : (n.shape || 'dot'),
  }))

  // 数据集（模块组件：数据源）
  const nodeDS = new DataSet(safeNodes)
  const edgeDS = new DataSet(
    (props.edges ?? []).map(e => ({
      ...e,
      color: edgeColor(e.type),
      width: 2,
      arrows: { to: { enabled: false } },
    }))
  )

  // 渲染配置（模块组件：vis-network 选项）
  const options = {
    layout: { improvedLayout: true },
    physics: { enabled: true, stabilization: true },

    // 节点样式
    nodes: {
      shape: 'dot',           // 默认 dot，无图节点安全
      size: 36,
      borderWidth: 2,
      color: {
        border: 'var(--c-border, #cbd5e1)',
        background: 'var(--c-bg, #fff)',
        highlight: {
          border: 'var(--c-brand, #3eaf7c)',
          background: 'var(--vp-c-bg-soft, #f8fafc)',
        },
      },
      font: {
        color: 'var(--c-text, #111)',
        face: 'sans-serif',
        size: 14,
      },
      // 关键：避免选中/悬停导致文字/节点变灰
      chosen: {
        node: (values: any) => {
          values.borderColor = 'var(--c-brand, #3eaf7c)'
          values.opacity = 1
        },
        label: (values: any) => {
          values.color = 'var(--c-text, #111)'
          values.strokeWidth = 0
        },
      },
      // 可选：备用头像，防止 image 404 时报错
      // brokenImage: '/images/fallback-avatar.png',
    },

    // 边样式
    edges: {
      smooth: { enabled: true, type: 'dynamic' },
      color: { color: '#94a3b8', highlight: '#3eaf7c' },
      chosen: false, // 选中边不变样，防止整体降灰
    },

    // 交互：关闭“联动高亮”避免其它节点被降灰
    interaction: {
      hover: true,
      hoverConnectedEdges: false,
      selectConnectedEdges: false,
      zoomView: true,
      dragView: true,
      selectable: true,
    },
  }

  // 创建网络（模块组件：实例化）
  net = new Network(el.value, { nodes: nodeDS, edges: edgeDS }, options)

  // 交互：点击节点可跳转到 url（保持既有功能）
  net.on('click', (params: any) => {
    const id = params?.nodes?.[0]
    if (!id) return
    const node = (props.nodes || []).find(n => String(n.id) === String(id))
    if (node?.url) window.location.assign(node.url)
  })
}

/** 工具模块：根据关系类型给边着色（保持既有功能） */
function edgeColor(type?: string) {
  const map: Record<string, string> = {
    friend: '#34c759', // 朋友（绿）
    ally:   '#2eaadc', // 盟友（蓝）
    enemy:  '#ef4444', // 敌对（红）
    family: '#a78bfa', // 家人（紫）
  }
  return map[type || ''] || '#94a3b8'
}

/** 生命周期模块：挂载/更新/销毁（保持既有行为） */
onMounted(async () => {
  await nextTick()
  await init()
})

watch(
  () => [props.nodes, props.edges, props.height],
  async () => {
    if (!el.value) return
    if (net && typeof net.destroy === 'function') net.destroy()
    await nextTick()
    await init()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (net && typeof net.destroy === 'function') net.destroy()
  net = null
})
</script>

<style scoped>
/* 样式模块：暗色主题适配（容器） */
html[data-theme="dark"] .rg-wrap {
  background: var(--vp-c-bg-soft, #0b0f19);
  border-color: var(--c-border, #333);
}
</style>