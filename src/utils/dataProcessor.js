export const parseCapabilitiesString = (capabilitiesStr) => {
    if (!capabilitiesStr || typeof capabilitiesStr !== 'string') {
      return []
    }
  
    if (capabilitiesStr.startsWith('[') && capabilitiesStr.endsWith(']')) {
      const cleanStr = capabilitiesStr.slice(1, -1)
      if (cleanStr.trim()) {
        return cleanStr.split(',').map(cap => cap.trim().replace(/^['"]|['"]$/g, ''))
      }
    }
    return [capabilitiesStr]
  }
  
  export const cleanCapabilityName = (name) => {
    return name.trim()
  }
  
  export const formatPaperName = (paperName) => {
    return paperName.replace('.txt', '').replace(/^[A-Z]+\d+_/, '')
  }
  
  // ====== src/utils/networkHelpers.js ======

  // ====== src/components/common/LoadingSpinner.vue ======
 