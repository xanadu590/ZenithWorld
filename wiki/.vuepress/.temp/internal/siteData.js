export const siteData = JSON.parse("{\"base\":\"/\",\"lang\":\"en-US\",\"title\":\"\",\"description\":\"\",\"head\":[[\"script\",{},\"\\n      (function() {\\n        try {\\n          // theme-hope 默认用这个 key 记录主题\\n          var saved = localStorage.getItem('vuepress-theme-appearance');\\n          var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');\\n          var html = document.documentElement;\\n          html.setAttribute('data-theme', theme);\\n          html.style.colorScheme = theme; // 让滚动条等原生控件也跟随\\n        } catch (e) {}\\n      })();\\n      \"]],\"locales\":{\"/en/\":{\"lang\":\"en-US\",\"title\":\"ZenithWorld WIKI\",\"description\":\"ZenithWorld Original Worldbuilding WIKI\"},\"/\":{\"lang\":\"zh-CN\",\"title\":\"巅峰世界\",\"description\":\"ZenithWorld 原创世界观百科\"}}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateSiteData) {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ siteData }) => {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  })
}
