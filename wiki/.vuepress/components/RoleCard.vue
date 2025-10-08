<template>
  <!-- 
    外层：如果传了 to，就整个卡片可点击；否则只是一个普通容器。
    ✅ 为了不影响原有类名，这里仅把 class 从固定字符串换成了动态数组：
       - 默认仍然是 'role-card'
       - 当传入 stacked 时，会额外加上 'stacked'，只影响新增的上下分段布局样式
  -->
  <component
    :is="to ? 'a' : 'div'"
    :class="['role-card', { stacked }]"
    :href="to || undefined"
    :style="cardStyle"
    role="link"
    tabindex="0"
    @keydown.enter.prevent="to && go(to)"
  >

    <!-- ============ 保留原功能：左右两列（左图右文） ============ -->
    <template v-if="!stacked">
      <!-- 左列：固定尺寸的立绘盒子（任何大图都会被缩放进来） -->
      <div class="left">
        <img
          v-if="avatar"
          class="avatar"
          :src="avatar"
          alt="角色立绘"
          loading="lazy"
        />
        <!-- 图片下方：不太重要/较多文字的区域（能力 + 简介） -->
        <div class="extra">
          <div v-if="abilities?.length" class="abilities">
            <b>能力：</b>
            <ul>
              <li v-for="(a, i) in abilities" :key="i">
                <template v-if="isLinkObj(a)">
                  <a :href="a.href" @click.stop>{{ a.text }}</a >
                </template>
                <template v-else>{{ a }}</template>
              </li>
            </ul>
          </div>

          <div v-if="summary" class="summary">
            <b>简介：</b>
            <p>{{ summary }}</p >
          </div>
        </div>
      </div>

      <!-- 右列：关键信息（可带链接） -->
      <div class="right">
        <h2 class="title">
          <template v-if="isLinkObj(title)">
            <a :href="title.href" @click.stop>{{ title.text }}</a >
          </template>
          <template v-else>{{ title }}</template>
        </h2>

        <ul class="meta">
          <li v-if="alias">
            <span class="k">别名</span>
            <span class="v">
              <template v-if="isLinkObj(alias)">
                <a :href="alias.href" @click.stop>{{ alias.text }}</a >
              </template>
              <template v-else>{{ alias }}</template>
            </span>
          </li>

          <li v-if="faction">
            <span class="k">阵营</span>
            <span class="v">
              <template v-if="isLinkObj(faction)">
                <a :href="faction.href" @click.stop>{{ faction.text }}</a >
              </template>
              <template v-else>{{ faction }}</template>
            </span>
          </li>

          <li v-if="status">
            <span class="k">状态</span>
            <span class="v">
              <template v-if="isLinkObj(status)">
                <a :href="status.href" @click.stop>{{ status.text }}</a >
              </template>
              <template v-else>{{ status }}</template>
            </span>
          </li>

          <li v-if="firstAppearance">
            <span class="k">出场</span>
            <span class="v">
              <template v-if="isLinkObj(firstAppearance)">
                <a :href="firstAppearance.href" @click.stop>{{ firstAppearance.text }}</a >
              </template>
              <template v-else>{{ firstAppearance }}</template>
            </span>
          </li>
        </ul>
      </div>
    </template>

    <!-- ============ 新增功能：上下两段（上：图+基本信息；下：能力+简介） ============ -->
    <template v-else>
      <!-- 顶部：图片 + 基本信息（横向排） -->
      <div class="top">
        <img
          v-if="avatar"
          class="avatar"
          :src="avatar"
          alt="角色立绘"
          loading="lazy"
        />
        <div class="basic">
          <h2 class="title">
            <template v-if="isLinkObj(title)">
              <a :href="title.href" @click.stop>{{ title.text }}</a >
            </template>
            <template v-else>{{ title }}</template>
          </h2>

          <ul class="meta"> <!-- 一行一项 -->
            <li v-if="alias">
              <span class="k">别名</span>
              <span class="v">
                <template v-if="isLinkObj(alias)">
                  <a :href="alias.href" @click.stop>{{ alias.text }}</a >
                </template>
                <template v-else>{{ alias }}</template>
              </span>
            </li>

            <li v-if="faction">
              <span class="k">阵营</span>
              <span class="v">
                <template v-if="isLinkObj(faction)">
                  <a :href="faction.href" @click.stop>{{ faction.text }}</a >
                </template>
                <template v-else>{{ faction }}</template>
              </span>
            </li>

            <li v-if="status">
              <span class="k">状态</span>
              <span class="v">
                <template v-if="isLinkObj(status)">
                  <a :href="status.href" @click.stop>{{ status.text }}</a >
                </template>
                <template v-else>{{ status }}</template>
              </span>
            </li>

            <li v-if="firstAppearance">
              <span class="k">出场</span>
              <span class="v">
                <template v-if="isLinkObj(firstAppearance)">
                  <a :href="firstAppearance.href" @click.stop>{{ firstAppearance.text }}</a >
                </template>
                <template v-else>{{ firstAppearance }}</template>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 底部：整行展示能力 + 简介 -->
      <div class="bottom">
        <div v-if="abilities?.length" class="abilities">
          <b>能力：</b>
          <ul>
            <li v-for="(a, i) in abilities" :key="i">
              <template v-if="isLinkObj(a)">
                <a :href="a.href" @click.stop>{{ a.text }}</a >
              </template>
              <template v-else>{{ a }}</template>
            </li>
          </ul>
        </div>

        <div v-if="summary" class="summary">
          <b>简介：</b>
          <p>{{ summary }}</p >
        </div>
      </div>
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * 类型：允许字段既可以是字符串，也可以是 { text, href } 这样的链接对象
 */
type MaybeLink = string | { text: string; href: string }

/**
 * 组件 Props：
 * - 固定尺寸：width/height（默认 320×480 —— 保持你的默认值不变）
 * - 图片盒尺寸：avatarWidth / avatarHeight（默认 160×240）
 * - to：整卡点击跳转
 * - stacked：是否上下分段布局（默认 false，保留原来的左右布局）
 */
const props = withDefaults(defineProps<{
  title: MaybeLink
  avatar?: string
  alias?: MaybeLink
  faction?: MaybeLink
  status?: MaybeLink
  firstAppearance?: MaybeLink
  abilities?: MaybeLink[]
  summary?: string
  to?: string
  width?: number
  height?: number
  avatarWidth?: number
  avatarHeight?: number
  stacked?: boolean
}>(), {
  width: 220,
  height: 330,
  avatarWidth: 100,
  avatarHeight: 150,
  stacked: false,
})

/** 小工具：判断一个值是不是 { text, href } 结构 */
const isLinkObj = (v: unknown): v is { text: string; href: string } =>
  !!v && typeof v === 'object' && 'text' in (v as any) && 'href' in (v as any)

/** 导航函数（用于键盘回车） */
const go = (href: string) => { window.location.assign(href) }

/**
 * 把卡片尺寸 + 头像尺寸传入：
 * - 卡片尺寸走内联 style（固定宽高）
 * - 头像尺寸用 CSS 变量传给 .avatar，这样不改模板也能统一生效
 * - ★ 新增：--avatar-pos 可以全局/局部定制裁剪重心（如 50% 35%）
 */
const cardStyle = {
  width: `${props.width}px`,
  height: `${props.height}px`,
  '--avatar-w': `${props.avatarWidth}px`,
  '--avatar-h': `${props.avatarHeight}px`,
  '--avatar-pos': '50% 50%', // ★ 新增：默认裁剪重心在正中（可根据需要改为 50% 35%）
} as Record<string, string>;

const { stacked } = props
</script>

<style scoped>
/* ===========================
   1) 卡片整体容器（固定宽高）
   =========================== */
.role-card{
  display: grid;
  grid-template-columns: /* 左列固定，右列自适应 */ auto 1fr;
  grid-template-rows: auto;        /* 一行布局（下面的 extra 在左列内部） */
  gap: 12px 16px;
  padding: 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
  text-decoration: none;            /* 当 <a> 使用时，去掉默认下划线 */
  color: var(--c-text, #111);
  overflow: hidden;                 /* 固定尺寸时避免内容溢出 */
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}
.role-card:hover{
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
  border-color: var(--c-border, #d6dee6);
}

/* 暗色主题适配 */
html[data-theme="dark"] .role-card{
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* ===========================
   2) 左列：图片 + 额外信息（能力/简介）
   =========================== */
.left{
  display: flex;
  flex-direction: column;   /* 图片在上，extra 在下 */
  align-items: center;
  width: max-content;       /* 由头像尺寸决定宽度 */
}

/* 固定头像盒子，任何大图都会“等比缩放 + 居中裁剪”填满 */
.avatar{
  width: 100px;
  height: 150px;
  object-fit: cover;             /* ★ 变更：由 contain 改为 cover（先缩放后裁剪） */
  object-position: var(--avatar-pos, 50% 50%); /* ★ 新增：裁剪重心，可全局/局部覆盖 */
  background: #f2f3f5;           /* 占位底色 */
  border-radius: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
}

/* 图片下方的额外信息区域：给定最大宽度，避免左列过宽 */
.extra{
  margin-top: 10px;
  width: 100%;
  max-width: 220px;               /* 可按需调整 */
}

.abilities ul{
  margin: 6px 0 0 16px;
}
.summary{
  margin-top: 6px;
}
.summary p{
  margin: 2px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;          /* 最多显示三行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===========================
   3) 右列：关键信息（你已改为一行一项）
   =========================== */
.right{
  min-width: 0;                   /* 让内容在固定宽度下可收缩 */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.title{
  font-size: 20px;
  line-height: 1.2;
  margin: 2px 0 10px;
  font-weight: 700;
}
.title a{
  color: inherit;
  text-decoration: none;
}

.title a:hover{
  text-decoration: none;
}

/* 关键信息：一行一行纵向排列（保持你的现状） */
.meta{
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.meta li{
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.5;
}
.meta .k{
  flex: none;
  font-weight: 600;
  color: var(--c-text-light, #65758b);
}
.meta .v{
  flex: 1;
  min-width: 0;
}
.meta .v a{
  color: var(--c-brand, #3eaf7c);
  text-decoration: none;
}
.meta .v a:hover{
  text-decoration: none;
}

/* ===========================
   4) 新增：上下分段布局的样式覆盖
   说明：
   - 不改变默认 .role-card 的网格布局
   - 当有 .stacked 类时，改为上下两段（flex 列方向）
   =========================== */
.role-card.stacked{
  display: flex;              /* 覆盖 grid → flex 列方向 */
  flex-direction: column;
  gap: 12px;                  /* 上下两段间距 */
}
.role-card.stacked .top{
  display: flex;              /* 顶部：图片 + 基本信息横排 */
  align-items: flex-start;
  gap: 10px;
}
.role-card.stacked .basic{
  flex: 1;
  min-width: 0;
}
.role-card.stacked .bottom{
  /* 底部整行展示能力/简介，无需额外样式 */
}

/* ===========================
   5) 交互细节：让内链有手型；避免整卡 hover 改内链色
   =========================== */
.role-card a{
  cursor: pointer;
}

/* 全局缩小这张卡片内的字体（不会影响别的组件） */
.role-card {
  font-size: 0.7rem;   /* 0.9、0.875… 看效果微调 */
}
.title { font-size: 13px; }   /* 之前是 20px，可等比调小 */
.meta { gap: 8px; }           /* 行距也可略缩小 */

</style>