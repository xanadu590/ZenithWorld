import comp from "C:/Users/super/ZenithWorld/src/.vuepress/.temp/pages/demo-0.0.1/角色介绍/superhero.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/%E8%A7%92%E8%89%B2%E4%BB%8B%E7%BB%8D/superhero.html\",\"title\":\"超级英雄\",\"lang\":\"zh-CN\",\"frontmatter\":{\"description\":\"超级英雄 是指拥有超凡能力，凭借强烈的正义感或使命感，以打击邪恶、保护民众为目标的正义人士。\"},\"readingTime\":{\"minutes\":0.22,\"words\":66},\"filePathRelative\":\"demo-0.0.1/角色介绍/superhero.md\",\"autoDesc\":true}")
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
