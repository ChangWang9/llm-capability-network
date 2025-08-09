// src/stores/uiStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 状态
  const sidebarCollapsed = ref(false)
  const tooltipVisible = ref(false)
  const tooltipContent = ref('')
  const tooltipPosition = ref({ x: 0, y: 0 })
  const tooltipInteractive = ref(false) // 是否是可交互的悬浮框
  const searchQuery = ref('')

  // 方法
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const showTooltip = (content, position, interactive = false) => {
    tooltipContent.value = content
    tooltipPosition.value = position
    tooltipInteractive.value = interactive
    tooltipVisible.value = true
  }

  const hideTooltip = () => {
    // 如果是可交互的悬浮框，不自动隐藏
    if (!tooltipInteractive.value) {
      tooltipVisible.value = false
      tooltipContent.value = ''
    }
  }

  const forceHideTooltip = () => {
    tooltipVisible.value = false
    tooltipContent.value = ''
    tooltipInteractive.value = false
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
    tooltipInteractive,
    searchQuery,
    // 方法
    toggleSidebar,
    showTooltip,
    hideTooltip,
    forceHideTooltip,
    setSearchQuery
  }
})