import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

const D3Graph = ({ mindMapData, onNodeClick, onNodeDoubleClick, onDataChange, physicsEnabled }) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const nodeElementsRef = useRef(null);
  const linkElementsRef = useRef(null);
  const gRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isInitializedRef = useRef(false);
  
  // Node configuration
  const nodeConfig = {
    topic: { color: '#3b82f6', radius: 60 },
    case: { color: '#6366f1', radius: 65 },
    task: { color: '#f59e0b', radius: 55 },
    literature: { color: '#a855f7', radius: 58 },
  };

  // Convert mindMapData to D3 format
  const convertToD3Format = useCallback((data) => {
    const nodes = [];
    const links = [];

    // Add nodes from all categories
    ['topics', 'cases', 'tasks', 'literature'].forEach((category) => {
      const nodeType = category === 'literature' ? 'literature' : category.slice(0, -1);
      const items = data[category] || [];
      
      items.forEach((item) => {
        const config = nodeConfig[nodeType];
        
        // Use existing position or create random position
        const x = item.position?.x ?? (400 + Math.random() * 200);
        const y = item.position?.y ?? (200 + Math.random() * 200);
        
        nodes.push({
          id: `${nodeType}-${item.id}`,
          label: item.label || item.title || item.primary_diagnosis || item.case_id || 'Untitled',
          type: nodeType,
          color: config.color,
          radius: config.radius,
          x: x,
          y: y,
          originalData: item,
        });
      });
    });

    // Add edges
    const connections = data.connections || [];
    const nodeIds = new Set(nodes.map(n => n.id));
    
    connections.forEach((conn) => {
      if (nodeIds.has(conn.source) && nodeIds.has(conn.target)) {
        links.push({
          source: conn.source,
          target: conn.target,
          id: conn.id || `edge-${conn.source}-${conn.target}`,
        });
      }
    });

    return { nodes, links };
  }, []);

  // Update positions of existing nodes without recreating the graph
  const updateNodePositions = useCallback((data) => {
    if (!nodeElementsRef.current || !nodesRef.current) return;

    const positionMap = new Map();
    
    // Build position map from data
    ['topics', 'cases', 'tasks', 'literature'].forEach((category) => {
      const nodeType = category === 'literature' ? 'literature' : category.slice(0, -1);
      const items = data[category] || [];
      
      items.forEach((item) => {
        const nodeId = `${nodeType}-${item.id}`;
        if (item.position?.x !== undefined && item.position?.y !== undefined) {
          positionMap.set(nodeId, item.position);
        }
      });
    });

    // Update node positions
    nodesRef.current.forEach(node => {
      const pos = positionMap.get(node.id);
      if (pos) {
        node.x = pos.x;
        node.y = pos.y;
      }
    });

    // Update visual positions
    if (nodeElementsRef.current) {
      nodeElementsRef.current.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    // Update link positions
    if (linkElementsRef.current && linksRef.current) {
      linkElementsRef.current.each(function(l) {
        const sourceNode = nodesRef.current.find(n => n.id === l.source);
        const targetNode = nodesRef.current.find(n => n.id === l.target);
        if (sourceNode && targetNode) {
          d3.select(this)
            .attr('x1', sourceNode.x)
            .attr('y1', sourceNode.y)
            .attr('x2', targetNode.x)
            .attr('y2', targetNode.y);
        }
      });
    }
  }, []);

  // Check if node structure has changed (not just positions)
  const hasStructureChanged = useCallback((oldNodes, newData) => {
    const { nodes: newNodes } = convertToD3Format(newData);
    
    if (oldNodes.length !== newNodes.length) return true;
    
    const oldIds = new Set(oldNodes.map(n => n.id));
    const newIds = new Set(newNodes.map(n => n.id));
    
    for (const id of newIds) {
      if (!oldIds.has(id)) return true;
    }
    
    return false;
  }, [convertToD3Format]);

  // Initialize or reinitialize the graph
  const initializeGraph = useCallback(() => {
    if (!svgRef.current || !mindMapData) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    console.log('🔷 D3 Initializing graph');

    // Clear previous graph container
    svg.selectAll('.graph-container').remove();

    // Create container group for zoom/pan
    const g = svg.append('g').attr('class', 'graph-container');
    gRef.current = g;

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        // Only apply zoom if not dragging a node
        if (!isDraggingRef.current) {
          g.attr('transform', event.transform);
        }
      });

    svg.call(zoom);

    // Convert data
    const { nodes, links } = convertToD3Format(mindMapData);
    nodesRef.current = nodes;
    linksRef.current = links;

    console.log('🔷 D3 Data:', { nodeCount: nodes.length, linkCount: links.length });

    // Create links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.6)
      .attr('x1', d => {
        const sourceNode = nodes.find(n => n.id === d.source);
        return sourceNode ? sourceNode.x : 0;
      })
      .attr('y1', d => {
        const sourceNode = nodes.find(n => n.id === d.source);
        return sourceNode ? sourceNode.y : 0;
      })
      .attr('x2', d => {
        const targetNode = nodes.find(n => n.id === d.target);
        return targetNode ? targetNode.x : 0;
      })
      .attr('y2', d => {
        const targetNode = nodes.find(n => n.id === d.target);
        return targetNode ? targetNode.y : 0;
      });

    linkElementsRef.current = link;

    // Create node groups
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    nodeElementsRef.current = node;

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 4);

    // Add labels to nodes
    node.append('text')
      .text(d => {
        const maxLen = 20;
        return d.label.length > maxLen ? d.label.substring(0, maxLen) + '...' : d.label;
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 0 3px #000, 0 0 3px #000');

    // Drag behavior with movement threshold
    let dragStartX = 0;
    let dragStartY = 0;
    let hasMoved = false;
    const dragThreshold = 5; // pixels

    const dragBehavior = d3.drag()
      .on('start', function(event, d) {
        isDraggingRef.current = false;
        hasMoved = false;
        dragStartX = event.x;
        dragStartY = event.y;
        
        // Disable zoom during potential drag
        svg.on('.zoom', null);
        
        // Reheat simulation on drag start if physics enabled
        if (simulationRef.current && physicsEnabled) {
          simulationRef.current.alphaTarget(0.3).restart();
        }
        
        // Fix this node during drag
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        const dx = event.x - dragStartX;
        const dy = event.y - dragStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!hasMoved && distance > dragThreshold) {
          hasMoved = true;
          isDraggingRef.current = true;
          d3.select(this).select('circle').attr('stroke-width', 6);
        }

        if (hasMoved) {
          // Update fixed position during drag
          d.fx = event.x;
          d.fy = event.y;
          d.x = event.x;
          d.y = event.y;
          
          // Physics simulation will handle the visual update via tick
        }
      })
      .on('end', function(event, d) {
        if (hasMoved) {
          d3.select(this).select('circle').attr('stroke-width', 4);
          
          // Release the node after drag if physics is enabled
          if (physicsEnabled) {
            d.fx = null;
            d.fy = null;
          } else {
            // Keep it fixed if physics is disabled
            d.fx = d.x;
            d.fy = d.y;
          }
          
          // Cool down simulation
          if (simulationRef.current && physicsEnabled) {
            simulationRef.current.alphaTarget(0);
          }
          
          // Save position to backend
          if (onDataChange) {
            const [type, ...idParts] = d.id.split('-');
            const entityId = idParts.join('-');
            onDataChange({ 
              type: 'position', 
              nodeType: type,
              nodeId: entityId,
              position: { x: d.x, y: d.y } 
            });
          }
        }
        
        // Re-enable zoom after drag
        setTimeout(() => {
          svg.call(zoom);
          isDraggingRef.current = false;
        }, 100);
        
        hasMoved = false;
      });

    node.call(dragBehavior);

    // Click and double-click handlers
    node.on('click', function(event, d) {
      if (!hasMoved && !isDraggingRef.current) {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d);
        }
      }
    });

    node.on('dblclick', function(event, d) {
      if (!hasMoved && !isDraggingRef.current) {
        event.stopPropagation();
        event.preventDefault();
        if (onNodeDoubleClick) {
          console.log('🔷 Double-click on:', d.id);
          onNodeDoubleClick(d);
        }
      }
    });

    // Create force simulation only if physics enabled
    if (physicsEnabled && nodes.length > 0) {
      // Remove fixed positions to allow physics to work
      nodes.forEach(n => {
        n.fx = null;
        n.fy = null;
      });

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(200).strength(1))
        .force('charge', d3.forceManyBody().strength(-800))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 20).strength(0.9))
        .alphaDecay(0.02) // Slower decay = longer simulation
        .velocityDecay(0.4); // Damping to prevent jitter

      simulationRef.current = simulation;

      simulation.on('tick', () => {
        // Update node positions
        node.attr('transform', d => `translate(${d.x},${d.y})`);

        // Update link positions
        link.each(function(l) {
          const sourceNode = nodes.find(n => n.id === l.source);
          const targetNode = nodes.find(n => n.id === l.target);
          if (sourceNode && targetNode) {
            d3.select(this)
              .attr('x1', sourceNode.x)
              .attr('y1', sourceNode.y)
              .attr('x2', targetNode.x)
              .attr('y2', targetNode.y);
          }
        });

        // Save positions periodically (every 60 ticks when alpha is low)
        if (simulation.alpha() < 0.05 && Math.random() < 0.1) {
          nodes.forEach(n => {
            const [type, ...idParts] = n.id.split('-');
            const entityId = idParts.join('-');
            if (onDataChange && !isDraggingRef.current) {
              onDataChange({ 
                type: 'position', 
                nodeType: type,
                nodeId: entityId,
                position: { x: n.x, y: n.y },
                silent: true // Don't trigger re-render
              });
            }
          });
        }
      });

      window.d3Simulation = simulation;
      window.d3Nodes = nodes;
      console.log('🔷 Physics simulation started with continuous force-directed layout');
    } else if (!physicsEnabled && nodes.length > 0) {
      // Fix all nodes in place when physics is disabled
      nodes.forEach(n => {
        n.fx = n.x;
        n.fy = n.y;
      });
      console.log('🔷 Physics disabled - nodes fixed in place');
    }

    isInitializedRef.current = true;
  }, [mindMapData, physicsEnabled, onNodeClick, onNodeDoubleClick, onDataChange, convertToD3Format]);

  // Main effect - only reinitialize when structure changes
  useEffect(() => {
    if (!svgRef.current || !mindMapData) return;

    // Check if we need to reinitialize or just update positions
    if (!isInitializedRef.current || hasStructureChanged(nodesRef.current, mindMapData)) {
      console.log('🔷 Structure changed - reinitializing');
      initializeGraph();
    } else {
      console.log('🔷 Only positions changed - updating');
      updateNodePositions(mindMapData);
    }

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [mindMapData, physicsEnabled]);

  // Separate effect for physics toggle
  useEffect(() => {
    if (isInitializedRef.current && simulationRef.current) {
      if (physicsEnabled) {
        simulationRef.current.alpha(0.3).restart();
        console.log('🔷 Physics enabled - restarted simulation');
      } else {
        simulationRef.current.stop();
        console.log('🔷 Physics disabled - stopped simulation');
      }
    }
  }, [physicsEnabled]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100"
      style={{ width: '100%', height: '100%', minHeight: '600px' }}
    />
  );
};

export default D3Graph;