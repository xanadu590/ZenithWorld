// wiki/.vuepress/config.ts
import { defineUserConfig } from "vuepress";

// wiki/.vuepress/theme.ts
import { hopeTheme } from "vuepress-theme-hope";

// wiki/.vuepress/navbar/en.ts
import { navbar } from "vuepress-theme-hope";
var enNavbar = navbar([
  "/en/"
]);

// wiki/.vuepress/navbar/zh.ts
import { navbar as navbar2 } from "vuepress-theme-hope";
var zhNavbar = navbar2([
  "/"
]);

// wiki/.vuepress/sidebar/en.ts
import { sidebar } from "vuepress-theme-hope";
var enSidebar = sidebar({
  "/en/": []
});

// wiki/.vuepress/sidebar/zh.ts
import { sidebar as sidebar2 } from "vuepress-theme-hope";
var zhSidebar = sidebar2({
  "/": []
});

// wiki/.vuepress/theme.ts
var theme_default = hopeTheme({
  // 🌍 站点主机名
  hostname: "https://zenithworld.com",
  // 👤 作者信息
  author: {
    name: "xanadu590"
  },
  // 页面信息展示项（控制文章顶部显示的元信息）
  pageInfo: ["Author", "Date", "Category", "Tag", "Word", "ReadingTime"],
  // 网站 logo
  logo: "/images/LOGO-light.jpg",
  // 代码仓库（用于编辑链接或跳转到 GitHub）
  repo: "xanadu590/ZenithWorld",
  // 文档源目录（相对仓库根路径）
  docsDir: "wiki",
  locales: {
    "/en/": {
      // 英文站导航栏
      navbar: enNavbar,
      // 英文站侧边栏
      sidebar: enSidebar,
      footer: "Default footer",
      // 页脚文本
      displayFooter: true,
      // 是否显示页脚
      metaLocales: {
        editLink: "Edit this page on GitHub"
        // “编辑此页”按钮文本
      }
    },
    /**
     * 中文语言配置
     */
    "/": {
      // 中文导航栏
      navbar: zhNavbar,
      // 中文侧边栏
      sidebar: zhSidebar,
      footer: "\u9ED8\u8BA4\u9875\u811A",
      // 页脚文本
      displayFooter: true,
      // 是否显示页脚
      // 页面元信息本地化
      metaLocales: {
        editLink: "\u5728 GitHub \u4E0A\u7F16\u8F91\u6B64\u9875"
        // 编辑链接提示文本
      }
    }
  },
  // 🔒 页面加密配置（示例）
  encrypt: {
    config: {
      "/en/demo/encrypt.html": {
        hint: "Password: 1234",
        // 密码提示
        password: "1234"
      },
      "/demo/encrypt.html": {
        hint: "Password: 1234",
        // 密码提示
        password: "1234"
      }
    }
  },
  // 以下为演示配置，生产环境仅保留你需要的部分功能
  markdown: {
    align: true,
    // 启用对齐语法（文本居中等）
    attrs: true,
    // 启用属性语法（在 Markdown 元素中添加属性）
    codeTabs: true,
    // 启用代码分组标签
    component: true,
    // 启用在 Markdown 中使用 Vue 组件
    demo: true,
    // 启用 <Demo /> 演示块
    figure: true,
    // 启用图片 <figure> 包裹
    gfm: true,
    // 启用 GitHub 风格 Markdown (GFM)
    imgLazyload: true,
    // 图片懒加载
    imgSize: true,
    // 支持指定图片尺寸语法
    include: true,
    // 支持 include 文件引入
    mark: true,
    // 启用 ==高亮== 语法
    plantuml: true,
    // 启用 PlantUML 支持
    spoiler: true,
    // 启用折叠隐藏文字（剧透）语法
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended"
              // 把 *Recommended* 替换为一个绿色徽章
            };
        }
      }
    ],
    sub: true,
    // 启用下标语法
    sup: true,
    // 启用上标语法
    tabs: true,
    // 启用选项卡语法
    tasklist: true,
    // 启用任务列表语法
    vPre: true
    // 启用 v-pre 代码转义
    // 如果需要 TeX 数学公式支持，取消注释以下内容
    // math: {
    //   // 启用 KaTeX（需要先安装 katex）
    //   type: "katex",
    //   // 或使用 MathJax（需要安装 mathjax-full）
    //   type: "mathjax",
    // },
    // 如果你安装了 chart.js，可以启用图表支持
    // chartjs: true,
    // 如果你安装了 echarts，可以启用图表支持
    // echarts: true,
    // 如果安装了 flowchart.ts，可启用流程图支持
    // flowchart: true,
    // 如果安装了 mermaid，可启用流程/时序图支持
    // mermaid: true,
    // playground: {
    //   presets: ["ts", "vue"], // 在线代码编辑器默认语言
    // },
    // 如果安装了 @vue/repl，可启用 Vue 在线演练场
    // vuePlayground: true,
    // 如果安装了 sandpack-vue3，可启用 Sandpack 在线运行环境
    // sandpack: true,
    // 如果安装了 @vuepress/plugin-revealjs，可启用幻灯片模式
    // revealjs: {
    //   plugins: ["highlight", "math", "search", "notes", "zoom"], // 启用的幻灯片插件
    // },
  },
  plugins: {
    // Git 插件配置
    git: {
      createdTime: true,
      // 显示文章创建时间
      updatedTime: true,
      // 显示文章最后更新时间
      contributors: false
      // 不显示贡献者
    },
    // ✅ 在 theme 里配置 slimsearch（不要在 config.ts 再注册）
    slimsearch: {
      indexContent: true,
      locales: {
        "/": { placeholder: "\u641C\u7D22\u6587\u6863" },
        "/en/": { placeholder: "Search" }
      },
      hotKeys: [{ key: "k", ctrl: true }, { key: "/", ctrl: true }],
      queryHistoryCount: 5,
      resultHistoryCount: 5,
      searchDelay: 150
      // 如需过滤页面：filter: (page) => page.path !== '/drafts/',
    },
    // ⚠️ 如果之前配置过 search 或 search-pro，请删除或关闭，避免冲突
    // search: false,
    // 'search-pro': false,
    // 💬 评论系统（此处为演示，生产环境必须使用自己的服务）
    comment: false,
    // 🖼️ 图片预览插件（PhotoSwipe）
    photoSwipe: {
      // 国际化文本
      locales: {
        "/en/": { close: "Close", fullscreen: "Fullscreen" },
        "/": { close: "\u5173\u95ED", fullscreen: "\u5168\u5C4F" }
      }
    },
    // 内置组件注册
    components: {
      components: ["Badge", "VPCard"]
      // 启用徽章与卡片组件
    },
    // 图标前缀设置
    icon: {
      prefix: "fa6-solid:"
      // 使用 Font Awesome 6 实心图标
    }
    // ✅ 渐进式 Web 应用（PWA）配置（如需离线与桌面安装功能）
    // 使用前请安装 @vuepress/plugin-pwa
    // pwa: {
    //   favicon: "/favicon.ico",       // 网站图标
    //   cacheHTML: true,               // 缓存 HTML 页面
    //   cacheImage: true,              // 缓存图片
    //   appendBase: true,              // 自动添加 base 前缀
    //   apple: {
    //     icon: "/assets/icon/apple-icon-152.png",
    //     statusBarColor: "black",     // iOS 状态栏颜色
    //   },
    //   msTile: {
    //     image: "/assets/icon/ms-icon-144.png",
    //     color: "#ffffff",            // Windows 磁贴颜色
    //   },
    //   manifest: {
    //     icons: [                     // 各种尺寸的图标
    //       { src: "/assets/icon/chrome-mask-512.png", sizes: "512x512", purpose: "maskable", type: "image/png" },
    //       { src: "/assets/icon/chrome-mask-192.png", sizes: "192x192", purpose: "maskable", type: "image/png" },
    //       { src: "/assets/icon/chrome-512.png", sizes: "512x512", type: "image/png" },
    //       { src: "/assets/icon/chrome-192.png", sizes: "192x192", type: "image/png" },
    //     ],
    //     shortcuts: [                 // 桌面快捷方式配置
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
  }
});

// wiki/.vuepress/config.ts
import { viteBundler } from "@vuepress/bundler-vite";
var isProd = process.env.NODE_ENV === "production";
var config_default = defineUserConfig({
  base: isProd ? "/ZenithWorld/" : "/",
  locales: {
    "/en/": {
      lang: "en-US",
      title: "ZenithWorld WIKI",
      description: "ZenithWorld Original Worldbuilding WIKI"
    },
    "/": {
      lang: "zh-CN",
      title: "\u5DC5\u5CF0\u4E16\u754C",
      description: "ZenithWorld \u539F\u521B\u4E16\u754C\u89C2\u767E\u79D1"
    }
  },
  theme: theme_default,
  bundler: viteBundler()
  // ← 指定打包器
  // Enable it with pwa
  // shouldPrefetch: false,
});
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsid2lraS8udnVlcHJlc3MvY29uZmlnLnRzIiwgIndpa2kvLnZ1ZXByZXNzL3RoZW1lLnRzIiwgIndpa2kvLnZ1ZXByZXNzL25hdmJhci9lbi50cyIsICJ3aWtpLy52dWVwcmVzcy9uYXZiYXIvemgudHMiLCAid2lraS8udnVlcHJlc3Mvc2lkZWJhci9lbi50cyIsICJ3aWtpLy52dWVwcmVzcy9zaWRlYmFyL3poLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzovVXNlcnMvc3VwZXIvWmVuaXRoV29ybGQvd2lraS8udnVlcHJlc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHN1cGVyXFxcXFplbml0aFdvcmxkXFxcXHdpa2lcXFxcLnZ1ZXByZXNzXFxcXGNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc3VwZXIvWmVuaXRoV29ybGQvd2lraS8udnVlcHJlc3MvY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lVXNlckNvbmZpZyB9IGZyb20gXCJ2dWVwcmVzc1wiO1xuXG5pbXBvcnQgdGhlbWUgZnJvbSBcIi4vdGhlbWUuanNcIjtcblxuaW1wb3J0IHsgdml0ZUJ1bmRsZXIgfSBmcm9tICdAdnVlcHJlc3MvYnVuZGxlci12aXRlJ1xuXG5jb25zdCBpc1Byb2QgPSBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZVVzZXJDb25maWcoe1xuICBiYXNlOiAgaXNQcm9kID8gJy9aZW5pdGhXb3JsZC8nIDogJy8nLFxuXG4gIGxvY2FsZXM6IHtcbiAgICBcIi9lbi9cIjoge1xuICAgICAgbGFuZzogXCJlbi1VU1wiLFxuICAgICAgdGl0bGU6IFwiWmVuaXRoV29ybGQgV0lLSVwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiWmVuaXRoV29ybGQgT3JpZ2luYWwgV29ybGRidWlsZGluZyBXSUtJXCIsXG4gICAgfSxcbiAgICBcIi9cIjoge1xuICAgICAgbGFuZzogXCJ6aC1DTlwiLFxuICAgICAgdGl0bGU6IFwiXHU1REM1XHU1Q0YwXHU0RTE2XHU3NTRDXCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJaZW5pdGhXb3JsZCBcdTUzOUZcdTUyMUJcdTRFMTZcdTc1NENcdTg5QzJcdTc2N0VcdTc5RDFcIixcbiAgICB9LFxuICB9LFxuXG4gIHRoZW1lLFxuICBcbiAgYnVuZGxlcjogdml0ZUJ1bmRsZXIoKSwgLy8gXHUyMTkwIFx1NjMwN1x1NUI5QVx1NjI1M1x1NTMwNVx1NTY2OFxuXG4gIFxuXG4gIC8vIEVuYWJsZSBpdCB3aXRoIHB3YVxuICAvLyBzaG91bGRQcmVmZXRjaDogZmFsc2UsXG59KTtcblxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOi9Vc2Vycy9zdXBlci9aZW5pdGhXb3JsZC93aWtpLy52dWVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc3VwZXJcXFxcWmVuaXRoV29ybGRcXFxcd2lraVxcXFwudnVlcHJlc3NcXFxcdGhlbWUudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3N1cGVyL1plbml0aFdvcmxkL3dpa2kvLnZ1ZXByZXNzL3RoZW1lLnRzXCI7aW1wb3J0IHsgaG9wZVRoZW1lIH0gZnJvbSBcInZ1ZXByZXNzLXRoZW1lLWhvcGVcIjtcbmltcG9ydCB7IGVuTmF2YmFyLCB6aE5hdmJhciB9IGZyb20gXCIuL25hdmJhci9pbmRleC5qc1wiO1xuaW1wb3J0IHsgZW5TaWRlYmFyLCB6aFNpZGViYXIgfSBmcm9tIFwiLi9zaWRlYmFyL2luZGV4LmpzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGhvcGVUaGVtZSh7XG4gIC8vIFx1RDgzQ1x1REYwRCBcdTdBRDlcdTcwQjlcdTRFM0JcdTY3M0FcdTU0MERcbiAgaG9zdG5hbWU6IFwiaHR0cHM6Ly96ZW5pdGh3b3JsZC5jb21cIixcblxuICAvLyBcdUQ4M0RcdURDNjQgXHU0RjVDXHU4MDA1XHU0RkUxXHU2MDZGXG4gIGF1dGhvcjoge1xuICAgIG5hbWU6IFwieGFuYWR1NTkwXCIsXG4gIH0sXG5cbiAgLy8gXHU5ODc1XHU5NzYyXHU0RkUxXHU2MDZGXHU1QzU1XHU3OTNBXHU5ODc5XHVGRjA4XHU2M0E3XHU1MjM2XHU2NTg3XHU3QUUwXHU5ODc2XHU5MEU4XHU2NjNFXHU3OTNBXHU3Njg0XHU1MTQzXHU0RkUxXHU2MDZGXHVGRjA5XG4gIHBhZ2VJbmZvOltcIkF1dGhvclwiLCBcIkRhdGVcIiwgXCJDYXRlZ29yeVwiLCBcIlRhZ1wiLCBcIldvcmRcIiwgXCJSZWFkaW5nVGltZVwiXSxcblxuICAvLyBcdTdGNTFcdTdBRDkgbG9nb1xuICBsb2dvOiBcIi9pbWFnZXMvTE9HTy1saWdodC5qcGdcIixcblxuICAvLyBcdTRFRTNcdTc4MDFcdTRFRDNcdTVFOTNcdUZGMDhcdTc1MjhcdTRFOEVcdTdGMTZcdThGOTFcdTk0RkVcdTYzQTVcdTYyMTZcdThERjNcdThGNkNcdTUyMzAgR2l0SHViXHVGRjA5XG4gIHJlcG86IFwieGFuYWR1NTkwL1plbml0aFdvcmxkXCIsXG5cbiAgLy8gXHU2NTg3XHU2ODYzXHU2RTkwXHU3NkVFXHU1RjU1XHVGRjA4XHU3NkY4XHU1QkY5XHU0RUQzXHU1RTkzXHU2ODM5XHU4REVGXHU1Rjg0XHVGRjA5XG4gIGRvY3NEaXI6IFwid2lraVwiLFxuXG4gIGxvY2FsZXM6IHtcbiAgICBcIi9lbi9cIjoge1xuICAgICAgLy8gXHU4MkYxXHU2NTg3XHU3QUQ5XHU1QkZDXHU4MjJBXHU2ODBGXG4gICAgICBuYXZiYXI6IGVuTmF2YmFyLFxuXG4gICAgICAvLyBcdTgyRjFcdTY1ODdcdTdBRDlcdTRGQTdcdThGQjlcdTY4MEZcbiAgICAgIHNpZGViYXI6IGVuU2lkZWJhcixcblxuICAgICAgZm9vdGVyOiBcIkRlZmF1bHQgZm9vdGVyXCIsIC8vIFx1OTg3NVx1ODExQVx1NjU4N1x1NjcyQ1xuXG4gICAgICBkaXNwbGF5Rm9vdGVyOiB0cnVlLCAvLyBcdTY2MkZcdTU0MjZcdTY2M0VcdTc5M0FcdTk4NzVcdTgxMUFcblxuICAgICAgbWV0YUxvY2FsZXM6IHtcbiAgICAgICAgZWRpdExpbms6IFwiRWRpdCB0aGlzIHBhZ2Ugb24gR2l0SHViXCIsIC8vIFx1MjAxQ1x1N0YxNlx1OEY5MVx1NkI2NFx1OTg3NVx1MjAxRFx1NjMwOVx1OTRBRVx1NjU4N1x1NjcyQ1xuICAgICAgfSxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXHU0RTJEXHU2NTg3XHU4QkVEXHU4QTAwXHU5MTREXHU3RjZFXG4gICAgICovXG4gICAgXCIvXCI6IHtcbiAgICAgIC8vIFx1NEUyRFx1NjU4N1x1NUJGQ1x1ODIyQVx1NjgwRlxuICAgICAgbmF2YmFyOiB6aE5hdmJhcixcblxuICAgICAgLy8gXHU0RTJEXHU2NTg3XHU0RkE3XHU4RkI5XHU2ODBGXG4gICAgICBzaWRlYmFyOiB6aFNpZGViYXIsXG5cbiAgICAgIGZvb3RlcjogXCJcdTlFRDhcdThCQTRcdTk4NzVcdTgxMUFcIiwgLy8gXHU5ODc1XHU4MTFBXHU2NTg3XHU2NzJDXG5cbiAgICAgIGRpc3BsYXlGb290ZXI6IHRydWUsIC8vIFx1NjYyRlx1NTQyNlx1NjYzRVx1NzkzQVx1OTg3NVx1ODExQVxuXG4gICAgICAvLyBcdTk4NzVcdTk3NjJcdTUxNDNcdTRGRTFcdTYwNkZcdTY3MkNcdTU3MzBcdTUzMTZcbiAgICAgIG1ldGFMb2NhbGVzOiB7XG4gICAgICAgIGVkaXRMaW5rOiBcIlx1NTcyOCBHaXRIdWIgXHU0RTBBXHU3RjE2XHU4RjkxXHU2QjY0XHU5ODc1XCIsIC8vIFx1N0YxNlx1OEY5MVx1OTRGRVx1NjNBNVx1NjNEMFx1NzkzQVx1NjU4N1x1NjcyQ1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuXG4gIC8vIFx1RDgzRFx1REQxMiBcdTk4NzVcdTk3NjJcdTUyQTBcdTVCQzZcdTkxNERcdTdGNkVcdUZGMDhcdTc5M0FcdTRGOEJcdUZGMDlcbiAgZW5jcnlwdDoge1xuICAgIGNvbmZpZzoge1xuICAgICAgXCIvZW4vZGVtby9lbmNyeXB0Lmh0bWxcIjoge1xuICAgICAgICBoaW50OiBcIlBhc3N3b3JkOiAxMjM0XCIsIC8vIFx1NUJDNlx1NzgwMVx1NjNEMFx1NzkzQVxuICAgICAgICBwYXNzd29yZDogXCIxMjM0XCIsXG4gICAgICB9LFxuICAgICAgXCIvZGVtby9lbmNyeXB0Lmh0bWxcIjoge1xuICAgICAgICBoaW50OiBcIlBhc3N3b3JkOiAxMjM0XCIsIC8vIFx1NUJDNlx1NzgwMVx1NjNEMFx1NzkzQVxuICAgICAgICBwYXNzd29yZDogXCIxMjM0XCIsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG5cbiAgLy8gXHU0RUU1XHU0RTBCXHU0RTNBXHU2RjE0XHU3OTNBXHU5MTREXHU3RjZFXHVGRjBDXHU3NTFGXHU0RUE3XHU3M0FGXHU1ODgzXHU0RUM1XHU0RkREXHU3NTU5XHU0RjYwXHU5NzAwXHU4OTgxXHU3Njg0XHU5MEU4XHU1MjA2XHU1MjlGXHU4MEZEXG4gIG1hcmtkb3duOiB7XG4gICAgYWxpZ246IHRydWUsICAgICAgICAgLy8gXHU1NDJGXHU3NTI4XHU1QkY5XHU5RjUwXHU4QkVEXHU2Q0Q1XHVGRjA4XHU2NTg3XHU2NzJDXHU1QzQ1XHU0RTJEXHU3QjQ5XHVGRjA5XG4gICAgYXR0cnM6IHRydWUsICAgICAgICAgLy8gXHU1NDJGXHU3NTI4XHU1QzVFXHU2MDI3XHU4QkVEXHU2Q0Q1XHVGRjA4XHU1NzI4IE1hcmtkb3duIFx1NTE0M1x1N0QyMFx1NEUyRFx1NkRGQlx1NTJBMFx1NUM1RVx1NjAyN1x1RkYwOVxuICAgIGNvZGVUYWJzOiB0cnVlLCAgICAgIC8vIFx1NTQyRlx1NzUyOFx1NEVFM1x1NzgwMVx1NTIwNlx1N0VDNFx1NjgwN1x1N0I3RVxuICAgIGNvbXBvbmVudDogdHJ1ZSwgICAgIC8vIFx1NTQyRlx1NzUyOFx1NTcyOCBNYXJrZG93biBcdTRFMkRcdTRGN0ZcdTc1MjggVnVlIFx1N0VDNFx1NEVGNlxuICAgIGRlbW86IHRydWUsICAgICAgICAgIC8vIFx1NTQyRlx1NzUyOCA8RGVtbyAvPiBcdTZGMTRcdTc5M0FcdTU3NTdcbiAgICBmaWd1cmU6IHRydWUsICAgICAgICAvLyBcdTU0MkZcdTc1MjhcdTU2RkVcdTcyNDcgPGZpZ3VyZT4gXHU1MzA1XHU4OEY5XG4gICAgZ2ZtOiB0cnVlLCAgICAgICAgICAgLy8gXHU1NDJGXHU3NTI4IEdpdEh1YiBcdTk4Q0VcdTY4M0MgTWFya2Rvd24gKEdGTSlcbiAgICBpbWdMYXp5bG9hZDogdHJ1ZSwgICAvLyBcdTU2RkVcdTcyNDdcdTYxRDJcdTUyQTBcdThGN0RcbiAgICBpbWdTaXplOiB0cnVlLCAgICAgICAvLyBcdTY1MkZcdTYzMDFcdTYzMDdcdTVCOUFcdTU2RkVcdTcyNDdcdTVDM0FcdTVCRjhcdThCRURcdTZDRDVcbiAgICBpbmNsdWRlOiB0cnVlLCAgICAgICAvLyBcdTY1MkZcdTYzMDEgaW5jbHVkZSBcdTY1ODdcdTRFRjZcdTVGMTVcdTUxNjVcbiAgICBtYXJrOiB0cnVlLCAgICAgICAgICAvLyBcdTU0MkZcdTc1MjggPT1cdTlBRDhcdTRFQUU9PSBcdThCRURcdTZDRDVcbiAgICBwbGFudHVtbDogdHJ1ZSwgICAgICAvLyBcdTU0MkZcdTc1MjggUGxhbnRVTUwgXHU2NTJGXHU2MzAxXG4gICAgc3BvaWxlcjogdHJ1ZSwgICAgICAgLy8gXHU1NDJGXHU3NTI4XHU2Mjk4XHU1M0UwXHU5NjkwXHU4NUNGXHU2NTg3XHU1QjU3XHVGRjA4XHU1MjY3XHU5MDBGXHVGRjA5XHU4QkVEXHU2Q0Q1XG4gICAgc3R5bGl6ZTogW1xuICAgICAge1xuICAgICAgICBtYXRjaGVyOiBcIlJlY29tbWVuZGVkXCIsXG4gICAgICAgIHJlcGxhY2VyOiAoeyB0YWcgfSkgPT4ge1xuICAgICAgICAgIGlmICh0YWcgPT09IFwiZW1cIilcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHRhZzogXCJCYWRnZVwiLFxuICAgICAgICAgICAgICBhdHRyczogeyB0eXBlOiBcInRpcFwiIH0sXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IFwiUmVjb21tZW5kZWRcIiwgLy8gXHU2MjhBICpSZWNvbW1lbmRlZCogXHU2NkZGXHU2MzYyXHU0RTNBXHU0RTAwXHU0RTJBXHU3RUZGXHU4MjcyXHU1RkJEXHU3QUUwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIHN1YjogdHJ1ZSwgICAgICAgICAgIC8vIFx1NTQyRlx1NzUyOFx1NEUwQlx1NjgwN1x1OEJFRFx1NkNENVxuICAgIHN1cDogdHJ1ZSwgICAgICAgICAgIC8vIFx1NTQyRlx1NzUyOFx1NEUwQVx1NjgwN1x1OEJFRFx1NkNENVxuICAgIHRhYnM6IHRydWUsICAgICAgICAgIC8vIFx1NTQyRlx1NzUyOFx1OTAwOVx1OTg3OVx1NTM2MVx1OEJFRFx1NkNENVxuICAgIHRhc2tsaXN0OiB0cnVlLCAgICAgIC8vIFx1NTQyRlx1NzUyOFx1NEVGQlx1NTJBMVx1NTIxN1x1ODg2OFx1OEJFRFx1NkNENVxuICAgIHZQcmU6IHRydWUsICAgICAgICAgIC8vIFx1NTQyRlx1NzUyOCB2LXByZSBcdTRFRTNcdTc4MDFcdThGNkNcdTRFNDlcblxuICAgIC8vIFx1NTk4Mlx1Njc5Q1x1OTcwMFx1ODk4MSBUZVggXHU2NTcwXHU1QjY2XHU1MTZDXHU1RjBGXHU2NTJGXHU2MzAxXHVGRjBDXHU1M0Q2XHU2RDg4XHU2Q0U4XHU5MUNBXHU0RUU1XHU0RTBCXHU1MTg1XHU1QkI5XG4gICAgLy8gbWF0aDoge1xuICAgIC8vICAgLy8gXHU1NDJGXHU3NTI4IEthVGVYXHVGRjA4XHU5NzAwXHU4OTgxXHU1MTQ4XHU1Qjg5XHU4OEM1IGthdGV4XHVGRjA5XG4gICAgLy8gICB0eXBlOiBcImthdGV4XCIsXG4gICAgLy8gICAvLyBcdTYyMTZcdTRGN0ZcdTc1MjggTWF0aEpheFx1RkYwOFx1OTcwMFx1ODk4MVx1NUI4OVx1ODhDNSBtYXRoamF4LWZ1bGxcdUZGMDlcbiAgICAvLyAgIHR5cGU6IFwibWF0aGpheFwiLFxuICAgIC8vIH0sXG5cbiAgICAvLyBcdTU5ODJcdTY3OUNcdTRGNjBcdTVCODlcdTg4QzVcdTRFODYgY2hhcnQuanNcdUZGMENcdTUzRUZcdTRFRTVcdTU0MkZcdTc1MjhcdTU2RkVcdTg4NjhcdTY1MkZcdTYzMDFcbiAgICAvLyBjaGFydGpzOiB0cnVlLFxuXG4gICAgLy8gXHU1OTgyXHU2NzlDXHU0RjYwXHU1Qjg5XHU4OEM1XHU0RTg2IGVjaGFydHNcdUZGMENcdTUzRUZcdTRFRTVcdTU0MkZcdTc1MjhcdTU2RkVcdTg4NjhcdTY1MkZcdTYzMDFcbiAgICAvLyBlY2hhcnRzOiB0cnVlLFxuXG4gICAgLy8gXHU1OTgyXHU2NzlDXHU1Qjg5XHU4OEM1XHU0RTg2IGZsb3djaGFydC50c1x1RkYwQ1x1NTNFRlx1NTQyRlx1NzUyOFx1NkQ0MVx1N0EwQlx1NTZGRVx1NjUyRlx1NjMwMVxuICAgIC8vIGZsb3djaGFydDogdHJ1ZSxcblxuICAgIC8vIFx1NTk4Mlx1Njc5Q1x1NUI4OVx1ODhDNVx1NEU4NiBtZXJtYWlkXHVGRjBDXHU1M0VGXHU1NDJGXHU3NTI4XHU2RDQxXHU3QTBCL1x1NjVGNlx1NUU4Rlx1NTZGRVx1NjUyRlx1NjMwMVxuICAgIC8vIG1lcm1haWQ6IHRydWUsXG5cbiAgICAvLyBwbGF5Z3JvdW5kOiB7XG4gICAgLy8gICBwcmVzZXRzOiBbXCJ0c1wiLCBcInZ1ZVwiXSwgLy8gXHU1NzI4XHU3RUJGXHU0RUUzXHU3ODAxXHU3RjE2XHU4RjkxXHU1NjY4XHU5RUQ4XHU4QkE0XHU4QkVEXHU4QTAwXG4gICAgLy8gfSxcblxuICAgIC8vIFx1NTk4Mlx1Njc5Q1x1NUI4OVx1ODhDNVx1NEU4NiBAdnVlL3JlcGxcdUZGMENcdTUzRUZcdTU0MkZcdTc1MjggVnVlIFx1NTcyOFx1N0VCRlx1NkYxNFx1N0VDM1x1NTczQVxuICAgIC8vIHZ1ZVBsYXlncm91bmQ6IHRydWUsXG5cbiAgICAvLyBcdTU5ODJcdTY3OUNcdTVCODlcdTg4QzVcdTRFODYgc2FuZHBhY2stdnVlM1x1RkYwQ1x1NTNFRlx1NTQyRlx1NzUyOCBTYW5kcGFjayBcdTU3MjhcdTdFQkZcdThGRDBcdTg4NENcdTczQUZcdTU4ODNcbiAgICAvLyBzYW5kcGFjazogdHJ1ZSxcblxuICAgIC8vIFx1NTk4Mlx1Njc5Q1x1NUI4OVx1ODhDNVx1NEU4NiBAdnVlcHJlc3MvcGx1Z2luLXJldmVhbGpzXHVGRjBDXHU1M0VGXHU1NDJGXHU3NTI4XHU1RTdCXHU3MDZGXHU3MjQ3XHU2QTIxXHU1RjBGXG4gICAgLy8gcmV2ZWFsanM6IHtcbiAgICAvLyAgIHBsdWdpbnM6IFtcImhpZ2hsaWdodFwiLCBcIm1hdGhcIiwgXCJzZWFyY2hcIiwgXCJub3Rlc1wiLCBcInpvb21cIl0sIC8vIFx1NTQyRlx1NzUyOFx1NzY4NFx1NUU3Qlx1NzA2Rlx1NzI0N1x1NjNEMlx1NEVGNlxuICAgIC8vIH0sXG4gIH0sXG5cbiAgcGx1Z2luczoge1xuICAgIC8vIEdpdCBcdTYzRDJcdTRFRjZcdTkxNERcdTdGNkVcbiAgICBnaXQ6IHtcbiAgICAgIGNyZWF0ZWRUaW1lOiB0cnVlLCAgICAgLy8gXHU2NjNFXHU3OTNBXHU2NTg3XHU3QUUwXHU1MjFCXHU1RUZBXHU2NUY2XHU5NUY0XG4gICAgICB1cGRhdGVkVGltZTogdHJ1ZSwgICAgIC8vIFx1NjYzRVx1NzkzQVx1NjU4N1x1N0FFMFx1NjcwMFx1NTQwRVx1NjZGNFx1NjVCMFx1NjVGNlx1OTVGNFxuICAgICAgY29udHJpYnV0b3JzOiBmYWxzZSwgICAvLyBcdTRFMERcdTY2M0VcdTc5M0FcdThEMjFcdTczMkVcdTgwMDVcbiAgICB9LFxuXG4gICAgIC8vIFx1MjcwNSBcdTU3MjggdGhlbWUgXHU5MUNDXHU5MTREXHU3RjZFIHNsaW1zZWFyY2hcdUZGMDhcdTRFMERcdTg5ODFcdTU3MjggY29uZmlnLnRzIFx1NTE4RFx1NkNFOFx1NTE4Q1x1RkYwOVxuICAgIHNsaW1zZWFyY2g6IHtcbiAgICAgIGluZGV4Q29udGVudDogdHJ1ZSxcbiAgICAgIGxvY2FsZXM6IHtcbiAgICAgICAgJy8nOiAgICB7IHBsYWNlaG9sZGVyOiAnXHU2NDFDXHU3RDIyXHU2NTg3XHU2ODYzJyB9LFxuICAgICAgICAnL2VuLyc6IHsgcGxhY2Vob2xkZXI6ICdTZWFyY2gnIH0sXG4gICAgICB9LFxuICAgICAgaG90S2V5czogW3sga2V5OiAnaycsIGN0cmw6IHRydWUgfSwgeyBrZXk6ICcvJywgY3RybDogdHJ1ZSB9XSxcbiAgICAgIHF1ZXJ5SGlzdG9yeUNvdW50OiA1LFxuICAgICAgcmVzdWx0SGlzdG9yeUNvdW50OiA1LFxuICAgICAgc2VhcmNoRGVsYXk6IDE1MCxcbiAgICAgIC8vIFx1NTk4Mlx1OTcwMFx1OEZDN1x1NkVFNFx1OTg3NVx1OTc2Mlx1RkYxQWZpbHRlcjogKHBhZ2UpID0+IHBhZ2UucGF0aCAhPT0gJy9kcmFmdHMvJyxcbiAgICB9LFxuXG4gICAgLy8gXHUyNkEwXHVGRTBGIFx1NTk4Mlx1Njc5Q1x1NEU0Qlx1NTI0RFx1OTE0RFx1N0Y2RVx1OEZDNyBzZWFyY2ggXHU2MjE2IHNlYXJjaC1wcm9cdUZGMENcdThCRjdcdTUyMjBcdTk2NjRcdTYyMTZcdTUxNzNcdTk1RURcdUZGMENcdTkwN0ZcdTUxNERcdTUxQjJcdTdBODFcbiAgICAvLyBzZWFyY2g6IGZhbHNlLFxuICAgIC8vICdzZWFyY2gtcHJvJzogZmFsc2UsXG5cbiAgICAvLyBcdUQ4M0RcdURDQUMgXHU4QkM0XHU4QkJBXHU3Q0ZCXHU3RURGXHVGRjA4XHU2QjY0XHU1OTA0XHU0RTNBXHU2RjE0XHU3OTNBXHVGRjBDXHU3NTFGXHU0RUE3XHU3M0FGXHU1ODgzXHU1RkM1XHU5ODdCXHU0RjdGXHU3NTI4XHU4MUVBXHU1REYxXHU3Njg0XHU2NzBEXHU1MkExXHVGRjA5XG4gICAgY29tbWVudDogZmFsc2UsXG5cbiAgICAvLyBcdUQ4M0RcdUREQkNcdUZFMEYgXHU1NkZFXHU3MjQ3XHU5ODg0XHU4OUM4XHU2M0QyXHU0RUY2XHVGRjA4UGhvdG9Td2lwZVx1RkYwOVxuICAgIHBob3RvU3dpcGU6IHtcbiAgICAgIC8vIFx1NTZGRFx1OTY0NVx1NTMxNlx1NjU4N1x1NjcyQ1xuICAgICAgbG9jYWxlczoge1xuICAgICAgICAnL2VuLyc6IHsgY2xvc2U6ICdDbG9zZScsIGZ1bGxzY3JlZW46ICdGdWxsc2NyZWVuJyB9LFxuICAgICAgICAnLyc6IHsgY2xvc2U6ICdcdTUxNzNcdTk1RUQnLCBmdWxsc2NyZWVuOiAnXHU1MTY4XHU1QzRGJyB9LFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgLy8gXHU1MTg1XHU3RjZFXHU3RUM0XHU0RUY2XHU2Q0U4XHU1MThDXG4gICAgY29tcG9uZW50czoge1xuICAgICAgY29tcG9uZW50czogW1wiQmFkZ2VcIiwgXCJWUENhcmRcIl0sIC8vIFx1NTQyRlx1NzUyOFx1NUZCRFx1N0FFMFx1NEUwRVx1NTM2MVx1NzI0N1x1N0VDNFx1NEVGNlxuICAgIH0sXG5cbiAgICAvLyBcdTU2RkVcdTY4MDdcdTUyNERcdTdGMDBcdThCQkVcdTdGNkVcbiAgICBpY29uOiB7XG4gICAgICBwcmVmaXg6IFwiZmE2LXNvbGlkOlwiLCAvLyBcdTRGN0ZcdTc1MjggRm9udCBBd2Vzb21lIDYgXHU1QjlFXHU1RkMzXHU1NkZFXHU2ODA3XG4gICAgfSxcblxuICAgIC8vIFx1MjcwNSBcdTZFMTBcdThGREJcdTVGMEYgV2ViIFx1NUU5NFx1NzUyOFx1RkYwOFBXQVx1RkYwOVx1OTE0RFx1N0Y2RVx1RkYwOFx1NTk4Mlx1OTcwMFx1NzlCQlx1N0VCRlx1NEUwRVx1Njg0Q1x1OTc2Mlx1NUI4OVx1ODhDNVx1NTI5Rlx1ODBGRFx1RkYwOVxuICAgIC8vIFx1NEY3Rlx1NzUyOFx1NTI0RFx1OEJGN1x1NUI4OVx1ODhDNSBAdnVlcHJlc3MvcGx1Z2luLXB3YVxuICAgIC8vIHB3YToge1xuICAgIC8vICAgZmF2aWNvbjogXCIvZmF2aWNvbi5pY29cIiwgICAgICAgLy8gXHU3RjUxXHU3QUQ5XHU1NkZFXHU2ODA3XG4gICAgLy8gICBjYWNoZUhUTUw6IHRydWUsICAgICAgICAgICAgICAgLy8gXHU3RjEzXHU1QjU4IEhUTUwgXHU5ODc1XHU5NzYyXG4gICAgLy8gICBjYWNoZUltYWdlOiB0cnVlLCAgICAgICAgICAgICAgLy8gXHU3RjEzXHU1QjU4XHU1NkZFXHU3MjQ3XG4gICAgLy8gICBhcHBlbmRCYXNlOiB0cnVlLCAgICAgICAgICAgICAgLy8gXHU4MUVBXHU1MkE4XHU2REZCXHU1MkEwIGJhc2UgXHU1MjREXHU3RjAwXG4gICAgLy8gICBhcHBsZToge1xuICAgIC8vICAgICBpY29uOiBcIi9hc3NldHMvaWNvbi9hcHBsZS1pY29uLTE1Mi5wbmdcIixcbiAgICAvLyAgICAgc3RhdHVzQmFyQ29sb3I6IFwiYmxhY2tcIiwgICAgIC8vIGlPUyBcdTcyQjZcdTYwMDFcdTY4MEZcdTk4OUNcdTgyNzJcbiAgICAvLyAgIH0sXG4gICAgLy8gICBtc1RpbGU6IHtcbiAgICAvLyAgICAgaW1hZ2U6IFwiL2Fzc2V0cy9pY29uL21zLWljb24tMTQ0LnBuZ1wiLFxuICAgIC8vICAgICBjb2xvcjogXCIjZmZmZmZmXCIsICAgICAgICAgICAgLy8gV2luZG93cyBcdTc4QzFcdThEMzRcdTk4OUNcdTgyNzJcbiAgICAvLyAgIH0sXG4gICAgLy8gICBtYW5pZmVzdDoge1xuICAgIC8vICAgICBpY29uczogWyAgICAgICAgICAgICAgICAgICAgIC8vIFx1NTQwNFx1NzlDRFx1NUMzQVx1NUJGOFx1NzY4NFx1NTZGRVx1NjgwN1xuICAgIC8vICAgICAgIHsgc3JjOiBcIi9hc3NldHMvaWNvbi9jaHJvbWUtbWFzay01MTIucG5nXCIsIHNpemVzOiBcIjUxMng1MTJcIiwgcHVycG9zZTogXCJtYXNrYWJsZVwiLCB0eXBlOiBcImltYWdlL3BuZ1wiIH0sXG4gICAgLy8gICAgICAgeyBzcmM6IFwiL2Fzc2V0cy9pY29uL2Nocm9tZS1tYXNrLTE5Mi5wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiLCBwdXJwb3NlOiBcIm1hc2thYmxlXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSxcbiAgICAvLyAgICAgICB7IHNyYzogXCIvYXNzZXRzL2ljb24vY2hyb21lLTUxMi5wbmdcIiwgc2l6ZXM6IFwiNTEyeDUxMlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiIH0sXG4gICAgLy8gICAgICAgeyBzcmM6IFwiL2Fzc2V0cy9pY29uL2Nocm9tZS0xOTIucG5nXCIsIHNpemVzOiBcIjE5MngxOTJcIiwgdHlwZTogXCJpbWFnZS9wbmdcIiB9LFxuICAgIC8vICAgICBdLFxuICAgIC8vICAgICBzaG9ydGN1dHM6IFsgICAgICAgICAgICAgICAgIC8vIFx1Njg0Q1x1OTc2Mlx1NUZFQlx1NjM3N1x1NjVCOVx1NUYwRlx1OTE0RFx1N0Y2RVxuICAgIC8vICAgICAgIHtcbiAgICAvLyAgICAgICAgIG5hbWU6IFwiRGVtb1wiLFxuICAgIC8vICAgICAgICAgc2hvcnRfbmFtZTogXCJEZW1vXCIsXG4gICAgLy8gICAgICAgICB1cmw6IFwiL2RlbW8vXCIsXG4gICAgLy8gICAgICAgICBpY29uczogW1xuICAgIC8vICAgICAgICAgICB7XG4gICAgLy8gICAgICAgICAgICAgc3JjOiBcIi9hc3NldHMvaWNvbi9ndWlkZS1tYXNrYWJsZS5wbmdcIixcbiAgICAvLyAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgLy8gICAgICAgICAgICAgcHVycG9zZTogXCJtYXNrYWJsZVwiLFxuICAgIC8vICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgLy8gICAgICAgICAgIH0sXG4gICAgLy8gICAgICAgICBdLFxuICAgIC8vICAgICAgIH0sXG4gICAgLy8gICAgIF0sXG4gICAgLy8gICB9LFxuICAgIC8vIH0sXG4gIH0sXG59KTsiLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6L1VzZXJzL3N1cGVyL1plbml0aFdvcmxkL3dpa2kvLnZ1ZXByZXNzL25hdmJhclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc3VwZXJcXFxcWmVuaXRoV29ybGRcXFxcd2lraVxcXFwudnVlcHJlc3NcXFxcbmF2YmFyXFxcXGVuLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9zdXBlci9aZW5pdGhXb3JsZC93aWtpLy52dWVwcmVzcy9uYXZiYXIvZW4udHNcIjtpbXBvcnQgeyBuYXZiYXIgfSBmcm9tIFwidnVlcHJlc3MtdGhlbWUtaG9wZVwiO1xuXG5leHBvcnQgY29uc3QgZW5OYXZiYXIgPSBuYXZiYXIoW1xuICBcIi9lbi9cIixcbl0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOi9Vc2Vycy9zdXBlci9aZW5pdGhXb3JsZC93aWtpLy52dWVwcmVzcy9uYXZiYXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHN1cGVyXFxcXFplbml0aFdvcmxkXFxcXHdpa2lcXFxcLnZ1ZXByZXNzXFxcXG5hdmJhclxcXFx6aC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc3VwZXIvWmVuaXRoV29ybGQvd2lraS8udnVlcHJlc3MvbmF2YmFyL3poLnRzXCI7aW1wb3J0IHsgbmF2YmFyIH0gZnJvbSBcInZ1ZXByZXNzLXRoZW1lLWhvcGVcIjtcblxuZXhwb3J0IGNvbnN0IHpoTmF2YmFyID0gbmF2YmFyKFtcbiAgXCIvXCIsXG5dKTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzovVXNlcnMvc3VwZXIvWmVuaXRoV29ybGQvd2lraS8udnVlcHJlc3Mvc2lkZWJhclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc3VwZXJcXFxcWmVuaXRoV29ybGRcXFxcd2lraVxcXFwudnVlcHJlc3NcXFxcc2lkZWJhclxcXFxlbi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc3VwZXIvWmVuaXRoV29ybGQvd2lraS8udnVlcHJlc3Mvc2lkZWJhci9lbi50c1wiO2ltcG9ydCB7IHNpZGViYXIgfSBmcm9tIFwidnVlcHJlc3MtdGhlbWUtaG9wZVwiO1xuXG5leHBvcnQgY29uc3QgZW5TaWRlYmFyID0gc2lkZWJhcih7XG4gIFwiL2VuL1wiOiBbXG4gICAgXG4gIF0sXG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzovVXNlcnMvc3VwZXIvWmVuaXRoV29ybGQvd2lraS8udnVlcHJlc3Mvc2lkZWJhclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc3VwZXJcXFxcWmVuaXRoV29ybGRcXFxcd2lraVxcXFwudnVlcHJlc3NcXFxcc2lkZWJhclxcXFx6aC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc3VwZXIvWmVuaXRoV29ybGQvd2lraS8udnVlcHJlc3Mvc2lkZWJhci96aC50c1wiO2ltcG9ydCB7IHNpZGViYXIgfSBmcm9tIFwidnVlcHJlc3MtdGhlbWUtaG9wZVwiO1xuXG5leHBvcnQgY29uc3QgemhTaWRlYmFyID0gc2lkZWJhcih7XG4gIFwiL1wiOiBbXG5cbiAgXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwUyxTQUFTLHdCQUF3Qjs7O0FDQW5DLFNBQVMsaUJBQWlCOzs7QUNBVixTQUFTLGNBQWM7QUFFeFUsSUFBTSxXQUFXLE9BQU87QUFBQSxFQUM3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QUEsSUFHQSxZQUFZO0FBQUEsTUFDVixjQUFjO0FBQUEsTUFDZCxTQUFTO0FBQUEsUUFDUCxLQUFRLEVBQUUsYUFBYSwyQkFBTztBQUFBLFFBQzlCLFFBQVEsRUFBRSxhQUFhLFNBQVM7QUFBQSxNQUNsQztBQUFBLE1BQ0EsU0FBUyxDQUFDLEVBQUUsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLEVBQUUsS0FBSyxLQUFLLE1BQU0sS0FBSyxDQUFDO0FBQUEsTUFDNUQsbUJBQW1CO0FBQUEsTUFDbkIsb0JBQW9CO0FBQUEsTUFDcEIsYUFBYTtBQUFBO0FBQUEsSUFFZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFPQSxTQUFTO0FBQUE7QUFBQSxJQUdULFlBQVk7QUFBQTtBQUFBLE1BRVYsU0FBUztBQUFBLFFBQ1AsUUFBUSxFQUFFLE9BQU8sU0FBUyxZQUFZLGFBQWE7QUFBQSxRQUNuRCxLQUFLLEVBQUUsT0FBTyxnQkFBTSxZQUFZLGVBQUs7QUFBQSxNQUN2QztBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsWUFBWTtBQUFBLE1BQ1YsWUFBWSxDQUFDLFNBQVMsUUFBUTtBQUFBO0FBQUEsSUFDaEM7QUFBQTtBQUFBLElBR0EsTUFBTTtBQUFBLE1BQ0osUUFBUTtBQUFBO0FBQUEsSUFDVjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBeUNGO0FBQ0YsQ0FBQzs7O0FEdk9ELFNBQVMsbUJBQW1CO0FBRTVCLElBQU0sU0FBUyxRQUFRLElBQUksYUFBYTtBQUV4QyxJQUFPLGlCQUFRLGlCQUFpQjtBQUFBLEVBQzlCLE1BQU8sU0FBUyxrQkFBa0I7QUFBQSxFQUVsQyxTQUFTO0FBQUEsSUFDUCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsTUFDUCxhQUFhO0FBQUEsSUFDZjtBQUFBLElBQ0EsS0FBSztBQUFBLE1BQ0gsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsYUFBYTtBQUFBLElBQ2Y7QUFBQSxFQUNGO0FBQUEsRUFFQTtBQUFBLEVBRUEsU0FBUyxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBTXZCLENBQUM7IiwKICAibmFtZXMiOiBbIm5hdmJhciIsICJuYXZiYXIiLCAic2lkZWJhciIsICJzaWRlYmFyIl0KfQo=
