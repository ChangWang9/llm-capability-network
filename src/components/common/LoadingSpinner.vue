<template>
    <div class="loading-container" v-if="visible">
      <div class="spinner"></div>
      <div class="loading-text">{{ message }}</div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: '加载中...'
    }
  })
  </script>
  
  <style scoped>
  .loading-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    font-size: 1.2em;
    z-index: 100;
  }
  
  .spinner {
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-text {
    color: var(--text-primary);
  }
  </style>