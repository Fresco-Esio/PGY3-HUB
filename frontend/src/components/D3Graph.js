import React, { useEffect, useRef, useCallback, useMemo } from 'react';
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
  const prevPositionsRef = useRef(new Map());
  const warmupTimeoutRef = useRef(null);
  const postDragWarmRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  
  const BASELINE_ALPHA = 0.015; // Keep sim gently ticking for continuous settling
  
  // Node configuration
  const nodeConfig = {
    topic: { color: '#3b82f6', radius: 60 },
    case: { color: '#6366f1', radius: 65 },
    task: { color: '#f59e0b', radius: 55 },
    literature: { color: '#a855f7', radius: 58 },
  };

  // Structural key - only changes when nodes/links added/removed (not position changes)
  const structuralKey = useMemo(() => {
    const nodeIds = [];
    if (mindMapData?.topics) nodeIds.push(...mindMapData.topics.map(t => `topic-${t.id}`));
    if (mindMapData?.cases) nodeIds.push(...mindMapData.cases.map(c => `case-${c.id}`));
    if (mindMapData?.tasks) nodeIds.push(...mindMapData.tasks.map(t => `task-${t.id}`));
    if (mindMapData?.literature) nodeIds.push(...mindMapData.literature.map(l => `literature-${l.id}`));
    nodeIds.sort();
    const linkIds = (mindMapData?.connections || []).map(c => String(c.id || `${c.source}->${c.target}`)).sort();
    return JSON.stringify({ nodes: nodeIds, links: linkIds });
  }, [mindMapData]);

  // Convert mindMapData to D3 format with position caching
  const convertToD3Format = useCallback((data) => {
    const nodes = [];
    const links = [];
    const nodeById = new Map();

    // Add nodes from all categories
    ['topics', 'cases', 'tasks', 'literature'].forEach((category) => {
      const nodeType = category === 'literature' ? 'literature' : category.slice(0, -1);
      const items = data[category] || [];
      
      items.forEach((item) => {
        const config = nodeConfig[nodeType];
        const nodeId = `${nodeType}-${item.id}`;
        
        // Position priority: 1) runtime cache, 2) saved position, 3) random
        let x, y;
        if (prevPositionsRef.current.has(nodeId)) {
          const prev = prevPositionsRef.current.get(nodeId);
          x = prev.x;
          y = prev.y;
        } else if (item.position?.x !== undefined && item.position?.y !== undefined) {
          x = item.position.x;
          y = item.position.y;
        } else {
          x = 400 + Math.random() * 200;
          y = 200 + Math.random() * 200;
        }
        
        const node = {
          id: nodeId,
          label: item.label || item.title || item.primary_diagnosis || item.case_id || 'Untitled',
          type: nodeType,
          color: config.color,
          radius: config.radius,
          x: x,
          y: y,
          originalData: item,
        };
        
        nodes.push(node);
        nodeById.set(nodeId, node);
      });
    });

    // Add edges
    const connections = data.connections || [];
    
    connections.forEach((conn) => {
      if (nodeById.has(conn.source) && nodeById.has(conn.target)) {
        links.push({
          source: conn.source,
          target: conn.target,
          id: conn.id || `edge-${conn.source}-${conn.target}`,
        });
      }
    });

    return { nodes, links };
  }, []);

  // Main effect - only reinitialize on structural changes
  useEffect(() => {
    if (!svgRef.current || !mindMapData) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    // Reuse or create container
    let g = gRef.current;
    if (!g) {
      const existing = svg.select('g.zoom-layer');
      g = existing.empty() ? svg.append('g').attr('class', 'zoom-layer') : existing;
      gRef.current = g;
    }

    // Setup zoom behavior (once)
    if (!zoomBehaviorRef.current) {
      zoomBehaviorRef.current = d3.zoom()
        .scaleExtent([0.2, 2])
        .on('zoom', (event) => {
          if (!isDraggingRef.current) {
            g.attr('transform', event.transform);
          }
        });
      svg.call(zoomBehaviorRef.current);
    }

    // Convert data
    const { nodes, links } = convertToD3Format(mindMapData);
    nodesRef.current = nodes;
    linksRef.current = links;

    console.log('🔷 D3 Update:', { nodeCount: nodes.length, linkCount: links.length });

    // Create or update simulation
    if (!simulationRef.current) {
      console.log('🔷 Creating new simulation');
      
      // Initial simulation with gentle forces
      simulationRef.current = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(-90))
        .force('collision', d3.forceCollide().radius(d => (d.radius || 28) + 4).strength(0.95))
        .alpha(0.12)
        .alphaDecay(0.08)
        .velocityDecay(0.55);

      // Add link force if we have links
      if (links.length > 0) {
        simulationRef.current.force('link', d3.forceLink(links).id(d => d.id).distance(70).strength(0.9).iterations(2));
      }

      // Add weak viewport centering forces
      const cx = width / 2;
      const cy = height / 2;
      simulationRef.current.force('viewX', d3.forceX(cx).strength(0.01));
      simulationRef.current.force('viewY', d3.forceY(cy).strength(0.01));

      // Brief warm-up then return to baseline
      simulationRef.current.alphaTarget(Math.max(0.03, BASELINE_ALPHA));
      if (warmupTimeoutRef.current) clearTimeout(warmupTimeoutRef.current);
      warmupTimeoutRef.current = setTimeout(() => {
        try {
          if (simulationRef.current) {
            simulationRef.current.alphaTarget(BASELINE_ALPHA);
          }
        } catch (e) {}
      }, 800);

      isInitializedRef.current = true;
    } else {
      console.log('🔷 Updating existing simulation');
      
      // Update nodes in simulation
      simulationRef.current.nodes(nodes);

      // Update or add link force
      if (links.length > 0) {
        const existingLinkForce = simulationRef.current.force('link');
        if (existingLinkForce) {
          existingLinkForce.links(links).distance(70).strength(0.9).iterations(2);
        } else {
          simulationRef.current.force('link', d3.forceLink(links).id(d => d.id).distance(70).strength(0.9).iterations(2));
        }
      } else {
        simulationRef.current.force('link', null);
      }

      // Gently reheat to integrate changes
      simulationRef.current.alpha(0.08).restart();
      simulationRef.current.alphaTarget(Math.max(0.02, BASELINE_ALPHA));
      if (warmupTimeoutRef.current) clearTimeout(warmupTimeoutRef.current);
      warmupTimeoutRef.current = setTimeout(() => {
        try {
          if (simulationRef.current) {
            simulationRef.current.alphaTarget(BASELINE_ALPHA);
          }
        } catch (e) {}
      }, 800);
    }

    // Ensure layer groups exist
    if (!linkElementsRef.current) {
      linkElementsRef.current = g.append('g').attr('class', 'links-layer');
    }
    if (!nodeElementsRef.current) {
      nodeElementsRef.current = g.append('g').attr('class', 'nodes-layer');
    }

    // Data join for links
    const link = linkElementsRef.current
      .selectAll('line.link')
      .data(links, d => d.id)
      .join(
        enter => enter.append('line')
          .attr('class', 'link')
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 3)
          .attr('stroke-opacity', 0.6),
        update => update,
        exit => exit.remove()
      );

    // Data join for nodes
    const node = nodeElementsRef.current
      .selectAll('g.node')
      .data(nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer');

          g.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 4);

          g.append('text')
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

          return g;
        },
        update => update,
        exit => exit.remove()
      );

    // Drag behavior with warm-up/cool-down
    let dragStartX = 0;
    let dragStartY = 0;
    let hasMoved = false;
    const dragThreshold = 5;

    const dragBehavior = d3.drag()
      .on('start', function(event, d) {
        isDraggingRef.current = false;
        hasMoved = false;
        dragStartX = event.x;
        dragStartY = event.y;
        
        // Disable zoom
        svg.on('.zoom', null);
        
        // Warm up simulation
        if (simulationRef.current) {
          simulationRef.current.alphaTarget(0.12).restart();
        }
        
        // Fix node
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
          d.fx = event.x;
          d.fy = event.y;
        }
      })
      .on('end', function(event, d) {
        if (hasMoved) {
          d3.select(this).select('circle').attr('stroke-width', 4);
          
          // Release node if physics enabled
          if (physicsEnabled) {
            d.fx = null;
            d.fy = null;
          } else {
            d.fx = d.x;
            d.fy = d.y;
          }
          
          // Cool down with brief warm-up
          if (simulationRef.current) {
            simulationRef.current.alphaTarget(Math.max(0.02, BASELINE_ALPHA));
            if (postDragWarmRef.current) clearTimeout(postDragWarmRef.current);
            postDragWarmRef.current = setTimeout(() => {
              try {
                if (simulationRef.current) {
                  simulationRef.current.alphaTarget(BASELINE_ALPHA);
                }
              } catch (e) {}
            }, 600);
          }
          
          // Save position
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
        
        // Re-enable zoom
        setTimeout(() => {
          if (zoomBehaviorRef.current) {
            svg.call(zoomBehaviorRef.current);
          }
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
          console.log('🔷 Double-click:', d.id);
          onNodeDoubleClick(d);
        }
      }
    });

    // Tick handler - update positions and cache them
    simulationRef.current.on('tick', () => {
      // Update links using the layer ref
      if (linkElementsRef.current) {
        linkElementsRef.current.selectAll('line.link')
          .attr('x1', d => d.source?.x ?? 0)
          .attr('y1', d => d.source?.y ?? 0)
          .attr('x2', d => d.target?.x ?? 0)
          .attr('y2', d => d.target?.y ?? 0);
      }

      // Update nodes using the layer ref
      if (nodeElementsRef.current) {
        nodeElementsRef.current.selectAll('g.node')
          .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      }

      // Cache positions to prevent reset
      if (nodesRef.current) {
        nodesRef.current.forEach(n => {
          if (Number.isFinite(n.x) && Number.isFinite(n.y)) {
            prevPositionsRef.current.set(n.id, { x: n.x, y: n.y });
          }
        });
      }
    });

    // Expose for debugging
    window.d3Simulation = simulationRef.current;
    window.d3Nodes = nodes;

    // Cleanup
    return () => {
      if (warmupTimeoutRef.current) {
        clearTimeout(warmupTimeoutRef.current);
        warmupTimeoutRef.current = null;
      }
      if (postDragWarmRef.current) {
        clearTimeout(postDragWarmRef.current);
        postDragWarmRef.current = null;
      }
    };
  }, [structuralKey, physicsEnabled, onNodeClick, onNodeDoubleClick, onDataChange, convertToD3Format]);

  // Physics toggle effect
  useEffect(() => {
    if (isInitializedRef.current && simulationRef.current && nodesRef.current) {
      if (physicsEnabled) {
        // Release all nodes
        nodesRef.current.forEach(n => {
          n.fx = null;
          n.fy = null;
        });
        simulationRef.current.alpha(1).alphaTarget(BASELINE_ALPHA).restart();
        console.log('🔷 Physics ON - nodes released');
      } else {
        // Fix all nodes
        nodesRef.current.forEach(n => {
          n.fx = n.x;
          n.fy = n.y;
        });
        simulationRef.current.stop();
        console.log('🔷 Physics OFF - nodes fixed');
      }
    }
  }, [physicsEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100"
      style={{ width: '100%', height: '100%', minHeight: '600px' }}
    />
  );
};

export default D3Graph;