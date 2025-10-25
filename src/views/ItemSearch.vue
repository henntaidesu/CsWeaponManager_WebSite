<template>
  <div class="item-search-container">
    <!-- 搜索区域 - 根据状态切换样式 -->
    <div :class="['search-wrapper', { 'centered': !hasSearched, 'top-left': hasSearched }]">
      <div class="card search-card">
        <div class="search-section">
          <div :class="['search-controls', { 'compact': hasSearched }]">
            <el-select 
              v-model="selectedSteamId" 
              placeholder="选择Steam账号" 
              :class="['steam-id-select', { 'large': !hasSearched }]"
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
            
            <el-autocomplete
              v-model="searchKeyword"
              :placeholder="hasSearched ? '搜索饰品名称...' : '请输入饰品名称...'"
              prefix-icon="Search"
              :class="['search-input', { 'large': !hasSearched }]"
              :fetch-suggestions="querySearchAsync"
              @select="handleSelect"
              @keyup.enter="handleSearchWeapon"
              @clear="handleClearSearch"
              clearable
              :debounce="300"
              popper-class="weapon-autocomplete-popper"
              :teleported="false"
            >
              <template #default="{ item }">
                <div class="autocomplete-item">
                  {{ item.value }}
                </div>
              </template>
            </el-autocomplete>
            
            <div class="button-group">
              <el-button type="primary" @click="handleSearchWeapon" :loading="isSearching && searchSource === 'weapon'">
                搜索武器
              </el-button>
              
              <el-button v-if="hasSearched" @click="handleClearSearch" :disabled="isSearching">
                重置
              </el-button>
            </div>
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
        
        <el-table-column prop="market_listing_item_name" label="饰品名称" min-width="300" show-overflow-tooltip />
        
        <el-table-column prop="weapon_type" label="武器类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.weapon_type || '-' }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="item_name" label="皮肤名称" width="180" align="center" show-overflow-tooltip />
        
        <el-table-column prop="Rarity" label="稀有度" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.Rarity" class="rarity-text" :style="{ color: getRarityColor(row.Rarity) }">
              {{ row.Rarity }}
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="yyyp_id" label="悠悠有品ID" width="120" align="center">
          <template #default="{ row }">
            <span class="id-text">{{ row.yyyp_id || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="buff_id" label="BUFF ID" width="100" align="center">
          <template #default="{ row }">
            <span class="id-text">{{ row.buff_id || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="steam_id" label="Steam ID" width="100" align="center">
          <template #default="{ row }">
            <span class="id-text">{{ row.steam_id || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="搜索" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="warning" size="small" @click="handleSearchYYYPByRow(row)" :loading="isSearching && searchSource === 'yyyp'">
                悠悠有品
              </el-button>
              <el-button type="default" size="small" @click="handleSearchBuffByRow(row)" :loading="isSearching && searchSource === 'buff'">
                BUFF
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
    const currentPage = ref(1)
    const pageSize = ref(20)
    const searchSource = ref('') // 'yyyp' 或 'buff'
    const steamIdList = ref([])
    const selectedSteamId = ref('')
    
    // API 基础地址
    const API_BASE = `${API_CONFIG.BASE_URL}/webInventoryV1`

    // 计算属性
    const paginatedResults = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return searchResults.value.slice(start, end)
    })

    const handleImageError = (event) => {
      event.target.src = '/icons/default-weapon.png'
    }

    // 实时搜索武器名称
    const querySearchAsync = async (queryString, cb) => {
      if (!queryString || queryString.trim().length === 0) {
        cb([])
        return
      }

      try {
        const response = await axios.get(apiUrls.searchWeapon(queryString.trim()))
        if (response.data.success && response.data.data) {
          const results = response.data.data.map(name => ({
            value: name
          }))
          cb(results)
        } else {
          cb([])
        }
      } catch (error) {
        console.error('搜索武器名称失败:', error)
        cb([])
      }
    }

    // 选择搜索建议
    const handleSelect = (item) => {
      searchKeyword.value = item.value
      console.log('已选择:', item.value)
    }

    // 搜索武器详情
    const handleSearchWeapon = async () => {
      if (!searchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
      }

      isSearching.value = true
      hasSearched.value = true
      searchSource.value = 'weapon'
      currentPage.value = 1
      
      try {
        console.log('搜索武器:', searchKeyword.value)
        
        const response = await axios.get(apiUrls.searchWeaponDetail(searchKeyword.value.trim()))
        
        if (response.data.success) {
          searchResults.value = response.data.data || []
          
          if (searchResults.value.length === 0) {
            ElMessage.info('未找到匹配的武器')
          } else {
            ElMessage.success(`找到 ${searchResults.value.length} 件武器`)
          }
        } else {
          ElMessage.error('搜索失败: ' + (response.data.error || '未知错误'))
          searchResults.value = []
        }
        
      } catch (error) {
        console.error('搜索武器失败:', error)
        ElMessage.error('搜索失败: ' + (error.response?.data?.error || error.message))
        searchResults.value = []
      } finally {
        isSearching.value = false
      }
    }

    // 获取稀有度类型（根据CS:GO品质颜色）
    const getRarityType = (rarity) => {
      if (!rarity) return ''
      // 不使用Element Plus的type，使用自定义颜色
      return ''
    }
    
    // 获取稀有度颜色样式
    const getRarityColor = (rarity) => {
      if (!rarity) return ''
      const rarityColorMap = {
        '违禁': '#e4ae39',      // 金色
        '隐秘': '#eb4b4b',      // 红色
        '保密': '#d32ce6',      // 紫色/粉色
        '受限': '#8847ff',      // 紫色
        '军规级': '#4b69ff',    // 蓝色
        '工业级': '#5e98d9',    // 浅蓝色
        '消费级': '#b0c3d9',    // 灰蓝色
        '普通级': '#b0c3d9'     // 灰蓝色
      }
      return rarityColorMap[rarity] || '#fff'
    }

    // 加载Steam ID列表
    const loadSteamIdList = async () => {
      try {
        const response = await axios.get(`${API_BASE}/steam_ids`)
        console.log('Steam ID列表响应:', response.data)
        if (response.data.success) {
          steamIdList.value = response.data.data
          if (steamIdList.value.length > 0) {
            // 默认选择第一个
            selectedSteamId.value = steamIdList.value[0].steam_id
            console.log('默认选择Steam ID:', selectedSteamId.value)
          } else {
            ElMessage.warning('没有找到库存数据，请先获取Steam库存')
          }
        }
      } catch (error) {
        console.error('加载Steam ID列表失败:', error)
        ElMessage.error('加载Steam ID列表失败: ' + (error.response?.data?.error || error.message))
      }
    }

    // Steam ID 改变处理
    const handleSteamIdChange = (value) => {
      console.log('Steam ID已改变:', value)
      selectedSteamId.value = value
    }

    // 通过行数据搜索悠悠有品
    const handleSearchYYYPByRow = async (row) => {
      if (!row.yyyp_id) {
        ElMessage.warning('该武器没有悠悠有品ID')
        return
      }

      isSearching.value = true
      searchSource.value = 'yyyp'
      
      try {
        console.log('搜索悠悠有品:', row.market_listing_item_name, 'ID:', row.yyyp_id)
        
        // TODO: 这里需要根据实际API接口调整
        // 示例：根据yyyp_id搜索悠悠有品
        // const response = await axios.get(`${API_CONFIG.BASE_URL}/search/yyyp/${row.yyyp_id}`)
        
        // 模拟搜索延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        ElMessage.success(`正在跳转到悠悠有品: ${row.market_listing_item_name}`)
        // 可以在这里打开新窗口跳转到悠悠有品页面
        // window.open(`https://www.youpin898.com/goodInfo?id=${row.yyyp_id}`, '_blank')
        
      } catch (error) {
        console.error('搜索悠悠有品失败:', error)
        ElMessage.error('搜索失败')
      } finally {
        isSearching.value = false
      }
    }

    // 通过行数据搜索BUFF
    const handleSearchBuffByRow = async (row) => {
      if (!row.buff_id) {
        ElMessage.warning('该武器没有BUFF ID')
        return
      }

      isSearching.value = true
      searchSource.value = 'buff'
      
      try {
        console.log('搜索BUFF:', row.market_listing_item_name, 'ID:', row.buff_id)
        
        // TODO: 这里需要根据实际API接口调整
        // 示例：根据buff_id搜索BUFF
        // const response = await axios.get(`${API_CONFIG.BASE_URL}/search/buff/${row.buff_id}`)
        
        // 模拟搜索延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        ElMessage.success(`正在跳转到BUFF: ${row.market_listing_item_name}`)
        // 可以在这里打开新窗口跳转到BUFF页面
        // window.open(`https://buff.163.com/goods/${row.buff_id}`, '_blank')
        
      } catch (error) {
        console.error('搜索BUFF失败:', error)
        ElMessage.error('搜索失败')
      } finally {
        isSearching.value = false
      }
    }

    const handleClearSearch = () => {
      searchKeyword.value = ''
      searchResults.value = []
      hasSearched.value = false
      searchSource.value = ''
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

    // 页面加载时获取Steam ID列表
    onMounted(async () => {
      await loadSteamIdList()
    })

    return {
      searchKeyword,
      searchResults,
      isSearching,
      hasSearched,
      searchSource,
      currentPage,
      pageSize,
      paginatedResults,
      steamIdList,
      selectedSteamId,
      handleSearchWeapon,
      handleSearchYYYPByRow,
      handleSearchBuffByRow,
      handleClearSearch,
      handleImageError,
      handleViewDetails,
      handleSizeChange,
      handleCurrentChange,
      handleSteamIdChange,
      querySearchAsync,
      handleSelect,
      getRarityType,
      getRarityColor
    }
  }
}
</script>

<style scoped>
.item-search-container {
  position: relative;
  min-height: 100vh;
}

/* 搜索包装器 - 居中或左上角 */
.search-wrapper {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 10;
}

.search-wrapper.centered {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 800px;
}

.search-wrapper.top-left {
  margin-bottom: 1.5rem;
  width: 100%;
}

/* 搜索卡片 */
.search-card {
  padding: 2rem;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-wrapper.centered .search-card {
  padding: 3rem 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.search-wrapper.top-left .search-card {
  padding: 1rem 1.5rem;
}

/* 标题样式 */
.search-title {
  text-align: center;
  font-size: 3rem;
  font-weight: 700;
  color: #4CAF50;
  margin: 0 0 2rem 0;
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-section {
  transition: all 0.5s ease;
}

.search-wrapper.centered .search-section {
  margin-bottom: 0;
}

.search-wrapper.top-left .search-section {
  margin-bottom: 0;
}

/* 搜索控件 */
.search-controls {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  transition: all 0.5s ease;
}

.search-wrapper.centered .search-controls {
  flex-direction: column;
  align-items: center;
}

.search-wrapper.top-left .search-controls {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.search-controls.compact {
  gap: 0.75rem;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.search-wrapper.top-left .button-group {
  gap: 0.75rem;
}

.search-controls.compact .button-group {
  flex-wrap: nowrap;
}

/* Steam ID 选择框 */
.steam-id-select {
  transition: all 0.5s ease;
  min-width: 200px;
  width: 200px;
}

.steam-id-select.large {
  width: 100%;
  max-width: 600px;
  min-width: 300px;
}

/* 搜索输入框 */
.search-input {
  transition: all 0.5s ease;
  min-width: 200px;
  flex: 1;
}

.search-wrapper.top-left .search-input {
  max-width: 300px;
}

.search-input.large {
  width: 100%;
  max-width: 600px;
}

/* el-autocomplete 样式适配 */
.search-input :deep(.el-input__wrapper) {
  background-color: #2a2a2a;
  box-shadow: 0 0 0 1px #444 inset;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #4CAF50 inset;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #4CAF50 inset !important;
}

.search-input :deep(.el-input__inner) {
  color: #fff;
}

.search-wrapper.centered .steam-id-select.large :deep(.el-input__wrapper) {
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
}

.search-wrapper.centered .steam-id-select.large :deep(.el-input__inner) {
  font-size: 1.125rem;
}

.search-wrapper.centered .search-input.large :deep(.el-input__wrapper) {
  padding: 2rem 2.5rem;
  font-size: 2rem;
  height: 80px;
  min-height: 80px;
}

.search-wrapper.centered .search-input.large :deep(.el-input__inner) {
  font-size: 2rem;
  height: 80px;
  min-height: 80px;
}

/* 居中状态下的 autocomplete 样式 */
.search-wrapper.centered .search-input.large :deep(.el-autocomplete) {
  width: 100%;
}

.search-wrapper.centered .search-input.large :deep(.el-input) {
  width: 100%;
}

/* 居中状态下的按钮样式 */
.search-wrapper.centered .button-group {
  width: 100%;
  max-width: 600px;
}

.search-wrapper.centered .button-group .el-button {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  height: auto;
  flex: 1;
  min-width: 160px;
}

.mb-4 {
  margin-bottom: 1rem;
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
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.price-text {
  color: #4CAF50;
  font-weight: 600;
}

.no-data {
  color: #888;
}

.id-text {
  color: #4CAF50;
  font-family: monospace;
  font-weight: 500;
}

.rarity-text {
  font-weight: 600;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: clamp(1rem, 2vw, 1.5rem) 0;
}

.no-results-card {
  padding: clamp(2rem, 4vw, 3rem);
  text-align: center;
  animation: fadeInUp 0.5s ease-out;
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

/* 自动完成下拉框样式 */
.autocomplete-item {
  padding: 0;
  color: #fff;
  white-space: normal !important;
  word-wrap: break-word !important;
  word-break: break-word !important;
  line-height: 1.5;
  overflow: visible !important;
  text-overflow: clip !important;
}

:deep(.weapon-autocomplete-popper) {
  background-color: #2a2a2a !important;
  border: 1px solid #444 !important;
  max-width: 800px !important;
  min-width: 400px !important;
  width: auto !important;
}

:deep(.weapon-autocomplete-popper .el-autocomplete-suggestion__wrap) {
  background-color: #2a2a2a;
  max-height: 500px !important;
  overflow-y: auto;
}

:deep(.weapon-autocomplete-popper .el-autocomplete-suggestion__list) {
  padding: 0;
}

:deep(.weapon-autocomplete-popper li) {
  color: #fff !important;
  background-color: #2a2a2a !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  word-break: break-word !important;
  line-height: 1.6 !important;
  padding: 0.75rem 1rem !important;
  min-height: auto !important;
  height: auto !important;
  overflow: visible !important;
  text-overflow: clip !important;
  border-bottom: 1px solid #333;
}

:deep(.weapon-autocomplete-popper li:hover) {
  background-color: #3a3a3a !important;
}

:deep(.weapon-autocomplete-popper li.highlighted) {
  background-color: #3a3a3a !important;
}

:deep(.el-autocomplete-suggestion) {
  background-color: #2a2a2a !important;
}

:deep(.el-autocomplete-suggestion__wrap) {
  background-color: #2a2a2a;
}

:deep(.el-autocomplete-suggestion li) {
  color: #fff;
  background-color: #2a2a2a;
  white-space: normal !important;
  word-wrap: break-word !important;
  line-height: 1.5 !important;
  padding: 0.75rem 1rem !important;
  height: auto !important;
}

:deep(.el-autocomplete-suggestion li:hover) {
  background-color: #3a3a3a !important;
}

:deep(.el-autocomplete-suggestion li.highlighted) {
  background-color: #3a3a3a !important;
}

@media (max-width: 768px) {
  .search-wrapper.centered {
    width: 95%;
    max-width: none;
  }
  
  .search-wrapper.centered .search-card {
    padding: 2rem 1.5rem;
  }
  
  .steam-id-select.large,
  .search-input.large {
    min-width: 100%;
  }
  
  .search-controls {
    flex-wrap: wrap;
  }
  
  .button-group {
    width: 100%;
  }
  
  .button-group .el-button {
    flex: 1;
    min-width: 100px;
  }
  
  .stats-grid-3x2 {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
