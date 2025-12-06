// .vuepress/client.ts
import { defineClientConfig, useLayouts } from 'vuepress/client'
import { reactive } from 'vue'
import AIMedia from './components/AIMedia.vue'
import WorldTimeline from './components/WorldTimeline.vue'
import RelationCards from './components/RelationCards.vue'
import RelationGraph from './components/RelationGraph.vue'
import RoleCard from './components/RoleCard.vue'
import RandomCard from './components/RandomCard.vue'
import RandomSidebar from './components/RandomSidebar.vue'
import LeadBlock from './components/LeadBlock.vue'
import MapJump from './components/MapJump.vue'
import PersonaQACard from './components/PersonaQACard.vue'
import NavbarAIToggle from './components/navbar/NavbarAIToggle.vue'
import NavbarPageMenu from './components/navbar/NavbarPageMenu.vue'
import HotPages from './plugins/recommended-articles/HotPages.vue'
import RecentPages from './plugins/recommended-articles/RecentPages.vue'
import NavbarMenuHotPages from './components/navbar/NavbarMenuHotPages.vue'
import TwikooComment from './components/TwikooComment.vue'
import TeamLineupLayout from './layouts/TeamLineupLayout.vue'
import MeiliFilterSearch from './components/search/MeiliFilterSearch.vue'

import MeiliFilterControls from './components/search/MeiliFilterControls.vue'

import TaxonomyList from './components/TaxonomyList.vue'

import AutoLinkTooltip from './components/AutoLinkTooltip.vue'

export type AISetting = {
  show: boolean
  setShow: (v: boolean) => void
}

const KEY = 'showAIImages'
export const AI_INJECT_KEY = Symbol('AISetting')

/* -------------------- 访问统计相关配置 -------------------- */

const API_BASE = 'https://comment.zenithworld.top' // 你的统计服务域名

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr'
  const KEY = 'wiki_visitor_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    if ('crypto' in window && 'randomUUID' in crypto) {
      id = crypto.randomUUID()
    } else {
      id =
        Math.random().toString(36).slice(2) +
        Date.now().toString(36)
    }
    localStorage.setItem(KEY, id)
  }
  return id
}

function reportPageView() {
  if (typeof window === 'undefined') return

  const visitorId = getVisitorId()
  const path = location.pathname + location.search + location.hash
  const title = document.title || ''

  fetch(`${API_BASE}/api/hit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    keepalive: true,
    body: JSON.stringify({
      path,
      title,
      visitorId,
    }),
  }).catch(() => {
    // 忽略错误，不影响页面
  })
}

/* -------------------- 原有配置 + 挂载 router.afterEach -------------------- */

export default defineClientConfig({

  // ⚠ 这里记得把 router 也解构出来
  enhance({ app, router }) {
    const setting = reactive<AISetting>({
      show:
        typeof window !== 'undefined'
          ? (localStorage.getItem(KEY) ?? 'off') === 'on'
          : false,
      setShow(v: boolean) {
        setting.show = v
        if (typeof window !== 'undefined') {
          localStorage.setItem(KEY, v ? 'on' : 'off')
        }
      },
    })

    // 全局注入 AI 设置
    app.provide(AI_INJECT_KEY, setting)

    // 全局注册各类组件（你原来的都保留）
    app.component('AIMedia', AIMedia)
    app.component('WorldTimeline', WorldTimeline)
    app.component('RelationCards', RelationCards)
    app.component('RelationGraph', RelationGraph)
    app.component('RoleCard', RoleCard)
    app.component('RandomCard', RandomCard)
    app.component('RandomSidebar', RandomSidebar)
    app.component('LeadBlock', LeadBlock)
    app.component('MapJump', MapJump)
    app.component('PersonaQACard', PersonaQACard)
    app.component('NavbarAIToggle', NavbarAIToggle)
    app.component('NavbarPageMenu', NavbarPageMenu)
    app.component('HotPages', HotPages)
    app.component('RecentPages', RecentPages)
    app.component('NavbarMenuHotPages', NavbarMenuHotPages)
    app.component('TwikooComment', TwikooComment)
    app.component('MeiliFilterSearch', MeiliFilterSearch)
    app.component('MeiliFilterControls', MeiliFilterControls)

    app.component('TaxonomyList', TaxonomyList)
    app.component('AutoLinkTooltip', AutoLinkTooltip)

    // ✅ 新增：每次路由切换后上报访问
    if (router) {
      router.afterEach(() => {
        reportPageView()
      })
    }
  },

  layouts: {
      TeamLineupLayout,
    },

})