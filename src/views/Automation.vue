<template>
  <div class="automation-container">
    <!-- 二级左侧栏 -->
    <aside class="secondary-sidebar">
      <div class="sidebar-header">
        <h2>自动化工具</h2>
      </div>
      
      <ul class="category-list">
        <li 
          :class="{ active: selectedCategory === 'spider_rename' }"
          @click="selectCategory('spider_rename')"
        >
          <el-icon :size="18">
            <EditPen />
          </el-icon>
          <span>爬取改名</span>
        </li>
      </ul>
    </aside>

    <!-- 主内容区域 -->
    <div class="main-wrapper">
      <!-- 爬取改名页面 -->
      <SpiderWeaponRenameContent v-if="selectedCategory === 'spider_rename'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { EditPen } from '@element-plus/icons-vue'
import SpiderWeaponRenameContent from './SpiderWeaponRename.vue'

const selectedCategory = ref('spider_rename')

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
}
</script>

<style scoped>
.automation-container {
  display: flex;
  min-height: 100vh;
  background: transparent;
}

/* 二级左侧栏 */
.secondary-sidebar {
  width: 240px;
  background: transparent;
  border-right: 1px solid #3a3a3a;
  padding: 1.5rem 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.secondary-sidebar .sidebar-header {
  padding: 0 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #3a3a3a;
  margin-bottom: 1rem;
}

.secondary-sidebar .sidebar-header h2 {
  font-size: 1.125rem;
  color: #ffffff;
  margin: 0;
  font-weight: 600;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.category-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  color: #b0b0b0;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.category-list li:hover {
  background-color: #333333;
  color: #ffffff;
}

.category-list li.active {
  background-color: #409eff;
  color: #ffffff;
  font-weight: 600;
}

.category-list li.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #66b1ff;
}

.category-list li span {
  flex: 1;
}

/* 主内容区域包装器 */
.main-wrapper {
  flex: 1;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .secondary-sidebar {
    width: 180px;
  }

  .secondary-sidebar .sidebar-header h2 {
    font-size: 1rem;
  }

  .category-list li {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}

/* 深色主题滚动条 */
.secondary-sidebar::-webkit-scrollbar {
  width: 6px;
}

.secondary-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.secondary-sidebar::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 3px;
}

.secondary-sidebar::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}

.main-wrapper::-webkit-scrollbar {
  width: 8px;
}

.main-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.main-wrapper::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.main-wrapper::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}
</style>

