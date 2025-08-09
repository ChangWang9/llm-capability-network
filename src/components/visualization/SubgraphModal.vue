<!-- src/components/visualization/SubgraphModal.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          路径子图: {{ startNode }} → {{ endNode }}
        </h3>
        <div class="modal-controls">
          <span class="path-info">
            找到 {{ paths.length }} 条路径, {{ subgraphNodes.size }} 个节点
          </span>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
      </div>
      
      <div class="modal-body">
        <div class="subgraph-container" ref="subgraphContainer"></div>
        
        <div class="paths-summary">
          <h4>路径列表:</h4>
          <div class="path-list">
            <div 
              v-for="(path, index) in paths" 
              :key="index" 
              class="path-summary-item"
              @click="highlightPath(index)"
              :class="{ active: highlightedPath === index }"
            >
              <div class="path-header">
                <span class="path-name">路径 {{ index + 1 }}</span>
                <span class="path-length">长度: {{ path.length - 1 }}</span>
              </div>
              <div class="path-preview">
                {{ path.map(p => p.node).join(' → ') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  startNode: {
    type: String,
    default: ''
  },
  endNode: {
    type: String,
    default: ''
  },
  paths: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const dataStore = useDataStore()
const subgraphContainer = ref(null)
const highlightedPath = ref(-1)

let svg, g, simulation

// 计算子图中的所有节点
const subgraphNodes = computed(() => {
  const nodes = new Set()
  props.paths.forEach(path => {
    path.forEach(pathNode => {
      nodes.add(pathNode.node)
    })
  })
  return nodes
})

// 计算子图中的所有边
const subgraphEdges = computed(() => {
  const edges = new Map()
  
  // 从原始数据中获取边信息
  dataStore.processedData.edges.forEach(edge => {
    if (subgraphNodes.value.has(edge.source) && subgraphNodes.value.has(edge.target)) {
      const key = `${edge.source}|||${edge.target}`
      edges.set(key, edge)
    }
  })
  
  return Array.from(edges.values())
})

const closeModal = () => {
  emit('close')
}

const highlightPath = (pathIndex) => {
  highlightedPath.value = pathIndex
  updateVisualization()
}

const initializeSubgraph = async () => {
  await nextTick()
  
  if (!subgraphContainer.value) return

  const container = subgraphContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 清除现有的SVG内容
  d3.select(container).select('svg').remove()

  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // 定义箭头标记
  const defs = svg.append('defs')
  
  defs.append('marker')
    .attr('id', 'subgraph-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#E5E7EB')

  defs.append('marker')
    .attr('id', 'subgraph-arrow-highlight')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#EA580C')

  defs.append('marker')
    .attr('id', 'subgraph-arrow-low')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#8B5CF6')

  defs.append('marker')
    .attr('id', 'subgraph-arrow-mid')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#7C3AED')

  defs.append('marker')
    .attr('id', 'subgraph-arrow-high')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#EA580C')

  g = svg.append('g')

  // 设置缩放
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 设置力导向图（更稀疏）
  simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(160).strength(0.35))
    .force('charge', d3.forceManyBody().strength(-900).distanceMax(700))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => (d.radius || 12) + 24).strength(0.9))

  updateVisualization()
}

const updateVisualization = () => {
  if (!g || !simulation) return

  // 准备节点数据
  const nodes = Array.from(subgraphNodes.value).map(nodeName => {
    const count = dataStore.processedData.capabilityStats[nodeName] || 1
    return {
      id: nodeName,
      count: count,
      radius: Math.sqrt(count) * 1.5 + 8,
      color: getNodeColor(nodeName),
      isHighlighted: false
    }
  })

  // 准备边数据
  const links = subgraphEdges.value.map(edge => ({
    source: edge.source,
    target: edge.target,
    strength: edge.papers.length,
    papers: edge.papers,
    isHighlighted: false
  }))

  // 如果有高亮路径，标记相关节点和边
  if (highlightedPath.value >= 0 && highlightedPath.value < props.paths.length) {
    const path = props.paths[highlightedPath.value]
    
    // 高亮路径中的节点
    path.forEach(pathNode => {
      const node = nodes.find(n => n.id === pathNode.node)
      if (node) node.isHighlighted = true
    })

    // 高亮路径中的边
    for (let i = 0; i < path.length - 1; i++) {
      const link = links.find(l => 
        l.source === path[i].node && l.target === path[i + 1].node ||
        (typeof l.source === 'object' && l.source.id === path[i].node && 
         typeof l.target === 'object' && l.target.id === path[i + 1].node)
      )
      if (link) link.isHighlighted = true
    }
  }

  renderSubgraph(nodes, links)
}

const renderSubgraph = (nodes, links) => {
  // 清除现有元素
  g.selectAll('*').remove()

  // 创建边
  const link = g.append('g')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke', d => d.isHighlighted ? '#EA580C' : (d.strength > 10 ? '#EA580C' : d.strength > 5 ? '#7C3AED' : '#8B5CF6'))
    .attr('stroke-opacity', d => d.isHighlighted ? 1 : 0.85)
    .attr('stroke-width', d => d.isHighlighted ? 3 : Math.max(1.2, Math.sqrt(d.strength) * 1.1))
    .attr('marker-end', d => {
      if (d.isHighlighted) return 'url(#subgraph-arrow-high)'
      if (d.strength > 10) return 'url(#subgraph-arrow-high)'
      if (d.strength > 5) return 'url(#subgraph-arrow-mid)'
      return 'url(#subgraph-arrow-low)'
    })

  // 创建节点
  const node = g.append('g')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', d => d.radius)
    .attr('fill', d => d.color)
    .attr('stroke', d => d.isHighlighted ? '#EA580C' : '#E5E7EB')
    .attr('stroke-width', d => d.isHighlighted ? 3 : 2)
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))

  // 添加标签
  const labels = g.append('g')
    .selectAll('text')
    .data(nodes)
    .enter().append('text')
    .text(d => d.id.length > 20 ? d.id.substring(0, 20) + '...' : d.id)
    .attr('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('fill', '#E5E7EB')
    .attr('dy', 3)
    .style('pointer-events', 'none')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')

  // 更新力导向图
  simulation.nodes(nodes)
  simulation.force('link').links(links)
  simulation.alpha(1).restart()

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

    labels
      .attr('x', d => d.x)
      .attr('y', d => d.y)
  })
}

const getNodeColor = (nodeName) => {
  // 特殊标记起始和结束节点
  if (nodeName === props.startNode) return '#4caf50' // 绿色
  if (nodeName === props.endNode) return '#f44336' // 红色
  
  const count = dataStore.processedData.capabilityStats[nodeName] || 1
  if (count > 500) return '#ff6b6b'
  if (count > 100) return '#4ecdc4'
  return '#45b7d1'
}

// 拖拽函数
const dragstarted = (event, d) => {
  if (!event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

const dragged = (event, d) => {
  d.fx = event.x
  d.fy = event.y
}

const dragended = (event, d) => {
  if (!event.active) simulation.alphaTarget(0)
  d.fx = null
  d.fy = null
}

// 监听可见性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    nextTick(() => {
      initializeSubgraph()
    })
  }
})

// 监听路径变化
watch(() => props.paths, () => {
  if (props.visible) {
    updateVisualization()
  }
}, { deep: true })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-container {
  width: 90vw;
  height: 85vh;
  background: rgba(20, 20, 30, 0.95);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.modal-title {
  margin: 0;
  color: #4fc3f7;
  font-size: 18px;
  font-weight: 600;
}

.modal-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.path-info {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.subgraph-container {
  flex: 2;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.paths-summary {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
}

.paths-summary h4 {
  margin: 0 0 12px 0;
  color: #4fc3f7;
  font-size: 14px;
}

.path-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.path-summary-item {
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.path-summary-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.path-summary-item.active {
  background: rgba(76, 195, 247, 0.2);
  border-left-color: #4fc3f7;
}

.path-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.path-name {
  font-weight: 600;
  color: #4fc3f7;
  font-size: 12px;
}

.path-length {
  font-size: 10px;
  background: rgba(76, 195, 247, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
  color: white;
}

.path-preview {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  word-break: break-all;
}

/* 滚动条样式 */
.paths-summary::-webkit-scrollbar {
  width: 4px;
}

.paths-summary::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.paths-summary::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}
</style> 