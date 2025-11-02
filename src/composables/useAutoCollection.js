// 全局自动采集管理模块
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 全局定时器（每30秒检查一次）
let globalCheckTimer = null
const isInitialized = ref(false)

// 爬虫服务器地址
const SPIDER_BASE_URL = 'http://127.0.0.1:9002'
const API_BASE_URL = '/api'

// 检查间隔：30秒
const CHECK_INTERVAL = 30 * 1000

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
 * 检查是否需要执行采集
 * @param {string} lastUpdate - 最后更新时间 ISO字符串
 * @param {string} updateFreq - 更新频率
 * @returns {boolean} 是否需要执行采集
 */
function shouldCollect(lastUpdate, updateFreq) {
  if (!lastUpdate) {
    // 如果从未更新过，需要采集
    return true
  }
  
  try {
    const lastUpdateTime = new Date(lastUpdate).getTime()
    const now = Date.now()
    const interval = getUpdateFreqMs(updateFreq)
    const timeSinceLastUpdate = now - lastUpdateTime
    
    // 如果距离上次更新的时间超过了设定的更新频率，则需要采集
    const needCollect = timeSinceLastUpdate >= interval
    
    if (needCollect) {
      console.log(`[全局自动采集] 需要采集: lastUpdate=${lastUpdate}, timeSince=${Math.floor(timeSinceLastUpdate/1000)}秒, interval=${Math.floor(interval/1000)}秒`)
    }
    
    return needCollect
  } catch (error) {
    console.error('[全局自动采集] 时间解析错误:', error)
    return false
  }
}

/**
 * 更新数据库中的时间字段
 * @param {number} dataID - 数据源ID
 * @param {string} time - 时间字符串
 * @param {string} field - 要更新的字段名，默认为 'lastUpdate'
 */
async function updateLastUpdateInDatabase(dataID, time, field = 'lastUpdate') {
  try {
    console.log(`[全局自动采集] 更新 ${field}: dataID=${dataID}, time=${time}`)
    
    const updateUrl = `${API_BASE_URL}/dataSourcePageV1/api/datasource/${dataID}`
    const getUrl = `${API_BASE_URL}/dataSourcePageV1/api/datasource/${dataID}`
    
    // 先获取当前配置
    const getResponse = await axios.get(getUrl)
    
    if (getResponse.data.success) {
      const currentData = getResponse.data.data
      const currentConfig = currentData.config || {}
      
      // 更新指定的时间字段
      currentConfig[field] = time
      
      // 发送更新请求
      const response = await axios.put(updateUrl, {
        dataName: currentData.dataName,
        type: currentData.type,
        enabled: currentData.enabled,
        configJson: JSON.stringify(currentConfig)
      })
      
      if (response.data.success) {
        console.log(`[全局自动采集] ✅ ${field} 更新成功: dataID=${dataID}`)
        return true
      } else {
        console.error(`[全局自动采集] ❌ ${field} 更新失败:`, response.data.message)
        return false
      }
    }
  } catch (error) {
    console.error(`[全局自动采集] ❌ 更新 ${field} 失败:`, error)
    return false
  }
}

/**
 * 执行采集任务
 */
async function executeCollection(source) {
  const { dataID, dataName, type, config, taskType, taskName } = source
  
  const displayName = taskName || dataName
  console.log(`[全局自动采集] 开始采集: ${displayName} (dataID=${dataID})`)
  
  try {
    let url, payload, updateField = 'lastUpdate'
    
    // 如果有特殊任务类型（库存相关），使用对应的API
    if (taskType === 'inventory') {
      // Steam库存更新
      url = `${SPIDER_BASE_URL}/steamSpiderV1/getInventory`
      payload = { steamId: config.steamId || '' }
      updateField = 'lastInventoryUpdate'
    } else if (taskType === 'yyyp_price') {
      // 悠悠有品价格
      url = `${SPIDER_BASE_URL}/youping898SpiderV1/getYYYPPrice`
      payload = { steamId: config.steamId || '' }
      updateField = 'lastYYYPPriceUpdate'
    } else if (taskType === 'buff_price') {
      // BUFF价格
      url = `${SPIDER_BASE_URL}/buffSpiderV1/getBUFFPrice`
      payload = { steamId: config.steamId || '' }
      updateField = 'lastBuffPriceUpdate'
    } else if (type === 'youpin') {
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
      console.log(`[全局自动采集] ✅ 采集成功: ${displayName}`)
      
      // 更新对应的时间字段
      const now = new Date().toISOString()
      await updateLastUpdateInDatabase(dataID, now, updateField)
      
      return true
    } else {
      console.error(`[全局自动采集] ❌ 采集失败: ${displayName}, 错误:`, response.data.message)
      return false
    }
  } catch (error) {
    console.error(`[全局自动采集] ❌ 采集异常: ${displayName}, 错误:`, error.message)
    return false
  }
}

/**
 * 检查所有数据源并执行需要采集的任务
 */
async function checkAndCollect() {
  try {
    console.log('[全局自动采集] 开始检查数据源...')
    
    // 获取所有数据源
    const response = await axios.get(`${API_BASE_URL}/dataSourcePageV1/api/datasource`)
    
    if (!response.data.success) {
      console.error('[全局自动采集] 获取数据源失败:', response.data.message)
      return
    }
    
    const dataSources = response.data.data || []
    const tasksToCollect = []
    
    // 检查每个数据源
    for (const source of dataSources) {
      const config = source.config || {}
      const autoCollect = config.autoCollect || false
      const updateFreq = config.updateFreq || '15min'
      const lastUpdate = config.lastUpdate || null
      
      // 只处理启用的、支持自动采集的数据源
      if (!autoCollect || !source.enabled || !['youpin', 'buff', 'steam'].includes(source.type)) {
        continue
      }
      
      // 对于Steam类型，需要额外执行库存相关任务
      if (source.type === 'steam') {
        // 检查是否启用库存更新
        if (config.autoUpdateInventory && shouldCollect(config.lastInventoryUpdate, updateFreq)) {
          console.log(`[全局自动采集] Steam库存需要更新: ${source.dataName} (dataID=${source.dataID})`)
          tasksToCollect.push({
            ...source,
            taskType: 'inventory',
            taskName: 'Steam库存更新'
          })
        }
        
        // 检查是否启用悠悠有品价格
        if (config.autoUpdateYYYPPrice && shouldCollect(config.lastYYYPPriceUpdate, updateFreq)) {
          console.log(`[全局自动采集] 悠悠有品价格需要更新: ${source.dataName} (dataID=${source.dataID})`)
          tasksToCollect.push({
            ...source,
            taskType: 'yyyp_price',
            taskName: '悠悠有品价格'
          })
        }
        
        // 检查是否启用BUFF价格
        if (config.autoUpdateBuffPrice && shouldCollect(config.lastBuffPriceUpdate, updateFreq)) {
          console.log(`[全局自动采集] BUFF价格需要更新: ${source.dataName} (dataID=${source.dataID})`)
          tasksToCollect.push({
            ...source,
            taskType: 'buff_price',
            taskName: 'BUFF价格'
          })
        }
        
        // 继续检查Steam市场数据采集
      }
      
      // 检查是否需要采集
      if (shouldCollect(lastUpdate, updateFreq)) {
        console.log(`[全局自动采集] 数据源需要采集: ${source.dataName} (dataID=${source.dataID})`)
        tasksToCollect.push(source)
      }
    }
    
    // 执行需要采集的任务
    if (tasksToCollect.length > 0) {
      // 按照 dataID 排序，确保按顺序执行
      tasksToCollect.sort((a, b) => a.dataID - b.dataID)
      
      console.log(`[全局自动采集] 共有 ${tasksToCollect.length} 个数据源需要采集，执行顺序: ${tasksToCollect.map(s => `${s.dataName}(ID:${s.dataID})`).join(', ')}`)
      
      for (const source of tasksToCollect) {
        console.log(`[全局自动采集] 开始执行采集: ${source.dataName} (dataID=${source.dataID})`)
        await executeCollection(source)
        // 每个采集之间间隔2秒，避免同时发起过多请求
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      console.log('[全局自动采集] 本轮采集任务全部完成')
    } else {
      console.log('[全局自动采集] 无需采集的数据源')
    }
    
  } catch (error) {
    console.error('[全局自动采集] 检查失败:', error)
  }
}

/**
 * 启动全局定时器（每30秒检查一次）
 */
export function startGlobalTimer() {
  if (globalCheckTimer) {
    console.log('[全局自动采集] 定时器已在运行中')
    return
  }
  
  console.log(`[全局自动采集] 启动全局定时器，检查间隔: ${CHECK_INTERVAL/1000}秒`)
  
  // 创建定时器，每30秒检查一次
  globalCheckTimer = setInterval(async () => {
    await checkAndCollect()
  }, CHECK_INTERVAL)
  
  console.log('[全局自动采集] 全局定时器已启动')
}

/**
 * 停止全局定时器
 */
export function stopGlobalTimer() {
  if (globalCheckTimer) {
    clearInterval(globalCheckTimer)
    globalCheckTimer = null
    console.log('[全局自动采集] 全局定时器已停止')
    return true
  }
  return false
}

/**
 * 手动触发一次检查
 */
export async function triggerCheck() {
  console.log('[全局自动采集] 手动触发检查')
  await checkAndCollect()
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
    console.log('[全局自动采集] 开始初始化全局定时器...')
    
    // 启动全局定时器（每30秒检查一次）
    startGlobalTimer()
    
    // 立即执行一次检查
    await checkAndCollect()
    
    isInitialized.value = true
    console.log('[全局自动采集] 初始化完成')
    
  } catch (error) {
    console.error('[全局自动采集] 初始化失败:', error)
  }
}

/**
 * 重新初始化定时器
 */
export async function reloadAutoCollectionTimers() {
  console.log('[全局自动采集] 重新初始化...')
  
  // 停止定时器
  stopGlobalTimer()
  
  // 重置标志
  isInitialized.value = false
  
  // 重新初始化
  await initAutoCollectionTimers()
}

// 导出功能
export function useAutoCollection() {
  return {
    isInitialized,
    startGlobalTimer,
    stopGlobalTimer,
    triggerCheck,
    initAutoCollectionTimers,
    reloadAutoCollectionTimers
  }
}

