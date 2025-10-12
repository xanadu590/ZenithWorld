import { hopeTheme } from "vuepress-theme-hope";
import { enNavbar, zhNavbar } from "./navbar/index.js";
import { enSidebar, zhSidebar } from "./sidebar/index.js";

export default hopeTheme({
  // 🌍 站点主机名
  hostname: "https://zenithworld.com",

  // 👤 作者信息
  author: {
    name: "xanadu590",
  },

  // 页面信息展示项（控制文章顶部显示的元信息）
  pageInfo:["Author", "Date", "Category", "Tag", "Word", "ReadingTime"],

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

      footer: "Default footer", // 页脚文本

      displayFooter: true, // 是否显示页脚

      metaLocales: {
        editLink: "Edit this page on GitHub", // “编辑此页”按钮文本
      },
    },

    /**
     * 中文语言配置
     */
    "/": {
      // 中文导航栏
      navbar: zhNavbar,

      // 中文侧边栏
      sidebar: zhSidebar,

      footer: "默认页脚", // 页脚文本

      displayFooter: true, // 是否显示页脚

      // 页面元信息本地化
      metaLocales: {
        editLink: "在 GitHub 上编辑此页", // 编辑链接提示文本
      },
    },
  },

  // 🔒 页面加密配置（示例）
  encrypt: {
    config: {
      "/en/demo/encrypt.html": {
        hint: "Password: 1234", // 密码提示
        password: "1234",
      },
      "/demo/encrypt.html": {
        hint: "Password: 1234", // 密码提示
        password: "1234",
      },
    },
  },

  // 以下为演示配置，生产环境仅保留你需要的部分功能
  markdown: {
    align: true,         // 启用对齐语法（文本居中等）
    attrs: true,         // 启用属性语法（在 Markdown 元素中添加属性）
    codeTabs: true,      // 启用代码分组标签
    component: true,     // 启用在 Markdown 中使用 Vue 组件
    demo: true,          // 启用 <Demo /> 演示块
    figure: true,        // 启用图片 <figure> 包裹
    gfm: true,           // 启用 GitHub 风格 Markdown (GFM)
    imgLazyload: true,   // 图片懒加载
    imgSize: true,       // 支持指定图片尺寸语法
    include: true,       // 支持 include 文件引入
    mark: true,          // 启用 ==高亮== 语法
    plantuml: true,      // 启用 PlantUML 支持
    spoiler: true,       // 启用折叠隐藏文字（剧透）语法
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended", // 把 *Recommended* 替换为一个绿色徽章
            };
        },
      },
    ],
    sub: true,           // 启用下标语法
    sup: true,           // 启用上标语法
    tabs: true,          // 启用选项卡语法
    tasklist: true,      // 启用任务列表语法
    vPre: true,          // 启用 v-pre 代码转义

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
      createdTime: true,     // 显示文章创建时间
      updatedTime: true,     // 显示文章最后更新时间
      contributors: false,   // 不显示贡献者
    },

    // ✅ slimsearch 搜索插件配置（简洁本地搜索）
    slimsearch: {
      indexContent: true, // 是否索引正文内容（默认 false）

      // 搜索框占位符的本地化
      locales: {
        '/en/': { placeholder: 'Search' },
        '/': { placeholder: '搜索文档' },
      },

      // 搜索框快捷键 —— 通过对象方式定义，避免 TS 报错
      hotKeys: [
        { key: 'k', ctrl: true }, // Ctrl + K 打开搜索
        { key: '/', ctrl: true }, // Ctrl + / 打开搜索
      ],

      // 搜索历史记录与延迟设置
      queryHistoryCount: 5, // 搜索历史条目数
      resultHistoryCount: 5, // 搜索结果缓存条目数
      searchDelay: 150, // 防抖延时（毫秒）

      // 过滤：可排除不希望被索引的页面
      // filter: (page) => page.path !== '/drafts/',

      // 针对中文等需要分词的情况，可设置 indexOptions 或 indexLocaleOptions
      // indexOptions: { ... },
      // indexLocaleOptions: { '/zh/': { ... } },
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
        '/en/': { close: 'Close', fullscreen: 'Fullscreen' },
        '/': { close: '关闭', fullscreen: '全屏' },
      },
    },

    // 内置组件注册
    components: {
      components: ["Badge", "VPCard"], // 启用徽章与卡片组件
    },

    // 图标前缀设置
    icon: {
      prefix: "fa6-solid:", // 使用 Font Awesome 6 实心图标
    },

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
  },
});