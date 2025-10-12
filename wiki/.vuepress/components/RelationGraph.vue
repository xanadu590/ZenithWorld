<template>
  <!--
    视图层说明
    - 仅在客户端渲染，避免 SSR 阶段访问浏览器 API 导致报错。
    - vis-network 会把 Canvas 注入到下方 div 容器中。
  -->
  <ClientOnly>
    <!--
      容器 div
      - ref="el"：在脚本中拿到真实 DOM 节点供 vis-network 挂载。
      - class="rg-wrap"：外观样式钩子。
      - :style="wrapStyle"：支持通过 props.height 动态控制高度。
    -->
    <div ref="el" class="rg-wrap" :style="wrapStyle"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
/*
  组件名称：关系图 RelationGraph（基于 vis-network）
  主要功能：
    1) 用 vis-network 在给定容器内渲染关系网络图（节点 + 连线）。
    2) 支持节点图片、点击跳转、悬停强调（节点变大、连线加粗、连线文字变大）。
    3) 适配明暗主题：自动解析 CSS 变量并应用到 Canvas 字体颜色。
    4) 适配子路径部署：节点图片与占位图的 src 统一补站点 base 前缀。

  关键可配置：
    - props.height：图容器高度，数字会自动转 px，字符串按原样使用。
    - props.nodes：节点数组，见 NodeItem 类型；image 可传绝对/相对路径；url 可用于点击跳转。
    - props.edges：边数组，见 EdgeItemWithLabel 类型；type 可影响默认颜色与默认 label。
    - 默认头像：DEFAULT_NODE_IMAGE，当节点未提供 image 时使用。

  依赖与注意事项：
    - 仅在 ClientOnly 内使用，避免 SSR 访问 window。
    - 动态 import('vis-network/standalone')，防止 SSR 期引用浏览器环境。
    - 主题切换通过 MutationObserver 监听 html[data-theme] 变化，实时更新图中文字颜色。
*/

 /** ----------------------------------------------------------------------------
  * 模块：Vue 生命周期 + 计算属性
  * 作用：初始化关系图；监听数据变化；销毁时清理
  * ---------------------------------------------------------------------------*/
import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'

/** ----------------------------------------------------------------------------
 * 模块：vis-network 默认样式
 * 作用：引入节点/连线/交互的基础样式（确保图形控件的基础样式到位）
 * ---------------------------------------------------------------------------*/
import 'vis-network/styles/vis-network.css'

/** [CHANGE]：为补 base 引入 withBase（用于子路径部署，如 /zenithworld/） */
import { withBase } from '@vuepress/client'

/** ----------------------------------------------------------------------------
 * 类型：节点与边
 * 作用：限定 props 的数据结构，便于类型提示与校验
 * ---------------------------------------------------------------------------*/
// NodeItem：单个节点结构
type NodeItem = {
  id: string | number           // 节点唯一标识
  label: string                 // 节点显示文本
  url?: string                  // 点击节点时跳转的链接，可为站内或外链
  group?: string                // 分组（未在此处使用，可扩展样式）
  image?: string                // 节点图片地址（支持绝对外链、相对路径、/开头路径）
  shape?: string                // 形状（此组件会统一设置为 circularImage）
}

// EdgeItem：连线结构，type 用于映射颜色或默认 label
type EdgeItem = { from: string | number; to: string | number; type?: string }  // ← 原样保留

// EdgeItemWithLabel：在 EdgeItem 基础上增加 label 字段（可选）
type EdgeItemWithLabel = EdgeItem & { label?: string }

/** ----------------------------------------------------------------------------
 * 输入：组件属性
 * 作用：外部传入的节点、连线与高度
 * ---------------------------------------------------------------------------*/
const props = defineProps<{
  height?: number | string            // 容器高度，数值会被拼接 px
  nodes: NodeItem[]                   // 节点列表
  edges: EdgeItemWithLabel[]          // 连线列表（可含 label）
}>()

/** ----------------------------------------------------------------------------
 * 实例引用与状态
 * 作用：el 是容器元素；net 是 vis-network 实例；nodeDS / edgeDS 是数据集
 * ---------------------------------------------------------------------------*/
const el = ref<HTMLElement | null>(null) // DOM 容器引用
let net: any = null                      // vis-network 实例
let nodeDS: any = null                   // 节点 DataSet
let edgeDS: any = null                   // 边 DataSet

// 用于监听主题切换的观察器（html[data-theme]）
let themeObserver: MutationObserver | null = null

/** ----------------------------------------------------------------------------
 * 常量：交互时的样式参数
 * 作用：统一管理“默认尺寸/悬停尺寸、默认/悬停线宽、连线文字字号”等
 * ---------------------------------------------------------------------------*/
const DEFAULT_NODE_SIZE = 36
const HOVER_NODE_SIZE = 42
const DEFAULT_EDGE_WIDTH = 2
const HOVER_EDGE_WIDTH = 4
const DEFAULT_EDGE_FONT_SIZE = 12
const HOVER_EDGE_FONT_SIZE = 16

// 默认头像：当某节点未提供 image 时，自动用这张
// 注意：路径以 / 开头将会被 withBase 补前缀
const DEFAULT_NODE_IMAGE = '/image/LOGO-character.png'

/** [CHANGE] 统一处理图片地址：/ 开头补 base，其它原样返回 */
// 使用场景：节点 image、brokenImage 占位图
function imgUrl(u?: string) {
  // 空值：返回空字符串，避免 vis-network 取到 undefined
  if (!u) return ''
  // http/https 外链：原样返回
  if (/^https?:\/\//i.test(u)) return u
  // 以 / 开头：补站点 base（解决 GitHub Pages 子路径问题）
  return u.startsWith('/') ? withBase(u) : u
}

/** ----------------------------------------------------------------------------
 * 计算：容器样式
 * 作用：支持动态高度，且适配明暗主题的容器外观
 * ---------------------------------------------------------------------------*/
const wrapStyle = computed(() => {
  // 数字转 px；字符串按原样使用；默认 420px
  const h = typeof props.height === 'number' ? `${props.height}px` : (props.height || '420px')
  return {
    width: '100%',
    height: h,
    borderRadius: '12px',
    border: '1px solid var(--c-border, #e5e7eb)',
    background: 'var(--vp-c-bg-soft, var(--c-bg, #fff))',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
  } as Record<string, string>
})

/** ----------------------------------------------------------------------------
 * 读取 CSS 变量真实颜色值（Canvas 需要实色值）
 * 作用：把 var(--c-text) 解析为当前主题下的具体颜色字符串（如 rgb 或 hex）
 * ---------------------------------------------------------------------------*/
function cssVar(name: string, fallback: string) {
  const root = document.documentElement
  const v = getComputedStyle(root).getPropertyValue(name).trim()
  return v || fallback
}

/** ----------------------------------------------------------------------------
 * 初始化：构建网络图
 * 作用：动态导入 vis-network；创建数据集和实例；绑定交互事件
 * ---------------------------------------------------------------------------*/
async function init() {
  // 容器尚未渲染时直接返回
  if (!el.value) return

  // 动态导入，避免 SSR 期引用窗口对象
  const { Network, DataSet } = await import('vis-network/standalone')

  // 构造安全节点数组
  // 统一为 circularImage 形状；未提供 image 的节点使用默认头像；图片地址统一补 base
  const safeNodes = (props.nodes ?? []).map(n => {
    const img = n.image ?? DEFAULT_NODE_IMAGE
    return {
      ...n,
      image: imgUrl(img),            // 统一处理图片地址
      shape: 'circularImage',        // 使用圆形图片节点
      font: { vadjust: 0 },          // 细微的文字垂直微调（可按需求调整）
    }
  })

  // 默认连线文字（按 type 映射）
  // 若 edges 中显式提供 label，则优先生效
  const edgeLabelByType: Record<string, string> = {
    friend: '朋友',
    ally: '盟友',
    enemy: '敌对',
    family: '家人',
  }

  // 创建 DataSet：便于后续通过 id 增量更新（悬停/离开恢复）
  nodeDS = new DataSet(safeNodes)
  edgeDS = new DataSet(
    (props.edges ?? []).map(e => ({
      ...e,
      // 优先使用 e.label；无则按 type 提供一个默认中文
      label: e.label ?? (e.type ? edgeLabelByType[e.type] : undefined),
      color: edgeColor(e.type),
      width: DEFAULT_EDGE_WIDTH,
      arrows: { to: { enabled: false } }, // 关闭箭头，可按需开启
    })),
  )

  // 字体颜色：解析 CSS 变量，保证明暗主题下都正确
  const fontCommonColor = cssVar('--c-text', '#111')

  // vis-network 配置项
  const options = {
    layout: { improvedLayout: true },
      physics: {
        enabled: true,
        stabilization: true,
        solver: 'forceAtlas2Based',   // 也可选 'barnesHut'
        forceAtlas2Based: {
          springLength: 200,          // 节点理想距离，数值越大越松散
          springConstant: 0.02,       // 弹性强度，越小越松
        },
      },
    nodes: {
      shape: 'dot',                   // 实际节点形状由 safeNodes.image + circularImage 决定
      size: DEFAULT_NODE_SIZE,
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
        color: fontCommonColor,       // 解析后的实色
        face: 'sans-serif',
        size: 14,
        bold: {
          color: fontCommonColor,     // 选中加粗但不变色
        },
      },
      // 头像加载失败时的占位图
      brokenImage: imgUrl(DEFAULT_NODE_IMAGE),
    },
    edges: {
      smooth: { enabled: true, type: 'dynamic' }, // 平滑曲线
      color: { color: '#94a3b8', highlight: '#3eaf7c' },
      width: DEFAULT_EDGE_WIDTH,
      font: {
        color: fontCommonColor,       // 连线文字颜色
        size: DEFAULT_EDGE_FONT_SIZE, // 连线默认字号
        face: 'sans-serif',
        strokeWidth: 0,
        align: 'top',
        vadjust: -2,
      },
      labelHighlightBold: false,      // 高亮时不自动加粗连线文字
    },
    interaction: {
      hover: true,                    // 开启 hover 事件
      zoomView: true,
      dragView: true,
      selectable: true,
    },
  }

  // 创建网络实例
  net = new Network(el.value, { nodes: nodeDS, edges: edgeDS }, options)

  /*
    主题自适应：监听 html[data-theme] 变化，实时更新文字颜色
    - 因为 Canvas 内文字不支持 CSS var()，需在主题切换时重新 setOptions 应用实色。
  */
  const applyThemeTextColor = () => {
    const c = cssVar('--c-text', '#111')
    net?.setOptions({
      nodes: { font: { color: c, bold: { color: c } } },
      edges: { font: { color: c } },
    })
  }
  applyThemeTextColor()

  // 注册 DOM 观察器监听主题切换
  themeObserver?.disconnect()
  themeObserver = new MutationObserver(applyThemeTextColor)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  /*
    交互：点击节点
    - 若节点定义了 url，则跳转到该 url（站内或外链均可）。
  */
  net.on('click', (params: any) => {
    const id = params?.nodes?.[0]
    if (!id) return
    const node = (props.nodes || []).find(n => String(n.id) === String(id))
    if (node?.url) window.location.assign(node.url)
  })

  /*
    交互：悬停节点
    - 选中该节点（仅加粗文字，不变色）。
    - 节点放大到 HOVER_NODE_SIZE。
    - 与之相连的边加粗到 HOVER_EDGE_WIDTH，并把连线文字字号调到 HOVER_EDGE_FONT_SIZE。
  */
  net.on('hoverNode', ({ node }: { node: string | number }) => {
    net.selectNodes([node], false)
    nodeDS.update({ id: node, size: HOVER_NODE_SIZE })
    const eids = net.getConnectedEdges(node)
    if (Array.isArray(eids) && eids.length) {
      edgeDS.update(
        eids.map(id => ({
          id,
          width: HOVER_EDGE_WIDTH,
          font: { size: HOVER_EDGE_FONT_SIZE },
        })),
      )
    }
  })

  /*
    交互：移出节点
    - 取消选中。
    - 节点恢复默认尺寸。
    - 与之相连的边恢复默认线宽与默认文字字号。
  */
  net.on('blurNode', ({ node }: { node: string | number }) => {
    net.unselectAll()
    nodeDS.update({ id: node, size: DEFAULT_NODE_SIZE })
    const eids = net.getConnectedEdges(node)
    if (Array.isArray(eids) && eids.length) {
      edgeDS.update(
        eids.map(id => ({
          id,
          width: DEFAULT_EDGE_WIDTH,
          font: { size: DEFAULT_EDGE_FONT_SIZE },
        })),
      )
    }
  })
}

/** ----------------------------------------------------------------------------
 * 工具：边颜色映射
 * 说明：按关系类型返回固定颜色；未匹配到时使用灰色
 * ---------------------------------------------------------------------------*/
function edgeColor(type?: string) {
  const map: Record<string, string> = {
    friend: '#34c759', // 朋友
    ally:   '#2eaadc', // 盟友
    enemy:  '#ef4444', // 敌对
    family: '#a78bfa', // 家人
  }
  return map[type || ''] || '#94a3b8'
}

/** ----------------------------------------------------------------------------
 * 生命周期：挂载/更新/卸载
 * 说明：
 *  - onMounted：等待下一次 DOM 更新后初始化网络图。
 *  - watch：当 nodes/edges/height 变化时，销毁并重建网络图，确保展示最新数据与尺寸。
 *  - onBeforeUnmount：销毁网络实例与主题观察器，释放资源。
 * ---------------------------------------------------------------------------*/
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
  { deep: true },
)

onBeforeUnmount(() => {
  if (net && typeof net.destroy === 'function') net.destroy()
  net = null
  themeObserver?.disconnect()
  themeObserver = null
})
</script>

<style scoped>
/*
  主题相关外观：
    - 暗色模式下改变容器背景与边框颜色，让画布与周围主题一致。
*/
html[data-theme="dark"] .rg-wrap {
  background: var(--vp-c-bg-soft, #0b0f19);
  border-color: var(--c-border, #333);
}
</style>