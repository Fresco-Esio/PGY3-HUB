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
      
      items.forEach((item) => {
        const config = nodeConfig[nodeType];
        nodes.push({
          id: `${nodeType}-${item.id}`,
          label: item.label || item.title || 'Untitled',
          type: nodeType,
          color: config.color,
          radius: config.radius,
          x: item.position?.x || Math.random() * 800 + 200,
          y: item.position?.y || Math.random() * 600 + 200,
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

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Control simulation based on physics toggle
    if (!physicsEnabled) {
      simulation.stop();
    }

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      
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
    console.log('🔷 D3 Simulation started');
    
    // Center the initial view on the nodes after a brief delay
    setTimeout(() => {
      if (nodes.length > 0) {
        const bounds = {
          minX: Math.min(...nodes.map(n => n.x)),
          maxX: Math.max(...nodes.map(n => n.x)),
          minY: Math.min(...nodes.map(n => n.y)),
          maxY: Math.max(...nodes.map(n => n.y)),
        };
        
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        // Calculate zoom to fit all nodes
        const graphWidth = bounds.maxX - bounds.minX + 200;
        const graphHeight = bounds.maxY - bounds.minY + 200;
        const scale = Math.min(width / graphWidth, height / graphHeight, 1);
        
        const transform = d3.zoomIdentity
          .translate(width / 2 - centerX * scale, height / 2 - centerY * scale)
          .scale(scale);
        
        svg.transition().duration(750).call(zoom.transform, transform);
        console.log('🔷 View centered on nodes');
      }
    }, 500);

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
