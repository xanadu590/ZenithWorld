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
  />
  <!-- 4. 灵动骑士（完整版，可点击跳转） -->
  <RoleCard
    stacked
    :width="220"
    :height="330"
    :avatarWidth="100"
    :avatarHeight="150"
    title="灵动骑士"
    avatar="/images/EtherealKnightCombatSuit.jpg"
    alias="Ether Knight"
    faction="中域团体"
    status="在世"
    :abilities="['风元素强化', '轻盈术（滑翔）']"
    firstAppearance="2024-11-01"
    to="/demo-0.0.1/character/superhero/character-EtherealKnight.html"
  />
</div>
<RandomArticleCard /></div></template>


