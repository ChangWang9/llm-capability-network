import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDataStore = defineStore('data', () => {
  // 状态
  const rawData = ref(null)
  const processedData = ref({
    capabilityStats: {},
    paperCapabilityMap: {},
    capabilityPairMap: {}
  })
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const dataStatus = ref('')

  // 计算属性
  const totalCapabilities = computed(() => 
    Object.keys(processedData.value.capabilityStats).length
  )

  const capabilityList = computed(() =>
    Object.entries(processedData.value.capabilityStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  )

  // 方法
  const setProcessedData = (data) => {
    processedData.value = data
  }

  const setLoading = (loading, message = '') => {
    isLoading.value = loading
    loadingMessage.value = message
  }

  const setDataStatus = (status) => {
    dataStatus.value = status
  }

  const resetData = () => {
    rawData.value = null
    processedData.value = {
      capabilityStats: {},
      paperCapabilityMap: {},
      capabilityPairMap: {}
    }
    dataStatus.value = ''
  }

  return {
    // 状态
    rawData,
    processedData,
    isLoading,
    loadingMessage,
    dataStatus,
    // 计算属性
    totalCapabilities,
    capabilityList,
    // 方法
    setProcessedData,
    setLoading,
    setDataStatus,
    resetData
  }
})
