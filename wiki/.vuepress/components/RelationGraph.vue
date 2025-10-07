<template>
  <!-- ✅ ClientOnly 确保仅在浏览器端渲染 -->
  <ClientOnly>
    <div ref="el" class="rg-wrap" :style="wrapStyle"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'

// ✅ 引入 vis-network 样式（节点、连线样式必需）
import 'vis-network/styles/vis-network.css'

/** 节点与边的类型定义 */
type NodeItem = {
  id: string | number
  label: string
  url?: string
  group?: string
  image?: string
  shape?: string
}
type EdgeItem = { from: string | number; to: string | number; type?: string }

const props = defineProps<{
  height?: number | string
  nodes: NodeItem[]
  edges: EdgeItem[]
}>()

const el = ref<HTMLElement | null>(null)
let net: any = null

/** ✅ 自动计算容器样式（支持 height 动态） */
const wrapStyle = computed(() => {
  const h =
    typeof props.height === 'number'
      ? `${props.height}px`
      : props.height || '420px'
  return {
    width: '100%',
    height: h,
    borderRadius: '12px',
    border: '1px solid var(--c-border, #e5e7eb)',
    background: 'var(--vp-c-bg-soft, var(--c-bg, #fff))',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
  } as Record<string, string>
})

/** ✅ 初始化关系图函数 */
async function init() {
  if (!el.value) return

  // 动态导入 vis-network
  const { Network, DataSet } = await import('vis-network/standalone')

  // ✅ 为每个节点自动决定形状
  const safeNodes = (props.nodes ?? []).map(n => ({
    ...n,
    shape: n.image ? 'circularImage' : (n.shape || 'dot'),
  }))

  // 数据集
  const nodeDS = new DataSet(safeNodes)
  const edgeDS = new DataSet(
    (props.edges ?? []).map(e => ({
      ...e,
      color: edgeColor(e.type),
      width: 2,
      arrows: { to: { enabled: false } },
    }))
  )

  // ✅ vis-network 配置项
  const options = {
    layout: { improvedLayout: true },
    physics: { enabled: true, stabilization: true },
    nodes: {
      shape: 'dot', // 默认使用 dot，无图节点安全
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
        color: 'var(--c-text, #111)',     // 默认文字颜色
        face: 'sans-serif',               // 字体族
        size: 14,                         // 字号
        bold: {
         color: 'var(--c-text, #111)',   // 被选中时仍保持同样颜色
       },
      highlight: {
        color: 'var(--c-text, #111)',   // 高亮状态颜色（防止变灰）
      },
},

      // ⬇️ 可选：备用图片，防止加载失败报错
      brokenImage: '/images/fallback-avatar.png',
    },
    edges: {
      smooth: { enabled: true, type: 'dynamic' },
      color: { color: '#94a3b8', highlight: '#3eaf7c' },
    },
    interaction: {
      hover: true,
      zoomView: true,
      dragView: true,
      selectable: true,
    },
  }

  // ✅ 初始化网络
  net = new Network(el.value, { nodes: nodeDS, edges: edgeDS }, options)

  // ✅ 点击节点跳转
  net.on('click', (params: any) => {
    const id = params?.nodes?.[0]
    if (!id) return
    const node = (props.nodes || []).find(n => String(n.id) === String(id))
    if (node?.url) window.location.assign(node.url)
  })
}

/** ✅ 关系线颜色规则 */
function edgeColor(type?: string) {
  const map: Record<string, string> = {
    friend: '#34c759', // 朋友（绿）
    ally:   '#2eaadc', // 盟友（蓝）
    enemy:  '#ef4444', // 敌对（红）
    family: '#a78bfa', // 家人（紫）
  }
  return map[type || ''] || '#94a3b8'
}

/** ✅ 生命周期：初始化与销毁 */
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
/* ✅ 暗色模式样式同步 */
html[data-theme="dark"] .rg-wrap {
  background: var(--vp-c-bg-soft, #0b0f19);
  border-color: var(--c-border, #333);
}
</style>