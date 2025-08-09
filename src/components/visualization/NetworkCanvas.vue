<!-- src/components/visualization/NetworkCanvas.vue -->
<template>
  <div class="network-container" ref="networkContainer">
    <!-- SVG会在这里动态创建 -->
  </div>
  <div 
    ref="tooltipRef"
    :class="['tooltip', { show: visible, interactive: interactive }]" 
    :style="tooltipStyle" 
    v-html="content"
    @click.stop
  ></div>
  
  <!-- 新增的论文详情面板 -->
  <PaperDetailsPanel 
    ref="paperDetailsPanel"
    @filter-nodes="handleFilterNodes"
    @highlight-path="handleHighlightPath"
  />
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useNetworkGraph } from '@/composables/useNetworkGraph'
import { useNetworkStore } from '@/stores/networkStore'
import { useUIStore } from '@/stores/uiStore'
import PaperDetailsPanel from './PaperDetailsPanel.vue'

const networkStore = useNetworkStore()
const uiStore = useUIStore()
const { 
  networkContainer, 
  initializeNetwork, 
  updateVisualization, 
  highlightCapability, 
  resetHighlight,
  filterByNodes,
  lockPositions,
  unlockPositions,
  applyRadialLayout
} = useNetworkGraph()

const emit = defineEmits(['network-ready'])

const tooltipRef = ref(null)
const paperDetailsPanel = ref(null)
const visible = computed(() => uiStore.tooltipVisible)
const content = computed(() => uiStore.tooltipContent)
const interactive = computed(() => uiStore.tooltipInteractive)

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

// 点击外部关闭可交互悬浮框
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (interactive.value && !tooltipRef.value?.contains(e.target)) {
      uiStore.forceHideTooltip()
    }
  })

  // 监听节点点击事件
  document.addEventListener('nodeClick', (e) => {
    const { capability } = e.detail
    if (paperDetailsPanel.value) {
      paperDetailsPanel.value.showCapabilityDetails(capability)
      paperDetailsPanel.value.addNodeSelection(capability.name)
    }
  })

  // 监听边点击事件
  document.addEventListener('edgeClick', (e) => {
    const { edge } = e.detail
    if (paperDetailsPanel.value) {
      paperDetailsPanel.value.showEdgeDetails(edge)
    }
  })
})

// 处理节点过滤
const handleFilterNodes = (relatedNodes) => {
  filterByNodes(relatedNodes)
}

// 处理路径高亮
const handleHighlightPath = (path) => {
  // TODO: 实现路径高亮功能
  console.log('Highlighting path:', path)
}

defineExpose({
  updateVisualization,
  initializeNetwork,
  highlightCapability,
  resetHighlight,
  filterByNodes,
  lockPositions,
  unlockPositions,
  applyRadialLayout
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
  max-width: 400px;
  max-height: 500px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0;
  transition: opacity var(--transition-normal);
  word-wrap: break-word;
}

.tooltip.interactive {
  pointer-events: auto;
}

.tooltip.show {
  opacity: 1;
}

/* 悬浮框头部 */
.tooltip :deep(.tooltip-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 8px;
}

.tooltip :deep(.tooltip-close) {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.tooltip :deep(.tooltip-close:hover) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.tooltip :deep(h3) {
  margin: 0;
  color: #4fc3f7;
  font-size: 14px;
}

.tooltip :deep(.papers) {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 8px;
}

.tooltip :deep(.paper-item) {
  margin-bottom: 6px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  line-height: 1.4;
}

.tooltip :deep(.paper-link) {
  color: #4fc3f7;
  text-decoration: none;
  transition: color 0.2s;
}

.tooltip :deep(.paper-link:hover) {
  color: #29b6f6;
  text-decoration: underline;
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