// D3 Physics Timeline - Refined with proper node interactions and card behavior  
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, Edit3, Save, X, Trash2 } from 'lucide-react';
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
  type,
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
  const bgColor = type === 'patient' ? 'bg-green-800/95' : 'bg-blue-800/95';
  const borderColor = type === 'patient' ? 'border-green-400' : 'border-blue-400';
  const glowColor = type === 'patient' ? 'shadow-green-400/30' : 'shadow-blue-400/30';
  
  // Enhanced styling when editing
  const editingStyles = isEditing ? 'ring-2 ring-yellow-400 ring-opacity-60' : '';
  const cardOpacity = isEditing ? 'opacity-100' : 'opacity-90';

  if (!isVisible) return null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`absolute z-50 ${bgColor} ${cardOpacity} ${editingStyles} backdrop-blur-md rounded-lg border-2 ${borderColor} shadow-xl ${glowColor} p-4 w-80 cursor-pointer`}
      style={{
        left: position.x,
        top: position.y,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
      }}
      onClick={handleCardClick}
    >
      {/* Connection line to node - more visible */}
      <div 
        className={`absolute w-1 h-8 ${type === 'patient' ? 'bg-green-400' : 'bg-blue-400'} shadow-lg`}
        style={{
          [position.anchorSide]: '-2px',
          [position.anchorPosition]: '16px',
          boxShadow: `0 0 8px ${type === 'patient' ? '#34d399' : '#60a5fa'}`
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
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
            <Save size={12} />
          </motion.button>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm placeholder-slate-400 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none"
            placeholder={`Enter ${cardTitle.toLowerCase()}...`}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div className="text-xs text-slate-400">Click outside to save</div>
        </div>
      ) : (
        <div className="text-slate-200 text-sm leading-relaxed">
          {cardContent ? (
            <div className="max-h-16 overflow-y-auto">
              <p>{cardContent}</p>
            </div>
          ) : (
            <p className="text-slate-400 italic">
              Click to add {cardTitle.toLowerCase()}
            </p>
          )}
        </div>
      )}

      {/* Timestamp */}
      {!isEditing && entry.timestamp && (
        <div className="mt-2 pt-1 border-t border-slate-600">
          <span className="text-xs text-slate-400">
            {new Date(entry.timestamp).toLocaleString()}
          </span>
        </div>
      )}
    </motion.div>
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
  const containerRef = useRef(null);
  
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [entries, setEntries] = useState(initialEntries);
  const [editingCard, setEditingCard] = useState(null); // {nodeId, type}
  const [newNodeIds, setNewNodeIds] = useState(new Set()); // Track genuinely new nodes
  const [undoStack, setUndoStack] = useState([]); // Undo functionality
  const [contextMenu, setContextMenu] = useState(null); // Right-click context menu

  // Enhanced save functionality with undo support
  const saveTimelineChanges = useCallback(async (nodeId, updatedEntries, createUndoPoint = true) => {
    if (createUndoPoint) {
      // Create undo point before making changes
      setUndoStack(prev => [...prev.slice(-9), entries]); // Keep last 10 states
    }
    
    setEntries(updatedEntries);
    
    if (onEntryUpdate) {
      return await onEntryUpdate(updatedEntries, { force: false });
    }
    return { success: true };
  }, [entries, onEntryUpdate]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setUndoStack(prev => prev.slice(0, -1));
      setEntries(previousState);
      setEditingCard(null); // Close any editing
      
      if (onEntryUpdate) {
        onEntryUpdate(previousState, { force: true });
      }
    }
  }, [undoStack, onEntryUpdate]);

  // Handle saving current editing cards with content check
  const handleSaveCurrentEditingCards = useCallback(async (closeAfterSave = true) => {
    if (!editingCard) return;
    
    const node = nodesRef.current?.find(n => n.id === editingCard.nodeId);
    if (!node) return;
    
    // Get current card content (this would come from the card components)
    const currentEntry = entries.find(entry => entry.id === editingCard.nodeId);
    if (!currentEntry) return;
    
    // Check if both cards are empty - if so, skip saving
    const hasPatientContent = currentEntry.patient_narrative && currentEntry.patient_narrative.trim();
    const hasClinicalContent = currentEntry.clinical_notes && currentEntry.clinical_notes.trim();
    
    if (!hasPatientContent && !hasClinicalContent) {
      // Skip saving empty cards
      if (closeAfterSave) {
        setEditingCard(null);
        setHoveredNode(null);
      }
      return;
    }
    
    // Save the timeline changes
    await saveTimelineChanges(editingCard.nodeId, entries, true);
    
    if (closeAfterSave) {
      setEditingCard(null);
      setHoveredNode(null);
    }
  }, [editingCard, entries, saveTimelineChanges]);

  // Delete node functionality
  const handleDeleteNode = useCallback(async (nodeId) => {
    const nodeToDelete = entries.find(entry => entry.id === nodeId);
    if (!nodeToDelete) return;
    
    // Create undo point
    setUndoStack(prev => [...prev.slice(-9), entries]);
    
    // Remove the node
    const updatedEntries = entries.filter(entry => entry.id !== nodeId);
    setEntries(updatedEntries);
    setEditingCard(null); // Close any editing
    setContextMenu(null); // Close context menu
    
    if (onEntryUpdate) {
      await onEntryUpdate(updatedEntries, { force: true });
    }
  }, [entries, onEntryUpdate]);

  // Color scale for different entry types
  const color = scaleOrdinal(schemeCategory10);

  // Calculate zigzag positions based on chronological order - with fixed first node
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
      // First node is always on the left, then alternates
      x: centerX + (index % 2 === 0 ? -horizontalOffset : horizontalOffset),
      y: startY + (index * verticalSpacing),
      side: index % 2 === 0 ? 'left' : 'right',
      patient_narrative: entry.patient_narrative || '',
      clinical_notes: entry.clinical_notes || '',
      symptoms: entry.symptoms || [],
      data: entry,
      // Add positioning info for cards
      isFirstNode: index === 0
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

  // Calculate card position based on node position and zigzag side - improved alignment and visibility
  const calculateCardPosition = useCallback((node, cardType) => {
    if (!node) return { x: 0, y: 0 };
    
    // Use target positions for stable card placement, fall back to current position
    const nodeX = node.targetX || node.x || 0;
    const nodeY = node.targetY || node.y || 0;
    const isLeftBend = node.side === 'left';
    const cardWidth = 320; // Increased card width
    const cardHeight = 140; // Increased card height
    const cardOffset = 45; // Increased offset for better separation
    
    let position = {};

    if (cardType === 'patient') {
      if (isLeftBend) {
        // Left bend: Patient card from bottom-right of node, aligned horizontally
        position = {
          x: nodeX + cardOffset,
          y: nodeY - (cardHeight / 2), // Center vertically with node
          anchorSide: 'left',
          anchorPosition: 'center'
        };
      } else {
        // Right bend: Patient card from top-right of node, aligned horizontally
        position = {
          x: nodeX + cardOffset,
          y: nodeY - (cardHeight / 2), // Center vertically with node
          anchorSide: 'left', 
          anchorPosition: 'center'
        };
      }
    } else {
      // Clinical card
      if (isLeftBend) {
        // Left bend: Clinical card from top-left of node, aligned horizontally
        position = {
          x: nodeX - cardWidth - cardOffset,
          y: nodeY - (cardHeight / 2), // Center vertically with node
          anchorSide: 'right',
          anchorPosition: 'center'
        };
      } else {
        // Right bend: Clinical card from bottom-left of node, aligned horizontally
        position = {
          x: nodeX - cardWidth - cardOffset,
          y: nodeY - (cardHeight / 2), // Center vertically with node
          anchorSide: 'right',
          anchorPosition: 'center'
        };
      }
    }

    // Ensure cards stay within container bounds - improved bounds checking
    const containerPadding = 40;
    const maxX = width - cardWidth - containerPadding;
    const maxY = Math.max(height * 0.8, 600) - cardHeight - containerPadding; // Use larger available height
    
    position.x = Math.max(containerPadding, Math.min(position.x, maxX));
    position.y = Math.max(containerPadding, Math.min(position.y, maxY));

    return position;
  }, [width, height]);

  // Helper functions - defined before initializeSimulation
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

  // Handle hover with improved stability
  const handleNodeHover = useCallback((nodeId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Set immediately without delay for more responsive hover
    setHoveredNode(nodeId);
  }, []);

  const handleNodeLeave = useCallback(() => {
    // Don't hide cards if we're in editing mode
    if (editingCard) {
      return;
    }
    
    // Use a slightly longer delay to prevent flashing when moving between cards and nodes
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNode(null);
    }, 150); // Increased delay for more stable hover
  }, [editingCard]);

  // Auto-scroll to ensure cards are visible
  const ensureCardsVisible = useCallback((nodeId) => {
    if (!containerRef.current || !nodeId) return;

    const node = nodesRef.current?.find(n => n.id === nodeId);
    if (!node) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate card positions
    const patientCardPos = calculateCardPosition(node, 'patient');
    const clinicalCardPos = calculateCardPosition(node, 'clinical');
    
    // Find the bounds that encompass both cards and the node
    const minX = Math.min(node.x - 50, clinicalCardPos.x);
    const maxX = Math.max(node.x + 50, patientCardPos.x + 320);
    const minY = Math.min(node.y - 70, Math.min(patientCardPos.y, clinicalCardPos.y));
    const maxY = Math.max(node.y + 70, Math.max(patientCardPos.y + 140, clinicalCardPos.y + 140));
    
    // Calculate required scroll adjustments
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    let newScrollLeft = scrollLeft;
    let newScrollTop = scrollTop;
    
    // Adjust horizontal scroll if needed
    if (minX < scrollLeft) {
      newScrollLeft = Math.max(0, minX - 50);
    } else if (maxX > scrollLeft + containerWidth) {
      newScrollLeft = maxX - containerWidth + 50;
    }
    
    // Adjust vertical scroll if needed
    if (minY < scrollTop) {
      newScrollTop = Math.max(0, minY - 50);
    } else if (maxY > scrollTop + containerHeight) {
      newScrollTop = maxY - containerHeight + 50;
    }
    
    // Smooth scroll to the new position
    if (newScrollLeft !== scrollLeft || newScrollTop !== scrollTop) {
      container.scrollTo({
        left: newScrollLeft,
        top: newScrollTop,
        behavior: 'smooth'
      });
    }
  }, [calculateCardPosition]);

  // Click for editing cards - enable editing both cards on click
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current) return;

    const nodes = calculateZigzagPositions(entries);
    const links = createTimelineLinks(nodes);
    
    // Preserve existing node positions if they exist (but don't use pinned state)
    const existingNodes = nodesRef.current || [];
    nodes.forEach(node => {
      const existing = existingNodes.find(n => n.id === node.id);
      if (existing && !newNodeIds.has(node.id)) {
        // Preserve existing position but ensure it stays close to zigzag structure
        const targetX = node.x;
        const targetY = node.y;
        node.x = existing.x || targetX;
        node.y = existing.y || targetY;
        // Store target positions for constraint forces
        node.targetX = targetX;
        node.targetY = targetY;
      } else {
        // New nodes start at target position
        node.targetX = node.x;
        node.targetY = node.y;
      }
    });
    
    nodesRef.current = nodes;
    linksRef.current = links;

    // Stop existing simulation before creating new one
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create force simulation with strong zigzag position constraints
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links)
        .id(d => d.id)
        .distance(120)
        .strength(0.1) // Weaker link force
      )
      .force("charge", forceManyBody()
        .strength(-50) // Weaker repulsion
        .distanceMax(150)
      )
      // Strong position constraints to maintain zigzag
      .force("x", forceX(d => d.targetX).strength(0.8))
      .force("y", forceY(d => d.targetY).strength(0.8))
      .velocityDecay(0.8)
      .alphaDecay(0.05)
      .alphaMin(0.001);

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
      .attr("stroke", d => {
        // Glowing highlight for editing node
        if (editingCard && editingCard.nodeId === d.id) {
          return "#fbbf24"; // Amber glow for editing
        }
        return "#fff";
      })
      .attr("stroke-width", d => {
        if (editingCard && editingCard.nodeId === d.id) {
          return 4; // Thicker stroke for editing
        }
        return 2;
      })
      .style("cursor", "pointer")
      .style("transition", "none") // Remove CSS transitions that can interfere
      .style("filter", d => {
        // Add glow effect for editing node
        if (editingCard && editingCard.nodeId === d.id) {
          return "drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))";
        }
        return "none";
      });

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

    // Drag behavior - with improved constraint handling
    const dragBehavior = drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.1).restart();
        
        // Temporarily fix position for dragging
        d.fx = d.x;
        d.fy = d.y;
        
        // Visual feedback - NO TRANSITIONS to avoid interfering with D3
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
        if (nearestPosition) {
          // Update both current and target positions
          d.fx = nearestPosition.x;
          d.fy = nearestPosition.y;
          d.targetX = nearestPosition.x;
          d.targetY = nearestPosition.y;
          // Update zigzag structure
          reorderTimelineStructure(d.id, nearestPosition.index);
        } else {
          // Return to constraint position
          d.fx = null;
          d.fy = null;
          // Let constraints pull it back to target position
        }
        
        // Reset visual feedback - NO TRANSITIONS
        select(event.sourceEvent.target)
          .attr("r", 12)
          .attr("stroke-width", 2)
          .style("filter", "none");
      });

    // Apply drag behavior
    node.call(dragBehavior);

    // Enhanced click for editing cards - auto-save and switch behavior
    node.on("click", (event, d) => {
      event.stopPropagation();
      
      // If clicking the same node that's already being edited, save and close
      if (editingCard && editingCard.nodeId === d.id) {
        handleSaveCurrentEditingCards();
        return;
      }
      
      // If editing a different node, save current node first
      if (editingCard && editingCard.nodeId !== d.id) {
        handleSaveCurrentEditingCards(false); // Don't close, we're switching
      }
      
      // Ensure proper positioning
      d.fx = d.x;
      d.fy = d.y;
      
      // Start editing mode for this node (both cards become editable)
      setEditingCard({ nodeId: d.id, type: 'both' });
      
      // Show the node as hovered to display cards
      setHoveredNode(d.id);
      
      // Auto-scroll to ensure cards are visible
      setTimeout(() => {
        ensureCardsVisible(d.id);
      }, 100); // Small delay to ensure state is updated
      
      simulation.restart();
    });

    // Right-click context menu for node deletion
    node.on("contextmenu", (event, d) => {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = containerRef.current.getBoundingClientRect();
      setContextMenu({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        nodeId: d.id,
        nodeTitle: d.title || `Entry ${d.orderIndex + 1}`
      });
    });

    // Hover effects - NO TRANSITIONS to prevent interference with D3
    node
      .on("mouseenter", (event, d) => {
        handleNodeHover(d.id);
        // Direct DOM manipulation without transitions
        select(event.target)
          .attr("r", 16)
          .style("filter", "drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))");
      })
      .on("mouseleave", (event, d) => {
        handleNodeLeave();
        // Direct DOM manipulation without transitions
        select(event.target)
          .attr("r", 12)
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
  }, [entries, width, height, color, newNodeIds, calculateZigzagPositions, createTimelineLinks, handleNodeHover, handleNodeLeave, findNearestTimelinePosition, reorderTimelineStructure, insertNewNode]);

  // Initialize simulation when entries change - with proper state management to prevent resets
  useEffect(() => {
    // Only initialize if we have entries and the simulation doesn't exist or entries actually changed
    if (entries.length > 0) {
      const currentEntryIds = entries.map(e => e.id).sort().join(',');
      const existingEntryIds = nodesRef.current.map(n => n.id).sort().join(',');
      
      // Only re-initialize if entries actually changed, not on hover or other state changes
      if (currentEntryIds !== existingEntryIds || !simulationRef.current) {
        initializeSimulation();
      }
    }
    
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [entries.length, entries.map(e => e.id).join(',')]); // Only depend on entry count and IDs, not full entries object

  // Separate effect for cleanup only
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  // Keyboard navigation for Tab between cards
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!editingCard) return;
      
      if (event.key === 'Tab') {
        event.preventDefault();
        // Tab navigation between cards would be handled by the card components
        // This is a placeholder for the tab navigation logic
      }
    };

    if (editingCard) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [editingCard]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu]);

  // Click outside detection to close editing mode with save
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If we're in editing mode and the click is outside the timeline container
      if (editingCard && containerRef.current && !containerRef.current.contains(event.target)) {
        // Save and close editing mode
        handleSaveCurrentEditingCards();
      }
    };

    // Add event listener when in editing mode
    if (editingCard) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editingCard, handleSaveCurrentEditingCards]);

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

  // Handle reset layout - simplified without pin state
  const handleResetLayout = useCallback(() => {
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

  // Get hovered node data for cards - with stable reference and fallback
  const hoveredNodeData = useMemo(() => {
    if (!hoveredNode) return null;
    
    // First try to find in current nodesRef
    let node = nodesRef.current?.find(node => node.id === hoveredNode);
    
    // If not found, try to find in entries and create stable node data
    if (!node) {
      const entry = entries.find(e => e.id === hoveredNode);
      if (entry) {
        const zigzagPositions = calculateZigzagPositions(entries);
        node = zigzagPositions.find(n => n.id === hoveredNode);
      }
    }
    
    return node;
  }, [hoveredNode, entries, calculateZigzagPositions]);

  return (
    <div className={`relative ${className}`}>
      {/* Timeline Container with Minimalist Scroll - Expanded for better card visibility */}
      <div
        ref={containerRef}
        className="relative border border-slate-700 rounded-lg bg-slate-900/50 mx-auto timeline-scroll-container"
        style={{ 
          width: Math.max(width, 1000), // Minimum width for card visibility
          height: Math.max(height, 500), // Minimum height for better layout
          maxHeight: '75vh', // Increased max height
          overflow: 'auto'
        }}
      >
        <svg
          ref={svgRef}
          className="min-h-full"
          style={{ 
            width: `${Math.max(width, 1000)}px`, // Ensure SVG matches container width
            height: `${Math.max(height, entries.length * 150 + 200)}px` // Increased spacing for better card positioning
          }}
        />

        {/* Hover Cards - Only visible on hover when not editing */}
        <AnimatePresence>
          {hoveredNodeData && !editingCard && (
            <>
              <TimelineHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'patient')}
                type="patient"
                isVisible={true}
                isEditing={false}
                onEdit={(nodeId, type) => {
                  setEditingCard({ nodeId, type: 'both' });
                }}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
              />
              <TimelineHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'clinical')}
                type="clinical"
                isVisible={true}
                isEditing={false}
                onEdit={(nodeId, type) => {
                  setEditingCard({ nodeId, type: 'both' });
                }}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
              />
            </>
          )}
        </AnimatePresence>

        {/* Editing Cards - Show both cards when editing */}
        <AnimatePresence>
          {editingCard && hoveredNodeData && hoveredNodeData.id === editingCard.nodeId && (
            <>
              {/* Patient Card */}
              <TimelineHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'patient')}
                type="patient"
                isVisible={true}
                isEditing={editingCard.type === 'both' || editingCard.type === 'patient'}
                onEdit={handleEditCard}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
              />
              {/* Clinical Card */}
              <TimelineHoverCard
                entry={hoveredNodeData}
                position={calculateCardPosition(hoveredNodeData, 'clinical')}
                type="clinical"
                isVisible={true}
                isEditing={editingCard.type === 'both' || editingCard.type === 'clinical'}
                onEdit={handleEditCard}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
              />
            </>
          )}
        </AnimatePresence>

        {/* Right-click Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-2 min-w-[150px]"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`
              }}
            >
              <div className="px-3 py-1 text-xs text-slate-400 border-b border-slate-600 mb-1">
                {contextMenu.nodeTitle}
              </div>
              <button
                onClick={() => handleDeleteNode(contextMenu.nodeId)}
                className="w-full px-3 py-2 text-sm text-red-300 hover:bg-red-600/20 transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete Node
              </button>
            </motion.div>
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

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
              undoStack.length > 0 
                ? 'bg-amber-600 text-white hover:bg-amber-700' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={16} />
            Undo ({undoStack.length})
          </motion.button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-4">
          <span>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
          {editingCard && (
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              Editing
            </span>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-slate-500 space-y-1">
        <p>• <strong>Click</strong> nodes to edit both cards • <strong>Hover</strong> to preview patient/clinical cards • <strong>Drag</strong> to reposition</p>
        <p>• <strong>Click connection lines</strong> to insert new entries • <strong>Click outside cards</strong> to finish editing</p>
      </div>
    </div>
  );
};

// For backward compatibility, export with original name
const AngularTimeline = D3PhysicsTimeline;
AngularTimeline.displayName = 'AngularTimeline';

export default AngularTimeline;