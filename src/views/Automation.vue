<template>
  <div class="automation-container">
    <!-- 二级左侧栏 -->
    <aside class="secondary-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 折叠/展开按钮 -->
      <div class="toggle-button" @click="toggleSidebar">
        <el-icon :size="20">
          <DArrowLeft v-if="!sidebarCollapsed" />
          <DArrowRight v-else />
        </el-icon>
      </div>

      <div class="sidebar-content">
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
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="main-wrapper" :class="{ expanded: sidebarCollapsed }">
      <!-- 爬取改名页面 -->
      <SpiderWeaponRenameContent v-if="selectedCategory === 'spider_rename'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { EditPen, DArrowLeft, DArrowRight } from '@element-plus/icons-vue'
import SpiderWeaponRenameContent from './SpiderWeaponRename.vue'

const selectedCategory = ref('spider_rename')
const sidebarCollapsed = ref(false)

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style scoped>
.automation-container {
  display: flex;
  min-height: 100vh;
  background: transparent;
  position: relative;
}

/* 二级左侧栏 */
.secondary-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background: linear-gradient(90deg, rgba(30, 30, 30, 0.98) 0%, rgba(30, 30, 30, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-right: 1px solid #3a3a3a;
  overflow: hidden;
  display: flex;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(0);
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

.secondary-sidebar.collapsed {
  transform: translateX(-240px);
}

/* 折叠/展开按钮 */
.toggle-button {
  position: absolute;
  right: -36px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 80px;
  background: linear-gradient(90deg, rgba(30, 30, 30, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%);
  border: 1px solid #3a3a3a;
  border-left: none;
  border-radius: 0 12px 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #b0b0b0;
  z-index: 101;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
}

.toggle-button:hover {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.3) 100%);
  color: #409eff;
  border-color: #409eff;
  right: -38px;
  box-shadow: 2px 0 12px rgba(64, 158, 255, 0.4);
}

.toggle-button .el-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 侧边栏内容 */
.sidebar-content {
  flex: 1;
  padding: 1.5rem 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 0 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #3a3a3a;
  margin-bottom: 1rem;
}

.sidebar-header h2 {
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
  margin-left: 240px;
  overflow-y: auto;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-wrapper.expanded {
  margin-left: 0;
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

