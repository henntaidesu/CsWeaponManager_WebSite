// API 配置文件
export const API_CONFIG = {
  // API 基础地址
  BASE_URL: '/api',
  
  // 爬虫服务器地址
  SPIDER_BASE_URL: 'http://127.0.0.1:9002',
  
  // API 端点
  ENDPOINTS: {
    // 数据源相关
    DATA_SOURCE: '/dataSourcePageV1/api/datasource',
    DATA_SOURCE_TEST: '/dataSourcePageV1/api/datasource/test',
    DATA_SOURCE_COLLECT: (id) => `/dataSourcePageV1/api/datasource/${id}/collect`,
    DATA_SOURCE_TOGGLE: (id) => `/dataSourcePageV1/api/datasource/${id}/toggle`,
    DATA_SOURCE_BY_ID: (id) => `/dataSourcePageV1/api/datasource/${id}`,
    
    // 购买数据相关
    BUY_DATA: (page, limit) => `/webBuyV1/getBuyData/${page}/${limit}`,
    BUY_STATS: '/webBuyV1/getBuyStats',
    
    // 销售数据相关
    SELL_DATA: (page, limit) => `/webSellV1/getSellData/${page}/${limit}`,
    SELL_STATS: '/webSellV1/getSellStats',
    
    // Steam市场数据相关
    STEAM_BUY_DATA: (page, limit) => `/webSteamMarketV1/getSteamBuyData/${page}/${limit}`,
    STEAM_BUY_STATS: '/webSteamMarketV1/getSteamBuyStats',
    STEAM_BUY_STATS_BY_SEARCH: (keyword) => `/webSteamMarketV1/getSteamBuyStatsBySearch/${encodeURIComponent(keyword)}`,
    STEAM_BUY_STATS_BY_STATUS: (status) => `/webSteamMarketV1/getSteamBuyStatsByStatus/${status}`,
    STEAM_BUY_DATA_BY_STATUS: (status, page, limit) => `/webSteamMarketV1/getSteamBuyDataByStatus/${status}/${page}/${limit}`,
    STEAM_BUY_SEARCH_BY_NAME: (itemName) => `/webSteamMarketV1/selectSteamBuyWeaponName/${encodeURIComponent(itemName)}`,
    STEAM_BUY_SEARCH_BY_TIME: (startDate, endDate) => `/webSteamMarketV1/searchSteamBuyByTimeRange/${startDate}/${endDate}`,
    STEAM_BUY_STATS_BY_TIME: (startDate, endDate) => `/webSteamMarketV1/getSteamBuyStatsByTimeRange/${startDate}/${endDate}`,
    
    STEAM_SELL_DATA: (page, limit) => `/webSteamMarketV1/getSteamSellData/${page}/${limit}`,
    STEAM_SELL_STATS: '/webSteamMarketV1/getSteamSellStats',
    STEAM_SELL_STATS_BY_SEARCH: (keyword) => `/webSteamMarketV1/getSteamSellStatsBySearch/${encodeURIComponent(keyword)}`,
    STEAM_SELL_STATS_BY_STATUS: (status) => `/webSteamMarketV1/getSteamSellStatsByStatus/${status}`,
    STEAM_SELL_DATA_BY_STATUS: (status, page, limit) => `/webSteamMarketV1/getSteamSellDataByStatus/${status}/${page}/${limit}`,
    STEAM_SELL_SEARCH_BY_NAME: (itemName) => `/webSteamMarketV1/selectSteamSellWeaponName/${encodeURIComponent(itemName)}`,
    STEAM_SELL_SEARCH_BY_TIME: (startDate, endDate) => `/webSteamMarketV1/searchSteamSellByTimeRange/${startDate}/${endDate}`,
    STEAM_SELL_STATS_BY_TIME: (startDate, endDate) => `/webSteamMarketV1/getSteamSellStatsByTimeRange/${startDate}/${endDate}`,
    
    // 类型和磨损等级搜索相关
    BUY_WEAPON_TYPES: '/webBuyPageV1/getWeaponTypes',
    BUY_FLOAT_RANGES: '/webBuyPageV1/getFloatRanges',
    BUY_STATUS_LIST: '/webBuyPageV1/getStatusList',
    BUY_SEARCH_BY_TYPE_WEAR: '/webBuyPageV1/searchByTypeAndWear',
    BUY_STATS_BY_TYPE_WEAR: '/webBuyPageV1/getStatsByTypeAndWear',
    
    SELL_WEAPON_TYPES: '/webSellPageV1/getWeaponTypes',
    SELL_FLOAT_RANGES: '/webSellPageV1/getFloatRanges',
    SELL_STATUS_LIST: '/webSellPageV1/getStatusList',
    SELL_SEARCH_BY_TYPE_WEAR: '/webSellPageV1/searchByTypeAndWear',
    SELL_STATS_BY_TYPE_WEAR: '/webSellPageV1/getStatsByTypeAndWear',
    
    LENT_WEAPON_TYPES: '/webLentPageV1/getWeaponTypes',
    LENT_FLOAT_RANGES: '/webLentPageV1/getFloatRanges',
    LENT_STATUS_LIST: '/webLentPageV1/getStatusList',
    LENT_SEARCH_BY_TYPE_WEAR: '/webLentPageV1/searchByTypeAndWear',
    LENT_STATS_BY_TYPE_WEAR: '/webLentPageV1/getStatsByTypeAndWear',
    
    // 爬虫相关
    YOUPIN_SPIDER: '/youping898SpiderV1/newData',
    YOUPIN_FULL_SPIDER: '/youping898SpiderV1/NoneData',
    BUFF_SPIDER: '/buffSpiderV1/NewData',
    BUFF_FULL_SPIDER: '/buffSpiderV1/allDate',
    STEAM_SPIDER: '/steamSpiderV1/getNewData',  // Steam增量采集（获取新数据）
    STEAM_FULL_SPIDER: '/steamSpiderV1/NoneData'  // Steam全量采集

    
  }
}

// 获取完整的 API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// 获取完整的爬虫 API URL
export const getSpiderApiUrl = (endpoint) => {
  return `${API_CONFIG.SPIDER_BASE_URL}${endpoint}`
}

// 快捷方法
export const apiUrls = {
  // 数据源
  dataSource: () => getApiUrl(API_CONFIG.ENDPOINTS.DATA_SOURCE),
  dataSourceTest: () => getApiUrl(API_CONFIG.ENDPOINTS.DATA_SOURCE_TEST),
  dataSourceCollect: (id) => getApiUrl(API_CONFIG.ENDPOINTS.DATA_SOURCE_COLLECT(id)),
  dataSourceToggle: (id) => getApiUrl(API_CONFIG.ENDPOINTS.DATA_SOURCE_TOGGLE(id)),
  dataSourceById: (id) => getApiUrl(API_CONFIG.ENDPOINTS.DATA_SOURCE_BY_ID(id)),
  
  // 购买数据
  buyData: (page, limit) => getApiUrl(API_CONFIG.ENDPOINTS.BUY_DATA(page, limit)),
  buyStats: () => getApiUrl(API_CONFIG.ENDPOINTS.BUY_STATS),
  
  // 销售数据
  sellData: (page, limit) => getApiUrl(API_CONFIG.ENDPOINTS.SELL_DATA(page, limit)),
  sellStats: () => getApiUrl(API_CONFIG.ENDPOINTS.SELL_STATS),
  
  // Steam购买数据
  steamBuyData: (page, limit) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_BUY_DATA(page, limit)),
  steamBuyStats: () => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_BUY_STATS),
  steamBuyStatsBySearch: (keyword) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_BUY_STATS_BY_SEARCH(keyword)),
  steamBuyStatsByStatus: (status) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_BUY_STATS_BY_STATUS(status)),
  steamBuyDataByStatus: (status, page, limit) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_BUY_DATA_BY_STATUS(status, page, limit)),
  steamBuySearchByName: (itemName) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_BUY_SEARCH_BY_NAME(itemName)),
  steamBuySearchByTime: (startDate, endDate) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_BUY_SEARCH_BY_TIME(startDate, endDate)),
  steamBuyStatsByTime: (startDate, endDate) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_BUY_STATS_BY_TIME(startDate, endDate)),
  
  // Steam销售数据
  steamSellData: (page, limit) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_SELL_DATA(page, limit)),
  steamSellStats: () => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_SELL_STATS),
  steamSellStatsBySearch: (keyword) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_SELL_STATS_BY_SEARCH(keyword)),
  steamSellStatsByStatus: (status) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_SELL_STATS_BY_STATUS(status)),
  steamSellDataByStatus: (status, page, limit) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_SELL_DATA_BY_STATUS(status, page, limit)),
  steamSellSearchByName: (itemName) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_SELL_SEARCH_BY_NAME(itemName)),
  steamSellSearchByTime: (startDate, endDate) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_SELL_SEARCH_BY_TIME(startDate, endDate)),
  steamSellStatsByTime: (startDate, endDate) => getApiUrl(API_CONFIG.ENDPOINTS.STEAM_SELL_STATS_BY_TIME(startDate, endDate)),
  
  // 类型和磨损等级搜索
  buyWeaponTypes: () => getApiUrl(API_CONFIG.ENDPOINTS.BUY_WEAPON_TYPES),
  buyFloatRanges: () => getApiUrl(API_CONFIG.ENDPOINTS.BUY_FLOAT_RANGES),
  buyStatusList: () => getApiUrl(API_CONFIG.ENDPOINTS.BUY_STATUS_LIST),
  buySearchByTypeWear: () => getApiUrl(API_CONFIG.ENDPOINTS.BUY_SEARCH_BY_TYPE_WEAR),
  buyStatsByTypeWear: () => getApiUrl(API_CONFIG.ENDPOINTS.BUY_STATS_BY_TYPE_WEAR),
  
  sellWeaponTypes: () => getApiUrl(API_CONFIG.ENDPOINTS.SELL_WEAPON_TYPES),
  sellFloatRanges: () => getApiUrl(API_CONFIG.ENDPOINTS.SELL_FLOAT_RANGES),
  sellStatusList: () => getApiUrl(API_CONFIG.ENDPOINTS.SELL_STATUS_LIST),
  sellSearchByTypeWear: () => getApiUrl(API_CONFIG.ENDPOINTS.SELL_SEARCH_BY_TYPE_WEAR),
  sellStatsByTypeWear: () => getApiUrl(API_CONFIG.ENDPOINTS.SELL_STATS_BY_TYPE_WEAR),
  
  lentWeaponTypes: () => getApiUrl(API_CONFIG.ENDPOINTS.LENT_WEAPON_TYPES),
  lentFloatRanges: () => getApiUrl(API_CONFIG.ENDPOINTS.LENT_FLOAT_RANGES),
  lentStatusList: () => getApiUrl(API_CONFIG.ENDPOINTS.LENT_STATUS_LIST),
  lentSearchByTypeWear: () => getApiUrl(API_CONFIG.ENDPOINTS.LENT_SEARCH_BY_TYPE_WEAR),
  lentStatsByTypeWear: () => getApiUrl(API_CONFIG.ENDPOINTS.LENT_STATS_BY_TYPE_WEAR),
  
  // 爬虫API
  youpinSpider: () => getSpiderApiUrl(API_CONFIG.ENDPOINTS.YOUPIN_SPIDER),
  youpinFullSpider: () => getSpiderApiUrl(API_CONFIG.ENDPOINTS.YOUPIN_FULL_SPIDER),
  buffSpider: () => getSpiderApiUrl(API_CONFIG.ENDPOINTS.BUFF_SPIDER),
  buffFullSpider: () => getSpiderApiUrl(API_CONFIG.ENDPOINTS.BUFF_FULL_SPIDER),
  steamSpider: () => getSpiderApiUrl(API_CONFIG.ENDPOINTS.STEAM_SPIDER),
  steamFullSpider: () => getSpiderApiUrl(API_CONFIG.ENDPOINTS.STEAM_FULL_SPIDER)
}