// D3 Physics Timeline - Refined with proper node interactions and card behavior  
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, Pin, PinOff, Edit3, Save, X } from 'lucide-react';
import { forceSimulation, forceLink, forceManyBody, forceX, forceY } from 'd3-force';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { easeElastic, easeBackOut } from 'd3-ease';

// Enhanced Hover Cards with precise corner positioning
const TimelineHoverCard = ({ 
  entry, 
  position, 
  type, // 'patient' or 'clinical'
  isVisible, 
  isEditing,
  onEdit,
  onSave,
  onCancel
}) => {
  const [editContent, setEditContent] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      setEditContent(type === 'patient' ? entry.patient_narrative || '' : entry.clinical_notes || '');
    }
  }, [isEditing, entry, type]);

  // Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && cardRef.current && !cardRef.current.contains(event.target)) {
        onSave(entry.id, type, editContent);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, editContent, entry.id, type, onSave]);

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (!isEditing) {
      onEdit(entry.id, type);
    }
  };

  const handleSave = () => {
    onSave(entry.id, type, editContent);
  };

  const cardTitle = type === 'patient' ? 'Patient Narrative' : 'Clinical Notes';
  const cardContent = type === 'patient' ? entry.patient_narrative : entry.clinical_notes;
  const bgColor = type === 'patient' ? 'bg-green-900/95' : 'bg-blue-900/95';
  const borderColor = type === 'patient' ? 'border-green-500' : 'border-blue-500';
  const glowColor = type === 'patient' ? 'shadow-green-500/20' : 'shadow-blue-500/20';

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`absolute z-50 ${bgColor} backdrop-blur-md rounded-lg border ${borderColor} shadow-xl ${glowColor} p-3 w-64 cursor-pointer`}
        style={{
          left: position.x,
          top: position.y,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
        }}
        onClick={handleCardClick}
      >
        {/* Connection line to node */}
        <div 
          className={`absolute w-0.5 h-6 ${type === 'patient' ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{
            [position.anchorSide]: '-1px',
            [position.anchorPosition]: '12px',
            boxShadow: `0 0 4px ${type === 'patient' ? '#10b981' : '#3b82f6'}`
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white flex items-center gap-1">
            {type === 'patient' ? '👤' : '🩺'} {cardTitle}
          </h4>
          {isEditing && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="text-green-400 hover:text-green-300 transition-colors p-1 rounded"
              title="Save changes"
            >
              <Save size={10} />
            </motion.button>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder={`Enter ${cardTitle.toLowerCase()}...`}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-xs text-slate-400">Click outside to save</div>
          </div>
        ) : (
          <div className="text-slate-300 text-xs leading-relaxed">
            {cardContent ? (
              <div className="max-h-16 overflow-y-auto">
                <p>{cardContent}</p>
              </div>
            ) : (
              <p className="text-slate-500 italic">
                Click to add {cardTitle.toLowerCase()}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        {!isEditing && entry.timestamp && (
          <div className="mt-2 pt-1 border-t border-slate-700">
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
  const [hoveredLink, setHoveredLink] = useState(null);
  const [pinnedNodes, setPinnedNodes] = useState(new Set());
  const [entries, setEntries] = useState(initialEntries);
  const [editingCard, setEditingCard] = useState(null); // {nodeId, type}
  const [newNodeIds, setNewNodeIds] = useState(new Set()); // Track genuinely new nodes

  // Color scale for different entry types
  const color = scaleOrdinal(schemeCategory10);

  // Calculate zigzag positions based on chronological order - centered in modal
  const calculateZigzagPositions = useCallback((timelineEntries) => {
    const sortedEntries = [...timelineEntries].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Center the timeline in the available space
    const centerX = width / 2;
    const startY = 80;
    const verticalSpacing = 120;
    const horizontalOffset = 140;
    
    return sortedEntries.map((entry, index) => ({
      ...entry,
      id: entry.id || `entry-${index}`,
      title: entry.title || `Entry ${index + 1}`,
      type: entry.type || 'note',
      orderIndex: index,
      // Centered zigzag positioning
      x: centerX + (index % 2 === 0 ? -horizontalOffset : horizontalOffset),
      y: startY + (index * verticalSpacing),
      side: index % 2 === 0 ? 'left' : 'right',
      patient_narrative: entry.patient_narrative || '',
      clinical_notes: entry.clinical_notes || '',
      symptoms: entry.symptoms || [],
      data: entry
    }));
  }, [width]);

  // Create timeline path links
  const createTimelineLinks = useCallback((nodes) => {
    const links = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        id: `link-${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        insertIndex: i + 1 // For inserting new nodes
      });
    }
    return links;
  }, []);

  // Calculate card position based on node position and zigzag side - improved positioning
  const calculateCardPosition = useCallback((node, cardType) => {
    const isLeftBend = node.side === 'left';
    const cardWidth = 250;
    const cardHeight = 80;
    
    let position = {};

    if (cardType === 'patient') {
      if (isLeftBend) {
        // Left bend: Patient card from bottom-right of node
        position = {
          x: node.x + 20,
          y: node.y + 20,
          anchorSide: 'left',
          anchorPosition: 'top'
        };
      } else {
        // Right bend: Patient card from top-right of node  
        position = {
          x: node.x + 20,
          y: node.y - cardHeight - 20,
          anchorSide: 'left', 
          anchorPosition: 'bottom'
        };
      }
    } else {
      // Clinical card
      if (isLeftBend) {
        // Left bend: Clinical card from top-left of node
        position = {
          x: node.x - cardWidth - 20,
          y: node.y - cardHeight - 20,
          anchorSide: 'right',
          anchorPosition: 'bottom'
        };
      } else {
        // Right bend: Clinical card from bottom-left of node
        position = {
          x: node.x - cardWidth - 20,
          y: node.y + 20,
          anchorSide: 'right',
          anchorPosition: 'top'
        };
      }
    }

    return position;
  }, []);

  // Handle hover with proper timing
  const handleNodeHover = useCallback((nodeId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredNode(nodeId);
  }, []);

  const handleNodeLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNode(null);
    }, 100);
  }, []);

  // Initialize D3 force simulation
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current) return;

    const nodes = calculateZigzagPositions(entries);
    const links = createTimelineLinks(nodes);
    
    nodesRef.current = nodes;
    linksRef.current = links;

    // Create force simulation with gentle physics
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).distance(100).strength(0.3))
      .force("charge", forceManyBody().strength(-200))
      .force("x", forceX().strength(0.05))
      .force("y", forceY().strength(0.02))
      .velocityDecay(0.7)
      .alphaDecay(0.02);

    simulationRef.current = simulation;

    // Setup SVG
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Clear existing content
    svg.selectAll("*").remove();

    // Add timeline path with hover effects
    const linkGroup = svg.append("g").attr("class", "timeline-links");

    const link = linkGroup.selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease")
      .on("mouseenter", (event, d) => {
        setHoveredLink(d.id);
        select(event.target)
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", 3)
          .style("filter", "drop-shadow(0 0 4px #64748b)");
      })
      .on("mouseleave", (event, d) => {
        setHoveredLink(null);
        select(event.target)
          .attr("stroke-opacity", 0.4)
          .attr("stroke-width", 2)
          .style("filter", "none");
      })
      .on("click", (event, d) => {
        // Insert new node at this position
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;
        insertNewNode(d.insertIndex, midX, midY);
      });

    // Add nodes
    const nodeGroup = svg.append("g").attr("class", "timeline-nodes");

    const node = nodeGroup.selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 12)
      .attr("fill", d => color(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease");

    // ONLY animate genuinely new nodes with shorter, single animation
    nodes.forEach(nodeData => {
      if (newNodeIds.has(nodeData.id)) {
        const nodeElement = node.filter(d => d.id === nodeData.id);
        nodeElement
          .attr("r", 4)
          .attr("opacity", 0.5)
          .transition()
          .duration(250)
          .ease(easeBackOut)
          .attr("r", 12)
          .attr("opacity", 1)
          .on("end", () => {
            // Remove from new nodes set after single animation
            setNewNodeIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(nodeData.id);
              return newSet;
            });
          });
      }
    });

    // Drag behavior with snap-to-zigzag logic
    const dragBehavior = drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        
        if (!pinnedNodes.has(d.id)) {
          d.fx = d.x;
          d.fy = d.y;
        }
        
        // Visual feedback - NO ANIMATION for existing nodes
        select(event.sourceEvent.target)
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
        
        // Snap to nearest timeline position logic
        const nearestPosition = findNearestTimelinePosition(event.x, event.y);
        if (nearestPosition && !pinnedNodes.has(d.id)) {
          d.fx = nearestPosition.x;
          d.fy = nearestPosition.y;
          // Update zigzag structure
          reorderTimelineStructure(d.id, nearestPosition.index);
        } else if (!pinnedNodes.has(d.id)) {
          d.fx = null;
          d.fy = null;
        }
        
        // Reset visual feedback - NO TRANSITION for existing nodes
        select(event.sourceEvent.target)
          .attr("r", pinnedNodes.has(d.id) ? 14 : 12)
          .attr("stroke-width", 2)
          .style("filter", "none");
      });

    // Apply drag behavior
    node.call(dragBehavior);

    // Click to pin/unpin
    node.on("click", (event, d) => {
      event.stopPropagation();
      const isPinned = pinnedNodes.has(d.id);
      
      if (isPinned) {
        d.fx = null;
        d.fy = null;
        setPinnedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(d.id);
          return newSet;
        });
        select(event.target).attr("stroke", "#fff").attr("stroke-width", 2);
      } else {
        d.fx = d.x;
        d.fy = d.y;
        setPinnedNodes(prev => new Set([...prev, d.id]));
        select(event.target).attr("stroke", "#f59e0b").attr("stroke-width", 3);
      }
      
      simulation.restart();
    });

    // Hover effects - NO ANIMATION for existing nodes
    node
      .on("mouseenter", (event, d) => {
        handleNodeHover(d.id);
        select(event.target)
          .attr("r", 16)
          .style("filter", "drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))");
      })
      .on("mouseleave", (event, d) => {
        handleNodeLeave();
        select(event.target)
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
  }, [entries, width, height, color, pinnedNodes, newNodeIds, handleNodeHover, handleNodeLeave, calculateZigzagPositions, createTimelineLinks]);

  // Helper functions
  const findNearestTimelinePosition = useCallback((x, y) => {
    // Logic to find nearest valid zigzag position
    const zigzagPositions = calculateZigzagPositions(entries);
    let nearest = null;
    let minDistance = Infinity;
    
    zigzagPositions.forEach((pos, index) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < minDistance && distance < 100) { // Within snap range
        minDistance = distance;
        nearest = { ...pos, index };
      }
    });
    
    return nearest;
  }, [entries, calculateZigzagPositions]);

  const reorderTimelineStructure = useCallback((nodeId, newIndex) => {
    // Reorder entries to maintain zigzag structure
    const updatedEntries = [...entries];
    const nodeIndex = updatedEntries.findIndex(entry => entry.id === nodeId);
    
    if (nodeIndex !== -1 && newIndex !== nodeIndex) {
      const [movedEntry] = updatedEntries.splice(nodeIndex, 1);
      updatedEntries.splice(newIndex, 0, movedEntry);
      setEntries(updatedEntries);
    }
  }, [entries]);

  const insertNewNode = useCallback((insertIndex, x, y) => {
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
    
    // Mark as new for animation
    setNewNodeIds(prev => new Set([...prev, newEntry.id]));
    
    // Insert at specific position
    const updatedEntries = [...entries];
    updatedEntries.splice(insertIndex, 0, newEntry);
    setEntries(updatedEntries);
    
    if (onEntryAdd) {
      onEntryAdd(newEntry);
    }
  }, [entries, onEntryAdd]);

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

  // Handle adding new entry at end
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
    
    setNewNodeIds(prev => new Set([...prev, newEntry.id]));
    
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    
    if (onEntryAdd) {
      onEntryAdd(newEntry);
    }
  }, [entries, onEntryAdd]);

  // Handle reset layout
  const handleResetLayout = useCallback(() => {
    setPinnedNodes(new Set());
    
    if (simulationRef.current && nodesRef.current) {
      const zigzagPositions = calculateZigzagPositions(entries);
      
      nodesRef.current.forEach((node, index) => {
        node.fx = null;
        node.fy = null;
        if (zigzagPositions[index]) {
          node.x = zigzagPositions[index].x;
          node.y = zigzagPositions[index].y;
        }
      });
      
      simulationRef.current.alpha(1).restart();
    }
  }, [entries, calculateZigzagPositions]);

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

  // Get hovered node data for cards
  const hoveredNodeData = hoveredNode ? 
    nodesRef.current.find(node => node.id === hoveredNode) : null;

  return (
    <div className={`relative ${className}`}>
      {/* SVG Container */}
      <div
        className="relative border border-slate-700 rounded-lg overflow-visible bg-slate-900/50"
        style={{ width, height }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0"
          style={{ width: `${width}px`, height: `${height}px` }}
        />

        {/* Hover Cards - Only visible on hover */}
        <AnimatePresence>
          {hoveredNodeData && !editingCard && (
            <React.Fragment>
              <TimelineHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'patient')}
                type="patient"
                isVisible={true}
                isEditing={false}
                onEdit={handleEditCard}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
              />
              <TimelineHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'clinical')}
                type="clinical"
                isVisible={true}
                isEditing={false}
                onEdit={handleEditCard}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
              />
            </React.Fragment>
          )}
        </AnimatePresence>

        {/* Editing Cards */}
        <AnimatePresence>
          {editingCard && hoveredNodeData && hoveredNodeData.id === editingCard.nodeId && (
            <React.Fragment>
              <TimelineHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'patient')}
                type="patient"
                isVisible={editingCard.type === 'patient'}
                isEditing={editingCard.type === 'patient'}
                onEdit={handleEditCard}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
              />
              <TimelineHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'clinical')}
                type="clinical"
                isVisible={editingCard.type === 'clinical'}
                isEditing={editingCard.type === 'clinical'}
                onEdit={handleEditCard}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
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
      <div className="mt-2 text-xs text-slate-500 space-y-1">
        <p>• <strong>Drag</strong> nodes to reposition with physics • <strong>Click</strong> to pin/unpin • <strong>Hover</strong> for editable cards</p>
        <p>• <strong>Click connection lines</strong> to insert new entries • Cards auto-save when clicking outside</p>
      </div>
    </div>
  );
};

// For backward compatibility, export with original name
const AngularTimeline = D3PhysicsTimeline;
AngularTimeline.displayName = 'AngularTimeline';

export default AngularTimeline;