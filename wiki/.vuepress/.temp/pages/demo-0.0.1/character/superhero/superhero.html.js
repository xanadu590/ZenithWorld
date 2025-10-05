import comp from "C:/Users/super/ZenithWorld/src/.vuepress/.temp/pages/demo-0.0.1/character/superhero/superhero.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/character/superhero/superhero.html\",\"title\":\"超级英雄\",\"lang\":\"zh-CN\",\"frontmatter\":{\"sidebar\":false,\"description\":\"超级英雄 是指拥有超凡能力，凭借强烈的正义感或使命感，以打击邪恶、保护民众为目标的正义人士。\"},\"readingTime\":{\"minutes\":0.19,\"words\":58},\"filePathRelative\":\"demo-0.0.1/character/superhero/superhero.md\",\"autoDesc\":true}")
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
