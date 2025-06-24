import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useDataStore } from '@/stores/dataStore'
import { parseCapabilitiesString, cleanCapabilityName } from '@/utils/dataProcessor'

export function useDataProcessor() {
  const dataStore = useDataStore()

  const processFile = async (file) => {
    dataStore.setLoading(true, '正在处理文件...')
    
    try {
      const data = await readExcelFile(file)
      const processedData = processCapabilityData(data)
      dataStore.setProcessedData(processedData)
      dataStore.setDataStatus(`已加载: ${file.name}`)
      return processedData
    } catch (error) {
      console.error('文件处理失败:', error)
      dataStore.setDataStatus('文件处理失败')
      throw error
    } finally {
      dataStore.setLoading(false)
    }
  }

  const loadDefaultData = async () => {
    dataStore.setLoading(true, '正在加载默认数据...')
    
    try {
      // 尝试加载默认数据文件 - 修改路径
      const response = await fetch('/data6.xlsx')  // Vite 会自动从 public 目录提供文件
      if (!response.ok) {
        throw new Error('默认数据文件不存在')
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(worksheet)
      
      const processedData = processCapabilityData(data)
      dataStore.setProcessedData(processedData)
      dataStore.setDataStatus('已加载默认数据')
      
      return processedData
    } catch (error) {
      console.log('未找到默认数据文件')
      dataStore.setDataStatus('请上传数据文件')
      throw error
    } finally {
      dataStore.setLoading(false)
    }
  }

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const processCapabilityData = (data) => {
    const capabilityStats = {}
    const paperCapabilityMap = {}
    const capabilityPairMap = {}

    data.forEach((row) => {
      const paperName = row['Papers']
      const mergedCapabilities = row['merged_capabilities']
      
      if (mergedCapabilities && typeof mergedCapabilities === 'string') {
        try {
          const capabilities = parseCapabilitiesString(mergedCapabilities)
          
          // 统计单个能力
          capabilities.forEach(cap => {
            if (cap && cap.trim()) {
              const cleanCap = cleanCapabilityName(cap)
              capabilityStats[cleanCap] = (capabilityStats[cleanCap] || 0) + 1
              
              if (!paperCapabilityMap[cleanCap]) {
                paperCapabilityMap[cleanCap] = []
              }
              if (paperName && !paperCapabilityMap[cleanCap].includes(paperName)) {
                paperCapabilityMap[cleanCap].push(paperName)
              }
            }
          })
          
          // 统计能力对的共现
          for (let i = 0; i < capabilities.length; i++) {
            for (let j = i + 1; j < capabilities.length; j++) {
              const cap1 = cleanCapabilityName(capabilities[i])
              const cap2 = cleanCapabilityName(capabilities[j])
              if (cap1 && cap2) {
                const pairKey = [cap1, cap2].sort().join('|||')
                if (!capabilityPairMap[pairKey]) {
                  capabilityPairMap[pairKey] = []
                }
                if (paperName && !capabilityPairMap[pairKey].includes(paperName)) {
                  capabilityPairMap[pairKey].push(paperName)
                }
              }
            }
          }
        } catch (e) {
          console.log('解析错误:', e)
        }
      }
    })

    return {
      capabilityStats,
      paperCapabilityMap,
      capabilityPairMap
    }
  }

  return {
    processFile,
    loadDefaultData,
    readExcelFile,
    processCapabilityData
  }
}