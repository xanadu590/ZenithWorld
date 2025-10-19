<template><div><div class="role-grid">
  <!-- 1. 灵动骑士（简版） -->
  <RoleCard
    stacked
    title="灵动骑士"
    avatar="/images/EtherealKnight/CombatSuit.jpg"
    :abilities="['风元素强化']"
  />
  <!-- 2. 舒雪 -->
  <RoleCard
    stacked
    title="舒雪"
    avatar="/images/roles/shu-xue.png"
    :abilities="['潜入', '情报']"
  />
  <!-- 3. 韩桉宁 -->
  <RoleCard
    stacked
    title="韩桉宁"
    avatar="/images/roles/han-anning.png"
    :abilities="['支援']"
    to="/demo-0.0.1/character/superhero/1.html"
  />
  <RoleCard
  :stacked="true"
  :titleOnTop="true"
  to="/demo-0.0.1/character/superhero/character-EtherealKnight.html"
  title="灵动骑士"
  avatar="/images/EtherealKnightCombatSuit.jpg"
  :metaFields="[
    { label: '别名', value: 'E-Knight' },
    { label: '常驻', value: { text: '腾海市', href: '/groups/mid.html' } },
    { label: '身高', value: '174cm' },
    { label: '体重', value: '57kg' },
    { label: '能力', value: '游戏降生' },
    { label: '出场', value: '2024-11-01' }
  ]"
  :bottomItems="[
    { label: '能力',  list: ['风元素强化','轻盈术（滑翔）'] },
    { label: '装备',  list: ['以太剑','风灵披风'] },
    { label: '语录',  content: '“在风中前行，是自由的证明。”' }
  ]"
/>
<RoleCard
  :stacked="true"
  :titleOnTop="true"
  :title="{ text: '尹旷林', href: '/characters/yin-kuanglin.html' }"
  avatar="/images/chars/yin-kuanglin.png"
  to="/characters/yin-kuanglin.html"
  :metaFields="[
    { label: '别名', value: '天灾' },
    { label: '阵营', value: { text: '灵动骑士团', href: '/factions/knight.html' } },
    { label: '状态', value: '生存' },
    { label: '出场', value: '《新科城·第一章》' }
  ]"
  :bottomItems="[
    { label: '能力', list: ['气血强化', '痛觉回馈', { text: '共鸣爆发', href: '/skills/resonance.html' }] },
    { label: '简介', content: '灵动骑士团的现任队长，以战斗直觉著称。' }
  ]"
  :style="{
    '--card-title-color': '#d12d2d',
    '--card-meta-gap': '5px',
    '--card-bottom-bg': 'rgba(209,45,45,0.1)'
  }"
/>
</div>
<!-- 问答卡片（无头像，只显示问答） -->
<ClientOnly>
  <PersonaQACard sourceId="qa-bank" :allowNext="true" :randomOnMount="true" />
</ClientOnly>
<!-- 同页问答库：用 textarea 承载 JSON -->
<textarea id="qa-bank" style="display:none;">
[
  { "q": "你会救小猫吗？", "a": "可爱的就会。" },
  { "q": "你的弱点是什么？", "a": "我不喜欢让朋友失望。" },
  { "q": "遇到困难会怎么做？", "a": "先冷静，再分析，再行动。" }
]
</textarea>
<RandomCard /></div></template>


