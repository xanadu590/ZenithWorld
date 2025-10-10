import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/1.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/character/superhero/1.html\",\"title\":\"[1][WizardHope]\",\"lang\":\"zh-CN\",\"frontmatter\":{\"sidebar\":false,\"description\":\"[1][WizardHope] 基本信息 姓名：\"},\"git\":{},\"readingTime\":{\"minutes\":0.03,\"words\":10},\"filePathRelative\":\"demo-0.0.1/character/superhero/1.md\",\"autoDesc\":true}")
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
