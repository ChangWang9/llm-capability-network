<template>
  <div class="legend">
    <div class="legend-item">
      <div class="legend-color" :style="{ background: NODE_COLORS.HIGH_FREQ }"></div>
      <span>高频能力 (>500)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" :style="{ background: NODE_COLORS.MID_FREQ }"></div>
      <span>中频能力 (100-500)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" :style="{ background: NODE_COLORS.LOW_FREQ }"></div>
      <span>低频能力 (&lt;100)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color gradient"></div>
      <span>边粗细 = 共现频次</span>
    </div>
  </div>
</template>

<script setup>
import { NODE_COLORS } from '@/utils/constants.js'
</script>

<style scoped>
.legend {
  background: var(--card-bg);
  padding: 15px;
  border-radius: var(--border-radius-lg);
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  font-size: 13px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
}

.legend-color.gradient {
  background: linear-gradient(90deg, #666, #ccc);
}
</style>