export const categoriesMap = JSON.parse("{\"category\":{\"/\":{\"path\":\"/category/\",\"map\":{\"人类\":{\"path\":\"/category/%E4%BA%BA%E7%B1%BB/\",\"indexes\":[0,1,2,3,4,5]},\"英雄\":{\"path\":\"/category/%E8%8B%B1%E9%9B%84/\",\"indexes\":[0,1,2,3,4,5]},\"异能者\":{\"path\":\"/category/%E5%BC%82%E8%83%BD%E8%80%85/\",\"indexes\":[0,1,5]},\"魔法少女\":{\"path\":\"/category/%E9%AD%94%E6%B3%95%E5%B0%91%E5%A5%B3/\",\"indexes\":[4]},\"神明代理\":{\"path\":\"/category/%E7%A5%9E%E6%98%8E%E4%BB%A3%E7%90%86/\",\"indexes\":[4]},\"黑科技使用者\":{\"path\":\"/category/%E9%BB%91%E7%A7%91%E6%8A%80%E4%BD%BF%E7%94%A8%E8%80%85/\",\"indexes\":[2]},\"魔法师\":{\"path\":\"/category/%E9%AD%94%E6%B3%95%E5%B8%88/\",\"indexes\":[3]},\"组织\":{\"path\":\"/category/%E7%BB%84%E7%BB%87/\",\"indexes\":[6]},\"官方\":{\"path\":\"/category/%E5%AE%98%E6%96%B9/\",\"indexes\":[6]}}},\"/en/\":{\"path\":\"/en/category/\",\"map\":{}}},\"tag\":{\"/\":{\"path\":\"/tag/\",\"map\":{\"灵动骑士\":{\"path\":\"/tag/%E7%81%B5%E5%8A%A8%E9%AA%91%E5%A3%AB/\",\"indexes\":[5]},\"世界英雄\":{\"path\":\"/tag/%E4%B8%96%E7%95%8C%E8%8B%B1%E9%9B%84/\",\"indexes\":[0,1,2,3,4,5]},\"魔法少女\":{\"path\":\"/tag/%E9%AD%94%E6%B3%95%E5%B0%91%E5%A5%B3/\",\"indexes\":[4]},\"神明代理\":{\"path\":\"/tag/%E7%A5%9E%E6%98%8E%E4%BB%A3%E7%90%86/\",\"indexes\":[4]},\"神明\":{\"path\":\"/tag/%E7%A5%9E%E6%98%8E/\",\"indexes\":[7]},\"国际\":{\"path\":\"/tag/%E5%9B%BD%E9%99%85/\",\"indexes\":[6]}}},\"/en/\":{\"path\":\"/en/tag/\",\"map\":{}}}}");

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
  if (__VUE_HMR_RUNTIME__.updateBlogCategory)
    __VUE_HMR_RUNTIME__.updateBlogCategory(categoriesMap);
}

if (import.meta.hot)
  import.meta.hot.accept(({ categoriesMap }) => {
    __VUE_HMR_RUNTIME__.updateBlogCategory(categoriesMap);
  });

