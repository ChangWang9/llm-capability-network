<template>
    <div class="filter-controls">
      <div class="control-group">
        <label class="control-label">逐步展开模式</label>
        <div class="button-group">
          <label style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" v-model="explorationMode" @change="handleExplorationModeChange" />
            <span>{{ explorationMode ? '开启' : '关闭' }}</span>
          </label>
          <button 
            class="control-btn"
            v-if="explorationMode"
            @click="resetExpansion"
          >重置展开</button>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">
          最小连接数: <span class="control-value">{{ minConnections }}</span>
        </label>
        <input 
          v-model.number="minConnections" 
          type="range" 
          min="1" 
          max="50" 
          class="slider"
          @input="handleConnectionsChange"
        >
      </div>
      
      <div class="control-group">
        <label class="control-label">
          最小频次: <span class="control-value">{{ minFrequency }}</span>
        </label>
        <input 
          v-model.number="minFrequency" 
          type="range" 
          min="1" 
          max="200" 
          class="slider"
          @input="handleFrequencyChange"
        >
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useNetworkStore } from '@/stores/networkStore'
  
  const networkStore = useNetworkStore()
  
  const emit = defineEmits(['filters-changed'])
  
  const explorationMode = computed({
    get: () => networkStore.explorationMode,
    set: (value) => networkStore.setExplorationMode(value)
  })

  const minConnections = computed({
    get: () => networkStore.minConnections,
    set: (value) => {
      networkStore.minConnections = value
    }
  })
  
  const minFrequency = computed({
    get: () => networkStore.minFrequency,
    set: (value) => {
      networkStore.minFrequency = value
    }
  })
  
  const handleExplorationModeChange = () => {
    emit('filters-changed')
  }

  const resetExpansion = () => {
    networkStore.setExpandedNodes([])
    emit('filters-changed')
  }

  const handleConnectionsChange = () => {
    emit('filters-changed')
  }
  
  const handleFrequencyChange = () => {
    emit('filters-changed')
  }
  </script>
  
  <style scoped>
  .filter-controls {
    margin-bottom: var(--spacing-lg);
  }
  
  .control-group {
    margin-bottom: var(--spacing-lg);
  }
  
  .control-label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: 500;
    font-size: 14px;
  }
  
  .control-value {
    color: var(--primary-color);
    font-weight: 600;
  }

  .button-group { 
    display: flex; 
    gap: var(--spacing-xs);
  }

  .control-btn {
    background: var(--card-bg);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
    padding: 8px 12px;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 12px;
    transition: all var(--transition-normal);
  }

  .control-btn:hover {
    background: var(--card-bg-hover);
  }
  
  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary-color);
    cursor: pointer;
    transition: all var(--transition-normal);
  }
  
  .slider::-webkit-slider-thumb:hover {
    background: var(--primary-dark);
    transform: scale(1.1);
  }
  </style>