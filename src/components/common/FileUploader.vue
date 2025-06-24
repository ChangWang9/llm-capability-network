<template>
    <div class="file-uploader">
      <button 
        class="upload-btn" 
        @click="triggerFileUpload"
        :disabled="isLoading"
      >
        {{ isLoading ? '加载中...' : '上传新数据' }}
      </button>
      <input 
        ref="fileInput" 
        type="file" 
        accept=".xlsx,.xls" 
        @change="handleFileUpload" 
        class="file-input"
      >
      <div v-if="dataStatus" class="status-text">
        {{ dataStatus }}
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useDataStore } from '@/stores/dataStore'
  import { useDataProcessor } from '@/composables/useDataProcessor'
  
  const dataStore = useDataStore()
  const { processFile } = useDataProcessor()
  const fileInput = ref(null)
  
  const isLoading = computed(() => dataStore.isLoading)
  const dataStatus = computed(() => dataStore.dataStatus)
  
  const emit = defineEmits(['file-uploaded'])
  
  const triggerFileUpload = () => {
    if (!isLoading.value) {
      fileInput.value.click()
    }
  }
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
  
    try {
      await processFile(file)
      emit('file-uploaded')
    } catch (error) {
      console.error('文件上传失败:', error)
    } finally {
      event.target.value = ''
    }
  }
  </script>
  
  <style scoped>
  .file-uploader {
    background: var(--card-bg);
    padding: 15px;
    border-radius: var(--border-radius-lg);
    margin-bottom: var(--spacing-lg);
  }
  
  .upload-btn {
    background: linear-gradient(45deg, var(--primary-color), var(--primary-dark));
    border: none;
    color: white;
    padding: 12px 24px;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all var(--transition-normal);
    width: 100%;
    margin-bottom: 10px;
  }
  
  .upload-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(79, 195, 247, 0.4);
  }
  
  .upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .file-input {
    display: none;
  }
  
  .status-text {
    font-size: 12px;
    opacity: 0.8;
    margin-top: var(--spacing-sm);
  }
  </style>