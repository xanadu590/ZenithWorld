<template>
  <!-- 
    时间线组件（Timeline）
    功能：按时间顺序展示一系列事件或发展节点。
    每个时间节点包括日期（date）、标题（title）、详情（detail）。
  -->
  <div class="timeline">
    <!-- v-for 循环渲染每一个时间节点 -->
    <div
      v-for="item in items"
      :key="item.date"
      class="timeline-item"
    >
      <!-- 左侧显示时间 -->
      <div class="timeline-date">{{ item.date }}</div>

      <!-- 右侧显示标题和详情 -->
      <div class="timeline-content">
        <h3>{{ item.title }}</h3>
        <p>{{ item.detail }}</p >
      </div>
    </div>
  </div>
</template>

<script setup>
/*
  Props 定义：
  items：必填，类型为数组。
  数组中每个对象应包含以下字段：
    {
      date: string,    // 日期文本（显示在时间线上）
      title: string,   // 节点标题
      detail: string   // 节点详情描述
    }
*/
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
/*
  ==========================
  Timeline 整体布局样式
  ==========================
*/
.timeline {
  border-left: 2px solid #999;       /* 左侧主线 */
  margin: 20px;                      /* 外边距 */
  padding-left: 20px;                /* 给时间节点留出空间 */
}

/*
  ==========================
  单个时间节点容器
  ==========================
*/
.timeline-item {
  margin-bottom: 20px;               /* 节点间距 */
  position: relative;                /* 用于定位伪元素 */
}

/*
  节点圆点（通过伪元素绘制）
*/
.timeline-item::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;                /* 圆形 */
  background: var(--c-brand);        /* 使用主题主色 */
  position: absolute;
  left: -6px;                        /* 与左边线对齐 */
  top: 6px;                          /* 对齐文字顶部 */
}

/*
  日期文本
*/
.timeline-date {
  font-weight: bold;
  margin-bottom: 4px;
}

/*
  节点内容（标题与详情）
*/
.timeline-content h3 {
  margin: 0;
  color: var(--c-text-accent);       /* 使用强调色 */
}
</style>