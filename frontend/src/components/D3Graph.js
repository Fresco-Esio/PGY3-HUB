import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import * as d3 from 'd3';
import EdgeContextMenu from './EdgeContextMenu';
import EdgeLabelModal from './EdgeLabelModalSimple';
import PhysicsControls from './PhysicsControls';

const D3Graph = ({ 
  mindMapData, 
  activeFilter = 'all',
  searchQuery = '',
  onNodeClick, 
  onNodeDoubleClick, 
  onDataChange, 
  physicsEnabled,
  connectionMode = false,
  onConnectionCreate,
  focusModeEnabled = false,
  focusedNode = null,
  onBackgroundClick
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
  const savedTransformRef = useRef(null); // Store camera transform before Focus Mode
  
  // Connection mode state
  const [connectionStart, setConnectionStart] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  
  // Edge context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [edgeLabelModalOpen, setEdgeLabelModalOpen] = useState(false);
  
  // Physics controls state
  const [showPhysicsControls, setShowPhysicsControls] = useState(false);
  
  // Load saved physics settings from localStorage or use defaults
  const loadPhysicsSettings = () => {
    try {
      const saved = localStorage.getItem('pgy3hub_physics_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('💾 Loaded saved physics settings on init:', parsed);
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load physics settings:', err);
    }
    
    // Return defaults if no saved settings
    return {
      collisionRadius: 40,
      collisionStrength: 0.7,
      linkDistance: 120,
      linkStrength: 0.5,
      alphaDecay: 0.0228,
      velocityDecay: 0.4
    };
  };
  
  const physicsParamsRef = useRef(loadPhysicsSettings());
  const focusSimulationRef = useRef(null); // Separate simulation for Focus Mode
  
  const BASELINE_ALPHA = 0; // Set to 0 to let simulation sleep (no drift)
  
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
          type: conn.type || 'related',
          label: conn.label || ''
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

    // Add background rect for click detection (exits focus mode)
    let bgRect = svg.select('rect.background');
    if (bgRect.empty()) {
      bgRect = svg.insert('rect', ':first-child')
        .attr('class', 'background')
        .attr('fill', 'transparent')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('pointer-events', 'all');
    }
    
    // Background click handler for exiting focus mode
    bgRect.on('click', (event) => {
      // Only exit focus mode if we're in it and clicked directly on background
      if (focusedNode && onBackgroundClick) {
        console.log('🎯 Background clicked - exiting focus mode');
        onBackgroundClick();
      }
    });

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
      
      const params = physicsParamsRef.current;
      
      simulationRef.current = d3.forceSimulation(nodes)
        .force('charge', null) // No global charge force
        .force('collision', d3.forceCollide()
          .radius(params.collisionRadius)
          .strength(params.collisionStrength))
        .force('link', links.length > 0 ? 
          d3.forceLink(links).id(d => d.id).distance(params.linkDistance).strength(params.linkStrength) : null)
        .force('x', null)
        .force('y', null)
        .alpha(1)
        .alphaDecay(params.alphaDecay)
        .velocityDecay(params.velocityDecay)
        .alphaTarget(0);

      console.log('🔷 Simulation created with params:', params);

      isInitializedRef.current = true;
    } else {
      console.log('🔷 Updating existing simulation (nodes/links only - preserving physics params)');
      
      // Skip update if custom realignment is in progress
      if (window.isCustomRealigning) {
        console.log('🔷 Skipping simulation update - custom realignment in progress');
        return;
      }
      
      simulationRef.current.nodes(nodes);

      // Update links but DON'T reset collision force
      // This preserves user-adjusted physics parameters
      if (links.length > 0) {
        const existingLinkForce = simulationRef.current.force('link');
        if (existingLinkForce) {
          existingLinkForce.links(links);
          // Don't reset distance/strength - preserve user adjustments
        } else {
          // Only create new link force if it doesn't exist
          const params = physicsParamsRef.current;
          simulationRef.current.force('link', d3.forceLink(links).id(d => d.id).distance(params.linkDistance).strength(params.linkStrength));
        }
      } else {
        simulationRef.current.force('link', null);
      }

      // Gentle restart for updates
      simulationRef.current.alpha(0.3).restart();
      simulationRef.current.alphaTarget(0);
      console.log('🔷 Simulation updated - physics params preserved');
    }

    // Ensure layer groups exist
    if (!linkElementsRef.current) {
      linkElementsRef.current = g.append('g').attr('class', 'links-layer');
    }
    if (!nodeElementsRef.current) {
      nodeElementsRef.current = g.append('g').attr('class', 'nodes-layer');
    }
    
    // Temp connection layer (for connection mode guideline)
    let tempConnectionLayer = g.select('.temp-connection-layer');
    if (tempConnectionLayer.empty()) {
      tempConnectionLayer = g.append('g').attr('class', 'temp-connection-layer');
    }
    
    // Update temp connection line
    if (connectionStart && tempConnection) {
      const tempLine = tempConnectionLayer.selectAll('line.temp-connection')
        .data([{ start: connectionStart, end: tempConnection }]);
      
      tempLine.enter()
        .append('line')
        .attr('class', 'temp-connection')
        .merge(tempLine)
        .attr('x1', d => d.start.x)
        .attr('y1', d => d.start.y)
        .attr('x2', d => d.end.x)
        .attr('y2', d => d.end.y)
        .attr('stroke', '#10b981')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '5,5')
        .attr('stroke-opacity', 0.8)
        .style('pointer-events', 'none');
      
      tempLine.exit().remove();
    } else {
      tempConnectionLayer.selectAll('line.temp-connection').remove();
    }

    // Data join for links with enhanced video-game-like effects
    const link = linkElementsRef.current
      .selectAll('line.link')
      .data(links, d => d.id)
      .join(
        enter => enter.append('line')
          .attr('class', 'link')
          .attr('stroke', '#64748b')
          .attr('stroke-width', 4)
          .attr('stroke-opacity', 0.7)
          .attr('stroke-linecap', 'round')
          .style('cursor', 'pointer')
          .style('filter', 'drop-shadow(0 0 2px rgba(100, 116, 139, 0.3))')
          .style('transition', 'all 0.2s ease-out')
          .on('mouseenter', function() {
            d3.select(this)
              .attr('stroke', '#ef4444')
              .attr('stroke-width', 8)
              .attr('stroke-opacity', 1)
              .style('filter', 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))');
          })
          .on('mouseleave', function() {
            d3.select(this)
              .attr('stroke', '#64748b')
              .attr('stroke-width', 4)
              .attr('stroke-opacity', 0.7)
              .style('filter', 'drop-shadow(0 0 2px rgba(100, 116, 139, 0.3))');
          })
          .on('contextmenu', function(event, d) {
            event.preventDefault();
            event.stopPropagation();
            
            // Close any existing modal first
            setEdgeLabelModalOpen(false);
            
            // Get node labels for context menu display
            const sourceNode = nodesRef.current.find(n => n.id === d.source.id || n.id === d.source);
            const targetNode = nodesRef.current.find(n => n.id === d.target.id || n.id === d.target);
            
            setSelectedEdge({
              ...d,
              sourceLabel: sourceNode?.label || d.source,
              targetLabel: targetNode?.label || d.target
            });
            setContextMenu({ x: event.pageX, y: event.pageY });
          })
          .on('click', function(event, d) {
            event.stopPropagation();
            // Instant deletion with visual feedback - no confirmation needed
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', 12)
              .attr('stroke-opacity', 0)
              .style('filter', 'drop-shadow(0 0 20px rgba(239, 68, 68, 1))')
              .on('end', function() {
                if (onDataChange) {
                  onDataChange({
                    type: 'deleteConnection',
                    connectionId: d.id
                  });
                }
              });
          }),
        update => update,
        exit => exit.remove()
      );

    // Data join for edge labels
    const linkLabel = linkElementsRef.current
      .selectAll('text.link-label')
      .data(links.filter(d => d.label && d.label.trim()), d => d.id)
      .join(
        enter => enter.append('text')
          .attr('class', 'link-label')
          .attr('text-anchor', 'middle')
          .attr('dy', -8)
          .attr('fill', '#e2e8f0')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .style('pointer-events', 'none')
          .style('text-shadow', '0 0 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.6)')
          .style('user-select', 'none')
          .text(d => d.label),
        update => update.text(d => d.label),
        exit => exit.remove()
      );

    // Data join for nodes with enhanced video-game aesthetics
    const node = nodeElementsRef.current
      .selectAll('g.node')
      .data(nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g')
            .attr('class', 'node')
            .style('cursor', 'grab');

          // Outer glow ring for depth
          g.append('circle')
            .attr('class', 'node-glow')
            .attr('r', d => d.radius + 6)
            .attr('fill', d => d.color)
            .attr('opacity', 0.2)
            .style('filter', 'blur(8px)')
            .style('pointer-events', 'none');

          // Main node circle with enhanced styling
          g.append('circle')
            .attr('class', 'node-circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 5)
            .style('opacity', 0.95)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))')
            .style('transition', 'all 0.2s ease-out');

          // Inner highlight for glossy effect
          g.append('circle')
            .attr('class', 'node-highlight')
            .attr('r', d => d.radius * 0.35)
            .attr('cx', d => -d.radius * 0.15)
            .attr('cy', d => -d.radius * 0.15)
            .attr('fill', 'rgba(255, 255, 255, 0.25)')
            .style('pointer-events', 'none');

          // Connection mode indicator ring
          g.append('circle')
            .attr('class', 'connection-indicator')
            .attr('r', d => d.radius + 12)
            .attr('fill', 'none')
            .attr('stroke', '#10b981')
            .attr('stroke-width', 4)
            .attr('stroke-dasharray', '8,4')
            .style('opacity', 0)
            .style('pointer-events', 'none')
            .style('filter', 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))');

          // Node label with better readability
          g.append('text')
            .text(d => {
              const maxLen = 18;
              return d.label.length > maxLen ? d.label.substring(0, maxLen) + '...' : d.label;
            })
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('fill', '#fff')
            .attr('font-size', '14px')
            .attr('font-weight', '700')
            .attr('pointer-events', 'none')
            .style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)')
            .style('letter-spacing', '0.3px');

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

    // Helper function to check if node matches search
    const nodeMatchesSearch = (node, query) => {
      if (!query || !query.trim()) return true;
      const searchTerm = query.toLowerCase().trim();
      
      // Check label
      if (node.label && node.label.toLowerCase().includes(searchTerm)) return true;
      
      // Check node type
      if (node.type && node.type.toLowerCase().includes(searchTerm)) return true;
      
      // Check original data fields
      if (node.originalData) {
        const data = node.originalData;
        if (data.primary_diagnosis && data.primary_diagnosis.toLowerCase().includes(searchTerm)) return true;
        if (data.primaryDiagnosis && data.primaryDiagnosis.toLowerCase().includes(searchTerm)) return true;
        if (data.title && data.title.toLowerCase().includes(searchTerm)) return true;
        if (data.authors && data.authors.toLowerCase().includes(searchTerm)) return true;
        if (data.category && data.category.toLowerCase().includes(searchTerm)) return true;
      }
      
      return false;
    };

    // Update node appearance for connection mode, filter, and search
    node.select('.node-circle')
      .attr('stroke-width', d => {
        if (connectionMode && connectionStart && connectionStart.id === d.id) return 6;
        if (searchQuery && nodeMatchesSearch(d, searchQuery)) return 6;
        return 4;
      })
      .attr('stroke', d => {
        if (connectionMode && connectionStart && connectionStart.id === d.id) return '#10b981';
        if (searchQuery && nodeMatchesSearch(d, searchQuery)) return '#fbbf24';
        return '#fff';
      })
      .style('opacity', d => {
        // Search takes precedence over filter
        if (searchQuery) {
          return nodeMatchesSearch(d, searchQuery) ? 1 : 0.15;
        }
        if (activeFilter === 'all') return 1;
        return activeFilter === d.type ? 1 : 0.2;
      });
    
    // Update glow for search matches
    node.select('.node-glow')
      .attr('opacity', d => {
        if (searchQuery && nodeMatchesSearch(d, searchQuery)) return 0.5;
        return 0.2;
      })
      .style('filter', d => {
        if (searchQuery && nodeMatchesSearch(d, searchQuery)) {
          return 'blur(12px) drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))';
        }
        return 'blur(8px)';
      });
    
    // Update text opacity based on filter and search
    node.select('text')
      .style('opacity', d => {
        if (searchQuery) {
          return nodeMatchesSearch(d, searchQuery) ? 1 : 0.2;
        }
        if (activeFilter === 'all') return 1;
        return activeFilter === d.type ? 1 : 0.3;
      })
      .style('text-shadow', d => {
        if (searchQuery && nodeMatchesSearch(d, searchQuery)) {
          return '0 0 10px rgba(251, 191, 36, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)';
        }
        return '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)';
      });

    // Enhanced drag behavior with video-game tactile feedback
    let dragStartX = 0;
    let dragStartY = 0;
    let hasMoved = false;
    const dragThreshold = 2; // Reduced for more responsive dragging

    const dragBehavior = d3.drag()
      .on('start', function(event, d) {
        if (connectionMode) return; // Disable drag in connection mode
        
        isDraggingRef.current = false;
        hasMoved = false;
        dragStartX = event.x;
        dragStartY = event.y;
        
        // Check if this drag started during a realignment operation
        if (window.realignmentStartTime && !window.dragStartedDuringRealign) {
          const timeSinceRealign = Date.now() - window.realignmentStartTime;
          // If realignment started within last 3 seconds, mark drag as conflicting
          if (timeSinceRealign < 3000) {
            window.dragStartedDuringRealign = true;
            console.log('⚠️ User started dragging during realignment (', 
                       timeSinceRealign, 'ms after start) - will prevent snap-back');
          }
        }
        
        svg.on('.zoom', null);
        
        // Visual feedback on grab
        d3.select(this).style('cursor', 'grabbing');
        d3.select(this).select('.node-circle')
          .transition()
          .duration(100)
          .attr('stroke-width', 6)
          .style('filter', 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))');
        
        d3.select(this).select('.node-glow')
          .transition()
          .duration(100)
          .attr('opacity', 0.4);
        
        if (simulationRef.current && physicsEnabled) {
          // CRITICAL: Only warm simulation if no other drag is active
          // This prevents cascading simulation warming that causes all nodes to move
          if (!event.active) {
            simulationRef.current.alphaTarget(0.3).restart();
          }
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
        }

        if (hasMoved) {
          d.fx = event.x;
          d.fy = event.y;
        }
      })
      .on('end', function(event, d) {
        if (connectionMode) return;
        
        // Visual feedback on release
        d3.select(this).style('cursor', 'grab');
        
        if (hasMoved) {
          d3.select(this).select('.node-circle')
            .transition()
            .duration(200)
            .attr('stroke-width', 5)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))');
          
          d3.select(this).select('.node-glow')
            .transition()
            .duration(200)
            .attr('opacity', 0.2);
          
          if (physicsEnabled) {
            // Observable pattern: release the node to allow natural movement
            d.fx = null;
            d.fy = null;
          } else {
            // Physics off: keep node fixed
            d.fx = d.x;
            d.fy = d.y;
          }
          
          if (simulationRef.current && physicsEnabled) {
            // CRITICAL: Only cool simulation if no other drag is active
            // This prevents premature cooling when multiple nodes are being dragged
            if (!event.active) {
              simulationRef.current.alphaTarget(0);
            }
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

    // Enhanced hover effects for video-game tactile feel
    node.on('mouseenter', function(event, d) {
      if (connectionMode) return;
      
      d3.select(this).select('.node-circle')
        .transition()
        .duration(150)
        .attr('r', d.radius * 1.08)
        .style('filter', 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))');
      
      d3.select(this).select('.node-glow')
        .transition()
        .duration(150)
        .attr('r', (d.radius + 6) * 1.08)
        .attr('opacity', 0.35);
      
      d3.select(this).select('.node-highlight')
        .transition()
        .duration(150)
        .attr('r', d.radius * 0.4)
        .attr('fill', 'rgba(255, 255, 255, 0.35)');
    })
    .on('mouseleave', function(event, d) {
      if (connectionMode) return;
      
      d3.select(this).select('.node-circle')
        .transition()
        .duration(200)
        .attr('r', d.radius)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))');
      
      d3.select(this).select('.node-glow')
        .transition()
        .duration(200)
        .attr('r', d.radius + 6)
        .attr('opacity', 0.2);
      
      d3.select(this).select('.node-highlight')
        .transition()
        .duration(200)
        .attr('r', d.radius * 0.35)
        .attr('fill', 'rgba(255, 255, 255, 0.25)');
    });

    // Click handlers with press animation
    node.on('click', function(event, d) {
      if (connectionMode) {
        handleConnectionClick(event, d);
      } else if (!hasMoved && !isDraggingRef.current) {
        event.stopPropagation();
        
        // Click feedback animation
        d3.select(this).select('.node-circle')
          .transition()
          .duration(100)
          .attr('r', d.radius * 0.95)
          .transition()
          .duration(100)
          .attr('r', d.radius);
        
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
        
        // Update edge label positions
        linkElementsRef.current.selectAll('text.link-label')
          .attr('x', d => ((d.source?.x ?? 0) + (d.target?.x ?? 0)) / 2)
          .attr('y', d => ((d.source?.y ?? 0) + (d.target?.y ?? 0)) / 2);
      }

      if (nodeElementsRef.current) {
        nodeElementsRef.current.selectAll('g.node')
          .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      }

      if (nodesRef.current) {
        nodesRef.current.forEach(n => {
          if (Number.isFinite(n.x) && Number.isFinite(n.y)) {
            // Don't overwrite prevPositionsRef during custom realignment
            // This prevents the tick handler from overriding our realignment positions
            if (!window.isCustomRealigning) {
              prevPositionsRef.current.set(n.id, { x: n.x, y: n.y });
            }
          }
        });
      }
    });

    window.d3Simulation = simulationRef.current;
    window.d3Nodes = nodes;
    window.d3Links = links;
  window.d3SimulationRef = simulationRef; // Expose ref itself so it can be updated
    window.d3PrevPositions = prevPositionsRef; // Expose prevPositions so App.js can update it
    // Expose zoom behavior and svg element for external camera control
    try {
      window.d3ZoomBehavior = zoomBehaviorRef.current;
      window.d3SvgElement = svgRef.current;
    } catch (e) {
      // ignore if refs not initialized
    }

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
  }, [structuralKey, physicsEnabled, onNodeClick, onNodeDoubleClick, onDataChange, convertToD3Format, connectionMode, handleConnectionClick, connectionStart, tempConnection]);

  // Physics toggle effect
  useEffect(() => {
    if (isInitializedRef.current && simulationRef.current && nodesRef.current) {
      // Don't interfere if a custom realignment is in progress
      if (window.isCustomRealigning) {
        console.log('🔷 Physics toggle blocked - custom realignment in progress');
        return;
      }
      
      if (physicsEnabled) {
        nodesRef.current.forEach(n => {
          n.fx = null;
          n.fy = null;
        });
        simulationRef.current.alpha(1).alphaTarget(0).restart(); // Observable pattern
        console.log('🔷 Physics ON - nodes released with natural forces');
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

  // Edge context menu handlers
  const handleEditLabel = useCallback((edge) => {
    console.log('🏷️ [handleEditLabel] Called with edge:', edge);
    console.log('🏷️ [handleEditLabel] Current state:', { 
      hasContextMenu: !!contextMenu,
      hasSelectedEdge: !!selectedEdge,
      edgeLabelModalOpen 
    });
    
    // Create a clean edge object without D3 circular references
    const cleanEdge = {
      id: edge.id,
      source: typeof edge.source === 'object' ? edge.source.id : edge.source,
      target: typeof edge.target === 'object' ? edge.target.id : edge.target,
      label: edge.label || '',
      type: edge.type,
      sourceLabel: edge.sourceLabel,
      targetLabel: edge.targetLabel
    };
    
    console.log('🏷️ [handleEditLabel] Clean edge created:', cleanEdge);
    
    // Close context menu and update edge in one go
    setContextMenu(null);
    
    // Use setTimeout to ensure state updates happen in correct order
    setTimeout(() => {
      setSelectedEdge(cleanEdge);
      setEdgeLabelModalOpen(true);
      console.log('🏷️ [handleEditLabel] State updates dispatched');
    }, 0);
  }, [contextMenu, selectedEdge, edgeLabelModalOpen]);

  const handleDeleteEdge = useCallback((edge) => {
    if (onDataChange) {
      onDataChange({
        type: 'deleteConnection',
        connectionId: edge.id
      });
    }
    setContextMenu(null);
    setSelectedEdge(null);
  }, [onDataChange]);

  const handleSaveLabel = useCallback(async (edge, label) => {
    // Update the connection label in mindMapData
    const connections = mindMapData?.connections || [];
    const updatedConnections = connections.map(conn => {
      if (conn.id === edge.id) {
        return { ...conn, label };
      }
      return conn;
    });

    if (onDataChange) {
      onDataChange({
        type: 'connections',
        connections: updatedConnections
      });
    }
  }, [mindMapData, onDataChange]);

  // Apply localized physics to focused cluster
  const applyLocalizedPhysics = useCallback((targetNode, connectedIds) => {
    if (!simulationRef.current || !nodesRef.current || !linksRef.current) return;
    
    console.log('🎯 Applying localized physics to:', targetNode.id);
    console.log(`📊 Found ${connectedIds.size} nodes in connected component`);
    
    // FREEZE all unconnected nodes (nodes NOT in the component)
    nodesRef.current.forEach(node => {
      if (!connectedIds.has(node.id)) {
        node.fx = node.x;
        node.fy = node.y;
        node.vx = 0;
        node.vy = 0;
      }
    });
    
    // PIN the focused node at its current position (anchor point)
    const focusedNodeData = nodesRef.current.find(n => n.id === targetNode.id);
    if (focusedNodeData) {
      focusedNodeData.fx = focusedNodeData.x;
      focusedNodeData.fy = focusedNodeData.y;
      focusedNodeData.vx = 0;
      focusedNodeData.vy = 0;
    }
    
    // RELEASE ALL other nodes in the component (allow them to move freely)
    nodesRef.current.forEach(node => {
      if (connectedIds.has(node.id) && node.id !== targetNode.id) {
        node.fx = null;
        node.fy = null;
      }
    });
    
    // Get ALL links within the connected component
    const focusLinks = linksRef.current.filter(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return connectedIds.has(sourceId) && connectedIds.has(targetId);
    });
    
    console.log(`🔗 Using ${focusLinks.length} links for force layout`);
    
    // Stop the global simulation completely
    simulationRef.current.stop();
    console.log('🛑 Global simulation stopped');
    
    // Create a SEPARATE localized simulation for the focused cluster
    focusSimulationRef.current = d3.forceSimulation(nodesRef.current)
      .force('link', d3.forceLink(focusLinks)
        .id(d => d.id)
        .distance(270)        // SMOOTHER: Less dramatic spread
        .strength(0.25))      // SMOOTHER: Moderate pull for controlled spread
      .force('charge', d3.forceManyBody()
        .strength(-500)       // SMOOTHER: Softer repulsion
        .distanceMax(400))    // SMOOTHER: Only affects nearby nodes
      .force('collision', d3.forceCollide()
        .radius(d => (d.radius || 30) + 24)  // SMOOTHER: Moderate spacing
        .strength(0.92))      // SMOOTHER: Gentle collision avoidance
      .alpha(0.7)             // SMOOTHER: Lower initial energy
      .alphaDecay(0.02)       // SMOOTHER: Quicker settling
      .velocityDecay(0.75)    // SMOOTHER: High friction for gentle movement
      .on('tick', () => {
        // Update visual positions during animation
        if (nodeElementsRef.current) {
          nodeElementsRef.current.selectAll('g.node')
            .attr('transform', d => `translate(${d.x},${d.y})`);
        }
        
        if (linkElementsRef.current) {
          linkElementsRef.current.selectAll('line.link')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        }
      });
    
    console.log('✨ Localized physics simulation started - nodes should spread now');
  }, []);

  // Stop localized physics and restore global simulation
  const stopLocalizedPhysics = useCallback(() => {
    if (!simulationRef.current || !nodesRef.current) return;
    
    console.log('🛑 Stopping localized physics');
    
    // Stop and remove the focus simulation
    if (focusSimulationRef.current) {
      focusSimulationRef.current.stop();
      focusSimulationRef.current = null;
      console.log('✅ Focus simulation stopped');
    }
    
    // UNFREEZE all nodes (remove position locks)
    nodesRef.current.forEach(node => {
      node.fx = null;
      node.fy = null;
    });
    
    console.log('🔓 All nodes unfrozen');
    
    // Restart the global simulation gently
    simulationRef.current.alpha(0.3).restart();
    console.log('🔄 Global simulation resumed');
  }, []);

  // Focus Mode visual hierarchy effect
  useEffect(() => {
    if (!nodeElementsRef.current || !simulationRef.current) return;
    
    const nodes = nodeElementsRef.current.selectAll('g.node');
    const links = linkElementsRef.current?.selectAll('line.link');
    
    if (focusedNode && focusedNode.connectedNodeIds) {
      console.log('🎯 Applying Focus Mode visual hierarchy and localized physics');
      const connectedIds = new Set(focusedNode.connectedNodeIds);
      
      // Apply localized physics FIRST
      applyLocalizedPhysics(focusedNode, connectedIds);

      // --- Camera Centering and Zoom ---
      const clusterNodes = nodesRef.current.filter(n => connectedIds.has(n.id));
      if (clusterNodes.length > 0 && svgRef.current && zoomBehaviorRef.current) {
        // Save current transform before zooming in (only once per focus session)
        if (!savedTransformRef.current) {
          savedTransformRef.current = d3.zoomTransform(svgRef.current);
          console.log('📸 Saved camera transform:', savedTransformRef.current);
        }
        
        const minX = Math.min(...clusterNodes.map(n => n.x));
        const maxX = Math.max(...clusterNodes.map(n => n.x));
        const minY = Math.min(...clusterNodes.map(n => n.y));
        const maxY = Math.max(...clusterNodes.map(n => n.y));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const clusterWidth = maxX - minX + 80; // Add padding
        const clusterHeight = maxY - minY + 80;
        const svgWidth = svgRef.current.clientWidth || 800;
        const svgHeight = svgRef.current.clientHeight || 600;
        const scaleX = svgWidth / clusterWidth;
        const scaleY = svgHeight / clusterHeight;
        const targetScale = Math.min(scaleX, scaleY, 1.5); // Limit max zoom
        const tx = svgWidth / 2 - centerX * targetScale;
        const ty = svgHeight / 2 - centerY * targetScale;
        d3.select(svgRef.current)
          .transition()
          .duration(900)
          .call(zoomBehaviorRef.current.transform,
            d3.zoomIdentity
              .translate(tx, ty)
              .scale(targetScale)
          );
      }
      // --- End Camera Centering ---
      // Apply visual hierarchy to nodes
      nodes.each(function(d) {
        const nodeGroup = d3.select(this);
        const isConnected = connectedIds.has(d.id);
        const isFocused = d.id === focusedNode.id;
        
        // Transition for smooth animation
        const transition = nodeGroup.transition().duration(800);
        
        if (isFocused) {
          // Focused node: Scale up, bright glow
          transition.style('opacity', 1);
          nodeGroup.select('.node-circle')
            .transition().duration(800)
            .attr('r', d => d.radius * 1.2)
            .style('filter', 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))');
          nodeGroup.select('.node-glow')
            .transition().duration(800)
            .attr('r', d => (d.radius * 1.2) + 10)
            .attr('opacity', 0.5)
            .attr('fill', '#3b82f6');
        } else if (isConnected) {
          // Connected nodes: Normal size, slight glow
          transition.style('opacity', 1);
          nodeGroup.select('.node-circle')
            .transition().duration(800)
            .attr('r', d => d.radius)
            .style('filter', 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))');
          nodeGroup.select('.node-glow')
            .transition().duration(800)
            .attr('opacity', 0.3);
        } else {
          // Unconnected nodes: Dimmed but still clickable to allow focus switching
          transition.style('opacity', 0.25); // Slightly more visible than before
          
          // Add hover effect to the GROUP to show they're interactive
          nodeGroup
            .on('mouseenter', function() {
              d3.select(this)
                .transition().duration(200)
                .style('opacity', 0.6); // Brighten the entire group
            })
            .on('mouseleave', function() {
              d3.select(this)
                .transition().duration(200)
                .style('opacity', 0.25); // Back to dimmed
            });
          
          nodeGroup.select('.node-circle')
            .transition().duration(800)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))');
          nodeGroup.select('.node-glow')
            .transition().duration(800)
            .attr('opacity', 0.08);
        }
      });
      
      // Apply visual hierarchy to edges
      if (links) {
        // First, reset ALL edges to a known state
        links.each(function(d) {
          const link = d3.select(this);
          // Get the original color from the connection data
          const originalColor = '#64748b'; // Default slate-500
          
          // Determine if this edge is connected to the focused node
          const isConnectedEdge = (d.source.id === focusedNode.id || d.target.id === focusedNode.id) &&
                                  (connectedIds.has(d.source.id) || connectedIds.has(d.target.id));
          
          if (isConnectedEdge) {
            // Connected edges: Thicker, brighter, full opacity
            link.transition().duration(800)
              .style('stroke-width', 3)
              .style('opacity', 1)
              .style('stroke', () => {
                // Brighten the original color
                const color = d3.color(originalColor);
                return color ? color.brighter(0.8) : originalColor;
              });
          } else {
            // Unconnected edges: Dim, reset to default style
            link.transition().duration(800)
              .style('stroke-width', 1.5)
              .style('opacity', 0.1)
              .style('stroke', originalColor);
          }
        });
      }
      
    } else {
      // Not in focus mode: Restore all to normal
      console.log('🎯 Restoring normal visual hierarchy and physics');
      
      // Stop localized physics FIRST
      stopLocalizedPhysics();
      // Smoothly restore camera to saved view
      if (svgRef.current && zoomBehaviorRef.current && savedTransformRef.current) {
        console.log('🔄 Restoring camera to saved transform:', savedTransformRef.current);
        d3.select(svgRef.current)
          .transition()
          .duration(900)
          .call(zoomBehaviorRef.current.transform, savedTransformRef.current);
        // Clear saved transform after restoring
        savedTransformRef.current = null;
      }
      
      nodes.transition().duration(800)
        .style('opacity', 1)
        .style('pointer-events', 'all');
      
      nodes.select('.node-circle')
        .transition().duration(800)
        .attr('r', d => d.radius)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))');
      
      nodes.select('.node-glow')
        .transition().duration(800)
        .attr('r', d => d.radius + 6)
        .attr('opacity', 0.2)
        .attr('fill', d => d.color);
      
      if (links) {
        links.transition().duration(800)
          .style('stroke-width', 1.5)
          .style('opacity', 0.6)
          .style('stroke', '#64748b'); // Reset to default slate-500
      }
    }
  }, [focusedNode]);

  // Temp connection rendering moved to D3 layer for proper transform handling

  return (
    <>
      <svg
        ref={svgRef}
        className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100"
        style={{ width: '100%', height: '100%', minHeight: '600px' }}
      >
        {/* Temp connection rendering moved to D3 layer */}
      </svg>

      {/* Physics Controls Toggle Button */}
      <button
        onClick={() => setShowPhysicsControls(!showPhysicsControls)}
        className="fixed top-4 right-4 z-40 p-3 bg-white hover:bg-slate-50 rounded-lg shadow-lg border border-slate-200 transition-all hover:shadow-xl group"
        title="Open Physics Controls"
      >
        <svg 
          className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </button>

      {/* Physics Controls Panel */}
      {showPhysicsControls && (
        <PhysicsControls
          simulation={simulationRef.current}
          physicsParamsRef={physicsParamsRef}
          onClose={() => setShowPhysicsControls(false)}
        />
      )}

      {/* Edge Context Menu */}
      {contextMenu && selectedEdge && (
        <EdgeContextMenu
          position={contextMenu}
          edge={selectedEdge}
          onEditLabel={handleEditLabel}
          onDelete={handleDeleteEdge}
          onClose={() => {
            setContextMenu(null);
            setSelectedEdge(null);
          }}
        />
      )}

      {/* Edge Label Modal */}
      {console.log('🏷️ [D3Graph render] Rendering EdgeLabelModal with:', { 
        isOpen: edgeLabelModalOpen, 
        hasEdge: !!selectedEdge,
        edgeId: selectedEdge?.id 
      })}
      <EdgeLabelModal
        isOpen={edgeLabelModalOpen}
        edge={selectedEdge}
        onSave={handleSaveLabel}
        onClose={() => {
          setEdgeLabelModalOpen(false);
          setSelectedEdge(null);
        }}
      />
    </>
  );
};

export default D3Graph;