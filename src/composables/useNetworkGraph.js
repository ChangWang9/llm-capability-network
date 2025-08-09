// src/composables/useNetworkGraph.js
import { ref, nextTick } from 'vue'
import * as d3 from 'd3'
import { useNetworkStore } from '@/stores/networkStore'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'

export function useNetworkGraph() {
  const networkStore = useNetworkStore()
  const dataStore = useDataStore()
  const uiStore = useUIStore()
  
  let svg, g, simulation, defs
  let containerWidth = 0
  let containerHeight = 0
  const networkContainer = ref(null)
  let currentTooltipNode = null

  const initializeNetwork = async () => {
    await nextTick()
    
    if (!networkContainer.value) return

    const container = networkContainer.value
    const width = container.clientWidth
    const height = container.clientHeight
    containerWidth = width
    containerHeight = height

    // 清除现有的SVG内容
    d3.select(container).select('svg').remove()

    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    // 定义箭头标记
    defs = svg.append('defs')
    
    // 创建不同大小的箭头
    const arrowSizes = [
      { id: 'arrow-small', size: 4, refX: 15 },
      { id: 'arrow-medium', size: 6, refX: 20 },
      { id: 'arrow-large', size: 8, refX: 25 }
    ]
    
    arrowSizes.forEach(arrow => {
      defs.append('marker')
        .attr('id', arrow.id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', arrow.refX)
        .attr('refY', 0)
        .attr('markerWidth', arrow.size)
        .attr('markerHeight', arrow.size)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#E5E7EB')
        .style('opacity', 0.55)
    })

    // 主题色箭头（根据强度映射颜色）
    const coloredArrows = [
      { id: 'arrow-low', color: '#8B5CF6' },     // 紫色中等
      { id: 'arrow-mid', color: '#7C3AED' },     // 量子紫
      { id: 'arrow-high', color: '#EA580C' }     // 能量橙
    ]

    coloredArrows.forEach(arrow => {
      defs.append('marker')
        .attr('id', arrow.id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', arrow.color)
        .style('opacity', 1)
    })

    // 节点发光滤镜
    const filter = defs.append('filter')
      .attr('id', 'node-glow')
      .attr('height', '200%')
      .attr('width', '200%')
      .attr('x', '-50%')
      .attr('y', '-50%')
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3.5')
      .attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    g = svg.append('g')

    setupZoom(svg, g)
    setupSimulation(width, height)
    
    // 添加点击背景关闭悬浮框的功能
    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        hideTooltip()
      }
    })
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
          const baseDistance = 280
          const strengthFactor = Math.max(1, d.strength / 5)
          return baseDistance + (strengthFactor * 40)
        })
        .strength(0.35)
      )
      .force('charge', d3.forceManyBody()
        .strength(d => -1600 - (d.radius * 20))
        .distanceMax(900)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => d.radius + 40)
        .strength(0.95)
      )
      .force('x', d3.forceX(width / 2).strength(0.02))
      .force('y', d3.forceY(height / 2).strength(0.02))
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
    const allCapabilities = Object.entries(dataStore.processedData.capabilityStats)
      .filter(([_, count]) => count >= networkStore.minFrequency)
      .map(([name, count]) => ({ id: name, count }))

    // 创建基础节点（不考虑展开）
    const baseNodes = allCapabilities.map(cap => ({
      id: cap.id,
      count: cap.count,
      radius: Math.sqrt(cap.count) * 2 + 10,
      color: getNodeColor(cap.count)
    }))

    if (networkStore.explorationMode) {
      // 初始化seed：若无seed则选取最高频节点
      if (!networkStore.seedNode) {
        if (baseNodes.length > 0) {
          const top = [...baseNodes].sort((a, b) => b.count - a.count)[0]
          networkStore.setSeedNode(top.id)
        } else {
          return { nodes: [], links: [] }
        }
      }

      // 首次仅显示seedNode，无边
      if (!networkStore.expandedNodes.length) {
        const seed = baseNodes.find(n => n.id === networkStore.seedNode)
        return seed ? { nodes: [seed], links: [] } : { nodes: [], links: [] }
      }

      // 展开后：展示已展开集合与其邻居
      const expandedSet = new Set(networkStore.expandedNodes)
      const neighborSet = new Set(expandedSet)
      const links = []

      dataStore.processedData.edges?.forEach(edge => {
        const hasPapers = edge.papers && edge.papers.length >= networkStore.minConnections
        if (!hasPapers) return

        const srcExpanded = expandedSet.has(edge.source)
        const tgtExpanded = expandedSet.has(edge.target)

        if (srcExpanded || tgtExpanded) {
          neighborSet.add(edge.source)
          neighborSet.add(edge.target)
          links.push({
            source: edge.source,
            target: edge.target,
            strength: edge.papers.length,
            papers: edge.papers
          })
        }
      })

      const nodes = baseNodes.filter(n => neighborSet.has(n.id))
      return { nodes, links }
    }

    // 非展开模式：原逻辑
    const links = []
    const nodeSet = new Set(baseNodes.map(n => n.id))

    dataStore.processedData.edges?.forEach((edge) => {
      if (!edge.papers) {
        edge.papers = [{ name: edge.paper || 'Unknown', url: edge.url }]
      }
      if (edge.papers.length < networkStore.minConnections) return
      if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) return

      links.push({
        source: edge.source,
        target: edge.target,
        strength: edge.papers.length,
        papers: edge.papers
      })
    })

    return { nodes: baseNodes, links }
  }

  const getNodeColor = (count) => {
    if (count > 500) return '#EA580C' // 高频：能量橙
    if (count > 100) return '#7C3AED' // 中频：量子紫
    return '#E5E7EB' // 低频：未来银
  }

  const getEdgeColor = (strength) => {
    // 脑科学主题：强=神经洋红，中=突触青，弱=浅紫
    if (strength > 10) return '#EC4899' // 强 -> Neural Magenta
    if (strength > 5) return '#0EA5E9'  // 中 -> Synapse Cyan
    return '#A78BFA'                    // 弱 -> Lilac
  }

  // 计算安全的tooltip位置，避让右侧面板与屏幕边界
  const getSafeTooltipPosition = (pageX, pageY) => {
    const margin = 16
    const tooltipWidth = 360 // 估计值，和样式max-width保持一致
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    // 右侧详情面板避让
    let safeRightBound = viewportW - margin
    const panel = document.querySelector('.paper-details-panel')
    if (panel) {
      const rect = panel.getBoundingClientRect()
      // 若面板可见，则在面板左侧再留一定间距
      if (rect.width > 0) {
        safeRightBound = Math.min(safeRightBound, rect.left - margin)
      }
    }

    let x = Math.min(pageX + 12, safeRightBound - tooltipWidth)
    let y = Math.max(margin, Math.min(pageY - 12, viewportH - 200))
    x = Math.max(margin, x)
    return { x, y }
  }

  // 节点点击事件处理（同时触发展开）
  const showNodeTooltip = (event, d) => {
    event.stopPropagation()
    currentTooltipNode = d

    // 逐步展开：点击即将该节点加入展开集合
    if (networkStore.explorationMode) {
      networkStore.addExpandedNode(d.id)
      // 点击后立即更新视图，展示其相邻边与邻居节点
      const { nodes, links } = generateNetworkData()
      renderNetwork(nodes, links)
    }
    
    // 触发节点点击事件，让外部组件处理详情显示
    const capability = { name: d.id, count: d.count }

    const nodeClickEvent = new CustomEvent('nodeClick', { 
      detail: { capability, event: event } 
    })
    document.dispatchEvent(nodeClickEvent)

    const papers = dataStore.processedData.paperCapabilityMap[d.id] || []
    const topPapers = papers.slice(0, 10)

    const content = `
      <div class="tooltip-header">
        <h3>${d.id}</h3>
        <button class="tooltip-close" onclick="window.closeTooltip()">×</button>
      </div>
      <p><strong>出现次数:</strong> ${d.count}</p>
      <div class="papers">
        <strong>相关论文 (前10篇):</strong><br>
        ${topPapers.map(paper => `
          <div class="paper-item">
            ${paper.url ? 
              `<a href="${paper.url}" target="_blank" class="paper-link">${formatPaperName(paper.name)}</a>` :
              `<span>${formatPaperName(paper.name)}</span>`
            }
          </div>
        `).join('')}
        ${papers.length > 10 ? `<div class="more-papers">...还有 ${papers.length - 10} 篇论文</div>` : ''}
      </div>
    `

    // 使用鼠标坐标，避免左上角定位问题
    const position = getSafeTooltipPosition(event.pageX, event.pageY)
    uiStore.showTooltip(content, position, true)
  }

  // 边点击事件处理（配色更新）
  const showEdgeTooltip = (event, d) => {
    event.stopPropagation()

    const edge = { source: d.source.id, target: d.target.id, papers: d.papers, strength: d.strength }

    const edgeClickEvent = new CustomEvent('edgeClick', { detail: { edge, event: event } })
    document.dispatchEvent(edgeClickEvent)

    const topPapers = d.papers.slice(0, 10)

    const content = `
      <div class="tooltip-header">
        <h3>${d.source.id} → ${d.target.id}</h3>
        <button class="tooltip-close" onclick="window.closeTooltip()">×</button>
      </div>
      <p><strong>共现次数:</strong> ${d.strength}</p>
      <div class="papers">
        <strong>共同出现的论文 (前10篇):</strong><br>
        ${topPapers.map(paper => `
          <div class="paper-item">
            ${paper.url ? 
              `<a href="${paper.url}" target="_blank" class="paper-link">${formatPaperName(paper.name)}</a>` :
              `<span>${formatPaperName(paper.name)}</span>`
            }
          </div>
        `).join('')}
        ${d.papers.length > 10 ? `<div class="more-papers">...还有 ${d.papers.length - 10} 篇论文</div>` : ''}
      </div>
    `

    const position = getSafeTooltipPosition(event.pageX, event.pageY)
    uiStore.showTooltip(content, position, true)
  }

  // 隐藏提示
  const hideTooltip = () => {
    currentTooltipNode = null
    // 强制关闭，避免交互态无法关闭
    uiStore.forceHideTooltip()
  }

  // 格式化论文名称
  const formatPaperName = (paperName) => {
    return paperName.replace('.txt', '').replace(/^[A-Z]+\d+_/, '')
  }

  // 定义全局关闭函数
  if (typeof window !== 'undefined') {
    // 直接绑定强制关闭
    window.closeTooltip = hideTooltip
  }

  // 高亮能力
  const highlightCapability = (capabilityName) => {
    if (!g) return
    
    g.selectAll('circle')
      .style('opacity', d => d.id === capabilityName ? 1 : 0.25)
      .style('stroke-width', d => d.id === capabilityName ? 4 : 2)
    
    g.selectAll('line')
      .style('opacity', d => 
        d.source.id === capabilityName || d.target.id === capabilityName ? 0.9 : 0.08
      )
    
    g.selectAll('text')
      .style('opacity', d => d.id === capabilityName ? 1 : 0.25)
  }

  // 重置高亮
  const resetHighlight = () => {
    if (!g) return
    
    g.selectAll('circle')
      .style('opacity', 1)
      .style('stroke-width', 2)
    
    g.selectAll('line')
      .style('opacity', 0.35)
    
    g.selectAll('text')
      .style('opacity', 1)
  }

  const renderNetwork = (nodes, links) => {
    if (!g || !simulation) return

    // 保留旧坐标，减少重排抖动
    const oldPositions = new Map()
    simulation.nodes().forEach(n => {
      oldPositions.set(n.id, { x: n.x, y: n.y })
    })

    // 为新数据注入初始位置：旧节点沿用原位；新节点靠近当前点击节点出现
    const seedPoint = currentTooltipNode ? { x: currentTooltipNode.x, y: currentTooltipNode.y } : null
    nodes.forEach(n => {
      const prev = oldPositions.get(n.id)
      if (prev) {
        n.x = prev.x
        n.y = prev.y
      } else if (seedPoint) {
        const jitter = () => (Math.random() - 0.5) * 40
        n.x = seedPoint.x + jitter()
        n.y = seedPoint.y + jitter()
      }
      n.vx = 0
      n.vy = 0
    })

    // 清除现有元素
    g.selectAll('*').remove()

    // 创建链接（有向边）
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => getEdgeColor(d.strength))
      .attr('stroke-opacity', 0.9)
      .attr('stroke-width', d => Math.max(1.5, Math.sqrt(d.strength) * 1.3))
      .attr('marker-end', d => {
        if (d.strength > 10) return 'url(#arrow-high)'
        if (d.strength > 5) return 'url(#arrow-mid)'
        return 'url(#arrow-low)'
      })
      .style('cursor', 'pointer')
      .on('click', showEdgeTooltip)

    // 创建节点
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 2)
      .style('filter', 'url(#node-glow)')
      .style('cursor', 'pointer')
      .on('click', showNodeTooltip)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    // 添加标签（更克制）
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes.filter(d => d.count > 200))
      .enter().append('text')
      .text(d => d.id.replace(' capability', ''))
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E7EB')
      .attr('dy', 4)
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')

    // 更新力导向图（更小alpha，减少抖动）
    simulation.nodes(nodes)
    simulation.force('link').links(links)

    // 临时固定旧节点，减少整体抖动
    const pinned = []
    nodes.forEach(n => {
      if (oldPositions.has(n.id)) {
        n.fx = n.x
        n.fy = n.y
        pinned.push(n)
      }
    })

    simulation.alpha(0.14).restart()

    if (pinned.length > 0) {
      setTimeout(() => {
        pinned.forEach(n => { n.fx = null; n.fy = null })
        simulation.alphaTarget(0).restart()
      }, 450)
    }

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

  // 按节点过滤网络（保留原有逻辑，并尊重displayAllNodes）
  const filterByNodes = (relatedNodes) => {
    if (!relatedNodes || relatedNodes.size === 0) {
      updateVisualization()
      return
    }

    const capabilities = Object.entries(dataStore.processedData.capabilityStats)
      .map(([name, count]) => ({ id: name, count }))
      .filter(cap => relatedNodes.has(cap.id))

    const filteredCapabilities = capabilities.filter(cap => {
      return cap.count >= networkStore.minFrequency ||
             networkStore.displayAllNodes
    })

    const nodes = filteredCapabilities.map(cap => ({
      id: cap.id,
      count: cap.count,
      radius: Math.sqrt(cap.count) * 2 + 10,
      color: getNodeColor(cap.count)
    }))

    const links = []
    const nodeSet = new Set(nodes.map(n => n.id))

    dataStore.processedData.edges.forEach(edge => {
      if (edge.papers.length >= networkStore.minConnections && 
          nodeSet.has(edge.source) && 
          nodeSet.has(edge.target)) {
        links.push({
          source: edge.source,
          target: edge.target,
          strength: edge.papers.length,
          papers: edge.papers
        })
      }
    })

    renderNetwork(nodes, links)
  }

  // —— 布局控制 ——
  const lockPositions = () => {
    const nodes = simulation.nodes()
    nodes.forEach(n => { n.fx = n.x; n.fy = n.y })
    simulation.alpha(0)
  }

  const unlockPositions = () => {
    const nodes = simulation.nodes()
    nodes.forEach(n => { n.fx = null; n.fy = null })
    simulation.alpha(1).restart()
  }

  const applyRadialLayout = () => {
    const nodes = simulation.nodes()
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    const radius = Math.max(120, Math.min(centerX, centerY) - 80)

    // 排序：出现次数多的靠外或靠内；这里靠外更分散
    const sorted = [...nodes].sort((a, b) => a.count - b.count)
    const total = Math.max(1, sorted.length)

    sorted.forEach((node, idx) => {
      const angle = (idx / total) * Math.PI * 2
      const r = radius * (0.65 + 0.35 * (idx / total))
      node.fx = centerX + r * Math.cos(angle)
      node.fy = centerY + r * Math.sin(angle)
    })

    simulation.alpha(0.8).restart()
  }

  return {
    networkContainer,
    initializeNetwork,
    updateVisualization,
    generateNetworkData,
    highlightCapability,
    resetHighlight,
    filterByNodes,
    lockPositions,
    unlockPositions,
    applyRadialLayout
  }
}