import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3Graph = ({ mindMapData, onNodeClick, onNodeDoubleClick, onDataChange, physicsEnabled }) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesDataRef = useRef([]);
  const linksDataRef = useRef([]);

  // Node configuration
  const nodeConfig = {
    topic: { color: '#3b82f6', radius: 60 },
    case: { color: '#6366f1', radius: 65 },
    task: { color: '#f59e0b', radius: 55 },
    literature: { color: '#a855f7', radius: 58 },
  };

  // Convert mindMapData to D3 format
  const convertToD3Format = (data) => {
    const nodes = [];
    const links = [];

    // Add nodes from all categories
    ['topics', 'cases', 'tasks', 'literature'].forEach((category) => {
      const nodeType = category === 'literature' ? 'literature' : category.slice(0, -1);
      const items = data[category] || [];
      
      items.forEach((item, index) => {
        const config = nodeConfig[nodeType];
        
        // Use existing position or create grid position
        let x, y;
        if (item.position?.x !== undefined && item.position?.y !== undefined) {
          x = item.position.x;
          y = item.position.y;
        } else {
          // Grid layout for new nodes
          const gridSize = 5;
          const spacing = 150;
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          x = 300 + col * spacing;
          y = 300 + row * spacing;
        }
        
        nodes.push({
          id: `${nodeType}-${item.id}`,
          label: item.label || item.title || 'Untitled',
          type: nodeType,
          color: config.color,
          radius: config.radius,
          x: x,
          y: y,
          fx: x, // Fix position initially
          fy: y,
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
  };

  useEffect(() => {
    if (!svgRef.current || !mindMapData) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    console.log('🔷 D3 Initializing:', { width, height, hasData: !!mindMapData });

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group for zoom/pan
    const g = svg.append('g').attr('class', 'graph-container');

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Convert data
    const { nodes, links } = convertToD3Format(mindMapData);
    nodesDataRef.current = nodes;
    linksDataRef.current = links;

    console.log('🔷 D3 Data:', { nodeCount: nodes.length, linkCount: links.length });

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.6);

    // Create node groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', function(event, d) {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d);
      })
      .on('dblclick', function(event, d) {
        event.stopPropagation();
        if (onNodeDoubleClick) onNodeDoubleClick(d);
      });

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 4);

    // Add labels to nodes
    node.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 0 3px #000, 0 0 3px #000')
      .each(function(d) {
        // Wrap text if too long
        const text = d3.select(this);
        const words = d.label.split(/\s+/);
        if (words.length > 2) {
          text.text('');
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', '-0.3em')
            .text(words.slice(0, 2).join(' '));
          if (words.length > 2) {
            text.append('tspan')
              .attr('x', 0)
              .attr('dy', '1.2em')
              .text(words.slice(2).join(' ').substring(0, 15) + '...');
          }
        }
      });

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(200))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 10));

    simulationRef.current = simulation;

    // Track tick count for auto-stop
    let tickCount = 0;
    let hasStopped = false;
    
    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
      
      tickCount++;
      
      // Stop simulation after initial layout (300 ticks) to prevent continuous shifting
      if (tickCount >= 300 && !hasStopped) {
        hasStopped = true;
        simulation.stop();
        // Fix all node positions
        nodes.forEach(n => {
          n.fx = n.x;
          n.fy = n.y;
        });
        console.log('🔷 Simulation stopped after initial layout (300 ticks)');
      }
    });

    // Control simulation based on physics toggle
    if (!physicsEnabled) {
      simulation.stop();
      hasStopped = true;
      console.log('🔷 Physics disabled - simulation stopped');
    } else {
      // Let it run for initial layout only
      simulation.alpha(1).restart();
      console.log('🔷 Simulation started for initial layout');
    }

    // Drag functions
    function dragstarted(event, d) {
      // Don't restart simulation on drag - causes instability
      d.fx = d.x;
      d.fy = d.y;
      // Highlight dragged node
      d3.select(this).select('circle').attr('stroke-width', 6);
    }

    function dragged(event, d) {
      // Fix position during drag
      d.fx = event.x;
      d.fy = event.y;
      d.x = event.x;
      d.y = event.y;
      
      // Update visual position immediately
      d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
      
      // Update connected links
      link.filter(l => l.source.id === d.id || l.target.id === d.id)
        .attr('x1', l => l.source.x)
        .attr('y1', l => l.source.y)
        .attr('x2', l => l.target.x)
        .attr('y2', l => l.target.y);
    }

    function dragended(event, d) {
      // Keep node fixed at dropped position
      d.fx = d.x;
      d.fy = d.y;
      
      // Remove highlight
      d3.select(this).select('circle').attr('stroke-width', 4);
      
      // Save position to backend
      if (onDataChange) {
        const positions = {};
        nodes.forEach(node => {
          positions[node.id] = { x: node.x, y: node.y };
        });
        onDataChange({ type: 'positions', positions });
      }
    }

    // Expose simulation to window for debugging
    window.d3Simulation = simulation;
    window.d3Nodes = nodes;
    window.d3Links = links;
    console.log('🔷 D3 Simulation started', { nodes: nodes.length, links: links.length });

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [mindMapData, physicsEnabled, onNodeClick, onNodeDoubleClick, onDataChange]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100"
      style={{ width: '100%', height: '100%', minHeight: '600px' }}
    />
  );
};

export default D3Graph;
