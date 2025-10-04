import React, { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import popper from 'cytoscape-popper';
import nodeHtmlLabel from 'cytoscape-node-html-label';

// Register extensions
cytoscape.use(fcose);
cytoscape.use(popper);
cytoscape.use(nodeHtmlLabel);

const CytoscapeGraph = ({
  mindMapData,
  onNodeClick,
  onNodeDoubleClick,
  onDataChange,
  physicsEnabled,
  cytoscapeRef, // Expose ref to parent
}) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const layoutRef = useRef(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Node type configurations
  const nodeConfig = {
    topic: {
      color: '#3b82f6',
      size: 60,
      icon: '🧠',
    },
    case: {
      color: '#6366f1',
      size: 65,
      icon: '👥',
    },
    task: {
      color: '#f59e0b',
      size: 55,
      icon: '✓',
    },
    literature: {
      color: '#a855f7',
      size: 58,
      icon: '📚',
    },
  };

  // Convert mindMapData to Cytoscape elements
  const convertToElements = useCallback((data) => {
    const elements = [];

    // Add nodes
    ['topics', 'cases', 'tasks', 'literature'].forEach((type) => {
      const nodeType = type === 'literature' ? 'literature' : type.slice(0, -1);
      const items = data[type] || [];

      items.forEach((item) => {
        const config = nodeConfig[nodeType];
        elements.push({
          group: 'nodes',
          data: {
            id: `${nodeType}-${item.id}`,
            label: item.label || item.title || '',
            type: nodeType,
            originalData: item,
            icon: config.icon,
          },
          position: item.position || { x: Math.random() * 800, y: Math.random() * 600 },
          classes: nodeType,
        });
      });
    });

    // Add edges
    const connections = data.connections || [];
    connections.forEach((conn, idx) => {
      elements.push({
        group: 'edges',
        data: {
          id: `edge-${idx}`,
          source: conn.source,
          target: conn.target,
          label: conn.label || '',
        },
      });
    });

    return elements;
  }, []);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      
      style: [
        // Node styles
        {
          selector: 'node',
          style: {
            'width': 'data(size)',
            'height': 'data(size)',
            'background-color': 'data(color)',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'text-outline-color': 'data(color)',
            'text-outline-width': 2,
            'font-size': '12px',
            'font-weight': 'bold',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'border-width': 3,
            'border-color': '#fff',
            'overlay-opacity': 0,
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': '0.3s',
          },
        },
        
        // Node type specific styles
        {
          selector: 'node.topic',
          style: {
            'background-color': '#3b82f6',
            'background-gradient-stop-colors': '#3b82f6 #1d4ed8',
            'background-gradient-direction': 'to-bottom-right',
            'width': 120,
            'height': 120,
          },
        },
        {
          selector: 'node.case',
          style: {
            'background-color': '#6366f1',
            'background-gradient-stop-colors': '#6366f1 #4338ca',
            'background-gradient-direction': 'to-bottom-right',
            'width': 130,
            'height': 130,
          },
        },
        {
          selector: 'node.task',
          style: {
            'background-color': '#f59e0b',
            'background-gradient-stop-colors': '#f59e0b #d97706',
            'background-gradient-direction': 'to-bottom-right',
            'width': 110,
            'height': 110,
          },
        },
        {
          selector: 'node.literature',
          style: {
            'background-color': '#a855f7',
            'background-gradient-stop-colors': '#a855f7 #7c3aed',
            'background-gradient-direction': 'to-bottom-right',
            'width': 115,
            'height': 115,
          },
        },
        
        // Expanded nodes
        {
          selector: 'node.expanded',
          style: {
            'width': 280,
            'height': 280,
            'text-wrap': 'wrap',
            'text-max-width': '250px',
            'font-size': '10px',
          },
        },
        
        // Selected node
        {
          selector: 'node:selected',
          style: {
            'border-width': 6,
            'border-color': '#22d3ee',
            'box-shadow': '0 0 20px rgba(34, 211, 238, 0.8)',
          },
        },
        
        // Hovered node
        {
          selector: 'node:active',
          style: {
            'overlay-opacity': 0.2,
            'overlay-color': '#fff',
          },
        },
        
        // Edge styles
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'text-background-color': '#fff',
            'text-background-opacity': 0.8,
            'text-background-padding': '3px',
            'color': '#475569',
          },
        },
        
        // Selected edge
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#22d3ee',
            'target-arrow-color': '#22d3ee',
            'width': 4,
          },
        },
        
        // Incomplete data indicator
        {
          selector: 'node.incomplete',
          style: {
            'border-color': '#f59e0b',
            'border-width': 4,
          },
        },
      ],

      // Interaction options
      wheelSensitivity: 0.2,
      minZoom: 0.3,
      maxZoom: 3,
    });

    cyRef.current = cy;
    
    // Expose Cytoscape instance to parent
    if (cytoscapeRef) {
      cytoscapeRef.current = cy;
    }

    // Add click handlers
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeId = node.id();
      
      // Toggle expansion
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
          node.removeClass('expanded');
        } else {
          newSet.add(nodeId);
          node.addClass('expanded');
        }
        return newSet;
      });
      
      if (onNodeClick) {
        onNodeClick(node);
      }
    });

    cy.on('dbltap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node);
      }
    });

    // Handle edge creation
    let sourceNode = null;
    cy.on('cxttap', 'node', (evt) => {
      const node = evt.target;
      if (!sourceNode) {
        sourceNode = node;
        node.addClass('source-selected');
      } else {
        // Create edge
        cy.add({
          group: 'edges',
          data: {
            id: `edge-${Date.now()}`,
            source: sourceNode.id(),
            target: node.id(),
          },
        });
        sourceNode.removeClass('source-selected');
        sourceNode = null;
        
        // Save connection
        if (onDataChange) {
          updateConnectionsInData();
        }
      }
    });

    // Handle position changes (for auto-save)
    cy.on('dragfree', 'node', (evt) => {
      if (onDataChange) {
        updatePositionsInData();
      }
    });

    // Update positions in data
    const updatePositionsInData = () => {
      const positions = {};
      cy.nodes().forEach((node) => {
        positions[node.id()] = node.position();
      });
      if (onDataChange) {
        onDataChange({ type: 'positions', positions });
      }
    };

    // Update connections in data
    const updateConnectionsInData = () => {
      const connections = cy.edges().map((edge) => ({
        source: edge.source().id(),
        target: edge.target().id(),
        label: edge.data('label') || '',
      }));
      if (onDataChange) {
        onDataChange({ type: 'connections', connections });
      }
    };

    // Add HTML labels with icons
    cy.nodeHtmlLabel([
      {
        query: 'node',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        tpl: function(data) {
          const icon = data.icon || '●';
          const label = data.label || '';
          const isExpanded = expandedNodes.has(data.id);
          
          if (isExpanded) {
            // Expanded view with more details
            const originalData = data.originalData || {};
            return `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
                padding: 10px;
                width: 260px;
                height: 260px;
                overflow-y: auto;
              ">
                <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${label}</div>
                ${originalData.description ? `<div style="font-size: 10px; margin-top: 4px;">${originalData.description.substring(0, 100)}...</div>` : ''}
                <div style="font-size: 9px; margin-top: 8px; opacity: 0.8;">Click to collapse</div>
              </div>
            `;
          } else {
            // Collapsed view
            return `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
                padding: 8px;
              ">
                <div style="font-size: 32px; margin-bottom: 4px;">${icon}</div>
                <div style="font-weight: bold; font-size: 12px; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${label}</div>
              </div>
            `;
          }
        }
      }
    ]);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [onNodeClick, onNodeDoubleClick, onDataChange, expandedNodes]);

  // Update elements when data changes
  useEffect(() => {
    if (!cyRef.current || !mindMapData) return;

    const cy = cyRef.current;
    const elements = convertToElements(mindMapData);

    // Clear and add new elements
    cy.elements().remove();
    cy.add(elements);

    // Re-apply HTML labels after adding elements
    if (cy.nodeHtmlLabel) {
      cy.nodeHtmlLabel([
        {
          query: 'node',
          halign: 'center',
          valign: 'center',
          halignBox: 'center',
          valignBox: 'center',
          tpl: function(data) {
            const icon = data.icon || '●';
            const label = data.label || '';
            const isExpanded = expandedNodes.has(data.id);
            
            if (isExpanded) {
              const originalData = data.originalData || {};
              return `
                <div style="
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  text-align: center;
                  padding: 10px;
                  width: 260px;
                  height: 260px;
                  overflow-y: auto;
                  pointer-events: none;
                ">
                  <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${label}</div>
                  ${originalData.description ? `<div style="font-size: 10px; margin-top: 4px;">${originalData.description.substring(0, 100)}...</div>` : ''}
                  <div style="font-size: 9px; margin-top: 8px; opacity: 0.8;">Click to collapse</div>
                </div>
              `;
            } else {
              return `
                <div style="
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  text-align: center;
                  padding: 8px;
                  pointer-events: none;
                ">
                  <div style="font-size: 32px; margin-bottom: 4px;">${icon}</div>
                  <div style="font-weight: bold; font-size: 12px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${label}</div>
                </div>
              `;
            }
          }
        }
      ]);
    }

    // Apply layout if physics is enabled and there are elements
    if (physicsEnabled && elements.length > 0) {
      setTimeout(() => runLayout(), 100);
    }
  }, [mindMapData, convertToElements, physicsEnabled, expandedNodes, runLayout]);

  // Run force-directed layout
  const runLayout = useCallback(() => {
    if (!cyRef.current) return;

    // Stop existing layout
    if (layoutRef.current) {
      layoutRef.current.stop();
    }

    const layout = cyRef.current.layout({
      name: 'fcose',
      quality: 'default',
      randomize: false,
      animate: true,
      animationDuration: 1000,
      animationEasing: 'ease-out',
      fit: true,
      padding: 50,
      nodeSeparation: 150,
      idealEdgeLength: 200,
      edgeElasticity: 0.45,
      nestingFactor: 0.1,
      gravity: 0.25,
      numIter: 2500,
      tile: true,
      tilingPaddingVertical: 10,
      tilingPaddingHorizontal: 10,
      gravityRange: 3.8,
      gravityCompound: 1.0,
      gravityRangeCompound: 1.5,
      initialEnergyOnIncremental: 0.5,
    });

    layoutRef.current = layout;
    layout.run();
  }, []);

  // Expose layout function
  useEffect(() => {
    if (cyRef.current && window) {
      window.cytoscapeRunLayout = runLayout;
    }
  }, [runLayout]);

  // Handle continuous physics
  useEffect(() => {
    if (!cyRef.current || !physicsEnabled) return;

    let animationId;
    const cy = cyRef.current;

    const applyPhysics = () => {
      cy.nodes().forEach((node) => {
        const pos = node.position();
        const neighbors = node.neighborhood('node');
        
        let fx = 0;
        let fy = 0;

        // Repulsion from all nodes
        cy.nodes().forEach((other) => {
          if (node.id() === other.id()) return;
          
          const otherPos = other.position();
          const dx = pos.x - otherPos.x;
          const dy = pos.y - otherPos.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          
          if (dist < 200) {
            const force = 1000 / (distSq || 1);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        });

        // Attraction to connected nodes
        neighbors.forEach((neighbor) => {
          const neighborPos = neighbor.position();
          const dx = neighborPos.x - pos.x;
          const dy = neighborPos.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 100) {
            const force = 0.01 * (dist - 150);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        });

        // Apply force with damping
        const damping = 0.8;
        const newX = pos.x + fx * damping;
        const newY = pos.y + fy * damping;
        
        node.position({ x: newX, y: newY });
      });

      animationId = requestAnimationFrame(applyPhysics);
    };

    // Start physics only if there are nodes
    if (cy.nodes().length > 0) {
      animationId = requestAnimationFrame(applyPhysics);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [physicsEnabled]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default CytoscapeGraph;
