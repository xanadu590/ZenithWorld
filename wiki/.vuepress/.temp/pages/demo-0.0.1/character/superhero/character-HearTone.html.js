import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-HearTone.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/character/superhero/character-HearTone.html\",\"title\":\"[赤听][HearTone]\",\"lang\":\"zh-CN\",\"frontmatter\":{\"sidebar\":false,\"description\":\"[赤听][HearTone] 基本信息 姓名：尹守 性别：男 英雄名：天灾（Scourge) 昵称：后宫男 年龄：26\"},\"git\":{\"createdTime\":1759644953000,\"updatedTime\":1759645096000},\"readingTime\":{\"minutes\":0.1,\"words\":30},\"filePathRelative\":\"demo-0.0.1/character/superhero/character-HearTone.md\",\"autoDesc\":true}")
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
