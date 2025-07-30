// Angular Timeline Component with D3-Inspired Physics - Optimized
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
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide } from 'd3-force';

// Optimized animation variants - reduced complexity
const timelineVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2, staggerChildren: 0.05 }
  }
};

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.2 }
  },
  popIn: {
    scale: [0.8, 1.05, 1],
    opacity: [0, 1],
    transition: { duration: 0.3 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.2 }
  }
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
  const [nodePositions, setNodePositions] = useState(new Map());
  const timelineRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const isDraggingRef = useRef(false);
  const updateTimeoutRef = useRef(null);

  // Optimized layout constants - smaller to fit modal better
  const TIMELINE_WIDTH = 600;
  const TIMELINE_HEIGHT = 350;
  const ZIGZAG_AMPLITUDE = 80; // Reduced from 150
  const VERTICAL_SPACING = 80; // Reduced from 120
  const NODE_RADIUS = 20; // Reduced from 24
  const CARD_OFFSET = 40; // Reduced from 100 - brings cards closer

  // Memoized entries processing
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
    if (processedEntries.length > 0) {
      // Debounce simulation initialization
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        initializeSimulation(processedEntries);
      }, 100);
    }
  }, [processedEntries]);

  // Optimized simulation initialization
  const initializeSimulation = useCallback((entriesData) => {
    if (entriesData.length === 0) return;

    // Create nodes with initial positions
    const nodes = entriesData.map((entry, index) => {
      const zigzagSide = index % 2 === 0 ? -1 : 1;
      const baseX = TIMELINE_WIDTH / 2 + (zigzagSide * ZIGZAG_AMPLITUDE);
      const baseY = 60 + (index * VERTICAL_SPACING);
      
      return {
        id: entry.id,
        index,
        x: baseX,
        y: baseY,
        fx: pinnedNodes.has(entry.id) ? baseX : undefined,
        fy: pinnedNodes.has(entry.id) ? baseY : undefined,
        entry,
        side: zigzagSide === -1 ? 'left' : 'right'
      };
    });

    // Create simplified links
    const links = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        source: nodes[i],
        target: nodes[i + 1],
        distance: VERTICAL_SPACING * 0.8
      });
    }

    nodesRef.current = nodes;
    linksRef.current = links;

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Optimized simulation with reduced forces
    simulationRef.current = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-30)) // Reduced from -100
      .force('center', forceCenter(TIMELINE_WIDTH / 2, TIMELINE_HEIGHT / 2))
      .force('link', forceLink(links).distance(d => d.distance).strength(0.1)) // Reduced strength
      .force('collision', forceCollide().radius(NODE_RADIUS + 5))
      .on('tick', throttledTick)
      .alpha(0.2) // Reduced from 0.3
      .alphaDecay(0.1); // Faster decay

  }, [pinnedNodes, TIMELINE_WIDTH, TIMELINE_HEIGHT, ZIGZAG_AMPLITUDE, VERTICAL_SPACING, NODE_RADIUS]);

  // Throttled tick function for better performance
  const throttledTick = useCallback(() => {
    if (updateTimeoutRef.current) return;
    
    updateTimeoutRef.current = setTimeout(() => {
      const newPositions = new Map();
      nodesRef.current.forEach(node => {
        newPositions.set(node.id, { x: node.x, y: node.y });
      });
      setNodePositions(newPositions);
      updateTimeoutRef.current = null;
    }, 16); // ~60fps
  }, []);

  // Optimized drag handlers
  const handleDragStart = useCallback((e, nodeId) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      node.fx = node.x;
      node.fy = node.y;
      simulationRef.current.alphaTarget(0.1).restart();
    }
  }, []);

  const handleDrag = useCallback((e, nodeId) => {
    if (!isDraggingRef.current) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      node.fx = Math.max(NODE_RADIUS, Math.min(TIMELINE_WIDTH - NODE_RADIUS, x));
      node.fy = Math.max(NODE_RADIUS, Math.min(TIMELINE_HEIGHT - NODE_RADIUS, y));
      
      simulationRef.current.alpha(0.1).restart();
    }
  }, [NODE_RADIUS, TIMELINE_WIDTH, TIMELINE_HEIGHT]);

  const handleDragEnd = useCallback((e, nodeId) => {
    isDraggingRef.current = false;
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      if (!pinnedNodes.has(nodeId)) {
        delete node.fx;
        delete node.fy;
      }
      simulationRef.current.alphaTarget(0);
    }
  }, [pinnedNodes]);

  // Optimized node click handler
  const handleNodeClick = useCallback((nodeId) => {
    if (isDraggingRef.current) return;
    
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;

    const newPinnedNodes = new Set(pinnedNodes);
    
    if (pinnedNodes.has(nodeId)) {
      newPinnedNodes.delete(nodeId);
      delete node.fx;
      delete node.fy;
      if (simulationRef.current) {
        simulationRef.current.alpha(0.1).restart();
      }
    } else {
      newPinnedNodes.add(nodeId);
      node.fx = node.x;
      node.fy = node.y;
    }
    
    setPinnedNodes(newPinnedNodes);
  }, [pinnedNodes]);

  // Optimized card positions - closer to nodes
  const getCardPositions = useCallback((nodeId) => {
    const position = nodePositions.get(nodeId);
    if (!position) return null;

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return null;

    const { x: nodeX, y: nodeY } = position;
    const cardWidth = 200; // Reduced from 280
    const cardHeight = 100; // Reduced from 120

    if (node.side === 'left') {
      return {
        patient: {
          x: nodeX - CARD_OFFSET - cardWidth,
          y: nodeY - cardHeight / 2 - 5,
          anchorX: nodeX - NODE_RADIUS * 0.7,
          anchorY: nodeY + NODE_RADIUS * 0.7
        },
        clinical: {
          x: nodeX + CARD_OFFSET,
          y: nodeY - cardHeight / 2 + 5,
          anchorX: nodeX + NODE_RADIUS * 0.7,
          anchorY: nodeY - NODE_RADIUS * 0.7
        }
      };
    } else {
      return {
        patient: {
          x: nodeX - CARD_OFFSET - cardWidth,
          y: nodeY - cardHeight / 2 + 5,
          anchorX: nodeX - NODE_RADIUS * 0.7,
          anchorY: nodeY + NODE_RADIUS * 0.7
        },
        clinical: {
          x: nodeX + CARD_OFFSET,
          y: nodeY - cardHeight / 2 - 5,
          anchorX: nodeX + NODE_RADIUS * 0.7,
          anchorY: nodeY - NODE_RADIUS * 0.7
        }
      };
    }
  }, [nodePositions, NODE_RADIUS, CARD_OFFSET]);

  // Memoized update and save functions
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
      addToast?.('Timeline entry updated successfully', 'success');
    } catch (error) {
      console.error('Error saving timeline entry:', error);
      addToast?.('Failed to save timeline entry', 'error');
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
  }, [entries, onUpdateTimeline]);

  // Optimized path generation
  const timelinePath = useMemo(() => {
    if (nodesRef.current.length === 0) return '';
    
    let pathData = '';
    nodesRef.current.forEach((node, index) => {
      const position = nodePositions.get(node.id);
      if (position) {
        pathData += index === 0 ? `M ${position.x} ${position.y}` : ` L ${position.x} ${position.y}`;
      }
    });
    return pathData;
  }, [nodePositions]);

  // Optimized floating cards render
  const renderFloatingCards = useCallback((entry) => {
    if (hoveredEntryId !== entry.id && editingEntryId !== entry.id) return null;

    const cardPositions = getCardPositions(entry.id);
    if (!cardPositions) return null;

    const isEditing = editingEntryId === entry.id;

    return (
      <motion.div
        key={`cards-${entry.id}`}
        className="absolute inset-0 pointer-events-none"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={{ duration: 0.2 }}
      >
        {/* Patient Card */}
        <motion.div
          className={`absolute bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-3 shadow-lg pointer-events-auto ${
            isEditing ? 'ring-1 ring-blue-500' : ''
          }`}
          style={{
            left: cardPositions.patient.x,
            top: cardPositions.patient.y,
            width: 200,
            minHeight: 100
          }}
          variants={cardVariants}
        >
          {/* Simplified connection indicator */}
          <div
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              right: -2,
              bottom: -2
            }}
          />
          
          <div className="flex items-center gap-2 mb-2">
            <User size={14} className="text-blue-400" />
            <h4 className="font-medium text-white text-xs">Patient Narrative</h4>
          </div>
          
          {isEditing ? (
            <textarea
              value={entry.patientNarrative}
              onChange={(e) => updateEntry(entry.id, 'patientNarrative', e.target.value)}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-xs"
              placeholder="Patient narrative..."
              autoFocus
            />
          ) : (
            <p className="text-slate-300 text-xs leading-relaxed">
              {entry.patientNarrative || (
                <span className="text-slate-500 italic">No narrative documented</span>
              )}
            </p>
          )}
        </motion.div>

        {/* Clinical Card */}
        <motion.div
          className={`absolute bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-3 shadow-lg pointer-events-auto ${
            isEditing ? 'ring-1 ring-purple-500' : ''
          }`}
          style={{
            left: cardPositions.clinical.x,
            top: cardPositions.clinical.y,
            width: 200,
            minHeight: 100
          }}
          variants={cardVariants}
        >
          {/* Simplified connection indicator */}
          <div
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: -2,
              top: -2
            }}
          />
          
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-purple-400" />
            <h4 className="font-medium text-white text-xs">Clinical Notes</h4>
          </div>
          
          {isEditing ? (
            <textarea
              value={entry.clinicalNotes}
              onChange={(e) => updateEntry(entry.id, 'clinicalNotes', e.target.value)}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none text-xs"
              placeholder="Clinical insights..."
            />
          ) : (
            <p className="text-slate-300 text-xs leading-relaxed">
              {entry.clinicalNotes || (
                <span className="text-slate-500 italic">No notes documented</span>
              )}
            </p>
          )}
        </motion.div>

        {/* Compact Edit Controls */}
        {isEditing && (
          <motion.div 
            className="absolute pointer-events-auto bg-slate-800/95 border border-slate-600 rounded-lg p-2 shadow-lg z-50"
            style={{
              left: (nodePositions.get(entry.id)?.x || 0) - 50,
              top: (nodePositions.get(entry.id)?.y || 0) + 40
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingEntryId(null);
                }}
                className="px-2 py-1 text-slate-300 hover:text-white border border-slate-600 rounded hover:bg-slate-700 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveEntry(entry.id);
                }}
                disabled={isLoading}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs flex items-center gap-1"
              >
                {isLoading ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                Save
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }, [hoveredEntryId, editingEntryId, getCardPositions, nodePositions, updateEntry, saveEntry, isLoading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className="h-full p-4 relative"
      variants={timelineVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Clock size={16} className="text-cyan-400" />
          Clinical Timeline
          <span className="text-xs text-slate-500 ml-1">Drag • Click to pin</span>
        </h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus size={14} />
          Add Entry
        </button>
      </div>

      {/* Compact Timeline Container */}
      <div 
        ref={timelineRef}
        className="relative bg-slate-900/50 rounded-lg border border-slate-700 mx-auto"
        style={{ width: TIMELINE_WIDTH, height: TIMELINE_HEIGHT }}
      >
        {/* Timeline Path */}
        {entries.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <path
              d={timelinePath}
              stroke="url(#timelineGradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
        )}

        {/* Timeline Nodes */}
        <AnimatePresence>
          {entries.map((entry) => {
            const position = nodePositions.get(entry.id);
            if (!position) return null;

            const isPinned = pinnedNodes.has(entry.id);
            const isHovered = hoveredEntryId === entry.id;
            const isEditing = editingEntryId === entry.id;

            return (
              <React.Fragment key={entry.id}>
                <motion.div
                  className="absolute cursor-move select-none"
                  style={{ 
                    left: position.x - NODE_RADIUS, 
                    top: position.y - NODE_RADIUS,
                    zIndex: isEditing ? 10 : 5
                  }}
                  variants={entry.isNew ? nodeVariants.popIn : nodeVariants}
                  initial={entry.isNew ? undefined : "hidden"}
                  animate="visible"
                  exit="hidden"
                  onMouseDown={(e) => handleDragStart(e, entry.id)}
                  onMouseMove={(e) => handleDrag(e, entry.id)}
                  onMouseUp={(e) => handleDragEnd(e, entry.id)}
                  onMouseEnter={() => setHoveredEntryId(entry.id)}
                  onMouseLeave={() => setHoveredEntryId(null)}
                  onClick={() => {
                    if (!isDraggingRef.current) {
                      setEditingEntryId(isEditing ? null : entry.id);
                    }
                  }}
                  onDoubleClick={() => handleNodeClick(entry.id)}
                >
                  <div
                    className={`relative rounded-full border-3 flex items-center justify-center transition-all ${
                      isEditing
                        ? 'bg-blue-600 border-blue-400 shadow-md shadow-blue-500/50' 
                        : isPinned
                        ? 'bg-purple-600 border-purple-400 shadow-md shadow-purple-500/50'
                        : isHovered
                        ? 'bg-slate-700 border-slate-500 shadow-md'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                    style={{ width: NODE_RADIUS * 2, height: NODE_RADIUS * 2 }}
                  >
                    <Calendar size={12} className={
                      isEditing || isPinned ? 'text-white' : 'text-slate-400'
                    } />
                    
                    {isPinned && (
                      <div className="absolute -top-0.5 -right-0.5">
                        <Pin size={8} className="text-purple-400" />
                      </div>
                    )}
                  </div>

                  {/* Compact Date Label */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-xs text-slate-400 font-medium">
                      {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </motion.div>

                {renderFloatingCards(entry)}
              </React.Fragment>
            );
          })}
        </AnimatePresence>

        {/* Compact Empty State */}
        {entries.length === 0 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <Clock size={32} className="text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-slate-400 mb-1">No Timeline Entries</h4>
              <p className="text-slate-500 text-xs mb-3">Add your first entry to start</p>
              <button
                onClick={addEntry}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs mx-auto"
              >
                <Plus size={12} />
                Add First Entry
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Click outside to close edit */}
      {editingEntryId && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setEditingEntryId(null)}
        />
      )}
    </motion.div>
  );
});

AngularTimeline.displayName = 'AngularTimeline';

export default AngularTimeline;