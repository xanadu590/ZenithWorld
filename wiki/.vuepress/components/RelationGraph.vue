<template>
  <ClientOnly>
    <div ref="el" class="rg-wrap" :style="wrapStyle"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'

type NodeItem = {
  id: string | number
  label: string
  url?: string
  group?: string
  image?: string
}
type EdgeItem = {
  from: string | number
  to: string | number
  type?: string
}

const props = defineProps<{
  height?: number | string
  nodes: NodeItem[]
  edges: EdgeItem[]
}>()

const el = ref<HTMLElement | null>(null)
let net: any = null

// 把高度真正应用到容器上
const wrapStyle = computed(() => {
  const h =
    typeof props.height === 'number' ? `${props.height}px` :
    props.height || '420px'
  return {
    width: '100%',
    height: h,
    borderRadius: '12px',
    border: '1px solid var(--c-border, #e5e7eb)',
    background: 'var(--vp-c-bg-soft, var(--c-bg, #fff))',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
  } as Record<string, string>
})

async function init() {
  if (!el.value) return

  // ✅ 只在客户端动态加载，规避 SSR 构建差异
  const { Network, DataSet } = await import('vis-network/standalone')

  const nodeDS = new DataSet(props.nodes ?? [])
  const edgeDS = new DataSet(
    (props.edges ?? []).map(e => ({
      ...e,
      color: edgeColor(e.type),
      width: 2,
      arrows: { to: { enabled: false } },
    }))
  )

  const options = {
    layout: { improvedLayout: true },
    physics: { enabled: true, stabilization: true },
    nodes: {
      shape: 'circularImage',
      image: undefined, // 个别节点会带 image
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
      },
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

  net = new Network(el.value, { nodes: nodeDS, edges: edgeDS }, options)

  // 点击节点 → 若有 url 则跳转
  net.on('click', (params: any) => {
    const id = params?.nodes?.[0]
    if (!id) return
    const node = (props.nodes || []).find(n => String(n.id) === String(id))
    if (node?.url) window.location.assign(node.url)
  })
}

// 根据关系类型给边着色
function edgeColor(type?: string) {
  const map: Record<string, string> = {
    friend: '#34c759', // 朋友 绿
    ally:   '#2eaadc', // 盟友 蓝
    enemy:  '#ef4444', // 敌对 红
    family: '#a78bfa', // 家人 紫
  }
  return map[type || ''] || '#94a3b8'
}

onMounted(async () => {
  await nextTick()
  await init()
})

// 数据变化时重绘
watch(
  () => [props.nodes, props.edges, props.height],
  async () => {
    if (!el.value) return
    // 直接重新初始化最稳（vis-network 更新集合也可以，这里求稳）
    if (net && (net.destroy instanceof Function)) net.destroy()
    await nextTick()
    await init()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (net && (net.destroy instanceof Function)) net.destroy()
  net = null
})
</script>

<style scoped>
/* 主题适配（亮/暗） */
html[data-theme="dark"] .rg-wrap {
  background: var(--vp-c-bg-soft, #0b0f19);
  border-color: var(--c-border, #333);
}
</style>