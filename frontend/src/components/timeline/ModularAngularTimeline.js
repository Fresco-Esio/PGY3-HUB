// D3 Physics-Based Timeline - Implementing proper force-directed simulation
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, Pin, PinOff } from 'lucide-react';
import { forceSimulation, forceLink, forceManyBody, forceX, forceY } from 'd3-force';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

// Import hover cards for timeline entries
import { PatientCard, ClinicianCard } from './components/HoverCards';

const D3PhysicsTimeline = ({ 
  caseId, 
  initialEntries = [],
  onEntryUpdate,
  onEntryAdd,
  onEntryDelete,
  className = '',
  width = 800,
  height = 600
}) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [pinnedNodes, setPinnedNodes] = useState(new Set());
  const [entries, setEntries] = useState(initialEntries);

  // Color scale for different entry types
  const color = scaleOrdinal(schemeCategory10);

  // Convert timeline entries to D3 nodes format
  const convertEntriesToNodes = useCallback((timelineEntries) => {
    return timelineEntries.map((entry, index) => ({
      id: entry.id || `entry-${index}`,
      title: entry.title || `Entry ${index + 1}`,
      type: entry.type || 'note',
      content: entry.content || '',
      timestamp: entry.timestamp || new Date().toISOString(),
      x: width / 2 + (Math.random() - 0.5) * 200, // Random initial position
      y: height / 2 + (Math.random() - 0.5) * 200,
      data: entry
    }));
  }, [width, height]);

  // Create timeline path links (connecting consecutive entries)
  const createTimelineLinks = useCallback((nodes) => {
    const sortedNodes = [...nodes].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const links = [];
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      links.push({
        source: sortedNodes[i].id,
        target: sortedNodes[i + 1].id,
        value: 1
      });
    }
    return links;
  }, []);

  // Initialize D3 force simulation
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current) return;

    const nodes = convertEntriesToNodes(entries);
    const links = createTimelineLinks(nodes);
    
    nodesRef.current = nodes;
    linksRef.current = links;

    // Create force simulation
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).distance(80))
      .force("charge", forceManyBody().strength(-300))
      .force("x", forceX(width / 2).strength(0.1))
      .force("y", forceY(height / 2).strength(0.1))
      .velocityDecay(0.4)
      .alphaDecay(0.02);

    simulationRef.current = simulation;

    // Setup SVG
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Clear existing content
    svg.selectAll("*").remove();

    // Add timeline path (subtle guide)
    const linkGroup = svg.append("g")
      .attr("class", "timeline-links")
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    const link = linkGroup.selectAll("line")
      .data(links)
      .join("line");

    // Add nodes
    const nodeGroup = svg.append("g")
      .attr("class", "timeline-nodes");

    const node = nodeGroup.selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 12)
      .attr("fill", d => color(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease");

    // Add node labels
    const labels = nodeGroup.selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.title)
      .attr("text-anchor", "middle")
      .attr("dy", -20)
      .attr("font-size", "12px")
      .attr("fill", "#374151")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("transition", "opacity 0.2s ease");

    // Drag behavior implementation
    const dragBehavior = drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        
        // Visual feedback
        select(event.sourceEvent.target)
          .transition()
          .duration(200)
          .attr("r", 16)
          .attr("stroke-width", 3);
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        
        // Visual feedback
        select(event.sourceEvent.target)
          .transition()
          .duration(200)
          .attr("r", 12)
          .attr("stroke-width", 2);
      });

    // Apply drag behavior to nodes
    node.call(dragBehavior);

    // Click to pin/unpin nodes
    node.on("click", (event, d) => {
      event.stopPropagation();
      const isPinned = pinnedNodes.has(d.id);
      
      if (isPinned) {
        // Unpin node
        d.fx = null;
        d.fy = null;
        setPinnedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(d.id);
          return newSet;
        });
        
        // Visual feedback - remove pin indicator
        select(event.target)
          .transition()
          .duration(300)
          .attr("stroke", "#fff");
          
      } else {
        // Pin node
        d.fx = d.x;
        d.fy = d.y;
        setPinnedNodes(prev => new Set([...prev, d.id]));
        
        // Visual feedback - add pin indicator
        select(event.target)
          .transition()
          .duration(300)
          .attr("stroke", "#f59e0b")
          .attr("stroke-width", 3);
      }
      
      simulation.restart();
    });

    // Hover effects
    node
      .on("mouseenter", (event, d) => {
        setHoveredNode(d.id);
        
        // Smooth hover transition
        select(event.target)
          .transition()
          .duration(200)
          .attr("r", 16)
          .style("filter", "drop-shadow(0 0 10px rgba(0,0,0,0.3))");
          
        // Show label
        labels.filter(labelData => labelData.id === d.id)
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseleave", (event, d) => {
        if (hoveredNode === d.id) {
          setHoveredNode(null);
        }
        
        // Smooth hover out transition
        select(event.target)
          .transition()
          .duration(200)
          .attr("r", pinnedNodes.has(d.id) ? 14 : 12)
          .style("filter", "none");
          
        // Hide label
        labels.filter(labelData => labelData.id === d.id)
          .transition()
          .duration(200)
          .style("opacity", 0);
      });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
        
      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y - 20);
    });

    return simulation;
  }, [entries, width, height, color, pinnedNodes, hoveredNode, convertEntriesToNodes, createTimelineLinks]);

  // Initialize simulation when entries change
  useEffect(() => {
    if (entries.length > 0) {
      initializeSimulation();
    }
    
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [entries, initializeSimulation]);

  // Handle adding new entry
  const handleAddEntry = useCallback(() => {
    const newEntry = {
      id: `entry-${Date.now()}`,
      title: `Entry ${entries.length + 1}`,
      type: 'note',
      content: '',
      timestamp: new Date().toISOString(),
      patient_narrative: '',
      clinical_notes: ''
    };
    
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    
    if (onEntryAdd) {
      onEntryAdd(newEntry);
    }
  }, [entries, onEntryAdd]);

  // Handle reset layout
  const handleResetLayout = useCallback(() => {
    // Clear all pinned nodes
    setPinnedNodes(new Set());
    
    // Reset node positions and restart simulation
    if (simulationRef.current && nodesRef.current) {
      nodesRef.current.forEach(node => {
        node.fx = null;
        node.fy = null;
        node.x = width / 2 + (Math.random() - 0.5) * 200;
        node.y = height / 2 + (Math.random() - 0.5) * 200;
      });
      
      simulationRef.current.alpha(1).restart();
    }
  }, [width, height]);

  // Get hovered node data for cards
  const hoveredNodeData = hoveredNode ? 
    nodesRef.current.find(node => node.id === hoveredNode) : null;

  return (
    <div className={`relative ${className}`}>
      {/* SVG Container for D3 Physics Timeline */}
      <div
        className="relative border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50"
        style={{ width, height }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0"
          style={{ width: `${width}px`, height: `${height}px` }}
        />

        {/* Hover Cards */}
        <AnimatePresence>
          {hoveredNodeData && (
            <React.Fragment>
              <PatientCard
                entry={hoveredNodeData.data}
                position={{
                  x: hoveredNodeData.x - 160,
                  y: hoveredNodeData.y,
                  side: 'left'
                }}
                isVisible={true}
                onEdit={() => {}}
                isLoading={false}
              />
              <ClinicianCard
                entry={hoveredNodeData.data}
                position={{
                  x: hoveredNodeData.x + 20,
                  y: hoveredNodeData.y,
                  side: 'right'
                }}
                isVisible={true}
                onEdit={() => {}}
                isLoading={false}
              />
            </React.Fragment>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Entry
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetLayout}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw size={16} />
            Reset Layout
          </motion.button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-4">
          <span>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
          <span className="flex items-center gap-1">
            <Pin size={12} />
            {pinnedNodes.size} pinned
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-slate-500">
        <p>• <strong>Drag</strong> nodes to reposition • <strong>Click</strong> to pin/unpin • <strong>Hover</strong> for details</p>
      </div>
    </div>
  );
};

// For backward compatibility, export with original name
const AngularTimeline = D3PhysicsTimeline;
AngularTimeline.displayName = 'AngularTimeline';

export default AngularTimeline;