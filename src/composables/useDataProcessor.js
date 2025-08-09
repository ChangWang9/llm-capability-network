// src/composables/useDataProcessor.js
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useDataStore } from '@/stores/dataStore'

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
      // 尝试加载默认数据文件
      const response = await fetch('/Edges_cleaned_updated_with_datasets_final_v4.xlsx')
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
    const edges = []
    const capabilityUrls = {} // 存储每个能力对应的URL

    let edgeProcessedCount = 0

    // 能力名称标准化函数
    const normalizeCapabilityName = (name) => {
      if (!name) return ''
      return name.toString().trim().toLowerCase()
        .replace(/['"]/g, '') // 移除引号
        .replace(/\s+/g, ' ') // 合并多个空格
        .replace(/capability$/, '') // 移除末尾的capability
        .trim()
    }
    
    data.forEach((row, index) => {
      const paperName = row['paper_name'] || row['actual_file_name']
      const url = row['url']
      const capabilitiesStr = row['capability']
      const edgesStr = row['Edges']
      
      // 解析能力列表
      let capabilities = []
      if (capabilitiesStr && typeof capabilitiesStr === 'string') {
        try {
          if (capabilitiesStr.startsWith('[') && capabilitiesStr.endsWith(']')) {
            capabilities = JSON.parse(capabilitiesStr.replace(/'/g, '"'))
          } else {
            capabilities = [capabilitiesStr]
          }
        } catch (e) {
          console.log('解析能力列表错误:', e)
          capabilities = [capabilitiesStr]
        }
      }
      
      // 统计能力并记录论文和URL
      capabilities.forEach(cap => {
        if (cap && cap.trim()) {
          const cleanCap = normalizeCapabilityName(cap)
          if (!cleanCap) return
          
          // 统计能力出现次数
          capabilityStats[cleanCap] = (capabilityStats[cleanCap] || 0) + 1
          
          // 记录能力对应的论文和URL
          if (!paperCapabilityMap[cleanCap]) {
            paperCapabilityMap[cleanCap] = []
          }
          if (paperName && !paperCapabilityMap[cleanCap].some(p => p.name === paperName)) {
            paperCapabilityMap[cleanCap].push({
              name: paperName,
              url: url || null
            })
          }
          
          // 保存能力的URL（如果存在）
          if (url && !capabilityUrls[cleanCap]) {
            capabilityUrls[cleanCap] = url
          }
        }
      })
      
      // 解析有向边
      if (edgesStr && typeof edgesStr === 'string') {
        edgeProcessedCount++
        
        try {
          let edgesList = []
          if (edgesStr.startsWith('[') && edgesStr.endsWith(']')) {
            // 处理嵌套数组格式 [['A', 'B'], ['C', 'D']]
            const cleanStr = edgesStr.replace(/'/g, '"')
            edgesList = JSON.parse(cleanStr)
          } else {
            // 如果不是数组格式，尝试其他解析方式
            const parts = edgesStr.split(',').map(s => s.trim())
            if (parts.length >= 2) {
              edgesList = [[parts[0], parts[1]]]
            }
          }
          
          edgesList.forEach(edge => {
            if (Array.isArray(edge) && edge.length === 2) {
              const [source, target] = edge
              if (source && target) {
                const normalizedSource = normalizeCapabilityName(source)
                const normalizedTarget = normalizeCapabilityName(target)
                
                if (normalizedSource && normalizedTarget && normalizedSource !== normalizedTarget) {
                  edges.push({
                    source: normalizedSource,
                    target: normalizedTarget,
                    paper: paperName,
                    url: url || null
                  })
                }
              }
            }
          })
        } catch (e) {
          // 尝试简单的逗号分割
          const parts = edgesStr.split(',').map(s => s.trim())
          if (parts.length >= 2) {
            const normalizedSource = normalizeCapabilityName(parts[0])
            const normalizedTarget = normalizeCapabilityName(parts[1])
            
            if (normalizedSource && normalizedTarget && normalizedSource !== normalizedTarget) {
              edges.push({
                source: normalizedSource,
                target: normalizedTarget,
                paper: paperName,
                url: url || null
              })
            }
          }
        }
      }
    })

    // 处理边的统计
    const edgeMap = {}
    edges.forEach(edge => {
      const key = `${edge.source}|||${edge.target}`
      if (!edgeMap[key]) {
        edgeMap[key] = {
          source: edge.source,
          target: edge.target,
          papers: []
        }
      }
      if (edge.paper && !edgeMap[key].papers.some(p => p.name === edge.paper)) {
        edgeMap[key].papers.push({
          name: edge.paper,
          url: edge.url
        })
      }
    })

    console.log('数据处理完成统计:', {
      总行数: data.length,
      有边数据的行数: edgeProcessedCount,
      原始边数量: edges.length,
      合并后边数量: Object.values(edgeMap).length,
      能力数量: Object.keys(capabilityStats).length,
      示例边: Object.values(edgeMap).slice(0, 3)
    })

    return {
      capabilityStats,
      paperCapabilityMap,
      edges: Object.values(edgeMap),
      capabilityUrls
    }
  }

  return {
    processFile,
    loadDefaultData,
    readExcelFile,
    processCapabilityData
  }
}