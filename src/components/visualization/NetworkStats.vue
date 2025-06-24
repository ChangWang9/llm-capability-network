<template>
    <div class="stats">
      <div class="stat-item">
        <span>节点数:</span>
        <span class="stat-value">{{ networkStats.nodeCount }}</span>
      </div>
      <div class="stat-item">
        <span>边数:</span>
        <span class="stat-value">{{ networkStats.edgeCount }}</span>
      </div>
      <div class="stat-item">
        <span>最大频次:</span>
        <span class="stat-value">{{ networkStats.maxFreq }}</span>
      </div>
      <div class="stat-item">
        <span>总能力数:</span>
        <span class="stat-value">{{ totalCapabilities }}</span>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useNetworkStore } from '@/stores/networkStore'
  import { useDataStore } from '@/stores/dataStore'
  
  const networkStore = useNetworkStore()
  const dataStore = useDataStore()
  
  const networkStats = computed(() => networkStore.networkStats)
  const totalCapabilities = computed(() => dataStore.totalCapabilities)
  </script>
  
  <style scoped>
  .stats {
    background: var(--card-bg);
    padding: 15px;
    border-radius: var(--border-radius-lg);
    margin-bottom: var(--spacing-lg);
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
    font-size: 14px;
  }
  
  .stat-value {
    color: var(--primary-color);
    font-weight: 600;
  }
  </style>