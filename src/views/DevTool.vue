<template>
  <div class="dev-tool-container">
    <div class="card dev-card">
      <h1 class="dev-title">开发工具</h1>
      <p class="dev-subtitle">Developer Tools - 仅供开发调试使用</p>
      
      <!-- 饰品映射同步区域 -->
      <div class="sync-section">
        <h2 class="section-title">饰品映射同步</h2>
        
        <div class="sync-controls">
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
        
        <div v-if="lastSyncTime" class="sync-info">
          <span class="sync-time">最后同步时间: {{ lastSyncTime }}</span>
        </div>
      </div>

      <!-- Steam市场Hash Names采集区域 -->
      <div class="sync-section">
        <h2 class="section-title">Steam市场饰品哈希采集</h2>

        <div class="sync-controls">
          <el-button 
            type="primary" 
            @click="collectHashNamesFull"
            :disabled="isCollectingHashNames"
            :loading="isCollectingHashNames"
          >
            {{ isCollectingHashNames ? '采集中...' : '获取Steam饰品哈希' }}
          </el-button>
        </div>

        <div v-if="lastCollectTime" class="sync-info">
          <span class="sync-time">最后采集时间: {{ lastCollectTime }}</span>
        </div>

        <div v-if="collectProgress" class="progress-info">
          <div class="progress-item">
            <span class="progress-label">采集进度:</span>
            <span class="progress-value">
              {{ collectProgress.total_success || 0 }} / {{ collectProgress.total_collected || 0 }}
            </span>
          </div>
          <div class="progress-item">
            <span class="progress-label">成功率:</span>
            <span class="progress-value success-rate">
              {{ collectProgress.success_rate || 0 }}%
            </span>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_CONFIG, apiUrls } from '@/config/api.js'

export default {
  name: 'DevTool',
  setup() {
    const selectedSteamId = ref('')
    const steamIdList = ref([])
    const isSyncing = ref(false)
    const isSyncingBuff = ref(false)
    const lastSyncTime = ref('')
    
    // Steam Hash Names 相关状态
    const isCollectingHashNames = ref(false)
    const lastCollectTime = ref('')
    const collectProgress = ref(null)

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

    // 同步BUFF饰品映射
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

        const response = await axios.post(apiUrls.buffSyncTemplates(), {
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
        console.error('同步BUFF饰品映射失败:', error)
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
        isSyncingBuff.value = false
      }
    }

    // 完整采集Hash Names (全部)
    const collectHashNamesTest = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要采集Steam市场物品数据吗？测试模式将采集100条数据，预计需要2-3分钟。',
          '确认采集',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
      } catch {
        return
      }

      isCollectingHashNames.value = true
      collectProgress.value = null
      ElMessage.info('开始采集Steam市场Hash Names (测试模式: 100条)...')

      try {
        const response = await axios.post(apiUrls.steamCollectHashNames(), {
          max_count: 100,
          batch_size: 50
        })

        if (response.data.success) {
          collectProgress.value = response.data.data
          lastCollectTime.value = new Date().toLocaleString('zh-CN')
          ElMessage.success(`采集完成！${response.data.message}`)
        } else {
          ElMessage.error(`采集失败: ${response.data.message}`)
        }
      } catch (error) {
        console.error('采集Hash Names失败:', error)
        let errorMessage = '采集失败'
        
        if (error.response) {
          errorMessage = error.response.data?.message || `采集失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到爬虫服务器，请检查服务是否运行'
        } else {
          errorMessage = error.message || '采集失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        isCollectingHashNames.value = false
      }
    }

    // 完整采集Hash Names (全部)
    const collectHashNamesFull = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要完整采集Steam市场物品数据吗？这将采集约24000条数据，预计需要8-10分钟。期间请不要关闭页面。',
          '确认完整采集',
          {
            confirmButtonText: '确定采集',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch {
        return
      }

      isCollectingHashNames.value = true
      collectProgress.value = null
      ElMessage.info('开始完整采集Steam市场Hash Names，这可能需要较长时间，请耐心等待...')

      try {
        const response = await axios.post(apiUrls.steamCollectHashNames(), {
          batch_size: 100
        })

        if (response.data.success) {
          collectProgress.value = response.data.data
          lastCollectTime.value = new Date().toLocaleString('zh-CN')
          ElMessage.success(`采集完成！${response.data.message}`)
        } else {
          ElMessage.error(`采集失败: ${response.data.message}`)
        }
      } catch (error) {
        console.error('采集Hash Names失败:', error)
        let errorMessage = '采集失败'
        
        if (error.response) {
          errorMessage = error.response.data?.message || `采集失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到爬虫服务器，请检查服务是否运行'
        } else {
          errorMessage = error.message || '采集失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        isCollectingHashNames.value = false
      }
    }

    // 组件挂载时加载Steam ID列表
    onMounted(() => {
      loadSteamIdList()
    })

    return {
      selectedSteamId,
      steamIdList,
      isSyncing,
      isSyncingBuff,
      lastSyncTime,
      syncWeaponTemplates,
      syncBuffTemplates,
      // Steam Hash Names 相关
      isCollectingHashNames,
      lastCollectTime,
      collectProgress,
      collectHashNamesFull
    }
  }
}
</script>

<style scoped>
.dev-tool-container {
  width: 100%;
  padding: 1rem;
}

.dev-card {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 400px;
}

.dev-title {
  font-size: 2rem;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 0.5rem;
  text-align: center;
}

.dev-subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.sync-section {
  background-color: #2a2a2a;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #444;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #444;
}

.sync-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.steam-id-select {
  width: 200px;
  min-width: 180px;
}

.sync-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 0.5rem;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.sync-time {
  color: #4CAF50;
  font-size: 0.875rem;
}

/* Element Plus 组件深色主题适配 */
:deep(.el-input__wrapper) {
  background-color: #1e1e1e;
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
  background-color: #1e1e1e;
}

:deep(.el-button) {
  font-size: 0.875rem;
  padding: 0.625rem 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dev-card {
    padding: 1rem;
  }

  .dev-title {
    font-size: 1.5rem;
  }

  .sync-section {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .sync-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .steam-id-select {
    width: 100%;
  }

  .sync-controls .el-button {
    width: 100%;
  }
}
</style>

