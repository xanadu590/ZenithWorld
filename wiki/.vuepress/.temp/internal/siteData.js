export const siteData = JSON.parse("{\"base\":\"/ZenithWorld/\",\"lang\":\"en-US\",\"title\":\"\",\"description\":\"\",\"head\":[],\"locales\":{\"/en/\":{\"lang\":\"en-US\",\"title\":\"ZenithWorld WIKI\",\"description\":\"ZenithWorld Original Worldbuilding WIKI\"},\"/\":{\"lang\":\"zh-CN\",\"title\":\"巅峰世界\",\"description\":\"ZenithWorld 原创世界观百科\"}}}")

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
