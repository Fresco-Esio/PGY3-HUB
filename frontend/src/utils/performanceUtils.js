// Performance optimizations for mind map rendering
import { useMemo, useCallback } from 'react';

// Memoized node data to prevent unnecessary re-renders
export const useMemoizedNodeData = (data, dependencies = []) => {
  return useMemo(() => data, dependencies);
};

// Throttled layout calculation to prevent excessive computations
export const useThrottledLayout = (layoutFunction, delay = 100) => {
  return useCallback(
    throttle(layoutFunction, delay),
    [layoutFunction, delay]
  );
};

// Throttle function implementation
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Optimized data conversion with chunking for large datasets
export const convertDataInChunks = (data, chunkSize = 50) => {
  return new Promise((resolve) => {
    const chunks = [];
    const allItems = [
      ...data.topics.map(item => ({ ...item, type: 'topic' })),
      ...data.cases.map(item => ({ ...item, type: 'case' })),
      ...data.tasks.map(item => ({ ...item, type: 'task' })),
      ...data.literature.map(item => ({ ...item, type: 'literature' }))
    ];
    
    for (let i = 0; i < allItems.length; i += chunkSize) {
      chunks.push(allItems.slice(i, i + chunkSize));
    }
    
    resolve(chunks);
  });
};

// Fast initial layout without force simulation
export const getQuickLayout = (nodes) => {
  const gridSize = Math.ceil(Math.sqrt(nodes.length));
  const nodeSpacing = 200;
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % gridSize) * nodeSpacing,
      y: Math.floor(index / gridSize) * nodeSpacing
    }
  }));
};

// Memory-efficient edge creation
export const createOptimizedEdges = (connections, nodeIds) => {
  const nodeIdSet = new Set(nodeIds);
  
  return connections
    .filter(conn => nodeIdSet.has(conn.source) && nodeIdSet.has(conn.target))
    .map(conn => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      label: conn.label,
      type: 'floating',
      style: {
        strokeWidth: 2,
        stroke: '#64748b',
        opacity: 0.85
      },
      animated: false,
      updatable: true
    }));
};
