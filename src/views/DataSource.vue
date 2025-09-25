<template>
  <div>
    <h1 class="page-title">数据源</h1>
    
    <div class="data-source-container">
      <div class="data-sources-list">
        <div class="card">
          <div class="card-header">
            <h3>数据源</h3>
            <div class="header-buttons">
              <el-button type="primary" @click="openAddDialog">
                <el-icon><Plus /></el-icon>
                添加新数据源
              </el-button>
              <el-button type="primary" @click="refreshAllSources" :loading="refreshing">
                刷新所有
              </el-button>
            </div>
          </div>
          
          <div class="grid grid-datasource">
            <div 
              v-for="source in dataSources" 
              :key="source.dataID" 
              class="source-card"
              :class="{ disabled: !source.enabled }"
            >
              <div class="source-header">
                <div class="source-info">
                  <h4>{{ source.dataName }}</h4>
                  <el-tag :type="getSourceTypeColor(source.type)">{{ getSourceTypeLabel(source.type) }}</el-tag>
                </div>
                <div class="source-status">
                  <el-tag :type="source.status === 'online' ? 'success' : 'danger'" size="small">
                    {{ source.status === 'online' ? '在线' : '离线' }}
                  </el-tag>
                </div>
              </div>
              
              <div class="source-details">
                <p><strong>更新频率:</strong> {{ getUpdateFreqLabel(source.updateFreq) }}</p>
                <p><strong>最后更新:</strong> {{ formatTime(source.lastUpdate) }}</p>
              </div>
              
              <div class="source-actions">
                <el-switch 
                  v-model="source.enabled" 
                  @change="toggleSource(source)"
                />
                <el-button type="primary" size="small" @click="editSource(source)">
                  编辑
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="startCollection(source)" 
                  :disabled="!source.enabled"
                  :loading="collectingSourceIds.has(source.dataID)"
                >
                  {{ collectingSourceIds.has(source.dataID) ? '采集中...' : '采集' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 编辑数据源对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑数据源"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleEditDialogClose"
    >
      <el-form :model="editForm" label-width="120px" ref="editFormRef">
        <el-form-item label="数据源名称" required>
          <el-input 
            v-model="editForm.name" 
            placeholder="请输入数据源名称"
          />
        </el-form-item>
        <el-form-item label="数据源类型">
          <el-select v-model="editForm.type" placeholder="选择数据源类型" style="width: 100%;" disabled>
            <el-option label="BUFF" value="buff" />
            <el-option label="Steam市场" value="steam" />
            <el-option label="悠悠有品" value="youpin" />
            <el-option label="C5GAME" value="c5game" />
            <el-option label="IGXE" value="igxe" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <!-- 悠悠有品特有配置 -->
        <template v-if="editForm.type === 'youpin'">
          <el-form-item label="手机号" required>
            <el-input v-model="editForm.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="Session ID" required>
            <el-input v-model="editForm.sessionid" placeholder="请输入Session ID" />
          </el-form-item>
          <el-form-item label="Token" required>
            <el-input 
              v-model="editForm.token" 
              type="textarea"
              :rows="2"
              placeholder="请输入Token"
            />
          </el-form-item>
          <el-form-item label="设备名称" required>
            <el-input v-model="editForm.deviceName" placeholder="请输入设备名称" />
          </el-form-item>
          <el-form-item label="应用版本" required>
            <el-input v-model="editForm.appVersion" placeholder="请输入应用版本" />
          </el-form-item>
          <el-form-item label="更新频率">
            <el-select v-model="editForm.updateFreq" placeholder="选择更新频率" style="width: 100%;">
              <el-option label="每15分钟" value="15min" />
              <el-option label="每小时" value="1hour" />
              <el-option label="每3小时" value="3hour" />
              <el-option label="每6小时" value="6hour" />
              <el-option label="每12小时" value="12hour" />
              <el-option label="每天" value="daily" />
            </el-select>
          </el-form-item>
          <el-form-item label="应用类型" required>
            <el-input v-model="editForm.appType" placeholder="请输入应用类型" />
          </el-form-item>
          <el-form-item label="用户ID" required>
            <el-input v-model="editForm.userId" placeholder="请输入用户ID" />
          </el-form-item>
          <el-form-item label="SteamID" required>
            <el-input v-model="editForm.steamId" placeholder="请输入SteamID" />
          </el-form-item>
        </template>

        <!-- BUFF特有配置 -->
        <template v-else-if="editForm.type === 'buff'">
          <el-form-item label="Cookie" required>
            <el-input 
              v-model="editForm.cookie" 
              type="textarea"
              :rows="3"
              placeholder="请输入Cookie"
            />
          </el-form-item>
          <el-form-item label="system_version" required>
            <el-input v-model="editForm.systemVersion" placeholder="请输入system_version" />
          </el-form-item>
          <el-form-item label="system_type" required>
            <el-input v-model="editForm.systemType" placeholder="请输入system_type" />
          </el-form-item>
          <el-form-item label="SteamID" required>
            <el-input v-model="editForm.steamID" placeholder="请输入SteamID" />
          </el-form-item>
          <el-form-item label="更新频率">
            <el-select v-model="editForm.updateFreq" placeholder="选择更新频率" style="width: 100%;">
              <el-option label="每15分钟" value="15min" />
              <el-option label="每小时" value="1hour" />
              <el-option label="每3小时" value="3hour" />
              <el-option label="每6小时" value="6hour" />
              <el-option label="每12小时" value="12hour" />
              <el-option label="每天" value="daily" />
            </el-select>
          </el-form-item>
        </template>

        <!-- 通用配置 -->
        <template v-else>
          <el-form-item label="API地址">
            <el-input v-model="editForm.apiUrl" placeholder="请输入API地址" />
          </el-form-item>
          <el-form-item label="API密钥">
            <el-input 
              v-model="editForm.apiKey" 
              type="textarea"
              :rows="2"
              placeholder="请输入API密钥"
            />
          </el-form-item>
          <el-form-item label="休眠时间(秒)">
            <el-input-number v-model="editForm.sleepTime" :min="1" :max="86400" style="width: 100%;" />
          </el-form-item>
        </template>

        <el-form-item label="启用状态">
          <el-switch v-model="editForm.enabled" />
        </el-form-item>

      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <div class="dialog-footer-left">
            <el-button 
              v-if="editForm.type === 'youpin'" 
              type="warning" 
              @click="handleEditCollectAll"
              :loading="collectingSourceIds.has(editingSourceId)"
              :disabled="!editForm.enabled"
            >
              全部采集
            </el-button>
            <el-button 
              v-if="editForm.type === 'buff'" 
              type="warning" 
              @click="handleEditBuffCollectAll"
              :loading="collectingSourceIds.has(editingSourceId)"
              :disabled="!editForm.enabled"
            >
              全部获取
            </el-button>
            <el-button 
              type="danger" 
              @click="handleEditDelete"
            >
              删除数据源
            </el-button>
          </div>
          <div class="dialog-footer-right">
            <el-button @click="editDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleEditSubmit" :loading="editSubmitting">
              保存更改
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 添加数据源对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加新数据源"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleAddDialogClose"
    >
      <el-form :model="inputForm" label-width="120px" @submit.prevent="handleSubmit">
        <el-form-item label="数据源名称" required>
          <el-input 
            v-model="inputForm.name" 
            placeholder="请输入数据源名称"
          />
        </el-form-item>
        <el-form-item label="数据源类型" required>
          <el-select v-model="inputForm.type" placeholder="选择数据源类型" style="width: 100%;">
            <el-option label="BUFF" value="buff" />
            <el-option label="Steam市场" value="steam" />
            <el-option label="悠悠有品" value="youpin" />
            <el-option label="C5GAME" value="c5game" />
            <el-option label="IGXE" value="igxe" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <!-- BUFF特有配置 -->
        <template v-if="inputForm.type === 'buff'">
          <el-form-item label="Cookie" required>
            <el-input 
              v-model="inputForm.cookie" 
              type="textarea"
              :rows="3"
              placeholder="请输入Cookie"
            />
          </el-form-item>
          <el-form-item label="system_version" required>
            <el-input 
              v-model="inputForm.systemVersion" 
              placeholder="请输入system_version"
            />
          </el-form-item>
          <el-form-item label="system_type" required>
            <el-input 
              v-model="inputForm.systemType" 
              placeholder="请输入system_type"
            />
          </el-form-item>
          <el-form-item label="SteamID" required>
            <el-input 
              v-model="inputForm.steamID" 
              placeholder="请输入SteamID"
            />
          </el-form-item>
          <el-form-item label="更新频率">
            <el-select v-model="inputForm.updateFreq" placeholder="选择更新频率" style="width: 100%;">
              <el-option label="每15分钟" value="15min" />
              <el-option label="每小时" value="1hour" />
              <el-option label="每3小时" value="3hour" />
              <el-option label="每6小时" value="6hour" />
              <el-option label="每12小时" value="12hour" />
              <el-option label="每天" value="daily" />
            </el-select>
          </el-form-item>
        </template>
        
        <!-- 通用配置 -->
        <template v-else-if="inputForm.type && inputForm.type !== 'youpin'">
          <el-form-item label="API地址">
            <el-input 
              v-model="inputForm.apiUrl" 
              placeholder="请输入API地址"
            />
          </el-form-item>
          <el-form-item label="API密钥">
            <el-input 
              v-model="inputForm.apiKey" 
              type="password"
              show-password
              placeholder="请输入API密钥"
            />
          </el-form-item>
          <el-form-item label="更新频率">
            <el-select v-model="inputForm.updateFreq" placeholder="选择更新频率" style="width: 100%;">
              <el-option label="每15分钟" value="15min" />
              <el-option label="每小时" value="1hour" />
              <el-option label="每3小时" value="3hour" />
              <el-option label="每6小时" value="6hour" />
              <el-option label="每12小时" value="12hour" />
              <el-option label="每天" value="daily" />
            </el-select>
          </el-form-item>
        </template>
        
        <!-- 悠悠有品特有配置 -->
        <template v-if="inputForm.type === 'youpin'">
          <el-form-item label="手机号" required>
            <el-input 
              v-model="inputForm.phone" 
              placeholder="请输入手机号"
            />
          </el-form-item>
          <el-form-item label="Session ID" required>
            <el-input 
              v-model="inputForm.sessionid" 
              placeholder="请输入Session ID"
            />
          </el-form-item>
          <el-form-item label="Token" required>
            <el-input 
              v-model="inputForm.token" 
              type="textarea"
              :rows="2"
              placeholder="请输入Token"
            />
          </el-form-item>
          <el-form-item label="设备名称" required>
            <el-input 
              v-model="inputForm.deviceName" 
              placeholder="请输入设备名称"
            />
          </el-form-item>
          <el-form-item label="应用版本" required>
            <el-input 
              v-model="inputForm.appVersion" 
              placeholder="请输入应用版本"
            />
          </el-form-item>
          <el-form-item label="更新频率">
            <el-select v-model="inputForm.updateFreq" placeholder="选择更新频率" style="width: 100%;">
              <el-option label="每15分钟" value="15min" />
              <el-option label="每小时" value="1hour" />
              <el-option label="每3小时" value="3hour" />
              <el-option label="每6小时" value="6hour" />
              <el-option label="每12小时" value="12hour" />
              <el-option label="每天" value="daily" />
            </el-select>
          </el-form-item>
          <el-form-item label="应用类型" required>
            <el-input 
              v-model="inputForm.appType" 
              placeholder="请输入应用类型"
            />
          </el-form-item>
          <el-form-item label="用户ID" required>
            <el-input 
              v-model="inputForm.userId" 
              placeholder="请输入用户ID"
            />
          </el-form-item>
          <el-form-item label="SteamID" required>
            <el-input 
              v-model="inputForm.steamId" 
              placeholder="请输入SteamID"
            />
          </el-form-item>
        </template>
        
        <el-form-item label="启用状态">
          <el-switch v-model="inputForm.enabled" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            添加数据源
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import { apiUrls } from '@/config/api.js'

export default {
  name: 'DataSource',
  components: {
    Plus
  },
  setup() {
    const submitting = ref(false)
    const testing = ref(false)
    const refreshing = ref(false)
    const editingSourceId = ref(null)
    const collectingSourceIds = ref(new Set())
    const editDialogVisible = ref(false)
    const editSubmitting = ref(false)
    const addDialogVisible = ref(false)
    const editForm = ref({
      name: '',
      type: '',
      apiUrl: '',
      apiKey: '',
      updateFreq: '15min',
      enabled: true,
      // 悠悠有品特有字段
      phone: '',
      sessionid: '',
      token: '',
      deviceName: '',
      appVersion: '',
      sleepTime: 6000,
      appType: '',
      userId: '',
      steamId: '',
      // BUFF特有字段
      cookie: '',
      systemVersion: '',
      systemType: '',
      steamID: ''
    })
    
    const inputForm = ref({
      name: '',
      type: '',
      apiUrl: '',
      apiKey: '',
      updateFreq: '15min',
      enabled: true,
      // 悠悠有品特有字段
      phone: '',
      sessionid: '',
      token: '',
      deviceName: '',
      appVersion: '',
      sleepTime: 6000,
      appType: '',
      userId: '',
      steamId: '',
      // BUFF特有字段
      cookie: '',
      systemVersion: '',
      systemType: '',
      steamID: ''
    })

    const dataSources = ref([])

    const getSourceTypeLabel = (type) => {
      const labels = {
        buff: 'BUFF',
        steam: 'Steam',
        youpin: '悠悠有品',
        c5game: 'C5GAME',
        igxe: 'IGXE',
        other: '其他'
      }
      return labels[type] || type
    }

    const getSourceTypeColor = (type) => {
      const colors = {
        buff: 'warning',
        steam: 'primary',
        youpin: 'success',
        c5game: 'info',
        igxe: 'danger',
        other: ''
      }
      return colors[type] || ''
    }

    const getUpdateFreqLabel = (freq) => {
      const labels = {
        '15min': '每15分钟',
        '1hour': '每小时',
        '3hour': '每3小时',
        '6hour': '每6小时',
        '12hour': '每12小时',
        daily: '每天'
      }
      return labels[freq] || freq
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    const handleSubmit = async () => {
      if (!inputForm.value.name || !inputForm.value.type) {
        ElMessage.error('请填写必要信息')
        return
      }

      // BUFF类型的字段校验
      if (inputForm.value.type === 'buff') {
        if (!inputForm.value.cookie) {
          ElMessage.error('请填写Cookie')
          return
        }
        if (!inputForm.value.systemVersion) {
          ElMessage.error('请填写system_version')
          return
        }
        if (!inputForm.value.systemType) {
          ElMessage.error('请填写system_type')
          return
        }
        if (!inputForm.value.steamID) {
          ElMessage.error('请填写SteamID')
          return
        }
      }

      // 悠悠有品类型的字段校验
      if (inputForm.value.type === 'youpin') {
        if (!inputForm.value.phone) {
          ElMessage.error('请填写手机号')
          return
        }
        if (!inputForm.value.sessionid) {
          ElMessage.error('请填写Session ID')
          return
        }
        if (!inputForm.value.token) {
          ElMessage.error('请填写Token')
          return
        }
        if (!inputForm.value.deviceName) {
          ElMessage.error('请填写设备名称')
          return
        }
        if (!inputForm.value.appVersion) {
          ElMessage.error('请填写应用版本')
          return
        }
        if (!inputForm.value.appType) {
          ElMessage.error('请填写应用类型')
          return
        }
        if (!inputForm.value.userId) {
          ElMessage.error('请填写用户ID')
          return
        }
        if (!inputForm.value.steamId) {
          ElMessage.error('请填写SteamID')
          return
        }
      }

      submitting.value = true
      try {
        let requestData = {
          dataName: inputForm.value.name,
          type: inputForm.value.type,
          enabled: inputForm.value.enabled
        }

        // 根据数据源类型构建配置JSON字符串
        if (inputForm.value.type === 'youpin') {
          // 悠悠有品特殊配置
          requestData.configJson = JSON.stringify({
            phone: inputForm.value.phone,
            Sessionid: inputForm.value.sessionid,
            token: inputForm.value.token,
            DeviceName: inputForm.value.deviceName,
            app_version: inputForm.value.appVersion,
            sleep_time: inputForm.value.sleepTime.toString(),
            app_type: inputForm.value.appType,
            userId: inputForm.value.userId,
            steamId: inputForm.value.steamId
          })
        } else if (inputForm.value.type === 'buff') {
          // BUFF特殊配置
          requestData.configJson = JSON.stringify({
            cookie: inputForm.value.cookie,
            system_version: inputForm.value.systemVersion,
            system_type: inputForm.value.systemType,
            steamID: inputForm.value.steamID,
            updateFreq: inputForm.value.updateFreq,
            sleep_time: '6000'
          })
        } else {
          requestData.configJson = JSON.stringify({
            apiUrl: inputForm.value.apiUrl,
            apiKey: inputForm.value.apiKey,
            updateFreq: inputForm.value.updateFreq,
            sleep_time: '6000'
          })
        }

        let response
        if (editingSourceId.value) {
          const url = apiUrls.dataSourceById(editingSourceId.value)
          response = await axios.put(url, requestData)
        } else {
          const url = apiUrls.dataSource()
          response = await axios.post(url, requestData)
        }

        const result = response.data
        
        if (result.success) {
          const action = editingSourceId.value ? '更新' : '添加'
          ElMessage.success(`数据源${action}成功`)
          resetForm()
          editingSourceId.value = null
          addDialogVisible.value = false // 关闭添加对话框
          loadDataSources()
        } else {
          const action = editingSourceId.value ? '更新' : '添加'
          ElMessage.error(result.message || `${action}数据源失败`)
        }
      } catch (error) {
        console.error('操作数据源失败:', error)
        let errorMessage = '操作失败'
        
        if (error.response) {
          // 服务器返回了错误响应
          errorMessage = error.response.data?.message || `服务器错误 (${error.response.status})`
          console.error('服务器响应错误:', error.response.data)
        } else if (error.request) {
          // 请求发送了但没有收到响应
          errorMessage = '网络连接失败，请检查API服务器是否运行'
          console.error('网络请求错误:', error.request)
        } else {
          // 其他错误
          errorMessage = error.message || '未知错误'
          console.error('其他错误:', error.message)
        }
        
        ElMessage.error(errorMessage)
      } finally {
        submitting.value = false
      }
    }

    const resetForm = () => {
      inputForm.value = {
        name: '',
        type: '',
        apiUrl: '',
        apiKey: '',
        updateFreq: '15min',
        enabled: true,
        // 悠悠有品特有字段
        phone: '',
        sessionid: '',
        token: '',
        deviceName: '',
        appVersion: '',
        sleepTime: 6000,
        appType: '',
        userId: '',
        steamId: '',
        // BUFF特有字段
        cookie: '',
        systemVersion: '',
        systemType: '',
        steamID: ''
      }
      editingSourceId.value = null
    }

    const testConnection = async () => {
      if (!inputForm.value.apiUrl) {
        ElMessage.error('请输入API地址')
        return
      }

      testing.value = true
      try {
        const response = await axios.post(apiUrls.dataSourceTest(), {
          type: inputForm.value.type,
          apiUrl: inputForm.value.apiUrl,
          apiKey: inputForm.value.apiKey
        })

        const result = response.data
        
        if (result.success) {
          ElMessage.success('连接测试成功')
        } else {
          ElMessage.error(result.message || '连接测试失败')
        }
      } catch (error) {
        console.error('连接测试失败:', error)
        let errorMessage = '连接测试失败'
        
        if (error.response) {
          errorMessage = error.response.data?.message || `测试失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到API服务器'
        } else {
          errorMessage = error.message || '测试失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        testing.value = false
      }
    }

    const testSourceConnection = async (source) => {
      ElMessage.info(`正在测试 ${source.dataName} 连接...`)
      
      try {
        const response = await axios.post(apiUrls.dataSourceTest(), {
          type: source.type,
          apiUrl: source.apiUrl,
          apiKey: '' // 不发送实际的API密钥
        })

        const result = response.data
        
        if (result.success) {
          ElMessage.success(`${source.dataName} 连接正常`)
        } else {
          ElMessage.error(`${source.dataName} 连接失败: ${result.message}`)
        }
      } catch (error) {
        console.error('测试数据源连接失败:', error)
        let errorMessage = `${source.dataName} 连接测试失败`
        
        if (error.response) {
          errorMessage = error.response.data?.message || `测试失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到API服务器'
        } else {
          errorMessage = error.message || '测试失败'
        }
        
        ElMessage.error(errorMessage)
      }
    }

    // 悠悠有品专用爬虫采集函数
    const startYoupinSpiderCollection = async (source) => {
      if (!source.enabled) {
        ElMessage.warning('请先启用数据源')
        return
      }

      if (collectingSourceIds.value.has(source.dataID)) {
        ElMessage.info('该数据源正在采集中...')
        return
      }

      try {
        // 添加到采集中的列表
        collectingSourceIds.value.add(source.dataID)
        
        ElMessage.info(`开始使用爬虫采集悠悠有品数据: ${source.dataName}`)
        
        // 准备发送给爬虫的数据 - 按照后端API期望的字段名
        const spiderData = {
          // 后端API需要的字段
          phone: source.config?.yyyp_phone || '',
          sessionid: source.config?.yyyp_Sessionid || '',
          token: source.config?.yyyp_token || '',
          app_version: source.config?.yyyp_app_version || '',
          app_type: source.config?.yyyp_app_type || '',
          userId: source.config?.yyyp_userId || '',
          
          // 额外的数据源信息（可选）
          dataID: source.dataID,
          dataName: source.dataName,
          type: source.type,
          enabled: source.enabled,
          deviceName: source.config?.yyyp_DeviceName || '',
          sleepTime: source.config?.yyyp_sleep_time || '6000'
        }
        
        console.log('发送给爬虫的数据:', spiderData)
        
        // 调用爬虫API
        const response = await axios.post(apiUrls.youpinSpider(), spiderData)

        // 后端成功返回 200 状态码和 "获取完成" 消息
        if (response.status === 200) {
          ElMessage.success(`${source.dataName} 悠悠有品爬虫采集完成！`)
          console.log('悠悠有品爬虫采集响应:', response.data)
          
          // 更新数据源的最后更新时间
          source.lastUpdate = new Date()
        } else {
          ElMessage.error(`悠悠有品爬虫采集失败: ${response.data}`)
        }
      } catch (error) {
        console.error('悠悠有品爬虫采集失败:', error)
        let errorMessage = `悠悠有品爬虫采集 ${source.dataName} 失败`
        
        if (error.response) {
          errorMessage = error.response.data?.message || `悠悠有品爬虫采集失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到悠悠有品爬虫服务器'
        } else {
          errorMessage = error.message || '悠悠有品爬虫采集失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        // 从采集中的列表移除
        collectingSourceIds.value.delete(source.dataID)
      }
    }

    // BUFF专用爬虫采集函数
    const startBuffSpiderCollection = async (source) => {
      if (!source.enabled) {
        ElMessage.warning('请先启用数据源')
        return
      }

      if (collectingSourceIds.value.has(source.dataID)) {
        ElMessage.info('该数据源正在采集中...')
        return
      }

      try {
        // 添加到采集中的列表
        collectingSourceIds.value.add(source.dataID)
        
        ElMessage.info(`开始使用爬虫采集BUFF数据: ${source.dataName}`)

        // 准备发送给爬虫的数据 - 按照后端API期望的字段名
        const spiderData = {
          // 后端API需要的字段
          cookie: source.config?.cookie || '',
          system_version: source.config?.system_version || '',
          system_type: source.config?.system_type || '',
          steamID: source.config?.steamID || '',
          
          // 额外的数据源信息（可选）
          dataID: source.dataID,
          dataName: source.dataName,
          type: source.type,
          enabled: source.enabled
        }
        
        console.log('发送给BUFF爬虫的数据:', spiderData)
        
        // 调用爬虫API
        const response = await axios.post(apiUrls.buffSpider(), spiderData)

        // 后端成功返回 200 状态码和 "获取完成" 消息
        if (response.status === 200) {
          ElMessage.success(`${source.dataName} BUFF爬虫采集完成！`)
          console.log('BUFF爬虫采集响应:', response.data)
          
          // 更新数据源的最后更新时间
          source.lastUpdate = new Date()
        } else {
          ElMessage.error(`BUFF爬虫采集失败: ${response.data}`)
        }
      } catch (error) {
        console.error('BUFF爬虫采集失败:', error)
        let errorMessage = `BUFF爬虫采集 ${source.dataName} 失败`
        
        if (error.response) {
          errorMessage = error.response.data?.message || `BUFF爬虫采集失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到BUFF爬虫服务器'
        } else {
          errorMessage = error.message || 'BUFF爬虫采集失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        // 从采集中的列表移除
        collectingSourceIds.value.delete(source.dataID)
      }
    }

    const startCollection = async (source) => {
      // 如果是悠悠有品，调用爬虫采集
      if (source.type === 'youpin') {
        return startYoupinSpiderCollection(source)
      }
      
      // 如果是BUFF，调用BUFF爬虫采集
      if (source.type === 'buff') {
        return startBuffSpiderCollection(source)
      }
      
      // 其他数据源使用原有的采集逻辑
      if (!source.enabled) {
        ElMessage.warning('请先启用数据源')
        return
      }

      if (collectingSourceIds.value.has(source.dataID)) {
        ElMessage.info('该数据源正在采集中...')
        return
      }

      try {
        // 添加到采集中的列表
        collectingSourceIds.value.add(source.dataID)
        
        ElMessage.info(`开始采集数据源: ${source.dataName}`)
        
        // 调用采集API
        const response = await axios.post(apiUrls.dataSourceCollect(source.dataID), {
          dataSourceId: source.dataID,
          dataSourceName: source.dataName,
          type: source.type
        })

        const result = response.data
        
        if (result.success) {
          ElMessage.success(`${source.dataName} 采集完成！采集到 ${result.data?.count || 0} 条数据`)
          
          // 更新数据源的最后更新时间
          source.lastUpdate = new Date()
        } else {
          ElMessage.error(`采集失败: ${result.message}`)
        }
      } catch (error) {
        console.error('采集失败:', error)
        let errorMessage = `采集 ${source.dataName} 失败`
        
        if (error.response) {
          errorMessage = error.response.data?.message || `采集失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到API服务器'
        } else {
          errorMessage = error.message || '采集失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        // 从采集中的列表移除
        collectingSourceIds.value.delete(source.dataID)
      }
    }

    const toggleSource = async (source) => {
      try {
        const response = await axios.put(apiUrls.dataSourceToggle(source.dataID), {
          enabled: source.enabled
        })

        const result = response.data
        
        if (result.success) {
          ElMessage.success(`${source.dataName} ${source.enabled ? '已启用' : '已禁用'}`)
        } else {
          ElMessage.error(result.message || '状态更新失败')
          source.enabled = !source.enabled
        }
      } catch (error) {
        console.error('状态更新失败:', error)
        let errorMessage = '状态更新失败'
        
        if (error.response) {
          errorMessage = error.response.data?.message || `更新失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到API服务器'
        } else {
          errorMessage = error.message || '状态更新失败'
        }
        
        ElMessage.error(errorMessage)
        // 恢复原状态
        source.enabled = !source.enabled
      }
    }

    const editSource = (source) => {
      // 记录当前编辑的数据源ID
      editingSourceId.value = source.dataID
      
      // 填充编辑表单，显示所有现有配置
      const config = source.config || {}
      
      console.log('开始编辑数据源:', {
        source: source,
        config: config,
        type: source.type,
        configKeys: Object.keys(config)
      })

      // 基础信息
      editForm.value.name = source.dataName
      editForm.value.type = source.type
      editForm.value.enabled = source.enabled
      
      
      // 根据数据源类型解析不同的配置
      if (source.type === 'youpin') {
        // 解析悠悠有品的配置 - 现在从JSON展开的字段中读取
        editForm.value.phone = config.yyyp_phone || ''
        editForm.value.sessionid = config.yyyp_Sessionid || ''
        editForm.value.token = config.yyyp_token || ''
        editForm.value.deviceName = config.yyyp_DeviceName || ''
        editForm.value.appVersion = config.yyyp_app_version || ''
        editForm.value.sleepTime = parseInt(config.yyyp_sleep_time || '6000')
        editForm.value.appType = config.yyyp_app_type || ''
        editForm.value.userId = config.yyyp_userId || ''
        editForm.value.steamId = config.yyyp_steamId || ''
        
        console.log('悠悠有品配置解析结果:', {
          phone: editForm.value.phone,
          sessionid: editForm.value.sessionid,
          token: editForm.value.token,
          deviceName: editForm.value.deviceName,
          appVersion: editForm.value.appVersion,
          sleepTime: editForm.value.sleepTime,
          appType: editForm.value.appType,
          userId: editForm.value.userId
        })
      } else if (source.type === 'buff') {
        // BUFF配置
        console.log('BUFF配置解析:', {
          cookie: config.cookie,
          system_version: config.system_version,
          system_type: config.system_type,
          steamID: config.steamID,
          updateFreq: config.updateFreq
        })
        editForm.value.cookie = config.cookie || ''
        editForm.value.systemVersion = config.system_version || ''
        editForm.value.systemType = config.system_type || ''
        editForm.value.steamID = config.steamID || ''
        editForm.value.updateFreq = config.updateFreq || source.updateFreq || '15min'
      } else {
        // 通用配置 - 检查多种可能的字段名
        editForm.value.apiUrl = config.api_url || source.apiUrl || ''
        editForm.value.apiKey = config.api_key || config.token || ''
        editForm.value.sleepTime = parseInt(config.sleep_time || '6000')
      }
      
      console.log('编辑表单数据:', editForm.value)
      
      // 打开编辑对话框
      editDialogVisible.value = true
    }

    const handleEditDialogClose = () => {
      // 对话框关闭时清理状态
      editingSourceId.value = null
      editForm.value = {
        name: '',
        type: '',
        apiUrl: '',
        apiKey: '',
        updateFreq: '15min',
        enabled: true,
        phone: '',
        sessionid: '',
        token: '',
        deviceName: '',
        appVersion: '',
        sleepTime: 6000,
        appType: '',
        userId: '',
        steamId: '',
        // BUFF特有字段
        cookie: '',
        systemVersion: '',
        systemType: '',
        steamID: ''
      }
    }

    // 打开添加数据源对话框
    const openAddDialog = () => {
      resetForm() // 先重置表单
      addDialogVisible.value = true
    }

    // 关闭添加数据源对话框
    const handleAddDialogClose = () => {
      resetForm() // 关闭时重置表单
    }

    // 编辑对话框中的"全部采集"功能
    const handleEditCollectAll = async () => {
      if (!editForm.value.name) {
        ElMessage.error('数据源信息不完整')
        return
      }

      if (!editForm.value.enabled) {
        ElMessage.warning('请先启用数据源')
        return
      }

      // 确保只有悠悠有品类型才能调用全部采集
      if (editForm.value.type !== 'youpin') {
        ElMessage.error('只有悠悠有品数据源才支持全部采集功能')
        return
      }

      if (collectingSourceIds.value.has(editingSourceId.value)) {
        ElMessage.info('该数据源正在采集中...')
        return
      }

      try {
        // 添加到采集中的列表
        collectingSourceIds.value.add(editingSourceId.value)
        
        ElMessage.info(`开始执行悠悠有品全部采集: ${editForm.value.name}`)
        
        // 准备发送给爬虫的数据 - 按照采集接口一样的传值方法
        const spiderData = {
          // 后端API需要的字段
          phone: editForm.value.phone || '',
          sessionid: editForm.value.sessionid || '',
          token: editForm.value.token || '',
          app_version: editForm.value.appVersion || '',
          app_type: editForm.value.appType || '',
          userId: editForm.value.userId || '',
          steamId: editForm.value.steamId || '',

          // 额外的数据源信息（可选）
          dataID: editingSourceId.value,
          dataName: editForm.value.name,
          type: editForm.value.type,
          enabled: editForm.value.enabled,
          deviceName: editForm.value.deviceName || '',
          sleepTime: editForm.value.sleepTime?.toString() || '6000'
        }
        
        console.log('发送给悠悠有品全部采集爬虫的数据:', spiderData)
        
        // 调用全部采集爬虫API
        const response = await axios.post(apiUrls.youpinFullSpider(), spiderData)

        // 后端成功返回 200 状态码
        if (response.status === 200) {
          ElMessage.success(`${editForm.value.name} 悠悠有品全部采集完成！`)
          console.log('悠悠有品全部采集响应:', response.data)
        } else {
          ElMessage.error(`悠悠有品全部采集失败: ${response.data}`)
        }
      } catch (error) {
        console.error('悠悠有品全部采集失败:', error)
        let errorMessage = `悠悠有品全部采集 ${editForm.value.name} 失败`
        
        if (error.response) {
          errorMessage = error.response.data?.message || `悠悠有品全部采集失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到悠悠有品爬虫服务器'
        } else {
          errorMessage = error.message || '悠悠有品全部采集失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        // 从采集中的列表移除
        collectingSourceIds.value.delete(editingSourceId.value)
      }
    }

    // 编辑对话框中的BUFF"全部获取"功能
    const handleEditBuffCollectAll = async () => {
      if (!editForm.value.name) {
        ElMessage.error('数据源信息不完整')
        return
      }

      if (!editForm.value.enabled) {
        ElMessage.warning('请先启用数据源')
        return
      }

      // 确保只有BUFF类型才能调用全部获取
      if (editForm.value.type !== 'buff') {
        ElMessage.error('只有BUFF数据源才支持全部获取功能')
        return
      }

      if (collectingSourceIds.value.has(editingSourceId.value)) {
        ElMessage.info('该数据源正在采集中...')
        return
      }

      try {
        // 添加到采集中的列表
        collectingSourceIds.value.add(editingSourceId.value)
        
        ElMessage.info(`开始执行BUFF全部获取: ${editForm.value.name}`)
        
        // 准备发送给爬虫的数据 - 按照采集接口一样的传值方法
        const spiderData = {
          // 后端API需要的字段
          cookie: editForm.value.cookie || '',
          system_version: editForm.value.systemVersion || '',
          system_type: editForm.value.systemType || '',
          steamID: editForm.value.steamID || '',

          // 额外的数据源信息（可选）
          dataID: editingSourceId.value,
          dataName: editForm.value.name,
          type: editForm.value.type,
          enabled: editForm.value.enabled
        }
        
        console.log('发送给BUFF全部获取爬虫的数据:', spiderData)
        
        // 调用全部获取爬虫API
        const response = await axios.post(apiUrls.buffFullSpider(), spiderData)

        // 后端成功返回 200 状态码
        if (response.status === 200) {
          ElMessage.success(`${editForm.value.name} BUFF全部获取完成！`)
          console.log('BUFF全部获取响应:', response.data)
        } else {
          ElMessage.error(`BUFF全部获取失败: ${response.data}`)
        }
      } catch (error) {
        console.error('BUFF全部获取失败:', error)
        let errorMessage = `BUFF全部获取 ${editForm.value.name} 失败`
        
        if (error.response) {
          errorMessage = error.response.data?.message || `BUFF全部获取失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到BUFF爬虫服务器'
        } else {
          errorMessage = error.message || 'BUFF全部获取失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        // 从采集中的列表移除
        collectingSourceIds.value.delete(editingSourceId.value)
      }
    }

    // 编辑对话框中的删除功能
    const handleEditDelete = () => {
      if (!editForm.value.name || !editingSourceId.value) {
        ElMessage.error('数据源信息不完整')
        return
      }

      ElMessageBox.confirm(
        `确定要删除数据源 "${editForm.value.name}" 吗？\n\n删除后将无法恢复，该数据源的所有配置信息都会被永久删除。`,
        '⚠️ 危险操作 - 确认删除',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'error',
          buttonSize: 'default',
          showClose: true,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              ElMessageBox.confirm(
                '这是最后确认，删除后无法恢复！',
                '最终确认',
                {
                  confirmButtonText: '我确定要删除',
                  cancelButtonText: '取消',
                  type: 'error'
                }
              ).then(() => {
                done()
              }).catch(() => {
                // 取消最终确认，不关闭第一个对话框
              })
            } else {
              done()
            }
          }
        }
      ).then(async () => {
        try {
          const response = await axios.delete(apiUrls.dataSourceById(editingSourceId.value))

          const result = response.data
          
          if (result.success) {
            const index = dataSources.value.findIndex(s => s.dataID === editingSourceId.value)
            if (index > -1) {
              dataSources.value.splice(index, 1)
              ElMessage.success('数据源删除成功')
              editDialogVisible.value = false // 关闭编辑对话框
            }
          } else {
            ElMessage.error(result.message || '删除数据源失败')
          }
        } catch (error) {
          console.error('删除数据源失败:', error)
          let errorMessage = '删除数据源失败'
          
          if (error.response) {
            errorMessage = error.response.data?.message || `删除失败 (${error.response.status})`
          } else if (error.request) {
            errorMessage = '无法连接到API服务器'
          } else {
            errorMessage = error.message || '删除失败'
          }
          
          ElMessage.error(errorMessage)
        }
      })
    }

    const handleEditSubmit = async () => {
      if (!editForm.value.name) {
        ElMessage.error('请填写数据源名称')
        return
      }

      // BUFF类型的字段校验
      if (editForm.value.type === 'buff') {
        if (!editForm.value.cookie) {
          ElMessage.error('请填写Cookie')
          return
        }
        if (!editForm.value.systemVersion) {
          ElMessage.error('请填写system_version')
          return
        }
        if (!editForm.value.systemType) {
          ElMessage.error('请填写system_type')
          return
        }
        if (!editForm.value.steamID) {
          ElMessage.error('请填写SteamID')
          return
        }
      }

      // 悠悠有品类型的字段校验
      if (editForm.value.type === 'youpin') {
        if (!editForm.value.phone) {
          ElMessage.error('请填写手机号')
          return
        }
        if (!editForm.value.sessionid) {
          ElMessage.error('请填写Session ID')
          return
        }
        if (!editForm.value.token) {
          ElMessage.error('请填写Token')
          return
        }
        if (!editForm.value.deviceName) {
          ElMessage.error('请填写设备名称')
          return
        }
        if (!editForm.value.appVersion) {
          ElMessage.error('请填写应用版本')
          return
        }
        if (!editForm.value.appType) {
          ElMessage.error('请填写应用类型')
          return
        }
        if (!editForm.value.userId) {
          ElMessage.error('请填写用户ID')
          return
        }
        if (!editForm.value.steamId) {
          ElMessage.error('请填写SteamID')
          return
        }
      }

      editSubmitting.value = true
      try {
        let requestData = {
          dataName: editForm.value.name,
          type: editForm.value.type,
          enabled: editForm.value.enabled
        }

        // 根据数据源类型构建配置JSON字符串
        if (editForm.value.type === 'youpin') {
          requestData.configJson = JSON.stringify({
            phone: editForm.value.phone,
            Sessionid: editForm.value.sessionid,
            token: editForm.value.token,
            DeviceName: editForm.value.deviceName,
            app_version: editForm.value.appVersion,
            sleep_time: editForm.value.sleepTime.toString(),
            app_type: editForm.value.appType,
            userId: editForm.value.userId,
            steamId: editForm.value.steamId
          })
        } else if (editForm.value.type === 'buff') {
          // BUFF特殊配置
          requestData.configJson = JSON.stringify({
            cookie: editForm.value.cookie,
            system_version: editForm.value.systemVersion,
            system_type: editForm.value.systemType,
            steamID: editForm.value.steamID,
            updateFreq: editForm.value.updateFreq,
            sleep_time: '6000'
          })
        } else {
          requestData.configJson = JSON.stringify({
            apiUrl: editForm.value.apiUrl,
            apiKey: editForm.value.apiKey,
            updateFreq: editForm.value.updateFreq,
            sleep_time: editForm.value.sleepTime?.toString() || '6000'
          })
        }

        const response = await axios.put(
          apiUrls.dataSourceById(editingSourceId.value), 
          requestData
        )

        const result = response.data
        
        if (result.success) {
          ElMessage.success('数据源更新成功')
          editDialogVisible.value = false
          loadDataSources() // 重新加载数据源列表
        } else {
          ElMessage.error(result.message || '更新数据源失败')
        }
      } catch (error) {
        console.error('更新数据源失败:', error)
        let errorMessage = '更新失败'
        
        if (error.response) {
          errorMessage = error.response.data?.message || `更新失败 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到API服务器'
        } else {
          errorMessage = error.message || '更新失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        editSubmitting.value = false
      }
    }

    const removeSource = (source) => {
      ElMessageBox.confirm(
        `确定要删除数据源 "${source.dataName}" 吗？\n\n删除后将无法恢复，该数据源的所有配置信息都会被永久删除。`,
        '⚠️ 危险操作 - 确认删除',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'error',
          buttonSize: 'default',
          showClose: true,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              ElMessageBox.confirm(
                '这是最后确认，删除后无法恢复！',
                '最终确认',
                {
                  confirmButtonText: '我确定要删除',
                  cancelButtonText: '取消',
                  type: 'error'
                }
              ).then(() => {
                done()
              }).catch(() => {
                // 取消最终确认，不关闭第一个对话框
              })
            } else {
              done()
            }
          }
        }
      ).then(async () => {
        try {
          const response = await axios.delete(apiUrls.dataSourceById(source.dataID))

          const result = response.data
          
          if (result.success) {
            const index = dataSources.value.findIndex(s => s.dataID === source.dataID)
            if (index > -1) {
              dataSources.value.splice(index, 1)
              ElMessage.success('数据源删除成功')
            }
          } else {
            ElMessage.error(result.message || '删除数据源失败')
          }
        } catch (error) {
          console.error('删除数据源失败:', error)
          let errorMessage = '删除数据源失败'
          
          if (error.response) {
            errorMessage = error.response.data?.message || `删除失败 (${error.response.status})`
          } else if (error.request) {
            errorMessage = '无法连接到API服务器'
          } else {
            errorMessage = error.message || '删除失败'
          }
          
          ElMessage.error(errorMessage)
        }
      })
    }

    const refreshAllSources = async () => {
      refreshing.value = true
      try {
        await loadDataSources()
        ElMessage.success('所有数据源已刷新')
      } catch (error) {
        ElMessage.error('刷新失败')
      } finally {
        refreshing.value = false
      }
    }

    const loadDataSources = async () => {
      try {
        console.log('开始请求数据源API...')
        const response = await axios.get(apiUrls.dataSource())
        console.log('Axios response:', response)
        
        const result = response.data
        console.log('API响应结果:', result)
        
        if (result.success) {
          console.log('成功获取数据源，数量:', result.data.length)
          dataSources.value = result.data.map(item => {
            return {
              id: item.dataID,
              dataID: item.dataID,
              name: item.dataName,
              dataName: item.dataName,
              type: item.type || 'other',  // 直接使用后端返回的type字段
              apiUrl: item.config?.apiUrl || '',
              updateFreq: item.updateFreq || '15min',
              enabled: item.enabled,
              status: item.enabled ? 'online' : 'offline',
              lastUpdate: item.lastUpdate ? new Date(item.lastUpdate) : new Date(),
              config: item.config || {}
            }
          })
          console.log('处理后的数据源:', dataSources.value)
        } else {
          console.error('API返回失败:', result.message)
          ElMessage.error(result.message || '获取数据源失败')
        }
      } catch (error) {
        console.error('获取数据源失败:', error)
        let errorMessage = '获取数据源失败'
        
        if (error.response) {
          // 服务器返回了错误响应
          errorMessage = error.response.data?.message || `服务器错误 (${error.response.status})`
          console.error('服务器响应错误:', error.response.data)
        } else if (error.request) {
          // 请求发送了但没有收到响应
          errorMessage = '无法连接到API服务器，请检查服务器是否运行在端口9001'
          console.error('网络请求错误，无响应')
        } else {
          // 其他错误
          errorMessage = error.message || '未知错误'
          console.error('请求设置错误:', error.message)
        }
        
        console.error('详细错误信息:', {
          name: error.name,
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        
        ElMessage.error(errorMessage)
      }
    }


    onMounted(() => {
      loadDataSources()
    })

    return {
      submitting,
      testing,
      refreshing,
      editingSourceId,
      collectingSourceIds,
      editDialogVisible,
      editSubmitting,
      addDialogVisible,
      editForm,
      inputForm,
      dataSources,
      getSourceTypeLabel,
      getSourceTypeColor,
      getUpdateFreqLabel,
      formatTime,
      handleSubmit,
      resetForm,
      testConnection,
      testSourceConnection,
      startCollection,
      toggleSource,
      editSource,
      handleEditDialogClose,
      handleEditSubmit,
      handleEditCollectAll,
      handleEditBuffCollectAll,
      handleEditDelete,
      openAddDialog,
      handleAddDialogClose,
      removeSource,
      refreshAllSources
    }
  }
}
</script>

<style scoped>
.data-source-container {
  width: 100%;
}

.header-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.data-sources-list {
  margin-bottom: clamp(1.5rem, 4vw, 1.875rem);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 3vw, 1.25rem);
  flex-wrap: wrap;
  gap: 1rem;
}

.source-card {
  background-color: #2a2a2a;
  border-radius: 0.5rem;
  padding: clamp(1rem, 2.5vw, 1.25rem);
  border: 1px solid #333;
  transition: all 0.3s;
  width: 100%;
  height: fit-content;
  box-sizing: border-box;
}

.source-card:hover {
  border-color: #4CAF50;
}

.source-card.disabled {
  opacity: 0.6;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: clamp(0.75rem, 2vw, 0.9375rem);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.source-info h4 {
  margin-bottom: clamp(0.5rem, 1vw, 0.5rem);
  color: #fff;
  font-size: clamp(1rem, 1.8vw, 1.125rem);
}

.source-details {
  margin-bottom: clamp(1rem, 3vw, 1.25rem);
}

.source-details p {
  margin: clamp(0.5rem, 1vw, 0.5rem) 0;
  color: #ccc;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  line-height: 1.5;
}

.source-actions {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 0.625rem);
  flex-wrap: wrap;
}

/* 数据源网格布局 - 固定4列 */
.grid-datasource {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  justify-items: stretch;
  align-items: start;
}

/* 响应式调整 - 保持固定列数概念 */
@media (max-width: 1200px) {
  .grid-datasource {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .grid-datasource {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .grid-datasource {
    grid-template-columns: 1fr;
  }
}

/* 确保卡片内容自适应 */
.source-card .source-header,
.source-card .source-details,
.source-card .source-actions {
  width: 100%;
  flex-shrink: 1;
}

.source-card .source-actions {
  justify-content: flex-start;
}

/* 文字内容自适应 */
.source-card h4 {
  word-break: break-word;
  overflow-wrap: break-word;
}

.source-card p {
  word-break: break-word;
  overflow-wrap: break-word;
}


:deep(.el-form-item__label) {
  color: #ccc;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
}

:deep(.el-input__inner) {
  background-color: #2a2a2a !important;
  border-color: #444 !important;
  color: #ffffff !important;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
}

:deep(.el-select .el-input__inner) {
  background-color: #2a2a2a !important;
  border-color: #444 !important;
  color: #ffffff !important;
}


:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #4CAF50;
}

:deep(.el-button) {
  font-size: clamp(0.625rem, 1vw, 0.75rem);
  padding: clamp(0.375rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem);
}

:deep(.el-form-item) {
  margin-bottom: clamp(1rem, 2.5vw, 1.125rem);
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-buttons {
    justify-content: center;
    margin-top: 10px;
  }
  
  .source-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .source-actions {
    justify-content: center;
  }
  
  .source-actions .el-button {
    flex: 1;
    min-width: 0;
    font-size: 0.625rem;
  }
  
  :deep(.el-button) {
    width: 100%;
    font-size: 0.75rem;
    padding: 0.5rem;
  }
  
  :deep(.el-form-item__label) {
    font-size: 0.75rem;
  }
  
  :deep(.el-input__inner) {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .source-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .source-actions .el-switch {
    align-self: center;
  }
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.dialog-footer-left {
  flex: 1;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

.dialog-footer-right {
  display: flex;
  gap: 10px;
}

/* 编辑对话框黑暗主题样式 */
:deep(.el-dialog) {
  background-color: #1e1e1e !important;
  border: 1px solid #333 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8) !important;
}

:deep(.el-dialog__header) {
  background-color: #1e1e1e !important;
  border-bottom: 1px solid #333 !important;
  padding: 20px 20px 15px 20px !important;
}

:deep(.el-dialog__title) {
  color: #ffffff !important;
  font-weight: 600 !important;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #cccccc !important;
}

:deep(.el-dialog__headerbtn .el-dialog__close:hover) {
  color: #ffffff !important;
}

:deep(.el-dialog__body) {
  background-color: #1e1e1e !important;
  padding: 20px !important;
}

:deep(.el-dialog__footer) {
  background-color: #1e1e1e !important;
  border-top: 1px solid #333 !important;
  padding: 15px 20px 20px 20px !important;
}

/* 表单样式 */
:deep(.el-form-item__label) {
  color: #cccccc !important;
  font-size: 14px !important;
}

/* 输入框包装器 - Element Plus 新版本结构 */
:deep(.el-input__wrapper) {
  background-color: #2a2a2a !important;
  border: 1px solid #444 !important;
  box-shadow: none !important;
}

:deep(.el-input__wrapper:hover) {
  border-color: #666 !important;
  box-shadow: none !important;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #4CAF50 !important;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2) !important;
}

:deep(.el-input__inner) {
  background-color: transparent !important;
  border: none !important;
  color: #ffffff !important;
  font-size: 14px !important;
}

:deep(.el-input__inner:focus) {
  border: none !important;
  box-shadow: none !important;
}

:deep(.el-input__inner:hover) {
  border: none !important;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #1a1a1a !important;
  border-color: #333 !important;
  color: #888 !important;
}

:deep(.el-textarea__inner) {
  background-color: #2a2a2a !important;
  border-color: #444 !important;
  color: #ffffff !important;
  font-size: 14px !important;
}

:deep(.el-textarea__inner:focus) {
  border-color: #4CAF50 !important;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2) !important;
}

/* 下拉框特定样式 */
:deep(.el-select .el-input__wrapper) {
  background-color: #2a2a2a !important;
  border: 1px solid #444 !important;
  box-shadow: none !important;
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: #666 !important;
  box-shadow: none !important;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: #4CAF50 !important;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2) !important;
}

:deep(.el-select .el-input__inner) {
  background-color: transparent !important;
  border: none !important;
  color: #ffffff !important;
}

:deep(.el-select .el-input.is-focus .el-input__inner) {
  background-color: transparent !important;
  border: none !important;
  color: #ffffff !important;
}

:deep(.el-select .el-input__inner:hover) {
  background-color: transparent !important;
  border: none !important;
  color: #ffffff !important;
}

:deep(.el-select-dropdown) {
  background-color: #2a2a2a !important;
  border: 1px solid #444 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
}

:deep(.el-option) {
  background-color: #2a2a2a !important;
  color: #ffffff !important;
}

:deep(.el-option:hover) {
  background-color: #4CAF50 !important;
}

:deep(.el-option.selected),
:deep(.el-option.is-selected) {
  background-color: #3a3a3a !important;
  color: #4CAF50 !important;
  font-weight: 500 !important;
}

/* 数字输入器样式 */
:deep(.el-input-number) {
  width: 100% !important;
}

:deep(.el-input-number .el-input__inner) {
  background-color: #2a2a2a !important;
  border-color: #444 !important;
  color: #ffffff !important;
}

:deep(.el-input-number__increase),
:deep(.el-input-number__decrease) {
  background-color: #333 !important;
  border-left: 1px solid #444 !important;
  color: #cccccc !important;
}

:deep(.el-input-number__increase:hover),
:deep(.el-input-number__decrease:hover) {
  background-color: #4CAF50 !important;
  color: #ffffff !important;
}

/* 开关样式 */
:deep(.el-switch__core) {
  background-color: #444 !important;
  border-color: #666 !important;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #4CAF50 !important;
  border-color: #4CAF50 !important;
}

/* 按钮样式 */
:deep(.el-button) {
  font-size: 14px !important;
  padding: 8px 20px !important;
  border-radius: 4px !important;
}

:deep(.el-button--default) {
  background-color: #2a2a2a !important;
  border-color: #444 !important;
  color: #cccccc !important;
}

:deep(.el-button--default:hover) {
  background-color: #333 !important;
  border-color: #666 !important;
  color: #ffffff !important;
}

:deep(.el-button--primary) {
  background-color: #4CAF50 !important;
  border-color: #4CAF50 !important;
  color: #ffffff !important;
}

:deep(.el-button--primary:hover) {
  background-color: #45a049 !important;
  border-color: #45a049 !important;
}

:deep(.el-button.is-loading) {
  background-color: #666 !important;
  border-color: #666 !important;
}

/* 遮罩层样式 */
:deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.7) !important;
}

</style>