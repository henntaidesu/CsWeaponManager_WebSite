<template>
  <div>
    <h1 class="page-title">Steam库存</h1>
    
    <div class="filters card">
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
        <el-input
          v-model="searchText"
          placeholder="搜索饰品名称..."
          prefix-icon="Search"
          class="search-input"
          @keyup.enter="loadInventoryData"
          clearable
        />
        <el-select v-model="weaponTypeFilter" placeholder="武器类型" class="type-select" clearable>
          <el-option label="全部" value="" />
          <el-option label="步枪" value="步枪" />
          <el-option label="手枪" value="手枪" />
          <el-option label="狙击枪" value="狙击枪" />
          <el-option label="冲锋枪" value="冲锋枪" />
          <el-option label="霰弹枪" value="霰弹枪" />
          <el-option label="机枪" value="机枪" />
          <el-option label="手套" value="手套" />
          <el-option label="匕首" value="匕首" />
        </el-select>
        <el-select v-model="floatRangeFilter" placeholder="磨损等级" class="wear-select" clearable>
          <el-option label="全部" value="" />
          <el-option label="崭新出厂" value="崭新出厂" />
          <el-option label="略有磨损" value="略有磨损" />
          <el-option label="久经沙场" value="久经沙场" />
          <el-option label="破损不堪" value="破损不堪" />
          <el-option label="战痕累累" value="战痕累累" />
        </el-select>
        <el-button type="primary" @click="loadInventoryData" :loading="loading">
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-switch
          v-model="groupByItem"
          active-text="分组显示"
          inactive-text="列表显示"
          @change="handleGroupChange"
        />
      </div>
    </div>

    <div class="inventory-stats">
      <div class="grid grid-3">
        <div class="card">
          <h3>总库存数量</h3>
          <p class="stat-number">{{ inventoryStats.totalCount }}</p>
        </div>
        <div class="card">
          <h3>按类型分布</h3>
          <p class="stat-text">{{ inventoryStats.typeDistribution }}</p>
        </div>
        <div class="card">
          <h3>按磨损分布</h3>
          <p class="stat-text">{{ inventoryStats.wearDistribution }}</p>
        </div>
      </div>
    </div>

    <!-- 列表显示 -->
    <div class="table-container" v-if="!groupByItem">
      <el-table
        :data="inventoryData"
        v-loading="loading"
        element-loading-text="加载中..."
        style="width: 100%"
        :row-style="{ backgroundColor: 'transparent' }"
        :header-row-style="{ backgroundColor: 'var(--bg-tertiary)' }"
        height="calc(100vh - 400px)"
      >
        <el-table-column prop="weapon_name" label="武器" min-width="120" />
        <el-table-column prop="weapon_type" label="类型" min-width="100" />
        <el-table-column prop="item_name" label="饰品名称" min-width="250" show-overflow-tooltip />
        <el-table-column prop="float_range" label="磨损等级" min-width="100" />
        <el-table-column prop="weapon_float" label="磨损值" min-width="150">
          <template #default="scope">
            <span v-if="scope.row.weapon_float" style="font-family: monospace;">
              {{ scope.row.weapon_float }}
            </span>
            <span v-else style="color: #888;">N/A</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="120" fixed="right">
          <template #default="scope">
            <el-tooltip v-if="scope.row.remark" :content="scope.row.remark" placement="left" effect="dark">
              <el-tag type="warning" size="small" style="cursor: help;">
                交易限制
              </el-tag>
            </el-tooltip>
            <span v-else style="color: #888;">-</span>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="table-footer">
        <span>共 {{ inventoryData.length }} 条数据</span>
      </div>
    </div>

    <!-- 分组显示 -->
    <div class="table-container" v-else>
      <el-table
        :data="groupedData"
        v-loading="loading"
        element-loading-text="加载中..."
        style="width: 100%"
        :row-style="{ backgroundColor: 'transparent' }"
        :header-row-style="{ backgroundColor: 'var(--bg-tertiary)' }"
        row-key="item_name"
        :expand-row-keys="expandedRows"
        @expand-change="handleExpandChange"
        height="calc(100vh - 400px)"
      >
        <el-table-column type="expand">
          <template #default="scope">
            <div class="expand-content">
              <el-table
                :data="scope.row.details"
                style="width: 100%"
                size="small"
                :row-style="{ backgroundColor: 'transparent' }"
                :header-row-style="{ backgroundColor: 'var(--bg-tertiary)' }"
              >
                <el-table-column prop="assetid" label="Asset ID" min-width="150" />
                <el-table-column prop="weapon_float" label="磨损值" min-width="150">
                  <template #default="props">
                    <span v-if="props.row.weapon_float" style="font-family: monospace;">
                      {{ props.row.weapon_float }}
                    </span>
                    <span v-else style="color: #888;">N/A</span>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="300">
                  <template #default="props">
                    <el-tooltip v-if="props.row.remark" :content="props.row.remark" placement="top" effect="dark">
                      <div style="cursor: help; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ props.row.remark }}
                      </div>
                    </el-tooltip>
                    <span v-else style="color: #888;">-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="weapon_name" label="武器" min-width="120" />
        <el-table-column prop="weapon_type" label="类型" min-width="100" />
        <el-table-column prop="item_name" label="饰品名称" min-width="250" show-overflow-tooltip />
        <el-table-column prop="float_range" label="磨损" min-width="100" />
        <el-table-column prop="count" label="数量" min-width="80">
          <template #default="scope">
            <el-tag type="primary" size="small">{{ scope.row.count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.count > 1"
              type="primary"
              size="small"
              @click="toggleExpand(scope.row)"
            >
              {{ isExpanded(scope.row.item_name) ? '收起' : '展开详情' }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="table-footer">
        <span>共 {{ groupedData.length }} 组数据</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'Inventory',
  setup() {
    const loading = ref(false)
    const inventoryData = ref([])
    const groupedData = ref([])
    const searchText = ref('')
    const weaponTypeFilter = ref('')
    const floatRangeFilter = ref('')
    const groupByItem = ref(false)
    const expandedRows = ref([])
    const statsData = ref({
      total_count: 0,
      by_type: [],
      by_wear: []
    })
    const steamIdList = ref([])
    const selectedSteamId = ref('')

    // API 基础地址
    const API_BASE = 'http://localhost:9001/webInventoryV1'
    const CONFIG_API = 'http://localhost:9001/configV1'

    const inventoryStats = computed(() => {
      const typeDistribution = statsData.value.by_type.length > 0
        ? statsData.value.by_type.slice(0, 3).map(t => `${t.weapon_type}(${t.count})`).join(', ')
        : '暂无数据'
      
      const wearDistribution = statsData.value.by_wear.length > 0
        ? statsData.value.by_wear.slice(0, 3).map(w => `${w.float_range}(${w.count})`).join(', ')
        : '暂无数据'

      return {
        totalCount: statsData.value.total_count,
        typeDistribution,
        wearDistribution
      }
    })

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

    const loadInventoryData = async () => {
      if (!selectedSteamId.value) {
        ElMessage.warning('请选择Steam账号')
        return
      }
      
      loading.value = true
      try {
        console.log('正在加载库存数据，Steam ID:', selectedSteamId.value)
        if (groupByItem.value) {
          // 加载分组数据 - 全部数据
          const url = `${API_BASE}/inventory/grouped/${selectedSteamId.value}`
          console.log('请求URL:', url)
          const response = await axios.get(url)
          console.log('分组数据响应:', response.data)
          if (response.data.success) {
            groupedData.value = response.data.data.map(item => ({
              ...item,
              details: item.assetids.map((assetid, index) => ({
                assetid,
                weapon_float: item.weapon_floats[index],
                remark: item.remarks[index]
              }))
            }))
            console.log('分组数据已加载，总计:', groupedData.value.length)
          }
        } else {
          // 加载列表数据 - 全部数据，不使用limit
          const params = {
            search: searchText.value,
            weapon_type: weaponTypeFilter.value,
            float_range: floatRangeFilter.value,
            limit: 9999, // 获取全部数据
            offset: 0
          }
          
          const url = `${API_BASE}/inventory/${selectedSteamId.value}`
          console.log('请求URL:', url, '参数:', params)
          const response = await axios.get(url, { params })
          console.log('列表数据响应:', response.data)
          if (response.data.success) {
            inventoryData.value = response.data.data
            console.log('数据已加载，总计:', inventoryData.value.length)
          } else {
            ElMessage.error(response.data.error || '加载数据失败')
          }
        }
        
        // 加载统计数据
        await loadStats()
      } catch (error) {
        console.error('加载库存数据失败:', error)
        ElMessage.error('加载数据失败: ' + (error.response?.data?.error || error.message))
      } finally {
        loading.value = false
      }
    }

    const loadStats = async () => {
      try {
        const response = await axios.get(`${API_BASE}/inventory/stats/${selectedSteamId.value}`)
        console.log('统计数据响应:', response.data)
        if (response.data.success) {
          statsData.value = response.data.data
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }

    const handleSteamIdChange = () => {
      console.log('Steam ID已切换:', selectedSteamId.value)
      loadInventoryData()
    }

    const handleReset = () => {
      searchText.value = ''
      weaponTypeFilter.value = ''
      floatRangeFilter.value = ''
      loadInventoryData()
    }

    const handleGroupChange = () => {
      expandedRows.value = []
      loadInventoryData()
    }

    const isExpanded = (itemName) => {
      return expandedRows.value.includes(itemName)
    }

    const toggleExpand = (row) => {
      const index = expandedRows.value.indexOf(row.item_name)
      if (index > -1) {
        expandedRows.value.splice(index, 1)
      } else {
        expandedRows.value.push(row.item_name)
      }
    }

    const handleExpandChange = (row, expandedRowsArray) => {
      expandedRows.value = expandedRowsArray.map(r => r.item_name)
    }

    onMounted(async () => {
      await loadSteamIdList()
      if (selectedSteamId.value) {
        loadInventoryData()
      }
    })

    return {
      loading,
      inventoryData,
      groupedData,
      inventoryStats,
      searchText,
      weaponTypeFilter,
      floatRangeFilter,
      groupByItem,
      expandedRows,
      steamIdList,
      selectedSteamId,
      loadInventoryData,
      handleReset,
      handleGroupChange,
      handleSteamIdChange,
      isExpanded,
      toggleExpand,
      handleExpandChange
    }
  }
}
</script>

<style scoped>
.steam-id-select {
  min-width: 250px;
  max-width: 350px;
}

.search-input {
  min-width: 200px;
  flex: 1;
  max-width: 300px;
}

.type-select,
.wear-select {
  min-width: 120px;
  max-width: 180px;
}

.inventory-stats {
  margin-bottom: clamp(1rem, 3vw, 1.25rem);
}

.table-footer {
  padding: 1rem;
  text-align: right;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
}

.stat-number {
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  font-weight: bold;
  color: #4CAF50;
  margin-top: clamp(0.5rem, 1vw, 0.625rem);
}

.stat-text {
  font-size: clamp(0.75rem, 1.5vw, 0.875rem);
  color: #ccc;
  margin-top: clamp(0.5rem, 1vw, 0.625rem);
  line-height: 1.5;
}

.pagination {
  margin-top: clamp(1rem, 3vw, 1.25rem);
  display: flex;
  justify-content: center;
}

.expand-content {
  padding: 1rem;
  background-color: var(--bg-secondary) !important;
}

.expand-content :deep(.el-table) {
  background-color: transparent !important;
}

.expand-content :deep(.el-table__body-wrapper) {
  background-color: transparent !important;
}

.expand-content :deep(.el-table th.el-table__cell) {
  background-color: var(--bg-tertiary) !important;
}

.expand-content :deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
}

.expand-content :deep(.el-table__row) {
  background-color: transparent !important;
}

.expand-content :deep(.el-table__expanded-cell) {
  background-color: var(--bg-secondary) !important;
}

:deep(.el-table__expanded-cell) {
  background-color: var(--bg-secondary) !important;
  padding: 0 !important;
}

:deep(.el-table) {
  background-color: transparent;
  color: #fff;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
}

:deep(.el-table th) {
  background-color: var(--bg-tertiary);
  color: #fff;
  border-bottom: 1px solid var(--border-default);
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
}

:deep(.el-table td) {
  background-color: transparent !important;
  border-bottom: 1px solid var(--border-default);
  color: #ccc;
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
}

:deep(.el-table tr:hover > td) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

:deep(.el-table__expanded-cell) {
  background-color: transparent !important;
}

:deep(.el-input__inner) {
  background-color: #2a2a2a;
  border-color: #333;
  color: #fff;
}

:deep(.el-select .el-input__inner) {
  background-color: #2a2a2a;
  border-color: #333;
  color: #fff;
}

:deep(.el-switch) {
  --el-switch-on-color: #4CAF50;
  --el-switch-off-color: #909399;
}

:deep(.el-switch__label) {
  color: #ccc;
}

:deep(.el-table .el-table__cell) {
  word-break: break-word;
}

@media (max-width: 768px) {
  .search-input,
  .type-select,
  .wear-select {
    min-width: unset;
    width: 100%;
    max-width: none;
  }
  
  :deep(.el-table) {
    font-size: 0.75rem;
  }
  
  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 0.5rem 0.25rem;
  }
}
</style>
