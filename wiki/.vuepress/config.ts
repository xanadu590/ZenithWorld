import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

import { viteBundler } from '@vuepress/bundler-vite'

import recommendedArticles from "./plugins/recommended-articles/index.js";

import nosearchPlugin from "./plugins/nosearch/index.js";

import { autoLinkerProPlugin } from "./plugins/autoLinkerPro/index.js";

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig({
  base: '/',

  locales: {
    "/en/": {
      lang: "en-US",
      title: "ZenithWorld WIKI",
      description: "ZenithWorld Original Worldbuilding WIKI",
    },
    "/": {
      lang: "zh-CN",
      title: "巅峰世界",
      description: "ZenithWorld 原创世界观百科",
    },
  },

  theme,
  
  bundler: viteBundler(), // ← 指定打包器

  

  // Enable it with pwa
  // shouldPrefetch: false,

   plugins: [
    recommendedArticles(),
    nosearchPlugin(),
    autoLinkerProPlugin({
      // 可按需要调整：
      minLength: 2,          // 中文推荐 2
      maxLinksPerPage: 60,   // 一页最多 60 个自动链接
      maxLinksPerTerm: 4,    // 同一个词在一页最多 4 次
      blacklist: ["火", "风", "水", "土", "主神", "力量"], // 避免误击的短词
      // whitelist: [],       // 默认空，表示所有标题都参与；如设了就只允许这些
      debug: false,
      ignoreComponentNames: [
        "ClientOnly",
        "LeadBlock",
        "PersonaQACard",
        "RelationGraph",
        "RelationCards",
        "RandomSidebar",
        "RandomCard",
        "TwikooComment",
        "AIMedia",
        "HotPages",
        "RecentPages",
      ],
    }),
  ],



});

