// Hybrid Angular Timeline - D3 Nodes with Scrollable Container
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Save,
  Loader2,
  User,
  Brain,
  Pin
} from 'lucide-react';
import { select, drag } from 'd3-selection';
import { forceSimulation, forceManyBody, forceCenter, forceCollide } from 'd3-force';

// Minimal animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } }
};

const AngularTimeline = React.memo(({ 
  timeline = [], 
  onUpdateTimeline, 
  isLoading = false,
  addToast 
}) => {
  const [entries, setEntries] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [hoveredEntryId, setHoveredEntryId] = useState(null);
  const [pinnedNodes, setPinnedNodes] = useState(new Set());
  const timelineContainerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesRef = useRef([]);

  // Layout constants - optimized for scrollable container
  const TIMELINE_WIDTH = 600;
  const TIMELINE_HEIGHT = 350; // Fixed visible height
  const ZIGZAG_AMPLITUDE = 60;
  const BASE_VERTICAL_SPACING = 100;
  const NODE_RADIUS = 18;
  const CARD_OFFSET = 35;

  // Calculate dynamic timeline height based on entries
  const dynamicTimelineHeight = useMemo(() => {
    return Math.max(TIMELINE_HEIGHT, entries.length * BASE_VERTICAL_SPACING + 200);
  }, [entries.length]);

  // Process entries
  const processedEntries = useMemo(() => {
    return (timeline || []).map((entry, index) => ({
      id: entry.id || `entry-${Date.now()}-${index}`,
      date: entry.date || new Date().toISOString(),
      patientNarrative: entry.patientNarrative || '',
      clinicalNotes: entry.clinicalNotes || '',
      orderIndex: entry.orderIndex || index,
      ...entry
    })).sort((a, b) => a.orderIndex - b.orderIndex);
  }, [timeline]);

  // Initialize entries
  useEffect(() => {
    setEntries(processedEntries);
  }, [processedEntries]);

  // D3 node positioning with constraints
  const getInitialNodePosition = useCallback((index) => {
    const isLeft = index % 2 === 0;
    const x = TIMELINE_WIDTH / 2 + (isLeft ? -ZIGZAG_AMPLITUDE : ZIGZAG_AMPLITUDE);
    const y = 80 + (index * BASE_VERTICAL_SPACING);
    
    return { x, y, side: isLeft ? 'left' : 'right' };
  }, []);

  // Initialize D3 simulation for nodes only
  useEffect(() => {
    if (entries.length === 0 || !svgRef.current) return;

    // Create D3 nodes with initial positions
    const nodes = entries.map((entry, index) => {
      const initialPos = getInitialNodePosition(index);
      return {
        id: entry.id,
        index,
        x: initialPos.x,
        y: initialPos.y,
        fx: pinnedNodes.has(entry.id) ? initialPos.x : undefined,
        fy: pinnedNodes.has(entry.id) ? initialPos.y : undefined,
        entry,
        side: initialPos.side
      };
    });

    nodesRef.current = nodes;

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create localized D3 simulation
    simulationRef.current = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-50))
      .force('center', forceCenter(TIMELINE_WIDTH / 2, dynamicTimelineHeight / 2))
      .force('collision', forceCollide().radius(NODE_RADIUS + 10))
      .alpha(0.1)
      .alphaDecay(0.1);

    // Create SVG container
    const svg = select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    // Create timeline path
    const pathData = nodes.map((node, i) => 
      `${i === 0 ? 'M' : 'L'} ${node.x} ${node.y}`
    ).join(' ');

    svg.append('path')
      .attr('d', pathData)
      .attr('stroke', 'url(#timelineGradient)')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.7);

    // Create gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'timelineGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#64748B');
    gradient.append('stop').attr('offset', '50%').attr('stop-color', '#3B82F6');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#8B5CF6');

    // Create draggable nodes
    const nodeGroups = svg.selectAll('.timeline-node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'timeline-node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'move');

    // Add node circles
    nodeGroups.append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', d => {
        if (editingEntryId === d.id) return '#2563EB';
        if (pinnedNodes.has(d.id)) return '#7C3AED';
        if (hoveredEntryId === d.id) return '#374151';
        return '#1E293B';
      })
      .attr('stroke', d => {
        if (editingEntryId === d.id) return '#60A5FA';
        if (pinnedNodes.has(d.id)) return '#A78BFA';
        if (hoveredEntryId === d.id) return '#6B7280';
        return '#475569';
      })
      .attr('stroke-width', 2);

    // Add calendar icons (simplified as text)
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', d => (editingEntryId === d.id || pinnedNodes.has(d.id)) ? 'white' : '#94A3B8')
      .attr('font-size', '10px')
      .text('📅');

    // Add pin indicators
    nodeGroups.filter(d => pinnedNodes.has(d.id))
      .append('circle')
      .attr('r', 4)
      .attr('cx', NODE_RADIUS - 5)
      .attr('cy', -NODE_RADIUS + 5)  
      .attr('fill', '#A78BFA');

    // Add date labels
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', NODE_RADIUS + 20)
      .attr('fill', '#6B7280')
      .attr('font-size', '10px')
      .text(d => new Date(d.entry.date).toLocaleDateString([], { month: 'short', day: 'numeric' }));

    // Add D3 drag behavior
    const dragBehavior = drag()
      .on('start', function(event, d) {
        if (!pinnedNodes.has(d.id)) {
          d.fx = d.x;
          d.fy = d.y;
        }
        if (simulationRef.current) {
          simulationRef.current.alphaTarget(0.1).restart();
        }
      })
      .on('drag', function(event, d) {
        d.fx = Math.max(NODE_RADIUS, Math.min(TIMELINE_WIDTH - NODE_RADIUS, event.x));
        d.fy = Math.max(NODE_RADIUS, Math.min(dynamicTimelineHeight - NODE_RADIUS, event.y));
        
        // Update visual position immediately
        select(this).attr('transform', `translate(${d.fx}, ${d.fy})`);
        
        if (simulationRef.current) {
          simulationRef.current.alpha(0.1).restart();
        }
        
        // Scroll to follow dragged node
        const container = timelineContainerRef.current;
        if (container && d.fy) {
          const containerHeight = container.clientHeight;
          const scrollTop = container.scrollTop;
          const nodeVisibleY = d.fy - scrollTop;
          
          // Auto-scroll if node is near edges
          if (nodeVisibleY < 50) {
            container.scrollTop = Math.max(0, d.fy - 100);
          } else if (nodeVisibleY > containerHeight - 50) {
            container.scrollTop = d.fy - containerHeight + 100;
          }
        }
      })
      .on('end', function(event, d) {
        if (!pinnedNodes.has(d.id)) {
          delete d.fx;
          delete d.fy;
        }
        if (simulationRef.current) {
          simulationRef.current.alphaTarget(0);
        }
      });

    // Apply drag behavior and event handlers
    nodeGroups
      .call(dragBehavior)
      .on('mouseenter', function(event, d) {
        setHoveredEntryId(d.id);
        select(this).select('circle')
          .attr('fill', '#374151')
          .attr('stroke', '#6B7280');
      })
      .on('mouseleave', function(event, d) {
        setHoveredEntryId(null);
        const circle = select(this).select('circle');
        if (editingEntryId === d.id) {
          circle.attr('fill', '#2563EB').attr('stroke', '#60A5FA');
        } else if (pinnedNodes.has(d.id)) {
          circle.attr('fill', '#7C3AED').attr('stroke', '#A78BFA');
        } else {
          circle.attr('fill', '#1E293B').attr('stroke', '#475569');
        }
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        setEditingEntryId(editingEntryId === d.id ? null : d.id);
        
        // Scroll to show the clicked node
        scrollToNode(d.id);
      })
      .on('dblclick', function(event, d) {
        event.stopPropagation();
        const newPinnedNodes = new Set(pinnedNodes);
        if (pinnedNodes.has(d.id)) {
          newPinnedNodes.delete(d.id);
          delete d.fx;
          delete d.fy;
        } else {
          newPinnedNodes.add(d.id);
          d.fx = d.x;
          d.fy = d.y;
        }
        setPinnedNodes(newPinnedNodes);
        
        // Update pin indicator
        select(this).selectAll('circle').remove();
        select(this).append('circle')
          .attr('r', NODE_RADIUS)
          .attr('fill', newPinnedNodes.has(d.id) ? '#7C3AED' : '#1E293B')
          .attr('stroke', newPinnedNodes.has(d.id) ? '#A78BFA' : '#475569')
          .attr('stroke-width', 2);
          
        if (newPinnedNodes.has(d.id)) {
          select(this).append('circle')
            .attr('r', 4)
            .attr('cx', NODE_RADIUS - 5)
            .attr('cy', -NODE_RADIUS + 5)  
            .attr('fill', '#A78BFA');
        }
      });

    // Update simulation tick
    if (simulationRef.current) {
      simulationRef.current.on('tick', () => {
        nodeGroups.attr('transform', d => `translate(${d.x}, ${d.y})`);
        
        // Update timeline path
        const newPathData = nodes.map((node, i) => 
          `${i === 0 ? 'M' : 'L'} ${node.x} ${node.y}`
        ).join(' ');
        
        svg.select('path').attr('d', newPathData);
      });
    }

  }, [entries, pinnedNodes, editingEntryId, hoveredEntryId, dynamicTimelineHeight, getInitialNodePosition]);

  // Scroll to specific node
  const scrollToNode = useCallback((nodeId) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    const container = timelineContainerRef.current;
    
    if (node && container) {
      const targetScrollTop = Math.max(0, node.y - container.clientHeight / 2);
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, []);

  // Card positioning relative to nodes
  const getCardPositions = useCallback((nodeId) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return null;

    const cardWidth = 180;
    const cardHeight = 90;

    if (node.side === 'left') {
      return {
        patient: {
          x: node.x - CARD_OFFSET - cardWidth,
          y: node.y - cardHeight / 2 - 5
        },
        clinical: {
          x: node.x + CARD_OFFSET,
          y: node.y - cardHeight / 2 + 5
        }
      };
    } else {
      return {
        patient: {
          x: node.x - CARD_OFFSET - cardWidth,
          y: node.y - cardHeight / 2 + 5
        },
        clinical: {
          x: node.x + CARD_OFFSET,
          y: node.y - cardHeight / 2 - 5
        }
      };
    }
  }, []);

  // Entry management functions
  const updateEntry = useCallback((entryId, field, value) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, [field]: value } : entry
    ));
  }, []);

  const saveEntry = useCallback(async (entryId) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry || isLoading) return;

    try {
      const updatedTimeline = entries.map(e => e.id === entryId ? entry : e);
      if (onUpdateTimeline) {
        await onUpdateTimeline(updatedTimeline);
      }
      setEditingEntryId(null);
      addToast?.('Entry saved', 'success');
    } catch (error) {
      console.error('Error saving entry:', error);
      addToast?.('Save failed', 'error');
    }
  }, [entries, onUpdateTimeline, addToast, isLoading]);

  const addEntry = useCallback(() => {
    const newEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toISOString(),
      patientNarrative: '',
      clinicalNotes: '',
      orderIndex: entries.length,
      isNew: true
    };
    
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    setEditingEntryId(newEntry.id);
    
    if (onUpdateTimeline) {
      onUpdateTimeline(updatedEntries);
    }
    
    // Scroll to new entry after it's rendered
    setTimeout(() => {
      scrollToNode(newEntry.id);
    }, 100);
  }, [entries, onUpdateTimeline, scrollToNode]);

  // Render floating cards
  const renderFloatingCards = useCallback((entry) => {
    if (hoveredEntryId !== entry.id && editingEntryId !== entry.id) return null;

    const cardPositions = getCardPositions(entry.id);
    if (!cardPositions) return null;

    const isEditing = editingEntryId === entry.id;

    return (
      <motion.div
        key={`cards-${entry.id}`}
        className="absolute pointer-events-none"
        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
      >
        {/* Patient Card */}
        <div
          className={`absolute bg-slate-800/95 border border-slate-600 rounded-lg p-2 shadow-lg pointer-events-auto ${
            isEditing ? 'ring-1 ring-blue-400' : ''
          }`}
          style={{
            left: cardPositions.patient.x,
            top: cardPositions.patient.y,
            width: 180,
            height: 90
          }}
        >
          <div className="absolute w-1 h-1 bg-blue-400 rounded-full -right-0.5 -bottom-0.5" />
          
          <div className="flex items-center gap-1 mb-1">
            <User size={12} className="text-blue-400" />
            <h4 className="font-medium text-white text-xs">Patient</h4>
          </div>
          
          {isEditing ? (
            <textarea
              value={entry.patientNarrative}
              onChange={(e) => updateEntry(entry.id, 'patientNarrative', e.target.value)}
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-400 resize-none text-xs"
              placeholder="Patient narrative..."
              autoFocus
            />
          ) : (
            <p className="text-slate-300 text-xs leading-tight overflow-hidden">
              {entry.patientNarrative || (
                <span className="text-slate-500 italic">No content</span>
              )}
            </p>
          )}
        </div>

        {/* Clinical Card */}
        <div
          className={`absolute bg-slate-800/95 border border-slate-600 rounded-lg p-2 shadow-lg pointer-events-auto ${
            isEditing ? 'ring-1 ring-purple-400' : ''
          }`}
          style={{
            left: cardPositions.clinical.x,
            top: cardPositions.clinical.y,
            width: 180,
            height: 90
          }}
        >
          <div className="absolute w-1 h-1 bg-purple-400 rounded-full -left-0.5 -top-0.5" />
          
          <div className="flex items-center gap-1 mb-1">
            <Brain size={12} className="text-purple-400" />
            <h4 className="font-medium text-white text-xs">Clinical</h4>
          </div>
          
          {isEditing ? (
            <textarea
              value={entry.clinicalNotes}
              onChange={(e) => updateEntry(entry.id, 'clinicalNotes', e.target.value)}
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 focus:ring-1 focus:ring-purple-400 resize-none text-xs"
              placeholder="Clinical notes..."
            />
          ) : (
            <p className="text-slate-300 text-xs leading-tight overflow-hidden">
              {entry.clinicalNotes || (
                <span className="text-slate-500 italic">No notes</span>
              )}
            </p>
          )}
        </div>

        {/* Edit Controls */}
        {isEditing && (
          <div 
            className="absolute pointer-events-auto bg-slate-800 border border-slate-600 rounded p-1 shadow-lg z-50"
            style={{
              left: (nodesRef.current.find(n => n.id === entry.id)?.x || 0) - 40,
              top: (nodesRef.current.find(n => n.id === entry.id)?.y || 0) + 35
            }}
          >
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingEntryId(null);
                }}
                className="px-2 py-1 text-slate-300 hover:text-white border border-slate-600 rounded hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveEntry(entry.id);
                }}
                disabled={isLoading}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
              >
                {isLoading ? <Loader2 size={8} className="animate-spin" /> : <Save size={8} />}
                Save
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }, [hoveredEntryId, editingEntryId, getCardPositions, updateEntry, saveEntry, isLoading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  return (
    <motion.div
      className="h-full p-3 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Clock size={14} className="text-cyan-400" />
          Timeline
          <span className="text-xs text-slate-500">Drag • Double-click to pin</span>
        </h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Scrollable Timeline Container */}
      <div 
        ref={timelineContainerRef}
        className="relative bg-slate-900/40 rounded border border-slate-700 mx-auto overflow-y-auto"
        style={{ 
          width: TIMELINE_WIDTH, 
          height: TIMELINE_HEIGHT,
          scrollBehavior: 'smooth'
        }}
      >
        {entries.length > 0 ? (
          <>
            {/* D3 SVG Container */}
            <svg
              ref={svgRef}
              width={TIMELINE_WIDTH}
              height={dynamicTimelineHeight}
              className="absolute top-0 left-0"
              style={{ zIndex: 1 }}
            />
            
            {/* Floating Cards Layer */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
              {entries.map((entry) => renderFloatingCards(entry))}
            </div>
          </>
        ) : (
          // Empty State
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Clock size={24} className="text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-slate-400 mb-1">No Entries</h4>
              <p className="text-slate-500 text-xs mb-2">Add your first timeline entry</p>
              <button
                onClick={addEntry}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs mx-auto"
              >
                <Plus size={10} />
                Add Entry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close edit */}
      {editingEntryId && (
        <div 
          className="fixed inset-0 z-15" 
          onClick={() => setEditingEntryId(null)}
        />
      )}
    </motion.div>
  );
});

AngularTimeline.displayName = 'AngularTimeline';

export default AngularTimeline;