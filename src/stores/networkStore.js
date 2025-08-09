import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNetworkStore = defineStore('network', () => {
  // 状态
  const nodes = ref([])
  const links = ref([])
  const minConnections = ref(0) // 不过滤任何边
  const minFrequency = ref(1) // 降低最小频次，让更多节点显示
  const highlightedCapability = ref('')
  const networkStats = ref({
    nodeCount: 0,
    edgeCount: 0,
    maxFreq: 0
  })
  
  // 展示控制
  const displayAllNodes = ref(false)
  const explorationMode = ref(true)
  const expandedNodes = ref([]) // 逐步展开：已展开的核心节点集合
  const seedNode = ref('') // 初始仅显示的种子节点

  // 计算属性
  const filteredNodes = computed(() => 
    nodes.value.filter(node => node.count >= minFrequency.value)
  )

  const filteredLinks = computed(() =>
    links.value.filter(link => link.strength >= minConnections.value)
  )

  // 方法
  const setNodes = (newNodes) => {
    nodes.value = newNodes
  }

  const setLinks = (newLinks) => {
    links.value = newLinks
  }

  const updateNetworkStats = (stats) => {
    networkStats.value = { ...stats }
  }

  const setHighlightedCapability = (capability) => {
    highlightedCapability.value = capability
  }

  const resetNetwork = () => {
    nodes.value = []
    links.value = []
    highlightedCapability.value = ''
    networkStats.value = {
      nodeCount: 0,
      edgeCount: 0,
      maxFreq: 0
    }
    expandedNodes.value = []
    seedNode.value = ''
  }

  // 新增：逐步展开控制
  const setDisplayAllNodes = (val) => { displayAllNodes.value = !!val }
  const setExplorationMode = (val) => { explorationMode.value = !!val }
  const setExpandedNodes = (arr) => { expandedNodes.value = Array.from(new Set(arr)) }
  const addExpandedNode = (id) => {
    if (!expandedNodes.value.includes(id)) {
      expandedNodes.value = [...expandedNodes.value, id]
    }
  }
  const setSeedNode = (id) => { seedNode.value = id || '' }

  return {
    // 状态
    nodes,
    links,
    minConnections,
    minFrequency,
    highlightedCapability,
    networkStats,
    displayAllNodes,
    explorationMode,
    expandedNodes,
    seedNode,
    // 计算属性
    filteredNodes,
    filteredLinks,
    // 方法
    setNodes,
    setLinks,
    updateNetworkStats,
    setHighlightedCapability,
    resetNetwork,
    setDisplayAllNodes,
    setExplorationMode,
    setExpandedNodes,
    addExpandedNode,
    setSeedNode
  }
})