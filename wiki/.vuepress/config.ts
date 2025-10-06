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

    // 👇👇 在这里新增 head，确保 CSS 加载前先确定主题，避免首屏闪一下
  head: [
    [
      'script',
      {},
      `
      (function() {
        try {
          // theme-hope 默认用这个 key 记录主题
          var saved = localStorage.getItem('vuepress-theme-appearance');
          var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          var html = document.documentElement;
          html.setAttribute('data-theme', theme);
          html.style.colorScheme = theme; // 让滚动条等原生控件也跟随
        } catch (e) {}
      })();
      `
    ]
  ],


    bundler: viteBundler(), // ← 指定打包器

  // Enable it with pwa
  // shouldPrefetch: false,
});
