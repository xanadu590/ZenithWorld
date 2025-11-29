import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/worldmap.html.vue"
const data = JSON.parse("{\"path\":\"/docs/world/worldmap.html\",\"title\":\"世界地图\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"世界地图\",\"sidebar\":false},\"git\":{},\"readingTime\":{\"minutes\":0.23,\"words\":70},\"filePathRelative\":\"docs/world/worldmap.md\"}")
export { comp, data }

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
