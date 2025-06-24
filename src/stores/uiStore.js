import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 状态
  const sidebarCollapsed = ref(false)
  const tooltipVisible = ref(false)
  const tooltipContent = ref('')
  const tooltipPosition = ref({ x: 0, y: 0 })
  const searchQuery = ref('')

  // 方法
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const showTooltip = (content, position) => {
    tooltipContent.value = content
    tooltipPosition.value = position
    tooltipVisible.value = true
  }

  const hideTooltip = () => {
    tooltipVisible.value = false
    tooltipContent.value = ''
  }

  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  return {
    // 状态
    sidebarCollapsed,
    tooltipVisible,
    tooltipContent,
    tooltipPosition,
    searchQuery,
    // 方法
    toggleSidebar,
    showTooltip,
    hideTooltip,
    setSearchQuery
  }
})