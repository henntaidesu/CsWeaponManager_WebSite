<template>
  <div class="automation-container">
    <!-- 二级左侧栏 -->
    <aside class="secondary-sidebar">
      <div class="sidebar-header">
        <h2>任务分类</h2>
      </div>
      
      <ul class="category-list">
        <li 
          v-for="category in categories" 
          :key="category.id"
          :class="{ active: selectedCategory === category.id }"
          @click="selectCategory(category.id)"
        >
          <el-icon :size="18">
            <component :is="category.icon" />
          </el-icon>
          <span>{{ category.name }}</span>
          <el-badge v-if="category.count > 0" :value="category.count" class="badge" />
        </li>
      </ul>
    </aside>

    <!-- 主内容区域 -->
    <div class="main-wrapper">
      <div class="page-header">
        <h1>{{ currentCategoryName }}</h1>
        <p>{{ currentCategoryDescription }}</p>
      </div>

      <div class="automation-content">
      <!-- 任务列表 -->
      <div class="task-section">
        <h2 class="section-title">自动化任务</h2>
        
        <div class="task-list">
          <div class="empty-state" v-if="filteredTasks.length === 0">
            <el-empty description="暂无自动化任务">
              <el-button type="primary" @click="showAddTaskDialog = true">
                <el-icon><Plus /></el-icon>
                创建第一个任务
              </el-button>
            </el-empty>
          </div>

          <div v-else class="task-cards">
            <div 
              v-for="task in filteredTasks" 
              :key="task.id"
              class="task-card"
              :class="{ active: task.enabled }"
            >
              <div class="task-header">
                <div class="task-info">
                  <h3>{{ task.name }}</h3>
                  <el-tag :type="task.enabled ? 'success' : 'info'" size="small">
                    {{ task.enabled ? '运行中' : '已停止' }}
                  </el-tag>
                </div>
                <div class="task-actions">
                  <el-switch
                    v-model="task.enabled"
                    @change="toggleTask(task)"
                    :disabled="isTaskRunning(task.id)"
                  />
                </div>
              </div>

              <div class="task-body">
                <p class="task-description">{{ task.description }}</p>
                <div class="task-meta">
                  <span><strong>类型：</strong>{{ getTaskTypeLabel(task.type) }}</span>
                  <span><strong>间隔：</strong>{{ task.interval }} 分钟</span>
                  <span><strong>最后运行：</strong>{{ formatTime(task.lastRun) }}</span>
                </div>
              </div>

              <div class="task-footer">
                <el-button size="small" @click="editTask(task)">编辑</el-button>
                <el-button size="small" type="primary" @click="runTask(task)" :loading="isTaskRunning(task.id)">
                  立即运行
                </el-button>
                <el-button size="small" type="danger" @click="deleteTask(task)">删除</el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="add-task-button" v-if="filteredTasks.length > 0">
          <el-button type="primary" @click="showAddTaskDialog = true">
            <el-icon><Plus /></el-icon>
            添加任务
          </el-button>
        </div>
      </div>

      <!-- 任务日志 -->
      <div class="log-section">
        <h2 class="section-title">任务日志</h2>
        <div class="log-list">
          <div v-if="logs.length === 0" class="empty-state">
            <el-empty description="暂无日志" :image-size="100" />
          </div>
          <div v-else class="log-items">
            <div v-for="log in logs" :key="log.id" class="log-item" :class="log.status">
              <div class="log-time">{{ formatTime(log.timestamp) }}</div>
              <div class="log-content">
                <strong>{{ log.taskName }}</strong>
                <span>{{ log.message }}</span>
              </div>
              <el-tag :type="log.status === 'success' ? 'success' : 'danger'" size="small">
                {{ log.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 添加/编辑任务对话框 -->
    <el-dialog
      v-model="showAddTaskDialog"
      :title="editingTask ? '编辑任务' : '添加任务'"
      width="600px"
    >
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>

        <el-form-item label="任务类型" required>
          <el-select v-model="taskForm.type" placeholder="选择任务类型" style="width: 100%;">
            <el-option label="自动购买" value="auto_buy" />
            <el-option label="自动出售" value="auto_sell" />
            <el-option label="价格监控" value="price_monitor" />
            <el-option label="库存同步" value="inventory_sync" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行间隔" required>
          <el-input-number v-model="taskForm.interval" :min="1" :max="1440" />
          <span style="margin-left: 10px; color: #909399;">分钟</span>
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>

        <el-form-item label="启用任务">
          <el-switch v-model="taskForm.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTask">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  List, 
  ShoppingCart, 
  Sell, 
  TrendCharts, 
  RefreshRight 
} from '@element-plus/icons-vue'

export default {
  name: 'Automation',
  components: {
    Plus,
    List,
    ShoppingCart,
    Sell,
    TrendCharts,
    RefreshRight
  },
  setup() {
    const tasks = ref([])
    const logs = ref([])
    const showAddTaskDialog = ref(false)
    const editingTask = ref(null)
    const runningTasks = ref(new Set())
    const selectedCategory = ref('all')

    const taskForm = ref({
      name: '',
      type: '',
      interval: 30,
      description: '',
      enabled: true
    })

    // 分类配置
    const categories = computed(() => [
      {
        id: 'all',
        name: '全部任务',
        icon: 'List',
        count: tasks.value.length,
        description: '查看和管理所有自动化任务'
      },
      {
        id: 'auto_buy',
        name: '自动购买',
        icon: 'ShoppingCart',
        count: tasks.value.filter(t => t.type === 'auto_buy').length,
        description: '自动监控并购买符合条件的饰品'
      },
      {
        id: 'auto_sell',
        name: '自动出售',
        icon: 'Sell',
        count: tasks.value.filter(t => t.type === 'auto_sell').length,
        description: '自动出售库存中的饰品'
      },
      {
        id: 'price_monitor',
        name: '价格监控',
        icon: 'TrendCharts',
        count: tasks.value.filter(t => t.type === 'price_monitor').length,
        description: '监控饰品价格变动并发送通知'
      },
      {
        id: 'inventory_sync',
        name: '库存同步',
        icon: 'RefreshRight',
        count: tasks.value.filter(t => t.type === 'inventory_sync').length,
        description: '定期同步Steam库存数据'
      }
    ])

    // 当前分类名称
    const currentCategoryName = computed(() => {
      const category = categories.value.find(c => c.id === selectedCategory.value)
      return category ? category.name : '全部任务'
    })

    // 当前分类描述
    const currentCategoryDescription = computed(() => {
      const category = categories.value.find(c => c.id === selectedCategory.value)
      return category ? category.description : '查看和管理所有自动化任务'
    })

    // 过滤后的任务列表
    const filteredTasks = computed(() => {
      if (selectedCategory.value === 'all') {
        return tasks.value
      }
      return tasks.value.filter(t => t.type === selectedCategory.value)
    })

    // 选择分类
    const selectCategory = (categoryId) => {
      selectedCategory.value = categoryId
    }

    // 获取任务类型标签
    const getTaskTypeLabel = (type) => {
      const labels = {
        auto_buy: '自动购买',
        auto_sell: '自动出售',
        price_monitor: '价格监控',
        inventory_sync: '库存同步'
      }
      return labels[type] || type
    }

    // 格式化时间
    const formatTime = (time) => {
      if (!time) return '从未运行'
      const date = new Date(time)
      return date.toLocaleString('zh-CN')
    }

    // 检查任务是否正在运行
    const isTaskRunning = (taskId) => {
      return runningTasks.value.has(taskId)
    }

    // 切换任务状态
    const toggleTask = async (task) => {
      try {
        // TODO: 调用后端API
        ElMessage.success(`任务已${task.enabled ? '启用' : '停用'}`)
      } catch (error) {
        console.error('切换任务状态失败:', error)
        ElMessage.error('操作失败')
        task.enabled = !task.enabled
      }
    }

    // 运行任务
    const runTask = async (task) => {
      runningTasks.value.add(task.id)
      try {
        // TODO: 调用后端API
        await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟
        
        ElMessage.success('任务执行成功')
        
        // 添加日志
        logs.value.unshift({
          id: Date.now(),
          taskName: task.name,
          message: '任务执行完成',
          status: 'success',
          timestamp: new Date().toISOString()
        })
        
        task.lastRun = new Date().toISOString()
      } catch (error) {
        console.error('运行任务失败:', error)
        ElMessage.error('任务执行失败')
        
        logs.value.unshift({
          id: Date.now(),
          taskName: task.name,
          message: error.message || '任务执行失败',
          status: 'error',
          timestamp: new Date().toISOString()
        })
      } finally {
        runningTasks.value.delete(task.id)
      }
    }

    // 编辑任务
    const editTask = (task) => {
      editingTask.value = task
      taskForm.value = { ...task }
      showAddTaskDialog.value = true
    }

    // 删除任务
    const deleteTask = async (task) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除任务"${task.name}"吗？`,
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        // TODO: 调用后端API
        const index = tasks.value.findIndex(t => t.id === task.id)
        if (index > -1) {
          tasks.value.splice(index, 1)
        }
        
        ElMessage.success('删除成功')
      } catch {
        // 用户取消
      }
    }

    // 保存任务
    const saveTask = async () => {
      if (!taskForm.value.name || !taskForm.value.type) {
        ElMessage.warning('请填写必要信息')
        return
      }

      try {
        // TODO: 调用后端API
        if (editingTask.value) {
          // 更新任务
          const index = tasks.value.findIndex(t => t.id === editingTask.value.id)
          if (index > -1) {
            tasks.value[index] = { ...tasks.value[index], ...taskForm.value }
          }
          ElMessage.success('更新成功')
        } else {
          // 添加任务
          tasks.value.push({
            id: Date.now(),
            ...taskForm.value,
            lastRun: null
          })
          ElMessage.success('添加成功')
        }

        showAddTaskDialog.value = false
        editingTask.value = null
        resetForm()
      } catch (error) {
        console.error('保存任务失败:', error)
        ElMessage.error('保存失败')
      }
    }

    // 重置表单
    const resetForm = () => {
      taskForm.value = {
        name: '',
        type: '',
        interval: 30,
        description: '',
        enabled: true
      }
    }

    // 加载任务列表
    const loadTasks = async () => {
      try {
        // TODO: 调用后端API加载任务
        // 模拟数据
        tasks.value = []
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    }

    onMounted(() => {
      loadTasks()
    })

    return {
      tasks,
      logs,
      showAddTaskDialog,
      editingTask,
      taskForm,
      runningTasks,
      categories,
      selectedCategory,
      currentCategoryName,
      currentCategoryDescription,
      filteredTasks,
      selectCategory,
      getTaskTypeLabel,
      formatTime,
      isTaskRunning,
      toggleTask,
      runTask,
      editTask,
      deleteTask,
      saveTask
    }
  }
}
</script>

<style scoped>
.automation-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

/* 二级左侧栏 */
.secondary-sidebar {
  width: 240px;
  background: linear-gradient(180deg, #2a2a2a 0%, #1e1e1e 100%);
  border-right: 1px solid #3a3a3a;
  padding: 1.5rem 0;
  overflow-y: auto;
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

.category-list li .badge {
  margin-left: auto;
}

/* 主内容区域包装器 */
.main-wrapper {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.page-header p {
  color: #b0b0b0;
  margin: 0;
  font-size: 0.95rem;
}

.automation-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.section-title {
  font-size: 1.25rem;
  color: #ffffff;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #409eff;
  font-weight: 600;
}

.task-section,
.log-section {
  background: linear-gradient(135deg, #2a2a2a 0%, #242424 100%);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a3a;
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.task-cards {
  display: grid;
  gap: 1rem;
}

.task-card {
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s;
  background: linear-gradient(135deg, #333333 0%, #2a2a2a 100%);
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  border-color: #409eff;
  transform: translateY(-2px);
}

.task-card.active {
  border-color: #67c23a;
  background: linear-gradient(135deg, #1e3a1e 0%, #2a3f2a 100%);
  box-shadow: 0 0 15px rgba(103, 194, 58, 0.3);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.task-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #ffffff;
  font-weight: 600;
}

.task-body {
  margin-bottom: 1rem;
}

.task-description {
  color: #b0b0b0;
  margin: 0 0 0.5rem 0;
}

.task-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  color: #888888;
}

.task-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #3a3a3a;
}

.add-task-button {
  margin-top: 1rem;
  text-align: center;
}

.log-list {
  max-height: 600px;
  overflow-y: auto;
}

.log-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: #333333;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  transition: all 0.2s;
}

.log-item:hover {
  background-color: #3a3a3a;
}

.log-item.success {
  border-left-color: #67c23a;
}

.log-item.error {
  border-left-color: #f56c6c;
}

.log-time {
  font-size: 0.75rem;
  color: #888888;
  white-space: nowrap;
}

.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.log-content strong {
  color: #ffffff;
  font-weight: 600;
}

.log-content span {
  font-size: 0.875rem;
  color: #b0b0b0;
}

@media (max-width: 1024px) {
  .automation-content {
    grid-template-columns: 1fr;
  }
}
</style>

