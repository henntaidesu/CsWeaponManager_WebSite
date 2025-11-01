<template>
  <div class="spider-weapon-rename-container">
    <div class="page-layout">
      <!-- 左侧配置管理栏 -->
      <aside class="config-sidebar">
        <div class="sidebar-header">
          <h3>配置管理</h3>
        </div>

        <div class="config-list">
          <div 
            v-for="config in savedConfigs" 
            :key="config.id"
            class="config-item"
            :class="{ active: selectedConfigId === config.id }"
            @click="selectConfig(config.id)"
          >
            <div class="config-item-header">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <span class="config-name">{{ config.dataName }}</span>
                <el-tag :type="config.platformType === 'buff' ? 'warning' : 'success'" size="small">
                  {{ config.platformType === 'buff' ? 'BUFF' : '悠悠有品' }}
                </el-tag>
              </div>
              <el-button 
                type="danger" 
                size="small"
                circle
                @click.stop="deleteConfig(config.id)"
                :disabled="isCrawling"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <div class="config-item-meta">
              <span class="config-time">{{ formatTime(config.updated_at) }}</span>
            </div>
            <div v-if="config.description" class="config-description">
              {{ config.description }}
            </div>
          </div>

          <div v-if="savedConfigs.length === 0" class="empty-config">
            <el-empty description="暂无保存的配置" :image-size="80" />
          </div>
        </div>

        <div class="sidebar-actions">
          <el-button 
            type="success" 
            @click="createNewConfig"
            :disabled="isCrawling"
            style="width: 100%;"
          >
            <el-icon><Document /></el-icon>
            新建配置
          </el-button>
          
          <el-button 
            type="info" 
            @click="loadConfigList"
            style="width: 100%; margin-top: 0.5rem;"
          >
            <el-icon><Refresh /></el-icon>
            刷新列表
          </el-button>
        </div>
      </aside>

      <!-- 右侧主内容区域 -->
      <div class="main-content-area">

      <!-- 饰品搜索区域 -->
      <div class="search-section">
        <h2 class="section-title">搜索饰品</h2>
        
        <div class="search-container">
          <el-input
            v-model="weaponSearchKeyword"
            placeholder="搜索饰品名称..."
            prefix-icon="Search"
            class="weapon-search-input"
            @keyup.enter="handleSearchWeapon"
            clearable
          >
            <template #append>
              <el-button 
                type="primary" 
                @click="handleSearchWeapon" 
                :loading="isSearchingWeapon"
              >
                搜索
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 搜索结果表格 -->
        <div v-if="weaponSearchResults.length > 0" class="search-results-table">
          <div class="results-header">
            <span class="results-title">
              搜索结果 ({{ weaponSearchResults.length }} 件)
            </span>
            <el-button 
              type="text" 
              size="small"
              @click="clearWeaponSearch"
            >
              清除结果
            </el-button>
          </div>
          
          <el-table 
            :data="weaponSearchResults" 
            style="width: 100%"
            max-height="400"
            :row-class-name="getRowClassName"
          >
            <el-table-column type="index" label="#" width="60" align="center" />
            
            <el-table-column label="饰品名称" min-width="250" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="weapon-name">{{ row.market_listing_item_name }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="Steam Hash Name" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="hash-name-text">{{ row.steam_hash_name || '-' }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="武器类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.weapon_type || '-' }}</el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="悠悠有品ID" width="130" align="center">
              <template #default="{ row }">
                <el-tag type="warning" v-if="row.yyyp_id">{{ row.yyyp_id }}</el-tag>
                <span v-else class="no-data">-</span>
              </template>
            </el-table-column>
            
            <el-table-column label="BUFF ID" width="110" align="center">
              <template #default="{ row }">
                <el-tag type="info" v-if="row.buff_id">{{ row.buff_id }}</el-tag>
                <span v-else class="no-data">-</span>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small"
                  @click="addWeaponId(row)"
                  :disabled="!getWeaponIdByPlatform(row)"
                >
                  添加ID
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="tool-section">
        <h2 class="section-title">爬取配置</h2>
        
        <div class="form-container">
          <el-form :model="crawlForm" label-width="120px" ref="crawlFormRef">
            <div class="form-row">
              <el-form-item label="配置名称" required class="form-item-third">
                <el-input 
                  v-model="crawlForm.configName" 
                  placeholder="请输入配置名称"
                  clearable
                />
              </el-form-item>

              <el-form-item label="Steam ID" required class="form-item-third">
                <el-select 
                  v-model="crawlForm.steamId" 
                  placeholder="选择 Steam ID"
                  style="width: 100%;"
                >
                  <el-option 
                    v-for="steamId in steamIdList" 
                    :key="steamId.steam_id" 
                    :label="steamId.steam_id" 
                    :value="steamId.steam_id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="平台类型" required class="form-item-third">
                <el-select 
                  v-model="crawlForm.platformType" 
                  placeholder="选择平台类型"
                  style="width: 100%;"
                  :disabled="!!selectedConfigId"
                >
                  <el-option label="悠悠有品" value="youpin" />
                  <el-option label="BUFF" value="buff" />
                </el-select>
              </el-form-item>
            </div>
            
            <div v-if="selectedConfigId" style="color: #888; font-size: 0.875rem; margin-top: -12px; margin-bottom: 18px; padding-left: 120px;">
              提示：平台类型创建后不可修改
            </div>

            <el-form-item label="饰品ID">
              <div class="weapon-id-tags">
                <el-tag
                  v-for="id in weaponIdList"
                  :key="id"
                  closable
                  @close="removeWeaponId(id)"
                  type="primary"
                  size="large"
                  style="margin-right: 8px; margin-bottom: 8px;"
                >
                  {{ id }}
                </el-tag>
                <span v-if="weaponIdList.length === 0" style="color: #909399; font-size: 14px;">
                  暂无饰品ID，请从下方搜索添加
                </span>
              </div>
            </el-form-item>

            <el-form-item label="自定义配置">
              <el-input 
                v-model="crawlForm.customConfig" 
                type="textarea"
                :rows="6"
                placeholder='请输入JSON格式的配置，例如:
{
  "filter": {
    "minPrice": 10,
    "maxPrice": 1000
  },
  "sort": "price_asc"
}'
                clearable
              />
            </el-form-item>
          </el-form>
        </div>

        <div class="action-buttons">
          <el-button 
            type="success" 
            size="large"
            @click="showSaveConfigDialog"
            :disabled="isCrawling"
          >
            <el-icon><Document /></el-icon>
            保存当前配置
          </el-button>

          <el-button 
            type="primary" 
            size="large"
            @click="startCrawl"
            :disabled="isCrawling || !canStartCrawl"
            :loading="isCrawling"
          >
            {{ isCrawling ? '爬取中...' : '开始爬取' }}
          </el-button>
          
          <el-button 
            type="default" 
            size="large"
            @click="resetForm"
            :disabled="isCrawling"
          >
            重置
          </el-button>
        </div>
      </div>

      <!-- 爬取结果区域 -->
      <div v-if="crawlResult" class="result-section">
        <h2 class="section-title">爬取结果</h2>
        
        <div class="result-info">
          <div class="result-item">
            <span class="result-label">状态:</span>
            <span 
              class="result-value"
              :class="{
                'success': crawlResult.success,
                'error': !crawlResult.success
              }"
            >
              {{ crawlResult.success ? '成功' : '失败' }}
            </span>
          </div>
          
          <div v-if="crawlResult.message" class="result-item">
            <span class="result-label">消息:</span>
            <span class="result-value">{{ crawlResult.message }}</span>
          </div>
          
          <div v-if="crawlResult.totalCrawled" class="result-item">
            <span class="result-label">爬取数量:</span>
            <span class="result-value highlight">{{ crawlResult.totalCrawled }}</span>
          </div>
          
          <div v-if="crawlResult.renamedCount" class="result-item">
            <span class="result-label">已改名饰品:</span>
            <span class="result-value success">{{ crawlResult.renamedCount }}</span>
          </div>
          
          <div v-if="crawlResult.savedCount" class="result-item">
            <span class="result-label">保存数量:</span>
            <span class="result-value success">{{ crawlResult.savedCount }}</span>
          </div>
          
          <div v-if="crawlResult.duration" class="result-item">
            <span class="result-label">耗时:</span>
            <span class="result-value">{{ crawlResult.duration.toFixed(2) }} 秒</span>
          </div>
        </div>
      </div>

      </div>
      <!-- 结束 main-content-area -->
    </div>
    <!-- 结束 page-layout -->

    <!-- 保存配置对话框 -->
    <el-dialog
      v-model="saveConfigDialogVisible"
      title="保存配置"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="saveConfigForm" label-width="100px">
        <el-form-item label="配置名称" required>
          <el-input 
            v-model="saveConfigForm.name" 
            placeholder="请输入配置名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="saveConfigDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveConfig"
          :disabled="!saveConfigForm.name"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Delete, Refresh } from '@element-plus/icons-vue'
import { API_CONFIG } from '@/config/api.js'

export default {
  name: 'SpiderWeaponRename',
  components: {
    Document,
    Delete,
    Refresh
  },
  setup() {
    const router = useRouter()
    const crawlFormRef = ref(null)
    const steamIdList = ref([])
    const isCrawling = ref(false)
    const crawlResult = ref(null)
    
    // 配置管理相关
    const savedConfigs = ref([])
    const selectedConfigId = ref(null)
    const saveConfigDialogVisible = ref(false)
    const saveConfigForm = ref({
      name: ''
    })

    // 饰品搜索相关
    const weaponSearchKeyword = ref('')
    const weaponSearchResults = ref([])
    const isSearchingWeapon = ref(false)

    const crawlForm = ref({
      configName: '',      // 对应 dataName
      steamId: '',
      platformType: 'youpin',  // 平台类型：youpin 或 buff
      weaponId: '',        // 从 customConfig 中提取
      customConfig: ''     // 对应 value，JSON字符串
    })

    // 计算属性：将 weaponId 字符串转换为数组
    const weaponIdList = computed(() => {
      if (!crawlForm.value.weaponId) return []
      return crawlForm.value.weaponId
        .split(',')
        .map(id => id.trim())
        .filter(id => id)
    })

    // 计算是否可以开始爬取
    const canStartCrawl = computed(() => {
      if (!crawlForm.value.steamId) return false
      if (!crawlForm.value.crawlMode) return false
      if (!crawlForm.value.dataSource) return false
      return true
    })

    // 加载Steam ID列表
    const loadSteamIdList = async () => {
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/webInventoryV1/steam_ids`)
        console.log('Steam ID API 响应:', response.data)
        if (response.data.success && response.data.data.length > 0) {
          steamIdList.value = response.data.data
          console.log('已加载 Steam ID 列表:', steamIdList.value)
          // 默认选择第一个
          if (!crawlForm.value.steamId && steamIdList.value.length > 0) {
            crawlForm.value.steamId = steamIdList.value[0].steam_id
          }
        }
      } catch (error) {
        console.error('加载Steam ID列表失败:', error)
        console.error('错误详情:', error.response)
        // 暂时不显示错误提示，避免干扰用户
        // ElMessage.error('加载Steam ID列表失败')
      }
    }

    // 验证JSON配置
    const validateJsonConfig = () => {
      if (!crawlForm.value.customConfig || crawlForm.value.customConfig.trim() === '') {
        return { valid: true, config: null }
      }

      try {
        const config = JSON.parse(crawlForm.value.customConfig)
        return { valid: true, config: config }
      } catch (error) {
        return { valid: false, error: error.message }
      }
    }

    // 开始爬取
    const startCrawl = async () => {
      if (!canStartCrawl.value) {
        ElMessage.warning('请完善爬取配置')
        return
      }

      // 验证JSON配置
      const jsonValidation = validateJsonConfig()
      if (!jsonValidation.valid) {
        ElMessage.error(`自定义配置JSON格式错误: ${jsonValidation.error}`)
        return
      }

      try {
        let confirmMessage = `确定要执行爬取操作吗？\n\nSteam ID: ${crawlForm.value.steamId}\n爬取模式: ${getModeLabel(crawlForm.value.crawlMode)}\n数据来源: ${getSourceLabel(crawlForm.value.dataSource)}`
        
        if (crawlForm.value.saveToDb) {
          confirmMessage += `\n保存到数据库: 是`
        }

        if (crawlForm.value.weaponId) {
          confirmMessage += `\n饰品ID: ${crawlForm.value.weaponId}`
        }

        if (jsonValidation.config) {
          confirmMessage += `\n自定义配置: 已设置`
        }

        await ElMessageBox.confirm(
          confirmMessage,
          '确认爬取',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch {
        return
      }

      isCrawling.value = true
      crawlResult.value = null
      ElMessage.info('开始执行爬取操作...')

      try {
        // 这里需要根据实际的后端API进行调整
        const requestData = {
          steamId: crawlForm.value.steamId,
          crawlMode: crawlForm.value.crawlMode,
          dataSource: crawlForm.value.dataSource,
          saveToDb: crawlForm.value.saveToDb,
          delay: crawlForm.value.delay,
          weaponId: crawlForm.value.weaponId,
          customConfig: jsonValidation.config
        }

        // TODO: 替换为实际的API端点
        // const response = await axios.post(`${API_CONFIG.SPIDER_BASE_URL}/youping898SpiderV1/getRenamedWeapons`, requestData)
        
        // 模拟API调用（需要替换为实际的API）
        console.log('爬取请求数据:', requestData)
        
        // 临时模拟响应
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const mockResponse = {
          data: {
            success: true,
            message: '爬取操作完成',
            data: {
              totalCrawled: 50,
              renamedCount: 35,
              savedCount: 35,
              duration: 2.5
            }
          }
        }

        if (mockResponse.data.success) {
          crawlResult.value = {
            success: true,
            message: mockResponse.data.message,
            ...mockResponse.data.data
          }
          ElMessage.success('爬取操作完成！')
        } else {
          crawlResult.value = {
            success: false,
            message: mockResponse.data.message
          }
          ElMessage.error(`爬取失败: ${mockResponse.data.message}`)
        }
      } catch (error) {
        console.error('爬取操作失败:', error)
        let errorMessage = '爬取操作失败'
        
        if (error.response) {
          errorMessage = error.response.data?.message || `操作失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到服务器，请检查服务是否运行'
        } else {
          errorMessage = error.message || '爬取操作失败'
        }
        
        crawlResult.value = {
          success: false,
          message: errorMessage
        }
        ElMessage.error(errorMessage)
      } finally {
        isCrawling.value = false
      }
    }

    // 重置表单
    const resetForm = () => {
      crawlForm.value = {
        configName: '',
        steamId: steamIdList.value.length > 0 ? steamIdList.value[0].steam_id : '',
        platformType: 'youpin',
        weaponId: '',
        customConfig: ''
      }
      crawlResult.value = null
    }

    // 获取模式标签
    const getModeLabel = (mode) => {
      const labels = {
        all: '爬取所有已改名饰品',
        new: '仅爬取新改名饰品',
        incremental: '增量更新'
      }
      return labels[mode] || mode
    }

    // 获取来源标签
    const getSourceLabel = (source) => {
      const labels = {
        youpin: '悠悠有品',
        buff: 'BUFF',
        steam: 'Steam库存'
      }
      return labels[source] || source
    }

    // 加载配置列表
    const loadConfigList = async () => {
      try {
        // 只加载 key2 = spider 的配置
        const response = await axios.get(`${API_CONFIG.BASE_URL}/configV1/list`, {
          params: {
            key2: 'spider'
          }
        })
        
        console.log('配置列表响应:', response.data)
        
        // 根据 key1 字段判断平台类型
        savedConfigs.value = (response.data.data || []).map(config => ({
          ...config,
          platformType: config.key1 === 'spider_buff' ? 'buff' : 'youpin'
        }))
        
        // 按ID降序排序
        savedConfigs.value.sort((a, b) => b.id - a.id)
        
        console.log('加载的配置列表:', savedConfigs.value)
      } catch (error) {
        console.error('加载配置列表失败:', error)
        // ElMessage.error('加载配置列表失败')
      }
    }

    // 选择并加载配置
    const selectConfig = async (configId) => {
      console.log('=== 开始加载配置 ===')
      console.log('配置ID:', configId)
      
      if (!configId) {
        console.warn('配置ID为空')
        return
      }

      selectedConfigId.value = configId
      console.log('已设置selectedConfigId:', selectedConfigId.value)

      try {
        const config = savedConfigs.value.find(c => c.id === configId)
        console.log('找到的配置对象:', config)
        
        if (config && config.value) {
          // 解析 value 字段（JSON字符串）
          let valueObj
          try {
            valueObj = typeof config.value === 'string' 
              ? JSON.parse(config.value) 
              : config.value
            console.log('解析后的配置值:', valueObj)
          } catch (parseError) {
            console.error('JSON解析失败:', parseError)
            ElMessage.error('配置数据格式错误')
            return
          }
          
          // 从 value 对象中提取饰品ID
          const weaponId = valueObj.weapon_id || ''
          const steamId = valueObj.steam_id || ''
          
          console.log('提取的数据:')
          console.log('  - weaponId:', weaponId)
          console.log('  - steamId:', steamId)
          console.log('  - platformType:', config.platformType)
          
          // 构建新的表单数据
          const newFormData = {
            configName: config.dataName || '',
            steamId: steamId,
            platformType: config.platformType || 'youpin',
            weaponId: weaponId,
            customConfig: JSON.stringify(valueObj, null, 2) // 显示完整的原始配置
          }
          
          console.log('准备填充的表单数据:', newFormData)
          
          // 加载配置数据到表单
          crawlForm.value = newFormData
          
          // 等待下一个tick确保数据已更新
          await new Promise(resolve => setTimeout(resolve, 50))
          
          console.log('表单填充完成，当前表单值:')
          console.log('  - configName:', crawlForm.value.configName)
          console.log('  - steamId:', crawlForm.value.steamId)
          console.log('  - platformType:', crawlForm.value.platformType)
          console.log('  - weaponId:', crawlForm.value.weaponId)
          console.log('  - customConfig:', crawlForm.value.customConfig)
          console.log('=== 配置加载完成 ===')
          
          ElMessage.success(`已加载配置: ${config.dataName}`)
        } else {
          console.warn('配置缺少value字段:', config)
          ElMessage.warning('配置数据为空')
        }
      } catch (error) {
        console.error('加载配置失败:', error)
        console.error('错误堆栈:', error.stack)
        ElMessage.error(`加载配置失败: ${error.message}`)
      }
    }

    // 创建新配置（清空表单）
    const createNewConfig = () => {
      selectedConfigId.value = null
      resetForm()
      ElMessage.info('已清空表单，可以创建新配置')
    }

    // 显示保存配置对话框
    const showSaveConfigDialog = () => {
      saveConfigForm.value = {
        name: crawlForm.value.configName || ''
      }
      saveConfigDialogVisible.value = true
    }

    // 保存配置
    const saveConfig = async () => {
      if (!saveConfigForm.value.name) {
        ElMessage.warning('请输入配置名称')
        return
      }

      try {
        // 构建 value 对象
        let valueObj = {}
        
        // 如果有自定义配置，先解析
        if (crawlForm.value.customConfig) {
          try {
            valueObj = JSON.parse(crawlForm.value.customConfig)
          } catch (e) {
            ElMessage.error('自定义配置JSON格式错误')
            return
          }
        }
        
        // 将饰品ID添加到 value 对象中
        if (crawlForm.value.weaponId) {
          valueObj.weapon_id = crawlForm.value.weaponId
        }
        
        // 添加其他必要字段
        if (crawlForm.value.steamId) {
          valueObj.steam_id = crawlForm.value.steamId
        }

        // 根据平台类型设置 key1
        const key1 = crawlForm.value.platformType === 'buff' ? 'spider_buff' : 'spider_youpin'

        const configData = {
          dataName: saveConfigForm.value.name,
          key1: key1,
          key2: 'spider',
          value: JSON.stringify(valueObj)
        }

        // TODO: 替换为实际的API端点
        const response = await axios.post(`${API_CONFIG.BASE_URL}/configV1/save`, configData)
        
        if (response.data.success) {
          ElMessage.success('保存配置成功')
          saveConfigDialogVisible.value = false
          
          // 重新加载配置列表
          await loadConfigList()
        } else {
          throw new Error(response.data.message || '保存配置失败')
        }
      } catch (error) {
        console.error('保存配置失败:', error)
        const errorMessage = error.response?.data?.message || error.message || '保存配置失败'
        ElMessage.error(errorMessage)
      }
    }

    // 删除配置
    const deleteConfig = async (configId) => {
      if (!configId) {
        return
      }

      try {
        const config = savedConfigs.value.find(c => c.id === configId)
        
        await ElMessageBox.confirm(
          `确定要删除配置 "${config.name}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        // TODO: 替换为实际的API端点
        const response = await axios.delete(`${API_CONFIG.BASE_URL}/configV1/delete/${configId}`)
        
        if (response.data.success) {
          ElMessage.success('删除配置成功')
          
          // 如果删除的是当前选中的配置，清空选中状态
          if (selectedConfigId.value === configId) {
            selectedConfigId.value = null
          }
          
          // 重新加载配置列表
          await loadConfigList()
        } else {
          throw new Error(response.data.message || '删除配置失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除配置失败:', error)
          const errorMessage = error.response?.data?.message || error.message || '删除配置失败'
          ElMessage.error(errorMessage)
        }
      }
    }

    // 格式化时间
    const formatTime = (timestamp) => {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 搜索饰品
    const handleSearchWeapon = async () => {
      if (!weaponSearchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
      }

      isSearchingWeapon.value = true
      
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/webSelectWeaponV1/searchWeaponDetail`, {
          params: {
            keyword: weaponSearchKeyword.value.trim()
          }
        })
        
        if (response.data.success) {
          weaponSearchResults.value = response.data.data || []
          
          if (weaponSearchResults.value.length === 0) {
            ElMessage.info('未找到匹配的饰品')
          } else {
            ElMessage.success(`找到 ${weaponSearchResults.value.length} 件饰品`)
          }
        } else {
          ElMessage.error(response.data.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索饰品失败:', error)
        const errorMessage = error.response?.data?.message || error.message || '搜索饰品失败'
        ElMessage.error(errorMessage)
      } finally {
        isSearchingWeapon.value = false
      }
    }

    // 清除搜索结果
    const clearWeaponSearch = () => {
      weaponSearchResults.value = []
      weaponSearchKeyword.value = ''
    }

    // 根据平台类型获取对应的饰品ID
    const getWeaponIdByPlatform = (row) => {
      if (crawlForm.value.platformType === 'buff') {
        return row.buff_id
      } else {
        return row.yyyp_id
      }
    }

    // 添加饰品ID到表单
    const addWeaponId = (row) => {
      const weaponId = getWeaponIdByPlatform(row)
      
      if (!weaponId) {
        const platformName = crawlForm.value.platformType === 'buff' ? 'BUFF' : '悠悠有品'
        ElMessage.warning(`该饰品没有${platformName}ID`)
        return
      }

      const currentIds = crawlForm.value.weaponId ? crawlForm.value.weaponId.split(',').map(id => id.trim()).filter(id => id) : []
      
      if (currentIds.includes(weaponId.toString())) {
        ElMessage.warning('该饰品ID已存在')
        return
      }
      
      currentIds.push(weaponId.toString())
      crawlForm.value.weaponId = currentIds.join(',')
      
      const platformName = crawlForm.value.platformType === 'buff' ? 'BUFF' : '悠悠有品'
      ElMessage.success(`已添加${platformName}饰品ID: ${weaponId}`)
    }

    // 删除饰品ID
    const removeWeaponId = (idToRemove) => {
      const currentIds = crawlForm.value.weaponId 
        ? crawlForm.value.weaponId.split(',').map(id => id.trim()).filter(id => id) 
        : []
      
      const filteredIds = currentIds.filter(id => id !== idToRemove.toString())
      crawlForm.value.weaponId = filteredIds.join(',')
      
      ElMessage.success(`已删除饰品ID: ${idToRemove}`)
    }

    // 表格行样式
    const getRowClassName = () => {
      return 'weapon-row'
    }

    // 组件挂载时加载数据
    onMounted(() => {
      loadSteamIdList()
      loadConfigList()
    })

    return {
      crawlFormRef,
      steamIdList,
      isCrawling,
      crawlForm,
      crawlResult,
      canStartCrawl,
      startCrawl,
      resetForm,
      getModeLabel,
      getSourceLabel,
      // 配置管理
      savedConfigs,
      selectedConfigId,
      saveConfigDialogVisible,
      saveConfigForm,
      loadConfigList,
      selectConfig,
      createNewConfig,
      showSaveConfigDialog,
      saveConfig,
      deleteConfig,
      formatTime,
      // 饰品搜索
      weaponSearchKeyword,
      weaponSearchResults,
      isSearchingWeapon,
      handleSearchWeapon,
      clearWeaponSearch,
      getWeaponIdByPlatform,
      addWeaponId,
      removeWeaponId,
      weaponIdList,
      getRowClassName
    }
  }
}
</script>

<style scoped>
.spider-weapon-rename-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
  padding: 2rem;
}

.page-header {
  margin-bottom: 1rem;
  padding: 1rem;
}

.back-button {
  /* 按钮样式 */
}

.page-layout {
  display: flex;
  gap: 1.5rem;
  min-height: calc(100vh - 150px);
}

/* 左侧配置管理栏 */
.config-sidebar {
  width: 320px;
  background-color: #1e1e1e;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 150px);
  position: sticky;
  top: 1rem;
}

.sidebar-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #333;
}

.sidebar-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #4CAF50;
  margin: 0;
}

.config-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding-right: 0.5rem;
}

.config-item {
  background-color: #252525;
  border: 1px solid #333;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.config-item:hover {
  border-color: #4CAF50;
  background-color: #2a2a2a;
}

.config-item.active {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.config-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.config-name {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  flex: 1;
  margin-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-item-meta {
  margin-bottom: 0.25rem;
}

.config-time {
  font-size: 0.75rem;
  color: #888;
}

.config-description {
  font-size: 0.875rem;
  color: #aaa;
  margin-top: 0.5rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty-config {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.sidebar-actions {
  padding-top: 1rem;
  border-top: 1px solid #333;
}

/* 右侧主内容区域 */
.main-content-area {
  flex: 1;
  min-width: 0;
}

.content-card {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #252525;
  border-radius: 0.75rem;
  border: 1px solid #333;
}

.search-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #252525;
  border-radius: 0.75rem;
  border: 1px solid #333;
}

.search-container {
  margin-bottom: 1.5rem;
}

.weapon-search-input {
  width: 100%;
}

.search-results-table {
  margin-top: 1rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #2a2a2a;
  border-radius: 0.5rem 0.5rem 0 0;
  border: 1px solid #333;
  border-bottom: none;
}

.results-title {
  font-size: 1rem;
  font-weight: 600;
  color: #4CAF50;
}

.weapon-name {
  color: #fff;
  font-weight: 500;
}

.hash-name-text {
  color: #aaa;
  font-size: 0.875rem;
}

.no-data {
  color: #666;
  font-size: 0.875rem;
}

.weapon-row {
  cursor: pointer;
}

.weapon-row:hover {
  background-color: rgba(76, 175, 80, 0.1) !important;
}

.tool-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #444;
}

.form-container {
  background-color: #2a2a2a;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0;
}

.form-item-half {
  flex: 1;
  margin-bottom: 18px;
}

.form-item-third {
  flex: 1;
  margin-bottom: 18px;
}

.form-hint {
  color: #888;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.weapon-id-tags {
  min-height: 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 8px;
  background-color: #1e1e1e;
  border-radius: 4px;
  border: 1px solid #3a3a3a;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

/* 结果区域 */
.result-section {
  background-color: #2a2a2a;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.result-info {
  display: grid;
  gap: 1rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #333;
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  color: #888;
  font-weight: 500;
}

.result-value {
  color: #fff;
  font-weight: 600;
}

.result-value.success {
  color: #67C23A;
}

.result-value.error {
  color: #F56C6C;
}

.result-value.highlight {
  color: #E6A23C;
  font-size: 1.1rem;
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

:deep(.el-textarea__inner) {
  background-color: #1e1e1e;
  color: #fff;
  border-color: #444;
}

:deep(.el-textarea__inner:hover) {
  border-color: #4CAF50;
}

:deep(.el-textarea__inner:focus) {
  border-color: #4CAF50;
}

:deep(.el-select .el-input__wrapper) {
  background-color: #1e1e1e;
}

:deep(.el-form-item__label) {
  color: #aaa;
}

:deep(.el-switch) {
  --el-switch-on-color: #4CAF50;
  --el-switch-off-color: #555;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .page-layout {
    flex-direction: column;
  }

  .config-sidebar {
    width: 100%;
    max-height: 400px;
    position: static;
    margin-bottom: 1rem;
  }

  .config-list {
    max-height: 250px;
  }
}

@media (max-width: 768px) {
  .spider-weapon-rename-container {
    padding: 1rem;
  }

  .page-header {
    padding: 0.5rem;
  }

  .back-button {
    width: 100%;
  }

  .config-sidebar {
    padding: 1rem;
  }

  .sidebar-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-section {
    padding: 1rem;
  }

  .form-container {
    padding: 1rem;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-item-half {
    width: 100%;
  }

  .form-item-third {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}

/* 滚动条样式 */
.config-list::-webkit-scrollbar {
  width: 8px;
}

.config-list::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 4px;
}

.config-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.config-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

