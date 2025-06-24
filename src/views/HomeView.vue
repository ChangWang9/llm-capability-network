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
        
        <div 
          ref="tooltipRef"
          :class="['tooltip', { show: visible }]" 
          :style="tooltipStyle" 
          v-html="content"
        ></div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useDataStore } from '@/stores/dataStore'
  import { useDataProcessor } from '@/composables/useDataProcessor'
  import { useNetworkGraph } from '@/composables/useNetworkGraph'
  import { useUIStore } from '@/stores/uiStore'
  
  // 组件导入
  import FileUploader from '@/components/common/FileUploader.vue'
  import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
  import SearchBox from '@/components/controls/SearchBox.vue'
  import FilterControls from '@/components/controls/FilterControls.vue'
  import NetworkStats from '@/components/visualization/NetworkStats.vue'
  import NetworkLegend from '@/components/visualization/NetworkLegend.vue'
  import NetworkCanvas from '@/components/visualization/NetworkCanvas.vue'
  
  const dataStore = useDataStore()
  const uiStore = useUIStore()
  const { loadDefaultData } = useDataProcessor()
  const { highlightCapability, resetHighlight } = useNetworkGraph()
  
  const networkCanvas = ref(null)
  const tooltipRef = ref(null)
  
  const isLoading = computed(() => dataStore.isLoading)
  const loadingMessage = computed(() => dataStore.loadingMessage)
  
  const visible = computed(() => uiStore.tooltipVisible)
  const content = computed(() => uiStore.tooltipContent)
  
  const tooltipStyle = computed(() => ({
    left: `${uiStore.tooltipPosition.x}px`,
    top: `${uiStore.tooltipPosition.y}px`
  }))
  
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
    highlightCapability(capabilityName)
  }
  
  const handleClearHighlight = () => {
    resetHighlight()
  }
  
  const handleFiltersChanged = () => {
    if (networkCanvas.value) {
      networkCanvas.value.updateVisualization()
    }
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
  
  .tooltip {
    position: fixed;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 15px;
    border-radius: var(--border-radius-lg);
    font-size: 13px;
    max-width: 350px;
    pointer-events: none;
    z-index: 1000;
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(255, 255, 255, 0.2);
    opacity: 0;
    transition: opacity var(--transition-normal);
    word-wrap: break-word;
  }
  
  .tooltip.show {
    opacity: 1;
  }
  
  .tooltip :deep(h3) {
    margin: 0 0 8px 0;
    color: #4fc3f7;
    font-size: 14px;
  }
  
  .tooltip :deep(.papers) {
    max-height: 200px;
    overflow-y: auto;
    margin-top: 8px;
  }
  
  .tooltip :deep(.paper-item) {
    margin-bottom: 4px;
    padding: 2px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 12px;
    line-height: 1.4;
  }
  
  .tooltip :deep(.more-papers) {
    margin-top: 6px;
    font-style: italic;
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
  }
  
  /* 滚动条样式 */
  .tooltip :deep(.papers::-webkit-scrollbar) {
    width: 4px;
  }
  
  .tooltip :deep(.papers::-webkit-scrollbar-track) {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  .tooltip :deep(.papers::-webkit-scrollbar-thumb) {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
  
  .tooltip :deep(.papers::-webkit-scrollbar-thumb:hover) {
    background: rgba(255, 255, 255, 0.5);
  }
  </style>
