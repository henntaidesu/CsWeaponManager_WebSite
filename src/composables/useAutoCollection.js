// 全局自动采集管理模块
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 全局定时器存储（在模块级别，不会因为组件卸载而清除）
const autoCollectionTimers = {}
const isInitialized = ref(false)

// 爬虫服务器地址
const SPIDER_BASE_URL = 'http://127.0.0.1:9002'
const API_BASE_URL = '/api'

/**
 * 将更新频率转换为毫秒数
 */
function getUpdateFreqMs(freq) {
  const freqMap = {
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    '2hours': 2 * 60 * 60 * 1000,
    '6hours': 6 * 60 * 60 * 1000,
    '12hours': 12 * 60 * 60 * 1000,
    '24hours': 24 * 60 * 60 * 1000
  }
  return freqMap[freq] || 15 * 60 * 1000 // 默认15分钟
}

/**
 * 更新数据库中的 lastUpdate 时间
 */
async function updateLastUpdateInDatabase(dataID, lastUpdateTime) {
  try {
    console.log(`[全局自动采集] 更新 lastUpdate: dataID=${dataID}, time=${lastUpdateTime}`)
    
    const updateUrl = `${API_BASE_URL}/dataSourcePageV1/api/datasource/${dataID}`
    const getUrl = `${API_BASE_URL}/dataSourcePageV1/api/datasource/${dataID}`
    
    // 先获取当前配置
    const getResponse = await axios.get(getUrl)
    
    if (getResponse.data.success) {
      const currentData = getResponse.data.data
      const currentConfig = currentData.config || {}
      
      // 更新 lastUpdate 字段
      currentConfig.lastUpdate = lastUpdateTime
      
      // 发送更新请求
      const response = await axios.put(updateUrl, {
        dataName: currentData.dataName,
        type: currentData.type,
        enabled: currentData.enabled,
        configJson: JSON.stringify(currentConfig)
      })
      
      if (response.data.success) {
        console.log(`[全局自动采集] ✅ lastUpdate 更新成功: dataID=${dataID}`)
        return true
      } else {
        console.error('[全局自动采集] ❌ lastUpdate 更新失败:', response.data.message)
        return false
      }
    }
  } catch (error) {
    console.error('[全局自动采集] ❌ 更新 lastUpdate 失败:', error)
    return false
  }
}

/**
 * 执行采集任务
 */
async function executeCollection(source) {
  const { dataID, dataName, type, config } = source
  
  console.log(`[全局自动采集] 开始采集: ${dataName} (dataID=${dataID})`)
  
  try {
    let url, payload
    
    if (type === 'youpin') {
      // 悠悠有品采集
      url = `${SPIDER_BASE_URL}/youping898SpiderV1/newData`
      payload = {
        phone: config.yyyp_phone || config.phone || '',
        sessionid: config.yyyp_sessionid || config.sessionid || '',
        token: config.yyyp_token || config.token || '',
        app_version: config.yyyp_app_version || config.app_version || '',
        app_type: config.yyyp_app_type || config.app_type || '',
        sleep_time: config.yyyp_sleep_time || config.sleep_time || 6000
      }
    } else if (type === 'buff') {
      // BUFF采集
      url = `${SPIDER_BASE_URL}/buffSpiderV1/NewData`
      payload = {
        steamID: config.steamID || config.steamId || ''
      }
    } else if (type === 'steam') {
      // Steam采集
      url = `${SPIDER_BASE_URL}/steamSpiderV1/getNewData`
      payload = {
        steamId: config.steamId || ''
      }
    } else {
      console.log(`[全局自动采集] 不支持的数据源类型: ${type}`)
      return false
    }
    
    console.log(`[全局自动采集] 调用爬虫API: ${url}`)
    
    const response = await axios.post(url, payload, { timeout: 300000 })
    
    if (response.data.success) {
      console.log(`[全局自动采集] ✅ 采集成功: ${dataName}`)
      
      // 更新 lastUpdate 时间
      const now = new Date().toISOString()
      await updateLastUpdateInDatabase(dataID, now)
      
      return true
    } else {
      console.error(`[全局自动采集] ❌ 采集失败: ${dataName}, 错误:`, response.data.message)
      return false
    }
  } catch (error) {
    console.error(`[全局自动采集] ❌ 采集异常: ${dataName}, 错误:`, error.message)
    return false
  }
}

/**
 * 启动自动采集定时器
 */
export function startAutoCollectionTimer(source) {
  const { dataID, dataName, config } = source
  
  // 如果已经存在定时器，先停止
  if (autoCollectionTimers[dataID]) {
    stopAutoCollectionTimer(dataID)
  }
  
  const autoCollect = config.autoCollect || false
  const updateFreq = config.updateFreq || '15min'
  
  if (!autoCollect) {
    console.log(`[全局自动采集] 数据源未启用自动采集: ${dataName}`)
    return
  }
  
  const intervalMs = getUpdateFreqMs(updateFreq)
  
  console.log(`[全局自动采集] 启动定时器: ${dataName} (dataID=${dataID}), 频率=${updateFreq} (${intervalMs}ms)`)
  
  // 创建定时器
  const timerId = setInterval(async () => {
    console.log(`[全局自动采集] 定时器触发: ${dataName} (dataID=${dataID})`)
    await executeCollection(source)
  }, intervalMs)
  
  // 保存定时器信息
  autoCollectionTimers[dataID] = {
    timerId,
    dataName,
    updateFreq,
    startTime: new Date().toISOString()
  }
  
  console.log(`[全局自动采集] 定时器已启动: ${dataName}, 下次采集时间: ${new Date(Date.now() + intervalMs).toLocaleString()}`)
}

/**
 * 停止自动采集定时器
 */
export function stopAutoCollectionTimer(dataID) {
  if (autoCollectionTimers[dataID]) {
    clearInterval(autoCollectionTimers[dataID].timerId)
    const dataName = autoCollectionTimers[dataID].dataName
    delete autoCollectionTimers[dataID]
    console.log(`[全局自动采集] 停止定时器: ${dataName} (dataID=${dataID})`)
    return true
  }
  return false
}

/**
 * 停止所有定时器
 */
export function stopAllTimers() {
  Object.keys(autoCollectionTimers).forEach(dataID => {
    stopAutoCollectionTimer(parseInt(dataID))
  })
  console.log('[全局自动采集] 所有定时器已停止')
}

/**
 * 获取所有运行中的定时器
 */
export function getRunningTimers() {
  return { ...autoCollectionTimers }
}

/**
 * 初始化自动采集定时器（从数据库加载配置）
 */
export async function initAutoCollectionTimers() {
  if (isInitialized.value) {
    console.log('[全局自动采集] 定时器已初始化，跳过')
    return
  }
  
  try {
    console.log('[全局自动采集] 开始初始化定时器...')
    
    // 获取所有数据源
    const response = await axios.get(`${API_BASE_URL}/dataSourcePageV1/api/datasource`)
    
    if (response.data.success) {
      const dataSources = response.data.data || []
      let count = 0
      
      dataSources.forEach(source => {
        const config = source.config || {}
        const autoCollect = config.autoCollect || false
        
        if (autoCollect && source.enabled && ['youpin', 'buff', 'steam'].includes(source.type)) {
          startAutoCollectionTimer(source)
          count++
        }
      })
      
      isInitialized.value = true
      console.log(`[全局自动采集] 定时器初始化完成，共启动 ${count} 个定时器`)
      
      if (count > 0) {
        ElMessage.success(`自动采集已启动，共 ${count} 个数据源`)
      }
    } else {
      console.error('[全局自动采集] 获取数据源失败:', response.data.message)
    }
  } catch (error) {
    console.error('[全局自动采集] 初始化定时器失败:', error)
  }
}

/**
 * 重新加载所有定时器（用于配置更新后）
 */
export async function reloadAutoCollectionTimers() {
  console.log('[全局自动采集] 重新加载所有定时器...')
  
  // 先停止所有定时器
  stopAllTimers()
  
  // 重置初始化标志
  isInitialized.value = false
  
  // 重新初始化
  await initAutoCollectionTimers()
}

/**
 * 更新单个数据源的定时器
 */
export function updateTimer(source) {
  const { dataID, config } = source
  const autoCollect = config.autoCollect || false
  
  if (autoCollect && source.enabled) {
    // 启动或重启定时器
    startAutoCollectionTimer(source)
  } else {
    // 停止定时器
    stopAutoCollectionTimer(dataID)
  }
}

// 导出定时器状态
export function useAutoCollection() {
  return {
    autoCollectionTimers,
    isInitialized,
    startAutoCollectionTimer,
    stopAutoCollectionTimer,
    stopAllTimers,
    getRunningTimers,
    initAutoCollectionTimers,
    reloadAutoCollectionTimers,
    updateTimer
  }
}

