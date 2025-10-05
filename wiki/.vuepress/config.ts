import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  base: "/",
  
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
});
