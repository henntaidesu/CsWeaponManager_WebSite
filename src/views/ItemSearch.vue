<template>
  <div>
    <!-- 搜索与统计数据 -->
    <div class="stats-summary">
      <div class="card">
        <!-- 搜索栏 -->
        <div class="search-section">
          <div class="all-controls-row">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索饰品名称..."
              prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleSearch"
              @clear="handleClearSearch"
              clearable
            />
            
            <el-button type="primary" @click="handleSearch" :loading="isSearching">
              搜索
            </el-button>
            
            <el-button @click="handleClearSearch" :disabled="isSearching">
              重置
            </el-button>
            
            <el-select 
              v-model="selectedSteamId" 
              placeholder="选择 Steam ID" 
              class="steam-id-select"
              :disabled="isSyncing || isSyncingBuff"
            >
              <el-option 
                v-for="steamId in steamIdList" 
                :key="steamId.steam_id" 
                :label="steamId.steam_id" 
                :value="steamId.steam_id"
              />
            </el-select>
            
            <el-button 
              type="success" 
              @click="syncWeaponTemplates"
              :disabled="!selectedSteamId || isSyncing || isSyncingBuff"
              :loading="isSyncing"
            >
              {{ isSyncing ? '同步中...' : '获取悠悠有品饰品映射' }}
            </el-button>
            
            <el-button 
              type="success" 
              @click="syncBuffTemplates"
              :disabled="!selectedSteamId || isSyncing || isSyncingBuff"
              :loading="isSyncingBuff"
            >
              {{ isSyncingBuff ? '同步中...' : '获取BUFF饰品映射' }}
            </el-button>
          </div>
        </div>
        
      </div>
    </div>

    <!-- 搜索结果表格 -->
    <div class="card table-card" v-if="hasSearched">
      <el-table 
        :data="paginatedResults" 
        style="width: 100%"
        :default-sort="{ prop: 'name', order: 'ascending' }"
        v-loading="isSearching"
        element-loading-text="搜索中..."
        element-loading-background="rgba(0, 0, 0, 0.8)"
      >
        <el-table-column type="index" label="#" width="60" align="center" />
        
        <el-table-column prop="image" label="图片" width="100" align="center">
          <template #default="{ row }">
            <el-image 
              :src="row.image || '/icons/default-weapon.png'" 
              :alt="row.name"
              style="width: 60px; height: 60px; object-fit: contain;"
              fit="contain"
              :preview-src-list="[row.image || '/icons/default-weapon.png']"
              @error="handleImageError"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="饰品名称" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="exterior" label="外观" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.exterior || '无' }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="quality" label="品质" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="warning">{{ row.quality || '无' }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="buy_price" label="购入价" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.buy_price" class="price-text">¥{{ row.buy_price }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="yyyp_price" label="悠悠有品" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row.yyyp_price" class="price-text">¥{{ row.yyyp_price }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="buff_price" label="BUFF" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.buff_price" class="price-text">¥{{ row.buff_price }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="steam_price" label="Steam" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.steam_price" class="price-text">¥{{ row.steam_price }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleViewDetails(row)">
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="searchResults.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 无结果提示 -->
    <div v-if="hasSearched && searchResults.length === 0 && !isSearching" class="card no-results-card">
      <el-empty description="未找到相关饰品" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_CONFIG, apiUrls } from '@/config/api.js'

export default {
  name: 'ItemSearch',
  setup() {
    const searchKeyword = ref('')
    const searchResults = ref([])
    const isSearching = ref(false)
    const hasSearched = ref(false)
    const selectedSteamId = ref('')
    const steamIdList = ref([])
    const isSyncing = ref(false)
    const isSyncingBuff = ref(false)
    const lastSyncTime = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)

    // 计算属性
    const hasFilters = computed(() => {
      return (searchKeyword.value && searchKeyword.value.trim()) || selectedSteamId.value
    })

    const paginatedResults = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return searchResults.value.slice(start, end)
    })

    // 加载Steam ID列表
    const loadSteamIdList = async () => {
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/webInventoryV1/steam_ids`)
        if (response.data.success && response.data.data.length > 0) {
          steamIdList.value = response.data.data
          // 默认选择第一个
          if (!selectedSteamId.value && steamIdList.value.length > 0) {
            selectedSteamId.value = steamIdList.value[0].steam_id
          }
        }
      } catch (error) {
        console.error('加载Steam ID列表失败:', error)
        ElMessage.error('加载Steam ID列表失败')
      }
    }

    // 同步悠悠有品饰品映射
    const syncWeaponTemplates = async () => {
      if (!selectedSteamId.value) {
        ElMessage.warning('请先选择 Steam ID')
        return
      }

      if (isSyncing.value) {
        return
      }

      try {
        await ElMessageBox.confirm(
          `确定要同步 Steam ID: ${selectedSteamId.value} 的悠悠有品饰品映射吗？此操作可能需要一些时间。`,
          '确认同步',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch {
        return
      }

      isSyncing.value = true
      ElMessage.info('开始同步饰品映射...')
      
      try {
        console.log('开始同步悠悠有品饰品映射, Steam ID:', selectedSteamId.value)
        
        const response = await axios.post(apiUrls.youpinSyncTemplates(), {
          steamId: selectedSteamId.value
        })

        if (response.data.success) {
          ElMessage.success(`同步成功！${response.data.message}`)
          console.log('同步结果:', response.data)
          lastSyncTime.value = new Date().toLocaleString('zh-CN')
        } else {
          ElMessage.error(`同步失败: ${response.data.message}`)
        }
      } catch (error) {
        console.error('同步饰品映射失败:', error)
        let errorMessage = '同步失败'
        
        if (error.response) {
          errorMessage = error.response.data?.message || `同步失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到爬虫服务器，请检查服务是否运行'
        } else {
          errorMessage = error.message || '同步失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        isSyncing.value = false
      }
    }

    // 同步BUFF饰品映射（暂未实现）
    const syncBuffTemplates = async () => {
      if (!selectedSteamId.value) {
        ElMessage.warning('请先选择 Steam ID')
        return
      }

      if (isSyncingBuff.value) {
        return
      }

      try {
        await ElMessageBox.confirm(
          `确定要同步 Steam ID: ${selectedSteamId.value} 的BUFF饰品映射吗？此操作可能需要一些时间。`,
          '确认同步',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch {
        return
      }

      isSyncingBuff.value = true
      ElMessage.info('开始同步BUFF饰品映射...')
      
      try {
        console.log('开始同步BUFF饰品映射, Steam ID:', selectedSteamId.value)
        
        // TODO: 对接BUFF同步API
        // const response = await axios.post(apiUrls.buffSyncTemplates(), {
        //   steamId: selectedSteamId.value
        // })
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.info('BUFF饰品映射同步功能暂未实现')
        
      } catch (error) {
        console.error('同步BUFF饰品映射失败:', error)
        ElMessage.error('同步失败')
      } finally {
        isSyncingBuff.value = false
      }
    }

    const handleImageError = (event) => {
      event.target.src = '/icons/default-weapon.png'
    }

    const handleSearch = async () => {
      if (!searchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
      }

      isSearching.value = true
      hasSearched.value = true
      currentPage.value = 1
      
      try {
        console.log('搜索关键词:', searchKeyword.value)
        
        // TODO: 这里需要根据实际API接口调整
        // 示例：从库存API搜索
        // const response = await axios.get(`${API_CONFIG.BASE_URL}/search`, {
        //   params: { keyword: searchKeyword.value }
        // })
        
        // 模拟搜索延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 这里应该对接实际的搜索API
        searchResults.value = []
        
        if (searchResults.value.length === 0) {
          ElMessage.info('未找到相关饰品')
        } else {
          ElMessage.success(`找到 ${searchResults.value.length} 件饰品`)
        }
        
      } catch (error) {
        console.error('搜索失败:', error)
        ElMessage.error('搜索失败')
        searchResults.value = []
      } finally {
        isSearching.value = false
      }
    }

    const handleClearSearch = () => {
      searchKeyword.value = ''
      searchResults.value = []
      hasSearched.value = false
      currentPage.value = 1
      ElMessage.info('已重置搜索')
    }

    const handleViewDetails = (item) => {
      ElMessage.info(`查看详情: ${item.name}`)
      // TODO: 实现详情查看功能
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    // 组件挂载时加载Steam ID列表
    onMounted(() => {
      loadSteamIdList()
    })

    return {
      searchKeyword,
      searchResults,
      isSearching,
      hasSearched,
      selectedSteamId,
      steamIdList,
      isSyncing,
      isSyncingBuff,
      lastSyncTime,
      currentPage,
      pageSize,
      hasFilters,
      paginatedResults,
      handleSearch,
      handleClearSearch,
      handleImageError,
      syncWeaponTemplates,
      syncBuffTemplates,
      handleViewDetails,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.stats-summary {
  margin-bottom: clamp(1rem, 3vw, 1.25rem);
}

.search-section {
  margin-bottom: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.all-controls-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: nowrap;
}

.all-controls-row .steam-id-select,
.all-controls-row .search-input,
.all-controls-row .el-button {
  flex-shrink: 0;
  white-space: nowrap;
}

.search-stats-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-default) 20%, var(--border-default) 80%, transparent);
  margin: 1.5rem 0;
}

.filter-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border-default);
}

.filter-label {
  font-weight: 500;
  color: var(--text-primary);
  margin-right: 0.5rem;
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

.stats-grid-3x2 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(0.75rem, 2vw, 1rem);
  align-items: stretch;
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

.table-card {
  margin-bottom: clamp(1rem, 3vw, 1.25rem);
}

.price-text {
  color: #4CAF50;
  font-weight: 600;
}

.no-data {
  color: #888;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: clamp(1rem, 2vw, 1.5rem) 0;
}

.no-results-card {
  padding: clamp(2rem, 4vw, 3rem);
  text-align: center;
}

.search-input {
  min-width: 200px;
  max-width: 300px;
}

.steam-id-select {
  width: 200px;
  min-width: 180px;
}

/* Element Plus 组件深色主题适配 */
:deep(.el-input__wrapper) {
  background-color: #2a2a2a;
  box-shadow: 0 0 0 1px #444 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #4CAF50 inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #4CAF50 inset !important;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-select .el-input__wrapper) {
  background-color: #2a2a2a;
}

:deep(.el-button) {
  font-size: clamp(0.75rem, 1vw, 0.875rem);
  padding: clamp(0.5rem, 1vw, 0.625rem) clamp(0.75rem, 1.5vw, 1rem);
}

:deep(.el-table) {
  background-color: transparent;
  color: #fff;
}

:deep(.el-table th.el-table__cell) {
  background-color: #2a2a2a;
  color: #fff;
  border-bottom: 1px solid #444;
}

:deep(.el-table tr) {
  background-color: #1e1e1e;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #333;
}

:deep(.el-table__body tr:hover > td) {
  background-color: #2a2a2a !important;
}

:deep(.el-pagination) {
  color: #fff;
}

:deep(.el-pagination button) {
  background-color: #2a2a2a;
  color: #fff;
}

:deep(.el-pagination .el-pager li) {
  background-color: #2a2a2a;
  color: #fff;
}

:deep(.el-pagination .el-pager li.is-active) {
  background-color: #4CAF50;
  color: #fff;
}

@media (max-width: 768px) {
  .stats-grid-3x2 {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .all-controls-row {
    flex-wrap: wrap;
  }
  
  .all-controls-row .steam-id-select,
  .all-controls-row .search-input {
    width: 100%;
    max-width: none;
  }
  
  .all-controls-row .el-button {
    flex: 1;
    min-width: 100px;
  }
}
</style>
