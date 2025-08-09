// src/composables/usePathFinder.js
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

export function usePathFinder() {
  const dataStore = useDataStore()
  
  const selectedNodes = ref([])
  const foundPaths = ref([])
  const isPathFinding = ref(false)
  const shouldCancelSearch = ref(false)

  // 从edges数据构建图结构
  const buildGraph = (edges) => {
    const graph = new Map()
    
    edges.forEach(edge => {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, [])
      }
      if (!graph.has(edge.target)) {
        graph.set(edge.target, [])
      }
      
      graph.get(edge.source).push({
        target: edge.target,
        papers: edge.papers
      })
    })
    
    return graph
  }

  // 高效的路径查找算法 - 使用BFS找最短路径，然后用限制的DFS找更多路径
  const findAllPaths = (graph, start, end, maxPaths = 10, maxDepth = 4) => {
    const paths = []
    const startTime = Date.now()
    const timeout = 5000 // 5秒超时
    
    // 首先使用BFS找最短路径
    const shortestPath = findShortestPath(graph, start, end)
    if (shortestPath) {
      paths.push(shortestPath)
    }
    
    // 如果需要更多路径，使用限制的DFS
    if (paths.length < maxPaths && shortestPath) {
      const minLength = shortestPath.length
      const maxSearchDepth = Math.min(maxDepth, minLength + 2) // 限制搜索深度
      
             const dfs = (current, target, currentPath, visited) => {
         // 取消检查
         if (shouldCancelSearch.value) {
           console.log('路径搜索被用户取消')
           return true
         }
         
         // 超时检查
         if (Date.now() - startTime > timeout) {
           console.log('路径搜索超时，返回已找到的路径')
           return true // 返回true表示超时
         }
        
        // 路径长度限制
        if (currentPath.length > maxSearchDepth) return false
        
        // 找到目标
        if (current === target && currentPath.length > 1) {
          // 检查是否是重复路径
          const pathStr = currentPath.map(p => p.node).join('->')
          const exists = paths.some(p => p.map(n => n.node).join('->') === pathStr)
          
          if (!exists) {
            paths.push([...currentPath])
          }
          
          // 达到最大路径数量就停止
          if (paths.length >= maxPaths) return true
          return false
        }
        
        // 防止循环
        if (visited.has(current)) return false
        
        const neighbors = graph.get(current) || []
        const newVisited = new Set(visited)
        newVisited.add(current)
        
        for (const neighbor of neighbors) {
          currentPath.push({
            node: neighbor.target,
            papers: neighbor.papers
          })
          
          const shouldStop = dfs(neighbor.target, target, currentPath, newVisited)
          currentPath.pop()
          
          if (shouldStop) return true
        }
        
        return false
      }
      
      // 从不同的邻居开始DFS，增加路径多样性
      const startNeighbors = graph.get(start) || []
      for (const neighbor of startNeighbors) {
        const initialPath = [
          { node: start, papers: [] },
          { node: neighbor.target, papers: neighbor.papers }
        ]
        
        const shouldStop = dfs(neighbor.target, end, initialPath, new Set([start]))
        if (shouldStop) break
      }
    }
    
    console.log(`路径搜索完成: 找到 ${paths.length} 条路径，用时 ${Date.now() - startTime}ms`)
    return paths.slice(0, maxPaths) // 确保不超过最大数量
  }

  // BFS找最短路径
  const findShortestPath = (graph, start, end) => {
    const queue = [{
      node: start,
      path: [{ node: start, papers: [] }]
    }]
    const visited = new Set([start])
    let iterations = 0
    const maxIterations = 1000 // 防止无限循环
    
    while (queue.length > 0 && iterations < maxIterations) {
      iterations++
      
      // 取消检查
      if (shouldCancelSearch.value) {
        return null
      }
      
      const { node: current, path } = queue.shift()
      
      if (current === end && path.length > 1) {
        return path
      }
      
      // 限制BFS深度
      if (path.length >= 5) continue
      
      const neighbors = graph.get(current) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.target)) {
          visited.add(neighbor.target)
          queue.push({
            node: neighbor.target,
            path: [...path, { node: neighbor.target, papers: neighbor.papers }]
          })
        }
      }
    }
    
    if (iterations >= maxIterations) {
      console.log('BFS达到最大迭代次数，停止搜索')
    }
    
    return null
  }

  // 取消路径搜索
  const cancelPathSearch = () => {
    shouldCancelSearch.value = true
    isPathFinding.value = false
    console.log('用户取消了路径搜索')
  }

  // 查找从nodeA到nodeB的路径（异步处理）
  const findPaths = async (nodeA, nodeB) => {
    if (isPathFinding.value) {
      console.log('路径查找正在进行中，请稍候...')
      return []
    }
    
    isPathFinding.value = true
    foundPaths.value = []
    shouldCancelSearch.value = false
    
    try {
      const edges = dataStore.processedData.edges
      if (!edges || edges.length === 0) {
        console.log('没有可用的边数据')
        return []
      }
      
      console.log(`开始查找路径: ${nodeA} -> ${nodeB}`)
      
      // 使用setTimeout让UI有机会更新
      return new Promise((resolve) => {
        setTimeout(() => {
          try {
            const graph = buildGraph(edges) 
            
            // 检查起点和终点是否存在
            if (!graph.has(nodeA)) {
              console.log(`起点 ${nodeA} 在图中不存在`)
              resolve([])
              return
            }
            
            if (!graph.has(nodeB)) {
              console.log(`终点 ${nodeB} 在图中不存在`)
              resolve([])
              return
            }
            
            const paths = findAllPaths(graph, nodeA, nodeB, 10, 4) // 最多10条路径，最大深度4
            foundPaths.value = paths
            
            console.log(`路径查找完成，找到 ${paths.length} 条路径`)
            resolve(paths)
          } catch (error) {
            console.error('路径查找过程出错:', error)
            resolve([])
          }
        }, 100) // 给UI 100ms的更新时间
      })
    } catch (error) {
      console.error('路径查找失败:', error)
      return []
    } finally {
      isPathFinding.value = false
    }
  }

  // 获取路径子图中的所有节点和边
  const getPathSubgraph = () => {
    if (foundPaths.value.length === 0) return { nodes: new Set(), edges: new Set() }
    
    const subgraphNodes = new Set()
    const subgraphEdges = new Set()
    
    // 收集所有路径中的节点
    foundPaths.value.forEach(path => {
      path.forEach(pathNode => {
        subgraphNodes.add(pathNode.node)
      })
      
      // 收集路径中的边
      for (let i = 0; i < path.length - 1; i++) {
        const edgeKey = `${path[i].node}|||${path[i + 1].node}`
        subgraphEdges.add(edgeKey)
      }
    })
    
    return { nodes: subgraphNodes, edges: subgraphEdges }
  }

  // 显示路径子图
  const showPathSubgraph = () => {
    const subgraph = getPathSubgraph()
    return subgraph.nodes
  }

  // 选择/取消选择节点
  const toggleNodeSelection = (nodeName) => {
    const index = selectedNodes.value.indexOf(nodeName)
    if (index > -1) {
      selectedNodes.value.splice(index, 1)
    } else {
      selectedNodes.value.push(nodeName)
    }
  }

  // 清除选择
  const clearSelection = () => {
    selectedNodes.value = []
    foundPaths.value = []
  }

  // 获取与选中节点相关的所有能力
  const getRelatedCapabilities = () => {
    if (selectedNodes.value.length === 0) return new Set()
    
    const relatedCapabilities = new Set()
    const edges = dataStore.processedData.edges
    
    selectedNodes.value.forEach(selectedNode => {
      relatedCapabilities.add(selectedNode)
      
      edges.forEach(edge => {
        if (edge.source === selectedNode) {
          relatedCapabilities.add(edge.target)
        }
        if (edge.target === selectedNode) {
          relatedCapabilities.add(edge.source)
        }
      })
    })
    
    return relatedCapabilities
  }

  // 过滤显示相关节点
  const filterBySelectedNodes = () => {
    return getRelatedCapabilities()
  }

  // 计算属性
  const canFindPath = computed(() => selectedNodes.value.length === 2)
  const hasSelection = computed(() => selectedNodes.value.length > 0)

  return {
    selectedNodes,
    foundPaths,
    isPathFinding,
    canFindPath,
    hasSelection,
    toggleNodeSelection,
    clearSelection,
    findPaths,
    cancelPathSearch,
    getRelatedCapabilities,
    filterBySelectedNodes,
    getPathSubgraph,
    showPathSubgraph
  }
} 