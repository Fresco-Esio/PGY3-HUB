// Canvas Renderer Hook - High-performance canvas rendering for timeline
import { useRef, useEffect, useCallback } from 'react';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

export const useCanvasRenderer = (
  canvasRef,
  dimensions = { width: 800, height: 600 },
  devicePixelRatio = window.devicePixelRatio || 1
) => {
  const contextRef = useRef(null);
  const colorScale = scaleOrdinal(schemeCategory10);

  // Initialize canvas context
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set up high DPI rendering
    canvas.width = dimensions.width * devicePixelRatio;
    canvas.height = dimensions.height * devicePixelRatio;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    
    context.scale(devicePixelRatio, devicePixelRatio);
    contextRef.current = context;
  }, [dimensions.width, dimensions.height, devicePixelRatio]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!contextRef.current) return;
    const ctx = contextRef.current;
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
  }, [dimensions.width, dimensions.height]);

  // Draw zigzag path
  const drawZigzagPath = useCallback((nodes) => {
    if (!contextRef.current || !nodes.length) return;
    
    const ctx = contextRef.current;
    const sortedNodes = [...nodes].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    
    sortedNodes.forEach((node, index) => {
      if (index === 0) {
        ctx.moveTo(node.x, node.y);
      } else {
        // Create zigzag effect
        const prevNode = sortedNodes[index - 1];
        const midY = (prevNode.y + node.y) / 2;
        
        ctx.lineTo(prevNode.x, midY);
        ctx.lineTo(node.x, midY);
        ctx.lineTo(node.x, node.y);
      }
    });
    
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  // Draw individual node
  const drawNode = useCallback((node, isHovered = false, isSelected = false) => {
    if (!contextRef.current) return;
    
    const ctx = contextRef.current;
    const radius = 8;
    const color = colorScale(node.type || 'default');
    
    // Node shadow
    if (isHovered || isSelected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // Node circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + (isHovered ? 3 : 0), 0, 2 * Math.PI);
    ctx.fill();
    
    // Node border
    ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Node label (if hovered)
    if (isHovered && node.label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y - radius - 8);
    }
  }, [colorScale]);

  // Draw all nodes
  const drawNodes = useCallback((nodes, hoveredNode = null, selectedNode = null) => {
    if (!contextRef.current || !nodes.length) return;
    
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;
      drawNode(node, isHovered, isSelected);
    });
  }, [drawNode]);

  // Draw connections/links
  const drawLinks = useCallback((links, nodes) => {
    if (!contextRef.current || !links.length) return;
    
    const ctx = contextRef.current;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
    ctx.lineWidth = 1;
    
    links.forEach(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });
  }, []);

  // Main render function
  const render = useCallback((
    nodes,
    links = [],
    hoveredNode = null,
    selectedNode = null,
    showZigzag = true
  ) => {
    clearCanvas();
    
    if (showZigzag) {
      drawZigzagPath(nodes);
    }
    
    if (links.length > 0) {
      drawLinks(links, nodes);
    }
    
    drawNodes(nodes, hoveredNode, selectedNode);
  }, [clearCanvas, drawZigzagPath, drawLinks, drawNodes]);

  // Get node at position (for mouse interactions)
  const getNodeAtPosition = useCallback((x, y, nodes, radius = 8) => {
    return nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius + 3;
    });
  }, []);

  return {
    context: contextRef.current,
    render,
    clearCanvas,
    drawNode,
    drawNodes,
    drawLinks,
    drawZigzagPath,
    getNodeAtPosition
  };
};