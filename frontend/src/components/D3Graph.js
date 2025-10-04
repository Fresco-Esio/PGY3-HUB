import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import * as d3 from 'd3';

const D3Graph = ({ 
  mindMapData, 
  activeFilter = 'all',
  onNodeClick, 
  onNodeDoubleClick, 
  onDataChange, 
  physicsEnabled,
  connectionMode = false,
  onConnectionCreate
}) => {
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
  
  // Connection mode state
  const [connectionStart, setConnectionStart] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  
  const BASELINE_ALPHA = 0.015;
  
  // Node configuration
  const nodeConfig = {
    topic: { color: '#3b82f6', radius: 60 },
    case: { color: '#6366f1', radius: 65 },
    task: { color: '#f59e0b', radius: 55 },
    literature: { color: '#a855f7', radius: 58 },
  };

  // Structural key
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

  // Convert mindMapData to D3 format
  const convertToD3Format = useCallback((data) => {
    const nodes = [];
    const links = [];
    const nodeById = new Map();

    ['topics', 'cases', 'tasks', 'literature'].forEach((category) => {
      const nodeType = category === 'literature' ? 'literature' : category.slice(0, -1);
      const items = data[category] || [];
      
      items.forEach((item) => {
        const config = nodeConfig[nodeType];
        const nodeId = `${nodeType}-${item.id}`;
        
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
        
        // Determine label based on node type
        let label = 'Untitled';
        if (nodeType === 'case') {
          label = item.label || item.title || item.case_id || 'Unnamed Patient';
        } else {
          label = item.label || item.title || `Untitled ${nodeType}`;
        }
        
        const node = {
          id: nodeId,
          label: label,
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

    const connections = data.connections || [];
    connections.forEach((conn) => {
      if (nodeById.has(conn.source) && nodeById.has(conn.target)) {
        links.push({
          source: conn.source,
          target: conn.target,
          id: conn.id || `edge-${conn.source}-${conn.target}`,
          type: conn.type || 'related'
        });
      }
    });

    return { nodes, links };
  }, []);

  // Handle connection mode clicks
  const handleConnectionClick = useCallback((event, d) => {
    if (!connectionMode) return;
    
    event.stopPropagation();
    
    if (!connectionStart) {
      // Start connection
      setConnectionStart(d);
      console.log('🔷 Connection started from:', d.id);
    } else if (connectionStart.id !== d.id) {
      // Complete connection
      console.log('🔷 Connection completed to:', d.id);
      if (onConnectionCreate) {
        onConnectionCreate(connectionStart.id, d.id);
      }
      setConnectionStart(null);
      setTempConnection(null);
    } else {
      // Clicked same node - cancel
      setConnectionStart(null);
      setTempConnection(null);
    }
  }, [connectionMode, connectionStart, onConnectionCreate]);

  // Update temp connection line during mouse move
  useEffect(() => {
    if (!connectionMode || !connectionStart || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    const handleMouseMove = (event) => {
      if (!gRef.current) return;
      
      // Get the current zoom transform
      const transform = d3.zoomTransform(svgRef.current);
      
      // Get mouse position relative to SVG
      const [x, y] = d3.pointer(event, svgRef.current);
      
      // Apply inverse transform to get graph coordinates
      const graphX = (x - transform.x) / transform.k;
      const graphY = (y - transform.y) / transform.k;
      
      setTempConnection({ x: graphX, y: graphY });
    };

    svg.on('mousemove.connection', handleMouseMove);
    
    return () => {
      svg.on('mousemove.connection', null);
    };
  }, [connectionMode, connectionStart]);

  // Reset connection mode when disabled
  useEffect(() => {
    if (!connectionMode) {
      setConnectionStart(null);
      setTempConnection(null);
    }
  }, [connectionMode]);

  // Main effect
  useEffect(() => {
    if (!svgRef.current || !mindMapData) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    let g = gRef.current;
    if (!g) {
      const existing = svg.select('g.zoom-layer');
      g = existing.empty() ? svg.append('g').attr('class', 'zoom-layer') : existing;
      gRef.current = g;
    }

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

    const { nodes, links } = convertToD3Format(mindMapData);
    nodesRef.current = nodes;
    linksRef.current = links;

    console.log('🔷 D3 Update:', { nodeCount: nodes.length, linkCount: links.length });

    if (!simulationRef.current) {
      console.log('🔷 Creating new simulation');
      
      simulationRef.current = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(-350))
        .force('collision', d3.forceCollide().radius(d => (d.radius || 28) + 18).strength(0.99))
        .alpha(0.12)
        .alphaDecay(0.08)
        .velocityDecay(0.6);

      if (links.length > 0) {
        simulationRef.current.force('link', d3.forceLink(links).id(d => d.id).distance(150).strength(1.5).iterations(2));
      }

      const cx = width / 2;
      const cy = height / 2;
      simulationRef.current.force('viewX', d3.forceX(cx).strength(0.008));
      simulationRef.current.force('viewY', d3.forceY(cy).strength(0.008));

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
      
      simulationRef.current.nodes(nodes);

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

    if (!linkElementsRef.current) {
      linkElementsRef.current = g.append('g').attr('class', 'links-layer');
    }
    if (!nodeElementsRef.current) {
      nodeElementsRef.current = g.append('g').attr('class', 'nodes-layer');
    }

    // Data join for links with hover effects
    const link = linkElementsRef.current
      .selectAll('line.link')
      .data(links, d => d.id)
      .join(
        enter => enter.append('line')
          .attr('class', 'link')
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 3)
          .attr('stroke-opacity', 0.6)
          .style('cursor', 'pointer')
          .on('mouseenter', function() {
            d3.select(this)
              .attr('stroke', '#ef4444')
              .attr('stroke-width', 5)
              .attr('stroke-opacity', 1);
          })
          .on('mouseleave', function() {
            d3.select(this)
              .attr('stroke', '#94a3b8')
              .attr('stroke-width', 3)
              .attr('stroke-opacity', 0.6);
          })
          .on('click', function(event, d) {
            event.stopPropagation();
            if (confirm('Delete this connection?')) {
              if (onDataChange) {
                onDataChange({
                  type: 'deleteConnection',
                  connectionId: d.id
                });
              }
            }
          }),
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
            .attr('class', 'node-circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 4)
            .style('opacity', 1);

          // Add connection mode indicator ring
          g.append('circle')
            .attr('class', 'connection-indicator')
            .attr('r', d => d.radius + 8)
            .attr('fill', 'none')
            .attr('stroke', '#10b981')
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '5,5')
            .style('opacity', 0)
            .style('pointer-events', 'none');

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

    // Update connection mode indicators
    node.select('.connection-indicator')
      .style('opacity', d => {
        if (!connectionMode) return 0;
        if (connectionStart && connectionStart.id === d.id) return 1;
        if (connectionStart) return 0.5;
        return 0;
      })
      .attr('stroke', d => {
        if (connectionStart && connectionStart.id === d.id) return '#10b981';
        return '#3b82f6';
      });

    // Update node appearance for connection mode and filter
    node.select('.node-circle')
      .attr('stroke-width', d => {
        if (connectionMode && connectionStart && connectionStart.id === d.id) return 6;
        return 4;
      })
      .attr('stroke', d => {
        if (connectionMode && connectionStart && connectionStart.id === d.id) return '#10b981';
        return '#fff';
      })
      .style('opacity', d => {
        if (activeFilter === 'all') return 1;
        return activeFilter === d.type ? 1 : 0.2;
      });
    
    // Update text opacity based on filter
    node.select('text')
      .style('opacity', d => {
        if (activeFilter === 'all') return 1;
        return activeFilter === d.type ? 1 : 0.3;
      });

    // Drag behavior
    let dragStartX = 0;
    let dragStartY = 0;
    let hasMoved = false;
    const dragThreshold = 5;

    const dragBehavior = d3.drag()
      .on('start', function(event, d) {
        if (connectionMode) return; // Disable drag in connection mode
        
        isDraggingRef.current = false;
        hasMoved = false;
        dragStartX = event.x;
        dragStartY = event.y;
        
        svg.on('.zoom', null);
        
        if (simulationRef.current && physicsEnabled) {
          simulationRef.current.alphaTarget(0.12).restart();
        }
        
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        if (connectionMode) return;
        
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
        if (connectionMode) return;
        
        if (hasMoved) {
          d3.select(this).select('circle').attr('stroke-width', 4);
          
          if (physicsEnabled) {
            d.fx = null;
            d.fy = null;
          } else {
            d.fx = d.x;
            d.fy = d.y;
          }
          
          if (simulationRef.current && physicsEnabled) {
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
        
        setTimeout(() => {
          if (zoomBehaviorRef.current) {
            svg.call(zoomBehaviorRef.current);
          }
          isDraggingRef.current = false;
        }, 100);
        
        hasMoved = false;
      });

    node.call(dragBehavior);

    // Click handlers
    node.on('click', function(event, d) {
      if (connectionMode) {
        handleConnectionClick(event, d);
      } else if (!hasMoved && !isDraggingRef.current) {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d);
        }
      }
    });

    node.on('dblclick', function(event, d) {
      if (connectionMode) return; // Ignore double-click in connection mode
      
      if (!hasMoved && !isDraggingRef.current) {
        event.stopPropagation();
        event.preventDefault();
        if (onNodeDoubleClick) {
          console.log('🔷 Double-click:', d.id);
          onNodeDoubleClick(d);
        }
      }
    });

    // Tick handler
    simulationRef.current.on('tick', () => {
      if (linkElementsRef.current) {
        linkElementsRef.current.selectAll('line.link')
          .attr('x1', d => d.source?.x ?? 0)
          .attr('y1', d => d.source?.y ?? 0)
          .attr('x2', d => d.target?.x ?? 0)
          .attr('y2', d => d.target?.y ?? 0);
      }

      if (nodeElementsRef.current) {
        nodeElementsRef.current.selectAll('g.node')
          .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      }

      if (nodesRef.current) {
        nodesRef.current.forEach(n => {
          if (Number.isFinite(n.x) && Number.isFinite(n.y)) {
            prevPositionsRef.current.set(n.id, { x: n.x, y: n.y });
          }
        });
      }
    });

    window.d3Simulation = simulationRef.current;
    window.d3Nodes = nodes;

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
  }, [structuralKey, physicsEnabled, onNodeClick, onNodeDoubleClick, onDataChange, convertToD3Format, connectionMode, handleConnectionClick]);

  // Physics toggle effect
  useEffect(() => {
    if (isInitializedRef.current && simulationRef.current && nodesRef.current) {
      if (physicsEnabled) {
        nodesRef.current.forEach(n => {
          n.fx = null;
          n.fy = null;
        });
        simulationRef.current.alpha(1).alphaTarget(BASELINE_ALPHA).restart();
        console.log('🔷 Physics ON - nodes released');
      } else {
        nodesRef.current.forEach(n => {
          n.fx = n.x;
          n.fy = n.y;
        });
        simulationRef.current.stop();
        console.log('🔷 Physics OFF - nodes fixed');
      }
    }
  }, [physicsEnabled]);

  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  // Render temp connection line
  const renderTempConnection = () => {
    if (!connectionStart || !tempConnection || !gRef.current) return null;
    
    return (
      <line
        x1={connectionStart.x}
        y1={connectionStart.y}
        x2={tempConnection.x}
        y2={tempConnection.y}
        stroke="#10b981"
        strokeWidth="3"
        strokeDasharray="5,5"
        strokeOpacity="0.8"
        pointerEvents="none"
        style={{ 
          position: 'absolute',
          zIndex: 1000
        }}
      />
    );
  };

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100"
      style={{ width: '100%', height: '100%', minHeight: '600px' }}
    >
      {connectionStart && tempConnection && (
        <g className="temp-connection-layer" style={{ pointerEvents: 'none' }}>
          <line
            x1={connectionStart.x}
            y1={connectionStart.y}
            x2={tempConnection.x}
            y2={tempConnection.y}
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="5,5"
            strokeOpacity="0.8"
          />
        </g>
      )}
    </svg>
  );
};

export default D3Graph;