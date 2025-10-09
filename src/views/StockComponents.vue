<template>
  <div>
    <!-- 搜索与统计数据 -->
    <div class="stats-summary">
      <div class="card">
        <!-- 搜索栏 -->
        <div class="search-section">
          <div class="flex flex-wrap gap-4 items-center">
            <el-select 
              v-model="selectedSteamId" 
              placeholder="选择Steam账号" 
              class="steam-id-select"
              @change="handleSteamIdChange"
              filterable
            >
              <el-option
                v-for="item in steamIdList"
                :key="item.steam_id"
                :label="`${item.steam_id} (${item.item_count}件)`"
                :value="item.steam_id"
              >
                <span style="float: left">{{ item.steam_id }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                  {{ item.item_count }}件
                </span>
              </el-option>
            </el-select>
            <el-select 
              v-model="selectedComponent" 
              placeholder="选择库存组件（选中后只显示该组件）" 
              class="component-select"
              @change="handleComponentSelect"
              filterable
              clearable
            >
              <el-option
                v-for="item in inventoryComponents"
                :key="item.assetid"
                :label="item.item_name"
                :value="item.assetid"
              >
                <span style="float: left">{{ item.item_name }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                  ID: {{ item.assetid }}
                </span>
              </el-option>
            </el-select>
            <el-input
              v-model="searchText"
              placeholder="搜索组件名称..."
              prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleSearch"
              @clear="handleClearSearch"
              clearable
            />
            <el-button type="primary" @click="handleSearch" :loading="loading">
              搜索
            </el-button>
            <el-button @click="handleClearSearch" :disabled="loading">
              重置
            </el-button>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="search-stats-divider"></div>
        
        <!-- 统计数据 -->
        <div class="stats-container">
          <div class="stats-section">
            <h3>统计数据</h3>
            <div class="stats-grid-3x2">
              <div class="stat-item">
                <span class="stat-label">总组件数量:</span>
                <span class="stat-value">{{ totalStats.totalCount }} 件</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总成本金额:</span>
                <span class="stat-value">¥{{ totalStats.totalCost }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均成本:</span>
                <span class="stat-value">¥{{ totalStats.avgCost }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">库存中:</span>
                <span class="stat-value">{{ totalStats.inStockCount }} 件</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已使用:</span>
                <span class="stat-value">{{ totalStats.usedCount }} 件</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已出售:</span>
                <span class="stat-value">{{ totalStats.soldCount }} 件</span>
              </div>
            </div>
          </div>
          
          <div class="stats-divider"></div>
          
          <div class="stats-section">
            <h3>当前页面统计</h3>
            <div class="stats-grid-3x2">
              <div class="stat-item">
                <span class="stat-label">页面数量:</span>
                <span class="stat-value">{{ currentPageStats.totalCount }} 件</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">页面成本:</span>
                <span class="stat-value">¥{{ currentPageStats.totalCost }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均成本:</span>
                <span class="stat-value">¥{{ currentPageStats.avgCost }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">库存中:</span>
                <span class="stat-value">{{ currentPageStats.inStockCount }} 件</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已使用:</span>
                <span class="stat-value">{{ currentPageStats.usedCount }} 件</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已出售:</span>
                <span class="stat-value">{{ currentPageStats.soldCount }} 件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <div class="pagination pagination-top">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <el-table
        :data="filteredData"
        v-loading="loading"
        element-loading-text="加载中..."
        style="width: 100%"
        :row-style="{ backgroundColor: 'transparent' }"
        :header-row-style="{ backgroundColor: 'var(--bg-tertiary)' }"
        :flexible="true"
        :scrollbar-always-on="true"
      >
        <el-table-column prop="component_id" label="组件ID" width="180" show-overflow-tooltip align="left" />
        <el-table-column prop="component_type" label="组件类型" width="120" />
        <el-table-column prop="component_name" label="组件名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="quality" label="品质等级" min-width="100" />
        <el-table-column prop="quantity" label="数量" min-width="80" align="center">
          <template #default="scope">
            <el-tag :type="getQuantityType(scope.row.quantity)" size="small">
              {{ scope.row.quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit_cost" label="单价" min-width="100">
          <template #default="scope">
            ¥{{ scope.row.unit_cost }}
          </template>
        </el-table-column>
        <el-table-column prop="total_cost" label="总成本" min-width="100">
          <template #default="scope">
            ¥{{ scope.row.total_cost }}
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" min-width="100" />
        <el-table-column prop="purchase_date" label="购入日期" min-width="160">
          <template #default="scope">
            {{ formatTime(scope.row.purchase_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tooltip 
              :content="scope.row.status_desc || scope.row.status" 
              placement="top"
              :disabled="!scope.row.status_desc"
            >
              <span>
                <el-tag 
                  :type="getStatusType(scope.row.status)" 
                  size="small"
                  :style="{
                    backgroundColor: getStatusColor(scope.row.status),
                    borderColor: getStatusColor(scope.row.status),
                    color: getStatusTextColor(scope.row.status)
                  }"
                >
                  {{ scope.row.status }}
                </el-tag>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleUse(scope.row)">
                使用
              </el-button>
              <el-button type="success" size="small" @click="handleSell(scope.row)">
                出售
              </el-button>
              <el-button type="info" size="small" @click="handleViewDetails(scope.row)">
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { API_CONFIG } from '@/config/api.js'

export default {
  name: 'StockComponents',
  setup() {
    const loading = ref(false)
    const componentData = ref([])
    const searchText = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalItems = ref(0)
    const steamIdList = ref([])
    const selectedSteamId = ref('')
    const inventoryComponents = ref([])
    const selectedComponent = ref('')
    
    // API 基础地址
    const API_BASE = `${API_CONFIG.BASE_URL}/webInventoryV1`
    const API_COMPONENTS = `${API_CONFIG.BASE_URL}/webStockComponentsV1`
    
    // classid常量 - 组件的classid
    const COMPONENT_CLASSID = '3604678661'

    const totalStats = ref({
      totalCount: 0,
      totalCost: '0.00',
      avgCost: '0.00',
      inStockCount: 0,
      usedCount: 0,
      soldCount: 0
    })

    const currentPageStats = computed(() => {
      const currentData = filteredData.value
      const totalCount = currentData.length
      const totalCost = currentData.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0).toFixed(2)
      const avgCost = totalCount > 0 ? (totalCost / totalCount).toFixed(2) : '0.00'
      const inStockCount = currentData.filter(item => item.status === '库存中').length
      const usedCount = currentData.filter(item => item.status === '已使用').length
      const soldCount = currentData.filter(item => item.status === '已出售').length

      return {
        totalCount,
        totalCost,
        avgCost,
        inStockCount,
        usedCount,
        soldCount
      }
    })

    const filteredData = computed(() => {
      return componentData.value
    })

    const formatTime = (time) => {
      if (!time) return '-'
      return new Date(time).toLocaleString('zh-CN')
    }

    const getStatusType = (status) => {
      const statusMap = {
        '库存中': 'success',
        '已使用': 'info',
        '已出售': 'warning',
        '已过期': 'danger'
      }
      return statusMap[status] || 'info'
    }

    const getStatusColor = (status) => {
      const colorMap = {
        '库存中': '#52c41a',
        '已使用': '#1890ff',
        '已出售': '#faad14',
        '已过期': '#ff4d4f'
      }
      return colorMap[status] || '#909399'
    }

    const getStatusTextColor = (status) => {
      return '#FFFFFF'
    }

    const getQuantityType = (quantity) => {
      if (quantity === 0) return 'danger'
      if (quantity < 5) return 'warning'
      if (quantity < 10) return 'info'
      return 'success'
    }

    const loadSteamIdList = async () => {
      try {
        // 传递classid参数，只统计库存组件的数量
        const response = await axios.get(`${API_BASE}/steam_ids`, {
          params: {
            classid: COMPONENT_CLASSID
          }
        })
        console.log('Steam ID列表响应:', response.data)
        if (response.data.success) {
          steamIdList.value = response.data.data
          if (steamIdList.value.length > 0) {
            selectedSteamId.value = steamIdList.value[0].steam_id
            console.log('默认选择Steam ID:', selectedSteamId.value)
          } else {
            ElMessage.warning('没有找到Steam账号')
          }
        }
      } catch (error) {
        console.error('加载Steam ID列表失败:', error)
        ElMessage.error('加载Steam ID列表失败: ' + (error.response?.data?.error || error.message))
      }
    }

    const handleSteamIdChange = () => {
      console.log('Steam ID已切换:', selectedSteamId.value)
      selectedComponent.value = ''
      loadInventoryComponents()
      loadComponentData()
    }

    const loadInventoryComponents = async () => {
      if (!selectedSteamId.value) {
        return
      }
      
      try {
        console.log('正在加载库存组件列表，Steam ID:', selectedSteamId.value, 'ClassID:', COMPONENT_CLASSID)
        
        const response = await axios.get(`${API_BASE}/inventory/${selectedSteamId.value}`, {
          params: {
            classid: COMPONENT_CLASSID,
            limit: 9999,
            offset: 0
          }
        })
        
        console.log('库存组件列表响应:', response.data)
        
        if (response.data.success) {
          inventoryComponents.value = response.data.data || []
          console.log(`加载成功，共 ${inventoryComponents.value.length} 个组件`)
        } else {
          console.error('加载库存组件失败:', response.data.error)
          inventoryComponents.value = []
        }
      } catch (error) {
        console.error('加载库存组件失败:', error)
        inventoryComponents.value = []
      }
    }

    const handleComponentSelect = async () => {
      console.log('选择的组件 assetid:', selectedComponent.value)
      
      if (!selectedComponent.value) {
        // 清空选择，重新加载所有组件数据
        loadComponentData()
        return
      }
      
      // 选择了具体组件，只显示这一个组件的数据
      const component = inventoryComponents.value.find(item => item.assetid === selectedComponent.value)
      if (component) {
        loading.value = true
        try {
          // 调用详情接口获取完整信息
          const response = await axios.get(`${API_COMPONENTS}/components/detail/${selectedComponent.value}`)
          
          if (response.data.success) {
            // 只显示选中的这一个组件
            componentData.value = [response.data.data]
            totalItems.value = 1
            currentPage.value = 1
            
            // 更新统计数据为当前选中的组件
            const data = response.data.data
            totalStats.value = {
              totalCount: 1,
              totalCost: (data.total_cost || 0).toFixed(2),
              avgCost: (data.unit_cost || 0).toFixed(2),
              inStockCount: data.status === '库存中' ? 1 : 0,
              usedCount: data.status === '已使用' ? 1 : 0,
              soldCount: data.status === '已出售' ? 1 : 0
            }
            
            ElMessage.success(`已选择组件: ${component.item_name}`)
          } else {
            ElMessage.error('获取组件详情失败')
          }
        } catch (error) {
          console.error('获取组件详情失败:', error)
          ElMessage.error('获取组件详情失败: ' + (error.response?.data?.error || error.message))
        } finally {
          loading.value = false
        }
      }
    }

    const loadComponentData = async () => {
      if (!selectedSteamId.value) {
        ElMessage.warning('请选择Steam账号')
        return
      }
      
      loading.value = true
      try {
        console.log('正在加载组件数据，Steam ID:', selectedSteamId.value)
        
        const response = await axios.get(`${API_COMPONENTS}/components/${selectedSteamId.value}`, {
          params: {
            search: searchText.value,
            page: currentPage.value,
            page_size: pageSize.value
          }
        })
        
        console.log('组件数据响应:', response.data)
        
        if (response.data.success) {
          componentData.value = response.data.data
          totalItems.value = response.data.total
          
          await loadComponentStats()
          
          ElMessage.success(`加载成功，共 ${componentData.value.length} 条记录`)
        } else {
          ElMessage.error(response.data.error || '加载数据失败')
          componentData.value = []
          totalItems.value = 0
        }
      } catch (error) {
        console.error('加载组件数据失败:', error)
        ElMessage.error('加载数据失败: ' + (error.response?.data?.error || error.message))
        componentData.value = []
        totalItems.value = 0
      } finally {
        loading.value = false
      }
    }

    const loadComponentStats = async () => {
      try {
        const response = await axios.get(`${API_COMPONENTS}/components/stats/${selectedSteamId.value}`)
        console.log('统计数据响应:', response.data)
        
        if (response.data.success) {
          const stats = response.data.data
          totalStats.value = {
            totalCount: stats.totalCount || 0,
            totalCost: (stats.totalCost || 0).toFixed(2),
            avgCost: (stats.avgCost || 0).toFixed(2),
            inStockCount: stats.inStockCount || 0,
            usedCount: stats.usedCount || 0,
            soldCount: stats.soldCount || 0
          }
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }

    const handleUse = (item) => {
      ElMessage.info(`准备使用: ${item.component_name}`)
    }

    const handleSell = (item) => {
      ElMessage.info(`准备出售: ${item.component_name}`)
    }

    const handleViewDetails = (item) => {
      ElMessage.info(`查看详情: ${item.component_name}`)
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
      if (!selectedComponent.value) {
        loadComponentData()
      }
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      if (!selectedComponent.value) {
        loadComponentData()
      }
    }

    const handleSearch = () => {
      currentPage.value = 1
      selectedComponent.value = ''
      loadComponentData()
    }

    const handleClearSearch = () => {
      searchText.value = ''
      selectedComponent.value = ''
      currentPage.value = 1
      loadComponentData()
    }

    onMounted(async () => {
      await loadSteamIdList()
      if (selectedSteamId.value) {
        await loadInventoryComponents()
        loadComponentData()
      }
    })

    return {
      loading,
      componentData,
      filteredData,
      totalStats,
      currentPageStats,
      searchText,
      currentPage,
      pageSize,
      totalItems,
      steamIdList,
      selectedSteamId,
      inventoryComponents,
      selectedComponent,
      formatTime,
      getStatusType,
      getStatusColor,
      getStatusTextColor,
      getQuantityType,
      handleUse,
      handleSell,
      handleViewDetails,
      handleSizeChange,
      handleCurrentChange,
      handleSearch,
      handleClearSearch,
      handleSteamIdChange,
      handleComponentSelect
    }
  }
}
</script>

<style scoped>
.steam-id-select {
  min-width: 250px;
  max-width: 350px;
}

.component-select {
  min-width: 300px;
  max-width: 450px;
}

.search-input {
  min-width: 200px;
  flex: 1;
  max-width: 300px;
}

.pagination {
  margin-top: clamp(1rem, 3vw, 1.25rem);
  display: flex;
  justify-content: center;
}

.pagination-top {
  margin-top: 0;
  margin-bottom: clamp(1rem, 3vw, 1.25rem);
}

:deep(.el-pagination) {
  background-color: transparent;
}

:deep(.el-pagination .el-pager li) {
  background-color: transparent;
  color: #fff;
  border: 1px solid #333;
}

:deep(.el-pagination .el-pager li:hover) {
  background-color: #333;
}

:deep(.el-pagination .el-pager li.is-active) {
  background-color: #4CAF50;
  color: #fff;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: transparent;
  color: #fff;
  border: 1px solid #333;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  background-color: #333;
}

:deep(.el-pagination .el-select .el-input__inner) {
  background-color: #484848 !important;
  color: #fff;
  border: 1px solid #333;
}

:deep(.el-pagination .el-input__inner) {
  background-color: #484848 !important;
  color: #fff;
  border: 1px solid #333;
}

:deep(.el-table) {
  background-color: transparent;
  color: #fff;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
}

:deep(.el-table th) {
  background-color: var(--bg-tertiary) !important;
  color: #fff;
  border-bottom: 1px solid var(--border-default);
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
}

:deep(.el-table td) {
  background-color: transparent !important;
  border-bottom: 1px solid var(--border-default);
  color: #fff;
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
}

:deep(.el-table tr:hover > td) {
  background-color: transparent !important;
}

:deep(.el-input__inner) {
  background-color: #1a1a1a;
  border-color: #333;
  color: #fff;
}

:deep(.el-select .el-input__inner) {
  background-color: #1a1a1a;
  border-color: #333;
  color: #fff;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: center;
}

:deep(.el-button) {
  font-size: clamp(0.625rem, 1vw, 0.75rem);
  padding: clamp(0.375rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem);
}

.stats-summary {
  margin-bottom: clamp(1rem, 3vw, 1.25rem);
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-stats-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-default) 20%, var(--border-default) 80%, transparent);
  margin: 1.5rem 0;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-section {
  flex: 1;
}

.stats-section h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  font-weight: 600;
}

.stats-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-default) 20%, var(--border-default) 80%, transparent);
  margin: 0.5rem 0;
}

.stats-grid-3x2 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: clamp(0.75rem, 2vw, 1rem);
  align-items: stretch;
}

@media (min-width: 1024px) {
  .stats-container {
    flex-direction: row;
    gap: 2rem;
    align-items: flex-start;
  }
  
  .stats-divider {
    width: 1px;
    height: auto;
    min-height: 120px;
    background: linear-gradient(180deg, transparent, var(--border-default) 20%, var(--border-default) 80%, transparent);
    margin: 0;
  }
  
  .stats-section {
    flex: 1;
    min-width: 0;
  }
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
  background-color: #2a2a2a;
  border-radius: 0.375rem;
}

.stat-label {
  color: #ccc;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
}

.stat-value {
  font-weight: bold;
  color: #fff;
  font-size: clamp(0.875rem, 1.4vw, 1rem);
}

@media (max-width: 768px) {
  .stats-grid-3x2 {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
  }
  
  .stat-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>

<style>
.el-loading-mask {
  background-color: rgba(26, 26, 26, 0.8) !important;
}

.el-loading-spinner {
  color: #409eff !important;
}

.el-loading-text {
  color: #fff !important;
}
</style>
