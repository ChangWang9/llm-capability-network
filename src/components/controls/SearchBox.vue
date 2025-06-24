<template>
    <div class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索能力名称..." 
        class="search-box"
        @input="handleSearch"
      >
      <div v-if="filteredCapabilities.length > 0" class="capability-list">
        <div 
          v-for="cap in filteredCapabilities.slice(0, 10)" 
          :key="cap.name"
          :class="['capability-item', { highlighted: highlightedCapability === cap.name }]"
          @click="handleCapabilityClick(cap.name)"
        >
          {{ cap.name }} ({{ cap.count }})
        </div>
      </div>
      <button 
        v-if="highlightedCapability" 
        @click="clearHighlight"
        class="clear-btn"
      >
        清除高亮
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useDataStore } from '@/stores/dataStore'
  import { useNetworkStore } from '@/stores/networkStore'
  import { useUIStore } from '@/stores/uiStore'
  
  const dataStore = useDataStore()
  const networkStore = useNetworkStore()
  const uiStore = useUIStore()
  
  const searchQuery = ref('')
  const highlightedCapability = computed(() => networkStore.highlightedCapability)
  
  const emit = defineEmits(['highlight-capability', 'clear-highlight'])
  
  const filteredCapabilities = computed(() => {
    if (!searchQuery.value) return []
    const query = searchQuery.value.toLowerCase()
    return Object.entries(dataStore.processedData.capabilityStats)
      .filter(([name]) => name.toLowerCase().includes(query))
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })
  
  const handleSearch = () => {
    uiStore.setSearchQuery(searchQuery.value)
  }
  
  const handleCapabilityClick = (capabilityName) => {
    networkStore.setHighlightedCapability(capabilityName)
    emit('highlight-capability', capabilityName)
  }
  
  const clearHighlight = () => {
    networkStore.setHighlightedCapability('')
    emit('clear-highlight')
  }
  </script>
  
  <style scoped>
  .search-container {
    margin-bottom: var(--spacing-md);
  }
  
  .search-box {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: var(--border-radius-md);
    background: var(--card-bg);
    color: var(--text-primary);
    font-size: 14px;
    margin-bottom: var(--spacing-md);
  }
  
  .search-box::placeholder {
    color: var(--text-muted);
  }
  
  .search-box:focus {
    outline: none;
    background: var(--card-bg-hover);
    box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
  }
  
  .capability-list {
    max-height: 200px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }
  
  .capability-item {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-sm);
    margin-bottom: var(--spacing-xs);
    cursor: pointer;
    transition: all var(--transition-normal);
    font-size: 13px;
  }
  
  .capability-item:hover {
    background: var(--card-bg-hover);
  }
  
  .capability-item.highlighted {
    background: rgba(79, 195, 247, 0.3);
  }
  
  .clear-btn {
    background: var(--card-bg);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
    padding: 8px 16px;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 12px;
    transition: all var(--transition-normal);
  }
  
  .clear-btn:hover {
    background: var(--card-bg-hover);
  }
  </style>
  