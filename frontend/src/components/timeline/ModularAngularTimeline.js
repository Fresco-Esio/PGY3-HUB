// D3 Physics-Based Timeline - Refined implementation with proper UX behavior
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, Pin, PinOff, Edit3, Save, X } from 'lucide-react';
import { forceSimulation, forceLink, forceManyBody, forceX, forceY } from 'd3-force';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

// Enhanced Hover Cards with editing capabilities
const EditableHoverCard = ({ 
  entry, 
  position, 
  type, // 'patient' or 'clinical'
  isVisible, 
  onEdit,
  onSave,
  isEditing,
  onCancel
}) => {
  const [editContent, setEditContent] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setEditContent(type === 'patient' ? entry.patient_narrative || '' : entry.clinical_notes || '');
    }
  }, [isEditing, entry, type]);

  const handleSave = () => {
    onSave(entry.id, type, editContent);
  };

  const cardTitle = type === 'patient' ? 'Patient Narrative' : 'Clinical Notes';
  const cardContent = type === 'patient' ? entry.patient_narrative : entry.clinical_notes;
  const bgColor = type === 'patient' ? 'bg-green-900/90' : 'bg-blue-900/90';
  const borderColor = type === 'patient' ? 'border-green-600' : 'border-blue-600';

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 5 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`absolute z-50 ${bgColor} backdrop-blur-md rounded-xl border-2 ${borderColor} shadow-2xl p-4 min-w-[280px] max-w-[320px]`}
        style={{
          left: position.x,
          top: position.y,
          transform: position.transform || 'translate(-50%, -100%)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Connection indicator */}
        <div 
          className={`absolute w-3 h-3 ${type === 'patient' ? 'bg-green-600' : 'bg-blue-600'} rotate-45`}
          style={{
            [position.anchorSide]: '-6px',
            [position.anchorPosition]: '20px'
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            {type === 'patient' ? '👤' : '🩺'} {cardTitle}
          </h4>
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(entry.id, type)}
              className="text-slate-300 hover:text-white transition-colors p-1 rounded"
              title={`Edit ${cardTitle.toLowerCase()}`}
            >
              <Edit3 size={12} />
            </motion.button>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder={`Enter ${cardTitle.toLowerCase()}...`}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-3 py-1 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
              >
                <Save size={12} />
                Save
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="text-slate-300 text-sm leading-relaxed">
            {cardContent ? (
              <div className="max-h-32 overflow-y-auto">
                <p>{cardContent}</p>
                {type === 'patient' && entry.symptoms && (
                  <div className="mt-2">
                    <span className="text-xs text-slate-400">Symptoms: </span>
                    <span className="text-xs">{entry.symptoms.join(', ')}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 italic">
                No {cardTitle.toLowerCase()} recorded. Click to add content.
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        {entry.timestamp && (
          <div className="mt-3 pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-500">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

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
  const hoverTimeoutRef = useRef(null);
  
  const [hoveredNode, setHoveredNode] = useState(null);
  const [pinnedNodes, setPinnedNodes] = useState(new Set());
  const [entries, setEntries] = useState(initialEntries);
  const [editingCard, setEditingCard] = useState(null); // {nodeId, type}
  const [newNodeAnimations, setNewNodeAnimations] = useState(new Set());

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
      patient_narrative: entry.patient_narrative || '',
      clinical_notes: entry.clinical_notes || '',
      symptoms: entry.symptoms || [],
      // Position nodes in zigzag pattern for timeline
      x: width / 2 + (index % 2 === 0 ? -150 : 150) + (Math.random() - 0.5) * 50,
      y: 100 + (index * 100) + (Math.random() - 0.5) * 20,
      side: index % 2 === 0 ? 'left' : 'right', // For card positioning
      data: entry
    }));
  }, [width]);

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

  // Calculate card position based on node position and timeline side
  const calculateCardPosition = useCallback((node, cardType) => {
    const isLeftSide = node.side === 'left';
    const offset = 25;
    
    let position = {
      x: node.x,
      y: node.y - 150, // Float above timeline
    };

    if (cardType === 'patient') {
      // Patient card always goes to the left
      position.x = node.x - 160;
      position.transform = 'translate(0, 0)';
      position.anchorSide = 'right';
      position.anchorPosition = isLeftSide ? 'bottom' : 'top';
    } else {
      // Clinical card always goes to the right  
      position.x = node.x + 25;
      position.transform = 'translate(0, 0)';
      position.anchorSide = 'left';
      position.anchorPosition = isLeftSide ? 'bottom' : 'top';
    }

    return position;
  }, []);

  // Handle hover with delay for dismissal
  const handleNodeHover = useCallback((nodeId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredNode(nodeId);
  }, []);

  const handleNodeLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNode(null);
    }, 150); // 150ms delay as requested
  }, []);

  // Initialize D3 force simulation
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current) return;

    const nodes = convertEntriesToNodes(entries);
    const links = createTimelineLinks(nodes);
    
    nodesRef.current = nodes;
    linksRef.current = links;

    // Create force simulation with proper physics
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).distance(100).strength(0.5))
      .force("charge", forceManyBody().strength(-400))
      .force("x", forceX(width / 2).strength(0.1))
      .force("y", forceY(height / 2).strength(0.05))
      .velocityDecay(0.6)
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
      .attr("class", "timeline-links");

    const link = linkGroup.selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

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
      .style("transition", "all 0.25s ease");

    // Add subtle animation for new nodes (play once)
    nodes.forEach(nodeData => {
      if (newNodeAnimations.has(nodeData.id)) {
        const nodeElement = node.filter(d => d.id === nodeData.id);
        nodeElement
          .attr("r", 6)
          .attr("opacity", 0.7)
          .transition()
          .duration(300)
          .ease("elastic")
          .attr("r", 12)
          .attr("opacity", 1)
          .on("end", () => {
            // Remove from animation set after playing once
            setNewNodeAnimations(prev => {
              const newSet = new Set(prev);
              newSet.delete(nodeData.id);
              return newSet;
            });
          });
      }
    });

    // Add tooltips on nodes
    const tooltip = svg.append("g")
      .attr("class", "tooltips");

    // Drag behavior implementation
    const dragBehavior = drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        
        // Only set fx/fy if not pinned - allow free dragging
        if (!pinnedNodes.has(d.id)) {
          d.fx = d.x;
          d.fy = d.y;
        }
        
        // Visual feedback
        select(event.sourceEvent.target)
          .transition()
          .duration(200)
          .attr("r", 16)
          .attr("stroke-width", 3)
          .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.3))");
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        
        // If not explicitly pinned, allow node to move freely
        if (!pinnedNodes.has(d.id)) {
          d.fx = null;
          d.fy = null;
        }
        
        // Visual feedback
        select(event.sourceEvent.target)
          .transition()
          .duration(200)
          .attr("r", pinnedNodes.has(d.id) ? 14 : 12)
          .attr("stroke-width", 2)
          .style("filter", "none");
      });

    // Apply drag behavior to nodes
    node.call(dragBehavior);

    // Click to pin/unpin nodes
    node.on("click", (event, d) => {
      event.stopPropagation();
      const isPinned = pinnedNodes.has(d.id);
      
      if (isPinned) {
        // Unpin node - allow free movement
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
          .duration(250)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
          
      } else {
        // Pin node in current position
        d.fx = d.x;
        d.fy = d.y;
        setPinnedNodes(prev => new Set([...prev, d.id]));
        
        // Visual feedback - add pin indicator
        select(event.target)
          .transition()
          .duration(250)
          .attr("stroke", "#f59e0b")
          .attr("stroke-width", 3);
      }
      
      simulation.restart();
    });

    // Hover effects with proper event handling
    node
      .on("mouseenter", (event, d) => {
        handleNodeHover(d.id);
        
        // Smooth hover transition
        select(event.target)
          .transition()
          .duration(200)
          .attr("r", 16)
          .style("filter", "drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))");
      })
      .on("mouseleave", (event, d) => {
        handleNodeLeave();
        
        // Smooth hover out transition
        select(event.target)
          .transition()
          .duration(200)
          .attr("r", pinnedNodes.has(d.id) ? 14 : 12)
          .style("filter", "none");
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
    });

    return simulation;
  }, [entries, width, height, color, pinnedNodes, handleNodeHover, handleNodeLeave, convertEntriesToNodes, createTimelineLinks, newNodeAnimations]);

  // Initialize simulation when entries change
  useEffect(() => {
    initializeSimulation();
    
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
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
      clinical_notes: '',
      symptoms: []
    };
    
    // Add to animation set for one-time animation
    setNewNodeAnimations(prev => new Set([...prev, newEntry.id]));
    
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
      nodesRef.current.forEach((node, index) => {
        node.fx = null;
        node.fy = null;
        // Reset to zigzag pattern
        node.x = width / 2 + (index % 2 === 0 ? -150 : 150) + (Math.random() - 0.5) * 50;
        node.y = 100 + (index * 100) + (Math.random() - 0.5) * 20;
      });
      
      simulationRef.current.alpha(1).restart();
    }
  }, [width]);

  // Handle card editing
  const handleEditCard = useCallback((nodeId, cardType) => {
    setEditingCard({ nodeId, type: cardType });
  }, []);

  const handleSaveCard = useCallback((nodeId, cardType, content) => {
    const updatedEntries = entries.map(entry => {
      if (entry.id === nodeId) {
        return {
          ...entry,
          [cardType === 'patient' ? 'patient_narrative' : 'clinical_notes']: content
        };
      }
      return entry;
    });
    
    setEntries(updatedEntries);
    setEditingCard(null);
    
    if (onEntryUpdate) {
      onEntryUpdate(updatedEntries);
    }
  }, [entries, onEntryUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditingCard(null);
  }, []);

  // Get hovered node data for cards
  const hoveredNodeData = hoveredNode ? 
    nodesRef.current.find(node => node.id === hoveredNode) : null;

  return (
    <div className={`relative ${className}`}>
      {/* SVG Container for D3 Physics Timeline */}
      <div
        className="relative border border-slate-700 rounded-lg overflow-visible bg-slate-900/50"
        style={{ width, height }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0"
          style={{ width: `${width}px`, height: `${height}px` }}
        />

        {/* Hover Cards - Float above timeline */}
        <AnimatePresence>
          {hoveredNodeData && (
            <React.Fragment>
              <EditableHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'patient')}
                type="patient"
                isVisible={true}
                onEdit={handleEditCard}
                onSave={handleSaveCard}
                onCancel={handleCancelEdit}
                isEditing={editingCard?.nodeId === hoveredNodeData.id && editingCard?.type === 'patient'}
              />
              <EditableHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'clinical')}
                type="clinical"
                isVisible={true}
                onEdit={handleEditCard}
                onSave={handleSaveCard}
                onCancel={handleCancelEdit}
                isEditing={editingCard?.nodeId === hoveredNodeData.id && editingCard?.type === 'clinical'}
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

      {/* Instructions with improved UX hints */}
      <div className="mt-2 text-xs text-slate-500 space-y-1">
        <p>• <strong>Drag</strong> nodes to reposition • <strong>Click</strong> to pin/unpin • <strong>Hover</strong> for details</p>
        <p>• <strong>Edit</strong> content by clicking ✎ in hover cards • Cards float above timeline for better visibility</p>
      </div>
    </div>
  );
};

// For backward compatibility, export with original name
const AngularTimeline = D3PhysicsTimeline;
AngularTimeline.displayName = 'AngularTimeline';

export default AngularTimeline;