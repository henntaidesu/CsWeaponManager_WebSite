<template>
  <div class="automation-container">
    <!-- 主内容区域 -->
    <div class="main-wrapper">
      <!-- 爬取改名页面 -->
      <SpiderWeaponRenameContent />
    </div>
  </div>
</template>

<script>
import SpiderWeaponRenameContent from './SpiderWeaponRename.vue'

export default {
  name: 'Automation',
  components: {
    SpiderWeaponRenameContent
  }
}
</script>

<style scoped>
.automation-container {
  min-height: 100vh;
  width: 100%;
}

.main-wrapper {
  width: 100%;
  height: 100%;
}
</style>

