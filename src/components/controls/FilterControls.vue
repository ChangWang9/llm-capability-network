<template>
    <div class="filter-controls">
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