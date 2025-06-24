<template>
    <div class="view-controls">
      <div class="control-group">
        <label class="control-label">视图模式</label>
        <div class="button-group">
          <button 
            :class="['control-btn', { active: viewMode === 'force' }]"
            @click="setViewMode('force')"
          >
            力导向图
          </button>
          <button 
            :class="['control-btn', { active: viewMode === 'radial' }]"
            @click="setViewMode('radial')"
          >
            径向布局
          </button>
        </div>
      </div>
  
      <div class="control-group">
        <label class="control-label">
          节点大小: <span class="control-value">{{ nodeScale }}x</span>
        </label>
        <input 
          v-model.number="nodeScale" 
          type="range" 
          min="0.5" 
          max="3" 
          step="0.1"
          class="slider"
          @input="handleNodeScaleChange"
        >
      </div>
  
      <div class="control-group">
        <label class="control-label">
          链接强度: <span class="control-value">{{ linkStrength }}</span>
        </label>
        <input 
          v-model.number="linkStrength" 
          type="range" 
          min="0.1" 
          max="2" 
          step="0.1"
          class="slider"
          @input="handleLinkStrengthChange"
        >
      </div>
  
      <div class="control-group">
        <button class="control-btn full-width" @click="resetView">
          重置视图
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useNetworkStore } from '@/stores/networkStore'
  
  const networkStore = useNetworkStore()
  
  const viewMode = ref('force')
  const nodeScale = ref(1)
  const linkStrength = ref(1)
  
  const emit = defineEmits(['view-changed', 'reset-view'])
  
  const setViewMode = (mode) => {
    viewMode.value = mode
    emit('view-changed', { mode })
  }
  
  const handleNodeScaleChange = () => {
    emit('view-changed', { nodeScale: nodeScale.value })
  }
  
  const handleLinkStrengthChange = () => {
    emit('view-changed', { linkStrength: linkStrength.value })
  }
  
  const resetView = () => {
    viewMode.value = 'force'
    nodeScale.value = 1
    linkStrength.value = 1
    emit('reset-view')
  }
  </script>
  
  <style scoped>
  .view-controls {
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
    flex: 1;
  }
  
  .control-btn:hover {
    background: var(--card-bg-hover);
  }
  
  .control-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }
  
  .control-btn.full-width {
    width: 100%;
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