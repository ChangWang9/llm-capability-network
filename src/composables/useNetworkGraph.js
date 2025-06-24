import { ref, nextTick } from 'vue'
import * as d3 from 'd3'
import { useNetworkStore } from '@/stores/networkStore'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'

export function useNetworkGraph() {
  const networkStore = useNetworkStore()
  const dataStore = useDataStore()
  const uiStore = useUIStore()
  
  let svg, g, simulation
  const networkContainer = ref(null)

  const initializeNetwork = async () => {
    await nextTick()
    
    if (!networkContainer.value) return

    const container = networkContainer.value
    const width = container.clientWidth
    const height = container.clientHeight

    // 清除现有的SVG内容
    d3.select(container).select('svg').remove()

    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    g = svg.append('g')

    setupZoom(svg, g)
    setupSimulation(width, height)
  }

  const setupZoom = (svg, g) => {
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)
  }

  const setupSimulation = (width, height) => {
    simulation = d3.forceSimulation()
      .force('link', d3.forceLink()
        .id(d => d.id)
        .distance(d => {
          // 根据节点大小和连接强度动态调整距离
          const baseDistance = 150 // 基础距离
          const strengthFactor = Math.max(1, d.strength / 10) // 连接强度因子
          return baseDistance + (strengthFactor * 20)
        })
        .strength(0.3) // 降低链接强度，让节点更松散
      )
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // 根据节点大小调整排斥力
          return -800 - (d.radius * 10)
        })
        .distanceMax(400) // 设置最大作用距离
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => d.radius + 20) // 增加碰撞半径
        .strength(0.8) // 增加碰撞强度
      )
      // 添加x和y轴的定位力，防止节点过度分散
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
  }

  const updateVisualization = () => {
    if (!dataStore.processedData?.capabilityStats || 
        Object.keys(dataStore.processedData.capabilityStats).length === 0) {
      return
    }

    const { nodes, links } = generateNetworkData()
    
    networkStore.setNodes(nodes)
    networkStore.setLinks(links)
    networkStore.updateNetworkStats({
      nodeCount: nodes.length,
      edgeCount: links.length,
      maxFreq: Math.max(...nodes.map(n => n.count), 0)
    })

    renderNetwork(nodes, links)
  }

  const generateNetworkData = () => {
    // 过滤节点
    const filteredCapabilities = Object.entries(dataStore.processedData.capabilityStats)
      .filter(([_, count]) => count >= networkStore.minFrequency)
      .map(([name, count]) => ({ id: name, count }))

    // 创建节点
    const nodes = filteredCapabilities.map(cap => ({
      id: cap.id,
      count: cap.count,
      radius: Math.sqrt(cap.count) * 2 + 8,
      color: getNodeColor(cap.count)
    }))

    // 创建边
    const links = []
    const nodeSet = new Set(nodes.map(n => n.id))

    Object.entries(dataStore.processedData.capabilityPairMap).forEach(([pairKey, papers]) => {
      if (papers.length >= networkStore.minConnections) {
        const [cap1, cap2] = pairKey.split('|||')
        if (nodeSet.has(cap1) && nodeSet.has(cap2)) {
          links.push({
            source: cap1,
            target: cap2,
            strength: papers.length,
            papers: papers
          })
        }
      }
    })

    return { nodes, links }
  }

  const getNodeColor = (count) => {
    if (count > 500) return '#ff6b6b'
    if (count > 100) return '#4ecdc4'
    return '#45b7d1'
  }

  // 节点悬停提示
  const showNodeTooltip = (event, d) => {
    console.log('Node hover:', d.id) // 调试日志
    
    const papers = dataStore.processedData.paperCapabilityMap[d.id] || []
    const topPapers = papers.slice(0, 5)
    
    const content = `
      <h3>${d.id}</h3>
      <p><strong>出现次数:</strong> ${d.count}</p>
      <div class="papers">
        <strong>相关论文 (前5篇):</strong><br>
        ${topPapers.map(paper => `<div class="paper-item">${formatPaperName(paper)}</div>`).join('')}
        ${papers.length > 5 ? `<div class="more-papers">...还有 ${papers.length - 5} 篇论文</div>` : ''}
      </div>
    `
    
    const position = {
      x: event.pageX + 10,
      y: event.pageY + 10
    }
    
    uiStore.showTooltip(content, position)
  }

  // 边悬停提示
  const showEdgeTooltip = (event, d) => {
    console.log('Edge hover:', d.source.id, d.target.id) // 调试日志
    
    const topPapers = d.papers.slice(0, 5)
    
    const content = `
      <h3>${d.source.id} + ${d.target.id}</h3>
      <p><strong>共现次数:</strong> ${d.strength}</p>
      <div class="papers">
        <strong>共同出现的论文 (前5篇):</strong><br>
        ${topPapers.map(paper => `<div class="paper-item">${formatPaperName(paper)}</div>`).join('')}
        ${d.papers.length > 5 ? `<div class="more-papers">...还有 ${d.papers.length - 5} 篇论文</div>` : ''}
      </div>
    `
    
    const position = {
      x: event.pageX + 10,
      y: event.pageY + 10
    }
    
    uiStore.showTooltip(content, position)
  }

  // 隐藏提示
  const hideTooltip = () => {
    uiStore.hideTooltip()
  }

  // 格式化论文名称
  const formatPaperName = (paperName) => {
    return paperName.replace('.txt', '').replace(/^[A-Z]+\d+_/, '')
  }

  // 高亮能力
  const highlightCapability = (capabilityName) => {
    if (!g) return
    
    g.selectAll('circle')
      .style('opacity', d => d.id === capabilityName ? 1 : 0.3)
      .style('stroke-width', d => d.id === capabilityName ? 4 : 2)
    
    g.selectAll('line')
      .style('opacity', d => 
        d.source.id === capabilityName || d.target.id === capabilityName ? 1 : 0.1
      )
    
    g.selectAll('text')
      .style('opacity', d => d.id === capabilityName ? 1 : 0.3)
  }

  // 重置高亮
  const resetHighlight = () => {
    if (!g) return
    
    g.selectAll('circle')
      .style('opacity', 1)
      .style('stroke-width', 2)
    
    g.selectAll('line')
      .style('opacity', 0.6)
    
    g.selectAll('text')
      .style('opacity', 1)
  }

  const renderNetwork = (nodes, links) => {
    if (!g || !simulation) return

    console.log('Rendering network with', nodes.length, 'nodes and', links.length, 'links') // 调试日志

    // 清除现有元素
    g.selectAll('*').remove()

    // 创建链接
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.strength))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        console.log('Link mouseover triggered') // 调试日志
        showEdgeTooltip(event, d)
      })
      .on('mouseout', hideTooltip)

    // 创建节点
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        console.log('Node mouseover triggered') // 调试日志
        showNodeTooltip(event, d)
      })
      .on('mouseout', hideTooltip)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    // 添加标签
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes.filter(d => d.count > 200))
      .enter().append('text')
      .text(d => d.id.replace(' capability', ''))
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('dy', 4)
      .style('pointer-events', 'none')

    // 更新力导向图
    simulation.nodes(nodes)
    simulation.force('link').links(links)
    simulation.alpha(1).restart()

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y)
    })
  }

  // 拖拽函数
  const dragstarted = (event, d) => {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }

  const dragged = (event, d) => {
    d.fx = event.x
    d.fy = event.y
  }

  const dragended = (event, d) => {
    if (!event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }

  return {
    networkContainer,
    initializeNetwork,
    updateVisualization,
    generateNetworkData,
    highlightCapability,
    resetHighlight
  }
}