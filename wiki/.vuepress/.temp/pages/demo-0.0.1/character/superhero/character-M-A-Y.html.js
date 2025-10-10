import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-M-A-Y.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/character/superhero/character-M-A-Y.html\",\"title\":\"[月者五][M-A-Y]\",\"lang\":\"zh-CN\",\"frontmatter\":{\"sidebar\":false,\"description\":\"[月者五][M-A-Y] 基本信息 姓名：梅小满\"},\"git\":{\"createdTime\":1759711076000,\"updatedTime\":1759715346000},\"readingTime\":{\"minutes\":0.06,\"words\":17},\"filePathRelative\":\"demo-0.0.1/character/superhero/character-M-A-Y.md\",\"autoDesc\":true}")
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
