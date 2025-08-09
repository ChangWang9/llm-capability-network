<!-- src/components/visualization/PaperDetailsPanel.vue -->
<template>
  <div class="paper-details-panel" :class="{ expanded: isExpanded }">
    <div class="panel-header">
      <h3 class="panel-title">详细信息</h3>
      <button class="toggle-btn" @click="togglePanel">
        {{ isExpanded ? '收起' : '展开' }}
      </button>
    </div>

    <div class="panel-content" v-if="isExpanded">
      <!-- 节点选择和路径查找 -->
      <div class="section" v-if="true">
        <h4 class="section-title">路径查找</h4>
        
        <div class="selection-info" v-if="hasSelection">
          <p>已选择节点: 
            <span class="selected-node" v-for="node in selectedNodes" :key="node">
              {{ node }}
              <button class="remove-node" @click="toggleNodeSelection(node)">×</button>
            </span>
          </p>
        </div>

        <div class="path-controls">
          <button 
            v-if="!isPathFinding"
            class="action-btn" 
            :disabled="!canFindPath"
            @click="handleFindPaths"
          >
            查找路径
          </button>
          
          <button 
            v-else
            class="action-btn cancel-btn" 
            @click="cancelPathSearch"
          >
            <span class="loading-spinner">⌛</span>
            取消搜索
          </button>
          
          <button 
            class="action-btn" 
            :disabled="foundPaths.length === 0"
            @click="handleShowSubgraphModal"
          >
            显示路径子图
          </button>
          
          <button 
            class="action-btn secondary" 
            :disabled="!hasSelection"
            @click="handleFilterNodes"
          >
            过滤相关节点
          </button>
          
          <button 
            class="action-btn secondary" 
            @click="clearSelection"
          >
            清除选择
          </button>
          

        </div>

        <!-- 路径结果 -->
        <div class="paths-result" v-if="foundPaths.length > 0">
          <div class="paths-header">
            <h5>找到 {{ foundPaths.length }} 条路径</h5>
            <button 
              class="show-subgraph-btn" 
              @click="handleShowPathSubgraph"
              title="在网络图中只显示这些路径"
            >
              显示路径子图
            </button>
          </div>
          
          <div class="path-item" v-for="(path, index) in foundPaths" :key="index">
            <div class="path-header">
              <span>路径 {{ index + 1 }} ({{ path.length }} 个节点):</span>
              <span class="path-length">长度: {{ path.length - 1 }}</span>
            </div>
            <div class="path-nodes">
              <span 
                v-for="(pathNode, nodeIndex) in path" 
                :key="nodeIndex"
                class="path-node"
                :class="{ 
                  'start-node': nodeIndex === 0,
                  'end-node': nodeIndex === path.length - 1 
                }"
              >
                {{ pathNode.node }}
                <span v-if="nodeIndex < path.length - 1" class="arrow">→</span>
              </span>
            </div>
            
            <!-- 显示路径中每一步的论文信息 -->
            <div class="path-papers" v-if="path.length > 1">
              <div 
                v-for="(pathNode, nodeIndex) in path.slice(1)" 
                :key="`papers-${nodeIndex}`"
                class="step-papers"
              >
                <small>{{ path[nodeIndex].node }} → {{ pathNode.node }}:</small>
                <div class="step-paper-list">
                  <span 
                    v-for="paper in pathNode.papers.slice(0, 3)" 
                    :key="paper.name"
                    class="paper-tag"
                  >
                    {{ formatPaperName(paper.name) }}
                  </span>
                  <span v-if="pathNode.papers.length > 3" class="more-papers-tag">
                    +{{ pathNode.papers.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 论文详情显示 -->
      <div class="section" v-if="selectedCapability || selectedEdge">
        <h4 class="section-title">
          {{ selectedCapability ? '能力论文' : '边关联论文' }}
        </h4>
        
        <div class="capability-info" v-if="selectedCapability">
          <p><strong>能力:</strong> {{ selectedCapability.name }}</p>
          <p><strong>出现次数:</strong> {{ selectedCapability.count }}</p>
        </div>

        <div class="edge-info" v-if="selectedEdge">
          <p><strong>连接:</strong> {{ selectedEdge.source }} → {{ selectedEdge.target }}</p>
        </div>

        <div class="papers-list">
          <div 
            class="paper-item" 
            v-for="paper in currentPapers" 
            :key="paper.name"
          >
            <div class="paper-name">
              <a 
                v-if="paper.url" 
                :href="paper.url" 
                target="_blank" 
                class="paper-link"
              >
                {{ paper.name }}
                <span class="external-link">↗</span>
              </a>
              <span v-else class="paper-text">{{ paper.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 子图模态框 -->
  <SubgraphModal 
    :visible="showSubgraphModal"
    :start-node="selectedNodes[0]"
    :end-node="selectedNodes[1]"
    :paths="foundPaths"
    @close="closeSubgraphModal"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePathFinder } from '@/composables/usePathFinder'
import { useDataStore } from '@/stores/dataStore'
import SubgraphModal from './SubgraphModal.vue'

const emit = defineEmits(['filter-nodes', 'highlight-path'])

const {
  selectedNodes,
  foundPaths,
  isPathFinding,
  canFindPath,
  hasSelection,
  toggleNodeSelection,
  clearSelection,
  findPaths,
  cancelPathSearch,
  filterBySelectedNodes,
  showPathSubgraph
} = usePathFinder()

const dataStore = useDataStore()
const isExpanded = ref(false)
const selectedCapability = ref(null)
const selectedEdge = ref(null)
const showSubgraphModal = ref(false)

const currentPapers = computed(() => {
  if (selectedCapability.value) {
    return dataStore.processedData.paperCapabilityMap[selectedCapability.value.name] || []
  }
  if (selectedEdge.value) {
    return selectedEdge.value.papers || []
  }
  return []
})

const togglePanel = () => {
  isExpanded.value = !isExpanded.value
}

const handleFindPaths = async () => {
  if (selectedNodes.value.length === 2) {
    const [nodeA, nodeB] = selectedNodes.value
    
    try {
      const paths = await findPaths(nodeA, nodeB)
      
      if (paths.length === 0) {
        alert(`未找到从 "${nodeA}" 到 "${nodeB}" 的路径`)
      } else {
        console.log(`成功找到 ${paths.length} 条路径`)
      }
    } catch (error) {
      console.error('路径查找出错:', error)
      alert('路径查找失败，请检查控制台获取详细信息')
    }
  }
}

const handleFilterNodes = () => {
  const relatedNodes = filterBySelectedNodes()
  emit('filter-nodes', relatedNodes)
}

const handleShowPathSubgraph = () => {
  const pathNodes = showPathSubgraph()
  emit('filter-nodes', pathNodes)
}

const handleShowSubgraphModal = () => {
  if (selectedNodes.value.length === 2 && foundPaths.value.length > 0) {
    showSubgraphModal.value = true
  }
}

const closeSubgraphModal = () => {
  showSubgraphModal.value = false
}

// 显示能力详情
const showCapabilityDetails = (capability) => {
  selectedCapability.value = capability
  selectedEdge.value = null
  isExpanded.value = true
}

// 显示边详情
const showEdgeDetails = (edge) => {
  selectedEdge.value = edge
  selectedCapability.value = null
  isExpanded.value = true
}

// 添加节点到选择列表
const addNodeSelection = (nodeName) => {
  if (!selectedNodes.value.includes(nodeName)) {
    toggleNodeSelection(nodeName)
  }
}

// 格式化论文名称
const formatPaperName = (paperName) => {
  if (!paperName) return ''
  return paperName.replace('.txt', '').replace(/^[A-Z]+\d+_/, '').substring(0, 30) + (paperName.length > 30 ? '...' : '')
}



defineExpose({
  showCapabilityDetails,
  showEdgeDetails,
  addNodeSelection
})
</script>

<style scoped>
.paper-details-panel {
  position: fixed;
  bottom: 0;
  right: 20px;
  width: 400px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px 12px 0 0;
  color: white;
  font-size: 13px;
  transition: all 0.3s ease;
  z-index: 1000;
  max-height: 80vh;
}

.paper-details-panel.expanded {
  height: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px 12px 0 0;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #4fc3f7;
}

.toggle-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.panel-content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #4fc3f7;
  border-bottom: 1px solid rgba(76, 195, 247, 0.3);
  padding-bottom: 4px;
}

.selection-info {
  margin-bottom: 12px;
  font-size: 12px;
}

.selected-node {
  display: inline-flex;
  align-items: center;
  background: rgba(76, 195, 247, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  margin-right: 6px;
  margin-bottom: 4px;
}

.remove-node {
  background: none;
  border: none;
  color: white;
  margin-left: 6px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.path-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.action-btn {
  background: #4fc3f7;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #29b6f6;
}

.action-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.paths-result {
  margin-top: 12px;
}

.paths-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.paths-header h5 {
  margin: 0;
  color: #4fc3f7;
}

.show-subgraph-btn {
  background: #29b6f6;
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.show-subgraph-btn:hover {
  background: #0288d1;
}

.path-item {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border-left: 3px solid rgba(76, 195, 247, 0.5);
}

.path-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 6px;
  color: #4fc3f7;
}

.path-length {
  font-size: 10px;
  background: rgba(76, 195, 247, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
}

.path-nodes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.path-node {
  background: rgba(76, 195, 247, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  transition: all 0.2s;
}

.path-node.start-node {
  background: rgba(76, 175, 80, 0.3);
  border: 1px solid rgba(76, 175, 80, 0.5);
}

.path-node.end-node {
  background: rgba(244, 67, 54, 0.3);
  border: 1px solid rgba(244, 67, 54, 0.5);
}

.arrow {
  color: #4fc3f7;
  margin: 0 4px;
  font-weight: bold;
}

.path-papers {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.step-papers {
  margin-bottom: 4px;
  font-size: 10px;
}

.step-papers small {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.step-paper-list {
  margin-top: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.paper-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.9);
}

.more-papers-tag {
  background: rgba(76, 195, 247, 0.3);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
  color: #4fc3f7;
  font-style: italic;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-right: 5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.action-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  opacity: 0.6;
}

.cancel-btn {
  background: #f44336 !important;
  border-color: #f44336 !important;
}

.cancel-btn:hover {
  background: #d32f2f !important;
}

.capability-info, .edge-info {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.papers-list {
  max-height: 300px;
  overflow-y: auto;
}

.paper-item {
  margin-bottom: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border-left: 3px solid #4fc3f7;
}

.paper-link {
  color: #4fc3f7;
  text-decoration: none;
  transition: color 0.2s;
}

.paper-link:hover {
  color: #29b6f6;
  text-decoration: underline;
}

.external-link {
  font-size: 11px;
  margin-left: 4px;
}

.paper-text {
  color: rgba(255, 255, 255, 0.9);
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar,
.papers-list::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track,
.papers-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb,
.papers-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}
</style> 