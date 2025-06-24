<template>
    <div class="network-container" ref="networkContainer">
      <!-- SVG会在这里动态创建 -->
    </div>
    <div 
      ref="tooltipRef"
      :class="['tooltip', { show: visible }]"
      :style="tooltipStyle"
      v-html="content"
    ></div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch, computed } from 'vue'
  import { useNetworkGraph } from '@/composables/useNetworkGraph'
  import { useNetworkStore } from '@/stores/networkStore'
  import { useUIStore } from '@/stores/uiStore'
  
  const networkStore = useNetworkStore()
  const uiStore = useUIStore()
  const { 
    networkContainer, 
    initializeNetwork, 
    updateVisualization, 
    highlightCapability, 
    resetHighlight 
  } = useNetworkGraph()
  
  const emit = defineEmits(['network-ready'])
  
  const tooltipRef = ref(null)
  const visible = computed(() => uiStore.tooltipVisible)
  const content = computed(() => uiStore.tooltipContent)
  const tooltipStyle = computed(() => ({
    left: `${uiStore.tooltipPosition.x}px`,
    top: `${uiStore.tooltipPosition.y}px`
  }))
  
  onMounted(async () => {
    await initializeNetwork()
    emit('network-ready')
  })
  
  // 监听过滤器变化
  watch([() => networkStore.minConnections, () => networkStore.minFrequency], () => {
    updateVisualization()
  })
  
  defineExpose({
    updateVisualization,
    initializeNetwork,
    highlightCapability,
    resetHighlight
  })
  </script>
  
  <style scoped>
  .network-container {
    width: 100%;
    height: 100%;
    position: relative;
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