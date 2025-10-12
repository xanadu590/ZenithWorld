import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

import { viteBundler } from '@vuepress/bundler-vite'

import { slimsearchPlugin } from '@vuepress/plugin-slimsearch'

import { photoSwipePlugin } from '@vuepress/plugin-photo-swipe'

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig({
  base:  isProd ? '/ZenithWorld/' : '/',

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

  plugins: [
    slimsearchPlugin({
      indexContent: true,
      locales: { '/': { placeholder: '搜索文档' }, '/en/': { placeholder: 'Search' } },
      hotKeys: [{ key: 'k', ctrl: true }, { key: '/', ctrl: true }],
      queryHistoryCount: 5,
      resultHistoryCount: 5,
      searchDelay: 150,
    }),
  ],

  // Enable it with pwa
  // shouldPrefetch: false,
});

