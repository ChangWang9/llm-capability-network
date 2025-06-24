import { ref } from 'vue'
import { useUIStore } from '@/stores/uiStore'

export function useTooltip() {
  const uiStore = useUIStore()
  const tooltipRef = ref(null)

  const showTooltip = (content, event) => {
    const position = {
      x: event.pageX + 10,
      y: event.pageY + 10
    }
    
    uiStore.showTooltip(content, position)
  }

  const hideTooltip = () => {
    uiStore.hideTooltip()
  }

  const updatePosition = (event) => {
    if (uiStore.tooltipVisible) {
      uiStore.tooltipPosition = {
        x: event.pageX + 10,
        y: event.pageY + 10
      }
    }
  }

  return {
    tooltipRef,
    showTooltip,
    hideTooltip,
    updatePosition
  }
}