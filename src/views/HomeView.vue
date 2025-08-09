<!-- src/views/HomeView.vue -->
<template>
  <div class="home-view">
    <div class="sidebar">
      <div class="header">
        <h1 class="title">LLM Capabilities</h1>
        <p class="subtitle">Interactive Network Analysis</p>
      </div>
      
      <div class="section">
        <h3 class="section-title">数据管理</h3>
        <FileUploader @file-uploaded="handleFileUploaded" />
      </div>

      <div class="section">
        <h3 class="section-title">搜索能力</h3>
        <SearchBox 
          @highlight-capability="handleHighlightCapability"
          @clear-highlight="handleClearHighlight"
        />
      </div>
      
      <div class="section">
        <h3 class="section-title">视图控制</h3>
        <FilterControls @filters-changed="handleFiltersChanged" />
      </div>

      <div class="section">
        <h3 class="section-title">统计信息</h3>
        <NetworkStats />
      </div>

      <div class="section">
        <h3 class="section-title">图例</h3>
        <NetworkLegend />
      </div>

      <div class="section">
        <h3 class="section-title">布局控制</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary" @click="handleApplyRadial">径向布局</button>
          <button class="btn" @click="handleLock">固定位置</button>
          <button class="btn" @click="handleUnlock">解锁位置</button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <LoadingSpinner 
        :visible="isLoading" 
        :message="loadingMessage" 
      />
      
      <NetworkCanvas 
        ref="networkCanvas" 
        @network-ready="handleNetworkReady"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { useDataProcessor } from '@/composables/useDataProcessor'
import { useNetworkGraph } from '@/composables/useNetworkGraph'

// 组件导入
import FileUploader from '@/components/common/FileUploader.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SearchBox from '@/components/controls/SearchBox.vue'
import FilterControls from '@/components/controls/FilterControls.vue'
import NetworkStats from '@/components/visualization/NetworkStats.vue'
import NetworkLegend from '@/components/visualization/NetworkLegend.vue'
import NetworkCanvas from '@/components/visualization/NetworkCanvas.vue'

const dataStore = useDataStore()
const { loadDefaultData } = useDataProcessor()
const { highlightCapability, resetHighlight } = useNetworkGraph()

const networkCanvas = ref(null)

const isLoading = computed(() => dataStore.isLoading)
const loadingMessage = computed(() => dataStore.loadingMessage)

const handleFileUploaded = async () => {
  if (networkCanvas.value) {
    await networkCanvas.value.initializeNetwork()
    networkCanvas.value.updateVisualization()
  }
}

const handleNetworkReady = () => {
  console.log('网络图已准备就绪')
}

const handleHighlightCapability = (capabilityName) => {
  if (networkCanvas.value) {
    networkCanvas.value.highlightCapability(capabilityName)
  }
}

const handleClearHighlight = () => {
  if (networkCanvas.value) {
    networkCanvas.value.resetHighlight()
  }
}

const handleFiltersChanged = () => {
  if (networkCanvas.value) {
    networkCanvas.value.updateVisualization()
  }
}

const handleApplyRadial = () => {
  networkCanvas.value?.applyRadialLayout()
}
const handleLock = () => {
  networkCanvas.value?.lockPositions()
}
const handleUnlock = () => {
  networkCanvas.value?.unlockPositions()
}

onMounted(async () => {
  try {
    await loadDefaultData()
    if (networkCanvas.value) {
      await networkCanvas.value.initializeNetwork()
      networkCanvas.value.updateVisualization()
    }
  } catch (error) {
    console.log('未找到默认数据文件，请上传数据')
  }
})
</script>

<style scoped>
.home-view {
  display: flex;
  height: 100vh;
  background: var(--bg-gradient);
  color: var(--text-primary);
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  backdrop-filter: blur(10px);
  padding: var(--spacing-lg);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg) 0;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.title {
  margin: 0;
  font-size: 2.2em;
  font-weight: 300;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  margin: 10px 0 0 0;
  font-size: 1em;
  opacity: 0.8;
}

.section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--primary-color);
}
</style>