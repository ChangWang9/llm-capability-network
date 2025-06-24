import { NODE_COLORS, COLOR_THRESHOLDS } from './constants.js'
  
export const getNodeColor = (count) => {
  if (count > COLOR_THRESHOLDS.HIGH) return NODE_COLORS.HIGH_FREQ
  if (count > COLOR_THRESHOLDS.MEDIUM) return NODE_COLORS.MID_FREQ
  return NODE_COLORS.LOW_FREQ
}

export const calculateNodeRadius = (count, minRadius = 8, scaleFactor = 2) => {
  return Math.sqrt(count) * scaleFactor + minRadius
}

export const generatePairKey = (cap1, cap2) => {
  return [cap1, cap2].sort().join('|||')
}

export const parsePairKey = (pairKey) => {
  return pairKey.split('|||')
}
