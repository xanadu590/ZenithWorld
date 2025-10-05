export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/portfolio.html", { loader: () => import(/* webpackChunkName: "portfolio.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/portfolio.html.js"), meta: {"title":"档案主页","icon":"house"} }],
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/index.html.js"), meta: {"title":"巅峰世界","icon":"house"} }],
  ["/demo/disable.html", { loader: () => import(/* webpackChunkName: "demo_disable.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo/disable.html.js"), meta: {"title":"布局与功能禁用","icon":"gears","order":4} }],
  ["/demo/encrypt.html", { loader: () => import(/* webpackChunkName: "demo_encrypt.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo/encrypt.html.js"), meta: {"title":"密码加密的文章","icon":"lock"} }],
  ["/demo/layout.html", { loader: () => import(/* webpackChunkName: "demo_layout.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo/layout.html.js"), meta: {"title":"布局","icon":"object-group","order":2} }],
  ["/demo/markdown.html", { loader: () => import(/* webpackChunkName: "demo_markdown.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo/markdown.html.js"), meta: {"title":"Markdown 展示","icon":"fa6-brands:markdown","order":2} }],
  ["/demo/page.html", { loader: () => import(/* webpackChunkName: "demo_page.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo/page.html.js"), meta: {"title":"页面配置","icon":"file","order":3} }],
  ["/demo/", { loader: () => import(/* webpackChunkName: "demo_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo/index.html.js"), meta: {"title":"主要功能与配置演示","icon":"laptop-code"} }],
  ["/en/portfolio.html", { loader: () => import(/* webpackChunkName: "en_portfolio.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/portfolio.html.js"), meta: {"title":"Portfolio Home","icon":"house"} }],
  ["/en/", { loader: () => import(/* webpackChunkName: "en_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/index.html.js"), meta: {"title":"项目主页","icon":"house"} }],
  ["/demo-0.0.1/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/index.html.js"), meta: {"title":"世界观总览","icon":"laptop-code"} }],
  ["/guide/", { loader: () => import(/* webpackChunkName: "guide_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/guide/index.html.js"), meta: {"title":"指南","icon":"lightbulb"} }],
  ["/en/guide/", { loader: () => import(/* webpackChunkName: "en_guide_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/guide/index.html.js"), meta: {"title":"Guide","icon":"lightbulb"} }],
  ["/en/demo/disable.html", { loader: () => import(/* webpackChunkName: "en_demo_disable.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/demo/disable.html.js"), meta: {"title":"Disabling layout and features","icon":"gears","order":4} }],
  ["/en/demo/encrypt.html", { loader: () => import(/* webpackChunkName: "en_demo_encrypt.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/demo/encrypt.html.js"), meta: {"title":"Encryption Article","icon":"lock"} }],
  ["/en/demo/layout.html", { loader: () => import(/* webpackChunkName: "en_demo_layout.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/demo/layout.html.js"), meta: {"title":"Layout","icon":"object-group","order":2} }],
  ["/en/demo/markdown.html", { loader: () => import(/* webpackChunkName: "en_demo_markdown.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/demo/markdown.html.js"), meta: {"title":"Markdown Enhance","icon":"fa6-brands:markdown","order":2} }],
  ["/en/demo/page.html", { loader: () => import(/* webpackChunkName: "en_demo_page.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/demo/page.html.js"), meta: {"title":"Page Config","icon":"file","order":3} }],
  ["/en/demo/", { loader: () => import(/* webpackChunkName: "en_demo_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/demo/index.html.js"), meta: {"title":"Features demo","icon":"laptop-code"} }],
  ["/demo-0.0.1/character/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/index.html.js"), meta: {"title":"角色介绍","icon":"user"} }],
  ["/guide/bar/baz.html", { loader: () => import(/* webpackChunkName: "guide_bar_baz.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/guide/bar/baz.html.js"), meta: {"title":"Baz","icon":"circle-info"} }],
  ["/guide/bar/", { loader: () => import(/* webpackChunkName: "guide_bar_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/guide/bar/index.html.js"), meta: {"title":"Bar 功能","icon":"lightbulb"} }],
  ["/guide/foo/ray.html", { loader: () => import(/* webpackChunkName: "guide_foo_ray.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/guide/foo/ray.html.js"), meta: {"title":"Ray","icon":"circle-info"} }],
  ["/guide/foo/", { loader: () => import(/* webpackChunkName: "guide_foo_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/guide/foo/index.html.js"), meta: {"title":"Foo 功能","icon":"lightbulb"} }],
  ["/en/guide/bar/baz.html", { loader: () => import(/* webpackChunkName: "en_guide_bar_baz.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/guide/bar/baz.html.js"), meta: {"title":"Baz","icon":"circle-info"} }],
  ["/en/guide/bar/", { loader: () => import(/* webpackChunkName: "en_guide_bar_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/guide/bar/index.html.js"), meta: {"title":"Bar feature","icon":"lightbulb"} }],
  ["/en/guide/foo/ray.html", { loader: () => import(/* webpackChunkName: "en_guide_foo_ray.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/guide/foo/ray.html.js"), meta: {"title":"Ray","icon":"circle-info"} }],
  ["/en/guide/foo/", { loader: () => import(/* webpackChunkName: "en_guide_foo_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/en/guide/foo/index.html.js"), meta: {"title":"Foo feature","icon":"lightbulb"} }],
  ["/demo-0.0.1/character/superhero/character-EtherealKnight.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-EtherealKnight.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-EtherealKnight.html.js"), meta: {"title":"灵动骑士"} }],
  ["/demo-0.0.1/character/superhero/character-Scourge.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-Scourge.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-Scourge.html.js"), meta: {"title":"[天灾][Scourge]"} }],
  ["/demo-0.0.1/character/superhero/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/index.html.js"), meta: {"title":"超级英雄"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateRoutes) {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
  }
  if (__VUE_HMR_RUNTIME__.updateRedirects) {
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ routes, redirects }) => {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  })
}
