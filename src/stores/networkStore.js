import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNetworkStore = defineStore('network', () => {
  // 状态
  const nodes = ref([])
  const links = ref([])
  const minConnections = ref(1)
  const minFrequency = ref(10)
  const highlightedCapability = ref('')
  const networkStats = ref({
    nodeCount: 0,
    edgeCount: 0,
    maxFreq: 0
  })

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
  }

  return {
    // 状态
    nodes,
    links,
    minConnections,
    minFrequency,
    highlightedCapability,
    networkStats,
    // 计算属性
    filteredNodes,
    filteredLinks,
    // 方法
    setNodes,
    setLinks,
    updateNetworkStats,
    setHighlightedCapability,
    resetNetwork
  }
})