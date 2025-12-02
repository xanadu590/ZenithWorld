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
  entries: [
    { term: "灵动骑士", path: "/docs/world/characters/superhero/character-EtherealKnight.html" },
    { term: "异常构造", path: "/docs/world/concepts/isomer/" },
    { term: "十二主神", path: "/docs/world/concepts/twelveprimedeities/" },
    { term: "刺猬猫", path: "https://www.ciweimao.com/"}
  ],
  minLength: 2,
  maxLinksPerTerm: 4,
  maxLinksPerPage: 60,
  blacklist: ["火", "风","水","土"],
})
  ],



});

