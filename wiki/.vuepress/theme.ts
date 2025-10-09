import { hopeTheme } from "vuepress-theme-hope";

import { enNavbar, zhNavbar } from "./navbar/index.js";

import { enSidebar, zhSidebar } from "./sidebar/index.js";



export default hopeTheme({
  hostname: "https://zenithworld.com",

  author: {
    name: "xanadu590",
  },

  pageInfo:["Author", "Date", "Category", "Tag", "Word", "ReadingTime"],

  logo: "https://theme-hope-assets.vuejs.press/logo.svg",

  repo: "vuepress-theme-hope/vuepress-theme-hope",

  docsDir: "wiki",

  locales: {
    "/en/": {
      // navbar
      navbar: enNavbar,

      // sidebar
      sidebar: enSidebar,

      footer: "Default footer",

      displayFooter: true,

      metaLocales: {
        editLink: "Edit this page on GitHub",
      },
    },

    /**
     * Chinese locale config
     */
    "/": {
      // navbar
      navbar: zhNavbar,

      // sidebar
      sidebar: zhSidebar,

      footer: "默认页脚",

      displayFooter: true,

      // page meta
      metaLocales: {
        editLink: "在 GitHub 上编辑此页",
      },
    },
  },

  encrypt: {
    config: {
      "/en/demo/encrypt.html": {
        hint: "Password: 1234",
        password: "1234",
      },
      "/demo/encrypt.html": {
        hint: "Password: 1234",
        password: "1234",
      },
    },
  },

  // These features are enabled for demo, only preserve features you need here
  markdown: {
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    demo: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    plantuml: true,
    spoiler: true,
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended",
            };
        },
      },
    ],
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,

    // uncomment these if you need TeX support
    // math: {
    //   // install katex before enabling it
    //   type: "katex",
    //   // or install mathjax-full before enabling it
    //   type: "mathjax",
    // },

    // install chart.js before enabling it
    // chartjs: true,

    // install echarts before enabling it
    // echarts: true,

    // install flowchart.ts before enabling it
    // flowchart: true,

    // install mermaid before enabling it
    // mermaid: true,

    // playground: {
    //   presets: ["ts", "vue"],
    // },

    // install @vue/repl before enabling it
    // vuePlayground: true,

    // install sandpack-vue3 before enabling it
    // sandpack: true,

    // install @vuepress/plugin-revealjs and uncomment these if you need slides
    // revealjs: {
    //   plugins: ["highlight", "math", "search", "notes", "zoom"],
    // },
  },

  plugins: {
    git: {
      createdTime: true,     // 显示创建时间
      updatedTime: true,     // 显示最后更新时间
      contributors: false,   // 不显示贡献者
    },

    // ✅ slimsearch 只写“配置对象”或 true
    slimsearch: {
      // 是否索引正文（默认 false）
      indexContent: true,

      // 本地化占位符（只配 placeholder 即可）
      locales: {
        '/en/':   { placeholder: 'Search' },
        '/': { placeholder: '搜索文档' },
      },

      // 触发聚焦搜索框的快捷键 —— 用“对象”写法，避免 TS 报错
      hotKeys: [
        { key: 'k', ctrl: true }, // Ctrl + K
        { key: '/', ctrl: true }, // Ctrl + /
      ],

      // 可选：历史数量与防抖
      queryHistoryCount: 5,
      resultHistoryCount: 5,
      searchDelay: 150,

      // 可选：过滤哪些页面参与索引
      // filter: (page) => page.path !== '/drafts/',

      // 可选：中文等需要分词时再配 indexOptions / indexLocaleOptions
      // indexOptions: { ... },
      // indexLocaleOptions: { '/zh/': { ... } },
    },

    // 如果你之前还配置了 search / search-pro，请删掉或设为 false，避免冲突：
    // search: false,
    // 'search-pro': false,



    
    // Note: This is for testing ONLY!
    // You MUST generate and use your own comment service in production.
    comment: false,

  photoSwipe: {
    // i18n
    locales: {
      '/en/':   { close: 'Close', fullscreen: 'Fullscreen' },
      '/': { close: '关闭', fullscreen: '全屏' },
    },
  },

    components: {
      components: ["Badge", "VPCard"],
    },

    icon: {
      prefix: "fa6-solid:",
    },

    // Install @vuepress/plugin-pwa and uncomment these if you want a PWA
    // pwa: {
    //   favicon: "/favicon.ico",
    //   cacheHTML: true,
    //   cacheImage: true,
    //   appendBase: true,
    //   apple: {
    //     icon: "/assets/icon/apple-icon-152.png",
    //     statusBarColor: "black",
    //   },
    //   msTile: {
    //     image: "/assets/icon/ms-icon-144.png",
    //     color: "#ffffff",
    //   },
    //   manifest: {
    //     icons: [
    //       {
    //         src: "/assets/icon/chrome-mask-512.png",
    //         sizes: "512x512",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-mask-192.png",
    //         sizes: "192x192",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //     ],
    //     shortcuts: [
    //       {
    //         name: "Demo",
    //         short_name: "Demo",
    //         url: "/demo/",
    //         icons: [
    //           {
    //             src: "/assets/icon/guide-maskable.png",
    //             sizes: "192x192",
    //             purpose: "maskable",
    //             type: "image/png",
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // },
  },
});
