<template>
    <div class="about-view">
      <div class="container">
        <header class="about-header">
          <h1>关于项目</h1>
          <p class="subtitle">LLM Capability Network Visualization</p>
        </header>
  
        <div class="content">
          <section class="section">
            <h2>项目简介</h2>
            <p>
              LLM能力网络可视化是一个交互式的数据分析工具，用于展示和分析大语言模型(LLM)的各种能力之间的关联关系。
              通过网络图的形式，您可以直观地了解不同能力的重要程度以及它们之间的共现模式。
            </p>
          </section>
  
          <section class="section">
            <h2>主要功能</h2>
            <ul class="feature-list">
              <li>📊 <strong>数据上传</strong> - 支持Excel格式的数据文件上传</li>
              <li>🔍 <strong>交互式搜索</strong> - 快速查找和高亮特定能力</li>
              <li>🎛️ <strong>动态筛选</strong> - 根据频次和连接数动态过滤节点</li>
              <li>📈 <strong>网络可视化</strong> - 基于D3.js的力导向图布局</li>
              <li>💡 <strong>智能提示</strong> - 详细的节点和边信息展示</li>
              <li>📊 <strong>统计分析</strong> - 实时的网络统计信息</li>
            </ul>
          </section>
  
          <section class="section">
            <h2>技术栈</h2>
            <div class="tech-stack">
              <div class="tech-item">
                <h3>前端框架</h3>
                <p>Vue 3 + Composition API</p>
              </div>
              <div class="tech-item">
                <h3>状态管理</h3>
                <p>Pinia</p>
              </div>
              <div class="tech-item">
                <h3>可视化</h3>
                <p>D3.js</p>
              </div>
              <div class="tech-item">
                <h3>构建工具</h3>
                <p>Vite</p>
              </div>
            </div>
          </section>
  
          <section class="section">
            <h2>使用指南</h2>
            <ol class="guide-list">
              <li>点击"上传新数据"按钮选择Excel数据文件</li>
              <li>使用搜索框查找特定的能力名称</li>
              <li>调整筛选控件来改变显示的节点和连接</li>
              <li>鼠标悬停在节点或边上查看详细信息</li>
              <li>拖拽节点来调整布局，使用鼠标滚轮缩放视图</li>
            </ol>
          </section>
        </div>
  
        <footer class="about-footer">
          <p>&copy; 2024 LLM Capability Network. All rights reserved.</p>
        </footer>
      </div>
    </div>
  </template>
  
  <script setup>
  // 这个组件主要是静态内容，不需要响应式数据
  </script>
  
  <style scoped>
  .about-view {
    min-height: 100vh;
    background: var(--bg-gradient);
    color: var(--text-primary);
    padding: var(--spacing-xl);
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .about-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  }
  
  .about-header h1 {
    font-size: 3em;
    font-weight: 300;
    margin-bottom: var(--spacing-md);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .subtitle {
    font-size: 1.2em;
    opacity: 0.8;
  }
  
  .content {
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--border-radius-xl);
    padding: var(--spacing-xl);
    backdrop-filter: blur(10px);
  }
  
  .section {
    margin-bottom: var(--spacing-xl);
  }
  
  .section h2 {
    color: var(--primary-color);
    margin-bottom: var(--spacing-lg);
    font-size: 1.8em;
  }
  
  .section p {
    line-height: 1.6;
    margin-bottom: var(--spacing-md);
  }
  
  .feature-list {
    list-style: none;
    padding: 0;
  }
  
  .feature-list li {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--border-radius-md);
    border-left: 4px solid var(--primary-color);
  }
  
  .tech-stack {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .tech-item {
    background: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-lg);
    border-radius: var(--border-radius-md);
    text-align: center;
  }
  
  .tech-item h3 {
    color: var(--primary-color);
    margin-bottom: var(--spacing-sm);
  }
  
  .guide-list {
    padding-left: var(--spacing-lg);
  }
  
  .guide-list li {
    margin-bottom: var(--spacing-md);
    line-height: 1.6;
  }
  
  .about-footer {
    text-align: center;
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-lg);
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    opacity: 0.7;
  }
  </style>